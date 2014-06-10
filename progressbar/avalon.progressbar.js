/**
  * progressbar组件，
  *
  */
define(["avalon", "text!./avalon.progressbar.html", "text!./avalon.progressbar.css"], function(avalon, tmpl, css) {

    var cssText = css
    var styleEl = document.getElementById("avalonStyle")
    var template = tmpl
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }
    // 园的半径，边框宽度
    function circleValueList(r, bw) {
        var arr = [],
            r = r - bw,
            arc,
            x,
            y,
            res
        for(var i = 0; i <= 100; i++) {
            arc = Math.PI / 2 - Math.PI / 50 * i
            x = Math.cos(arc) * r + r * 1 + bw * 1
            y = (1 - Math.sin(arc).toFixed(4)) * r + bw * 1
            res = (i ? " L" : "M") + x + " " + y + (i == 100 ? "Z" : "")
            arr.push(res)
        }
        avalon.log(arr.join(""))
        return arr
    }
    var svgSupport = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
    if(!svgSupport) {
        document.namespaces.add("v", "urn:schemas-microsoft-com:vml")
    }

    var widget = avalon.ui.progressbar = function(element, data, vmodels) {
        var options = data.progressbarOptions
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.progressbarId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            var newElem = element, 
                simulateTimer,
                barElement,
                labelElement,
                barParElement,
                d = svgSupport && vm.circle && circleValueList(options.circleR, options.circleBorderWidth) || []
            vm.$skipArray = ["widgetElement", "template", "svgSupport"]
            vm.ended = false
            vm.full = d.join("")
            vm.d = ""
            vm.angel = options.value || 0
            vm.svgSupport = svgSupport

            var inited
            vm.$init = function() {
                if(inited) return
                inited = true

                newElem.innerHTML = vmodel.template
                avalon.scan(element, [vmodel].concat(vmodels))
                if(vmodel.label && !vmodel.circle) {
                    var nodes = newElem.getElementsByTagName("div")
                    avalon.each(nodes, function(i, item) {
                        if(item.className.indexOf("ui-progressbar-label") != -1) {
                            labelElement = item
                        } else if(item.className.indexOf("ui-progressbar-bar") != -1) {
                            barElement = item
                            barParElement = item.parentNode
                        }
                    })
                }
                vmodel.$simulater()
            }
            // 适用svg绘制圆圈的v生成方式
            // vml不走这个逻辑，有直接绘制圆弧的方法
            vm.circleBar = function(v) {
                if(vmodel.circle || !svgSupport) {
                    var v = v || vmodel.value || 0
                    v = v > 100 ? 100 : v > 0 ? v : 0
                    vmodel.d = v == 100 ? vmodel.full : d.slice(0, v).join("") + (v < 100 && v ? "" : "")
                }
            }
            // 计算label tip的位置
            vm.$getLeft = function() {
                if(!labelElement || vmodel.right) return
                var bw = barElement && barElement.offsetWidth || 0,
                    lw = labelElement.offsetWidth || 0,
                    bpw = barParElement && barParElement.offsetWidth || 0,
                    res = bpw - bw > lw + 2 ? bw - lw / 2 + 2 : bpw - lw
                    res = res > 0 ? res : 0
                    labelElement.style.left =  res + 'px'
            }

            // 进度条模拟
            vm.$simulater = function() {
                if(vmodel.simulate !== false && !vmodel.indeterminate) {
                    clearTimeout(simulateTimer)
                    simulateTimer = setTimeout(function() {
                        if(vmodel.success || vmodel.ended || vmodel.indeterminate) return clearTimeout(simulateTimer)
                        var v = vmodel.simulater(vmodel.value || 0)
                        if(vmodel.success) {
                            v = 100
                            vmodel.value =  v
                            return
                        }
                        if(vmodel.ended) return
                        if(v >= 100) return
                        vmodel.value =  v
                        simulateTimer = setTimeout(arguments.callee, vmodel.simulate)
                    }, vmodel.simulate)
                }
            }

            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
            // 设置bar元素宽度
            vm.$cssMaker = function(right) {
                if(vmodel.value === false && vmodel.indeterminate || vmodel.value == 100) return right ? 0 : "100%"
                return right ? 100 - (vmodel.value || 0) + "%" : (vmodel.value || 0) + "%"
            }

            // 不知当前进度
            vm.$indeterminate = function() {
                return vmodel.indeterminate && vmodel.value == false && !vmodel.right
            }
            // 进度条分成左右两段显示的时候是否显示label
            vm.$showLabel = function(label, right) {
                return label && right
            }
            // 展示label
            vm.$labelShower = function(value) {
                return vmodel.labelShower.apply(vmodel, arguments)
            }

            //@method start() 开始进度推进，该接口适用于模拟进度条
            vm.start = function() {
                vmodel.indeterminate = false
                vmodel.ended = false
                vmodel.$simulater()
            }

            //@method end(value) 结束进度推进，该接口适用于模拟进度条，value为100表示结束，failed表示失败，undefine等于pause，其他则终止于value，并在label上显示
            vm.end = function(value) {
                clearTimeout(simulateTimer)
                vmodel.ended = true
                if(value != void 0) vmodel.value = value
            }

            //@method reset() 重置设置项
            vm.reset = function() {
                var obj = {}
                avalon.mix(obj, {
                    value: widget.defaults.value
                    , indeterminate: widget.defaults.indeterminate
                    , success: false
                }, options)
                avalon.mix(vmodel, obj)
                vmodel.ended = false
                vmodel.$simulater()
            }

            //@method progress(value) 设置value值，其实也可以直接设置vmodel.value
            vm.progress = function(value) {
                vmodel.value = value
            }

        })
        // 模拟进度条情形下，不监控success属性的变化
        vmodel.$watch("success", function(newValue) {
            if(newValue && vmodel.simulate) vmodel.value = 100
            if(newValue) vmodel.onComplete.call(vmodel)
        })
        vmodel.$watch("value", function(newValue) {
            if(newValue == 100) vmodel.success = true
            vmodel.circle && vmodel.circleBar()
            vmodel.$getLeft()
            vmodel.angel = 360 * newValue / 100
            vmodel.onChange && vmodel.onChange.call(vmodel, newValue)
        })

        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        value: false, //@param 当前进度值 0 - 100 or false
        label: true, //@param 是否在进度条上显示进度数字提示
        simulate: false, //@param 是否模拟进度条效果，默认为否，模拟的时候需要调用触发告知完成，模拟会采用模拟函数及算子进行模拟，取值为int表示动画效果间隔ms数
        indeterminate: false, //@param 是否不确定当前进度，现在loading效果
        right: false, //@param 是否显示左右两段
        circle: false,//@param 圆形
        circleColor: "#ffffff",//@param 圆形填充色彩
        circleBorderColor: "#dedede",//@param 圆形边框颜色
        circleBarColor: "#619FE8",//@param 圆形进度条边框颜色
        circleR: 38,//@param 圆形的半径
        circleBorderWidth: 4, //@param 圆形的边框宽度
        success: false, //@param 是否完成，进度为100时或者外部将success置为true，用于打断模拟效果
        //@optMethod simulater(value, vmodel) 模拟进度进行效果函数，参数为当前进度和vmodel，默认return value + 5 * Math.random() >> 0
        simulater: function(i, vmodel) {
            return i + 5 * Math.random() >> 0
        },
        //@optMethod getTemplate(tmp, opts) 用于修改模板的接口，默认不做修改
        getTemplate: function(tmpl, opts) {
            return tmpl
        },
        //@optMethod onChange(value) value发生变化回调，this指向vmodel
        onChange: avalon.noop,
        //@optMethod onComplete() 完成回调，默认空函数，this指向vmodel
        onComplete: avalon.noop,
        //@optMethod labelShower(value, isContainerLabel) 用于格式化进度条上label显示文字，默认value为false显示“loading…”，完成显示“complete!”，失败显示“failed!”，第二个参数是是否是居中显示的label，两段显示的时候，默认将这个label内容置空，只显示两边的label,this指向vmodel
        labelShower: function(value, l1) {
            var value = l1 == "right" ? 100 - (value || 0) : value
            if(l1 == "l1" && this.right) return ""
            if(value === false) return "loading…"
            if(value === "failed" || this.ended && this.value != 100) return "failed!"
            if(value == 100) return "complete!"
            return value + "%"
        },
        $author: "skipper@123"
    }
})