define(["avalon.getModel","text!./avalon.daterangepicker.html", "datepicker/avalon.datepicker"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""],  
        calendarTemplate = arr[0],
        cssText = arr[1].replace(/<\/?style>/g, ""), // 组件的css
        styleEl = document.getElementById("avalonStyle");
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    var widget = avalon.ui.daterangepicker = function(element, data, vmodels) {
        var options = data.daterangepickerOptions,
            inputFrom,
            inputTo,
            disabled = options.disabled.toString(),
            disabledVM = avalon.getModel(disabled, vmodels),
            duplex = options.duplex && options.duplex.split(","),
            rules = options.rules,
            selectFuncVM = typeof options.select ==="string" ? avalon.getModel(options.select, vmodels) : null,
            _confirmClick = false,
            _oldValue,
            _toMinDate = "",
            _toMaxDate = "";
        var _c = {  
            '+M': function(time ,n) {

                var _d = time.getDate();
                time.setMonth(time.getMonth() + n);
                if(time.getDate() !== _d) {
                    time.setDate(0)
                } 
            },
            '-M': function(time ,n) { 
                var _d = time.getDate();
                time.setMonth(time.getMonth() - n);
                if(time.getDate() !== _d) {
                    time.setDate(0)
                }
            },
            '+D': function(time ,n) { 
                time.setDate(time.getDate() + n); 
            },
            '-D': function(time ,n) { 
                time.setDate(time.getDate() - n); 
            },
            '+Y': function(time ,n) { 
                time.setFullYear(time.getFullYear() + n); 
            },
            '-Y': function(time ,n) { 
                time.setFullYear(time.getFullYear() - n); 
            }
        };
        options.template = options.getTemplate(calendarTemplate, options);
        if(options.opts && options.opts.datesDisplayFormat && typeof options.opts.datesDisplayFormat ==="function") {
            options.datesDisplayFormat = options.opts.datesDisplayFormat;
        }
        if(rules && avalon.type(rules) === 'string') {
            var ruleVM = avalon.getModel(options.rules, vmodels);
            rules = ruleVM[1][ruleVM[0]];
            
        }
        rules = rules.$model || rules;
        _toMinDate = rules.toMinDate; 
        _toMaxDate = rules.toMaxDate; 
        if(rules) {
            rules.toMinDate = rules.toMinDate && "";
            rules.toMaxDate = rules.toMaxDate && "";
            rules.fromMaxDate = rules.fromMaxDate && "";
            rules.fromMaxDate = rules.fromMaxDate && "";
        }

        options.rules = rules;
        if(selectFuncVM) {
            options.select = selectFuncVM[1][selectFuncVM[0]];
        }
        if(disabled!=="true" && disabled!=="false" && disabledVM) {
            options.disabled = disabledVM[1][disabledVM[0]];
            disabledVM[1].$watch(disabledVM[0], function(val) {
                vmodel.disabled = val;
            })
        }
        var rangeRules = options.rules && options.rules.rules || "";
        rangeRules = rangeRules.length>0 ? rangeRules.split(",") : [];
        
        var vmodel = avalon.define(data.daterangepickerId, function(vm) {
            avalon.mix(vm, options);
            vm.msg = "";
            vm.$skipArray = ["widgetElement","container","inputElement","calendarWrapper"];
            vm.widgetElement = element;
            vm.toggle = false;
            vm.container = null;
            vm.inputElement = null;
            vm.calendarWrapper = null;
            vm.value = "";
            vm.inputFromValue = ""
            vm.inputToValue = "";
            vm._toggleDatepicker = function(val, event) {
                if(!vmodel.disabled) {
                    vmodel.toggle = !val;
                }
            }
            vm._updateMsg = function(event) {
                var target = event.target;
                if(target.tagName === "TD") {
                    updateMsg();
                }
            }
            vm._selectDate = function() {
                var inputFromValue = inputFrom.value,
                    inputToValue = inputTo.value,
                    inputFromDate = options.parseDate(inputFromValue),
                    inputToDate = options.parseDate(inputToValue);
                vmodel.label = options.datesDisplayFormat(options.defaultLabel,inputFromValue, inputToValue);
                _confirmClick = true;
                vmodel.toggle = false;
                options.select.call(vmodel, inputFromDate, inputToDate, _oldValue, vmodel, avalon(element).data());
                _oldValue = [inputFromDate, inputToDate];
            }
            vm._cancelSelectDate = function() {
                vmodel.toggle ? vmodel.toggle = false: 0;
                
            }
            vm.setDates = function(from, to, defaultLabel) {
                var inputValues = to === void 0 ? [from] : [from, to],
                    len = inputValues.length;
                if(len) {
                    vmodel.defaultLabel = defaultLabel;
                    setValues(len, from, to);
                } else {
                    vmodel.label = "";
                }
                initMsgAndOldValue();
            }
            vm.setLabel = function(str) {
                vmodel.label = str;
            }
            vm.setDisabled = function(val) {
                vmodel.disabled = val;
            }
            vm.fromSelectCal = function(date) {
                applyRules(date);
            }
            vm.$init = function() {
                var daterangepicker = avalon.parseHTML(options.template).firstChild,
                    inputs = daterangepicker.getElementsByTagName("input"),
                    container = daterangepicker.children[0],
                    calendarWrapper = daterangepicker.children[1];
                inputFrom = inputs[0];
                inputTo = inputs[1];
                vmodel.container = container; 
                vmodel.inputElement = container;
                vmodel.calendarWrapper = calendarWrapper;   
                element.appendChild(daterangepicker);
                initValues();
                applyRules(vmodel.inputFromValue && options.parseDate(vmodel.inputFromValue) || new Date());
                avalon.scan(element, [vmodel].concat(vmodels)); 
                // 扫描完daterangepicker组件之后才扫描datepicker
                avalon.nextTick(function() {
                    inputFrom.setAttribute("ms-widget", "datepicker");
                    inputTo.setAttribute("ms-widget", "datepicker");
                    inputFrom.setAttribute("ms-duplex", "inputFromValue");
                    inputTo.setAttribute("ms-duplex", "inputToValue");
                    inputFrom.setAttribute("data-toggle", "toggle");
                    inputTo.setAttribute("data-toggle","toggle");
                    avalon.scan(inputFrom, [vmodel]);
                    avalon.scan(inputTo, [vmodel]);
                })
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = "";
            }
        })
        function initValues() {
            if(duplex) {
                var duplexLen = duplex.length,
                    duplexVM1 = avalon.getModel(duplex[0].trim(), vmodels),
                    duplexVM2 = duplexLen === 1 ? null : avalon.getModel(duplex[1].trim(), vmodels),
                    duplexVal1 = duplexVM1[1][duplexVM1[0]],
                    duplexVal2 = duplexVM2 ? duplexVM2[1][duplexVM2[0]] : "";
                setValues(duplexLen, duplexVal1, duplexVal2);
                vmodel.label =  options.label ? options.label : vmodel.label;
                initMsgAndOldValue();
            } 
        }
        function setValues(len, from, to) {
            if(len) {
                if(len==2) {
                    vmodel.inputFromValue = inputFrom.value = from && options.parseDate(from) && from || "";
                    vmodel.inputToValue = inputTo.value = to && options.parseDate(to) && to || "";

                    vmodel.label = options.datesDisplayFormat(options.defaultLabel,vmodel.inputFromValue, vmodel.inputToValue);
                } else if(len==1){
                    vmodel.inputFromValue = inputFrom.value = from && options.parseDate(from) && from || "";
                }
                if(!vmodel.inputToValue) { // 只要inputTo.value为null都提示不限日期
                    vmodel.label = "不限日期";
                }
            }
        }
        function applyRules(date) {
            var df = {},
                rules = vmodel.rules;
            for(var i = 0 , type = ['defaultDate', 'minDate', 'maxDate'] ; i < type.length ; i++){
                if (rangeRules[i]) {
                    df[type[i]] = calcDate(rangeRules[i], date);
                }
            }
            var minDate = _toMinDate && options.parseDate(_toMinDate), 
                maxDate = _toMaxDate && options.parseDate(_toMaxDate),
                minDateRule = df['minDate'],
                maxDateRule = df['maxDate'];
            minDate = (minDateRule ? minDateRule.getTime() : -1) > (minDate ? minDate.getTime() : -1) ? minDateRule : minDate ;
            maxDate = (maxDateRule ? maxDateRule.getTime() : Number.MAX_VALUE) > (maxDate ? maxDate.getTime() : Number.MAX_VALUE) ? maxDate : maxDateRule;
            if (minDate){
                vmodel.rules.toMinDate = options.formatDate(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
            }
            if (maxDate) {
                vmodel.rules.toMaxDate = options.formatDate(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
            }
        }
        function calcDate( desc , date ){
            var time;
            desc = ( desc || "" ).toString();
            time = date ? date : new Date();
            var _date = new Date(time);
            var re = /([+-])?(\d+)([MDY])?/g , 
                arr = re.exec(desc),
                key = arr && ((arr[1] || '+') + (arr[3] || 'D'));
            if(key && _c[key]){
                _c[key](_date ,arr[2] * 1);
            }
            return _date;
        }
        function initMsgAndOldValue() {
            _oldValue = [options.parseDate(inputFrom.value), options.parseDate(inputTo.value)];

            if(vmodel.label) {
                updateMsg();
            }
        }
        function updateMsg() {
            var msg = "",
                day = 0,
                inputToDate = options.parseDate(inputTo.value),
                msgFormat = options.opts && options.opts.msgFormat;
            if(inputTo.value && !inputToDate) {
                vmodel.inputToValue = "";
            } 
            if(inputTo.value && inputFrom.value) {
                day = Math.floor(((inputToDate.getTime()-options.parseDate(inputFrom.value).getTime()))/1000/60/60/24 +1);
                if(msgFormat && typeof msgFormat === "function") {
                    var from = {
                            getRawValue: function() {
                                return inputFrom.value;
                            },
                            getDate: function() {
                                return options.parseDate(inputFrom.value) || cleanDate(new Date());
                            }
                        },
                        to = {
                            getRawValue: function() {
                                return inputTo.value;
                            },
                            getDate: function() {
                                return inputToDate;
                            }
                        };
                    msg = options.opts.msgFormat(from, to);
                } else {
                    msg = "已选时间段："+inputFrom.value+" 至 "+inputTo.value+" 共计"+day+"天";
                }
                vmodel.msg = msg;
            }
        }
        function cleanDate( date ){
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        }
        vmodel.$watch("toggle", function(val) {
            if(!val && !_confirmClick) {
                inputFrom.value = vmodel.inputFromValue;
                inputTo.value = vmodel.inputToValue;
            } else if(_confirmClick){
                vmodel.inputFromValue = inputFrom.value;
                vmodel.inputToValue = inputTo.value;
                _confirmClick = false;
            }
        })
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        fromLabel : '选择起始日期',
        toLabel : '选择结束日期',
        fromName : 'fromDate',
        toName : 'toDate',
        rules: "",
        msg: "",
        label: "", //范围选择框的日历说明
        defaultLabel: "日期范围",
        disabled: false,
        widgetElement: "", // accordion容器
        separator: "-",
        startDay: 1,    //星期开始时间
        select: avalon.noop, //点击确定按钮选择日期后的回调
        parseDate : function( str ){
            var separator = this.separator;
            var reg = "^(\\d{4})" + separator+ "(\\d{1,2})"+ separator+"(\\d{1,2})$";
            reg = new RegExp(reg);
            var x = str.match(reg);
            return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null;
        },
        formatDate : function( year, month, day ){
            var separator = this.separator;
            return year + separator + formatNum( month + 1 , 2 ) + separator + formatNum( day , 2 );
        },
        datesDisplayFormat: function(label, fromDate, toDate) {
            return label + "：" + fromDate + ' 至 ' + toDate;
        },
        getTemplate: function(str, options) {
            return str;
        }
    }
    function formatNum ( n , length ){
        n = String(n);
        for( var i = 0 , len = length - n.length ; i < len ; i++)
            n = "0" + n;
        return n;
    }
    return avalon;
})