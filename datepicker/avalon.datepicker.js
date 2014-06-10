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

        var vmodel = avalon.define(data.datepickerId, function(vm) {
            avalon.mix(vm, options);

            vm.elementLeft = 0;
            vm.elementTop = 0;
            vm.weekNames = [];
            vm.rows = [];
            vm.prevMonth = 0;
            vm.nextMonth = 0;
            vm.open = function() {

            }

            vm.close = function() {

            }

            vm.getRawValue = function() {

            }

            vm.setDisabled = function() {

            }

            vm.getDate = function() {

            }

            vm.setDate = function() {

            }
            vm.$init = function() {
                var calendar = avalon.parseHTML(calendarTemplate).firstChild;
                document.body.appendChild(calendar);
                vmodel.weekNames = calendarHeader();
                vmodel.rows = calendarDays();
                avalon.scan(calendar, [vmodel].concat(vmodels))
            }
            vm.$remove = function() {

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
            function calendarDays () {
                var date = new Date();
                    startDay = options.startDay,
                    month = new Date(date.getFullYear(), date.getMonth() , 1),
                    stepMonths = options.stepMonths,
                    minDate = options.minDate,
                    maxDate = options.maxDate,
                    showOtherMonths = options.showOtherMonths,
                    days = [],
                    cellDate = new Date(month.getFullYear() , month.getMonth() , 1 - ( month.getDay() - startDay + 7 ) % 7 ),
                    rows = [];
                for (var m=0; m<6; m++) {
                    days = [];
                    for(var n = 0 ; n < 7 ; n++){
                        var isCurrentMonth = cellDate.getMonth() === month.getMonth() && cellDate.getFullYear() === month.getFullYear();
                        cellDate = showOtherMonths || isCurrentMonth ? cellDate : null;
                        days.push(cellDate.getDate());
                        cellDate = new Date(cellDate.setDate(cellDate.getDate()+1));
                    } 
                    rows.push(days); 
                }
                console.log(rows);
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
        });
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
        showOtherMonths: true,
        disabledDates : '',  // Function Array
        numberOfMonths: 1,
        correctOnError: true,
        allowBlank : false,
        minDate : null,
        maxDate : null,
        stepMonths : 1,
        toggle: true,
        formatMonth: function(date){
            return '<span class="year">' + date.getFullYear() + '年</span>' + (date.getMonth() + 1) + '月'
        },
        parseDate : function( str ){
            var x = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null;
        },
        formatDate : function( date ){
            return date.getFullYear() + "-" + formatNum( date.getMonth() + 1 , 2 ) + "-" + formatNum( date.getDate() , 2 );
        },
        now : function(){
            return typeof SERVER_TIME !== 'undefined' && SERVER_TIME.getTime && new Date( SERVER_TIME.getTime() );
        },
        widgetElement: "", // accordion容器
        getTemplate: function(str, options) {
            return str;
        }
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