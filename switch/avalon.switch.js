/**
  * switch组件，
  *
  */
define(["avalon", "text!./avalon.switch.html", "../draggable/avalon.draggable"], function(avalon, tmpl) {

    var arr = tmpl.split("MS_OPTION_STYLE") || ["", ""]
    var cssText = arr[1].replace(/<\/?style>/g, "")
    var styleEl = document.getElementById("avalonStyle")
    var template = arr[0]
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    function formateTpl(tpl) {
        return tpl.replace(/MS_OPTION_[^\}]+/g, function(mat) {
            return mat.split("MS_OPTION_")[1].toLowerCase().replace(/_[^_]/g, function(mat) {
                return mat.split('_')[1].toUpperCase()
            })
        })
    }

    function insertAfer(tar, ele) {
        var tar = tar.nextSibling
            , par = tar.parentNode
        if(tar) {
            par.insertBefore(ele, tar)
        } else {
            par.appendChild(ele)
        }
    }
 
    function supportCss3(style) {
        var prefix = ['webkit', 'Moz', 'ms', 'o'],
            i,
            humpString = [],
            htmlStyle = document.documentElement.style,
            _toHumb = function (string) {
                return string.replace(/-(\w)/g, function ($0, $1) {
                    return $1.toUpperCase();
                });
            };
     
        for (i in prefix)
            humpString.push(_toHumb(prefix[i] + '-' + style));
     
        humpString.push(_toHumb(style));
     
        for (i in humpString)
            if (humpString[i] in htmlStyle) return true;
     
        return false;
    }

    var css3support = supportCss3('transition')

    var widget = avalon.ui['switch'] = function(element, data, vmodels) {
        var options = data.switchOptions
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        var timer

        var vmodel = avalon.define(data.switchId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.$css3support = css3support && vm.animated
            vm.$skipArray = ["widgetElement", "template"]
            var newDiv
                , inputEle
                , bar 
                , dragger
                , dragEvent = {}

            function getElementLeft(element){
        　　　　var actualLeft = element.offsetLeft;
        　　　　var current = element.offsetParent;
        　　　　while (current !== null){
        　　　　　　actualLeft += current.offsetLeft;
        　　　　　　current = current.offsetParent;
        　　　　}
        　　　　return actualLeft;
        　　}
            var attrMaps = {
                'draxis': 'x'
                , 'drStop': function(e, data) {
                    if(e.x == dragEvent.x) {
                        vmodel.$vmDragging = false
                    }
                }
                , 'drStart': function(e, data) {
                    vmodel.$vmDragging = true
                    dragEvent = e
                }
                , 'drDrag': function(e) {
                }
                , 'drHandle': function(e) {
                    if((e.target || e.srcElement) == dragger) return dragger
                    vmodel.$vmDragging = false
                    return
                }
                , 'drBefore-start': function(e, data) {
                    vmodel.$vmDragging = true
                    var w = bar.parentNode.clientWidth
                        , w2 = bar.parentNode.offsetWidth
                        , b = (w2 - w) / 2
                        , p = avalon(bar.parentNode).position()
                    vmodel.drContainment = data.containment = [-w * 0.5 + b + p.left, 0, p.left + b, 0]
                }
                , 'drBefore-stop': function(e, data) {
                    if(e.x == dragEvent.x) {
                        vmodel.$vmDragging = false
                    } else {
                        var dis = dragEvent.x - e.x
                        , dir = vmodel.$getDir()
                        if(Math.abs(dis) >= dragger.offsetWidth * 2 / 5) {
                            // 右边拖动
                            if(dis > 0 && !dir || dis < 0 && dir) {
                                vmodel.checked = !vmodel.checked
                            }
                        }
                        to = vmodel.$getDir() ? -50 : 0
                        if(css3support) {
                            bar.style[vmodel.dir] = to + '%'
                        } else {
                            vm.$animate(-to)
                        }
                    }
                }
                , 'drContainment': [0,0,0,0]
            }
            avalon.mix(vm, attrMaps)

            var inited
            vm.$init = function() {
                if(inited) return
                inited = true
                var divCon =document.createElement('div')
                divCon.innerHTML = formateTpl(template)
                newDiv = divCon.getElementsByTagName('div')[0]
                insertAfer(element, newDiv)
                divCon = null

                inputEle = element

                inputEle.parentNode.removeChild(inputEle)
                inputEle.style.display = 'none'

                // input元素的checked属性优先级高
                if(inputEle.checked) {
                    vmodel.checked = true
                } 
                inputEle.setAttribute('ms-checked', 'checked')

                newDiv.appendChild(inputEle)

                bar = newDiv.firstChild

                while(bar) {
                    if(bar.className && bar.className.indexOf('ui-switch-bar') != -1) break
                    bar = bar.nextSibling
                }
                bar.style[vmodel.dir] = vmodel.$addthisCss()
                if(vmodel.draggable) {
                    dragger = bar.firstChild
                    while(dragger) {
                        if(dragger.className && dragger.className.indexOf('ui-switch-dragger') != -1) break
                        dragger = dragger.nextSibling
                    }
                    if(dragger) {
                        bar.setAttribute("ms-draggable", "")
                        , avaElem = avalon(bar)
                        avalon.each(attrMaps, function(key, item) {
                            var _key = key.replace(/^dr/, '').replace(/^[A-Z]/, function(mat) {return mat.toLowerCase()})
                            avaElem.data('draggable-' + _key, typeof item != 'function' ? item : key)
                        })
                    }
                }

                avalon.scan(newDiv, [vmodel].concat(vmodels))

            }
            vm.$remove = function() {
                newDiv.parentNode.insertBefore(inputEle, newDiv)
                newDiv.parentNode.removeChild(newDiv)
                inputEle.style.display = 'inline'
                if(element.innerHTML) element.innerHTML = element.textContent = ""
            }
            vm.$addThisClass = function() {
                if(!vmodel.checked && vmodel.hdir =='on-off' || vmodel.checked && vmodel.hdir != 'on-off') return true
                return false
            }
            vm.$addthisCss = function() {
                if(vmodel.checked && vmodel.hdir !='on-off' || !vmodel.checked && vmodel.hdir == 'on-off') return '-50%'
                return '0'
            }

            //@method toggle 交替改变选中状态
            vm.toggle = function() {
                if(vmodel.disabled || vmodel.$vmDragging) return
                vmodel.checked = !vmodel.checked
                vmodel.$animate()
            }
            vm.$getDir = function() {
                return vmodel.checked && vmodel.hdir !='on-off' || !vmodel.checked && vmodel.hdir == 'on-off'
            }
            vm.$animate = function(to) {
                var dir = vmodel.$getDir()
                    , lt = -(parseInt(bar.style[vmodel.dir]) >> 0)
                if(!css3support && vmodel.animated) {
                    clearTimeout(timer)
                    var distance
                    if(dir) {
                        distance = vmodel.$animateArrMaker(lt, typeof to == 'undefined' ? 50 : to)
                    } else {
                        distance = vmodel.$animateArrMaker(lt, typeof to == 'undefined' ? 0 : to)
                    }
                    bar.style[vmodel.dir] = -distance[0] + '%'
                    distance.splice(0, 1)
                    timer = setInterval(function() {
                        if(distance.length == 0) return
                        bar.style[vmodel.dir] = -distance[0] + '%'
                        distance.splice(0, 1)
                    }, 200 / distance.length - 1 || 1)
                } else if(vmodel.animated) {
                    bar.style[vmodel.dir] = dir ? '-50%' : '0'
                }
            }
            //@method disable 禁用组件
            vm.disbale = function() {
                vm.disbale = true
            }

            //@method enable 启用组件
            vm.enable = function() {
                vm.disbale = true
            }

            return vm
        })
      
        return vmodel
    }

    widget.defaults = {
        onText: "ON",           //@param 选中状态提示文字
        offText: "OFF",         //@param 未选中状态提示文字
        type: "normal",         //@param 滑动条类型，默认normal，可设置为large,small,mini，以及其他任意组件不自带的名词，可以用来注入自定义class，生成ui-switch-{{type}}添加给switch模板容器
        theme: "normal",        //@param 主题，normal,success,warning,danger
        draggable: false,       //@param 是否支持拖动切换状态
        disabled: false,        //@param 禁用
        checked: false,         //@param 默认选中状态
        animated: true,         //@param 是否开启切换动画效果
        hdir: "on-off",         //@param 开启、关闭选项排列顺序on-off,off-on
        dir: "left",            //\@param 组件排列方向,left,to
        $vmDragging: false,     //@param 为true，不响应click切换效果
        $css3support: false,
        $animateArrMaker: function(from, to) {
            var arr = []
                , dis = to - from
            while(from != to) {
                from += parseInt(dis / 1.5)
                dis = parseInt(dis / 1.5)
                if(Math.abs(dis) <= 1) from = to
                arr.push(from)
            }
            if(arr.length == 0) arr = [to]
            return arr
        },
        getTemplate: function(tmpl, opts) {
            return tmpl
        },
        $author: "skipper@123"
    }
})