//avalon 1.2.5 2014.4.2
define(["avalon", "text!./avalon.simplegrid.html"], function(avalon, tmpl) {
    var arr = tmpl.split("MS_OPTION_STYLE")
    var cssText = arr[1].replace(/<\/?style>/g, "")
    var styleEl = document.getElementById("avalonStyle")
    var popupHTML = arr[0]
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }
    function makeColumns(array, options) {
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
    var widget = avalon.ui.simplegrid = function(element, data, vmodels) {
        var options = data.simplegridOptions, $element = avalon(element), keyupCallback, blurCallback, popup

        options.columns = makeColumns(options.columns, options)

        var lastModified = new Date - 0//上次更新时间
        var vmodel = avalon.define(data.simplegridId, function(vm) {

            avalon.mix(vm, options)

            vm.$skipArray = ["at", "widgetElement", "datalist", "popupHTML"]
            vm.widgetElement = element
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
        }
    }

    return avalon
})
/**
 * 参考链接
 http://www.alidata.org/edp_model/#components|normaltable
 */

