// avalon 1.3.6
/**
 * 
 * @cnName 日期范围选择日历
 * @enName daterangepicker
 * @introduce
 *    <p>daterangepicker是日期范围选择组件，可以通过设置起始日期与结束日期的最小间隔天数和最大间隔天数将截止日期限制在一定的选择范围中，同时通过点击确定按钮确定日期范围，在选择的时候日期范围框的下方会实时的说明当前选择情况</p>
 */
define(["../avalon.getModel",
        "text!./avalon.daterangepicker.html",
        "../button/avalon.button", 
        "./avalon.datepicker",
        "css!../chameleon/oniui-common.css", 
        "css!./avalon.daterangepicker.css"], function(avalon, sourceHTML) {
    var calendarTemplate = sourceHTML;
    var widget = avalon.ui.daterangepicker = function(element, data, vmodels) {
        var options = data.daterangepickerOptions,
            datesDisplayFormat = options.opts && options.opts.datesDisplayFormat,
            parseDate = ((typeof options.parseDate === "function") && options.parseDate.bind(options)) || widget.defaults.parseDate.bind(options),
            formatDate = ((typeof options.formatDate === "function") && options.formatDate.bind(options)) || widget.defaults.formatDate.bind(options),
            duplex = options.duplex && options.duplex.split(","), //options.duplex保存起始日期和结束日期初始化值的引用，逗号分隔
            _confirmClick = false, //判断是否点击了确定按钮，没点击为false，点击为true
            rules = options.rules, //日期选择框起始日期和结束日期之间关系的规则
            fromSelected = null,
            inputFromVM = null,
            inputToVM = null,
            _toMinDate = "", //保存rules指向的对象的toMinDate属性值，以便于rules属性计算所得的minDate做比较
            _toMaxDate = "", //保存rules指向的对象的toMaxDate属性值，以便于rules属性计算所得的maxDate做比较
            inputFrom, //绑定datepicker组件的初始日期输入域元素的引用
            inputTo, //绑定datepicker组件的结束日期输入域元素的引用
            duplexFrom,
            duplexTo,
            _oldValue, //保存最近一次选择的起始日期和结束日期组成的日期对象数组，因为当选择了日期但没有点确定按钮时，日期选择范围不改变，相应的对应的日历默认输入域也应该恢复到最近一次的选择
            rangeRules
        
        // 获取用户定义的模拟输入框显示内容形式的方法
        if (datesDisplayFormat && typeof datesDisplayFormat ==="function") {
            options.datesDisplayFormat = datesDisplayFormat
        }
        datesDisplayFormat = options.datesDisplayFormat
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
        
        options.template = options.getTemplate(calendarTemplate, options)
        initValues()
        var vmodel = avalon.define(data.daterangepickerId, function(vm) {
            avalon.mix(vm, options)
            vm.msg = ""
            vm.$skipArray = ["widgetElement","container","inputElement","calendarWrapper", "fromLabel", "toLabel", "duplex"]
            vm.widgetElement = element
            vm.toggle = false
            vm.container = null
            vm.inputElement = null
            vm.calendarWrapper = null
            // 切换组件的显示隐藏
            vm._toggleDatepicker = function(val) {
                if (!vmodel.disabled) {
                    vmodel.toggle = !val;
                }
            }
            // 更新日期范围选择框下方的说明文字
            vm._updateMsg = function(event) {
                event.stopPropagation();
            }
            // 点击确定按钮确定日期选择范围
            vm._selectDate = function() {
                var inputFromValue = inputFrom.value,
                    inputToValue = inputTo.value,
                    inputFromDate = parseDate(inputFromValue),
                    inputToDate = parseDate(inputToValue),
                    label = datesDisplayFormat(options.defaultLabel,inputFromValue, inputToValue),
                    p = document.createElement("p"),
                    $p = avalon(p),
                    labelWidth = 0,
                    msg = "";
                    
                if (!inputToDate || !inputFromDate) {
                    msg = (!inputFromDate && !inputToDate) ? "请选择起始日期和结束日期" : !inputFromDate ? "请选择起始日期" : "请选择结束日期"
                    msg = "<span style='color:#f55'>" + msg + "</span>"
                    vmodel.msg = msg
                    return false
                }
                vmodel.label = label
                _confirmClick = true
                _oldValue = [inputFromDate, inputToDate]
                vmodel.toggle = false
                $p.css({position:"absolute",visibility:"hidden",height:0,"font-size": "12px"})
                p.innerHTML = label
                document.body.appendChild(p)
                labelWidth = $p.width() + 30
                document.body.removeChild(p)
                if (labelWidth > vmodel.dateRangeWidth) {
                    vmodel.dateRangeWidth = labelWidth
                }
                options.onSelect.call(vmodel, inputFromDate, inputToDate, _oldValue, vmodel, avalon(element).data())
            }
            // 点击取消按钮隐藏日历框
            vm._cancelSelectDate = function() {
                fromSelected = false
                vmodel.toggle ? vmodel.toggle = false : 0
            }
            vm.getDates = function() {
                var inputFromValue = duplexFrom ? duplexFrom[1][duplexFrom[0]] : vmodel.inputFromValue,
                    inputFromDate = parseDate(inputFromValue),
                    inputToValue = duplexTo ? duplexTo[1][duplexTo[0]] : vmodel.inputToValue,
                    inputToDate = parseDate(inputToValue)
                    
                return (inputFromDate && inputToDate && [inputFromDate, inputToDate]) || null
            }
            // 设置日期范围框的起始日期和结束日期
            vm.setDates = function(from, to, defaultLabel) {
                var inputValues = to === void 0 ? [from] : [from, to],
                    len = inputValues.length,
                    inputFromDate = avalon.type(from) === "date" ? from : parseDate(from),
                    inputToDate = avalon.type(to) === "date" ? to : parseDate(to);
                if (len) {
                    vmodel.defaultLabel = defaultLabel || vmodel.defaultLabel
                    setValues(len, from, to)
                } else {
                    vmodel.label = ""
                }
                initMsgAndOldValue()
                options.onSelect.call(vmodel, inputFromDate, inputToDate, _oldValue, vmodel, avalon(element).data())
                _oldValue = [inputFromDate, inputToDate]
            }
            vm._fixDate = function (dateFrom, dateTo, minDate, maxDate) {
                var from = new Date(dateFrom.getTime()),
                    to = new Date(dateTo.getTime());
                if (minDate) {
                    from = new Date(Math.max(minDate.getTime(), from))
                }
                if (maxDate) {
                    to = new Date(Math.min(maxDate.getTime() , to))
                }
                return [from, to]
            }
            vm.quickOperation = function(instruction) {
                var now = new Date(),
                    fromDate = now,
                    toDate = now,
                    defaultLabel = "今天",
                    minDate = vmodel.rules.fromMinDate,
                    maxDate = vmodel.rules.toMaxDate,
                    dateArr = [];
                minDate = minDate && parseDate(minDate) || null
                maxDate = minDate && parseDate(maxDate) || null
                switch (instruction) {
                    case "lastDay" :
                        fromDate = toDate = new Date(now.setDate(now.getDate() - 1))
                        defaultLabel = "昨天"
                    break;
                    case "lastSeventDays" :
                        fromDate = new Date()
                        fromDate = new Date(fromDate.setDate(fromDate.getDate()-8))
                        toDate = new Date()
                        toDate = new Date(toDate.setDate(toDate.getDate()-1))
                        defaultLabel = "过去七天"
                        dateArr = vmodel._fixDate(fromDate, toDate, minDate, maxDate)
                        fromDate = dateArr[0]
                        toDate = dateArr[1]
                    break;
                    case "currentMonth" :
                        defaultLabel = "本月"
                        fromDate = new Date()
                        fromDate = new Date(fromDate.setDate(1))
                        dateArr = vmodel._fixDate(fromDate, toDate, minDate, maxDate)
                        fromDate = dateArr[0]
                        toDate = dateArr[1]
                    break;
                    case "lastMonth" :
                        defaultLabel = "上个月"
                        toDate = new Date()
                        toDate = new Date(toDate.setDate(-1))
                        fromDate = new Date(new Date(toDate.getTime()).setDate(1))
                        dateArr = vmodel._fixDate(fromDate, toDate, minDate, maxDate)
                        fromDate = dateArr[0]
                        toDate = dateArr[1]
                    break;
                }
                vmodel.setDates(fromDate, toDate, defaultLabel)
                vmodel.toggle = false
            }
            // 设置日期输入框的label
            vm.setLabel = function(str) {
                vmodel.label = str
            }
            // 设置日历的禁用与否
            vm.setDisabled = function(val) {
                vmodel.disabled = val
            }
            // 选择了初始日期之后根据rules的设置及时更新结束日期的选择范围
            vm.fromSelectCal = function(date) {
                if (vmodel.rules && vmodel.rules.rules) {
                    applyRules(date)
                }
                fromSelected = date
            }
            vm.$fromConfig = {
                type: "range",
                allowBlank: true,
                parseDate: parseDate,
                formatDate: formatDate,
                onSelect: vm.fromSelectCal,
                minDate: "rules.fromMinDate",
                maxDate: "rules.fromMaxDate",
                startDay: options.startDay,
                calendarLabel: options.fromLabel,
                onInit: function(fromVM) {
                    inputFromVM = fromVM
                }
            }
            vm.$toConfig = {
                type: "range",
                allowBlank: true,
                parseDate: parseDate,
                formatDate: formatDate,
                minDate: "rules.toMinDate",
                maxDate: "rules.toMaxDate",
                startDay: options.startDay,
                calendarLabel: options.toLabel,
                onInit: function(toVM) {
                    inputToVM = toVM
                }
            }
            vm.$init = function() {
                var inputFromValue = "",
                    daterangepicker,
                    calendarWrapper,
                    container,
                    inputs

                daterangepicker = avalon.parseHTML(options.template).firstChild
                inputs = daterangepicker.getElementsByTagName("input")
                container = daterangepicker.children[0]
                calendarWrapper = daterangepicker.children[1]
                inputFrom = inputs[0]
                inputTo = inputs[1]
                vmodel.container = container
                vmodel.inputElement = container
                vmodel.calendarWrapper = calendarWrapper 
                element.appendChild(daterangepicker)
                avalon(element).addClass('oni-daterangepicker-wrapper')
                avalon.bind(document, "click", function(event) {
                    var target = event.target
                    if (!element.contains(target)) {
                        vmodel.toggle = false
                    }
                })
                
                element.init = true
                if (duplexFrom) {
                    inputFromValue = duplexFrom[1][duplexFrom[0]]
                }
                applyRules(inputFromValue && parseDate(inputFromValue))
                avalon.scan(element, [vmodel].concat(vmodels)) 
                // 扫描完daterangepicker组件之后才扫描datepicker
                avalon.nextTick(function() {
                    var duplexFromName = duplexFrom ? duplexFrom[0].trim() : 'inputFromValue', 
                        duplexToName = duplexTo ? duplexTo[0].trim() : 'inputToValue',
                        fromVM = duplexFrom ? [vmodel, duplexFrom[1]] : [vmodel],
                        toVM = duplexTo ? [vmodel, duplexTo[1]] : [vmodel];

                    inputFrom.setAttribute('ms-widget', 'datepicker, $, $fromConfig');
                    inputTo.setAttribute('ms-widget', 'datepicker, $, $toConfig');
                    inputFrom.setAttribute('ms-duplex', duplexFromName);
                    inputTo.setAttribute('ms-duplex', duplexToName);
                    avalon.scan(inputFrom, fromVM.concat(vmodels));
                    avalon.scan(inputTo, toVM.concat(vmodels));
                    if(typeof options.onInit === "function" ){
                        //vmodels是不包括vmodel的
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                })
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
        })
        if (!duplexFrom) {
            vmodel.$watch("inputFromValue", function(val) {
                updateMsg()
            })
        }
        if (!duplexTo) {
            vmodel.$watch("inputToValue", function(val) {
                updateMsg()
            })
        }
        var _c = {  
            '+M': function(time ,n) { //+M表示相隔n个月
                var _d = time.getDate()
                time.setMonth(time.getMonth() + n)
                if(time.getDate() !== _d) {
                    time.setDate(0)
                } 
            },
            '-M': function(time ,n) { //-M表示相隔n个月不过是追溯到以前的日前
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
        }
        // 初始化日期范围值
        function initValues() {
            if (duplex) {
                var duplexLen = duplex.length,
                    duplexVM1 = avalon.getModel(duplex[0].trim(), vmodels),
                    duplexVM2 = duplexLen === 1 ? null : avalon.getModel(duplex[1].trim(), vmodels),
                    duplexVal1 = duplexVM1 && duplexVM1[1][duplexVM1[0]] || "",
                    duplexVal2 = duplexVM2 ? duplexVM2[1][duplexVM2[0]] : "";
                duplexFrom = duplexVM1
                duplexTo = duplexVM2
                setValues(duplexLen, duplexVal1, duplexVal2, true)
                if (duplexFrom) {
                    duplexFrom[1].$watch(duplexFrom[0], function(val) {
                        updateMsg()
                    })
                }
                if (duplexTo) {
                    duplexTo[1].$watch(duplexTo[0], function(val) {
                        updateMsg()
                    })
                }
            } 
            if (!duplexFrom) {
                options.inputFromValue = ""
            }
            if (!duplexTo) {
                options.inputToValue = ""
            }
        }
        // 根据参数个数进行日期的初始日期设置
        function setValues(len, from, to, init) {
            var fromValue = "",
                toValue = "",
                dateranpickerVM = vmodel ? vmodel : options

            if (len) {
                if (len==2) {
                    if (avalon.type(from) === "date") {
                        fromValue = formatDate(from)
                    } else {
                        fromValue = from && parseDate(from) && from || "";
                    }

                    if (avalon.type(to) === "date") {
                        toValue = formatDate(to)
                    } else {
                        if (init) {
                            toValue = to ? to : ""
                        } else {
                            toValue = to && parseDate(to) && to || ""
                        }
                    }
                    if (duplexFrom) {
                        duplexFrom[1][duplexFrom[0]] = fromValue
                    } else {
                        dateranpickerVM.inputFromValue = fromValue
                    }
                    if (duplexTo) {
                        duplexTo[1][duplexTo[0]] = toValue
                    } else {
                        dateranpickerVM.inputToValue = toValue
                    }

                    dateranpickerVM.label = datesDisplayFormat(dateranpickerVM.defaultLabel, fromValue, toValue)
                } else if(len==1){
                    if (avalon.type(from) === "date") {
                        fromValue = formatDate(from)
                    } else {
                        fromValue = from && parseDate(from) && from || ""
                    }

                    if (duplexFrom) {
                        duplexFrom[1][duplexFrom[0]] = fromValue
                    } else {
                        dateranpickerVM.inputFromValue = fromValue
                    }
                }
                toValue = toValue || (duplexTo ? duplexTo[1][duplexTo[0]] : dateranpickerVM.inputToValue)

                if(!fromValue && !toValue) { // 只要inputTo.value为null都提示不限日期
                    dateranpickerVM.label = "不限日期"
                }
            }
        }

        // 根据rules的设置确定结束日期可选的范围及默认值
        function applyRules(date) {
            var minDate = _toMinDate && parseDate(_toMinDate), 
                maxDate = _toMaxDate && parseDate(_toMaxDate),
                inputFromValue = duplexFrom ? duplexFrom[1][duplexFrom[0]] : vmodel.inputFromValue,
                inputToValue = duplexTo ? duplexTo[1][duplexTo[0]] : vmodel.inputToValue,
                rules = vmodel.rules,
                df = {},
                minDateRule,
                maxDateRule,
                initFromDate,
                inputToInitValue,
                initToDate,
                toMinDateFormat,
                inputToDate;
            if (!date) {
                if (element.init) {
                    initMsgAndOldValue()
                    element.init = false
                } else {
                    rules.toMinDate = minDate || ""
                    rules.toMaxDate = maxDate || ""
                }
                return
            }
            for (var i = 0 , type = ['defaultDate', 'minDate', 'maxDate'] ; i < type.length; i++) {
                if (rangeRules[i]) {
                    df[type[i]] = calcDate(rangeRules[i], date)
                }
            }
            minDateRule = df['minDate']
            maxDateRule = df['maxDate']
            minDate = (minDateRule ? minDateRule.getTime() : -1) > (minDate ? minDate.getTime() : -1) ? minDateRule : minDate
            maxDate = (maxDateRule ? maxDateRule.getTime() : Number.MAX_VALUE) > (maxDate ? maxDate.getTime() : Number.MAX_VALUE) ? maxDate : maxDateRule
            
            if (element.init) {
                initFromDate = parseDate(inputFromValue)
                inputToInitValue = duplexTo && duplexTo[1][duplexTo[0]] || ""
                initToDate = parseDate(inputToInitValue)
                if (initFromDate && inputToInitValue && !initToDate) {
                    inputToValue = formatDate(df["defaultDate"])
                }
            }
            if (minDate){
                toMinDateFormat = formatDate(minDate)
                if (!inputToValue && !element.init) {
                    inputToValue = toMinDateFormat
                }
            }
            inputToDate = inputToValue && parseDate(inputToValue)
            if (inputToDate && isDateDisabled(inputToDate, minDate, maxDate)) {
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
            if (element.init) {
                initMsgAndOldValue()
                vmodel.label = datesDisplayFormat(options.defaultLabel, inputFromValue, inputToValue)
                element.init = false
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
        // 解析rules.rules属性，得到正确的日期值
        function calcDate( desc , date ){
            var time,
                re = /([+-])?(\d+)([MDY])?/g,
                arr,
                key,
                _date;
            desc = ( desc || "" ).toString()
            
            arr = re.exec(desc)
            key = arr && ((arr[1] || '+') + (arr[3] || 'D'))
            time = date ? date : new Date()
            _date = new Date((typeof time === "string") ? parseDate(time) : time)
            if(key && _c[key]){
                _c[key](_date ,arr[2] * 1)
            }
            return _date
        }
        function initMsgAndOldValue() {
            var inputFromValue = duplexFrom ? duplexFrom[1][duplexFrom[0]] : vmodel.inputFromValue,
                inputToValue = duplexTo ? duplexTo[1][duplexTo[0]] : vmodel.inputToValue

            _oldValue = [parseDate(inputFromValue), parseDate(inputToValue)]
            if(vmodel.label) {
                updateMsg()
            }
        }
        // 根据选择的日期更新日历框下方的显示内容
        function updateMsg() {
            var inputFromValue = duplexFrom ? duplexFrom[1][duplexFrom[0]] : vmodel.inputFromValue,
                inputToValue = duplexTo ? duplexTo[1][duplexTo[0]] : vmodel.inputToValue,
                inputToDate = parseDate(inputToValue),
                msgFormat = options.opts && options.opts.msgFormat,
                inputFromDate = null,
                msg = "",
                day = 0

            if(inputToValue && !inputToDate) {
                if (duplexTo) {
                    duplexTo[1][duplexTo[0]] = ""
                } else {
                    vmodel.inputToValue = ""
                }
            } 
            if(inputToValue && (inputFromValue || fromSelected)) {
                inputFromDate = parseDate(inputFromValue) || fromSelected
                day = Math.floor(((inputToDate.getTime()-inputFromDate.getTime()))/1000/60/60/24 +1)
                if(msgFormat && typeof msgFormat === "function") {
                    if (inputFromVM && inputToVM) {
                        msg = msgFormat(inputFromVM, inputToVM)
                    }
                } else {
                    msg = "已选时间段："+inputFromValue+" 至 "+inputToValue+" 共计"+day+"天"
                } 
            } else {
                msg = ""     
            }
            vmodel.msg = msg
            fromSelected ? fromSelected = null : 0
        }
        vmodel.$watch("toggle", function(val) {
            var fromOldValue = formatDate(_oldValue && _oldValue[0] || ""),
                toOldValue = formatDate(_oldValue && _oldValue[1] || "")

            if(!val && !_confirmClick) {
                if (duplexTo && duplexTo[1][duplexTo[0]] != toOldValue) {
                    duplexTo[1][duplexTo[0]] = toOldValue
                } else if (!duplexTo && vmodel.inputToValue != toOldValue) {
                    vmodel.inputToValue = toOldValue
                }
                if (duplexFrom && duplexFrom[1][duplexFrom[0]] != fromOldValue) {
                    duplexFrom[1][duplexFrom[0]] = fromOldValue
                } else if (!duplexFrom && vmodel.inputFromValue != fromOldValue) {
                    vmodel.inputFromValue = fromOldValue
                }
            } else if(_confirmClick){
                _confirmClick = false
            }
            inputFromVM.toggle = val
            inputToVM.toggle = val
            if (val) {
                avalon.type(vmodel.onOpen) === "function" && vmodel.onOpen(vmodel)
            } else {
                avalon.type(vmodel.onClose) === "function" && vmodel.onClose(vmodel)
            }
        })
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
        fromLabel : '选择起始日期', //@config 设置起始日期日历框的说明文字
        toLabel : '选择结束日期', //@config 设置结束日期日历框的说明文字
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
        label: "", //@config 模拟输入域的初始说明文字
        defaultLabel: "日期范围", //@config 选中日期之后，模拟输入域开始的说明文字
        disabled: false, //@config 设置是否禁用组件
        widgetElement: "", // accordion容器
        separator: "-", //@config 日期格式的分隔符，可以是"/"或者你希望的符号，但如果是除了"-"和"/"之外的字符则需要和parseDate和formatDate配合使用，以便组件能正常运作
        startDay: 1,    //@config 设置每一周的第一天是哪天，0代表Sunday，1代表Monday，依次类推, 默认从周一开始
        dateRangeWidth: 260, //@config 配置日期范围框的宽度
        shortcut: false, //@config 是否在组件中显示日期选择快捷按钮
        /**
         * @config {Function} 打开daterangepicker的回调
         * @param vmodel {Object} 组件对应的Vmodel
         */
        onOpen: avalon.noop,
        /**
         * @config {Function} 关闭daterangepicker的回调
         * @param vmodel {Object} 组件对应的Vmodel
         */
        onClose: avalon.noop,
        /**
         * @config {Function} 点击日期范围框下方的确定按钮之后的回调
         * @param inputFromDate {String} 选择的起始日期
         * @param inputToDate {String} 选择的结束日期
         * @param oldValue {Array} 最近一次选中的起始和结束日期组成的数组
         * @param vmodel {Object} 组件对应的Vmodel
         * @param data {Object} 绑定组件元素上的data属性集合
         */
        onSelect: avalon.noop, 
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
            return year + separator + this.formatNum( month + 1 , 2 ) + separator + this.formatNum( day , 2 )
        },
        formatNum: function(n , length){
            n = String(n)
            for( var i = 0 , len = length - n.length ; i < len ; i++)
                n = "0" + n
            return n
        },
        /**
         * @config {Function} 配置日期范围框的显示格式
         * @param label {String} 日期范围提示文字
         * @param fromDate {String} 起始日期
         * @param toDate {String} 结束日期 
         * @returns {String} 日期范围框要显示的内容
         */
        datesDisplayFormat: function(label, fromDate, toDate) {
            if (!fromDate && !toDate) {
                return "不限日期"
            }
            return label + "：" + fromDate + ' 至 ' + toDate
        },
        getTemplate: function(str, options) {
            return str
        }
    }
    return avalon
})
/**
 @links
 [基本配置的日期范围框，设置其初始说明文字、起始日历说明文字、结束日历说明文字](avalon.daterangepicker.ex1.html)
 [配置日期范围框每一周第一天从周日开始、选择框下方说明文字显示内容](avalon.daterangepicker.ex2.html)
 [初始化起始日期结束日期、各种方式切换禁用日历组件](avalon.daterangepicker.ex3.html)
 [初始日期和截止日期之间的最小相隔天数和最大相隔天数、最小日期可选日期、最大可选日期](avalon.daterangepicker.ex4.html)
 [自定义日期范围框解析和显示规则](avalon.daterangepicker.ex5.html)
 [日期的onSelect回调、初始值为null的处理、setDates修正日期、setLabel修正提示文字](avalon.daterangepicker.ex6.html)
 */