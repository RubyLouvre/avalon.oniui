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
    "css!../chameleon/oniui-common.css",
    "css!./avalon.smartgrid.css"
], function(avalon, template, EJS) {
    var tempId = new Date - 0,
        templateArr = template.split("MS_OPTION_EJS"),
        gridHeader = templateArr[0],
        template = templateArr[1],
        isIE6 = (window.navigator.userAgent || '').toLowerCase().indexOf('msie 6') !== -1

    var widget = avalon.ui.smartgrid = function(element, data, vmodels) {
        var options = data.smartgridOptions,
            $element = avalon(element)
         
        perfectColumns(options)   
        initContainer(options, element)
        
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        options._position = isIE6 ? "absolute" : "fixed"

        var vmodel = avalon.define(data.smartgridId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["template", "widgetElement", "helper", "data", "container", "_container", "_position", "htmlHelper", "_selectedData", "selectable"]
            vm.widgetElement = element
            vm._headerTop = 0
            vm._container = null
            vm._fixHeaderToggle = false
            vm._gridWidth = 0
            vm.setColumns = function() {

            }
            vm.showNoResult = function() {

            }
            vm.getRawData = function() {
                return vmodel.data
            }
            vm.getSelected = function() {
                return vmodel._selectedData
            }
            vm.selectAll = function(b) {
                vmodel._selectAll(null, b)
            }
            vm.isSelectAll = function() {
                return vmodel._allSelected
            }
            vm.showLoading = function() {

            }
            vm.hideLoading = function() {

            }
            vm.destroyLoading = function() {

            }
            
            vm._selectAll = function(event, selected) {
                var val = event ? event.target.checked : selected,
                    datas = vmodel.data,
                    trs = vmodel._container.getElementsByTagName("tr")

                vmodel._allSelected = val
                for (var i = 0, len = datas.length; i < len; i++) {
                    var data = datas[i],
                        input = trs[i].cells[0].getElementsByTagName("input")[0]
                    data.selected = val
                    input.checked = val
                }
                if (val) {
                    vmodel._selectedData = datas.concat()
                } else {
                    vmodel._selectedData = []
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
            vm._refreshWidth = function() {
                var minWidth = this._getMinTableWidth();
                var parentContainerWidth = this._container.width();
                var adaptiveColumn = this._getFirstStringColumn();
                if(minWidth > parentContainerWidth){
                    this.container.css("width",minWidth);
                    this.container.find("col[data-column='" + adaptiveColumn.key + "']").css("width",adaptiveColumn.width + "px");
                }else{
                    this.container.css("width","auto");
                    this.container.find("col[data-column='" + adaptiveColumn.key + "']").css("width","auto");
                }
            }
            vm._setColumnWidth = function() {
                var cells = vmodel._container.getElementsByTagName("tr")[0].cells,
                    columns = vmodel.columns

                for (var i = 0, len = cells.length; i < len; i++) {
                    var $cell = avalon(cells[i])
                    columns[i].width = $cell.css("width")
                }
                vmodel._gridWidth = avalon(vmodel.container).width() - 2
            }
            vm._getTemplate = function() {
                var fn, html, 
                    id = "simplegrid_tmp_" + tempId,
                    datas = vmodel.data,
                    columns = vmodel.columns.$model

                if (!EJS[id]) {
                    fn = EJS.compile(options.template, vmodel.htmlHelper)
                    EJS[id] = fn
                } else {
                    fn = EJS[id]
                }
                for (var i = 0, len = columns.length; i < len; i++) {
                    var column = columns[i],
                        name = column.key
                    for (var j = 0, dataLen = datas.length; j < dataLen; j++) {
                        var data = datas[j]
                        data[name] = data[name] !== void 0 ? data[name] : column.defaultValue
                    }
                }

                html = fn({data: vmodel.data, columns: vmodel.columns, len: 2})
                return html
            }
            vm.render = function() {
                var container = vmodel._container
                

                container.innerHTML = vmodel._getTemplate()
                
                if (vmodel.selectable.type === "Checkbox") {
                    var allSelected = isSelectAll(vmodel.data)
                    vmodel._allSelected = allSelected
                    getSelectedData(vmodel)
                }
                avalon.nextTick(function() {
                    avalon.scan(container, [vmodel].concat(vmodels))
                })
                
            }
            vm.$init = function() {
                var container = vmodel.container
                
                container.innerHTML = gridHeader
                avalon.scan(container, vmodel)

                avalon.nextTick(function() {
                    vmodel._container = container.getElementsByTagName("tbody")[0]
                    vmodel.render()
                    avalon.nextTick(function() {
                        vmodel._setColumnWidth()
                    })
                    bindEvents(vmodel)
                })
                avalon(window).bind("scroll", function() {
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
                
                // avalon(window).bind("resize", function() {
                //     vmodel._refreshWidth()
                // })
                // element.innerHTML = options.template
            }
            vm.$remove = function() {

            }
        })
        return vmodel
    }
    widget.defaults = {
        container: "", // element | id
        data: [],
        columns: [],
        htmlHelper: {},
        pager: {
            pageSize : 10,
            canChangePageSize : true,
            totalNumbers : 0,
            pageSizeList : [10,30,50], //默认[10,30,50]
            currentPage : 1
        },
        sortable: {
            remoteSort: true
        },
        customizable: false, // ????
        mask: true,
        helper: {},
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
                    $target = avalon(target)
                if ($target.attr("data-role") === "selected") {
                    var rowData = options.data[$target.attr("data-index")]
                    if (target.checked) {
                        rowData.selected = true
                        avalon.Array.ensure(options._selectedData, rowData)
                    } else {
                        rowData.selected = false
                        avalon.Array.remove(options._selectedData, rowData)
                    }
                }
                if (options._selectedData.length == options.data.length) {
                    options._allSelected = true
                } else {
                    options._allSelected = false
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
        var allSelected = true
        for (var i = 0, len = datas.length; i < len; i++) {
            var data = datas[i]
            if (!data.selected) {
                allSelected = false
            }
        }
        return allSelected
    }
    function perfectColumns(options) {
        var columns = options.columns,
            selectColumn = {}
        for(var i = 0, len = columns.length; i < len; i++) {
            var column = columns[i],
                format = column.format,
                htmlFunction = ""

            column.align = column.align || "center"
            if (column.toggle === void 0 || column.isLock) {
                column.toggle = true
            }
            column.width = column.width || "auto"
            column.customClass = column.customClass || ""
            if (format && !options.htmlHelper[format]) {
                options.htmlHelper[format] = function(rowData, index, cellValue) {
                    avalon.log("方法"+format+"未定义")
                    return cellValue
                }
            }
            htmlFunction = options.htmlHelper[format]
            if (!htmlFunction) {
                htmlFunction = function(rowData, index, cellValue) {
                    return cellValue
                }
            }
            column.format = htmlFunction // EJS模板对于helper的渲染是通过将helper中的方法分别作为compiler的参数存在的，为了在静态模板中可以使用fn()这种方式渲染数据，只好统一将渲染数据的方法保存在format中
        }
        if (options.selectable) {
            var type = options.selectable.type,
                selectFormat,
                allSelected = true

            switch(type) {
                case "Checkbox":
                case "Radio":
                    selectFormat = function(rowData, index, selected, disable, allSelected) {
                        if (allSelected && type === "Radio") return 
                        return "<input type='" + type.toLowerCase() +"'" + (disable ? "disabled" : "") + (selected ? "checked='checked'" : "") + "name='selected' "+ (allSelected ? "ms-click='_selectAll' ms-duplex-radio='_allSelected'" : "data-index='" + index +"'") +"data-role='selected'/>"
                    }
                    allSelected = isSelectAll(options.data)
                    options._allSelected = allSelected
                    options._allInput = null
                break;
                case "Control":

                break;
            }
            
            selectColumn = {
                key : "selected",
                name: selectFormat({}, -1, allSelected, null, true),
                width : 20,
                sortable : false,
                type: options.selectable.type,
                format: selectFormat,
                toggle: true,
                align: "center",
                customClass: ""
            }
        }
        columns.unshift(selectColumn)

        options.columns = columns
    }

    return avalon
})



// var options = {
//  //数据，可选，有数据时直接渲染至页面
//     columns : [{
//         key:key1,
//         name : name1,
//         title:key1,
//         type : String | Number | Control | Radio | Checkbox, //optionally 
//         uclass : xxx //optionally ,
//         click : function(){},
//         sortable : boolean,
//         filterable : boolean, //未来功能
//         width : Number,
//         defaultValue : String | Number,
//         isLock : bool, //是否锁死不可隐藏列，默认false
//         isShown : bool, //是否显示，默认true
//         isDefault : bool //是否默认显示列，默认true
//     },{ key:key2,title:key2},{key:key3,title:key3}], //表头
    
//     customizable : {
//         "container" : {Sring} 触发自定义列的容器
//     }, //是否支持自定义列，默认false
//     sortable : {
//         "remoteSort" : {Boolean} 是否支持远程排序，默认为true
//     },
//     pagerOpts: {
//         noPageNumber: Boolean   //是否渲染分页的页码，默认为false，为true时只显示“上一页” “下一页”
//     }
// }

// 事件：
// rowDataChange pageNumberChange pageSizeChange columnSort rowSelect selectAll

// beforeRender


