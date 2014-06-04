/**
  * tooltip组件，
  *
  */
define(["avalon", "text!./avalon.tooltip.html", "text!./avalon.tooltip.css", "avalon.position"], function(avalon, tmpl, css) {

    var cssText = css
    var styleEl = document.getElementById("avalonStyle")
    var template = tmpl
    var count = 1
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    function getOp(node) {
        var alpha = node.filters && (node.filters.alpha || node.filters["DXImageTransform.Microsoft.Alpha"]),
                    op = alpha ? alpha.opacity : node.style.opacity ? (node.style.opacity * 100) >> 0 : 0
            return op //确保返回的是字符串
    }
    function setOp(node, op) {
        if(node.filters) {
            if(typeof node.filters.alpha != 'undefined') {
                node.filters.alpha = op
            } else {
                node.filters["DXImageTransform.Microsoft.Alpha"] = op
            }
        } else {
            node.style.opacity = op / 100
        }
        
    }

    var widget = avalon.ui.tooltip = function(element, data, vmodels) {
        var options = data.tooltipOptions
            , selfContent = ''
            , hideTimer
            , animateTimer
            , tooltipElem
            , cat = options.positionAt
            , cmy = options.positionMy
            , acat
            , acmy
            , inmy
            , p = options.position
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        function tooltipELementMaker() {
            var div = document.createElement('div')
                div.innerHTML = vmodel.getTemplate(template, options)
            var tooltipElem = div.getElementsByTagName('div')[0]
            document.body.appendChild(tooltipElem)
            return tooltipElem
        }

        var vmodel = avalon.define(data.tooltipId, function(vm) {
            avalon.mix(vm, options)
            if(typeof vm.content == 'undefined') vm.content = element.getAttribute('title')
            vm.widgetElement = element
            vm.arrClass = 'left'
            var tooltipElems = {}
            vm.$skipArray = ["widgetElement", "template", "delegate"]

            var inited
            vm.$init = function() {
                if(inited) return
                inited = true

                if(!(cmy && cat)) {
                    switch (p) {
                        case "tc"://正上方
                            cmy = "center bottom-10"
                            cat = "center top"
                            vmodel.arrClass = 'bottom'
                            break;
                        case "tl": //上方靠左
                            cmy = "left bottom-10"
                            cat = "left top"
                            vmodel.arrClass = 'bottom'
                            break
                        case "tr": //上方靠右
                            cmy = "right bottom-10"
                            cat = "right top"
                            vmodel.arrClass = 'bottom'
                            break
                        case "lt"://左方靠上
                            cmy = "right-10 top"
                            cat = "left top"
                            vmodel.arrClass = 'right'
                            break
                        case "lc"://正左方
                            cmy = "right-10 center"
                            cat = "left center"
                            vmodel.arrClass = 'right'
                            break
                        case "lb"://左方靠下
                            cmy = "right-10 bottom"
                            cat = "left bottom"
                            vmodel.arrClass = 'right'
                            break
                        case "rt"://右方靠上
                            cmy = "left+10 top"
                            cat = "right top"
                            vmodel.arrClass = 'left'
                            break
                        case "rc"://正右方
                            cmy = "left+10 center"
                            cat = "right center"
                            vmodel.arrClass = 'left'
                            break
                        case "rb"://右方靠下
                            cmy = "left+10 bottom"
                            cat = "right bottom"
                            vmodel.arrClass = 'left'
                            break
                        case "bl"://下方靠左
                            cmy = "left top+10"
                            cat = "left bottom"
                            vmodel.arrClass = 'top'
                            break
                        case "bc"://正下方
                            cmy = "center top+10"
                            cat = "center bottom"
                            vmodel.arrClass = 'top'
                            break
                        case "br"://下方靠右
                            cmy = "right top+10"
                            cat = "right bottom"
                            vmodel.arrClass = 'top'
                            break
                        case "cc"://居中
                            cmy = cat = "center center"
                            break
                        default:
                            cmy = "left top+10"
                            cat = "left bottom"
                            vmodel.arrClass = 'bottom'
                            break
                    }
                } else {
                    var ats = cat.replace(/[0-9\+\-]+/g, '').split(/\s+/)
                        , mys = cmy.replace(/[0-9\+\-]+/g, '').split(/\s+/)
                    // top or bottom
                    if(ats[0] == mys[0]) {
                        if(ats[0] == 'top') {
                            vmodel.arrClass = 'bottom'
                        } else {
                            vmodel.arrClass = 'top'
                        }
                    } else if(ats[1] == mys[1]) {
                        if(ats[0] == 'left') {
                            vmodel.arrClass = 'right'
                        } else {
                            vmodel.arrClass = 'left'
                        }
                    }
                }
                xxx(vmodel.arrClass)

                if(vmodel.event == 'mouseenter') {
                    if(vmodel.delegate) {
                        vmodel.event = 'mouseover'
                    }
                }
                element.setAttribute("ms-" + vmodel.event, "$show($event)")
                tooltipElem = tooltipELementMaker()
                avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                avalon.scan(element, [vmodel].concat(vmodels))
            }

            function xxx(arrClass) {
                 switch(arrClass) {
                    case "top":
                        acmy = "center bottom+10"
                        inmy = "center bottom+11"
                        acat = "center bottom"
                        break
                    case "left":
                        acmy = "left+3 center"
                        inmy="left+5 center"
                        acat = "right center"
                        break
                    case "right":
                        acmy = "right-3 center"
                        inmy="right-5 center"
                        acat = "left center"
                        break
                    case "bottom":
                    default:
                        acmy = "center top-10"
                        inmy="center top-11"
                        acat = "center top"
                }
            }

            vm.$remove = function() {
                if(tooltipElem && tooltipElem.parentNode) tooltipElem.parentNode.removeChild(tooltipElem)
            }
            //@method show(elem) 显示tooltip，相对于elem定位，如果elem为空，则不改变位置
            vm.show = function(elem) {
                tooltipElem.style.display = 'block'
                if(elem && elem.nodeName) {
                    var tipElem = avalon(tooltipElem)
                        , atEle = avalon(elem)
                        , tcat = cat
                        , tcmy = cmy


                    // 水平方向，如果tooltip的长度小于elem的长度，箭头向tip元素居中对齐
                    if(vmodel.arrClass == 'bottom' || vmodel.arrClass == 'top') {
                        if(tooltipElem.offsetWidth < elem.offsetWidth) {
                            tcmy = tcmy.replace(/^\S+/g, 'center')
                            tcat = tcat.replace(/^\S+/g, 'center')
                        }
                    } else if(vmodel.arrClass == 'left' || vmodel.arrClass == 'right') {
                        if(tooltipElem.offsetHeight < elem.offsetHeight) {
                            tcmy = tcmy.replace(/\S+$/g, 'center')
                            tcat = tcat.replace(/\S+$/g, 'center')
                        }
                    }
                    tipElem.position({
                        of: elem
                        , at: tcat
                        , my: tcmy
                    })
                     // position组件自动调整的时候调整箭头上下朝向
                    if(tipElem.position().top > atEle.position().top + elem.offsetHeight && vmodel.arrClass == 'bottom') {
                        vm.arrClass = 'top'
                        tipElem.removeClass('ui-tooltip-bottom').addClass('ui-tooltip-top')
                        xxx('top')
                    } else if(tipElem.position().top + tooltipElem.offsetHeight < atEle.position().top && vmodel.arrClass == 'top') {
                        vm.arrClass = 'bottom'
                        tipElem.removeClass('ui-tooltip-top').addClass('ui-tooltip-bottom')
                        xxx('bottom')
                    } else {
                        xxx(vmodel.arrClass)
                    }

                tooltipElem.style.display = 'none'

                tooltipElem.style.display = 'block'

                    var acat2 = acat
                        , acmy2 = acmy
                        , inmy2 = inmy
                    // 如果tooltip的宽度或者高度不够的时候，调整箭头位置
                    var x = tooltipElem.getElementsByTagName('b')[0]
                        , x2 = tooltipElem.getElementsByTagName('b')[1]
                        , tar = elem
                    avalon(x).position({
                        of: tar
                        , at: acat2
                        , my: acmy2
                    })
                    avalon(x2).position({
                        of: tar
                        , at: acat2
                        , my: inmy2
                    })
                }
                if(!tooltipElem) return
                if(vmodel.animated && 1) {
                    clearInterval(animateTimer)
                    var now = (getOp(tooltipElem) * 100) >> 0
                    dis = vmodel.$animateArrMaker(now, 100)
                    setOp(tooltipElem, dis[0])
                    dis.splice(0, 1)
                    animateTimer = setInterval(function() {
                        if(dis.length <= 0) {
                            return clearInterval(animateTimer)
                        }
                        setOp(tooltipElem, dis[0])
                        dis.splice(0, 1) 
                    }, 50)
                }
            }
            //@method hide($event) 隐藏tooltip，参数是$event，可缺省
            vm.hide = function(e) {
                e && e.preventDefault && e.preventDefault()
                if(!tooltipElem) return
                if(vmodel.animated) {
                    clearInterval(animateTimer)
                    var now = getOp(tooltipElem) >> 0
                    dis = vmodel.$animateArrMaker(now, 0)
                    animateTimer = setInterval(function() {
                        if(dis.length <= 0) {
                            tooltipElem.style.display = 'none'
                            avalon(tooltipElem).addClass('ui-tooltip-hidden')
                            return clearInterval(animateTimer)
                        }
                        setOp(tooltipElem, dis[0])
                        dis.splice(0, 1) 
                    }, 50)
                } else {
                    tooltipElem.style.display = 'none'
                }
            }

            vm.$show = function(e) {
                var tar = e.srcElement || e.target
                    , content = vmodel.contentGetter.call(vmodel, tar)
                if(typeof content == 'undefined') return
                clearTimeout(hideTimer)
                var inited = tar.getAttribute('ui-tooltip-inited')
                var oldTitle = tar.title
                vmodel.content = content
                if(tar.title) tar.title = ''
                avalon(tooltipElem).removeClass('ui-tooltip-hidden')

                vmodel.show(tar)
                if(!tooltipElem) {
                    tooltipElem = tooltipELementMaker()
                    avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                }
                if(!inited) {
                    tar.setAttribute('ui-tooltip-inited', 1)
                    avalon(tar).bind('mouseleave', function() {
                        clearTimeout(hideTimer)
                        if(oldTitle) tar.title = oldTitle
                        if(vmodel.autohide) hideTimer = setTimeout(vmodel.hide, vmodel.hiddenDelay)
                    })
                }
            }

        })
      
        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        "event": "mouseenter",  //@param 显示tooltip的事件，默认hover的时候显示tooltip，为false的时候就不绑定事件
        //"content": "",        /\/\@param tooltip显示内容，默认去获取element的title属性
        "arrow": true,          //@param 是否显示尖角图标，默认为true
        "autohide": !true,       //@param 元素hoverout之后，是否自动隐藏tooltip，默认true
        "delegate": false,      //@param 元素是否只作为一个代理元素，这样适合对元素内多个子元素进行tooltip绑定
        "disabled": false,      //@param 禁用
        "track": false,         //@param tooltip是否跟随鼠标，默认否
        "animated": true,         //@param 是否开启显示隐藏切换动画效果
        "position": "rt",      //@param tooltip相对于element的位置，like: "rt,rb,rc..."
        "positionMy": false,    //@param tooltip元素的定位点，like: "left top+11"
        "positionAt": false,    //@param element元素的定位点，like: "left top+11",positionAt && positionMy时候忽略position设置
        "hiddenDelay": 16,    //@param tooltip自动隐藏时间
        "contentGetter": function(elem) {
            if(elem.tagName.toLowerCase() != 'a') return
            return elem.title
        }, //@optMethod contentGetter() 获取内容接口，讲srcElement作为参数传递过来，默认是返回title
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
            if(arr.length == 0) arr = [to]
            return arr
        },
        getTemplate: function(tmpl, opts) {
            return tmpl
        }, //@optMethod getTemplate(tpl, opts) 定制修改模板接口
        $author: "skipper@123"
    }
})