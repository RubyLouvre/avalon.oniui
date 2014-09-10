define(["avalon",
    "text!./avalon.timer.html",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.timer.css"
], function(avalon, template) {

    var widget = avalon.ui.timer = function(element, data, vmodels) {
        var options = data.timerOptions
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        avalon.mix(options, initDatas(options))
        var vmodel = avalon.define(data.timerId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.$skipArray = ["widgetElement"]
            vm._mouseWheelCallback = function(e) {
                console.log("onmousewheel")
                console.log(this)
                var dir = (e.wheelDelta || -e.detail) > 0 ? 1 : -1
                console.log("mouseWheel "+dir)
            }
            //这些属性不被监控
            vm.$init = function() {
                element.innerHTML = options.template

                // bindEvents()
                avalon.scan(element, [vmodel].concat(vmodels))
            }
            vm.$remove = function() {

            }
        })
        return vmodel
    }
    widget.defaults = {
        showItems: 9,
        showYears: false,
        getDates: function() {},
        getHours: function() {},
        getMinutes: function() {},
        getTemplate: function(str, options) {
            return str
        }
    }
    function formatNum(n, length){
        n = String(n)
        for (var i = 0, len = length - n.length; i < len; i++) {
            n = "0" + n
        }
        return n
    }
    function initDatas(options) {
        var now = new Date(),
            oldDate = now,
            dates = [],
            date = "",
            hours = [],
            hour = "",
            minutes = [],
            minute = "",
            i,
            week = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        if (hours = !options.getHours()) {
            hours = []
            for (i = 0; i < 24; i ++) {
                hour = formatNum(i, 2)
                hours.push(hour)
            }
        }
        if (minutes = !options.getMinutes()) {
            minutes = []
            for (i = 0; i < 60; i+=5) {
                minute = formatNum(i, 2)
                minutes.push(minute)
            }
        }
        if (dates = !options.getDates()) {
            dates = []
            for (i = 1; i < 60; i++) {
                date = (options.showYears ? now.getFullYear() + "年" : "") + formatNum(now.getMonth()+1, 2) + "月" + formatNum(now.getDate(), 2) + "日" + week[now.getDay()]
                now = new Date(now.setDate(oldDate.getDate() + i))
                dates.push(date)
            }
        }
        return {
            dates: dates,
            minutes: minutes,
            hours: hours
        }
    } 
    function bindEvents() {
        var touch = typeof window.ontouchstart !== 'undefined',
            drag = {
                eStart : (touch ? 'touchstart' : 'mousedown'),
                eMove  : (touch ? 'touchmove' : 'mousemove'),
                eEnd   : (touch ? 'touchend' : 'mouseup'),
            };
        avalon.bind(document, window.netscape ? "DOMMouseScroll" : "mousewheel", function(e) {
            var dir = (e.wheelDelta || -e.detail) > 0 ? 1 : -1
            console.log("mouseWheel "+dir)
        })
    }
    return avalon
})



