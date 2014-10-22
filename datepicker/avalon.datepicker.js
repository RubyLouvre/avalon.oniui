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
            parseDate = options.parseDate,
            formatDate = options.formatDate,
            parseDateVm,
            formatDateVm,
            minDate, 
            maxDate,
            minDateVM,
            maxDateVM,
            msDuplexName = element.msData["ms-duplex"],
            duplexVM = msDuplexName && avalon.getModel(msDuplexName, vmodels), 
            _value = element.value || "", // 单日历选择框时input输入域的初始值
            msDisabledName = element.msData["ms-disabled"], 
            //ms-duplex绑定值所在的vmodel及对应绑定值组成的数组
            disabledVM = msDisabledName && avalon.getModel(msDisabledName, vmodels), //ms-disabled绑定值所在的vmodel及对应绑定值组成的数组
            disabledVal, 
            msToggle = element.getAttribute("data-toggle") || element.msData["ms-toggle"],
            toggleVM = msToggle && avalon.getModel(msToggle, vmodels),
            onSelect = options.onSelect,
            day, 
            month, 
            year, 
            _originValue, 
            years=[],
            date, //获取datepicker的初始选择日期
            calendar,
            firstYear = 1901,
            lastYear = 2050;
        if(typeof parseDate ==="string") {
            parseDateVm = avalon.getModel(parseDate, vmodels);
            parseDate = options.parseDate = parseDateVm[1][parseDateVm[0]];
        }
        if(typeof formatDate === "string") {
            formatDateVm = avalon.getModel(formatDate, vmodels);
            formatDate = options.formatDate = formatDateVm[1][formatDateVm[0]];
        }
        formatDate = formatDate.bind(options) //兼容IE6、7使得formatDate方法中的this指向options
        // 如果输入域初始值存在则验证其是否符合日期显示规则，不符合设element.value为null
        parseDate = parseDate.bind(options)
        if (duplexVM) {
            _value = element.value = duplexVM[1][duplexVM[0]]
            duplexVM[1].$watch(duplexVM[0], function(val) {
                var date,
                    month,
                    _day;
                _value = element.value = val;
                if (date = parseDate(val)) {
                    vmodel.year = date.getFullYear()
                    month = vmodel.month = date.getMonth()
                    _day = vmodel.day = date.getDate()
                    vmodel.dateError = "#cccccc"
                    vmodel.tip = getDateTip(cleanDate(date)).text
                    vmodel.onSelect.call(null, date, data["datepickerId"], avalon(element).data())
                } else {
                    vmodel.tip = "格式错误"
                    vmodel.dateError = "#ff8888"
                }

                if (vmodel.numberOfMonths === 1 && date) {
                    var rows = vmodel.data[0] && vmodel.data[0].rows.$model,
                        days,
                        day;
                    if (!rows) return 
                    for (var i = 0; i < rows.length; i++) {
                        days = rows[i]
                        for (var j = 0; j < days.length; j++) {
                            day = days[j]
                            if (month == day.month && day.day == _day && !day.selected) {
                                toggleActiveClass(day.outerIndex, day.innerIndex)
                                return 
                            }
                        }
                    }
                } else if (!date) {
                    removeActiveClass()
                }
            })
        }
        date = _getDate()
        if(disabledVM) {
            disabledVal= disabledVM[1][disabledVM[0]]
            disabledVM[1].$watch(disabledVM[0], function(val) {
                if(vmodel) {
                    vmodel.disabled = val
                }
            })
        }
        if (toggleVM) {
            toggleVM[1].$watch(toggleVM[0], function(val) {
                vmodel.toggle = val
            })  
        }
        minDate = validateDate(options.minDate)
        maxDate = validateDate(options.maxDate)
        if(options.minDate && !minDate) {
            minDateVM = avalon.getModel(options.minDate, vmodels);
            if(minDateVM) {
                minDateVM[1].$watch(minDateVM[0], function(val) {
                    vmodel.minDate = val
                })
                minDate = validateDate(minDateVM[1][minDateVM[0]])
            }
        } 
        if(options.maxDate && !maxDate) {
            maxDateVM = avalon.getModel(options.maxDate, vmodels)
            if(maxDateVM) {
                maxDateVM[1].$watch(maxDateVM[0], function(val) {
                    vmodel.maxDate = val;
                })
                maxDate = validateDate(maxDateVM[1][maxDateVM[0]])
            }
        }
        if(typeof onSelect === "string") {
            var changeVM = avalon.getModel(onSelect, vmodels)
            onSelect = options.onSelect = changeVM && changeVM[1][changeVM[0]] || avalon.noop
        }
        
        years = avalon.type(options.years) === "array" ? options.years : years
        minDate = options.minDate = minDate && cleanDate(minDate)
        maxDate = options.maxDate = maxDate && cleanDate(maxDate)
        minDate ? firstYear = minDate.getFullYear() : 0
        maxDate ? lastYear = maxDate.getFullYear() : 0
        for (var i = firstYear; i <= lastYear; i++) {
            years.push(i)
        }
        options.toggle = toggleVM && toggleVM[1][toggleVM[0]] || options.toggle
        // disabled属性取自disabledVal，disabledVal为false时取配置项disabled，如果配置项仍为false，则取element的disabled属性
        options.disabled = disabledVal || options.disabled || element.disabled
        msDisabledName ? disabledVM[1][disabledVM[0]] = options.disabled : 0
        calendarTemplate = options.template = options.getTemplate(calendarTemplate, options)
        options.changeMonthAndYear ? options.mobileMonthAndYear = false : 0
        HOLIDAYS = initHoliday.call(options, holidayDate) || {}
        
        element.value = _originValue && formatDate(date)
        initValue()
        var vmodel = avalon.define(data.datepickerId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["container", "showDatepickerAlways", "timer", "sliderMinuteOpts", "sliderHourOpts", "template", "widgetElement", "dayNames", "allowBlank", "months", "years", "numberOfMonths", "showOtherMonths", "watermark", "weekNames", "stepMonths", "changeMonthAndYear", "startDay"]
            vm.dateError = vm.dateError || ""
            vm.weekNames = []
            vm.tip = vm.tip || ""
            vm.widgetElement = element
            vm.data = []
            vm.prevMonth = -1 //控制prev class是否禁用
            vm.nextMonth = -1 //控制next class是否禁用
            vm.month = month
            vm._month = month + 1
            vm.year = year
            vm.day = day
            vm.years = years
            vm.months = [1,2,3,4,5,6,7,8,9,10,11,12]
            vm._position = "absolute"
            vm.minute = 0
            vm.hour = 0
            vm._datepickerToggle = true
            vm._monthToggle = false
            vm._yearToggle = false
            vm._years = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]
            vm.elementYear = year
            vm.elementMonth = month
            vm.sliderMinuteOpts = {
                onInit: function(sliderMinute, options, vmodels) {
                    sliderMinute.$watch("value", function(val) {
                        vmodel.minute = val
                    })
                    vmodel.$watch("minute", function(val) {
                        sliderMinute.value = val
                    })
                }
            }
            vm.sliderHourOpts = {
                onInit: function(sliderHour, options, vmodels) {    
                    sliderHour.$watch("value", function(val) {
                        vmodel.hour = val
                    })
                    vmodel.$watch("hour", function(val) {
                        sliderHour.value = val
                    })
                }
            }
            vm.$yearOpts = {
                width: 60,
                listWidth: 60,
                height: 160,
                position: false,
                listClass: "ui-datepicker-dropdown",
                onSelect: function(e) {
                    e.stopPropagation()
                }
            }
            vm.$monthOpts = {
                width: 45,
                height: 160,
                listWidth: 45,
                position: false,
                listClass: "ui-datepicker-dropdown",
                onSelect: function(e) {
                    e.stopPropagation()
                }
            }
            vm._selectDates = function(month) {
                if (vmodel.mobileMonthAndYear) {
                    vmodel._monthToggle = false
                    vmodel._yearToggle = false
                    vmodel._datepickerToggle = true
                    vmodel.month = month
                }
            }
            vm._selectMonths = function(event, year) {
                if (year) {
                    if (!vmodel.mobileYearDisabled(year)) {
                        vmodel.year = year
                    } else {
                        return 
                    }
                }
                if (vmodel.mobileMonthAndYear) {
                    vmodel._monthToggle = true
                    vmodel._yearToggle = false
                    vmodel._datepickerToggle = false
                }
            }
            vm._selectYears = function() {
                if (vmodel.mobileMonthAndYear) {
                    vmodel._monthToggle = false
                    vmodel._yearToggle = true
                    vmodel._datepickerToggle = false
                }
            }
            vm._prevYear = function(year) {
                if (year === vmodel.years[0]) {
                    return
                }
                vmodel.year = vmodel.year - 1 
            }
            vm._nextYear = function(year) {
                if (year === vmodel.years[vmodel.years.length-1]) {
                    return
                }
                vmodel.year = vmodel.year + 1
            }
            vm._prevYears = function() { 
                if (vmodel._years[0] <= vmodel.years[0]) {
                    return
                }
                updateMobileYears(vmodel._years[0] - 1)
            }
            vm._nextYears = function() {
                var _years = vmodel._years,
                    years = vmodel.years;
                if (_years[_years.length-1] >= years[years.length-1]) {
                    return
                }
                updateMobileYears(_years[9] + 1)
            }
            vm.mobileYearDisabled = function(year) {
                var years = vmodel.years
                if (year < years[0] || year > years[years.length-1]) {
                    return true
                } else {
                    return false
                }
            }
            vm.getRawValue = function() {
                return duplexVM && duplexVM[1][duplexVM[0]] || element.value
            }
            vm.getDate =  function() {
                var value = vmodel.getRawValue()
                return parseDate(value) || cleanDate(new Date())
            }
            // 年份选择器渲染ok之后为其绑定dropdown组件并扫描渲染出dropdown
            vm._afterYearRendered = function() {
                this.setAttribute("ms-widget", "dropdown,$,$yearOpts")
                this.setAttribute("ms-duplex", "year")
                avalon.scan(this, vmodel)
            }
            // 月份选择器渲染ok之为其绑定dropdown组件并扫描渲染出dropdown
            vm._afterMonthRendered = function() {
                this.setAttribute("ms-widget", "dropdown,$,$monthOpts")
                this.setAttribute("ms-duplex", "_month")
                avalon.scan(this, vmodel)
            }
            // 选择日期
            vm._selectDate = function(year, month, day, dateDisabled, outerIndex, innerIndex, event) {
                var timerFilter = avalon.filters.timer,
                    _oldMonth = vmodel.month;
                event.stopPropagation()
                if (month !== false && !dateDisabled && !vmodel.showDatepickerAlways) {
                    var _date = new Date(year, month, day),
                        date = formatDate(_date),
                        calendarWrapper = options.type ==="range" ? element["data-calenderwrapper"] : null
                    vmodel.day = day
                    vmodel.tip = getDateTip(cleanDate(new Date(year, month, day))).text
                    vmodel.dateError = "#cccccc"
                    if (!calendarWrapper && !vmodel.timer) {
                        element.value = date
                        vmodel.toggle = false
                        duplexVM ? duplexVM[1][duplexVM[0]] = date : ""
                    } else { // range datepicker时需要切换选中日期项的类名
                        if (vmodel.timer) {
                            date = date + "  " + timerFilter(vmodel.hour) + ":" + timerFilter(vmodel.minute)
                        }
                        element.value = date
                        duplexVM ? duplexVM[1][duplexVM[0]] = date : ""
                    }
                    if (month !== _oldMonth) {
                        vmodel.month = _date.getMonth()
                        vmodel.year = _date.getFullYear()
                    }
                }
                if (!vmodel.showDatepickerAlways) {
                    vmodel.onSelect.call(null, date, data["datepickerId"], avalon(element).data())
                }
                if (month === _oldMonth && !dateDisabled) {
                    toggleActiveClass(outerIndex, innerIndex)
                }
            }
            vm._getNow = function() {
                var date = new Date(),
                    time = date.toTimeString(),
                    now = time.substr(0, time.lastIndexOf(":"));
                vmodel.hour = date.getHours()
                vmodel.minute = date.getMinutes()
                return now
            }
            vm._selectTime = function() {
                var timeFilter = avalon.filters.timer,
                    hour = timeFilter(vmodel.hour),
                    minute = timeFilter(vmodel.minute),
                    time = hour + ":" + minute,
                    _date = formatDate(parseDate(element.value));

                element.value = _date + "  " + time
                if (!vmodel.showDatepickerAlways) {
                    vmodel.toggle = false
                }
                if (options.onSelectTime && avalon.type(options.onSelectTime) === "function") {
                    options.onSelectTime.call(vmodel, vmodel)
                }
            }
            vm._selectYearMonth = function(event) {
                event.stopPropagation();
            }
            // 点击prev按钮切换到当前月的上个月，如当前月存在minDate则prev按钮点击无效
            vm._prev = function(prevFlag, event) {
                if(!prevFlag) {
                    return false
                }
                toggleMonth("prev")
                event.stopPropagation()
            }
            // 点击next按钮切换到当前月的下一个月，如果当前月存在maxDate则next按钮点击无效
            vm._next = function(nextFlag, event) {
                if(!nextFlag) {
                    return false
                }
                toggleMonth("next")
                event.stopPropagation()
            }
            vm.$init = function() {
                var elementPar = element.parentNode,
                    value = element.value;
                calendar = avalon.parseHTML(calendarTemplate).firstChild
                elementPar.insertBefore(calendar, element)
                elementPar.insertBefore(element, calendar)
                avalon(element).attr("ms-css-width", "width")
                if (element.tagName === "INPUT" && vmodel.type !== "range") {
                    var div = document.createElement("div")
                    div.className = "ui-datepicker-input-wrapper"
                    div.setAttribute("ms-class", "ui-state-active:toggle")
                    div.setAttribute("ms-css-border-color", "dateError")
                    div.setAttribute("ms-hover", "ui-state-hover")
                    elementPar.insertBefore(div,element)
                    div.appendChild(element)
                    if (vmodel.showTip) {
                        var tip = avalon.parseHTML("<div class='ui-datepicker-tip'>{{tip}}<i class='ui-icon ui-icon-calendar-o'>&#xf133;</i></div>")
                        div.appendChild(tip)
                    } else {
                        element.style.paddingRight = "0px"
                    }
                    div.appendChild(calendar)
                }
                if (~vmodel.zIndex) {
                    calendar.style.zIndex = vmodel.zIndex
                }
                if (options.type === "range") {
                    div = element["data-calenderwrapper"]
                    vmodel._position = "static"
                } 
                if (vmodel.showDatepickerAlways) {
                    element.style.display = "none"
                    vmodel.toggle = true
                    vmodel._position = "relative"
                    div.style.borderWidth = 0
                } else {
                    bindEvents(calendar, div)
                }
                if (vmodel.timer) {
                    vmodel.width = 100
                }
                if (vmodel.timer) {
                    value = value + " " + vmodel._getNow()
                    _value = element.value = value
                }
                vmodel.weekNames = calendarHeader()
                duplexVM && (duplexVM[1][duplexVM[0]] = value)
                element.disabled = options.disabled
                if (vmodel.type!=="range") {
                    avalon.scan(div, [vmodel])
                }
                element.vmodel = vmodel
                setTimeout(function() {
                    dataSet(vmodel.month, vmodel.year)
                }, 0)
                avalon.scan(calendar, [vmodel].concat(vmodels))
                if (typeof options.onInit === "function" ){
                    //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                var elementPar = element.parentNode,
                    eleParPar = elementPar.parentNode,
                    calendarPar = calendar.parentNode

                calendar.innerHTML = calendar.textContent = ""
                calendarPar.removeChild(calendar)
                eleParPar.removeChild(elementPar)
            }
        })
        getDateTip = getDateTip.bind(vmodel)
        vmodel.$watch("toggle", function(val) {
            var dateFormat = element.value,
                date = parseDate(dateFormat);
            if (val) {
                vmodel.elementMonth = date && date.getMonth() || -1 
                vmodel.elementYear = date && date.getFullYear() || -1
            } else {
                vmodel.onClose(new Date(vmodel.year,vmodel.month+1,vmodel.day), vmodel)
            }
        })
        vmodel.$watch("year", function(year) {
            dataSet(vmodel.month, year)
            updateMobileYears(year)
            vmodel.onChangeMonthYear(year, vmodel.month+1, vmodel)
        })
        vmodel.$watch("_month", function(month) {
            vmodel.month = month - 1
        })
        vmodel.$watch("month", function(month) {
            vmodel._month = month + 1
            dataSet(month, vmodel.year)
            vmodel.onChangeMonthYear(vmodel.year, month, vmodel)
        })
        // 这里的处理使得设置外部disabled或者组件VM的disabled同步
        vmodel.$watch("disabled", function(val) {
            if(msDisabledName) {
                disabledVM[1][disabledVM[0]] = val
            }
            element.disabled = val
        })
        vmodel.$watch("minDate", function(val) {
            var minDate = validateDate(val)
            vmodel.minDate = minDate && cleanDate(minDate)
            dataSet(vmodel.month, vmodel.year)
        })
        vmodel.$watch("maxDate", function(val) {
            var maxDate = validateDate(val);
            vmodel.maxDate = maxDate && cleanDate(maxDate);
            dataSet(vmodel.month, vmodel.year)
        })
        function initValue() {
            // 如果输入域不允许为空，且_originValue不存在则强制更新element.value
            var value = "",
                _date = null,
                dateDisabled = isDateDisabled(date, options);
            if (dateDisabled) {
                _date = options.minDate || options.maxDate
            } else {
                _date = date
            } 
            value = formatDate(_date)
            options.tip = getDateTip(cleanDate(_date)).text
            if (options.allowBlank) {
                if (_value && !_originValue) {
                    options.tip = "格式错误"
                    options.dateError = "#ff8888"
                    value = _value;
                } else if (!_value){
                    value = ""
                    options.tip = ""
                }
            }
            year = _date.getFullYear()
            month =  _date.getMonth()
            day = _date.getDate()
            _value = element.value = value
        }
        function updateMobileYears(year) {
            var years = vmodel._years,
                _year3 = (year + "").substr(0, 3),
                newYears = [];
            if (!~years.indexOf(year)) {
                for (var i = 0; i <= 9; i++) {
                    newYears.push(Number(_year3+i))
                }
                vmodel._years = newYears
            } 
        }
        function removeActiveClass() {
            var rows = vmodel.data[0].rows
            for (var i = 0, len = rows.length; i < len; i++) {
                var cols = rows[i]
                for (var j = 0, colLen = cols.length; j<colLen;j++) {
                    var colSelect = cols[j].selected
                    if (colSelect) {
                        cols[j].selected = false
                        return 
                    }
                }
            }
        }
        function toggleActiveClass(outerIndex, innerIndex) {
            var colSelectFlag = false,
                rows = vmodel.data[0].rows; //rangedatepicker限制为单月份日历显示
            if (rows[outerIndex][innerIndex].selected) {
                return ;
            }
            for (var i = 0, len = rows.length; i < len; i++) {
                var cols = rows[i]
                for (var j = 0, colLen = cols.length; j<colLen;j++) {
                    var colSelect = cols[j].selected
                    if (colSelect) {
                        cols[j].selected = false
                        colSelectFlag = true
                        break;
                    }
                }
                if(colSelectFlag) {
                    break;
                }
            }
            vmodel.data[0].rows[outerIndex][innerIndex].selected = true
        }
        function dataSet(month, year) {
            if(vmodel.numberOfMonths ===1) {
                if (vmodel.data[0]) { // 避免因为存在下拉选择框时，点击prev和next视觉跳动太大的情况
                    vmodel.data[0].rows = calendarDays(month, year)[0].rows
                    vmodel.data[0].year = year
                    vmodel.data[0].month = month
                } else {
                    vmodel.data = calendarDays(month, year)
                }
            } else {
                vmodel.data = calendarDays(month, year)
            }
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
        function bindEvents(calendar, tipContainer) {
            // focus Input元素时显示日历组件
            avalon.bind(element, "focus", function(e) {
                vmodel.toggle = true;
            })
            if (!vmodel.timer) {
                avalon.bind(element, "blur", function() {
                    var date = new Date(vmodel.year, vmodel.month, vmodel.day);
                    element.value = formatDate(date);
                    vmodel.dateError = "#cccccc";
                    vmodel.tip = getDateTip(cleanDate(date)).text;
                })
            } else {
                return ;
            }
            // 切换日期年月或者点击input输入域时不隐藏组件，选择日期或者点击文档的其他地方则隐藏日历组件
            avalon.bind(document, "click", function(e) {
                var target = e.target;
                if(options.type==="range") {
                    return ;
                } 
                if(!calendar.contains(target) && !tipContainer.contains(target) && vmodel.toggle && !vmodel.timer) {
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
                if (msDuplexName) {
                    duplexVM && (duplexVM[1][duplexVM[0]] = element.value)
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
                    date, 
                    year = vmodel.year, 
                    month = vmodel.month, 
                    keyCode = e.keyCode;

                if (keyCode === 37 || keyCode === 39) {
                    return false;
                }
                // 当按下Enter、Tab、Esc时关闭日历
                if (keyCode === 13 || keyCode == 27 || keyCode == 9) {
                    var date = new Date(year, month, vmodel.day)
                    element.value = formatDate(date)
                    vmodel.dateError = "#cccccc"
                    vmodel.tip = getDateTip(cleanDate(date)).text
                    vmodel.toggle = false
                    return false
                }
                if (date = parseDate(value)) {
                    vmodel.dateError = "#cccccc"
                    vmodel.tip = getDateTip(cleanDate(date)).text
                    year = vmodel.year = date.getFullYear()
                    month = vmodel.month = date.getMonth()
                    vmodel.day = date.getDate()
                    _value = value
                    dataSet(month, year)
                } else {
                    vmodel.tip = "格式错误";
                    vmodel.dateError = "#ff8888";
                }
            })
        }
        // 通过prev、next按钮切换月份
        function toggleMonth(operate) {
            var month = vmodel.month, 
                year = vmodel.year,
                stepMonths = options.stepMonths,
                numberOfMonths = vmodel.numberOfMonths;
            if(operate === "next") {
                month = month + stepMonths + numberOfMonths -1;
            } else {
                month = month - stepMonths - numberOfMonths + 1;
            }
            var firstDayOfNextMonth = new Date(year, month, 1);
            year = vmodel.year = firstDayOfNextMonth.getFullYear();   
            month = vmodel.month = firstDayOfNextMonth.getMonth();
            _value = element.value;
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
                valueDate = parseDate(element.value),
                exitLoop = false,
                prev = minDate ? (year-minDate.getFullYear())*12+month-minDate.getMonth() > 0: true,
                next = maxDate ? (maxDate.getFullYear()-year)*12+maxDate.getMonth()-month > 0: true;
            _cellDate = cellDate;
            vmodel.prevMonth = prev;
            vmodel.nextMonth = next;

            for (var i = 0, len = vmodel.numberOfMonths; i < len; i++) {
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
                            weekend = weekDay % 7 == 0 || weekDay % 7 == 6;
                        if (valueDate) {
                            if (valueDate.getDate() === day && _value && dateMonth===valueDate.getMonth() && _cellDate.getFullYear()===valueDate.getFullYear()) {
                                selected = true;
                            }
                        }
                        // showOtherMonths为true，且为下月日期时，退出总循环
                        if (showOtherMonths && m>= 4 && (_cellDate.getFullYear() > year || dateMonth > month)) {
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
            if (typeof date == "string") {
                return parseDate(date);
            } else {
                return date;
            }
        }
        // 获取日历组件的初始选择值
        function _getDate() {
            _originValue = element.value
            var date = validateDate(_originValue)
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
        startDay: 1,
        width: 90,
        showTip: true,
        changeMonthAndYear: false,
        mobileMonthAndYear: false,
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
        zIndex: -1,
        showDatepickerAlways: false,
        timer: false,
        onSelect: avalon.noop, //将废弃,相当于onSelect
        onClose: avalon.noop,
        onSelectTime: "",
        parseDate: function(str){
            if (!str) {
                return null
            }
            var separator = this.separator;
            var reg = "^(\\d{4})" + separator+ "(\\d{1,2})"+ separator+"(\\d{1,2})[\\s\\w\\W]*$";
            reg = new RegExp(reg);
            var x = str.match(reg);
            return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null;
        },
        formatDate: function(date){
            if (avalon.type(date) !== "date") return ""
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
    avalon.filters.timer = function(str) {
        var num = +str;
        if (num >= 0 && num <=9) {
            str = "0" + str;
        }
        return str;
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
            curTime = curDate.getTime(),
            dayNames = ['日', '一', '二', '三', '四', '五', '六'];
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
            return {text: '周' + dayNames[curDate.getDay()]};
        } else {
            return tip;
        }
    };
    return avalon;
})