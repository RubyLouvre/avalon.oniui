define(["avalon.suggest", "text!avalon.textbox.html"], function(avalon, sourceHTML) {

    var ttt = sourceHTML.split("MS_OPTION_STYLE"),
        cssText = ttt[1].replace(/<\/?style>/g, ""),
        styleEl = document.getElementById("avalonStyle"),
        xxx = ttt[0].split("MS_OPTION_SUGGEST"),
        suggestHTML = xxx[1];

    try {
        styleEl.innerHTML += cssText ;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText ;
    }

    var widget = avalon.ui.textbox = function(element, data, vmodels) {
        var elemParent = element.parentNode,
            $element = avalon(element),
            options = data.textboxOptions;

        var vmodel = avalon.define(data.textboxId, function(vm) {
            var msData = element.msData["ms-duplex"];
            avalon.mix(vm, options);
            vm.widgetElement = element;
            vm.elementDisabled = "";
            vm.toggle = false;
            vm.placehold = options.placeholder;

            if (msData) {
                vmSub = avalon.getModel(msData, vmodels);
                if(vmSub) {
                    // 根据对元素双向绑定的数据的监听来判断是显示还是隐藏占位符，并且判定元素的禁用与否
                    vmSub[1].$watch(vmSub[0], function() {
                        vm.elementDisabled = element.disabled;
                        vm.toggle = element.value != "" ? false : true;
                    })
                }
            }

            msData = element.msData["ms-disabled"] || element.msData["ms-enabled"];

            if (msData) {
                vmSub = avalon.getModel(msData, vmodels);
                if (vmSub) {
                    vmSub[1].$watch(vmSub[0], function() {
                        vm.elementDisabled = element.disabled;
                        vm.toggle = element.value != "" ? false : true;
                    })
                }
            }

            // input获得焦点时且输入域值为空时隐藏占位符
            vm.hidePlaceholder = function() {
                vm.toggle = false;
                element.focus();
            }

            vm.blur = function() {
                vm.elementDisabled = element.disabled;
                vm.toggle = element.value != "" ? false : true;
            }

            vm.$remove = function() {
                var elementInput = element.cloneNode(true);
                var parentNode = sourceList.parentNode ;
                parentNode.replaceChild(elemengInput, sourceList);
            }           
            
            vm.$init = function() {

                var inputWraper = "",
                    placeholder = "",
                    vmSub = "",
                    sourceList = "";
                // 解析html并获取需要的Dom对象引用
                sourceList = avalon.parseHTML(sourceHTML).firstChild ;
                innerWrapper = sourceList.getElementsByTagName("div")[0];
                placeholder = sourceList.getElementsByTagName("span")[0];
                element.setAttribute("ms-blur", "blur");

                if (options.suggest) {
                    vm.$suggestopts = {
                        inputElement : element , 
                        strategy : options.suggest , 
                        textboxContainer : sourceList ,
                        focus : options.suggestFocus ,
                        changed : options.suggestChanged
                    }
                }

                avalon.ready(function() {
                    var models = [vmodel].concat(vmodels);
                    $element.addClass("ui-textbox-input");
                    // 包装原始输入框
                    var tempDiv = document.createElement("div");
                    elemParent.insertBefore(tempDiv, element);
                    innerWrapper.appendChild(element);
                    elemParent.replaceChild(sourceList, tempDiv);
                    // 如果存在自动补全配置项的话，添加自动补全widget
                    if (options.suggest) {
                        var suggest = avalon.parseHTML(suggestHTML).firstChild;
                        sourceList.appendChild(suggest);
                    }
                    avalon.scan(sourceList, models);
                    avalon.scan(element, models);
                    // 如果输入域有值，则隐藏占位符，否则显示，默认显示
                    vm.elementDisabled = element.disabled;
                    vm.toggle = element.value != "" ? false : true;
                })
            }
        })

        return vmodel
    } 
    widget.defaults = {
        
    }
    return avalon ;
})