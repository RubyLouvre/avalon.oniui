/**
 * @description lazyload组件，
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

    var lazyElementArr = [] //预加载元素数组
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
        if (element.tagName === "IMG") {
            element.src = "./images/placeholder.png"
        }

        //设置preLoadSrc
        var indiepreLoadSrc = element.getAttribute("ms-lazyload-indiepreLoadSrc")
        var preLoadSrc = indiepreLoadSrc === null ? options.preLoadSrc : indiepreLoadSrc


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
    window.onload = new function() {
        setTimeout(function() {
            _delayload(options)
        }, 0)
    }
    window.onscroll = function() {
        _delayload(options)
    }


    var _renderImg = function(ele, src, isloadingOriginal, needResize, tempImgItem) {
        var placeholderImg = new Image(),
            effect = ele.getAttribute("ms-lazyload-effect") !== null ? ele.getAttribute("ms-lazyload-effect") : options.loadEffect

        if (ele.tagName !== "IMG" && isloadingOriginal) {
            var domContent = src
            src = "./images/placeholder.png"
        }
        if (effect === "fadeIn") {
            avalon.css(ele, "opacity", 0)
        }
        placeholderImg.onload = function() {
            //CSS设置了DOM宽高时采用originalSize,否则采用src的宽高
            if (ele.width <= 1 || ele.height <= 1 || typeof ele.width === "undefined" || typeof ele.height === "undefined" || needResize) {
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
                    ele.parentNode.removeAttribute("avalonctrl")
                    ele.parentNode.setAttribute("ms-controller", "demo")
                    avalon.scan(ele.parentNode)
                }
            }

            //Effect 模式
            if (( effect === "fadeIn" || effect === "slideY" || effect === "slideX" ) && isloadingOriginal) {
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
            var imgItem = options.preLoadType === "text" ? lazyElementArr[i].imgEle : lazyElementArr[i]
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
                            _renderImg(imgItem, originalSrc, true, imgItem.preLoadSetSize, lazyElementArr[i])
                        }
                        //加载完成
                        imgItem.lazyloaded = true
                        imgItem.removeAttribute("ms-lazyload-original")
                        avalon.css(imgItem, "background-image", imgItem.originalCssBackground)
                        try { //ie不支持
                            delete imgItem.originalCssBackground
                        } catch (e) {}
                    }
                })(i, imgItem, imgItem.getAttribute("ms-lazyload-original")), options.delayTime)
            }
        }
    }

    var _EffectStart = function(ele, effect) {
        if (ele.animated) {
            return
        }
        var currentTime = 0,
            startpos = effect === "fadeIn" ? 0 : -options.slideDistance,
            duringDistance = effect === "fadeIn" ? 1 : options.slideDistance,
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
        contentType: "image", //@param 懒加载的内容："image"-图片 / "DOM"-文档片段
        preLoadType: "image", //@param 预加载的内容："image"-加载中图片 / "text"-加载中文字
        preLoadSrc: "./images/loading1.gif", //@param  预加载图片（文字内容）：preLoadType为"image"时，此为图片路径；preLoadType为"text"时，此为文字内容，也可以设置元素的ms-lazyload-indiepreLoadSrc替代默认值
        delayTime: 500, //@param  延迟加载时间（毫秒）
        loadEffect: "none", //@param  预加载效果 "none"-无效果 / "fadeIn"-渐入效果 / "slideX"-由左向右滑动 / "slideY"-由上向下滑动，建议在图片加载中使用
        easing: "easeInOut", //@param  动画效果的缓动函数
        slideDistance: 200, //@param loadEffect-slide模式的滑动长度
        $author: "heiwu805@hotmail.com"
    }

    avalon.lazyload = lazyload
    return avalon
})