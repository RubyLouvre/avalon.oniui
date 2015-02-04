define("mmState", ["../mmPromise/mmPromise", "mmRouter/mmRouter"], function() {
//重写mmRouter中的route方法     
    avalon.router.route = function(method, path, query) {
        path = path.trim()
        var states = this.routingTable[method]
        var currentState = mmState.currentState
        for (var i = 0, el; el = states[i++]; ) {//el为一个个状态对象，状态对象的callback总是返回一个Promise
            var args = path.match(el.regexp)
            if (args && el.abstract !== true) {//不能是抽象状态
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
    /*
     *  @interface avalon.router.go 跳转到一个已定义状态上，params对参数对象
     *  @param toName 状态name
     *  @param params 附加参数
     *  @param params.query 在hash后面附加的类似search'的参数对
     *  @param options 扩展配置
     *  @param options.reload true强制reload，即便url、参数并未发生变化
     *  @param options.replace true替换history，否则生成一条新的历史记录
     *  @param options.replaceParams true表示完全覆盖params，而不是merge
     *  @param options.replaceQuery true表示完全覆盖query，而不是merge
    */
    avalon.router.go = function(toName, params, options) {
        var from = mmState.currentState, to = getStateByName(toName), replaceParams = options && options.replaceParams, replaceQuery =  options && options.replaceQuery
        if (to) {
            // params is not defined
            if(!to.params) {
                to.params = to.parentState ? to.parentState.params || {} : {}
                to.query = to.params.query || {}
            }
            // query is defined
            if(params && params.query) {
                to.query = avalon.mix({}, replaceQuery ? {} : to.query || {}, params.query)
            }
            avalon.mix(true, replaceParams ? {} : to.params, params || {})
            var args = to.keys.map(function(el) {
                return to.params [el.name] || ""
            })
            mmState.transitionTo(from, to, args, options)
        }
    }
    var undefine = void 0
    var mmState = window.mmState = {
        prevState: NaN,
        currentState: NaN, // 当前状态，可能还未切换到该状态
        activeState: NaN, // 当前实际处于的状态
        params: {},
        _oldParams: {},
        // params changed
        isParamsChanged: function(p, op, query) {
            var p = p == undefine ? this.params : p,
                op = op == undefine ? this._oldParams : op
            if(!query && this.isParamsChanged(p.query || {}, op.query || {}, "query")) return true
            for(var i in p) {
                if(i == "query") {
                    if(!op[i]) return true
                    continue
                }
                if(!op[i] || op[i] != p[i]) return true
            }
            for(var i in op) {
                if(i == "query") {
                    if(!p[i]) return true
                    continue
                }
                if(!p[i] || op[i] != p[i]) return true
            }
            return false
        },
        // 状态离开
        popState: function(end, args, callback) {
            callback = callback || avalon.noop
            if(!this.activeState || end === this.activeState) return callback()
            this.popOne(end, args, callback)
        },
        popOne: function(end, args, callback) {
            var cur = this.activeState, me = this
            if(end === this.activeState || !cur) return callback()
            // 阻止退出
            if(cur.onBeforeUnload() === false) return callback(false)
            // 如果没有父状态了，说明已经退出到最上层，需要退出，不再继续迭代
            me.activeState = cur.parentState || NaN
            cur.done = function(success) {
                avalon.mix(cur, {
                    _pending: false,
                    done: null
                })
                if(success !== false) {
                    if(me.activeState) return me.popOne(end, args, callback)
                }
                return callback(success)
            }
            var success = cur.onAfterUnload()
            if(!cur._pending && cur.done) cur.done(success)
        },
        // 状态进入
        pushState: function(end, args, callback){
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
            this.pushOne(chain, args, callback)
        },
        pushOne: function(chain, args, callback) {
            var cur = chain.pop(), me = this
            // 退出
            if(!cur) return callback()
            // 阻止进入该状态
            if(cur.onBeforeChange() === false) return callback(false)
            if(cur.onBeforeEnter() === false) return callback(false)
            me.activeState = cur // 更新当前实际处于的状态
            cur.done = function(success) {
                // 防止async处触发已经销毁的done
                if(!cur.done) return
                avalon.mix(cur, {
                    _pending: false,
                    done: null,
                    visited: true
                })
                // 退出
                if(success === false) {
                    cur.callback.apply(cur, args)
                    return callback(success)
                }
                new Promise(function(resolve) {
                    resolve()
                }).then(function() {
                    // view的load，切换以及scan
                    return cur.callback.apply(cur, args)
                }).done(function() {
                    // 继续状态链
                    me.pushOne(chain, args, callback)
                })
            }
            cur.params = me.params
            // 一般在这个回调里准备数据
            cur.onChange.apply(cur, args)
            cur.onEnter.apply(cur, args)
            if(!cur._pending && cur.done) cur.done()
        },
        // 向上更新参数
        _update: function(state, args) {
            if(!state) return
            var tmp
            while(state) {
                // 共享query & params
                if(tmp) {
                    state.params = tmp.params
                    state.query = tmp.params.query || {}
                }
                state.onUpdate.apply(state, args)
                state.onChange.apply(state, args)
                tmp = state
                state = state.parentState
            }
        },
        transitionTo: function(fromState, toState, args, options) {
            // 状态机正处于切换过程中
            if(this.activeState && this.activeState != this.currentState) {
                avalon.log("navigating to [" + this.currentState.stateName + "] will be stopped, redirect to [" + toState.stateName + "] now")
                this.activeState.done && this.activeState.done(!"stopped")
                fromState = this.activeState // 更新实际的fromState
            }
            toState.params.query = toState.params.query || toState.query || {}
            this.params = avalon.mix(true, {}, toState.params)

            var me = this,
                // 是否强制reload或者params发生变化
                reload = options && options.reload || this.isParamsChanged(),
                over,
                commonParent = findCommonBranch(fromState && fromState.stateName || "", toState.stateName || ""),
                done = function(success) {
                    over = true
                    me.currentState = me.activeState
                    if(success !== false) {
                        avalon.log("transitionTo " + toState.stateName + " success")
                        callStateFunc("onload")
                        // update hash
                        if(avalon.history) {
                            // 更新url
                            avalon.history.updateLocation(avalon.router.urlFormate(toState.url, toState.params, toState.query), avalon.mix({}, options|| {}, {silent: true}))
                        }
                    }
                }
            // 做拷贝，防止引用
            this._oldParams = avalon.mix(true, {}, this.params)
            if(fromState !== toState) {
                avalon.log("begin transitionTo " + toState.stateName + " from " + (fromState && fromState.stateName || "unknown"))
                if(over === true) {
                    return
                }
                this.currentState = toState
                this.prevState = fromState
                this.popState(commonParent, args, function(success) {
                    reload && me._update(commonParent, args)
                    // 中断
                    if(success === false) return done(!"stop poping [" + (commonParent && commonParent.stateName || "unknown"))
                    fromState && callStateFunc("unload", fromState)
                    me.pushState(toState, args, done)
                })
            // 仅仅是参数发生了变化
            } else {
                if(!reload) return
                // 这里也抛出一个unload事件，如果参数发生变化
                fromState && callStateFunc("unload", fromState)
                me._update(commonParent, args)
                // just do update
                toState.onUpdate.apply(toState, args)
                toState.onChange.apply(toState, args)
                done()
            }
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
     * @interface avalon.state 对avalon.router.get 进行重新封装，生成一个状态对象
     * @param stateName： 指定当前状态名
     * @param opts 配置
     * @param opts.url:  当前状态对应的路径规则，与祖先状态们组成一个完整的匹配规则
     * @param opts.controller： 指定当前所在的VM的名字（如果是顶级状态对象，必须指定）
     * @param opts.views: 如果不写views属性,则默认view为""，对多个[ms-view]容器进行处理,每个对象应拥有template, templateUrl, templateProvider
     * @param opts.views.template 指定当前模板，也可以为一个函数，传入opts.params作参数
     * @param opts.views.templateUrl 指定当前模板的路径，也可以为一个函数，传入opts.params作参数
     * @param opts.views.templateProvider 指定当前模板的提供者，它可以是一个Promise，也可以为一个函数，传入opts.params作参数
     *     views的结构为
     *<pre>
     *     {
     *        "": {template: "xxx", onBeforeLoad: function(){} }
     *        "aaa": {template: "xxx", onBeforeLoad: function(){} }
     *        "bbb@": {template: "xxx", onBeforeLoad: function(){} }
     *     }
     *</pre>
     *     views的每个键名(keyname)的结构为viewname@statename，
     *         如果名字不存在@，则viewname直接为keyname，statename为opts.stateName
     *         如果名字存在@, viewname为match[0], statename为match[1]
     * @param opts.onBeforeLoad 模板还没有插入DOM树执行的回调，this指向[ms-view]元素节点集合，参数为状态对象
     * @param opts.onAfterLoad 模板插入DOM树执行的回调，this指向[ms-view]元素节点，参数为状态对象
     * @param opts.onBeforeChange 切入某个state之前触发，this指向对应的state，如果return false则会中断并退出整个状态机
     * @param opts.onChange 当切换为当前状态时调用的回调，this指向状态对象，参数为匹配的参数， 我们可以在此方法 定义此模板用到的VM， 或修改VM的属性
     * @param opts.onBeforeEnter切入某个state之前触发，this指向对应的state，如果return false则会中断并退出整个状态机
     * @param opts.onEnter 进入状态，this指向当前状态，为了保持接口不变，也会出发onChange，建议使用onEnter和onUpdate替换onChange
     * @param opts.onUpdate 当状态未切换，只是参数发生变化的时候触发，this指向当前状态，为了保持接口不变，onUpdate触发时，也会触发onChange
     * @param opts.onBeforeUnload state退出前触发，this指向对应的state，如果return false则会中断并退出整个状态机
     * @param opts.onAfterUnload 退出后触发，this指向对应的state
     * @param opts.abstract  表示它不参与匹配，this指向对应的state
     * @param {private} opts.parentState 父状态对象（框架内部生成）
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
            var vmodes = getVModels(state)
            var topCtrlName = vmodes[vmodes.length - 1]
            if (!topCtrlName) {
                avalon.log("topController不存在")
                return
            }
            topCtrlName = topCtrlName.$id
            var prevState = mmState.prevState && (mmState.prevState.stateName +".")
            var currentState = mmState.currentState
            var defKey = "viewDefaultInnerHTMLKey"
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
                var _stateName = stateName + "."
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
    /*
     *  @interface avalon.state.config 全局配置
     *  @param config 配置对象
     *  @param config.unload url切换时候触发，返回值不会影响切换进程，this指向切换前的当前状态
     *  @param config.onload 切换完成并成功，this指向切换后的当前状态
    */
    avalon.state.config = function(config) {
        avalon.mix(avalon.state, config || {})
    }
    function callStateFunc(name, state) {
        avalon.state[name] && avalon.state[name].call(state || mmState.currentState)
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
        /*
         * @interface state.async 表示当前的状态是异步，中断状态chain的继续执行，返回一个done函数，通过done(false)终止状态链的执行，任意其他非false参数，将继续
         *<pre>
         *  onChange: function() {
         *      var done = this.async()
         *      setTimeout(done, 4000)
         *  }
         *</pre> 
        */
        async: function() {
            this._pending = true
            return this.done
        },
        onBeforeChange: avalon.noop, // 切入某个state之前触发
        onChange: avalon.noop, // 切入触发
        onBeforeEnter: avalon.noop, // 切入前触发 
        onEnter: avalon.noop, // 切入触发
        onUpdate: avalon.noop, // 状态未切换，只是params发生变化时候触发
        onBeforeLoad: avalon.noop, // 所有资源开始加载前触发
        onAfterLoad: avalon.noop, // 加载后触发
        onBeforeUnload: avalon.noop, // state退出前触发
        onAfterUnload: avalon.noop // 退出后触发
    }
    //【avalon.state】的辅助函数，确保返回的是函数
    function getFn(object, name) {
        return typeof object[name] === "function" ? object[name] : avalon.noop
    }
    // 找共同的父状态，注意但a是b孩子或者父亲的时候，是需要取parent.parent
    function findCommonBranch(a, b) {
        var partsA = a.split("."),
            partsB = b.split("."),
            i = 0,
            lenA = partsA.length
        for(; i < lenA; i++) {
            if(partsA[i] == partsB[i]) {
                continue
            }
            break
        }
        // 存在父子关系
        if(i == lenA || i == partsB.length) {
            return getStateByName(i > 1 ? partsA.slice(0, i - 1).join(".") : NaN)
        }
        return getStateByName(partsA.slice(0, i).join("."))
    }
    function getStateByName(stateName) {
        var states = avalon.router.routingTable.get,
            state = NaN
        for (var i = 0, el; el = states[i++]; ) {
            if (el.stateName === stateName) {
                state = el
                break
            }
        }
        return state
    }
    // 【avalon.state】的辅助函数，收集所有要渲染的[ms-view]元素
    function getViews(ctrl, name) {
        var v = avalon.vmodels[ctrl]
        var firstExpr = v && v.$events.expr || "[ms-controller=\"" + ctrl + "\"]"
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