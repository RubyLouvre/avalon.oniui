/**
 * @cnName 菜单组件
 * @enName menu
 * @introduce
 *  <p> 实现扫描dom元素或者设置传参生成级联菜单的组件，注意扫描dom情形下，会销毁原有的dom，且会忽略所有的ol，ul，li元素上原有的绑定
</p>
 */
define(["avalon", "text!./avalon.menu.html", "css!./avalon.menu.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {
    var counter = 0
    function getCnt() {
        return counter++
    }
    // _depth迭代层数
    function buildData(nodes, obj, _depth) {
        var data = [], node,i = 0, _depth = _depth || 0
        while(node = nodes[0]) {
            var subMenu = node.getElementsByTagName && (node.getElementsByTagName("ul")[0] || node.getElementsByTagName("ol")[0]),
            item = {}
            if(subMenu) {
                item.data = buildData(subMenu.children, obj, _depth + 1)
                node.removeChild(subMenu)
            } else {
                item.data = ""
            }
            var html = node.innerHTML,d = avalon(node).data()
            if(html && html.trim() || subMenu) {
                item.title = html || ""
                item.disabled = d && d.disabled
                item.active = d && d.active || i === obj.active
                if(item.active) obj.active = i
                data.push(item)
                i++
            }
            node.parentNode.removeChild(node)
        }
        return data
    }

    // 格式化数据
    function formateData(data) {
        avalon.each(data, function(i, item) {
            if(!item || item.$id) return
            var tpl = avalon.mix({
                disabled: false,
                title: "",
                data: "",
                active: false
            }, item)
            avalon.mix(item, tpl)
            if(Array.isArray(item.data)) formateData(item.data)
        })
    }
    var widgetInit
    function bindClick(e) {
        for(var i in widgetInit) {
            widgetInit[i] && widgetInit[i](e)
        }
    }
    function hasSubMenu(node) {
        return node.getElementsByTagName("ol")[0] || node.getElementsByTagName("ul")[0]
    }
    var widget = avalon.ui.menu = function(element, data, vmodels) {
        var options = data.menuOptions
        options.event = options.event === "mouseover" ? "mouseenter" : options.event
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options).replace(/\{\{MS_OPTION_EVENT\}\}/, options.event).replace(/\{\{\MS_OPTION_CNT}\}/g, counter)
        if(options.data == void 0) {
            options.data = buildData(element.children, options)
        } else {
            formateData(options.data)
        }
        var uid = +(new Date())
        var vmodel = avalon.define(data.menuId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.rootElement = element
            vm._oldActive = options.active
            vm._subMenus = {} // 维护一个子menu列表，用对象，更好读写
            vm.$skipArray = ["widgetElement", "template", "_subMenus", "_oldActive", "rootElement"]

            var inited, outVmodel = vmodels && vmodels[1], clickKey = "fromMenu" + uid
            vm.$init = function(continueScan) {
                if(inited) return
                inited = true

                // 子menu的层次+1
                if(outVmodel && outVmodel._depth != void 0) {
                    vmodel._depth = outVmodel._depth + 1
                }

                element.innerHTML = vmodel.template
                if(vmodel._depth === 1) {
                    element.setAttribute("ms-hover-100", "oni-helper-max-index")
                    avalon(element).addClass("oni-menu oni-helper-clearfix oni-helper-reset" + (vmodel.dir === "v" ? " oni-menu-vertical" : ""))
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
                // mouseleave重置menu
                vmodel.event === "mouseenter" && avalon(element).bind("mouseleave", function(e) {
                    vmodel._restMenu(vmodel)
                })
                // 点击选中事件的时候，重置menu
                if(vmodel.event === "click") {
                    // 绑定一次
                    if(!widgetInit) {
                        widgetInit = {}
                        avalon(document).bind("click", bindClick)
                    }
                    widgetInit[clickKey] = function(e) {
                        vmodel._restMenu(vmodel)
                    }
                }
                // 各menu之间点击互不影响
                vmodel._depth === 1 && avalon(element).bind("click", function(e) {
                    e && e.stopPropagation()
                })
            }
            vm.$remove = function() {
                delete widgetInit[clickKey]
                element.innerHTML = element.textContent = ""
            }

            vm._canActive = function(menu, index) {
                return vmodel.active === index && !menu.disabled
            }

            //@interface activate(index)展开菜单索引为index的项目，index置为false,undefined则不会展开任一项目
            vm.activate = function(e, index) {
                var _index = index === void 0 ? e : index
                if(!vmodel.data[_index] || vmodel.data[_index].disabled === true || vmodel.disabled) return
                vmodel._oldActive = vmodel.active
                // 切换menu，重置子menu状态
                if(_index !== vmodel._oldActive) {
                    vmodel.resetSubMenus()
                }
                vmodel.active = _index
                // 事件触发
                if(e && index !== void 0 && vmodel.event === "click") {
                    var activeData = vmodel.getActiveList(),
                        last = activeData[activeData.length - 1],
                        node = hasSubMenu(this)
                    // state 1
                    // 有node
                    if(node) {
                        // state 2
                        // 有子menu的节点第一次被点击展开，阻止默认事件，之后不再阻止
                        if(last && last[1] === eval(this.getAttribute("data-index"))) {
                            // state 3
                            // 第一次点击
                            if(vmodel._oldActive !== vmodel.active) {
                                e && e.preventDefault()
                                e && e.stopPropagation()
                                return
                            }
                        }
                    }
                    // state 1 
                    // 非第一次点击，认为是选中这个拥有子menu的item
                    // state 2
                    // 没有子menu的节点被点击，冒泡到上层
                    // state 1
                    // 没有node
                    vmodel._onSelect.call(this, e, activeData)
                }
            }
            // 冒泡到第一级menu进行处理
            vm._onSelect = function (e, activeData) {
                if(vmodel._depth === 1) {
                    var tar = e.srcElement || e.target
                    while(tar && tar.tagName.toLowerCase() !== "li") {
                        tar = tar.parentNode
                    }
                    var ele = avalon(tar),
                    d = ele.data(), 
                    _hasSubMenu = !!hasSubMenu(tar)
                    realSelect = activeData.slice(0, d.depth)
                    options.onSelect.call(tar, vmodel, realSelect, _hasSubMenu)
                    vmodel._restMenu(vmodel)
                }
            }
            // event 为mouseenter的时候，点击进入这个分支
            vm._ifEventIsMouseEnter = function(e, index) {
                if(vmodel.event === "click" || vmodel._depth !== 1) return
                vmodel._onSelect(e, vmodel.getActiveList())
            }
            // event 为mouseenter的时候进入这个方法
            vm._clickActive = function(e, index) {
                if(vmodel.active !== index) return
                // 阻止冒泡
                // e && e.stopPropagation()
                var ele = avalon(this), d = ele.data()
                vmodel._onClickActive.call(this, e, vmodel.active, vmodel.data, d && d.sub)
            }
            // get node by data，根据数据反获取节点
            vm._getNodeByData = function (activeData) {
                if(activeData.length > 0) {
                    var sub = vmodel._subMenus[activeData[0]]
                    if(sub) {
                        return sub._getNodeByData(activeData.slice(1))
                    } else {
                        var children = vmodel.widgetElement.children, i = 0, counter = 0
                        while(children[++i]) {
                            var node = children[i-1]
                            if(node.tagName.toLowerCase() === "li") {
                                if(counter == vmodel.active) return node
                                counter++
                            }
                        }
                    }
                }
                return false
            }
            //@interface getActiveList() 获取所有选中的menu list
            vm.getActiveList = function(arr) {
                var data = arr || []
                if(vmodel.active !== false && vmodel.data[vmodel.active]) {
                    data.push([vmodel.data[vmodel.active].$model, vmodel.active])
                    var sub = vmodel._subMenus[vmodel.active]
                    sub && sub.getActiveList(data)
                }
                return data
            }
            //@interface setActiveList(activeListArray) 设置级联menu的选项，可以一个数组，也可以使一个数字，或者"2,3,4"这样的字符串
            vm.setActiveList = function(arr) {
                if(!arr) return
                if(!Array.isArray(arr)) var arr = ([arr].join("").split(","))
                if(!arr.length) return
                vmodel.activate(eval(arr[0]))
                if(vmodel.active === false) {
                    vmodel.resetSubMenus()
                    return
                }
                if(!arr.length) return
                var sub = vmodel._subMenus[vmodel.active]
                sub && sub.setActiveList(arr.slice(1))
                // if(vmodel._depth === 1) {
                //     vmodel._onSelect({
                //         srcElement: vmodel._getNodeByData(arr)
                //     }, vmodel.getActiveList())
                // }
            }

            // 是否有子menu
            vm._hasSubMenu = function(menu) {
                return !!(menu && menu.data && Array.isArray(menu.data) && menu.data.length)
            }

            // 处理级联子menu
            vm._rescan = function() {
                vmodel._subMenus = {}
                var nodes = vmodel.widgetElement.children, counter = 0
                for(var i = 0, len = nodes.length; i < len; i++) {
                    var node = nodes[i]
                    if(node.nodeType === 1 && node.tagName.toLowerCase() === "li") {
                        var menu = node.getElementsByTagName("ul")[0] || node.getElementsByTagName("ol")[0]
                        if(menu) {
                            var ele = avalon(menu), d = ele.data()
                            if(d.widget === "menu") {
                                var opt = avalon.mix({}, options), 
                                    name = data.menuId + "r" + getCnt()
                                menu.setAttribute("ms-widget", "menu, $" + uid + i)
                                var subData = vmodel.data[d.widgetIndex], obj = {}
                                if(subData) {
                                    obj = avalon.mix(opt, {
                                        data: subData.$model.data
                                    })
                                }
                                obj.index = d.widgetIndex
                                var subVmodel = avalon.define(name, function(svm) {
                                    svm.menu = obj
                                    svm.$skipArray = ["menu"]
                                })
                                avalon.scan(menu, [subVmodel, vmodel].concat(vmodels))
                                vmodel._subMenus[counter] = avalon.vmodels["$" + uid + i]
                            }
                        }
                        counter++
                    }
                }
            }

            // 重置所有子menu
            vm.resetSubMenus = function() {
                avalon.each(vmodel._subMenus, function(i, item) {
                    vmodel._restMenu(item)
                    // 迭代
                    item.resetSubMenus()
                })
            }
            vm._restMenu = function(model) {
                model.menuResetter(model)
                model._oldActive = model.active
            }

            vm._cutCounter = avalon.noop
            vm._canRemove = avalon.noop

        })
        
        return vmodel
    }
    widget.defaults = {
        active:false, //@config 将第几个项目设置为选中，级联情形下，会将设置应用给每一级menu，默认是false，一个都不选中，建议不要通过修改这个值来修改menu的选中状态，而是通过setActiveList接口来做
        //data: undefined, //@config menu的数据项，如果没有配置这个项目，则默认扫描元素中的li，以及li中的ul或者ol来创建级联菜单，数据结构形式 <pre>[/n{/ntitle: "html",/n data: [...],/n active: false,/n disabled: false/n}/n]</pre>，子元素如果包含有效的data属性表示拥有子菜单
        event: "mouseenter",    //@config  选中事件，默认mouseenter
        disabled: false,
        _depth: 1,
        index: 0,
        dir: "h", //@config 方向，取值v,h，默认h是水平方向， v是竖直方向
        //@config onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        menuResetter: function(vmodel) {
            vmodel.active = false
        }, //@config menuResetter(vmodel) 选中某个menu项之后调用的这个restter，默认是把menu重置为不选中
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@config getTemplate(tpl, opts, tplName) 定制修改模板接口
        _menuTitle: function (title, tab, count, end) {
            return title
        },
        onSelect: avalon.noop, //@config onSelect(vmodel, realSelect, _hasSubMenu) this指向选中的menu li元素，realSelect是选中menu项目的数组 <pre>[/n[data, active],/n[data2,active2]/n]</pre>，对应每一级的数据，及每一级的active值，_hasSubMenu表示this元素有无包含子menu
        cutEnd: "",
        $author: "skipper@123"
    }
})