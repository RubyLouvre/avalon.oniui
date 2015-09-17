require(["pages/timeline/dest/treeConfig", "pages/timeline/dest/bezier", "dialog/avalon.dialog.js"], function(indexData, dialog) {
    var ui = {};
    ui.getComputedStyle = avalon.css
    var parallaOffset = avalon(document.getElementById("parallax")).offset();
    var ndP0 = getElementsByClassName('parallax0')[0];
    var ndP1 = getElementsByClassName('parallax1')[0];
    var ndP2 = getElementsByClassName('parallax2')[0];
    var topEdge = 0;
    ndP0.style.top = parallaOffset.top + "px";
    ndP1.style.top = parallaOffset.top + "px";
    ndP2.style.top = parallaOffset.top + "px";
    var parallaxInitTop = parallaOffset.top;
    var cardinal = [1, 1.5, 1.8];
    avalon.define('www_uiguide', function(vm) {

        // 检测是否是 ie6-9
        vm.isLowIE = document.all && !window.atob;

        var supportTransition = !supportFeature('transition');
        var index = 0;
        var months = [];
        var circles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34]
        var nlNodeToScroll = [];
        var duration = 800;
        var timer;
        var storeScrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        for (var i in indexData) {
            if (indexData.hasOwnProperty(i)) {
                months.push({
                    key: i,
                    item: indexData[i]
                });
            }
        }
        vm.circles = circles;
        months.sort(function(a, b) {
            return b.key + a.key;
        });
        vm.imgUrl = '';
        vm.showBigPic = function(url) {
            vm.imgUrl = url;
            avalon.vmodels.treeLeafBig.toggle = true;
        };
        vm.$dialogOpts = {
            width: 840,
            type: "alert",
            title: "组件使用演示",
            confirmName: "关闭",
            zIndex: 1000
        };
        vm.months = months;
        vm.cb = cb;
        vm.circleCb = function() {
            var circles = getElementsByClassName('circle');
            for (var i = 0; i < circles.length; i++) {
                circles[i].style.top = (i + 1) * getRandom(270, 540) + 'px'
            }
        }
        vm.outerHeight = ui.getComputedStyle(ndP0, 'height');
        setFrame(function() {
            vm.outerHeight = ui.getComputedStyle(ndP0, 'height');
        }, 300);
        var scrollEnd = true;
        var scrollTimer;
        var timingFun;
        timingFun = Bezier.unitBezier(0.18, 0.73, 0.25, 1);
        avalon.bind(window, 'scroll', function() {
            var sTop = document.body.scrollTop || document.documentElement.scrollTop;
            var delta = storeScrollTop > sTop ? -1 : 1; //-1  线上滚动
            storeScrollTop = sTop;
            if (supportTransition) {
                scroll();
            } else {
                clearFrame(timer);
                var scrollTop = parseInt(sTop, 10);
                var top,
                    diff,
                    step = 5,
                    diffIndex,
                    target,
                    initTop = [],
                    startTime = new Date().getTime(),
                    nd;

                for (var i = 0; i < nlNodeToScroll.length; i++) {

                    initTop[i] = parseInt(nlNodeToScroll[i].style.top, 10) || 0;
                }
                setFrame(function() {
                    for (var i = 0; i < nlNodeToScroll.length; i++) {
                        nd = nlNodeToScroll[i];
                        var _initTop = delta < 0 ? parallaxInitTop : 0;
                        var ndTop = getPx(initTop[i], i) * cardinal[i] + _initTop,
                            _ndTop = ndTop < 0 ? -ndTop : ndTop;

                        var outerHeight = parseInt(ui.getComputedStyle(ndP0, 'height'));
                        vm.outerHeight = outerHeight;
                        // fixed定位情况下，考虑元素距离页面顶部和底部的距离
                        if ((outerHeight - _ndTop) <= (parallaxInitTop * 2 + 120) && nd === ndP0) {
                            continue;
                        }
                        nd.style.top = ndTop + 'px'
                    }
                });

                function getPx(initTop, i) {
                    if (isNaN(+initTop)) return;
                    diffIndex = Math.min((new Date().getTime() - startTime) / duration, 1);
                    target = initTop / cardinal[i] + timingFun(diffIndex, 800) * (-scrollTop - initTop / cardinal[i]);
                    return delta > 0 ? Math.max(target, -scrollTop) : Math.min(target, -scrollTop);
                }
            }
        });
        var nowIndex = 0;
        vm.nowIndex = {};
        for (var i = 0; i < months.length; i++) {
            vm.nowIndex[months[i].key] = nowIndex;
            nowIndex += months[i].item.length;
        }

        function cb() {
            var child = getFirstNode(this);
            if (!child) return;
            var monthNum = child.className.match(/tree__item--m(\d+)/)[1]
            var ndTarget = getElementsByClassName('month--m' + monthNum)[0];
            // var oStyle = ui.getComputedStyle(child);
            var viewTop = getElementViewTop(child);
            //根据月份下的第一个项目设置坐标位置
            if (hasClass(child, 'tree__item--right')) {
                ndTarget.style.left = getRandom(120, 250) + 'px';
            } else {
                ndTarget.style.left = (parseInt(ui.getComputedStyle(child, 'width'), 10) + getRandom(120, 250)) + 'px';
            }
            viewTop = viewTop - parallaxInitTop;
            ndTarget.style.top = (viewTop - topEdge) * (cardinal[1] - 1) + getRandom(viewTop, viewTop + parseInt(ui.getComputedStyle(child, 'height'), 10) - parseInt(ui.getComputedStyle(ndTarget, 'height'), 10)) + 'px';
            index++;
            avalon.Array.ensure(nlNodeToScroll, ndP0);
            avalon.Array.ensure(nlNodeToScroll, ndP1);
            avalon.Array.ensure(nlNodeToScroll, ndP2);
        }

        function hasClass(nd, cn) {
            return new RegExp('(^|\s*)' + cn + '(\s*|$)').test(nd.className);
        }

        function getItemByMonth(m) {
            for (var i = 0; i < months.length; i++) {
                if (months[i].key == m) return months[i].item.length;
            }
        }

        function getRandom(from, to) {
            return from + Math.random() * (-from + to)
        }

        function getFirstNode(nd) {
            var nlChild = nd.childNodes;
            for (var i = 0; i < nlChild.length; i++) {
                if (nlChild.item(i).nodeType === 1) {
                    return nlChild.item(i);
                }
            }

        }

        function getElementViewTop(element) {
            var actualTop = element.offsetTop;
            var current = element.offsetParent;
            while (current !== null) {
                actualTop += current.offsetTop;
                current = current.offsetParent;
            }
            return actualTop;
        }

        function scroll() {
            var nd,
                scrollTop = parseInt((document.body.scrollTop || document.documentElement.scrollTop), 10);

            if (nlNodeToScroll.length < 1) return;
            for (var i = 0; i < nlNodeToScroll.length; i++) {
                nd = nlNodeToScroll[i]
                nd.style.top = -(scrollTop * cardinal[i]) + 'px'
            }

        }

        function supportFeature(feature) { //不检查支持前缀的
            var b = document.body || document.documentElement;
            var style = b.style,
                //v = ['Moz', 'webkit', 'Webkit', 'Khtml', 'O', 'ms'],
                v = [],
                f = feature;

            if (typeof style[feature] === 'string') return true;
            f = f.charAt(0).toUpperCase() + f.substr(1);
            for (var i = 0; i < v.length; i++) {
                if (typeof style[v[i] + f] === 'string') {
                    return true;
                }
            }
            return false;
        }

        function setFrame(cb, frameNum) {
            if (window.requestAnimationFrame && !frameNum) {
                timer = window.requestAnimationFrame(function() {
                    cb();
                    timer = window.requestAnimationFrame(arguments.callee);
                });
            } else {
                timer = window.setTimeout(function() {
                    cb();
                    window.setTimeout(arguments.callee, 1000 / 60);
                }, 1000 * (frameNum || 1) / 60);
            }
        }

        function clearFrame(id) {
            if (window.cancelAnimationFrame) {
                window.cancelAnimationFrame(id);
            } else {
                window.clearTimeout(id);
            }
        }
    });
    avalon.scan();

    function getElementsByClassName(cn) {
        if ('querySelector' in document && typeof document.querySelector === 'function') {
            return document.querySelectorAll('.' + cn);
        } else if ('getElementsByClassName' in document && typeof document.getElementsByClassName === 'function') {
            return document.getElementsByClassName(cn);
        } else {
            elements = document.all; //getElementsByTagName("*");
            var results = [];
            pattern = new RegExp("(^|\\s)" + cn + "(\\s|$)");
            for (i = 0; i < elements.length; i++) {
                if (pattern.test(elements[i].className)) {
                    results.push(elements[i]);
                }
            }
            return results
        }
    }
});