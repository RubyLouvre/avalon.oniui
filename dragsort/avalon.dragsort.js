/**
 * @cnName 拖动排序
 * @enName dragsort
 * @introduce
 *    <p>通过拖动来实现对元素的排序</p>
 */
define(["avalon", "text!./avalon.dragsort.html", "css!./avalon.dragsort.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {

    var widget = avalon.ui.dragsort = function(element, data, vmodels) {
        var options = data.dragsortOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.dragsortId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.$skipArray = ["widgetElement", "template"]

            var inited
            vm.$init = function() {
                if(inited) return
                inited = true

                avalon.scan(element, [vmodel].concat(vmodels))
                if(typeof options.onInit === "function" ) {
                    //vmodels是不包括vmodel的 
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }

        })
      
        return vmodel
    }
    widget.defaults = {
        /**
         * @config 完成初始化之后的回调
         * @param vmodel {vmodel} vmodel
         * @param options {Object} options
         * @vmodels {Array} vmodels
         */
        onInit: avalon.noop,
        /**
         * @config 模板函数,方便用户自定义模板
         * @param str {String} 默认模板
         * @param opts {Object} vmodel
         * @returns {String} 新模板
         */
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },
        $author: "skipper@123"
    }
})