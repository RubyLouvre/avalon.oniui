/**
 *
 * @cnName 图片百叶窗效果组件
 * @enName camera
 * @introduce
 * 基于carousel图片轮播组件。注意：此组件动画效果由jquery完成，需要从外部引入。具体引入方法请看示例代码。
 * @summary
 */

define(["avalon", "text!./avalon.camera.html", "css!./avalon.camera.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {
    var effects = ["slideX", "slideY", "fadeIn", "crossX", "crossY", "stepX", "stepY", "rotateFadeIn"]
    var widget = avalon.ui.camera = function(element, data, vmodels) {
        var options = data.cameraOptions,
            fakepartWidth,
            fakepartHeight
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.cameraId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.pictureWidth = avalon.css(element, "width") // 图片显示宽度
            vm.pictureHeight = avalon.css(element, "height") // 图片显示高度
            vm.selections = avalon.range(vm.pictures.length) // 圆形选择的数据数组（不包括复制到末尾的第一个元素）
            vm.selectionWrapOffset = -vm.pictures.length * 20 / 2 // 圆形选择CSS位置修正
            vm.arrowVisible = vm.alwaysShowArrow ? true : false // 箭头是否可见
            vm.pictureIndex = 0
            vm.selectionIndex = 0 //导航index
            vm.fakehoverVisible = false
            vm.nextPicture = function() {
                _animate(_indexUpdate(1), vm.effect, 1)
            }
            vm.lastPicture = function() {
                _animate(_indexUpdate(-1), vm.effect, -1)
            }
            var hoverIndex = 0;
            vm.navselect = function(index, e) {
                // 防止同一张图片重复刷新
                if(index === vm.selectionIndex){
                    return
                }
                // 全局指定，获取鼠标当前index
                hoverIndex = index
                // 执行动作
                if (e.type === vm.eventType || vm.eventType === "both") {
                    if (e.type === "mouseenter") {
                        setTimeout(function() {
                            _animate(index, vm.effect)
                        }, 300) //mouseenter事件设置延时以防止切换时间间隔太小
                    } else {
                        _animate(index, vm.effect)
                    }
                }
                // 修复hover的TAB和select的TAB不一致
                var fixIndex = setInterval(function(){
                    if(vm.selectionIndex !== hoverIndex){
                        _animate(hoverIndex, vm.effect)
                    } else{
                        clearInterval(fixIndex)
                    }
                },800)
            }
            vm.stopPlay = function(){
                if(vm.hoverStop){
                    clearInterval(playHandler)
                }
            }
            vm.restartPlay = function(){
                if(vm.hoverStop){
                    start()
                }
            }
            vm.$skipArray = ["widgetElement", "template", "selectionWrapOffset","pictures","effect","alwaysShowArrow","timeout","speed","alwaysShowSelection","hoverStop","adaptiveWidth","adaptiveHeight","eventType","arrowLeftClass","arrowRightClass","slicedCols","slicedRows"]

            var inited
            vm.$init = function(continueScan) {
                if (inited) return
                inited = true
                var pageHTML = options.template
                element.style.display = "none"
                element.innerHTML = pageHTML
                element.style.display = "block"

                if (vm.adaptiveWidth) { //自动填充外围容器宽度
                    vm.pictureWidth = element.offsetWidth
                }
                if (vm.adaptiveHeight) { //自动填充外围容器高度
                    element.style.height = "100%"
                    vm.pictureHeight = avalon.css(element, "height") //@config  图片显示高度
                    var children = element.children
                    for (var i = 0, len = children.length; i < len; i++) {
                        if (children[i].id === "oni-camera") {
                            children[i].style.height = "100%"
                        }
                    }
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
        })

        var getReady = function(){
                // 区块大小
                fakepartWidth = vmodel.pictureWidth / vmodel.slicedCols
                fakepartHeight = vmodel.pictureHeight / vmodel.slicedRows

                // 分割区块
                require(['jquery', 'ready!'], function($) {
                    var fakeHover = $(element).find(".oni-camera-fakehover")
                    fakeHover.css("display", "none")
                    for (var i = 0; i < vmodel.slicedRows; i++) {
                        for (var j = 0; j < vmodel.slicedCols; j++) {
                            fakeHover.append("<div class='fakepart'></div>")
                            $(".oni-camera-fakehover .fakepart:last").css({
                                "background": "url(" + vmodel.pictures[0] + ")",
                                "background-position": -j * fakepartWidth + "px " + -i * fakepartHeight + "px"
                            })
                        }
                        fakeHover.append("<br>")
                    }

                    $(element).find(".oni-camera-fakehover .fakepart").css({
                        "width": fakepartWidth,
                        "height": fakepartHeight
                    })
                    for (var i = 0; i < vmodel.slicedRows; i++) {
                        for (var j = 0; j < vmodel.slicedCols; j++) {
                            $(element).find(".oni-camera-fakehover .fakepart").eq(i * vmodel.slicedCols + j).css({
                                "width": fakepartWidth,
                                "height": fakepartHeight
                            })
                        }
                    }
                    start()
                })
            },

            // 自动播放
            playHandler,
            start = function(){
                playHandler = setInterval(function(){
                    _animate(_indexUpdate(1), vmodel.effect, 1)
                },vmodel.timeout)
            },

            // 图片切换
            animated = false,
            _animate = function(index, effect, indexDirection) {
                indexDirection = indexDirection || 1

                // 防止积累
                if (animated) {
                    return
                } else {
                    animated = true
                    vmodel.selectionIndex = index
                }

                // 准备动画
                var fakeparts = $(element).find(".oni-camera-fakehover .fakepart"),
                    finishCount = 0,
                    effect = effect === "random" ? effects[Math.floor(Math.random() * effects.length)] : effect
                for (var i = 0; i < vmodel.slicedRows; i++) {
                    for (var j = 0; j < vmodel.slicedCols; j++) {
                        var _part = fakeparts.eq(i * vmodel.slicedCols + j),
                            _speed = vmodel.speed,
                            _delay = 0,
                            _movingDirection = j % 2 === 0 ? 1 : -1;
                        _part.css({
                            "background": "url(" + vmodel.pictures[index] + ")",
                            "background-position": -j * fakepartWidth + "px " + -i * fakepartHeight + "px",
                            "background-size": vmodel.pictureWidth + "px " + vmodel.pictureHeight + "px",
                            "top": i * fakepartHeight + "px",
                            "left": j * fakepartWidth + "px"
                        })
                        var _yStart = parseFloat(_part.css("top")),
                            _xStart = parseFloat(_part.css("left"))

                        // 计算起始位置、延时
                        switch (effect) {
                            case "slideX":
                                _part.css({
                                    "left": _xStart + vmodel.pictureWidth * indexDirection
                                })
                                break;
                            case "slideY":
                                _part.css({
                                    "top": _yStart + vmodel.pictureHeight * indexDirection
                                })
                                break;
                            case "fadeIn":
                                _part.css({
                                    "opacity": 0
                                })
                                break;
                            case "crossX":
                                _movingDirection = i % 2 === 0 ? 1 : -1
                                _part.css({
                                    "left": _xStart + _movingDirection * vmodel.pictureWidth * indexDirection
                                })
                                break;
                            case "crossY":
                                _part.css({
                                    "top": _yStart + _movingDirection * vmodel.pictureHeight * indexDirection
                                })
                                break;
                            case "stepX":
                                _part.css({
                                    "left": _xStart + ( vmodel.pictureWidth + vmodel.pictureWidth / vmodel.slicedRows * i ) * indexDirection
                                })
                                _speed += i * (vmodel.speed / vmodel.slicedRows)
                                break;
                            case "stepY":
                                _part.css({
                                    "top": _yStart + ( vmodel.pictureHeight + vmodel.pictureHeight / vmodel.slicedCols * j ) * indexDirection
                                })
                                _speed += j * (vmodel.speed / vmodel.slicedCols)
                                break;
                            case "rotateFadeIn":
                                _part.css({
                                    "opacity": 0
                                })
                                var arr = _getRotateArr(vmodel.slicedCols, vmodel.slicedRows)
                                _delay = arr[i][j] * (vmodel.speed / (vmodel.slicedCols * vmodel.slicedRows))
                                break;
                            default:
                        }

                        // animation
                        vmodel.fakehoverVisible = true

                        _part.delay(_delay).animate({
                            "top": _yStart + "px",
                            "left": _xStart + "px",
                            "opacity": 1
                        }, _speed, function() {
                            finishCount += 1
                            if (finishCount === vmodel.slicedRows * vmodel.slicedCols) {
                                vmodel.fakehoverVisible = false
                                vmodel.pictureIndex = index
                                animated = false
                            }
                        })
                    }
                }
            },

            // 更新index
            _indexUpdate = function(direction) {
                var _index = vmodel.pictureIndex
                _index = direction === 1 ? _index + 1 : _index - 1
                if (_index === vmodel.pictures.length) {
                    _index = 0
                } else if (_index === -1) {
                    _index = vmodel.pictures.length - 1
                }
                return _index
            }

        // 初始尺寸
        if(avalon.css(element,"height") === 0){ //未设置widget高度
            _getImageSize(vmodel.pictures[0], function (){ //以第一张图片的尺寸为widget尺寸
                vmodel.pictureHeight = this.height
                vmodel.pictureWidth = this.width
                getReady() // 图片加载会有一定延迟，放在回调中
            })
        } else{
            getReady() // 已经设置好widget尺寸
        }

        return vmodel
    }

    // 获取旋转矩阵
    var _getRotateArr = function(mx, my) {
        var helix = []
        for(var i = 0; i<my ; i++){
            helix[i] = new Array(mx)
        }
        var minX = 0, minY = 0, maxX = mx-1, maxY = my-1
        var row = 0, col = 0
        for (var i = 0; i < mx * my; i++) {
            helix[row][col] = i + 1
            if (row == minY && col < maxX) {
                col++
            } else if (row < maxY && col == maxX) {
                row++
            } else if (row == maxY && col > minX) {
                col--
            } else if (row > minY && col == minX) {
                row--
            }
            if (row - 1 == minY && col == minX) { // 在一个周期结束时修改最大最小值
                minY++
                minX++
                maxX--
                maxY--
            }
        }
        return helix
    }

    var _getImageSize = (function () {
        var list = [], intervalId = null,

        // 用来执行队列
            tick = function () {
                var i = 0;
                for (; i < list.length; i++) {
                    list[i].end ? list.splice(i--, 1) : list[i]();
                };
                !list.length && stop();
            },

        // 停止所有定时器队列
            stop = function () {
                clearInterval(intervalId);
                intervalId = null;
            };

        return function (url, ready, load, error) {
            var onready, width, height, newWidth, newHeight,
                img = new Image();

            img.src = url;

            // 如果图片被缓存，则直接返回缓存数据
            if (img.complete) {
                ready.call(img);
                load && load.call(img);
                return;
            };

            width = img.width;
            height = img.height;

            // 加载错误后的事件
            img.onerror = function () {
                error && error.call(img);
                onready.end = true;
                img = img.onload = img.onerror = null;
            };

            // 图片尺寸就绪
            onready = function () {
                newWidth = img.width;
                newHeight = img.height;
                if (newWidth !== width || newHeight !== height ||
                // 如果图片已经在其他地方加载可使用面积检测
                newWidth * newHeight > 1024
                ) {
                    ready.call(img);
                    onready.end = true;
                };
            };
            onready();

            // 完全加载完毕的事件
            img.onload = function () {
                // onload在定时器时间差范围内可能比onready快
                // 这里进行检查并保证onready优先执行
                !onready.end && onready();

                load && load.call(img);

                // IE gif动画会循环执行onload，置空onload即可
                img = img.onload = img.onerror = null;
            };

            // 加入队列中定期执行
            if (!onready.end) {
                list.push(onready);
                // 无论何时只允许出现一个定时器，减少浏览器性能损耗
                if (intervalId === null) intervalId = setInterval(tick, 40);
            };
        };
    })();

    widget.vertion = 1.1
    widget.defaults = {
        pictures: [], //@config  轮播图片素材
        effect: "random", //@config  图片切换类型，取值：random:全部随机 / none:无特效 / slideX:横向滑动 / slideY:纵向滑动 / fadeIn:渐入 / crossX:横向交叉 / crossY:纵向交叉 / stepX:横向阶梯 / stepY:纵向阶梯 / rotateFadeIn:旋转式渐入
        timeout: 2500, //@config  切换时间间隔
        speed: 600, //@config  切换速度，数值越小速度越快，单位为毫秒
        alwaysShowArrow: true, //@config  显示左右切换箭头
        alwaysShowSelection: true, //@config  显示底部圆形切换部件
        hoverStop: true, //@config  鼠标经过停止播放
        adaptiveWidth: false, //@config  适应外围宽度
        adaptiveHeight: false, //@config  适应外围高度
        eventType: "click", //@config  触发tab切换的nav上的事件类型，取值click\mouseenter\both
        arrowLeftClass: "", //@config  左右箭头的className，可不传
        arrowRightClass: "", //@config  左右箭头的className，可不传
        slicedCols: 5, //@config  区块列数
        slicedRows: 4, //@config  区块行数
        onInit: avalon.noop, //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        }, //@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "heiwu805@hotmail.com"
    }
})

/**
 @links
 [图片百叶窗切换组件](avalon.camera.ex.html)
 [图片百叶窗切换组件-自定义宽高](avalon.camera.ex1.html)
 [图片百叶窗切换组件-自定义切换间隔和切换速度](avalon.camera.ex2.html)
 [图片百叶窗切换组件-自定义区块数量](avalon.camera.ex3.html)
 */