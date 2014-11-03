define(["avalon", "text!./avalon.lightbox.html", "css!./avalon.lightbox.css"], function (avalon, template) {

    var widget = avalon.ui.lightbox = function (element, data, vmodels) {
        var options = data.lightboxOptions
        options.template = options.getTemplate(template, options)
        console.log(element.textContent)
        var vmodel = avalon.define(data.lightboxId, function (vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.init = function () {
                var pageHTML = avalon.parseHTML(options.template)
                element.appendChild(pageHTML)
                avalon.scan(element, [vmodel].concat(vmodels))
            }

            vm.$init = function () {
                avalon.scan(element, [vmodel].concat(vmodels))
                if (typeof options.onInit === "function") {
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }

            vm.$remove = function () {
                element.innerHTML = element.textContent = ""
            }

            vm.remove = function () {
                if (document.getElementsByClassName('lightbox-widget')) {
                    document.getElementsByClassName('lightbox-widget')[0].remove()
                }
            }
            //遮罩层显示隐藏
            vm.toggle = false

            //相册属性
            vm.$albumAttr = {
                arr: [],
                index: "",
                isLast: "",
                isFirst: ""
            }
            //是否显示导航
            vm.showNav = false

            //打开lightbox
            vm.show = function (src, picArr, $index) {
                vm.init()
                vm.toggle = true
                initalbum(picArr, $index)
                adjustImgAttr(src)
            }

            //初始化相册配置
            function initalbum(picArr, $index) {
                vm.overlayOpacity = vm.overLayOpacitySet
                vm.loaderDisplay = true
                if (vm.showSet) {
                    vm.pictures.concat(picArr)
                    vm.$albumAttr.arr = vm.pictures.$model
                    vm.$albumAttr.index = $index
                    vm.picindex = vm.$albumAttr.index + 1
                    vm.albumlength = vm.$albumAttr.arr.length
                    vm.showNext = $index === picArr.length - 1 ? false : true
                    vm.showPrev = $index === 0 ? false : true
                }
                vm.description = picArr[$index].description
                vm.layerHeight = document.body.scrollHeight
                vm.layerWidth = document.body.scrollWidth
            }

            //关闭lightbox
            vm.close = function () {
                vm.imgOpacity = 0
                vm.overlayOpacity = 0
                vm.toggle = false
                vm.remove()
            }

            //调整lightbox尺寸
            function adjustImgAttr(src) {
                var originHeight = vm.imgHeight
                var originWidth = vm.imgWidth
                var img = new Image() //预加载图片
                img.src = src
                img.onload = function () {
                    var windowWidth = avalon(window).width()
                    var windowHeight = avalon(window).height()
                    var maxWidth = windowWidth - 150
                    var maxHeight = windowHeight - 150
                    if (img.width > maxWidth || img.height > maxHeight) {
                        if ((img.width / maxWidth) >= (img.height / maxHeight)) {
                            vm.imgWidth = maxWidth
                            vm.imgHeight = (maxWidth / img.width) * img.height
                        } else {
                            vm.imgHeight = maxHeight
                            vm.imgWidth = (maxHeight / img.height) * img.width
                        }
                    }
                    else {
                        vm.imgWidth = img.width
                        vm.imgHeight = img.height
                    }
                    vm.containerWidth = vm.imgWidth + 8
                    vm.containerHeight = vm.imgHeight + 8
                    vm.ltboxTop = (windowHeight - vm.imgHeight) / 2
                    vm.ltboxLeft = 0
                    function imgDisplay() {
                        vm.imgVisible = true
                        vm.showNav = vm.showSet ? true : false
                        vm.loaderDisplay = false
                        vm.src = src
                        vm.imgOpacity = 1
                    }

                    if (originHeight === vm.imgHeight && originWidth === vm.imgWidth) {
                        imgDisplay() //如图片尺寸不需调整，则直接显示
                    } else {
                        setTimeout(imgDisplay, 1000) //如需调整图片尺寸，显示是一秒延迟
                    }
                }
            }

            //阻止冒泡
            function stopPropagation(e) {
                e = e || window.event;
                if (e.stopPropagation) { //W3C阻止冒泡方法
                    e.stopPropagation();
                } else {
                    e.cancelBubble = true; //IE阻止冒泡方法
                }
            }

            vm.next = function (e) { //下一张
                stopPropagation(e)
                if (vm.$albumAttr.index !== (vm.$albumAttr.arr.length - 1)) {
                    vm.$albumAttr.index += 1
                    vm.picindex += 1
                    changeImg()
                    if (vm.$albumAttr.index === vm.$albumAttr.arr.length - 1) { //最后一张时右箭头隐藏
                        vm.showNext = false
                    }
                    if (!vm.showPrev) {
                        vm.showPrev = true
                    }
                }
            }

            vm.prev = function (e) { //上一张
                stopPropagation(e)
                if (vm.$albumAttr.index !== 0) {
                    vm.$albumAttr.index -= 1
                    vm.picindex -= 1
                    changeImg()
                    if (vm.$albumAttr.index === 0) { //第一张时左箭头隐藏
                        vm.showPrev = false
                    }
                    if (!vm.showNext) {
                        vm.showNext = true
                    }
                }
            }

            vm.imgClick = function (e) { //拦截图片点击事件
                stopPropagation(e);
            }
            function changeImg() { //切换图片
                var src = vm.$albumAttr.arr[vm.$albumAttr.index].big
                vm.loaderDisplay = true
                vm.description = vm.$albumAttr.arr[vm.$albumAttr.index].description
                vm.imgVisible = false
                vm.imgOpacity = 0
                vm.showNav = false
                adjustImgAttr(src)
            }
        })
        return vmodel
    }
    widget.defaults = {
        pictures: [], //初始化图片数组
        src: "",
        overlayOpacity: 0,//遮罩层透明度
        overLayOpacitySet:0.6,//自定义透明度
        imgOpacity: 0,//图片透明度(为了css过渡效果)
        imgVisible: false,//图片是否可见
        loaderDisplay: true,//loader图片是否可见
        onInit: avalon.noop,
        picindex: 0,//相册中图片index
        albumlength: 0,//相册数组长度
        containerWidth: 200,//lightbox初始大小
        containerHeight: 200,//lightbox初始大小
        layerHeight: "",//遮罩层大小
        layerWidth: "",//遮罩层大小
        imgWidth: 0,//图片大小
        imgHeight: 0,//图片大小
        ltboxTop: 0,//lightbox定位
        ltboxLeft: 0,//lightbox定位
        showNext: true,
        showPrev: true,
        description: "",
        getTemplate: function (tmpl, opts, tplName) {
            return tmpl
        },
        showSet: false//是否按照album模式显示
    }
    return avalon
})