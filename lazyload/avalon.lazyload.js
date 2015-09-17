/**
 *
 * @cnName 延迟加载组件
 * @enName lazyload
 * @introduce
 * 延迟加载组件用于对页面中的图片/文档片段进行延迟加载，让页面在初次渲染时不加载图片/文档片段，当其处于浏览器窗口可视范围内再进行加载，以尽可能提高网页渲染速度。
 * @summary
 */

define(["avalon"], function() {
    //获取当前JS绝对路径
    var path,
        t=document.getElementsByTagName("SCRIPT");
    for(var i in t){
        if(t[i].outerHTML && t[i].outerHTML.indexOf("avalon.lazyload.js") !== -1){
            var wholePath = t[i].src
            path = wholePath.substring(0, wholePath.lastIndexOf("/"))
        }
    }

    var requestAnimationFrame = (function() { //requestAnimationFrame 兼容
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 25)
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

    var lazyElementArr = [], //预加载元素数组
        options

    var lazyload = avalon.bindingHandlers.lazyload = function(data, vmodels) {
        //获取lazyload元素
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
        if (model && typeof model[opts] === "object") { //如果指定了配置对象，并且有VM
            vmOptions = model[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
        }
        var element = data.element
        element.removeAttribute("ms-lazyload")
        options = avalon.mix({}, lazyload.defaults, vmOptions || {}, avalon.getWidgetData(element, "lazyload"))

        //加载占位图片为1像素透明图
        if (element.tagName === "IMG") {
            element.src = path + "/images/placeholder.png"
        }

        //设置preLoadSrc
        var preLoadSrc = element.getAttribute("data-lazyload-preloadsrc") === null ? options.preLoadSrc : element.getAttribute("data-lazyload-preloadsrc")

        //loading占位
        if (options.preLoadType === "image") {
            element.originalCssBackground = avalon.css(element, "background-image") //记录原背景CSS
            element.style.background = "url(" + preLoadSrc + ") no-repeat center center" //设置load旋转图为背景
            _renderImg(element, preLoadSrc, false, false)
            lazyElementArr.push(element)
        } else if (options.preLoadType === "text") {
            //设置placeholderText插入图片DOM前面
            var placeholderText = document.createElement("span")
            placeholderText.innerHTML = preLoadSrc
            element.parentNode.insertBefore(placeholderText, element)

            //placeholderText尺寸为图片尺寸
            placeholderText.style.cssText = "display:inline-block;*display:inline;*zoom:1;" +
            "width:" + element.width + "px;"
            avalon.css(placeholderText, "width", element.width <= 1 ? "auto" : element.width + "px;")
            avalon.css(placeholderText, "height", element.height <= 1 ? "auto" : element.height + "px;")

            //图片设为0像素
            element.originalSize = {
                "width": element.width <= 1 ? -1 : element.width,
                "height": element.height <= 1 ? -1 : element.height
            }
            avalon.css(element, "width", "0px")
            avalon.css(element, "height", "0px")

            //placeholderText代替原有img DOM进入lazyElementArr
            placeholderText.imgEle = element
            lazyElementArr.push(placeholderText)
        }

    }

    //init
    avalon.bind(window, "load", function() {
        _delayload(options)
    })
    setInterval(function(){
        _delayload(options)
    },100)

    var _renderImg = function(ele, src, isloadingOriginal, needResize, tempImgItem) {
        var placeholderImg = new Image(),
            effect = ele.getAttribute("data-lazyload-itemeffect") !== null ? ele.getAttribute("data-lazyload-itemeffect") : options.effect
        if (ele.tagName !== "IMG" && isloadingOriginal) {
            var domContent = src
            src = path + "/images/placeholder.png"
        }

        placeholderImg.onload = function() {
            options.width = ele.getAttribute("data-lazyload-width") || options.width
            options.height = ele.getAttribute("data-lazyload-height") || options.height

            if(options.width !== "" || options.height !== ""){
                if(options.width !== ""){
                    avalon.css(ele, "width", options.width)
                    ele.preLoadSetSize = true;
                }
                if(options.height !== ""){
                    avalon.css(ele, "height", options.height)
                    ele.preLoadSetSize = true;
                }
                //置空控制重复设置
                options.width = ""
                options.height = ""
            }

            //CSS设置了DOM宽高时采用originalSize,否则采用src的宽高
            else if (ele.width <= 1 || ele.height <= 1 || typeof ele.width === "undefined" || typeof ele.height === "undefined" || needResize) {
                if (ele.tagName !== "IMG" && needResize) {
                    avalon.css(ele, "width", "auto")
                    avalon.css(ele, "height", "auto")
                } else {
                    if (options.preLoadType === "text") {
                        avalon.css(ele, "width", ele.originalSize.width === -1 ? placeholderImg.width : ele.originalSize.width)
                        avalon.css(ele, "height", ele.originalSize.height === -1 ? placeholderImg.height : ele.originalSize.height)
                    } else {
                        avalon.css(ele, "width", placeholderImg.width)
                        avalon.css(ele, "height", placeholderImg.height)
                    }
                }
                if (needResize) { //根据originalSrc重新设定尺寸结束以后删除preLoadSetSize属性
                    try { //ie不支持
                        delete ele.preLoadSetSize
                    } catch (e) {}
                } else { //ele尺寸未设置，需要根据originalSrc重新设定尺寸
                    ele.preLoadSetSize = true
                }
            }

            //加载原图 / DOM
            if (isloadingOriginal) {
                if (ele.tagName === "IMG") {
                    ele.src = src //大小确定后加载原图
                } else { //DOM
                    ele.innerHTML = domContent
                    var findController = ele

                    do {
                        findController = findController.parentNode
                    } while (findController.getAttribute("avalonctrl") === null);
                    findController.setAttribute("ms-controller", findController.getAttribute("avalonctrl"))
                    findController.removeAttribute("avalonctrl")
                    avalon.scan(findController)
                }
            }

            //Effect 模式
            if ((effect === "fadeIn" || effect === "slideY" || effect === "slideX") && isloadingOriginal) {
                _EffectStart(ele, effect)
            }

            //移除placeholderText
            if (options.preLoadType === "text") {
                if (tempImgItem.parentNode !== null) {
                    tempImgItem.parentNode.removeChild(tempImgItem)
                }
            }
        }
        placeholderImg.src = src
    }

    var _delayload = function(options) {
        for (var i = 0, len = lazyElementArr.length; i < len; i++) {
            var imgItem = options.preLoadType === "text" ? lazyElementArr[i].imgEle : lazyElementArr[i],
                eleTop = imgItem.offsetTop,
                eleHeight = imgItem.offsetHeight,
                winTop = document.compatMode === "BackCompat" ? document.body.scrollTop : document.documentElement.scrollTop,
                winHeight = document.compatMode === "BackCompat" ? document.body.clientHeight : document.documentElement.clientHeight

            if(winTop === 0){ //修正chrome下取不到的問題
                winTop = document.body.scrollTop;
            }

            //加载正确的图片(originalSrc),条件是屏幕范围内并且要防止重复设置
            if (eleTop < winTop + winHeight && eleTop + eleHeight > winTop && !imgItem.lazyloaded) {
                //延迟加载
                setTimeout((function(i, imgItem, originalSrc) {
                    return function() {
                        if (options.preLoadType === "image") {
                            _renderImg(imgItem, originalSrc, true, imgItem.preLoadSetSize)
                        } else {
                            _renderImg(imgItem, originalSrc, true, imgItem.preLoadSetSize, lazyElementArr[i])
                        }
                        //加载完成
                        imgItem.lazyloaded = true
                        imgItem.removeAttribute("data-lazyload-original")
                        avalon.css(imgItem, "background-image", imgItem.originalCssBackground)
                        try { //ie不支持
                            delete imgItem.originalCssBackground
                        } catch (e) {}
                    }
                })(i, imgItem, imgItem.getAttribute("data-lazyload-original")), imgItem.getAttribute("data-lazyload-itemdelay") || options.delay)
            }
        }
    }

    var _EffectStart = function(ele, effect) {
        if (ele.animated) {
            return
        }
        var currentTime = 0,
            distance = ele.getAttribute("data-lazyload-distance") || options.slideDistance,
            startpos = effect === "fadeIn" ? 0 : -distance,
            duringDistance = effect === "fadeIn" ? 1 : distance,
            duringTime = 20,
            cssName
        if (effect === "fadeIn") {
            cssName = "opacity"
        } else {
            cssName = effect === "slideY" ? "margin-top" : "margin-left"
        }
        var _EffectGo = function() {
            cssValue = Tween[options.easing](currentTime, startpos, duringDistance, duringTime) //移动
            if (currentTime < duringTime) {
                avalon.css(ele, cssName, cssValue)
                currentTime += 1
                requestAnimationFrame(_EffectGo)
            }
        }
        ele.animated = true
        _EffectGo()
    }

    lazyload.defaults = {
        width:"", //@config 懒加载占位宽度，可通过设置元素的data-lazyload-width修改
        height:"", //@config 懒加载占位高度，可通过设置元素的data-lazyload-height修改
        contentType: "image", //@config 懒加载内容类型："image"-图片 / "DOM"-文档片段
        preLoadType: "image", //@config 预加载类型："image"-采用加载中图片 / "text"-采用加载中文字
        preLoadSrc: path + "/images/loading1.gif", //@config  预加载图片路径（文字内容）：preLoadType为"image"时为图片路径；preLoadType为"text"时为文字内容。也可以设置元素的data-lazyload-preloadsrc，替代默认值
        delay: 500, //@config  延迟加载时间（毫秒）。也可以设置元素的data-lazyload-itemdelay，替代默认值
        effect: "none", //@config  预加载效果 "none"-无效果 / "fadeIn"-渐入效果 / "slideX"-由左向右滑动 / "slideY"-由上向下滑动，建议在图片加载中使用。也可以设置元素的data-lazyload-itemeffect，替代默认值
        easing: "easeInOut", //  动画效果的缓动函数
        slideDistance: 300, //@config effect-slide模式的滑动长度。也可以设置元素的data-lazyload-distance，替代默认值
        $author: "heiwu805@hotmail.com"
    }

    avalon.lazyload = lazyload
    return avalon
})

/**
 @links
 [懒加载组件-默认配置](avalon.lazyload.ex.html)
 [懒加载组件-自定义effect(加载效果)和各自delay(加载延迟)](avalon.lazyload.ex1.html)
 [懒加载组件-自定义加载中图片](avalon.lazyload.ex2.html)
 [懒加载组件-预加载采用文字模式](avalon.lazyload.ex3.html)
 [懒加载组件-懒加载页面元素](avalon.lazyload.ex4.html)
 [懒加载组件-自定义懒加载尺寸](avalon.lazyload.ex5.html)
 */
