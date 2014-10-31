/**
  *  @description tree组件，借鉴ztree实现的avalon版本树组件，尽量接近ztree的数据结构
  *
  */
define(["avalon", "text!./avalon.tree.html", "text!./avalon.tree.leaf.html", "text!./avalon.tree.parent.html",  "text!./avalon.tree.nodes.html", "css!./avalon.tree.css", "css!../chameleon/oniui-common.css"], function(avalon, template, leafTemplate, parentTemplate, nodesTemplate) {

    //  tool functions
    function g(id) {
        return document.getElementById(id)
    }

    //  树状数据的标准化，mvvm的痛
    function dataFormator(arr) {
        avalon.each(arr, function(index, item) {
            itemFormator(item)
        })
    }
    /**
      * 格式化数据，补全字段
      */
    function itemFormator(item) {
        item.isParent = itemIsParent(item)
        item.pId = item.pId || 0
        if(item.isParent) {
            item.open = !!item.open
            item.children = item.children || []
            if(item.children.length) dataFormator(item.children)
        }
        return item
    }
    function itemIsParent(item) {
        return !!item.isParent || !!item.open || !!item.children
    }
    /**  将简单的数组结构数据转换成树状结构
      *  注如果是一个没有子节点的父节点必须加isParent = true，open属性只有父节点有必要有
      *  input array like [
      *      {id: 1, pId: 0, name: xxx, open: boolean, others},// parent node
      *      {id: 11, pId: 1, name: xxx, others}// 子节点
      *  ]
      */
    function simpleDataToTreeData(arr) {
        if(!arr.length) return []
        var prev, tree = [], stack = [], tar, now
        for(var i = 0, len = arr.length; i < len; i++) {
            now = itemFormator(arr[i])
            // 前一个节点是直属父节点
            if(prev && prev.id === now.pId) {
                // 标记父节点
                prev.isParent = true 
                itemFormator(prev)
                // 防止重复压入堆栈
                if(!tar || tar !== prev) {
                    stack.push(prev)
                    tar = prev
                }
                tar.children.push(now)
            // 当前节点是一个父节点或者没有出现过父节点或者出现的父节点非自己的父节点
            } else if(now.isParent || !tar || tar.id !== now.pId) {
                // 出栈知道找到自己的父节点或者栈空
                while(tar && (now.pId !== tar.id)) {
                    stack.pop()
                    tar = stack[stack.length - 1]
                }
                (tar && tar.children || tree).push(now)
                // 明确已知自己是一个父节点，压入栈中
                if(now.isParent) {
                    stack.push(now)
                    tar = now
                }
            // 非父节点以及未确认是否父节点
            } else {
                (tar && tar.children || tree).push(now)
            }
            prev = now
        }
        return tree
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

            vm.hasChildren = function(leaf, visible) {
                // 有有效子节点
                var renderStatus = leaf.children && leaf.children.length && vm.hasClassOpen(leaf)
                if(visible) {
                    return renderStatus
                } else {
                    return renderStatus || g("c" + leaf.$id)
                }
            }

            vm.loadLeafTemplate = function(leaf) {
                if(leaf.isParent || leaf.children) return vm.parentTemplate
                return vm.leafTemplate
            }

            vm.loadNodes = function(levelGT0) {
                if(!levelGT0) return vm.nodesTemplate
                return vm.nodesTemplate.replace(/leaf=\"children\"/g, "leaf=\"leaf.children\"")
            }

            vm.timeStamp = function() {
                return Date.now()
            }
            //@method exChangeNodes(a, b) 交换a、b节点的位置，同步到dom
            vm.exChangeNodes = function(a, b, leaf) {
                // 交换数据
                var tmp = vm.children[a]
                vm.children[a] = vm.children[b]
                vm.children[b] = tmp
                // 交换节点
            }

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
    //@method avalon.ui.tree.Extension({xxx}) 给tree组件添加扩展，用于扩展属性，方法
    avalon.ui.tree.Extension = function(classToExtend) {
        avalon.mix(widget.defaults, classToExtend)
    }
})