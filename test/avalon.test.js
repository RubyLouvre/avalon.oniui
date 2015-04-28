
define(["avalon", "text!./avalon.test.html", "css!../chameleon/oniui-common.css", "css!./avalon.test.css"], function(avalon, template) {

    var widget = avalon.ui.test = function(element, data, vmodels) {
        var options = data.testOptions
            options.template = options.getTemplate(template)

        var vmodel = avalon.define(data.testId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["template", "widgetElement", "rootElement"]
            vm.widgetElement = element
            vm.rootElement = {}
            vm.changeJob = function(nweJob) {
                vmodel.job = nweJob
            }
            vm.$init = function(continueScan) {
                var _vmodels = [vmodel].concat(vmodels)
                element.innerHTML = options.template
                vmodel.rootElement = element.getElementsByTagName('*')[0]
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.scan(element, _vmodels)
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }
            vm.$remove = function() { //组件移出DOM树时,系统自动调用的销毁函数
                // 注销事件、清理dom等
            }
        })
        return vmodel
    }
    widget.vertion = 1.0
    widget.defaults = {
        name: 'shirly',
        gender: 'w',
        job: 'front-end engineer',
        getTemplate: function(tmp) {
            return tmp
        }
    }
    return avalon
})
