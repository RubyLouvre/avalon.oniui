/**
  * scrollbar组件，
  *
  */
define(["avalon", "text!./avalon.scrollbar.html", "text!./avalon.scrollbar.css", "draggable/avalon.draggable"], function(avalon, tmpl, css) {

    var cssText = css
    var styleEl = document.getElementById("avalonStyle")
    var template = tmpl
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

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

    // 响应wheel,binded
    var wheelBinded,
        wheelArr = []

    var widget = avalon.ui.scrollbar = function(element, data, vmodels) {
        var options = data.scrollbarOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.scrollbarId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.draggerHeight = vm.draggerWidth = ""
            vm.inFocuse = false
            vm.$position = []

            var inited,
                bars = [],
                scroller
            vm.$init = function() {
                if(inited) return
                inited = true
                vmodel.widgetElement.style.position = "relative"
                var tar = vmodel.widgetElement == document.body ? document.getElementsByTagName(
                    "html")[0] : vmodel.widgetElement
                tar.style.overflow = "hidden"
                vmodel.$position = vmodel.position.split(",")

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
                    var vs = []
                    avalon.each(vmodel.$position, function(i, item) {
                        if(item.match(/left|right/g)) vs.push([i, item])
                    })

                    function myOnWheel(e) {
                        var diretion = e.wheelDelta > 0 ? "up" : "down"
                        if(vmodel.inFocuse) {
                            avalon.each(vs, function(i, item) {
                                if(bars[item[0]] && bars[item[0]].css("opacity") == "0") return
                                vmodel.$computer(function(obj) {
                                    return vmodel.$clickComputer(obj, diretion)
                                }, item[0], item[1], function(breakOut) {
                                    if(!breakOut) 
                                e.preventDefault()
                                })
                            })
                        }
                    }
                    avalon.bind(element, "mouseenter", function(e) {
                        vmodel.inFocuse = true
                        wheelArr.push(myOnWheel)
                    })
                    avalon.bind(element, "mouseleave", function(e) {
                        vmodel.inFocuse = false
                        for(var i = 0, len = wheelArr.length; i < len; i++) {
                            if(wheelArr[i] === myOnWheel) {
                                wheelArr.splice(i, 1)
                                break
                            }
                        }
                    })
                    // 所有组件实例公用一个事件绑定
                    if(!wheelBinded) {
                        wheelBinded = true
                        avalon.bind(document, "mousewheel", function(e) {
                            var cb = wheelArr[wheelArr.length - 1]
                            cb && cb(e)
                        })
                    }

                }


                avalon(vmodel.widgetElement).bind("mouseenter", function() {
                    avalon.each(bars, function(i, item) {
                        item.css("opacity", 1)
                    })
                    avalon(vmodel.widgetElement).data("ui-scrollbar-hidetimer", setTimeout(vmodel.$hide, 700))
                })

                vmodel.$updateBarStatus("init")
            }

            vm.beforeStartFn = avalon.noop

            vm.startFn = avalon.noop

            vm.dragFn = function(e, data) {
                var dr = avalon(data.element)
                vmodel.$computer(function(obj) {
                    return {
                        x: parseInt(dr.css("left")) >> 0,
                        y: parseInt(dr.css("top")) >> 0
                    }
                }, dr.attr("ui-scrollbar-index"), dr.attr("ui-scrollbar-pos"))
            }

            vm.beforeStopFn = avalon.noop

            vm.stopFn = function(e, data) {
                vmodel.dragFn(e, data)
                avalon(data.element).removeClass("ui-scrollbar-dragger-onmousedown")
            }
            vm.$remove = function() {
                avalon.each(bars, function(i, bar) {
                    bar[0] && bar[0].parentNode && bar[0].parentNode.removeChild(bar)
                })
            }

            vm._onScroll = function() {
            }
            vm.$show = function(e, always, index) {
                if(vmodel.show != "scrolling") return
                if(bars[index]) {
                    clearTimeout(bars[index].data("ui-scrollbar-hidetimer"))
                    bars[index].css("visibility", "visible")
                    bars[index].css("opacity", 1)
                    if(!always) {
                        bars[index].data("ui-scrollbar-hidetimer", setTimeout(function() {
                            bars[index].css("visibility", "hidden")
                            bars[index].css("opacity", 0)
                        }, 700))
                    }
                }
            }
            vm.$hide = function(e,index) {
                if(vmodel.show != "scrolling") return
                if(index && bars[index]) {
                    bars[index].css("opacity", 0)
                } else {
                    avalon.each(bars, function(i, item) {
                        item.css("opacity", 0)
                    })
                }
            }
            // 初始化bar状态
            vm.$updateBarStatus = function(ifInit) {
                var ele = avalon(vmodel.widgetElement),
                    // 滚动内容宽高
                    viewW = scroller.innerWidth(),
                    viewH = scroller.innerHeight(),
                    // 滚动视野区宽高
                    h = ele.innerHeight(),
                    w = ele.innerWidth(),
                    p = vmodel.position,
                    barDictionary = {
                        "top": p.match(/top/g) && viewW > w,
                        "right": p.match(/right/g) && viewH > h,
                        "bottom": p.match(/bottom/g) && viewW > w,
                        "left": p.match(/left/g) && viewH > h
                    },
                    barMinus = {}
                if(vmodel.showBarHeader && bars.length > 1) {
                    var ps = ["top", "right", "bottom", "left"]
                    for(var i = 0; i < 4; i++) {
                        barMinus[ps[i]] = [barDictionary[i ? ps[i - 1] : ps[3]] && 1, barDictionary[i < 3 ? ps[i + 1] : ps[0]] && 1]
                        if(i > 1) barMinus[ps[i]] = barMinus[ps[i]].reverse()
                    }
                }
                avalon.each(vmodel.$position, function(i, item) {
                    var bar = bars[i]
                    // hidden bar
                    if(!barDictionary[item]) {
                        if(bar) {
                            bar.css("opacity", 0)
                            bar.css("visibility", "hidden")
                        }
                        return
                    } else {
                        if(bar) {
                            if(vmodel.show == "scrolling"){
                                bar.css("opacity", 0)
                            } else {
                                bar.css("opacity", 1)
                            }
                            //bar.css("visibility", "visible")
                        }
                    }
                    if(bar) {
                        var bh = sh = bar.height(),
                            bw = sw = bar.width(),
                            dragger = avalon(getByClassName("ui-scrollbar-dragger", bar.element)[0]),
                            isV = item.match(/left|right/),
                            draggerpar = avalon(getByClassName("ui-scrollbar-draggerpar", bar[0])[0])
                        // 更新滚动条
                        if(vmodel.showBarHeader) {
                            var csss2 = []
                            if(bars.length > 1) {
                                var csss = [], minus = barMinus[item]
                                if(isV) {
                                    csss = [
                                        ["top", minus[0] * bw + "px"],
                                        ["height", (h - bw * (minus[0] + minus[1])) + "px"]
                                    ]
                                    csss2 = [
                                        ["top", (minus[0] + 1) * bw + "px"],
                                        ["height", (h - bw * (minus[0] + minus[1] + 2)) + "px"]
                                    ]
                                } else {
                                    csss = [
                                        ["left", minus[0] * bh + "px"],
                                        ["width", (w - bh * (minus[0] + minus[1])) + "px"]
                                    ]
                                    csss2 = [
                                        ["left", (minus[0] + 1) * bh + "px"],
                                        ["width", (w - bh * (2 + minus[0] + minus[1])) + "px"]
                                    ]
                                }
                                avalon.each(csss, function(index, css) {
                                    bar.css.apply(bar, css)
                                })
                                bh = bar.height()
                                bw = bar.width()
                            } else {
                                if(isV) {
                                    csss2 = [
                                        ["top", bw + "px"],
                                        ["height", (h - bw * 2) + "px"]
                                    ]
                                } else {
                                    csss2 = [
                                        ["left", bh + "px"],
                                        ["width", (w - bh * 2) + "px"]
                                    ]
                                }
                            }
                            avalon.each(csss2, function(index, css) {
                                draggerpar.css.apply(draggerpar, css)
                            })
                            sh = bh - 2 * bw
                            sw = bw - 2 * bh
                        }
                        // 更新滚动头
                        var csss
                        if(isV) {
                            var t = vmodel.scrollTop,
                                th = h * sh / viewH
                                t = t < 0 ? 0 : t
                                t = t > viewH -h ? viewH - h : t
                                t = sh * t / viewH
                            csss = [
                                ["width", "100%"],
                                ["height", th + "px"],
                                ["top", t + "px"]
                            ]
                        } else {
                            var t = vmodel.scrollLeft,
                                tw = w * sw / viewW
                                t = t < 0 ? 0 : t
                                t = t > viewW - w ? viewW - w : t
                                t = sw * t / viewW
                            csss = [
                                ["height", "100%"],
                                ["width", tw + "px"],
                                ["left", t + "px"]
                            ]
                        }
                        avalon.each(csss, function(index, css) {
                            dragger.css.apply(dragger, css)
                        })
                        if(ifInit) {
                            dragger.attr("ms-draggable", "")
                            dragger.attr("ui-scrollbar-pos", item)
                            dragger.attr("ui-scrollbar-index", i)
                            avalon.scan(dragger[0], vmodel)
                        }
                        vmodel.scrollTop = vmodel.scrollTop > 0 ? (vmodel.scrollTop > viewH - h ?  viewH - h : vmodel.scrollTop) : 0
                        vmodel.scrollLeft = vmodel.scrollLeft > 0 ? (vmodel.scrollLeft > viewW - w ? viewW - w : vmodel.scrollLeft) : 0
                        if(isV) {
                            vmodel.scrollTo(void 0, vmodel.scrollTop)
                        } else {
                            vmodel.scrollTo(vmodel.scrollLeft, void 0)
                        }
                        if(vmodel.showBarHeader) {
                            if(vmodel.scrollTop == 0) {
                                avalon(getByClassName("ui-scrollbar-arrow-up", bar[0])[0]).addClass("ui-scrollbar-arrow-disabled")
                            } else {
                                avalon(getByClassName("ui-scrollbar-arrow-up", bar[0])[0]).removeClass("ui-scrollbar-arrow-disabled")
                            }
                            if(vmodel.scrollTop >= draggerpar.height() - dragger.height()) {
                                avalon(getByClassName("ui-scrollbar-arrow-down", bar[0])[0]).addClass("ui-scrollbar-arrow-disabled")
                            } else {
                            avalon(getByClassName("ui-scrollbar-arrow-down", bar[0])[0]).removeClass("ui-scrollbar-arrow-disabled")
                            }
                        }
                    }
                })
            }

            // 点击箭头
            vm.$arrClick = function(e, diretion, position, barIndex) {
                vmodel.$computer(function(obj) {
                    return vmodel.$clickComputer(obj, diretion)
                }, position, barIndex)
            }

            vm.$clickComputer = function(obj, diretion) {
                var l = parseInt(obj.dragger.css("left")) >> 0,
                    r = parseInt(obj.dragger.css("top")) >> 0,
                    x = diretion == "down" ? l + 40 : l - 40,
                    y = diretion == "down" ? r + 40 : r - 40
                return {
                    x: x,
                    y: y
                }
            }
            // 长按
            vm.$arrDown = function($event, diretion, position, barIndex,ismouseup) {
                var se = this,
                    ele = avalon(se)
                clearInterval(ele.data("mousedownTimer"))
                clearTimeout(ele.data("setTimer"))
                var bar = bars[barIndex]
                if(ismouseup || ele.hasClass("ui-scrollbar-arrow-disabled")) {
                    return ele.removeClass("ui-scrollbar-arrow-onmousedown")
                }
                // 延时开启循环
                ele.data("setTimer", setTimeout(function(){
                    ele.addClass("ui-scrollbar-arrow-onmousedown")
                    ele.data("mousedownTimer", setInterval(function() {
                        return vmodel.$computer(function(obj) {
                                return vmodel.$clickComputer(obj, diretion)
                            }, barIndex, position ,function(breakOut) {
                                if(!breakOut) return
                                clearInterval(ele.data("mousedownTimer"))
                                clearTimeout(ele.data("setTimer"))
                            })
                    }, 120))
                }, 10))
            }
            // 点击滚动条
            vm.$barClick = function(e, position, barIndex) {
                var ele = avalon(this)
                if(ele.hasClass("ui-scrollbar-dragger")) return
                vmodel.$computer(function(obj) {
                    return {
                        x: e.pageX - obj.offset.left - obj.draggerWidth / 2,
                        y : e.pageY - obj.offset.top - obj.draggerHeight / 2
                    }
                }, barIndex, position)
            }
            // 计算滚动条位置
            vm.$computer = function(axisComputer, barIndex, position, callback) {
                var bar = bars[barIndex]
                if(bar) {
                    var obj = {}
                    obj.dragger = avalon(getByClassName("ui-scrollbar-dragger", bar[0])[0])
                    obj.draggerWidth = obj.dragger.innerWidth()
                    obj.draggerHeight = obj.dragger.innerHeight()
                    obj.draggerpar = avalon(obj.dragger[0].parentNode)
                    obj.draggerparWidth = obj.draggerpar.innerWidth()
                    obj.draggerparHeight = obj.draggerpar.innerHeight()
                    obj.offset = obj.draggerpar.offset()
                    obj.up = avalon(getByClassName("ui-scrollbar-arrow-up", bar[0])[0])
                    obj.down = avalon(getByClassName("ui-scrollbar-arrow-down", bar[0])[0])
                    var xy = axisComputer(obj),
                        breakOut,
                        viewer = avalon(vmodel.widgetElement),
                        viewH = viewer.innerHeight(),
                        viewW = viewer.innerWidth(),
                        scrollerH = scroller.innerHeight(),
                        scrollerW = scroller.innerWidth()

                    if(position.match(/left|right/g)) {
                        if(xy.y < 0) {
                            xy.y = 0
                            obj.up.addClass("ui-scrollbar-arrow-disabled")
                            breakOut = ["v", "up"]
                        } else {
                            obj.up.removeClass("ui-scrollbar-arrow-disabled")
                        }
                        if(xy.y > obj.draggerparHeight - obj.draggerHeight) {
                            xy.y = obj.draggerparHeight - obj.draggerHeight
                            breakOut = ["v", "down"]
                            obj.down.addClass("ui-scrollbar-arrow-disabled")
                        } else {
                            obj.down.removeClass("ui-scrollbar-arrow-disabled")
                        }
                        obj.dragger.css("top", xy.y + "px")
                        vmodel.scrollTo(void 0, (scrollerH - viewH) * xy.y / (obj.draggerparHeight - obj.draggerHeight))
                    } else {
                        if(xy.x < 0) {
                            xy.x = 0
                            breakOut = ["h", "up"]
                            obj.up.addClass("ui-scrollbar-arrow-disabled")
                        } else {
                            obj.up.removeClass("ui-scrollbar-arrow-disabled")
                        }
                        if(xy.x > obj.draggerparWidth - obj.draggerWidth) {
                            xy.x = obj.draggerparWidth - obj.draggerWidth
                            breakOut = ["h", "down"]
                            obj.down.addClass("ui-scrollbar-arrow-disabled")
                        } else {
                            obj.down.removeClass("ui-scrollbar-arrow-disabled")
                        }
                        obj.dragger.css("left", xy.x + "px")
                        vmodel.scrollTo((scrollerW - viewW) * xy.x / (obj.draggerparWidth - obj.draggerWidth), void 0)
                    }

                }
                // 回调，溢出检测
                callback && callback(breakOut)
            }
            vm.scrollTo = function(x, y) {
                if(x != void 0) vmodel.scrollLeft = x
                if(y != void 0) vmodel.scrollTop = y// 更新视窗
                if(y != void 0) {
                    scroller[0].style.top = -vmodel.scrollTop + "px"
                } else if(x != void 0) {
                    scroller[0].style.left = -vmodel.scrollLeft + "px"
                }
            }

            vm.$initWheel = function(e, type) {
                if(type == "enter") {
                    vmodel.inFocuse = true
                } else {
                    vmodel.inFocuse = false
                }
            }
            vm.$draggerDown = function(e, isdown) {
                var ele = avalon(this)
                if(isdown) {
                    ele.addClass("ui-scrollbar-dragger-onmousedown")
                } else {
                    ele.removeClass("ui-scrollbar-dragger-onmousedown")
                }
            }
            vm.$stopPropagation = function(e) {
                e.stopPropagation()
            }
        })
      
        vmodel.$watch("scrollLeft", function(newValue, oldValue) {
            vmodel._onScroll()
            vmodel.onScroll && vmodel.onScroll(newValue, oldValue, vmodel)
        })
        vmodel.$watch("scrollTop", function(newValue, oldValue) {
            vmodel._onScroll()
            vmodel.onScroll && vmodel.onScroll(newValue, oldValue, vmodel)
        })

        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        position: "right", //@param scrollbar出现的位置,right右侧，left左侧，top上侧，bottom下侧，可能同时出现多方向滚动条
        scrollTop: 10000, //@param 竖直方向滚动初始值
        scrollLeft: 10000, //@param 水平方向滚动初始值
        show: "always", //@param never，scrolling，always
        showBarHeader: true,//@param 是否显示滚动条两端的上线箭头
        draggerHTML: "", //@param 滚动条拖动头里，注入的html碎片
        getTemplate: function(tmpl, opts) {
            return tmpl
        },
        onScroll: function(newValue, oldValue, vmodel) {

        },//@optMethod 滚动回调,scrollLeft or scrollTop变化的时候触发，参数为newValue, oldValue,vmodel
        $author: "skipper@123"
    }
})