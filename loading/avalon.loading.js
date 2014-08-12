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
            rate = 2 + vmodel.circleMargin,
            radiusInner = (vmodel.width - vmodel.widthInner) / 2,
            marginLeft = (width - radiusInner * ( 3 * count - 1)) / 2,
            obj
        while( i < count) {
            angel = (1 - i * 2 / count) * Math.PI
            if(isBallLine) {
                obj = {
                    "x": marginLeft + (i * rate * radiusInner),
                    "y": height / 2 - radiusInner,
                    "r": radiusInner
                }
                opacities.push(i ? 0 : 1)
            } else {
                obj = {
                    "x": (radiusOut - radiusInner) *　(Math.cos(angel) + 1),
                    "y": (radiusInner - radiusOut) * (Math.sin(angel) - 1),
                    "r": radiusInner
                } 
                opacities.push((i / (count - 1)).toFixed(2))
            }
            points.push(obj)
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
    // 静态模板
    function tplReplacer(tpl, objectList, vmodel, index, item) {
        var objectList = Array.isArray(objectList) ? objectList : [objectList]
        var t = tpl.replace(/\{\{MS_[A-Z_0-9]+\}\}/g, function(mat) {
            var mat = (mat.split("{{MS_WIDGET_")[1]||"").replace(/\}\}/g, "").toLowerCase().replace(/_[^_]/g, function(mat) {
                return mat.replace(/_/g, "").toUpperCase()
            })
            for(var i = 0, len = objectList.length; i < len; i++) {
                if(objectList[i][mat] != void 0) {
                    var res = objectList[i][mat]
                    if(typeof res === "function") {
                        return res(objectList[i], index, mat)
                    }
                    return res
                }
            }
            return mat
        })
        return t
    }
    // 注册ball，小球排列成一个圆
    addType("ball", {
        "width": 46,
        "widthInner": 40,
        "count": 12, //@param type=ball，loading效果组成的小图形个数
        "interval": 120,//@param type=ball，毫秒数，动画效果帧间隔
        "circleMargin": 1,//@param type=ball-line，小球之间的间距，单位是一倍小球半径
        "data": [],
        "opacities": [],
        "tplFilter": function(tpl, vmodel, i, item) {
            return tplReplacer(tpl, {
                cssBall: [
                    "left:" + item.x + "px;",
                    "top:" + item.y + "px;",
                    "width:" + item.r * 2 + "px;",
                    "height:" + item.r * 2 + "px;"
                ].join(""),
                cssbindings: [
                    "ms-css-opacity=\"" + vmodel.opacities[i] + "\""
                ].join(" ")
            }, vmodel, i, item)
        }
    }, function(vmodel) {
       var list = ComputePoints(vmodel)
       vmodel.data = list[0]
       vmodel.opacities = list[1]
    }, function(vmodel, ele) {
        ele = vmodel.svgSupport ? ele.getElementsByTagName("circle") : ele.getElementsByTagName("oval")
        var len = ele.length, index = len, eles = [], flag
        avalon.each(ele, function(i, item) {
            eles.push(avalon(item))
            // fix ie 7-8 render bug...
            if(i === len - 1 && !vmodel.svgSupport) {
                item.style.display = "none"
                item.style.display = "block"
            }
        })
        clearInterval(vmodel.$timer)
        if(vmodel.type === "ball") {
            vmodel.$timer = setInterval(function() {
                // 顺时针
                index--
                if(index < 0) {
                    index = len - 1
                }
                for(var i = 0; i < len; i++) {
                    var op = vmodel.opacities[(i + index) % len] * 100 / 100
                    eles[i] && eles[i].css("opacity", op)
                }
            }, vmodel.interval)
        } else if(vmodel.type === "ball-line") {
            index = 0;
            vmodel.$timer = setInterval(function() {
                for(var i = 0; i < len; i++) {
                    var op = i > index ? vmodel.opacities[1] : vmodel.opacities[0]
                    eles[i] && eles[i].css("opacity", op)
                }
                index++
                if(index >= len) {
                    index = -1
                }
            }, vmodel.interval)
        }
    })
    // 注册ball-line，小球排列成一行
    addType("ball-line", avalon.mix({}, _config["ball"], {
        count: 3,//@param type=ball-line，小球个数
        height: 20,//@param type=ball-line，高度
        interval: 360 //@param type=ball-line，毫秒数，动画效果帧间隔
    }), function(vmodel) {
        var list = ComputePoints(vmodel, true)
        vmodel.data = list[0]
        vmodel.opacities = list[1]
    }, _config["ball"].effect)
    templateCache["ball-line"] = templateCache["ball"]
    // 注册spin，圆环转圈
    addType("spin", {
        width: 46,
        widthInner: 36,
        angel:90,//@param type=spin，转动的弧形的角度，单位是1度
        arc: "",
        circle: "",
        radius: "",
        opacity: 0.2,//@param type=spin，背景圆弧的透明度
        startangle: 0,//@param type=spin，圆弧开始的角度，单位1度
        endangle: 0,
        interval: 36,//@param type=spin，毫秒数，动画效果帧间隔
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
    // 注册小长方形圆形排列效果
    addType("spokes", {
        count: 8, //@param type=spokes，长方形个数
        width: 32, //@param type=spokes，效果宽度,
        spokesWidth: 4,//@param type=spokes，小长方形宽度
        spokesHeight: 8,//@param type=spokes，小长方形高度
        interval: 125,//@param type=spokes，效果动画间隔毫秒数
        svgPath: "M14 0 H18 V8 H14 z",
        svgDur: "1s",
        "tplFilter": function(tpl, vmodel, i, item) {
            return tplReplacer(tpl, [{

            }, vmodel], vmodel, i, item)
        },
        "spokesPath": function(vmodel, i, mat) {
            return vmodel.data[i].rotate
        }
    },function(vmodel) {
        var data = [], count = vmodel.count,w = vmodel.width, sw = vmodel.spokesWidth, sh = vmodel.spokesHeight, index = 0, step = 360 / count, interval = vmodel.interval;
        if(vmodel.svgSupport) {
            while(index < count) {
                data.push({
                    "begin": [interval * index / 1000, "s"].join(""),
                    "rotate": ["rotate(", index * step, " ", [w / 2, w / 2].join(" ") + ")"].join("")
                })
                index = data.length
            }
            vmodel.svgPath = ["M", (w - sw) / 2, " 0 H", (w + sw) / 2,  " V", sh, " H", (w - sw) / 2, " z"].join("")
            vmodel.svgDur = interval * count / 1000 + "s"
        } else {
            var step = Math.PI * 2 / count, angel,halfSw = sw / 2  
            while(index < count) {
                angel = Math.PI / 2 - step * index
                var vsin = Math.sin(angel),
                    vcos = Math.cos(angel),
                    p1 = [w * vcos - halfSw * vsin, w * vsin + halfSw * vcos].join(" "),
                    p2 = [w * vcos + halfSw * vsin, w * vsin - halfSw * vcos].join(" "),
                    p3 = [(w - sh) * vcos + halfSw * vsin, (w - sh) * vsin - halfSw * vcos].join(" "),
                    p4 = [(w - sh) * vcos - halfSw * vsin, (w - sh) * vsin + halfSw * vcos].join(" ")
                data.push({
                    "rotate": ["M", p1, " L", p2, " L", p3, " L", p4, " L", p1, " Z"].join("")
                })
                index = data.length
            }
        }
        vmodel.data = data
    }, function(vmodel, ele) {

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
            if(!vm.tplFilter) vm.tplFilter = function(tpl) {return tpl}
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
                    radiusOut = vmodel.width / 2
                    list = vmodel.drawer(vmodel),
                    html = ""
                vmodel.width = vmodel.width == false ? vmodel.height : vmodel.width
                vmodel.height = vmodel.height == false ? vmodel.width : vmodel.height
                // 下面的条件判断目测只针对type=ball有效
                if(vmodel.svgSupport) {
                    var tpl = templateCache[type]["svg"]
                    html += tpl
                } else {
                    var tpl = templateCache[type]["vml"]
                    // vml cloneNode有问题，用拼接字符串来解决
                    avalon.each(vmodel.data, function(i, item) {
                        html += vmodel.tplFilter(tpl, vmodel, i, item)
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
        color: "#619FE8",//@param 效果的颜色
        // width: 46, //@param loading动画的宽度，圆形排列的外直径
        // height: 46, //@param loading动画的高度，如果不设置，默认等于width
        // widthInner: 40,//@param loading动画是圆形排列的时候，这个参数指的是内直径
        type: "ball", //@param 类型，默认是ball，球，可取spin,ball-line
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