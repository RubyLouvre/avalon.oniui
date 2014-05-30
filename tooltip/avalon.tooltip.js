/**
  * tooltip组件，
  *
  */
define(["avalon", "text!./avalon.tooltip.html", "text!./avalon.tooltip.css"], function(avalon, tmpl, css) {

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
                    op = alpha ? alpha.opacity : 100
            return (op / 100) + "" //确保返回的是字符串
    }
    function setOp(node, op) {
        node.style.filter = "alpha(opacity=" + op * 100 + ")"
        node.style.opacity = op
    }

    var widget = avalon.ui.tooltip = function(element, data, vmodels) {
        var options = data.tooltipOptions
            , selfContent = ''
            , hideTimer
            , animateTimer
            , tooltipElem
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
            var tooltipElems = {}
            vm.$skipArray = ["widgetElement", "template", "delegate"]

            var inited
            vm.$init = function() {
                if(inited) return
                inited = true

                if(vmodel.delegate) {
                    element.setAttribute("ms-mouseover", "$show($event)")
                } else {
                    element.setAttribute("ms-mouseenter", "$show($event)")
                }
                tooltipElem = tooltipELementMaker()
                avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                avalon.scan(element, [vmodel].concat(vmodels))
            }
            vm.$remove = function() {
                if(tooltipElem && tooltipElem.parentNode) tooltipElem.parentNode.removeChild(tooltipElem)
            }

            //@method show(elem) 显示tooltip，相对于elem定位，如果elem为空，则不改变位置
            vm.show = function(elem) {
                if(elem) {
                    var pos = avalon(elem).position()
                        , w = elem.offsetWidth
                        , h = elem.offsetHeight
                        , tippos = vmodel.position.split(' ')

                    if(tippos.length != 2) tippos = widget.defaults.position.split(' ')
                    var x = tippos[0].replace(/(^center|^left|^right)/g, function(mat) {
                        if(mat == 'center') {
                            return (w / 2) >> 0
                        } else if(mat == 'right'){
                            return w
                        }
                        return 0
                    })
                    x = eval(x) >> 0
                    var y = tippos[1].replace(/(^center|^top|^bottom)/g, function(mat) {
                        if(mat == 'center') {
                            return (h / 2) >> 0
                        } else if(mat == 'bottom'){
                            return h
                        }
                        return 0
                    })
                    y = eval(y) >> 0
                    tooltipElem.style.left = (x + pos.left) + 'px'
                    tooltipElem.style.top = (y + pos.top) + 'px'
                }
                if(!tooltipElem) return
                if(vmodel.animated) {
                    clearInterval(animateTimer)
                    var now = (getOp(tooltipElem) * 100) >> 0
                    dis = vmodel.$animateArrMaker(now, 100)
                    animateTimer = setInterval(function() {
                        if(dis.length <= 0) {
                            tooltipElem.style.display = 'block'
                            return clearInterval(animateTimer)
                        }
                        setOp(tooltipElem, dis[dis.length - 1] / 100)
                        dis.splice(0, 1) 
                    }, 50)
                } else {
                    tooltipElem.style.display = 'block'
                }
            }
            //@method hide($event) 隐藏tooltip，参数是$event，可缺省
            vm.hide = function(e) {
                e && e.preventDefault && e.preventDefault()
                if(!tooltipElem) return
                if(vmodel.animated) {
                    clearInterval(animateTimer)
                    var now = (getOp(tooltipElem) * 100) >> 0
                    dis = vmodel.$animateArrMaker(now, 0)
                    animateTimer = setInterval(function() {
                        if(dis.length <= 0) {
                            tooltipElem.style.display = 'none'
                            return clearInterval(animateTimer)
                        }
                        setOp(tooltipElem, dis[dis.length - 1] / 100)
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
                tar.title = ''

                vmodel.show(tar)
                if(!tooltipElem) {
                    tooltipElem = tooltipELementMaker()
                    avalon.scan(tooltipElem, [vmodel].concat(vmodels))
                }
                if(!inited && vmodel.autohide) {
                    tar.setAttribute('ui-tooltip-inited', 1)
                    avalon(tar).bind('mouseleave', function() {
                        clearTimeout(hideTimer)
                        tar.title = oldTitle
                        hideTimer = setTimeout(vmodel.hide, vmodel.hiddenDelay)
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
        "event": "mouseenter",       //@param 显示tooltip的事件，默认hover的时候显示tooltip，为false的时候就不绑定事件
        //"content": "",        //@param tooltip显示内容，默认去获取element的title属性
        "autohide": true,       //@param 元素hoverout之后，是否自动隐藏tooltip，默认true
        "delegate": false,      //@param 元素是否只作为一个代理元素，这样适合对元素内多个子元素进行tooltip绑定
        "disabled": false,      //@param 禁用
        "track": false,         //@param tooltip是否跟随鼠标，默认否
        "animated": true,         //@param 是否开启显示隐藏切换动画效果
        "position": "right+10 top",      //@param tooltip相对于element的位置，like: "(left|center|right)([+-]number)? (top|center|bottom)([+-]number)?"
        "hiddenDelay": 16,    //@param tooltip自动隐藏时间
        "contentGetter": function(elem) {
            if(elem.tagName.toLowerCase() != 'a') return
            return elem.title
        }, //@optMethod contentGetter() 获取内容接口，讲srcElement作为参数传递过来，默认是返回title
        //@optMethod $animateArrMaker(from, to) 不支持css3动画效果步长生成器函数，返回一个数组，类似[0,xx,xx,xx,50]
        $animateArrMaker: function(from, to) {
            var arr = []
                , dis = to - from
            while(from != to) {
                from += parseInt(dis / 1.5)
                dis = parseInt(dis - dis / 1.5)
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