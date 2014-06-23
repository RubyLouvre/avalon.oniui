define(["avalon.getModel", "datepicker/avalon.datepicker.lang","text!./avalon.datepicker.html", "dropdown/avalon.dropdown.js"], function(avalon, holidayDate, sourceHTML) {
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
        var options = data.datepickerOptions,
            minDate = validateDate(options.minDate), 
            maxDate = validateDate(options.maxDate),
            msDuplexName = element.msData["ms-duplex"],
            _value, // 单日历选择框时input输入域的初始值
            msDisabledName = element.msData["ms-disabled"], 
            msDisabled, 
            duplexVM = msDuplexName && avalon.getModel(msDuplexName, vmodels), //ms-duplex绑定值所在的vmodel及对应绑定值组成的数组
            vmSub = msDisabledName && avalon.getModel(msDisabledName, vmodels), //ms-disabled绑定值所在的vmodel及对应绑定值组成的数组
            msToggle = element.getAttribute("data-toggle") || element.msData["ms-toggle"],
            toggleVM = msToggle && avalon.getModel(msToggle, vmodels),
            minDateVM,
            maxDateVm;
        options.template = options.getTemplate(calendarTemplate, options);
        if (duplexVM) {
            var value = duplexVM[1][duplexVM[0]];
            var date ;
            duplexVM[1].$watch(duplexVM[0], function(val) {
                if(date=options.parseDate(val)) {
                    year = vmodel.year = date.getFullYear();
                    month = vmodel.month = date.getMonth();
                    vmodel.day = date.getDate();
                    _value = element.value = val;
                    vmodel.rows = calendarDays(month, year);
                }
            })
            _value = element.value = value;
        }
        
        if(vmSub) {
            msDisabled = vmSub[1][vmSub[0]];
            vmSub[1].$watch(vmSub[0], function(val) {
                if(vmodel) {
                    vmodel.disabled = val;
                }
            })
        }
        if (toggleVM) {
            toggleVM[1].$watch(toggleVM[0], function(val) {
                vmodel.toggle = val;
            })  
        }
        console.log("options.minDate is : ");
        console.log(options.minDate);
        console.log("options.maxDate is : ");
        console.log(options.maxDate);
        
        if(options.minDate && !minDate) {
            minDateVM = avalon.getModel(options.minDate, vmodels);
            if(minDateVM) {
                minDateVM[1].$watch(minDateVM[0], function(val) {
                    vmodel.minDate = val;
                })
                minDate = validateDate(minDateVM[1][minDateVM[0]]);
            }
        } 
        if(options.maxDate && !maxDate) {
            maxDateVM = avalon.getModel(options.maxDate, vmodels);
            if(maxDateVM) {
                maxDateVM[1].$watch(maxDateVM[0], function(val) {
                    vmodel.maxDate = val;
                })
                maxDate = validateDate(maxDateVM[1][maxDateVM[0]]);
            }
        }
        if(typeof options.change === "string") {
            var changeVM = avalon.getModel(options.change, vmodels);
            options.change = changeVM[1][changeVM[0]];
        }
        console.log("minDate is : ")
        console.log(minDate);
        console.log("maxDate is : ")
        console.log(maxDate);
        options.minDate = minDate && cleanDate(minDate);
        options.maxDate = maxDate && cleanDate(maxDate);
        options.toggle = toggleVM && toggleVM[1][toggleVM[0]] || options.toggle;
        // disabled属性取自msDisabled，msDisabled为false时取配置项disabled，如果配置项仍为false，则取element的disabled属性
        options.disabled = msDisabled || options.disabled || element.disabled;
        msDisabledName ? vmSub[1][vmSub[0]] = options.disabled : 0;
        var day, month, year, _originValue,// 手动输入时keydown的辅助值;
            date = _getDate(); //获取datepicker的初始选择日期
        month = date.getMonth();
        year = date.getFullYear();
        day = date.getDate();
        
        // 如果输入域初始值存在则验证其是否符合日期显示规则，不符合设element.value为null
        element.value = _originValue && options.formatDate(year, month, day);
        var vmodel = avalon.define(data.datepickerId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["container"];
            vm.elementLeft = 0;
            vm.elementTop = 0;
            vm.weekNames = [];
            vm.rows = [];
            vm.widgetElement = element;
            //vm.date = date;
            vm.data = [];
            vm.prevMonth = -1; //控制prev class是否禁用
            vm.nextMonth = -1; //控制next class是否禁用
            vm.month = month;
            vm.year = year;
            vm.day = day;
            vm.years = [2013,2014, 2015, 2016];
            vm.calendars = [1,2,3];
            vm.months = [1,2,3,4,5,6,7,8,9,10,11,12];
            vm.$opts = {
                width: 60,
                listWidth: 60,
                onSelect: function(e, listNode) {
                    e.stopPropagation();
                }
            }
            // 年份选择器渲染ok之后为其绑定dropdown组件并扫描渲染出dropdown
            vm._afterYearRendered = function() {
                this.setAttribute("ms-widget", "dropdown,$,$opts");
                this.setAttribute("ms-duplex", "year");
                avalon.scan(this, vmodel);
            }
            // 月份选择器渲染ok之为其绑定dropdown组件并扫描渲染出dropdown
            vm._afterMonthRendered = function() {
                this.setAttribute("ms-widget", "dropdown,$,$opts");
                this.setAttribute("ms-duplex", "month");
                avalon.scan(this, vmodel);
            }
            // 选择日期
            vm._selectDate = function(year, month, day, dateDisabled, outerIndex, innerIndex) {
                if(month !== false && !dateDisabled) {
                    var formatDate = options.formatDate.bind(options),
                        date = formatDate(year, month, day),
                        calendarWrapper = options.type ==="range" ? element["data-calenderwrapper"] : null;
                    element.value = date;
                    if(!calendarWrapper) {
                        vmodel.toggle = false;
                    } else { // range datepicker时需要切换选中日期项的类名
                        var colSelectFlag = false,
                            rows = vmodel.rows;
                        if(rows[outerIndex][innerIndex].selected) {
                            return ;
                        }
                        for(var i=0, len=rows.length; i<len;i++) {
                            var cols = rows[i];
                            for(var j=0, colLen = cols.length; j<colLen;j++) {
                                var colSelect = cols[j].selected;
                                if(colSelect) {
                                    cols[j].selected = false;
                                    colSelectFlag = true;
                                    break;
                                }
                            }
                            if(colSelectFlag) {
                                break;
                            }
                        }
                        vmodel.rows[outerIndex][innerIndex].selected = true;
                    }
                    vmodel.day = day;
                    vmodel.change.call(null, options.parseDate(date), data["datepickerId"], avalon(element).data())
                }
            }
            // 点击prev按钮切换到当前月的上个月，如当前月存在minDate则prev按钮点击无效
            vm._prev = function(prevFlag) {
                if(!prevFlag) {
                    return false;
                }
                toggleMonth("prev");
            }
            // 点击next按钮切换到当前月的下一个月，如果当前月存在maxDate则next按钮点击无效
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
                element.parentNode.appendChild(calendar);
                bindEvents(calendar)
                getElementPosition(calendar);
                // 如果输入域不允许为空，且_originValue不存在则强制更新element.value
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
        vmodel.$watch("year", function(year) {
            vmodel.rows = calendarDays(vmodel.month, year);
        })
        vmodel.$watch("month", function(month) {
            vmodel.rows = calendarDays(month, vmodel.year);
        })
        // 这里的处理使得设置外部disabled或者组件VM的disabled同步
        vmodel.$watch("disabled", function(val) {
            if(msDisabledName) {
                vmSub[1][vmSub[0]] = val;
            }
            element.disabled = val;
        })
        vmodel.$watch("minDate", function(val) {
            var minDate = validateDate(val);
            vmodel.minDate = minDate && cleanDate(minDate);
            vmodel.rows = calendarDays(vmodel.month, vmodel.year);
        })
        vmodel.$watch("maxDate", function(val) {
            var maxDate = validateDate(val);
            vmodel.maxDate = maxDate && cleanDate(maxDate);
            vmodel.rows = calendarDays(vmodel.month, vmodel.year);
        })
        function cleanDate( date ){
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        }
        // 根据minDate和maxDate的设置判断给定的日期是否不可选
        function isDateDisabled(date, vmodel){
            var time = date.getTime(),
                minDate = vmodel.minDate,
                maxDate = vmodel.maxDate;
            if(minDate && time < minDate.getTime()){
                return true;
            } else if(maxDate && time > maxDate.getTime()) {
                return true;
            }
            return false;
        }
        // 初始化时绑定各种回调
        function bindEvents(calendar) {
            // focus Input元素时显示日历组件
            avalon.bind(element, "focus", function() {
                vmodel.toggle = true;
            })
            // 切换日期年月或者点击input输入域时不隐藏组件，选择日期或者点击文档的其他地方则隐藏日历组件
            avalon.bind(document, "click", function(e) {
                var target = e.target,
                    type = options.type;
                if(options.type==="range" && (element["data-container"].contains(target) || element["data-calenderwrapper"].contains(target))) {
                    return ;
                } 
                if(!calendar.contains(target) && element!==target && vmodel.toggle) {
                    vmodel.toggle = false;
                    toggleVM ? toggleVM[1][toggleVM[0]] = false : 0;
                    return ;
                }
            })
            // 输入域的值改变之后相应的更新外部的ms-duplex绑定值
            avalon.bind(element, "change", function() {
                if(msDuplexName) {
                    duplexVM[1][duplexVM[0]] = element.value;
                }
                
            })
            // 处理用户的输入
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
        // 通过prev、next按钮切换月份
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
            _value = element.value;
            vmodel.rows = calendarDays(month, year);  
        }
        // 日历头部的显示名
        function calendarHeader() {
            var weekNames = [],
                startDay = options.startDay;
            for(var j = 0 , w = options.dayNames ; j < 7 ; j++){
                var n = ( j + startDay ) % 7;
                weekNames.push(w[n]);
            }
            return weekNames;
        }
        // 根据month、year得到要显示的日期数据
        function calendarDays (month, year) {
            var startDay = options.startDay,
                firstDayOfMonth = new Date(year, month , 1),
                stepMonths = options.stepMonths,
                minDate = vmodel.minDate,
                maxDate = vmodel.maxDate,
                showOtherMonths = options.showOtherMonths,
                days = [],
                cellDate = _cellDate =  new Date(year , month , 1 - ( firstDayOfMonth.getDay() - startDay + 7 ) % 7 ),
                rows = [],
                valueDate = options.parseDate(_value);
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
                    
                    if(valueDate) {
                        if(valueDate.getDate() === day && _value && dateMonth===valueDate.getMonth() && _cellDate.getFullYear()===valueDate.getFullYear()) {
                            selected = true;
                        }
                    }

                    // showOtherMonths为true，且为下月日期时，退出总循环
                    if(showOtherMonths && m>= 4 && (_cellDate.getFullYear() > year || dateMonth > month)) {
                        exitLoop = true;
                        break;
                    }
                    var dateDisabled = isDateDisabled(_cellDate, vmodel);
                    days.push({day:day, month: dateMonth, weekend: weekend, selected: selected, dateDisabled: dateDisabled, outerIndex: m, innerIndex: n});
                    cellDate = _cellDate = new Date(cellDate.setDate(day+1));
                } 
                rows.push(days); 
                if(exitLoop) {
                    break;
                }
            }
            return rows;
        }
        // 获取输入域相对于文档的位置坐标，并设置日历组件的位置
        function getElementPosition(calendar) {
            var $element = null,
                $calendarWrapper = null,
                parentposition = "",
                parentNode = null,
                elementOffset = {};
            
            switch(options.type) {
                case "range": 
                    $element = avalon(element["data-input"]);
                    $calendarWrapper = avalon(element["data-calenderwrapper"]);
                break;
                case "couple":
                    $element = null;
                break;
                default: 
                    $element = avalon(element);
                    $calendarWrapper = avalon(calendar);
            }
            $calendarWrapper.css("position", "absolute");
            parentNode = $calendarWrapper[0].parentNode;
            parentposition = avalon(parentNode).css("position");
            if(parentposition !=="relative" && parentposition!=="absolute" && parentposition!=="fixed") {
                parentNode.style.position = "relative";
            }
            elementOffset = $element.position();
            vmodel.elementLeft = elementOffset.left+parseFloat($element.css("margin-left"));
            vmodel.elementTop = elementOffset.top + $element.outerHeight()+parseFloat($element.css("margin-top"));
        }
        // 检验date
        function validateDate(date) {
            if(typeof date =="string") {
                return options.parseDate(date);
            } else {
                return date;
            }
        }
        // 获取日历组件的初始选择值
        function _getDate() {
            _originValue = element.value;
            var date = _originValue;
            date = validateDate(date);
            if(!date) {
                _originValue = "";
                date = cleanDate(new Date());
            }
            if(isDateDisabled(date, options)) {
                if((options.minDate || options.maxDate)) {
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
        numberOfMonths: 2,
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
        change: avalon.noop, //废弃
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
