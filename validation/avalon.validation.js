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
 *  <p>在validationHooks中自定验证规则，每个都必须写<b style="color:red">message</b>
 *  (<span style="color:lightgreen">message不能为空字符串</span>)与<b style="color:red">get</b>方法。</p>
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
 * <p>如果用户指定了<code>norequired</code>验证规则，如果input为空, 那么就会跳过之后的所有验证; 在定义拦截器时,务必将它放在最前面,
 * 如ms-duplex-norequired-int-gt='xxx'
 * </p>
 */

define(["avalon", "../mmPromise/mmPromise"], function(avalon) {
    if (!avalon.duplexHooks) {
        throw new Error("你的版本少于avalon1.3.7，不支持ms-duplex2.0，请使用avalon.validation.old.js")
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
    // isCorrectDate("2015-2-21") true
    // isCorrectDate("2015-2-31") false

    function isCorrectDate(value) {
        if (typeof value === "string" && value) { //是字符串但不能是空字符
            var arr = value.split("-") //可以被-切成3份，并且第1个是4个字符
            if (arr.length === 3 && arr[0].length === 4) {
                var year = ~~arr[0] //全部转换为非负整数
                var month = ~~arr[1] - 1
                var date = ~~arr[2]
                var d = new Date(year, month, date)
                return d.getFullYear() === year && d.getMonth() === month && d.getDate() === date
            }
        }
        return false
    }

    //  var remail = /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/
    var remail = /^([A-Z0-9]+[_|\_|\.]?)*[A-Z0-9]+@([A-Z0-9]+[_|\_|\.]?)*[A-Z0-9]+\.[A-Z]{2,3}$/i
    var ripv4 = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i
    var ripv6 = /^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i
    //规则取自淘宝注册登录模块
    var phoneOne = {
        //中国移动
        cm: /^(?:0?1)((?:3[56789]|5[0124789]|8[278])\d|34[0-8]|47\d)\d{7}$/,
        //中国联通
        cu: /^(?:0?1)(?:3[012]|4[5]|5[356]|8[356]\d|349)\d{7}$/,
        //中国电信
        ce: /^(?:0?1)(?:33|53|8[079])\d{8}$/,
        //中国大陆
        cn: /^(?:0?1)[3458]\d{9}$/
        //中国香港
        //   hk: /^(?:0?[1569])(?:\d{7}|\d{8}|\d{12})$/,
        //澳门
        // macao: /^6\d{7}$/,
        //台湾
        //  tw: /^(?:0?[679])(?:\d{7}|\d{8}|\d{10})$//*,
        //韩国
        //  kr:/^(?:0?[17])(?:\d{9}|\d{8})$/,
        //日本
        // jp:/^(?:0?[789])(?:\d{9}|\d{8})$/*/
    }
    /*
     * http://login.sdo.com/sdo/PRes/4in1_2/js/login.js
     * function isPhone(val){
     var gvPhoneRegExpress=new Array();
     gvPhoneRegExpress.push(/^14[57]\d{8}$/);
     gvPhoneRegExpress.push(/^15[012356789]\d{8}$/);
     gvPhoneRegExpress.push(/^13[0-9]\d{8}$/);
     gvPhoneRegExpress.push(/^18[012456789]\d{8}$/);
     var lvCellphoneIsOk=false;
     for (var i=0;i<gvPhoneRegExpress.length;i++){
     if(gvPhoneRegExpress[i].test(val)){
     lvCellphoneIsOk=true;
     break;
     }
     }
     return lvCellphoneIsOk;
     }
     其他手机号码正则
     /^(13\d\d|15[012356789]\d|18[012356789]\d|14[57]\d|17(0[059]|[78]\d))\d{7}$/
     /^(?:(?:13|18|15)[0-9]{9}|(?:147|170|176|177|178|199|196)[0-9]{8})$/; 
     
     */

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
        norequired: {
            message: '可以不写',
            get: function(value, data, next) {
                next(true)
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
        phone: {
            message: "手机号码不合法",
            get: function(value, data, next) {
                var ok = false
                for (var i in phoneOne) {
                    if (phoneOne[i].test(value)) {
                        ok = true;
                        break
                    }
                }
                next(ok)
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
        repeat: {
            message: "密码输入不一致",
            get: function(value, data, next) {
                var id = data.element.getAttribute("data-duplex-repeat") || ""
                var other = avalon(document.getElementById(id)).val() || ""
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
        //contain
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
        contains: {
            message: "必须包含{{array}}中的一个",
            get: function(val, data, next) {
                var vmValue = [].concat(val).map(String)
                var domValue = (data.element.getAttribute("data-duplex-contains") || "").split(",")
                data.data.array = domValue
                var has = false
                for (var i = 0, n = vmValue.length; i < n; i++) {
                    var v = vmValue[i]
                    if (domValue.indexOf(v) >= 0) {
                        has = true
                        break
                    }
                }
                next(has)
                return val
            }
        },
        contain: {
            message: "必须包含{{array}}",
            get: function(val, data, next) {
                var vmValue = [].concat(val).map(String)
                var domValue = (data.element.getAttribute("data-duplex-contain") || "").split(",")
                data.data.array = domValue.join('与')
                if (!vmValue.length) {
                    var has = false
                } else {
                    has = true
                    for (var i = 0, n = domValue.length; i < n; i++) {
                        var v = domValue[i]
                        if (vmValue.indexOf(v) === -1) {
                            has = false
                            break
                        }
                    }
                }
                next(has)
                return val
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

        function fixEvent(event) {
            if (event.target) {
                return event
            }
            var ret = {}
            for (var i in event) {
                ret[i] = event[i]
            }
            var target = ret.target = event.srcElement
            if (event.type.indexOf("key") === 0) {
                ret.which = event.charCode != null ? event.charCode : event.keyCode
            } else if (/mouse|click/.test(event.type)) {
                var doc = target.ownerDocument || document
                var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement
                ret.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
                ret.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
                ret.wheelDeltaY = ret.wheelDelta
                ret.wheelDeltaX = 0
            }
            ret.timeStamp = new Date - 0
            ret.originalEvent = event
            ret.preventDefault = function() { //阻止默认行为
                event.returnValue = false
            }
            ret.stopPropagation = function() { //阻止事件在DOM树中的传播
                event.cancelBubble = true
            }
            return ret
        }
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
             * @interface 验证当前元素下的所有非disabled元素
             * @param callback {Null|Function} 最后执行的回调，如果用户没传就使用vm.onValidateAll
             */

            vm.validateAll = function(callback) {
                var fn = typeof callback === "function" ? callback : vm.onValidateAll
                var promise = vm.data.filter(function(data) {
                    var el = data.element
                    return el && !el.disabled && vmodel.widgetElement.contains(el)
                }).map(function(data) {
                    return vm.validate(data, true)
                })
                Promise.all(promise).then(function(array) {
                    var reasons = []
                    for (var i = 0, el; el = array[i++];) {
                        reasons = reasons.concat(el)
                    }
                    if (vm.deduplicateInValidateAll) {
                        var uniq = {}
                        reasons = reasons.filter(function(data) {
                            var el = data.element
                            var id = el.getAttribute("data-validation-id")
                            if (!id) {
                                id = setTimeout("1")
                                el.setAttribute("data-validation-id", id)
                            }
                            if (uniq[id]) {
                                return false
                            } else {
                                uniq[id] = true
                                return true
                            }
                        })
                    }
                    fn.call(vm.widgetElement, reasons) //这里只放置未通过验证的组件
                })
            }

            /**
             * @interface 重置当前表单元素
             * @param callback {Null|Function} 最后执行的回调，如果用户没传就使用vm.onResetAll
             */
            vm.resetAll = function(callback) {
                vm.data.filter(function(el) {
                    return el.element
                }).forEach(function(data) {
                    try {
                        vm.onReset.call(data.element, {
                            type: "reset"
                        }, data)
                    } catch (e) {}
                })
                var fn = typeof callback == "function" ? callback : vm.onResetAll
                fn.call(vm.widgetElement)
            }
            /**
             * @interface 验证单个元素对应的VM中的属性是否符合格式<br>此方法是框架自己调用
             * @param data {Object} 绑定对象
             * @param isValidateAll {Undefined|Boolean} 是否全部验证,是就禁止onSuccess, onError, onComplete触发
             * @param event {Undefined|Event} 方便用户判定这是由keyup,还是blur等事件触发的
             */
            vm.validate = function(data, isValidateAll, event) {
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
                                if (data.norequired && value === "") {
                                    a = true
                                }
                                if (a) {
                                    resolve(true)
                                } else {
                                    var reason = {
                                        element: elem,
                                        data: data.data,
                                        message: elem.getAttribute("data-duplex-" + name + "-message") || elem.getAttribute("data-duplex-message") || hook.message,
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
                    for (var i = 0, el; el = array[i++];) {
                        if (typeof el === "object") {
                            reasons.push(el)
                        }
                    }
                    if (!isValidateAll) {
                        if (reasons.length) {
                            vm.onError.call(elem, reasons, event)
                        } else {
                            vm.onSuccess.call(elem, reasons, event)
                        }
                        vm.onComplete.call(elem, reasons, event)
                    }
                    return reasons
                })
                return lastPromise

            }
            //收集下方表单元素的数据
            vm.$watch("avalon-ms-duplex-init", function(data) {
                var inwardHooks = vmodel.validationHooks
                data.valueAccessor = data.evaluator.apply(null, data.args)

                switch (avalon.type(data.valueAccessor())) {
                    case "array":
                        data.valueResetor = function() {
                            this.valueAccessor([])
                        }
                        break
                    case "boolean":
                        data.valueResetor = function() {
                            this.valueAccessor(false)
                        }
                        break
                    case "number":
                        data.valueResetor = function() {
                            this.valueAccessor(0)
                        }
                        break
                    default:
                        data.valueResetor = function() {
                            this.valueAccessor("")
                        }
                        break
                }

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
                        if (name === "norequired") {
                            data.norequired = true
                        }
                    })
                    data.validate = vm.validate
                    data.param = params.join("-")
                    data.validateParam = validateParams.join("-")
                    if (validateParams.length) {
                        if (vm.validateInKeyup) {
                            data.bound("keyup", function(e) {
                                var type = data.element && data.element.getAttribute("data-duplex-event")
                                if (!type || /^(?:key|mouse|click|input)/.test(type)) {
                                    var ev = fixEvent(e)
                                    setTimeout(function() {
                                        vm.validate(data, 0, ev)
                                    })
                                }
                            })
                        }
                        if (vm.validateInBlur) {
                            data.bound("blur", function(e) {
                                vm.validate(data, 0, fixEvent(e))
                            })
                        }
                        if (vm.resetInFocus) {
                            data.bound("focus", function(e) {
                                vm.onReset.call(data.element, fixEvent(e), data)
                            })
                        }
                        var array = vm.data.filter(function(el) {
                            return el.element
                        })
                        avalon.Array.ensure(array, data)
                        vm.data = array
                    }

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
                return data[name] == null ? "" : data[name]
            })
        }
    widget.defaults = {
        validationHooks: {}, //@config {Object} 空对象，用于放置验证规则
        onSuccess: avalon.noop, //@config {Function} 空函数，单个验证成功时触发，this指向被验证元素this指向被验证元素，传参为一个对象数组外加一个可能存在的事件对象
        onError: avalon.noop, //@config {Function} 空函数，单个验证失败时触发，this与传参情况同上
        onComplete: avalon.noop, //@config {Function} 空函数，单个验证无论成功与否都触发，this与传参情况同上
        onValidateAll: avalon.noop, //@config {Function} 空函数，整体验证后或调用了validateAll方法后触发；有了这东西你就不需要在form元素上ms-on-submit="submitForm"，直接将提交逻辑写在onValidateAll回调上
        onReset: avalon.noop, //@config {Function} 空函数，表单元素获取焦点时触发，this指向被验证元素，大家可以在这里清理className、value
        onResetAll: avalon.noop, //@config {Function} 空函数，当用户调用了resetAll后触发，
        validateInBlur: true, //@config {Boolean} true，在blur事件中进行验证,触发onSuccess, onError, onComplete回调
        validateInKeyup: true, //@config {Boolean} true，在keyup事件中进行验证,触发onSuccess, onError, onComplete回调
        validateAllInSubmit: true, //@config {Boolean} true，在submit事件中执行onValidateAll回调
        resetInFocus: true, //@config {Boolean} true，在focus事件中执行onReset回调,
        deduplicateInValidateAll: false //@config {Boolean} false，在validateAll回调中对reason数组根据元素节点进行去重
    }
    //http://bootstrapvalidator.com/
    //https://github.com/rinh/jvalidator/blob/master/src/index.js
    //http://baike.baidu.com/view/2582.htm?fr=aladdin&qq-pf-to=pcqq.group
})
/**
 @other
 <p>avalon.validation自带了许多<code>验证规则</code>，满足你一般的业务需求。</p>
 <p>大家可以在onReset的回调里得到第二个参数data, 然后调用data.valueResetor()将VM中的数据也置空,如布尔数据变false, 
 数值数据变0,数组数据变[],字符串数组变成""
 
 </p>
 
 <h2>错误提示信息的添加</h2>
 <p>比如说&lt;input ms-duplex-alpha="aaa"/&lt;要求用户输出的都是字母，如果输入其他类型的内容，
 它就会报错<b style="color:red">必须是字母</b>。为什么呢，因为alpha为一个内置拦截器，
 定义在avalon.duplexHooks上，结构为</p>
 ```javascript
 alpha: {
 message: '必须是字母',
 get: function(value, data, next) {
 next(/^[a-z]+$/i.test(value))
 return value
 }
 },
 ```
 如果想显示别的提示信息有三种办法，一就是重写这个栏截器的message属性；
 二就是添加data-duplex-message="新提示信息"（不过这个已经不提倡使用了，
 因为一个表单控制可能使用N个拦截器做验证，如ms-duplex-required-alpha-minlength，
 这会覆盖其他拦截器的默认提示信息）；三就是使用data-duplex-alpha-message="专门用于alpha提示信息" 
 ```html
 <input ms-duplex-required-alpha-minlength="aaa" data-duplex-alpha-message="只能全是英文字母"
 ```    
 此外，提示信息里面可以使用插值表达式，虽然不能使用变量，也应该够用，比如说minlength拦截器
 ```javascript
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
 ```          
 我们必须传入一个min参数,这要在元素上添加
 ```html
 <input ms-duplex-minlength="aaa" data-duplex-min="6"
 ```         
 这样报错时就提示要<b>最少输入6个字</b>      
 */

/**
 @links
 [自带验证规则required,int,decimal,alpha,chs,ipv4,phone](avalon.validation.ex1.html)
 [自带验证规则qq,id,email,url,date,passport,pattern](avalon.validation.ex2.html)
 [自带验证规则maxlength,minlength,lt,gt,eq,repeat](avalon.validation.ex3.html)
 [自带验证规则contains,contain](avalon.validation.ex4.html)
 [自带验证规则repeat(重复密码)](avalon.validation.ex5.html)
 [自定义验证规则](avalon.validation.ex6.html)
 [自带验证规则norequied](avalon.validation.ex7.html)
 [禁止获得焦点时的onRest回调 resetInFocus ](avalon.validation.ex8.html)
 [与textbox组件的混用, ms-duplex-string的使用 ](avalon.validation.ex9.html)
 [验证表单元素存在disabled的情况 ](avalon.validation.ex10.html)
 [deduplicateInValidateAll:true对validatieAll回调的reasons数组根据element进行去重 ](avalon.validation.ex13.html)
 [验证dropdown组件 ](avalon.validation.ex14.html)
 
 
 */