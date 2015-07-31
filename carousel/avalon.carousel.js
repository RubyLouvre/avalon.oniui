/**
 *
 * @cnName 图片轮播组件
 * @enName carousel
 * @introduce 图片轮播，采用跑马灯效果
 *
 */

define(["avalon", "text!./avalon.carousel.html", "css!./avalon.carousel.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {



	var widget = avalon.ui.carousel = function(element, data, vmodels) {

		var options = data.carouselOptions
		options.template = options.getTemplate(template, options)

		var vmodel = avalon.define(data.carouselId, function(vm) {

			avalon.mix(vm, options)

			vm.widgetElement = element

			// 处理carousel尺寸
			if(String(vm.pictureWidth).indexOf("px") !== -1){
				vm.pictureWidth = parseInt(vm.pictureWidth, 10)
			}
			if(String(vm.pictureHeight).indexOf("px") !== -1){
				vm.pictureHeight = parseInt(vm.pictureHeight, 10)
			}
			vm.containerWidth = vm.pictureWidth
			vm.containerHeight = vm.pictureHeight

			// 初始化oni-carousel-panel位置偏移量
			vm.panelOffsetX = 0

			// 初始化oni-carousel-item结构
			vm.itemPosition = "relative"
			vm.panelPosition = "absolute"

			// 操作部件是否可见
			vm.componentVisible = false

			// oni-carousel-selection圆形选择的数据数组
			vm.selections = avalon.range(vm.pictures.length)
			vm.currentIndex = 0 // 圆形选择的index
			vm.selectionWrapOffset = -vm.pictures.length * 20 / 2 //圆形选择CSS位置修正

			// 左右箭头
			vm.arrowLeftSrc = vm.arrowLeftNormalSrc
			vm.arrowRightSrc = vm.arrowRightNormalSrc
			vm.arrowVisible = false

			vm.ieVer = undefined

			vm.$skipArray = ["widgetElement", "template", "selectionWrapOffset",
				"animated","lastIndex","resizingWindow"]

			// 组件初始化
			var inited
			vm.$init = function(continueScan) {
				if (inited) return
				inited = true
				var pageHTML = options.template


				// 加入组件DOM
				element.style.display = "none"
				element.innerHTML = pageHTML
				element.style.display = "block"

				// 处理自适应尺寸
				if (vm.adaptiveWidth || vm.pictureWidth === "100%") {
					handleWindowResizeWidth(element)
				}
				if (vm.adaptiveHeight || vm.pictureHeight === "100%") {
					handleWindowResizeHeight(element)
				}

				// 预加载icons
				var icons = [vm.arrowLeftNormalSrc, vm.arrowLeftHoverSrc,
					vm.arrowRightNormalSrc, vm.arrowRightHoverSrc]
				for (var i = 0, len = icons.length; i < len; i++) {
					new Image().src = icons[i]
				}

				// 处理vm.pictures中的link & title
				var links = []
				for (var i = 0, len = vm.pictures.length; i < len; i++){
					var picture = vm.pictures[i]

					if(typeof picture.href !== "undefined"){
						links[i] = {
							href: picture.href,
							title: picture.title
						}
					}
				}
				vm.links = links

				// 延迟oni-carousel的内容显示，防止多次重绘
				var children = element.children,
					oniCarousel = null
				for (var i = 0, len = children.length; i < len; i++) {
					if (children[i].getAttribute("class") === "oni-carousel") {
						oniCarousel = children[i]
						oniCarousel.style.display = "block"
					}
				}

				// fade 或者 none 模式下的布局
				if (vm.effect !== "slide") {
					vm.itemPosition = "absolute"
					vm.panelPosition = "relative"
				}

				// 处理循环末尾的图片及链接
				vm.pictures.push( vm.pictures[0] )
				if(typeof vm.links[0] !== "undefined"){
					vm.links.push( vm.links[0] )
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

			/**
			 * 指针移入，停止轮播，并显示左右控制箭头
			 */
			vm.mouseEnter = function() {
				fixPngs();

				vm.arrowVisible = vm.alwaysShowArrow ? true : false
				if (vm.hoverStop && vm.autoSlide) {
					clearTimeout(vm.timer)
					vm.timer = null
				}
			}

			/**
			 * 指针离开，重新开始轮播，隐藏Arrow
			 * @param target {DOM} 触发mouseLeave的元素
			 */
			vm.mouseLeave = function(target) {
				if (target.className === "oni-carousel") {
					vm.arrowVisible = false
				}
				vm.autoPlay()
			}

			/**
			 * 图片加载成功之后显示
			 * @param target {DOM} 加载成功的图片
			 */
			vm.imgOnload = function(target, index){
				avalon.css(target, "display", "inline")

				if(index === 0){
					vm.autoPlay() // 自动开始轮播
				}
			}

			// 动画效果为fade时，渐入/渐出的图片透明度
			vm.fadein = 1
			vm.fadeout = 0

			//动画参数
			vm.animated = false //动画正在进行
			vm.lastIndex = undefined //上一张图片index
			vm.resizingWindow = false

			/**
			 * 图片动画
			 * @param direct {1或者-1} 图片滚动的方向
			 * @param distance {正整数} 距离，比如从第一张图跳到第三张图，距离为2
			 * @return undefined
			 */
			vm.animate = function(direct, distance) {
				var duringTime = vm.duration / 10 //补间动画的时间长度

				//防止动画队列堆积
				if (vm.animated) {
					return
				}

				var picNum = vm.pictures.length - 1
				distance = distance || 1

				if (vm.effect === "slide") {
					// 图片数量（包括复制到图片队列末尾的元素）
					//将要正向移动且panel处于队列末尾，队列先回到0
					if (direct === 1 && vm.panelOffsetX === -vm.pictureWidth * picNum) {
						vm.panelOffsetX = 0
					}

					//将要负向移动且panel处于队列开始，队列先回到末尾
					else if (direct === -1 && vm.panelOffsetX === 0) {
						vm.panelOffsetX = -vm.pictureWidth * picNum
					}

					//进行移动
					var currentTime = 0 //当前时间
					var startpos = vm.panelOffsetX //位置初始值
					var duringDistance = vm.pictureWidth * -direct * distance //位置变化量

					var go = function() {

						vm.animated = false

						//队列已到末尾位置，且将要往正方向移动，队列回到0
						if ((vm.panelOffsetX <= -vm.pictureWidth * (vm.pictures.length - 1))
							&& direct > 0) {
							vm.panelOffsetX = 0
						}

						//队列已到开始位置，且将要往反方向移动，队列回到末尾
						else if ((vm.panelOffsetX >= 0) && direct < 0) {
							vm.panelOffsetX = -vm.pictureWidth * picNum
						}

						//队列还未到终点，在移动过程中
						else {
							// 在窗口大小改变时修正动画初始位置和移动距离
							if(vm.resizingWindow){
								startpos = - vm.lastIndex * vm.pictureWidth
								duringDistance = vm.pictureWidth * -direct * distance
							}

							vm.panelOffsetX = Tween(vm.easing, currentTime,
								startpos, duringDistance, duringTime)
							if (currentTime < duringTime) {
								currentTime += 1
								requestAnimationFrame(go)
								vm.animated = true
							}
						}
					}
				} else if (vm.effect === "fade") { //effect为fade
					var currentTime = 0 //当前时间
					var go = function() {
						vm.animated = false
						vm.fadein = Tween(vm.easing, currentTime, 0, 1, duringTime) //移动
						vm.fadeout = Tween(vm.easing, currentTime, 1, -1, duringTime) //移动
						if (currentTime < duringTime) {
							currentTime += 1
							requestAnimationFrame(go)
							vm.animated = true
						}
					}
				} else { //effect为none
					var go = function() {
						vm.fadein = 1
						vm.fadeout = 0
					}
				}
				go()

				//更新图片index & title
				vm.lastIndex = vm.currentIndex //当前图片变为上一张
				vm.currentIndex += 1 * direct * distance
				if (vm.currentIndex > vm.selections.length - 1) { //最右端继续+1时回0
					vm.currentIndex = 0
				} else if (vm.currentIndex < 0) { //最左端继续-1时回末尾
					vm.currentIndex = vm.selections.length - 1
				}

                /**
                 * 逐帧动画
                 * @param callback {Function} 动画函数
                 */
                function requestAnimationFrame(callback) { //requestAnimationFrame 兼容
                    if(window.requestAnimationFrame){
                        return window.requestAnimationFrame(callback)
                    } else{
                        return window.setTimeout(callback, 10)
                    }
                }
			}

			/**
			 * 获取图片当前透明度
			 * @param index {Number} 图片索引
			 * @return {Number} 透明度
			 */
			vm.getOpacity = function(index) { //@method getOpacity(index) fade effect 下改变前后图片透明度
				if (vm.effect !== 'slide') {
					var num = vm.fadein + vm.fadeout
					if (index === vm.currentIndex) {
						return vm.fadein
					} else if (index === vm.lastIndex) {
						return vm.fadeout
					} else {
						return 0
					}
				} else {
					return 1
				}
			}

			/**
			 * 通过部件快速切换图片
			 * @param index {Number} 图片索引
			 * @param e {Event} 触发事件
			 */
			vm.hoverIndex = 0;
			vm.selectPic = function(index, e) { //@method selectPic(index) 通过底部圆形选择图片
				vm.hoverIndex = index

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
						clearTimeout(vm.timer)
						vm.timer = null
					}

					// 维护hover的TAB和select的TAB总是一致
					if (vm.eventType !== "click") {
						var fixIndex = setInterval(function () {
							if (vm.currentIndex !== vm.hoverIndex) {
								var distance = vm.currentIndex - vm.hoverIndex
								var direct = distance > 0 ? -1 : 1
								vm.animate(direct, Math.abs(distance))
							} else {
								clearInterval(fixIndex)
							}
						}, 800)
					}
				}
			}

			/**
			 * @method arrowHover(direction) 左右箭头hover事件
			 * @param direction {String} 箭头方向
			 */
			vm.arrowHover = function(direction) {
				if (direction === "left") {
					vm.arrowLeftSrc = vm.arrowLeftHoverSrc
				} else {
					vm.arrowRightSrc = vm.arrowRightHoverSrc
				}

				fixPngs()
			}

			/**
			 * @method arrowBlur(direction) 左右箭头blur事件
			 * @param direction {String} 箭头方向
			 */
			vm.arrowBlur = function(direction) {
				if (direction === "left") {
					vm.arrowLeftSrc = vm.arrowLeftNormalSrc
				} else {
					vm.arrowRightSrc = vm.arrowRightNormalSrc
				}

				fixPngs()
			}

			/**
			 * @method autoPlay(vmodel) 自动开始轮播
			 */
			vm.timer = null //轮播计时器
			vm.autoPlay = function() {

				vm.componentVisible = true // 显示部件

				if (vm.timer === null && vm.autoSlide) {
					function play() {
						vm.timer = setTimeout(function() {
							vm.animate(1) //正方向移动
							play()
						}, vm.timeout)
					}
					play()
				}
			}

            /**
             * 处理window水平resize
             * @param cantainer {DOM} oni-carousel
             */
            function handleWindowResizeWidth(cantainer) {
                cantainer.style.width = vmodel.containerWidth = "100%"
                vmodel.pictureWidth = element.offsetWidth

                addResizeEvent(function(){
                    vmodel.pictureWidth = avalon.css(element, "width")

                    // 动画进行中resize
                    if (vm.animated) {
                        vm.resizingWindow = true
                    }
                    // 动画静止时resize
                    else {
                        if (typeof vm.lastIndex !== "undefined") {
                            vmodel.panelOffsetX = -(( vm.lastIndex || 0 ) + 1) * vmodel.pictureWidth
                        } else {
                            vmodel.panelOffsetX = -( vm.lastIndex || 0 ) * vmodel.pictureWidth
                        }
                    }
                })
            }

            /**
             * 处理window竖直resize
             * @param cantainer {DOM} oni-carousel
             */
            function handleWindowResizeHeight(container) {
                vmodel.pictureHeight = vmodel.containerHeight = container.style.height = "100%"

                addResizeEvent(function(){
                    vmodel.pictureHeight = avalon.css(element, "height")
                });
            }

            /**
             * 兼容绑定window resize
             * @param func {Function} resize动作响应
             */
            function addResizeEvent(func){
                if (window.addEventListener){
                    window.addEventListener("resize", func, false);
                }
                else{
                    window.attachEvent("onresize", func);
                }
            }

			/**
			 * 缓动函数
			 * @param eatingType {String} 缓动类型
			 * @param curTime {String} 当前时间
			 * @param startPos {String} 开始位置
			 * @param distance {String} 移动距离
			 * @param duration {String} 持续时间
			 */
			function Tween(eatingType, curTime, startPos, distance, duration){
				switch(eatingType){
					case "linear":
						return distance * curTime / duration + startPos
					case "easeIn":
						return distance * (curTime /= duration) * curTime + startPos
					case "easeOut":
						return -distance * (curTime /= duration) * (curTime - 2) + startPos
					case "easeInOut":
						if ((curTime /= duration / 2) < 1) {
							return distance / 2 * curTime * curTime + startPos
						} else{
							return -distance / 2 * ((--curTime) * (curTime - 2) - 1) + startPos
						}
					default:break;
				}
			}

			/**
			 * 处理IE6下png
			 */
			function fixPngs(){
				if(typeof vm.ieVer === "undefined"){
					getIEVersion()
				}

				if(vm.ieVer === 6){
					for (var i = 0; i < document.images.length; i++){
						var s = document.images[i].src;
						if (s.indexOf('.png') > 0)
							fixPng(s, document.images[i]);
					}
				}

				function fixPng(src, imgObj){
					imgObj.src = 'http://7xkm02.com1.z0.glb.clouddn.com/Transparent.gif';
					imgObj.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled='true', src='" + src + "', sizingMethod='fixed')";
				}

				function getIEVersion() {
					var rv = -1; // Return value assumes failure.
					if (navigator.appName == 'Microsoft Internet Explorer')
					{
						var ua = navigator.userAgent;
						var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
						if (re.exec(ua) != null)
							rv = parseFloat( RegExp.$1 );
					}
					vm.ieVer = rv
				}
			}
		})

		return vmodel
	}

	widget.vertion = "0.0.2"
	widget.defaults = {
		pictures: [], //@config  轮播图片素材，每个图片可以用对象方式配置src,alt,href,title,description
		links: [], // 图片链接
		pictureWidth: 500, //@config  组件宽度
		pictureHeight: 200, //@config  组件高度
		effect: "slide", //@config  图片切换类型，none:无特效 / fade:渐隐 / slide:滑动
		easing: "easeInOut", //@config  缓动类型， linear:无缓动效果 / easeIn:在过渡的开始提供缓动效果 / easeOut:在过渡的结尾提供缓动效果 / easeInOut 在过渡的开始和结尾提供缓动效果
		timeout: 2500, //@config  图片切换时间间隔
		duration: 300, //@config  图片切换速度
		showDescription: false, //@config  显示图片描述
		alwaysShowArrow: true, //@config  显示左右切换箭头
		alwaysShowSelection: true, //@config  显示底部圆形切换部件
		autoSlide: true, //@config  自动播放
		hoverStop: true, //@config  鼠标经过停止播放
		adaptiveWidth: false, // 适应外围宽度，为true时指定pictureWidth不起作用
		adaptiveHeight: false, // 适应外围高度，为true时指定pictureHeight不起作用
		eventType: "click", //@config  触发导航切换图片的事件类型，click\mouseenter\both
		arrowLeftNormalSrc: "http://source.qunarzz.com/general/oniui/carousel/arrows-left-icon.png", //@config  左箭头正常状态图标
		arrowRightNormalSrc: "http://source.qunarzz.com/general/oniui/carousel/arrows-right-icon.png", //@config  右箭头正常状态图标
		arrowLeftHoverSrc: "http://source.qunarzz.com/general/oniui/carousel/arrows-left-hover-icon.png", //@config  左箭头hover状态图标
		arrowRightHoverSrc: "http://source.qunarzz.com/general/oniui/carousel/arrows-right-hover-icon.png", //@config  右箭头hover状态图标
		lazyload: true, //@config  图片懒加载
		lazyloadImg: "http://t.cn/RLXSMrg", //@config  懒加载loading图
		onInit: avalon.noop, //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
		getTemplate: function(tmpl, opts, tplName) {
			return tmpl
		}, //@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
		$author: "heiwu805@hotmail.com"
	}
})

/**
 @links
 [图片轮播组件-默认配置](avalon.carousel.ex.html)
 [图片轮播组件-自定义宽高](avalon.carousel.ex1.html)
 [图片轮播组件-自定义图片切换时间间隔 / 图片切换速度](avalon.carousel.ex2.html)
 [图片轮播组件-配置小部件](avalon.carousel.ex3.html)
 [图片轮播组件-自定义切换动画效果](avalon.carousel.ex4.html)
 [图片轮播组件-自定义动画缓动类型](avalon.carousel.ex5.html)
 [图片轮播组件-自适应容器尺寸](avalon.carousel.ex6.html)
 [图片轮播组件-自定义图片标题和描述](avalon.carousel.ex7.html)
 [图片轮播组件-自定义懒加载loading图](avalon.carousel.ex8.html)
 */
