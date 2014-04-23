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

        var elePar = element.parentNode,
            $element = avalon(element),
            options = data.textboxOptions;

        var vmodel = avalon.define(data.textboxId, function(vm) {

            avalon.mix(vm, options);
            vm.widgetElement = element;
            vm.elementDisabled = element.disabled;
            vm.show = "none";
            vm.placehold = options.placeholder;
            vm.hidePlaceholder = function() {
                vm.show = "none";
                element.focus();
            }
            vm.blur = function() {

                vm.elementDisabled = element.disabled;
                vm.show = element.value != "" ? "none" : "block";
            }
            vm.$remove = function() {
                var elementInput = element.cloneNode(true);
                var parentNode = sourceList.parentNode ;
                parentNode.replaceChild(elemengInput, sourceList);
            }           
            
            vm.$init = function() {

                var inputWraper = "",
                    placeholder = "",
                    msData = "",
                    vmSub = "";

                sourceList = avalon.parseHTML(sourceHTML).firstChild ;
                innerWrapper = sourceList.getElementsByTagName("div")[0];
                placeholder = sourceList.getElementsByTagName("span")[0];
                element.setAttribute("ms-blur", "blur");
                msData = element.msData["ms-duplex"];

                if (options.suggest) {
                    vm.$suggestopts = {
                        inputElement : element , 
                        strategy : options.suggest , 
                        textboxContainer : sourceList ,
                        focus : options.suggestFocus ,

                    }
                }

                if (msData) {
                    vmSub = avalon.getModel(msData, vmodels);
                    if(vmSub) {
                        vmSub[1].$watch(vmSub[0], function() {
                            vm.elementDisabled = element.disabled;
                            vm.show = element.value != "" ? "none" : "block";
                        })
                    }
                }

                msData = element.msData["ms-disabled"] || element.msData["ms-enabled"];

                if (msData) {
                    vmSub = avalon.getModel(msData, vmodels);

                    if (vmSub) {
                        vmSub[1].$watch(vmSub[0], function() {
                            vm.elementDisabled = element.disabled;
                            vm.show = element.value != "" ? "none" : "block";
                        })
                    }
                }


                avalon.ready(function() {

                    var models = [vmodel].concat(vmodels);
                    $element.addClass("ui-textbox-input");
                    innerWrapper.appendChild(element);
                    elePar.appendChild(sourceList);

                    if (options.suggest) {
                        var suggest = avalon.parseHTML(suggestHTML).firstChild;
                        sourceList.appendChild(suggest);

                        avalon.scan( suggest , models );
                    }
                    avalon.scan(sourceList, models);
                    avalon.scan(element, models);
                    vm.show = element.value != "" ? "none" : "block";
                })
            }
        })

        return vmodel
    } 
    widget.defaults = {
        
    }
    return avalon ;
})