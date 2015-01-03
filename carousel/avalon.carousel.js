/**
 *
 * @cnName 图片轮播组件
 * @enName carousel
 * @introduce
 * 图片轮播，采用跑马灯效果
 * @summary
 */

define(["avalon", "text!./avalon.carousel.html", "css!./avalon.carousel.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {
    //获取当前JS绝对路径
    var path,
        t=document.getElementsByTagName("SCRIPT");
    for(var i in t){
        if(t[i].outerHTML && t[i].outerHTML.indexOf("avalon.carousel.js") !== -1){
            var wholePath = t[i].src
            path = wholePath.substring(0, wholePath.lastIndexOf("/"))
        }
    }

    var requestAnimationFrame = (function() { //requestAnimationFrame 兼容
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 10)
            }
    })()

    var Tween = { //线性以及二次方的缓动
        linear: function(t, b, c, d) {
            return c * t / d + b
        },
        easeIn: function(t, b, c, d) {
            return c * (t /= d) * t + b
        },
        easeOut: function(t, b, c, d) {
            return -c * (t /= d) * (t - 2) + b
        },
        easeInOut: function(t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t + b
            return -c / 2 * ((--t) * (t - 2) - 1) + b
        }
    }

    var widget = avalon.ui.carousel = function(element, data, vmodels) {
        var options = data.carouselOptions
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.carouselId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.picNum = vm.pictures.length + 1 //图片数量（包括复制到末尾的第一个元素）
            vm.pictureOpacity = {}
            vm.itemPosition = "relative" //默认slide effect下结构
            vm.panelPosition = "absolute" //默认slide effect下结构
            vm.selections = avalon.range(vm.pictures.length) //圆形选择的数据数组（不包括复制到末尾的第一个元素）
            vm.currentIndex = 0 // 圆形选择的index
            vm.selectionWrapOffset = -vm.pictures.length * 20 / 2 //圆形选择CSS位置修正
            vm.panelOffsetX = 0 //长panel的X方向偏移，正向移动（右）时减小，反向移动（左）时增大
            vm.arrowVisible = false //箭头是否可见
            vm.arrowLeftBg = vm.arrowLeftNormalSrc !== "" ? "url("+vm.arrowLeftNormalSrc+")" : ""
            vm.arrowRightBg = vm.arrowRightNormalSrc !== "" ? "url("+vm.arrowRightNormalSrc+")" : ""
            vm.$skipArray = ["widgetElement", "template", "selectionWrapOffset"]


            var inited
            vm.$init = function(continueScan) {
                if (inited) return
                inited = true
                var pageHTML = options.template
                element.style.display = "none"
                element.innerHTML = pageHTML
                element.style.display = "block"

                if (vm.adaptiveWidth || vm.pictureWidth === "100%") { //自动填充外围容器宽度
                    vm.pictureWidth = element.offsetWidth
                }
                if (vm.adaptiveHeight || vm.pictureHeight === "100%") { //自动填充外围容器高度
                    element.style.height = "100%"
                    var children = element.children
                    for (var i = 0, len = children.length; i < len; i++) {
                        if (children[i].getAttribute("class") === "oni-carousel") {
                            children[i].style.height = "100%"
                        }
                    }
                }

                //预加载图片
                var images = [],
                    icons = []
                images.push(vm.pictures)
                for (var i = 0; i < images.length; i++) {
                    var image_preload = new Image()
                    image_preload.src = images[i]
                }
                icons.push("/images/arrows-left-hover-icon.png","/images/arrows-right-hover-icon.png")
                for (var i = 0; i < icons.length; i++) {
                    icons[i] = path + icons[i]
                    var image_preload = new Image()
                    image_preload.src = icons[i]
                }

                if(continueScan){
                    continueScan()
                }else{
                    avalon.log("请尽快升到avalon1.3.7+")
                    avalon.scan(element, _vmodels)
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
            vm.stopPlay = function() { //hover在组件上时使Arrow显示，停止轮播
                vm.arrowVisible = vm.alwaysShowArrow ? true : false
                if (vm.hoverStop && vm.autoSlide) {
                    clearTimeout(timer)
                    timer = null
                }
            }
            vm.restartPlay = function(type) { //hover离开时使Arrow隐藏，重新开始轮播
                if (type === "carousel") {
                    vm.arrowVisible = false
                }
                vm.autoPlay(vm)
            }

            //动画参数
            vm.fadein = 1 //effect为fade时，渐入的图片透明度
            vm.fadeout = 0 //effect为fade时，渐出的图片透明度
            var animated = false //动画正在进行
            var duringTime = vm.during / 10 //补间动画的时间长度
            var lastIndex //上一张图片index
            vm.animate = function(direct, distance) { //@method animate(direct, distance) 图片滚动，direct为方向（1/-1），distance为距离（>0整数）
                if (animated) { //防止动画队列堆积
                    return
                }
                distance = distance || 1
                if (vm.effect === "slide") {
                    //移动准备
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
                    var go = function() {
                        animated = false
                        if ((vm.panelOffsetX <= -vm.pictureWidth * (vm.pictures.length - 1)) && direct > 0) { //队列已到末尾位置，且将要往正方向移动，队列回到0
                            vm.panelOffsetX = 0
                        } else if ((vm.panelOffsetX >= 0) && direct < 0) { //队列已到开始位置，且将要往反方向移动，队列回到末尾
                            vm.panelOffsetX = -vm.pictureWidth * (vm.picNum - 1)
                        } else { //队列还未到终点，在移动过程中
                            vm.panelOffsetX = Tween[vm.easing](currentTime, startpos, duringDistance, duringTime) //移动
                            if (currentTime < duringTime) {
                                currentTime += 1
                                requestAnimationFrame(go)
                                animated = true
                            }
                        }
                    }
                } else if (vm.effect === "fade") { //effect为fade
                    var currentTime = 0 //当前时间
                    var go = function() {
                        animated = false
                        vm.fadein = Tween[vm.easing](currentTime, 0, 1, duringTime) //移动
                        vm.fadeout = Tween[vm.easing](currentTime, 1, -1, duringTime) //移动
                        if (currentTime < duringTime) {
                            currentTime += 1
                            requestAnimationFrame(go)
                            animated = true
                        }
                    }
                } else { //effect为none
                    var go = function() {
                        vm.fadein = 1
                        vm.fadeout = 0
                    }
                }
                go()

                //更新图片index
                lastIndex = vm.currentIndex //当前图片变为上一张
                vm.currentIndex += 1 * direct * distance
                if (vm.currentIndex > vm.selections.length - 1) { //最右端继续+1时回0
                    vm.currentIndex = 0
                } else if (vm.currentIndex < 0) { //最左端继续-1时回末尾
                    vm.currentIndex = vm.selections.length - 1
                }
            }
            vm.getOpacity = function(index) { //@method getOpacity(index) fade effect 下改变前后图片透明度
                if (vm.effect !== 'slide') {
                    var num = vm.fadein + vm.fadeout
                    if (index === vm.currentIndex) {
                        return vm.fadein
                    } else if (index === lastIndex) {
                        return vm.fadeout
                    } else {
                        return 0
                    }
                } else {
                    return 1
                }
            }

            var hoverIndex = 0;
            vm.selectPic = function(index, e) { //@method selectPic(index) 通过底部圆形选择图片
                hoverIndex = index
                if (e.type === vm.eventType || vm.eventType === "both") {
                    var distance = vm.currentIndex - index
                    var direct = distance > 0 ? -1 : 1

                    if (e.type === "mouseenter") {
                        setTimeout(function() {
                            vm.animate(direct, Math.abs(distance))
                        }, 300) //mouseenter事件设置延时以防止切换时间间隔太小
                    } else {
                        vm.animate(direct, Math.abs(distance))
                    }

                    if (vm.autoSlide) {
                        clearTimeout(timer)
                        timer = null
                    }
                }

                //修复hover的TAB和select的TAB不一致
                var fixIndex = setInterval(function(){
                    if(vm.currentIndex !== hoverIndex){
                        var distance = vm.currentIndex - hoverIndex
                        var direct = distance > 0 ? -1 : 1
                        vm.animate(direct, Math.abs(distance))
                    } else{
                        clearInterval(fixIndex)
                    }
                },800)
            }
            vm.arrowHover = function(direction) { //@method arrowHover(direction) 左右箭头hover事件
                if (direction === "left") {
                    vm.arrowLeftBg = vm.arrowLeftHoverSrc !== "" ? "url("+vm.arrowLeftHoverSrc+")" : ""
                } else {
                    vm.arrowRightBg = vm.arrowRightHoverSrc !== "" ? "url("+vm.arrowRightHoverSrc+")" : ""
                }
            }
            vm.arrowBlur = function(direction) { //@method arrowBlur(direction) 左右箭头blur事件
                if (direction === "left") {
                    vm.arrowLeftBg = vm.arrowLeftNormalSrc !== "" ? "url("+vm.arrowLeftNormalSrc+")" : ""
                } else {
                    vm.arrowRightBg = vm.arrowRightNormalSrc !== "" ? "url("+vm.arrowRightNormalSrc+")" : ""
                }
            }
            var timer = null //轮播计时器
            vm.autoPlay = function() { //@method autoPlay(vmodel) 自动开始轮播
                if (timer === null && vm.autoSlide) {
                    function play() {
                        timer = setTimeout(function() {
                            vm.animate(1) //正方向移动
                            play()
                        }, vm.timeout)
                    }
                    play()
                }
            }
        })
        if (vmodel.effect !== "slide") { //fade 或者 none 模式下的布局
            vmodel.itemPosition = "absolute"
            vmodel.panelPosition = "relative"
        }
        vmodel.pictures.push( vmodel.pictures[0] )
       // vmodel.pictures[vmodel.pictures.length] = vmodel.pictures[0] //将第一个元素加到图片数组末尾形成循环
        vmodel.autoPlay(vmodel) //自动开始轮播

        return vmodel
    }

    widget.vertion = "1.0.1"
    widget.defaults = {
        pictures: [], //@config  轮播图片素材
        pictureWidth: 500, //@config  图片显示宽度
        pictureHeight: 200, //@config  图片显示高度
        effect: "slide", //@config  图片切换类型，取值：none:无特效 / fade:渐隐 / slide:滑动
        easing: "easeInOut", //@config  缓动类型，取值 linear:无缓动效果 / easeIn:在过渡的开始提供缓动效果 / easeOut:在过渡的结尾提供缓动效果 / easeInOut 在过渡的开始和结尾提供缓动效果
        timeout: 2500, //@config  切换时间间隔
        during: 300, //@config  切换速度，越小越快，单位为毫秒
        alwaysShowArrow: true, //@config  显示左右切换箭头
        alwaysShowSelection: true, //@config  显示底部圆形切换部件
        autoSlide: true, //@config  自动播放
        hoverStop: true, //@config  鼠标经过停止播放
        adaptiveWidth: false, //@config  适应外围宽度，为true时指定pictureWidth不起作用
        adaptiveHeight: false, //@config  适应外围高度，为true时指定pictureHeight不起作用
        eventType: "click", //@config  触发tab切换的nav上的事件类型，取值click\mouseenter\both
        arrowLeftNormalSrc: "", //@config  左箭头正常状态图标，可不传
        arrowRightNormalSrc: "", //@config  右箭头正常状态图标，可不传
        arrowLeftHoverSrc: "", //@config  左箭头hover状态图标，可不传
        arrowRightHoverSrc: "", //@config  右箭头hover状态图标，可不传
        arrowLeftClass:"", //@config  左右箭头的className，可不传
        arrowRightClass:"", //@config  左右箭头的className，可不传
        onInit: avalon.noop, //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        }, //@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "heiwu805@hotmail.com"
    }
})

/**
 @links
 [图片轮播组件-默认配置图片轮播](avalon.carousel.ex.html)
 [图片轮播组件-自定义宽高](avalon.carousel.ex1.html)
 [图片轮播组件-自定义图片切换时间间隔 / 自定义图片切换速度](avalon.carousel.ex2.html)
 [图片轮播组件-自定义不显示左右切换箭头和底部圆形选择部件 / 自定义鼠标经过不停止播放](avalon.carousel.ex3.html)
 [图片轮播组件-自定义effect](avalon.carousel.ex4.html)
 [图片轮播组件-自定义缓动类型](avalon.carousel.ex5.html)
 [图片轮播组件-自定义填充外围宽度和高度](avalon.carousel.ex6.html)
 */
