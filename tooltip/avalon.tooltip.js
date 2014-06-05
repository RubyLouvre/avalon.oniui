/**
  * tooltip组件，
  *
  */
define(["avalon", "text!./avalon.tooltip.html", "text!./avalon.tooltip.css", "position/avalon.position"], function(avalon, tmpl, css) {

    var cssText = css
    var styleEl = document.getElementById("avalonStyle")
    var template = tmpl
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    var widget = avalon.ui.tooltip = function(element, data, vmodels) {
        var options = data.tooltipOptions
            , selfContent = ""
            , hideTimer
            , animateTimer
            , tooltipElem
            , cat = options.positionAt
            , cmy = options.positionMy
            , acat
            , acmy
            , inmy
            , lessH = 2
            , lessW = 1
            , arrH = 10
            , arrW = 10
            , p = options.position
            , constantInited
            , ofElement
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        function _init(p) {
            var cName = "left",
                p = p == void 0 ? p : options.position
            if(!(cmy && cat)) {
                switch (p) {
                    case "tc"://正上方
                        cmy = "center bottom-" + arrH
                        cat = "center top"
                        cName = "bottom"
                        break;
                    case "tl": //上方靠左
                        cmy = "left bottom-" + arrH
                        cat = "left top"
                        cName = "bottom"
                        break
                    case "tr": //上方靠右
                        cmy = "right bottom-"  + arrH
                        cat = "right top"
                        cName = "bottom"
                        break
                    case "lt"://左方靠上
                        cmy = "right-" +  arrW + " top"
                        cat = "left top"
                        cName = "right"
                        break
                    case "lc"://正左方
                        cmy = "right-" +  arrW + " center"
                        cat = "left center"
                        cName = "right"
                        break
                    case "lb"://左方靠下
                        cmy = "right-" +  arrW + " bottom"
                        cat = "left bottom"
                        cName = "right"
                        break
                    case "rt"://右方靠上
                        cmy = "left+" +  arrW + " top"
                        cat = "right top"
                        cName = "left"
                        break
                    case "rc"://正右方
                        cmy = "left+" +  arrW + " center"
                        cat = "right center"
                        cName = "left"
                        break
                    case "rb"://右方靠下
                        cmy = "left+" +  arrW + " bottom"
                        cat = "right bottom"
                        cName = "left"
                        break
                    case "bl"://下方靠左
                        cmy = "left top+" + arrH
                        cat = "left bottom"
                        cName = "top"
                        break
                    case "bc"://正下方
                        cmy = "center top+" + arrH
                        cat = "center bottom"
                        cName = "top"
                        break
                    case "br"://下方靠右
                        cmy = "right top+" + arrH
                        cat = "right bottom"
                        cName = "top"
                        break
                    case "cc"://居中
                        cmy = cat = "center center"
                        cName = "bottom"
                        break
                    default:
                        cmy = "left top+" + arrH
                        cat = "left bottom"
                        cName = "bottom"
                        break
                }
            } else {
                var ats = cat.replace(/[0-9\+\-]+/g, "").split(/\s+/),
                    mys = cmy.replace(/[0-9\+\-]+/g, "").split(/\s+/)
                // top or bottom
                if(ats[0] == mys[0]) {
                    if(ats[1] == "top") {
                        cName = "bottom"
                    } else {
                        cName = "top"
                    }
                } else if(ats[1] == mys[1]) {
                    if(ats[0] == "left") {
                        cName = "right"
                    } else {
                        cName = "left"
                    }
                } else {
                    cName = "bottom"
                }
            }
            return cName
        }

        var vmodel = avalon.define(data.tooltipId, function(vm) {
            avalon.mix(vm, options)
            if(vm.content == void 0) vm.content = element.getAttribute("title")
            vm.widgetElement = element
            vm.arrClass = "left"
            var tooltipElems = {}
            vm.$skipArray = ["widgetElement", "template", "delegate"]

            var inited
            vm.$init = function() {
                if(inited) return
                inited = true

                vmodel.arrClass = _init(vmodel.position)

                vmodel.arrow && computeArrClass(vmodel.arrClass)

                if(vmodel.event == "mouseenter") {
                    if(vmodel.delegate) {
                        vmodel.event = "mouseover"
                    }
                }
                element.setAttribute("ms-" + vmodel.event, "$show($event)")
                tooltipElem = tooltipELementMaker()
                avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                avalon.scan(element, [vmodel].concat(vmodels))
            }
            // 计算箭头的定位属性
            function computeArrClass(arrClass) {
                 switch(arrClass) {
                    case "top":
                        acmy = "center bottom+" + arrH
                        inmy = "center bottom+" + (arrH + lessH)
                        acat = "center bottom"
                        break
                    case "left":
                        acmy = "left+" + (Math.floor(arrW / 2) - lessW) + " center"
                        inmy="left+" + Math.floor(arrW / 2) + " center"
                        acat = "right center"
                        break
                    case "right":
                        acmy = "right-" + (Math.floor(arrW / 2) - lessW) + " center"
                        inmy="right-" + Math.floor(arrW / 2) + " center"
                        acat = "left center"
                        break
                    case "bottom":
                    default:
                        acmy = "center top-" + arrH
                        inmy="center top-11"
                        acat = "center top"
                }
            }

            vm.$remove = function() {
                if(tooltipElem && tooltipElem.parentNode) tooltipElem.parentNode.removeChild(tooltipElem)
            }
            //@method show(elem) 显示tooltip，相对于elem定位，elem为元素或者event事件对象，如果elem为空，则采用之前缓存的对象，两者都为空，则只展示，不改变位置
            vm.show = function(elem) {
                if(vmodel.disabled || !tooltipElem) return
                tooltipElem.style.display = "block"
                if(elem == void 0) elem = ofElement
                if(elem) {
                    ofElement = elem
                    var tipElem = avalon(tooltipElem), 
                        atEle = avalon(elem), 
                        tcat = cat, 
                        tcmy = cmy,
                        bs = tooltipElem.getElementsByTagName("b"), 
                        arrOut, 
                        arrIn
                    for(var i = 0, len = bs.length; i < len; i++) {
                        var tb = avalon(bs[i])
                        if(tb.hasClass("out")) {
                            arrOut = tb
                        } else if(tb.hasClass("in")) {
                            arrIn = tb
                        }
                    }
                    if(arrOut && arrIn) {
                        var w = arrOut[0].offsetWidth,
                            h = arrOut[0].offsetHeight
                        lessW = w - arrIn[0].offsetWidth
                        lessH = h - arrIn[0].offsetHeight
                        // 根据arr元素的实际宽高初始化常量
                        if(!constantInited) {
                            vmodel.arrClass = _init(vmodel.position)
                            constantInited = true
                        }
                    }
                    // 定位toolp元素
                    tipElem.position({
                        of: elem, 
                        at: tcat, 
                        my: tcmy, 
                        collision: "none", 
                        within: document.body
                    })
                     // position组件自动调整的时候调整箭头上下朝向
                    if(elem.nodeName) {
                        if(tipElem.position().top > atEle.position().top + elem.offsetHeight && vmodel.arrClass == "bottom") {
                            vmodel.arrClass = "top"
                            tipElem.removeClass("ui-tooltip-bottom").addClass("ui-tooltip-top")
                            // 重算布局属性
                            vmodel.arrow && computeArrClass("top")
                        } else if(tipElem.position().top + tooltipElem.offsetHeight < atEle.position().top && vmodel.arrClass == "top") {
                            vmodel.arrClass = "bottom"
                            tipElem.removeClass("ui-tooltip-top").addClass("ui-tooltip-bottom")
                            // 重算布局属性
                            vmodel.arrow && computeArrClass("bottom")
                        } else {
                            // 重算布局属性
                            vmodel.arrow && computeArrClass(vmodel.arrClass)
                        }

                        var acat2 = acat, 
                            acmy2 = acmy, 
                            inmy2 = inmy

                        // 根据元素和tooltip元素的宽高调整箭头位置
                        if(arrOut && arrIn) {
                            var dir = vmodel.arrClass == "bottom" || vmodel.arrClass == "left"
                            // 竖直方向，高度不够
                            if((vmodel.arrClass == "bottom" || vmodel.arrClass == "top") && tooltipElem.offsetWidth < elem.offsetWidth) {
                                arrOut.position({
                                    of: tooltipElem, 
                                    at: "center " + (dir ? "bottom" : "top"), 
                                    my: "center " + (dir ? "top" : "bottom"), 
                                    within: document.body
                                })
                                arrIn.position({
                                    of: tooltipElem, 
                                    at: "center " + (dir ? "bottom" : "top"), 
                                    my: "center " + (dir ? "top-" : "bottom+") + lessH, 
                                    within: document.body
                                })
                            // 水平方向，宽度不够
                            } else if((vmodel.arrClass == "left" || vmodel.arrClass == "right") && tooltipElem.offsetHeight < elem.offsetHeight) {
                                 arrOut.position({
                                    of: tooltipElem, 
                                    at: (dir ? "left" : "right") + " center", 
                                    my: (dir ? "right" : "left") + " center", 
                                    within: document.body
                                })
                                arrIn.position({
                                    of: tooltipElem, 
                                    at: (dir ? "left" : "right") + " center", 
                                    my: (dir ? "right+" : "left-") + lessW  + " center", 
                                    within: document.body
                                })
                            } else {
                                arrOut.position({
                                    of: elem, 
                                    at: acat2, 
                                    my: acmy2, 
                                    within: document.body
                                })
                                arrIn.position({
                                    of: elem, 
                                    at: acat2, 
                                    my: inmy2, 
                                    within: document.body
                                })
                            }
                        }
                    }
                }
                // IE里面透明箭头显示有问题，屏蔽掉
                if(vmodel.animated && !!-[1,]) {
                    clearInterval(animateTimer)
                    var now = (avalon(tooltipElem).css("opacity") * 100) >> 0
                    dis = vmodel.$animateArrMaker(now, 100)
                    avalon(tooltipElem).css("opacity", dis[0] / 100)
                    dis.splice(0, 1)
                    animateTimer = setInterval(function() {
                        if(dis.length <= 0) {
                            return clearInterval(animateTimer)
                        }
                        avalon(tooltipElem).css("opacity",  dis[0] / 100)
                        dis.splice(0, 1) 
                    }, 50)
                }
            }
            //@method hide($event) 隐藏tooltip，参数是$event，可缺省
            vm.hide = function(e) {
                e && e.preventDefault && e.preventDefault()
                if(!tooltipElem) return
                if(vmodel.animated && !!-[1,]) {
                    clearInterval(animateTimer)
                    var now = (avalon(tooltipElem).css("opacity") * 100) >> 0
                    dis = vmodel.$animateArrMaker(now, 0)
                    animateTimer = setInterval(function() {
                        if(dis.length <= 0) {
                            tooltipElem.style.display = "none"
                            avalon(tooltipElem).addClass("ui-tooltip-hidden")
                            return clearInterval(animateTimer)
                        }
                        avalon(tooltipElem).css("opacity",  dis[0]/100)
                        dis.splice(0, 1) 
                    }, 50)
                } else {
                    tooltipElem.style.display = "none"
                }
            }

            vm.$show = function(e) {
                if(vmodel.disabled) return
                var tar = e.srcElement || e.target
                    , content = vmodel.contentGetter.call(vmodel, tar)
                if(content == void 0) return
                clearTimeout(hideTimer)
                var inited = tar.getAttribute("ui-tooltip-inited")
                var oldTitle = tar.title
                vmodel.content = content
                if(tar.title) tar.title = ""
                if(!vmodel.track) avalon(tooltipElem).removeClass("ui-tooltip-hidden")

                if(!tooltipElem) {
                    tooltipElem = tooltipELementMaker()
                    avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                }
                vmodel.show(tar)
                if(!inited) {
                    tar.setAttribute("ui-tooltip-inited", 1)
                    avalon(tar).bind(vmodel.event != "focus" ? "mouseout" : "blur", function() {
                        clearTimeout(hideTimer)
                        if(oldTitle) tar.title = oldTitle
                        if(vmodel.autohide) hideTimer = setTimeout(vmodel.hide, vmodel.hiddenDelay)
                    })
                    if(vmodel.track && (vmodel.event == "mouseover" || vmodel.event == "mouseenter")) {
                        avalon(tar).bind("mousemove", function(e) {
                            vmodel.show(e)
                            // 减少抖动
                            avalon(tooltipElem).removeClass("ui-tooltip-hidden")
                        })
                    }
                }
            }

            vm.$isShown = function() {
                var elem = avalon(tooltipElem)
                return elem.css('display') != "none" && !elem.hasClass("ui-tooltip-hidden")
            }

        })
      
      
        function tooltipELementMaker() {
            var f = avalon.parseHTML(vmodel.template)
            var tooltipElem = f.childNodes[0]
            document.body.appendChild(f)
            return tooltipElem
        }
        vmodel.$watch("position", function(newValue) {
            _init(vmodel.position)
            vmodel.$isShown() && vmodel.show()
        })

        vmodel.$watch("positionAt", function(newValue) {
            cat = newValue
            _init(vmodel.position)
            vmodel.$isShown() && vmodel.show()
        })

        vmodel.$watch("positionMy", function(newValue) {
            cmy = newValue
            _init(vmodel.position)
            vmodel.$isShown() && vmodel.show()
        })

        return vmodel
    }

    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        "event": "mouseenter",  //@param 显示tooltip的事件，默认hover的时候显示tooltip，为false的时候就不绑定事件，如果后面设置了自动隐藏，则mouseenter对应的是mouseleave,focus对应的是blur，进行自动隐藏事件侦听，使用代理的时候，目测不支持focus,blur
        //"content": "",        /\/\@param tooltip显示内容，默认去获取element的title属性
        "width": "auto",        //@param tip宽度，默认是auto
        "height": "auto",       //@param tip高度，默认是auto    
        "arrow": true,          //@param 是否显示尖角图标，默认为true
        "autohide": true,       //@param 元素hoverout之后，是否自动隐藏tooltip，默认true
        "delegate": false,      //@param 元素是否只作为一个代理元素，这样适合对元素内多个子元素进行tooltip绑定
        "disabled": false,      //@param 禁用
        "track": false,         //@param tooltip是否跟随鼠标，默认否
        "animated": true,         //@param 是否开启显示隐藏切换动画效果
        "position": "rt",      //@param tooltip相对于element的位置，like: "rt,rb,rc..."
        "positionMy": false,    //@param tooltip元素的定位点，like: "left top+11"
        "positionAt": false,    //@param element元素的定位点，like: "left top+11",positionAt && positionMy时候忽略position设置
        "hiddenDelay": 64,    //@param tooltip自动隐藏时间，单位ms
        "contentGetter": function(elem) {
            if(elem.tagName.toLowerCase() != "a") return
            return elem.title
        }, //@optMethod contentGetter() 获取内容接口，讲srcElement作为参数传递过来，默认是返回a标签的title，如果该函数返回为空，那么则不会显示tooltip
        //@optMethod $animateArrMaker(from, to) 不支持css3动画效果步长生成器函数，返回一个数组，类似[0,xx,xx,xx,50]
        $animateArrMaker: function(from, to) {
            var arr = []
                , dis = to - from
                , d = dis > 0 ? 10 : -10
            while(from != to) {
                from += d
                from = from > 100 ? 100 : from
                dis = parseInt(dis - d)
                if(Math.abs(dis) <= 1) from = to
                arr.push(from)
            }
            if(!arr.length) arr = [to]
            return arr
        },
        getTemplate: function(tmpl, opts) {
            return tmpl
        }, //@optMethod getTemplate(tpl, opts) 定制修改模板接口
        $author: "skipper@123"
    }
})