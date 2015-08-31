/**
 * 工具方法
 */

define("utils", function(){
    var utils = {
        /**
         * 获取哈希参数
         * @param key 参数键
         * @param href 获取源，不指定该值时从location.hash获取
         * @return 参数值
         */
        getHashValue: function(key, href) {
            href = href || location.hash

            var matches = href.match(new RegExp(key+'=([^&]*)'));

            if(matches){
                return decodeURI(matches[1])
            }
        },

        /**
         * 从locaiton.hash获取当前导航的名字
         * @return 导航名字
         */
        getActiveNav: function(){
            var activeNav = location.hash.slice(3)

            if(activeNav === "download"){
                return "下载"
            } else if(activeNav === "apis"){
                return "APIs"
            } else{
                return "组件库"
            }
        },

        /**
         * 滚动到指定目录
         * @param type 搜索方式 apis/widgets
         * @param searchKey 搜索关键字
         * @param dirs 获取源，不指定该值时从location.hash获取
         */
        scrollDir: function(type, searchKey, dirs){
            if(searchKey === ""){
                return
            }

            var GROUP_H = 55,
                WIDGET_H = 34

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
        },

        /**
         * 准备组件，包括菜单按钮、目录、当前状态、和组件内容模板
         * @param widgetId hash param中的组件id
         * @param ex hash param中的示例id
         * @param pagesVM vmodels.pages
         * @param widgetsVM vmodels.widgets
         * @param models 页面数据
         */
        prepareWidget: function(widgetId, ex, pagesVM, widgetsVM, models){
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
                    utils.prepareWidgetDirectory(pagesVM, models)
                } else{
                    utils.prepareExampleDirectory(pagesVM, models, widgetId)
                }
            }

            function prepareCurrentStatus(){
                if(pageStatus.inWidgetIndexPage){
                    pagesVM.currentWidget = "accordion"
                    pagesVM.currentWidgetIntro = "手风琴"
                } else if(pageStatus.inWidgetPage){
                    pagesVM.currentWidget = widgetId
                    pagesVM.currentWidgetIntro = getWidgetIntro(widgetId, models.widgets)

                    var exs = models.examples[widgetId],
                        firstEx
                    for(var i in exs){
                        firstEx = exs[i]
                        break
                    }
                    pagesVM.currentEx = firstEx
                } else if(pageStatus.inExamplePage){
                    pagesVM.currentWidget = widgetId
                    pagesVM.currentWidgetIntro = getWidgetIntro(widgetId, models.widgets)
                    pagesVM.currentEx = "avalon." + widgetId + "." + ex + ".html"
                }
            }

            function prepareFrameSrc(){
                if(pageStatus.inWidgetIndexPage){
                    widgetsVM.widgetSrc = "accordion/avalon.accordion.ex1.html"
                } else if(pageStatus.inWidgetPage){
                    widgetsVM.widgetSrc =  getWidgetfolder(widgetId) + "/" + pagesVM.currentEx
                } else if(pageStatus.inExamplePage){
                    pagesVM.currentEx = "avalon." + widgetId + "." + ex + ".html"
                    widgetsVM.widgetSrc =  getWidgetfolder(widgetId)+ "/avalon." + widgetId + "." + ex + ".html"
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

            function getWidgetfolder(widgetId){
                if(widgetId === "coupledatepicker" || widgetId === "daterangepicker"){
                    return "datepicker"
                } else{
                    return widgetId
                }
            }
        },

        /**
         * 准备组件目录
         * @param pagesVM vmodels.pages
         * @param widgetsVM vmodels.widgets
         */
        prepareWidgetDirectory: function(pagesVM, models){
            var directoryObj =  avalon.mix(true, {}, models.widgets)

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
        },

        /**
         * 准备样例目录
         * @param pagesVM vmodels.pages
         * @param models 页面数据
         * @param widgetId hash param中的组件id
         */
        prepareExampleDirectory: function(pagesVM, models, widgetId){
            widgetId = widgetId || "accordion"

            var exampleObj = {},
                widgetExs = exampleObj[widgetId] = avalon.mix(true, {}, models.examples[widgetId])

            for(var exId in widgetExs){
                var exampleId = widgetExs[exId].match(/ex\d*(?=\.html)/)[0],
                    exHref = "#!/widgets/?widgetId=" + widgetId + "&ex=" + exampleId

                widgetExs[exId] = {
                    content: widgetExs[exId],
                    href: exHref
                }
            }

            pagesVM.directorys = exampleObj
        },

        /**
         * 准备API，包括目录、当前状态、和api内容模板
         * @param currentApi hash param中的api id
         * @param pagesVM vmodels.pages
         * @param apisVm vmodels.apis
         * @param apis apis数据
         */
        prepareApi: function(currentApi, pagesVM, apisVm, apis){
            var firstApi, currentApiSrc
            
            for (var i in apis) {
                for (var j in apis[i]) {
                    firstApi = apis[i][j]
                    break
                }
                break
            }

            // 找crrentAPI对应的链接
            for (var i in apis) {
                for (var j in apis[i]) {
                    if (j === currentApi) {
                        currentApiSrc = apis[i][j]
                        break
                    }
                }
            }

            pagesVM.activeNav = "APIs"
            pagesVM.listSrc = "pages/index/views/apis/list.html"

            if (typeof currentApi !== "undefined") {
                apisVm.apiSrc = "pages/index/views/apis/" + currentApiSrc
            } else {
                apisVm.apiSrc = "pages/index/views/apis/" + firstApi
            }

            // 添加href
            var apisObj = avalon.mix(true, {}, apis)

            for (var groupIndex in apisObj) {
                var apiGroup = apisObj[groupIndex]

                for (var apiIndex in apiGroup) {
                    apiGroup[apiIndex] = {
                        content: apiGroup[apiIndex],
                        href: "#!/apis?api=" + apiIndex
                    }
                }
            }

            // 确定active anchor
            if (typeof currentApi !== "undefined") {
                pagesVM.currentAnchor = currentApi
            } else {
                pagesVM.currentAnchor = "非监控属性"
            }

            pagesVM.directorys = apisObj
        }
    }

    return utils
})