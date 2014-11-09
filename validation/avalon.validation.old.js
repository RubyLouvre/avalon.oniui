define(["../promise/avalon.promise"], function(avalon) {
//如果avalon的版本少于1.3.7，那么重写ms-duplex指令，方便直接使用ms-duplex2.0, 只兼容到1.2x
//但它不支持pipe方法，换言之，不支持类型转换，只做验证
    if (!avalon.duplexHooks) {
        (function() {
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
                        tagName = elem.tagName, hasCast
                if (typeof duplexBinding[tagName] === "function") {
                    data.changed = getBindingCallback(elem, "data-duplex-changed", vmodels) || noop
                    //由于情况特殊，不再经过parseExprProxy
                    parseExpr(data.value, vmodels, data)
                    if (data.evaluator && data.args) {
                        var params = []
                        var casting = oneObject("string,number,boolean,checked")
                        if (elem.type === "radio" && data.param === "") {
                            data.param = "checked"
                        }
                        data.param.replace(/\w+/g, function(name) {
                            if (/^(checkbox|radio)$/.test(elem.type) && /^(radio|checked)$/.test(name)) {
                                if (name === "radio")
                                    log("ms-duplex-radio已经更名为ms-duplex-checked")
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
                        data.param = params.join("-")
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

                        duplexBinding[elem.tagName](elem, data.evaluator.apply(null, data.args), data)
                    }
                }
            }
        })()
    }
    //==========================avalon.validation的专有逻辑========================
    function idCard(val) {
        if ((/^\d{15}$/).test(val)) {
            return true;
        } else if ((/^\d{17}[0-9xX]$/).test(val)) {
            var vs = "1,0,x,9,8,7,6,5,4,3,2".split(","),
                    ps = "7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2".split(","),
                    ss = val.toLowerCase().split(""),
                    r = 0;
            for (var i = 0; i < 17; i++) {
                r += ps[i] * ss[i];
            }
            return (vs[r % 11] == ss[17]);
        }
    }
    function isCorrectDate(value) {
        if (rdate.test(value)) {
            var date = parseInt(RegExp.$1, 10);
            var month = parseInt(RegExp.$2, 10);
            var year = parseInt(RegExp.$3, 10);
            var xdata = new Date(year, month - 1, date, 12, 0, 0, 0);
            if ((xdata.getUTCFullYear() === year) && (xdata.getUTCMonth() === month - 1) && (xdata.getUTCDate() === date)) {
                return true
            }
        }
        return false
    }
    var rdate = /^\d{4}\-\d{1,2}\-\d{1,2}$/
    //  var remail = /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/
    var remail = /^([A-Z0-9]+[_|\_|\.]?)*[A-Z0-9]+@([A-Z0-9]+[_|\_|\.]?)*[A-Z0-9]+\.[A-Z]{2,3}$/i
    var ripv4 = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i
    var ripv6 = /^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i
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
        chs: {
            message: '必须是中文字符',
            get: function(value, data, next) {
                next(/^[\u4e00-\u9fa5]+$/.test(value))
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
        qq: {
            message: "腾讯QQ号从10000开始",
            get: function(value, data, next) {
                next(/^[1-9]\d{4,10}$/.test(value))
                return value
            }
        },
        id: {
            message: "身份证格式错误",
            get: function(value, data, next) {
                next(idCard(value))
                return value
            }
        },
        ipv4: {
            message: "ip地址不正确",
            get: function(value, data, next) {
                next(ripv4.test(value))
                return value
            }
        },
        ipv6: {
            message: "ip地址不正确",
            get: function(value, data, next) {
                next(ripv6.test(value))
                return value
            }
        },
        email: {
            message: "邮件地址错误",
            get: function(value, data, next) {
                next(remail.test(value))
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
        equal: {
            message: "必须等于{{other}}",
            get: function(value, data, next) {
                var id = data.element.getAttribute("data-duplex-equal") || ""
                var other = avalon(document.getElementById(id)).val() || ""
                data.data.other = other
                next(value === other)
                return value
            }
        },
        date: {
            message: '必须符合日期格式 YYYY-MM-DD',
            get: function(value, data, next) {
                next(isCorrectDate(value))
                return value
            }
        },
        passport: {
            message: '护照格式错误或过长',
            get: function(value, data, next) {
                next(/^[a-zA-Z0-9]{4,20}$/i.test(value))
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
            vm.$skipArray = ["widgetElement", "data", "validationHooks", "validateInKeyup", "validateAllInSubmit", "resetInBlur"]
            vm.widgetElement = element
            vm.data = []
            /**
             * @interface 为元素绑定submit事件，阻止默认行为
             */
            vm.$init = function() {
                element.setAttribute("novalidate", "novalidate");
                avalon.scan(element, [vmodel].concat(vmodels))
                if (vm.validateAllInSubmit) {
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
                vm.data = []
                onSubmitCallback && avalon.unbind(element, "submit", onSubmitCallback)
                element.textContent = element.innerHTML = ""
            }

            /**
             * @interface 验证当前表单下的所有非disabled元素
             * @param callback {Null|Function} 最后执行的回调，如果用户没传就使用vm.onValidateAll
             */

            vm.validateAll = function(callback) {
                var fn = callback || vm.onValidateAll
                var promise = vm.data.map(function(data) {
                    return  vm.validate(data, true)
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
                vm.data.forEach(function(el) {
                    try {
                        vm.onReset.call(el.element, {type: "reset"}, el)
                    } catch (e) {
                    }
                })
                var fn = callback || vm.onResetAll
                fn.call(vm)
            }
            /**
             * @interface 验证单个元素对应的VM中的属性是否符合格式
             * @param data {Object} 绑定对象
             * @isValidateAll {Undefined|Boolean} 是否全部验证,是就禁止onSuccess, onError, onComplete触发
             */
            vm.validate = function(data, isValidateAll) {
                var value = data.valueAccessor()
                var inwardHooks = vmodel.validationHooks
                var globalHooks = avalon.duplexHooks
                var promises = []
                var elem = data.element
                data.validateParam.replace(/\w+/g, function(name) {
                    var hook = inwardHooks[name] || globalHooks[name]
                    if (!elem.disabled) {
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
                                    element: elem,
                                    data: data.data,
                                    message: elem.getAttribute("data-duplex-message") || hook.message,
                                    validateRule: name,
                                    getMessage: getMessage
                                }
                                resolve(reason)
                            }
                        }
                        data.data = {}
                        hook.get(value, data, next)
                    }

                })

                //如果promises不为空，说明经过验证拦截器
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
                return lastPromise

            }
            //收集下方表单元素的数据
            vm.$watch("init-ms-duplex", function(data) {
                var inwardHooks = vmodel.validationHooks
                data.valueAccessor = data.evaluator.apply(null, data.args)
                var globalHooks = avalon.duplexHooks
                if (typeof data.pipe !== "function" && avalon.contains(element, data.element)) {
                    var params = []
                    var validateParams = []
                    data.param.replace(/\w+/g, function(name) {
                        var hook = inwardHooks[name] || globalHooks[name]
                        if (hook && typeof hook.get === "function" && hook.message) {
                            validateParams.push(name)
                        } else {
                            params.push(name)
                        }
                    })
                    data.validate = vm.validate
                    data.param = params.join("-")
                    data.validateParam = validateParams.join("-")
                    if (validateParams.length) {
                        if (vm.validateInKeyup) {
                            data.bound("keyup", function(e) {
                                setTimeout(function() {
                                    vm.validate(data)
                                })
                            })
                        }
                        if (vm.validateInBlur) {
                            data.bound("blur", function(e) {
                                vm.validate(data)
                            })
                        }
                        if (vm.resetInFocus) {
                            data.bound("focus", function(e) {
                                vm.onReset.call(data.element, e, data)
                            })
                        }
                    }
                    vm.data.push(data)
                    return false
                }
            })
        })

        return vmodel
    }
    var rformat = /\\?{{([^{}]+)\}}/gm
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
        validateInBlur: true, //@config {Boolean} true，在blur事件中进行验证,触发onSuccess, onError, onComplete回调
        validateInKeyup: true, //@config {Boolean} true，在keyup事件中进行验证,触发onSuccess, onError, onComplete回调
        validateAllInSubmit: true, //@config {Boolean} true，在submit事件中执行onValidateAll回调
        resetInFocus: true //@config {Boolean} true，在focus事件中执行onReset回调
    }
//http://bootstrapvalidator.com/
//https://github.com/rinh/jvalidator/blob/master/src/index.js
//http://baike.baidu.com/view/2582.htm?fr=aladdin&qq-pf-to=pcqq.group
})