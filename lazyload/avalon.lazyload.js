/**
 * @description lazyload组件，
 *
 */
define(["avalon"], function() {
    var requestAnimationFrame = (function() { //requestAnimationFrame 兼容
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 25)
            }
    })()

    var imgArr = []
    var options

    var lazyload = avalon.bindingHandlers.lazyload = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || ["$", "lazyload"]
        var ID = args[0].trim(),
            opts = args[1],
            model, vmOptions
        if (ID && ID != "$") {
            model = avalon.vmodels[ID] //如果指定了此VM的ID
            if (!model) {
                return
            }
        }
        if (!model) { //如果使用$或绑定值为空，那么就默认取最近一个VM，没有拉倒
            model = vmodels.length ? vmodels[0] : null
        }
        var fnObj = model || {}
        if (model && typeof model[opts] === "object") { //如果指定了配置对象，并且有VM
            vmOptions = model[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
            fnObj = vmOptions
        }
        var element = data.element
        element.removeAttribute("ms-lazyload")
        options = avalon.mix({}, lazyload.defaults, vmOptions || {}, avalon.getWidgetData(element, "lazyload"));

        //创建preload的img对象
        var img = new Image();
        img.src = options.preLoadSrc;

        element.src = "./images/placeholder.png"
        element.style.background = "url(" + options.preLoadSrc + ") no-repeat center center"
        element.originalCssBackground = avalon.css(element, "background")
        imgArr.push(element)

        //未设置宽高情况下，宽高为PreloadSrc宽高
        // img.onload = function() {
        //     if (element.width === 0 || element.height === 0) {
        //         element.width = img.width + "px"
        //         element.height = img.height + "px"
        //     }
        //     // console.log(element, element.width, element.height, img.width, img.height)
        // }

        // var target = avalon(element)
        // target.bind("click", function(e) {})
    }

    lazyload.defaults = {
        preLoadSrc: "http://placehold.it/800x200/fff/000.jpg&text=preload",
        delayTime: 1000,
        loadEffect: "none"
    }

    lazyload.getAll = function() {

    }

    //初始加载和窗口滚动时加载
    window.onload = function(){
        _delayload(options)
    }
    window.onscroll = function() {
        _delayload(options)
    }
    var _delayload = function(options) {
        for (var i = 0, len = imgArr.length; i < len; i++) {
            var imgItem = imgArr[i],
                eleTop = imgItem.offsetTop,
                eleHeight = imgItem.offsetHeight,
                winTop = document.documentElement.scrollTop || document.body.scrollTop,
                winHeight = document.documentElement.clientHeight || document.body.clientHeight
            // console.log(eleTop, eleHeight, winTop, winHeight)
            //加载正确的图片(originalSrc),条件是屏幕范围内并且要防止重复设置
            if (eleTop < winTop + winHeight && eleTop + eleHeight > winTop && !imgItem.getAttribute("ms-lazyload-loaded")) {
                originalSrc = imgItem.getAttribute("ms-lazyload-original")
                setTimeout((function(i, originalSrc) { //延迟加载
                    return function() {
                        imgItem = imgArr[i]
                        if (options.loadEffect === "fadeIn") {
                            _fadeInEffect(imgItem)
                        }
                        imgItem.src = originalSrc
                    }
                })(i, originalSrc), options.delayTime)
                imgItem.setAttribute("ms-lazyload-loaded", true)
                imgItem.removeAttribute("ms-lazyload-original")
                avalon.css(imgItem, "background", imgItem.originalCssBackground)
            }
        }
    }
    var _fadeInEffect = function(imgItem) {
        var currentOpacity = 0
        var _fadeInGo = function() {
            currentOpacity += 0.05
            var Fragment = document.createDocumentFragment();
            if (Fragment.createElement) { //ie8及以下
                // avalon.css(imgItem, "opacity", currentOpacity)
                imgItem.style.filter = "alpha(opacity=" + currentOpacity * 100 + ")"
            } else {
                imgItem.style.opacity = currentOpacity
            }
            if (currentOpacity < 1) {
                requestAnimationFrame(_fadeInGo)
            }
        }
        _fadeInGo()
    }

    avalon.lazyload = lazyload
    return avalon
})