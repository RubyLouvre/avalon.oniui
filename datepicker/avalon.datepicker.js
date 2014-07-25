define(["../avalon.getModel", 
        "./avalon.datepicker.lang",
        "text!./avalon.datepicker.html", 
        "../dropdown/avalon.dropdown.js",
        "css!../chameleon/oniui-common.css", 
        "css!./avalon.datepicker.css"], function(avalon, holidayDate, sourceHTML) {
    var calendarTemplate = sourceHTML,
        HOLIDAYS,
        ONE_DAY = 24 * 60 * 60 * 1000;
    var widget = avalon.ui.datepicker = function(element, data, vmodels) {
        var options = data.datepickerOptions,
            parseDateVm,
            formatDateVm;
        if(typeof options.parseDate ==="string") {
            parseDateVm = avalon.getModel(options.parseDate, vmodels);
            options.parseDate = parseDateVm[1][parseDateVm[0]];
        }
        if(typeof options.formatDate === "string") {
            formatDateVm = avalon.getModel(options.formatDate, vmodels);
            options.formatDate = formatDateVm[1][formatDateVm[0]];
        }
        var minDate = validateDate(options.minDate), 
            maxDate = validateDate(options.maxDate),
            msDuplexName = element.msData["ms-duplex"],
            _value = element.value || "", // 单日历选择框时input输入域的初始值
            msDisabledName = element.msData["ms-disabled"], 
            msDisabled, 
            duplexVM = msDuplexName && avalon.getModel(msDuplexName, vmodels), //ms-duplex绑定值所在的vmodel及对应绑定值组成的数组
            vmSub = msDisabledName && avalon.getModel(msDisabledName, vmodels), //ms-disabled绑定值所在的vmodel及对应绑定值组成的数组
            msToggle = element.getAttribute("data-toggle") || element.msData["ms-toggle"],
            toggleVM = msToggle && avalon.getModel(msToggle, vmodels),
            minDateVM,
            maxDateVM;
        options.template = options.getTemplate(calendarTemplate, options);
        HOLIDAYS = initHoliday.call(options, holidayDate) || {};
        if (duplexVM) {
            var value = duplexVM[1][duplexVM[0]];
            var date ;
            duplexVM[1].$watch(duplexVM[0], function(val) {
                if(date=options.parseDate(val)) {
                    var year, month, day;
                    year = vmodel.year = date.getFullYear();
                    month = vmodel.month = date.getMonth();
                    day = vmodel.day = date.getDate();
                    _value = element.value = val;
                    if(vmodel.numberOfMonths ===1) {
                        vmodel.data[0] ? vmodel.data[0].rows = calendarDays(month, year)[0].rows : vmodel.data = calendarDays(month, year);
                    } else {
                        vmodel.data = calendarDays(month, year);
                    }
                    vmodel.tip = getDateTip(cleanDate(new Date(year, month, day))).text;
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
        if(typeof options.onSelect === "string") {
            var changeVM = avalon.getModel(options.onSelect, vmodels);
            options.onSelect = changeVM[1][changeVM[0]];
        }

        options.minDate = minDate && cleanDate(minDate);
        options.maxDate = maxDate && cleanDate(maxDate);
        options.toggle = toggleVM && toggleVM[1][toggleVM[0]] || options.toggle;
        // disabled属性取自msDisabled，msDisabled为false时取配置项disabled，如果配置项仍为false，则取element的disabled属性
        options.disabled = msDisabled || options.disabled || element.disabled;
        msDisabledName ? vmSub[1][vmSub[0]] = options.disabled : 0;
        var day, month, year, _originValue, years=[],// 手动输入时keydown的辅助值;
            date = _getDate(), //获取datepicker的初始选择日期
            calendar;
        month = date.getMonth();
        year = date.getFullYear();
        day = date.getDate();
        for(var i=1901; i<=2050; i++) {
            years.push(i);
        }
        options.formatDate = options.formatDate.bind(options); //兼容IE6、7使得formatDate方法中的this指向options
        // 如果输入域初始值存在则验证其是否符合日期显示规则，不符合设element.value为null
        element.value = _originValue && options.formatDate(date);
        var vmodel = avalon.define(data.datepickerId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["container"];
            vm.$monthDom = null,

            vm.dateError = vm.dateError || "";
            vm.weekNames = [];
            vm.rows = [];
            vm.tip = vm.tip || "";
            vm.widgetElement = element;
            //vm.date = date;
            vm.data = [];
            vm.prevMonth = -1; //控制prev class是否禁用
            vm.nextMonth = -1; //控制next class是否禁用
            vm.month = month;
            vm._month = vm.month + 1;
            vm.year = year;
            vm.day = day;
            vm.years = years;
            vm.months = [1,2,3,4,5,6,7,8,9,10,11,12];
            vm.$yearOpts = {
                width: 60,
                listWidth: 60,
                height: 160,
                position: false,
                onSelect: function(e) {
                    e.stopPropagation();
                }
            }
            vm.$monthOpts = {
                width: 40,
                height: 160,
                listWidth: 40,
                position: false,
                onSelect: function(e) {
                    e.stopPropagation();
                }
            }
            // 设置日期的禁用与否
            vm.setDisabled = function(val) {
                vmodel.disabled = val;
            }
            // 年份选择器渲染ok之后为其绑定dropdown组件并扫描渲染出dropdown
            vm._afterYearRendered = function() {
                this.setAttribute("ms-widget", "dropdown,$,$yearOpts");
                this.setAttribute("ms-duplex", "year");
                vmodel.$monthDom = this;
                avalon.scan(this, vmodel);
            }
            // 月份选择器渲染ok之为其绑定dropdown组件并扫描渲染出dropdown
            vm._afterMonthRendered = function() {
                this.setAttribute("ms-widget", "dropdown,$,$monthOpts");
                this.setAttribute("ms-duplex", "_month");
                avalon.scan(this, vmodel);
            }
            // 选择日期
            vm._selectDate = function(year, month, day, dateDisabled, outerIndex, innerIndex) {
                if(month !== false && !dateDisabled) {
                    var formatDate = options.formatDate.bind(options),
                        _date = new Date(year, month, day),
                        date = formatDate(_date),
                        calendarWrapper = options.type ==="range" ? element["data-calenderwrapper"] : null;
                    if(month !== vmodel.month) {
                        vmodel.month = _date.getMonth();
                        vmodel.year = _date.getFullYear();
                    }
                    vmodel.day = day;
                    vmodel.tip = getDateTip(cleanDate(new Date(year, month, day))).text;
                    vmodel.dateError = "#cccccc";
                    if(!calendarWrapper) {
                        element.value = date;
                        duplexVM ? duplexVM[1][duplexVM[0]] = date : "";
                        vmodel.toggle = false;
                        vmodel.data = calendarDays(vmodel.month, vmodel.year);
                    } else { // range datepicker时需要切换选中日期项的类名
                        var colSelectFlag = false,
                            rows = vmodel.data[0].rows; //rangedatepicker限制为单月份日历显示
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
                        vmodel.data[0].rows[outerIndex][innerIndex].selected = true;
                        element.value = date;
                    }
                    vmodel.onSelect.call(null, options.parseDate(date), data["datepickerId"], avalon(element).data())
                }
            }
            vm._selectYearMonth = function(event) {
                event.stopPropagation();
            }
            // 点击prev按钮切换到当前月的上个月，如当前月存在minDate则prev按钮点击无效
            vm._prev = function(prevFlag, event) {
                if(!prevFlag) {
                    return false;
                }
                toggleMonth("prev");
                event.stopPropagation();
            }
            // 点击next按钮切换到当前月的下一个月，如果当前月存在maxDate则next按钮点击无效
            vm._next = function(nextFlag, event) {
                if(!nextFlag) {
                    return false;
                }
                toggleMonth("next");
                event.stopPropagation();
            }
            vm.$init = function() {
                var elementPar = element.parentNode;
                calendar = avalon.parseHTML(calendarTemplate).firstChild;
                elementPar.insertBefore(calendar, element);
                elementPar.insertBefore(element, calendar);
                if(_value) {
                    if(!_originValue) {
                        if(vmodel.allowBlank) {
                            vmodel.tip = "格式错误";
                            vmodel.dateError = "#ff8888";
                            element.value = _value;
                        } else {
                            vmodel.tip = getDateTip(date).text;
                        }
                    } else {
                        vmodel.tip = getDateTip(date).text;
                        if(isDateDisabled(date, options)) {
                            vmodel.tip = "超出范围";
                            vmodel.dateError = "#ff8888";
                        }
                    }
                } else {
                    if(vmodel.allowBlank) {
                        vmodel.tip = "今天";
                    } else {
                        vmodel.tip = getDateTip(date).text;
                    }
                }
                if(element.tagName === "INPUT" && vmodel.type!=="range") {
                    var div = document.createElement("div");
                    div.className = "ui-datepicker-input-wrapper";
                    div.setAttribute("ms-class", "ui-state-active:toggle");
                    div.setAttribute("ms-css-border-color", "dateError");
                    div.setAttribute("ms-hover", "ui-state-hover");
                    elementPar.insertBefore(div,element);
                    // element.msRetain = true;
                    div.appendChild(element);
                    var tip = avalon.parseHTML("<div class='ui-datepicker-tip'>{{tip}}<i class='ui-icon ui-icon-calendar-o'>&#xf133;</i></div>");
                    div.appendChild(tip);
                    // element.msRetain = false;
                    element.value = vmodel.allowBlank ? _value : _originValue;
                }
                div = options.type ==="range" ? element["data-calenderwrapper"] : div;
                bindEvents(calendar, div);
                // 如果输入域不允许为空，且_originValue不存在则强制更新element.value
                if(!options.allowBlank && !_originValue) {
                    element.value = vmodel.formatDate(new Date());
                }
                avalon(element).attr("name", options.name);
                vmodel.weekNames = calendarHeader();
                _value = element.value;
                element.disabled = options.disabled;
                if(vmodel.type!=="range") {
                    avalon.scan(div, [vmodel]);
                }
                avalon.scan(calendar, [vmodel].concat(vmodels))
                if(typeof options.onInit === "function" ){
                    //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                var elementPar = element.parentNode,
                    eleParPar = elementPar.parentNode,
                    calendarPar = calendar.parentNode;
                calendar.innerHTML = calendar.textContent = "";
                calendarPar.removeChild(calendar);
                eleParPar.removeChild(elementPar);
            }
        });
        getDateTip = getDateTip.bind(vmodel);
        vmodel.$watch("toggle", function(val) {
            if(val) {
                _value = element.value;
                if(vmodel.numberOfMonths ===1) {
                    vmodel.data[0] ? vmodel.data[0].rows = calendarDays(vmodel.month, vmodel.year)[0].rows : vmodel.data = calendarDays(vmodel.month, vmodel.year);
                } else {
                    vmodel.data = calendarDays(vmodel.month, vmodel.year);
                }
            } else {
                vmodel.onClose(new Date(vmodel.year,vmodel.month+1,vmodel.day), vmodel);
            }
        })
        vmodel.$watch("year", function(year) {
            if(vmodel.numberOfMonths ===1) {
                vmodel.data[0] ? vmodel.data[0].rows = calendarDays(vmodel.month, vmodel.year)[0].rows : vmodel.data = calendarDays(vmodel.month, year);
                if(vmodel.year !== vmodel.data[0].year) {
                    vmodel.data[0].year = vmodel.year;
                }
            } else {
                vmodel.data = calendarDays(vmodel.month, year);
            }
            vmodel.onChangeMonthYear(year, vmodel.month+1, vmodel);
        })
        vmodel.$watch("_month", function(month) {
            vmodel.month = month - 1;
        })
        vmodel.$watch("month", function(month) {
            vmodel._month = month + 1;
            if(vmodel.numberOfMonths ===1) {
                vmodel.data[0] ? vmodel.data[0].rows = calendarDays(vmodel.month, vmodel.year)[0].rows : vmodel.data = calendarDays(month, vmodel.year);
                if(vmodel.month !== vmodel.data[0].month) {
                    vmodel.data[0].month = vmodel.month;
                }
            } else {
                vmodel.data = calendarDays(month, vmodel.year);
            }
            vmodel.onChangeMonthYear(vmodel.year, month, vmodel);
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
            if(vmodel.numberOfMonths ===1) {
                var data = vmodel.data[0], _data = data;
                _data = data ? (data.rows = calendarDays(vmodel.month, vmodel.year)[0].rows) && _data: (vmodel.data = calendarDays(vmodel.month, vmodel.year)) && vmodel.data[0];
                // 为了避免有下拉框选择月份年份情况下通过prev、next切换月份时更新范围较大有跳动的感觉，遂考虑只更新日期部分，不更新下拉框部分。但如果更新minDate、输入域值的话相应的year、month可能会变，所以需要下面对month和year的更新处理
                if(_data.month !== vmodel.month) {
                    _data.month = vmodel.month;
                }
                if(_data.year !== vmodel.year) {
                    _data.year = vmodel.year;
                }
            } else {
                vmodel.data = calendarDays(vmodel.month, vmodel.year);
            }
        })
        vmodel.$watch("maxDate", function(val) {
            var maxDate = validateDate(val);
            vmodel.maxDate = maxDate && cleanDate(maxDate);
            if(vmodel.numberOfMonths ===1) {
                var data = vmodel.data[0], _data = data;
                _data = data ? (data.rows = calendarDays(vmodel.month, vmodel.year)[0].rows) && _data : (vmodel.data = calendarDays(vmodel.month, vmodel.year)) && vmodel.data[0];
                if(_data.month !== vmodel.month) {
                    _data.month = vmodel.month;
                }
                if(_data.year !== vmodel.year) {
                    _data.year = vmodel.year;
                }
            } else {
                vmodel.data = calendarDays(vmodel.month, vmodel.year);
            }
        })
        
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
        function bindEvents(calendar, tipContainer) {
            // focus Input元素时显示日历组件
            avalon.bind(element, "focus", function(e) {
                vmodel.toggle = true;
                // e.stopPropagation();
            })
            // 切换日期年月或者点击input输入域时不隐藏组件，选择日期或者点击文档的其他地方则隐藏日历组件
            avalon.bind(document, "click", function(e) {
                var target = e.target;
                if(options.type==="range" && (element["data-container"].contains(target) || element["data-calenderwrapper"].contains(target))) {
                    return ;
                } 

                if(!calendar.contains(target) && !tipContainer.contains(target) && vmodel.toggle) {
                    vmodel.toggle = false;
                    toggleVM ? toggleVM[1][toggleVM[0]] = false : 0;
                    return ;
                } else if(!vmodel.toggle && !vmodel.disabled && tipContainer.contains(target)){
                    vmodel.toggle = true;
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
                var keyCode = e.keyCode,  operate, eChar;
                eChar = e.char;
                if(eChar) {
                    switch(eChar) {
                        case "-": 
                            operate = "-";
                        break;
                        case "/":
                            operate = "/";
                        break;
                    }
                } else {
                    switch(keyCode) {
                        case 189: 
                            operate = "-";
                        break;
                        case 191:
                            operate = "/";
                        break;
                    }
                }
                if(!vmodel.toggle) {
                    vmodel.toggle = true;
                }
                value = element.value;
                // 37:向左箭头； 39:向右箭头；8:backspace；46:Delete
                if((keyCode<48 || keyCode>57) && keyCode !==13 && keyCode!==8 && options.separator !== operate && keyCode !== 27 && keyCode !== 9 && keyCode !== 37 && keyCode!== 39 && keyCode!==46) {
                    e.preventDefault();
                    return false;
                } 
            })
            avalon.bind(element, "keyup", function(e) {
                var value = element.value,
                    date, year, month, 
                    keyCode = e.keyCode;
                if(keyCode === 37 || keyCode === 39) {
                    return false;
                }
                // 当按下Enter、Tab、Esc时关闭日历
                if(keyCode === 13 || keyCode==27 || keyCode==9) {
                    vmodel.toggle = false;
                    return false;
                }
                if(date=options.parseDate(value)) {
                    year = vmodel.year = date.getFullYear();
                    month = vmodel.month = date.getMonth();
                    vmodel.day = date.getDate();
                    _value = value;
                    if(vmodel.numberOfMonths ===1 && vmodel.changeMonthAndYear) {
                        vmodel.data[0] ? vmodel.data[0].rows = calendarDays(vmodel.month, vmodel.year)[0].rows : vmodel.data = calendarDays(vmodel.month, vmodel.year);
                    } else {
                        vmodel.data = calendarDays(vmodel.month, vmodel.year);
                    }
                }
            })
        }
        // 通过prev、next按钮切换月份
        function toggleMonth(operate) {
            var month = 0, 
                year = 0,
                numberOfMonths = vmodel.numberOfMonths;
            if(operate === "next") {
                month = vmodel.month + options.stepMonths + numberOfMonths -1;
            } else {
                month = vmodel.month - options.stepMonths - numberOfMonths + 1;
            }
            var firstDayOfNextMonth = new Date(vmodel.year, month, 1);
            year = vmodel.year = firstDayOfNextMonth.getFullYear();   
            month = vmodel.month = firstDayOfNextMonth.getMonth();
            _value = element.value;
            if(vmodel.numberOfMonths ===1 && vmodel.changeMonthAndYear) {
                vmodel.data[0] ? vmodel.data[0].rows = calendarDays(vmodel.month, vmodel.year)[0].rows : vmodel.data = calendarDays(vmodel.month, vmodel.year);
            } else {
                vmodel.data = calendarDays(vmodel.month, vmodel.year);
            }
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
            var startDay = vmodel.startDay,
                firstDayOfMonth = new Date(year, month , 1),
                minDate = vmodel.minDate,
                maxDate = vmodel.maxDate,
                showOtherMonths = vmodel.showOtherMonths,
                days = [],
                _cellDate,
                cellDate =  new Date(year , month , 1 - ( firstDayOfMonth.getDay() - startDay + 7 ) % 7 ),
                rows = [],
                data = [],
                valueDate = vmodel.parseDate(_value),
                exitLoop = false,
                prev = minDate ? (year-minDate.getFullYear())*12+month-minDate.getMonth() : true,
                next = maxDate ? (maxDate.getFullYear()-year)*12+maxDate.getMonth()-month : true;
            _cellDate = cellDate;
            vmodel.prevMonth = prev;
            vmodel.nextMonth = next;
            for(var i=0, len=vmodel.numberOfMonths; i<len; i++) {
                for (var m=0; m<6; m++) {
                    days = [];
                    for(var n = 0 ; n < 7 ; n++){
                        var isCurrentMonth = cellDate.getMonth() === firstDayOfMonth.getMonth() && cellDate.getFullYear() === firstDayOfMonth.getFullYear(),
                            selected = false,
                            dateMonth = 0;
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
                        var tip = getDateTip(_cellDate),
                            day = _cellDate.getDate(),
                            _day = tip && tip.cellText || day,
                            weekDay = cellDate.getDay(),
                            weekend = weekDay%7==0 || weekDay%7==6;
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
                        days.push({day:day,_day: _day, month: dateMonth, weekend: weekend, selected: selected, dateDisabled: dateDisabled, outerIndex: m, innerIndex: n});
                        cellDate = _cellDate = new Date(cellDate.setDate(day+1));
                    } 
                    rows.push(days); 
                    if(exitLoop) {
                        break;
                    }
                }
                data.push({
                    year: year,
                    month: month,
                    rows: rows
                })
                month +=1;
                var _date = new Date(year, month, 1);
                year = _date.getFullYear();
                month = _date.getMonth();
                startDay = vmodel.startDay;
                firstDayOfMonth = new Date(year, month , 1);
                cellDate = _cellDate =  new Date(year , month , 1 - ( firstDayOfMonth.getDay() - startDay + 7 ) % 7 );
                rows = [];
                exitLoop = false;
            }
            return data;
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
            return date && cleanDate(date);
        }
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        dayNames : ['日', '一', '二', '三', '四', '五', '六'],
        name : "",
        startDay: 1,
        changeMonthAndYear: false,
        showOtherMonths: false,
        numberOfMonths: 1,
        allowBlank : false,
        minDate : null,
        maxDate : null,
        stepMonths : 1,
        toggle: false,
        separator: "-",
        calendarLabel: "选择日期",
        onChangeMonthYear: avalon.noop, 
        watermark: true,
        onSelect: avalon.noop, //将废弃,相当于onSelect
        onClose: avalon.noop,
        parseDate: function(str){
            var separator = this.separator;
            var reg = "^(\\d{4})" + separator+ "(\\d{1,2})"+ separator+"(\\d{1,2})$";
            reg = new RegExp(reg);
            var x = str.match(reg);
            return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null;
        },
        formatDate: function(date){
            var separator = this.separator,
                year = date.getFullYear(),
                month = date.getMonth(),
                day = date.getDate();
            return year + separator + this.formatNum(month + 1 , 2) + separator + this.formatNum(day , 2);
        },
        // 格式化month和day，使得其始终为两位数，比如2为02,1为01
        formatNum: function(n, length){
            n = String(n);
            for( var i = 0 , len = length - n.length ; i < len ; i++)
                n = "0" + n;
            return n;
        },
        widgetElement: "", // accordion容器
        getTemplate: function(str, options) {
            return str;
        }
    }
    
    function cleanDate( date ){
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }
    // 获取节日信息
    function initHoliday( data ){
        var _table = {},
            _data = [];
        for( var k in data ){
            var v = data[ k ],
                _date = this.parseDate( k );

            if( _date ){
                v.date = _date;
                _data.push( v );
            }
        }
        _data.sort( function( a , b ){
            return ( a.dayIndex || 0 ) - ( b.dayIndex || 0 );
        });
        for( var k = 0 , len = _data.length ; k < len ; k++ ){
            var v = _data[k],
                _date = v.date,
                beforeTime = v.beforeTime || 0,
                afterTime = v.afterTime || 0;
            _date.setDate( _date.getDate() - beforeTime - 1 );
            for( var i = -v.beforeTime ; i < afterTime + 1 ; i++ ){
                _date.setDate( _date.getDate() + 1 );
                _table[ _date.getTime() ] =  {
                    text : v['holidayName'] + ( i < 0 ? '前' + -i + '天' : i > 0 ? '后' + i + '天' : ""),
                    cellClass : i === 0 && v['holidayClass'] || "",
                    cellText : i === 0 && v['holidayText'] || ""
                };
            }
        }
        return _table;
    };
    // 解析传入日期，如果是节日或者节日前三天和后三天只能，会相应的显示节日前几天信息，如果是今天就显示今天，其他情况显示日期对应的是周几
    function getDateTip(curDate) {
        if(!curDate)
            return;
        var now = (cleanDate(new Date())).getTime(),
            curTime = curDate.getTime();
        if(now == curTime) {
            return { 
                    text : '今天', 
                    cellClass : 'c_today', 
                    cellText : '今天'
                };
        } else if(now == curTime - ONE_DAY) {
            return { 
                    text : '明天', 
                    cellClass : "" 
                };
        } else if(now == curTime - ONE_DAY * 2) {
            return {
                    text : '后天' , 
                    cellClass : "" 
                };
        }
        var tip = HOLIDAYS && HOLIDAYS[curDate.getTime()];
        if(!tip) {
            return {text: '周' + this.dayNames[curDate.getDay()]};
        } else {
            return tip;
        }
    };
    return avalon;
})
