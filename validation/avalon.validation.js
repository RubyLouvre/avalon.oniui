define(["../promise/avalon.promise"], function(avalon) {

    if (!avalon.duplexHooks) {
        throw new Error("你的版本少于avalon1.3.7，不支持ms-duplex2.0，请使用avalon.validation.old.js")
    }
    //==========================avalon.validation的专有逻辑========================

    avalon.mix(avalon.duplexHooks, {
        trim: {
            get: function(val, data) {
                if (data.element.type !== "password") {
                    val = String(val || "").trim()
                }
                return val
            }
        },
        required: {
            message: '必须填写',
            get: function(val, data, next) {
                next(val !== "")
                return val
            }
        },
        minlength: {
            message: '最少输入%argu个字',
            get: function(val, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("minlength"), 10)
                var b = parseInt(elem.getAttribute("data-duplex-minlength"), 10)
                var num = a || b
                next(val.length >= num)
                return val
            }
        },
        maxlength: {
            message: '最多输入%argu个字',
            get: function(val, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("maxlength"), 10)
                var b = parseInt(elem.getAttribute("data-duplex-maxlength"), 10)
                var num = a || b
                next(val.length <= num)
                return val
            }
        },
        "int": {
            message: "必须是整数",
            get: function(val, data, next) {
                next(/^\-?\d+$/.test(val))
                return val
            }
        },
        email: {
            message: "邮件地址错误",
            get: function(val, data, next) {
                next(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(val))
                return val
            }
        },
        url: {
            message: "URL格式错误",
            get: function(val, data, next) {
                next(/^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/.test(val))
                return val
            }
        },
        date: {
            message: '必须符合日期格式 YYYY-MM-DD',
            get: function(val, data, next) {
                next(/^\d\d\d\d\-\d\d\-\d\d$/.test(val))
                return val
            }
        },
        passport: {
            message: '护照格式错误或过长',
            get: function(val, data, next) {
                next(/^[a-zA-Z0-9]{0,20}$/i.test(val))
                return val
            }
        },
        pattern: {
            get: function(val, data, next) {
                var elem = data.element
                var h5pattern = elem.getAttribute("pattern")
                var mspattern = elem.getAttribute("data-duplex-pattern")
                var pattern = h5pattern || mspattern
                var re = new RegExp('^(?:' + pattern + ')$')
                next(re.test(val))
                return val
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
            vm.$init = function() {
                element.setAttribute("novalidate", "novalidate");
                avalon.scan(element, [vmodel].concat(vmodels))
                onSubmitCallback = avalon.bind(element, "submit", function(e) {
                    e.preventDefault()
                    vm.validateAll(vm.onValidateAll)
                })
                if (typeof options.onInit === "function") { //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$destory = function() {
                vm.elements = []
                avalon.unbind(element, "submit", onSubmitCallback)
                element.textContent = element.innerHTML = ""
            }
            //重写框架内部的pipe方法
            vm.pipe = function(val, data, action, inSubmit) {
                var inwardHooks = vmodel.validationHooks
                var globalHooks = avalon.duplexHooks
                var promises = []
                var elem = data.element
                data.param.replace(/\w+/g, function(name) {
                    var hook = inwardHooks[name] || globalHooks[name]
                    if (hook && typeof hook[action] === "function") {
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
                                        element: element,
                                        message: hook.message,
                                        validateRule: name
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
                        if (!inSubmit) {
                            var reasons = []
                            for (var i = 0, el; el = array[i++]; ) {
                                if (typeof el === "object") {
                                    reasons.push(el)
                                }
                            }
                            if (reasons.length) {
                                vm.onError(false, reasons)
                            } else {
                                vm.onSuccess(true, reasons)
                            }
                            vm.onComplete(true)
                        }
                        return reasons
                    })
                    if (inSubmit) {
                        return lastPromise
                    }
                }
                return val
            }
            vm.validateAll = function(callback) {
                var promise = vm.elements.map(function(el) {
                    return  vm.pipe(avalon(el).val(), el, "get", true)
                })
                Promise.all(promise).then(function(array) {
                    var reasons = []
                    for (var i = 0, el; el = array[i++]; ) {
                        reasons = reasons.concat(array)
                    }
                    callback(!reasons.length, reasons)//这里只放置未通过验证的组件
                })
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
    widget.defaults = {
        validationHooks: {},
        onSuccess: function() {
        },
        onError: function() {
        },
        onComplete: function() {
        },
        onValidateAll: function() {
        }
    }
//http://bootstrapvalidator.com/
//https://github.com/rinh/jvalidator/blob/master/src/index.js
})