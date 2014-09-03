define(["./avalon.suggest", "text!./avalon.textbox.html","css!../chameleon/oniui-common.css", "css!./avalon.textbox.css"], function(avalon, sourceHTML) {
    var htmlStructArray = sourceHTML.split("MS_OPTION_SUGGEST"),
        suggestHTML = htmlStructArray[1];
    var widget = avalon.ui.textbox = function(element, data, vmodels) {
        var elemParent = element.parentNode,
            $element = avalon(element),
            options = data.textboxOptions,
            vmSub = "",
            sourceList = "",
            inputWraper = "",
            placeholder = "";
        // 解析html并获取需要的Dom对象引用
        sourceHTML = sourceHTML.replace(/MS_OPTION_DISABLEDCLASS/gm, options.disabledClass);
        sourceList = avalon.parseHTML(sourceHTML).firstChild ;
        inputWraper = sourceList.getElementsByTagName("div")[0];
        placeholder = sourceList.getElementsByTagName("span")[0];

        if (options.suggest) {
            var $suggestopts = {
                    inputElement : element , 
                    strategy : options.suggest , 
                    textboxContainer : sourceList ,
                    focus : options.suggestFocus ,
                    onChange : options.suggestOnChange,
                    type: "textbox",
                },
                renderItem = options.renderItem;

            if (renderItem && avalon.type(renderItem) === "function") {
                $suggestopts.renderItem = renderItem;
            }
            options.$suggestopts = $suggestopts;
        }
        var vmodel = avalon.define(data.textboxId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "disabledClass", "autoTrim"];
            vm.widgetElement = element;
            vm.elementDisabled = "";
            vm.toggle = false;
            vm.placehold = options.placeholder;
            vm.focusClass = false
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
                vmodel.toggle = element.value != "" ? false : true;
            }
            vm.$remove = function() {
                var sourceListParent = sourceList.parentNode;
                sourceListParent.removeChild(sourceList);
                sourceList.innerHTML = sourceList.textContent = "";
            }           
            vm.$init = function() {
                avalon.bind(element, "blur", vm.blur);
                /**
                 * 如果存在suggest配置，说明需要自动补全功能，
                 * 此处将suggest需要的配置信息保存方便后续传给suggest widget，
                 * suggest的配置信息通过html结构的
                 * ms-widget="suggest,suggestId,$suggestopts"中的
                 * $suggestopts自动获取
                 **/
                
                var models = [vmodel].concat(vmodels);
                $element.addClass("ui-textbox-input");
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
                    vmodel.toggle = false
                })
                avalon.scan(sourceList, models);
                avalon.scan(element, models);
                if(typeof options.onInit === "function" ){
                    //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
                // 如果输入域有值，则隐藏占位符，否则显示，默认显示
                vm.elementDisabled = element.disabled;
                vm.toggle = element.value != "" ? false : true;
            }
        })

        var msData = element.msData["ms-duplex"];
        if (msData) {
            vmSub = avalon.getModel(msData, vmodels);
            if(vmSub) {
                // 根据对元素双向绑定的数据的监听来判断是显示还是隐藏占位符，并且判定元素的禁用与否
                vmSub[1].$watch(vmSub[0], function() {
                    vmodel.elementDisabled = element.disabled;
                    vmodel.toggle = element.value != "" ? false : true;
                })
            }
        }
        msData = element.msData["ms-disabled"] || element.msData["ms-enabled"];
        if (msData) {
            vmSub = avalon.getModel(msData, vmodels);
            if (vmSub) {
                vmSub[1].$watch(vmSub[0], function() {
                    vmodel.elementDisabled = element.disabled;
                    vmodel.toggle = element.value != "" ? false : true;
                })
            }
        }

        return vmodel
    } 
    widget.defaults = {
        suggest : false,
        autoTrim: true,
        placeholder: "",
        widgetElement: "",
        tabIndex: -1,
        width: -1,
        disabledClass: "ui-textbox-disabled"
    }
    return avalon ;
})