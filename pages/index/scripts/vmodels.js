/**
 * 各个页面的vmodel
 */

define(["pages/index/scripts/models", "pages/index/scripts/utils", "mmRouter/mmState", "domReady!"], function (models, utils) {
    var vmodels = {
        pages: avalon.define({
            $id: "pages",

            // 导航
            navs: {
                "组件库": "#!/widgets",
                "APIs": "#!/apis",
                "下载": "#!/download",
                "打包工具": "http://l-uedapp2.h.dev.cn0.qunar.com:8088/"
            },
            activeNav: utils.getActiveNav(),
            switchNavTo: function (key) {
                if (vmodels.pages.navs[key][0] !== "#") {
                    return
                }
                vmodels.pages.activeNav = key
            },

            // 搜索框
            searchKey: "",
            search: function (e) {
                if (e.keyCode === 13 || e.type === "click") {

                    if (vmodels.pages.activeNav === "组件库") {
                        vmodels.pages.backToMenu()
                        utils.scrollDir("widgets", vmodels.pages.searchKey, vmodels.pages.directorys.$model)
                    } else {
                        utils.scrollDir("apis", vmodels.pages.searchKey, vmodels.pages.directorys.$model)
                    }
                }
            },
            selectSearchKey: function (e) {
                e.target.setSelectionRange(0, this.value.length)
            },

            // 目录菜单按钮
            goWidgetBtnVisible: false,
            backToMenuBtnVisible: false,
            showWidgetExs: function () {
                vmodels.pages.goWidgetBtnVisible = false
                vmodels.pages.backToMenuBtnVisible = true

                utils.prepareExampleDirectory(vmodels.pages, models, utils.getHashValue("widgetId"))
            },
            backToMenu: function () {
                vmodels.pages.goWidgetBtnVisible = true
                vmodels.pages.backToMenuBtnVisible = false

                utils.prepareWidgetDirectory(vmodels.pages, models)
            },

            // 获取组件使用说明链接
            getDocHref: function () {
                var widgetId = utils.getHashValue("widgetId")
                return "#!/widgets/?widgetId=" + widgetId + "&ex=doc"
            },

            // 目录模板和内容
            listSrc: "pages/index/views/widgets/list.html",
            directorys: {},
            scrollToTop: function(listItemData){
                if(typeof listItemData.intro !== "undefined"){
                    var listWrap = document.getElementById("listWrap")
                    listWrap.scrollTop = 0
                }
            },
            getListItemTitle: function(key, intro){
                if(typeof intro !== "undefined"){
                    return key + "-" + intro
                } else{
                    return key
                }
            },

            // 组件库页当前状态
            currentWidget: "accordion",
            currentWidgetIntro: "手风琴",
            currentEx: "",

            // APIs页当前状态
            currentAnchor: "非监控属性"

        }),

        widgets: avalon.define({
            $id: "widgets",

            // 组件内容
            widgetSrc: ""
        }),

        apis: avalon.define({
            $id: "apis",

            // API内容页面
            apiSrc: "",

            // 高亮代码
            highlight: function () {
                SyntaxHighlighter.highlight()
            },

            // 获取“静态方法”页面数据
            statics: models.statics
        })
    }

    return vmodels
});

