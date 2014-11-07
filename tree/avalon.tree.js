/**
  *  @description tree组件，借鉴ztree实现的avalon版本树组件，尽量接近ztree的数据结构
  *
  */
define(["avalon", "text!./avalon.tree.html", "text!./avalon.tree.leaf.html", "text!./avalon.tree.parent.html",  "text!./avalon.tree.nodes.html", "../live/avalon.live", "css!./avalon.tree.css", "css!../chameleon/oniui-common.css"], function(avalon, template, leafTemplate, parentTemplate, nodesTemplate) {

    var optionKeyToFixMix = {view: 1, callback: 1},
        eventList = ["click", "dblClick", "collapse", "expand", "select", "contextmenu"],
        ExtentionMethods = [],
        undefine = void 0
    //  tool functions
    function g(id) {
        return document.getElementById(id)
    }

    //  树状数据的标准化，mvvm的痛
    function dataFormator(arr, parentLeaf, dataFormated, func) {
        avalon.each(arr, function(index, item) {
            if(!dataFormated) {
                item.level = parentLeaf ? parentLeaf.level + 1 : 0
                itemFormator(item, parentLeaf)
            } else {
                item.$parentLeaf = parentLeaf
                func && func(item)
            }
            if(item.children && item.children.length) dataFormator(item.children, item, dataFormated)
        })
    }
    /**
      * 格式化数据，补全字段
      */
    function itemFormator(item, parentLeaf) {
        item.isParent = itemIsParent(item)
        item.pId = item.pId || 0
        // 不要可监听
        item.$parentLeaf = ""
        if(item.isParent) {
            item.open = !!item.open
        } else {
            item.open = false
        }   
        // 诶，子节点也可能被编辑成父节点...         
        item.children = item.children || []
        return item
    }
    function itemIsParent(item) {
        return !!item.isParent || !!item.open || !!(item.children&&item.children.length)
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
            now.level = stack.length
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
        var options = data.treeOptions, cache = {}// 缓存节点
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)
        options.parentTemplate = options.getTemplate(parentTemplate, options, "parent").replace(/\n/g, "").replace(/>[\s]+</g, "><")
        options.leafTemplate = options.getTemplate(leafTemplate, options, "leaf").replace(/\n/g, "").replace(/>[\s]+</g, "><")
        options.nodesTemplate = nodesTemplate
        dataFormator(options.children)
        var vmodel = avalon.define(data.treeId, function(vm) {
            // mix插件配置
            avalon.each(ExtentionMethods, function(i, func) {
                func && func(vm, vmodels)
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
                dataFormator(vm.children, undefine, "构建父子节点衔接关系", function(leaf) {
                    cache[leaf.$id] = leaf
                })
                avalon.scan(element, [vmodel].concat(vmodels))
                if(typeof options.onInit === "function" ) {
                    //vmodels是不包括vmodel的 
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
                cache = null
                vm._select = null
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
                leaf.open ? vm.collapse(leaf, undefine, event) : vm.expand(leaf, undefine, undefine, event)
            }
            //@method expand(leaf, all) 展开leaf节点的子节点，all表示是否迭代所有子孙节点
            vm.expand = function(leaf, all, openOrClose, event) {
                if(!leaf) {
                    leaf = vm
                } else {
                    if(!leaf.isParent) return
                    leaf.open = !openOrClose
                }
                var children = leaf.children, leafDom = g(leaf.$id)
                // 节点未渲染，或不可见，向上溯源处理
                if(!leafDom || !leafDom.clientHeight) vm.cVisitor(leaf, function(node) {
                    node.open = true
                })
                if(all) avalon.each(children, function(i, item) {vm.expand(item, "all", openOrClose)})
                vm.$fire(("e:" + (openOrClose ? "collapse" : "expand")), {
                    leaf: leaf,
                    e: event,
                    vmodel: vm,
                    vmodels: vmodels
                })
            }
            vm.expandAll = function(openOrClose) {
                openOrClose ? vm.expand(undefine, "all") : vm.collapse(undefine, "all")
            }
            //@method collapse(leaf, all) 折叠leaf节点的子节点，all表示是否迭代所有子孙节点
            vm.collapse = function(leaf, all, event) {
                vm.expand(leaf, all, "close", event)
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
                if(leaf.isParent) return vm.parentTemplate
                return vm.leafTemplate
            }

            vm.loadNodes = function(levelGT0) {
                if(!levelGT0) return vm.nodesTemplate
                return vm.nodesTemplate.replace(/leaf=\"children\"/g, "leaf=\"leaf.children\"")
            }

            vm.timeStamp = function() {
                return Date.now()
            }
            // 目测这个是相当费性能的。。。
            vm.moveNode = function(targetLeaf, leaf, moveType, isSilent) {
                var parLeaf = leaf.$parentLeaf || vm,
                    indexA = arrayIndex(parLeaf.children, function(item) {
                        return item == leaf || item == leaf.$model
                    }),
                    level = leaf.level
                if(indexA < 0) return
                if(!targetLeaf) targetLeaf = vm
                if(targetLeaf == vm) moveType = "inner"
                // 移除
                parLeaf.children.splice(indexA, 1)
                if(moveType == "inner") {
                    // 注入
                    if(!targetLeaf.isParent && targetLeaf != vm) targetLeaf.isParent = true
                    leaf.$parentLeaf = targetLeaf == vm ? false : targetLeaf
                    leaf.level = leaf.$parentLeaf ? leaf.$parentLeaf.level + 1 : 0
                    targetLeaf.children.push(leaf)
                } else {
                    moveType = moveType === "prev" ? "prev" : "next"
                    var parLeafB = targetLeaf.$parentLeaf,
                        tarArray = parLeafB ? parLeafB.children : vm.children,
                        indexB = arrayIndex(tarArray, function(item) {
                            return item == targetLeaf || item == targetLeaf.$model
                        })
                    // 挂载到新的父节点下
                    leaf.$parentLeaf = parLeafB
                    leaf.level = targetLeaf.level
                    tarArray.splice(indexB, 0, leaf)
                }
                if(leaf.$parentLeaf) vm.expand(leaf.$parentLeaf)
                // 层级变化了
                if(level != leaf.level) vm.visitor(leaf, function(node) {
                    if(node != leaf) node.level = node.$parentLeaf.level + 1
                })
            }

            // 节点遍历
            // 中序遍历，向下
            vm.visitor = function(startLeaf, func, endFunc, res, options) {
                var startLeaf = startLeaf || vm,
                    res = res || []
                if(startLeaf != vm) {
                    var data = func(startLeaf, options)
                    data && res.push(data)
                    if(endFunc && endFunc(res, startLeaf)) return res
                }
                if(startLeaf.isParent) {
                    for(var i = 0, children = startLeaf.children, len = children.length; i < len; i++) {
                        if(endFunc && endFunc(res, children[i])) break
                        vm.visitor(children[i], func, endFunc, res, options)
                    }
                }
                return res
            }
            // 向上溯源
            vm.cVisitor = function(startLeaf, func, endFunc, res, options) {
                var res = res || []
                if(startLeaf) {
                    var data = func(startLeaf, options)
                    data && res.push(data)
                    // 结束溯源
                    if(endFunc && endFunc(res, startLeaf)) return res
                    // 继续向上
                    if(startLeaf.$parentLeaf) vm.cVisitor(startLeaf.$parentLeaf, func, endFunc, res, options)
                }
                return res
            }

            // 获取节点
            vm.getNodeByTId = function(id) {
                return cache[id]
            }

            vm.getNodeIndex = function(leaf) {
                var c = leaf.$parentLeaf ? leaf.$parentLeaf.children : vm.children
                for(var i = 0, len = c.length; i < len; i++) {
                    if(c[i] === leaf) return i
                }
                return -1
            }

            vm.getNodes = function() {
                return vm.children
            }

            vm.getNodesByFilter = function(fitler, isSingle, startLeaf, options) {
                return vm.visitor(startLeaf, filter, isSingle ? function(data, node) {
                    return data.length > 1
                } : false, [], options)
            }

            vm.getNodeByParam = function(key, value, startLeaf) {
                return vm.getNodesByParam(key, value, startLeaf, function(data, node) {
                    return data.length > 1
                })
            }

            vm.getNodesByParam = function(key, value, startLeaf, endFunc) {
                return vm.visitor(startLeaf, function(leaf) {
                    return leaf[key] === value
                }, endFunc, [])
            }

            vm.getNodesByParamFuzzy = function(key, value, startLeaf) {
                return vm.visitor(startLeaf, function(leaf) {
                    return (leaf[key] + "").match(new RegExp(value, "g"))
                }, false, [])
            }

            vm.getSelectedNodes = function(startLeaf) {
                if(!startLeaf) return vm._select
                var info = vm._getSelectIDs(startLeaf),
                    ids = info.dict,
                    res = [],
                    _s = vm._select
                for(var i = 0, len = _s.length; i < len; i++) {
                    var k = _s[i].$id
                    if(ids[k]) res.push(_s[i])
                }
                return res
            }

            // cache管理
            vm.removeCacheById = function(id) {
                delete cache[id]
            }

            //选中相关，可能是一个性能瓶颈，之后可以作为优化的点
            vm.hasClassSelect = function(leaf) {
                for(var i = 0, len = vm._select.length; i < len; i++) {
                    if(vm._select[i].$id === leaf.$id) return i + 1
                }
                return 0
            }
            vm._getSelectIDs = function(leaf) {
                var total = 0, dict = {}
                if(leaf) {
                    vm.visitor(leaf, function(leaf){
                        // 是否被选中
                        if(avalon(g(leaf.$id).getElementsByTagName("a")[0]).hasClass("curSelectedNode")) {
                            dict[leaf.$id] = 1
                            total++
                        }
                    }, false)
                }
                return {
                    total: total,
                    dict: dict
                }
            }
            // 取消节点的选中状态
            vm.selectFun = function(event, leaf, all) {
                if(all) {
                    var _s = vm._select,
                        info = vm._getSelectIDs(leaf),
                        total = count = info.total,
                        dict = info.dict
                    // 删除优化
                    if(total > 1) _s.$unwatch()
                    for(var i = 0; i < _s.length; i++) {
                        var k = _s[i]
                        if(dict[k.$id]) {
                            _s.splice(i, 1)
                            i--
                            count--
                            if(count == 1 && total > 1) _s.$watch()
                        }
                    }
                    res = dict = null
                } else {
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
                }
                vm.$fire("e:select", {
                    e: event,
                    leaf: leaf,
                    select: vm._select,
                    vmodel: vm,
                    vmodels: vmodels
                })
            }
            vm.selectNode = function(leaf, appendOrReplace) {
                if(vm.view.selectedMulti === false) appendOrReplace = false
                if(appendOrReplace) vm._select.push(leaf)
                else vm._select = [leaf]
            }
            //@method freeSelect(event, leaf)取消leaf节点上所有处于选中状态的节点
            vm.freeSelect = function(event, leaf) {
                if(!leaf) {
                    // clear all
                    vm._select.clear()
                } else {
                    vm.selectFun(event, leaf, "all")
                }
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
                    e: event,
                    vmodel: vm,
                    vmodels: vmodels
                })
            }
            vm.liveClick = function(event) {
                vm.$fire("e:click", {
                    e: event,
                    vmodel: vm,
                    vmodels: vmodels
                })
            }
            // 指令执行器
            vm.excute = function() {
                var cmd = arguments[0]
                if(cmd) vm[cmd].apply(this, [].slice.call(arguments, 1))
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
        callback: {//@param 回调相关的配置
            //@optMethod callback.onExpand(data) 节点展开回调
            //@optMethod callback.onCollapse(data) 节点收起回调
            //@optMethod callback.onSelect(data) 节点被选中回调
            //@optMethod callback.onClick(data) 节点被点击回调
            //@optMethod callback.onDblClick(data) 节点被双击回调
        },
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "skipper@123"
    }
    avalon.each(eventList, function(i, item) {
        widget.defaults.callback["on" + upperFirstLetter(item)] = avalon.noop
    })

    //@method avalon.ui.tree.AddExtention(fixNames, addingDefaults, addingMethodFunc, watchEvents)扩展tree
    avalon.ui.tree.AddExtention = function(fixNames, addingDefaults, addingMethodFunc, watchEvents) {
        if(fixNames) avalon.each(fixNames, function(i, item) {
            optionKeyToFixMix[item] = item
        })
        if(addingDefaults) avalon.mix(true, widget.defaults, addingDefaults)
        if(addingMethodFunc) ExtentionMethods.push(addingMethodFunc)
        if(watchEvents) eventList = eventList.concat(watchEvents)
    }
})