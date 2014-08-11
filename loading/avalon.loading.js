/**
  * @description loading组件，实现各种加载动画效果
  *
  */
define(["avalon", "text!./avalon.loading.html", "text!./avalon.loading.bar.html", "css!./avalon.loading.css", "css!../chameleon/oniui-common.css"], function(avalon, template, ballTemplate) {
    var count = 0, 
        _key = (99999 - Math.random() * 10000) >> 0,
        templateCache = {},
        parts = ballTemplate.split("{{MS_WIDGET_TYPE}}"),
        _config = {}
    function addType(type, config, drawer, effect) {
        config["drawer"] = drawer
        config["effect"] = effect
        _config[type] = config
    }
    avalon.each(parts, function(i, item) {
        var type,
            item = item.trim().replace(/^\{\{MS_WIDGET_[^\}]+\}\}/g, function(mat) {
                type = mat.replace(/\{\{MS_WIDGET_|\}\}/g, "")
                return ""
        })
        if(type) {
            type = type.toLowerCase()
            item = item.split("{{MS_WIDGET_DIVIDER}}")
            templateCache[type] = {
                "svg": item[1],
                "vml": item[0]
            }
        }
    })
    // 计算每个loading效果单元的位置
    // 如下，是一个圆形排列阵列
    function ComputePoints(point, radiusOut, radiusInner) {
        var points = [],
            i = 0,
            angel,
            opacities = []
        while( i < point) {
            angel = (1 - i * 2 / point) * Math.PI
            points.push(
                {
                    "x": (radiusOut - radiusInner) *　(Math.cos(angel) + 1),
                    "y": (radiusInner - radiusOut) * (Math.sin(angel) - 1),
                    "r": radiusInner
                }
            )
            opacities.push((i / (point - 1)).toFixed(2))
            i = points.length
        }
        return [points, opacities]
    }
    // svg绘制圆
    function circleValueList(r, bw) {
        var arr = [],
            count = 36,
            r = r - bw,
            arc,
            x,
            y,
            res
        for(var i = 0; i <= count; i++) {
            arc = Math.PI / 2 - Math.PI * 2 / count * i
            x = Math.cos(arc) * r + r * 1 + bw * 1
            y = (1 - Math.sin(arc).toFixed(4)) * r + bw * 1
            res = (i ? " L" : "M") + x + " " + y + (i == 100 ? "Z" : "")
            arr.push(res)
        }
        return arr
    }
    // 注册ball
    addType("ball", {
        "width": 46,
        "widthInner": 40,
        "count": 12,
        "color": "#619FE8",
        "data": [],
        "opacities": [],
        "interval": 120
    }, function(vmodel) {
       var list = ComputePoints(vmodel.count, vmodel.width / 2, (vmodel.width - vmodel.widthInner) / 2)
       vmodel.data = list[0]
       vmodel.opacities = list[1]
    }, function(vmodel, ele) {
        ele = vmodel.svgSupport ? ele.getElementsByTagName("circle") : ele.getElementsByTagName("oval")
        var len = ele.length, index = 12, eles = []
        avalon.each(ele, function(i, item) {
            eles.push(avalon(item))
            // fix ie 7-8 render bug...
            if(i === len - 1 && !vmodel.svgSupport) {
                item.style.display = "none"
                item.style.display = "block"
            }
        })
        clearInterval(vmodel.$timer)
        vmodel.$timer = setInterval(function() {
            // 顺时针
            index--;
            if(index < 0) {
                index = len
            }
            for(var i = 0; i < len; i++) {
                eles[i].css("opacity", vmodel.opacities[(i + index) % len] * 100 / 100)
            }
        }, vmodel.interval)
    })
    // 注册spin
    addType("spin", {
        width: 46,
        widthInner: 36,
        angel:90,
        arc: "",
        circle: "",
        radius: "",
        color: "#619FE8",
        opacity: 0.2,
        startangle: 0,
        endangle: 0,
        interval: 36,
        $circleData: "",
        $partsData: ""
    }, function(vmodel) {
        vmodel.radius = vmodel.width / 2 - vmodel.widthInner / 2
        if(vmodel.svgSupport) {
            var circle = vmodel.$circleData = circleValueList(vmodel.width / 2, vmodel.width / 2 - vmodel.widthInner / 2),
            parts = vmodel.$partsData = circle.slice(0, Math.floor(vmodel.angel / 360 * (circle.length - 1)))
            vmodel.arc = parts.join("")
            vmodel.circle = circle.join("")
        } else {
            vmodel.startangle = 0
            vmodel.endangle = vmodel.angel
        }
    }, function(vmodel, ele) {
        clearInterval(vmodel.$timer)
        var angel = stepper = vmodel.angel
        if(vmodel.svgSupport) {
            var len = vmodel.$circleData.length
            angel = stepper = Math.floor(vmodel.angel / 360 * len)
            vmodel.$timer = setInterval(function() {
                // 生成圆弧的点阵是36个点，因此步长用1就足够了
                stepper+=1;
                vmodel.$partsData.shift()
                if(stepper >= len) stepper = 0
                vmodel.$partsData.push(" " + vmodel.$circleData[stepper].replace(/^M/g, "L").replace(/^[\s]+/g," "))
                vmodel.arc = vmodel.$partsData.join("").replace(/^[\s]*L/g, "M")
            }, vmodel.interval)
        } else {
            vmodel.$timer = setInterval(function() {
                stepper += 10
                var startangle = stepper - angel
                if(stepper > 360) {
                    stepper = stepper - 360
                    startangle = startangle - 360
                }
                vmodel.startangle = startangle
                vmodel.endangle = stepper
            }, vmodel.interval)
        }
    })
    var widget = avalon.ui.loading = function(element, data, vmodels) {
        var svgSupport = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
        
        var options = data.loadingOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)
        if(!templateCache[options.type]) {
            options.type = "ball"
        }
        // 读入各种效果的配置
        avalon.each(_config[options.type], function(i, item) {
            if(options[i] === void 0) options[i] = item
        })

        var vmodel = avalon.define(data.loadingId, function(vm) {
            vm.height = ""
            vm.width = ""
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.svgSupport = svgSupport
            vm.$loadingID = count + "" + _key
            vm.data = ""
            vm.$timer = ""
            vm.$skipArray = ["widgetElement", "template"]

            var inited
            vm.$init = function() {
                if(inited) return
                inited = true
                var id,
                    container = options.container || vmodel.widgetElement,
                    elementParent = ((avalon.type(container) === "object" && container.nodeType === 1 && document.body.contains(container)) ? container : document.getElementById(container)) || document.body
                var type = vmodel.type,
                    radiusInner = (vmodel.width - vmodel.widthInner) / 2,
                    radiusOut = vmodel.width / 2
                    list = vmodel.drawer(vmodel),
                    html = ""
                vmodel.width = vmodel.width == false ? vmodel.height : vmodel.width
                vmodel.height = vmodel.height == false ? vmodel.width : vmodel.height
                // 下面的条件判断目测只针对type=ball有效
                if(vmodel.svgSupport) {
                    var tpl = templateCache[type]["svg"]
                    html += tpl.replace(/\{\{MS_WIDGET_CSS_BINDINGS\}\}/g, 
                            [
                                "ms-css-opacity=\"opacities[$index]\"",
                                "ms-attr-r=\"data[$index].r\"",
                                "ms-attr-cx=\"data[$index].x+" + radiusInner + "\"",
                                "ms-attr-cy=\"data[$index].y+" + radiusInner + "\""
                            ].join(" "))
                } else {
                    var tpl = templateCache[type]["vml"]
                    // vml cloneNode有问题，用拼接字符串来解决
                    avalon.each(vmodel.data, function(i, item) {
                        html += tpl.replace(/\{\{MS_WIDGET_CSS_BALL\}\}/g, 
                            [
                                "left:" + item.x + "px;",
                                "top:" + item.y + "px;",
                                "width:" + radiusInner * 2 + "px;",
                                "height:" + radiusInner * 2 + "px;"
                            ].join("")).replace(/\{\{MS_WIDGET_CSS_BINDINGS\}\}/g, 
                            [
                                "ms-css-opacity=\"" + vmodel.opacities[i] + "\""
                            ].join(" "))
                    })
                    html = html || tpl
                }
                elementParent.appendChild(avalon.parseHTML(vmodel.template.replace("{{MS_WIDGET_HTML}}", html).replace("{{MS_WIDGET_ID}}", vmodel.$loadingID))) 
                avalon.scan(elementParent, [vmodel].concat(vmodels))
                if(typeof options.onInit === "function" ) {
                    //vmodels是不包括vmodel的 
                    options.onInit.call(element, vmodel, options, vmodels)
                    vmodel._effect()
                }
            }
            vm._effect = function() {
                if(vmodel.toggle) {
                    var ele = document.getElementById("ui-loading-" + vmodel.$loadingID)
                    if(ele) {
                        vmodel.effect && vmodel.effect(vmodel, ele)
                    }
                }
            }
            vm.$remove = function() {
                clearInterval(vmodel.$timer)
                element.innerHTML = element.textContent = ""
            }

            //@method showLoading() 显示loading效果
            vm.showLoading = function() {
                if(vmodel.toggle) return
                vmodel.toggle = true
                vmodel._effect()
            } 
            //@method hideLoading() 隐藏loading
            vm.hideLoading = function() {
                vmodel.toggle = false
            }
            //@method destroyLoading() 销毁loading
            vm.destroyLoading = function() {
                vmodel.toggle = false
                vmodel.$remove()
            }

        })

        vmodel.$watch("toggle", function(n) {
            if(!n) {
                clearInterval(vmodel.$timer)
            } else {
                vmodel.effect()
            }
        })
      
        count++

        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        // interval: 160,//@param 毫秒数，动画效果帧间隔
        // color: "#619FE8",//@param 效果的颜色
        // width: 46, //@param loading动画的宽度
        // height: 46, //@param loading动画的高度
        // widthInner: 
        type: "ball", //@param 类型，默认是ball，球
        toggle: true, //@param 是否显示
        modal: true, //@param 是否显示遮罩
        modalMpacity: 0.1,//@param 遮罩透明度
        container: void 0,//@param loading效果显示的容器，默认是绑定widget的元素
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "skipper@123"
    }
})