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
        var options = data.simplegridOptions
//格式化各列的具体规格
        options.columns = options.getColumns(options.columns, options)
//抽取要显示的数据(因为可能存在分页,不用全部显示,那么我们只将要显示的
//那一部分转换为监控数组就行,这样能大大提高性能)
        options._store = options.getStore(options.store, options)
//方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
//如果没有指定各列的出现顺序,那么将按用户定义时的顺序输出
        if (!Array.isArray(options.columnsOrder)) {
            var orders = []
            for (var i = 0, el; el = options.columns[i++]; ) {
                orders.push(el.field)
            }
            options.columnsOrder = orders
        } else if (options.syncTheadColumnsOrder) {
            //如果用户指定columnsOrder,那么要对columns进行重排
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
        var remptyfn = /^function\s+\w*\s*\([^)]*\)\s*{\s*}$/m
        var _vmodels
        var vmodel = avalon.define(data.simplegridId, function(vm) {

            avalon.mix(vm, options)

            vm.$skipArray = ["widgetElement", "store", "template"]
            vm.widgetElement = element

            vm.$init = function() {
                element.innerHTML = options.template
                _vmodels = [vmodel].concat(vmodels)
                avalon.scan(element, _vmodels)

            }
            //如果当前列可以排序，那么点击标题旁边的icon,将会调用此方法
            vm.sortColumn = function(el) {
                var trend = el.sortAsc = !el.sortAsc
                var field = el.field
                var opts = vmodel.$model
                trend = trend ? 1 : -1
                if (typeof opts.remoteSort === "function" && !remptyfn.test( opts.remoteSort)) {
                    //如果指定了回调函数,通过服务器端进行排数,那么能回调传入当前字段,状态,VM本身及callback
                    function callback() {
                        vmodel._store = opts.getStore(opts.store, opts)
                    }
                    vmodel.remoteSort(field, trend, opts, callback)
                } else if (typeof el.localSort === "function" && !remptyfn.test(el.localSort )) {// !isEmptyFn(el.localSort)
                    //如果要在本地排序,并且指定排数函数
                    vmodel._store.sort(function(a, b) {
                        return trend * el.localSort(a, b, field, opts)
                    })
                } else {
                    //否则默认处理
                    vmodel._store.sort(function(a, b) {
                        return trend * (a[field] - b[field])
                    })
                }
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
        remoteSort: avalon.noop,//远程排数函数
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
                //如果是字符串数组转换为对象数组,原来的值变成新对象的field属性
                if (typeof el === "string") {
                    el = {
                        field: el
                    }
                }//field用于关联store中的字段
                el.text = el.text || el.field//真正在表格里显示的内容
                el.title = options.getColumnTitle(el)//当前当元素格的title属性
                el.width = el.width || options.columnWidth//指定宽度,可以是百分比
                el.className = el.className || ""//当前当元素格添加额外类名
                el.align = el.align || "" //赋给align属性,表示是对齐方向 left, right, center
                el.localSort = typeof el.localSort === "function" ? el.localSort : false//当前列的排序函数
                makeBool(el, "sortable", true)//能否排序
                makeBool(el, "sortAsc", true)//排序方向
                makeBool(el, "toggle", true)//是否显示当前列
                makeBool(el, "disabledToggle")//禁止改变当前列的显示状态
                makeBool(el, "disabledResize")//禁止改变当前列的宽度
                ret.push(el)
            }
            return ret
        }
    }
    function makeBool(el, prop, val) {
        val = !!val
        el[prop] = typeof el[prop] === "boolean" ? el[prop] : val
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
 
 http://gist.corp.qunar.com/jifeng.yao/gist/demos/pager/pager.html
 */

