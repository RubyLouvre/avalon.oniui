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
            if(item.children) dataFormator(item.children)
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
        dataFormator(options.children)

        var vmodel = avalon.define(data.treeId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.widgetElement.innerHTML = vm.template
            vm.$skipArray = ["widgetElement", "template"]
            vm._select = []

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
            // 展开相关
            // 展开
            vm.hasClassOpen = function(leaf, noline) {
                if(vm.view.showLine) {
                    return leaf.isParent && leaf.open && noline != 'noline'
                } else {
                    return leaf.isParent && leaf.open && noline
                }
            }
            vm.toggleOpenStatue = function(event, leaf) {
                event.stopPropagation()
                leaf.open = !leaf.open
            }
            //@method open(leaf, all) 展开leaf节点的子节点，all表示是否迭代所有子孙节点
            vm.open = function(leaf, all, openOrClose) {
                if(!leaf) {
                    leaf = vm.children
                } else {
                    leaf.open = !openOrClose
                    if(!leaf.isParent) return
                    leaf = leaf.children
                }
                if(all) avalon.each(leaf, function(i, item) {vm.open(item, "all", openOrClose)})
            }
            //@method close(leaf, all) 折叠leaf节点的子节点，all表示是否迭代所有子孙节点
            vm.close = function(leaf, all) {
                vm.open(leaf, all, "close")
            }

            vm.hasChildren = function(leaf, visible) {
                // 有有效子节点
                var renderStatus = leaf.children && leaf.children.length && vm.hasClassOpen(leaf, "ignoreNoline")
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
            //@method exChangeNodes(a, b, leaf, changeDom) 交换leaf节点的索引为a、b子节点的位置，doNotChangeDom不同步到dom，例如修改dom，同步数据而已
            vm.exChangeNodes = function(a, b, leaf, doNotChangeDom) {
                // 交换数据
                var leaf = leaf || vm, 
                    ma = leaf.children[a],
                    mb = leaf.children[b]
                leaf.children[a] = mb
                leaf.children[b] = ma
                // 交换节点
                if(!doNotChangeDom) {
                    var domA = g(ma.$id), domB = g(mb.$id), par = domA.parentNode, next = domB.nextSibling
                    par.insertBefore(domB, domA)
                    par.insertBefore(domA, next)
                }
            }

            //选中相关
            vm.hasClassSelect = function(leaf) {
                for(var i = 0, len = vm._select.length; i < len; i++) {
                    if(vm._select[i] === leaf.$id) return i + 1
                }
                return 0
            }

            vm.select = function(event, leaf) {
                event.stopPropagation()
                var id = leaf.$id, index = vm.hasClassSelect(leaf)
                if(index) {
                    vm._select.splice(index - 1, 1)
                } else {
                    if(vm.ctrlCMD(event)) {
                        vm._select.push(id)
                    } else {
                        vm._select = [id]
                    }
                }
            }

            vm.freeSelect = function() {
                vm._select = []
            }

            vm.ctrlCMD = function(event) {
                return event.ctrlKey && vm.view.selectedMulti
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
        view: {//@param 视觉效果相关的配置
            showLine: true,//@param view.showLine是否显示连接线
            dblClickExpand: true,//@param view.dblClickExpand是否双击变化展开状态
            selectedMulti: true,//@param view.selectedMulti true / false 分别表示 支持 / 不支持 同时选中多个节点
            showIcon: true,//@param view.showIcon zTree 是否显示节点的图标
            showTitle: true,//@param view.showTitle 分别表示 显示 / 隐藏 提示信息
            nameShower: function(leaf) {
                return leaf.name
            }//@optMethod view.nameShower(leaf)节点显示内容过滤器，默认是显示leaf.name
        },
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "skipper@123"
    }
    //@method avalon.ui.tree.Extension({xxx}) 给tree组件添加扩展，用于扩展属性，方法
    avalon.ui.tree.Extension = function(classToExtend) {
        avalon.mix(true, widget.defaults, classToExtend)
    }
})