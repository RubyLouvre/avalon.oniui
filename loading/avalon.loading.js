/**
 * @cnName 加载效果组件
 * @enName loading
 * @introduce
 *  <p> 实现各种加载动画效果
</p>
 */
define(["avalon", "text!./avalon.loading.html", "text!./avalon.loading.bar.html", "css!./avalon.loading.css", "css!../chameleon/oniui-common.css"], function(avalon, template, ballTemplate) {
    var widgetCount = 0, 
        isIE = navigator.userAgent.match(/msie/ig) || ("ActiveXObject" in window),
        _key = (99999 - Math.random() * 10000) >> 0,
        templateCache = {},
        parts = ballTemplate.split("{{MS_WIDGET_TYPE}}"),
        _config = {}
    // 通过addtype注册新的效果
    // config里面是每个type特有的配置或者方法，mix到vm里
    // drawser方法在注入html之前执行，主要用于生成绘图需要的数据
    // effect方法用于setinterval动画效果
    function addType(type, config, drawer, effect) {
        config["drawer"] = drawer
        config["effect"] = effect
        _config[type] = config
    }
    function g(id) {
        return document.getElementById(id)
    }
    avalon.each(parts, function(i, item) {
        var type,
                item = item.trim().replace(/^\{\{MS_WIDGET_[^\}]+\}\}/g, function(mat) {
            type = mat.replace(/\{\{MS_WIDGET_|\}\}/g, "").replace(/_/g, "-").toLowerCase()
            return ""
        })
        if (type) {
            type = type
            item = item.split("{{MS_WIDGET_DIVIDER}}")
            templateCache[type] = {
                "svg": item[1] || item[0],
                "vml": item[0]
            }
        }
    })
    // svg绘制圆弧
    function circleValueList(r, bw, ct) {
        var arr = [],
                count = ct || 36,
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
        count: 10, //@config type=ball，loading效果组成的小图形个数
        interval: 120,//@config type=ball，毫秒数，动画效果帧间隔
        circleMargin: 1,//@config type=ticks，小球之间的间距，单位是一倍小球半径
        "svgDur": "1s"
    }, function(vmodel) {
        var type = vmodel.type,
            count = vmodel.count,
            width = vmodel.width,
            radiusOut = width / 2,
            interval = vmodel.interval,
            radiusInner = (width - vmodel.widthInner) / 2
        if(type === "ball") vmodel.svgDur = interval * count / 1000 + "s"
        return function(loop) {
            var angel = Math.PI * (0.5 - 2 * loop / count)
            vmodel.data.push({
                "x": (radiusOut - radiusInner) * 　(Math.cos(angel) + 1),
                "y": (radiusInner - radiusOut) * (Math.sin(angel) - 1),
                "r": radiusInner,
                "begin": [interval * loop / 1000, "s"].join("")
            }) 
            vmodel.opacities.push((loop / count).toFixed(2))
        }
    }, function(vmodel, ele, tagList, callback) {
        // only for ie
        if(!isIE && (vmodel.type !== "ticks") && vmodel.type != "spinning-spin") return
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
        if(vmodel.type === "ticks") {
            index = 0;
            return function() {
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
            }
        } 
        // share for type=ball and type=spokes
        return function() {
            // 顺时针
            index--
            if (index < 0) {
                index = len - 1
            }
            for (var i = 0; i < len; i++) {
                if(callback) {
                    callback(eles[i], i, index)
                } else {
                    var op = vmodel.opacities[(i + index) % len] * 100 / 100
                    eles[i] && eles[i].css("opacity", op)
                }
            }
        }
    })
    // 注册ticks，小球排列成一行
    addType("ticks", avalon.mix({}, _config["ball"], {
        count: 3,//@config type=ticks，小球个数
        height: 20,//@config type=ticks，高度
        interval: 360 //@config type=ticks，毫秒数，动画效果帧间隔
    }), function(vmodel) {
        var count = vmodel.count,
            rate = 2 + vmodel.circleMargin,
            radiusInner = (vmodel.width - vmodel.widthInner) / 2,
            marginLeft = (vmodel.width - radiusInner * ( 3 * count - 1)) / 2
        return function(loop) {
            vmodel.data.push({
                "x": marginLeft + (loop * rate * radiusInner),
                "y": vmodel.height / 2 - radiusInner,
                "r": radiusInner,
                "begin": [vmodel.interval * loop / 1000, "s"].join("")
            })
            vmodel.opacities.push(loop ? 0 : 1)
        }
    }, _config["ball"].effect)
    templateCache["ticks"] = templateCache["ball"]
    // 注册spin，圆环转圈
    addType("spin", {
        width: 32,
        widthInner: 26,
        angel: 90, //@config type=spin，转动的弧形的角度，单位是1度
        arc: "",
        circle: "",
        radius: "",
        opacity: 0.2, //@config type=spin，背景圆弧的透明度
        startangle: 0, //@config type=spin，圆弧开始的角度，单位1度
        endangle: 0,
        interval: 36, //@config type=spin，毫秒数，动画效果帧间隔
        $circleData: "",
        $partsData: "",
        spinPoint: "23 23",
        svgDur: "1s",
        data: [1]
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
        var angel = stepper = vmodel.angel
        if(vmodel.svgSupport) {
            var len = vmodel.$circleData.length, ele = avalon(ele.getElementsByTagName("path")[0])
            angel = stepper = Math.floor(vmodel.angel / 360 * len)
            return function() {
                // 生成圆弧的点阵是36个点，因此步长用1就足够了
                stepper+=1;
                if(stepper >= len) stepper = 0
                // 改用rotate属性
                ele.attr("transform", "rotate(" + stepper * 10 + " " + vmodel.spinPoint + ")")
            }
        }
        return function() {
            stepper += 10
            var startangle = stepper - angel
            if (stepper > 360) {
                stepper = stepper - 360
                startangle = startangle - 360
            }
            vmodel.startangle = startangle
            vmodel.endangle = stepper
        }
    })
    // 注册小长方形圆形排列效果
    addType("spokes", {
        count: 8, //@config type=spokes，长方形个数
        width: 32, //@config type=spokes，效果宽度,
        spokesWidth: 4, //@config type=spokes，小长方形宽度
        spokesHeight: 8, //@config type=spokes，小长方形高度
        interval: 125, //@config type=spokes，效果动画间隔毫秒数
        svgPath: "M14 0 H18 V8 H14 z",
        svgDur: "1s"
    },function(vmodel) {
        var count = vmodel.count,w = vmodel.width, sw = vmodel.spokesWidth, sh = vmodel.spokesHeight, index = 0, interval = vmodel.interval;
        if(vmodel.svgSupport) {
            vmodel.svgPath = ["M", (w - sw) / 2, " 0 H", (w + sw) / 2, " V", sh, " H", (w - sw) / 2, " z"].join("")
            vmodel.svgDur = interval * count / 1000 + "s"
            var step = 360 / count
            return function(loop) {
                vmodel.data.push({     
                    "begin": [interval * loop / 1000, "s"].join(""),
                    "rotate": ["rotate(", loop * step, " ", [w / 2, w / 2].join(" ") + ")"].join("")
                })
                vmodel.opacities.push((loop / count).toFixed(2))
            }
        }
        var step = Math.PI * 2 / count, angel, halfSw = sw / 2
        return function(loop) {
            angel = Math.PI / 2 - step * loop
            var vsin = Math.sin(angel),
                vcos = Math.cos(angel),
                op = (loop / count).toFixed(2)
            vmodel.data.push({
                "spokesRotation": 360 * loop / count,
                "spokesOpacity": op * 50,
                "spokesLeft":(w / 2 - sw) * (1 + vcos),
                "spokesTop": (w /2 - sw)  * (1 - vsin)
            })
            vmodel.opacities.push(op)
        }
    }, function(vmodel, ele) {
        return _config["ball"].effect(vmodel, ele, ["path", "rect"])
    })
    // 注册小球排列成一个圆，半径变化
    addType("spinning-bubbles", avalon.mix({}, _config["ball"], {
        width: 64,//@config type=spinning-bubbles 宽度，小球的个数继承自type=ball
        widthInner: 54,//@config type=spinning-bubbles 内宽
        $zooms: []
    }), function(vmodel) {
        var drawer = _config["ball"].drawer(vmodel), count = vmodel.count
        if(count >= 7) {
            vmodel.$zooms = [0.2, 0.4, 0.8, 1, 0.8, 0.4, 0.2]
        } else if(count >= 5) {
            vmodel.$zooms = [0.2, 0.8, 1, 0.8, 0.2]
        } else {
            vmodel.$zooms = [1, 0.1, 0.1, 0.1]
        }
        while(vmodel.$zooms.length < vmodel.count) {
            vmodel.$zooms.push(0.1)
        }
        return function(loop) {
            drawer(loop)
        }
    }, function(vmodel, ele) {
        var r = (vmodel.width - vmodel.widthInner) / 2, count = vmodel.count
        if(vmodel.svgSupport) return _config["ball"].effect(vmodel, ele, ["circle", "oval"], function(ele, loop, step) {
            ele.attr("r", r * vmodel.$zooms[(loop + step) % count])
        })
        return _config["ball"].effect(vmodel, ele, ["circle", "oval"], function(ele, loop, step) {
            ele.css("zoom", vmodel.$zooms[(loop + step) % vmodel.count])
        })
    })
    // 注册bubbles, 高级浏览器
    addType("bubbles", avalon.mix({}, _config["spinning-bubbles"], {
        height: 30, //@config type=bubbles 高度，宽度继承type=spinning-bubbles
        widthInner:50,//@config type=bubbles 内宽
        count: 3,//@config type=bubbles 球的个数
        interval: 360,//@config type=bubbles 动画ms数
        "circleMargin": 0.5//@config type=bubbles bubbles效果下个小球的间距
    }), function(vmodel) {
        _config["spinning-bubbles"].drawer(vmodel)
        return _config["ticks"].drawer(vmodel)
    }, _config["spinning-bubbles"].effect)
    // 注册spinning-spin
    addType("spinning-spin", avalon.mix({}, _config["spin"], {
        opacities: [],
        data: [],
        radius: 1,
        interval: _config["ball"].interval, //@config type=spinning-spin 帧间隔，继承ball
        count: 8, //@config type=spinning-spin 小圆弧个数，一般请保证 360 / 8 % padding = 0
        width: 46, //@config type=spinning-spin 圆外直径
        widthInner: 38, //@config type=spinning-spin 圆内直径
        padding: 5//@config type=spinning-spin 小圆弧间间隔的角度数
    }), function(vmodel) {
        var ct = 360 / vmodel.padding * 3, r = vmodel.width / 2, dt = circleValueList(r, r - vmodel.widthInner / 2, ct), count = vmodel.count, interval = vmodel.interval, step = 360 / count
        vmodel.radius = vmodel.width / 2 - vmodel.widthInner / 2
        function writeOp(loop) {
            var cp = (loop / count).toFixed(2)
            cp = cp > 0.6 ? cp : 0.2
            vmodel.opacities.push(cp)
        }
        if(vmodel.svgSupport) {
            vmodel.svgDur = interval * count / 1000 + "s"
            vmodel.arc = dt.slice(0, Math.floor((1 / count - vmodel.padding / 360 ) * dt.length)).join("")
            return function(loop) {
                vmodel.data.push({
                    rotate: "rotate(" + step * loop + " " + r + " " + r + ")",
                    begin: [interval * loop / 1000, "s"].join("")
                })
                writeOp(loop)
            }
        }
        return function(loop) {
            vmodel.data.push({
                startangle: loop / count * 360,
                endangle: (loop + 1) / count * 360 - 10
            })
            writeOp(loop)
        }

    }, function(vmodel, ele) {
        return _config["ball"].effect(vmodel, ele, ["path", "arc"])
    })
    // 注册自定义图片
    addType("img", {
        src: "https://source.qunarzz.com/piao/images/loading_camel.gif",//@config type=img，loading效果的gif图片
        width: 52,//@config type=img，loading效果宽度
        height: 39,//@config type=img，loading效果高度
        miao: 0
    }, void 0, void 0)
    var svgSupport = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
    var widget = avalon.ui.loading = function(element, data, vmodels) {

        var options = data.loadingOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)
        if (!_config[options.type]) {
            options.type = "ball"
        }
        // 读入各种效果的配置
        avalon.each(_config[options.type], function(i, item) {
            if (options[i] === void 0) options[i] = item
        })

        var vmodel = avalon.define(data.loadingId, function(vm) {
            vm.height = ""
            vm.width = ""
            vm.data = []
            vm.opacities = []
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.rootElement = ""
            vm.svgSupport = svgSupport
            vm.$loadingID = widgetCount + "" + _key
            vm.$timer = ""
            vm.$skipArray = ["widgetElement", "template", "opacities", "data", "rootElement"]

            var inited
            vm.$init = function(continueScan) {
                if (inited)
                    return
                inited = true
                var id,
                    container = options.container || vmodel.widgetElement,
                    elementParent = ((avalon.type(container) === "object" && container.nodeType === 1 && document.body.contains(container)) ? container : document.getElementById(container)) || document.body,
                    type = vmodel.type,
                    // radiusOut = vmodel.width / 2,
                    html = (templateCache[type]||templateCache["ball"])[vmodel.svgSupport ? "svg" : "vml"],
                    index = 0
                vmodel.width = vmodel.width == false ? vmodel.height : vmodel.width
                vmodel.height = vmodel.height == false ? vmodel.width : vmodel.height
                // 计算绘图数据
                if(vmodel.drawer) {
                    var loop = 0, drawer = vmodel.drawer(vmodel)
                    while(loop < vmodel.count && drawer) {
                        drawer(loop)
                        loop++
                    }
                }
                var frag = avalon.parseHTML(vmodel.template.replace("{{MS_WIDGET_HTML}}", html).replace("{{MS_WIDGET_ID}}", vmodel.$loadingID))
                newDiv = frag.childNodes[0]
                elementParent.appendChild(newDiv)
                vm.rootElement = newDiv
                avalon.log("avalon请尽快升到1.3.7+")
                avalon.scan(elementParent, [vmodel].concat(vmodels))
                if (typeof options.onInit === "function") {
                    options.onInit.call(element, vmodel, options, vmodels)
                }
                vmodel._effect()
            }
            vm._effect = function() {
                if (vmodel.toggle) {
                    var ele = document.getElementById("oni-loading-" + vmodel.$loadingID)
                    if (ele) {
                        var effect = vmodel.effect && vmodel.effect(vmodel, ele)
                        if(effect) {
                            clearInterval(vmodel.$timer)
                            vmodel.$timer = setInterval(effect, vmodel.interval)
                        }
                    }
                }
            }
            vm.$remove = function() {
                clearInterval(vmodel.$timer)
                element.innerHTML = element.textContent = ""
            }

            //@interface showLoading() 显示loading效果
            vm.showLoading = function() {
                if (vmodel.toggle)
                    return
                vmodel.toggle = true
                vmodel._effect()
            }
            //@interface hideLoading() 隐藏loading
            vm.hideLoading = function() {
                vmodel.toggle = false
            }
            //@interface destroyLoading() 销毁loading
            vm.destroyLoading = function() {
                vmodel.toggle = false
                vmodel.$remove()
            }
            /**
             * @interface 将loading效果插入到指定的容器里
             * @param 目标容器元素，默认是绑定widget的元素
             */
            vm.appendTo = function(container) {
                var cnt = container || vm.widgetElement,
                    modal = g("modal" + vm.$id),
                    loading = g("loading" + vm.$id)
                if(modal) cnt.appendChild(modal)
                if(loading) cnt.appendChild(loading)
            }

        })

        vmodel.$watch("toggle", function(n) {
            if (!n) {
                clearInterval(vmodel.$timer)
            } else {
                vmodel._effect()
            }
        })
      
        widgetCount++

        return vmodel
    }
    widget.defaults = {
        //@config onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        color: "#619FE8", //@config 效果的颜色
        type: "ball", //@config 类型，默认是ball，球，可取spin,ticks
        toggle: true, //@config 是否显示
        modal: true, //@config 是否显示遮罩
        modalOpacity: 0.1, //@config 遮罩透明度
        modalBackground: "#fff",//@config 遮罩背景色
        container: void 0, //@config loading效果显示的容器，默认是绑定widget的元素
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        }, //@config getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "skipper@123"
    }
})