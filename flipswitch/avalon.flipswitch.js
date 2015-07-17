/**
 * @cnName 滑动按钮组件
 * @enName flipswitch
 * @introduce
 *  <p> 将checkbox表单元素转化成富UI的开关，[不支持ms-duplex，请在onChange回调里面处理类似ms-duplex逻辑] - 在2015.7.13以后已支持
 * <font color="red">注意：如果指定了ms-duplex，则采用duplex指定的值，接着只采用checked属性为true时情景，最后采用data-flipswitch-cheched以及option.checked，因此可以通过ms-duplex，ms-checked，data-flipswitch-cheched以及option.checked来配置初始值，ms-duplex会进入一个异步scan的逻辑</font>
</p>
 */
define(["avalon", "text!./avalon.flipswitch.html", "../draggable/avalon.draggable", 
    '../avalon.getModel', "css!./avalon.flipswitch.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {

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
            vm.rootElement = ""
            vm.$css3support = css3support && vm.animated
            vm.$skipArray = ["widgetElement", "template", "rootElement"]
            vm.$svgSupport = svgSupport
            if(vm.size == "large") {
                vm.draggerRadius = 19
                vm.height = 38
                vm.width = 76
            } else if(vm.size == "mini") {
                vm.draggerRadius = 6
                vm.height = 12
                vm.width = 28
            } else if(vm.size == "small") {
                vm.draggerRadius = 8
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
            vm.$init = function(continueScan) {
                if(inited) return
                inited = true
                var divCon = avalon.parseHTML(formateTpl(vmodel.template))
                newDiv = divCon.childNodes[0]
                insertAfer(element, newDiv)
                vm.rootElement = newDiv
                divCon = null

                inputEle = element
                // 提取ms-duplex绑定
                var du = inputEle.getAttribute("ms-duplex")
                if(du) {
                    inputEle.removeAttribute("ms-duplex")
                }
                var tarVmodel
                var duplexValue
                function _scan() {

                    // 阻止节点移除事件触发$destroy
                    inputEle.msRetain = true;

                    inputEle.parentNode.removeChild(inputEle)
                    inputEle.style.display = "none"

                    // 如果指定了ms-duplex，则采用duplex指定的值，接着只采用checked属性为true时情景，最后采用data-flipswitch-cheched以及option.checked
                    vmodel.checked = typeof duplexValue != "undefined" ? duplexValue : inputEle.checked || vmodel.checked
                    // inputEle.setAttribute("ms-attr-checked", "checked")
                    inputEle.setAttribute("ms-duplex-checked", "checked");
                    newDiv.appendChild(inputEle)
                    inputEle.msRetain = false;

                    if (continueScan) {
                        continueScan()
                    } else {
                        avalon.log("avalon请尽快升到1.3.7+")
                        if (typeof options.onInit === "function") {
                            options.onInit.call(element, vmodel, options, vmodels)
                        }
                    }
                    avalon.scan(newDiv, [vmodel].concat(vmodels))

                    bar = newDiv.firstChild

                    while(bar) {
                        if(bar.className && bar.className.indexOf("oni-flipswitch-bar") != -1) break
                        bar = bar.nextSibling
                    }
                    bar.style[vmodel.dir] = vmodel._addthisCss()

                    if(vmodel.draggable) {
                        dragger = bar.firstChild
                        while(dragger) {
                            if(dragger.className && dragger.className.indexOf("oni-flipswitch-dragger") != -1) break
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
                }

                // 先行scan一次，2015.7.13，实现通过ms-checked绑定初始值
                avalon.scan(inputEle, vmodels);
                
                if(du) {
                    // 我猜测repeat里面有延时，不然会读不到$proxy.el这种。。。只有这样了
                    avalon.nextTick(function() {
                        tarVmodel = avalon.getModel(du, vmodels) || []
                        du = tarVmodel[0]
                        tarVmodel = tarVmodel[1]
                        if(tarVmodel) {
                            tarVmodel.$watch(du, function(v) {
                                if(!!v != vmodel.checked) {
                                    vmodel._toggle()
                                }
                            })
                            vmodel.$watch("checked", function(v) {
                                tarVmodel[du] = v
                            })
                            duplexValue = tarVmodel[du]
                        }
                        _scan()
                    })
                } else {
                    _scan()
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

            //@interface toggleStatus 交替改变选中状态
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
            //@interface disable 禁用组件
            vm.disable = function() {
                vmodel.disabled = true
            }

            //@interface enable 启用组件
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

            vm.radiusSupport = radiusSupport

            return vm
        })
      
        vmodel.$watch("checked", function(newValue, oldValue) {
            vmodel.onChange && vmodel.onChange(newValue, vmodel)
        })

        return vmodel
    }

    widget.defaults = {
        toggle: true, //@config 组件是否显示，可以通过设置为false来隐藏组件
        onText: "<b class=\"oni-flipswitch-on\"></b>",           //@config 选中状态提示文字
        offText: "",//"&times;",         //@config 未选中状态提示文字
        size: "normal",         //@config 滑动条类型，默认normal，可设置为large,small,mini，以及其他任意组件不自带的名词，可以用来注入自定义class，生成ui-flipswitch-{{size}}添加给flipswitch模板容器
        theme: "normal",        //@config 主题，normal,success,warning,danger
        draggable: false,       //@config 是否支持拖动切换状态
        disabled: false,        //@config 禁用
        checked: false,         //@config 默认选中状态
        animated: true,         //@config 是否开启切换动画效果
        hdir: true,         //@config 开启、关闭选项排列顺序默认为true，即on-off,false为off-on
        dir: "left",            //\@config 组件排列方向,left,to
        getStyleFromSkin: true, //\@config 是否从皮肤的css里面计算获取圆形进度条样式，默认为true，设置为true的时候，将忽略下面draggerColor,draggerRadius,onColor,offColor,height,width,draggerRadius样式设置
        draggerColor: "#ffffff", //\@config 推动头颜色，会尝试自动到样式文件里面提取
        // draggerHoverColor: "#ffffff",
        onColor: "#45A846", //\@config 选中情况颜色，会尝试自动到样式文件里面提取
        offColor: "#D5D5D5", //\@config 未选中情况颜色，会尝试自动到样式文件里面提取
        disabledColor: "#DEDEDE",//\@config 禁用情况颜色，会尝试自动到样式文件里面提取
        draggerRadius: 12, //\@config normal size拖动头半径，会尝试自动到样式文件里面提取
        height: 24,   //\@config normal size高度，会尝试自动到样式文件里面提取
        width: 48,    //\@config normal size宽度，会尝试自动到样式文件里面提取
        css3support: false,
        //@config onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        //@config _animateArrMaker(from, to) 不支持css3动画效果步长生成器函数，返回一个数组，类似[0,xx,xx,xx,50]
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
        //@config onChange(newValue, vmodel) 选中状态发生变化时触发，参数为当前的选中状态及vmodel对象
        onChange: avalon.noop,
        //@config getTemplate(tmpl, opts) 用于修改模板的接口，默认不做修改
        getTemplate: function(tmpl, opts) {
            return tmpl
        },
        _author: "skipper@123"
    }
})