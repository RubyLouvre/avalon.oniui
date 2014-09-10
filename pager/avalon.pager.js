define(["avalon",
    "text!./avalon.pager.html",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.pager.css"
], function(avalon, template) {

    var widget = avalon.ui.pager = function(element, data, vmodels) {
        var options = data.pagerOptions
        var pageOptions = options.options
        if (Array.isArray(pageOptions)) {
            options.options = pageOptions.map(function(el) {
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
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        options._currentPage = options.currentPage
        var vmodel = avalon.define(data.pagerId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.$skipArray = ["showPages", "widgetElement", "template", "ellipseText", "alwaysShowPrev", "alwaysShowNext"]
            //这些属性不被监控
            vm.$init = function() {
                var pageHTML = options.template
                element.style.display = "none"
                element.innerHTML = pageHTML
                setTimeout(function() {
                    avalon.scan(element, [vmodel].concat(vmodels))
                    element.style.display = "block"
                }, 100)
                if (typeof options.onInit === "function") {
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
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
            vm.$watch("totalItems", function() {
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.$watch("perPages", function(a) {
                vm.currentPage = 1
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.$watch("currentPage", function(a) {
                vmodel._currentPage = a
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.isShowPrev = function() {
                var a = vm.alwaysShowPrev;
                var b = vm.firstPage;
                var c = vm.currentPage;
                return (a || b !== 1) && c !== 1;
            }
            vm.isShowNext = function() {
                var a = vm.alwaysShowNext
                var b = vm.lastPage
                var c = vm.totalPages
                return a || b !== c
            }

            vm.changeCurrentPage = function(e, value) {
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
        scripts.sort(function(a, b) {
            return a.el - b.el
        })
        scripts.forEach(function(el, index) {
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
    widget.defaults = {
        perPages: 10, //每页包含多少条目
        showPages: 10, //要显示的页面的数量，从1开始
        currentPage: 1, //当前被高亮的页面，从1开始
        _currentPage: 1,
        totalItems: 200, //总条目数
        totalPages: 0, //总页数,通过Math.ceil(vm.totalItems / vm.perPages)求得
        pages: [], //要显示的页面组成的数字数组，如[1,2,3,4,5,6,7]
        nextText: ">",
        prevText: "<",
        ellipseText: "…",
        firstPage: 0, //当前可显示的最小页码，不能小于1
        lastPage: 0, //当前可显示的最大页码，不能大于totalPages
        alwaysShowNext: false, //总是显示向后按钮
        alwaysShowPrev: false, //总是显示向前按钮
        showFirstOmit: false,
        showLastOmit: false,
        showJumper: false, //是否显示输入跳转台
        getTemplate: function(tmpl, opts) {
            return tmpl
        },
        onJump: avalon.noop, //页面跳转时触发的函数
        getTitle: function(a, currentPage, totalPages) {
            switch (a) {
                case "first":
                    if (currentPage == 1) {
                        return "当前页"
                    }
                    return "跳转到第一页"
                case "prev":
                    return "跳转到上一页"
                case "next":
                    return "跳转到下一页"
                case "last":
                    if (currentPage == totalPages) {
                        return "当前页"
                    }
                    return "跳转到最后一页"
                default:
                    if (a === currentPage) {
                        return "当前页"
                    }
                    return "跳转到第" + a + "页"
            }
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
//http://luis-almeida.github.io/jPages/defaults.html
//http://gist.corp.qunar.com/jifeng.yao/gist/demos/pager/pager.html


