//avalon 1.2.5 2014.4.2
define(["avalon", "text!./avalon.simplegrid.html"], function(avalon, tmpl) {
    var arr = tmpl.split("MS_OPTION_STYLE") || ["", ""]
    var cssText = arr[1].replace(/<\/?style>/g, "")
    var styleEl = document.getElementById("avalonStyle")
    var template = arr[0]
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }


    var widget = avalon.ui.simplegrid = function(element, data, vmodels) {
        var options = data.simplegridOptions, $element = avalon(element),
                keyupCallback, blurCallback, popup

        options.columns = options.getColumns(options.columns, options)

        options._store = options.getStore(options.store, options)

        options.template = options.getTemplate(template, options)
        if (!options.columnsOrder) {
            var orders = []
            for (var i = 0, el; el = options.columns[i++]; ) {
                orders.push(el.field)
            }
            options.columnsOrder = orders
        }
console.log(options)
        var _vmodels
        var vmodel = avalon.define(data.simplegridId, function(vm) {

            avalon.mix(vm, options)

            vm.$skipArray = ["at", "widgetElement", "store", "template"]
            vm.widgetElement = element

            vm.$init = function() {
                element.innerHTML = options.template
                _vmodels = [vmodel].concat(vmodels)
                avalon.scan(element, _vmodels)

            }
            //得到可视区某一个格子的宽
            vm.getCellWidth = function(name) {
                for (var i = 0, el; el = vm.columns[i++]; ) {
                    if (el.field === name) {
                        return el.width
                    }
                }
            }
            //得到可视区某一个格子的显示隐藏情况
            vm.getCellToggle = function(name) {
                for (var i = 0, el; el = vm.columns[i++]; ) {
                    if (el.field === name) {
                        return el.toggle
                    }
                }
            }
            vm.getColumnsOrder = function() {
                return vm.columnsOrder
            }
        })
        return vmodel

    }
    widget.defaults = {
        //表头的格子的高
        headerHeight: 35,
        columnWidth: 160,
        //纵向滚动条距滚动面板的顶部的距离（滚动面板可理解为可视区）
        srollTop: 0,
        //横向滚动条距滚动面板的左侧的距离（滚动面板可理解为可视区）
        scrollLeft: 0,
        getColumnTitle: function() {
            return ""
        },
        getTemplate: function(tmpl, options) {
            return tmpl
        },
        getStore: function(array, options) {
            return array.concat()
        },
        getColumns: function(array, options) {
            var ret = []
            for (var i = 0, el; el = array[i++]; ) {
                if (typeof el == "string") {
                    el = {
                        field: el
                    }
                }
                el.text = el.text || el.field
                el.title = options.getColumnTitle(el)
                el.width = el.width || options.columnWidth
                el.className = el.className || ""
                el.sortable = !!el.sortable
                el.sortTrend = "asc"
                el.toggle = true
                el.lockDisplay = typeof el.lockDisplay === "boolean" ? el.lockDisplay : false
                el.lockWidth = typeof el.lockWidth === "boolean" ? el.lockWidth : false

                ret.push(el)
            }
            return ret
        }
    }

    return avalon
})
/**
 * 参考链接
 http://www.alidata.org/edp_model/#components|normaltable
 */

