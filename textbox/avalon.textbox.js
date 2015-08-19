// avalon 1.3.6
/**
 * 
 * @cnName 具有提示功能的输入框
 * @enName textbox
 * @introduce
 * <p>通过给简单的表单输入域设置不同的配置项可以使表单拥有舒服的视觉效果，也可以使其具有提示补全功能</p>
 */
define(["./avalon.suggest", "text!./avalon.textbox.html","css!../chameleon/oniui-common.css", "css!./avalon.textbox.css"], function(avalon, sourceHTML) {
    var htmlStructArray = sourceHTML.split("MS_OPTION_SUGGEST"),
        suggestHTML = htmlStructArray[1],
        placeholderOrigin = "placeholder" in document.createElement("input")
    var widget = avalon.ui.textbox = function(element, data, vmodels) {
        var elemParent = element.parentNode,
            $element = avalon(element),
            options = data.textboxOptions,
            vmSub = "",
            sourceList = "",
            inputWraper = "",
            placeholder = "",
            placehold = options.placeholder,
            _sourceHTML = sourceHTML
        
        // 解析html并获取需要的Dom对象引用
        _sourceHTML = _sourceHTML.replace(/MS_OPTION_DISABLEDCLASS/gm, options.disabledClass);
        _sourceHTML = options.getTemplate(_sourceHTML);
        sourceList = avalon.parseHTML(_sourceHTML).firstChild ;

        inputWraper = sourceList.getElementsByTagName("div")[0];
        placeholder = sourceList.getElementsByTagName("span")[0];

        if (options.suggest) {
            var suggestConfig = {
                    inputElement : element , 
                    strategy : options.suggest , 
                    textboxContainer : sourceList ,
                    focus : options.suggestFocus || false ,
                    onChange : options.suggestOnChange || "",
                    type: "textbox",
                    limit: options.limit || 8,
                    disableLetter:options.suggestDisableLetter || false
                }
            $suggestopts = avalon.mix(suggestConfig, options.suggestion)
            options.$suggestopts = $suggestopts;
        }
        placehold = avalon(element).attr("placeholder") || placehold || "";

        var vmodel = avalon.define(data.textboxId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "disabledClass", "autoTrim", "suggest"];
            vm.widgetElement = element;
            vm.elementDisabled = "";
            vm.toggle = true;
            vm.placehold = placehold
            vm.focusClass = false
            vm.placeholderOrigin = placeholderOrigin
            vm.placeWidth = 0
            // input获得焦点时且输入域值为空时隐藏占位符
            vm.hidePlaceholder = function() {
                vm.toggle = false;
                element.focus();
            }
            
            vm.blur = function() {
                // 切换input外层包装的div元素class(ui-textbox-disabled)的显示或隐藏
                vmodel.focusClass = false
                vmodel.elementDisabled = element.disabled;
                // 切换占位符的显示、隐藏
                if (options.autoTrim) {
                    element.value = element.value.trim()
                }
                if (!vmodel.placeholderOrigin) {
                    if (element.value !="" || !vmodel.placehold.length) {
                        vmodel.toggle = false
                    } else {
                        vmodel.toggle = true
                    }
                }
            }
            vm.$remove = function() {
                var sourceListParent = sourceList.parentNode;
                sourceListParent.removeChild(sourceList);
                sourceList.innerHTML = sourceList.textContent = "";
            }           
            vm.$init = function(continueScan) {
                avalon.bind(element, "blur", vm.blur);
                if (options.autoFocus) {
                    avalon.bind(element, "mouseover", function() {
                        element.focus()
                    })
                }
                /**
                 * 如果存在suggest配置，说明需要自动补全功能，
                 * 此处将suggest需要的配置信息保存方便后续传给suggest widget，
                 * suggest的配置信息通过html结构的
                 * ms-widget="suggest,suggestId,$suggestopts"中的
                 * $suggestopts自动获取
                 **/
                
                $element.addClass("oni-textbox-input");
                // 包装原始输入域
                var tempDiv = document.createElement("div");
                elemParent.insertBefore(tempDiv, element);
                element.msRetain = true;
                inputWraper.appendChild(element);
                if(~options.width) {
                    $element.width(options.width);
                }
                if(~options.height) {
                    $element.height(options.height);
                }
                if(~options.tabIndex) {
                    element.tabIndex = options.tabIndex;
                }
                elemParent.replaceChild(sourceList, tempDiv);
                element.msRetain = false;
                // 如果存在自动补全配置项的话，添加自动补全widget
                if (options.suggest) {
                    var suggest = avalon.parseHTML(suggestHTML).firstChild;
                    sourceList.appendChild(suggest);
                }
                avalon.bind(element, "focus", function() {
                    vmodel.focusClass = true
                    if (!vmodel.placeholderOrigin) {
                        vmodel.toggle = false
                    }
                })
                avalon.scan(sourceList, [vmodel].concat(vmodels));
                if (!vmodel.placeholderOrigin) {
                    if (!vmodel.placehold.length || element.value != "") {
                        vmodel.toggle = false
                    }
                    vmodel.placeWidth = avalon(inputWraper).innerWidth()

                } else if (vmodel.placehold.length) {
                    $element.attr("placeholder", vmodel.placehold)
                }
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.log("avalon请尽快升到1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels))
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
                // 如果输入域有值，则隐藏占位符，否则显示，默认显示
                vm.elementDisabled = element.disabled;

                // 设置最小高度
                if(vmodel.adaptiveHeight.minHeight){
                    avalon.css(element, "height", vmodel.adaptiveHeight.minHeight)
                }
            }
        })  
        var  msDuplexValue, msData
        for (var i in element.msData) {
            if (i.indexOf("ms-duplex") === 0) {
                msDuplexValue = element.msData[i]
                break
            }
        }
        if (msDuplexValue) {
            vmSub = avalon.getModel(msDuplexValue, vmodels);
            if(vmSub) {

                // 获取文本框高度
                if(vmodel.adaptiveHeight){
                    var elementInitialHeight

                    setTimeout(function(){
                        elementInitialHeight = avalon.css(element, "height")
                    },0)
                }

                // 根据对元素双向绑定的数据的监听来判断是显示还是隐藏占位符，并且判定元素的禁用与否
                vmSub[1].$watch(vmSub[0], function() {
                    vmodel.elementDisabled = element.disabled;
                    if (!vmodel.placeholderOrigin) {
                        if (element.value !="" || !vmodel.placehold.length) {
                            vmodel.toggle = false
                        } else {
                            vmodel.toggle = true
                        }
                    }

                    if(vmodel.adaptiveHeight) {
                        FitToContent(elementInitialHeight)
                    }
                })
            }
        }

        function FitToContent(elementInitialHeight)
        {
            if(vmodel.adaptiveHeight.maxHeight && vmodel.adaptiveHeight.maxHeight !== ""){
                var maxHeight = parseInt(vmodel.adaptiveHeight.maxHeight, 10)
            }
            if(vmodel.adaptiveHeight.minHeight && vmodel.adaptiveHeight.minHeight !== ""){
                var minHeight = parseInt(vmodel.adaptiveHeight.minHeight, 10)
            }

            if (element.clientHeight == element.scrollHeight) {
                element.style.height = (minHeight || elementInitialHeight) + "px";
            }

            var adjustedHeight = element.clientHeight,
                shouldHigher =  !maxHeight || maxHeight > adjustedHeight

            if (shouldHigher)
            {
                adjustedHeight = Math.max(element.scrollHeight, adjustedHeight);
                if ( maxHeight )
                    adjustedHeight = Math.min(maxHeight, adjustedHeight);
                if ( adjustedHeight > element.clientHeight )
                    element.style.height = adjustedHeight + "px";
            }
        }

        msData = element.msData["ms-disabled"] || element.msData["ms-attr-disabled"] || element.msData["ms-enabled"] || element.msData["ms-attr-enabled"];
        if (msData) {
            vmSub = avalon.getModel(msData, vmodels);
            if (vmSub) {
                vmSub[1].$watch(vmSub[0], function() {
                    vmodel.elementDisabled = element.disabled;
                    if (!vmodel.placeholderOrigin) {
                        if (element.value !="" || !vmodel.placehold.length) {
                            vmodel.toggle = false
                        } else {
                            vmodel.toggle = true
                        }
                    }
                })
            }
        }

        return vmodel
    } 
    widget.defaults = {
        /**
         * @config 配置输入框有自动提示补全功能，提示类型由用户自定义，默认配置为false，也就是不开启自动补全功能
         */
        suggest : false, 
        suggestion: {}, 
        autoTrim: true, //@config 是否自动过滤用户输入的内容头部和尾部的空格
        widgetElement: "", //@interface 绑定组件元素的dom对象的引用
        tabIndex: -1, //@config 配置textbox在进行tab切换时的tabIndex，切换顺序从值小的开始，必须配置为大于0的值
        width: -1, //@config 配置textbox的显示宽
        autoFocus: false, //@config 如果想要鼠标悬停在textbox上时就focus textbox，设置此属性为true即可
        disabledClass: "oni-textbox-disabled", //@config 配置输入域disabled时组件包装元素设置的类，多个类以空格分隔
        /**
         * @config 模板函数,方便用户自定义模板
         * @param str {String} 默认模板
         * @param opts {Object} vmodel
         * @returns {String} 新模板
         */
        getTemplate: function(tmp) {
            return tmp.replace(/MS_OPTION_ICON/, '')
        },
        stateClass: "", //@config 为textbox添加样式，默认可以添加oni-textbox-error
        suggestOnChange: "", //@config 配置提示补全时切换提示项之后的callback
        suggestFocus: false, //@config 特殊的suggest，当focus时即显示特定的提示列表
        adaptiveHeight: "" //@config 使textbox自适应高度，并可以配置自适应时的minHeight/maxHeight
    }
    return avalon ;
})
/**
 @links
 [基本textbox、配置了width、tabIndex的textbox以及配置了disabledClass的textbox](avalon.textbox.ex1.html)
 [拥有占位符的textbox](avalon.textbox.ex2.html)
 [切换禁用textbox](avalon.textbox.ex3.html)
 [有自动补全功能的textbox](avalon.textbox.ex4.html)
 [无视用户输入的自动补全](avalon.textbox.ex5.html)
 [添加回调操作的自动补全](avalon.textbox.ex6.html)
 */
