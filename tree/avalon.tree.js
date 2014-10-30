/**
  *  @description tree组件，借鉴ztree实现的avalon版本树组件，尽量接近ztree的数据结构
  *
  */
define(["avalon", "text!./avalon.tree.html", "text!./avalon.tree.leaf.html", "text!./avalon.tree.parent.html",  "text!./avalon.tree.nodes.html", "css!./avalon.tree.css", "css!../chameleon/oniui-common.css"], function(avalon, template, leafTemplate, parentTemplate, nodesTemplate) {

    //  tool functions

    //  树状数据的标准化，mvvm的痛
    function dataFormator(arr) {
        avalon.each(arr, function(index, item) {
            itemFormator(item)
        })
    }
    function itemFormator(item) {
        item.isParent = !!item.isParent
        if(item.isParent) {
            item.open = !!item.open
            item.children = item.children || []
            if(item.children.length) dataFormator(item.children)
        }
    }
    /**  将简单的数组结构数据转换成树状结构
      *  注如果是一个没有子节点的父节点必须加isParent = true，open属性只有父节点有必要有
      *  input array like [
      *      {id: 1, pId: 0, name: xxx, open: boolean, others},// parent node
      *      {id: 11, pId: 1, name: xxx, others}// 子几点
      *  ]
      */
    function simpleDataToTreeData(arr) {
        if(!arr.length) return []
        var tree = [], stack = [], last = itemFormator(arr[0]), len = arr.length
        for(var i = 1; i < len; i++) {
            
        }
    }

    var widget = avalon.ui.tree = function(element, data, vmodels) {
        var options = data.treeOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)
        options.parentTemplate = options.getTemplate(parentTemplate, options, "parent").replace(/\n/g, "").replace(/>[\s]+</g, "><")
        options.leafTemplate = options.getTemplate(leafTemplate, options, "leaf").replace(/\n/g, "").replace(/>[\s]+</g, "><")
        options.nodesTemplate = nodesTemplate

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
            // 展开
            vm.hasClassOpen = function(leaf) {
                return (leaf.isParent||leaf.children) && leaf.open
            }
            vm.toggleOpenStatue = function(event, leaf) {
                event.stopPropagation()
                leaf.open = !leaf.open
            }

            vm.hasEditBtn = function(leaf) {

            }
            vm.hasRemoveBtn = function(leaf) {

            }
            vm.hasChildren = function(leaf) {
                // 有有效子节点
                if(leaf.children && leaf.children.length && vm.hasClassOpen(leaf)) return true;
            }

            vm.loadLeafTemplate = function(leaf) {
                if(leaf.isParent || leaf.children) return vm.parentTemplate
                return vm.leafTemplate
            }

            vm.loadNodes = function(levelGT0) {
                if(!levelGT0) return vm.nodesTemplate
                return vm.nodesTemplate.replace(/leaf=\"children\"/g, "leaf=\"leaf.children\"")
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