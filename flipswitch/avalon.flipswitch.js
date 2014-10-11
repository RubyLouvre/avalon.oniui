/**
  * @description flipswitch组件，将checkbox表单元素转化成富UI的开关，不支持ms-duplex，请在onChange回调里面处理类似ms-duplex逻辑
  *
  */
define(["avalon", "text!./avalon.flipswitch.html", "../draggable/avalon.draggable", "css!./avalon.flipswitch.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {

    var svgSupport = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect,
        radiusSupport =typeof avalon.cssName("border-radius") == "string"

    function formateTpl(tpl) {
        return tpl.replace(/MS_OPTION_[^\}]+/g, function(mat) {
            return mat.split("MS_OPTION_")[1].toLowerCase().replace(/_[^_]/g, function(mat) {
                return mat.split("_")[1].toUpperCase()
            })
        })
    }

    function insertAfer(tar, ele) {
        var tar = tar.nextSibling
            , par = tar.parentNode
        if(tar) {
            par.insertBefore(ele, tar)
        } else {
            par.appendChild(ele)
        }
    }

    var css3support =typeof avalon.cssName("transition") == "string"
    var widget = avalon.ui["flipswitch"] = function(element, data, vmodels) {
        var options = data.flipswitchOptions
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        var timer

        var vmodel = avalon.define(data.flipswitchId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.$css3support = css3support && vm.animated
            vm.$skipArray = ["widgetElement", "template"]
            vm.$svgSupport = svgSupport
            if(vm.size == "large") {
                vm.draggerRadius = 19
                vm.height = 38
                vm.width = 76
            } else if(vm.size == "mini") {
                vm.draggerRadius = 7
                vm.height = 12
                vm.width = 28
            } else if(vm.size == "small") {
                vm.draggerRadius = 9
                vm.height = 18
                vm.width = 36
            }
            var newDiv, 
                inputEle, 
                bar, 
                dragger, 
                dragEvent = {}

            var attrMaps = {
                "draxis": "x", 
                "drStop": function(e, data) {
                    if(e.x == dragEvent.x) {
                        vmodel._toggle()
                    } else {
                        var dis = dragEvent.x - e.x
                        , dir = vmodel._getDir()
                        if(Math.abs(dis) >= dragger.offsetWidth * 2 / 5) {
                            // 右边拖动
                            if(dis > 0 && !dir || dis < 0 && dir) {
                                vmodel.checked = !vmodel.checked
                            }
                        }
                        var to = vmodel._getDir() ? -50 : 0
                        if(css3support) {
                            bar.style[vmodel.dir] = to ? to + "%" : 0
                        } else {
                            vm._animate(-to)
                        }
                    }
                },
                "drStart": function(e, data) {
                    dragEvent = e
                },
                "drDrag": function(e) {
                }, 
                "drHandle": function(e, data) {
                    if(vmodel.disabled) {
                        return
                    } else if((e.target || e.srcElement) != dragger && (e.target || e.srcElement).parentNode != dragger && (e.target || e.srcElement).parentNode.parentNode != dragger) {
                        vmodel._toggle()
                        return
                    } 
                    return dragger
                }, 
                "drBeforeStart": function(e, data) {
                    var w = bar.parentNode.clientWidth, 
                        w2 = bar.parentNode.offsetWidth, 
                        b = (w2 - w) / 2, 
                        p = avalon(bar.parentNode).position()
                    vmodel.drContainment = data.containment = [-w * 0.5 + b + p.left, 0, p.left + b, 0]
                }, 
                "drBeforeStop": function(e, data) {
                }, 
                "drContainment": [0,0,0,0]
            }
            avalon.mix(vm, attrMaps)

            var inited
            vm.$init = function() {
                if(inited) return
                inited = true
                var divCon = avalon.parseHTML(formateTpl(vmodel.template))
                newDiv = divCon.childNodes[0]
                insertAfer(element, newDiv)
                divCon = null

                inputEle = element
                // 阻止节点移除事件触发$destroy
                inputEle.msRetain = true;

                inputEle.parentNode.removeChild(inputEle)
                inputEle.style.display = "none"

                // input元素的checked属性优先级高
                if(inputEle.checked) {
                    vmodel.checked = true
                } 
                inputEle.setAttribute("ms-checked", "checked")

                newDiv.appendChild(inputEle)
                inputEle.msRetain = false;

                avalon.scan(newDiv, [vmodel].concat(vmodels))

                vmodel._draw()


                bar = newDiv.firstChild

                while(bar) {
                    if(bar.className && bar.className.indexOf("ui-flipswitch-bar") != -1) break
                    bar = bar.nextSibling
                }
                bar.style[vmodel.dir] = vmodel._addthisCss()

                if(vmodel.draggable) {
                    dragger = bar.firstChild
                    while(dragger) {
                        if(dragger.className && dragger.className.indexOf("ui-flipswitch-dragger") != -1) break
                        dragger = dragger.nextSibling
                    }
                    if(dragger) {
                        bar.setAttribute("ms-draggable", "")
                        var avaElem = avalon(bar)
                        avalon.each(attrMaps, function(key, item) {
                            var _key = key.replace(/^dr/, "").replace(/[A-Z]/, function(mat) {return "-" + mat.toLowerCase()})
                            avaElem.data("draggable" + _key, typeof item != "function" ? item : key)
                        })
                    }
                    avalon.scan(bar, [vmodel].concat(vmodels))
                }

                // callback after inited
                if(typeof options.onInit === "function" ) {
                    //vmodels是不包括vmodel的 
                    options.onInit.call(element, vmodel, options, vmodels)
                }

            }
            vm.$remove = function() {
                newDiv.parentNode.insertBefore(inputEle, newDiv)
                newDiv.parentNode.removeChild(newDiv)
                inputEle.style.display = "inline"
                if(element.innerHTML) element.innerHTML = element.textContent = ""
            }
            vm._addThisClass = function() {
                if(!vmodel.checked && vmodel.hdir || vmodel.checked && !vmodel.hdir) return true
                return false
            }
            vm._addthisCss = function() {
                if(vmodel.checked && !vmodel.hdir || !vmodel.checked && vmodel.hdir) return "-50%"
                return "0"
            }

            //@method toggleStatus 交替改变选中状态
            vm.toggleStatus = function() {
                if(vmodel.disabled || vmodel.draggable) return
                vmodel._toggle()
            }
            vm._toggle = function() {
                vmodel.checked = !vmodel.checked
                vmodel._animate()
            }
            vm._getDir = function() {
                return vmodel.checked && !vmodel.hdir || !vmodel.checked && vmodel.hdir
            }
            vm._animate = function(to, fn) {
                var dir = vmodel._getDir()
                    , lt = bar.style[vmodel.dir]
                if(!css3support && vmodel.animated) {
                    clearTimeout(timer)
                    if(/px/.test(lt)) {
                        lt = -parseInt((parseInt(lt) >> 0) / bar.parentNode.clientWidth * 100)
                    } else {
                        lt = -parseInt(lt) >> 0 
                    }
                    var distance
                    if(dir) {
                        distance = vmodel._animateArrMaker(lt, to == void 0 ? 50 : to)
                    } else {
                        distance = vmodel._animateArrMaker(lt, to == void 0 ? 0 : to)
                    }
                    bar.style[vmodel.dir] = -distance[0] + "%"
                    distance.splice(0, 1)
                    timer = setInterval(function() {
                        if(!distance.length) {
                            fn && fn()
                            return
                        }
                        bar.style[vmodel.dir] = -distance[0] + "%"
                        distance.splice(0, 1)
                    }, 100)
                } else if(vmodel.animated) {
                    bar.style[vmodel.dir] = dir ? "-50%" : "0"
                }
            }
            //@method disable 禁用组件
            vm.disable = function() {
                vmodel.disabled = true
            }

            //@method enable 启用组件
            vm.enable = function() {
                vmodel.disabled = false
            }

            vm._getFillColor = function() {
                return vmodel.disabled ? vmodel.disabledColor : (vmodel.checked ? vmodel.onColor : vmodel.offColor)
            }

            vm._shallDrawSvg = function() {
                return vmodel.$svgSupport && !radiusSupport
            }

            vm._shallDrawVML = function() {
                return !vmodel.$svgSupport && !radiusSupport
            }

            // 根据样式绘制圆，圆角等
            //@method _draw() 动态更换皮肤后，可以调用这个方法更新提取switch样式
            vm._draw = function() {
                if(radiusSupport) return
                var divs = newDiv.getElementsByTagName("div")
                    , bs = newDiv.getElementsByTagName("b")
                    , bg
                    , ball
                if(vmodel.getStyleFromSkin) {
                    avalon.each(divs, function(i, item) {
                        var ae = avalon(item)
                        if(ae.hasClass("ui-flipswitch-bg")) bg = ae
                    }) 
                    avalon.each(bs, function(i, item) {
                        var ae = avalon(item)
                        if(ae.hasClass("ui-flipswitch-dragger-ball")) ball = ae
                    }) 
                }
                if(bg) {
                    // 从css里面提取颜色等设置，写入vmodel
                    var par = avalon(newDiv),
                        bgColor = bg.css("background-color"),
                        offColor = bgColor,
                        disabledColor = bgColor,
                        w = bg.css("width"),
                        h = bg.css("height")
                    // 防止由于样式没有加载成功造成无法获取正确的样式
                    if(!parseInt(h)) {
                        return setTimeout(vmodel._draw, 16)
                    }
                    if(vmodel.disabled) {
                        vmodel.disabled = false
                        if(vmodel.checked) {
                            bgColor = bg.css("background-color")
                            vmodel.checked = false
                            offColor = bg.css("background-color")
                            vmodel.checked = true
                        } else {
                            offColor = bg.css("background-color")
                            vmodel.checked = true
                            bgColor = bg.css("background-color")
                            vmodel.checked = false
                        }
                        vmodel.disabled = true
                    } else {
                        if(vmodel.checked) {
                            bgColor = bg.css("background-color")
                            vmodel.checked = false
                            offColor = bg.css("background-color")
                            vmodel.checked = true
                        } else {
                            vmodel.checked = true
                            bgColor = bg.css("background-color")
                            vmodel.checked = false
                        }
                        vmodel.disabled = true
                        disabledColor = bg.css("background-color")
                        vmodel.disabled = false
                    }
                    vmodel.onColor = bgColor
                    vmodel.offColor = offColor
                    vmodel.disabledColor = disabledColor
                    vmodel.height = parseInt(h)
                    vmodel.width = parseInt(w)
                    bg.css("background-color", "transparent")
                }
                if(ball) {
                    var bbColor = ball.css("background-color"),
                        bw = parseInt(ball.css("width")) >> 0
                    vmodel.draggerColor = bbColor
                    vmodel.draggerRadius = bw / 2
                    ball.css("background-color", "transparent")
                }
            }

            return vm
        })
      
        vmodel.$watch("checked", function(newValue, oldValue) {
            vmodel.onChange && vmodel.onChange(newValue, vmodel)
        })

        return vmodel
    }

    widget.defaults = {
        toggle: true, //@param 组件是否显示，可以通过设置为false来隐藏组件
        onText: "<b class=\"ui-flipswitch-on\"></b>",           //@param 选中状态提示文字
        offText: "",//"&times;",         //@param 未选中状态提示文字
        size: "normal",         //@param 滑动条类型，默认normal，可设置为large,small,mini，以及其他任意组件不自带的名词，可以用来注入自定义class，生成ui-flipswitch-{{size}}添加给flipswitch模板容器
        theme: "normal",        //@param 主题，normal,success,warning,danger
        draggable: false,       //@param 是否支持拖动切换状态
        disabled: false,        //@param 禁用
        checked: false,         //@param 默认选中状态
        animated: true,         //@param 是否开启切换动画效果
        hdir: true,         //@param 开启、关闭选项排列顺序默认为true，即on-off,false为off-on
        dir: "left",            //\@param 组件排列方向,left,to
        getStyleFromSkin: true, //\@param 是否从皮肤的css里面计算获取圆形进度条样式，默认为true，设置为true的时候，将忽略下面draggerColor,draggerRadius,onColor,offColor,height,width,draggerRadius样式设置
        draggerColor: "#ffffff", //\@param 推动头颜色，会尝试自动到样式文件里面提取
        // draggerHoverColor: "#ffffff",
        onColor: "#45A846", //\@param 选中情况颜色，会尝试自动到样式文件里面提取
        offColor: "#D5D5D5", //\@param 未选中情况颜色，会尝试自动到样式文件里面提取
        disabledColor: "#DEDEDE",//\@param 禁用情况颜色，会尝试自动到样式文件里面提取
        draggerRadius: 7, //\@param normal size拖动头半径，会尝试自动到样式文件里面提取
        height: 24,   //\@param normal size高度，会尝试自动到样式文件里面提取
        width: 48,    //\@param normal size宽度，会尝试自动到样式文件里面提取
        css3support: false,
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        //@optMethod _animateArrMaker(from, to) 不支持css3动画效果步长生成器函数，返回一个数组，类似[0,xx,xx,xx,50]
        _animateArrMaker: function(from, to) {
            var arr = []
                , dis = to - from
            while(from != to) {
                from += parseInt(dis / 1.5)
                dis = parseInt(dis - dis / 1.5)
                if(Math.abs(dis) <= 1) from = to
                arr.push(from)
            }
            if(!arr.length) arr = [to]
            return arr
        },
        //@optMethod onChange(newValue, vmodel) 选中状态发生变化时触发，参数为当前的选中状态及vmodel对象
        onChange: avalon.noop,
        //@optMethod getTemplate(tmpl, opts) 用于修改模板的接口，默认不做修改
        getTemplate: function(tmpl, opts) {
            return tmpl
        },
        _author: "skipper@123"
    }
})