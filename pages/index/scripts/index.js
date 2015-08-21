/**
 * 路由控制以及页面准备
 */

avalon.config({
    debug: false
})

require(["pages/index/scripts/models", "pages/index/scripts/utils", "pages/index/scripts/vmodels", "mmRouter/mmState"], function (models, utils, vms) {

    avalon.state("index", {
        url: "/",
        views: {
            "": {
                templateUrl: "pages/index/views/widgets/index.html"
            }
        },
        onEnter: function () {
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
        onBeforeEnter: function () {
            vms.pages.activeNav = "组件库"

            var widgetId = utils.getHashValue("widgetId"),
                ex = utils.getHashValue("ex")

            utils.prepareWidget(widgetId, ex, vms.pages, vms.widgets, models)
        }
    })

    avalon.state("apis", {
        url: "/apis",
        views: {
            "": {
                templateUrl: "pages/index/views/apis/index.html"
            }
        },
        onBeforeEnter: function () {

            var currentApi = utils.getHashValue("api")
            utils.prepareApi(currentApi, vms.pages, vms.apis, models.apis)

        }
    })

    avalon.state("download", {
        url: "/download",
        views: {
            "": {
                templateUrl: "pages/index/views/download/index.html"
            }
        },
        onBeforeEnter: function () {
            vms.pages.activeNav = "下载"
        }
    })

    avalon.history.start({
        basepath: "/mmRouter"
    })

    avalon.scan();
})