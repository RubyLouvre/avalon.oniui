/**
  * @description menu组件，实现扫描dom元素或者设置传参生成级联菜单的组件，注意扫描dom情形下，会销毁原有的dom，且会忽略所有的ol，ul，li元素上原有的绑定
  *
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
            vm._oldActive = options.active
            vm._subMenus = [] // 维护一个子menu列表
            vm.$skipArray = ["widgetElement", "template", "_subMenus", "_oldActive"]

            var inited, outVmodel = vmodels && vmodels[1], clickKey = "fromMenu" + uid
            vm.$init = function() {
                if(inited) return
                inited = true

                // 子menu的层次+1
                if(outVmodel && outVmodel._depth != void 0) {
                    vmodel._depth = outVmodel._depth + 1
                }

                element.innerHTML = vmodel.template
                if(vmodel._depth === 1) {
                    element.setAttribute("ms-hover-100", "ui-helper-max-index")
                    avalon(element).addClass("ui-menu ui-helper-clearfix ui-helper-reset" + (vmodel.dir === "v" ? " ui-menu-vertical" : ""))
                }
                avalon.scan(element, [vmodel].concat(vmodels))
                // 只有第一级menu触发onInit
                if(typeof options.onInit === "function" && vmodel._depth < 2) {
                    //vmodels是不包括vmodel的 
                    options.onInit.call(element, vmodel, options, vmodels)
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

            //@method activate(index)展开菜单索引为index的项目，index置为false,undefined则不会展开任一项目
            vm.activate = function(e, index) {
                var _index = index === void 0 ? e : index
                if(!vmodel.data[_index] || vmodel.data[_index].disabled === true || vmodel.disabled) return
                vmodel._oldActive = vmodel.active
                vmodel.active = _index
                // 事件触发
                if(e && index !== void 0) {
                    var node = this.getElementsByTagName("ul")[0] || this.getElementsByTagName("ol")[0]
                    if(node) {
                        // 阻止默认事件,展开子菜单
                        e && e.preventDefault()
                    }
                    // 点击进入这个分支
                    if(e && vmodel.event === "click") {
                        // 已选中
                        if(vmodel._oldActive === _index) {
                            
                        // 未选中
                        } else {
                            // 切换menu，重置子menu状态
                            vmodel.resetSubMenus()
                        }
                    }
                }
                if(vmodel.active !== vmodel._oldActive) vmodel._onActivate.call(this, e, vmodel.active, vmodel.data)
            }
            vm._onActivate = function(e, active, data) {
                if(vmodel._depth === 1) {
                    vmodel.getActiveList()
                    options.onActivate.call(this, e, active, data)
                }
            }
            vm._onClickActive = function(e, active, data, hasSub) {
                if(vmodel._depth === 1) {
                    // console.log(e.srcElement || e.target)
                    vmodel.getActiveList()
                    // options.onClickActive.call(this, e, active, data, hasSub)
                }
            }
            vm.__clickActive = function(e, index) {
                if(vmodel.event === "click" || vmodel._depth !== 1) return
                // event 为mouseenter的时候进入这个分支
                vmodel._clickActive.call(this, e, index)
            }
            // event 为mouseenter的时候进入这个方法
            vm._clickActive = function(e, index) {
                if(vmodel.active !== index) return
                // 阻止冒泡
                // e && e.stopPropagation()
                var ele = avalon(this), d = ele.data()
                vmodel._onClickActive.call(this, e, vmodel.active, vmodel.data, d && d.sub)
            }
            //@method getActiveList() 获取选中的menu list
            vm.getActiveList = function(arr) {
                var data = arr || []
                if(vmodel.active !== false && vmodel.data[vmodel.active]) {
                    data.push(vmodel.data[vmodel.active].$model)
                    for(var i = 0, len = vmodel._subMenus.length; i < len; i++) {
                        var sub = vmodel._subMenus[i]
                        if(sub && vmodel.active === sub.index) {
                            sub.getActiveList(data)
                            break
                        }
                    }
                }
                console.log(data)
                return data
            }
            //@method setActiveList(activeListArray) 设置级联menu的选项，可以一个数组，也可以使一个数字，或者"2,3,4"这样的字符串
            vm.setActiveList = function(arr) {
                if(!arr) return
                if(!Array.isArray(arr)) var arr = ([arr].join("").split(","))
                if(!arr.length) return
                vmodel.activate(eval(arr.splice(0, 1)[0]))
                if(vmodel.active === false) {
                    vmodel.resetSubMenus()
                    return
                }
                if(!arr.length) return
                for(var i = 0, len = vmodel._subMenus.length; i < len; i++) {
                    var sub = vmodel._subMenus[i]
                    if(sub && vmodel.active === sub.index) {
                        sub.setActiveList(arr)
                        break
                    }
                }
            }

            // 是否有子menu
            vm._hasSubMenu = function(menu) {
                return !!(menu && menu.data && Array.isArray(menu.data) && menu.data.length)
            }

            // 处理级联子menu
            vm._rescan = function() {
                vmodel._subMenus = []
                var nodes = vmodel.widgetElement.children
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
                                vmodel._subMenus.push(avalon.vmodels["$" + uid + i])
                            }
                        }
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
                model.resetMenu(model)
                model._oldActive = model.active
            }

            vm._cutCounter = avalon.noop
            vm._canRemove = avalon.noop

        })
      
        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        active:false, //@param 将第几个项目设置为选中，级联情形下，会将设置应用给每一级menu，默认是false，一个都不选中
        _avtive:[], //\@param 
        event: "mouseenter",    //@param  选中事件，默认mouseenter
        disabled: false,
        _depth: 1,
        index: 0,
        dir: "h", //@param 方向，取值v,h，默认h是水平方向， v是竖直方向
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        resetMenu: function(vmodel) {
            vmodel.active = false
        }, //@optMethod resetMenu(vmodel) 重置menu的配置方法，默认是重置为一个都不选中
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        _menuTitle: function (title, tab, count, end) {
            return title
        },
        onActivate: avalon.noop,  //@optMethod onActivate(event, index, data) 选中menu后的回调，this指向对应的menu li元素，参数是事件对象，索引，该级menu的data list fn(event, index, data)，默认为avalon.noop
        onClickActive: avalon.noop, //@optMethod onClickActive(event, index, data, hasSub)  点击选中的menu，this指向对应的menu li元素，参数是事件对象，索引，该级menu的data list，是否有子menu fn(event, index, data, hasSub)，默认为avalon.noop
        cutEnd: "",
        $author: "skipper@123"
    }
})