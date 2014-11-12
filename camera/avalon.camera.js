/**
 * @camera图片轮播组件
 **/
avalon.config({
    paths: {
        jquery: "./mocha/jquery.js"
    },
    shim: {
        jquery: {
            exports: "jQuery"
        }
    }
})

define(["avalon", "text!./avalon.camera.html", "css!./avalon.camera.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {
    var effects = ["slideX", "slideY", "fadeIn", "crossX", "crossY", "stepX", "stepY", "rotateFadeIn"]
    var widget = avalon.ui.camera = function(element, data, vmodels) {
        var options = data.cameraOptions
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.cameraId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.pictureWidth = avalon.css(element, "width"), //@param  图片显示宽度
            vm.pictureHeight = avalon.css(element, "height"), //@param  图片显示高度
            vm.selections = avalon.range(vm.pictures.length) //圆形选择的数据数组（不包括复制到末尾的第一个元素）
            vm.currentIndex = 0 // 圆形选择的index
            vm.selectionWrapOffset = -vm.pictures.length * 20 / 2 //圆形选择CSS位置修正
            vm.arrowVisible = true //箭头是否可见
            vm.pictureIndex = 0
            vm.selectionIndex = 0
            vm.fakehoverVisible = false
            vm.nextPicture = function() {
                _animate(_indexUpdate(1), vm.effect, 1)
            }
            vm.lastPicture = function() {
                _animate(_indexUpdate(-1), vm.effect, -1)
            }
            vm.navselect = function(index) {
                _animate(index, vm.effect)
            }
            vm.$skipArray = ["widgetElement", "template", "selectionWrapOffset"]

            var inited
            vm.$init = function() {
                if (inited) return
                inited = true
                var pageHTML = options.template
                element.style.display = "none"
                element.innerHTML = pageHTML
                avalon.scan(element, [vmodel].concat(vmodels))
                element.style.display = "block"
            }

            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
        })

        var fakepartWidth = vmodel.pictureWidth / vmodel.slicedCols,
            fakepartHeight = vmodel.pictureHeight / vmodel.slicedRows
        require('jquery,ready!', function($) {
            var fakeHover = $(".oni-camera-fakehover")
            fakeHover.css("display", "none")
            for (var i = 0; i < vmodel.slicedRows; i++) {
                for (var j = 0; j < vmodel.slicedCols; j++) {
                    fakeHover.append("<div class='fakepart'></div>")
                    $(".oni-camera-fakehover .fakepart:last").css({
                        "background": "url(" + "http://gallery.kissyui.com/slide/1.3/demo/img/slide-1.jpg" + ")",
                        "background-position": -j * fakepartWidth + "px " + -i * fakepartHeight + "px"
                    })
                }
                fakeHover.append("<br>")
            }

            $(".oni-camera-fakehover .fakepart").css({
                "width": fakepartWidth,
                "height": fakepartHeight
            })
            for (var i = 0; i < vmodel.slicedRows; i++) {
                for (var j = 0; j < vmodel.slicedCols; j++) {
                    $(".oni-camera-fakehover .fakepart").eq(i * vmodel.slicedCols + j).css({
                        "width": fakepartWidth,
                        "height": fakepartHeight
                    })
                }
            }
        })

        var animated = false
        var _animate = function(index, effect, indexDirection, callback) {
            //防止积累
            if (animated) {
                return
            } else {
                animated = true
                vmodel.selectionIndex = index
            }

            //prepare
            var fakeparts = $(".oni-camera-fakehover .fakepart"),
                finishCount = 0,
                effect = effect === "random" ? effects[Math.floor(Math.random() * effects.length)] : effect
            for (var i = 0; i < vmodel.slicedRows; i++) {
                for (var j = 0; j < vmodel.slicedCols; j++) {
                    var _part = fakeparts.eq(i * vmodel.slicedCols + j),
                        _during = vmodel.during,
                        _delay = 0,
                        _movingDirection = j % 2 === 0 ? 1 : -1
                    _part.css({
                        "background": "url(" + vmodel.pictures[index] + ")",
                        "background-position": -j * fakepartWidth + "px " + -i * fakepartHeight + "px",
                        "background-size": vmodel.pictureWidth + "px " + vmodel.pictureHeight + "px",
                        "top": i * fakepartHeight + "px",
                        "left": j * fakepartWidth + "px"
                    })
                    var _yStart = parseFloat(_part.css("top")),
                        _xStart = parseFloat(_part.css("left"))

                    //计算起始位置、延时
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
                            _during += i * (vmodel.during / vmodel.slicedRows)
                            break;
                        case "stepY":
                            _part.css({
                                "top": _yStart + ( vmodel.pictureHeight + vmodel.pictureHeight / vmodel.slicedCols * j ) * indexDirection
                            })
                            _during += j * (vmodel.during / vmodel.slicedCols)
                            break;
                        case "rotateFadeIn":
                            _part.css({
                                "opacity": 0
                            })
                            var arr = _getRotateArr(vmodel.slicedCols, vmodel.slicedRows)
                            _delay = arr[i][j] * (vmodel.during / (vmodel.slicedCols * vmodel.slicedRows))
                            break;
                        default:
                    }

                    // animation
                    vmodel.fakehoverVisible = true

                    _part.delay(_delay).animate({
                        "top": _yStart + "px",
                        "left": _xStart + "px",
                        "opacity": 1
                    }, _during, function() {
                        finishCount += 1
                        if (finishCount === vmodel.slicedRows * vmodel.slicedCols) {
                            vmodel.fakehoverVisible = false
                            vmodel.pictureIndex = index
                            animated = false
                        }
                    })
                }
            }
        }

        var _indexUpdate = function(direction) {
            var _index = vmodel.pictureIndex
            _index = direction === 1 ? _index + 1 : _index - 1
            if (_index === vmodel.pictures.length) {
                _index = 0
            } else if (_index === -1) {
                _index = vmodel.pictures.length - 1
            }
            return _index
        }

        return vmodel
    }

    widget.defaults = {
        pictures: [], //@param  轮播图片素材
        effect: "random", //@param  图片切换类型，取值：none:无特效 / fade:渐隐 / slide:滑动
        easing: "easeInOut", //@param  缓动类型，取值 linear:无缓动效果 / easeIn:在过渡的开始提供缓动效果 / easeOut:在过渡的结尾提供缓动效果 / easeInOut 在过渡的开始和结尾提供缓动效果
        timeout: 2500, //@param  切换时间间隔
        during: 600, //@param  切换速度，越小越快，单位为毫秒
        alwaysShowArrow: true, //@param  显示左右切换箭头
        alwaysShowSelection: true, //@param  显示底部圆形切换部件
        autoSlide: true, //@param  自动播放
        hoverStop: true, //@param  鼠标经过停止播放
        adaptiveWidth: false, //@param  适应外围宽度，为true时指定pictureWidth不起作用
        adaptiveHeight: false, //@param  适应外围高度，为true时指定pictureHeight不起作用
        eventType: "click", //@param  触发tab切换的nav上的事件类型，取值click\mouseenter\both
        arrowLeftClass: "", //@param  左右箭头的className，可不传
        arrowRightClass: "", //@param  左右箭头的className，可不传
        slicedCols: 3,
        slicedRows: 4,
        onInit: avalon.noop, //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        }, //@optMethod getTemplate(tpl, opts, tplName) 定制修改模板接口
        $author: "heiwu805@hotmail.com"
    }

    function _getRotateArr(mx, my) {
        var helix = []
        for(var i = 0; i<my ; i++){
            helix[i] = new Array(mx)
        }
        var minX = 0, minY = 0, maxX = mx-1, maxY = my-1
        var row = 0, col = 0;
        for (var i = 0; i < mx * my; i++) {
            helix[row][col] = i + 1;
            if (row == minY && col < maxX) {
                col++;
            } else if (row < maxY && col == maxX) {
                row++;
            } else if (row == maxY && col > minX) {
                col--;
            } else if (row > minY && col == minX) {
                row--;
            }
            if (row - 1 == minY && col == minX) { //在一个周期结束时修改最大最小值  
                minY++;
                minX++;
                maxX--;
                maxY--;
            }
        }
        return helix;
    }
})