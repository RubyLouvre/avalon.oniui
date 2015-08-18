//avalon.config({
//    debug: false
//})

require(["pages/index/widget.list", "ready!", "mmRouter/mmState"], function (widgetList) {
    var pagesVM = avalon.define({
        $id: "pages",
        activeNav: "组件库",
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
        generateLink: function(key, val, group){
            if(typeof widgetList.widgets[group] !== "undefined"){
                return "#!/widgets/?widgetId=" + key
            } else if(typeof val !== "undefined"){
                var exampleId = val.match(/ex\d?(?=\.html)/)[0]
                return "#!/widgets/?widgetId=" + group + "&ex=" + exampleId
            }
        },
        directorys: {},
        currentWidget: "cookie",
        currentEx: ""
    })

    var widgetsVM = avalon.define({
        $id: "widgets",
        widgetSrc: "cookie/avalon.cookie.doc.html"
    })

    avalon.state("index", {
        url: "/",
        views: {
            "": {
                templateUrl: "pages/index/views/widgets/index.html"
            }
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
            var widgetId = getHashValue("widgetId"),
                ex = getHashValue("ex")

            if(typeof widgetId !== "undefined"){
                var obj = {}
                obj[widgetId] = widgetList.examples[widgetId]
                pagesVM.directorys = obj
            } else if(typeof widgetId === "undefined"){
                pagesVM.directorys = widgetList.widgets
                widgetId = pagesVM.currentWidget = "cookie"
            }

            if(typeof ex !== "undefined"){
                pagesVM.currentEx = "avalon." + widgetId + "." + ex + ".html"
            } else{
                pagesVM.currentEx = ""
            }

            if(typeof ex !== "undefined"){
                widgetsVM.widgetSrc =  widgetId+ "/avalon." + widgetId + "." + ex + ".html"
            } else{
                widgetsVM.widgetSrc =  widgetId+ "/avalon." + widgetId + ".doc.html"
            }
        }
    })
    avalon.state("apis", {
        url: "/apis",
        views: {
            "": {
                templateUrl: "pages/index/views/apis/index.html"
            }
        }
    })
    avalon.state("download", {
        url: "/download",
        views: {
            "": {
                templateUrl: "pages/index/views/download/index.html"
            }
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
    return matches ? matches[1] : undefined;
}