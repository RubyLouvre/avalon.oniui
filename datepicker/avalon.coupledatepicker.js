// avalon 1.3.6
/**
 * 
 * @cnName 日期范围选择的双日历
 * @enName coupledatepicker
 * @introduce
 *    <p>coupledatepicker其实是普通日历的升级版，可以通过设置起始日期与结束日期的最小间隔天数和最大间隔天数将截止日期限制在一定的选择范围中</p>
 */
define(["../avalon.getModel",
        "text!./avalon.coupledatepicker.html", 
        "./avalon.datepicker",
        "css!../chameleon/oniui-common.css", 
        "css!./avalon.coupledatepicker.css"], function(avalon, sourceHTML) {
    var widget = avalon.ui.coupledatepicker = function(element, data, vmodels) {
        var options = data.coupledatepickerOptions,
            parseDate = ((typeof options.parseDate === "function") && options.parseDate.bind(options)) || widget.defaults.parseDate.bind(options),
            formatDate = ((typeof options.formatDate === "function") && options.formatDate.bind(options)) || widget.defaults.formatDate.bind(options),
            duplex = options.duplex && options.duplex.split(","),
            container = options.container,
            rules = options.rules,
            _toMinDate = "",
            _toMaxDate = "",
            rangeRules = "",
            duplexFrom,
            duplexTo,
            inputFromVM,
            inputToVM

        // 获取rules配置对象
        if (rules && avalon.type(rules) === 'string') {
            var ruleVM = avalon.getModel(rules, vmodels)
            rules = ruleVM[1][ruleVM[0]];
        }
        if (rules && avalon.type(rules) === "object") { // 让rules对象的toMinDate、toMaxDate、fromMinDate、fromMaxDate是可监控的属性
            rules = avalon.mix({}, rules.$model || rules)
            rules.toMinDate = rules.toMinDate || ""
            rules.toMaxDate = rules.toMaxDate || ""
            rules.fromMinDate = rules.fromMinDate || ""
            rules.fromMaxDate = rules.fromMaxDate || ""
        } else {
            rules = ""
        }
        options.rules = rules
        _toMinDate = rules.toMinDate
        _toMaxDate = rules.toMaxDate
        rangeRules = options.rules && options.rules.rules || ""
        rangeRules = rangeRules.length > 0 ? rangeRules.split(",") : []

        if (typeof container === "string") {
            container = container.split(",")
            container[0] = document.getElementById(container[0])
            container[1] = document.getElementById(container[1])
        }
        if (!container.length) {
            container = element.getElementsByTagName("div")
        }
        options.container = container = (container.length ? avalon.slice(container, 0) : container)
        options.template = initValues(options.getTemplate(sourceHTML, options))

        var vmodel = avalon.define(data.coupledatepickerId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["widgetElement","container","calendarWrapper", "template", "changeMonthAndYear", "startDay", "fromLabel", "toLabel", "duplex"]
            vm.widgetElement = element
            vm.fromSelectCal = function(date) {
                if (vmodel.rules && vmodel.rules.rules) {
                    applyRules(date)
                }
            }
            vm.getDates = function() {
                var inputFromValue = duplexFrom ? duplexFrom[1][duplexFrom[0]] : vmodel.inputFromValue,
                    inputFromDate = parseDate(inputFromValue),
                    inputToValue = duplexTo ? duplexTo[1][duplexTo[0]] : vmodel.inputToValue,
                    inputToDate = parseDate(inputToValue)

                return (inputFromDate && inputToDate && [inputFromDate, inputToDate]) || null
            } 
            vm.$fromConfig = {
                changeMonthAndYear: options.changeMonthAndYear,
                startDay: options.startDay,
                parseDate: parseDate,
                formatDate: formatDate,
                minDate: "rules.fromMinDate",
                maxDate: "rules.fromMaxDate",
                onSelect: vm.fromSelectCal,
                calendarLabel: options.fromLabel,
                onInit: function(fromVM) {
                    inputFromVM = fromVM
                    options.disabled && (inputFromVM.disabled = true)
                }
            }
            vm.$toConfig = {
                changeMonthAndYear: options.changeMonthAndYear,
                startDay: options.startDay,
                parseDate: parseDate,
                formatDate: formatDate,
                minDate: "rules.toMinDate",
                maxDate: "rules.toMaxDate",
                calendarLabel: options.toLabel,
                onInit: function(toVM) {
                    inputToVM = toVM
                    options.disabled && (inputToVM.disabled = true)
                }
            }
            vm.$init = function(continueScan) {
                var template = options.template.split("MS_OPTION_TEMPLATE"),
                    containerTemp = template[0],
                    inputOnlyTemp = template[1],
                    calendar = null,
                    inputOnly = null,
                    fromInput = null,
                    toInput = null,
                    fromContainer = null,
                    toContainer = null,
                    calendarTemplate = "",
                    inputFromValue = "",
                    scanVM = [vmodel]

                avalon(element).addClass("oni-coupledatepicker")
                if (duplexFrom) {
                    inputFromValue = duplexFrom[1][duplexFrom[0]]
                    scanVM.push(duplexFrom[1])
                }
                if (duplexTo) {
                    scanVM.push(duplexTo[1])
                }
                applyRules(inputFromValue && parseDate(inputFromValue))

                if (container.length) {
                    calendarTemplate = inputOnlyTemp 
                    inputOnly = avalon.parseHTML(inputOnlyTemp)
                    fromInput = inputOnly.firstChild
                    toInput = inputOnly.lastChild
                    fromContainer = container[0]
                    toContainer = container[1]
                    fromContainer.appendChild(fromInput)
                    toContainer.appendChild(toInput)
                    avalon(fromContainer).addClass("oni-coupledatepicker-item")
                    avalon(toContainer).addClass("oni-coupledatepicker-item")
                } else {
                    calendarTemplate = containerTemp
                    calendar = avalon.parseHTML(calendarTemplate)
                    element.appendChild(calendar)
                }
                avalon.scan(element, scanVM.concat(vmodels))
                if (typeof options.onInit === "function") {
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            };
            vm.$remove = function() {
                element.innerHTML = element.textContent = "";
            };
        })
        vmodel.$watch("disabled", function(val) {
            inputFromVM.disabled = val
            inputToVM.disabled = val
        })

        var _c = {  
            '+M': function(time ,n) {
                var _d = time.getDate()
                time.setMonth(time.getMonth() + n)
                if(time.getDate() !== _d) {
                    time.setDate(0)
                } 
            },
            '-M': function(time ,n) { 
                var _d = time.getDate()
                time.setMonth(time.getMonth() - n)
                if(time.getDate() !== _d) {
                    time.setDate(0)
                }
            },
            '+D': function(time ,n) { 
                time.setDate(time.getDate() + n)
            },
            '-D': function(time ,n) { 
                time.setDate(time.getDate() - n)
            },
            '+Y': function(time ,n) { 
                time.setFullYear(time.getFullYear() + n) 
            },
            '-Y': function(time ,n) { 
                time.setFullYear(time.getFullYear() - n) 
            }
        };

        function initValues(template) {
            if (duplex) {
                var duplexLen = duplex.length,
                    duplexVM1 = avalon.getModel(duplex[0].trim(), vmodels),
                    duplexVM2 = duplexLen === 1 ? null : avalon.getModel(duplex[1].trim(), vmodels),
                    duplexVal1 = duplexVM1[1][duplexVM1[0]],
                    duplexVal2 = duplexVM2 ? duplexVM2[1][duplexVM2[0]] : "";
                duplexFrom = duplexVM1
                duplexTo = duplexVM2
                setValues(duplexLen, duplexVal1, duplexVal2)
                if (duplexFrom) {
                    template = template.replace(/MS_OPTION_FROMDUPLEX/g, duplex[0].trim())
                }
                if (duplexTo) {
                    template = template.replace(/MS_OPTION_TODUPLEX/g, duplex[1].trim())
                }
            } 
            if (!duplexFrom) {
                options.inputFromValue = ""
                template = template.replace(/MS_OPTION_FROMDUPLEX/g, "inputFromValue")
            }
            if (!duplexTo) {
                options.inputToValue = ""
                template = template.replace(/MS_OPTION_TODUPLEX/g, "inputToValue")
            }
            return template
        }
        function setValues(len, from, to) {
            if (len) {
                if (len == 2) {
                    if (duplexFrom) {
                        duplexFrom[1][duplexFrom[0]] = from && parseDate(from) && from || ""
                    } else {
                        vmodel.inputFromValue = from && parseDate(from) && from || ""
                    }
                    if (duplexTo) {
                        duplexTo[1][duplexTo[0]] = to && parseDate(to) && to || ""
                    } else {
                        vmodel.inputToValue = to && parseDate(to) && to || ""
                    }
                } else if (len == 1) {
                    if (duplexFrom) {
                        duplexFrom[1][duplexFrom[0]] = from && parseDate(from) && from || ""
                    } else {
                        vmodel.inputFromValue = from && parseDate(from) && from || ""
                    }
                }
            }
        }
        function applyRules(date) {
            var minDate = _toMinDate && parseDate(_toMinDate), 
                maxDate = _toMaxDate && parseDate(_toMaxDate),
                inputToValue = duplexTo ? duplexTo[1][duplexTo[0]] : vmodel.inputToValue,
                rules = vmodel.rules,
                minDateRule,
                maxDateRule,
                inputToDate,
                df = {}

            if (!date) return 
            for (var i = 0, type = ['defaultDate', 'minDate', 'maxDate']; i < type.length; i++) {
                if (rangeRules[i]) {
                    df[type[i]] = calcDate(rangeRules[i], date)
                }
            }
            minDateRule = df['minDate']
            maxDateRule = df['maxDate']
            minDate = (minDateRule ? minDateRule.getTime() : -1) > (minDate ? minDate.getTime() : -1) ? minDateRule : minDate
            maxDate = (maxDateRule ? maxDateRule.getTime() : Number.MAX_VALUE) > (maxDate ? maxDate.getTime() : Number.MAX_VALUE) ? maxDate : maxDateRule
            if(!inputToValue && df["defaultDate"]){
                inputToValue = formatDate(df["defaultDate"])
            }
            if(minDate){
                var toMinDateFormat = formatDate(minDate)
                if(!inputToValue) {
                    inputToValue = toMinDateFormat
                }
            }
            inputToDate = inputToValue && parseDate(inputToValue)
            if(inputToDate && isDateDisabled(inputToDate, minDate, maxDate)) {
                inputToValue = toMinDateFormat
            }
            if (duplexTo) {
                duplexTo[1][duplexTo[0]] = inputToValue
            } else {
                vmodel.inputToValue = inputToValue
            }
            if (minDate) {
                rules.toMinDate = cleanDate(minDate)
            } 
            if (maxDate) {
                rules.toMaxDate = cleanDate(maxDate)
            }
        }
        // 根据minDate和maxDate的设置判断给定的日期是否不可选
        function isDateDisabled(date, minDate, maxDate){
            var time = date.getTime()
            if(minDate && time < minDate.getTime()){
                return true
            } else if(maxDate && time > maxDate.getTime()) {
                return true
            }
            return false
        }
        function calcDate(desc , date){
            var time,
                _date,
                re = /([+-])?(\d+)([MDY])?/g, 
                arr,
                key;
            desc = (desc || "").toString()
            arr = re.exec(desc)
            key = arr && ((arr[1] || '+') + (arr[3] || 'D'))
            time = date ? date : new Date()
            _date = new Date(typeof time === "string" ? parseDate(time) : time)
            if (key && _c[key]) {
                _c[key](_date ,arr[2] * 1)
            }
            return _date
        }
        return vmodel
    }
    // 将日期时间转为00:00:00
    function cleanDate( date ){
        date.setHours(0)
        date.setMinutes(0)
        date.setSeconds(0)
        date.setMilliseconds(0)
        return date
    }
    widget.version = 1.0
    widget.defaults = {
        container : [], //必选，渲染的容器，每个元素类型为 {Element|JQuery|String}
        fromLabel : '选择起始日期', //@config 设置起始日期日历框的说明文字
        toLabel : '选择结束日期', //@config 设置结束日期日历框的说明文字
        changeMonthAndYear: false,
        widgetElement: "", // accordion容器
        disabled: false, //@config 设置是否禁用组件
        startDay: 1, //@config 设置每一周的第一天是哪天，0代表Sunday，1代表Monday，依次类推, 默认从周一开始
        separator: "-", //@config 日期格式的分隔符，可以是"/"或者你希望的符号，但如果是除了"-"和"/"之外的字符则需要和parseDate和formatDate配合使用，以便组件能正常运作
        /**
         * @config 设置双日历框的工作规则
            <pre class="brush:javascript;gutter:false;toolbar:false">
            {
                rules: 'null, 0D, 8D',
                fromMinDate: '2014-05-02',
                fromMaxDate: '2014-06-28',
                toMinDate: '2014-06-01',
                toMaxDate: '2014-07-12'
            }
            </pre> 
         * 可以是绑定组件时定义的配置对象中的一个rules对象，也可以是一个字符串，指向一个上述对象。
         * 其中对象中的rules属性定义结束初始日期异常时默认显示的日期、初始日期和结束日子之间最小相隔天数、最大相隔天数，格式是[+-]\d[DMY]，分别代表几天、几个月或者几年，也可以附加+或者-号，+号表示正数几天，-号表示负数几天
         * fromMinDate代表起始日期可以设置的最小日期
         * fromMaxDate代表起始日期可以设置的最大日期
         * toMinDate代表结束日期可以设置的最小日期
         * toMaxDate代表结束日期可以设置的最大日期
         */
        rules: "",
        /**
         * @config {Function} 将符合日期格式要求的字符串解析为date对象并返回，不符合格式的字符串返回null,用户可以根据自己需要自行配置解析过程
         * @param str {String} 需要解析的日期字符串
         * @returns {Date} 解析后的日期对象 
         */
        parseDate: function(str){
            if (avalon.type(str) === "date") return str
            var separator = this.separator
            var reg = "^(\\d{4})" + separator+ "(\\d{1,2})"+ separator+"(\\d{1,2})$"
            reg = new RegExp(reg)
            var x = str.match(reg)
            return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null
        },
        /**
         * @config {Function} 将日期对象转换为符合要求的日期字符串
         * @param date {Date} 需要格式化的日期对象
         * @returns {String} 格式化后的日期字符串 
         */
        formatDate: function(date){
            if (avalon.type(date) !== "date") {
                avalon.log("the type of " + date + "must be Date")
                return ""
            }
            var separator = this.separator,
                year = date.getFullYear(), 
                month = date.getMonth(), 
                day = date.getDate()

            return year + separator + this.formatNum( month + 1 , 2 ) + separator + this.formatNum(day , 2)
        },
        formatNum: function(n, length){
            n = String(n)
            for( var i = 0 , len = length - n.length; i < len; i++)
                n = "0" + n
            return n
        },
        getTemplate: function(str, options) {
            return str
        }
    }
    return avalon
})
/**
 @links
 [不同构建方式的coupledatepicker，注意按demo说明方式设置](avalon.coupledatepicker.ex1.html)
 [配置双日历框的日历说明文字、设置日历显示每周的第一天从周日开始](avalon.coupledatepicker.ex2.html)
 [初始化双日历框的起始日期和结束日期、不同方式切换禁用日历](avalon.coupledatepicker.ex3.html)
 [初始日期和截止日期之间的最小相隔天数和最大相隔天数](avalon.coupledatepicker.ex4.html)
 [配置双日历框的解析和显示规则](avalon.coupledatepicker.ex5.html)
 */
