define(["avalon", "text!./avalon.tab.tabs.html", "text!./avalon.tab.panels.html", "text!./avalon.tabs.close.html"], function(avalon, tabTpl, panelTpl, closeTpl) {
          
    // 默认配置
    var defautOpt = {
        autoSwitch: false,      // 是否自动切换，默认否
        active: 0,              // 默认选中的tab，默认第一个tab
        event: "mouseenter",    // tab选中事件，默认mouseenter
        removeable: false,      // 是否支持删除，默认否
        activate: avalon.noop,  // 选中tab后的回调
        clickActive: avalon.noop, // 点击选中的tab，适用于event是点击的情况
        activeDelay: 0,         // 比较适用于mouseenter事件情形，延迟切换tab，例如:200 = 200ms
        collapsible: false,     // 当切换面板的事件为click时，如果对处于激活状态的按钮再点击，将会它失去激活并且对应的面板会收起来,再次点击它时，它还原，并且对应面板重新出现
        contentType: "content", // panel是静态元素，还是需要通过异步载入
        //classnamePrefix: false, // 注入自定义class前缀，适用组件自带模板时候有用
        bottom: false,          // tab显示在底部
        callInit: true,         // 调用即初始化
        contentType: "content", // 静态内容，还是异步获取
        // tabContainer: undefined, // tab容器，如果指定，则到该容器内扫描tabs
        // panelContainer: undefined, // panel容器，如果指定，则到该容器内扫描panel

        // 获取模板，防止用户自定义的getTemplate方法没有返回有效的模板
        $getTemplate: function (tplName, vm) {
            // 这里不能用this.getxxx in IE
            var tpl = vm.getTemplate(tplName)
            if(tpl) return tpl
            if(tplName == 'panel') {
                return panelTpl
            } else if(tplName == 'close') {
                return closeTpl
            } else {
                return tabTpl
            }
        },
        getTemplate: function (tplName) {
            return ""
        },

        // 保留实现配置
        // switchEffect: function() {},     // 切换效果
        // init: true,                      // 立即初始化
        // useSkin: false,                  // 载入神马皮肤
        "$author":"skipper@123"
    }

    // 对模板进行转换
    var _getTemplate = function(tpl, vm) {
        return tpl.replace(/MS_[A-Z_0-9]+/g, function(mat) {
            var mat = (mat.split("MS_OPTION_")[1]||"").toLowerCase().replace(/_[^_]/g, function(mat) {
                return mat.replace(/_/g, '').toUpperCase()
            })
            return vm[mat] || ''
        })
    }

    var tab = avalon.ui.tab = function(element, data, vmodels) {
        var defineOpt = data['tabOptions']
            , options = avalon.mix({}, defautOpt, defineOpt)
            , tabpanels = []
            , tabs = []

        // 未指定tabs，则从dom树中扫面第一个ul或者ol元素
        /*
        if(typeof options.tabs == "undefined") {
            while (el = element.firstChild) {
                if (el.tagName === "UL" || el.tagName === "OL") {
                    tabsParent = el
                }
                if (el.tagName === "DIV") {
                    tabpanels.push({
                        content: el.innerHTML,
                        contentType: 'content'
                    })
                }
                element.removeChild(el)
            }
            for (var i = 0; el = tabsParent.children[i++]; ) {
                var tabOptions = avalon(el).data()
                tabs.push({
                    title: el.innerHTML,
                    disabled: tabOptions.disabled == undefined ? false : tabOptions.disabled
                })
            }
        } else {
        }*/

        var vmodel = avalon.define(data["tabId"], function(vm) {
            vm.$skipArray = ["disable", "enable", "add", "activate", "remove", "getTemplate"]

            avalon.mix(vm, options)

           
            var inited
            vm.$init = function() {
                if(inited) return
                inited = true

                vm.tabs = vm.tabs || tabs
                vm.tabpanels = vm.tabpanels || tabpanels
                if(vm.removable) vm.removable = closeTpl


                
                avalon.nextTick(function() {
                    avalon(element).addClass("ui-tabs ui-widget ui-widget-content ui-corner-all ui-tabs-collapsible")
                    // tab列表
                    var tabFrag = _getTemplate(vm.$getTemplate(0, vm), vm)
                        , panelFrag = _getTemplate(vm.$getTemplate("panel", vm), vm)

                    element.innerHTML = vmodel.bottom ? panelFrag + tabFrag : tabFrag + panelFrag
                    element.setAttribute("ms-class-1", "ui-tabs-collapsible:collapsible")
                    element.setAttribute("ms-class-2", "tabs-bottom:bottom")

                    avalon.scan(element, [vmodel].concat(vmodels))

                    if(vm.autoSwitch) {
                        vm.$autoSwitch();
                    }
                })
            }

            vm.activate = function(event, index, fix) {
                // 猥琐的解决在ie里面报找不到成员的bug
                !fix && event.preventDefault()
                if (vm.tabs[index].disabled === true) {
                    return
                }
                // event是click，点击激活状态tab
                if (vm.event === 'click' && vm.active === index) {
                    // 去除激活状态
                    if(vm.collapsible) {
                        vm.active = NaN
                    // 调用点击激活状态tab回调
                    } else {
                        options.clickActive.call(el, event, vmodel)
                    }
                    return
                }
                if (vm.active !== index) {
                    avalon.nextTick(function() {
                        var elem = this
                        vm.active = index
                        options.activate.call(elem, event, vmodel)
                    })
                }
            }
            // 延时效果
            if(vm.event == "mouseenter" && vm.activeDelay) {
                var timer
                    , tmp = vm.activate
                vm.activate = function($event, $index) {
                    clearTimeout(timer)
                    var el = this
                        , arg = arguments
                    timer = setTimeout(function() {
                        tmp.apply(el, [$event, $index, 'fix event bug in ie'])
                    }, vm.activeDelay)
                    if(!el.getAttribute('leave-binded') && 0) {
                        el.setAttribute('leave-binded', 1)
                        avalon.bind(el, 'mouseleave', function() {
                            clearTimeout(timer)
                        })
                    }
                }
            }

            // 自动切换效果
            vm.$autoSwitch = function() {
                clearTimeout(vm.$switchTimer)
                if(vm.tabs.length < 2) return
                vm.$switchTimer = setTimeout(function() {
                    var i = vm.active + 1
                        // 防止死循环
                        , loop = 0
                    while(i != vm.active && loop < vm.tabs.length - 1) {
                        if(i >= vm.tabs.length) {
                            i = 0
                        }
                        avalon.log(i)
                        if(!vm.tabs[i].disabled) {
                            vm.active = i
                            vm.$autoSwitch()
                            break
                        }
                        i++
                        loop++
                    }
                }, vm.autoSwitch)
            }


            //清空构成UI的所有节点，一下代码继承自pilotui
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
            vm.disable = function(index, disable) {
                disable = typeof disable == "undefined" ? true : disable
                // 这个方法ms不见了
                //if (!avalon.isArray(index)) {
                if(!index instanceof Array) {
                    index = [index]
                }
                var total = vm.tabs.length
                // 这里也是
                index.forEach(function(idx) {
                    if (idx >= 0 && total > idx) {
                        vm.tabs[idx].disabled = disable
                    }
                })
            }
            vm.enable = function(index) {
                vm.disable(index, false)
            }
            vm.add = function(config) {
                var title = config.title || 'Tab Tile'
                var content = config.content || '<div></div>'
                var exsited = false
                vm.tabpanels.forEach(function(panel) {
                    if (panel.contentType == 'include' && panel.content == config.content) {
                        exsited = true
                    }
                })
                if (exsited === true) {
                    return
                }
                vm.tabpanels.push({
                    content: content,
                    contentType: config.contentType
                })
                vm.tabs.push({
                    title: title,
                    disabled: false
                })
                if (config.actived) {
                    avalon.nextTick(function() {
                        vmodel.active = vmodel.tabs.length - 1
                    })
                }
            }
            vm.remove = function(e, index) {
                e.preventDefault()
                e.stopPropagation()
                if (vmodel.tabs[index].disabled === true) {
                    return
                }
                vmodel.tabs.removeAt(index)
                vmodel.tabpanels.removeAt(index)
                index = index > 1 ? index - 1 : 0
                avalon.nextTick(function() {
                    vmodel.active = index
                })
                vm.bottom = options.bottom
            }

            return vm
        })

        if(options.callInit) vmodel.$init()


        if(vmodel.autoSwitch) {
            vmodel.tabs.$watch('length', function(value, oldValue) {
                if(value < 2) {
                    clearTimeout(vmodel.$switchTimer)
                } else {
                    vmodel.$autoSwitch()
                }
            })
            avalon.bind(element, 'mouseenter', function() {
                clearTimeout(vmodel.$switchTimer)
            })
            avalon.bind(element, 'mouseleave', function() {
                clearTimeout(vmodel.$switchTimer)
                vmodel.$autoSwitch()
            })
        }

        return vmodels
    }

    tab.defauts = defautOpt;
})