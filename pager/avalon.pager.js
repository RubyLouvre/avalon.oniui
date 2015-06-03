/**
 * @cnName 分页组件
 * @enName pager
 * @introduce
 *  <p> 分页组件 用于各种列表与表格的下方 。</p>
 */

define(["avalon",
    "text!./avalon.pager.html",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.pager.css"
], function (avalon, template) {

    var widget = avalon.ui.pager = function (element, data, vmodels) {
        var options = data.pagerOptions
        var pageOptions = options.options
        if (Array.isArray(pageOptions)) {
            options.options = pageOptions.map(function (el) {
                var obj = {}
                switch (typeof el) {
                    case "number":
                    case "string":
                        obj.value = el
                        obj.text = el
                        return obj
                    case "object":
                        return el
                }
            })
        } else {
            options.options = []
        }
        if (vmodels.cb) {
            template = template.replace(/ms-title/g, "ms-attr-title")
        }
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        options._currentPage = options.currentPage
        var vmodel = avalon.define(data.pagerId, function (vm) {
            avalon.mix(vm, options, {
                regional: widget.defaultRegional
            })
            vm.widgetElement = element
            vm.rootElement = {}
            vm.$skipArray = ["showPages", "rootElement", "widgetElement", "template", "ellipseText", "alwaysShowPrev", "alwaysShowNext"]
            //这些属性不被监控
            vm.$init = function (continueScan) {
                var pageHTML = options.template
                element.style.display = "none"
                setTimeout(function () {
                    element.innerHTML = pageHTML
                    vm.rootElement = element.getElementsByTagName("*")[0]
                    element.style.display = "block"
                    if (continueScan) {
                        continueScan()
                    } else {
                        avalon.log("avalon请尽快升到1.3.7+")
                        avalon.scan(element, [vmodel].concat(vmodels))
                        if (typeof options.onInit === "function") {
                            options.onInit.call(element, vmodel, options, vmodels)
                        }
                    }
                }, 100)
            }
            vm.$remove = function () {
                element.innerHTML = element.textContent = ""
            }
            vm.jumpPage = function (event, page) {
                event.preventDefault()
                var enabled = this.className.indexOf("state-disabled") === -1
                if (enabled && page !== vm.currentPage) {
                    switch (page) {
                        case "first":
                            vm.currentPage = 1
                            break
                        case "last":
                            vm.currentPage = vm.totalPages
                            break
                        case "next":
                            vm.currentPage++
                            if (vm.currentPage > vm.totalPages) {
                                vm.currentPage = vm.totalPages
                            }
                            break
                        case "prev":
                            vm.currentPage--
                            if (vm.currentPage < 1) {
                                vm.currentPage = 1
                            }
                            break
                        default:
                            vm.currentPage = page
                            break
                    }
                    vm.onJump.call(element, event, vm)
                    efficientChangePages(vm.pages, getPages(vm))
                }
            }
            vm.$watch("totalItems", function () {
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.$watch("perPages", function (a) {
                vm.currentPage = 1
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.$watch("currentPage", function (a) {
                vmodel._currentPage = a
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.isShowPrev = function () {
                var a = vm.alwaysShowPrev;
                var b = vm.firstPage
                return a || b !== 1
            }
            vm.isShowNext = function () {
                var a = vm.alwaysShowNext
                var b = vm.lastPage
                var c = vm.totalPages
                return a || b !== c
            }

            vm.changeCurrentPage = function (e, value) {
                if (e.type === "keyup") {
                    value = this.value
                    if (e.keyCode !== 13)
                        return
                } else {
                    value = vmodel._currentPage
                }
                value = parseInt(value, 10) || 1
                if (value > vmodel.totalPages || value < 1)
                    return
                //currentPage需要转换为Number类型 fix lb1064@qq.com
                vmodel.currentPage = value
                vmodel.pages = getPages(vmodel)
                vmodel.onJump.call(element, e, vm);
            }
            vm.pages = []
            vm.getPages = getPages

            //设置语言包
            vm.setRegional = function (regional) {
                vmodel.regional = regional
            }
            vm._getTotalPages = function (totalPages) {
                //return {{regional.totalText}}{{totalPages}}{{regional.pagesText}}，{{regional.toText}}{{regional.numberText}}
                var regional = vmodel.regional,
                        html = [regional.totalText, totalPages]

                if (totalPages > 1) {
                    html.push(regional.pagesText)
                } else {
                    html.push(regional.pageText)
                }

                html = html.concat([" ", regional.jumpToText, regional.numberText])

                return html.join("")
            }

            /**
             * @config {Function} 获取页码上的title的函数
             * @param {String|Number} a 当前页码的类型，如first, prev, next, last, 1, 2, 3
             * @param {Number} currentPage 当前页码
             * @param {Number} totalPages 最大页码
             * @returns {String}
             */
            vm.getTitle = function (a, currentPage, totalPages) {

                var regional = vmodel.regional

                switch (a) {
                    case "first":
                        if (currentPage == 1) {
                            return regional.currentText
                        }
                        return regional.jumpToText + " " + regional.firstText
                    case "prev":
                        return regional.jumpToText + " " + regional.prevText
                    case "next":
                        return regional.jumpToText + " " + regional.nextText
                    case "last":
                        if (currentPage == totalPages) {
                            return regional.currentText
                        }
                        return regional.jumpToText + " " + regional.lastText
                    default:
                        if (a === currentPage) {
                            return regional.currentText
                        }
                        return regional.jumpToText + regional.numberText + " " + a + regional.pageText
                }
            }
        })
        vmodel.pages = getPages(vmodel)

        return vmodel
    }
    //vmodel.pages = getPages(vmodel) 会波及一些其他没有改动的元素节点,现在只做个别元素的添加删除操作
    function efficientChangePages(aaa, bbb) {
        var obj = {}
        for (var i = 0, an = aaa.length; i < an; i++) {
            var el = aaa[i]
            obj[el] = {action: "del", el: el}
        }
        for (var i = 0, bn = bbb.length; i < bn; i++) {
            var el = bbb[i]
            if (obj[el]) {
                obj[el] = {action: "retain", el: el}
            } else {
                obj[el] = {action: "add", el: el}
            }
        }
        var scripts = []
        for (var i in obj) {
            scripts.push({
                action: obj[i].action,
                el: obj[i].el
            })
        }
        scripts.sort(function (a, b) {
            return a.el - b.el
        })
        scripts.forEach(function (el, index) {
            el.index = index
        })
        //添加添加
        var reverse = []
        for (var i = 0, el; el = scripts[i++]; ) {
            switch (el.action) {
                case "add":
                    aaa.splice(el.index, 0, el.el)
                    break;
                case "del":
                    reverse.unshift(el)
                    break;
            }
        }
        //再删除
        for (var i = 0, el; el = reverse[i++]; ) {
            aaa.splice(el.index, 1)
        }

    }

    //默认语言包为中文简体
    widget.regional = []
    widget.regional["zh-CN"] = {
        prevText: "上一页",
        nextText: "下一页",
        confirmText: "确定",
        totalText: "共",
        pagesText: "页",
        pageText: "页",
        toText: "到",
        jumpToText: "跳转到",
        currentText: "当前页",
        firstText: "第一页",
        lastText: "最后一页",
        numberText: "第"
    }

    //设置默认语言包
    widget.defaultRegional = widget.regional["zh-CN"]

    widget.defaults = {
        perPages: 10, //@config {Number} 每页包含多少条目
        showPages: 10, //@config {Number} 中间部分一共要显示多少页(如果两边出现省略号,即它们之间的页数) 
        currentPage: 1, //@config {Number} 当前选中的页面 (按照人们日常习惯,是从1开始)，它会被高亮 
        _currentPage: 1, //@config {Number}  跳转台中的输入框显示的数字，它默认与currentPage一致
        totalItems: 200, //@config {Number} 总条目数
        totalPages: 0, //@config {Number} 总页数,通过Math.ceil(vm.totalItems / vm.perPages)求得
        pages: [], //@config {Array} 要显示的页面组成的数字数组，如[1,2,3,4,5,6,7]
        nextText: ">", //@config {String} “下一页”分页按钮上显示的文字 
        prevText: "<", //@config {String} “上一页”分页按钮上显示的文字 
        ellipseText: "…", //@config {String} 省略的页数用什么文字表示 
        firstPage: 0, //@config {Number} 当前可显示的最小页码，不能小于1
        lastPage: 0, //@config {Number} 当前可显示的最大页码，不能大于totalPages
        alwaysShowNext: false, //@config {Boolean} 总是显示向后按钮
        alwaysShowPrev: false, //@config {Boolean} 总是显示向前按钮
        showFirstOmit: false,
        showLastOmit: false,
        showJumper: false, //是否显示输入跳转台
        /*
         * @config {Function} 用于重写模板的函数 
         * @param {String} tmpl
         * @param {Object} opts
         * @returns {String}
         */
        getTemplate: function (tmpl, opts) {
            return tmpl
        },
        options: [], // @config {Array}数字数组或字符串数组或对象数组,但都转换为对象数组,每个对象都应包含text,value两个属性, 用于决定每页有多少页(看avalon.pager.ex3.html) 
        /**
         * @config {Function} 页面跳转时触发的函数,如果当前链接处于不可以点状态(oni-state-disabled),是不会触发的
         * @param {Event} e
         * @param {Object} vm  组件对应的VM
         */
        onJump: function (e, vm) {
        }
    }

    function getPages(vm) {
        var c = vm.currentPage, max = Math.ceil(vm.totalItems / vm.perPages), pages = [], s = vm.showPages,
                left = c, right = c
        //一共有p页，要显示s个页面
        vm.totalPages = max
        if (max <= s) {
            for (var i = 1; i <= max; i++) {
                pages.push(i)
            }
        } else {
            pages.push(c)
            while (true) {
                if (pages.length >= s) {
                    break
                }
                if (left > 1) {//在日常生活是以1开始的
                    pages.unshift(--left)
                }
                if (pages.length >= s) {
                    break
                }
                if (right < max) {
                    pages.push(++right)
                }
            }
        }
        vm.firstPage = pages[0] || 1
        vm.lastPage = pages[pages.length - 1] || 1
        vm.showFirstOmit = vm.firstPage > 2
        vm.showLastOmit = vm.lastPage < max - 1
        return  pages//[0,1,2,3,4,5,6]
    }
    return avalon
})
/**
 * @other
 * <p>pager 组件有一个重要的jumpPage方法，用于决定它的跳转方式。它有两个参数，第一个事件对象，第二个是跳转方式，见源码：</p>
 ```javascript
 vm.jumpPage = function(event, page) {
 event.preventDefault()
 if (page !== vm.currentPage) {
 switch (page) {
 case "first":
 vm.currentPage = 1
 break
 case "last":
 vm.currentPage = vm.totalPages
 break
 case "next":
 vm.currentPage++
 if (vm.currentPage > vm.totalPages) {
 vm.currentPage = vm.totalPages
 }
 break
 case "prev":
 vm.currentPage--
 if (vm.currentPage < 1) {
 vm.currentPage = 1
 }
 break
 default:
 vm.currentPage = page
 break
 }
 vm.onJump.call(element, event, vm)
 efficientChangePages(vm.pages, getPages(vm))
 }
 }
 ```
 */

/**
 *  @links
 [显示跳转台](avalon.pager.ex1.html)
 [指定回调onJump](avalon.pager.ex2.html)
 [改变每页显示的数量](avalon.pager.ex3.html)
 [指定上一页,下一页的文本](avalon.pager.ex4.html)
 [通过左右方向键或滚轮改变页码](avalon.pager.ex5.html)
 [总是显示上一页与下一页按钮](avalon.pager.ex6.html)
 [多语言支持](avalon.pager.ex7.html)
 *
 */
//http://luis-almeida.github.io/jPages/defaults.html
//http://gist.corp.qunar.com/jifeng.yao/gist/demos/pager/pager.html

