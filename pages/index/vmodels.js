/**
 * 各个页面的vmodel
 */

define(["pages/index/models", "pages/index/utils", "mmRouter/mmState", "domReady!"], function (models, utils) {
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
                if (vmodels.navs[key][0] !== "#") {
                    return
                }
                vmodels.activeNav = key
            },

            // 搜索框
            searchKey: "",
            search: function (e) {
                if (e.keyCode === 13 || e.type === "click") {

                    if (pagesVM.activeNav === "组件库") {
                        pagesVM.backToMenu()
                        utils.scrollDir("widgets", pagesVM.searchKey, pagesVM.directorys.$model)
                    } else {
                        utils.scrollDir("apis", pagesVM.searchKey, pagesVM.directorys.$model)
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
                pagesVM.goWidgetBtnVisible = false
                pagesVM.backToMenuBtnVisible = true

                utils.prepareExampleDirectory(pagesVM, models, utils.getHashValue("widgetId"))
            },
            backToMenu: function () {
                pagesVM.goWidgetBtnVisible = true
                pagesVM.backToMenuBtnVisible = false

                utils.prepareWidgetDirectory(pagesVM, models)
            },

            // 获取组件使用说明链接
            getDocHref: function () {
                var widgetId = utils.getHashValue("widgetId")
                return "#!/widgets/?widgetId=" + widgetId + "&ex=doc"
            },

            // 目录模板和内容
            listSrc: "pages/index/views/widgets/list.html",
            directorys: {},

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

