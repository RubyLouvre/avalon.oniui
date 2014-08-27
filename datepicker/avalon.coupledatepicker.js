define(["../avalon.getModel",
        "text!./avalon.coupledatepicker.html", 
        "./avalon.datepicker",
        "css!../chameleon/oniui-common.css", 
        "css!./avalon.coupledatepicker.css"], function(avalon, sourceHTML) {
    var widget = avalon.ui.coupledatepicker = function(element, data, vmodels) {
        var options = data.coupledatepickerOptions,
            disabled = options.disabled.toString(),
            disabledVM = avalon.getModel(disabled, vmodels),
            duplex = options.duplex && options.duplex.split(","),
            duplexFrom,
            duplexTo,
            rules = options.rules,
            _toMinDate = "",
            _toMaxDate = "",
            calendarTemplate = sourceHTML,
            rangeRules = "",
            container = options.container,
            parseDate = options.parseDate.bind(options),
            formatDate = options.formatDate.bind(options);

        if (rules && avalon.type(rules) === 'string') {
            var ruleVM = avalon.getModel(rules, vmodels)
            rules = ruleVM[1][ruleVM[0]]
        }
        rules = rules.$model || rules
        if (rules) {
            rules.toMinDate = rules.toMinDate || ""
            rules.toMaxDate = rules.toMaxDate || ""
            rules.fromMinDate = rules.fromMinDate || ""
            rules.fromMaxDate = rules.fromMaxDate || ""
        }
        _toMinDate = rules.toMinDate 
        _toMaxDate = rules.toMaxDate 
        options.rules = rules
        rangeRules = options.rules && options.rules.rules || ""
        rangeRules = rangeRules.length > 0 ? rangeRules.split(",") : []
        if (disabled !== "true" && disabled !== "false" && disabledVM) {
            options.disabled = disabledVM[1][disabledVM[0]]
            disabledVM[1].$watch(disabledVM[0], function(val) {
                vmodel.disabled = val
            })
        }
        if (typeof container === "string") {
            container = container.split(",")
            container[0] = document.getElementById(container[0])
            container[1] = document.getElementById(container[1])
        }
        if (!container.length) {
            container = element.getElementsByTagName("div")
        }
        options.container = container = container.length ? [].slice.call(container) : container
        calendarTemplate = options.template = options.getTemplate(calendarTemplate, options)
        var vmodel = avalon.define(data.coupledatepickerId, function(vm) {
            avalon.mix(vm, options)
            vm.msg = ""
            vm.$skipArray = ["widgetElement","container","calendarWrapper", "template", "changeMonthAndYear", "startDay", "fromLabel", "toLabel"]
            vm.widgetElement = element
            vm.fromDisabled = options.disabled
            vm.toDisabled = options.disabled
            vm.inputFromValue = ""
            vm.inputToValue = ""
            vm.fromSelectCal = function(date) {
                applyRules(date)
            };
            vm.getDates = function() {
                var inputFromDate = parseDate(vmodel.inputFromValue),
                    inputToDate = parseDate(vmodel.inputToValue);
                return (inputFromDate && inputToDate && [inputFromDate, inputToDate]) || null;
            } 
            vm.$init = function() {
                var template = options.template.replace(/MS_OPTION_FROM_LABEL/g,vmodel.fromLabel).replace(/MS_OPTION_TO_LABEL/g,vmodel.toLabel).replace(/MS_OPTION_START_DAY/g, vmodel.startDay).replace(/MS_OPTION_CHANGE_MONTH_AND_YEAR/g, vmodel.changeMonthAndYear).split("MS_OPTION_TEMPLATE"),
                    containerTemp = template[0],
                    inputOnlyTemp = template[1],
                    calendar = null,
                    inputOnly = null,
                    fromInput = null,
                    toInput = null,
                    fromContainer = null,
                    toContainer = null,
                    calendarTemplate = "";

                avalon(element).addClass("ui-coupledatepicker")
                initValues()
                applyRules(vmodel.inputFromValue && parseDate(vmodel.inputFromValue) || new Date())
                if (container.length) {
                    calendarTemplate = inputOnlyTemp 
                    inputOnly = avalon.parseHTML(inputOnlyTemp)
                    fromInput = inputOnly.firstChild
                    toInput = inputOnly.lastChild
                    fromContainer = container[0]
                    toContainer = container[1]
                    fromContainer.appendChild(fromInput)
                    toContainer.appendChild(toInput)
                    avalon(fromContainer).addClass("ui-coupledatepicker-item")
                    avalon(toContainer).addClass("ui-coupledatepicker-item")
                } else {
                    calendarTemplate = containerTemp
                    calendar = avalon.parseHTML(calendarTemplate)
                    element.appendChild(calendar)
                }
                avalon.scan(element, [vmodel].concat(vmodels));
                if(typeof options.onInit === "function" ){
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            };
            vm.$remove = function() {
                element.innerHTML = element.textContent = "";
            };
        })
        vmodel.$watch("disabled", function(val) {
            vmodel.fromDisabled = vmodel.toDisabled = val
        })
        vmodel.$watch("inputFromValue", function(val) {
            if(duplexFrom) {
                duplexFrom[1][duplexFrom[0]] = val
            }
        })
        vmodel.$watch("inputToValue", function(val) {
            if(duplexTo) {
                duplexTo[1][duplexTo[0]] = val
            }
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
        function initValues() {
            if (duplex) {
                var duplexLen = duplex.length,
                    duplexVM1 = avalon.getModel(duplex[0].trim(), vmodels),
                    duplexVM2 = duplexLen === 1 ? null : avalon.getModel(duplex[1].trim(), vmodels),
                    duplexVal1 = duplexVM1[1][duplexVM1[0]],
                    duplexVal2 = duplexVM2 ? duplexVM2[1][duplexVM2[0]] : "";
                duplexFrom = duplexVM1
                duplexTo = duplexVM2
                setValues(duplexLen, duplexVal1, duplexVal2)
                if (duplexVM1) {
                    duplexVM1[1].$watch(duplexVM1[0], function(val) {
                        console.log("duplexFrom changed")
                        vmodel.inputFromValue = val
                    })
                }
                if (duplexVM2) {
                    duplexVM2[1].$watch(duplexVM2[0], function(val) {
                        console.log("duplexTo changed")
                        vmodel.inputToValue = val
                    })
                }
            } 
        }
        function setValues(len, from, to) {
            if (len) {
                if (len == 2) {
                    vmodel.inputFromValue = from && parseDate(from) && from || ""
                    vmodel.inputToValue = to && parseDate(to) && to || ""
                } else if ( len == 1){
                    vmodel.inputFromValue = from && parseDate(from) && from || ""
                }
            }
        }
        function applyRules(date) {
            var df = {},
                rules = vmodel.rules,
                minDate = _toMinDate && parseDate(_toMinDate), 
                maxDate = _toMaxDate && parseDate(_toMaxDate),
                minDateRule,
                maxDateRule,
                inputToDate;
            for (var i = 0, type = ['defaultDate', 'minDate', 'maxDate']; i < type.length; i++) {
                if (rangeRules[i]) {
                    df[type[i]] = calcDate(rangeRules[i], date)
                }
            }
            minDateRule = df['minDate']
            maxDateRule = df['maxDate']
            minDate = (minDateRule ? minDateRule.getTime() : -1) > (minDate ? minDate.getTime() : -1) ? minDateRule : minDate
            maxDate = (maxDateRule ? maxDateRule.getTime() : Number.MAX_VALUE) > (maxDate ? maxDate.getTime() : Number.MAX_VALUE) ? maxDate : maxDateRule
            if(!vmodel.inputToValue && df["defaultDate"]){
                vmodel.inputToValue = formatDate(df["defaultDate"])
            }
            if(minDate){
                var toMinDateFormat = formatDate(minDate)
                rules.toMinDate = toMinDateFormat
                if(!vmodel.inputToValue) {
                    vmodel.inputToValue = toMinDateFormat
                }
            }
            if(maxDate) {
                rules.toMaxDate = formatDate(maxDate)
            }
            inputToDate = vmodel.inputToValue && parseDate(vmodel.inputToValue)
            if(inputToDate && isDateDisabled(inputToDate, minDate, maxDate)) {
                vmodel.inputToValue = toMinDateFormat
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
            _date = new Date(time)
            if (key && _c[key]) {
                _c[key](_date ,arr[2] * 1)
            }
            return _date
        }
        return vmodel
    }
    widget.version = 1.0
    widget.defaults = {
        container : [], //必选，渲染的容器，每个元素类型为 {Element|JQuery|String}
        fromLabel : '选择起始日期',   // 起始日期日历框上方提示文字
        toLabel : '选择结束日期',     // 结束日期日历框上方提示文字
        changeMonthAndYear: false,
        widgetElement: "", // accordion容器
        disabled: false,
        startDay: 1,    //星期开始时间
        separator: "-",
        rules: "",
        parseDate: function(str){
            var separator = this.separator
            var reg = "^(\\d{4})" + separator+ "(\\d{1,2})"+ separator+"(\\d{1,2})$"
            reg = new RegExp(reg)
            var x = str.match(reg)
            return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null
        },
        formatDate: function(date){
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