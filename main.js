
require([
    "avalon",
    "domReady!",
    "./tab/avalon.tab",
    "./pager/avalon.pager",
    "./datepicker/avalon.datepicker"
], function (avalon) {
    avalon.log("domReady完成!")
    var vm = avalon.define({$id: "demo",
        //切换卡相关的配置
        tab: {
            onActivate: function (e) {
                avalon.log("user define cc activate callback")
            }
            , onClickActive: function (e, model) {
                alert('u click a active tab')
            }
            , autoSwitch: 1200
            , active: 1
            , tabs: [{
                    title: "水果2",
                    name: "fruit",
                    removable: false,
                    href: "http://news.163.com/"
                },
                {
                    title: "服装2",
                    name: "cloth"
                },
                {
                    title: "水果<i>非国产经典品牌</i>十分流弊"
                    , name: "tool"
                },
                {
                    title: "电器2"
                    , name: "tool"
                },
                {
                    title: "动物2"
                    , name: "animal"
                    , disabled: true
                }
            ]
            , tabpanels: [
                {content: "line 1 - <a href=\"#\" ms-click=\"add(peaple)\">点击我添加一个tab!</a>"},
                {content: "avalon.tab.ajax.html", contentType: "ajax"},
                {content: "line 2 - <a href=\"#\" ms-click=\"enable(4)\">点击我激活动物tab!</a>"},
                {content: 'line 3 -  <a href="#" ms-click="add(peaple2)">点击我添加一个不能删除的tab! </a>'},
                {content: "line 4"}
            ]
        },
        peaple: {
            title: "人类"
            , content: "我是来搞笑的"
        },
        peaple2: {
            title: "人类"
            , removable: false
            , content: "我是来搞笑的"
        },
        $skipArray: ["tab"]

    })
    avalon.scan(document.body, vm);
    //你们的业务代码
})
