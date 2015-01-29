define("mmState", ["mmPromise", "mmRouter"], function() {
//重写mmRouter中的route方法     
    avalon.router.route = function(method, path, query) {
        path = path.trim()
        var states = this.routingTable[method]
        var currentState = mmState.currentState
        for (var i = 0, el; el = states[i++]; ) {//el为一个个状态对象，状态对象的callback总是返回一个Promise
            var args = path.match(el.regexp)
            if (args && el.abstract !== true) {//不能是抽象状态
                if (currentState && el.url === currentState.url && el.stateName === currentState.stateName) {
                    currentState = avalon.mix(true, {}, currentState)
                }
                el.query = query || {}
                el.path = path
                el.params = {}
                var keys = el.keys
                args.shift()
                if (keys.length) {
                    this._parseArgs(args, el)
                }
                if (el.stateName) {
                    mmState.transitionTo(currentState, el, args)
                } else {
                    el.callback.apply(el, args)
                }
                return
            }
        }
        if (this.errorback) {
            this.errorback()
        }
    }
    //跳转到一个已定义状态上，params对参数对象
    avalon.router.go = function(toName, params, options) {
        var from = mmState.currentState, to
        var states = this.routingTable.get
        for (var i = 0, el; el = states[i++]; ) {
            if (el.stateName === toName) {
                to = el
                break
            }
        }
        if (to) {
            if(!to.params) {
                to.params = to.parentState ? to.parentState.params || {} : {}
            }
            avalon.mix(true, to.params, params || {})
            var args = to.keys.map(function(el) {
                return to.params [el.name] || ""
            })
            params = to.params
            mmState.transitionTo(from, to, args, function() {
                if(avalon.history && params) {
                    // 更新url
                    avalon.router.navigate(avalon.router.urlFormate(to.url, params), avalon.mix({}, options|| {}, {silent: true}))
                }
            })
        }
    }

    var mmState = {
        prevState: null,
        currentState: null, // 当前状态，可能还未切换到该状态
        activeState: null, // 当前实际处于的状态
        params: {},
        // 状态离开
        popState: function(end, options, callback) {
            callback = callback || avalon.noop
            if(end == this.activeState) return callback()
            this.popOne(end, options, callback)
        },
        popOne: function(end, options, callback) {
            if(end == this.activeState) return callback()
            var currentState = this.activeState, me = this
            // 阻止退出
            if(currentState.onBeforeUnload() === false) return
            currentState.done = function(success) {
                avalon.mix(currentState, {
                    _pending: false,
                    done: null
                })
                if(success !== false) {
                    if(currentState.parentState) me.activeState = currentState.parentState
                    return me.popOne(end, options, callback)
                }
                return callback(success)
            }
            var success = currentState.onAfterUnload()
            if(!currentState._pending && currentState.done) currentState.done(success)
        },
        // 状态进入
        pushState: function(end, options, callback){
            callback = callback || avalon.noop
            var active = this.activeState
            // 切换到目标状态
            if(active == end) return callback()
            var chain = [] // 状态链
            while(end !== active && end){
                chain.push(end);
                end = end.parentState
            }
            // 逐一迭代
            this.pushOne(chain, options, callback)
        },
        pushOne: function(chain, options, callback) {
            var currentState = chain.pop(), me = this
            // 退出
            if(!currentState) return callback()
            // 阻止进入该状态
            if(currentState.onBeforeChange() === false) return
            this.activeState = currentState // 更新当前实际处于的状态
            currentState.done = function(success) {
                avalon.mix(currentState, {
                    _pending: false,
                    done: null,
                    visited: true
                })
                if(success !== false) return me.pushOne(chain, options, callback)
                return callback(success)
            }
            var success = currentState.onChange()
            if(!currentState._pending && currentState.done) currentState.done(success)
        },
        transitionTo: function(fromState, toState, args, callback) {
            mmState.prevState = fromState
            mmState.currentState = toState
            var over
            // 状态机正处于切换过程中
            if(this.activeState != this.currentState) {
                avalon.log("navigating to [" + this.currentState.stateName + "] will be stopped, redirect to [" + toState.stateName + "] now")
                this.activeState.done && this.activeState.done(!"stopped")
            }

            

            // var states = []
            // var t = toState, tmp
            // if (!fromState) {
            //     while (t) {
            //         tmp = t
            //         states.push(t)
            //         t = t.parentState
            //         // 强制共享params，解决父级状态获取不到参数
            //         if(t && tmp.params) t.params = tmp.params
            //     }
            // // 参数变化
            // } else if (fromState === toState) {
            //     states.push(t)
            // } else {
            //     while (t) {
            //         tmp = t
            //         if(t !== fromState) states.push(t)
            //         t = t.parentState
            //         // 强制共享params，解决父级状态获取不到参数
            //         if(t && tmp.params) t.params = tmp.params
            //     }
            // }
            // states.reverse();
            // var out = new Promise(function(resolve) {
            //     resolve()
            // })
            // states.forEach(function(state) {
            //     out = out.then(function() {
            //         return  state.callback.apply(state, args)
            //     })
            // })
        }
    }
    //【avalon.state】的辅助函数，用于收集可用于扫描的vmodels
    function getVModels(opts) {
        var array = []
        function getVModel(opts, array) {
            var ctrl = opts.controller
            if (avalon.vmodels[ctrl]) {
                avalon.Array.ensure(array, avalon.vmodels[ctrl])
            }
            if (opts.parentState) {
                getVModel(opts.parentState, array)
            }
        }
        getVModel(opts, array)
        return array
    }
    //将template,templateUrl,templateProvider,onBeforeLoad,onAfterLoad这五个属性从opts对象拷贝到新生成的view对象上的
    function copyTemplateProperty(newObj, oldObj, name) {
        newObj[name] = oldObj[name]
        delete  oldObj[name]
    }
    /*
     * 对 avalon.router.get 进行重新封装，生成一个状态对象
     * stateName： 指定当前状态名
     * url:  当前状态对应的路径规则，与祖先状态们组成一个完整的匹配规则
     * controller： 指定当前所在的VM的名字（如果是顶级状态对象，必须指定）
     * views: 对多个[ms-view]容器进行处理,
     *     每个对象应拥有template, templateUrl, templateProvider, onBeforeLoad, onAfterLoad属性
     *     template,templateUrl,templateProvider属性必须指定其一,要求返回一个字符串或一个Promise对象
     *     onBeforeLoad, onAfterLoad是可选
     *     如果不写views属性,则默认view为"",这四个属性可以直接写在opts对象上
     *     views的结构为
     *     {
     *        "": {template: "xxx", onBeforeLoad: function(){} }
     *        "aaa": {template: "xxx", onBeforeLoad: function(){} }
     *        "bbb@": {template: "xxx", onBeforeLoad: function(){} }
     *     }
     *     views的每个键名(keyname)的结构为viewname@statename，
     *         如果名字不存在@，则viewname直接为keyname，statename为opts.stateName
     *         如果名字存在@, viewname为match[0], statename为match[1]
     *     
     * template: 指定当前模板，也可以为一个函数，传入opts.params作参数
     * templateUrl: 指定当前模板的路径，也可以为一个函数，传入opts.params作参数
     * templateProvider: 指定当前模板的提供者，它可以是一个Promise，也可以为一个函数，传入opts.params作参数
     * onChange: 当切换为当前状态时调用的回调，this指向状态对象，参数为匹配的参数，
     *           我们可以在此方法 定义此模板用到的VM， 或修改VM的属性
     * onBeforeLoad: 模板还没有插入DOM树执行的回调，this指向[ms-view]元素节点，参数为状态对象
     * onAfterLoad: 模板插入DOM树执行的回调，this指向[ms-view]元素节点，参数为状态对象
     * abstract:  表示它不参与匹配
     * parentState: 父状态对象（框架内部生成）
     */

    avalon.state = function(stateName, opts) {
        var parent = getParent(stateName), state = StateModel(stateName, opts)
        if (state.url === void 0) {
            state.abstract = true
        }
        if (parent) {
            state.url = parent.url + (state.url || "")
            state.parentState = parent
        }
        if (!state.views) {
            var view = {}
            "template,templateUrl,templateProvider,onBeforeLoad,onAfterLoad".replace(/\w+/g, function(prop) {
                copyTemplateProperty(view, state, prop)
            })
            state.views = {
                "": view
            }
        }
        avalon.router.get(state.url, function() {
            var that = this, args = arguments
            var promises = [], nodeList = [], funcList = []
            getFn(state, "onChange").apply(that, args)
            var vmodes = getVModels(state)
            var topCtrlName = vmodes[vmodes.length - 1]
            if (!topCtrlName) {
                avalon.log("topController不存在")
                return
            }
            topCtrlName = topCtrlName.$id
            var prevState = mmState.prevState && (mmState.prevState.stateName +'.')
            var currentState = mmState.currentState
            var defKey = 'viewDefaultInnerHTMLKey'
            var defViewEle = null
            avalon.each(state.views, function(keyname, view) {
                if (keyname.indexOf("@") >= 0) {
                    var match = keyname.split("@")
                    var viewname = match[0]
                    var statename = match[1]
                } else {
                    var viewname = keyname || ""
                    var statename = stateName
                }
                var _stateName = stateName + '.'
                if(!prevState || prevState === _stateName || prevState.indexOf(_stateName) !== 0 || stateName === currentState.stateName) {
                    var nodes = getViews(topCtrlName, statename)
                    var node = getNamedView(nodes, viewname)
                    var warnings = "warning: " + stateName + "状态对象的【" + keyname + "】视图对象" //+ viewname
                    var defViewIndex = -1
                    // 重置view
                    avalon.each(nodes, function(i, _node) {
                        if (_node === node || avalon.contains(node, _node)) return
                        if (defViewEle === _node) defViewIndex = i
                        if (defViewEle && (defViewIndex === -1 || i <= defViewIndex)) return
                        var $node = avalon(_node)
                        var _html = $node.data(defKey)
                        if (_html) {
                            avalon.innerHTML(_node, _html)
                            avalon.scan(_node, vmodes)
                        }
                    })
                    if (node) {
                        if (!viewname) defViewEle = node
                        // 需要记下当前view下的所有子view的默认innerHTML
                        // 以便在恢复到当前view的时候重置回来
                        var _html = avalon(node).data(defKey)
                        _html === null && avalon(node).data(defKey, node.innerHTML)
                        var promise = fromPromise(view, that.params)
                        nodeList.push(node)
                        funcList.push(function() {
                            promise.then(function(s) {
                                avalon.innerHTML(node, s)
                                avalon.scan(node, vmodes)
                            }, function(msg) {
                                avalon.log(warnings + " " + msg)
                            })
                        })
                        promises.push(promise)
                    } else {
                        avalon.log(warnings + "对应的元素节点不存在")
                    }
                }    
            })
            getFn(state, "onBeforeLoad").call(nodeList, that)
            avalon.each(funcList, function(key, func) {
                func()
            })
            
            return Promise.all(promises).then(function(values) {
                getFn(state, "onAfterLoad").call(nodeList, that)
            })

        }, state)

        return this
    }
    // 状态原型，所有的状态都要继承这个原型
    function StateModel(stateName, options) {
        if(this instanceof StateModel) {
            this.stateName = stateName
            this._pending = false
            this.visited = false
            avalon.mix(this, options)
        } else {
            return new StateModel(stateName, options || {})
        }
    }
    StateModel.prototype = {
        async: function() {
            this._pending = true
            return this.done
        },
        onBeforeChange: avalon.noop, // 切入某个state之前触发
        onChange: avalon.noop, // 切入触发
        onBeforeLoad: avalon.noop, // 所有资源开始加载前触发
        onAfterLoad: avalon.noop, // 加载后触发
        onBeforeUnload: avalon.noop, // state退出前触发
        onAfterUnload: avalon.noop // 退出后触发
    }
    //【avalon.state】的辅助函数，确保返回的是函数
    function getFn(object, name) {
        return typeof object[name] === "function" ? object[name] : avalon.noop
    }
    // 【avalon.state】的辅助函数，收集所有要渲染的[ms-view]元素
    function getViews(ctrl, name) {
        var v = avalon.vmodels[ctrl]
        var firstExpr = v && v.$events.expr || "[ms-controller='" + ctrl + "']"
        var otherExpr = []
        name.split(".").forEach(function() {
            otherExpr.push("[ms-view]")
        })
        if (document.querySelectorAll) {
            return document.querySelectorAll(firstExpr + " " + otherExpr.join(" "))
        } else {
            //DIV[avalonctrl="test"] [ms-view] 从右到左查找，先找到所有匹配[ms-view]的元素
            var seeds = Array.prototype.filter.call(document.getElementsByTagName("*"), function(node) {
                return typeof node.getAttribute("ms-view") === "string"
            })
            while (otherExpr.length > 1) {
                otherExpr.pop()
                seeds = matchSelectors(seeds, function(node) {
                    return typeof node.getAttribute("ms-view") === "string"
                })
            }
            //判定这些候先节点是否匹配[avalonctrl="test"]或[ms-controller="test"]
            seeds = matchSelectors(seeds, function(node) {
                return  node.getAttribute("avalonctrl") === ctrl ||
                        node.getAttribute("ms-controller") === ctrl
            })
            return seeds.map(function(el) {
                return el.node
            })
        }
    }
    // 【avalon.state】的辅助函数，从已有集合中寻找匹配[ms-view="viewname"]表达式的元素节点
    function getNamedView(nodes, viewname) {
        for (var i = 0, el; el = nodes[i++]; ) {
            if (el.getAttribute("ms-view") === viewname) {
                return el
            }
        }
    }
    // 【getViews】的辅助函数，从array数组中得到匹配match回调的子集，此为一个节点集合
    function  matchSelectors(array, match) {
        for (var i = 0, n = array.length; i < n; i++) {
            matchSelector(i, array, match)
        }
        return array.filter(function(el) {
            return el
        })
    }
    // 【matchSelectors】的辅助函数，判定array[i]及其祖先是否匹配match回调
    function matchSelector(i, array, match) {
        var elem = array[i]
        if (elem.node) {
            var node = elem.node
            var parent = elem.parent
        } else {
            node = elem
            parent = elem.parentNode
        }
        while (parent && parent.nodeType !== 9) {
            if (match(parent)) {
                return array[i] = {
                    node: node,
                    parent: parent.parentNode
                }
            }
            parent = parent.parentNode
        }
        array[i] = false
    }
    // 【avalon.state】的辅助函数，opts.template的处理函数
    function fromString(template, params) {
        var promise = new Promise(function(resolve, reject) {
            var str = typeof template === "function" ? template(params) : template
            if (typeof str == "string") {
                resolve(str)
            } else {
                reject("template必须对应一个字符串或一个返回字符串的函数")
            }
        })
        return promise
    }
    // 【fromUrl】的辅助函数，得到一个XMLHttpRequest对象
    var getXHR = function() {
        return new (window.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP")
    }
    // 【avalon.state】的辅助函数，opts.templateUrl的处理函数
    function fromUrl(url, params) {
        var promise = new Promise(function(resolve, reject) {
            if (typeof url === "function") {
                url = url(params)
            }
            if (typeof url !== "string") {
                return reject("templateUrl必须对应一个URL")
            }
            if (avalon.templateCache[url]) {
                return  resolve(avalon.templateCache[url])
            }
            var xhr = getXHR()
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    var status = xhr.status;
                    if (status > 399 && status < 600) {
                        reject("templateUrl对应资源不存在或没有开启 CORS")
                    } else {
                        resolve(avalon.templateCache[url] = xhr.responseText)
                    }
                }
            }
            xhr.open("GET", url, true)
            if ("withCredentials" in xhr) {
                xhr.withCredentials = true
            }
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
            xhr.send()
        })
        return promise
    }
    // 【avalon.state】的辅助函数，opts.templateProvider的处理函数
    function fromProvider(fn, params) {
        var promise = new Promise(function(resolve, reject) {
            if (typeof fn === "function") {
                var ret = fn(params)
                if (ret && ret.then) {
                    resolve(ret)
                } else {
                    reject("templateProvider为函数时应该返回一个Promise或thenable对象")
                }
            } else if (fn && fn.then) {
                resolve(fn)
            } else {
                reject("templateProvider不为函数时应该对应一个Promise或thenable对象")
            }
        })
        return promise
    }
    // 【avalon.state】的辅助函数，将template或templateUrl或templateProvider转换为可用的Promise对象
    function fromPromise(config, params) {
        return config.template ? fromString(config.template, params) :
                config.templateUrl ? fromUrl(config.templateUrl, params) :
                config.templateProvider ? fromProvider(config.templateProvider, params) :
                new Promise(function(resolve, reject) {
                    reject("必须存在template, templateUrl, templateProvider中的一个")
                })
    }
    //【avalon.state】的辅助函数，得到目标状态对象对应的父状态对象
    function getParent(stateName) {
        var match = stateName.match(/([-\.\w]+)\./) || ["", ""]
        var parentName = match[1]
        if (parentName) {
            var states = avalon.router.routingTable.get
            for (var i = 0, state; state = states[i++]; ) {
                if (state.stateName === parentName) {
                    return state
                }
            }
            throw new Error("必须先定义[" + parentName + "]")
        }
    }
})