/**
  * @description scrollbar组件，自定义滚动条样式，绑定ms-widget="scrollbar"的元素内必须包含一个class="ui-scrollbar-scroller"的视窗元素
  */
define(["avalon", "text!./avalon.scrollbar.html", "../draggable/avalon.draggable", "css!./avalon.scrollbar.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {

    // get by className, not strict
    function getByClassName(cname, par) {
        var par = par || document.body
        if(par.getElementsByClassName) {
            return par.getElementsByClassName(cname)
        } else {
            var child = par.getElementsByTagName("*"),
                arr = []
            avalon.each(child, function(i, item) {
                var ele = avalon(item)
                if(ele.hasClass(cname)) arr.push(item)
            })
            return arr
        }
    }

    function strToNumber(s) {
        return Math.round(parseFloat(s)) || 0
    }

    // 响应wheel,binded
    var wheelBinded,
        wheelArr = [],
        keyArr = []

    var widget = avalon.ui.scrollbar = function(element, data, vmodels) {
        var options = data.scrollbarOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.scrollbarId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.draggerHeight = vm.draggerWidth = ""
            vm.inFocuse = false
            vm._position = []
            vm.viewElement = element
            vm.dragging = false

            var inited,
                bars = [],
                scroller
            vm.$init = function() {
                if(inited) return
                inited = true
                vmodel.widgetElement.style.position = "relative"
                //document body情形需要做一下修正
                vmodel.viewElement = vmodel.widgetElement == document.body ? document.getElementsByTagName(
                    "html")[0] : vmodel.widgetElement
                vmodel.viewElement.style.overflow = vmodel.viewElement.style.overflowX = vmodel.viewElement.style.overflowY = "hidden"
                if(vmodel.widgetElement == document.body) vmodel.widgetElement.style.overflow = vmodel.widgetElement.style.overflowX = vmodel.widgetElement.style.overflowY = "hidden"
                vmodel._position = vmodel.position.split(",")

                var frag = avalon.parseHTML(options.template)
                vmodel.widgetElement.appendChild(frag)
                avalon.scan(element, [vmodel].concat(vmodels))
                var children = vmodel.widgetElement.childNodes
                avalon.each(children, function(i, item) {
                    var ele = avalon(item)
                    if(ele.hasClass("ui-scrollbar")) {
                        bars.push(ele)
                    } else if(ele.hasClass("ui-scrollbar-scroller")) {
                        scroller = ele
                    }
                })
                // 竖直方向支持滚轮事件
                if(vmodel.position.match(/left|right/g)) {
                    var vs = [],hs = []
                    avalon.each(vmodel._position, function(i, item) {
                        if(item.match(/left|right/g)) {
                            vs.push([i, item])
                        } else {
                            hs.push([i, item])
                        }
                    })

                    function wheelLike(diretion, arr, e, func) {
                        avalon.each(arr, function(i, item) {
                            if(!bars[i].data("ui-scrollbar-needed")) return
                            vmodel._computer(func || function(obj) {
                                return vmodel._clickComputer(obj, diretion)
                            }, item[0], item[1], function(breakOut) {
                                if(!breakOut) e.preventDefault()
                            }, "breakOutCallbackCannotIgnore")
                        })
                    }
                    function myOnWheel(e) {
                        if(vmodel.disabled) return
                        if(vmodel.inFocuse) {
                            wheelLike(e.wheelDelta > 0 ? "up" : "down", vs, e)
                        }
                    }
                    function myKeyDown(e) {
                        if(vmodel.disabled) return
                        var k = e.keyCode
                        if(k > 32 && k < 41 & vmodel.inFocuse) {
                            // 方向按键
                            if(k in {37:1, 39: 1, 38: 1, 40:1}) {
                                wheelLike(k in {37:1, 38:1} ? "up" : "down", k in {38: 1, 40:1} ? vs : hs, e)
                            // end or home
                            // pageup or pagedown
                            } else{
                                var diretion = k in {33: 1, 36: 1} ? "up" : "down"
                                wheelLike(diretion, vs, e, function(obj) {
                                    var _top = scroller[0].scrollTop
                                    // home, pageup
                                    if(k in {33: 1, 36: 1}) {
                                        if(_top) e.preventDefault()
                                    // end, pagedown
                                    } else {
                                        if(_top < obj.scrollerH - obj.viewH) e.preventDefault()
                                    }
                                    // home or end
                                    // end plus 100, easy to trigger breakout
                                    if(k in {36: 1, 35: 1}) {
                                        return {
                                            x: 0,
                                            y: k == 36 ? 0 : obj.draggerparHeight - obj.draggerHeight + 100
                                        }
                                    // pageup or pagedown
                                    // a frame
                                    } else {
                                        // frame 计算方式更新为百分比
                                        var frame = (obj.draggerparHeight - obj.draggerHeight) * obj.viewH / (obj.scrollerH - obj.viewH)
                                        return vmodel._clickComputer(obj, diretion, strToNumber(frame) || 1)
                                    }
                                })
                            }
                        }
                    }
                    // document.body直接如此处理
                    if(vmodel.widgetElement == document.body) {
                        vmodel.inFocuse = true
                        wheelArr.push(myOnWheel)
                        keyArr.push(myKeyDown)
                    } else {
                        avalon.bind(element, "mouseenter", function(e) {
                            vmodel.inFocuse = true
                            wheelArr.push(myOnWheel)
                            keyArr.push(myKeyDown)
                        })
                        avalon.bind(element, "mouseleave", function(e) {
                            vmodel.inFocuse = false
                            for(var i = 0, len = wheelArr.length; i < len; i++) {
                                if(wheelArr[i] === myOnWheel) {
                                    wheelArr.splice(i, 1)
                                    keyArr.splice(i, 1)
                                    break
                                }
                            }
                        })
                    }
                    // 所有组件实例公用一个事件绑定
                    if(!wheelBinded) {
                        wheelBinded = true
                        avalon.bind(document, "mousewheel", function(e) {
                            var cb = wheelArr[wheelArr.length - 1]
                            cb && cb(e)
                        })
                        // keyborad,,,simida
                        // left 37
                        // right 39
                        // top 38
                        // down 40
                        // pageup 33
                        // pagedown 34
                        // home 36
                        // end 35
                        avalon.bind(document, "keydown", function(e) {
                           var cb = keyArr[keyArr.length - 1]
                            cb && cb(e)
                        })
                    }

                }


                avalon.bind(element, "mouseenter", function() {
                    avalon.each(bars, function(i, item) {
                        vmodel._show("e", false, item)
                    })
                })
                avalon.bind(element, "mouseleave", function() {
                    vmodel._hide()
                })

                vmodel.update("init")
                
                // callback after inited
                if(typeof options.onInit === "function" ) {
                    //vmodels是不包括vmodel的 
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }

            // data-draggable-before-start="beforeStartFn" 
            // data-draggable-start="startFn" 
            // data-draggable-drag="dragFn" 
            // data-draggable-before-stop="beforeStopFn" 
            // data-draggable-stop="stopFn" 
            // data-draggable-containment="parent" 
            vm.$draggableOpts = {
                beforeStart: function() {
                    vmodel.dragging = true
                },
                drag: function(e, data) {
                    var dr = avalon(data.element)
                    vmodel._computer(function(obj) {
                        var a = {
                            x: strToNumber(dr.css("left")) >> 0,
                            y: strToNumber(dr.css("top")) >> 0
                        }
                        // easy to break out
                        if(a.x == obj.draggerparWidth - obj.draggerWidth) a.x += 100
                        if(a.y == obj.draggerparHeight - obj.draggerHeight) a.y += 100
                        return a
                    }, dr.attr("ui-scrollbar-index"), dr.attr("ui-scrollbar-pos"))
                }, 
                handle: function(e, data) {
                    return !vmodel.disabled && this
                },
                containment: "parent"
            }
            vm.$draggableOpts.stop = function(e, data) {
                vmodel.$draggableOpts.drag(e, data)
                vmodel.dragging = false
                avalon(data.element).removeClass("ui-state-active")
            }

            vm.$remove = function() {
                avalon.each(bars, function(i, bar) {
                    bar[0] && bar[0].parentNode && bar[0].parentNode.removeChild(bar[0])
                })
            }

            vm._onScroll = function() {
                if(vmodel.show != "scrolling") return     
                avalon.each(bars, function(i, item) {
                    vmodel._show("e", false, item)
                })
            }
            vm._show = function(e, always, index) {
                if(vmodel.show != "scrolling") return
                e.stopPropagation && e.stopPropagation()
                var item = index.css ? index : bars[index]
                if(item) {
                    clearTimeout(item.data("ui-scrollbar-hidetimer"))
                    item.css("visibility", "visible")
                    item.css("opacity", 1)
                    if(!always) {
                        item.data("ui-scrollbar-hidetimer", setTimeout(function() {
                            item.css("opacity", 0)
                        }, 1000))
                    }
                }
            }
            vm._hide = function(e,index) {
                if(vmodel.show != "scrolling") return
                if(index && bars[index]) {
                    bars[index].css("opacity", 0)
                } else {
                    avalon.each(bars, function(i, item) {
                        item.css("opacity", 0)
                    })
                }
            }
            //@method getBars()返回所有的滚动条元素，avalon元素对象
            vm.getBars = function() {
                return bars
            }
            //@method getScroller()返回scroller avalon对象
            vm.getScroller = function() {
                return scroller
            }
            //@method update()更新滚动条状态，windowresize，内容高度变化等情况下调用，不能带参数
            vm.update = function(ifInit, x, y) {
                if(vmodel.disabled) return
                var ele = avalon(vmodel.viewElement),
                    // 滚动内容宽高
                    viewW,
                    viewH,
                    // 计算滚动条可以占据的宽或者高
                    barH = strToNumber(ele.css("height")),
                    barW = strToNumber(ele.css("width")),
                    // 滚动视野区宽高，存在滚动视野区宽高和滚动宽高不一致的情况
                    h = vmodel.viewHeightGetter(ele),
                    w = vmodel.viewWidthGetter(ele),
                    p = vmodel.position,
                    barDictionary,
                    barMinus = {},
                    y = y == void 0 ? vmodel.scrollTop : y,
                    x = x == void 0 ? vmodel.scrollLeft : x
                //document body情形需要做一下修正
                if(vmodel.viewElement != vmodel.widgetElement) {
                    p.match(/right|left/g) && avalon(vmodel.widgetElement).css("height", barH)
                }
                // 水平方向内间距
                var hPadding = scroller.width() - scroller.innerWidth(),
                    // 竖直方向内间距
                    vPadding = scroller.height() - scroller.innerHeight()
                scroller.css("height", h + vPadding)
                scroller.css("width", w + hPadding )
                viewW = scroller[0].scrollWidth
                viewH = scroller[0].scrollHeight
                barDictionary = {
                    "top": p.match(/top/g) && viewW > w,
                    "right": p.match(/right/g) && viewH > h,
                    "bottom": p.match(/bottom/g) && viewW > w,
                    "left": p.match(/left/g) && viewH > h
                }
                if(bars.length > 1) {
                    var ps = ["top", "right", "bottom", "left"]
                    for(var i = 0; i < 4; i++) {
                        barMinus[ps[i]] = [(barDictionary[i ? ps[i - 1] : ps[3]] && 1) >> 0, (barDictionary[i < 3 ? ps[i + 1] : ps[0]] && 1) >> 0]
                        if(i > 1) barMinus[ps[i]] = barMinus[ps[i]].reverse()
                    }
                }
                // 根据实际视窗计算，计算更新scroller的宽高
                // 更新视窗
                h = scroller.innerHeight()
                w = scroller.innerWidth()
                avalon.each(vmodel._position, function(i, item) {
                    var bar = bars[i],
                        isVertical = item.match(/left|right/),
                        dragger
                    if(bar) {
                        dragger = avalon(getByClassName("ui-scrollbar-dragger", bar.element)[0])
                    }
                    // 拖动逻辑前移，确保一定是初始化了的
                    if(ifInit && dragger) {
                        dragger.attr("ms-draggable", "$,$draggableOpts")
                        dragger.attr("ui-scrollbar-pos", item)
                        dragger.attr("ui-scrollbar-index", i)
                        avalon.scan(dragger[0], vmodel)
                    }
                    // hidden bar
                    if(!barDictionary[item]) {
                        if(bar) {
                            bar.css("opacity", 0)
                            bar.css("visibility", "hidden")
                            bar.data("ui-scrollbar-needed", false)
                        }
                        return
                    } else {
                        if(bar) {
                            bar.data("ui-scrollbar-needed", true)
                            bar.css("visibility", "visible")
                            if(vmodel.show == "scrolling" || vmodel.show == "never"){
                                bar.css("opacity", 0)
                            } else {
                                bar.css("opacity", 1)
                            }
                        }
                    }
                    if(bar) {
                        var sh = strToNumber(bar.css("height")),
                            sw = strToNumber(bar.css("width")),
                            bh = sh,
                            bw = sw,
                            draggerpar = avalon(getByClassName("ui-scrollbar-draggerpar", bar[0])[0]),
                            headerLength = vmodel.showBarHeader ? 2 : 0
                        // 更新滚动条没有两端的箭头的时候依旧要重新计算相邻两个bar的间隔
                        var draggerParCss = []
                        if(bars.length > 1) {
                            var barCss = [], minus = barMinus[item]
                            if(isVertical) {
                                barCss = [
                                    ["top", minus[0] * bw],
                                    ["height", (barH - bw * (minus[0] + minus[1]))]
                                ]
                                draggerParCss = [
                                    ["top", (headerLength/2) * bw],
                                    ["height", (barH - bw * (minus[0] + minus[1] + headerLength))]
                                ]
                            } else {
                                barCss = [
                                    ["left", minus[0] * bh],
                                    ["width", (barW - bh * (minus[0] + minus[1]))]
                                ]
                                draggerParCss = [
                                    ["left", (headerLength/2) * bh],
                                    ["width", (barW - bh * (headerLength + minus[0] + minus[1]))]
                                ]
                            }
                            avalon.each(barCss, function(index, css) {
                                bar.css.apply(bar, css)
                            })
                            bh = bar.height()
                            bw = bar.width()
                        } else {
                            if(isVertical) {
                                draggerParCss = [
                                    ["top", bw],
                                    ["height", (barH - bw * 2)]
                                ]
                            } else {
                                draggerParCss = [
                                    ["left", bh],
                                    ["width", (barW - bh * 2)]
                                ]
                            }
                        }
                        var ex
                        if(isVertical) {
                            ex = vmodel.show == "always" ? bw : 0
                            scroller.css("width", w + vPadding - ex)
                        } else {
                            ex = vmodel.show == "always" ? bh : 0
                            scroller.css("height", h + hPadding - ex)
                        }
                        avalon.each(draggerParCss, function(index, css) {
                            draggerpar.css.apply(draggerpar, css)
                        })
                        sh = bh - headerLength * bw
                        sw = bw - headerLength * bh
                        // 更新滚动头
                        var draggerCss
                        if(isVertical) {
                            var draggerTop = y,
                                draggerHeight =strToNumber(h * sh / viewH)
                                // 限定一个dragger的最小高度
                                draggerHeight = vmodel.limitRateV * bw > draggerHeight && vmodel.limitRateV * bw || draggerHeight
                                draggerTop = draggerTop < 0 ? 0 : draggerTop
                                draggerTop = draggerTop > viewH - h ? viewH - h : draggerTop
                                //draggerTop = sh * draggerTop / viewH
                                draggerTop = strToNumber((sh - draggerHeight) * draggerTop / (viewH - h))
                                draggerTop = Math.min(sh - draggerHeight, draggerTop)
                            draggerCss = [
                                ["width", "100%"],
                                ["height", draggerHeight],
                                ["top", draggerTop]
                            ]
                            y = y > 0 ? (y > viewH - h + ex ?  viewH - h + ex : y) : 0
                        } else {
                            var draggerLeft = x,
                                draggerWidth = strToNumber(w * sw / viewW)
                                // limit width to limitRateH * bh
                                draggerWidth = vmodel.limitRateH * bh > draggerWidth && vmodel.limitRateH * bh || draggerWidth
                                draggerLeft = draggerLeft < 0 ? 0 : draggerLeft
                                draggerLeft = draggerLeft > viewW - w ? viewW - w : draggerLeft
                                // draggerLeft = sw * draggerLeft / viewW
                                draggerLeft = strToNumber((sw - draggerWidth) * draggerLeft / (viewW - w))
                                draggerLeft = Math.min(sw - draggerWidth, draggerLeft)
                            draggerCss = [
                                ["height", "100%"],
                                ["width", draggerWidth],
                                ["left", draggerLeft]
                            ]
                            x = x > 0 ? (x > viewW - w + ex ? viewW - w + ex : x) : 0
                        }
                        avalon.each(draggerCss, function(index, css) {
                            dragger.css.apply(dragger, css)
                        })
                        if(ifInit) {
                            if(isVertical) {
                                vmodel._scrollTo(void 0, y)
                            } else {
                                vmodel._scrollTo(x, void 0)
                            }
                        }
                        if(vmodel.showBarHeader) {
                            if(y == 0 && isVertical || !isVertical && x == 0) {
                                avalon(getByClassName("ui-scrollbar-arrow-up", bar[0])[0]).addClass("ui-state-disabled")
                            } else {
                                avalon(getByClassName("ui-scrollbar-arrow-up", bar[0])[0]).removeClass("ui-state-disabled")
                            }
                            if(y >= draggerpar.innerHeight() - dragger.innerHeight() && isVertical || !isVertical && x >= draggerpar.innerWidth() - dragger.innerWidth()) {
                               !vmodel.breakOutCallback && avalon(getByClassName("ui-scrollbar-arrow-down", bar[0])[0]).addClass("ui-state-disabled")
                            } else {
                                avalon(getByClassName("ui-scrollbar-arrow-down", bar[0])[0]).removeClass("ui-state-disabled")
                            }
                        }
                    }
                })
            }

            // 点击箭头
            vm._arrClick = function(e, diretion, position, barIndex) {
                if(vmodel.disabled) return
                vmodel._computer(function(obj) {
                    return vmodel._clickComputer(obj, diretion)
                }, barIndex, position)
            }

            vm._clickComputer = function(obj, diretion, step) {
                var step = step || obj.step || 40,
                    l = strToNumber(obj.dragger.css("left")) >> 0,
                    r = strToNumber(obj.dragger.css("top")) >> 0,
                    x = diretion == "down" ? l + step : l - step,
                    y = diretion == "down" ? r + step : r - step
                return {
                    x: x,
                    y: y
                }
            }
            // 长按
            vm._arrDown = function($event, diretion, position, barIndex,ismouseup) {
                if(vmodel.disabled) return
                var se = this,
                    ele = avalon(se)
                clearInterval(ele.data("mousedownTimer"))
                clearTimeout(ele.data("setTimer"))
                var bar = bars[barIndex]
                if(ismouseup || ele.hasClass("ui-state-disabled")) {
                    return ele.removeClass("ui-state-active")
                }
                // 延时开启循环
                ele.data("setTimer", setTimeout(function(){
                    ele.addClass("ui-state-active")
                    ele.data("mousedownTimer", setInterval(function() {
                        return vmodel._computer(function(obj) {
                                return vmodel._clickComputer(obj, diretion)
                            }, barIndex, position ,function(breakOut) {
                                if(!breakOut) return
                                clearInterval(ele.data("mousedownTimer"))
                                clearTimeout(ele.data("setTimer"))
                            })
                    }, 120))
                }, 10))
            }
            // 点击滚动条
            vm._barClick = function(e, position, barIndex) {
                if(vmodel.disabled) return
                var ele = avalon(this)
                if(ele.hasClass("ui-scrollbar-dragger")) return
                vmodel._computer(function(obj) {
                    return {
                        x: Math.ceil(e.pageX - obj.offset.left - obj.draggerWidth / 2),
                        y : Math.ceil(e.pageY - obj.offset.top - obj.draggerHeight / 2)
                    }
                }, barIndex, position)
            }
            // 计算滚动条位置
            vm._computer = function(axisComputer, barIndex, position, callback, breakOutCallbackCannotIgnore) {
                if(vmodel.disabled) return
                var bar = bars[barIndex]
                if(bar && bar.data("ui-scrollbar-needed")) {
                    var obj = {},
                        isVertical = position.match(/left|right/g)
                    obj.dragger = avalon(getByClassName("ui-scrollbar-dragger", bar[0])[0])
                    obj.draggerWidth = strToNumber(obj.dragger.css("width"))
                    obj.draggerHeight = strToNumber(obj.dragger.css("height"))
                    obj.draggerpar = avalon(obj.dragger[0].parentNode)
                    obj.draggerparWidth = strToNumber(obj.draggerpar.css("width"))
                    obj.draggerparHeight = strToNumber(obj.draggerpar.css("height"))
                    obj.offset = obj.draggerpar.offset()
                    obj.up = avalon(getByClassName("ui-scrollbar-arrow-up", bar[0])[0])
                    obj.down = avalon(getByClassName("ui-scrollbar-arrow-down", bar[0])[0])
                    obj.viewer = avalon(vmodel.viewElement)
                    // obj.viewH = vmodel.viewHeightGetter(obj.viewer)
                    // obj.viewW = vmodel.viewWidthGetter(obj.viewer)
                    // 更新的时候要用viewer先计算
                    // 计算的时候直接用scroller作为视窗计算宽高
                    // obj.viewH = vmodel.viewHeightGetter(scroller)
                    // obj.viewW = vmodel.viewWidthGetter(scroller)
                    obj.viewH = scroller.innerHeight()
                    obj.viewW = scroller.innerWidth()
                    obj.scrollerH = scroller[0].scrollHeight
                    obj.scrollerW = scroller[0].scrollWidth
                    obj.step = isVertical ? 40 * (obj.draggerparHeight - obj.draggerHeight) / (obj.scrollerH - obj.viewH) : 40 * (obj.draggerparWidth - obj.draggerWidth) / (obj.scrollerW - obj.viewW)
                    obj.step = strToNumber(obj.step) || 1

                    var xy = axisComputer(obj),
                        breakOut
                        xy.x = strToNumber(xy.x)
                        xy.y = strToNumber(xy.y)

                    if(isVertical) {
                        if(xy.y < 0) {
                            xy.y = 0
                            obj.up.addClass("ui-state-disabled")
                            breakOut = ["v", "up"]
                        } else {
                            obj.up.removeClass("ui-state-disabled")
                        }
                        if(xy.y > obj.draggerparHeight - obj.draggerHeight) {
                            xy.y = obj.draggerparHeight - obj.draggerHeight
                            breakOut = ["v", "down"]
                            obj.down.addClass("ui-state-disabled")
                        } else {
                            obj.down.removeClass("ui-state-disabled")
                        }
                        var c = strToNumber((obj.scrollerH - obj.viewH) * xy.y / (obj.draggerparHeight - obj.draggerHeight)) - vmodel.scrollTop
                        obj.dragger.css("top", xy.y)
                        vmodel._scrollTo(void 0, strToNumber((obj.scrollerH - obj.viewH) * xy.y / (obj.draggerparHeight - obj.draggerHeight)))
                    } else {
                        if(xy.x < 0) {
                            xy.x = 0
                            breakOut = ["h", "up"]
                            obj.up.addClass("ui-state-disabled")
                        } else {
                            obj.up.removeClass("ui-state-disabled")
                        }
                        if(xy.x > obj.draggerparWidth - obj.draggerWidth) {
                            xy.x = obj.draggerparWidth - obj.draggerWidth
                            breakOut = ["h", "down"]
                            // 有溢出检测回调，不disable
                            !vmodel.breakOutCallback && obj.down.addClass("ui-state-disabled")
                        } else {
                            obj.down.removeClass("ui-state-disabled")
                        }
                        obj.dragger.css("left", xy.x)
                        vmodel._scrollTo(strToNumber((obj.scrollerW - obj.viewW) * xy.x / (obj.draggerparWidth - obj.draggerWidth)), void 0)
                    }

                }
                // 回调，溢出检测
                (!vmodel.breakOutCallback || breakOutCallbackCannotIgnore) && callback && callback(breakOut)
                vmodel.breakOutCallback && vmodel.breakOutCallback(breakOut, vmodel, obj)
            }
            vm._scrollTo = function(x, y) {
                if(y != void 0) {
                    scroller[0].scrollTop = y
                    vmodel.scrollTop = scroller[0].scrollTop
                }
                if(x != void 0) {
                    scroller[0].scrollLeft = x
                    vmodel.scrollLeft = scroller[0].scrollLeft
                }
            }

            //@method scrollTo(x,y) 滚动至 x,y
            vm.scrollTo = function(x, y) {
                vmodel.update(!"ifInit", x, y)
                vm._scrollTo(x, y)
            }

            vm._initWheel = function(e, type) {
                if(type == "enter") {
                    vmodel.inFocuse = true
                } else {
                    vmodel.inFocuse = false
                }
            }
            vm._draggerDown = function(e, isdown) {
                if(vmodel.disabled) return
                var ele = avalon(this)
                if(isdown) {
                    ele.addClass("ui-state-active")
                } else {
                    ele.removeClass("ui-state-active")
                }
            }
            vm._stopPropagation = function(e) {
                e.stopPropagation()
            }
        })
      
        vmodel.$watch("scrollLeft", function(newValue, oldValue) {
            vmodel._onScroll()
            vmodel.onScroll && vmodel.onScroll(newValue, oldValue, "h", vmodel)
        })
        vmodel.$watch("scrollTop", function(newValue, oldValue) {
            vmodel._onScroll()
            vmodel.onScroll && vmodel.onScroll(newValue, oldValue, "v", vmodel)
        })

        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        disabled: false, //@param 组件是否被禁用，默认为否
        toggle: true, //@param 组件是否显示，可以通过设置为false来隐藏组件
        position: "right", //@param scrollbar出现的位置,right右侧，bottom下侧，可能同时出现多个方向滚动条
        limitRateV: 1.5, //@param 竖直方向，拖动头最小高度和拖动头宽度比率
        limitRateH: 1.5, //@param 水平方向，拖动头最小宽度和高度的比率
        scrollTop: 0, //@param 竖直方向滚动初始值，负数会被当成0，设置一个极大值等价于将拖动头置于bottom
        scrollLeft: 0, //@param 水平方向滚动初始值，负数会被当成0处理，极大值等价于拖动头置于right
        show: "always", //@param never一直不可见，scrolling滚动和hover时候可见，always一直可见
        showBarHeader: true,//@param 是否显示滚动条两端的上下箭头
        draggerHTML: "", //@param 滚动条拖动头里，注入的html碎片
        breakOutCallback: false, //@optMethod breakOutCallback(["h", "up"], vmodel) 滚动到极限位置的回调，用来实现无线下拉等效果 breakOutCallback(["h", "up"], vmodel) 第一个参数是一个数组，分别是滚动条方向【h水平，v竖直】和超出极限的方向【up是向上或者向左，down是向右或者向下】，第三个参数是一个对象，包含滚动条的元素，宽高等信息
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        viewHeightGetter: function(viewElement) {
            return viewElement.innerHeight()
        }, //@optMethod viewHeightGetter(viewElement) 配置计算视窗高度计函数，默认返回innerHeight
        viewWidthGetter: function(viewElement) {
            return viewElement.innerWidth()
        }, //@optMethod viewWidthGetter(viewElement) 配置计算视窗宽度计函数，默认返回innerWidth
        getTemplate: function(tmpl, opts) {
            return tmpl
        },//@optMethod getTemplate(tpl, opts) 定制修改模板接口
        onScroll: function(newValue, oldValue, diretion, vmodel) {

        },//@optMethod onScroll(newValue, oldValue, diretion, vmodel) 滚动回调,scrollLeft or scrollTop变化的时候触发，参数为newValue, oldValue, diretion, vmodel diretion = h 水平方向，= v 竖直方向
        size: "normal", //@param srollbar size,normal为10px，small为8px，large为14px
        $author: "skipper@123"
    }
})