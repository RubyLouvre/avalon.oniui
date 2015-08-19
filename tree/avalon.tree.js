/**
 * @cnName 树
 * @enName tree
 * @introduce
 *    <p>借鉴ztree实现的avalon版本树组件，尽量接近ztree的数据结构，接口，功能</p>
 *    <p>callback配置说明</p>
        ```javascript
        callback: {
            //点击后回调
            onClick:avalon.noop, 
            //点击前
            beforeClick:false, 
            //双击
            onDblClick:avalon.noop, 
            beforeDblClick:false,
            //折叠
            onCollapse:avalon.noop, 
            beforeCollapse:false,
            //展开
            onExpand:avalon.noop, 
            beforeExpand:false,
            //选中
            onSelect:avalon.noop, 
            beforeSelect:false,
            //右键点击
            onRightClick:avalon.noop, 
            beforeRightClick:false,
            //鼠标键按下
            onMousedown:avalon.noop, 
            beforeMousedown:false,
            //鼠标键弹起
            onMouseup:avalon.noop, 
            beforeMouseup:false
            //edit相关回调
            //删除
            beforeRemove: false,
            //重命名
            beforeRename: false,
            //添加
            beforeNodeCreated: false,
            onRemove: avalon.noop,
            onRename: avalon.noop,
            onNodeCreated: avalon.noop,
            //check相关回调
            //勾选
            beforeCheck: false,
            onCheck:avalon.noop
        }
        ```
      <p>callback使用说明</p>
      ```javascript
        beforeClick: function(arg) {
            this 事件关联的srcElement or null
            arg.leaf 节点
            arg.e 关联的事件或者一个对象
            arg.preventDefault 
            arg.newLeaf - Add操作时候指向新增的节点
            arg.isSilent - 一些操作的时候还有这个参数，用来传递是否不展开涉及的父节点
            return false || arg.peventDefault() 这样可以阻止节点被选中，并不再向下执行
        }, onClick: function(arg) {
            before
            inner logic
            on
        }
      ```
      <p>多数为boolean的配置项，类似ztree，都是可以配置成函数的，都默认传递了一个节点作为参数，enable可能是个例外</p>
      <p>view配置说明</p>
      ```javascript
        view: { config 视觉效果相关的配置
            showLine: true, config 是否显示连接线
            dblClickExpand: true, config 是否双击变化展开状态
            selectedMulti: true, config true / false 分别表示 支持 / 不支持 同时选中多个节点
            txtSelectedEnable: false, config 节点文本是否可选中
            autoCancelSelected: false,
            singlePath: false, config 同一层级节点展开状态是否互斥
            showIcon: true, config zTree 是否显示节点的图标
            showTitle: true, config 分别表示 显示 / 隐藏 提示信息
            nameShower: function(leaf) {
                return leaf.name
            } config 节点显示内容过滤器，默认是显示leaf.name
        }
        ```
        <p>data配置说明</p>
        ```javascript
        data: { config  数据相关的配置
            simpleData: { config  简单数据的配置
                idKey: "id", config json数据里作为本身索引的字段映射
                pIdKey: "pId", config json数据里作为父节点索引的字段映射
                enable: false config 是否启用简单数据模式
            },
            key: { config json数据的字段映射
                children: "children", config  子节点字段映射
                name: "name", config 节点名字字段映射
                title: "", config 节点title字段映射，为空的时候，会去name字段映射
                url: "url" config 节点链接地址字段映射
            },
            //edit相关
            keep: {
                leaf: false - 是否锁定子节点状态
                parent: false - 是否锁定父节点状态
            }
        }
        // 因此初始化时候的数据格式，可能是
        [
            {
                children: [],
                title: "",
                name: "",
                url: "",
                open:false, - 是否展开
                isParent: true - 是否是父节点
                icon: "img url" - 子节点自定义的icon
                icon_close: "img url" - 父节点折叠时候的icon
                icon_open: "img ulr" - 父节点展开时候的icon
                iconSkin: "class prefix" - 前缀，子节点会新增preix_docu className，父节点对应的有prefix_open，prefix_close
                // 启用check组件后，新增字段
                checked: "checked" - 是否被勾选
                nocheck: "nocheck" - 是否没有勾选项
                chkDisabled: "chkDisabled" - 勾选项被禁用
                halfCheck: "halfCheck" - 半勾选
            }
        ]
        // or
        [
            {pId: 0, id: 2, name: "hehe"},
            {pId:2, id: 21, name: "hehe - 1"}
        ]
      ```
      <p>edit配置</p>
      ```javascript
        edit: {
            enable: true - 可编辑
            showAddBtn: true - 显示添加按钮
            showRemoveBtn: true - 显示删除按钮
            showRenameBtn: true - 显示重命名按钮
            editNameSelectAll: true - 重名时，输入框文字是否全选
            removeTitle: "remove" - 删除按钮显示的title
            renameTitle:"rename" - 重名title
            addTitle:"add" - 添加title
        }
      ```
      <p>check配置</p>
      ```javascript
        check: {
            enable: false - 启用
            radioType: "level" - 单选情况下，是同级节点只能勾选一个, all表示整棵树只能勾选一个
            chkStyle: "checkbox" - 多选，radio单选
            nocheckInherit: false - 当父节点设置 nocheck = true 时，设置子节点是否自动继承 nocheck = true 。[check.enable = true 时生效] 只使用于初始化节点时，便于批量操作
            chkDisabledInherit: false -当父节点设置 chkDisabled = true 时，设置子节点是否自动继承 chkDisabled = true 。[check.enable = true 时生效] 只使用于初始化节点时，便于批量操作
            autoCheckTrigger: false - 设置自动关联勾选时是否触发 beforeCheck / onCheck 事件回调函数。[check.enable = true 且 check.chkStyle = "checkbox" 时生效]
            chkboxType: {
                勾选 checkbox 对于父子节点的关联关系 "p" 表示操作会影响父级节点 "s" 表示操作会影响子级节点
                Y: "ps" - Y 属性定义 checkbox 被勾选后的情况
                N: "ps" - N 属性定义 checkbox 取消勾选后的情况
            } 
        }
      ```
      <p>async配置</p>
      ```javascript
        async: {
            enable: false - 设置 tree 是否开启异步加载模式
            url: "./avalon.tree.data.php", - Ajax 获取数据的 URL 地址。[async.enable = true 时生效]
            contentType: "application/x-www-form-urlencoded",
            dataType: "json" - Ajax 获取的数据类型。[async.enable = true 时生效]
            autoParam: [] - 异步加载时需要自动提交父节点属性的参数。[async.enable = true 时生效]
            1、将需要作为参数提交的属性名称，制作成 Array 即可，例如：["id", "name"]
            2、可以设置提交时的参数名称，例如 server 只接受 zId : ["id=zId"]
            dataFilter: undefine - 用于对 Ajax 返回数据进行预处理的函数。[async.enable = true 时生效] 默认值：null
            otherParam: {} - Ajax 请求提交的静态参数键值对。[async.enable = true 时生效]
            type: "post" - Ajax 的 http 请求模式。[async.enable = true 时生效]
        }
      ```
 */
define(["avalon", "text!./avalon.tree.html", "text!./avalon.tree.leaf.html", 
    "text!./avalon.tree.parent.html",  "text!./avalon.tree.nodes.html", 
    "../live/avalon.live", "css!./avalon.tree.css", 
    "css!../chameleon/oniui-common.css"], function(avalon, template, leafTemplate, parentTemplate, nodesTemplate) {

    var optionKeyToFixMix = {view: 1, callback: 1, data: 1},
        eventList = ["click", "dblClick", "collapse", "expand", "select", "contextmenu", "mousedown", "mouseup"],
        ExtentionMethods = [],
        undefine = void 0,
        tplDict = {},
        disabelSelectArr = [],
        callbacks = [],
        cnt = 0
    //  tool functions
    function g(id) {
        return document.getElementById(id)
    }

    function guid() {
        return "tree" + cnt++
    }

    function tplFormate(tpl, options) {
        return tpl.replace(/\{\{MS_[^\}]+\}\}/g, function(mt) {
            var k = mt.substr(mt.indexOf("_") + 1).replace("}}", "").toLowerCase(), v = tplDict[k] || ""
            if(avalon.isFunction(v)) return v(tpl, options)
            return v
        })
    }

    //  树状数据的标准化，mvvm的痛
    function dataFormator(arr, parentLeaf, dataFormated, func, vm) {
        var newArr = []
        avalon.each(arr, function(index, item) {
            if(!dataFormated) {
                // 拷贝替换
                newArr[index] = itemFormator(avalon.mix({}, item), parentLeaf, vm)
            } else if(item){
                item.$parentLeaf = parentLeaf
                item.level = parentLeaf ? parentLeaf.level + 1 : 0
                func && func(item)
            }
            if(item && item.children && item.children.length) {
                if(!dataFormated) {
                    newArr[index].children = dataFormator(item.children, newArr[index], dataFormated, undefine, vm)
                } else {
                    dataFormator(item.children, item, dataFormated, func, vm)
                }
            }
        })
        return dataFormated ? arr : newArr
    }
    function formate(item, dict) {
        avalon.each(dict, function(key, value) {
            if(key === "hasOwnProperty") return
            item[key] = item[value] || ""
        })
    }
    /**
      * 格式化数据，补全字段
      */
    function itemFormator(item, parentLeaf, vm) {
        if(!item) return
        item.level = parentLeaf ? parentLeaf.level + 1 : 0
        item.isParent = itemIsParent(item)
        formate(item, vm.data.key)
        // 不要可监听
        item.$parentLeaf = parentLeaf || ""
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
    function simpleDataToTreeData(arr, vm) {
        if(!arr.length) return []
        var dict = vm.data.simpleData, idKey = dict.idKey, pIdKey = dict.pIdKey
        var prev, tree = [], stack = [], tar, now
        for(var i = 0, len = arr.length; i < len; i++) {
            now = itemFormator(arr[i], undefine, vm)
            // 前一个节点是直属父节点
            if(prev && prev[idKey] === now[pIdKey]) {
                // 标记父节点
                prev.isParent = true 
                itemFormator(prev, undefine, vm)
                // 防止重复压入堆栈
                if(!tar || tar !== prev) {
                    stack.push(prev)
                    tar = prev
                }
                tar.children.push(now)
            // 当前节点是一个父节点或者没有出现过父节点或者出现的父节点非自己的父节点
            } else if(now.isParent || !tar || tar[idKey] !== now[pIdKey]) {
                // 出栈知道找到自己的父节点或者栈空
                while(tar && (now[pIdKey] !== tar[idKey])) {
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
            now[pIdKey] = now[pIdKey] || 0
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
    var commonInit = true
    var widget = avalon.ui.tree = function(element, data, vmodels) {
        if(commonInit) {
            avalon.bind(document.body, "selectstart", disabelSelect)
            avalon.bind(document.body, "drag", disabelSelect)
            commonInit = false
        }
        var options = data.treeOptions, cache = {}// 缓存节点
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)
        options.parentTemplate = options.getTemplate(parentTemplate, options, "parent")
        options.leafTemplate = options.getTemplate(leafTemplate, options, "leaf")
        options.nodesTemplate = options.getTemplate(nodesTemplate, options, "nodes")
        var newOpt = {$guid: guid()}, dataBak
        avalon.mix(newOpt, options)
        avalon.each(optionKeyToFixMix, function(key) {
            avalon.mix(true, newOpt[key], avalon.mix(true, {}, widget.defaults[key], newOpt[key]))
        })
        dataBak = options.children
        if(newOpt.data.simpleData.enable) {
            newOpt.children = simpleDataToTreeData(newOpt.children, newOpt)
        } else {
            newOpt.children = dataFormator(newOpt.children, undefine, undefine, undefine, newOpt)
        }
        newOpt.template = tplFormate(newOpt.template, newOpt).replace(/\n/g, "").replace(/>[\s]+</g, "><")
        newOpt.parentTemplate = tplFormate(newOpt.parentTemplate, newOpt).replace(/\n/g, "").replace(/>[\s]+</g, "><")
        newOpt.leafTemplate = tplFormate(newOpt.leafTemplate, newOpt).replace(/\n/g, "").replace(/>[\s]+</g, "><")
        newOpt.nodesTemplate = tplFormate(newOpt.nodesTemplate, newOpt).replace(/\n/g, "").replace(/>[\s]+</g, "><")
        var vmodel = avalon.define(data.treeId, function(vm) {
            // mix插件配置
            avalon.each(ExtentionMethods, function(i, func) {
                func && func(vm, vmodels)
            })
            avalon.mix(vm, newOpt)
            vm.widgetElement = element
            vm.widgetElement.innerHTML = vm.template
            vm.rootElement = element.getElementsByTagName("*")[0]
            vm.$skipArray = ["widgetElement", "template", "callback", "rootElement", "_select"]
            vm._select = []
            vm.selectIDS = []

            var inited
            vm.$init = function(continueScan) {
                if(inited) return
                inited = true
                dataFormator(vm.children, undefine, "构建父子节点衔接关系", function(leaf) {
                    cache[leaf.$id] = leaf
                }, vm)
                if(!vm.view.txtSelectedEnable && navigator.userAgent.match(/msie\s+[5-8]/gi)) {
                    disabelSelectArr.push(vm.widgetElement)
                }
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.log("avalon请尽快升到1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels))
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
                cache = null
                var i = 0
                vm.children.clear()
                vm.selectIDS.clear()
                vm._select = null
                // 从数组中移除，防止内存泄露
                while(disabelSelectArr[i]) {
                    if(disabelSelectArr[i] === element) {
                        disabelSelectArr.splice(i, 0)
                        break
                    }
                    i++
                }
                vm.rootElement = element = null
            }
            vm.computeIconClass = function(leaf) {
                return (leaf.iconSkin ? leaf.iconSkin + "_" : "") + "ico_" + (leaf.isParent ? vm.hasClassOpen(leaf, "ignoreNoline") ? "open" : "close" : "docu")
            }
            vm.shallIconShow = function(leaf) {
                if(!vm.exprAnd(leaf, vm.view.showIcon)) return false
                return vm.exprAnd.apply(null, arguments)
            }
            vm.shallIconShowReverse = function(leaf) {
                if(!vm.exprAnd(leaf, vm.view.showIcon)) return false
                return !vm.exprAnd.apply(null, arguments)
            }
            vm.computeIcon = function(leaf) {
                var ico = leaf.isParent ? vm.hasClassOpen(leaf) ? leaf.icon_open || "" : leaf.icon_close || "" : leaf.icon ? leaf.icon : ""
                if(ico) {
                    return "url(\"" + ico + "\") 0 0 no-repeat"
                }
                return ""
            }
            vm.computeLineClass = function(leaf, first, last) {
                var status = leaf.open ? "open" : "close",
                    pos = first && !leaf.level ? "roots" : last ? "bottom" : "center"
                if(!vm.optionToBoolen(vm.view.showLine,leaf)) pos = "noline"
                return pos + "_" + status
            }
            vm.levelClass = function(leaf, adding) {
                var adding = adding || 0
                return "level" + ((leaf.level || 0) + adding)
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
                var leaf = leaf || event.leaf
                if(!leaf) return
                leaf.open ? vm.excute("collapse", event, leaf, "collapse") : vm.excute("expand", event, leaf, "expand")
            }

            /**
             * @interface 展开leaf节点
             * @param {Object} 指定节点，也可以是{leaf:leaf} or leaf
             * @param {boolen} 表示是否迭代所有子孙节点
             */
            vm.expand = function(arg, all, openOrClose) {
                var leaf = arg && arg.leaf || arg
                if(!leaf) {
                    leaf = vm
                } else {
                    if(!leaf.isParent) return
                    leaf.open = !openOrClose
                }
                var children = leaf.children, leafDom = g(leaf.$id)
                // 节点未渲染，或不可见，向上溯源处理
                if(!openOrClose && (!leafDom || !leafDom.scrollHeight)) vm.cVisitor(leaf, function(node) {
                    if(node == vm) return
                    node.open = true
                })
                // 互斥
                if(vm.view.singlePath && !openOrClose) {
                    vm.brotherVisitor(leaf, function(item, opt){
                        if(item != leaf && item.open) vm.excute("collapse", arg.e, item, "collapse") 
                    })
                }
                if(all && children) avalon.each(children, function(i, item) {
                    vm.expand(item, "all", openOrClose)
                })
            }

            /**
             * @interface 展开 / 折叠 全部节点，返回true表示展开，false表示折叠，此方法不会触发 beforeExpand / onExpand 和 beforeCollapse / onCollapse 事件回调函数
             * @param {arr} true 表示 展开 全部节点，false 表示 折叠 全部节点
             */
            vm.expandAll = function(openOrClose) {
                openOrClose ? vm.expand(undefine, "all") : vm.collapse(undefine, "all")
                return openOrClose
            }

            /**
             * @interface 折叠leaf节点的子节点
             * @param {Object} 指定节点，也可以是{leaf:leaf} or leaf
             * @param {boolen} 表示是否迭代所有子孙节点
             */
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


            /**
             * @interface 隐藏某个节点
             * @param {Object} 指定节点，也可以是{leaf:leaf} or leaf
             */
            vm.hideNode = function(leaf) {
                leaf = leaf && leaf.leaf || leaf
                vm.hideNodes([leaf])
            }

            /**
             * @interface 隐藏节点集合
             * @param {Array} 节点集合
             */
            vm.hideNodes = function(nodes, flag) {
                flag = flag === undefine ? false : flag
                avalon.each(nodes, function(i, node) {
                    node.isHidden = flag
                })
            }
            /**
             * @interface 显示某个节点
             * @param {Object} 指定节点，也可以是{leaf:leaf} or leaf
             */
            vm.showNode = function(node) {
                node = node && node.leaf || node
                vm.showNodes([node])
            }
            /**
             * @interface 显示节点集合
             * @param {Array} 节点集合
             */
            vm.showNodes = function(nodes) {
                vm.hideNodes(nodes, true)
            }

            /**
             * @interface 中序向下遍历树，返回一个数组
             * @param {Object} 起点，为空表示根
             * @param {Function} 递归操作，传递参数是当前节点，options，如果!!return != false，则将返回压入res
             * @param {Function} 终止遍历判断，传递参数是res,当前节点,起点，return true则终止遍历
             * @param {Array} 存储结果的数组，为空则会内部声明一个
             * @param {Object} 用于辅助func的参数
             */
            vm.visitor = function(startLeaf, func, endFunc, res, options) {
                var startLeaf = startLeaf || vm,
                    res = res || []
                if(startLeaf != vm) {
                    var data = func(startLeaf, options)
                    data && res.push(data)
                    if(endFunc && endFunc(res, startLeaf, startLeaf)) return res
                }
                if(startLeaf.children && startLeaf.children.length) {
                    for(var i = 0, children = startLeaf.children, len = children.length; i < len; i++) {
                        if(endFunc && endFunc(res, children[i], startLeaf)) break
                        vm.visitor(children[i], func, endFunc, res, options)
                    }
                }
                return res
            }
            /**
             * @interface 向上溯源，返回一个数组
             * @param {Object} 起点
             * @param {Function} 递归操作，传递参数是当前节点，options，如果!!return != false，则将返回压入res
             * @param {Function} 终止遍历判断，传递参数是res,当前节点,起点，return true则终止遍历
             * @param {Array} 存储结果的数组，为空则会内部声明一个
             * @param {Object} 用于辅助func的参数
             */
            vm.cVisitor = function(startLeaf, func, endFunc, res, options) {
                var res = res || []
                if(startLeaf) {
                    var data = func(startLeaf, options)
                    data && res.push(data)
                    // 结束溯源
                    if(endFunc && endFunc(res, startLeaf, startLeaf)) return res
                    // 继续向上
                    if(startLeaf.$parentLeaf) vm.cVisitor(startLeaf.$parentLeaf, func, endFunc, res, options)
                }
                return res
            }

            /**
             * @interface 同级访问，返回一个数组
             * @param {Object} 起点
             * @param {Function} 递归操作，传递参数是当前节点，options，如果!!return != false，则将返回压入res
             * @param {Function} 终止遍历判断，传递参数是res,当前节点,起点，return true则终止遍历
             * @param {Array} 存储结果的数组，为空则会内部声明一个
             * @param {Object} 用于辅助func的参数
             */
            vm.brotherVisitor = function(startLeaf, func, endFunc, res, options) {
                var res = res || []
                if(startLeaf) {
                    var data, brothers = vm.getBrothers(startLeaf)
                    for(var i = 0, len = brothers.length; i < len; i++) {
                        data = func && func(brothers[i], options)
                        data && res.push(data)
                        // endCheck
                        if(endFunc && endFunc(res, brothers[i], startLeaf)) break
                    }
                }
                return res
            }

            vm.getBrothers = function(leaf) {
                if(!leaf) return []
                return leaf.$parentLeaf ? leaf.$parentLeaf.children : vm.children
            }

            /**
             * @interface 根据$id快速获取节点 JSON 数据对象
             * @param {Object} $id，avalon生成数据的pid
             */
            vm.getNodeByTId = function(id) {
                return cache[id]
            }

            /**
             * @interface 获取某节点在同级节点中的序号
             * @param {Object} 指定的节点
             */
            vm.getNodeIndex = function(leaf) {
                var c = vm.getBrothers(leaf)
                for(var i = 0, len = c.length; i < len; i++) {
                    if(c[i] === leaf) return i
                }
                return -1
            }

            /**
             * @interface 获取全部节点数据，如果指定了leaf则返回leaf的所有子节点，不包括leaf
             * @param {Object} 指定节点
             */
            vm.getNodes = function(leaf) {
                return leaf ? leaf.children : vm.children
            }

            /**
             * @interface 根据自定义规则搜索节点数据 JSON 对象集合 或 单个节点数据，不包含指定的起始节点
             * @param {Function} 自定义过滤器函数 function filter(node) {...}
             * @param isSingle = true 表示只查找单个节点 !!isSingle = false 表示查找节点集合
             * @param 可以指定在某个父节点下的子节点中搜索
             * @param 用户自定义的数据对象，用于 filter 中进行计算
             */
            vm.getNodesByFilter = function(fitler, isSingle, startLeaf, options) {
                return vm.visitor(startLeaf, function(node, opt) {
                    if(node === startLeaf) return
                    if(filter && filter(node, opt)) return node
                }, isSingle ? function(data, node) {
                    return data.length > 0
                } : false, [], options)
            }

            /**
             * @interface 根据节点数据的属性搜索，获取条件完全匹配的节点数据 JSON 对象，不包含指定的起始节点
             * @param {String} 需要精确匹配的属性名称
             * @param 需要精确匹配的属性值，可以是任何类型，只要保证与 key 指定的属性值保持一致即可
             * @param 可以指定在某个父节点下的子节点中搜索
             */
            vm.getNodeByParam = function(key, value, startLeaf) {
                return vm.getNodesByParam(key, value, startLeaf, function(data, node) {
                    return data.length > 0
                })
            }

            /**
             * @interface 根据节点数据的属性搜索，获取条件完全匹配的节点数据 JSON 对象集合，不包含指定的起始节点
             * @param {String} 需要精确匹配的属性名称
             * @param 需要精确匹配的属性值，可以是任何类型，只要保证与 key 指定的属性值保持一致即可
             * @param 可以指定在某个父节点下的子节点中搜索
             */
            vm.getNodesByParam = function(key, value, startLeaf, endFunc) {
                return vm.visitor(startLeaf, function(leaf) {
                    if(leaf === startLeaf) return
                    return leaf[key] === value ? leaf : false
                }, endFunc, [])
            }

            /**
             * @interface 根据节点数据的属性搜索，获取条件模糊匹配的节点数据 JSON 对象集合，不包含指定的起始节点
             * @param 需要模糊匹配的属性值，用于查找的时候执行正则匹配，不是正则表达式
             * @param 可以指定在某个父节点下的子节点中搜索
             */
            vm.getNodesByParamFuzzy = function(key, value, startLeaf) {
                return vm.visitor(startLeaf, function(leaf) {
                    if(leaf === startLeaf) return
                    return (leaf[key] + "").match(new RegExp(value, "g")) ? leaf : false
                }, false, [])
            }

            /**
             * @interface 获取节点相邻的前一个节点
             * @param {Object} 指定的节点
             */
            vm.getPreNode = function(leaf, next) {
                var allMates = vm.getBrothers(leaf),
                    index = vm.getNodeIndex(leaf)
                return index > -1 ? allMates[next ? index + 1 : index-1] : false
            }

            /**
             * @interface 获取节点相邻的后一个节点
             * @param {Object} 指定节点
             */
            vm.getNextNode = function(leaf) {
                return vm.getPreNode(leaf, "next")
            }

            /**
             * @interface 获取节点的父节点
             * @param {Object} 指定的节点
             */
            vm.getParentNode = function(leaf) {
                return leaf && leaf.$parentLeaf
            }

            /**
             * @interface 添加多个节点，返回被添加的节点
             * @param {Object} 指定的父节点，如果增加根节点，请设置 parentNode 为 null 即可
             * @param {Array} 需要增加的节点数据 JSON 对象集合
             * @param 设定增加节点后是否自动展开父节点。isSilent = true 时，不展开父节点，其他值或缺省状态都自动展开。
             */
            vm.addNodes = function(parentLeaf, nodes, isSilent) {
                return vm.excute('nodeCreated', {
                    isSilent: isSilent
                } , parentLeaf, function() {
                    // 数据构建
                    if(vm.data.simpleData.enable && (nodes instanceof Array)) {
                        nodes = vm.transformTozTreeNodes(nodes)
                    } else {
                        nodes = nodes instanceof Array ? nodes : [nodes]
                    }
                    nodes = dataFormator(nodes, parentLeaf, undefine, undefine, vm)
                    // 这里node依旧没有$id属性
                    // dataFormator(nodes, parentLeaf, "构建父子节点衔接关系", undefine, vm)
                    if(parentLeaf) parentLeaf.isParent = true
                    // open的监听可能没有捕捉到
                    if(!isSilent && parentLeaf) parentLeaf.open = true
                    var arr = vm.getNodes(parentLeaf), len = arr.length
                    arr.pushArray(nodes)
                    var addNodes = arr.slice(len) || []
                    // 构建，只有在nodes被push到数组之后才会拥有$id,$events等属性
                    dataFormator(addNodes, parentLeaf, '\u6784\u5EFA\u7236\u5B50\u8282\u70B9\u8854\u63A5\u5173\u7CFB', undefine, vm);
                    // 更具$id属性build cache
                    avalon.each(addNodes, function(i, leaf) {
                        cache[leaf.$id] = leaf
                    })
                    return addNodes
                })
            }
            /**
             * @interface 将简单 Array 格式数据转换为 tree 使用的标准 JSON 嵌套数据格式
             * @param 需要被转换的简单 Array 格式数据 或 某个单独的数据对象
             */
            vm.transformTozTreeNodes = function(data) {
                if(!(data instanceof Array)) data = [data]
                return simpleDataToTreeData(data, vm)
            }

            /**
             * @interface 将 tree 使用的标准 JSON 嵌套格式的数据转换为简单 Array 格式
             * @param  需要被转换的 tree 节点数据对象集合 或 某个单独节点的数据对象
             * @param {Function} 格式化过滤器函数
             */
            vm.transformToArray = function(data, filter, res) {
                var res = res || [],
                    ignoreKey = arguments[3],
                    dict = vm.data.simpleData
                if(!ignoreKey) {
                    // 忽略的辅助性key
                    ignoreKey = {}
                    avalon.each(avalon.ui.tree.leafIgnoreField, function(i, key) {
                        ignoreKey[key] = true
                    })
                }
                if(data instanceof Array) {
                    avalon.each(data, function(i, node) {
                        vm.transformToArray(node, filter, res, ignoreKey)
                    })
                } else if(data){
                    var item = {}, model = data.$model
                    for(var i in model) {
                        // ignore ^$
                        if(i.indexOf("$") === 0 || ignoreKey[i] || i === "children" || model[i] == "") continue
                        var key = dict[i + "Key"] ? dict[i + "Key"] : i
                        item[key] = model[i]
                    }
                    res.push(filter ? filter(item) : item)
                    if(data.isParent) {
                        vm.transformToArray(data.children, filter, res, ignoreKey)
                    }
                }
                return res
            }

            /**
             * @interface 重置树的状态
             * @param {Array} 指定用来重置的数据，为空表示用第一次初始化时候的数据来重置
             */
            vm.reset = function(children) {
                vm._select = []
                vm.selectIDS = []
                vm.children.clear()
                vm.addNodes(undefine, children || dataBak)
            }

            /**
             * @interface 复制节点，返回clone后的节点
             * @param {Object} 参考节点
             * @param {Object} 需要被复制的节点数据
             * @param 复制到目标节点的相对位置 "inner"：成为子节点，"prev"：成为同级前一个节点，"next"：成为同级后一个节点
             * @param 设定复制节点后是否自动展开父节点，isSilent = true 时，不展开父节点，其他值或缺省状态都自动展开
             */
            vm.copyNode = function(targetLeaf, leaf, moveType, isSilent) {
                var newLeaf = avalon.mix({}, leaf.$model)
                vm.moveNode(targetLeaf, newLeaf, moveType, isSilent)
                return newLeaf
            }

            /**
             * @interface 移动节点，目测这个是相当费性能的。。。，返回被移动的节点
             * @param {Object} 参考节点
             * @param {Object} 被移动的节点
             * @param 指定移动到目标节点的相对位置"inner"：成为子节点，"prev"：成为同级前一个节点，"next"：成为同级后一个节点
             * @param 设定移动节点后是否自动展开父节点，isSilent = true 时，不展开父节点，其他值或缺省状态都自动展开
             */
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
                // 展开父节点
                if(!isSilent && node.$parentLeaf) node.$parentLeaf.open = true
                return node
            }

            // cache管理
            vm.removeCacheById = function(id) {
                delete cache[id]
            }

            //选中相关，可能是一个性能瓶颈，之后可以作为优化的点
            vm.hasClassSelect = function(leaf) {
                for(var i = 0, len = vm.selectIDS.length; i < len; i++) {
                    if(vm.selectIDS[i] === leaf.$id) return i + 1
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
            vm.selectFun = function(event, all) {
                var leaf = event.leaf,
                    event = event.e
                if(!leaf.url) event.preventDefault && event.preventDefault()
                if(all) {
                    var _s = vm._select,
                        sids = vm.selectIDS,
                        info = vm._getSelectIDs(leaf),
                        total = count = info.total,
                        dict = info.dict
                    // 删除优化
                    if(total > 1) sids.$unwatch()
                    for(var i = 0; i < _s.length; i++) {
                        var k = _s[i]
                        if(dict[k.$id]) {
                            _s.splice(i, 1)
                            sids.splice(i, 1)
                            i--
                            count--
                            if(count == 1 && total > 1) sids.$watch()
                        }
                    }
                    res = dict = null
                } else {
                    var id = leaf.$id, index = vm.hasClassSelect(leaf)
                    if(index) {
                        vm._select.splice(index - 1, 1)
                        vm.selectIDS.splice(index - 1, 1)
                    } else {
                        if(vm.ctrlCMD(event, leaf)) {
                            vm._select.push(leaf)
                            vm.selectIDS.push(leaf.$id)
                        } else {
                            vm._select = [leaf]
                            vm.selectIDS = [leaf.$id]
                        }
                    }
                }
            }

            /**
             * @interface 将指定的节点置为选中状态，无任何返回值
             * @param {object} 指定的节点，不能为空
             * @param 是否保留原来选中的节点，否则清空原来选中的节点，当view.selectedMulti为false的时候，该参数无效，一律清空
             */
            vm.selectNode = function(leaf, appendOrReplace) {
                if(vm.view.selectedMulti === false) appendOrReplace = false
                if(appendOrReplace) {
                    vm._select.push(leaf)
                    vm.selectIDS.push(leaf.$id)
                }
                else {
                    vm._select = [leaf]
                    vm.selectIDS = [leaf.$id]
                }
            }

            /**
             * @interface 获取以指定节点为起点，以数组形式返回所有被选中的节点
             * @param {object} 指定的节点，为空的时候表示由根开始查找
             */
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

            /**
             * @interface 取消选中子节点的选中状态，无任何返回值
             * @param {object} 指定的节点，为空的时候表示取消所有
             */
            vm.cancelSelectedNode = function(leaf) {
                for(var i = 0, len = vm._select.length; i < len; i++) {
                    if(vm._select[i] === leaf) {
                        vm._select.splice(i, 1)
                        break
                    }
                }
                vm.selectIDS.remove(leaf.$id)
            }

            /**
             * @interface 取消节点上所有选中子节点的选中状态，无任何返回值
             * @param {object} 通过arg.leaf 指定的节点
             */
            vm.cancelSelectedChildren = function(arg) {
                if(!leaf) {
                    // clear all
                    vm._select = []
                    vm.selectIDS.clear()
                } else {
                    vm.selectFun(arg, "all")
                }
            }

            vm.ctrlCMD = function(event, leaf) {
                if(event.ctrlKey) event.preventDefault()
                return event.ctrlKey && vm.optionToBoolen(vm.view.selectedMulti, leaf, event)
            }

            vm.optionToBoolen = function() {
                var arg = arguments[0]
                if(!avalon.isFunction(arg)) return arg
                return arg.apply(vm, [].slice.call(arguments,1))
            }
            //event
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
            // tool function
            // 事件分发中心
            vm.excute = function(cmd, event, leaf, action) {
                var evt = cmd, eventName = upperFirstLetter(cmd),
                    beforeFunc = vm.callback["before" + eventName],
                    onFunc = vm.callback["on" + eventName],
                    res,
                    arg = {
                        e: event,
                        leaf: leaf,
                        vm: vm,
                        vmodels: vmodels,
                        preventDefault: function() {
                            this.cancel = true
                        }
                    }, ele = event ? event.srcElement || event.target : null,
                    callbackEnabled = !event || !event.cancelCallback
                // 执行前检测，返回
                vmodel.$fire("e:before" + eventName, arg)
                if(callbackEnabled) {
                    // callback里面可能只preventDefault
                    if(arg.cancel || beforeFunc && beforeFunc.call(ele, arg) === false || arg.cancel) {
                        arg.preventDefault()
                        return
                    }
                }
                if(action) {
                    if(!(cmd === "dblClick" && !vm.view.dblClickExpand
                    )) {
                        if(!avalon.isFunction(action)) action = vm[action]
                        if(avalon.isFunction(action)) res = action.call(ele, arg)
                    }
                }
                if(res !== undefine) arg.res = res
                // 被消除
                if(arg.cancel) return
                vmodel.$fire("e:" + cmd, arg) 
                if(callbackEnabled) {
                    onFunc && onFunc.call(ele, arg)
                }
                return res
            }

            vm.exprAnd = function() {
                var len = arguments.length, step = 1, res = step, leaf = arguments[0]
                while(step < len) {
                    res = res && vm.optionToBoolen(arguments[step], leaf)
                    step++
                }
                return res
            }

            vm.timeStamp = function() {
                return Date.now()
            }

            vm.toggleStatus = function() {
                vm.toggle = !vm.toggle
                return vm.toggle
            }
        })
        // 展开父节点
        vmodel.$watch("e:nodeCreated", function(arg) {
            if(arg && arg.e && arg.e.isSilent) return
            var leaf = arg.leaf
            if(leaf) {
                leaf.isParent = true
                vmodel.expand(leaf)
            }
        })
        avalon.each(callbacks, function(i, func) {
            if(avalon.isFunction(func)) func(vmodel, vmodels)
        })
        return vmodel
    }
    function disabelSelect(event) {
        var src = event.srcElement
        for(var i = 0, len = disabelSelectArr.length; i < len; i++) {
            if(avalon.contains(disabelSelectArr[i], src) && src.type != "text") {
                event.preventDefault()
                return
            }
        }
    }
    widget.defaults = {
        toggle: true,
        view: {//@config {Object} 视觉效果相关的配置
            showLine: true,//@config 是否显示连接线
            dblClickExpand: true,//@config 是否双击变化展开状态
            selectedMulti: true,//@config true / false 分别表示 支持 / 不支持 同时选中多个节点
            txtSelectedEnable: false,//@config 节点文本是否可选中
            autoCancelSelected: false,
            singlePath: false,//@config 同一层级节点展开状态是否互斥
            showIcon: true,//@config zTree 是否显示节点的图标
            showTitle: true,//@config 分别表示 显示 / 隐藏 提示信息
            showSwitch: true,//@config 显示折叠展开ico
            nameShower: function(leaf) {
                return leaf.name
            }//@config 节点显示内容过滤器，默认是显示leaf.name
        },
        data: {//@config {Object} 数据相关的配置
            simpleData: {//@config {Object} 简单数据的配置
                idKey: "id",//@config json数据里作为本身索引的字段映射
                pIdKey: "pId",//@config json数据里作为父节点索引的字段映射
                enable: false//@config 是否启用简单数据模式
            },
            key: {//@config {Object} json数据的字段映射
                children: "children",//@config {Array} 子节点字段映射
                name: "name",//@config 节点名字字段映射
                title: "",//@config 节点title字段映射，为空的时候，会去name字段映射
                url: "url"//@config 节点链接地址字段映射
            }
        },
        //@config {Object} 回调相关的配置
        callback: {
        },
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
    avalon.each(eventList, function(i, item) {
        if(item == "contextmenu") item = "RightClick"
        widget.defaults.callback["on" + upperFirstLetter(item)] = avalon.noop
        widget.defaults.callback["before" + upperFirstLetter(item)] = false
    })

    /**
     * @interface avalon.ui.tree.AddExtention(fixNames, addingDefaults, addingMethodFunc, watchEvents)扩展tree
     */
    avalon.ui.tree.AddExtention = function(fixNames, addingDefaults, addingMethodFunc, watchEvents, tplHooks, callback) {
        if(fixNames) avalon.each(fixNames, function(i, item) {
            optionKeyToFixMix[item] = item
        })
        if(addingDefaults) avalon.mix(true, widget.defaults, addingDefaults)
        if(addingMethodFunc) ExtentionMethods.push(addingMethodFunc)
        if(watchEvents) eventList = eventList.concat(watchEvents)
        if(tplHooks) avalon.mix(tplDict, tplHooks)
        if(callback) callbacks.push(callback)
    }
    avalon.ui.tree.leafIgnoreField = ["level"] // tree转化成数据的时候，忽略的字段，所有以$开头的，以及这个数组内的
})