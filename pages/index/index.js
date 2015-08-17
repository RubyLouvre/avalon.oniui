//avalon.config({
//    debug: false
//})

require(["ready!", "mmRouter/mmState"], function () {
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
        widgets: {
            "cookie": {
                "intro": "cookie工具集",
                "group": "util"
            },
            "draggable": {
                "intro": "拖拽/可拖动",
                "group": "util"
            },
            "lazyload": {
                "intro": "懒加载",
                "group": "util"
            },
            "mmPromise": {
                "intro": "异步列队",
                "group": "util"
            },
            "mmRouter": {
                "intro": "复选框列表",
                "group": "util"
            },
            "position": {
                "intro": "定位",
                "group": "util"
            },
            "resizable": {
                "intro": "伸缩",
                "group": "util"
            },
            "store": {
                "intro": "本地储存",
                "group": "util"
            },
            "validation": {
                "intro": "验证",
                "group": "util"
            },
            "accordion": {
                "intro": "手风琴",
                "group": "ui"
            },
            "at": {
                "intro": "@组件",
                "group": "ui"
            },
            "browser": {
                "intro": "浏览器检测模块",
                "group": "ui"
            },
            "button": {
                "intro": "按钮",
                "group": "ui"
            },
            "camera": {
                "intro": "百叶窗图片轮播",
                "group": "ui"
            },
            "carousel": {
                "intro": "轮播/跑马灯",
                "group": "ui"
            },
            "checkboxlist": {
                "intro": "复选框列表",
                "group": "ui"
            },
            "colorpicker": {
                "intro": "颜色选择器/取色器",
                "group": "ui"
            },
            "coupledatepicker": {
                "intro": "日期范围选择的双日历",
                "group": "ui"
            },
            "datepicker": {
                "intro": "日期选择器",
                "group": "ui"
            },
            "daterangepicker": {
                "intro": "日期范围选择日历",
                "group": "ui"
            },
            "dialog": {
                "intro": "对话框弹窗",
                "group": "ui"
            },
            "doublelist": {
                "intro": "平衡木/左右列表/双列表",
                "group": "ui"
            },
            "dropdown": {
                "intro": "下拉框",
                "group": "ui"
            },
            "dropdownlist": {
                "intro": "下拉列表",
                "group": "ui"
            },
            "flipswitch": {
                "intro": "滑动式开关",
                "group": "ui"
            },
            "fileuploader": {
                "intro": "文件上传",
                "group": "ui"
            },
            "kindeditor": {
                "intro": "富文本编辑器",
                "group": "ui"
            },
            "layout": {
                "intro": "布局",
                "group": "ui"
            },
            "loading": {
                "intro": "加载动画效果",
                "group": "ui"
            },
            "live": {
                "intro": "事件代理绑定",
                "group": "ui"
            },
            "mask": {
                "intro": "遮罩层",
                "group": "ui"
            },
            "menu": {
                "intro": "菜单",
                "group": "ui"
            },
            "miniswitch": {
                "intro": "下拉式开关",
                "group": "ui"
            },
            "notice": {
                "intro": "提示/提示信息",
                "group": "ui"
            },
            "pager": {
                "intro": "分页",
                "group": "ui"
            },
            "preview": {
                "intro": "图片预览/图片批量预览",
                "group": "ui"
            },
            "progressbar": {
                "intro": "进度条/倒计时",
                "group": "ui"
            },
            "rating": {
                "intro": "评分",
                "group": "ui"
            },
            "scrollbar": {
                "intro": "滚动条",
                "group": "ui"
            },
            "scrollspy": {
                "intro": "滚动监听",
                "group": "ui"
            },
            "smartgrid": {
                "intro": "静态模板表格",
                "group": "ui"
            },
            "simplegrid": {
                "intro": "表格/大数据展示",
                "group": "ui"
            },
            "slider": {
                "intro": "滑块",
                "group": "ui"
            },
            "spinner": {
                "intro": "数字输入框",
                "group": "ui"
            },
            "switchdropdown": {
                "intro": "切换下拉框",
                "group": "ui"
            },
            "tab": {
                "intro": "选项卡/标签页",
                "group": "ui"
            },
            "textbox": {
                "intro": "提示功能的输入框",
                "group": "ui"
            },
            "timer": {
                "intro": "时间选择器",
                "group": "ui"
            },
            "tree": {
                "intro": "树",
                "group": "ui"
            },
            "tooltip": {
                "intro": "气泡提示",
                "group": "ui"
            },
            "uploader": {
                "intro": "图片上传/文件上传",
                "group": "ui"
            }
        },
        currentWidget: "cookie",
        getWidget: function(widgetId){
            pagesVM.currentWidget = widgetId
            widgetsVM.widgetSrc =  widgetId+ "/avalon." + widgetId + ".doc.html"
        }
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
            var hash = location.hash

            if(hash.indexOf("?") !== -1){
                var params = hash.split("?")[1],
                    widgetId = params.split("=")[1]

                pagesVM.currentWidget = widgetId
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
