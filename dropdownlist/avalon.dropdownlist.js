// avalon 1.3.6
/**
 * @cnName 下拉提示搜索框
 * @enName dropdownlist
 * @introduce
 *    <p>dropdownlist使得可以通过下拉搜索功能减少显示内容，方便用户查找选择</p>
 */
define(["../textbox/avalon.textbox.js", "../dropdown/avalon.dropdown.js", "css!./avalon.dropdownlist.css"], function(avalon) {

    var widget = avalon.ui.dropdownlist = function(element, data, vmodels) {
        var options = data.dropdownlistOptions,
            $element = avalon(element),
            textboxConfig = {
                getTemplate: function(tmp) {
                    return tmp.replace(/MS_OPTION_ICON/, '<i class="oni-icon oni-textbox-icon" ms-visible="textboxToggle">&#xf002;</i>')
                },
                onInit: function(textbox) {
                    vmodel.searchBox = textbox
                }
            },
            dropdownConfig = {
                realTimeData: options.realTimeData,
                enable: options.enable,
                getTemplate: function(tmp) {
                    return tmp.replace('ms-visible="toggle||multiple">', "ms-visible='toggle||multiple'><input ms-widget='textbox' ms-css-width='{{listWidth-12}}' ms-duplex='_search' ms-keydown='_keydown' ms-attr-placeholder='placeholder'/>")
                },
                onShow: function() {
                    vmodel.searchBox.widgetElement.focus()
                },
                onInit: function(dropdown) {
                    vmodel.dropdown = dropdown
                    vmodel.$watch('_search', function(val) {
                        var data = dropdown.data,
                            groups = {},
                            _groups = [],
                            searchItem = false,
                            groupLabel = '',
                            group = {},
                            activeIndexInvalidate = false

                        if (vmodel.realTimeData) {
                            vmodel.getRealTimeData(val, vmodel)
                            return
                        }

                        activeIndexInvalidate = data[dropdown.activeIndex].label.toLowerCase().indexOf(val) == -1

                        data.forEach(function(item, index) {
                            searchItem = item.label.toLowerCase().indexOf(val) != -1
                            if (!item.group) {
                                
                                if (item.parent) {
                                    groupLabel = item.parent.label
                                    if (!groups[groupLabel]) {
                                        groups[groupLabel] = group = {t: 0}    
                                    } else {
                                        group = groups[groupLabel]
                                    }
                                    
                                    if (searchItem) {
                                        group.t += 1
                                        if (activeIndexInvalidate) {
                                            dropdown.value = item.value
                                            dropdown.activeIndex = index
                                            activeIndexInvalidate = false
                                        }
                                        item.toggle = true
                                    } else {
                                        item.toggle = false
                                    }
                                } else if (!searchItem) {
                                    item.toggle = false
                                } else {
                                    item.toggle = true
                                    if (activeIndexInvalidate) {
                                        dropdown.value = item.value
                                        dropdown.activeIndex = index
                                        activeIndexInvalidate = false
                                    }
                                }
                            }
                        })
                        _groups = Object.keys(groups)
                        _groups.forEach(function(group, index) {
                            var _group = group
                            group = groups[_group]
                            for (var i = 0, len = data.length; i < len; i++) {
                                var item = data[i]
                                if (item.group && item.label == _group) {
                                    if (!group.t) {
                                        item.toggle = false
                                    } else {
                                        item.toggle = true
                                    }
                                    break
                                }
                            }
                        })
                        if (dropdown.toggle) {
                            dropdown._styleFix(true)
                        }
                    })
                    dropdown.$watch('toggle', function(val) {
                        if (!val) {
                            vmodel._search = ''
                        }
                    })
                    vmodel.$watch('_dataRerender', function() {
                        dropdown.activeIndex = 0
                        dropdown.render(vmodel.data)
                    })
                    vmodel.$watch('enable', function(val) {
                        dropdown.enable = val
                    })
                }
            }

        options.textbox = avalon.mix(options.textbox, textboxConfig)
        options.dropdown = avalon.mix(options.dropdown, dropdownConfig)
        options.dropdown.data = options.data
        var vmodel = avalon.define(data.dropdownlistId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["widgetElement", "data", "textbox", "dropdown", "searchBox", "realTimeData"]
            vm.searchBox = null //@config 搜索框对应的VM
            vm._search = ""
            vm._dataRerender = false
            /**
             * @config 获取选项值
             * @returns {String} 选项值
             */
            vm.getSelected = function() {
                return vmodel.dropdown.value
            }
            /**
             * @config 重新渲染搜索选项列表
             * @param data {Array} 选项列表，必传
             */
            vm.render = function(data) {
                if (data === void 0) {
                    return
                }
                vmodel.data = data
                vmodel._dataRerender = !vmodel._dataRerender
            }
            // @config 绑定组件的元素引用
            vm.widgetElement = element
            vm.$init = function() {
                $element.addClass('oni-dropdownlist')
                $element.attr('ms-widget', ['dropdown', '$', 'dropdown'].join())
                avalon.scan(element, [vmodel].concat(vmodels))
            }
        });
        return vmodel
    }
    widget.version = 1.0
    widget.defaults = {
        placeholder: '', //@config 搜索框的占位符
        realTimeData: false, //@config 是否动态的从远程获取数据
        enable: true, //@config 是否禁用组件
        /**
         * @config 当需要实时获取搜索数据时设置realTimeData为true，组件就会调用此方法来实时渲染搜索列表
         * @param search {String} 搜索内容
         * @param dropdownlist {Object} 组件对应的VM
         */
        getRealTimeData: function(search, dropdownlist) {
            dropdownlist.render()
        },
        /**
         * @config 模板函数,方便用户自定义模板
         * @param tmp {String} 默认模板
         * @param opts {Object} vmodel
         * @returns {String} 新模板
         */
        getTemplate: function(tmp, opts) {
            return tmp
        }
    }
    return avalon
})

 /**
  *  @other
<p>dropdownlist组件继承于dropdown组件,因此许多参数请参考dropdown</p>
<p>我们可以通过dropdownVm.value得到当前选中项的value值,
也可以通过dropdownVm.getSelected()得到当前选中项的value值
此外，我们也可能通过dropdownVm.activeIndex得到当前选中项的对应的索引值</p>
*/

// 功能参考：http://select2.github.io/examples.html
/**
 @links
 [使用html配置dropdownlist组件](avalon.dropdownlist.ex1.html)
 [使用data配置dropdownlist组件](avalon.dropdownlist.ex2.html)
 [使用data分组配置dropdownlist组件](avalon.dropdownlist.ex3.html)
 [通过搜索条件实时获取选项列表](avalon.dropdownlist.ex4.html)
 [禁用dropdownlist](avalon.dropdownlist.ex5.html)
 [获取选项值](avalon.dropdownlist.ex6.html)
 */
// 参考http://demos.telerik.com/kendo-ui/dropdownlist/serverfiltering
