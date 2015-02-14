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
                getTemplate: function(tmp) {
                    return tmp.replace('ms-visible="toggle||multiple">', "$&<input ms-widget='textbox' ms-css-width='{{listWidth-12}}' ms-duplex='_search' ms-keydown='_keydown'/>")
                },
                onShow: function() {
                    vmodel.searchBox.widgetElement.focus()
                },
                onInit: function(dropdown) {
                    vmodel.$watch('_search', function(val) {
                        var data = dropdown.data,
                            groups = {},
                            _groups = [],
                            searchItem = false,
                            groupLabel = '',
                            group = {},
                            activeIndexInvalidate = false

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
                            if (!group.t) {
                                for (var i = 0, len = data.length; i < len; i++) {
                                    var item = data[i]
                                    if (item.group && item.label == _group) {
                                        item.toggle = false
                                    }
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
                }
            }

        options.textbox = avalon.mix(options.textbox, textboxConfig)
        options.dropdown = avalon.mix(options.dropdown, dropdownConfig)

        // options.template = options.getTemplate(sourceHTML)
        var vmodel = avalon.define(data.dropdownlistId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "data", "textbox", "dropdown", "searchBox"]
            vm.searchBox = null
            vm._search = ""
            // @config 绑定组件的元素引用
            vm.widgetElement = element

            vm.$init = function() {
                $element.addClass('oni-dropdownlist')
                $element.attr('ms-widget', ['dropdown', '$', 'dropdown'].join())
                avalon.scan(element, [vmodel].concat(vmodels))
            }
            vm.$remove = function() {

            }

        });
        return vmodel
    }
    widget.version = 1.0
    widget.defaults = {
        data: [], // @config搜索源
        limit: 10, // @config显示条数，超过限制出滚动条
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
 @links
 [dropdownlist demo](avalon.dropdownlist.ex1.html)
 [render重新渲染搜索列表源](avalon.dropdownlist.ex2.html)
 */
// 参考http://demos.telerik.com/kendo-ui/dropdownlist/serverfiltering