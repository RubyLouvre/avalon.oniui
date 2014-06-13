define(["avalon.getModel", "text!./avalon.datepicker.html"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""],  
        calendarTemplate = arr[0],
        cssText = arr[1].replace(/<\/?style>/g, ""), // 组件的css
        styleEl = document.getElementById("avalonStyle");
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    var widget = avalon.ui.datepicker = function(element, data, vmodels) {
        var options = data.datepickerOptions;
        options.template = options.getTemplate(calendarTemplate, options);
        var minDate = validateDate(options.minDate); 
        var maxDate = validateDate(options.maxDate);
        var msDuplexName = element.msData["ms-duplex"];
        var  _value, msDisabledName = element.msData["ms-disabled"], msDisabled, duplexVM, vmSub;

        if (msDuplexName) {
            duplexVM = avalon.getModel(msDuplexName, vmodels);
            if(duplexVM) {
                var value = duplexVM[1][duplexVM[0]];
                var date ;
                duplexVM[1].$watch(duplexVM[0], function(val) {
                    if(date=options.parseDate(val)) {
                        year = vmodel.year = date.getFullYear();
                        month = vmodel.month = date.getMonth();
                        vmodel.day = date.getDate();
                        _value = element.value = val;
                        if(vmodel.toggle) {
                            vmodel.rows = calendarDays(month, year);
                        }
                    }
                })
            }
            _value = element.value = value;
        }
        if (msDisabledName) {
            vmSub = avalon.getModel(msDisabledName, vmodels);
            if(vmSub) {
                msDisabled = vmSub[1][vmSub[0]];
                vmSub[1].$watch(vmSub[0], function(val) {
                    if(vmodel) {
                        vmodel.disabled = val;
                    }
                })
            }
        }
        options.minDate = minDate && cleanDate(minDate);
        options.maxDate = maxDate && cleanDate(maxDate);
        options.disabled = msDisabled || options.disabled || element.disabled;

        msDisabledName ? vmSub[1][vmSub[0]] = options.disabled : 0; //如果msDisabled为false可以能取自配置项或者元素的disabled属性，需要重置一下msDisabled
        var day, month, year, _originValue;// 手动输入时keydown的辅助值;
        var date = _getDate();
        month = date.getMonth();
        year = date.getFullYear();
        day = date.getDate();
        element.value = _originValue && options.formatDate(year, month, day);
        var vmodel = avalon.define(data.datepickerId, function(vm) {
            avalon.mix(vm, options);
            vm.elementLeft = 0;
            vm.elementTop = 0;
            vm.weekNames = [];
            vm.rows = [];
            vm.widgetElement = element;
            vm.date = date;
            vm.prevMonth = -1; //控制prev class是否禁用
            vm.nextMonth = -1; //控制next class是否禁用
            vm.month = month;
            vm.year = year;
            vm.day = day;
            vm._selectDate = function(year, month, day, dateDisabled) {
                if(month !== false && !dateDisabled) {
                    var formatDate = options.formatDate.bind(options);
                    var date = formatDate(year, month, day);
                    element.value = date;
                    vmodel.toggle = false;
                    vmodel.day = day;
                }
            }
            vm._prev = function(prevFlag) {
                if(!prevFlag) {
                    return false;
                }
                toggleMonth("prev");
            }
            vm._next = function(nextFlag) {
                if(!nextFlag) {
                    return false;
                }
                toggleMonth("next");
            }
            vm.$init = function() {
                var calendar = avalon.parseHTML(calendarTemplate).firstChild;
                var year = vmodel.year;
                var month = vmodel.month;
                document.body.appendChild(calendar);
                bindEvents(calendar)
                getElementPosition();
                if(!options.allowBlank && !_originValue) {
                    element.value = options.formatDate(year,month,vmodel.day);
                }
                avalon(element).attr("name", options.name);
                vmodel.weekNames = calendarHeader();
                _value = element.value;
                element.disabled = options.disabled;
                avalon.scan(calendar, [vmodel].concat(vmodels))
            }
            vm.$remove = function() {

            }
            
        });
        vmodel.$watch("toggle", function(val) {
            if(val) {
                _value = element.value;
                vmodel.rows = calendarDays(vmodel.month, vmodel.year);
            }
        })
        vmodel.$watch("disabled", function(val) {
            if(msDisabledName) {
                vmSub[1][vmSub[0]] = val;
            }
            element.disabled = val;
        })
        function cleanDate( date ){
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        }
        function isDateDisabled( date ){
            
            var time = date.getTime(),
                minDate = options.minDate,
                maxDate = options.maxDate;
            if(minDate && time < minDate.getTime()){
                return true;
            } else if(maxDate && time > maxDate.getTime()) {
                return true;
            }
            return false;
        }
        function bindEvents(calendar) {
            avalon.bind(element, "focus", function() {
                vmodel.toggle = true;
            })
            avalon.bind(document, "click", function(e) {
                if(!calendar.contains(e.target) && element!==e.target && vmodel.toggle) {
                    vmodel.toggle = false;
                }
            })
            avalon.bind(element, "change", function() {
                if(msDuplexName) {
                    duplexVM[1][duplexVM[0]] = element.value;
                }
            })
            avalon.bind(element, "keydown", function(e) {
                var keyCode = e.keyCode, date, year, month, value, operate;
                if(keyCode === 189) {
                    operate = "-";
                } else if(keyCode === 191) {
                    operate = "/";
                }
                if(!vmodel.toggle) {
                    vmodel.toggle = true;
                }
                value = element.value;
                if((keyCode<48 || keyCode>57) && keyCode !==13 && keyCode!==8 && options.separator !== operate && keyCode !== 27 && keyCode !== 9) {
                    e.preventDefault();
                    return false;
                } else if(keyCode >= 48 && keyCode <= 57 || options.separator === operate){
                    value = value+String.fromCharCode(keyCode);
                }
                if(keyCode === 13 || keyCode==27 || keyCode==9) {
                    vmodel.toggle = false;
                    return false;
                }
                if(keyCode === 8) {
                    value = value.slice(0, value.length-1);
                }
                if(date=options.parseDate(value)) {
                    year = vmodel.year = date.getFullYear();
                    month = vmodel.month = date.getMonth();
                    vmodel.day = date.getDate();
                    _value = value;
                    vmodel.rows = calendarDays(month, year);
                }
                
            })
        }
        function toggleMonth(operate) {
            var month = 0, year=0;
            if(operate === "next") {
                month = vmodel.month + options.stepMonths;
            } else {
                month = vmodel.month - options.stepMonths;
            }
            var firstDayOfNextMonth = new Date(vmodel.year, month, 1);
            year = vmodel.year = firstDayOfNextMonth.getFullYear();   
            month = vmodel.month = firstDayOfNextMonth.getMonth();
            vmodel.day = -1;
            _value = element.value;
            vmodel.rows = calendarDays(month, year);  
        }
        function calendarHeader() {
            var weekNames = [],
                startDay = options.startDay;
            for(var j = 0 , w = options.dayNames ; j < 7 ; j++){
                var n = ( j + startDay ) % 7;
                weekNames.push(w[n]);
            }
            return weekNames;
        }
        function calendarDays (month, year) {
            var startDay = options.startDay,
                firstDayOfMonth = new Date(year, month , 1),
                stepMonths = options.stepMonths,
                minDate = options.minDate,
                maxDate = options.maxDate,
                showOtherMonths = options.showOtherMonths,
                days = [],
                cellDate = _cellDate =  new Date(year , month , 1 - ( firstDayOfMonth.getDay() - startDay + 7 ) % 7 ),
                rows = [];
            var exitLoop = false;
            var prev = minDate ? (year-minDate.getFullYear())*12+month-minDate.getMonth() : true;
            var next = maxDate ? (maxDate.getFullYear()-year)*12+maxDate.getMonth()-month : true;

            vmodel.prevMonth = prev;
            vmodel.nextMonth = next;
            for (var m=0; m<6; m++) {
                days = [];
                for(var n = 0 ; n < 7 ; n++){
                    var isCurrentMonth = cellDate.getMonth() === firstDayOfMonth.getMonth() && cellDate.getFullYear() === firstDayOfMonth.getFullYear();
                    var now = new Date();
                    var selected = false;
                    var dateMonth = 0;
                    // showOtherMonths为true时cellDate不变，为false时，如果不是当前月日期则cellDate为null
                    cellDate = showOtherMonths || isCurrentMonth ? cellDate : null; 
                    dateMonth = _cellDate.getMonth();
                    
                    if(!cellDate) { // showOtherMonths为false且非当前月日期
                        if(m>= 4 && (_cellDate.getFullYear() > year || _cellDate.getMonth() > month)) { // 下月日期
                            exitLoop = true;
                            break;
                        } else { // 上月日期
                            cellDate = _cellDate = new Date(_cellDate.setDate(_cellDate.getDate()+1));
                            days.push({day:void 0, month: false, weekend: false, selected:false,dateDisabled: true});
                            continue;
                        }
                    }
                    var day = _cellDate.getDate();
                    var weekDay = cellDate.getDay();
                    var weekend = weekDay%7==0 || weekDay%7==6;

                    if(vmodel.day === day && _value && options.parseDate(_value)) {
                        selected = true;
                    }
                    // showOtherMonths为true，且为下月日期时，退出总循环
                    if(showOtherMonths && m>= 4 && (_cellDate.getFullYear() > year || dateMonth > month)) {
                        exitLoop = true;
                        break;
                    }
                    var dateDisabled = isDateDisabled(_cellDate);
                    days.push({day:day, month: dateMonth, weekend: weekend, selected: selected, dateDisabled: dateDisabled});
                    cellDate = _cellDate = new Date(cellDate.setDate(day+1));
                } 
                rows.push(days); 
                if(exitLoop) {
                    break;
                }
            }
            return rows;
        }

        function getElementPosition() {
            var elementOffset = avalon(element).offset();
            vmodel.elementLeft = elementOffset.left;
            vmodel.elementTop = elementOffset.top + avalon(element).outerHeight();
        }
        function validateDate(date) {
            if(typeof date =="string") {
                return options.parseDate(date);
            } else {
                return date;
            }
        }
        function _getDate() {
            _originValue = element.value;
            var date = _originValue;
            date = validateDate(date);
            if(!date) {
                _originValue = "";
                date = cleanDate(new Date());
            }
            if(isDateDisabled(date)) {
                if(options.minDate || options.maxDate) {
                    return options.minDate || options.maxDate;
                }
            }
            return date && cleanDate(date);
        }
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        dayNames : ['日', '一', '二', '三', '四', '五', '六'],
        renderTo: "",
        name : '',
        label : '',
        startDay: 1,
        showOtherMonths: false,
        numberOfMonths: 1,
        correctOnError: true,
        allowBlank : false,
        minDate : null,
        maxDate : null,
        stepMonths : 1,
        toggle: false,
        separator: "-",
        calendarLabel: "选择日期",
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
        widgetElement: "", // accordion容器
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
