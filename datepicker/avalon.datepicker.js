define(["avalon", "text!./avalon.datepicker.html"], function(avalon, sourceHTML) {
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
        
        var day, month, year, _originValue, _value// 手动输入时keydown的辅助值;
        var date = getDate();
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
            vm.date = date;
            vm.prevMonth = 0;
            vm.nextMonth = 0;
            vm.month = month;
            vm.year = year;
            vm.day = day;
            vm.open = function() {

            }

            vm.close = function() {

            }

            vm.getRawValue = function() {

            }

            vm.setDisabled = function() {

            }

            vm._formatDate = function() {
                
            }
            vm._selectDate = function(year, month, day) {
                if(month !== false) {
                    var formatDate = options.formatDate;
                    var date = formatDate(year, month, day);
                    element.value = date;
                    vmodel.toggle = false;
                    vmodel.day = day;
                }
            }
            vm.setDate = function() {

            }
            vm._prev = function() {
                toggleMonth("prev");
            }
            vm._next = function() {
                toggleMonth("next");
            }
            vm.$init = function() {
                var calendar = avalon.parseHTML(calendarTemplate).firstChild;
                var year = vmodel.year;
                var month = vmodel.month;
                document.body.appendChild(calendar);
                avalon.bind(element, "focus", function() {
                    vmodel.toggle = true;
                })
                avalon.bind(document, "click", function(e) {
                    if(!calendar.contains(e.target) && element!==e.target && vmodel.toggle) {
                        vmodel.toggle = false;
                    }
                })
                avalon.bind(element, "keydown", function(e) {
                    var keyCode = e.keyCode, date, year, month, value, operate;
                    if(keyCode === 189) {
                        operate = "-";
                    }
                    value = element.value;
                    if((keyCode<48 || keyCode>57) && keyCode !==13 && keyCode!==8 && options.separator !== operate) {
                        e.preventDefault();
                        return false;
                    } else if(keyCode >= 48 && keyCode <= 57 || options.separator === operate){
                        value = value+String.fromCharCode(keyCode);
                    }

                    if(keyCode === 13) {
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
                getElementPosition();
                if(!options.allowBlank && !_originValue) {
                    element.value = options.formatDate(year,month,vmodel.day);
                }

                vmodel.weekNames = calendarHeader();
                _value = element.value;
                vmodel.rows = calendarDays(month, year);
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
                            days.push({day:void 0, month: false, weekend: false, selected:false});
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
                    
                    days.push({day:day, month: dateMonth, weekend: weekend, selected: selected});
                    cellDate = _cellDate = new Date(cellDate.setDate(day+1));
                } 
                rows.push(days); 
                if(exitLoop) {
                    break;
                }
            }
            return rows;
        }
        function getDefaultDate () {
            var _date;
            _date = this._date;
            if( force !== true && !_date && this._opts.allowBlank )
                return _date;
            if( _date && this._validate( _date ).success  )
                return _date;
            _date = this.getDate();
            if( _date && this._validate( _date ).success  )
                return _date;
            _date = this.getNow();
            if( this._validate( _date ).success  )
                return _date;
            if( this.minDate && this.maxDate ){
                var _date = new Date( this.minDate.getTime() );
                while( !this._validate( _date ).success ){
                    _date = _date.setDate( _date.getDate() + 1 );
                    if( _date > this.maxDate )
                        return null;
                }
                return _date;
            }else
                return this.minDate || this.maxDate;
        }
        function getElementPosition() {
            var elementOffset = avalon(element).offset();
            vmodel.elementLeft = elementOffset.left;
            vmodel.elementTop = elementOffset.top + avalon(element).outerHeight();
        }
        function getDate() {
            _originValue = element.value;
            var date = _originValue || new Date();
            if(typeof date =="string") {
                date = options.parseDate(date);
                if(!date) {
                    _originValue = "";
                    date = new Date();
                }
            } 
            return date;
        }
        function _validate( date ){
            var errorMessage = '',
                tip,
                formatted = '',
                curDate;

            if( options.allowBlank && typeof date === 'string' && date === '' ){
                // allow blank
            }else{
                curDate = this._( date );
                tip = this.getDateTip( curDate );

                if (curDate == null)
                    errorMessage = this._opts.LANG_ERR_FORMAT;
                else if(this._isDateDisabled( curDate )){
                    errorMessage = this._opts.LANG_OUT_OF_RANGE;
                }
                avalon.log("errorMessage : "+errorMessage);
                formatted = !errorMessage ? this._opts.formatDate.call( this ,  curDate ) : '';
            }

            var _rlt = {
                success: !errorMessage,
                tip: errorMessage || tip && tip.text || '',
                formatted : formatted,
                curDate : curDate
            };
            return _rlt;
        };
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        CLASS_CELL_NOTHING : 'ui-calendar-blank',
        CLASS_CELL_TODAY : 'ui-calendar-today',
        CLASS_CELL_OTHERMONTH : 'ui-calendar-othermonth',
        CLASS_CELL_SELECTED : 'ui-calendar-selected',
        CLASS_CELL_DISABLED : 'ui-calendar-disabled',
        CLASS_CELL_HOVER : 'ui-calendar-day-hover',
        CLASS_WEEK_PREFIX : 'ui-calendar-w',

        CLASS_NAV_WRAPPER : 'ui-calendar-nav',
        CLASS_NAV_PREV : 'ui-calendar-prev ui-icon ui-icon-chevron-left',
        CLASS_NAV_NEXT : 'ui-calendar-next ui-icon ui-icon-chevron-right',
        CLASS_NAV_PREV_DISABLED : 'ui-calendar-prev-disabled',
        CLASS_NAV_NEXT_DISABLED : 'ui-calendar-next-disabled',

        CLASS_MONTHS_WRAPPER : 'ui-calendar-months',
        CLASS_MONTH_WRAPPER : 'ui-calendar-month',
        CLASS_MONTH_TITLE : 'ui-calendar-name',

        CLASS_CALENDAR_WIDTH_PREFIX : 'ui-calendar-width-',
        CLASS_CALENDAR : 'ui-calendar',
        CLASS_CALENDAR_DATES_WRAPPER : 'ui-calendar-day',
        CLASS_CALENDAR_CONTENT : 'ui-calendar-content',

        CLASS_PANEL_WRAP : 'ui-calendarbox-panel-wrap',
        CLASS_PANEL : 'ui-calendarbox-panel',
        CLASS_PANEL_INNER : 'ui-calendarbox-panel-inner',

        CLASS_WRAPPER : 'ui-datepicker',
        CLASS_FOCUS : 'ui-datepicker-focus',
        CLASS_DISABLE : 'ui-datepicker-disabled',
        CLASS_HOVER : 'ui-datepicker-hover',
        CLASS_ERROR : 'ui-datepicker-error',
        CLASS_INNER : 'ui-datepicker-source',
        CLASS_LABEL : 'ui-datepicker-label',
        CLASS_ICON_WRAPPER : 'ui-datepicker-icon-wrap',
        CLASS_ICON : 'ui-datepicker-icon ui-icon ui-icon-calendar-o',
        CLASS_TEXT : 'ui-datepicker-text',
        CLASS_INPUT : 'ui-datepicker-input',
        CLASS_OPEN : 'ui-datepicker-open',

        dayNames : ['日', '一', '二', '三', '四', '五', '六'],
        LANG_OUT_OF_RANGE : '超出范围',
        LANG_ERR_FORMAT : '格式错误',
        calendarLabel: "提示信息",
        renderTo: "",
        name : '',
        label : '',
        startDay: 1,
        cls : '',
        showOtherMonths: false,
        disabledDates : '',  // Function Array
        numberOfMonths: 1,
        correctOnError: true,
        allowBlank : false,
        minDate : null,
        maxDate : null,
        stepMonths : 2,
        toggle: false,
        separator: "-",
        formatMonth: function(date){
            return '<span class="year">' + date.getFullYear() + '年</span>' + (date.getMonth() + 1) + '月'
        },
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
        now : function(){
            return typeof SERVER_TIME !== 'undefined' && SERVER_TIME.getTime && new Date( SERVER_TIME.getTime() );
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



// dataOpts: 

// var dateOpts = {
//     LANG_DAYS_NAMES : ['日', '一', '二', '三', '四', '五', '六'],
//     LANG_OUT_OF_RANGE : '超出范围',
//     LANG_ERR_FORMAT : '格式错误',
//     startDay: 1,    //星期开始时间
//     cls : '',       //外层自定义样式
//     correctOnError: true,   //是否自动纠正错误的日期
//     allowBlank : false,     //是否允许为空
//     minDate : null,         //{String/Date} 最小日期
//     maxDate : null,         //{String/Date} 最小日期
//     formatMonth: function(date){    //{Function} 月份格式化函数
//         return '<span class="year">' + date.getFullYear() + '年</span>' + (date.getMonth() + 1) + '月'
//     },
//     parseDate : function( str ){    //{Function} 日期解析函数
//         var x = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
//         return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null;
//     },
//     formatDate : function( date ){  //{Function} 日期格式化函数
//         return date.getFullYear() + "-" + formatNum( date.getMonth() + 1 , 2 ) + "-" + formatNum( date.getDate() , 2 );
//     },
//     now : function(){               //{Function} 获取当前时间函数
//         return typeof SERVER_TIME !== 'undefined' && SERVER_TIME.getTime && new Date( SERVER_TIME.getTime() );
//     }
// }


// 1. keydown时当keyCode为27或9时，toggle false calendar
// 2. 点击非calendar时toggle false calendar