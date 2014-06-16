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
                if(vmodel.position.match(/left|right/g)) {
                    avalon.bind(document, "wheel", function(e) {
                        if(vmodel.inFocuse) e.preventDefault()
                        avalon.log(e)
                    })

                    avalon.bind(element, "mouseenter", function(e) {
                        vmodel.inFocuse = true
                    })
                    avalon.bind(element, "mouseleave", function(e) {
                        vmodel.inFocuse = false
                    })
                }

                vmodel.$updateBarStatus("init")
            }

            vm.beforeStartFn = function(e, data) {
            }

            vm.startFn = function() {

            }

            vm.dragFn = function(e, data) {
                var dr = avalon(data.element),
                    sr = avalon(data.element.parentNode),
                    scrollerPar = avalon(scroller[0].parentNode)
                // 水平方向拖动
                if(data.axis == "x") {
                    var w = scroller[0].scrollWidth,
                        viewW = scrollerPar.width(),
                        draggerW = dr.width(),
                        barW = sr.width(),
                        left = parseInt(dr.css("left")) >> 0
                    vmodel.scrollTo(left / (barW - draggerW) * (w - viewW) , void 0)
                } else {
                    var h = scroller[0].scrollHeight,
                    viewH = scrollerPar.height()
                    draggerH = dr.height(),
                    barH = sr.height(),
                    tt = parseInt(dr.css("top")) >> 0
                    vmodel.scrollTo(void 0, tt / (barH -draggerH) * (h - viewH))
                }
            }

            vm.beforeStopFn = function() {
            }

            vm.stopFn = vm.dragFn
            vm.$remove = function() {
                avalon.each(bars, function(i, bar) {
                    bar[0] && bar[0].parentNode && bar[0].parentNode.removeChild(bar)
                })
            }
            // 扫描更新bar状态
            vm.$updateBarStatus = function(ifInit) {
                var ele = avalon(vmodel.widgetElement),
                    w = ele.width(),
                    viewW = vmodel.widgetElement.scrollWidth,
                    viewH = vmodel.widgetElement.scrollHeight,
                    h = ele.height(),
                    p = vmodel.position,
                    barDictionary = {
                        "top": p.match(/top/g) && viewH > h,
                        "right": p.match(/right/g) && viewW > w,
                        "bottom": p.match(/bottom/g) && viewH > h,
                        "left": p.match(/left/g) && viewW > w
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
                        if(bar) bar.css("opacity", 0)
                        return
                    } else if(vmodel.show == "always"){
                        if(bar) bar.css("opacity", 1)
                    }
                    if(bar) {
                        var bh = sh = bar.height(),
                            bw = sw = bar.width(),
                            dragger = avalon(getByClassName("ui-scrollbar-dragger", bar.element)[0]),
                            isV = item.match(/left|right/)
                        // 更新滚动条
                        if(vmodel.showBarHeader) {
                            var csss2 = [],draggerpar = avalon(getByClassName("ui-scrollbar-draggerpar", bar[0])[0])
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
                                t = t > viewH ? viewH : t
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
                                t = t > viewW ? viewW : t
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
                            dragger[0].setAttribute("ms-draggable", "")
                            avalon.scan(dragger[0], vmodel)
                        }
                        if(isV) {
                            scroller[0].style.top = -vmodel.scrollTop + "px"
                        } else {
                            scroller[0].style.left = -vmodel.scrollLeft + "px"
                        }
                    }
                })
            }

            // 点击箭头
            vm.$arrClick = function(e, diretion, position, barIndex) {

            }

            // 点击滚动条
            vm.$barClick = function(e, position, barIndex) {
                var ele = avalon(e.srcElement || e.target)
                if(ele.hasClass("ui-scrollbar-dragger")) return
                var bar = bars[barIndex]
                if(bar) {
                    var dragger = avalon(getByClassName("ui-scrollbar-dragger", bar[0])[0]),
                        draggerWidth = dragger.width(),
                        draggerHeight = dragger.height()

                }
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
                    avalon.log(vmodel.inFocuse)
                } else {
                    vmodel.inFocuse = false
                }
            }
        })
      
        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        position: "right", //@param scrollbar出现的位置,right右侧，left左侧，top上侧，bottom下侧，可能同时出现多方向滚动条
        scrollTop: 300, //@param 竖直方向滚动初始值
        scrollLeft: 300, //@param 水平方向滚动初始值
        show: "always", //@param never，scrolling，always
        showBarHeader: true,//@param 是否显示滚动条两端的上线箭头
        draggerHTML: "", //@param 滚动条拖动头里，注入的html碎片
        getTemplate: function(tmpl, opts) {
            return tmpl
        },
        $author: "skipper@123"
    }
})