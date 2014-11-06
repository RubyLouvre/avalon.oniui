/**
 * @cnName 验证框架
 * @enName validation
 * @introduce
 *  <p>基于avalon ms-duplex2.0的强大验证框架，大家可以直接在avalon.duplexHooks添加验证规则，
 *  也可以在配置对象上的validationHooks中添加验证规则。</p>
 *  <p>验证规则如下定义:</p>
 *  ```javascript
 *   alpha_numeric: { //这是名字，不能存在-，因为它是这样使用的ms-duplex-int-alpha_numeric="prop"
 message: '必须为字母或数字',  //这是错误提示，可以使用{{expr}}插值表达式，但这插值功能比较弱，
 //里面只能是某个单词，两边不能有空格
 get: function(value, data, next) {//这里的传参是固定的，next为回调
 next(/^[a-z0-9]+$/i.test(value))//这里是规则
 //如果message有{{expr}}插值表达式，需要用data.data.expr = aaa设置参数，
 //aaa可以通过data.element.getAttribute()得到
 return value //原样返回value
 }
 },
 *  ```
 *  <p>验证规则不惧怕任何形式的异步，只要你决定进行验证时，执行next方法就行。next 需要传入布尔。</p>
 *  ```javascript
 *      async: {
 message : "异步验证" , 
 get : function( value , data, next ){
 setTimeout(function(){
 next(true)
 },3000)
 return value
 }
 },
 *  ```
 * <p> 另一个例子:</p>
 *  ```javascript
 beijing: {
 message : "当前位置必须是在{{city}}" , 
 get : function( value ,data, next ){
 $.ajax({
 url : "http://ws.qunar.com/ips.jcp" , 
 dataType : "jsonp" , 
 jsonpCallback : "callback" , 
 success : function( data, textStatus, jqXHR  ){
 data.data.city = "北京"
 next( data.city == value )
 }
 })
 return value
 }
 }
 *  ```
 *  <p>注意，本组件是基于<code>avalon1.3.7</code>开发，如果是很旧的版本，可以使用avalon.validation.old.js，它一直兼容到avalon1.2.0。</p>
 *  <p>注意，本组件只能绑定在<code>form元素</code>上, &lt;form ms-widget="validation"&gt;&lt;/&gt</p>
 *  <p>验证框架提供了各式各样的回调，满足你最挑剔的需求：</p>
 *  ```javascript
 *  onSuccess, onError, onComplete, onValidateAll, onReset, onResetAll
 *  ```
 * <p>其中，前面四个是一个系列，它们都有1个参数，是一个对象数组，里面一些<code>验证规则对象</code>（如果成功，数组为空）； onReset是在元素获取焦点做重置工作的，如清理类名，
 * 清空value值，onResetAll是用于重置整个表单，它会在组件执行它辖下的所有元素的onReset回调后再执行。</p>
 * <p><b>验证规则对象</b>的结构如下：</p>
 * ```javascript
 * {
 *   element: element, //添加了ms-duplex绑定的元素节点，它应该位于form[ms-widget="validation"]这个元素下
 *   data: {city: "北京"}，
 *   message: '当前位置必须是在{{city}}',
 *   validateRule: "beijing",
 *   getMessage: function(){}//用户调用到方法即可以拿到完整的错误消息——“当前位置必须是在北京”
 * }
 * ```
 */

define(["../promise/avalon.promise"], function(avalon) {
    if (!avalon.duplexHooks) {
        throw new Error("你的版本少于avalon1.3.7，不支持ms-duplex2.0，请使用avalon.validation.old.js")
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
                next(/[^\u4e00-\u9fa5]/.test(value))
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
                if(!data.skipFirstAssign){
                    return data.skipFirstAssign = 1
                }
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
/*
 @other
 avalon.validation自带了许多<code>验证规则</code>，满足你一般的业务需求。
 
 /**
 @links
 [自带验证规则required, init](avalon.at.ex1.html)
 */