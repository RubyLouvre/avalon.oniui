//avalon 1.3.6 2014.11.06
/**
 *
 * @cnName 下拉框
 * @enName dropdown
 * @introduce
 *
 <p>因为原生<code>select</code>实在是难用，avalon的dropdown组件在兼容原生<code>select</code>的基础上，对其进行了增强。</p>
 <ul>
 <li>1，支持在标题和下拉菜单项中使用html结构，可以用来信息的自定义显示</li>
 <li>2，同时支持通过html以及配置项两种方式设置组件</li>
 <li>3，通过配置，可以让下拉框自动识别在屏幕中的位置，来调整向上或者向下显示</li>
 </ul>
 */
define(["avalon",
    "text!./avalon.dropdown.html",
    "../avalon.getModel",
    "../scrollbar/avalon.scrollbar",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.dropdown.css"
], function(avalon, template) {
    var styleReg = /^(\d+).*$/;
    var ie6=!-[1,]&&!window.XMLHttpRequest;
    var widget = avalon.ui.dropdown = function(element, data, vmodels) {
        var $element = avalon(element),
            elemParent = element.parentNode,
            options = data.dropdownOptions,
            hasBuiltinTemplate = true, //标志是否通过model值构建下拉列表
            dataSource,
            dataModel,
            templates, titleTemplate, listTemplate,
            blurHandler,
            scrollHandler,
            resizeHandler,
            keepState = false

        //将元素的属性值copy到options中
        "multiple,size".replace(avalon.rword, function(name) {
            if (hasAttribute(element, name)) {
                options[name] = element[name]
            }
        })
        //将元素的属性值copy到options中
        options.enable = !element.disabled

        //读取template
        templates = options.template = options.getTemplate(template, options)
            .replace(/MS_OPTION_ID/g, data.dropdownId).split("MS_OPTION_TEMPLATE")
        titleTemplate = templates[0]
        listTemplate = templates[1]
        dataSource = options.data.$model || options.data

        //由于element本身存在ms-if或者内部包含ms-repeat等绑定，在抽取数据之前，先对element进行扫描
        element.removeAttribute("ms-duplex");
        avalon.scan(element, vmodels);

        //数据抽取
        dataModel = getDataFromHTML(element)
        hasBuiltinTemplate = !!dataModel.length

        if (dataModel.length === 0) {
            dataModel = getDataFromOption(dataSource);
        }

        options.data = dataModel
        avalon(element).css('display', 'none');

        //转换option
        _buildOptions(options);
        for (var i = 0, n = dataModel.length; i < n; i++) {
            if (dataModel[i].value == options.value) {
                options.activeIndex = i
                options.currentOption = avalon.mix(true, {}, dataModel[i]);
                break;
            }
        }
        var titleNode, listNode;
        var vmodel = avalon.define(data.dropdownId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "duplexName", "menuNode", "dropdownNode", "scrollWidget", "rootElement"];
            if(vm.multiple && vm.$hasDuplex && vm.$skipArray.indexOf("value") === -1) {
                vm.$skipArray.push("value")
            }
            vm.render = function(data) {
                if (data === void 0) {
                    return
                }
                vmodel.data = getDataFromOption(data.$model || data)
                if (vmodel.toggle) {
                    vmodel._styleFix(true)
                }
            }
            vm.widgetElement = element;
            vm.rootElement = {}
            vm.menuWidth = "auto";   //下拉列表框宽度
            vm.menuHeight = vm.height;  //下拉列表框高度
            vm.dataSource = dataSource;    //源节点的数据源，通过dataSource传递的值将完全模拟select
            vm.focusClass =  false
            vm.$init = function(continueScan) {
                //根据multiple的类型初始化组件
                if (vmodel.multiple) {
                    //创建菜单
                    listNode = createListNode();
                    var list = listNode.firstChild;
                    elemParent.insertBefore(listNode, element);
                    list.appendChild(element);
                } else {//如果是单选
                    var title;
                    titleNode = avalon.parseHTML(titleTemplate);
                    title = titleNode.firstChild;
                    elemParent.insertBefore(titleNode, element);
                    title.appendChild(element);
                    titleNode = title;

                    //设置title宽度
                    vmodel.titleWidth = computeTitleWidth();
                    //设置label值
                    setLabelTitle(vmodel.value);

                    //注册blur事件
                    blurHandler = avalon.bind(document.body, "click", function(e) {
                        //判断是否点击发生在dropdown节点内部
                        //如果不在节点内部即发生了blur事件
                        if(titleNode.contains(e.target)) {
                            vmodel._toggle()
                            return
                        } else if(listNode && listNode.contains(e.target)) {
                            return
                        }
                        if (!vmodel.__cursorInList__ && !vmodel.multiple && vmodel.toggle) {
                            vmodel.toggle = false;
                        }
                    })

                    if(vmodel.position) {
                        //监听window的滚动及resize事件，重新定位下拉框的位置
                        scrollHandler = avalon.bind(window, "scroll", _positionListNode)
                        resizeHandler = avalon.bind(window, "resize", _positionListNode)
                    }

                }

                //如果原来的select没有子节点，那么为它添加option与optgroup
                if (!hasBuiltinTemplate) {
                    element.appendChild(getFragmentFromData(dataModel));
                    avalon.each(["multiple", "size"], function(i, attr) {
                        avalon(element).attr(attr, vmodel[attr]);
                    });
                }

                if (!vmodel.multiple) {
                    var duplexName = (element.msData["ms-duplex"] || "").trim(),
                        duplexModel;

                    if (duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                        duplexModel[1].$watch(duplexModel[0], function(newValue) {
                            vmodel.value = newValue;
                        })
                    }

                    vmodel.$watch("value", function(n, o) {
                        avalon.nextTick(function(){
                            var onChange = avalon.type(vmodel.onChange) === "function" && vmodel.onChange || false
                            if (keepState) {
                                keepState = false
                                return
                            }
                            function valueStateKeep(stateKeep) {
                                if (stateKeep) {
                                    keepState = true
                                    vmodel.value = o
                                } else {
                                    if (duplexModel) {
                                        duplexModel[1][duplexModel[0]] = n
                                        element.value = n
                                    }
                                    vmodel.currentOption = setLabelTitle(n);
                                }
                            }
                            if ((onChange && onChange.call(element, n, o, vmodel, valueStateKeep) !== false) || !onChange) {
                                if (duplexModel) {
                                    duplexModel[1][duplexModel[0]] = n
                                    element.value = n
                                }
                                vmodel.currentOption = setLabelTitle(n);
                            }
                        })
                    });
                } else {
                    vmodel.value.$watch("length", function() {
                        vmodel.multipleChange = !vmodel.multipleChange;
                        optionsSync();
                    })
                }

                //同步disabled或者enabled
                var disabledAttr = element.msData["ms-disabled"],
                    disabledModel,
                    enabledAttr = element.msData["ms-enabled"],
                    enabledModel;

                if(disabledAttr && (disabledModel = avalon.getModel(disabledAttr, vmodels))) {
                    disabledModel[1].$watch(disabledModel[0], function(n) {
                        vmodel.enable = !n;
                    });
                    vmodel.enable = !disabledModel[1][disabledModel[0]];
                }

                if(enabledAttr && (enabledModel = avalon.getModel(enabledAttr, vmodels))) {
                    enabledModel[1].$watch(enabledModel[0], function(n) {
                        vmodel.enable = n;
                    })
                    vmodel.enable = enabledModel[1][enabledModel[0]];
                }
                vmodel.enable = !element.disabled;

                //同步readOnly
                var readOnlyAttr = vmodel.readonlyAttr,
                    readOnlyModel;

                if(readOnlyAttr && (readOnlyModel = avalon.getModel(readOnlyAttr, vmodels))) {
                    readOnlyModel[1].$watch(readOnlyModel[0], function(n) {
                        vmodel.readOnly = n;
                    });
                    vmodel.readOnly = readOnlyModel[1][readOnlyModel[0]];
                }

                //获取$source信息
                if(vmodel.$source) {
                    if(avalon.type(vmodel.$source) === "string") {
                        var sourceModel = avalon.getModel(vmodel.$source, vmodels);

                        sourceModel && ( vmodel.$source = sourceModel[1][sourceModel[0]] );

                    } else if(!vmodel.$source.$id) {
                        vmodel.$source = null
                    } else if(vmodel.$source.length > 0) {
                        vmodel._refresh(vmodel.$source.length);
                    }

                    //对data的改变做监听，由于无法检测到对每一项的改变，检测数据项长度的改变
                    vmodel.$source && vmodel.$source.$watch && vmodel.$source.$watch('length', function(n) {
                        vmodel._refresh(n)
                    });
                }
                avalon.scan(element.parentNode, [vmodel].concat(vmodels));
                if(continueScan){
                    continueScan()
                } else{
                    avalon.log("请尽快升到avalon1.3.7+")
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
                vmodel.multiple && optionsSync()
            }

            vm.repeatRendered = function() {
                if(vmodel.multiple) {
                    avalon.vmodels["scrollbar-" + vmodel.$id].update()
                }
            }

            /**
             * @interface 当组件移出DOM树时,系统自动调用的销毁函数
             */
            vm.$remove = function() {
                if (blurHandler) {
                    avalon.unbind(window, "click", blurHandler)
                }
                if(scrollHandler) {
                    avalon.unbind(window, "scroll", scrollHandler)
                }
                if(resizeHandler) {
                    avalon.unbind(window, "resize", resizeHandler)
                }
                vmodel.toggle = false;
                listNode && vmodel.container && vmodel.container.contains(listNode) && vmodel.container.removeChild(listNode);
                avalon.log("dropdown $remove")
            }


            vm._select = function(index, event) {
                var option = vmodel.data[index].$model;
                if (option && option.enable && !option.group) {
                    var oldValue = vmodel.value;
                    //根据multiple区分对待, 多选时可以为空值
                    if (vmodel.multiple) {
                        index = vmodel.value.indexOf(option.value)
                        if (index > -1) {
                            vmodel.value.splice(index, 1)
                        } else {
                            vmodel.value.push(option.value)
                        }

                    } else {
                        vmodel.value = option.value;
                    }
                    // vmodel.currentOption = option;
                    vmodel.toggle = false;
                    if(avalon.type(vmodel.onSelect) === "function") {
                        vmodel.onSelect.call(element, event, vmodel.value, oldValue, vmodel);
                    }
                    vmodel.activeIndex = index
                }
            };
            /**
             *
             * @param len 新数据长度
             * @private
             */
            vm._refresh = function(len) {
                vmodel.data.clear();
                vmodel.label = '';
                vmodel.__cursorInList__ = false
                if (len > 0) {
                    //当data改变时，解锁滚动条
                    vmodel._disabledScrollbar(false);
                    vmodel.data.pushArray(getDataFromOption(vmodel.$source.$model || vmodel.$source));
                    var option
                    //当data改变时，尝试使用之前的value对label和title进行赋值，如果失败，使用data第一项
                    if (!(option = setLabelTitle(vmodel.value))) {
                        vmodel.currentOption = vmodel.data[0].$model;
                        vmodel.activeIndex = 0;
                        var v = vmodel.data[0].value;
                        if(vmodel.multiple && !(v instanceof Array)) v = [v]; // 保证类型一致
                        setLabelTitle(vmodel.value = v);
                    } else {
                        vmodel.activeIndex = vmodel.data.$model.indexOf(option)
                    }
                    if (vmodel.menuNode) {
                        vmodel._styleFix(true)
                    }
                }
            };


            vm._titleenter = function() {
                if (vmodel.hoverAutoShow) {
                    vmodel._toggle()
                    // vmodel.toggle = true
                }
            };
            vm._titleleave = function() {
                if (vmodel.hoverAutoShow) {
                    vmodel.toggle = false
                }
            };
            
            vm._keydown = function(event) {
                if(vmodel.keyboardEvent === false) {
                    return;
                }

                //如果是单选下拉框，可以通过键盘移动
                if (!vmodel.multiple) {
                    var index = vmodel.activeIndex || 0,
                        oldValue = vmodel.value;

                    //区分上下箭头和回车
                    switch (event.keyCode) {
                        case 9:
                        // tab
                        case 27:
                            // escape
                            event.preventDefault()
                            break;
                        case 13:
                            vmodel._select(index, event)
                            break;
                        case 38:
                        case 63233: //safari 向上
                            event.preventDefault();
                            index = getEnableOption(vmodel.data, index)
                            if(index === null) {
                                return
                            }
                            vmodel.value = vmodel.data[index].value
                            vmodel.activeIndex = index
                            vmodel.scrollTo(index)
                            if(avalon.type(vmodel.onSelect) === "function") {
                                vmodel.onSelect.call(element, event, vmodel.value, oldValue, vmodel);
                            }
                            break;
                        case 40:
                        case 63235: //safari 向下
                            event.preventDefault();
                            index = getEnableOption(vmodel.data, index, true)
                            if(index === null) {
                                return
                            }
                            vmodel.value = vmodel.data[index].value
                            vmodel.activeIndex = index
                            vmodel.scrollTo(index)
                            if(avalon.type(vmodel.onSelect) === "function") {
                                vmodel.onSelect.call(element, event, vmodel.value, oldValue, vmodel);
                            }
                            break
                    }
                }
            }
            //下拉列表的显示依赖toggle值，该函数用来处理下拉列表的初始化，定位
            vm._toggle = function(b) {
                if ((vmodel.data.length ===0 && !vmodel.realTimeData)|| !vmodel.enable || vmodel.readOnly) {
                    vmodel.toggle = false;
                    return;
                }

                //为了防止显示时调整高度造成的抖动，将节点初始化放在改变toggle值之前
                if (!listNode) {//只有单选下拉框才存在显示隐藏的情况
                    var list;
                    listNode = createListNode();
                    list = listNode.firstChild;
                    vmodel.container.appendChild(listNode)
                    listNode = list
                    vm.rootElement = list
                    avalon.scan(list, [vmodel].concat(vmodels))
                    vmodel.menuNode = document.getElementById("menu-" + vmodel.$id)     //下拉列表框内层容器 （包裹滚动条部分的容器）
                    vmodel.dropdownNode = document.getElementById("list-" + vmodel.$id) //下拉列表框内容（有滚动条的部分）
                }

                //如果参数b不为布尔值，对toggle值进行取反
                if (typeof b !== "boolean") {
                    vmodel.toggle = !vmodel.toggle;
                    return;
                }

                if (!b) {
                    avalon.type(vmodel.onHide) === "function" && vmodel.onHide.call(element, listNode, vmodel);
                } else {
                    var firstItemIndex, selectedItemIndex, value = vmodel.value;
                    if (avalon.type(value) !== "array") {
                        value = [value];
                    }

                    //计算activeIndex的值
                    if (vmodel.activeIndex == null) {
                        avalon.each(vmodel.data, function(i, item) {
                            if (firstItemIndex === void 0 && item.enable) {
                                firstItemIndex = i;
                            }
                            if (item.value === value[0]) {
                                selectedItemIndex = i;
                                return false;
                            }
                            return true;
                        });

                        if (!selectedItemIndex) {
                            selectedItemIndex = firstItemIndex;
                        }
                        vmodel.activeIndex = selectedItemIndex || 0;
                    }
                    vmodel.scrollWidget = avalon.vmodels["scrollbar-" + vmodel.$id];
                    vmodel._styleFix();
                    vmodel._position();
                    if(avalon.type(vmodel.onShow) === "function") {
                        vmodel.onShow.call(element, listNode, vmodel);
                    }
                }
            };

            vm.$watch("toggle", function(b) {
                vmodel.focusClass = b
                vmodel._toggle(b);
            });

            vm.toggle = false;

            vm._position = function() {
                var $titleNode = avalon(titleNode);
                //计算浮层当前位置，对其进行定位，默认定位正下方
                //获取title元素的尺寸及位置
                var offset = $titleNode.offset(),
                    outerHeight = $titleNode.outerHeight(true),
                    $listNode = avalon(listNode),
                    $sourceNode = avalon(titleNode.firstChild),
                    listHeight = $listNode.height(),
                    $window = avalon(window),
                    css = {},
                    offsetParent = listNode.offsetParent,
                    $offsetParent = avalon(offsetParent);

                while ($sourceNode.element && $sourceNode.element.nodeType != 1) {
                    $sourceNode = avalon($sourceNode.element.nextSibling);
                }

                //计算浮层的位置
                if (options.position && offset.top + outerHeight + listHeight > $window.scrollTop() + $window.height() && offset.top - listHeight > $window.scrollTop()) {
                    css.top = offset.top - listHeight;
                } else {
                    css.top = offset.top + outerHeight - $sourceNode.css("borderBottomWidth").replace(styleReg, "$1");
                }

                if(offsetParent && (offsetParent.tagName !== "BODY" && offsetParent.tagName !== "HTML")) {
                    //修正由于边框带来的重叠样式
                    css.top = css.top  - $offsetParent.offset().top + listNode.offsetParent.scrollTop;
                    css.left = offset.left - $offsetParent.offset().left + listNode.offsetParent.scrollLeft;
                } else {
                    //修正由于边框带来的重叠样式
                    css.left = offset.left;
                }

                //显示浮层
                $listNode.css(css);
            }
            //是否当前鼠标在list区域
            vm.__cursorInList__ = false

            //单选下拉框在失去焦点时会收起
            vm._listenter = function() {
                vmodel.__cursorInList__ = true
                if (vmodel.hoverAutoShow) {
                    vmodel.toggle = true
                }
            }

            vm._listleave = function() {
                vmodel.__cursorInList__ = false
                if (vmodel.hoverAutoShow) {
                    vmodel.toggle = false
                }
            };
            vm._blur = function() {
                if (!vmodel.__cursorInList__ && !vmodel.multiple && vmodel.toggle) {
                    vmodel.toggle = false;
                }
            }

            /**
             * @interface
             * @param newValue 设置控件的值，需要注意的是dropdown设置了multiple属性之后，值是数组，未设置multiple属性的时候，可以接受字符串，数字，布尔值；未设置该值时，效果是返回当前控件的值
             * @returns vmodel.value 控件当前的值
             */
            vm.val = function(newValue) {
                if (typeof newValue !== "undefined") {
                    if (avalon.type(newValue) !== "array") {
                        newValue = [newValue];
                    }
                    vmodel.value = newValue;
                }
                return vmodel.value;
            }

            vm.isActive = function(el) {
                var value = el.value, enable = el.enable, group = el.group;
                if (vmodel.multiple) {
                    return vmodel.value.indexOf(value) > -1 && enable && !group;
                } else {
                    return vmodel.value === value && enable && !group;
                }
            }

            //当下拉列表中的项目发生改变时，调用该函数修正显示，顺序是修正下拉框高宽 --> 滚动条更新显示 --> 定位下拉框
            vm._styleFix = function(resetHeight) {
                var MAX_HEIGHT = options.height || 200,
                    $menu = avalon(vmodel.menuNode),
                    height = '' 

                if (resetHeight) {
                    vmodel.menuHeight = ''
                    avalon(vmodel.dropdownNode).css({ 'height': '' });
                }
                
                height = vmodel.dropdownNode.scrollHeight
                vmodel.menuWidth = !ie6 ? vmodel.listWidth - $menu.css("borderLeftWidth").replace(styleReg, "$1") - $menu.css("borderRightWidth").replace(styleReg, "$1") : vmodel.listWidth;
                if (height > MAX_HEIGHT) {
                    vmodel._disabledScrollbar(false);
                    height = MAX_HEIGHT;
                    avalon(vmodel.dropdownNode).css({
                        "width": vmodel.menuWidth - vmodel.scrollWidget.getBars()[0].width()
                    });
                } else {
                    vmodel._disabledScrollbar(true);
                    avalon(vmodel.dropdownNode).css({
                        "width": vmodel.menuWidth
                    })
                }
                vmodel.menuHeight = height;
                vmodel.updateScrollbar();
                vmodel.scrollTo(vmodel.activeIndex);
            };

            //利用scrollbar的样式改变修正父节点的样式
            vm.updateScrollbar = function() {
                vmodel.scrollWidget.update();
            }

            //通过当前的activeIndex，更新scrollbar的滚动位置
            vm.scrollTo = function(activeIndex) {

                if(!vmodel.dropdownNode) return;
                //计算是否需要滚动
                var nodes = siblings(vmodel.dropdownNode.firstChild),
                    $activeNode = avalon(nodes[activeIndex]),
                    menuHeight = vmodel.menuHeight,
                    nodeTop = nodes.length ? $activeNode.position().top - avalon(nodes[0]).position().top : 0,
                    nodeHeight = nodes.length ? $activeNode.height() : 0,
                    scrollTop = vmodel.dropdownNode.scrollTop

                if(nodeTop > scrollTop + menuHeight - nodeHeight || nodeTop + nodeHeight < scrollTop) {
                    vmodel.scrollWidget.scrollTo(0, nodeTop + nodeHeight - menuHeight)
                }
            }

            //禁用滚动条，当下拉列表的高度小于最大高度时，只显示当前高度，需要对滚动条做禁用
            vm._disabledScrollbar = function(b) {
                vmodel.scrollWidget && (vmodel.scrollWidget.disabled = !!b)
            }

        });

        vmodel.$watch("enable", function(n) {
            if(!n) {
                vmodel.toggle = false;
            }
        });

        vmodel.$watch("readOnly", function(n) {
            if(!!n) {
                vmodel.toggle = false;
            }
        });

        //在multiple模式下同步select的值
        //http://stackoverflow.com/questions/16582901/javascript-jquery-set-values-selection-in-a-multiple-select
        function optionsSync() {
            avalon.each(element.getElementsByTagName("option"), function(i, option) {
                if(vmodel.value.$model.indexOf(option.value) > -1 || vmodel.value.$model.indexOf( parseData(option.value) ) > -1) {
                    try {
                        option.selected = true
                    } catch(e) {
                        avalon(option).attr("selected", "selected");
                    }
                } else {
                    try {
                        option.selected = false
                    } catch(e) {
                        option.removeAttribute("selected")
                    }
                }
            })
        }

        function _buildOptions(opt) {
            //为options添加value与duplexName
            //如果原来的select元素绑定了ms-duplex，那么取得其值作value
            //如果没有，则先从上层VM的配置对象中取，再没有则从内置模板里抽取
            var duplexName = (element.msData["ms-duplex"] || "").trim()
            var duplexModel
            if (duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                opt.value = duplexModel[1][duplexModel[0]]
                opt.$hasDuplex = true
            } else if (!hasBuiltinTemplate) {
                if (!Array.isArray(opt.value)) {
                    opt.value = [opt.value || ""]
                }
            } else {
                var values = []
                Array.prototype.forEach.call(element.options, function(option) {
                    if (option.selected) {
                        values.push(parseData(option.value))
                    }
                })
                opt.value = values
            }
            if (!opt.multiple) {
                if(Array.isArray(opt.value)) {
                    opt.value = opt.value[0] !== void 0 ? opt.value[0] : ""
                }
                //尝试在当前的data中查找value对应的选项，如果没有，将value设置为data中的option第一项的value
                var option = opt.data.filter(function(item) {
                    return item.value === opt.value  && !item.group
                }),
                    options = opt.data.filter(function(item) {
                        return !item.group
                    })

                if(option.length === 0 && options.length > 0) {
                    opt.value = options[0].value

                    //如果存在duplex，同步该值
                    if(duplexModel) {
                        duplexModel[1][duplexModel[0]] = opt.value
                    }
                }
            }

            //处理data-duplex-changed参数
            var changedCallbackName = $element.attr("data-duplex-changed"),
                changedCallbackModel;    //回调函数
            if (changedCallbackName && (changedCallbackModel = avalon.getModel(changedCallbackName, vmodels))) {
                opt.changedCallback = changedCallbackModel[1][changedCallbackModel[0]]
            }
            opt.duplexName = duplexName

            //处理container
            var docBody = document.body, container = opt.container;

            // container必须是dom tree中某个元素节点对象或者元素的id，默认将dialog添加到body元素
            opt.container = (avalon.type(container) === "object" && container.nodeType === 1 && docBody.contains(container) ? container : document.getElementById(container)) || docBody;
        }

        /**
         * 生成下拉框节点
         * @returns {*}
         */
        function createListNode() {
            return avalon.parseHTML(listTemplate);
        }

        //设置label以及title
        function setLabelTitle(value) {
            var option = vmodel.data.$model.filter(function(item) {
                return item.value === value;
            });

            option = option.length > 0 ? option[0] : null

            if(!option && vmodel.data.length) {
                avalon.log("[log] avalon.dropdown 设置label出错");
            } else if (option) {
                vmodel.label = option.label;
                vmodel.title = option.title || option.label || "";
            }

            return option;
        }

        //计算title的宽度
        function computeTitleWidth() {
            var title = document.getElementById("title-" + vmodel.$id),
                $title = avalon(title);
            return vmodel.width - $title.css("paddingLeft").replace(styleReg, "$1") - $title.css("paddingRight").replace(styleReg, "$1");
        }

        //定位listNode
        function _positionListNode() {
            if(!vmodel.multiple && listNode) {
                vmodel._position();
            }
        }

        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        realTimeData: false,
        container: null, //@config 放置列表的容器
        width: 200, //@config 自定义宽度
        listWidth: 200, //@config 自定义下拉列表的宽度
        titleWidth: 0,  //@config title部分宽度
        height: 200, //@config 下拉列表的高度
        enable: true, //@config 组件是否可用
        readOnly: false, //@config 组件是否只读
        hoverAutoShow: false, //@config 是否开启鼠标移入打开下拉列表鼠标移出关闭下拉列表功能
        readonlyAttr: null, //@config readonly依赖的属性
        currentOption: null,  //@config 组件当前的选项
        data: [], //@config 下拉列表显示的数据模型
        $source: null, //@config 下拉列表的数据源
        textFiled: "text", //@config 模型数据项中对应显示text的字段,可以传function，根据数据源对text值进行格式化
        valueField: "value", //@config 模型数据项中对应value的字段
        value: [], //@config 设置组件的初始值
        label: "", //@config 设置组件的提示文案，可以是一个字符串，也可以是一个对象
        multiple: false, //@config 是否为多选模式
        listClass: "",   //@config 列表添加自定义className来控制样式
        title: "",
        titleClass: "",   //@config title添加自定义className来控制样式
        activeIndex: null,
        size: 1,
        menuNode: null,
        dropdownNode: null,
        scrollWidget: null,
        position: true, //@config 是否自动定位下拉列表
        onSelect: null,  //@config 点击选项时的回调
        onShow: null,    //@config 下拉框展示的回调函数
        onHide: null,    //@config 下拉框隐藏的回调函数
        onChange: null,  //@config value改变时的回调函数
        $hasDuplex: false, 
        multipleChange: false,
        keyboardEvent: true,  //@config 是否支持键盘事件
        /**
         * @config 模板函数,方便用户自定义模板
         * @param str {String} 默认模板
         * @param opts {Object} VM
         * @returns {String} 新模板
         */
        getTemplate: function(str, options) {
            return str
        },
        onInit: avalon.noop     //@config 初始化时执行方法
    };

    //用于将字符串中的值转换成具体值
    function parseData(data) {
        try {
            data = data === "true" ? true :
                data === "false" ? false :
                    data === "null" ? null :
                        +data + "" === data ? +data : data;
        } catch (e) {
        }
        return data
    }

    //根据dataSource构建数据结构
    //从VM的配置对象提取数据源, dataSource为配置项的data数组，但它不能直接使用，需要转换一下
    //它的每一个对象代表option或optGroup，
    //如果是option则包含label, enable, value
    //如果是optGroup则包含label, enable, options(options则包含上面的option)
    //每个对象中的enable如果不是布尔，则默认为true; group与parent则框架自动添加
    function getDataFromOption(data, arr, parent) {
        var ret = arr || []
        parent = parent || null
        for (var i = 0, el; el = data[i++]; ) {
            if (Array.isArray(el.options)) {
                ret.push({
                    label: el.label,
                    value: el.value,
                    enable: ensureBool(el.enable, true),
                    group: true,
                    parent: parent,
                    toggle: true
                })
                getDataFromOption(el.options, ret, el)
            } else {
                if(typeof el === "string") {
                    el = {
                        label: el,
                        value: el,
                        title: el
                    }
                }
                ret.push({
                    label: el.label,
                    value: el.value,
                    title: el.title,
                    enable: ensureBool(parent && parent.enable, true) && ensureBool(el.enable, true),
                    group: false,
                    parent: parent,
                    data: el,           //只有在dataModel的模式下有效
                    toggle: true
                })
            }
        }

        return ret
    }
    function getFragmentFromData(data) {
        var ret = document.createDocumentFragment(), parent, node
        for (var i = 0, el; el = data[i++]; ) {
            if (el.group) {
                node = document.createElement("optgroup")
                node.label = el.label
                node.disabled = !el.enable
                ret.appendChild(node)
                parent = node
            } else {
                node = document.createElement("option")
                node.text = el.label
                node.value = el.value
                node.disabled = !el.enable
                if (el.parent && parent) {
                    parent.appendChild(node)
                } else {
                    ret.appendChild(node)
                }
            }
        }
        return ret
    }

    function ensureBool(value, defaultValue) {
        return typeof value === "boolean" ? value : defaultValue
    }

    //从页面的模板提取数据源, option元素的value会进一步被处理
    //label： option或optgroup元素显示的文本
    //value: 其value值，没有取innerHTML
    //enable: 是否可用
    //group: 对应的元素是否为optgroup
    //parent: 是否位于分组内，是则为对应的对象
    function getDataFromHTML(select, arr, parent) {
        var ret = arr || []
        var elems = select.children
        parent = parent || null
        for (var i = 0, el; el = elems[i++]; ) {
            if (el.nodeType === 1) {//过滤注释节点
                if (el.tagName === "OPTGROUP") {
                    parent = {
                        label: el.label,
                        value: "",
                        enable: !el.disabled,
                        group: true,        //group不能添加ui-state-active
                        parent: false,
                        toggle: true
                    }
                    ret.push(parent)
                    getDataFromHTML(el, ret, parent)
                } else if (el.tagName === "OPTION") {
                    ret.push({
                        label: el.label.trim()||el.text.trim()||el.value.trim(), //IE9-10有BUG，没有进行trim操作
                        title: el.title.trim(),
                        value: parseData(el.value.trim()||el.text.trim()),
                        enable: ensureBool(parent && parent.enable, true) && !el.disabled,
                        group: false,
                        parent: parent,
                        toggle: true
                    })
                }
            }
        }
        return ret
    }

    /**
     * 在用户使用键盘上下箭头选择选项时，需要跳过被禁用的项，即向上或者向下找到非禁用项
     * @param data 用来选择的数据项
     * @param index 当前index
     * @param direction {Boolean} 方向，true为下，false为上，默认为上
     * @return ret 使用的项在数组中的下标
     */
    function getEnableOption(data, index, direction) {
        var size = data.size(),
            left = [],
            right = [],
            dataItem = {},
            i,
            ret

        //将data用index分成两段
        //当向上选择时，选择从左段的队尾到右段的队头
        //当向下选择时，选择从右端的对头到左段的队尾
        for(i = 0; i < index; i ++) {
            dataItem = data[i]
            if(dataItem.enable && !dataItem.group && dataItem.toggle) {
                left.push(i)
            }
        }
        for(i = index + 1; i < size; i ++) {
            dataItem = data[i]
            if(dataItem.enable && !dataItem.group && dataItem.toggle) {
                right.push(i)
            }
        }
        if(left.length === 0 && right.length === 0) {
            ret = null
        }else if(direction) {
            ret = right.length > 0? right.shift(): left.shift()
        } else {
            ret = left.length > 0? left.pop(): right.pop()
        }

        return ret
    }

    var hasAttribute = document.documentElement.hasAttribute ? function(el, attr) {
        return el.hasAttribute(attr)
    } : function(el, attr) {//IE67
        var outer = el.outerHTML, part = outer.slice(0, outer.search(/\/?['"]?>(?![^<]*<['"])/));
        return new RegExp("\\s" + attr + "\\b", "i").test(part);
    }
    return avalon;

    /**
     * 获取元素节点的所有兄弟节点
     * @param n
     * @returns {Array}
     */
    function siblings( n) {
        var r = [];

        for ( ; n; n = n.nextSibling ) {
            if ( n.nodeType === 1) {
                r.push( n );
            }
        }

        return r;
    }

});

/**
 @links
 
[使用html配置multiple组件](avalon.dropdown.ex16.html)
 [使用html配置multiple组件](avalon.dropdown.ex1.html)
 [使用html配置multiple并使用双工绑定](avalon.dropdown.ex2.html)
 [使用option配置multiple并使用双工绑定](avalon.dropdown.ex3.html)
 [使用html配置dropdown组件](avalon.dropdown.ex4.html)
 [使用html配置dropdown并使用双工绑定](avalon.dropdown.ex5.html)
 [使用option配置dropdown并使用双工绑定](avalon.dropdown.ex6.html)
 [dropdown disabled](avalon.dropdown.ex7.html)
 [dropdown readOnly](avalon.dropdown.ex8.html)
 [options可以使用repeat生成](avalon.dropdown.ex9.html)
 [更改模板，使用button作为触发器](avalon.dropdown.ex10.html)
 [异步渲染组件的选项](avalon.dropdown.ex11.html)
 [联动的dropdown](avalon.dropdown.ex12.html)
 [dropdown状态保持功能](avalon.dropdown.ex13.html)
 [多个dropdown共享状态](avalon.dropdown.ex14.html)
 [鼠标移入移出下拉菜单自动显示隐藏](avalon.dropdown.ex15.html)
 */
