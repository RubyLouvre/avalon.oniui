//avalon 1.2.5 2014.4.2
define(["avalon", "../draggable/avalon.draggable", "css!./avalon.layout.css"],
    function(avalon, tpl) {
        var widgetName = 'layout';
        var widget = avalon.ui[widgetName] = function(element, data, vmodels) {
            var options = data[widgetName+'Options'],
                $element = avalon(element),
                docks = {
                    "north": {
                        attrBindings: {
                            "ms-css-width": "{{layoutWidth-regionBorderWidth*2}}",
                            "ms-css-height": "{{northHeight-(northResizable?(resizerSize+regionBorderWidth*2):regionBorderWidth)}}",
                            "ms-css-top": "layoutTop",
                            "ms-css-left": "layoutLeft"
                        },
                        resizerConfig: {
                            "data-draggable-axis": "y",
                            "ms-css-width": "layoutWidth",
                            "ms-css-height": "resizerSize",
                            "ms-css-top": "{{layoutTop+northHeight-(northResizable?resizerSize:0)}}",
                            "ms-css-left": "layoutLeft"
                        },
                        resizerManageProperty: {
                            name: "northHeight",
                            plusLocation: true,
                            eventDataDirection: "Y",
                            getContainment: function() {
                                var $offset = $element.offset();
                                return [0, $offset.top, 0, $offset.top + vmodel.layoutHeight - vmodel.southHeight - vmodel.resizerSize];
                            }
                        }
                    },
                    "east": {
                        attrBindings: {
                            "ms-css-width": "eastWidth-(eastResizable?(resizerSize+regionBorderWidth*2):regionBorderWidth)",
                            "ms-css-height": "{{layoutHeight-northHeight-southHeight-(northResizable?regionBorderWidth:0)-(southResizable?regionBorderWidth:0)}}",
                            "ms-css-top": "{{layoutTop+northHeight}}",
                            "ms-css-left": "{{layoutLeft+layoutWidth-eastWidth+(eastResizable?resizerSize:0)}}"
                        },
                        resizerConfig: {
                            "data-draggable-axis": "x",
                            "ms-css-width": "resizerSize",
                            "ms-css-top": "{{layoutTop+northHeight}}",
                            "ms-css-left": "{{layoutLeft+layoutWidth-eastWidth}}",
                            "ms-css-height": "{{layoutHeight-northHeight-southHeight}}"
                        },
                        resizerManageProperty: {
                            name: "eastWidth",
                            plusLocation: false,
                            eventDataDirection: "X",
                            getContainment: function() {
                                var $offset = $element.offset();
                                return [$offset.left + vmodel.westWidth + 1, 0, $offset.left + vmodel.layoutWidth - vmodel.resizerSize, 0];
                            }
                        }
                    },
                    "south": {
                        attrBindings: {
                            "ms-css-width": "{{layoutWidth-regionBorderWidth*2}}",
                            "ms-css-height": "southHeight-(southResizable?resizerSize:0)",
                            "ms-css-top": "{{layoutTop+layoutHeight-southHeight+(southResizable?resizerSize:0)}}",
                            "ms-css-left": "layoutLeft"
                        },
                        resizerConfig: {
                            "data-draggable-axis": "y",
                            "ms-css-width": "layoutWidth",
                            "ms-css-height": "resizerSize",
                            "ms-css-top": "{{layoutTop+layoutHeight-southHeight}}",
                            "ms-css-left": "layoutLeft"
                        },
                        resizerManageProperty: {
                            name: "southHeight",
                            plusLocation: false,
                            eventDataDirection: "Y",
                            getContainment: function() {
                                var $offset = $element.offset();
                                return [0, $offset.top + vmodel.northHeight + 1, 0, $offset.top + vmodel.layoutHeight - vmodel.resizerSize];
                            }
                        }
                    },
                    "west": {
                        attrBindings: {
                            "ms-css-width": "westWidth-(westResizable?(resizerSize+regionBorderWidth*2):regionBorderWidth)",
                            "ms-css-height": "{{layoutHeight-northHeight-southHeight-(northResizable?regionBorderWidth:0)-(southResizable?regionBorderWidth:0)}}",
                            "ms-css-top": "{{layoutTop+northHeight}}",
                            "ms-css-left": "{{layoutLeft}}"
                        },
                        resizerConfig: {
                            "data-draggable-axis": "x",
                            "ms-css-width": "resizerSize",
                            "ms-css-height": "{{layoutHeight-northHeight-southHeight}}",
                            "ms-css-top": "{{layoutTop+northHeight}}",
                            "ms-css-left": "{{layoutLeft+westWidth-resizerSize}}"
                        },
                        resizerManageProperty: {
                            name: "westWidth",
                            plusLocation: true,
                            eventDataDirection: "X",
                            getContainment: function() {
                                var $offset = $element.offset();
                                return [$offset.left + 1, 0, $offset.left + vmodel.layoutWidth - vmodel.eastWidth - 1 - vmodel.resizerSize, 0];
                            }
                        }
                    },
                    "centre": {
                        attrBindings: {
                            "ms-css-width": "{{layoutWidth-eastWidth-westWidth-(westResizable?regionBorderWidth:0)-(eastResizable?regionBorderWidth:0)}}",
                            "ms-css-height": "{{layoutHeight-northHeight-southHeight-(northResizable?regionBorderWidth:0)-(southResizable?regionBorderWidth:0)}}",
                            "ms-css-top": "{{layoutTop+northHeight}}",
                            "ms-css-left": "{{layoutLeft+westWidth}}"
                        }
                    }
                };

            var domCreator = document.createElement("div");
            var vmodel = avalon.define(data[widgetName+'Id'], function(vm) {
                avalon.mix(vm, options);
                vm.$dockedAreas = {  };    // 存放5个区域的$(element)的字典
                vm.$resizers = { };   // 存放4个resizer的字典
                vm.$nestedLayouts = [];
                vm.$init = function() {
                    if (vmodel.layoutFullSize) {
                        // var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
                        vmodel.layoutWidth = avalon(element.parentNode).width();
                        vmodel.layoutHeight = avalon(element.parentNode).height();
                        // if (MutationObserver) {
                        //     var parentSizeObserver = new MutationObserver(function(mutations) {
                        //         mutations.forEach(function(e) {
                        //             avalon.log("aaa");
                        //         });
                        //     });
                        //     parentSizeObserver.observe(element.parentNode, {
                        //         subtree: false,
                        //         childList: false,
                        //         attributes: true,
                        //         attributeOldValue: false
                        //     });
                        // }
                    }
                    $element.addClass("oni-layout");
                    $element.attr("ms-css-width", "layoutWidth");
                    $element.attr("ms-css-height", "layoutHeight");
                    var draggableVM = avalon.define(vmodel.$id + "Docker", function(dragVM) {
                        dragVM.draggable = {
                            startFn: function(e, data) {
                                for(var side in vmodel.$resizers) {
                                    if (vmodel.$resizers.hasOwnProperty(side) && vmodel.$resizers[side].element == data.element) {
                                        data.containment = docks[side].resizerManageProperty.getContainment(vmodel);
                                        break;
                                    }
                                }
                            },
                            stopFn: function(e, data) {
                                for(var side in vmodel.$resizers) {
                                    if (vmodel.$resizers.hasOwnProperty(side) && vmodel.$resizers[side].element == data.element) {
                                        var vmPropertyName = docks[side].resizerManageProperty.name,
                                            plusLocation = docks[side].resizerManageProperty.plusLocation,
                                            eventDataDirection = docks[side].resizerManageProperty.eventDataDirection;
                                        vmodel[vmPropertyName] += (data["page"+eventDataDirection] - data["startPage"+eventDataDirection]) * (plusLocation ? 1 : -1);
                                        break;
                                    }
                                }
                                vmodel.$updateNestedLayouts();
                            }
                        }
                        dragVM.$skipArray = ["draggable"];
                    });
                    
                    for (var i = 0; i < element.children.length; i++) {
                        var node = element.children[i],
                            $node = avalon(node),
                            dockTo = $node.attr("ms-layout-dock"),
                            resizable = false;

                        if (docks.hasOwnProperty(dockTo)) {
                            node.removeAttribute("ms-layout-dock");
                            if (dockTo!="centre") {
                                vmodel[docks[dockTo].resizerManageProperty.name] = parseFloat($node.attr("ms-layout-size"));
                                if (node.hasAttribute ? node.hasAttribute("ms-layout-resizable") : (node.getAttribute("ms-layout-resizable")!=null)) {
                                    node.removeAttribute("ms-layout-resizable");
                                    vmodel[dockTo+"Resizable"] = true;
                                    resizable = true;
                                }
                            }
                            $element.addClass(dockTo + "-region-" + (resizable? "resizable" : "unresizable"));
                            vmodel.$bindRegionNode(dockTo, node, resizable);
                        }
                    }

                    vmodels = [draggableVM, vmodel].concat(vmodels);

                    if (vmodel.parentLayoutId!="" && !!avalon.vmodels[vmodel.parentLayoutId]) {
                        avalon.vmodels[vmodel.parentLayoutId].$registNestedLayout(vmodel);
                    }

                    avalon.scan(element, vmodels);
                    if(typeof vmodel.onInit === "function"){
                        vmodel.onInit.call(element, vmodel, options, vmodels)
                    }
                };
                vm.$remove = function() {
                    if (vmodel.parentLayoutId!="" && !!avalon.vmodels[vmodel.parentLayoutId]) {
                        avalon.vmodels[vmodel.parentLayoutId].$unregistNestedLayout(vmodel);
                    }
                    vmodel.$nestedLayouts = null;
                    element.innerHTML = element.textContent = "";
                    vmodel.$dockedAreas = null;
                    vmodel.$resizers = null;
                    $element = null;
                    domCreator = null;
                };
                vm.removeRegion = function(region) {
                    if (region != "centre" && docks.hasOwnProperty(region) && !!vm.$dockedAreas[region]) {
                        element.removeChild(vm.$dockedAreas[region].element);
                        if (vmodel[region+"Resizable"]) {
                            element.removeChild(vm.$resizers[region].element);
                            delete vmodel.$resizers[region];
                        }
                        delete vmodel.$dockedAreas[region];
                        vmodel[docks[region].resizerManageProperty.name] = 0;
                    }
                    vmodel.$updateNestedLayouts();
                };
                vm.addRegion = function(region, regionConfig) {
                    if (region != "centre" && docks.hasOwnProperty(region) && !vm.$dockedAreas[region]) {
                        // 更新VM中的尺寸和Resizable属性
                        vmodel[docks[region].resizerManageProperty.name] = regionConfig.size;
                        vmodel[region + "Resizable"] = regionConfig.size;

                        // 创建Region的DOM元素并插入文档
                        domCreator.innerHTML = 
                            "<div ms-layout-dock='#ms-layout-dock#' #ms-layout-resizable# ms-layout-size='#ms-layout-size#'></div>"
                                .replace("#ms-layout-dock#", region)
                                .replace("#ms-layout-resizable#", regionConfig.resizable ? "ms-layout-resizable" : "")
                                .replace("#ms-layout-size#", regionConfig.size);
                        var node = domCreator.childNodes[0];
                        avalon(node).addClass(regionConfig.regionClass);
                        domCreator.innerHTML = ""
                        element.appendChild(node);
                        vmodel.$bindRegionNode(region, node, regionConfig.resizable);
                        avalon(node).bind("propertychange", function() {
                            debugger
                        })
                    }
                    avalon.scan(element, vmodels);
                    vmodel.$updateNestedLayouts();
                };
                vm.updateLayout = function (layoutData) {
                    if (vmodel.layoutFullSize) {
                        vmodel.layoutWidth = avalon(element.parentNode).width();
                        vmodel.layoutHeight = avalon(element.parentNode).height();
                    } else {
                        if (layoutData.hasOwnProperty('layoutWidth')) {
                            vmodel.layoutWidth = layoutData.layoutWidth;
                        }
                        if (layoutData.hasOwnProperty('layoutHeight')) {
                            vmodel.layoutHeight = layoutData.layoutHeight;
                        }
                    }
                    vmodel.$updateNestedLayouts();
                };
                vm.$updateNestedLayouts = function () {
                    vmodel.$nestedLayouts.forEach(function(nestedVM) {
                        nestedVM.updateLayout();
                    });
                };

                // 绑定区域DOM元素的宽高等css属性；如果该区域的尺寸可变，创建一个Draggable Div来接收Drag事件
                vm.$bindRegionNode = function (region, domNode, resizable) {
                    var $node = avalon(domNode);
                    if (docks.hasOwnProperty(region)) {
                        $node.addClass(region+'-region region');
                        vmodel.$dockedAreas[region] = $node;
                        for (var n in docks[region].attrBindings) {
                            $node.attr(n, docks[region].attrBindings[n]);
                        }

                        // 检测是否有Nested的Layout，如果有，需要为Nested的Layout指定父级Layout的Id和Region

                        for (var i = 0; i < domNode.children.length; i++) {
                            var childNode = domNode.children[i],
                                childWidgetName = childNode.getAttribute("ms-widget");

                            childWidgetName = (typeof childWidgetName == "string") ? childWidgetName.split(",")[0] : "";
                            if (childWidgetName == "layout") {
                                avalon(childNode).attr("data-layout-parent-layout-id", vmodel.$id);
                                avalon(childNode).attr("data-layout-parent-layout-region", region);
                            }
                        }
                    }
                    // 创建Resizer并增加Top, Left, Width, Height的绑定
                    if (region != 'centre' && resizable) {
                        var draggableConfig = docks[region].resizerConfig,
                            resizer = null,
                            $resizer = null;

                        domCreator.innerHTML = "<div ms-draggable ms-controller=\"" + vmodel.$id + "Docker\" data-draggable-ghosting=\"true\" data-draggable-start=\"startFn\" data-draggable-stop=\"stopFn\"></div>";
                        resizer = domCreator.childNodes[0];
                        $resizer = avalon(resizer);
                        $resizer.addClass(region + "-resizer resizer");
                        for (var n in draggableConfig) {
                            if (draggableConfig.hasOwnProperty(n)) {
                                $resizer.attr(n, draggableConfig[n]);
                            }
                        }

                        vmodel.$resizers[region] = $resizer;
                        element.appendChild(resizer);
                    }
                };

                vm.$registNestedLayout = function(nestedVM) {
                    vm.$dockedAreas[nestedVM.parentLayoutRegion].addClass("nested-region");
                    avalon.Array.ensure(vm.$nestedLayouts, nestedVM);
                };
                vm.$unregistNestedLayout = function (nestedVM) {
                    vm.$dockedAreas[nestedVM.parentLayoutRegion].removeClass("nested-region");
                    avalon.Array.remove(vm.$nestedLayouts, nestedVM);
                };
                // vm.parentLayoutId = undefined;
                // vm.parentLayoutRegion = undefined; // 如果当前VM是某个Layout的SubLayout，这个变量表示当前VM在父级Layout中所在区域。
                vm.$isLayoutVM = true;
                vm.$skipArray = ["northResizable", "westResizable", "southResizable", "eastResizable", "removeRegion", "addRegion", "updateLayout", "parentLayoutId", "parentLayoutRegion"];
            });
            return vmodel;
        }
        widget.defaults = {
            eastWidth: 0,
            westWidth: 0,
            northHeight: 0,
            southHeight: 0,

            layoutFullSize: true,
            layoutWidth: 0,
            layoutHeight: 0,
            layoutTop: 0,
            layoutLeft: 0,
            parentLayoutRegion: "",
            parentLayoutId: "",
            regionBorderWidth: 1,
            resizerSize: 12,
            northResizable:false,
            westResizable:false,
            southResizable:false,
            eastResizable:false
        };
        return avalon;
    }
);
