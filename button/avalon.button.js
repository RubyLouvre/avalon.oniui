define(["avalon", "text!./avalon.button.html", "css!../chameleon/oniui-common.css", "css!./avalon.button.css"], function(avalon, sourceHTML) {
    var baseClasses = ["ui-button", "ui-widget", "ui-state-default"],
        typeClasses = "ui-button-icons-only ui-button-icon-only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only"
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
                    options.disabled = !!element.disabled
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
                    $element.addClass("ui-state-active")
                })
                $element.bind("mouseup", function(event) {
                    stop(event)
                    $element.removeClass("ui-state-active")
                })
                $element.bind("blur", function() {
                    $element.removeClass("ui-state-active")
                    $element.removeClass("ui-state-focus");
                })
                $element.bind("focus", function() {
                    $element.addClass("ui-state-focus");
                })
                if (!options.label) {
                    label = elementType === "input" ? element.value : element.innerHTML
                }
                options.elementType = elementType
                options.label = label
                createButton(element, options)
                avalon.scan(element, vmodels)
            },
            $remove: function() {
                element.innerHTML = element.contextContent = ""
            }
        }
        
        return btnModel
    }
    avalon.ui.buttonset = function(element, data, vmodels) {
        var options = data.buttonsetOptions,
            buttonsetCorner = options.corner,
            direction = options.direction,
            $element = avalon(element)

        buttonsetCorner = buttonsetCorner !== void 0 ? buttonsetCorner : true
        return {
            $init: function() {
                var elementClass = []
                elementClass.push("ui-buttonset"),
                firstButtonClass = "ui-corner-left",
                lastButtonClass = "ui-corner-right",
                children = element.childNodes, 
                buttons = [] // 收集button组元素
                buttonWidth = options.width,
                firstElement = true

                for (var i = 0, el; el = children[i++]; ) {
                    if (el.nodeType === 1) {
                        el.setAttribute("data-button-corner", "false")
                        buttons.push(el)
                        if (firstElement) {
                            avalon(el).addClass("ui-button-first")
                            firstElement = false
                        }
                    }
                }
                var n = buttons.length
                if (n && buttonsetCorner) {
                    if (direction === "vertical") {
                        firstButtonClass = "ui-corner-top"
                        lastButtonClass = "ui-corner-bottom"
                    }
                    avalon(buttons[0]).addClass(firstButtonClass)
                    avalon(buttons[n - 1]).addClass(lastButtonClass)
                }
                if (direction === "vertical") {
                    elementClass.push("ui-buttonset-vertical")
                }
                $element.addClass(elementClass.join(" "))
                data.buttons = buttons
                avalon.scan(element, vmodels)
                if (buttonWidth = parseInt(buttonWidth)) {
                    for (var i = 0; button = buttons[i++];) {
                        button.style.width = buttonWidth + "px"
                    }
                    return 
                }

                (function(buttons) {
                    var interval = 0,
                        maxButtonWidth = 0
                    buttons = buttons.concat()
                    interval = setInterval(function() {
                        var buttonWidth = 0,
                            buttonPadding = 0,
                            buttonBorder = 0,
                            $button
                        for (var i = 0, button; button = buttons[i++];) {
                            buttonWidth = Math.max(buttonWidth, avalon(button).outerWidth())
                        }
                        if (buttonWidth === maxButtonWidth) {
                            maxButtonWidth += 1
                            for (var i = 0, button; button = buttons[i++];) {
                                $button = avalon(button)
                                buttonPadding = Math.ceil(parseFloat($button.css("padding-left")))
                                buttonBorder = Math.ceil(parseFloat($button.css("border-left-width")))
                                button.style.width = (maxButtonWidth - buttonPadding * 2 - buttonBorder * 2) + "px"
                            }
                            clearInterval(interval)
                        }
                        maxButtonWidth = buttonWidth
                    }, 100)
                })(buttons)
            }
        }
    }
    function createButton (element, options) {
        var buttonText, 
            buttonClasses = baseClasses.concat(),
            iconText = false,
            icons = options.icon || "",
            corner = options.corner

        options.label = options.label || ""
        if (corner) {
            buttonClasses.push("ui-corner-all")    
            if (corner = parseInt(corner)) {
                element.style.borderRadius = corner + "px"
            }        
        }
        if (options.size) {
            buttonClasses.push("ui-button-" + options.size)
        }
        if (options.color) {
            buttonClasses.push("ui-button-" + options.color)
        }
        if (options.disabled) {
            buttonClasses.push("ui-state-disabled")
        }
        avalon(element).addClass(buttonClasses.join(" "))
        if (options.elementType === "input" && options.label) {
            avalon(element).val(options.label)
            
            return
        }
        switch (options.type) {
            case "text":
                buttonText = "<span class='ui-button-text'>" + options.label + "</span>"
                break;
            case "labeledIcon": 
                iconText = true
            case "icon":
                switch (options.iconPosition) {
                    case "left": 
                        buttonText = "<i class='ui-icon ui-icon-left'>" + icons.replace(/\\/g, "") + "</i>" + "<span class='ui-button-text ui-button-text-right" + (!iconText ? " ui-button-text-hidden" : "") + "'>" + options.label + "</span>"
                    break;
                    case "right":
                        buttonText = "<span class='ui-button-text ui-button-text-left" + (!iconText ? " ui-button-text-hidden" : "") + "'>" + options.label + "</span>" + "<i class='ui-icon ui-icon-right'>" + icons.replace(/\\/g, "") + "</i>"
                    break;
                    case "left-right":
                        var iconArr = icons && icons.split("-") || ["", ""],
                            iconLeft = iconArr[0],
                            iconRight = iconArr[1]
                        buttonText = "<i class='ui-icon ui-icon-left'>" + iconLeft.replace(/\\/g, "") + "&nbsp;</i>" + "<span class='ui-button-text ui-button-text-middle" + (!iconText ? " ui-button-text-hidden" : "") + "'>" + options.label + "</span>" + "<i class='ui-icon ui-icon-right'>&nbsp;" + iconRight.replace(/\\/g, "") + "</i>"
                    break;
                }
            break;
        }
        element.innerHTML = buttonText
    }
    widget.version = 1.0
    widget.defaults = {
        groups: false,
        direction: "",
        data: [],
        type: "text", //"text" "icon" "labeledIcon"
        iconPosition: "left", //"left" "right" "left-right"
        icon: "",
        size: "", //"small" "default" "big" "large"
        color: "",
        corner: true,
        style: "", // 用于定义button的展现形式，比如"flat" "glow" "rounded" "3D" "pill" 本组件，仅提供flat的实现
        disabled: false,
        label: "",
        width: ""
    }
    return avalon
});
