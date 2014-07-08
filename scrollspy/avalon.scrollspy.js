/**
  * scrollspy组件，
  *
  */
define(["avalon", "text!./avalon.scrollspy.html", "css!./avalon.scrollspy.css"], function(avalon, template) {
    // 站位用来生成文档用注释
    // widget.defaults = {
    var defaults = {
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        spytarget: void 0,
        $author: "skipper@123"
    }
    avalon.bindingHandlers.scrollspy = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || ["$", "scrollspy"]
        var ID = args[0].trim(), opts = args[1], vmodel, vmOptions
        if (ID && ID != "$") {
            vmodel = avalon.vmodels[ID]//如果指定了此VM的ID
            if (!vmodel) {
                return
            }
        }
        data.element.removeAttribute("ms-scrollspy")
        if (!vmodel) {//如果使用$或绑定值为空，那么就默认取最近一个VM，没有拉倒
            vmodel = vmodels.length ? vmodels[0] : null
        }
        var fnObj = vmodel || {}
        if (vmodel && typeof vmodel[opts] === "object") {//如果指定了配置对象，并且有VM
            vmOptions = vmodel[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
            fnObj = vmOptions
        }
        var element = data.element,
            options = avalon.mix({}, defaults, vmOptions || {}, data[opts] || {}, avalon.getWidgetData(element, "scrollspy")),
            spytarget = document.getElementById(options.spytarget),
            msData = element.msData,
            // 滚动导致的切换元素
            $element = avalon(spytarget)
            
        function getAllTargets() {
            var a = spytarget ? spytarget.getElementsByTagName("a") : false,
                arr = []
            avalon.each(a, function(i, item) {
                var href = item.href, id
                if(id = href.match(/^#[\s]+/g)) {
                    arr.push(id[0].substring(1))
                }
            })
            return arr
        }
        // do something while scrolling
        function onScroll(x, y) {
            var list = getAllTargets()
            if(x != void 0) {

            }
            if (y != void 0) {

            }
            console.log(list)
        }
        // 原生滚动事件
        avalon.bind(element, "scroll", function(e) {
            onScroll(element.scrollTop, element.scrollLeft)
        })
        // if scrollbar is used
        if(msData && msData["ms-widget"] == "scrollbar") {
            var myScroll = avalon.vmodels[msData["ms-widget-id"]]
            myScroll.$watch("scrollLeft", function(n, o) {
                onScroll(n, void 0)
            })
            myScroll.$watch("scrollTop", function(n, o) {
                onScroll(void 0, n)
            })
        }
        // callback after inited
        if(typeof options.onInit === "function" ) {
            //vmodels是不包括vmodel的 
            options.onInit.call(element, vmodel, options, vmodels)
        }
    }
})