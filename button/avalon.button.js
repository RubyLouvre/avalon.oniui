define(["avalon", "css!../chameleon/oniui-common.css", "css!./avalon.button.css"], function(avalon, sourceHTML) {
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
                var elementType = "",
                    hasTitle = false,
                    label = ""
                if (typeof options.disabled !== "boolean") {
                    options.disabled = !!element.disabled
                } else {
                    element.disabled = options.disabled
                }
                if (element.tagName.toLowerCase() === "input") {
                    elementType = "input"
                }

                hasTitle = !!element.getAttribute("title")

                $element.bind("mouseenter", function(event) {
                    stop(event)
                    $element.addClass("ui-state-hover")
                })
                $element.bind("mouseleave", function(event) {
                    stop(event)
                    $element.removeClass("ui-state-hover")
                })
                $element.bind("mousedown", function(event) {
                    stop(event)
                    $element.addClass("ui-state-active")
                })
                $element.bind("mouseup", function(event) {
                    stop(event)
                    $element.removeClass("ui-state-active")
                })
                $element.bind("blur", function() {
                    $element.removeClass("ui-state-active");
                })

                if (!options.label) {
                    label = elementType === "input" ? element.value : element.innerHTML
                }

                $element.bind("focus", function() {
                    $element.addClass("ui-state-focus");
                })

                $element.bind("blur", function() {
                    $element.removeClass("ui-state-focus");
                })
                $element.bind("mouseleave", function() {
                    if (options.disabled) {
                        return
                    }
                    avalon(this).removeClass(options.activeClass)
                })
                $element.bind("click", function(event) {
                    stop(event)
                    if (typeof options.click === "function") {
                        options.click.call(vmodels.widgetElement, event, vmodel)
                    }
                })
                options.hasTitle = hasTitle
                options.elementType = elementType
                options.label = label
                createButton(element, options)

            },
            $remove: function() {

            }
        }
        
        return btnModel
    }
    avalon.ui.buttonset = function(element, data, vmodels) {
        var buttonsetCorner = data.buttonsetOptions.corner,
            direction = data.buttonsetOptions.direction,
            $element = avalon(element)

        buttonsetCorner = buttonsetCorner !== void 0 ? buttonsetCorner : true
        return {
            $init: function() {
                var elementClass = []
                elementClass.push("ui-buttonset"),
                firstButtonClass = "ui-corner-left",
                lastButtonClass = "ui-corner-right",
                children = element.childNodes, 
                buttons = []
                

                for (var i = 0, el; el = children[i++]; ) {
                    if (el.nodeType === 1 && (/^(button|input|a)$/i.test(el.tagName) || el.getAttribute("data-button"))) {
                        el.setAttribute("data-button-corner", "false")
                        buttons.push(el)
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
            },
            $remove: function(el) {
                avalon(element).removeClass("ui-buttonset")
                while (el = data.buttons.pop()) {
                    el.removeAttribute("data-button-corner-class")
                }
                delete data.buttons
            }
        }
    }
    function createButton (element, options) {
        var buttonText, 
            buttonClasses = baseClasses.concat(),
            iconText = false,
            icons = options.icon || ""

        options.label = options.label || ""
        if (options.corner) {
            buttonClasses.push("ui-corner-all")            
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
            avalon(element).addClass("ui-button-input")
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
        type: "text", //"text" "icon" "labeledIcon"
        iconPosition: "left", //"left" "right", "left-right"
        size: "", //"待确定"
        color: "",
        corner: true,
        style: "",
        disabled: false,
        label: ""
    }
    return avalon
});
