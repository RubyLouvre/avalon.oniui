//avalon 1.3.2 2014.4.2
define(["avalon", "pager/avalon.pager", "text!./avalon.simplegrid.html"], function(avalon, page, tmpl) {

    var arr = tmpl.split("MS_OPTION_STYLE") || ["", ""]
    var cssText = arr[1].replace(/<\/?style>/g, "")
    //添加grid的样式
    var styleEl = document.getElementById("avalonStyle")
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    //拖动时禁止文字被选中，禁止图片被拖动
    var cssText = ".ui-helper-global-drag *{ -webkit-touch-callout: none;" +
            "-khtml-user-select: none;" +
            "-moz-user-select: none;" +
            "-ms-user-select: none;" +
            "user-select: none;}" +
            ".ui-helper-global-drag img{-webkit-user-drag:none; " +
            "pointer-events:none;}"
    if (styleEl.innerHTML.indexOf("ui-helper-global-drag") > 0) {
        try {
            styleEl.innerHTML += cssText;
        } catch (e) {
            styleEl.styleSheet.cssText += cssText;
        }
    }
    //切割出表头与表身的模板
    var template = arr[0], theadTemplate, tbodyTemplate, colTemplate
    template = template.replace(/MS_OPTION_THEAD_BEGIN([\s\S]+)MS_OPTION_THEAD_END/, function(a, b) {
        theadTemplate = b
        return "MS_OPTION_THEAD_HOLDER"
    })
    template = template.replace(/MS_OPTION_TBODY_BEGIN([\s\S]+)MS_OPTION_TBODY_END/, function(a, b) {
        tbodyTemplate = b
        return "MS_OPTION_TBODY_HOLDER"
    })

    var body = document.body || document.documentElement
    var remptyfn = /^function\s+\w*\s*\([^)]*\)\s*{\s*}$/m


    var widget = avalon.ui.simplegrid = function(element, data, vmodels) {
        var options = data.simplegridOptions
        //格式化各列的具体规格
        options.columns = options.getColumns(options.columns, options)
        //允许指定表头与表身的每一行的模板
        makeTemplate(options, "theadTemplate", theadTemplate)
        makeTemplate(options, "tbodyTemplate", tbodyTemplate)
        template = template.replace(/MS_OPTION_THEAD_HOLDER/, options.theadTemplate)
                .replace(/MS_OPTION_TBODY_HOLDER/, options.tbodyTemplate)
                
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)

        //决定每页的行数(分页与滚动模式下都要用到它)
        //<------开始配置分页的参数
        if (typeof options.pager !== "object") {
            options.pager = {}
        }
        var pager = options.pager
        //抽取要显示的数据(因为可能存在分页,不用全部显示,那么我们只将要显示的
        pager.perPages = pager.perPages || options.data.length
        pager.nextText = pager.nextText || "下一页"
        pager.prevText = pager.prevText || "上一页"
        if (Array.isArray(pager.options)) {
            pager.getTemplate = typeof pager.getTemplate === "function" ? pager.getTemplate : function(tmpl) {
                return "<div class='ui-grid-pager-options'>每页显示<select ms-duplex='perPages'><option ms-repeat='options' ms-el.value>{{el.text}}</options></select>条,共{{totalItems}}条结果</div>"
                        + tmpl
            }
        }
        makeBool(pager, "showJumper", true)
        //如果还不满意可以通过getPager方法重写
        options.pager = options.getPager(pager, options)
        //-----结束配置分页的参数--------->
        // 每页真实要显示的行数
        options.showRows = options.showRows || pager.perPages
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
            var newColumns = [], oldColumns = options.columns, elem
            while (el = orders.shift()) {
                label:
                for (var k = 0, kn = oldColumns.length; k < kn; k++) {
                    elem = oldColumns[k]
                    if (elem.field == el) {
                        newColumns.push(elem)
                        oldColumns.splice(k, 1)
                        break label
                    }
                }
            }
            options.columns = newColumns
        }

        var _vmodels

        var vmodel = avalon.define(data.simplegridId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["widgetElement", "data","scrollPanel","topTable", "bottomTable", "startIndex", "pager", "endIndex", "template"]
            vm.widgetElement = element
            vm.gridWidth = "100%"
            vm.startIndex = 0
            vm.endIndex = options.showRows
            vm.$init = function() {
                avalon.ready(function() {
                    element.innerHTML = options.template.replace(/MS_OPTION_ID/g, vmodel.$id)
                    _vmodels = [vmodel].concat(vmodels)
                    avalon.scan(element, _vmodels)
                })

            }

            vm.getRealWidth = function() {
                //位于表头的data-repeat-rendered回调,用于得到table的宽度
                var table = this //这是TR元素
                var cells = this.children//在旧式IE下可能包含注释节点
                var cellIndex = 0
                for (var i = 0, cell; cell = cells[i++]; ) {
                    if (cell.nodeType === 1 && cell["data-vm"]) {
                        vm.columns[cellIndex++].width = cell.offsetWidth
                    }
                }
                while (table.tagName !== "TABLE") {
                    table = table.parentNode
                }
                vm.topTable = table //重置真正的代表表头的table
                vm.scrollPanel = table.parentNode//重置包含两个table的会出现滚动条的容器对象
                vm.gridWidth = Math.min(table.offsetWidth, vm.scrollPanel.offsetWidth)
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
                            //如果出现水平滚动条,那么往高度加17
                            var panel = vm.scrollPanel
                            if (panel.clientWidth < panel.scrollWidth) {
                                vm.tbodyHeight += 17
                            }
                            el.width = cellWidth + e.pageX - startX
                            avalon.unbind(document, "mousemove", moveFn)
                            avalon.unbind(document, "mouseup", upFn)
                        }
                    })
                }

            }
            vm.sortIndex = NaN
            vm.getArrow = function(el, $index) {
                var sortIndex = vm.sortIndex
                var asc = el.sortAsc
                return  $index !== sortIndex ? "ndb" : asc ? "asc" : "desc"
            }
            //如果当前列可以排序，那么点击标题旁边的icon,将会调用此方法
            vm.sortColumn = function(el, $index) {
                vm.sortIndex = $index
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
                        return trend * el.localSort(a, b, field, opts) || 0
                    })
                } else {

                    //否则默认处理
                    vmodel._data.sort(function(a, b) {
                        return trend * (a[field] - b[field]) || 0
                    })
                }
            }

            //得到可视区某一个格子的显示情况,长度,align
            vm.getCellProperty = function(name, prop) {
                for (var i = 0, el; el = vm.columns[i++]; ) {
                    if (el.field === name) {
                        return el[prop]
                    }
                }
            }
            vm.getRowHeight = function(a) {

                var tbody = this, row = tbody.rows[0], cell = row.cells[0]
                //如果使用border-collapse: collapse,可能有一条边的高度被吞掉
                if (cell) {
                    var borderHeight = Math.max(avalon.css(cell, "borderTopWidth", true),
                            avalon.css(cell, "borderBottomWidth", true))
                    var perPages = vm.pager.perPages
                    vm._rowHeight = row.offsetHeight
                    vm._rowHeightNoBorders = vm._rowHeight - borderHeight * 2
                    vm.tbodyHeight = vm._rowHeight * vm.showRows + borderHeight * 2
                    vm.tbodyScrollHeight = vm._rowHeight * perPages
                    //如果同时出现两个滚动条
                    vm.bottomTable = this.parentNode
                    var panel = vm.scrollPanel
                    if (perPages > vm.showRows && panel.clientWidth < panel.scrollWidth) {
                        vm.gridWidth = panel.scrollWidth - 17
                    }


                } else {
                    setTimeout(function() {
                        vmodel.getRowHeight.call(tbody)
                    }, 100)
                }

            }


            vm.throttleRenderTbody = function() {
                vmodel.tbodyScrollTop = this.scrollTop
                cancelAnimationFrame(requestID)
                requestID = requestAnimationFrame(reRenderTbody)
            }

            vm.getColumnsOrder = function() {
                return vm.columnsOrder
            }

            vm.getStore = function(array) {
                return array.slice(vm.startIndex, vm.endIndex)
            }
            vm._data = vm.data.slice(vm.startIndex, vm.endIndex)
        })
        //<-----------开始渲染分页栏----------
        if (vmodel.pageable) {
            var flagPager = false
            var intervalID = setInterval(function() {
                var elem = document.getElementById("pager-" + vmodel.$id)
                if (elem && !flagPager) {
                    elem.setAttribute("ms-widget", "pager,pager-" + vmodel.$id)
                    avalon(elem).addClass("ui-grid-pager-wrapper")
                    avalon.scan(elem, vmodel)
                    flagPager = true
                }
                var pagerVM = avalon.vmodels["pager_" + vmodel.$id]
                if (pagerVM) {
                    vmodel.pager = pagerVM
                    clearInterval(intervalID)
                }
            }, 100)
        }
        //-----------结束渲染分页栏---------->
        //那一部分转换为监控数组就行,这样能大大提高性能)
        var requestID,
                prevScrollTop = 0,
                lastRenderedScrollTop = 0

        function reRenderTbody() {
            var panel = vmodel.scrollPanel
            var scrollTop = panel.scrollTop
            var scrollDir = scrollTop > prevScrollTop ? "down" : "up"
            prevScrollTop = scrollTop
            var distance = Math.abs(lastRenderedScrollTop - scrollTop)
            var rowHeight = vmodel._rowHeight

            if (distance >= vmodel._rowHeightNoBorders) {

                var linage = distance / rowHeight
                var integer = Math.floor(linage)//取得整数部分
                var decimal = linage - integer//取得小数部分
                if (decimal > 0.55) {//四舍五入
                    integer += 1 //要添加或删除的行数
                }
                var length = vmodel.data.length, count = 0
                if (scrollDir === "down") {
                    while (vmodel.endIndex + 1 < length) {
                        vmodel.endIndex += 1
                        vmodel.startIndex += 1
                        count += 1
                        var el = vmodel.data[vmodel.endIndex]

                        vmodel._data.push(el)
                        vmodel._data.shift()
                        if (count === integer) {
                            break
                        }
                    }
                } else {
                    //  console.log("上移 " + integer + "行")
                    while (vmodel.startIndex >= 0) {
                        vmodel.endIndex -= 1
                        vmodel.startIndex -= 1
                        count += 1
                        var el = vmodel.data[vmodel.startIndex]
                        vmodel._data.unshift(el)
                        vmodel._data.pop()
                        if (count === integer) {
                            break
                        }
                    }
                }
                lastRenderedScrollTop = panel.scrollTop = vmodel.tbodyScrollTop = vmodel.startIndex * rowHeight
            }
        }
        return vmodel
    }
    widget.defaults = {
        //表头的格子的高
        theadHeight: 35,
        tbodyRowHeight: 35,
        tbodyScrollHeight: "auto",
        tbodyScrollTop: 0,
        tbodyHeight: "auto",
        _rowHeight: 35, //实际行高,包含border什么的
        _rowHeightNoBorders: 0,
        columnWidth: 160,
        edge: 15,
        _data: [],
        topTable: {},
        bottomTable: {},
        scrollPanel: {},
        pageable: false,
        syncTheadColumnsOrder: true,
        remoteSort: avalon.noop, //远程排数函数
        getColumnTitle: function() {
            return ""
        },
        getTemplate: function(tmpl, options) {
            return tmpl
        },
        getStore: function(array, options) {
            return array.concat()
        },
        getColumn: function(el, options) {
            return el
        },
        getPager: function(pager, options) {
            return pager
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
                options.getColumn(el, options)
                ret.push(el)
            }
            return ret
        }
    }

    var fixUserSelect = function() {
        avalon(body).addClass("ui-helper-global-drag")
    }
    var restoreUserSelect = function() {
        avalon(body).removeClass("ui-helper-global-drag")
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

    //优化scroll事件的回调次数
    var requestAnimationFrame = window.requestAnimationFrame ||
            function(callback) {
                return window.setTimeout(callback, 1000 / 60);
            }
    var cancelAnimationFrame = window.cancelAnimationFrame ||
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
    function makeBool(elem, name, value) {
        value = !!value
        elem[name] = typeof elem[name] === "boolean" ? elem[name] : value
    }

    function makeTemplate(opts, name, value) {
        opts[name] = typeof opts[name] === "function" ? opts[name](value, opts) :
                (typeof opts[name] === "string" ? opts[name] : value)
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

