define(["avalon",
    "text!./avalon.timer.html",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.timer.css",
    "../dialog/avalon.dialog"
], function(avalon, template) {
    var currentScroll = null,
        touch = typeof window.ontouchstart !== 'undefined',
        drag = {
            eStart : (touch ? 'touchstart' : 'mousedown'),
            eMove  : (touch ? 'touchmove' : 'mousemove'),
            eEnd   : (touch ? 'touchend' : 'mouseup'),
        },
        templateArr = template.split("MS_OPTION_TEXTBOX"),
        textbox = templateArr[0];
    template = templateArr[1]
    var widget = avalon.ui.timer = function(element, data, vmodels) {
        var options = data.timerOptions,
            scrollElements = {},
            initIndex = 0,
            timerWrapper,
            textboxWrapper = null;
            
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        avalon.mix(options, initDatas(options))
        initIndex = Math.floor(options.showItems / 2)
        var vmodel = avalon.define(data.timerId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.$skipArray = ["widgetElement", "eventType", "_initIndex", "dialog", "_dialog", "textbox"]
            vm._initIndex = initIndex
            vm._timerHeight = 0
            vm._timerWidth = 0
            vm._hourLeft = 0
            vm._minuteLeft = 0
            vm._currentDateIndex = initIndex
            vm._currentHourIndex = initIndex
            vm._currentMinuteIndex = initIndex
            vm._dialog = null
            vm._timeTextColor = "#999999"
            vm.timeDate = null
            vm._toggleDialog = function() {
                var dialog = vmodel._dialog
                if (dialog && !dialog.toggle) {
                    dialog.toggle = true
                }
            }
            vm.dialog.onInit = function(dialog) {
                vmodel._dialog = dialog
                dialog.$watch("toggle", function(val) {
                    if (val) {
                        var dateElementWidth = 0,
                            hourElementWidth = 0,
                            scrollEles = getScrollElements(timerWrapper),
                            dateElement = scrollEles[0],
                            hourElement = scrollEles[1],
                            minuteElement = scrollEles[2];

                        dateElement._name = "date"
                        hourElement._name = "hour"
                        minuteElement._name = "minute"
                        handleEvent(dateElement, scrollElements, vmodel, "_initPosition")
                        handleEvent(hourElement, scrollElements, vmodel, "_initPosition")
                        handleEvent(minuteElement, scrollElements, vmodel, "_initPosition")

                        dateElementWidth = avalon(dateElement).outerWidth()
                        vmodel._hourLeft = dateElementWidth
                        hourElementWidth = vmodel._minuteLeft = dateElementWidth + avalon(hourElement).outerWidth()
                        vmodel._timerWidth = hourElementWidth + avalon(minuteElement).outerWidth()
                    }
                })
            }
            vm.dialog.onConfirm = function() {
                var currentDate = vmodel.getTime()
                vmodel.timeDate = currentDate
                vmodel._timeTextColor = "#333"
            }
            vm._eventCallback = function(eventType, event) {
                var element = this
                switch(eventType) {
                    case "mousewheel" :
                        handleEvent(element, scrollElements, vmodel, "_wheel", event)
                        break;
                    case "start" : 
                        handleEvent(element, scrollElements, vmodel, "_"+eventType, event)
                        break;
                }
            }
            vm.getTime = function() {
                var date = vmodel.dates[vmodel._currentDateIndex],
                    hour = vmodel.hours[vmodel._currentHourIndex]._hour,
                    minute = vmodel.minutes[vmodel._currentMinuteIndex]._minute;
                return new Date(date.year, date.month, date.day, hour, minute)
            }
            //这些属性不被监控
            vm.$init = function() {
                var scrollEles = [],
                    temporary = document.createElement("span");
                element.style.display = "none"
                timerWrapper = avalon.parseHTML(template).firstChild
                element.parentNode.insertBefore(temporary, element)
                textboxWrapper = avalon.parseHTML(textbox).firstChild
                temporary.parentNode.replaceChild(textboxWrapper, temporary)
                avalon.scan(textboxWrapper, vmodel)
                document.body.appendChild(timerWrapper)
                vmodel._timerHeight = 30 * options.showItems
                timerWrapper.setAttribute("ms-widget", "dialog")
                scrollEles = getScrollElements(timerWrapper)
                bindEvents(options.eventType, scrollEles)
                avalon.scan(timerWrapper, [vmodel].concat(vmodels))
                if (typeof options.onInit === "function") {
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                timerWrapper.innerHTML = timerWrapper.textContent = ""
                timerWrapper.parentNode.removeChild(timerWrapper)
                textboxWrapper.innerHTML = textboxWrapper.textContent = ""
                textboxWrapper.parentNode.removeChild(textboxWrapper)
            }
            
        })
        return vmodel
    }
    widget.defaults = {
        showItems: 9,
        width: 180, // 时间显示框的宽度
        placeHolder: "请选择时间",
        getTimeText: function(timeDate, placeHolder) {
            var timeText = placeHolder
            if (timeDate) {
                timeText = timeDate.toLocaleString()
            } 
            return timeText
        },
        showYears: false,
        eventType: "touch",
        mouseWheelSpeed: 20,
        useTransform: true,
        getDates: avalon.noop,
        getHours: avalon.noop,
        getMinutes: avalon.noop,
        dialog: {title: "选择时间", width: 300, showClose: false},
        getTemplate: function(str, options) {
            return str
        }
    }
    avalon.bind(document, drag.eMove, function(event) {
        var timerId = "",
            timer = null;
        if (currentScroll) {
            timerId = currentScroll.timerId
            timer = avalon.vmodels[timerId]
            if (timer && timer.eventType != "mousewheel") {
                currentScroll._move(currentScroll.element, event, timer)
            }
        }
    })
    avalon.bind(document, drag.eEnd, function(event) {
        var timerId = "",
            timer = null;
        if (currentScroll) {
            timerId = currentScroll.timerId
            timer = avalon.vmodels[timerId]
            if (timer && timer.eventType != "mousewheel") {
                currentScroll._end(currentScroll.element, event, timer)
            }
        }
    })
    function getScrollElements(timerWrapper) {
        var divs = timerWrapper.getElementsByTagName("div"),
            div = null,
            dateElement = null,
            hourElement = null,
            minuteElement = null,
            className = "";

        for (var i = 0, len = divs.length; i < len; i++) {
            div = divs[i]
            className = div.className
            if (className.indexOf("oni-timer-date") != -1) {
                dateElement = div
            } else if (className.indexOf("oni-timer-hour") != -1) {
                hourElement = div
            } else if (className.indexOf("oni-timer-minute") != -1) {
                minuteElement = div
            }
        }
        return [dateElement, hourElement, minuteElement]
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
            year = 0,
            month = 0,
            day = 0,
            hours = [],
            hour = "",
            minutes = [],
            minute = "",
            i,
            week = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        if (!(hours = options.getHours())) {
            hours = []
            for (i = 0; i < 24; i ++) {
                hour = formatNum(i, 2)
                hours.push({hour: hour, _hour: i, color: "rgba(51, 51, 51, 1)"})
            }
        }
        if (!(minutes = options.getMinutes())) {
            minutes = []
            for (i = 0; i < 60; i+=5) {
                minute = formatNum(i, 2)
                minutes.push({minute: minute, _minute: i, color: "rgba(51, 51, 51, 1)"})
            }
        }
        if (!(dates = options.getDates())) {
            dates = []
            for (i = 1; i < 60; i++) {
                year = now.getFullYear()
                month = now.getMonth()
                day = now.getDate()
                date = (options.showYears ? year + "年" : "") + formatNum(month+1, 2) + "月" + formatNum(day, 2) + "日" + week[now.getDay()]
                now = new Date(oldDate.setDate(oldDate.getDate() + i))
                oldDate = new Date()
                dates.push({date: date, year: year, month: month, day: day, color: "rgba(51, 51, 51, 1)"})
            }
        }
        return {
            dates: dates,
            minutes: minutes,
            hours: hours
        }
    } 
    function bindEvents(type, elements) {
        var eventName = "",
            eventValue = "";
        elements.forEach(function(element, index) {
            if (type === "mousewheel") {
                eventName = "ms-on-mousewheel"
                eventValue = "_eventCallback(" + '"' + type + '", $event)'
            } else {
                eventName = "ms-on-" + drag.eStart
                eventValue = "_eventCallback(" + '"start", $event)'
            }
            element.setAttribute(eventName, eventValue)
        })
    }
    function renderTimer(vmodel, index, dataName, indexName) {
        var initIndex = vmodel._initIndex,
            currentIndex = -index + initIndex,
            items,
            prevIndex = 0,
            nextIndex = 0,
            color = 0,
            itemsLen = 0;
        
        vmodel[indexName] = currentIndex
        items = vmodel[dataName]
        itemsLen = items.length
        if (currentIndex < 0 || currentIndex >= itemsLen) {
            return
        }
        items[currentIndex].color = "rgb(51, 51, 51)"
        for (var i = initIndex; i > 0; i--) {
            prevIndex = currentIndex - i
            nextIndex = currentIndex + i
            color = 0.2 * (4 - i + 1)
            if (color >= 1) {
                color = 0.9
            } else if (color <= 0) {
                color = 0.1
            }
            if (prevIndex > -1 && prevIndex < itemsLen) {
                items[prevIndex].color = "rgba(51, 51, 51, " + color +")"
            } 
            if (nextIndex > -1 && nextIndex < itemsLen) {
                items[nextIndex].color = "rgba(51, 51, 51, " + color +")"
            }
        }
    } 
    function handleEvent(element, scrollArr, vmodel, eventName, event) {
        var name = element._name
        if (!scrollArr[name]) {
            scrollArr[name] = new Utils(vmodel.$model)
            scrollArr[name][eventName](element, event, vmodel)
            return 
        }
        scrollArr[name][eventName](element, event, vmodel)
    }
    var rAF = window.requestAnimationFrame  ||
        window.webkitRequestAnimationFrame  ||
        window.mozRequestAnimationFrame     ||
        window.oRequestAnimationFrame       ||
        window.msRequestAnimationFrame      ||
        function (callback) { window.setTimeout(callback, 1000 / 60); };

    var Utils = (function() {
        var util = {},
            _elementStyle = document.createElement('div').style,
            _vendor = (function () {
                var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                    transform,
                    i = 0,
                    l = vendors.length;

                for ( ; i < l; i++ ) {
                    transform = vendors[i] + 'ransform';
                    if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
                }

                return false;
            })();

        function _prefixStyle (style) {
            if ( _vendor === false ) return false;
            if ( _vendor === '' ) return style;
            return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
        }
        util.ease = {
            quadratic: {
                style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fn: function (k) {
                    return k * ( 2 - k );
                }
            },
            circular: {
                style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',   // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
                fn: function (k) {
                    return Math.sqrt( 1 - ( --k * k ) );
                }
            },
            back: {
                style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fn: function (k) {
                    var b = 4;
                    return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
                }
            },
            bounce: {
                style: '',
                fn: function (k) {
                    if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
                        return 7.5625 * k * k;
                    } else if ( k < ( 2 / 2.75 ) ) {
                        return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
                    } else if ( k < ( 2.5 / 2.75 ) ) {
                        return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
                    } else {
                        return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
                    }
                }
            },
            elastic: {
                style: '',
                fn: function (k) {
                    var f = 0.22,
                        e = 0.4;

                    if ( k === 0 ) { return 0; }
                    if ( k == 1 ) { return 1; }

                    return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
                }
            }
        }
        util.hasTransition = _prefixStyle('transition') in _elementStyle
        util.hasTransform = _prefixStyle('transform') !== false
        util.hasTouch = "ontouchstart" in window
        util.getTime = Date.now || function getTime() { return new Date().getTime()}
        util.style = {
            transform: _prefixStyle('transform'),
            transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
            transitionDuration: _prefixStyle('transitionDuration')
        }
        util.momentum = function (current, start, time, lowerMargin, higherMargin, wrapperSize, deceleration) {
            var distance = current - start,
                speed = Math.abs(distance) / time,
                destination,
                duration;

            deceleration = deceleration === undefined ? 0.0006 : deceleration

            destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 )
            duration = speed / deceleration

            if (destination < lowerMargin) {
                destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin
                distance = Math.abs(destination - current)
                duration = distance / speed
            } else if ( destination > higherMargin ) {
                destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : higherMargin
                distance = Math.abs(current) + destination
                duration = distance / speed
            }

            return {
                destination: Math.round(destination),
                duration: duration
            };
        }

        function Scroll(options) {
            this.y = 0
            this.initWheel = null
            this.useTransition = options.useTransition && util.hasTransition
            this.useTransform = options.useTransform && util.hasTransform
            this.maxScrollY = 0
            this.minScrollY = 0
            this.options = options
            this.endTime = 0
            this.bounce = true
            this.bounceTime = 600
            this.bounceEasing = ''
            this.element = null
            this.momentum = options.momentum || true
            this.momentHeight = 100
        }
        Scroll.prototype._initPosition = function(element, event, vmodel) {
            var options = vmodel.$model,
                initY = Math.floor(options.showItems / 2) * 30,
                now = new Date(),
                curHour = now.getHours(),
                curMinute = now.getMinutes(),
                dates = vmodel.dates,
                hours = vmodel.hours,
                minutes = vmodel.minutes;
            switch(element._name) {
                case "hour":
                    for (var i = 0, len = hours.length; i < len; i++) {
                        var hour = +hours[i]._hour
                        if (hour === curHour) {
                            initY = initY - (i * 30)
                            break
                        }
                    }
                break;
                case "minute":
                    for (var i = 0, len = minutes.length; i < len; i++) {
                        var minute = +minutes[i]._minute,
                            nextMinute = +(minutes[i+1] && minutes[i+1]._minute || 59),
                            interval = Number((nextMinute - minute)/2);

                        if (curMinute >= minute && curMinute <= nextMinute) {
                            if ((curMinute + interval) > nextMinute) {
                                if (i == len-1) {
                                    initY = initY - i * 30
                                } else {
                                    initY = initY - (i + 1) * 30
                                }
                            } else {
                                initY = initY - i * 30
                            }
                            break
                        }
                    }
                break;
            }
            this._scrollTo(null, element, vmodel, 0, initY)
        }
        Scroll.prototype._initMaxScroll = function(element, options) {
            var $element = avalon(element),
                halfTimerHeight = Math.floor(options.showItems / 2) * 30;

            if (!this.maxScrollY) {
                this.maxScrollY = halfTimerHeight + 30 - $element.height()
                this.minScrollY = halfTimerHeight
                this.maxMomentHeight = this.maxScrollY - this.momentHeight
                this.minMomentHeight = this.minScrollY + this.momentHeight
            }
        }
        Scroll.prototype._wheel = function (element, event, vmodel) {
            event.preventDefault()
            event.stopPropagation()

            var that = element,
                wheelDeltaY,
                newY,
                maxScrollY = 0,
                minScrollY = 0,
                options = this.options,
                dir = (event.wheelDelta || -event.detail) > 0 ? 1 : -1,
                mouseWheelSpeed = options.mouseWheelSpeed;
            this._initMaxScroll(element, options)
            maxScrollY = this.maxScrollY
            minScrollY = this.minScrollY
            wheelDeltaY = dir * mouseWheelSpeed
            newY = this.y + wheelDeltaY

            if ( newY > minScrollY ) {
                newY = minScrollY
            } else if ( newY < maxScrollY ) {
                newY = maxScrollY
            }
            this._scrollTo(event, element, vmodel, 0, newY, 0)
        }
        Scroll.prototype._resetPosition = function (event, element, vmodel, time) {
            var y = this.y,
                maxScrollY = this.maxScrollY,
                minScrollY = this.minScrollY;

            time = time || 0
            
            if (y > minScrollY) {
                y = minScrollY
            } else if (y < maxScrollY) {
                y = maxScrollY
            }

            if (y == this.y ) {
                return false
            }
            this._scrollTo(event, element, vmodel, 0, y, time, this.bounceEasing)
            return true
        }
        Scroll.prototype._scrollTo = function (event, element, vmodel, x, y, time, easing) {
            easing = easing || util.ease.circular

            if (!time || (this.useTransition && easing.style)) {
                // this._transitionTimingFunction(easing.style)
                // this._transitionTime(time)
                this._translate(element, vmodel, x, y, event)
            } else {
                this._animate(element, vmodel, x, y, time, easing.fn, event);
            }
        }
        Scroll.prototype._translate = function (element, vmodel, x, y, event) {
            var index = Math.round(y / 30),
                dataName = "",
                indexName = "",
                type = event && event.type || "";
            if (type === "mousewheel" || type === drag.eEnd) {
                y = index * 30 
            }
            switch(element._name) {
                case "date":
                    dataName = "dates"
                    indexName = "_currentDateIndex"
                break;
                case "hour":
                    dataName = "hours"
                    indexName = "_currentHourIndex"
                break;
                case "minute":
                    dataName = "minutes"
                    indexName = "_currentMinuteIndex"
                break;
            }

            renderTimer(vmodel, index, dataName, indexName)
            
            if (this.useTransform) {
                element.style[util.style.transform] = 'translateY(' + y + 'px)'
            } else {
                y = Math.round(y);
                element.top = y + 'px'
            }
            this.y = y
        }
        Scroll.prototype._animate = function (element, vmodel, destX, destY, duration, easingFn, event) {
            var that = this,
                startY = this.y,
                startTime = util.getTime(),
                destTime = startTime + duration;

            function step () {
                var now = util.getTime(),
                    newX, newY,
                    easing;

                if (now >= destTime) {
                    that.isAnimating = false
                    that._translate(element, vmodel, destX, destY, event)
                    that._resetPosition(event, element, vmodel, that.bounceTime)
                    // scrollEnd回调
                    return
                }
                now = (now - startTime) / duration
                easing = easingFn(now)
                newY = (destY - startY) * easing + startY
                that._translate(element, vmodel, newX, newY, event)
                if (that.isAnimating) {
                    rAF(step)
                }
            }
            this.isAnimating = true
            step()
        }
        Scroll.prototype._start = function (element, event, vmodel) {
            var point = event.touches ? event.touches[0] : event,
                options = this.options,
                pos;
            currentScroll = this
            this.timerId = vmodel.$id
            this.element = element
            this.distY = 0
            this.initiated = true
            this._initMaxScroll(element, options)
            this.startTime = util.getTime()
            this.startY = this.y
            this.pointY = point.pageY
        }

        Scroll.prototype._move = function (element, event, vmodel) {
            // 如果start未触发，或者this.element未定义或者currentScroll为null都说明不是拖动状态
            if (!this.initiated || !this.element || !currentScroll) return
            var point = event.touches ? event.touches[0] : event,
                deltaY = point.pageY - this.pointY,
                timestamp = util.getTime(),
                newY,
                absDistY,
                minScrollY,
                maxScrollY;

            this.pointY = point.pageY
            this.distY += deltaY
            absDistY = Math.abs(this.distY)
            // We need to move at least 10 pixels for the scrolling to initiate
            if (timestamp - this.endTime > 300 && absDistY < 10) return
            newY = this.y + deltaY
            if (this.momentum) {
                minScrollY = this.minMomentHeight
                maxScrollY = this.maxMomentHeight
            }
            if (newY > minScrollY || newY < maxScrollY) {
                newY = this.bounce ? this.y + deltaY / 3 : newY > minScrollY ? minScrollY : maxScrollY
            }
            this._translate(element, vmodel, 0, newY, event)
            if (timestamp - this.startTime > 300) {
                this.startTime = timestamp;
                this.startY = this.y;
            }
        }

        Scroll.prototype._end = function (element, event, vmodel) {
            var point = event.changedTouches ? event.changedTouches[0] : event,
                momentumY,
                duration = util.getTime() - this.startTime,
                newY = Math.round(this.y),
                distanceY = Math.abs(newY - this.startY),
                time = 0,
                easing = '',
                minScrollY = this.minScrollY,
                maxScrollY = this.maxScrollY;

            currentScroll = null
            this.initiated = false
            this.endTime = util.getTime()
            if (this._resetPosition(event, element, vmodel, this.bounceTime)) return
            this._scrollTo(event, element, vmodel, 0, newY)// ensures that the last position is rounded
            
            //start momentum animation if needed
            if (this.momentum && duration < 300) {
                //current, start, time, lowerMargin, wrapperSize, deceleration
                momentumY = util.momentum(this.y, this.startY, duration, maxScrollY, minScrollY, this.bounce ? this.options._timerHeight : 0, this.deceleration)
                newY = momentumY.destination
            }
            
            if (newY != this.y) {
                // change easing function when scroller goes out of the boundaries
                if (newY > minScrollY || newY < maxScrollY ) {
                    easing = util.ease.quadratic;
                }
                this._scrollTo(event, element, vmodel, 0, newY, time, easing);
            }
            this._scrollTo(event, element, vmodel, 0, newY)
        }

        return Scroll
    })()
    return avalon
})