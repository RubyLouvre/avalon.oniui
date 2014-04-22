//avalon 1.2.5 2014.4.2
define(["avalon"], function(avalon) {
    var widget = avalon.ui.at = function(element, data, vmodels) {

        var options = data.atOptions, $element = avalon(element), keyupCallback, popup
        var vmodel = avalon.define(data.atId, function(vm) {

            avalon.mix(vm, options)

            vm.$skipArray = ["at", "widgetElement"]
            vm.widgetElement = element
       
            vm.$init = function() {
                keyupCallback = $element.bind("keyup", function(e) {
                    var value = this.value
                    var at = options.at
                    var index = value.lastIndexOf(at)
                    if (index > -1) {
                        if (!popup) {
                            var str = value.replace(/\s+$/g, "").split("").join("<wbr>") + "<wbr>"
                            str = str.replace("<wbr>" + at + "<wbr>", "<bdi>" + at + "</bdi>")

                            var fakeTextArea = document.createElement("div")
                            fakeTextArea.innerHTML = str
                            document.body.appendChild(fakeTextArea)
                            var styles = window.getComputedStyle ?
                                    window.getComputedStyle(element, null) :
                                    element.currentStyle
                            var $fakeTextArea = avalon(fakeTextArea)
                            for (var i in styles) {//确保DIV与TEXTAREA中的样式一致
                                if (typeof styles[i] !== "function") {
                                    try {
                                        $fakeTextArea.css(i, styles[i])
                                    } catch (e) {
                                    }
                                }
                            }

                            $fakeTextArea.css({
                                width: this.offsetWidth,
                                height: this.offsetHeight,
                                border: "1px solid red",
                                "word-wrap": "break-word", //fix IE6-8
                                "word-break": "break-all" //fix IE6-8
                            })

                            var offset = $element.offset()
                            var fakeRect = fakeTextArea.getBoundingClientRect()
                            var bdi = fakeTextArea.getElementsByTagName("bdi")[0]
                            if (document.createRange && document.documentMode != 9) {//如果是IE10+或W3C
                                var range = document.createRange();
                                range.selectNode(bdi)
                            } else {
                                var range = document.selection.createRange().duplicate()
                                range.moveToElementText(bdi)
                                range.select();
                            }
                            //取得@相对于文本框或文本区的距离的关键，Range对象与元素节点一样都有getBoundingClientRect
                            var rangeRect = range.getBoundingClientRect()
                            var top = rangeRect.bottom - fakeRect.top
                            var left = rangeRect.left - fakeRect.left
                            popup = document.createElement("div")
                            popup.innerHTML = "这是@菜单"
                            document.body.appendChild(popup)
                            avalon(popup).css({
                                width: 100,
                                height: 100,
                                backgroundColor: "#ddd",
                                top: offset.top + top,
                                left: offset.left + left,
                                position: "absolute"
                            })
                            document.body.removeChild(fakeTextArea)
                        }


                    }
                })
                avalon.scan(element, [vmodel].concat(vmodels))
            }
            vm.$remove = function() {
                avalon(element).unbind(keyupCallback)
                if (popup) {
                    popup.innerHTML = ""
                    document.body.removeChild(popup)
                }

            }


        })
        return vmodel

    }
    widget.vertion = 1.0
    widget.defaults = {
        at: "@", //默认的标识符,
        datalist: [], //字符串数组
        popupHTML: "",
        limit: 5, //最多显示多少个
        matchLength: 20, //@之后多长的字符串可以匹配
        highlightCallback: avalon.noop,
        sortCallback: avalon.noop,
        matchCallback: avalon.noop,
    }

    return avalon
})
