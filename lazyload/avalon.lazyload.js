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
        options = avalon.mix({}, lazyload.defaults, vmOptions || {}, avalon.getWidgetData(element, "lazyload"))

        //加载占位图片
        element.src = "./images/placeholder.png" //src是1像素透明图
        element.style.background = "url(" + options.preLoadSrc + ") no-repeat center center" //背景为load旋转图
        element.originalCssBackground = avalon.css(element, "background") //记录原背景CSS

        _resizeImg(element, options.preLoadSrc, false, false)

        imgArr.push(element)

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
    // avalon.bind(window, "load", function() {
    //     console.log(1)
    //     _delayload(options)
    // })
    window.onload = new function() {
        setTimeout(function() {
            _delayload(options)
        }, 0)
    }
    window.onscroll = function() {
        _delayload(options)
    }

    var _resizeImg = function(ele, src, isloadingOriginal, needResize) {
        var placeholderImg = new Image()
        placeholderImg.onload = function() {
            //未设置宽高情况下，设置ele宽高为src宽高
            if (ele.width <= 1 || ele.height <= 1 || needResize) {
                ele.width = placeholderImg.width
                ele.height = placeholderImg.height
                ele.setAttribute("ms-lazyload-preLoadSetSize", true)
            }
            if(isloadingOriginal){
                ele.src = src //大小确定后加载原图
            }
            // console.log(ele.width, ele.height, placeholderImg.width, placeholderImg.height)
        }
        placeholderImg.src = src
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
                            avalon.css(imgItem, "opacity", 0)
                            // _fadeInEffect(imgItem)
                        }
                        //重新设置图片大小为originalSrc的大小
                        if (imgItem.getAttribute("ms-lazyload-preLoadSetSize")) {
                            _resizeImg(imgItem, originalSrc, true, true)
                            imgItem.removeAttribute("ms-lazyload-preLoadSetSize")
                        }else{
                            _resizeImg(imgItem, originalSrc, true, false)
                            if (options.loadEffect === "fadeIn") {
                                _fadeInEffect(imgItem)
                            }
                        }

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
            if (window.attachEvent) { //ie8及以下
                avalon.css(imgItem, "opacity", currentOpacity)
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