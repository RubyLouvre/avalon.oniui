define("mmState", ["../mmPromise/mmPromise", "./mmRouter"], function() {
//重写mmRouter中的route方法     
    avalon.router.route = function(method, path, query, options) {
        path = path.trim()
        var states = this.routingTable[method]
        for (var i = 0, el; el = states[i++]; ) {//el为一个个状态对象，状态对象的callback总是返回一个Promise
            var args = path.match(el.regexp)
            if (args && el.abstract !== true) {//不能是抽象状态
                var newParams = {params: {}}
                avalon.mix(newParams.params, el.params)
                newParams.keys = el.keys
                newParams.params.query = query || {}
                args.shift()
                if (el.keys.length) {
                    this._parseArgs(args, newParams)
                }
                if (el.stateName) {
                    mmState.transitionTo(mmState.currentState, el, newParams.params, options)
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
    var _root, undefine, _controllers = {}, _states = {}
    /*
     *  @interface avalon.router.go 跳转到一个已定义状态上，params对参数对象
     *  @param toName 状态name
     *  @param params 附加参数
     *  @param params.query 在hash后面附加的类似search的参数对
     *  @param options 扩展配置
     *  @param options.reload true强制reload，即便url、参数并未发生变化
     *  @param options.replace true替换history，否则生成一条新的历史记录
    */
    avalon.router.go = function(toName, params, options) {
        var from = mmState.currentState, 
            to = StateModel.is(toName) ? toName : getStateByName(toName), 
            params = params || {}
        params = avalon.mix(true, {}, to.params, params)
        if (to) {
            mmState.transitionTo(from, to, params, options)
        }
    }
    // 事件管理器
    var Event = window.$eventManager = avalon.define("$eventManager", function(vm) {
        vm.$flag = 0;
        vm.uiqKey = function() {
            vm.$flag++
            return "flag" + vm.$flag++
        }
    })
    function removeOld() {
        var nodes = mmState.oldNodes
        while(nodes.length) {
            var i = nodes.length - 1,
                node = nodes[i]
            node.parentNode && node.parentNode.removeChild(node)
            nodes.splice(i, 1)
        }
    }
    Event.$watch("onAbort", removeOld)
    var mmState = window.mmState = {
        prevState: NaN,
        currentState: NaN, // 当前状态，可能还未切换到该状态
        activeState: NaN, // 当前实际处于的状态
        oldNodes: [],
        query: {}, // 从属于currentState
        popOne: function(chain, params, callback) {
            var cur = chain.pop(), me = this
            if(!cur) return callback()
            // 阻止退出
            if(cur.onBeforeExit() === false) return callback(false)
            me.activeState = cur.parentState || _root
            cur._local = null
            cur.done = function(success) {
                cur._pending = false
                cur.done = null
                if(success !== false) {
                    if(me.activeState) return me.popOne(chain, params, callback)
                }
                return callback(success)
            }
            var success = cur.onExit()
            if(!cur._pending && cur.done) cur.done(success)
        },
        pushOne: function(chain, params, callback, _local, toLocals) {
            var cur = chain.shift(), me = this
            // 退出
            if(!cur) {
                return callback()
            }
            cur.syncParams(params)
            // 阻止进入该状态
            if(cur.onBeforeEnter() === false) {
                // 恢复params
                cur.syncParams(cur.oldParams)
                return callback(false)
            }
            _local = inherit(_local)
            toLocals && toLocals.push(_local)
            me.activeState = cur // 更新当前实际处于的状态
            cur.done = function(success) {
                // 防止async处触发已经销毁的done
                if(!cur.done) return
                cur._pending = false
                cur.done = null
                cur.visited = true
                // 退出
                if(success === false) {
                    // 这里斟酌一下 - 去掉
                    // cur.callback.apply(cur, [params, _local])
                    return callback(success)
                }
                var resolved = cur.callback.apply(cur, [params, _local])
                resolved.$then(function(res) {
                    var a = resolved
                    // sync params to oldParams
                    avalon.mix(true, cur.oldParams, cur.params)
                    // 继续状态链
                    me.pushOne(chain, params, callback, _local)
                })
            }
            // 一般在这个回调里准备数据
            var args = []
            avalon.each(cur.keys, function(index, item) {
                var key = item.name
                args.push(cur.params[key])
            })
            cur._onEnter.apply(cur, args)
            if(!cur._pending && cur.done) cur.done()
        },
        transitionTo: function(fromState, toState, toParams, options) {
            var toParams = toParams || toState.params, fromAbort
            // state machine on transition
            if(this.activeState && (this.activeState != this.currentState)) {
                avalon.log("navigating to [" + 
                    this.currentState.stateName + 
                    "] will be stopped, redirect to [" + 
                    toState.stateName + "] now")
                this.activeState.done && this.activeState.done(!"stopped")
                fromState = this.activeState // 更新实际的fromState
                fromAbort = true
            }

            var info = avalon.router.urlFormate(toState.url, toParams, toParams.query),
                me = this,
                options = options || {},
                // 是否强制reload，参照angular，这个时候会触发整个页面重刷
                reload = options.reload,
                over,
                fromChain = fromState && fromState.chain || [],
                toChain = toState.chain,
                i = 0,
                changeType, // 是params变化？query变化？这个东西可以用来配置是否屏蔽视图刷新逻辑
                state = toChain[i],
                _local = _root._local,
                toLocals = []
                if(!reload) {
                    // 找到共有父状态chain，params未变化
                    while(state && state === fromChain[i] && !state.paramsChanged(toParams)) {
                        _local = toLocals[i] = state._local
                        i++
                        state = toChain[i]
                    }
                }
                var exitChain = fromChain.slice(i),// 需要退出的chain
                    enterChain = toChain.slice(i)// 需要进入的chain
                done = function(success, e) {
                    if(over) return
                    over = true
                    me.currentState = me.activeState
                    if(success !== false) {
                        mmState.lastLocal = mmState.currentState._local
                        _root.fire("updateview", me.currentState, changeType)
                        avalon.log("transitionTo " + toState.stateName + " success")
                        callStateFunc("onLoad", me, fromState, toState)
                    } else {
                        return callStateFunc("onError", me, {
                            type: "transition",
                            message: "transitionTo " + toState.stateName + " faild",
                            error: e,
                            fromState:fromState, 
                            toState:toState,
                            params: toParams
                        }, me.currentState)
                    }

                    if(info && avalon.history) avalon.history.updateLocation(info.path + info.query, avalon.mix({}, options, {silent: true}), !fromState && location.hash)
                }
            toState.path = ("/" + info.path).replace(/^[\/]{2,}/g, "/")
            if(!reload && fromState === toState) {
                changeType = toState.paramsChanged(toParams)
                if(!changeType) {
                    // redirect的目的状态 == this.activeState && abort
                    if(toState == this.activeState && fromAbort) return done()
                    // 重复点击直接return
                    return
                }
            }

            mmState.query = avalon.mix({}, toParams.query)

            // onBeforeUnload check
            if(callStateFunc("onBeforeUnload", this, fromState, toState) === false || broadCastBeforeUnload(exitChain, enterChain) === false) {
                return callStateFunc("onAbort", this, fromState, toState)
            }
            if(over === true) {
                return
            }
            avalon.log("begin transitionTo " + toState.stateName + " from " + (fromState && fromState.stateName || "unknown"))
            callStateFunc("onUnload", this, fromState, toState)
            this.currentState = toState
            this.prevState = fromState
            callStateFunc("onBegin", this, fromState, toState)
            this.popOne(exitChain, toParams, function(success) {
                // 中断
                if(success === false) return done(success)
                me.pushOne(enterChain, toParams, done, _local, toLocals)
            })
        }
    }
    function broadCastBeforeUnload(exitChain, enterChain) {
        var lastLocal = mmState.lastLocal
        if(!lastLocal || !enterChain[0]) return
        var end = enterChain[0].stateName, tmp, state
        for(var i in lastLocal) {
            state = lastLocal[i].state
            tmp = state.stateName
            if(end.indexOf(i) == 0 && end != tmp) {
                continue
            }
            if(!lastLocal[i].$ctrl) continue
            if("$onBeforeUnload" in lastLocal[i].$ctrl) {
                if(lastLocal[i].$ctrl.$onBeforeUnload(exitChain[0], enterChain[0]) === false) return false
            }
        }
    }
    //将template,templateUrl,templateProvider等属性从opts对象拷贝到新生成的view对象上的
    function copyTemplateProperty(newObj, oldObj, name) {
        if(name in oldObj) {
            newObj[name] = oldObj[name]
            delete  oldObj[name]
        }
    }

    // 靠谱的解决方法
    avalon.bindingHandlers.view = function(data, vmodels) {
        var currentState = mmState.currentState,
            element = data.element,
            $element = avalon(element),
            viewname = data.value,
            comment = document.createComment("ms-view:" + viewname),
            par = element.parentNode,
            defaultHTML = element.innerHTML,
            statename = $element.data("statename") || "",
            parentState = getStateByName(statename) || _root,
            currentLocal = {},
            oldElement = element,
            tpl = element.outerHTML
        element.removeAttribute("ms-view") // remove right now
        par.insertBefore(comment, element)
        function update(firsttime, currentState, changeType) {
            // node removed, remove callback
            if(!document.contains(comment)) return !"delete from watch"
            var definedParentStateName = $element.data("statename") || "",
                parentState = getStateByName(definedParentStateName) || _root,
                _local
            if (viewname.indexOf("@") < 0) viewname += "@" + parentState.stateName
            _local = mmState.currentState._local && mmState.currentState._local[viewname]
            if(firsttime && !_local || currentLocal === _local) return
            currentLocal = _local
            _currentState = _local && _local.state
            if(_local && _currentState === currentState && _local.ignoreChange && _local.ignoreChange(changeType, viewname)) return
            var _element = compileNode(tpl, element, $element, oldElement, _currentState)
            oldElement = _element
            // fix IE bug...
            avalon.clearHTML(_element)
            _element.innerHTML = _local ? _local.template : defaultHTML
            _element.removeAttribute("ms-view")
            _element.setAttribute("ui-view", data.value)
            avalon.each(getViewNodes(_element), function(i, node) {
                avalon(node).data("statename", _currentState && _currentState.stateName || "")
            })
            // merge上下文vmodels + controller指定的vmodels
            avalon.scan(_element, (_local && _local.vmodels || []).concat(vmodels || []))
            // 触发视图绑定的controller的事件
            if(_local && _local.$ctrl && _local.$ctrl.$onRendered) _local.$ctrl.$onRendered.apply(_element, [_local]) 
        }
        update("firsttime")
        _root.watch("updateview", function(state, changeType) {
            return update.call(this, undefine, state, changeType)
        })
    }
    function compileNode(tpl, tplElement, $tplElement, oldElement, _currentState) {
        if($tplElement.hasClass("oni-mmRouter-slide")) {
            var element = avalon.parseHTML(tpl).childNodes[0]
            avalon(element).addClass("oni-mmRouter-enter")
            avalon(oldElement).removeClass("oni-mmRouter-enter").addClass("oni-mmRouter-exit")
            oldElement.parentNode.insertBefore(element, oldElement.nextSibling)
            mmState.oldNodes.push(oldElement)
            callStateFunc("onViewEnter", _currentState, element, oldElement)
            return element
        }
        return tplElement
    }

    function inherit(parent, extra) {
        return avalon.mix(new (avalon.mix(function() {}, { prototype: parent }))(), extra);
    }

    /*
     * @interface avalon.state 对avalon.router.get 进行重新封装，生成一个状态对象
     * @param stateName 指定当前状态名
     * @param opts 配置
     * @param opts.url  当前状态对应的路径规则，与祖先状态们组成一个完整的匹配规则
     * @param {Function} opts.ignoreChange 当mmState.currentState == this时，更新视图的时候调用该函数，return true mmRouter则不会去重写视图和scan，请确保该视图内用到的数据没有放到avalon vmodel $skipArray内
     * @param opts.controller 如果不写views属性,则默认view为""，为默认的view指定一个控制器，该配置会直接作为avalon.controller的参数生成一个$ctrl对象
     * @param opts.controllerUrl 指定默认view控制器的路径，适用于模块化开发，该情形下默认通过avalon.controller.loader去加载一个符合amd规范，并返回一个avalon.controller定义的对象，传入opts.params作参数
     * @param opts.controllerProvider 指定默认view控制器的提供者，它可以是一个Promise，也可以为一个函数，传入opts.params作参数
     * @param opts.views: 如果不写views属性,则默认view为""，对多个[ms-view]容器进行处理,每个对象应拥有template, templateUrl, templateProvider，可以给每个对象搭配一个controller||controllerUrl||controllerProvider属性
     *     views的结构为
     *<pre>
     *     {
     *        "": {template: "xxx"}
     *        "aaa": {template: "xxx"}
     *        "bbb@": {template: "xxx"}
     *     }
     *</pre>
     *     views的每个键名(keyname)的结构为viewname@statename，
     *         如果名字不存在@，则viewname直接为keyname，statename为opts.stateName
     *         如果名字存在@, viewname为match[0], statename为match[1]
     * @param opts.views.template 指定当前模板，也可以为一个函数，传入opts.params作参数，
     * @param opts.views.templateUrl 指定当前模板的路径，也可以为一个函数，传入opts.params作参数
     * @param opts.views.templateProvider 指定当前模板的提供者，它可以是一个Promise，也可以为一个函数，传入opts.params作参数
     * @param opts.views.ignoreChange 用法同state.ignoreChange，只是针对的粒度更细一些，针对到具体的view
     * @param {Function} opts.onBeforeEnter 切入某个state之前触发，this指向对应的state，如果return false则会中断并退出整个状态机
     * @param {Function} opts.onEnter 进入状态触发，可以返回false，或任意不为true的错误信息或一个promise对象，用法跟视图的$onEnter一致
     * @param {Function} onEnter.params 视图所属的state的参数
     * @param {Function} onEnter.resolve $onEnter return false的时候，进入同步等待，直到手动调用resolve
     * @param {Function} onEnter.reject 数据加载失败，调用
     * @param {Function} opts.onBeforeExit state退出前触发，this指向对应的state，如果return false则会中断并退出整个状态机
     * @param {Function} opts.onExit 退出后触发，this指向对应的state
     * @param opts.ignoreChange.changeType 值为"param"，表示params变化，值为"query"，表示query变化
     * @param opts.ignoreChange.viewname 关联的ms-view name
     * @param opts.abstract  表示它不参与匹配，this指向对应的state
     * @param {private} opts.parentState 父状态对象（框架内部生成）
     */
    avalon.state = function(stateName, opts) {
        var state = StateModel(stateName, opts)
        avalon.router.get(state.url, function(params, _local) {
            var me = this, promises = [], _resovle, _reject, _data = [], _callbacks = []
            state.resolved = getPromise(function(rs, rj) {
                _resovle = rs
                _reject = rj
            })
            avalon.each(state.views, function(name, view) {
                var params = me.params,
                    reason = {
                        type: "view",
                        name: name,
                        params: params,
                        state: state,
                        view: view
                    },
                    promise = fromPromise(view, params, reason)
                promises.push(promise)
                // template不能cache
                promise.then(function(s) {
                    _local[name] = {
                        template: s,
                        name: name,
                        state: state,
                        ignoreChange: view.ignoreChange || me.ignoreChange,
                        params: state.filterParams(params),
                        $ctrl: view.$controller,
                        vmodels: view.$controller && view.$controller.vmodels
                    }
                }, avalon.noop) // 捕获模板报错
                var prom,
                    callback = function($ctrl) {
                        _local[name].vmodels = $ctrl.$vmodels
                        view.$controller = _local[name].$ctrl = $ctrl
                        resolveData()
                    },
                    resolveData = function() {
                        var $onEnter = view.$controller && view.$controller.$onEnter
                        if($onEnter) {
                            var innerProm = getPromise(function(rs, rj) {
                                var reason = {
                                        type: "data",
                                        state: state,
                                        params: params
                                    },
                                    res = $onEnter(params, rs, function(message) {
                                        reason.message = message
                                        rj(reason)
                                    })
                                // if promise
                                if(res && res.then) {
                                    _data.push(res)
                                    res.then(function() {
                                        rs(res)
                                    })
                                // error msg
                                } else if(res && res !== true) {
                                    reason.message = res
                                    rj(reason)
                                } else if(res === undefine) {
                                    rs()
                                }
                                // res === false will pause here
                            })
                            innerProm = innerProm.then(function(cb) {
                                avalon.isFunction(cb) && _callbacks.push(cb)
                            })
                            _data.push(innerProm)
                        }
                    }
                // controller似乎可以缓存着
                if(view.$controller && view.cacheController !== false) return resolveData()
                // 加载controller模块
                if(view.controller) {
                    prom = promise.then(function() {
                        callback(avalon.controller(view.controller))
                    })
                } else if(view.controllerUrl) {
                    prom = getPromise(function(rs, rj) {
                        var url = avalon.isFunction(view.controllerUrl) ? view.controllerUrl(params) : view.controllerUrl
                        url = url instanceof Array ? url : [url]
                        avalon.controller.loader(url, function($ctrl) {
                            promise.then(function() {
                                callback($ctrl)
                                rs()
                            })
                        })
                    })
                } else if(view.controllerProvider) {
                    var res = avalon.isFunction(view.controllerProvider) ? view.controllerProvider(params) : view.controllerProvider
                    prom = getPromise(function(rs, rj) {
                        // if promise
                        if(res && res.then) {
                            _data.push(res)
                            res.then(function(r) {
                                promise.then(function() {
                                    callback(r)
                                    rs()
                                })
                            }, function(e) {
                                reason.message = e
                                rj(reason)
                            })
                        // error msg
                        } else {
                            promise.then(function() {
                                callback(res)
                                rs()
                            })
                        }
                    })
                }
                // is promise
                if(prom && prom.then) {
                    promises.push(prom)
                }
            })
            // 模板和controller就绪
            getPromise(promises).$then(function(values) {
                state._local = _local
                // 数据就绪
                getPromise(_data).$then(function() {
                    avalon.each(_callbacks, function(i, func) {
                        func()
                    })
                    _resovle()
                })
            })
            return state.resolved

        }, state)

        return this
    }

    function isError(e) {
        return e instanceof Error 
    }

    // 将所有的promise error适配到这里来
    function promiseError(e) {
        if(isError(e)) {
            throw e
        } else {
            callStateFunc("onError", mmState, e, e && e.state)
        }
    }

    function getPromise(excutor) {
        var prom = avalon.isFunction(excutor) ? new Promise(excutor) : Promise.all(excutor)
        return prom
    } 
    Promise.prototype.$then = function(onFulfilled, onRejected) {
        var prom = this.then(onFulfilled, onRejected)
        prom["catch"](promiseError)
        return prom
    }
    avalon.state.onViewEntered = function(newNode, oldNode) {
        if(newNode != oldNode) oldNode.parentNode.removeChild(oldNode)
    }
    /*
     *  @interface avalon.state.config 全局配置
     *  @param {Object} config 配置对象
     *  @param {Function} config.onBeforeUnload 开始切前的回调，this指向router对象，第一个参数是fromState，第二个参数是toState，return false可以用来阻止切换进行
     *  @param {Function} config.onAbort onBeforeUnload return false之后，触发的回调，this指向mmState对象，参数同onBeforeUnload
     *  @param {Function} config.onUnload url切换时候触发，this指向mmState对象，参数同onBeforeUnload
     *  @param {Function} config.onBegin  开始切换的回调，this指向mmState对象，参数同onBeforeUnload，如果配置了onBegin，则忽略begin
     *  @param {Function} config.onLoad 切换完成并成功，this指向mmState对象，参数同onBeforeUnload
     *  @param {Function} config.onViewEnter 视图插入动画函数，有一个默认效果
     *  @param {Node} config.onViewEnter.arguments[0] 新视图节点
     *  @param {Node} config.onViewEnter.arguments[1] 旧的节点
     *  @param {Function} config.onError 出错的回调，this指向对应的state，第一个参数是一个object，object.type表示出错的类型，比如view表示加载出错，object.name则对应出错的view name，object.xhr则是当使用默认模板加载器的时候的httpRequest对象，第二个参数是对应的state
    */
    avalon.state.config = function(config) {
        avalon.mix(avalon.state, config || {})
        return avalon
    }
    function callStateFunc(name, state) {
        Event.$fire.apply(Event, arguments)
        return avalon.state[name] ? avalon.state[name].apply(state || mmState.currentState, [].slice.call(arguments, 2)) : 0
    }
    // 状态原型，所有的状态都要继承这个原型
    function StateModel(stateName, options) {
        if(this instanceof StateModel) {
            this.stateName = stateName
            this.formate(options)
        } else {
            var state = _states[stateName] = new StateModel(stateName, options || {})
            return state
        }
    }
    StateModel.is = function(state) {
        return state instanceof StateModel
    }
    StateModel.prototype = {
        formate: function(options) {
            avalon.mix(true, this, options)
            var stateName = this.stateName,
                me = this,
                chain = stateName.split("."),
                len = chain.length - 1
            this.chain = []
            avalon.each(chain, function(key, name) {
                if(key == len) {
                    me.chain.push(me)
                } else {
                    var n = chain.slice(0, key + 1).join("."),
                        state = getStateByName(n)
                    if(!state) throw new Error("必须先定义" + n)
                    me.chain.push(state)
                }
            })
            if (this.url === void 0) {
                this.abstract = true
            }
            var parent = this.chain[len - 1] || _root
            if (parent) {
                this.url = parent.url + (this.url || "")
                this.parentState = parent
            }
            if (!this.views) {
                var view = {}
                "template,templateUrl,templateProvider,controller,controllerUrl,controllerProvider".replace(/\w+/g, function(prop) {
                    copyTemplateProperty(view, me, prop)
                })
                this.views = {
                    "": view
                }
            }
            var views = {}
            avalon.each(this.views, function(name, view) {
                if (name.indexOf("@") < 0) {
                    name += "@" + (parent ? parent.stateName || "" : "")
                }
                views[name] = view
            })
            this.views = views
            this._self = options
            this._pending = false
            this.visited = false
            this.params = inherit(parent && parent.params || {})
            this.oldParams = {}
            this.keys = []

            this.events = {}
        },
        watch: function(eventName, func) {
            var events = this.events[eventName] || []
            this.events[eventName] = events
            events.push(func)
            return func
        },
        fire: function(eventName, state) {
            var events = this.events[eventName] || [], i = 0
            while(events[i]) {
                var res = events[i].apply(this, [].slice.call(arguments, 1))
                if(res === false) {
                    events.splice(i, 1)
                } else {
                    i++
                }
            }
        },
        unwatch: function(eventName, func) {
            var events = this.events[eventName]
            if(!events) return
            var i = 0
            while(events[i]) {
                if(events[i] == func) return events.splice(i, 1)
                i++
            }
        },
        paramsChanged: function(toParams) {
            var changed = false, keys = this.keys, me= this, params = this.params
            avalon.each(keys, function(index, item) {
                var key = item.name
                if(params[key] != toParams[key]) changed = "param"
            })
            // query
            if(!changed && mmState.currentState === this) {
                changed = !objectCompare(toParams.query, mmState.query) && "query"
            }
            return changed
        },
        filterParams: function(toParams) {
            var params = avalon.mix(true, {}, this.params), keys = this.keys
            avalon.each(keys, function(index, item) {
                params[item.name] = toParams[item.name]
            })
            return params
        },
        syncParams: function(toParams) {
            var me = this
            avalon.each(this.keys, function(index, item) {
                var key = item.name
                if(key in toParams) me.params[key] = toParams[key]
            })
        },
        _onEnter: function() {
            this.query = this.getQuery()
            var me = this,
                arg = Array.prototype.slice.call(arguments),
                done = me._async(),
                prom = getPromise(function(rs, rj) {
                    var reason = {
                            type: "data",
                            state: me,
                            params: me.params
                        },
                        _reject = function(message) {
                            reason.message = message
                            done.apply(me, [false])
                            rj(reason)
                        },
                        _resovle = function() {
                            done.apply(me)
                            rs()
                        },
                        res = me.onEnter.apply(me, arg.concat([_resovle, _reject]))
                    // if promise
                    if(res && res.then) {
                        res.then(_resovle)["catch"](promiseError)
                    // error msg
                    } else if(res && res !== true) {
                        _reject(res)
                    } else if(res === undefine) {
                        _resovle()
                    }
                    // res === false will pause here
                })
        },
        /*
         * @interface state.getQuery 获取state的query，等价于state.query
         *<pre>
         *  onEnter: function() {
         *      var query = this.getQuery()
         *      or
         *      this.query
         *  }
         *</pre> 
         */
        getQuery: function() {return mmState.query},
        /*
         * @interface state.getParams 获取state的params，等价于state.params
         *<pre>
         *  onEnter: function() {
         *      var params = this.getParams()
         *      or
         *      this.params
         *  }
         *</pre> 
         */
        getParams: function() {return this.params},
        _async: function() {
            // 没有done回调的时候，防止死球
            if(this.done) this._pending = true
            return this.done || avalon.noop
        },
        onBeforeEnter: avalon.noop, // 切入某个state之前触发
        onEnter: avalon.noop, // 切入触发
        onBeforeExit: avalon.noop, // state退出前触发
        onExit: avalon.noop // 退出后触发
    }

    _root = StateModel("", {
        url: "",
        views: null,
        "abstract": true
    })

    /*
     * @interface avalon.controller 给avalon.state视图对象配置控制器
     * @param name 控制器名字
     * @param {Function} factory 控制器
     * @param {Object} factory.$ctrl 实际生成的控制器对象
     * @param {Function} factory.$onBeforeUnload 该视图被卸载前触发，return false可以阻止视图卸载，并阻止跳转
     * @param {Function} factory.$onEnter 给该视图加载数据，可以返回false，或任意不为true的错误信息或一个promise对象，传递3个参数
     * @param {Function} factory.$onEnter.params 视图所属的state的参数
     * @param {Function} factory.$onEnter.resolve $onEnter return false的时候，进入同步等待，直到手动调用resolve
     * @param {Function} factory.$onEnter.reject 数据加载失败，调用
     * @param {Function} factory.$onRendered 视图元素scan完成之后，调用
     */
    avalon.controller = function() {
        var first = arguments[0],
            second = arguments[1]
        var $ctrl = _controller()
        if(avalon.isFunction(first)) {
            first($ctrl)
        } else if(avalon.isFunction(second)) {
            $ctrl.name = first
            second($ctrl)
        } else if(typeof first == "string" || typeof first == "object") {
            first = first instanceof Array ? first : Array.prototype.slice.call(arguments)
            avalon.each(first, function(index, item) {
                if(typeof item == "string") {
                    first[index] = avalon.vmodels[item]
                }
                item = first[index]
                if("$onRendered" in item) $ctrl.$onRendered = item["$onRendered"]
                if("$onEnter" in  item) $ctrl.$onEnter = item["$onEnter"]
            })
            $ctrl.$vmodels = first
        } else {
            throw new Error("参数错误" + arguments)
        }
        return $ctrl
    }
    /*
     *  @interface avalon.controller.loader avalon.controller异步引入模块的加载器，默认是通过avalon.require加载
     */
    avalon.controller.loader = function(url, callback) {
        // 没有错误回调...
        avalon.require(url, function($ctrl) {
            callback && callback($ctrl)
        })
    }

    function _controller() {
        if(!(this instanceof _controller)) return new _controller
        this.$vmodels = []
    }
    _controller.prototype = {
    }

    function objectCompare(objA, objB) {
        for(var i in objA) {
            if(!(i in objB) || objA[i] !== objB[i]) return false
        }
        for(var i in objB) {
            if(!(i in objA) || objA[i] !== objB[i]) return false
        }
        return true
    }

    //【avalon.state】的辅助函数，确保返回的是函数
    function getFn(object, name) {
        return typeof object[name] === "function" ? object[name] : avalon.noop
    }
    
    function getStateByName(stateName) {
        return _states[stateName]
    }
    function getViewNodes(node) {
        var nodes
        if(node.querySelectorAll) {
            nodes = node.querySelectorAll("[ms-view]")
        } else {
            nodes = Array.prototype.filter.call(node.getElementsByTagName("*"), function(node) {
                return typeof node.getAttribute("ms-view") === "string"
            })
        }
        return nodes
    }
    
    // 【avalon.state】的辅助函数，opts.template的处理函数
    function fromString(template, params, reason) {
        var promise = getPromise(function(resolve, reject) {
            var str = typeof template === "function" ? template(params) : template
            if (typeof str == "string") {
                resolve(str)
            } else {
                reason.message = "template必须对应一个字符串或一个返回字符串的函数"
                reject(reason)
            }
        })
        return promise
    }
    // 【fromUrl】的辅助函数，得到一个XMLHttpRequest对象
    var getXHR = function() {
        return new (window.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP")
    }/*
     *  @interface avalon.state.templateLoader 通过url异步加载模板的函数，默认是通过内置的httpRequest去加载，但是在node-webkit环境是不work的，因此开放了这个配置，用以自定义url模板加载器，会在一个promise实例里调用这个方法去加载模板
     *  @param url 模板地址
     *  @param resolve 加载成功，如果需要缓存模板，请调用<br>
        resolve(avalon.templateCache[url] = templateString)<br>
        否则，请调用<br>
        resolve(templateString)<br>
     *  @param reject 加载失败，请调用reject(reason)
     *  @param reason 挂在失败原因的对象
     */
    avalon.state.templateLoader = function(url, resolve, reject, reason) {
        var xhr = getXHR()
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                var status = xhr.status;
                if (status > 399 && status < 600) {
                    reason.message = "templateUrl对应资源不存在或没有开启 CORS"
                    reason.status = status
                    reason.xhr = xhr
                    reject(reason)
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
    }
    // 【avalon.state】的辅助函数，opts.templateUrl的处理函数
    function fromUrl(url, params, reason) {
        var promise = getPromise(function(resolve, reject) {
            if (typeof url === "function") {
                url = url(params)
            }
            if (typeof url !== "string") {
                reason.message = "templateUrl必须对应一个URL"
                return reject(reason)
            }
            if (avalon.templateCache[url]) {
                return  resolve(avalon.templateCache[url])
            }
            avalon.state.templateLoader(url, resolve, reject, reason)
        })
        return promise
    }
    // 【avalon.state】的辅助函数，opts.templateProvider的处理函数
    function fromProvider(fn, params, reason) {
        var promise = getPromise(function(resolve, reject) {
            if (typeof fn === "function") {
                var ret = fn(params)
                if (ret && ret.then || typeof ret == "string") {
                    resolve(ret)
                } else {
                    reason.message = "templateProvider为函数时应该返回一个Promise或thenable对象或字符串"
                    reject(reason)
                }
            } else if (fn && fn.then) {
                resolve(fn)
            } else {
                reason.message = "templateProvider不为函数时应该对应一个Promise或thenable对象"
                reject(reason)
            }
        })
        return promise
    }
    // 【avalon.state】的辅助函数，将template或templateUrl或templateProvider转换为可用的Promise对象
    function fromPromise(config, params, reason) {
        return config.template ? fromString(config.template, params, reason) :
                config.templateUrl ? fromUrl(config.templateUrl, params, reason) :
                config.templateProvider ? fromProvider(config.templateProvider, params, reason) :
                getPromise(function(resolve, reject) {
                    reason.message = "必须存在template, templateUrl, templateProvider中的一个"
                    reject(reason)
                })
    }
    window._states = _states
})