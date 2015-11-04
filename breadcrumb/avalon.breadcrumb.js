/**
 *
 * @cnName 面包屑组件
 * @enName breadcrumb
 * @introduce 面包屑导航
 *
 */
define(["avalon", "text!./avalon.breadcrumb.html", "css!./avalon.breadcrumb.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {
	var widget = avalon.ui.breadcrumb = function (element, data, vmodels) {

		var options = data.breadcrumbOptions
		options.template = options.getTemplate(template, options)

		var vmodel = avalon.define(data.breadcrumbId, function (vm) {

			avalon.mix(vm, options)
			vm.widgetElement = element
			vm.$skipArray = ["widgetElement", "template"]

			// 组件初始化
			var inited
			vm.$init = function (continueScan) {
				if (inited) return
				inited = true
				var pageHTML = options.template

				// 加入组件DOM
				element.style.display = "none"
				element.innerHTML = pageHTML
				element.style.display = "block"

				// 判断是否需要出现箭头
				setTimeout(function () {
					if (containerOverflowed(element)) {
						vm._arrowsVisible = true
					}
				}, 0)

				if (continueScan) {
					continueScan()
				} else {
					avalon.log("请尽快升到avalon1.3.7+")
					avalon.scan(element, _vmodels)
					if (typeof options.onInit === "function") {
						options.onInit.call(element, vmodel, options, vmodels)
					}
				}
			}

			vm._clickNav = function (e, navLevel) {
				var returnData = vm.$model.data[navLevel]

				returnData.level = navLevel
				vm.onClick(e, returnData)
			}

			// 左右切换
			vm._switchIndex = 0
			vm._listMargin = 0
			vm._switch = function (dir) {
				var navWrap = element.children[2],
					navList = navWrap.children[0],
					navItems = navList.children,
					calMargin = 0

				// 计算list的margin left
				if (vm.switchStep === "") {
					for (var i = 0; i < vm._switchIndex + dir; i++) {
						calMargin += avalon(navItems[i]).width()
					}
				} else {
					calMargin = -parseFloat(avalon(navList).css("margin-left")) + parseFloat(vm.switchStep) * dir
				}

				var navWrap_w = avalon(navWrap).width(),
					navList_w = avalon(navList).width()

				// 是否超出右侧
				if (navWrap_w + calMargin >= navList_w) {
					calMargin = navList_w - navWrap_w
					vm._rightArrowDisabled = true
				} else {
					vm._rightArrowDisabled = false
				}

				// 是否超出左侧
				if (calMargin <= 0) {
					calMargin = 0
					vm._leftArrowDisabled = true
				} else {
					vm._leftArrowDisabled = false
				}

				if (calMargin !== -parseFloat(vm._listMargin)) {
					vm._switchIndex = vm._switchIndex + dir
				}

				vm._listMargin = -calMargin + "px"
			}

			// 左键箭头状态
			vm._leftArrowDisabled = true
			vm._rightArrowDisabled = false
			vm._arrowsVisible = false

			vm.$remove = function () {
				element.innerHTML = element.textContent = ""
			}

		})

		function containerOverflowed(uiRoot) {
			var navWrap = uiRoot.children[0],
				navItems = navWrap.children[0].children

			var navWrap_w = avalon(navWrap).width(),
				navItems_w = 0

			avalon.each(navItems, function (i, item) {
				navItems_w += avalon(item).width()
			})

			if (navWrap_w < navItems_w) {
				return true
			}

			return false
		}

		return vmodel
	}

	widget.vertion = "0.0.1"
	widget.defaults = {
		onInit: avalon.noop, //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
		data: [], //@config 导航链接
		division: "", //@config 导航间分隔符，可配置"/",">"等等
		switchStep: "", //@config 超出容器后，每点击一下箭头导航列表移动的距离
		onClick: avalon.noop, //@config 回调函数，回调参数包括target,level,text,href
		getTemplate: function (tmpl, opts, tplName) {
			return tmpl
		}, //@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
		$author: "heiwu805@hotmail.com"
	}
})