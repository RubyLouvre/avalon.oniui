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
        if (!Array.isArray(options.columnsOrder)) {
            var orders = []
            for (var i = 0, el; el = options.columns[i++]; ) {
                orders.push(el.field)
            }
            options.columnsOrder = orders
        } else if(options.syncTheadColumnsOrder){
            orders = options.columnsOrder.concat()
            var aaa = [], bbb = options.columns, elem
            while (el = orders.shift()) {
                for (var i = 0, n = bbb.length; i < n; i++) {
                    elem = bbb[i]
                    if (elem.field == el) {
                        aaa.push(elem)
                        bbb.splice(i, 1)
                    }
                }
            }
            options.columns = aaa
        }
        
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
        rowHeight: 35,
        columnWidth: 160,
        pageable: false,
        syncTheadColumnsOrder: true,
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
阿里大数据的UI设计稿
http://www.cnblogs.com/xuxiace/archive/2012/03/07/2383180.html
Onion UI 控件集 
http://wiki.corp.qunar.com/pages/viewpage.action?pageId=49957733
http://wiki.corp.qunar.com/pages/viewpage.action?pageId=49956129
来往
http://m.laiwang.com/market/laiwang/event-square.php?spm=0.0.0.0.Hg4P8X

 ExtJS初级教程之ExtJS Grid(二)

http://blog.csdn.net/letthinking/article/details/6321767

http://wenku.baidu.com/view/2f30e882e53a580216fcfe34.html

http://ued.taobao.org/blog/2013/03/modular-scalable-kissy/
 */

