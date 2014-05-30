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

    var widget = avalon.ui.progressbar = function(element, data, vmodels) {
        var options = data.progressbarOptions
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.progressbarId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            var newElem = element
                , simulateTimer
            vm.$skipArray = ["widgetElement", "template"]
            vm.ended = false

            var inited
            vm.$init = function() {
                if(inited) return
                inited = true

                newElem.innerHTML = template

                avalon.scan(element, [vmodel].concat(vmodels))

                vmodel.$simulater()
            }

            vm.$simulater = function() {
                // 进度条模拟
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

            vm.$cssMaker = function(right) {
                if(vmodel.value === false && vmodel.indeterminate || vmodel.value == 100) return right ? 0 : '100%'
                return right ? 100 - (vmodel.value || 0) + '%' : (vmodel.value || 0) + '%'
            }

            vm.$indeterminate = function() {
                return vmodel.indeterminate && vmodel.value == false && !vmodel.right
            }
            vm.$showLabel = function(label, right) {
                return label && right
            }
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
                if(typeof value != 'undefined') vmodel.value = value
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
        vmodel.$watch('success', function(newValue) {
            if(newValue && vmodel.simulate) vmodel.value = 100
            if(newValue) vmodel.onComplete.call(vmodel)
        })
        vmodel.$watch('value', function(newValue) {
            if(newValue == 100) vmodel.success = true
            vmodel.onChange && vmodel.onChange.call(vmodel, newValue)
        })

        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        value: false, //@param 当前进度值 0 - 100 or false
        label: false, //@param 是否在进度条上显示进度数字提示
        simulate: false, //@param 是否模拟进度条效果，默认为否，模拟的时候需要调用触发告知完成，模拟会采用模拟函数及算子进行模拟，取值为int表示动画效果间隔ms数
        indeterminate: false, //@param 是否不确定当前进度，现在loading效果
        right: false, //@param 是否显示左右两段
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
            var value = l1 == 'right' ? 100 - (value || 0) : value
            if(l1 == 'l1' && this.right) return ''
            if(value === false) return 'loading…'
            if(value === 'failed' || this.ended && this.value != 100) return 'failed!'
            if(value == 100) return 'complete!'
            return value + '%'
        },
        $author: "skipper@123"
    }
})