/**
  * @description tree组件，
  *
  */
define(["avalon", "text!./avalon.tree.html", "css!./avalon.tree.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {

    var widget = avalon.ui.tree = function(element, data, vmodels) {
        var options = data.treeOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.treeId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.widgetElement.innerHTML = vm.template
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

            vm.hasClassOpen = function(leaf) {
                return (leaf.isParent||leaf.children) && leaf.open
            }
            vm.hasEditBtn = function(leaf) {

            }
            vm.hasRemoveBtn = function(leaf) {

            }
            vm.hasChildren = function(leaf) {
                
            }

            //@method apiName(argx) description

        })
      
        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "skipper@123"
    }
})