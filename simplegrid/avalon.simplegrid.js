//avalon 1.3.2 2014.4.2
define(["avalon",
    "text!./avalon.simplegrid.html",
    "../pager/avalon.pager",
    "../dropdown/avalon.dropdown",
    "../loading/avalon.loading",
    "../scrollbar/avalon.scrollbar",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.simplegrid.css"
], function(avalon, tmpl) {

    //切割出表头与表身的模板
    var gridTemplate = tmpl, theadTemplate, tbodyTemplate
    gridTemplate = gridTemplate.replace(/MS_OPTION_THEAD_BEGIN([\s\S]+)MS_OPTION_THEAD_END/, function(a, b) {
        theadTemplate = b
        return "MS_OPTION_THEAD_HOLDER"
    })
    gridTemplate = gridTemplate.replace(/MS_OPTION_TBODY_BEGIN([\s\S]+)MS_OPTION_TBODY_END/, function(a, b) {
        tbodyTemplate = b
        return "MS_OPTION_TBODY_HOLDER"
    })

    var body = document.body || document.documentElement
    var remptyfn = /^function\s+\w*\s*\([^)]*\)\s*{\s*}$/m

    var widget = avalon.ui.simplegrid = function(element, data, vmodels) {
        var options = data.simplegridOptions,
                optId = +(new Date()),
                scrollbarTimer
        //格式化各列的具体规格
        options.columns = options.getColumns(options.columns, options)

        //允许指定表头与表身的每一行的模板
        makeTemplate(options, "theadTemplate", theadTemplate)
        makeTemplate(options, "tbodyTemplate", tbodyTemplate)
        var template = gridTemplate.replace(/MS_OPTION_THEAD_HOLDER/, options.theadTemplate)
                .replace(/MS_OPTION_TBODY_HOLDER/, options.tbodyTemplate)

        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options).replace(/\{\{MS_OPTION_ID\}\}/g, optId)
        //决定每页的行数(分页与滚动模式下都要用到它)
        //<------开始配置分页的参数
        if (typeof options.pager !== "object") {
            options.pager = {}
        } else {
            options.pageable = true
        }
        var pager = options.pager
        //抽取要显示的数据(因为可能存在分页,不用全部显示,那么我们只将要显示的
        pager.perPages = options.pageable ? pager.perPages || options.data.length : options.data.length
        pager.nextText = pager.nextText || "下一页"
        pager.prevText = pager.prevText || "上一页"
        
        if (Array.isArray(pager.options)) {
            pager.getTemplate = typeof pager.getTemplate === "function" ? pager.getTemplate : function(tmpl) {
                return tmpl + '<div class="oni-simplegrid-pager-options">每页显示<select ms-widget="dropdown" data-dropdown-list-width="50" data-dropdown-width="50" ms-duplex="perPages"><option ms-repeat="options" ms-value="el.value">{{el.text}}</option></select>条,共{{totalItems}}条结果</div>'
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
        var loadingOpts = {
            toggle: false,
            onInit: function(vm, options, vmodels) {
                vmodel.loadingVModel = vm;
            }
        }
        options.loading = avalon.type(options.loading) === "object" ? avalon.mix(options.loading, loadingOpts) : loadingOpts
        var vmodel = avalon.define(data.simplegridId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["_init", "widgetElement", "data", "addColumnCallbacks", "scrollPanel", "topTable", "bottomTable", "startIndex", "pager", "endIndex", "template", "loading", "loadingVModel", "rootElement"]
            vm.loadingVModel = null
            vm.widgetElement = element
            vm.rootElement = ""
            vm.gridWidth = "100%"
            vm.startIndex = 0
            vm.endIndex = options.showRows
            vm.cssLeft = "0"
            vm.barRight = 0
            vm.scrollerHeight = void 0
            vm.paddingBottom = "0"
            vm.barUpdated = false
            vm._data = []
            vm._init = true
            vm.$init = function() {
                avalon.ready(function() {
                    element.innerHTML = options.template.replace(/MS_OPTION_ID/g, vmodel.$id)
                    _vmodels = [vmodel].concat(vmodels)
                    vm.rootElement = element.getElementsByTagName("*")[0]
                    avalon.scan(element, _vmodels)
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                })
            }

            vm._theadRenderedCallback = function() {
                var fns = getHiddenParent(vm.widgetElement)
                fns[0]()

                //位于表头的data-repeat-rendered回调,用于得到table的宽度
                var tr = this //这是TR元素
                var tbody = this.parentNode//tbody
                var table = tbody.parentNode//table
                var cells = tr.children//在旧式IE下可能包含注释节点
                var cellIndex = 0
                for (var i = 0, cell; cell = cells[i++]; ) {
                    if (cell.nodeType === 1 && cell["data-vm"]) {
                        var c = vm.columns[cellIndex++]
                        if (String(c.width).indexOf("%") === -1) {
                            c.width = cell.offsetWidth
                        }
                    }
                }
                vm.topTable = table //重置真正的代表表头的table
                vm.theadHeight = avalon(table).innerHeight()
                vm.scrollPanel = table.parentNode.parentNode//重置包含两个table的会出现滚动条的容器对象

                vm.gridWidth = Math.min(table.offsetWidth, vm.scrollPanel.offsetWidth) + 1
                fns[1]()
                vm.theadRenderedCallback.call(tbody, vmodel, options, vmodels)
            }
            vm._tbodyRenderedCallback = function(a) {
                //取得tbody每一行的高
                var tbody = this
                function delay() {
                    var cell = tbody.getElementsByTagName("td")[0] ||
                            tbody.getElementsByTagName("th")[0]
                    var fns = getHiddenParent(vm.widgetElement)
                    fns[0]()
                    var table = vm.bottomTable = tbody.parentNode;
                    var noResultHeight = !vmodel._data.size() ? vmodel.noResultHeight : 0;
                    //求出可见区的总高度
                    vm.tbodyHeight = avalon(table).innerHeight() + noResultHeight
                    //取得总行数,以免行数为0时, vm.tbodyHeight / rowCount 得出Infinite
                    var rowCount = tbody.rows.length
                    //求出每一行的高
                    vm._rowHeight = rowCount ? vm.tbodyHeight / rowCount : 35
                    //根据是否分页, 求得每页的行数
                    var perPages = vm.pageable ? vm.pager.perPages : vm.data.length
                    vm.tbodyScrollHeight = vm._rowHeight * perPages
                    var borderHeight = cell ? Math.max(avalon.css(cell, "borderTopWidth", true),
                            avalon.css(cell, "borderBottomWidth", true)) : 0
                    vm._rowHeightNoBorders = vm._rowHeight - borderHeight * 2
                    fns[1]()
                    vm.tbodyRenderedCallback.call(tbody, vmodel, options, vmodels)
                    // update scrollbar, if tbody rendered
                    setTimeout(function() {
                        vmodel.updateScrollbar(!vmodel.barUpdated)
                        vmodel.barUpdated = true
                    })

                }
                //如果使用border-collapse: collapse,可能有一条边的高度被吞掉
                setTimeout(delay, 100)
            }

            //::loading相关::
            vm.showLoading = function() {
                vmodel.loadingVModel.toggle = true;
            }
            vm.hideLoading = function() {
                vmodel.loadingVModel.toggle = false;
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
                    // update scrollbar, after resize end
                    vmodel.updateScrollbar("forceUpdate")
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
                            // update scrollbar while table size changed right now
                            vmodel.updateScrollbar("forceUpdate")
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
                    vmodel.remoteSort(field, trend, vmodel)
                } else if (typeof el.localSort === "function" && !remptyfn.test(el.localSort)) {// !isEmptyFn(el.localSort)
                    //如果要在本地排序,并且指定排数函数
                    vmodel._data.sort(function(a, b) {
                        return trend * el.localSort(a, b, field, opts) || 0
                    })
                    if (typeof vmodel.onSort === "function") {
                        setTimeout(function() {
                            vmodel.onSort(vmodel)
                        }, 500)
                    }
                } else {
                    //否则默认处理
                    vmodel._data.sort(function(a, b) {
                        return trend * (a[field] - b[field]) || 0
                    })
                }
            }
            //得到要渲染出来的列的名字的数组
            vm.getColumnsOrder = function() {
                return vm.columnsOrder
            }
            //在指定列的位置添加一列
            vm.addColumn = function(obj, i) {
                var el = options.getColumns([obj], vm)[0]
                var field = el.field
                if (vm.columnsOrder.indexOf(field) === -1) {
                    var index = parseInt(i, 10) || 0
                    var defaultValue = el.defaultValue || ""
                    vm.columns.splice(index, 0, el)
                    vm.columnsOrder.splice(index, 0, field)
                    vm.addColumnCallbacks[field] = function(array) {
                        array.forEach(function(elem) {
                            if (!elem.hasOwnProperty(field)) {
                                elem[field] = defaultValue
                            }
                        })
                    }
                }
                vm.reRender(vm.data, vm)
            }

            //得到可视区某一个格子的显示情况,长度,align
            vm.getCellProperty = function(name, prop) {
                for (var i = 0, el; el = vm.columns[i++]; ) {
                    if (el.field === name) {
                        return el[prop]
                    }
                }
            }

            //重新渲染表身
            vm.throttleRenderTbody = function(n, o) {
                vmodel.tbodyScrollTop = n
                cancelAnimationFrame(requestID)
                requestID = requestAnimationFrame(function() {
                    reRenderTbody(n, o)
                })
            }
            //::与滚动条相关::计算滚动条的高
            vm.getScrollerHeight = function() {
                var h = vmodel.tbodyScrollHeight + vmodel.tbodyScrollTop - vmodel.theadHeight,
                        max = vmodel._rowHeight * vmodel.data.length
                // 设置一个上限，修复回滚bug
                h = h > max ? max : h
                // until change is applied to element, change scrollerHeight
                setTimeout(function(loop) {
                    var _h = vmodel.getScrollbar().getScroller().css("height")
                    if (h != _h && !loop) {
                        arguments.callee(1)
                        return
                    }
                    vmodel.scrollerHeight = h
                }, 100)
                return h
            }

            //::与滚动条相关:: 滚动条的相关配置项
            vm.$spgScrollbarOpts = {
                onScroll: function(n, o, dir) {
                    // 竖直方向滚动
                    if (dir == "v") {
                        clearTimeout(scrollbarTimer)
                        scrollbarTimer = setTimeout(function() {
                            vmodel.throttleRenderTbody(n, o)
                        }, 16)
                    // 水平方向
                    } else {
                        vmodel.cssLeft = n == void 0 ? "auto" : -n + "px"
                    }
                },
                //::与滚动条相关::得到表身的高?
                // 计算滚动视图区的高度，表格这边由于表头是不参与滚动的，所有视图区域高度是表格高度 - 表头高度
                viewHeightGetter: function(ele) {
                    return ele.innerHeight() - vmodel.theadHeight
                },
                show: vm.showScrollbar
            }
            vm.getScrollbar = function() {
                return avalon.vmodels["$simplegrid" + optId]
            }
            // update scrollbar
            //     var scrollbarInited
            vm.updateScrollbar = function(force) {
                if (!force)
                    return
                var scrollbar = vmodel.getScrollbar(),
                        scroller = scrollbar.getScroller()
                if (scrollbar) {
                    scrollbar.update()
                }
            }
            vm.$watch("showRows", function(rows) {
                vmodel.endIndex = rows
            })
        })


        vmodel._data = vmodel.getStore(vmodel.data, vmodel)//.data.slice(vm.startIndex, vm.endIndex)
        //<-----------开始渲染分页栏----------
        if (vmodel.pageable) {
            var flagPager = false
            var intervalID = setInterval(function() {
                var elem = document.getElementById("pager-" + vmodel.$id)
                if (elem && !flagPager) {

                    elem.setAttribute("ms-widget", "pager,pager-" + vmodel.$id)
                    avalon(elem).addClass("oni-simplegrid-pager-wrapper")
                    avalon.scan(elem, vmodel)
                    flagPager = true
                }
                var pagerVM = avalon.vmodels["pager-" + vmodel.$id]
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

        function reRenderTbody(n, o) {
            // 不再读取scrollTop
            // var panel = vmodel.scrollPanel
            // var scrollTop = panel.scrollTop
            var scrollTop = n
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
                var length = vmodel.data.length, count = 0, showRows = vmodel.showRows
                if (scrollDir === "down") {
                    while (vmodel.endIndex + 1 < length) {
                        vmodel.endIndex += 1
                        vmodel.startIndex += 1
                        count += 1
                        var el = vmodel.data[vmodel.endIndex]
                        // 优化，避免过度操作_data
                        if (integer - count <= showRows) {
                            vmodel._data.push(el)
                            vmodel._data.shift()
                        }
                        if (count === integer) {
                            break
                        }
                    }
                } else {
                    while (vmodel.startIndex >= 0) {
                        vmodel.endIndex -= 1
                        vmodel.startIndex -= 1
                        count += 1
                        var el = vmodel.data[vmodel.startIndex]

                        // 优化，避免过度操作_data
                        if (integer - count <= showRows) {
                            vmodel._data.unshift(el)
                            vmodel._data.pop()
                        }
                        if (count === integer) {
                            break
                        }
                    }
                }
                // 不在设置panel的scrollTop
                lastRenderedScrollTop = vmodel.tbodyScrollTop = vmodel.startIndex * rowHeight
                // lastRenderedScrollTop = panel.scrollTop = vmodel.tbodyScrollTop = vmodel.startIndex * rowHeight
            }
        }
        // 监听这个改变更靠谱
        vmodel.$watch("scrollerHeight", function(n) {
            if (n > 0) {
                vmodel.getScrollbar().disabled = false
                vmodel.getScrollbar().toggle = true
                vmodel.updateScrollbar("forceUpdate")
            } else {
                vmodel.getScrollbar().disabled = true
                vmodel.getScrollbar().toggle = false
            }
        })

        return vmodel
    }
    widget.defaults = {
        theadHeight: 35,
        noResultHeight: 100,
        tbodyScrollHeight: "auto",
        rowClass: "even",
        showScrollbar: "always", //滚动条什么时候显示，默认一直，可设置为never，scrolling
        tbodyScrollTop: 0,
        tbodyHeight: "auto",
        evenClass: "even",
        _rowHeight: 35, //实际行高,包含border什么的
        _rowHeightNoBorders: 0,
        columnWidth: 160,
        edge: 15,
        _data: [],
        topTable: {},
        bottomTable: {},
        scrollPanel: {},
        addColumnCallbacks: {},
        pageable: false,
        syncTheadColumnsOrder: true,
        remoteSort: avalon.noop, //远程排数函数
        noResultContent: "暂无结果",
        theadRenderedCallback: function(vmodel, options, vmodels) {
        },
        tbodyRenderedCallback: function(vmodel, options, vmodels) {
            if (vmodel._init) {
                vmodel._init = false
            } else {
                vmodel.widgetElement.scrollIntoView()
            }
        },
        renderCell: function(val, key, row) {
            return val
        },
        getColumnTitle: function() {
            return ""
        },
        getTemplate: function(tmpl, options) {
            return tmpl
        },
        reRender: function(data, vm) {
            avalon.each(vm.addColumnCallbacks, function(n, fn) {
                fn(data)
            })
            vm.data = data
            vm._data = vm.getStore(data, vm)
            if (typeof vm.onSort === "function") {
                setTimeout(function() {
                    vm.onSort(vm)
                }, 500)
            }
        },
        getStore: function(array, vm) {
            return  array.slice(vm.startIndex, vm.endIndex)
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
        avalon(body).addClass("oni-helper-noselect")
    }
    var restoreUserSelect = function() {
        avalon(body).removeClass("oni-helper-noselect")
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
    function getHiddenParent(parent) {
        do {
            if (avalon(parent).css("display") === "none") {
                var oldV, $parent = avalon(parent)
                return [function show() {
                        $parent.css("display", "block")
                        oldV = $parent.css("visibility")
                    }, function hide() {
                        $parent.css("display", "none")
                        $parent.css("visibility", oldV)
                    }]
            }
            if (parent.tagName === "BODY") {
                break
            }
        } while (parent = parent.parentNode);
        return [avalon.noop, avalon.noop]
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

