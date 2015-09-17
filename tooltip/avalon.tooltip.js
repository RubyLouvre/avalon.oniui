/**
 * @cnName 气泡组件
 * @enName tooltip
 * @introduce
 *  <p> 给一个元素或者给元素里满足配置条件的系列元素添加一个富UI及交互的气泡提示框
</p>
 */
define(["avalon", "text!./avalon.tooltip.html", "../position/avalon.position",  "css!./avalon.tooltip.css","css!../chameleon/oniui-common.css"], function(avalon, template) {
    var undefine
    function hideElement(ele) {
        ele.style.display = "none"
    }
    function showElement(ele) {
        ele.style.display = "block"
    }
    var widget = avalon.ui.tooltip = function(element, data, vmodels) {
        var options = data.tooltipOptions
            , selfContent = ""
            , hideTimer
            , animateTimer
            , tooltipElem
            , customAt = options.positionAt
            , customMy = options.positionMy
            , lessH = 2
            , lessW = 1
            , arrH = 10
            , arrW = 10
            , p = options.position
            , constantInited
            , ofElement // 用来给tooltip元素定位的，可以元素，也可以是事件
            , _event_ele // 事件起始元素
            , setContent // showBy指定的content
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        function _init(p) {
            var cName = "left",
                p = p == undefine ? options.position : p
            if(!(customMy && customAt)) {
                switch (p) {
                    case "tc"://正上方
                        customMy = "center bottom-" + arrH
                        customAt = "center top"
                        cName = "bottom"
                        break;
                    case "tl": //上方靠左
                        customMy = "left bottom-" + arrH
                        customAt = "left top"
                        cName = "bottom"
                        break
                    case "tr": //上方靠右
                        customMy = "right bottom-"  + arrH
                        customAt = "right top"
                        cName = "bottom"
                        break
                    case "lt"://左方靠上
                        customMy = "right-" +  arrW + " top"
                        customAt = "left top"
                        cName = "right"
                        break
                    case "lc"://正左方
                        customMy = "right-" +  arrW + " center"
                        customAt = "left center"
                        cName = "right"
                        break
                    case "lb"://左方靠下
                        customMy = "right-" +  arrW + " bottom"
                        customAt = "left bottom"
                        cName = "right"
                        break
                    case "rt"://右方靠上
                        customMy = "left+" +  arrW + " top"
                        customAt = "right top"
                        cName = "left"
                        break
                    case "rc"://正右方
                        customMy = "left+" +  arrW + " center"
                        customAt = "right center"
                        cName = "left"
                        break
                    case "rb"://右方靠下
                        customMy = "left+" +  arrW + " bottom"
                        customAt = "right bottom"
                        cName = "left"
                        break
                    case "bl"://下方靠左
                        customMy = "left top+" + arrH
                        customAt = "left bottom"
                        cName = "top"
                        break
                    case "bc"://正下方
                        customMy = "center top+" + arrH
                        customAt = "center bottom"
                        cName = "top"
                        break
                    case "br"://下方靠右
                        customMy = "right top+" + arrH
                        customAt = "right bottom"
                        cName = "top"
                        break
                    case "cc"://居中
                        customMy = customAt = "center center"
                        cName = "bottom"
                        break
                    default:
                        customMy = "left top+" + arrH
                        customAt = "left bottom"
                        cName = "bottom"
                        break
                }
            } else {
                var ats = customAt.replace(/[0-9\+\-]+/g, "").split(/\s+/),
                    mys = customMy.replace(/[0-9\+\-]+/g, "").split(/\s+/)
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
                    cName = mys[1] || "bottom"
                }
            }
            return cName
        }

        var vmodel = avalon.define(data.tooltipId, function(vm) {
            avalon.mix(vm, options)
            if(vm.content == undefine) vm.content = element.getAttribute("title")
            vm.widgetElement = element
            vm.arrClass = "left"
            var tooltipElems = {}
            vm.$skipArray = ["widgetElement", "template", "delegate", "rootElement"]
            vm.rootElement = ""
            vm.toggle = ""
            var inited
            vm.$init = function(continueScan) {
                if(inited) return
                inited = true

                vmodel.arrClass = _init(vmodel.position)
                // 埋个钩子
                vmodel.widgetElement.setAttribute("oni-tooltip-id", vmodel.$id)

                if(vmodel.event == "mouseenter" && vmodel.delegate) {
                    vmodel.event = "mouseover"
                }
                tooltipElem = tooltipELementMaker(vmodel.container)

                vm.rootElement = tooltipElem
                avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                vmodel.event && element.setAttribute("ms-" + vmodel.event + "-101", "_showHandlder($event)")
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.log("avalon请尽快升到1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels))
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }
           
            vm.$remove = function() {
                if(tooltipElem && tooltipElem.parentNode) tooltipElem.parentNode.removeChild(tooltipElem)
            }
            //@interface show(elem) 用这个方法来刷新tooltip的位置
            vm.show = function(elem) {
                // 每次显示前先找到最大z-index
                vm._setToolTipZIndex()

                if(vmodel.disabled || !tooltipElem) return
                if(elem == undefine) elem = ofElement
                if(elem) {
                    ofElement = elem
                    var tipElem = avalon(tooltipElem), 
                        atEle = avalon(elem), 
                        tipElemAt = customAt, 
                        tipElemMy = customMy,
                        bs = tooltipElem.getElementsByTagName("b"), 
                        arrOut, 
                        arrIn,
                        container = vmodel.container
                    for(var i = 0, len = bs.length; i < len; i++) {
                        var tb = avalon(bs[i])
                        if(tb.hasClass("oni-tooltip-arrow-out")) {
                            arrOut = tb
                        } else if(tb.hasClass("oni-tooltip-arrow-in")) {
                            arrIn = tb
                        }
                    }
                    // 哎，无语的加个延时
                    avalon.nextTick(function() {
                        showElement(tooltipElem)
                        // 定位toolp元素
                        tipElem.position({
                            of: elem, 
                            at: tipElemAt, 
                            my: tipElemMy, 
                            collision: vmodel.collision, 
                            within: (avalon.isFunction(container) ? container() : container) || document.body
                        })
                        avalon(tooltipElem).removeClass("oni-tooltip-hidden")
                        var tipPos = tipElem.offset(),
                            elemPos = atEle.offset()
                        // position组件自动调整的时候调整箭头上下朝向
                        if(elem.nodeName) {
                            if(tipPos.top > atEle.offset().top + elem.offsetHeight && vmodel.arrClass == "bottom") {
                                vmodel.arrClass = "top"
                                tipElem.removeClass("oni-tooltip-bottom").addClass("oni-tooltip-top")
                            } else if(tipPos.top + tooltipElem.offsetHeight < atEle.offset().top && vmodel.arrClass == "top") {
                                vmodel.arrClass = "bottom"
                                tipElem.removeClass("oni-tooltip-top").addClass("oni-tooltip-bottom")
                            }

                            // 根据元素和tooltip元素的宽高调整箭头位置
                            if(arrOut && arrIn) {
                                var dir = vmodel.arrClass == "bottom" || vmodel.arrClass == "left",
                                    avalonElem = avalon(elem),
                                    moveToLeft = tipPos.left + tooltipElem.offsetWidth / 2 > avalonElem.offset().left + elem.offsetWidth,
                                    moveToRight = tipPos.left + tooltipElem.offsetWidth / 2 < avalonElem.offset().left
                                // tip元素中线偏出elem
                                if((vmodel.arrClass == "top" || vmodel.arrClass == "bottom") && ( moveToRight || moveToLeft)) {
                                    arrOut.position({
                                        of: tooltipElem, 
                                        at: (moveToRight ? "right" : "left") + " " + (dir ? "bottom" : "top"), 
                                        my: (moveToRight ? "right-10" : "left+10") + " " + (dir ? "top" : "bottom"), 
                                        within: tooltipElem
                                    })
                                    arrIn.position({
                                        of: tooltipElem, 
                                        at: (moveToRight ? "right" : "left") + " " + (dir ? "bottom" : "top"), 
                                        my: (moveToRight ? "right-11" : "left+11") + " " + (dir ? "top-" : "bottom+") + lessH/2, 
                                        within: tooltipElem
                                    })
                                // 竖直方向，高度不够  
                                } else if((vmodel.arrClass == "bottom" || vmodel.arrClass == "top") && tooltipElem.offsetWidth < elem.offsetWidth) {
                                    arrOut.position({
                                        of: tooltipElem, 
                                        at: "center " + (dir ? "bottom" : "top"), 
                                        my: "center " + (dir ? "top" : "bottom"), 
                                        within: tooltipElem
                                    })
                                    arrIn.position({
                                        of: tooltipElem, 
                                        at: "center " + (dir ? "bottom" : "top"), 
                                        my: "center " + (dir ? "top-" : "bottom+") + lessH, 
                                        within: tooltipElem
                                    })
                                // 水平方向，宽度不够
                                } else if((vmodel.arrClass == "left" || vmodel.arrClass == "right") && tooltipElem.offsetHeight < elem.offsetHeight) {
                                     arrOut.position({
                                        of: tooltipElem, 
                                        at: (dir ? "left" : "right") + " center", 
                                        my: (dir ? "right" : "left") + " center", 
                                        within: tooltipElem
                                    })
                                    arrIn.position({
                                        of: tooltipElem, 
                                        at: (dir ? "left" : "right") + " center", 
                                        my: (dir ? "right+" : "left-") + lessW  + " center", 
                                        within: tooltipElem
                                    })
                                } else {
                                    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvv
                                    var elemH = elem.offsetHeight,
                                        elemW = elem.offsetWidth,
                                        oleft
                                    switch(vmodel.arrClass) {
                                        case "left":
                                        case "right":
                                            if(vmodel.arrClass == "left") {
                                                arrOut[0].style.left = "-6px"
                                                arrIn[0].style.left = "-5px"
                                            } else {
                                                arrOut[0].style.right = "-5px"
                                                arrIn[0].style.right = "-4px"
                                            }
                                            oleft = (Math.floor(elemH / 2) - tipPos.top + elemPos.top)
                                            arrOut[0].style.top = oleft + "px"
                                            arrIn[0].style.top = (oleft + 1) + "px"
                                            break
                                        case "top":
                                        case "bottom":
                                        default:
                                            if(vmodel.arrClass == "top") {
                                                arrOut[0].style.top = "-6px"
                                                arrIn[0].style.top = "-5px"
                                            } else {
                                                arrOut[0].style.top = arrIn[0].style.top = "auto"
                                                arrOut[0].style.bottom = "-6px"
                                                arrIn[0].style.bottom = "-5px"
                                            }
                                            oleft = (Math.floor(elemW / 2) - tipPos.left + elemPos.left)
                                            arrOut[0].style.left = oleft + "px"
                                            arrIn[0].style.left = (oleft + 1) + "px"
                                    }
                                }
                            }
                        }
                        // IE里面透明箭头显示有问题，屏蔽掉
                        if(vmodel.animated && !!-[1,]) {
                            clearInterval(animateTimer)
                            var now = (avalon(tooltipElem).css("opacity") * 100) >> 0
                            if(now != 100) {
                                var dis = vmodel._animateArrMaker(now, 100)
                                dis.splice(0, 1)
                                animateTimer = setInterval(function() {
                                    if(dis.length <= 0) {
                                        return clearInterval(animateTimer)
                                    }
                                    avalon(tooltipElem).css("opacity",  dis[0] / 100)
                                    dis.splice(0, 1) 
                                }, 16)
                            }
                        }
                    })
                }
            }
            //@interface hide($event) 隐藏tooltip，参数是$event，可缺省
            vm.hide = function(e) {
                e && e.preventDefault && e.preventDefault()
                if(vmodel.toggle) {
                    vmodel.toggle = false
                } else {
                    vmodel._hide()
                }
            }
            // 隐藏效果动画
            vm._hide = function(e) {
                if(!tooltipElem) return
                if(vmodel.animated && !!-[1,]) {
                    clearInterval(animateTimer)
                    var now = (avalon(tooltipElem).css("opacity") * 100) >> 0
                    if(now) {
                        var dis = vmodel._animateArrMaker(now, 0)
                        animateTimer = setInterval(function() {
                            if(dis.length <= 0) {
                                hideElement(tooltipElem)
                                avalon(tooltipElem).addClass("oni-tooltip-hidden")
                                return clearInterval(animateTimer)
                            }
                            avalon(tooltipElem).css("opacity",  dis[0]/100)
                            dis.splice(0, 1) 
                        }, 50)
                    }
                } else {
                    hideElement(tooltipElem)
                }
            }
            // 为了实现通过toggle属性控制显示隐藏
            vm._hideHandlder = function() {
                if(vmodel.toggle) {
                    vmodel.toggle = false
                } else {
                    vmodel._hide()
                }
            }
            // 响应widget元素的事件
            vm._showHandlder = function(event, force) {
                vmodel._show(event, undefine, this)
            }
            vm._show = function(e, content, ele) {
                var tar =  ele || _event_ele || vmodel.widgetElement
                    , src = e && (e.srcElement || e.target) || ofElement || vmodel.widgetElement
                    , content = content || setContent
                // delegate情形下，从src->this找到符合要求的元素
                if(content === undefine) {
                    if(vmodel.delegate) {
                        content = vmodel.contentGetter.call(vmodel, src)
                        while(!content && src && src != tar) {
                            src = src.parentNode
                            content = vmodel.contentGetter.call(vmodel, src)
                        }
                        tar = src
                    } else {
                        content = vmodel.contentGetter.call(vmodel, tar)
                    }
                } else {
                    tar = src
                }
                if(content == undefine) {
                    return
                }
                ofElement = tar
                clearTimeout(hideTimer)
                clearTimeout(animateTimer)
                var inited = tar.getAttribute("oni-tooltip-inited")
                // 禁用默认的title
                var oldTitle = tar.title
                if(vmodel.content != content) vmodel.content = content
                if(tar.title) tar.title = ""
                if(!tooltipElem) {
                    tooltipElem = tooltipELementMaker(vmodel.container)
                    avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                }
                // 减少抖动
                if(!vmodel.track) {
                    _init(vmodel.arrClass)
                }
                vmodel.show(vmodel.track ? e || tar : tar)
                var inited = tar.getAttribute("oni-tooltip-inited")
                if(!inited) {
                    tar.setAttribute("oni-tooltip-inited", 1)
                    // 自动隐藏
                    vmodel.autohide && avalon(tar).bind(vmodel.event != "focus" ? "mouseout" : "blur", function(e) {
                        if(oldTitle) tar.title = oldTitle
                        clearTimeout(hideTimer)
                        if(vmodel.autohide) hideTimer = setTimeout(vmodel._hideHandlder, vmodel.hiddenDelay)
                    })
                    // 鼠标跟随
                    if(vmodel.track && (vmodel.event == "mouseover" || vmodel.event == "mouseenter")) {
                        avalon(tar).bind("mousemove", function(e) {
                            // 阻止冒泡，防止代理情况下的重复执行过多次
                            e.stopPropagation()
                            ofElement = e
                            vmodel.show(e)
                            // 减少抖动
                            avalon(tooltipElem).removeClass("oni-tooltip-hidden")
                        })
                    }
                }
            }
            /*
             * @interface showBy($event, content) 参数满足 {target: elem}这样，或者是一个elem元素亦可，tooltip会按照elem定位，并作为参数传递给contentGetter，如果指定content，则忽略contentGetter的返回，直接显示content内容
             * @param $event 定位参照物，可以是一个事件，也可以是一个元素，如果未提供有效的元素或者事件，则采用上一次定位的元素或者事件来定位
             * @param content 用来填充tooltip的内容
             */
            vm.showBy = function(obj, content) {
                var tar = obj && obj.tagName ? obj : obj && obj.target || obj && obj.srcElement || ofElement || element
                // 如果已显示则更新内容
                if(vmodel.toggle) vmodel.content = content || vmodel.contentGetter.call(vmodel, tar)
                _event_ele = ofElement = tar
                setContent = content
                if(!vmodel.toggle) {
                    vmodel.toggle = true
                } else {
                    vmodel.show(tar) // 更新位置
                }
                setContent = undefine
            }
            vm._isShown = function() {
                var elem = avalon(tooltipElem)
                return elem.css("display") != "none" && !elem.hasClass("oni-tooltip-hidden")
            }
            vm._setToolTipZIndex = function(){
                if(vm.zIndex === "maxZIndex"){
                    avalon.css(tooltipElem, "z-index", getMaxZIndex())
                } else{
                    avalon.css(tooltipElem, "z-index", parseInt(vm.zIndex, 10))
                }

                // 获取body子元素最大的z-index
                function getMaxZIndex() {
                    var children = document.body.children,
                        maxIndex = 10, //当body子元素都未设置zIndex时，默认取10
                        zIndex;
                    for (var i = 0, el; el = children[i++];) {
                        if (el.nodeType === 1) {
                            zIndex = parseInt(avalon(el).css("z-index"), 10)
                            if (zIndex) {
                                maxIndex = Math.max(maxIndex, zIndex)
                            }
                        }
                    }
                    return maxIndex + 1
                }
            }
            /**
             *  @interface 将toolTip元素注入到指定的元素内，请在调用appendTo之后再调用showBy
             *  @param 目标元素
             */
            vm.appendTo = function(ele) {
                if(ele) {
                    ele.appendChild(tooltipElem)
                    // 更新位置
                    vmodel.toggle && vmodel.show()
                }
            }

        })
      
      
        function tooltipELementMaker(container) {
            var f = avalon.parseHTML(vmodel.template)
            var tooltipElem = f.childNodes[0]
            container = (avalon.isFunction(container) ? container() : container) || document.body
            container.appendChild(f)
            return tooltipElem
        }
        vmodel.$watch("position", function(newValue) {
            _init(vmodel.position)
            vmodel._isShown() && vmodel.show()
        })

        vmodel.$watch("positionAt", function(newValue) {
            customAt = newValue
            _init(vmodel.position)
            vmodel._isShown() && vmodel.show()
        })

        vmodel.$watch("positionMy", function(newValue) {
            customMy = newValue
            _init(vmodel.position)
            vmodel._isShown() && vmodel.show()
        })

        vmodel.$watch("toggle", function(n) {
            if(n) {
                vmodel._show(ofElement, setContent || vmodel.content)
            } else {
                vmodel._hide()
            }
        })

        return vmodel
    }

    widget.defaults = {
        toggle: false, //@config 组件是否显示，可以通过设置为false来隐藏组件，设置为true来显示【在原来的位置展示原来的内容，如果需要改变位置、内容，请使用showBy】
        collision: "none",//@config 溢出检测，当被定位元素在某些方向上溢出窗口，则移动它到另一个位置。与 my 和 at 选项相似，该选项会接受一个单一的值或一对 horizontal/vertical 值。例如：flip、fit、fit flip、fit none。/nflip：翻转元素到目标的相对一边，再次运行 collision 检测一遍查看元素是否适合。无论哪一边允许更多的元素可见，则使用那一边。/nfit：把元素从窗口的边缘移开。/nflipfit：首先应用 flip 逻辑，把元素放置在允许更多元素可见的那一边。然后应用 fit 逻辑，确保尽可能多的元素可见。/nnone: 不检测
        event: "mouseenter",  //@config 显示tooltip的事件，默认hover的时候显示tooltip，为false的时候就不绑定事件，如果后面设置了自动隐藏，则mouseenter对应的是mouseleave,focus对应的是blur，进行自动隐藏事件侦听，使用代理的时候，目测不支持focus,blur，event可以配置为空，则不会添加事件侦听
        content: void 0,        //@config tooltip显示内容，默认去获取element的title属性
        container: void 0, //@config {Element} 把tooltip元素append到container指定的这个元素内，可以是一个函数，用以返回一个元素
        width: "auto",        //@config tip宽度，默认是auto
        height: "auto",       //@config tip高度，默认是auto    
        arrow: true,          //@config 是否显示尖角图标，默认为true
        autohide: true,       //@config 元素hoverout之后，是否自动隐藏tooltip，默认true
        delegate: false,      //@config 元素是否只作为一个代理元素，这样适合对元素内多个子元素进行tooltip绑定
        disabled: false,      //@config 禁用
        track: false,         //@config tooltip是否跟随鼠标，默认否
        animated: true,         //@config 是否开启显示隐藏切换动画效果
        position: "rt",      //@config tooltip相对于element的位置，like: rt,rb,rc...
        positionMy: false,    //@config tooltip元素的定位点，like: left top+11
        positionAt: false,    //@config element元素的定位点，like: left top+11,positionAt && positionMy时候忽略position设置
        hiddenDelay: 16,    //@config tooltip自动隐藏时间，单位ms
        zIndex: "maxZIndex", //@config tooltip的z-index值，默认是body直接子元素中的最大z-index值
        //@config onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        contentGetter: function(elem) {
            if(elem.tagName.toLowerCase() != "a") return
            return elem.title
        }, //@config contentGetter() 获取内容接口，讲srcElement作为参数传递过来，默认是返回a标签的title，如果该函数返回为空，那么则不会显示tooltip
        //@config _animateArrMaker(from, to) 不支持css3动画效果步长生成器函数，返回一个数组，类似[0,xx,xx,xx,50]
        _animateArrMaker: function(from, to) {
            var arr = []
                , unit = 10
                , from = Math.floor(from / unit) * unit
                , to = Math.floor(to / unit) * unit
                , dis = to - from
                , d = dis > 0 ? unit : -unit
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
        }, //@config getTemplate(tpl, opts) 定制修改模板接口
        $author: "skipper@123"
    }
})