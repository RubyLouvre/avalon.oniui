define(["avalon", "text!./avalon.pager.html"], function(avalon, tmpl) {

    var arr = tmpl.split("MS_OPTION_STYLE") || ["", ""]
    var cssText = arr[1].replace(/<\/?style>/g, "")
    var styleEl = document.getElementById("avalonStyle")
    var template = arr[0]
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    var widget = avalon.ui.pager = function(element, data, vmodels) {
        var options = data.pagerOptions
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        options._currentPage = options.currentPage
        var vmodel = avalon.define(data.pagerId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.$skipArray = ["showPages", "widgetElement", "template", "ellipseText", "alwaysShowPrev", "alwaysShowNext"]//这些属性不被监控
            vm.$init = function() {
                var pageHTML = options.template
                if (vmodel.alwaysShowPrev) {
                    pageHTML = pageHTML.replace('ms-if="firstPage!==1"', "")
                }
                if (vmodel.alwaysShowNext) {
                    var index = 0
                    pageHTML = pageHTML.replace(/ms-if="lastPage!==maxPage"/g, function(a) {
                        index++
                        if (index == 3) {
                            return ""
                        } else {
                            return a
                        }
                    })
                }
                element.innerHTML = pageHTML
                avalon.scan(element, [vmodel].concat(vmodels))
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
                            vm.currentPage = vm.maxPage
                            break
                        case "next":
                            vm.currentPage++
                            if (vm.currentPage > vm.maxPage) {
                                vm.currentPage = vm.maxPage
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
            vm.$watch("total", function() {
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.$watch("perPages", function() {
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.$watch("currentPage", function(a) {
                vmodel._currentPage = a
            })
            vm.changeCurrentPage = function(e) {
                if (e.type === "keyup" && e.keyCode !== 13)
                    return
                vmodel.currentPage = vmodel._currentPage
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
            return el
        })
//添加添加
        for (var i = 0, el; el = scripts[i++]; ) {
            switch (el.action) {
                case "add":
                    aaa.splice(el.index, 0, el.el)
                    break;
            }
        }
        scripts.reverse()
        //再删除
        for (var i = 0, el; el = scripts[i++]; ) {
            switch (el.action) {
                case "del":
                    aaa.splice(el.index, 1)
                    break;
            }
        }

    }
    widget.defaults = {
        perPages: 10, //每页显示多少条目
        showPages: 10, //一共显示多页，从1开始
        currentPage: 1, //当前被高亮的页面，从1开始
        _currentPage: 1,
        total: 200,
        pages: [], //装载所有要显示的页面，从1开始
        nextText: ">",
        prevText: "<",
        ellipseText: "…",
        firstPage: 0, //当前可显示的最小页码，不能小于1
        lastPage: 0, //当前可显示的最大页码，不能大于maxPage
        maxPage: 0, //通过Math.ceil(vm.total / vm.perPages)求得
        alwaysShowNext: false, //总是显示向后按钮
        alwaysShowPrev: false, //总是显示向前按钮
        showJumper: false, //是否显示输入跳转台
        getTemplate: function(tmpl, opts) {
            return tmpl
        },
        onJump: avalon.noop, //页面跳转时触发的函数
        getTitle: function(a) {
            switch (a) {
                case "first":
                    return "Go To First Page"
                case "prev":
                    return "Go To Previous Page"
                case "next":
                    return "Go To Next Page"
                case "last":
                    return "Go To Last Page"
                default:
                    return "Go to page " + a + ""
            }
        }
    }

    function getPages(vm) {
        var c = vm.currentPage, p = Math.ceil(vm.total / vm.perPages), pages = [], s = vm.showPages, max = p,
                left = c, right = c
        //一共有p页，要显示s个页面
        vm.maxPage = max
        if (p <= s) {
            for (var i = 1; i <= p; i++) {
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
        vm.firstPage = pages[0]
        vm.lastPage = pages[pages.length - 1]
        return  pages//[0,1,2,3,4,5,6]
    }
    return avalon
})
//http://luis-almeida.github.io/jPages/defaults.html
//http://gist.corp.qunar.com/jifeng.yao/gist/demos/pager/pager.html


