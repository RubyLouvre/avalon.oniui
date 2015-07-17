/**
 * @cnName 布局组件
 * @enName Layout
 * @introduce
 *    <p>区域布局管理组件。一个组件中最多分为5个区域，分别为东西南北中区。其中中区是默认存在并不可移除的。</p>
 *  @updatetime 2015-6-5
 */
define(["avalon", "../draggable/avalon.draggable", "css!./avalon.layout.css"],
    function(avalon, tpl) {
        var widgetName = 'layout';
        var ewcNoTopBorder = "(northRegion.inLayoutFlow&&!northRegion.resizable)",   // 判断East, West, Centre区域是否有上边框的条件语句
            ewcNoBottomBorder = "(southRegion.inLayoutFlow&&!southRegion.resizable)",// 判断East, West, Centre区域是否有下边框的条件语句

            centreNoLeftBorder = "(westRegion.inLayoutFlow && !westRegion.resizable)",
            centreNoRightBorder = "(eastRegion.inLayoutFlow && !eastRegion.resizable)",

            northResizerHeight = "(northRegion.inLayoutFlow && northRegion.resizable ? resizerSize : 0)",  // North区域高度的计算表达式
            southResizerHeight = "(southRegion.inLayoutFlow && southRegion.resizable ? resizerSize : 0)",  // South区域高度的计算表达式
            westResizerWidth = "(westRegion.inLayoutFlow && westRegion.resizable ? resizerSize : 0)",  // West区域宽度的计算表达式
            eastResizerWidth = "(eastRegion.inLayoutFlow && eastRegion.resizable ? resizerSize : 0)",  // East区域宽度的计算表达式

            ewcResizerHeight = ["(layoutHeight - northRegion.realSize - southRegion.realSize)", 
                                    northResizerHeight, southResizerHeight
                                ].join("-"),    // East, West, Centre三个区域的包含border-width的高度的表达式。最终应用到区域上时需要减除各个区域的border-with
            ewcRegionHeigth = [ewcResizerHeight, 
                                ["(", ewcNoTopBorder, "?0:regionBorderWidth)"].join(""),
                                ["(", ewcNoBottomBorder, "?0:regionBorderWidth)"].join("")].join("-"),
            ewcRegionTop = ["layoutTop+northRegion.realSize+", northResizerHeight].join(""),    // East, West, Centre三个区域Top的表达式。

            docks = {
                "north": {
                    attrBindings: {
                        "ms-css-width": "layoutWidth - (isSubLayout?0:regionBorderWidth*2)",
                        "ms-css-height": "northRegion.realSize - (isSubLayout?regionBorderWidth:regionBorderWidth*2)",
                        "ms-css-top": "layoutTop",
                        "ms-css-left": "layoutLeft",
                        "ms-css-border-style": "isSubLayout?'none none solid none':'solid'",
                        "ms-css-border-width": "regionBorderWidth"
                    },
                    resizerConfig: {
                        "data-draggable-axis": "y",
                        "ms-css-width": "layoutWidth",
                        "ms-css-height": "resizerSize",
                        "ms-css-top": "layoutTop+northRegion.realSize",
                        "ms-css-left": "layoutLeft"
                    },
                    resizerManageProperty: {
                        plusLocation: true,
                        eventDataDirection: "Y",
                        getContainment: function(vmodel) {
                            var $offset = vmodel.$element.offset();
                            return [0, $offset.top + vmodel.regionBorderWidth*2, 0, $offset.top + vmodel.layoutHeight - vmodel.southRegion.realSize - vmodel.resizerSize * 2 - vmodel.regionBorderWidth * 2];
                        }
                    }
                },
                "south": {
                    attrBindings: {
                        "ms-css-width": "layoutWidth - (isSubLayout?0:regionBorderWidth*2)",
                        "ms-css-height": "southRegion.realSize - (isSubLayout?regionBorderWidth:regionBorderWidth*2)",
                        "ms-css-top": "layoutTop+layoutHeight-southRegion.realSize",
                        "ms-css-left": "layoutLeft",
                        "ms-css-border-style": "isSubLayout?'solid none none none':'solid'",
                        "ms-css-border-width": "regionBorderWidth"
                    },
                    resizerConfig: {
                        "data-draggable-axis": "y",
                        "ms-css-width": "layoutWidth",
                        "ms-css-height": "resizerSize",
                        "ms-css-top": "layoutTop+layoutHeight-southRegion.realSize-resizerSize",
                        "ms-css-left": "layoutLeft"
                    },
                    resizerManageProperty: {
                        plusLocation: false,
                        eventDataDirection: "Y",
                        getContainment: function(vmodel) {
                            var $offset = vmodel.$element.offset();
                            return [0, $offset.top + vmodel.northRegion.realSize + vmodel.regionBorderWidth*2 + vmodel.resizerSize, 0, $offset.top + vmodel.layoutHeight - vmodel.resizerSize];
                        }
                    }
                },
                "east": {
                    attrBindings: {
                        "ms-css-width": "eastRegion.realSize-(isSubLayout?regionBorderWidth:regionBorderWidth*2)",
                        "ms-css-height": ewcRegionHeigth,
                        "ms-css-top": ewcRegionTop,
                        "ms-css-left": "layoutLeft + layoutWidth - eastRegion.realSize",
                        "ms-css-border-top-style": [ewcNoTopBorder,"?'none':'solid'"].join(""),
                        "ms-css-border-bottom-style": [ewcNoBottomBorder, "?'none':'solid'"].join(""),
                        "ms-css-border-left-style": "'solid'",
                        "ms-css-border-right-style": "isSubLayout?'none':'solid'",
                        "ms-css-border-width": "regionBorderWidth"
                    },
                    resizerConfig: {
                        "data-draggable-axis": "x",
                        "ms-css-width": "resizerSize",
                        "ms-css-top": ewcRegionTop,
                        "ms-css-left": "layoutLeft+layoutWidth-eastRegion.realSize-resizerSize",
                        "ms-css-height": ewcResizerHeight
                    },
                    resizerManageProperty: {
                        plusLocation: false,
                        eventDataDirection: "X",
                        getContainment: function(vmodel) {
                            var $offset = vmodel.$element.offset();
                            return [
                                $offset.left + vmodel.westRegion.realSize + vmodel.regionBorderWidth*2 + vmodel.resizerSize, 
                                0, 
                                $offset.left + vmodel.layoutWidth - vmodel.resizerSize - vmodel.regionBorderWidth * 2, 
                            0];
                        }
                    }
                },
                "west": {
                    attrBindings: {
                        "ms-css-width": "westRegion.realSize - (isSubLayout?regionBorderWidth:regionBorderWidth*2)",
                        "ms-css-height": ewcRegionHeigth,
                        "ms-css-top": ewcRegionTop,
                        "ms-css-left": "layoutLeft",
                        "ms-css-border-top-style": [ewcNoTopBorder,"?'none':'solid'"].join(""),
                        "ms-css-border-bottom-style": [ewcNoBottomBorder, "?'none':'solid'"].join(""),
                        "ms-css-border-left-style": "isSubLayout?'none':'solid'",
                        "ms-css-border-right-style": "'solid'",
                        "ms-css-border-width": "regionBorderWidth"
                    },
                    resizerConfig: {
                        "data-draggable-axis": "x",
                        "ms-css-width": "resizerSize",
                        "ms-css-height": ewcResizerHeight,
                        "ms-css-top": ewcRegionTop,
                        "ms-css-left": "layoutLeft+westRegion.realSize"
                    },
                    resizerManageProperty: {
                        plusLocation: true,
                        eventDataDirection: "X",
                        getContainment: function(vmodel) {
                            var $offset = vmodel.$element.offset();
                            return [
                                $offset.left + vmodel.regionBorderWidth + vmodel.regionBorderWidth*2, 
                                0, 
                                $offset.left + vmodel.layoutWidth - vmodel.eastRegion.realSize - vmodel.regionBorderWidth*2 - vmodel.resizerSize*2, 
                                0
                            ];
                        }
                    }
                },
                "centre": {
                    attrBindings: {
                        "ms-css-width": ["layoutWidth-eastRegion.realSize-westRegion.realSize", 
                                            westResizerWidth,
                                            eastResizerWidth,
                                            ["(", centreNoLeftBorder, "?0:regionBorderWidth)"].join(""),
                                            ["(", centreNoRightBorder, "?0:regionBorderWidth)"].join("")
                                        ].join("-"),
                        "ms-css-height": ewcRegionHeigth,
                        "ms-css-top": ewcRegionTop,
                        "ms-css-left": "layoutLeft+westRegion.realSize+" + westResizerWidth,
                        "ms-css-border-top-style": [ewcNoTopBorder,"?'none':'solid'"].join(""),
                        "ms-css-border-bottom-style": [ewcNoBottomBorder, "?'none':'solid'"].join(""),
                        "ms-css-border-left-style": centreNoLeftBorder + "?'none':'solid'",
                        "ms-css-border-right-style": centreNoRightBorder + "?'none':'solid'",
                        "ms-css-border-width": "regionBorderWidth"
                    }
                }
            };
        var widget = avalon.ui[widgetName] = function(element, data, vmodels) {
            var options = data[widgetName+'Options'],
                $element = avalon(element);

            var domCreator = document.createElement("div");
            var vmodel = avalon.define(data[widgetName+'Id'], function(vm) {
                vm.$dockedAreas = {  };    // 存放5个区域的$(element)的字典
                vm.$resizers = { };   // 存放4个resizer的字典
                vm.$nestedLayouts = [];
                avalon.mix(true, vm, {
                    centreRegion: { inLayoutFlow: true, isNested: false },
                    westRegion: { resizable:false, size: 0, regionClass: "", inLayoutFlow: false, isNested: false, realSize: 0 },
                    eastRegion: { resizable:false, size: 0, regionClass: "", inLayoutFlow: false, isNested: false, realSize: 0 },
                    southRegion: { resizable:false, size: 0, regionClass: "", inLayoutFlow: false, isNested: false, realSize: 0 },
                    northRegion: { resizable:false, size: 0, regionClass: "", inLayoutFlow: false, isNested: false, realSize: 0 }
                }, options);

                vm.$init = function() {
                    if (vmodel.parentLayoutId!="" && !!avalon.vmodels[vmodel.parentLayoutId]) {
                        avalon.vmodels[vmodel.parentLayoutId].$registNestedLayout(vmodel);
                    }

                    if (vmodel.stretchMax) {
                        vmodel.layoutWidth = avalon(element.parentNode).width();
                        vmodel.layoutHeight = avalon(element.parentNode).height();
                    }
                    $element.addClass("oni-layout");
                    $element.attr("ms-css-width", "layoutWidth");
                    $element.attr("ms-css-height", "layoutHeight");


                    // 
                    var childNodesDictionary = {};  // 临时存放Region DOM的字典
                    for (var i = 0; i < element.children.length; i++) {
                        var $node = avalon(element.children[i]),
                            dockTo = $node.attr("ms-layout-dock");

                        if (docks.hasOwnProperty(dockTo)) {
                            $node.element.removeAttribute("ms-layout-dock");
                            childNodesDictionary[dockTo] = $node;
                        }
                    }

                    ["northRegion", "westRegion", "eastRegion", "southRegion", "centreRegion"].forEach(function(region) {
                        var resizable = false,
                            size;
                        // Size是必须定义的属性，否则不计算入layout
                        if (options.hasOwnProperty(region) && options[region].hasOwnProperty('size')) {
                            vm[region].inLayoutFlow = true;
                        }
                        if (vm[region].inLayoutFlow) {
                            resizable = vm[region].resizable;
                            size = vm[region].size;
                            var regionName = region.replace("Region", "");

                            // 从childNodesDictionary中寻找region的DOM节点。如果没有，创建一个新DIV。
                            if (!childNodesDictionary[regionName]) {
                                domCreator.innerHTML = "<div></div>";
                                var regionNode = domCreator.childNodes[0];
                                element.appendChild(regionNode);
                                vm.$dockedAreas[regionName] = avalon(regionNode);
                                domCreator.innerHTML = "";
                            } else {
                                vm.$dockedAreas[regionName] = childNodesDictionary[regionName];  
                            }
                            vm.updateRealSize(vm, vm[region], region);
                            vm.$dockedAreas[regionName].addClass(vm[region].regionClass);

                            // if (regionName != "centre") {
                            //     $element.addClass(regionName + "-region-" + (resizable? "resizable" : "unresizable"));
                            // }
                            vm.$bindRegionNode(regionName, vm.$dockedAreas[regionName].element, resizable);
                        }
                    });
                    childNodesDictionary = null;

                    vmodels = [vm].concat(vmodels);

                    avalon.scan(element, vmodels);
                    if(typeof vmodel.onInit === "function"){
                        vmodel.onInit.call(element, vmodel, options, vmodels)
                    }
                };                       
                vm.draggable = {
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
                                var plusLocation = docks[side].resizerManageProperty.plusLocation,
                                    eventDataDirection = docks[side].resizerManageProperty.eventDataDirection,
                                    callback = vmodel[side+"Region"].afterResize || vmodel.afterResize,
                                    beforeSize = vmodel[side+"Region"].realSize,
                                    afterSize = beforeSize + (data["page"+eventDataDirection] - data["startPage"+eventDataDirection]) * (plusLocation ? 1 : -1);
                                
                                if (beforeSize != afterSize) {
                                    vmodel[side+"Region"].size = vmodel[side+"Region"].realSize = afterSize;
                                    
                                    if (typeof callback == "function") {
                                        callback.call(element, side, beforeSize, afterSize);
                                    }
                                }

                                break;
                            }
                        }
                        vmodel.$updateNestedLayouts();
                    }
                };
                vm.$remove = function() {
                    if (vmodel.parentLayoutId!="" && !!avalon.vmodels[vmodel.parentLayoutId]) {
                        avalon.vmodels[vmodel.parentLayoutId].$unregistNestedLayout(vmodel);
                    }
                    vmodel.$nestedLayouts = null;
                    vmodel.$element = $element = null;
                    element.innerHTML = element.textContent = "";
                    vmodel.$dockedAreas = null;
                    vmodel.$resizers = null;
                    domCreator = null;
                };
                vm.$updateNestedLayouts = function () {
                    vmodel.$nestedLayouts.forEach(function(nestedVM) {
                        nestedVM.updateLayoutSize(nestedVM);
                    });
                };

                // 绑定区域DOM元素的宽高等css属性；如果该区域的尺寸可变，创建一个Draggable Div来接收Drag事件
                vm.$bindRegionNode = function (region, domNode, resizable) {
                    var $node = avalon(domNode);
                    if (docks.hasOwnProperty(region)) {
                        $node.addClass('oni-layout-' + region+'-region oni-layout-region');
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

                        domCreator.innerHTML = "<div ms-draggable ms-controller=\"" + vmodel.$id + "\" data-draggable-ghosting=\"true\" data-draggable-start=\"startFn\" data-draggable-stop=\"stopFn\"></div>";
                        resizer = domCreator.childNodes[0];
                        $resizer = avalon(resizer);
                        $resizer.addClass('oni-layout-' + region + "-resizer oni-layout-resizer");
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
                    vm.$dockedAreas[nestedVM.parentLayoutRegion].addClass("oni-layout-nested-region");
                    avalon.Array.ensure(vm.$nestedLayouts, nestedVM);
                    nestedVM.isSubLayout = true;
                    vm[nestedVM.parentLayoutRegion+"Region"].isNested = true;
                };
                vm.$unregistNestedLayout = function (nestedVM) {
                    vm.$dockedAreas[nestedVM.parentLayoutRegion].removeClass("oni-layout-nested-region");
                    avalon.Array.remove(vm.$nestedLayouts, nestedVM);
                    nestedVM.isSubLayout = false;
                    vm[nestedVM.parentLayoutRegion+"Region"].isNested = false;
                };

                vm.$element = $element;

                vm.isSubLayout = false;

                // var borderGetFn = function () { return this.regionBorderWidth; };
                // var emptySetFn = function() { return; };
                // vm.northRegionTopBorderWidth = vm.northRegionBottomBorderWidth = {
                //     get: function () {
                //         if (vmodel.parentLayoutId!="" && !!avalon.p[vmodel.parentLayoutId]) {
                //             var parentLayoutVM = avalon.vmodels[vmodel.parentLayoutId];
                //             if (parentLayoutVM.northRegion.resizable && parentLayoutVM.regionBorderWidth > 0) {
                //                 return 0;
                //             } else {
                //                 return this.regionBorderWidth;
                //             }
                //         } else {
                //             return this.regionBorderWidth;
                //         }
                //     },
                //     set: emptySetFn
                // };
                // vm.parentLayoutId = undefined;
                // vm.parentLayoutRegion = undefined; // 如果当前VM是某个Layout的SubLayout，这个变量表示当前VM在父级Layout中所在区域。
                vm.$isLayoutVM = true;
                vm.$skipArray = ["draggable", "parentLayoutId", "parentLayoutRegion"];
            });
            return vmodel;
        }
        widget.defaults = {
            layoutTop: 0,
            layoutLeft: 0,
            parentLayoutRegion: "",
            parentLayoutId: "",

            stretchMax: true,   //@config Layout的元素是否填充满父级DOM。此参数为true时，layoutWidth和layoutHeight不参与计算
            layoutWidth: 0,     //@config Layout组件的整体宽度。stretchMax为true时，此参数不参与计算
            layoutHeight: 0,    //@config Layout组件的整体高度。stretchMax为true时，此参数不参与计算
            regionBorderWidth: 1,   //@config 区域的边框的宽度
            resizerSize: 5,          //@config 区域的拖放元素的尺

            eastRegion: {},     //@config {Object} 东区配置对象。参看region对象
            southRegion: {},    //@config {Object} 南区配置对象。参看region对象
            westRegion: {},     //@config {Object} 西区配置对象。参看region对象
            northRegion: {},    //@config {Object} 北区配置对象。参看region对象
            centreRegion: {},   //@config {Object} 中区配置对象。参看region对象

            /**
             * @config {Function} 删除一个Region并将DOM移出文档
             * @param opts {Object} vmodel
             * @param region {Object} east, south, west或者north。centre区域不可移除。
             */
            removeRegion: function(opts, region) {
                if (region != "centre" && docks.hasOwnProperty(region) && !!opts.$dockedAreas[region]) {
                    var callback = opts[region+"Region"].afterRemove || opts.afterRemove,
                        element = opts.$element.element;
                    element.removeChild(opts.$dockedAreas[region].element);
                    if (opts[region+"Region"].resizable) {
                        element.removeChild(opts.$resizers[region].element);
                        delete opts.$resizers[region];
                    }
                    delete opts.$dockedAreas[region];
                    opts[region+"Region"].size = 0;
                    opts[region+"Region"].realSize = 0;
                    opts[region+"Region"].inLayoutFlow = false;
                    opts[region+"Region"].resizable = false;
                    if (typeof callback == "function") {
                        callback.call(element, region);
                    }
                }
                opts.$updateNestedLayouts();
            },
            /**
             * @config {Function} 新增一个不存在的区域
             * @param opts {Object} vmodel
             * @param region {Object} east, south, west或者north。
             * @param cfg {Object} 区域配置对象。参看region配置
             */
            addRegion: function(opts, region, cfg) {
                // 检查Region名称和是否已经有同名Region。名称必须是south, east, north或者west. 
                if (!docks.hasOwnProperty(region) || !!opts.$dockedAreas[region]) return;
                var callback = opts.afterAdd,
                    element = opts.$element.element;
                if (region != "centre" && cfg.hasOwnProperty("size")) {
                    // 更新VM中的尺寸和Resizable属性
                    opts[region+"Region"].size = cfg.size;
                    opts[region+"Region"].inLayoutFlow = true;
                    opts[region+"Region"].resizable = cfg.resizable;
                    opts.updateRealSize(opts, opts[region+"Region"], region+"Region");

                    // 创建Region的DOM元素并插入文档 
                    var node = document.createElement("div");
                    avalon(node).addClass(cfg.regionClass);
                    element.appendChild(node);
                    opts.$bindRegionNode(region, node, cfg.resizable);
                }
                avalon.scan(element, opts);
                opts.$updateNestedLayouts();
                if (typeof callback=="function") {
                    callback.call(element, region, node, cfg);
                }
            },
            /**
             * @config {Function} 拖动拖放器后区域大小改变的回调函数。单独的区域配置中若有相同的回调函数，则该区域被拖动后主配置的回调不会触发
             * @param region {Object} east, south, west或者north。
             * @param beforeSize {Number} 拖放前的尺寸
             * @param afterSize {Number} 拖放后的尺寸
             */
             afterResize: function(region, beforeSize, afterSize) {},
            /**
             * @config {Function} 移除一个区域后的回调函数。单独的区域配置中若有相同的回调函数，则该区域被移除后主配置的回调不会触发
             * @param region {Object} east, south, west或者north。
             */
             afterRemove: function(region) {},
            /**
             * @config {Function} 新增一个区域后的回调函数。
             * @param region {Object} east, south, west或者north。
             * @param dom {Object} 新增区域的DOM节点
             * @param cfg {Object} region配置对象。参看region配置
             */
             afterAdd: function(region, dom, cfg) {},


            /**
             * @config {Function} 当更改Layout尺寸后，需要调用此函数重新计算布局大小。
             * @param opts {Object} vmodel
             */
            updateLayoutSize: function (opts) {
                var element = opts.$element.element;
                if (opts.stretchMax) {
                    opts.layoutWidth = avalon(element.parentNode).width();
                    opts.layoutHeight = avalon(element.parentNode).height();
                }

                ["northRegion", "westRegion", "eastRegion", "southRegion"].forEach(function(region) {
                    var resizable = false,
                        size = opts[region].size;
                    if (!opts[region].inLayoutFlow) return;
                    opts.updateRealSize(opts, opts[region], region);
                });

                opts.$updateNestedLayouts();
            },

            /**
             * @config {Function} 检测Layout是否包含一个区域。
             * @param opts {Object} vmodel
             * @param region {Object} east, south, west, north或者centre。
             */
            hasRegion: function(opts, region) {
                var region = region + "Region";
                return opts.hasOwnProperty(region) && opts[region].inLayoutFlow;
            },

            /**
             * @config {Function} 获取一个区域的真实尺寸。
             * @param opts {Object} vmodel
             * @param region {Object} east, south, west或者north。
             */
            getRegionRealSize: function(opts, region) {
                var region = region + "Region",
                    regionSize = 0;
                if (opts.hasOwnProperty(region) && opts[region].inLayoutFlow && region != "centreRegion") {
                    regionSize = opts[region].realSize;
                }
                return regionSize;
            },

            updateRealSize: function(opts, regionConfig, region) {
                if (region == "centreRegion") return;
                var size = regionConfig.size,
                    layoutSize = (region=="westRegion" || region=="eastRegion") ? opts.layoutWidth : opts.layoutHeight;
                if (typeof size == 'string' && /^(100|[1-9]?\d(\.\d+?)?)%$/.test(size)) {
                    regionConfig.realSize = layoutSize * parseFloat(size) / 100;
                } else {
                    regionConfig.realSize = regionConfig.size;
                }
            }
            //
        };
        return avalon;
    }
);
/**
 * @other
 * <p><b>使用ms-layout-dock在Layout组件下自定义区域内的内容</b></p>
 * 除了使用API的方式配置Layout组件，还可以使用ms-layout-dock属性，在HTML文档内配置区域的位置以及内容。如下：
 * ```html
<div ms-widget="layout,layoutVM,$layoutVMOptions" class="container">
    <div ms-layout-dock="north">        
        <div style="width:100%;height:100px;background-image:logo.png">聪明你的旅行</div>
    </div>
</div>
例子4内有完整的示例方式。
 * ```
 * <p><b>region对象</b></p>
 * region对象是一个非常重要的对象，下面是说明和默认值
 * ```js
{
     //区域尺寸。不可用于centre区域。数字或者百分比。
     //对于North和South来说，代表的是Height，因为Width是固定等于整个Layout的Width
     //对于East和West来说，代表的是Width，因为Height是固定等于整个Layout.Height - North.size - South.size
     size: 0, 

     //是否增加一个resizer。不可用于centre区域
     resizable: false,

     //增加在区域上的CSS
     regionClass: "", 

     //区域被移除后的回调。不可用于centre区域。配置了本项后，移除区域时不会触发主配置的afterRemove回调
     afterRemove: undefined,

     //区域改变大小后的回调。不可用于centre区域。配置了本项后，改变区域大小时不会触发主要的afterResize回调
     afterResize: undefined 
 }
 ```
 */

 /**
 @links
 [最基础的Layout配置](avalon.layout.ex1.html)
 [移除和增加区域](avalon.layout.ex2.html)
 [嵌套的Layout](avalon.layout.ex3.html)
 [百分比尺寸的Layout，改变Layout尺寸](avalon.layout.ex4.html)
 */