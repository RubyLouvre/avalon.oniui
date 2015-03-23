define(["../datepicker/avalon.datepicker.js"], function() {

    var datepicker = avalon.ui.datepicker

    datepicker.defaultRegional = datepicker.regional["en"] = {
        dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],  //该变量被注册到了vm中，同时在方法中使用
        weekDayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        monthNames: ['January','February','March','April','May','June',
            'July','August','September','October','November','December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        closeText: "Done",
        prevText: "Prev",
        prevDayText: "Yesterday",
        nextText: "Next",
        nextDayText: "Tomorrow",
        dayAfterTomorrow: "TDAT",
        currentDayText: "TDA",
        currentDayFullText: "Today",
        showMonthAfterYear: false,
        titleFormat: function(year, month) {
            return this.monthNames[month] + " " + year
        },
        dayText: "Day",
        weekText: "Week",
        yearText: "",
        monthText: "",
        timerText: "Timer",
        hourText: "Hour",
        minuteText: "Minutes",
        nowText: "Now",
        confirmText: "Confirm"
    }

})