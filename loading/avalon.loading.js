/**
 * @description loading组件，实现各种加载动画效果
 *
 */
define(["avalon", "text!./avalon.loading.html", "text!./avalon.loading.bar.html", "css!./avalon.loading.css", "css!../chameleon/oniui-common.css"], function(avalon, template, ballTemplate) {
    var widgetCount = 0, 
        isIE = navigator.userAgent.match(/msie/ig) || ("ActiveXObject" in window),
        _key = (99999 - Math.random() * 10000) >> 0,
        templateCache = {},
        parts = ballTemplate.split("{{MS_WIDGET_TYPE}}"),
        _config = {}
    var avalonStyle = document.getElementById("avalonStyle")
    if (avalonStyle.innerHTML.indexOf(".vml") === -1) {
        try {
            avalonStyle.styleSheet.cssText += ".vml{behavior:url(#default#VML);}"
        } catch (e) {
        }
    }
    // 通过addtype注册新的效果
    // config里面是每个type特有的配置或者方法，mix到vm里
    // drawser方法在注入html之前执行，主要用于生成绘图需要的数据
    // effect方法用于setinterval动画效果
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
        if (type) {
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
    // ballline 为真，则返回一个横线排列
    function ComputePoints(vmodel, isBallLine) {
        var points = [],
            i = 0,
            angel = vmodel.angel,
            opacities = [],
            count = vmodel.count,
            width = vmodel.width,
            radiusOut = width / 2,
            height = vmodel.height,
            interval = vmodel.interval,
            rate = 2 + vmodel.circleMargin,
            radiusInner = (vmodel.width - vmodel.widthInner) / 2,
            marginLeft = (width - radiusInner * ( 3 * count - 1)) / 2,
            obj
        while( i < count) {
            angel = Math.PI * (0.5 - 2 * i / count)
            if(isBallLine) {
                obj = {
                    "x": marginLeft + (i * rate * radiusInner),
                    "y": height / 2 - radiusInner,
                    "r": radiusInner
                }
                opacities.push(i ? 0 : 1)
            } else {
                obj = {
                    "x": (radiusOut - radiusInner) * 　(Math.cos(angel) + 1),
                    "y": (radiusInner - radiusOut) * (Math.sin(angel) - 1),
                    "r": radiusInner,
                    "begin": [interval * i / 1000, "s"].join("")
                } 
                opacities.push((1 - i / count).toFixed(2))
            }
            points.push(obj)
            i = points.length
        }
        return [points, opacities]
    }
    // svg绘制圆弧
    function circleValueList(r, bw) {
        var arr = [],
                count = 36,
                r = r - bw,
                arc,
                x,
                y,
                res
        for (var i = 0; i <= count; i++) {
            arc = Math.PI / 2 - Math.PI * 2 / count * i
            x = Math.cos(arc) * r + r * 1 + bw * 1
            y = (1 - Math.sin(arc).toFixed(4)) * r + bw * 1
            res = (i ? " L" : "M") + x + " " + y + (i == 100 ? "Z" : "")
            arr.push(res)
        }
        return arr
    }
    // 注册ball，小球排列成一个圆
    addType("ball", {
        "width": 32,
        "widthInner": 28,
        "count": 10, //@param type=ball，loading效果组成的小图形个数
        "interval": 120,//@param type=ball，毫秒数，动画效果帧间隔
        "circleMargin": 1,//@param type=ticks，小球之间的间距，单位是一倍小球半径
        "data": [],
        "svgDur": "1s",
        "opacities": []
    }, function(vmodel) {
       var list = ComputePoints(vmodel)
       vmodel.svgDur = vmodel.interval * vmodel.count / 1000 + "s"
       vmodel.data = list[0]
       vmodel.opacities = list[1]
    }, function(vmodel, ele, tagList) {
        // only for ie
        if(!isIE && vmodel.type !== "ticks") return
        var tagList = Array.isArray(tagList) ? tagList : ["circle", "oval"]
            , tag = vmodel.svgSupport ? tagList[0] : tagList[1] 
            , ele = ele.getElementsByTagName(tag)
            , len = ele.length, index = len, eles = [], flag
        avalon.each(ele, function(i, item) {
            eles.push(avalon(item))
            // fix ie 7-8 render bug...
            if (i === len - 1 && !vmodel.svgSupport) {
                item.style.display = "none"
                item.style.display = "block"
            }
        })
        clearInterval(vmodel.$timer)
        if(vmodel.type === "ticks") {
            index = 0;
            vmodel.$timer = setInterval(function() {
                for(var i = 0; i < len; i++) {
                    var op = i > index ? vmodel.opacities[1] : vmodel.opacities[0]
                    if(eles[i]) {
                        eles[i].css("visibility", op >= 1 ? "visible" : "hidden")
                    }
                }
                index++
                if(index >= len) {
                    index = -1
                }
            }, vmodel.interval)
        } else {
            // share for type=ball and type=spokes
            vmodel.$timer = setInterval(function() {
                // 顺时针
                index--
                if (index < 0) {
                    index = len - 1
                }
                for (var i = 0; i < len; i++) {
                    var op = vmodel.opacities[(i + index) % len] * 100 / 100
                    eles[i] && eles[i].css("opacity", op)
                }
            }, vmodel.interval)
        }
    })
    // 注册ticks，小球排列成一行
    addType("ticks", avalon.mix({}, _config["ball"], {
        count: 3,//@param type=ticks，小球个数
        height: 20,//@param type=ticks，高度
        interval: 360 //@param type=ticks，毫秒数，动画效果帧间隔
    }), function(vmodel) {
        var list = ComputePoints(vmodel, true)
        vmodel.data = list[0]
        vmodel.opacities = list[1]
    }, _config["ball"].effect)
    templateCache["ticks"] = templateCache["ball"]
    // 注册spin，圆环转圈
    addType("spin", {
        width: 32,
        widthInner: 26,
        angel: 90, //@param type=spin，转动的弧形的角度，单位是1度
        arc: "",
        circle: "",
        radius: "",
        opacity: 0.2, //@param type=spin，背景圆弧的透明度
        startangle: 0, //@param type=spin，圆弧开始的角度，单位1度
        endangle: 0,
        interval: 36, //@param type=spin，毫秒数，动画效果帧间隔
        $circleData: "",
        $partsData: "",
        spinPoint: "23 23",
        svgDur: "1s"
    }, function(vmodel) {
        vmodel.radius = vmodel.width / 2 - vmodel.widthInner / 2
        if(vmodel.svgSupport) {
            vmodel.svgDur = vmodel.interval * 36 / 1000 + "s"
            vmodel.spinPoint = [vmodel.width / 2, vmodel.width / 2].join(" ")
            var circle = vmodel.$circleData = circleValueList(vmodel.width / 2, vmodel.width / 2 - vmodel.widthInner / 2),
                    parts = vmodel.$partsData = circle.slice(0, Math.floor(vmodel.angel / 360 * (circle.length - 1)))
            vmodel.arc = parts.join("")
            vmodel.circle = circle.join("")
        } else {
            vmodel.startangle = 0
            vmodel.endangle = vmodel.angel
        }
    }, function(vmodel, ele) {
        // only for ie
        if(!isIE) return
        clearInterval(vmodel.$timer)
        var angel = stepper = vmodel.angel
        if(vmodel.svgSupport) {
            var len = vmodel.$circleData.length, ele = avalon(ele.getElementsByTagName("path")[0])
            angel = stepper = Math.floor(vmodel.angel / 360 * len)
            vmodel.$timer = setInterval(function() {
                // 生成圆弧的点阵是36个点，因此步长用1就足够了
                stepper+=1;
                // vmodel.$partsData.shift()
                if(stepper >= len) stepper = 0
                // vmodel.$partsData.push(" " + vmodel.$circleData[stepper].replace(/^M/g, "L").replace(/^[\s]+/g," "))
                // vmodel.arc = vmodel.$partsData.join("").replace(/^[\s]*L/g, "M")
                // 改用rotate属性
                ele.attr("transform", "rotate(" + stepper * 10 + " " + vmodel.spinPoint + ")")
            }, vmodel.interval)
        } else {
            vmodel.$timer = setInterval(function() {
                stepper += 10
                var startangle = stepper - angel
                if (stepper > 360) {
                    stepper = stepper - 360
                    startangle = startangle - 360
                }
                vmodel.startangle = startangle
                vmodel.endangle = stepper
            }, vmodel.interval)
        }
    })
    // 注册小长方形圆形排列效果
    addType("spokes", {
        count: 8, //@param type=spokes，长方形个数
        width: 32, //@param type=spokes，效果宽度,
        spokesWidth: 4, //@param type=spokes，小长方形宽度
        spokesHeight: 8, //@param type=spokes，小长方形高度
        interval: 125, //@param type=spokes，效果动画间隔毫秒数
        svgPath: "M14 0 H18 V8 H14 z",
        svgDur: "1s",
        opacities:""
    },function(vmodel) {
        var data = [], count = vmodel.count,w = vmodel.width, sw = vmodel.spokesWidth, sh = vmodel.spokesHeight, index = 0, interval = vmodel.interval, opacities = [];
        if(vmodel.svgSupport) {
            var step = 360 / count
            while(index < count) {
                data.push({
                    "begin": [interval * index / 1000, "s"].join(""),
                    "rotate": ["rotate(", index * step, " ", [w / 2, w / 2].join(" ") + ")"].join("")
                })
                opacities.push((1 - index / count).toFixed(2))
                index = data.length
            }
            vmodel.svgPath = ["M", (w - sw) / 2, " 0 H", (w + sw) / 2, " V", sh, " H", (w - sw) / 2, " z"].join("")
            vmodel.svgDur = interval * count / 1000 + "s"
        } else {
            var step = Math.PI * 2 / count, angel, halfSw = sw / 2
            while (index < count) {
                angel = Math.PI / 2 - step * index
                var vsin = Math.sin(angel),
                    vcos = Math.cos(angel),
                    op = (1 - index / count).toFixed(2)
                data.push({
                    "spokesRotation": 360 * index / count,
                    "spokesOpacity": op * 50,
                    "spokesLeft":(w - 2 * sw) / 2 * (1 + vcos),
                    "spokesTop": (w - 2 * sw) / 2 * (1 - vsin)
                })
                opacities.push(op)
                index = data.length
            }
        }
        vmodel.data = data
        vmodel.opacities = opacities
    }, function(vmodel, ele) {
        _config["ball"].effect(vmodel, ele, ["path", "rect"])
    })
    var svgSupport = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
    if(!svgSupport &&  document.namespaces &&  !document.namespaces["v"]) {
        document.namespaces.add("v", "urn:schemas-microsoft-com:vml")
    }
    var widget = avalon.ui.loading = function(element, data, vmodels) {

        var options = data.loadingOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)
        if (!templateCache[options.type]) {
            options.type = "ball"
        }
        // 读入各种效果的配置
        avalon.each(_config[options.type], function(i, item) {
            if (options[i] === void 0) options[i] = item
        })

        var vmodel = avalon.define(data.loadingId, function(vm) {
            vm.height = ""
            vm.width = ""
            avalon.mix(vm, options)
            if(!vm.vmlTplFilter) vm.vmlTplFilter = function(tpl) {return tpl}
            vm.widgetElement = element
            vm.svgSupport = svgSupport
            vm.$loadingID = widgetCount + "" + _key
            vm.data = ""
            vm.$timer = ""
            vm.$skipArray = ["widgetElement", "template"]

            var inited
            vm.$init = function() {
                if (inited)
                    return
                inited = true
                var id,
                        container = options.container || vmodel.widgetElement,
                        elementParent = ((avalon.type(container) === "object" && container.nodeType === 1 && document.body.contains(container)) ? container : document.getElementById(container)) || document.body
                var type = vmodel.type,
                        radiusOut = vmodel.width / 2
                list = vmodel.drawer(vmodel),
                        html = templateCache[type][vmodel.svgSupport ? "svg" : "vml"]
                vmodel.width = vmodel.width == false ? vmodel.height : vmodel.width
                vmodel.height = vmodel.height == false ? vmodel.width : vmodel.height
                elementParent.appendChild(avalon.parseHTML(vmodel.template.replace("{{MS_WIDGET_HTML}}", html).replace("{{MS_WIDGET_ID}}", vmodel.$loadingID)))
                avalon.scan(elementParent, [vmodel].concat(vmodels))
                if (typeof options.onInit === "function") {
                    //vmodels是不包括vmodel的 
                    options.onInit.call(element, vmodel, options, vmodels)
                    vmodel._effect()
                }
            }
            vm._effect = function() {
                if (vmodel.toggle) {
                    var ele = document.getElementById("ui-loading-" + vmodel.$loadingID)
                    if (ele) {
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
                if (vmodel.toggle)
                    return
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
            if (!n) {
                clearInterval(vmodel.$timer)
            } else {
                vmodel.effect()
            }
        })
      
        widgetCount++

        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        color: "#619FE8", //@param 效果的颜色
        // width: 32, //@param loading动画的宽度，圆形排列的外直径
        // height: 32, //@param loading动画的高度，如果不设置，默认等于width
        // widthInner: 28,//@param loading动画是圆形排列的时候，这个参数指的是内直径
        type: "ball", //@param 类型，默认是ball，球，可取spin,ticks
        toggle: true, //@param 是否显示
        modal: true, //@param 是否显示遮罩
        modalMpacity: 0.1, //@param 遮罩透明度
        container: void 0, //@param loading效果显示的容器，默认是绑定widget的元素
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        }, //@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "skipper@123"
    }
})