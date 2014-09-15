/**
 * @carousel组件，
 **/

define(["avalon", "text!./avalon.carousel.html", "css!./avalon.carousel.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {
    var requestAnimationFrame = (function() { //requestAnimationFrame 兼容
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 10)
            }
    })()

    var widget = avalon.ui.carousel = function(element, data, vmodels) {
        var options = data.carouselOptions
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.carouselId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.picNum = vm.pictures.length + 1 //图片数量（包括复制到末尾的第一个元素）
            vm.selections = avalon.range(vm.pictures.length) //圆形选择的数据数组（不包括复制到末尾的第一个元素）
            vm.selectionIndex = 0 // 圆形选择的index
            vm.selectionWrapOffset = -vm.pictures.length * 20 / 2 //圆形选择CSS位置修正
            vm.panelOffsetX = 0 //长panel的X方向偏移，正向移动（右）时减小，反向移动（左）时增大
            vm.arrowVisible = false //箭头是否可见
            vm.$skipArray = ["widgetElement", "template", "selectionWrapOffset"]

            var inited
            vm.$init = function() {
                if (inited) return
                inited = true
                var pageHTML = options.template
                element.style.display = "none"
                element.innerHTML = pageHTML
                avalon.scan(element, [vmodel].concat(vmodels))
                element.style.display = "block"
                if (typeof options.onInit === "function") {
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
            vm.setArrowVisible = function() { //@method setArrowVisible() hover在组件上时使Arrow显示，停止轮播
                vm.arrowVisible = vm.alwaysShowArrow ? true : false
                if (vm.hoverStop && vm.autoSlide) {
                    clearTimeout(timer)
                }
            }
            vm.setArrowHidden = function() { //@method setArrowHidden() hover离开时使Arrow隐藏，重新开始轮播
                vm.arrowVisible = false
                autoPlay(vm)
            }
            var animated = false
            vm.animate = function(direct, distance) { //@method animate(direct, distance) 图片滚动，direct为方向（1/-1），distance为距离（>0整数）
                if (animated) { //防止动画队列堆积
                    return
                }

                //移动准备
                if (typeof distance === "undefined") { //设置默认距离为1
                    distance = 1
                }
                if (direct === 1 && vm.panelOffsetX === -vm.pictureWidth * (vm.picNum - 1)) { //点击为正方向且panel处于队列末尾，队列先回到0
                    vm.panelOffsetX = 0
                } else if (direct === -1 && vm.panelOffsetX === 0) { //点击为负方向且panel处于队列开始，队列先回到末尾
                    vm.panelOffsetX = -vm.pictureWidth * (vm.picNum - 1)
                }
                var offset = vm.panelOffsetX - vm.pictureWidth * direct * distance //设置移动终点位置

                //进行移动
                var currentTime = 0 //当前时间
                var startpos = vm.panelOffsetX //位置初始值
                var duringDistance = vm.pictureWidth * -direct * distance //位置变化量
                var duringTime = vm.during / 10 //补间动画的时间长度
                var go = function() {
                    animated = false
                    if ((vm.panelOffsetX <= -vm.pictureWidth * (vm.pictures.length - 1)) && direct > 0) { //队列已到末尾位置，且将要往正方向移动，队列回到0
                        vm.panelOffsetX = 0
                    } else if ((vm.panelOffsetX >= 0) && direct < 0) { //队列已到开始位置，且将要往反方向移动，队列回到末尾
                        vm.panelOffsetX = -vm.pictureWidth * (vm.picNum - 1)
                    } else { //队列还未到终点，在移动过程中
                        vm.panelOffsetX = easeInOut(currentTime, startpos, duringDistance, duringTime) //移动
                        if (currentTime < duringTime) {
                            currentTime++
                            requestAnimationFrame(go)
                            animated = true
                        }
                    }
                }
                go()

                //底部圆形选择响应图片改变
                vm.selectionIndex += 1 * direct * distance
                if (vm.selectionIndex > vm.selections.length - 1) { //最右端继续+1时回0
                    vm.selectionIndex = 0
                } else if (vm.selectionIndex < 0) { //最左端继续-1时回末尾
                    vm.selectionIndex = vm.selections.length - 1
                }
            }
            vm.selectPic = function(index) { //@method selectPic(index) 通过底部圆形选择图片
                var distance = vm.selectionIndex - index
                var direct = distance > 0 ? -1 : 1
                vm.animate(direct, Math.abs(distance))
            }
        })

        vmodel.pictures[vmodel.pictures.length] = vmodel.pictures[0] //将第一个元素加到图片数组末尾形成循环
        autoPlay(vmodel) //自动开始轮播
        return vmodel
    }

    function easeInOut(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b
        return -c / 2 * ((--t) * (t - 2) - 1) + b
    }

    function autoPlay(vm) { //@method autoPlay(vmodel) 自动开始轮播,
        if (vm.autoSlide) {
            timer = setTimeout(function() {
                vm.animate(1) //正方向移动
                autoPlay(vm)
            }, vm.timeout)
        }
    }

    widget.defaults = {
        pictures: [], //@param pictures 轮播图片素材
        pictureWidth: 500, //@param pictureWidth 图片显示宽度
        pictureHeight: 280, //@param pictureHeight 图片显示高度
        timeout: 2500, //@param timeout 切换时间间隔
        during: 300, //@param during 切换速度，越小越快，单位为毫秒
        alwaysShowArrow: true, //@param alwaysShowArrow 显示左右切换箭头
        alwaysShowSelection: true, //@param alwaysShowSelection 显示底部圆形切换部件
        autoSlide: true, //@param autoSlide 自动播放
        hoverStop: true, //@param autoSlide 鼠标经过停止播放
        onInit: avalon.noop, //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        }, //@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "heiwu805@hotmail.com"
    }
})