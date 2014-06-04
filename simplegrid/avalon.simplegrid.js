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


    var styleEl = document.createElement("style")
    var body = document.body || document.documentElement

    var cssText = "*{ -webkit-touch-callout: none!important;-webkit-user-select: none!important;-khtml-user-select: none!important;" +
            "-moz-user-select: none!important;-ms-user-select: none!important;user-select: none!important;}"
    var fixUserSelect = function() {
        body.appendChild(styleEl)
        //如果不插入DOM树，styleEl.styleSheet为null
        if (typeof styleEl.styleSheet === "object") {
            styleEl.styleSheet.cssText = cssText
        } else {
            styleEl.appendChild(document.createTextNode(cssText))
        }
    }
    var restoreUserSelect = function() {
        try {
            styleEl.innerHTML = ""
        } catch (e) {
            styleEl.styleSheet.cssText = ""
        }
        body.removeChild(styleEl)
    }
    if (window.VBArray && !("msUserSelect" in document.documentElement.style)) {
        var _ieSelectBack;//fix IE6789
        function returnFalse(event) {
            event.returnValue = false
        }
        fixUserSelect = function() {
            _ieSelectBack = body.onselectstart;
            body.onselectstart = returnFalse;
        }
        restoreUserSelect = function() {
            body.onselectstart = _ieSelectBack;
        }
    }



    var widget = avalon.ui.simplegrid = function(element, data, vmodels) {
        var options = data.simplegridOptions
        //格式化各列的具体规格
        options.columns = options.getColumns(options.columns, options)
        //抽取要显示的数据(因为可能存在分页,不用全部显示,那么我们只将要显示的
        options._data = options.getStore(options.data, options)
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        //决定每页的行数(分页与滚动模式下都要用到它)
        options.perPages = options.perPages || options.data.length
        //每页真实要显示的行数
        options.showRows = options.showRows || options.perPages
        // data.length >= perPages >= showRows

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

            vm.$skipArray = ["widgetElement", "data", "template"]
            vm.widgetElement = element

            vm.$init = function() {
                element.innerHTML = options.template.replace(/MS_OPTION_ID/g, vmodel.$id)
                _vmodels = [vmodel].concat(vmodels)
                avalon.scan(element, _vmodels)
            }
            vm.gridWidth = "100%"
            vm.getRealWidth = function() {
                //位于表头的data-repeat-rendered回调,用于得到table的宽度
                var table = this //这是TR元素
                var cells = this.children
                for (var i = 0, cell; cell = cells[i]; i++) {
                    vm.columns[i].width = cell.offsetWidth
                }
                while (table.tagName !== "TABLE") {
                    table = table.parentNode
                }
                vm.gridWidth = table.offsetWidth
            }
            vm.startResize = function(e, el) {
                //当移动到表头的右侧,改变光标的形状,表示它可以拖动改变列宽
                if (options._drag || !el.resizable)
                    return
                var cell = avalon(this)
                var dir = getDirection(e, cell, options)
                options._cursor = cell.css("cursor") //保存原来的光标样式
                if (dir === "") {
                    options.canResize = false
                    cell.css("cursor", "default")
                } else {
                    options.canResize = cell
                    cell.css("cursor", dir + "-resize")//改变光标
                }
            }

            vm.stopResize = function() {
                if (options.canResize) {
                    options.canResize.css("cursor", options._cursor); //还原光标样式
                    delete options.canResize
                }
            }
            //通过拖动改变列宽
            vm.resizeColumn = function(e, el) {
                var cell = options.canResize
                if (cell) {//只有鼠标进入可拖动区域才能拖动
                    if (typeof el.width !== "number") {
                        el.width = cell[0].offsetWidth
                    }
                    var cellWidth = el.width
                    var startX = e.pageX
                    options._drag = true
                    fixUserSelect()

                    var gridWidth = vm.gridWidth
                    var moveFn = avalon.bind(document, "mousemove", function(e) {
                        if (options._drag) {
                            e.preventDefault()
                            var change = e.pageX - startX
                            vm.gridWidth = gridWidth + change
                            el.width = cellWidth + change
                        }
                    })

                    var upFn = avalon.bind(document, "mouseup", function(e) {
                        e.preventDefault()
                        if (options._drag) {
                            restoreUserSelect()
                            delete options._drag
                            vm.gridWidth = gridWidth + e.pageX - startX
                            el.width = cellWidth + e.pageX - startX
                            avalon.unbind(document, "mousemove", moveFn)
                            avalon.unbind(document, "mouseup", upFn)
                        }
                    })
                }

            }
            //如果当前列可以排序，那么点击标题旁边的icon,将会调用此方法
            vm.sortColumn = function(el) {
                var trend = el.sortAsc = !el.sortAsc
                var field = el.field
                var opts = vmodel.$model
                trend = trend ? 1 : -1
                if (typeof opts.remoteSort === "function" && !remptyfn.test(opts.remoteSort)) {
                    //如果指定了回调函数,通过服务器端进行排数,那么能回调传入当前字段,状态,VM本身及callback
                    function callback() {
                        vmodel._data = opts.getStore(opts.data, opts)
                    }
                    vmodel.remoteSort(field, trend, opts, callback)
                } else if (typeof el.localSort === "function" && !remptyfn.test(el.localSort)) {// !isEmptyFn(el.localSort)
                    //如果要在本地排序,并且指定排数函数
                    vmodel._data.sort(function(a, b) {
                        return trend * el.localSort(a, b, field, opts)
                    })
                } else {
                    //否则默认处理
                    vmodel._data.sort(function(a, b) {
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
            vm.getRowHeight = function() {
                vm._rowHeight = this.rows[0].offsetHeight
                vm.tbodyHeight = vm._rowHeight * vm.showRows + avalon.css(this.parentNode, "borderTopWidth", true) * 3
                vm.tbodyScrollHeight = vm._rowHeight * vm.perPages
                if (vm.showRows !== vm.perPages) {
                    var target = this
                    while (target.className.indexOf("ui-grid-tbody-wrapper") === -1) {
                        target = target.parentNode
                    }
                    target.style.overflowY = "scroll"
                }

            }
            vm.throttleRenderTbody = function() {

                vmodel.tbodyScrollTop = this.scrollTop
                cancelAnimationFrame(requestID)
                wrapper = this
                requestID = requestAnimationFrame(reRenderTbody)
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
        //那一部分转换为监控数组就行,这样能大大提高性能)
        //vmodel._data = vmodel.getStore(vmodel.data, vmodel)
        var requestID,
                wrapper,
                prevScrollTop = 0,
                lastRenderedScrollTop = 0,
                startIndex = 0,
                endIndex = vmodel.showRows
        var reRenderTbody = function() {
            var scrollTop = wrapper.scrollTop
            var scrollDir = scrollTop > prevScrollTop ? "down" : "up"
            prevScrollTop = scrollTop
            var distance = Math.abs(lastRenderedScrollTop - scrollTop)
            if (distance >= vmodel._rowHeight) {
                var linage = distance / vmodel._rowHeight
                var integer = Math.floor(linage)//取得整数部分
                var decimal = linage - integer//取得小数部分
                if (decimal > 0.55) {//四舍五入
                    integer += 1 //要添加或删除的行数
                }

                var length = vmodel.data.length, count = 0
                if (scrollDir === "down") {
                    //    console.log("下拉 " + integer + "行")
                    while (endIndex < length) {
                        endIndex += 1
                        startIndex += 1
                        count += 1
                        var el = vmodel.data[endIndex]
                        vmodel._data.push(el)
                        vmodel._data.shift()
                        if (count === integer) {
                            break
                        }
                    }
                } else {
                    //  console.log("上移 " + integer + "行")
                    while (startIndex >= 0) {
                        endIndex -= 1
                        startIndex -= 1
                        count += 1
                        var el = vmodel.data[startIndex]
                        vmodel._data.unshift(el)
                        vmodel._data.pop()
                        if (count === integer) {
                            break
                        }
                    }
                }
                lastRenderedScrollTop = wrapper.scrollTop = vmodel.top = startIndex * trHeight
            }
        }
        return vmodel
    }
    widget.defaults = {
        //表头的格子的高
        headerHeight: 35,
        rowHeight: 35,
        _rowHeight: 35, //实际行高,包含border什么的
        columnWidth: 160,
        edge: 15,
        perPage: "", //默认不分页,
        pageable: false,
        currentPage: 0,
        gridWrapperElement: {},
        syncTheadColumnsOrder: true,
        remoteSort: avalon.noop, //远程排数函数
        getColumnTitle: function() {
            return ""
        },
        tbodyScrollHeight: "auto",
        tbodyScrollTop: 0,
        tbodyHeight: "auto",
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
                }//field用于关联data中的字段
                el.text = el.text || el.field//真正在表格里显示的内容
                el.title = options.getColumnTitle(el)//当前当元素格的title属性
                el.width = el.width || options.columnWidth//指定宽度,可以是百分比
                el.className = el.className || ""//当前当元素格添加额外类名
                el.align = el.align || "" //赋给align属性,表示是对齐方向 left, right, center
                el.localSort = typeof el.localSort === "function" ? el.localSort : false//当前列的排序函数
                makeBool(el, "sortable", true)//能否排序
                makeBool(el, "resizable", false)//能否改变列宽
                makeBool(el, "sortAsc", true)//排序方向
                makeBool(el, "toggle", true)//是否显示当前列
                makeBool(el, "disabledToggle")//禁止改变当前列的显示状态
                makeBool(el, "disabledResize")//禁止改变当前列的宽度
                ret.push(el)
            }
            return ret
        }
    }


    //优化scroll事件的回调次数
    var requestAnimationFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                return window.setTimeout(callback, 1000 / 60);
            }
    var cancelAnimationFrame = window.cancelAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelAnimationFrame ||
            function(id) {
                clearTimeout(id)
            }

    //得到移动的方向
    function getDirection(e, target, data) {
        var dir = "";
        var offset = target.offset();
        var width = target[0].offsetWidth;
        var edge = data.edge;
        if (e.pageX < offset.left + width && e.pageX > offset.left + width - edge) {
            dir = "e";
        }
        return dir === "e" ? dir : ""
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
 //http://www.datatables.net/
 各种UI的比例
 http://www.cnblogs.com/xuanye/archive/2009/11/04/1596244.html
 jQueryUI theme体系调研 http://hi.baidu.com/ivugogo/item/605795f7a5c27a1ea62988e4?qq-pf-to=pcqq.discussion
 */

