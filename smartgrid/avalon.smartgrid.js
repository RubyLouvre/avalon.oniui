require.config({
    paths: {
        ejs: "../mmTemplate"
    },
    shim: {
        ejs: {
            exports: "ejs"
        }
    }
})
define(["avalon",
    "text!./avalon.smartgrid.html",
    "ejs",
    "../loading/avalon.loading",
    "../pager/avalon.pager",
    "../dropdown/avalon.dropdown",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.smartgrid.css"
], function(avalon, template, EJS) {
    var tempId = new Date - 0,
        templateArr = template.split("MS_OPTION_EJS"),
        gridHeader = templateArr[0],
        template = templateArr[1],
        isIE6 = (window.navigator.userAgent || '').toLowerCase().indexOf('msie 6') !== -1,
        remptyfn = /^function\s+\w*\s*\([^)]*\)\s*{\s*}$/m,
        sorting = false, // 页面在排序的时候不用更新排序icon的状态为ndb，但如果是重新渲染数据的话重置icon状态为ndb
        callbacksNeedRemove = {}

    var widget = avalon.ui.smartgrid = function(element, data, vmodels) {
        var options = data.smartgridOptions,
            $element = avalon(element),
            pager = options.pager,
            vmId = data.smartgridId
         
        perfectColumns(options, element)   
        initContainer(options, element)
        options._position = isIE6 ? "absolute" : "fixed"
        options.loading.onInit = function(vm, options, vmodels) {
            vmodel.loadingVModel = vm
        }
        options.pageable = options.pageable !== void 0 ? options.pageable : true
        if (avalon.type(pager) === "object") {
            pager.prevText = pager.prevText || "上一页"
            pager.nextText = pager.nextText || "下一页"
            if (options.pageable) {
            
                pager.getTemplate = typeof pager.getTemplate === "function" ? pager.getTemplate : function(tmpl, options) {
                    var optionsStr = ""
                    if (Array.isArray(pager.options) && options.canChangePageSize) {
                        optionsStr = '<div class="ui-smartgrid-pager-options">每页显示<select ms-widget="dropdown" data-dropdown-list-width="50" data-dropdown-width="50" ms-duplex="perPages"><option ms-repeat="options" ms-value="el.value">{{el.text}}</option></select>条, {{totalItems}}条结果</div>'
                    } else {
                        optionsStr = '<div class="ui-smartgrid-pager-options">{{totalItems}}条结果</div>'
                    }
                    return tmpl + optionsStr
                }
            }
        } else {
            options.pager = {}
        }

        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        options.$skipArray = ["template", "widgetElement", "data", "container", "_container", "_position", "htmlHelper", "_selectedData", "selectable", "loadingVModel", "loading", "pageable", "pager", "noResult", "sortable", "containerMinWidth"].concat(options.$skipArray)
        var vmodel = avalon.define(vmId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm._headerTop = 0
            vm._container = null
            vm._fixHeaderToggle = false
            vm._gridWidth = 0
            vm._pagerShow = false
            vm.loadingVModel = null
            vm.getRawData = function() {
                return vmodel.data
            }
            vm.getSelected = function() {
                return vmodel._selectedData
            }
            vm.selectAll = function(b) {
                b = b !== void 0 ? b : true
                vmodel._selectAll(null, b)
            }
            vm.isSelectAll = function() {
                return vmodel._allSelected
            }
            //如果当前列可以排序，那么点击标题旁边的icon,将会调用此方法
            vm.sortColumn = function(column, index, event) {
                var target = event.target,
                    $target = avalon(target),
                    sortTrend = "",
                    field = column.key,
                    trend = 0,
                    onColumnSort = vmodel.onColumnSort
                if (!vmodel.data.length) return
                if ($target.hasClass("ui-helper-sort-top")) {
                    sortTrend = "asc"
                } else {
                    sortTrend = "desc"
                }
                sorting = true
                sortTrend == "asc" ? trend = 1: trend = -1
                column.sortTrend = sortTrend
                if (vmodel.sortable.remoteSort && typeof vmodel.remoteSort === "function" && !remptyfn.test(vmodel.remoteSort)) {
                    vmodel.remoteSort(field, sortTrend, vmodel)// onColumnSort回调对于远程排序的最好时机是在remoteSort中数据渲染之后自行处理
                } else if (typeof column.localSort === "function" && !remptyfn.test(column.localSort)) {// !isEmptyFn(el.localSort)
                    //如果要在本地排序,并且指定排数函数
                    vmodel.data.sort(function(a, b) {
                        return trend * column.localSort(a, b, field, vmodel.$model) || 0
                    })
                    vmodel.render()
                    if (avalon.type(onColumnSort) === "function") {
                        onColumnSort.call(vmodel, sortTrend, field)
                    }
                } else {
                    //否则默认处理
                    vmodel.data.sort(function(a, b) {
                        return trend * (a[field] - b[field]) || 0
                    })
                    vmodel.render()
                    if (avalon.type(onColumnSort) === "function") {
                        onColumnSort.call(vmodel, sortTrend, field)
                    }
                }
            }
            vm.setColumns = function(columns, b) {
                var columnsOption = vmodel.columns
                columns = [].concat(columns)
                b = b !== void 0 ? b : true
                for (var i = 0, len = columnsOption.length; i < len; i++) {
                    var column = columnsOption[i],
                        key = column.$model.key,
                        keyIndex = columns.indexOf(key)
                    if (keyIndex != -1 && !column.isLock) {
                        column.toggle = b
                    }
                }
            }
            vm.showNoResult = function(text) { // 只要数据为空组件会自动showNoResult,考虑到使用习惯保留了showNoResult，不过其实完全可以不用
                vmodel.noResult = text || vmodel.noResult
                vmodel.data = []
                vmodel.render()
            }
            vm.showLoading = function() {
                vmodel.loadingVModel.toggle = true
            }
            vm.hideLoading = function() {
                vmodel.loadingVModel.toggle = false
            }
            vm._selectAll = function(event, selected) {
                var val = event ? event.target.checked : selected,
                    datas = vmodel.data,
                    trs = vmodel._container.getElementsByTagName("tr"),
                    onSelectAll = vmodel.onSelectAll

                vmodel._allSelected = val
                for (var i = 0, len = datas.length; i < len; i++) {
                    var data = datas[i],
                        tr = trs[i],
                        input = tr.cells[0].getElementsByTagName("input")[0]
                    data.selected = val
                    input.checked = val
                    avalon(tr)[val ? "addClass": "removeClass"]("ui-smartgrid-selected")
                }
                if (val) {
                    vmodel._selectedData = datas.concat()
                } else {
                    vmodel._selectedData = []
                }
                
                if (avalon.type(onSelectAll) === "function") {
                    onSelectAll.call(vmodel, datas, val)
                }
            }
            vm._toggleColumn = function(toggle, index) {
                if (!vmodel._container) return toggle
                var trs = vmodel._container.getElementsByTagName("tr")
                for (var i = 0, tr, len =trs.length; i < len; i++) {
                    tr = trs[i]
                    if (toggle) {
                        tr.cells[index].style.display = "table-cell"
                    } else {
                        tr.cells[index].style.display = "none"
                    }
                }
                return toggle
            }
            
            vm._setColumnWidth = function() {
                var cells = vmodel._container.getElementsByTagName("tr")[0].cells,
                    columns = vmodel.columns,
                    containerWidth = avalon(vmodel.container).width() - 2

                for (var i = 0, len = cells.length; i < len; i++) {
                    var $cell = avalon(cells[i]),
                        cellWidth = $cell.outerWidth(),
                        column = columns[i]

                    if (column.key !== "selected") {
                        column.width = cellWidth
                    } 
                }
                vmodel._gridWidth = containerWidth
            }
            vm._getTemplate = function() {
                var fn, html, 
                    id = "smartgrid_tmp_" + tempId,
                    datas = vmodel.data,
                    _columns = vmodel.columns,
                    columns = _columns.$model,
                    dataLen = datas.length

                if (!EJS[id]) {
                    fn = EJS.compile(options.template, vmodel.htmlHelper)
                    EJS[id] = fn
                } else {
                    fn = EJS[id]
                }
                for (var i = 0, len = columns.length; i < len; i++) {
                    var column = columns[i],
                        name = column.key
                    if (!sorting) {
                        _columns[i].sortTrend = "ndb"
                    }
                    
                    for (var j = 0; j < dataLen; j++) {
                        var data = datas[j]
                        data[name] = data[name] !== void 0 ? data[name] : column.defaultValue
                    }
                }

                html = fn({data: datas, columns: _columns, len: 2, noResult: vmodel.noResult, vmId: vmId})
                return html
            }
            vm.render = function() {
                var container = vmodel._container,
                    containerWrapper = vmodel.container

                vmodel._pagerShow = !vmodel.data.length ? false : true
                container.innerHTML = vmodel._getTemplate()
                if (vmodel.selectable.type === "Checkbox") {
                    var allSelected = isSelectAll(vmodel.data)
                    vmodel._allSelected = allSelected
                    getSelectedData(vmodel)
                }
                vmodel.showLoading()
                avalon.nextTick(function() {
                    avalon.scan(container, [vmodel].concat(vmodels))
                    vmodel.hideLoading()
                    vmodel._setColumnWidth()
                })
                sorting = false
                containerWrapper.scrollIntoView()
            }
            vm.$init = function() {
                var container = vmodel.container,
                    pagerVM = null,
                    intervalID = 0
                gridHeader = gridHeader.replace("MS_OPTION_ID", vmodel.$id)    
                container.innerHTML = gridHeader
                avalon.scan(container, vmodel)
                avalon.nextTick(function() {
                    vmodel._container = container.getElementsByTagName("tbody")[0]
                    vmodel.render()
                    bindEvents(vmodel)
                })
                if (vmodel.isAffix) {
                    callbacksNeedRemove.scrollCallback = avalon(window).bind("scroll", function() {
                        var scrollTop = document.body.scrollTop,
                            offsetTop = $element.offset().top,
                            headerHeight = avalon(element.getElementsByTagName("thead")[0]).css("height"),
                            top = scrollTop - offsetTop,
                            clientHeight = avalon(window).height(),
                            tableHeight = $element.outerHeight(),
                            _position = vmodel._position

                        if (tableHeight > clientHeight && scrollTop > offsetTop + headerHeight && offsetTop + tableHeight > scrollTop) {
                            if (_position === "absolute") {
                                vmodel._headerTop = Math.floor(top)
                            }
                            if (!vmodel.$model._fixHeaderToggle) {
                                vmodel._fixHeaderToggle = true
                            }
                        } else {
                            if (_position === "absolute") {
                                vmodel._headerTop = 0
                            }
                            if (vmodel.$model._fixHeaderToggle) {
                                vmodel._fixHeaderToggle = false
                            }
                        }
                    })
                }
                element.resizeTimeoutId = 0
                callbacksNeedRemove.resizeCallback = avalon(window).bind("resize", function() {
                    console.log("resize callback")
                    clearTimeout(element.resizeTimeoutId)
                    // var clientWidth = avalon(window).width()
                    // if (clientWidth <= vmodel.containerMinWidth) {
                    //     element.parentNode.style.width = clientWidth + "px"
                    // }
                    element.resizeTimeoutId = setTimeout(function(){
                        vmodel._setColumnWidth()
                    },150)
                })
                if (typeof options.onInit === "function") {
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                var container = vmodel.container
                container.innerHTML = container.textContent = ""
                avalon(window).unbind("resize", callbacksNeedRemove.resizeCallback).unbind("scroll", callbacksNeedRemove.scrollCallback)
            }
        })

        if (vmodel.pageable) {
            var flagPager = false
            var intervalID = setInterval(function() {
                var elem = document.getElementById("pager-" + vmodel.$id)
                if (elem && !flagPager) {

                    elem.setAttribute("ms-widget", "pager,pager-" + vmodel.$id)
                    avalon(elem).addClass("ui-smartgrid-pager-wrapper")
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

        return vmodel
    }
    widget.defaults = {
        container: "", // element | id
        data: [],
        columns: [],
        htmlHelper: {},
        noResult: "暂时没有数据",
        remoteSort: avalon.noop,
        isAffix: false,
        containerMinWidth: 600,
        loading: {
            toggle: false,
            modal: true,
            modalBackground: "#000"
        },
        pager: {
            canChangePageSize : true,
            options : [10, 20, 50, 100] //默认[10,30,50]
        },
        sortable: {
            remoteSort: true
        },
        getTemplate: function(str, options) {
            return str
        }
    }
    function initContainer(options, element) {
        var container = options.container
        if (container) {
            if (typeof container == "string") {
                container = document.getElementById(container)
            }
            if (!container.nodeType || container.nodeType != 1 || !document.body.contains(container)) {    
                container = null
            }
        }
        container = container || element
        options.container = container
    }
    function bindEvents(options) {
        if (!options.selectable) return
        var type = options.selectable.type 
        if (type === "Checkbox") {
            avalon.bind(options._container, "click", function(event) {
                var target = event.target,
                    $target = avalon(target),
                    $tr = avalon(target.parentNode.parentNode),
                    datas = options.data,
                    onSelectAll = options.onSelectAll,
                    selectedData = options._selectedData

                if ($target.attr("data-role") === "selected") {
                    var rowData = datas[$target.attr("data-index")],
                        isSelected = target.checked
                    if (isSelected) {
                        $tr.addClass("ui-smartgrid-selected")
                        rowData.selected = true
                        avalon.Array.ensure(selectedData, rowData)
                    } else {
                        $tr.removeClass("ui-smartgrid-selected")
                        rowData.selected = false
                        avalon.Array.remove(selectedData, rowData)
                    }
                    if (avalon.type(options.onRowSelect) === "function") {
                        options.onRowSelect.call($tr[0], rowData, isSelected)
                    }
                }
                if (selectedData.length == datas.length) {
                    options._allSelected = true
                    // 是否全选的回调，通过用户点击单独的行来确定是否触发
                    // if (avalon.type(onSelectAll) === "function") {
                    //     onSelectAll.call(options, datas, true)
                    // }
                } else {
                    options._allSelected = false
                    // if (!selectedData.length) { // 通过点击每一行最终确定是否全选的回调
                    //     if (avalon.type(onSelectAll) === "function") {
                    //         onSelectAll.call(options, datas, false)
                    //     }
                    // }
                }
            })
        }    
    }
    function getSelectedData(vmodel) {
        var datas = vmodel.data
        vmodel._selectedData = []
        for (var i = 0, len = datas.length; i < len; i++) {
            var data = datas[i],
                selected = data.selected
            if (selected) {
                vmodel._selectedData.push(data)
            }
        }
    }
    function isSelectAll(datas) {
        var allSelected = true,
            len = datas.length
        if (!len) {
            allSelected = false
            return
        }
        for (var i = 0; i < len; i++) {
            var data = datas[i]
            if (!data.selected) {
                allSelected = false
            }
        }
        return allSelected
    }
    function perfectColumns(options, element) {
        var columns = options.columns,
            selectColumn = {},
            parentContainerWidth = avalon(element.parentNode).width(),
            allColumnWidth = 0,
            maxWidth = 0,
            maxWidthColumn = {}

        for(var i = 0, len = columns.length; i < len; i++) {
            var column = columns[i],
                format = column.format,
                htmlFunction = "",
                _columnWidth = column.width,
                columnWidth = ~~_columnWidth

            column.align = column.align || "center"
            if (column.toggle === void 0 || column.isLock) {
                column.toggle = true
            }
            if (!columnWidth) {
                if (_columnWidth.indexOf("%")) {
                    columnWidth = parentContainerWidth * parseInt(_columnWidth) / 100
                } else {
                    columnWidth = "auto"
                }
            }
            column.width = columnWidth
            allColumnWidth += ~~columnWidth
            ~~columnWidth > maxWidth ? (maxWidth = columnWidth) && (maxWidthColumn = column) : 0
            column.customClass = column.customClass || ""
            if (column.sortable) {
                column.sortTrend = "ndb"
            }
            if (format && !options.htmlHelper[format]) {
                options.htmlHelper[format] = function(vmId, field, index, cellValue) {
                    avalon.log("方法"+format+"未定义")
                    return cellValue
                }
            }
            htmlFunction = options.htmlHelper[format]
            if (!htmlFunction) {
                htmlFunction = function(vmId, field, index, cellValue) {
                    return cellValue
                }
            }
            column.format = htmlFunction // EJS模板对于helper的渲染是通过将helper中的方法分别作为compiler的参数存在的，为了在静态模板中可以使用fn()这种方式渲染数据，只好统一将渲染数据的方法保存在format中
        }
        if (options.selectable) {
            var type = options.selectable.type,
                selectFormat,
                allSelected = true

            if (type === "Checkbox" || type === "Radio") {
                selectFormat = function(vmId, field, index, selected, disable, allSelected) {
                    if (allSelected && type === "Radio") return 
                    return "<input type='" + type.toLowerCase() +"'" + (disable ? "disabled" : "") + (selected ? "checked='checked'" : "") + "name='selected' "+ (allSelected ? "ms-click='_selectAll' ms-duplex-radio='_allSelected'" : "data-index='" + index +"'") +"data-role='selected'/>"
                }
                allSelected = isSelectAll(options.data)
                options._allSelected = allSelected
            }
            
            selectColumn = {
                key : "selected",
                name: selectFormat(options.$id, "selected", -1, allSelected, null, true),
                width : 20,
                sortable : false,
                type: options.selectable.type,
                format: selectFormat,
                toggle: true,
                align: "center",
                customClass: ""
            }
            allColumnWidth += 20
            columns.unshift(selectColumn)
        }

        if (allColumnWidth > parentContainerWidth) {
            if (~~maxWidthColumn.width) {
                maxWidthColumn.width = "auto"
            } else {
                for (i = 0; i < len; i++) {
                    column = columns[i]
                    if (~~column.width) {
                        column.width = "auto"
                        break
                    }
                }
            }
        }
        
        options.columns = columns
    }
    return avalon
})