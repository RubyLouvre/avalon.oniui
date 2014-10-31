define(["avalon"], function(avalon) {

    if (!avalon.duplexHooks) {//如果avalon的版本少于1.3.7，那么重写ms-duplex指令，方便直接使用ms-duplex2.0, 只兼容到1.2x
        (function(DOC, W3C) {
            var oldDuplexBinding = avalon.bindingHandlers.duplex
            var oldInputBinding = oldDuplexBinding.INPUT
            var oldSelectBinding = oldDuplexBinding.SELECT

//1.2的BUG，不小心实现此方法，1.2.1已经去掉
            avalon.fire = function(el, name) {
                if (DOC.createEvent) {
                    var event = DOC.createEvent("Event")
                    event.initEvent(name, true, true)
                    el.dispatchEvent(event)
                }
            }
            var getBindingCallback = function(elem, name, vmodels) {
                var callback = elem.getAttribute(name)
                if (callback) {
                    for (var i = 0, vm; vm = vmodels[i++]; ) {
                        if (vm.hasOwnProperty(callback) && typeof vm[callback] === "function") {
                            return vm[callback]
                        }
                    }
                }
            }

            var duplexBinding = avalon.bindingHandlers.duplex = function(data, vmodels) {
                var elem = data.element,
                        tagName = elem.tagName
                if (typeof duplexBinding[tagName] === "function") {
                    data.changed = getBindingCallback(elem, "data-duplex-changed", vmodels) || function(a) {
                        return a
                    }
                    //由于情况特殊，不再经过parseExprProxy
                    data.handler = avalon.noop
                    avalon.parseExprProxy(data.value, vmodels, data, "duplex")
                    if (data.evaluator && data.args) {
                        var params = []
                        var casting = avalon.oneObject("string,number,boolean,checked")
                        var hasCast
                        data.error = {}
                        data.oldParam = data.param
                        data.param.replace(avalon.rword, function(name) {
                            if ((elem.type === "radio" && data.param === "") || (elem.type === "checkbox" && name === "radio")) {
                                log(elem.type + "控件如果想通过checked属性同步VM,请改用ms-duplex-checked，以后ms-duplex默认是使用value属性同步VM")
                                name = "checked"
                                data.isChecked = true
                                data.msType = "checked"//1.3.6中途添加的
                            }
                            if (name === "bool") {
                                name = "boolean"
                                log("ms-duplex-bool已经更名为ms-duplex-boolean")
                            } else if (name === "text") {
                                name = "string"
                                log("ms-duplex-text已经更名为ms-duplex-string")
                            }
                            if (casting[name]) {
                                hasCast = true
                            }
                            avalon.Array.ensure(params, name)
                        })
                        if (!hasCast) {
                            params.push("string")
                        }
                        data.newParam = data.param = params.join("-")
                        data.bound = function(type, callback) {
                            if (elem.addEventListener) {
                                elem.addEventListener(type, callback, false)
                            } else {
                                elem.attachEvent("on" + type, callback)
                            }
                            var old = data.rollback
                            data.rollback = function() {
                                avalon.unbind(elem, type, callback)
                                old && old()
                            }
                        }
                        pipe(null, data, "init")
                        duplexBinding[elem.tagName](elem, data.evaluator.apply(null, data.args), data)
                    }
                }
            }
            function runOldImplement(element, evaluator, data, oldImplement) {
                data.param = data.oldParam
                oldImplement(element, evaluator, data)
                if (typeof data.rollback === "function") {
                    data.rollback()
                }
                data.param = data.newParam
            }

            duplexBinding.INPUT = function(element, evaluator, data) {
                //当model变化时,它就会改变value的值
                runOldImplement(element, evaluator, data, oldInputBinding)
                var type = element.type,
                        bound = data.bound,
                        $elem = avalon(element),
                        firstTigger = false,
                        composing = false

                function callback(value) {
                    firstTigger = true
                    data.changed.call(this, value, data)
                }
                function compositionStart() {
                    composing = true
                }
                function compositionEnd() {
                    composing = false
                }
                //当value变化时改变model的值
                function updateVModel(event) {
                    if (composing)//处理中文输入法在minlengh下引发的BUG
                        return
                    var val = element.oldValue = element.value //防止递归调用形成死循环
                    var typedVal = pipe(val, data, "get")      //尝式转换为正确的格式

                    if ($elem.data("duplex-observe") !== false) {
                        evaluator(typedVal)
                        callback.call(element, typedVal)
                        if ($elem.data("duplex-focus")) {
                            avalon.nextTick(function() {
                                element.focus()
                            })
                        }
                    }
                }

                data.handler = function() {
                    var val = evaluator()
                    val = pipe(val, data, "set")
                    if (val !== element.value) {
                        element.value = val
                    }
                }

                if (data.isChecked || element.type === "radio") {
                    var IE6 = !window.XMLHttpRequest
                    updateVModel = function() {
                        if ($elem.data("duplex-observe") !== false) {
                            var val = element.value
                            var typedValue = pipe(val, data, "get")
                            evaluator(typedValue)
                            callback.call(element, typedValue)
                        }
                    }
                    data.handler = function() {
                        var val = evaluator()
                        var checked = data.isChecked ? !!val : val + "" === element.value
                        element.oldValue = checked
                        if (IE6) {
                            setTimeout(function() {
                                //IE8 checkbox, radio是使用defaultChecked控制选中状态，
                                //并且要先设置defaultChecked后设置checked
                                //并且必须设置延迟
                                element.defaultChecked = checked
                                element.checked = checked
                            }, 100)
                        } else {
                            element.checked = checked
                        }
                    }
                    bound(IE6 ? "mouseup" : "click", updateVModel)
                } else if (type === "checkbox") {
                    updateVModel = function() {
                        if ($elem.data("duplex-observe") !== false) {
                            var method = element.checked ? "ensure" : "remove"
                            var array = evaluator()
                            if (!Array.isArray(array)) {
                                log("ms-duplex应用于checkbox上要对应一个数组")
                                array = [array]
                            }
                            avalon.Array[method](array, pipe(element.value, data, "get"))
                            callback.call(element, array)
                        }
                    }

                    data.handler = function() {
                        var array = [].concat(evaluator()) //强制转换为数组
                        element.checked = array.indexOf(pipe(element.value, data, "get")) >= 0
                    }
                    bound(W3C ? "change" : "click", updateVModel)

                } else {
                    var event = element.attributes["data-duplex-event"] || element.attributes["data-event"] || {}
                    if (element.attributes["data-event"]) {
                        log("data-event指令已经废弃，请改用data-duplex-event")
                    }
                    event = event.value
                    if (event === "change") {
                        bound("change", updateVModel)
                    } else {
                        if (W3C) { //IE9+, W3C
                            bound("input", updateVModel)
                            bound("compositionstart", compositionStart)
                            bound("compositionend", compositionEnd)
                            //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
                            //http://www.matts411.com/post/internet-explorer-9-oninput/
                            if (DOC.documentMode === 9) {
                                function delay(e) {
                                    setTimeout(function() {
                                        updateVModel(e)
                                    })
                                }
                                bound("paste", delay)
                                bound("cut", delay)
                            }
                        } else {
                            bound("propertychange", function(e) {
                                if (e.properyName === "value") {
                                    updateVModel(e)
                                }
                            })
                        }
                    }
                }
                element.oldValue = element.value
                data.handler()
                launch(function() {
                    if (avalon.contains(DOC.documentElement, element)) {
                        onTree.call(element)
                    } else if (!element.msRetain) {
                        return false
                    }
                })
                //  registerSubscriber(data)
                var timer = setTimeout(function() {
                    if (!firstTigger) {
                        callback.call(element, element.value)
                    }
                    clearTimeout(timer)
                }, 31)
            }

            var TimerID, ribbon = [],
                    launch = avalon.noop
            function W3CFire(el, name, detail) {
                var event = DOC.createEvent("Events")
                event.initEvent(name, true, true)
                if (detail) {
                    event.detail = detail
                }
                el.dispatchEvent(event)
            }

            function onTree() { //disabled状态下改动不触发input事件
                if (!this.disabled && this.oldValue !== this.value) {
                    if (W3C) {
                        W3CFire(this, "input")
                    } else {
                        this.fireEvent("onchange")
                    }
                }
            }
            ///这是avalon1.3.4新增的方法
            var tick134 = function(fn) {
                if (ribbon.push(fn) === 1) {
                    TimerID = setInterval(ticker, 60)
                }
            }

            function ticker() {
                for (var n = ribbon.length - 1; n >= 0; n--) {
                    var el = ribbon[n]
                    if (el() === false) {
                        ribbon.splice(n, 1)
                    }
                }
                if (!ribbon.length) {
                    clearInterval(TimerID)
                }
            }

            function newSetter(newValue) {
                oldSetter.call(this, newValue)
                if (newValue !== this.oldValue) {
                    W3CFire(this, "input")
                }
            }
            try {
                var inputProto = HTMLInputElement.prototype
                Object.getOwnPropertyNames(inputProto)//故意引发IE6-8等浏览器报错
                var oldSetter = Object.getOwnPropertyDescriptor(inputProto, "value").set //屏蔽chrome, safari,opera
                Object.defineProperty(inputProto, "value", {
                    set: newSetter,
                    configurable: true
                })
            } catch (e) {
                launch = tick134
            }
            duplexBinding.SELECT = function(element, evaluator, data) {
                runOldImplement(element, evaluator, data, oldSelectBinding)
                var $elem = avalon(element)
                function updateVModel() {
                    if ($elem.data("duplex-observe") !== false) {
                        var val = $elem.val() //字符串或字符串数组
                        if (Array.isArray(val)) {
                            val = val.map(function(v) {
                                return  pipe(v, data, "get")
                            })
                        } else {
                            val = pipe(val, data, "get")
                        }
                        if (val + "" !== element.oldValue) {
                            evaluator(val)
                        }
                        data.changed.call(element, val, data)
                    }
                }
                data.handler = function() {
                    var val = evaluator()
                    val = val && val.$model || val
                    //必须变成字符串后才能比较
                    if (Array.isArray(val)) {
                        if (!element.multiple) {
                            log("ms-duplex在<select multiple=true>上要求对应一个数组")
                        }
                    } else {
                        if (element.multiple) {
                            log("ms-duplex在<select multiple=false>不能对应一个数组")
                        }
                    }
                    val = Array.isArray(val) ? val.map(String) : val + ""
                    if (val + "" !== element.oldValue) {
                        $elem.val(val)
                        element.oldValue = val + ""
                    }
                }
                data.bound("change", updateVModel)
                var id = setInterval(function() {
                    var currHTML = element.innerHTML
                    if (currHTML === innerHTML) {
                        clearInterval(id)
                        //先等到select里的option元素被扫描后，才根据model设置selected属性  
                        data.handler()
                        data.changed.call(element, evaluator(), data)
                    } else {
                        innerHTML = currHTML
                    }
                }, 20)
            }
            duplexBinding.TEXTAREA = duplexBinding.INPUT

            //==================== avalon.duplexHooks======================

            function fixNull(val) {
                return val == null ? "" : val
            }
            avalon.duplexHooks = {
                checked: {
                    get: function(val, data) {
                        return !data.element.oldValue
                    }
                },
                string: {
                    get: function(val) {//同步到VM
                        return val
                    },
                    set: fixNull
                },
                "boolean": {
                    get: function(val) {
                        return val === "true"
                    },
                    set: fixNull
                },
                number: {
                    get: function(val, data) {
                        delete data.error.number
                        if (isFinite(val)) {
                            return parseFloat(val) || 0
                        } else {
                            data.error.number = true
                            return val
                        }
                    },
                    set: fixNull
                }
            }
            function pipe(val, data, action) {
                data.param.replace(avalon.rword, function(name) {
                    var hook = avalon.duplexHooks[name]
                    if (hook && typeof hook[action] === "function") {
                        val = hook[action](val, data)
                    }
                })
                return val
            }
        })(document, window.dispatchEvent)
    }
    //==========================avalon.validation的专有逻辑========================
    avalon.mix(avalon.duplexHooks, {
        trim: {
            get: function(val, data) {
                return data.element.type !== "password" ? String(val || "").trim() : val
            }
        }
    })

})