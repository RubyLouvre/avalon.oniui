/*
 * 
 * version 0.9
 * built in 2015.11.19
 */

define(["avalon"], function (avalon) {

    var History = avalon.History = function () {
        this.location = window.location
        this.history = window.history
    }

    History.started = false
//取得当前IE的真实运行环境
    History.IEVersion = (function () {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    })()

    History.defaults = {
        root: "/",
        html5Mode: false,
        hashPrefix: "!",
        iframeID: null, //IE6-7，如果有在页面写死了一个iframe，这样似乎刷新的时候不会丢掉之前的历史
        interval: 50, //IE6-7,使用轮询，这是其时间时隔
        fireAnchor: true, //决定是否将滚动条定位于与hash同ID的元素上
        routeElementJudger: avalon.noop // 判断a元素是否是触发router切换的链接
    }
    var oldIE = window.VBArray && History.IEVersion <= 7
    var supportPushState = !!(window.history.pushState)
    var supportHashChange = !!("onhashchange" in window && (!window.VBArray || !oldIE))


    History.started = false;

    History.prototype = {
        constructor: History,
        atRoot: function () {
            //判定当前地址栏不存在hash与search
            var path = this.location.pathname.replace(/[^\/]$/, '$&/')
            return path === this.root && !this.getSearch()
        },
        // 判定pathname是否匹配我们的root参数
        matchRoot: function () {
            var path = this.decodeFragment(this.location.pathname)
            var root = path.slice(0, this.root.length - 1) + '/'
            return root === this.root;
        },
        // 变经过编辑的东西变回我们可识别的文字
        decodeFragment: function (fragment) {
            return decodeURI(fragment.replace(/%25/g, '%2525'))
        },
        // 取得查询字符串, 注意IE6下search可能包含hash
        getSearch: function () {
            var match = this.location.href.replace(/#.*/, '').match(/\?.+/)
            return match ? match[0] : '';
        },
        // 从location.href中抽取hash,不能直接使用location.hash,因为firefox会对它进行decoded
        getHash: function (window) {
            // IE6直接用location.hash取hash，可能会取少一部分内容
            // 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
            // ie6 => location.hash = #stream/xxxxx
            // 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
            // firefox 会自作多情对hash进行decodeURIComponent
            // 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
            // firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
            // 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
            var path = (window || this).location.href
            return this._getHash(path.slice(path.indexOf("#")))
        },
        _getHash: function (path) {
            if (path.indexOf("#/") === 0) {
                return decodeURI(path.slice(2))
            }
            if (path.indexOf("#!/") === 0) {
                return decodeURI(path.slice(3))
            }
            return ""
        },
        // Get the pathname and search params, without the root.
        getPath: function () {
            var path = this.decodeFragment(
                    this.location.pathname + this.getSearch()
                    ).slice(this.root.length - 1);
            return path.charAt(0) === '/' ? path.slice(1) : path
        },
        // 根据浏览器对路由器事件的支持情况截取hash或path
        getFragment: function (fragment) {
            if (fragment == null) {
                if (this.monitorMode === "popstate") {
                    fragment = this.getPath()
                } else {
                    fragment = this.getHash()
                }
            }
            return  fragment.replace(/^[#\/]|\s+$/g, "")
        },
        /*
         * @interface avalon.history.start 开始监听历史变化
         * @param options 配置参数
         * @param options.hashPrefix hash以什么字符串开头，默认是 "!"，对应实际效果就是"#!"
         * @param options.routeElementJudger 判断a元素是否是触发router切换的链接的函数，return true则触发切换，默认为avalon.noop，history内部有一个判定逻辑，是先判定a元素的href属性是否以hashPrefix开头，如果是则当做router切换元素，因此综合判定规则是 href.indexOf(hashPrefix) == 0 || routeElementJudger(ele, ele.href)，如果routeElementJudger返回true则跳转至href，如果返回的是字符串，则跳转至返回的字符串，如果返回false则返回浏览器默认行为
         * @param options.html5Mode 是否采用html5模式，即不使用hash来记录历史，默认false
         * @param options.fireAnchor 决定是否将滚动条定位于与hash同ID的元素上，默认为true
         * @param options.basepath 根目录，默认为"/"
         * @param options.silent 不触发回调，默认false
         */
        start: function (options) {
            if (History.started)
                throw new Error('avalon.history has already been started')
            options = options || {}
            if (options.basepath) {
                options.root = options.basepath
                delete options.basepath
            }


            History.started = true
            this.options = avalon.mix({root: '/'}, History.defaults, options)

            //IE6不支持maxHeight, IE7支持XMLHttpRequest, IE8支持window.Element，querySelector, 
            //IE9支持window.Node, window.HTMLElement, IE10不支持条件注释
            //确保html5Mode属性存在,并且是一个布尔
            this.html5Mode = !!this.options.html5Mode
            //监听模式
            this.monitorMode = this.html5Mode ? "popstate" : "hashchange"
            if (!supportPushState) {
                if (this.html5Mode) {
                    avalon.log("如果浏览器不支持HTML5 pushState，强制使用hash hack!")
                    this.html5Mode = false
                }
                this.monitorMode = "hashchange"
            }
            if (!supportHashChange) {
                this.monitorMode = "iframepoll"
            }


        
            this.prefix = "#" + this.options.hashPrefix + "/"
            // 将前后出现的//变成/
            this.root = ('/' + this.options.root + '/').replace(/^\/+|\/+$/g, '/')
            this.fragment = this.getFragment()
            var hasHash = this.atRoot()
            if (this.monitorMode === "popstate" && supportPushState && hasHash) {
                this.navigate(this.getHash(), {replace: true})
            }


            var that = this
            function checkUrlChange() {
                if (!History.started) {
                    return false
                }
                var current = that.getFragment()// 取得主窗口的hash
                // 如果用户按下后退按钮,那么iframe中的hash会发生改变,那么我们将使用
                // 它来更新主窗口的hash
                if (current === that.fragment && that.iframe) {
                    current = that.getHash(that.iframe.contentWindow)// 取得iframe的hash
                }
                if (current === that.fragment) {
                    return false
                }
                if (that.iframe) {
                    that.navigate(current)
                }
                that.fireUrlChange()
            }

            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange(IE8,IE9,FF3)
            // 否则的话只能每隔一段时间进行检测了(IE6, IE7)
            switch (this.monitorMode) {
                case "popstate" :
                    this._checkUrlChange = avalon.bind(window, 'popstate', checkUrlChange)
                    break
                case "hashchange":
                    this._checkUrlChange = avalon.bind(window, 'hashchange', checkUrlChange)
                    break
                case "iframepoll":
                    this._intervalID = setInterval(checkUrlChange, this.interval)
                    avalon.ready(function () {
                        var iframe = that.iframe = document.createElement('iframe')
                        iframe.src = 'javascript:0'
                        iframe.style.display = 'none'
                        iframe.tabIndex = -1
                        var body = document.body
                        var iWindow = body.insertBefore(iframe, body.firstChild).contentWindow
                        iWindow.document.open()
                        iWindow.document.close()
                        iWindow.location.hash = that.prefix + that.fragment
                    })
                    break
            }
            if (!this.options.silent) {
                return this.fireUrlChange()
            }
        },
        // 中断URL的监听
        stop: function () {
            switch (this.monitorMode) {
                case "popstate" :
                    avalon.unbind(window, 'popstate', this._checkUrlChange)
                    break
                case "hashchange":
                    avalon.unbind(window, 'hashchange', this._checkUrlChange)
                    break
                case "iframepoll":
                    if (this.iframe) {
                        document.body.removeChild(this.iframe)
                        this.iframe = null
                    }
                    clearInterval(this._intervalID)
                    break
            }
            History.started = false
        },
        // 触发预先绑定的回调
        fireUrlChange: function (fragment) {
//            if (!this.matchRoot()) {
//                return false
//            }
            fragment = this.fragment = this.getFragment(fragment)

            if (avalon.router) {
                avalon.router.setLastPath(fragment)//保存到本地储存或cookie
                avalon.router.navigate(fragment)
            }
            if (this.options.fireAnchor) {
                scrollToAnchorId(fragment.replace(/\?.*/g, ""))
            }
        },
        // 用动触发回调并更新地址栏, options里面 replace, trigger

        navigate: function (fragment, options) {
            if (!History.started)
                return false
            if (!options || options === true) {
                options = {trigger: options}
            }
            // Normalize the fragment.
            fragment = this.getFragment(fragment || '')

            // Don't include a trailing slash on the root.
            var root = this.root;
            if (fragment === '' || fragment.charAt(0) === '?') {
                root = root.slice(0, -1) || '/';
            }
            var url = root + fragment

            // Strip the hash and decode for matching.
            fragment = this.decodeFragment(fragment.replace(/#.*$/, ''));
            if (this.fragment === fragment)
                return
            this.fragment = fragment

            if (this.monitorMode === "popstate") {
                this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
            } else if (!this.options.html5Mode) {
                this._updateHash(this.location, fragment, options.replace);
                if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
                    var iWindow = this.iframe.contentWindow
                    // IE67需要通过iframe创建一个历史记录
                    if (!options.replace) {
                        iWindow.document.open();
                        iWindow.document.close();
                    }
                    this._updateHash(iWindow.location, fragment, options.replace)
                }
            } else {
                return this.location.assign(url)
            }
            if (options.trigger) {
                return this.fireUrlChange(fragment)
            }
        },
        // 更新hash或地址的某一部分
        _updateHash: function (location, fragment, replace) {
            if (replace) {
                var href = location.href.replace(/(javascript:|#).*$/, '');
                location.replace(href + this.prefix + fragment);
            } else {
                location.hash = this.prefix + fragment
            }
        }

    }
    avalon.history = new History

//https://github.com/asual/jquery-address/blob/master/src/jquery.address.js

//劫持页面上所有点击事件，如果事件源来自链接或其内部，
//并且它不会跳出本页，并且以"#/"或"#!/"开头，那么触发updateLocation方法
    avalon.bind(document, "click", function (event) {
        var defaultPrevented = "defaultPrevented" in event ? event['defaultPrevented'] : event.returnValue === false

        if (!History.started || defaultPrevented || event.ctrlKey
                || event.metaKey || event.which === 2)
            return
        var target = event.target
        while (target.nodeName !== "A") {
            target = target.parentNode
            if (!target || target.tagName === "BODY") {
                return
            }
        }

        if (targetIsThisWindow(target.target)) {
            var href = target.getAttribute("href", 2) || target.getAttribute("xlink:href")

            var prefix = avalon.history.prefix
            if (href === null) { // href is null if the attribute is not present
                return
            }
            var hash = href.replace(prefix, "").trim()
            if (!(href.indexOf(prefix) === 0 && hash !== "")) {
                var routeElementJudger = avalon.history.options.routeElementJudger
                hash = routeElementJudger(target, href)
                if (hash === true)
                    hash = href
            }
            if (hash) {
                event.preventDefault()
                avalon.history.navigate(hash, true)
            }
        }
    })

//判定A标签的target属性是否指向自身
//thanks https://github.com/quirkey/sammy/blob/master/lib/sammy.js#L219
    function targetIsThisWindow(targetWindow) {
        if (!targetWindow || targetWindow === window.name || targetWindow === '_self' || (targetWindow === 'top' && window == window.top)) {
            return true
        }
        return false
    }
//得到页面第一个符合条件的A标签
    function getFirstAnchor(list) {
        for (var i = 0, el; el = list[i++]; ) {
            if (el.nodeName === "A") {
                return el
            }
        }
    }

    function scrollToAnchorId(hash, el) {
        if ((el = document.getElementById(hash))) {
            el.scrollIntoView()
        } else if ((el = getFirstAnchor(document.getElementsByName(hash)))) {
            el.scrollIntoView()
        } else {
            window.scrollTo(0, 0)
        }
    }
    return avalon
})
