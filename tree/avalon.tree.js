/**
  *  @description tree组件，借鉴ztree实现的avalon版本树组件，尽量接近ztree的数据结构
  *
  */
define(["avalon", "text!./avalon.tree.html", "text!./avalon.tree.leaf.html", "text!./avalon.tree.parent.html",  "text!./avalon.tree.nodes.html", "../live/avalon.live", "css!./avalon.tree.css", "css!../chameleon/oniui-common.css"], function(avalon, template, leafTemplate, parentTemplate, nodesTemplate) {

    var optionKeyToFixMix = {view: 1, callback: 1},
        eventList = ["click", "dblClick", "collapse", "expand", "select"],
        ExtentionMethods = [],
        undefine = void 0
    //  tool functions
    function g(id) {
        return document.getElementById(id)
    }

    //  树状数据的标准化，mvvm的痛
    function dataFormator(arr, parentLeaf) {
        avalon.each(arr, function(index, item) {
            itemFormator(item, parentLeaf)
            if(item.children && item.children.length) dataFormator(item.children, item)
        })
    }
    /**
      * 格式化数据，补全字段
      */
    function itemFormator(item, parentLeaf) {
        item.isParent = itemIsParent(item)
        item.pId = item.pId || 0
        // 不要可监听
        item.$parentLeaf = parentLeaf
        if(item.isParent) {
            item.open = !!item.open
            item.children = item.children || []
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

    function arrayIndex(arr, filter) {
        for(var i = 0, len = arr.length; i < len; i++) {
            if(filter(arr[i])) return i
        }
        return -1
    }

    function upperFirstLetter(str) {
        return str.replace(/^[a-z]{1}/g, function(mat) {
            return mat.toUpperCase()
        })
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
            // mix插件配置
            avalon.each(ExtentionMethods, function(i, func) {
                func && func(vm)
            })
            avalon.mix(vm, options)
            avalon.each(optionKeyToFixMix, function(key) {
                avalon.mix(vm[key], avalon.mix({}, widget.defaults[key], vm[key]))
            })
            vm.widgetElement = element
            vm.widgetElement.innerHTML = vm.template
            vm.$skipArray = ["widgetElement", "template", "callback"]
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
                if(vm.optionToBoolen(vm.view.showLine, leaf)) {
                    return leaf.isParent && leaf.open && noline != 'noline'
                } else {
                    return leaf.isParent && leaf.open && noline
                }
            }
            vm.toggleOpenStatue = function(event, leaf) {
                leaf.open ? vm.collapse(leaf, undefine, undefine, event) : vm.expand(leaf, undefine, undefine, event)
            }
            //@method expand(leaf, all) 展开leaf节点的子节点，all表示是否迭代所有子孙节点
            vm.expand = function(leaf, all, openOrClose, event) {
                if(!leaf) {
                    leaf = vm
                    leaf.open = !openOrClose
                } else {
                    if(!leaf.isParent) return
                    leaf.open = !openOrClose
                }
                var children = leaf.children
                // 节点未渲染，向上传递渲染 - 暂不处理
                if(all) avalon.each(children, function(i, item) {vm.expand(item, "all", openOrClose)})
                vm.$fire(("e:" + (openOrClose ? "collapse" : "expand")), {
                    leaf: leaf,
                    e: event
                })
            }
            //@method collapse(leaf, all) 折叠leaf节点的子节点，all表示是否迭代所有子孙节点
            vm.collapse = function(leaf, all) {
                vm.expand(leaf, all, "close")
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
            //@method exChangeNodes(a, b, doNotChangeDom) 交换a,b节点的位置，doNotChangeDom不同步到dom，例如只是通过修改dom，同步数据而已
            vm.exChangeNodes = function(a, b, doNotChangeDom) {
                // 交换数据
                var parLeafA = a.$parentLeaf || vm,
                    parLeafB = b.$parentLeaf || vm,
                    indexA = arrayIndex(parLeafA.children, function(item) {
                        return item == a
                    }),
                    indexB = arrayIndex(parLeafB.children, function(item) {
                        return item  == b
                    }),
                    modelParA = parLeafA.children.$model,
                    modelParB = parLeafB.children.$model
                if(indexA < 0 && indexB < 0) return
                parLeafA.children[indexA] = b
                parLeafA.children[indexB] = a
                // 交换$model数据
                modelParA[indexA] = b.$model
                modelParB[indexB] = a.$model
                // 交换节点
                if(!doNotChangeDom) {
                    var domA = g(a.$id), domB = g(b.$id), parA = domA.parentNode, parB = domB.parentNode, next = domB.nextSibling
                    parA.insertBefore(domB, domA)
                    parB.insertBefore(domA, next)
                }
            }

            //选中相关
            vm.hasClassSelect = function(leaf) {
                for(var i = 0, len = vm._select.length; i < len; i++) {
                    if(vm._select[i].$id === leaf.$id) return i + 1
                }
                return 0
            }
            // 取消节点的选中状态
            vm.selectFun = function(event, leaf, isClear) {
                var id = leaf.$id, index = vm.hasClassSelect(leaf)
                if(index) {
                    vm._select.splice(index - 1, 1)
                } else {
                    if(vm.ctrlCMD(event, leaf)) {
                        vm._select.push(leaf)
                    } else {
                        vm._select = [leaf]
                    }
                }
                vm.$fire("e:select", {
                    e: event,
                    leaf: leaf,
                    select: vm._select
                })
            }
            //@method freeSelect(event, leaf)取消leaf节点上所有处于选中状态的节点
            vm.freeSelect = function(event, leaf) {
                vm.selectFun(event, leaf, "clearAll")
            }

            vm.ctrlCMD = function(event, leaf) {
                return event.ctrlKey && vm.optionToBoolen(vm.view.selectedMulti, leaf, event)
            }

            vm.optionToBoolen = function() {
                var arg = arguments[0]
                if(!avalon.isFunction(arg)) return arg
                return arg.apply(null, [].slice.call(arguments,1))
            }
            // 鼠标事件相关
            vm.liveContextmenu = function(event) {
                vm.$fire("e:contextmenu", {
                    e: event
                })
            }
            vm.liveClick = function(event) {
                vm.$fire("e:click", {
                    e: event
                })
            }
        })

        avalon.each(eventList, function(i, evt) {
            var key = "on" + upperFirstLetter(evt)
            vmodel.$watch("e:" + evt, function() {
                vmodel.callback[key].apply(null, arguments)
            })
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
        //@param 回调相关的配置
        callback: {
            //@optMethod callback.onExpand(data) 节点展开回调
            //@optMethod callback.onCollapse(data) 节点收起回调
            //@optMethod callback.onSelect(data) 节点被选中回调
            //@optMethod callback.onClick(data) 节点被点击回调
            //@optMethod callback.onDblClick(data) 节点被双击回调
        },
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "skipper@123"
    }
    avalon.each(eventList, function(i, item) {
        widget.defaults.callback["on" + upperFirstLetter(item)] = avalon.noop
    })

    //@method avalon.ui.tree.AddExtention(fixNames, addingDefaults, addingMethodFunc)扩展tree
    avalon.ui.tree.AddExtention = function(fixNames, addingDefaults, addingMethodFunc) {
        if(fixNames) avalon.each(fixNames, function(i, item) {
            optionKeyToFixMix[item] = item
        })
        if(addingDefaults) avalon.mix(true, widget.defaults, addingDefaults)
        if(addingMethodFunc) ExtentionMethods.push(addingMethodFunc)
    }
})