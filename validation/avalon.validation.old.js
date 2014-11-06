define(["../promise/avalon.promise"], function(avalon) {
//如果avalon的版本少于1.3.7，那么重写ms-duplex指令，方便直接使用ms-duplex2.0, 只兼容到1.2x
    if (!avalon.duplexHooks) {
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
                        for (var i in avalon.vmodels) {
                            var v = avalon.vmodels[i]
                            v.$fire("init-ms-duplex", data)
                        }
                        var cpipe = data.pipe || (data.pipe = pipe)
                        cpipe.pipe(null, data, "init")
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
                        composing = false

                function callback(value) {
                    data.changed.call(this, value, data)
                }
                function compositionStart() {
                    composing = true
                }
                function compositionEnd() {
                    composing = false
                }
                //当value变化时改变model的值
                function updateVModel(e) {
                    if (composing)//处理中文输入法在minlengh下引发的BUG
                        return
                    var val = element.oldValue = element.value //防止递归调用形成死循环
                    var lastValue = data.pipe(val, data, "get", e)
                    if ($elem.data("duplex-observe") !== false) {
                        evaluator(lastValue)
                        callback.call(element, lastValue)
                        if ($elem.data("duplex-focus")) {
                            avalon.nextTick(function() {
                                element.focus()
                            })
                        }
                    }
                }

                data.handler = function() {
                    var val = evaluator()
                    val = data.pipe(val, data, "set")
                    if (val !== element.value) {
                        element.value = val
                    }
                }

                if (data.isChecked || element.type === "radio") {
                    var IE6 = !window.XMLHttpRequest
                    updateVModel = function(e) {
                        if ($elem.data("duplex-observe") !== false) {
                            var lastValue = data.pipe(element.value, data, "get", e)
                            evaluator(lastValue)
                            callback.call(element, lastValue)
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
                    updateVModel = function(e) {
                        if ($elem.data("duplex-observe") !== false) {
                            var method = element.checked ? "ensure" : "remove"
                            var array = evaluator()
                            if (!Array.isArray(array)) {
                                log("ms-duplex应用于checkbox上要对应一个数组")
                                array = [array]
                            }
                            avalon.Array[method](array, data.pipe(element.value, data, "get",e))
                            callback.call(element, array)
                        }
                    }

                    data.handler = function() {
                        var array = [].concat(evaluator()) //强制转换为数组
                        element.checked = array.indexOf(data.pipe(element.value, data, "get")) >= 0
                    }
                    bound(W3C ? "change" : "click", updateVModel)

                } else {
                    var events = element.getAttribute("data-duplex-event") || element.getAttribute("data-event") || "input"
                    if (element.attributes["data-event"]) {
                        log("data-event指令已经废弃，请改用data-duplex-event")
                    }
                    events.replace(avalon.rword, function(name) {
                        switch (name) {
                            case "input":
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
                                break
                            default:
                                bound(name, updateVModel)
                                break
                        }
                    })
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
                callback.call(element, element.value)

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
                                return  data.pipe(v, data, "get")
                            })
                        } else {
                            val = data.pipe(val, data, "get")
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
                    get: function(val) {
                        return isFinite(val) ? parseFloat(val) || 0 : val
                    },
                    set: fixNull
                }
            }
            function pipe(val, data, action) {
                data.param.replace(/\w+/g, function(name) {
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
            get: function(value, data) {
                if (data.element.type !== "password") {
                    value = String(value || "").trim()
                }
                return value
            }
        },
        required: {
            message: '必须填写',
            get: function(value, data, next) {
                next(value !== "")
                return value
            }
        },
        "int": {
            message: "必须是整数",
            get: function(value, data, next) {
                console.log(/^\-?\d+$/.test(value))
                next(/^\-?\d+$/.test(value))
                return value
            }
        },
        decimal: {
            message: '必须是小数',
            get: function(value, data, next) {
                next(/^\-?\d*\.?\d+$/.test(value))
                return value
            }
        },
        alpha: {
            message: '必须是字母',
            get: function(value, data, next) {
                next(/^[a-z]+$/i.test(value))
                return value
            }
        },
        alpha_numeric: {
            message: '必须为字母或数字',
            get: function(value, data, next) {
                next(/^[a-z0-9]+$/i.test(value))
                return value
            }
        },
        alpha_dash: {
            message: '必须为字母或数字及下划线等特殊字符',
            validate: function(value, data, next) {
                next(/^[a-z0-9_\-]+$/i.test(value))
                return value
            }
        },
        chs_numeric: {
            message: '必须是中文字符或数字及下划线等特殊字符',
            get: function(value, data, next) {
                next(/^[\\u4E00-\\u9FFF0-9_\-]+$/i.test(value))
                return value
            }
        },
        email: {
            message: "邮件地址错误",
            get: function(value, data, next) {
                next(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(value))
                return value
            }
        },
        url: {
            message: "URL格式错误",
            get: function(value, data, next) {
                next(/^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/.test(value))
                return value
            }
        },
        date: {
            message: '必须符合日期格式 YYYY-MM-DD',
            get: function(value, data, next) {
                next(/^\d\d\d\d\-\d\d\-\d\d$/.test(value))
                return value
            }
        },
        passport: {
            message: '护照格式错误或过长',
            get: function(value, data, next) {
                next(/^[a-zA-Z0-9]{0,20}$/i.test(value))
                return value
            }
        },
        minlength: {
            message: '最少输入{{min}}个字',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("minlength"), 10)
                if (!isFinite(a)) {
                    a = parseInt(elem.getAttribute("data-duplex-minlength"), 10)
                }
                var num = data.data.min = a
                next(value.length >= num)
                return value
            }
        },
        maxlength: {
            message: '最多输入{{max}}个字',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("maxlength"), 10)
                if (!isFinite(a)) {
                    a = parseInt(elem.getAttribute("data-duplex-maxlength"), 10)
                }
                var num = data.data.max = a
                next(value.length <= num)
                return value
            }
        },
        gt: {
            message: '必须大于{{max}}',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("max"), 10)
                if (!isFinite(a)) {
                    a = parseInt(elem.getAttribute("data-duplex-gt"), 10)
                }
                var num = data.data.max = a
                next(parseFloat(value) > num)
                return value
            }
        },
        lt: {
            message: '必须小于{{min}}',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("min"), 10)
                if (!isFinite(a)) {
                    a = parseInt(elem.getAttribute("data-duplex-lt"), 10)
                }
                var num = data.data.min = a
                next(parseFloat(value) < num)
                return value
            }
        },
        eq: {
            message: '必须等于{{eq}}',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("data-duplex-eq"), 10)
                var num = data.data.eq = a
                next(parseFloat(value) == num)
                return value
            }
        },
        pattern: {
            message: '必须匹配/{{pattern}}/这样的格式',
            get: function(value, data, next) {
                var elem = data.element
                var h5pattern = elem.getAttribute("pattern")
                var mspattern = elem.getAttribute("data-duplex-pattern")
                var pattern = data.data.pattern = h5pattern || mspattern
                var re = new RegExp('^(?:' + pattern + ')$')
                next(re.test(value))
                return value
            }
        }
    })
//<input type="number" max=x min=y step=z/> <input type="range" max=x min=y step=z/>
//
    var widget = avalon.ui.validation = function(element, data, vmodels) {
        var options = data.validationOptions
        var onSubmitCallback
        var vmodel = avalon.define(data.validationId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["widgetElement", "elements", "validationHooks"]
            vm.widgetElement = element
            vm.elements = []
            /**
             * @interface 为元素绑定submit事件，阻止默认行为
             */
            vm.$init = function() {
                element.setAttribute("novalidate", "novalidate", "validateInSubmit", "validateInBlur");
                avalon.scan(element, [vmodel].concat(vmodels))
                if (vm.validateInSubmit) {
                    onSubmitCallback = avalon.bind(element, "submit", function(e) {
                        e.preventDefault()
                        vm.validateAll(vm.onValidateAll)
                    })
                }
                if (typeof options.onInit === "function") { //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            /**
             * @interface 销毁组件，移除相关回调
             */
            vm.$destory = function() {
                vm.elements = []
                onSubmitCallback && avalon.unbind(element, "submit", onSubmitCallback)
                element.textContent = element.innerHTML = ""
            }
            //重写框架内部的pipe方法
            var rnoinput = /^(radio|select|file|reset|button|submit|checkbox)/
            vm.pipe = function(val, data, action, e) {
                var isValidateAll = e === true
                var inwardHooks = vmodel.validationHooks
                var globalHooks = avalon.duplexHooks
                var promises = []
                var elem = data.element
                if (!data.bindValidateBlur && !rnoinput.test(elem) && String(elem.getAttribute("data-duplex-event")).indexOf("blur") === -1) {
                    data.bindValidateBlur = avalon.bind(elem, "blur", function(e) {
                        vm.pipe(elem.value, data, "get", e)
                    })
                }
                if (!data.bindValidateReset) {
                    data.bindValidateReset = avalon.bind(elem, "focus", function(e) {
                        vm.onReset.call(elem, e, data)
                    })
                }
                data.param.replace(/\w+/g, function(name) {
                    var hook = inwardHooks[name] || globalHooks[name]
                    if (hook && typeof hook[action] === "function") {
                        data.data = {}
                        if (!elem.disabled && hook.message) {
                            var resolve, reject
                            promises.push(new Promise(function(a, b) {
                                resolve = a
                                reject = b
                            }))
                            var next = function(a) {
                                if (a) {
                                    resolve(true)
                                } else {
                                    var reason = {
                                        element: data.element,
                                        data: data.data,
                                        message: hook.message,
                                        validateRule: name,
                                        getMessage: getMessage
                                    }
                                    resolve(reason)
                                }
                            }
                        } else {
                            var next = avalon.noop
                        }
                        val = hook[action](val, data, next)
                    }
                })
                if (promises.length) {//如果promises不为空，说明经过验证拦截器
                    var lastPromise = Promise.all(promises).then(function(array) {
                        var reasons = []
                        for (var i = 0, el; el = array[i++]; ) {
                            if (typeof el === "object") {
                                reasons.push(el)
                            }
                        }
                        if (!isValidateAll) {
                            if (reasons.length) {
                                vm.onError.call(elem, reasons)
                            } else {
                                vm.onSuccess.call(elem, reasons)
                            }
                            vm.onComplete.call(elem, reasons)
                        }
                        return reasons
                    })
                    if (isValidateAll) {
                        return lastPromise
                    }
                }
                return val
            }
            /**
             * @interface 验证当前表单下的所有非disabled元素
             * @param callback {Null|Function} 最后执行的回调，如果用户没传就使用vm.onValidateAll
             */
            vm.validateAll = function(callback) {
                var fn = callback || vm.onValidateAll
                var promise = vm.elements.map(function(el) {
                    return  vm.pipe(avalon(el.element).val(), el, "get", true)
                })

                Promise.all(promise).then(function(array) {
                    var reasons = []
                    for (var i = 0, el; el = array[i++]; ) {
                        reasons = reasons.concat(el)
                    }
                    fn.call(vm.widgetElement, reasons)//这里只放置未通过验证的组件
                })
            }
            /**
             * @interface 重置当前表单元素
             * @param callback {Null|Function} 最后执行的回调，如果用户没传就使用vm.onResetAll
             */
            vm.resetAll = function(callback) {
                vm.elements.forEach(function(el) {
                    try {
                        vm.onReset.call(el.element, {type: "reset"}, el)
                    } catch (e) {
                    }
                })
                var fn = callback || vm.onResetAll
                fn.call(vm)
            }
            //收集下方表单元素的数据
            vm.$watch("init-ms-duplex", function(data) {
                if (typeof data.pipe !== "function" && avalon.contains(element, data.element)) {
                    data.pipe = vm.pipe
                    vm.elements.push(data)
                    return false
                }
            })
        })

        return vmodel
    }
    var rformat = /\\?{([^{}]+)\}/gm
    function getMessage() {
        var data = this.data || {}
        return this.message.replace(rformat, function(_, name) {
            return data[name] || ""
        })
    }
    widget.defaults = {
        validationHooks: {}, //@config {Object} 空对象，用于放置验证规则
        onSuccess: avalon.noop, //@config {Function} 空函数，单个验证成功时触发，this指向被验证元素this指向被验证元素，传参为一个对象数组
        onError: avalon.noop, //@config {Function} 空函数，单个验证失败时触发，this与传参情况同上
        onComplete: avalon.noop, //@config {Function} 空函数，单个验证无论成功与否都触发，this与传参情况同上
        onValidateAll: avalon.noop, //@config {Function} 空函数，整体验证后或调用了validateAll方法后触发
        onReset: avalon.noop, //@config {Function} 空函数，表单元素获取焦点时触发，this指向被验证元素，大家可以在这里清理className、value
        onResetAll: avalon.noop, //@config {Function} 空函数，当用户调用了resetAll后触发，
        validateInBlur: true, //@config {Boolean} true，在blur事件中执行onReset回调
        validateInSubmit: true //@config {Boolean} true，在submit事件中执行onValidateAll回调
    }
//http://bootstrapvalidator.com/
//https://github.com/rinh/jvalidator/blob/master/src/index.js
//http://baike.baidu.com/view/2582.htm?fr=aladdin&qq-pf-to=pcqq.group
})