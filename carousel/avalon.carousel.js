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
	var path = "",
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
		var options = data.carouselOptions,
			inited;

		template = template.replace("MS_OPTION_CONTENT", options.content);
		
		options.template = options.getTemplate(template, options);

		// 动画参数
		var animated = false,				//动画正在进行
			duringTime = options.during / 10,	//补间动画的时间长度
			lastIndex;						//上一张图片index

		var hoverIndex = 0,
			timer = null //轮播计时器

		var vm = {
			$id: data.carouselId,
			$skipArray: ["widgetElement", "template", "selectionWrapOffset"],
			widgetElement: element,
			picNum: options.pictures.length + 1, //图片数量（包括复制到末尾的第一个元素）
			pictureOpacity: {},
			itemPosition: "relative", //默认slide effect下结构
			panelPosition: "absolute", //默认slide effect下结构
			selections: avalon.range(options.pictures.length), //圆形选择的数据数组（不包括复制到末尾的第一个元素）
			currentIndex: 0, // 圆形选择的index
			selectionWrapOffset: -options.pictures.length * 20 / 2, //圆形选择CSS位置修正
			panelOffsetX: 0, //长panel的X方向偏移，正向移动（右）时减小，反向移动（左）时增大
			arrowVisible: false, //箭头是否可见
			arrowLeftBg: options.arrowLeftNormalSrc !== "" ? "url(" + options.arrowLeftNormalSrc + ")" : "",
			arrowRightBg: options.arrowRightNormalSrc !== "" ? "url(" + options.arrowRightNormalSrc + ")" : "",

			$init: function(continueScan) {
				if (inited) return
				inited = true
				var pageHTML = options.template
				element.style.display = "none"
				element.innerHTML = pageHTML
				element.style.display = "block"

				if (vmodel.adaptiveWidth || vmodel.pictureWidth === "100%") { //自动填充外围容器宽度
					vmodel.pictureWidth = element.offsetWidth
				}
				if (vmodel.adaptiveHeight || vmodel.pictureHeight === "100%") { //自动填充外围容器高度
					element.style.height = "100%"
					var children = element.children
					for (var i = 0, len = children.length; i < len; i++) {
						if (children[i].getAttribute("class") === "oni-carousel") {
							children[i].style.height = "100%"
						}
					}
				}

				//预加载图片
				var images = vmodel.pictures,
					icons = [];

				for (var i = 0; i < images.length; i++) {
					var image_preload = new Image()
					image_preload.src = images[i].src
				}
				icons.push("http://source.qunarzz.com/general/oniui/carousel/arrows-left-hover-icon.png","http://source.qunarzz.com/general/oniui/carousel/arrows-right-hover-icon.png")
				for (var i = 0; i < icons.length; i++) {
					icons[i] = (icons[i].match(/^http/g) ? "" : path) + icons[i]
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
			},
			$remove: function() {
				element.innerHTML = element.textContent = ""
			},
			stopPlay: function() { //hover在组件上时使Arrow显示，停止轮播
				vmodel.arrowVisible = vmodel.alwaysShowArrow ? true : false
				if (vmodel.hoverStop && vmodel.autoSlide) {
					clearTimeout(timer)
					timer = null
				}
			},
			restartPlay: function(type) { //hover离开时使Arrow隐藏，重新开始轮播
				if (type === "carousel") {
					vmodel.arrowVisible = false
				}
				vmodel.autoPlay(vmodel)
			},

			//动画参数
			fadein: 1, //effect为fade时，渐入的图片透明度
			fadeout: 0, //effect为fade时，渐出的图片透明度
			
			animate: function(direct, distance) { //@method animate(direct, distance) 图片滚动，direct为方向（1/-1），distance为距离（>0整数）
				if (animated) { //防止动画队列堆积
					return
				}
				distance = distance || 1
				if (vmodel.effect === "slide") {
					//移动准备
					if (direct === 1 && vmodel.panelOffsetX === -vmodel.pictureWidth * (vmodel.picNum - 1)) { //点击为正方向且panel处于队列末尾，队列先回到0
						vmodel.panelOffsetX = 0
					} else if (direct === -1 && vmodel.panelOffsetX === 0) { //点击为负方向且panel处于队列开始，队列先回到末尾
						vmodel.panelOffsetX = -vmodel.pictureWidth * (vmodel.picNum - 1)
					}
					var offset = vmodel.panelOffsetX - vmodel.pictureWidth * direct * distance //设置移动终点位置

					//进行移动
					var currentTime = 0 //当前时间
					var startpos = vmodel.panelOffsetX //位置初始值
					var duringDistance = vmodel.pictureWidth * -direct * distance //位置变化量
					var go = function() {
						animated = false
						if ((vmodel.panelOffsetX <= -vmodel.pictureWidth * (vmodel.pictures.length - 1)) && direct > 0) { //队列已到末尾位置，且将要往正方向移动，队列回到0
							vmodel.panelOffsetX = 0
						} else if ((vmodel.panelOffsetX >= 0) && direct < 0) { //队列已到开始位置，且将要往反方向移动，队列回到末尾
							vmodel.panelOffsetX = -vmodel.pictureWidth * (vmodel.picNum - 1)
						} else { //队列还未到终点，在移动过程中
							vmodel.panelOffsetX = Tween[vmodel.easing](currentTime, startpos, duringDistance, duringTime) //移动
							if (currentTime < duringTime) {
								currentTime += 1
								requestAnimationFrame(go)
								animated = true
							}
						}
					}
				} else if (vmodel.effect === "fade") { //effect为fade
					var currentTime = 0 //当前时间
					var go = function() {
						animated = false
						vmodel.fadein = Tween[vmodel.easing](currentTime, 0, 1, duringTime) //移动
						vmodel.fadeout = Tween[vmodel.easing](currentTime, 1, -1, duringTime) //移动
						if (currentTime < duringTime) {
							currentTime += 1
							requestAnimationFrame(go)
							animated = true
						}
					}
				} else { //effect为none
					var go = function() {
						vmodel.fadein = 1
						vmodel.fadeout = 0
					}
				}
				go()

				//更新图片index
				lastIndex = vmodel.currentIndex //当前图片变为上一张
				vmodel.currentIndex += 1 * direct * distance
				if (vmodel.currentIndex > vmodel.selections.length - 1) { //最右端继续+1时回0
					vmodel.currentIndex = 0
				} else if (vmodel.currentIndex < 0) { //最左端继续-1时回末尾
					vmodel.currentIndex = vmodel.selections.length - 1
				}
			},
			getOpacity: function(index) { //@method getOpacity(index) fade effect 下改变前后图片透明度
				if (vmodel.effect !== 'slide') {
					var num = vmodel.fadein + vmodel.fadeout
					if (index === vmodel.currentIndex) {
						return vmodel.fadein
					} else if (index === lastIndex) {
						return vmodel.fadeout
					} else {
						return 0
					}
				} else {
					return 1
				}
			},

			selectPic: function(index, e) { //@method selectPic(index) 通过底部圆形选择图片
				hoverIndex = index
				if (e.type === vmodel.eventType || vmodel.eventType === "both") {
					var distance = vmodel.currentIndex - index
					var direct = distance > 0 ? -1 : 1

					if (e.type === "mouseenter") {
						setTimeout(function() {
							vmodel.animate(direct, Math.abs(distance))
						}, 300) //mouseenter事件设置延时以防止切换时间间隔太小
					} else {
						vmodel.animate(direct, Math.abs(distance))
					}

					if (vmodel.autoSlide) {
						clearTimeout(timer)
						timer = null
					}
				}

				//修复hover的TAB和select的TAB不一致
				var fixIndex = setInterval(function(){
					if(vmodel.currentIndex !== hoverIndex){
						var distance = vmodel.currentIndex - hoverIndex
						var direct = distance > 0 ? -1 : 1
						vmodel.animate(direct, Math.abs(distance))
					} else{
						clearInterval(fixIndex)
					}
				},800)
			},
			arrowHover: function(direction) { //@method arrowHover(direction) 左右箭头hover事件
				if (direction === "left") {
					vmodel.arrowLeftBg = vmodel.arrowLeftHoverSrc !== "" ? "url(" + vmodel.arrowLeftHoverSrc + ")" : ""
				} else {
					vmodel.arrowRightBg = vmodel.arrowRightHoverSrc !== "" ? "url(" + vmodel.arrowRightHoverSrc + ")" : ""
				}
			},
			arrowBlur: function(direction) { //@method arrowBlur(direction) 左右箭头blur事件
				if (direction === "left") {
					vmodel.arrowLeftBg = vmodel.arrowLeftNormalSrc !== "" ? "url(" + vmodel.arrowLeftNormalSrc + ")" : ""
				} else {
					vmodel.arrowRightBg = vmodel.arrowRightNormalSrc !== "" ? "url(" + vmodel.arrowRightNormalSrc + ")" : ""
				}
			},
			autoPlay: function() { //@method autoPlay(vmodel) 自动开始轮播
				if (timer === null && vmodel.autoSlide) {
					function play() {
						timer = setTimeout(function() {
							vmodel.animate(1) //正方向移动
							play()
						}, vmodel.timeout)
					}
					play()
				}
			}
		};
		avalon.mix(vm, options);
		var vmodel = avalon.define(vm);

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
		content: "",	// @config 图片内容模板
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
