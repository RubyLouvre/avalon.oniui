// avalon 1.3.6
/**
 * 
 * @cnName 按钮组件
 * @enName button
 * @introduce
 * <p>按钮组件提供丰富的样式、形式选择，除与bootstrap可用的button样式保持一致外，支持small、default、big、large四种尺寸，同时支持图标button，可以是仅有图标的button，图标在左边的button、图标在右边的button、两边都有图标的button，当然也支持图标组，有水平图标组、垂直图标组两种形式</p>
 */
define(["avalon", "css!../chameleon/oniui-common.css", "css!./avalon.button.css"], function(avalon) {
    var baseClasses = ["oni-button", "oni-widget", "oni-state-default"],
        typeClasses = "oni-button-icons-only oni-button-icon-only oni-button-text-icons oni-button-text-icon-primary oni-button-text-icon-secondary oni-button-text-only"

    var widget = avalon.ui.button = function(element, data, vmodels) {
        var options = data.buttonOptions,
            btnModel,
            $element = avalon(element)
            
        function stop(event) {
            if (options.disabled) {
                event.preventDefault()
                event.stopImmediatePropagation()
            }
        }
        btnModel = {
            $init: function() {
                var data = options.data,
                    elementType = "",
                    label = options.label,
                    buttonWidth = 0,
                    elementTagName = element.tagName.toLowerCase()

                if (options.groups && data.length > 1) {
                    var buttons = ""
                    
                    data.forEach(function(button, index) {
                        var buttonStr = "<span ms-widget='button'"
                        if (button.type !== void 0) {
                            buttonStr += " data-button-type='" + button.type + "'"
                        }
                        if (button.iconPosition !== void 0) {
                            buttonStr += " data-button-icon-position='" + button.iconPosition + "'"
                        }
                        if (button.icon !== void 0) {
                            buttonStr += " data-button-icon='" + button.icon + "'"
                        }
                        if (button.color !== void 0) {
                            buttonStr += " data-button-color='" + button.color + "'"
                        }
                        if (button.size !== void 0) {
                            buttonStr += " data-button-size='" + button.size + "'"
                        }
                        if (button.disabled !== void 0) {
                            buttonStr += " data-button-disabled='" + button.disabled + "'"
                        }
                        if (button.label !== void 0) {
                            buttonStr += " data-button-label='" + button.label + "'"
                        }
                        buttonStr += ">" + (button.text || "") + "</span>"
                        buttons += buttonStr
                    })
                    element.innerHTML = buttons
                    element.setAttribute("ms-widget", "buttonset")
                    if (options.direction == "vertical") {
                        element.setAttribute("data-buttonset-direction", "vertical")
                    }
                    if (!options.corner) {
                        element.setAttribute("data-buttonset-corner", options.corner)
                    }
                    if (options.width) {
                        element.setAttribute("data-buttonset-width", parseInt(options.width))
                    }
                    avalon.scan(element, vmodels)
                    return
                }
                if (typeof options.disabled !== "boolean") {
                    element.disabled = !!options.disabled
                } else {
                    element.disabled = options.disabled
                }

                if (elementTagName === "input") {
                    elementType = "input"
                }
                if (buttonWidth = parseInt(options.width)) {
                    element.style.width = buttonWidth + "px"
                }
                $element.bind("mousedown", function(event) {
                    stop(event)
                    $element.addClass("oni-state-active")
                })
                $element.bind("mouseup", function(event) {
                    stop(event)
                    $element.removeClass("oni-state-active")
                })
                $element.bind("blur", function() {
                    $element.removeClass("oni-state-active")
                    $element.removeClass("oni-state-focus");
                })
                $element.bind("focus", function() {
                    $element.addClass("oni-state-focus");
                })
                if (!options.label) {
                    label = elementType === "input" ? element.value : element.innerHTML
                }
                options.elementType = elementType
                options.label = label
                createButton(element, options)
                avalon.scan(element, vmodels)
            }
        }
        btnModel.$init()
    }
    avalon.ui.buttonset = function(element, data, vmodels) {
        var options = data.buttonsetOptions,
            buttonsetCorner = options.corner,
            direction = options.direction,
            $element = avalon(element)

        buttonsetCorner = buttonsetCorner !== void 0 ? buttonsetCorner : true
        var btnGroup = {
            $init: function() {
                var elementClass = []
                elementClass.push("oni-buttonset"),
                firstButtonClass = "oni-corner-left",
                lastButtonClass = "oni-corner-right",
                children = element.childNodes, 
                buttons = [] // 收集button组元素
                buttonWidth = options.width,
                firstElement = true

                for (var i = 0, el; el = children[i++]; ) {
                    if (el.nodeType === 1) {
                        el.setAttribute("data-button-corner", "false")
                        buttons.push(el)
                        if (firstElement) {
                            avalon(el).addClass("oni-button-first")
                            firstElement = false
                        }
                    }
                }
                var n = buttons.length
                if (n && buttonsetCorner) {
                    if (direction === "vertical") {
                        firstButtonClass = "oni-corner-top"
                        lastButtonClass = "oni-corner-bottom"
                    }
                    avalon(buttons[0]).addClass(firstButtonClass)
                    avalon(buttons[n - 1]).addClass(lastButtonClass)
                }
                if (direction === "vertical") {
                    elementClass.push("oni-buttonset-vertical")
                }
                $element.addClass(elementClass.join(" "))
                data.buttons = buttons
                avalon.scan(element, vmodels)
                if (buttonWidth = parseInt(buttonWidth)) {
                    (function(buttonWidth) {
                        var btns = [].concat(buttons)
                        setTimeout(function() {
                            for (var i = 0; button = btns[i++];) {
                                var $button = avalon(button),
                                    buttonName = button.tagName.toLowerCase()
                                if (buttonName === "input" || buttonName === "button") {
                                    button.style.width = buttonWidth + "px"
                                } else {
                                    button.style.width = (buttonWidth - parseInt($button.css("border-left-width")) - parseInt($button.css("border-right-width")) - parseInt($button.css("padding-left")) * 2) + "px"
                                }
                            }
                        }, 10)
                    })(buttonWidth)
                    return 
                }

                (function(buttons) {
                    var interval = 0,
                        maxButtonWidth = 0
                    buttons = buttons.concat()
                    interval = setInterval(function() {
                        var buttonWidth = 0,
                            innerWidth = 0,
                            $button
                        for (var i = 0, button; button = buttons[i++];) {
                            buttonWidth = Math.max(buttonWidth, avalon(button).outerWidth())
                        }
                        if (buttonWidth === maxButtonWidth) {
                            maxButtonWidth += 1
                            for (var i = 0, button; button = buttons[i++];) {
                                var buttonName = button.tagName.toLowerCase(),
                                    $button = avalon(button)

                                if (buttonName === "input" || buttonName === "button") {
                                    button.style.width = maxButtonWidth + "px"
                                    
                                } else {
                                    button.style.width = (maxButtonWidth - parseInt($button.css("border-left-width")) - parseInt($button.css("border-right-width")) - parseInt($button.css("padding-left")) * 2) + "px"
                                }
                            }
                            clearInterval(interval)
                            return 
                        }
                        maxButtonWidth = buttonWidth
                    }, 100)
                })(buttons)
            }
        }
        btnGroup.$init()
    }
    function createButton (element, options) {
        var buttonText, 
            buttonClasses = baseClasses.concat(),
            iconText = false,
            icons = options.icon || "",
            corner = options.corner

        options.label = options.label || ""
        if (corner) {
            buttonClasses.push("oni-corner-all")    
            if (corner = parseInt(corner)) {
                element.style.borderRadius = corner + "px"
            }        
        }
        if (options.size) {
            buttonClasses.push("oni-button-" + options.size)
        }
        if (options.color) {
            buttonClasses.push("oni-button-" + options.color)
        }
        if (options.disabled) {
            buttonClasses.push("oni-state-disabled")
        }
        avalon(element).addClass(buttonClasses.join(" "))
        if (options.elementType === "input" && options.label) {
            avalon(element).val(options.label)
            
            return
        }
        switch (options.type) {
            case "text":
                buttonText = "<span class='oni-button-text'>" + options.label + "</span>"
                break;
            case "labeledIcon": 
                iconText = true
            case "icon":
                switch (options.iconPosition) {
                    case "left": 
                        buttonText = "<i class='oni-icon oni-icon-left'>" + icons.replace(/\\/g, "") + "</i>" + "<span class='oni-button-text oni-button-text-right" + (!iconText ? " oni-button-text-hidden" : "") + "'>" + options.label + "</span>"
                    break;
                    case "right":
                        buttonText = "<span class='oni-button-text oni-button-text-left" + (!iconText ? " oni-button-text-hidden" : "") + "'>" + options.label + "</span>" + "<i class='oni-icon oni-icon-right'>" + icons.replace(/\\/g, "") + "</i>"
                    break;
                    case "left-right":
                        var iconArr = icons && icons.split("-") || ["", ""],
                            iconLeft = iconArr[0],
                            iconRight = iconArr[1]
                        buttonText = "<i class='oni-icon oni-icon-left'>" + iconLeft.replace(/\\/g, "") + "&nbsp;</i>" + "<span class='oni-button-text oni-button-text-middle" + (!iconText ? " oni-button-text-hidden" : "") + "'>" + options.label + "</span>" + "<i class='oni-icon oni-icon-right'>&nbsp;" + iconRight.replace(/\\/g, "") + "</i>"
                    break;
                }
            break;
        }
        element.innerHTML = buttonText
    }
    widget.version = 1.0
    widget.defaults = {
        groups: false, //@config 是否是button组
        direction: "", //@config button组的方向，有水平button组和垂直button组，默认是水平，可以设置为"vertical"
        /**
         * @config <p>data属性配置button组的内容，每一个数组元素都是一个包含单个按钮基本信息的对象。</p>
         * <p>注意，请只在button组由至少两个按钮组成时，才配置button组件为button组，也就是设置groups为true时，且配置相应的data</p>
         * <p>当然还有一种直接列出button组内容的方式，不过这种情况需要指定组件名为buttonset，请看<a href="./avalon.button.ex4.html">demo 4</a>a></p>
         * <pre>
            data: [{
                type: "labeledIcon",
                iconPosition: "right",
                icon: "\&\#xf04c;",
                size: "large",
                color: "success",
                text: "暂停"
            }, {
                type: "labeledIcon",
                iconPosition: "right",
                icon: "\&\#xf04b;",
                size: "large",
                color: "success",
                text: "播放"
            }, {
                type: "labeledIcon",
                iconPosition: "right",
                icon: "\&\#xf074;",
                size: "large",
                color: "success",
                text: "拖曳"
            }]                                
         </pre>
         */
        data: [], 
        type: "text", //@config 配置button的展示形式，仅文字展示，还是仅图标展示，或者文字加图标的展示方式，三种方式分别对应："text"、"icon"、"labeledIcon"
        iconPosition: "left", //@config 当type为icon或者labeledIcon时，定义icon在哪边，默认在text的左边，也可以配置为右边("right"),或者两边都有("left-right")
        icon: "", //@config  当type为icon或者labeledIcon时，定义展示icon的内容，本组件的icon是使用web font实现，当iconPosition为"left"或者"right"时，将icon的码赋给icon，当iconPosition为"left-right",将left icon与right icon的码以"-"分隔，比如data-button-icon="\&\#xf001;-\&\#xf06b;"
        size: "", //@config button有四个尺寸"small", "default", "big", "large"
        color: "", //@config 定义button的颜色，默认提供了"primary", "warning", "danger", "success", "info", "inverse", "default" 7中颜色，与bootstrap保持一致
        corner: true, //@config 设置是否显示圆角，可以布尔值或者Number类型，布尔只是简单的说明显示或者不显示，Number则在表示显示与否的同时，也是在指定圆角的大小，圆角默认是2px。
        style: "", // 用于定义button的展现形式，比如"flat" "glow" "rounded" "3D" "pill" 本组件，仅提供flat的实现
        disabled: false, //@config 配置button的禁用状态
        label: "", //@config 设置button的显示文字，label的优先级高于元素的innerHTML
        width: "" //@config 设置button的宽度，注意button的盒模型设为了border-box
    }
    return avalon
})
/**
 @links
 [设置button的大小、宽度，展示不同类型的button](avalon.button.ex1.html)
 [设置button的width和color](avalon.button.ex2.html)
 [通过ms-widget="button, $, buttonConfig"的方式设置button组](avalon.button.ex3.html)
 [通过ms-widget="buttonset"的方式设置button](avalon.button.ex4.html)
 */
