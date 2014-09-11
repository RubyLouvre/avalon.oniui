define(["avalon",
    "text!./avalon.timer.html",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.timer.css"
], function(avalon, template) {
    var initIndex = 0
    var widget = avalon.ui.timer = function(element, data, vmodels) {
        var options = data.timerOptions
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        avalon.mix(options, initDatas(options))
        initIndex = Math.floor(options.showItems / 2)
        var vmodel = avalon.define(data.timerId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.$skipArray = ["widgetElement", "eventType"]
            vm._timerHeight = 0
            vm._timerWidth = 0
            vm._hourLeft = 0
            vm._minuteLeft = 0
            vm._currentDateIndex = initIndex
            vm._currentHourIndex = initIndex
            vm._currentMinuteIndex = initIndex
            vm._eventCallback = function(eventType, event) {
                var element = this
                element.vmodel = vmodel
                switch(eventType) {
                    case "mousewheel" :
                        utils._wheel(element, event, vmodel.$model)
                        break;
                    case "start" : 
                        // utils._start()
                        break;
                    case "move" :
                        // utils._move()

                        break;
                    case "end" :
                        // utils._end()
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
                var template = options.template.replace(/MS_OPTION_BIND_EVENTS/mg, bindEvents(options.eventType))
                console.log(template)
                element.innerHTML = template
                vmodel._timerHeight = 30 * options.showItems
                renderTimer(vmodel, 0, "dates", "_currentDateIndex")
                renderTimer(vmodel, 0, "hours", "_currentHourIndex")
                renderTimer(vmodel, 0, "minutes", "_currentMinuteIndex")
                avalon.scan(element, [vmodel].concat(vmodels))
                setTimeout(function() {
                    var divs = element.getElementsByTagName("div"),
                        div = null,
                        dateElement = null,
                        hourElement = null,
                        minuteElement = null,
                        className = "",
                        dateElementWidth = 0,
                        hourElementWidth = 0;

                    for (var i = 0, len = divs.length; i < len; i++) {
                        div = divs[i]
                        className = div.className
                        if (className.indexOf("ui-timer-date") != -1) {
                            dateElement = div
                            div.date = true
                        } else if (className.indexOf("ui-timer-hour") != -1) {
                            hourElement = div
                            div.hour = true
                        } else if (className.indexOf("ui-timer-minute") != -1) {
                            minuteElement = div
                            div.minute = true
                        }
                    }
                    dateElementWidth = avalon(dateElement).outerWidth()
                    vmodel._hourLeft = dateElementWidth
                    hourElementWidth = vmodel._minuteLeft = dateElementWidth + avalon(hourElement).outerWidth()
                    vmodel._timerWidth = hourElementWidth + avalon(minuteElement).outerWidth()
                    console.log(vmodel._timerWidth)
                }, 100)
            }
            vm.$remove = function() {

            }
        })
        return vmodel
    }
    widget.defaults = {
        showItems: 9,
        showYears: false,
        eventType: "mousewheel",
        mouseWheelSpeed: 20,
        useTransition: true,
        useTransform: true,
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
            year = 0,
            month = 0,
            day = 0,
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
                hours.push({hour: hour, _hour: i, color: "rgba(51, 51, 51, 1)"})
            }
        }
        if (minutes = !options.getMinutes()) {
            minutes = []
            for (i = 0; i < 60; i+=5) {
                minute = formatNum(i, 2)
                minutes.push({minute: minute, _minute: i, color: "rgba(51, 51, 51, 1)"})
            }
        }
        if (dates = !options.getDates()) {
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
    function bindEvents(type) {
        var touch = typeof window.ontouchstart !== 'undefined',
            drag = {
                eStart : (touch ? 'touchstart' : 'mousedown'),
                eMove  : (touch ? 'touchmove' : 'mousemove'),
                eEnd   : (touch ? 'touchend' : 'mouseup'),
            },
            eventStr = "";
        if (type === "mousewheel") {
            eventStr = "ms-on-mousewheel='_eventCallback(" + '"' + type + '", $event' +  ")'"
        } else {
            eventStr = "ms-on-" + drag.eStart + "='_eventCallback(" + '"start", $event'+ ")' ms-on-" + drag.eMove + "='_eventCallback(" + '"move", $event'+ ")' ms-on-" + drag.eEnd + "='_eventCallback(" + '"end", $event'+ ")'"
        }

        return eventStr
    }
    function renderTimer(vmodel, index, dataName, indexName) {
        var currentIndex = -index + initIndex,
            items,
            prevIndex = 0,
            nextIndex = 0,
            color = 0;

        vmodel[indexName] = currentIndex
        items = vmodel[dataName]
        for (var i = initIndex; i > 0; i--) {
            prevIndex = currentIndex - i
            nextIndex = currentIndex + i
            color = 0.2 * (4 - i + 1)
            if (color >= 1) {
                color = 0.9
            } else if (color <= 0) {
                color = 0.1
            }
            if (prevIndex > -1) {
                items[prevIndex].color = "rgba(51, 51, 51, " + color +")"
            } 
            if (nextIndex < items.length) {
                items[nextIndex].color = "rgba(51, 51, 51, " + color +")"
            }
        }
    } 

    var utils = (function() {
        var scroll = {y: 0},
            util = {},
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
            transform: _prefixStyle('transform')
        }

        scroll.wheelTimeout = null
        scroll._wheel = function (element, event, options) {
            event.preventDefault()
            event.stopPropagation()

            var that = element,
                wheelDeltaX, wheelDeltaY,
                newX, newY,
                maxScrollY = 0,
                minScrollY = 0,
                $element = avalon(element),
                halfTimerHeight = Math.floor(options.showItems / 2) * 30;

            if (!this.initWheel) {
                this.initWheel = function(options) {
                    this.useTransition = options.useTransition && util.hasTransition
                    this.useTransform = options.useTransform && util.hasTransform
                }
                this.initWheel(options)
            }
            if (!element.maxScrollY) {
                element.maxScrollY = halfTimerHeight + 30 - $element.height()
                element.minScrollY = halfTimerHeight
            }
            maxScrollY = element.maxScrollY
            minScrollY = element.minScrollY

            // if ( this.wheelTimeout === undefined ) {
            //     that._execEvent('scrollStart');
            // }

            // Execute the scrollEnd event after 400ms the wheel stopped scrolling
            // clearTimeout(this.wheelTimeout)
            // this.wheelTimeout = setTimeout(function() {
            //     that._execEvent('scrollEnd');
            //     that.wheelTimeout = undefined;
            // }, 400)

            var dir = (event.wheelDelta || -event.detail) > 0 ? 1 : -1,
                mouseWheelSpeed = options.mouseWheelSpeed;

            wheelDeltaX = dir * mouseWheelSpeed
            wheelDeltaY = dir * mouseWheelSpeed

            // wheelDeltaX *= this.options.invertWheelDirection;
            // wheelDeltaY *= this.options.invertWheelDirection;

            // if ( !this.hasVerticalScroll ) {
            //     wheelDeltaX = wheelDeltaY;
            //     wheelDeltaY = 0;
            // }

            // if ( this.options.snap ) {
            //     newX = this.currentPage.pageX;
            //     newY = this.currentPage.pageY;

            //     if ( wheelDeltaX > 0 ) {
            //         newX--;
            //     } else if ( wheelDeltaX < 0 ) {
            //         newX++;
            //     }

            //     if ( wheelDeltaY > 0 ) {
            //         newY--;
            //     } else if ( wheelDeltaY < 0 ) {
            //         newY++;
            //     }

            //     this.goToPage(newX, newY);

            //     return;
            // }

            newY = this.y + wheelDeltaY

            if ( newY > minScrollY ) {
                newY = minScrollY
            } else if ( newY < maxScrollY ) {
                newY = maxScrollY
            }

            this._scrollTo(element, 0, newY, 0)

        }
        scroll._scrollTo = function (element, x, y, time, easing) {
            easing = easing || util.ease.circular

            this.isInTransition = this.useTransition && time > 0

            if (!time || (this.useTransition && easing.style)) {
                // this._transitionTimingFunction(easing.style)
                // this._transitionTime(time)
                this._translate(element, x, y)
            } else {
                this._animate(element, x, y, time, easing.fn);
            }
        }
        scroll._translate = function (element, x, y) {
            var index = Math.round(y / 30),
                dataName = "",
                indexName = "";

            y = index * 30 
            if (element.date) {
                dataName = "dates"
                indexName = "_currentDateIndex"
            } else if (element.hour) {
                dataName = "hours"
                indexName = "_currentHourIndex"
            } else if (element.minute) {
                dataName = "minutes"
                indexName = "_currentMinuteIndex"
            }
            renderTimer(element.vmodel, index, dataName, indexName)
            
            if (this.useTransform) {
                element.style[util.style.transform] = 'translateY(' + y + 'px)'
            } else {
                y = Math.round(y);
                element.top = y + 'px'
            }
            this.y = y
        }
        scroll._animate = function (element, destX, destY, duration, easingFn) {
            var that = this,
                startX = this.x,
                startY = this.y,
                startTime = util.getTime(),
                destTime = startTime + duration;

            function step () {
                var now = util.getTime(),
                    newX, newY,
                    easing;

                if (now >= destTime) {
                    that.isAnimating = false
                    that._translate(element, destX, destY)

                    // if (!that.resetPosition(that.options.bounceTime)) {
                    //     that._execEvent('scrollEnd');
                    // }
                    return;
                }

                now = (now - startTime) / duration
                easing = easingFn(now)
                newY = (destY - startY) * easing + startY
                that._translate(element, newX, newY)

                // if (that.isAnimating) {
                //     rAF(step)
                // }
            }

            this.isAnimating = true;
            step();
        }

        scroll._start = function (e) {
            // React to left mouse button only
            if ( utils.eventType[e.type] != 1 ) {
                if ( e.button !== 0 ) {
                    return;
                }
            }

            if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
                return;
            }

            if ( this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
                e.preventDefault();
            }

            var point = e.touches ? e.touches[0] : e,
                pos;

            this.initiated  = utils.eventType[e.type];
            this.moved      = false;
            this.distX      = 0;
            this.distY      = 0;
            this.directionX = 0;
            this.directionY = 0;
            this.directionLocked = 0;

            this._transitionTime();

            this.startTime = utils.getTime();

            if ( this.options.useTransition && this.isInTransition ) {
                this.isInTransition = false;
                pos = this.getComputedPosition();
                this._translate(Math.round(pos.x), Math.round(pos.y));
                this._execEvent('scrollEnd');
            } else if ( !this.options.useTransition && this.isAnimating ) {
                this.isAnimating = false;
                this._execEvent('scrollEnd');
            }

            this.startX    = this.x;
            this.startY    = this.y;
            this.absStartX = this.x;
            this.absStartY = this.y;
            this.pointX    = point.pageX;
            this.pointY    = point.pageY;

            this._execEvent('beforeScrollStart');
        },

        scroll._move = function (e) {
            if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
                return;
            }

            if ( this.options.preventDefault ) {    // increases performance on Android? TODO: check!
                e.preventDefault();
            }

            var point       = e.touches ? e.touches[0] : e,
                deltaX      = point.pageX - this.pointX,
                deltaY      = point.pageY - this.pointY,
                timestamp   = utils.getTime(),
                newX, newY,
                absDistX, absDistY;

            this.pointX     = point.pageX;
            this.pointY     = point.pageY;

            this.distX      += deltaX;
            this.distY      += deltaY;
            absDistX        = Math.abs(this.distX);
            absDistY        = Math.abs(this.distY);

            // We need to move at least 10 pixels for the scrolling to initiate
            if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
                return;
            }

            // If you are scrolling in one direction lock the other
            if ( !this.directionLocked && !this.options.freeScroll ) {
                if ( absDistX > absDistY + this.options.directionLockThreshold ) {
                    this.directionLocked = 'h';     // lock horizontally
                } else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
                    this.directionLocked = 'v';     // lock vertically
                } else {
                    this.directionLocked = 'n';     // no lock
                }
            }

            if ( this.directionLocked == 'h' ) {
                if ( this.options.eventPassthrough == 'vertical' ) {
                    e.preventDefault();
                } else if ( this.options.eventPassthrough == 'horizontal' ) {
                    this.initiated = false;
                    return;
                }

                deltaY = 0;
            } else if ( this.directionLocked == 'v' ) {
                if ( this.options.eventPassthrough == 'horizontal' ) {
                    e.preventDefault();
                } else if ( this.options.eventPassthrough == 'vertical' ) {
                    this.initiated = false;
                    return;
                }

                deltaX = 0;
            }

            deltaX = this.hasHorizontalScroll ? deltaX : 0;
            deltaY = this.hasVerticalScroll ? deltaY : 0;

            newX = this.x + deltaX;
            newY = this.y + deltaY;

            // Slow down if outside of the boundaries
            if ( newX > 0 || newX < this.maxScrollX ) {
                newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
            }
            if ( newY > 0 || newY < this.maxScrollY ) {
                newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
            }

            this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            if ( !this.moved ) {
                this._execEvent('scrollStart');
            }

            this.moved = true;

            this._translate(newX, newY);
            if ( timestamp - this.startTime > 300 ) {
                this.startTime = timestamp;
                this.startX = this.x;
                this.startY = this.y;
            }
        },

        scroll._end = function (e) {
            if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
                return;
            }

            if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
                e.preventDefault();
            }

            var point = e.changedTouches ? e.changedTouches[0] : e,
                momentumX,
                momentumY,
                duration = utils.getTime() - this.startTime,
                newX = Math.round(this.x),
                newY = Math.round(this.y),
                distanceX = Math.abs(newX - this.startX),
                distanceY = Math.abs(newY - this.startY),
                time = 0,
                easing = '';

            this.isInTransition = 0;
            this.initiated = 0;
            this.endTime = utils.getTime();

            // reset if we are outside of the boundaries
            if ( this.resetPosition(this.options.bounceTime) ) {
                return;
            }

            this.scrollTo(newX, newY);  // ensures that the last position is rounded

            // we scrolled less than 10 pixels
            if ( !this.moved ) {
                if ( this.options.tap ) {
                    utils.tap(e, this.options.tap);
                }

                if ( this.options.click ) {
                    utils.click(e);
                }

                this._execEvent('scrollCancel');
                return;
            }

            if ( this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100 ) {
                this._execEvent('flick');
                return;
            }

            // start momentum animation if needed
            if ( this.options.momentum && duration < 300 ) {
                momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
                momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
                newX = momentumX.destination;
                newY = momentumY.destination;
                time = Math.max(momentumX.duration, momentumY.duration);
                this.isInTransition = 1;
            }


            if ( this.options.snap ) {
                var snap = this._nearestSnap(newX, newY);
                this.currentPage = snap;
                time = this.options.snapSpeed || Math.max(
                        Math.max(
                            Math.min(Math.abs(newX - snap.x), 1000),
                            Math.min(Math.abs(newY - snap.y), 1000)
                        ), 300);
                newX = snap.x;
                newY = snap.y;

                this.directionX = 0;
                this.directionY = 0;
                easing = this.options.bounceEasing;
            }
            if ( newX != this.x || newY != this.y ) {
                // change easing function when scroller goes out of the boundaries
                if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
                    easing = utils.ease.quadratic;
                }

                this.scrollTo(newX, newY, time, easing);
                return;
            }
            this._execEvent('scrollEnd');
        }

        return scroll
    })()
    return avalon
})



