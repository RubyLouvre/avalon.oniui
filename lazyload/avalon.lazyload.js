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

        //加载占位图片为1像素透明图
        element.src = "./images/placeholder.png"

        //设置preLoadSrc
        var indiepreLoadSrc = element.getAttribute("ms-lazyload-indiepreLoadSrc")
        var preLoadSrc = indiepreLoadSrc === null ? options.preLoadSrc : indiepreLoadSrc

        //loading占位
        if (options.preLoadType === "image") {
            element.style.background = "url(" + preLoadSrc + ") no-repeat center center" //设置load旋转图为背景
            element.originalCssBackground = avalon.css(element, "background") //记录原背景CSS
            _renderImg(element, options.preLoadSrc, false, false)
            imgArr.push(element)
        } else if (options.preLoadType === "text") {
            //设置placeholderText插入图片DOM前面
            var placeholderText = document.createElement("span")
            placeholderText.innerHTML = options.preLoadSrc
            element.parentNode.insertBefore(placeholderText, element);

            //placeholderText尺寸为图片尺寸
            placeholderText.style.cssText = "display:inline-block;*display:inline;*zoom:1;" +
                "width:" + element.width + "px;"
            avalon.css(placeholderText, "width", element.width <= 1 ? "auto" :element.width + "px;")
            avalon.css(placeholderText, "height", element.height <= 1 ? "auto" :element.height + "px;")

            //图片设为0像素
            element.originalSize = {
                "width": element.width <= 1 ? -1 : element.width,
                "height": element.height <= 1 ? -1 : element.height
            }
            avalon.css(element, "width", "0px")
            avalon.css(element, "height", "0px")

            //placeholderText代替原有img DOM进入imgArr
            placeholderText.imgEle = element
            imgArr.push(placeholderText)
        }

        // 自定义函数向后插入
        function insertAfter(newElement, targetElement) {
            var parent = targetElement.parentNode;
            if (parent.lastChild == targetElement) {
                // 如果最后的节点是目标元素，则直接添加。因为默认是最后
                parent.appendChild(newElement);
            } else {
                //如果不是，则插入在目标元素的下一个兄弟节点的前面。也就是目标元素的后面。
                parent.insertBefore(newElement, targetElement);
            }
        }

        // var target = avalon(element)
        // target.bind("click", function(e) {})
    }

    lazyload.defaults = {
        preLoadType: "image",
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

    var _renderImg = function(ele, src, isloadingOriginal, needResize, tempImgItem) {
        var placeholderImg = new Image()
        if (options.loadEffect === "fadeIn") {
            avalon.css(ele, "opacity", 0)
        }
        placeholderImg.onload = function() {
            //CSS设置了DOM宽高时采用originalSize,否则采用src的宽高
            if (ele.width <= 1 || ele.height <= 1 || needResize) {
                if(options.preLoadType === "text"){
                    avalon.css(ele, "width", ele.originalSize.width === -1 ? placeholderImg.width : ele.originalSize.width)
                    avalon.css(ele, "height", ele.originalSize.height === -1 ? placeholderImg.height : ele.originalSize.height)
                } else{
                    avalon.css(ele, "width", placeholderImg.width)
                    avalon.css(ele, "height", placeholderImg.height)
                }

                if (needResize) { //根据originalSrc重新设定尺寸结束以后删除preLoadSetSize属性
                    try { //ie不支持
                        delete ele.preLoadSetSize
                    } catch (e) {}
                } else { //ele尺寸未设置，需要根据originalSrc重新设定尺寸
                    ele.preLoadSetSize = true
                }
            }

            //加载原图
            if (isloadingOriginal) {
                ele.src = src //大小确定后加载原图
            }

            //fadeIn 模式
            if (options.loadEffect === "fadeIn") {
                _fadeInEffect(ele)
            }

            //移除placeholderText
            if(options.preLoadType === "text"){
                tempImgItem.parentNode.removeChild(tempImgItem);
            }
        }
        placeholderImg.src = src
    }

    var _delayload = function(options) {
        for (var i = 0, len = imgArr.length; i < len; i++) {
            var imgItem = options.preLoadType === "text" ? imgArr[i].imgEle : imgArr[i]
            var eleTop = imgItem.offsetTop,
                eleHeight = imgItem.offsetHeight,
                winTop = document.documentElement.scrollTop || document.body.scrollTop,
                winHeight = document.documentElement.clientHeight || document.body.clientHeight

            //加载正确的图片(originalSrc),条件是屏幕范围内并且要防止重复设置
            if (eleTop < winTop + winHeight && eleTop + eleHeight > winTop && !imgItem.lazyloaded) {
                //延迟加载
                setTimeout((function(i, imgItem, originalSrc) {
                    return function() {
                        if (options.preLoadType === "image") {
                            _renderImg(imgItem, originalSrc, true, imgItem.preLoadSetSize)
                        } else {
                            _renderImg(imgItem, originalSrc, true, imgItem.preLoadSetSize, imgArr[i])
                        }
                    }
                })(i, imgItem, imgItem.getAttribute("ms-lazyload-original")), options.delayTime)

                //加载完成
                imgItem.lazyloaded = true
                imgItem.removeAttribute("ms-lazyload-original")
                avalon.css(imgItem, "background", imgItem.originalCssBackground)
                try { //ie不支持
                    delete imgItem.originalCssBackground
                } catch (e) {}
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