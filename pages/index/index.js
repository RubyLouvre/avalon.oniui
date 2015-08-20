avalon.config({
    debug: false
})

require(["pages/index/widget.list", "mmRouter/mmState", "ready!"], function (widgetList) {
    var pagesVM = avalon.define({
        $id: "pages",
        st: "200px",
        activeNav: getActiveNav(),
        switchNavTo: function(key){
            if(pagesVM.pages[key][0] !== "#"){
                return
            }
            pagesVM.activeNav = key
        },
        pages: {
            "组件库": "#!/widgets",
            "APIs": "#!/apis",
            "下载": "#!/download",
            "打包工具": "http://l-uedapp2.h.dev.cn0.qunar.com:8088/"
        },
        showWidgetExs: function(){
            pagesVM.goWidgetBtnVisible = false
            pagesVM.backToMenuBtnVisible = true

            prepareExampleDirectory(pagesVM, widgetList, getHashValue("widgetId"))
        },
        backToMenu: function(){
            pagesVM.goWidgetBtnVisible = true
            pagesVM.backToMenuBtnVisible = false

            prepareWidgetDirectory(pagesVM, widgetList)
        },
        searchKey: "",
        search: function(e){
            if(e.keyCode === 13 || e.type === "click"){

                if(pagesVM.activeNav === "组件库"){
                    pagesVM.backToMenu()
                    scrollDir("widgets", pagesVM.searchKey, pagesVM.directorys.$model)
                } else{
                    scrollDir("apis", pagesVM.searchKey, pagesVM.directorys.$model)
                }

            }
        },
        selectSearchKey: function(e){
            e.target.setSelectionRange(0, this.value.length)
        },
        getDocHref: function(){
            var widgetId = getHashValue("widgetId")
            return "#!/widgets/?widgetId=" + widgetId + "&ex=doc"
        },
        directorys: {},
        currentWidget: "accordion",
        currentWidgetIntro: "手风琴",
        currentEx: "",

        goWidgetBtnVisible: false,
        backToMenuBtnVisible: true,

        listSrc: "pages/index/views/widgets/list.html",

        currentAnchor: "非监控属性"
    })

    var widgetsVM = avalon.define({
        $id: "widgets",
        widgetSrc: "accordion/avalon.accordion.ex1.html"
    })

    avalon.state("index", {
        url: "/",
        views: {
            "": {
                templateUrl: "pages/index/views/widgets/index.html"
            }
        },
        onEnter: function(){
            location.href = "#!/widgets"
        }
    })
    avalon.state("widgets", {
        url: "/widgets",
        views: {
            "": {
                templateUrl: "pages/index/views/widgets/index.html"
            }
        },
        onBeforeEnter: function() {
            pagesVM.activeNav = "组件库"

            var widgetId = getHashValue("widgetId"),
                ex = getHashValue("ex")

            preparePage(widgetId, ex, pagesVM, widgetsVM, widgetList)
        }
    })

    var apis = {
        "核心概念": {
            "非监控属性": "concepts/unobservable.html",
            "监控属性": "concepts/observable.html",
            "监控数组": "concepts/collection.html",
            "计算属性": "concepts/computed.html",
            "watch方法": "concepts/$watch.html",
            "fire方法": "concepts/$fire.html",
            "视图模型": "concepts/vmodel.html",
            "数据模型": "concepts/$model.html"
        },
        "bindings": {
            "ms-alt": "bindings/string-bindings.html",
            "ms-attr": "bindings/ms-attr.html",
            "ms-checked": "bindings/ms-attr.html",
            "ms-class": "bindings/ms-class.html",
            "ms-css": "bindings/ms-css.html",
            "ms-data": "bindings/ms-data.html",
            "ms-disabled": "bindings/ms-attr.html",
            "ms-duplex": "bindings/ms-duplex.html",
            "ms-href": "bindings/string-bindings.html",
            "ms-html": "bindings/ms-html.html",
            "ms-if": "bindings/ms-if.html",
            "ms-include": "bindings/ms-include.html",
            "ms-on": "bindings/ms-on.html",
            "ms-readonly": "bindings/ms-attr.html",
            "ms-repeat": "bindings/ms-repeat.html",
            "ms-selected": "bindings/ms-attr.html",
            "ms-src": "bindings/string-bindings.html",
            "ms-text": "bindings/ms-text.html",
            "ms-title": "bindings/string-bindings.html",
            "ms-value": "bindings/string-bindings.html",
            "ms-visible": "bindings/ms-visible.html",
            "ms-widget": "bindings/ms-widget.html"
        },
        "回调方法": {
            "data-callback": "callbacks/data-callback.html"
        },
        "静态方法": {
            "statics": "statics/statics.html"
        },
        "原型方法": {
            "prototypes": "prototypes/prototypes.html"
        },
        "表单示例": {
            "form": "form/index.html"
        }
    }

    var apisVM = avalon.define({
        $id: "apis",
        apiSrc: "",
        highlight: function() {
            SyntaxHighlighter.highlight()
        },
        statics: {
            "mix(a,b)": "★★★相当于jQuery.extend, 或用于深浅拷贝属性",
            "log(s)": "打印日志,如avalon.log(a); avalon.log(a, b)",
            "isFunction(s)": "判定是否为函数,1.3.6新增",
            "error(s)": "抛出异常",
            "ui": "用于放置组件",
            "vmodels": "★★★用于放置avalon.define(id, fn)产生的ViewModel",
            "noop": "一个空函数",
            "ready(fn)": "★★★domReady，将回调延迟到DOM树后才执行",
            "oneObject(str | array, val?)": "★★★如果传入一个字符串则将它以逗号转换为一个字符串数组，否则一定要传字符串数组，第二个参数可选，为生成的对象的值。此方法是用于生成一个键名不一样，但键值都一样的对象。如{a:1, b:1, c:1, d:1}",
            "type(obj)": "★★★返回传参的数据类型，值可能为array, date, object, json, number, string, null, undefined",
            "isWindow(obj)": "判定是否为window对象",
            "isPlainObject(obj)": "判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例",
            "slice(obj, start?, end?)": "用于转换一个类数组对象为一个纯数组，后面两个为索引值，可以只取原对象的一部分元素",
            "range(start, end, step)": "生成一个整数数组，功能与underscorejs或python的同名函数一致",
            "bind(el, type, fn, phase)": "绑定事件，返回一个回调给你自行卸载",
            "unbind(el, type, fn, phase)": "卸载事件",
            "each(obj,fn)": "★★★功能同jQuery.each， 都是索引值或键名在前，值或元素在后",
            "avalon.define(id, factory)": "★★★定义一个ViewModel",
            "scan(el?, vmodels?, group ?)": "★★★扫描DOM树，抽取绑定(el默认为DOM,vmodels默认为空数组",

            "define(id?, deps?, factory)": "●一个全局方法，用于定义AMD规范的JS模块",
            "require(deps, callback)": "●一个全局方法，用于加载JS模块",
            "css(node, name, value?)": "如果只有两个参数，读取元素的某个样式，三个参数时，设置元素某个样式;<br/>" +
            "在设置样式时,如果是长宽等计量属性,你可以直接传一个数值,框架会自动帮你添加px单位;<br/>" +
            "如果是取值时,你的第三个参数是true,它会帮你去掉单位,转换为纯数值",
            "nextTick(fn)": "延迟执行某个函数，类似于setTimeout(fn, 0)",
            "contains(a, b)": "判定A元素包含B元素",
            "parseHTML(str)": "将一段字符串转换为文档碎片",
            "innerHTML(node, str)": "对节点node进行innerHTML操作，在旧式IE下，head, table, td, tr, th等元素的innerHTML是只读，这个方法进行了兼容处理",
            "clearHTML(node)": "清空元素的所有子节点",
            "Array.remove(array, el)": "移除某个元素，成功返回true，失败返回false",
            "Array.removeAt(array, index)": "移除某个位置上的元素，成功返回true，失败返回false",
            "Array.ensure(array, el)": "只有数组不存在此元素时才添加它",
            "avalon.filters.uppercase(str)": "全部大写",
            "avalon.filters.lowercase(str)": "全部小写",
            "avalon.filters.truncate(str, length, truncation)": "length，新字符串长度，truncation，新字符串的结尾的字段",
            "avalon.filters.camelize(str)": "驼峰化",
            "avalon.filters.escape(str)": "将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 &lt; 为 &amplt;",
            "avalon.filters.currency(str,symbol)": "货币处理，默认第2个参数为￥",
            "avalon.filters.number(str, decimals, dec_point, thousands_sep)": "数字格式化<br/>" +
            "str 必需 要格式化的数字<br/>" +
            "decimals	可选，规定多少个小数位<br/>" +
            "dec_point	可选，规定用作小数点的字符串（默认为 . ）<br/>" +
            "thousands_sep 可选，规定用作千位分隔符的字符串（默认为','）。如果设置了该参数，那么所有其他参数都是必需的"
        }
    })

    avalon.state("apis", {
        url: "/apis",
        views: {
            "": {
                templateUrl: "pages/index/views/apis/index.html"
            }
        },
        onBeforeEnter: function() {
            var currentApi = getHashValue("api"), currentApiSrc
            var firstApi

            for(var i in apis){
                for(var j in apis[i]){
                    firstApi = apis[i][j]
                    break
                }
                break
            }

            // 找crrentAPI对应的链接
            for(var i in apis){
                for(var j in apis[i]){
                    if(j === currentApi){
                        currentApiSrc = apis[i][j]
                        break
                    }
                }
            }

            pagesVM.activeNav = "APIs"
            pagesVM.listSrc = "pages/index/views/apis/list.html"

            if(typeof currentApi !== "undefined"){
                apisVM.apiSrc =  "pages/index/views/apis/" + currentApiSrc
            } else{
                apisVM.apiSrc =  "pages/index/views/apis/" + firstApi
            }

            // 添加href
            var apisObj = avalon.mix(true, {}, apis)

            for(var groupIndex in apisObj){
                var apiGroup = apisObj[groupIndex]

                for(var apiIndex in apiGroup){
                    apiGroup[apiIndex] = {
                        content: apiGroup[apiIndex],
                        href: "#!/apis?api=" + apiIndex
                    }
                }
            }

            // 确定active anchor
            if(typeof currentApi !== "undefined"){
                pagesVM.currentAnchor = currentApi
            } else{
                pagesVM.currentAnchor = "非监控属性"
            }

            pagesVM.directorys = apisObj
        }
    })

    avalon.state("download", {
        url: "/download",
        views: {
            "": {
                templateUrl: "pages/index/views/download/index.html"
            }
        },
        onBeforeEnter: function() {
            pagesVM.activeNav = "下载"
        }
    })

    avalon.history.start({
        basepath: "/mmRouter"
    })

    avalon.scan();

});

function getHashValue(key, href) {
    href = href || location.hash

    var matches = href.match(new RegExp(key+'=([^&]*)'));

    if(matches){
        return decodeURI(matches[1])
    }
}

function getWidgetIntro(key, widgets){
    for(var i in widgets){
        var widgetsGroup = widgets[i]

        if(typeof widgetsGroup[key] !== "undefined"){
            return widgetsGroup[key]
        }
    }
}

function getActiveNav(){
    var activeNav = location.hash.slice(3)

    if(activeNav === "download"){
        return "下载"
    } else if(activeNav === "apis"){
        return "APIs"
    } else{
        return "组件库"
    }
}

function scrollDir(type, searchKey, dirs){
    var GROUP_H = 54,
        WIDGET_H = 44

    var listWrap = document.getElementById("listWrap"),
        firstMatchPosition, matchPattern,
        scrollPosition = 0

    if(type === "apis"){
        scrollPosition -= WIDGET_H
    }

    for(var groupKey in dirs){
        var group = dirs[groupKey]

        scrollPosition += GROUP_H

        for(var widgetKey in group){

            scrollPosition += WIDGET_H

            var matchPattern

            if(type === "widgets"){
                var findWidget = new RegExp("^" + searchKey + "\w*", 'i').test(widgetKey),
                    findWidgetIntro = group[widgetKey].intro.indexOf(searchKey) !== -1

                matchPattern = findWidget || findWidgetIntro
            } else if(type === "apis"){
                matchPattern = widgetKey.indexOf(searchKey) !== -1
            }

            if(matchPattern){

                if(typeof firstMatchPosition === "undefined"){
                    firstMatchPosition = scrollPosition
                }

                if(listWrap.scrollTop < scrollPosition){
                    listWrap.scrollTop = scrollPosition
                    return
                }
            }
        }
    }

    listWrap.scrollTop = firstMatchPosition
}

function preparePage(widgetId, ex, pagesVM, widgetsVM, widgetList){
    var pageStatus = {
        inWidgetPage: typeof widgetId !== "undefined" && typeof ex === "undefined",
        inExamplePage: typeof widgetId !== "undefined" && typeof ex !== "undefined",
        inWidgetIndexPage: typeof widgetId === "undefined"
    }

    prepareMenuButton()
    prepareDirectory()
    prepareCurrentStatus()
    prepareFrameSrc()

    function prepareMenuButton(){
        if(pageStatus.inWidgetIndexPage){
            pagesVM.goWidgetBtnVisible = true
            pagesVM.backToMenuBtnVisible = false
        } else{
            pagesVM.goWidgetBtnVisible = false
            pagesVM.backToMenuBtnVisible = true
        }
    }

    function prepareDirectory(){
        pagesVM.listSrc = "pages/index/views/widgets/list.html"

        if(pageStatus.inWidgetIndexPage){
            prepareWidgetDirectory(pagesVM, widgetList)
        } else{
            prepareExampleDirectory(pagesVM, widgetList, widgetId)
        }
    }

    function prepareCurrentStatus(){
        if(pageStatus.inWidgetIndexPage){
            pagesVM.currentWidget = "accordion"
            pagesVM.currentWidgetIntro = "手风琴"
        } else if(pageStatus.inWidgetPage){
            pagesVM.currentWidget = widgetId
            pagesVM.currentWidgetIntro = getWidgetIntro(widgetId, widgetList.widgets)

            var exs = widgetList.examples[widgetId],
                firstEx

            for(var i in exs){
                firstEx = exs[i]
                break
            }
            pagesVM.currentEx = firstEx
        } else if(pageStatus.inExamplePage){
            pagesVM.currentWidget = widgetId
            pagesVM.currentWidgetIntro = getWidgetIntro(widgetId, widgetList.widgets)
            pagesVM.currentEx = "avalon." + widgetId + "." + ex + ".html"
        }
    }

    function prepareFrameSrc(){
        if(pageStatus.inWidgetIndexPage){
            widgetsVM.widgetSrc = "accordion/avalon.accordion.ex1.html"
        } else if(pageStatus.inWidgetPage){
            widgetsVM.widgetSrc =  widgetId + "/" + pagesVM.currentEx
        } else if(pageStatus.inExamplePage){
            pagesVM.currentEx = "avalon." + widgetId + "." + ex + ".html"
            widgetsVM.widgetSrc =  widgetId+ "/avalon." + widgetId + "." + ex + ".html"
        }
    }
}

function prepareWidgetDirectory(pagesVM, widgetList){
    var directoryObj =  avalon.mix(true, {}, widgetList.widgets)

    for(var widgetGroupId in directoryObj){
        var widgetGroup = directoryObj[widgetGroupId]

        for(var widgetIndex in widgetGroup){

            directoryObj[widgetGroupId][widgetIndex] = {
                intro: widgetGroup[widgetIndex],
                href: "#!/widgets/?widgetId=" + widgetIndex
            }
        }
    }

    pagesVM.directorys = directoryObj
}

function prepareExampleDirectory(pagesVM, widgetList, widgetId){
    widgetId = widgetId || "accordion"

    var exampleObj = {},
        widgetExs = exampleObj[widgetId] = avalon.mix(true, {}, widgetList.examples[widgetId])

    for(var exId in widgetExs){
        var exampleId = widgetExs[exId].match(/ex\d*(?=\.html)/)[0],
            exHref = "#!/widgets/?widgetId=" + widgetId + "&ex=" + exampleId

        widgetExs[exId] = {
            content: widgetExs[exId],
            href: exHref
        }
    }

    pagesVM.directorys = exampleObj
}