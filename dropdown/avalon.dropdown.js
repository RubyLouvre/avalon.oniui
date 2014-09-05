define(["avalon",
    "text!./avalon.dropdown.html",
    "../avalon.getModel",
    "../scrollbar/avalon.scrollbar",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.dropdown.css"
], function(avalon, template) {


    var styleReg = /^(\d+).*$/;

    var widget = avalon.ui.dropdown = function(element, data, vmodels) {
        var $element = avalon(element),
            elemParent = element.parentNode,
            options = data.dropdownOptions,
            hasBuiltinTemplate = true, //标志是否通过model值构建下拉列表
            dataSource,
            dataModel,
            templates, titleTemplate, listTemplate,
            scrollHandler,
            resizeHandler;

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

        avalon(element).css('display', 'none');

        //转换option
        _buildOptions(options);
        for (var i = 0, n = dataModel.length; i < n; i++) {
            if (dataModel[i].value == options.value) {
                options.activeIndex = i
                options.currentOption = dataModel[i];
                break;
            }
        }
        var titleNode, listNode;
        var vmodel = avalon.define(data.dropdownId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "duplexName", "menuNode", "dropdownNode"];
            vm.widgetElement = element;
            vm.menuWidth = "auto";   //下拉列表框宽度
            vm.menuHeight = vm.height;  //下拉列表框高度
            vm.dataSource = dataSource;    //源节点的数据源，通过dataSource传递的值将完全模拟select
            vm.data = dataModel;           //下拉列表的渲染model
            vm.focusClass =  false
            vm.$init = function() {
                if (vmodel.data.length === 0) {
                    throw new Error("the options is not enough for init a dropdown!");
                }
                //根据multiple的类型初始化组件
                if (vmodel.multiple) {
                    //创建菜单
                    listNode = createListNode();
                    elemParent.insertBefore(listNode, element);
                } else {//如果是单选
                    var title, defaultOption;
                    titleNode = avalon.parseHTML(titleTemplate);
                    title = titleNode.firstChild;
                    elemParent.insertBefore(titleNode, element);
                    titleNode = title;

                    if (typeof vmodel.value === "undefined") {
                        defaultOption = vmodel.data.filter(function(option) {
                            return !option.group
                        })[0];

                        vmodel.value = defaultOption.value;
                    } else {
                        defaultOption = vmodel.data.filter(function(option) {
                            return option.value === vmodel.value[0];
                        })[0];
                    }

                    //设置title宽度
                    vmodel.titleWidth = computeTitleWidth();
                }

                //设置label值
                setLabelTitle(vmodel.value);

                //如果原来的select没有子节点，那么为它添加option与optgroup
                if (!hasBuiltinTemplate) {
                    element.appendChild(getFragmentFromData(dataModel));
                    avalon.each(["multiple", "size"], function(i, attr) {
                        avalon(element).attr("ms-attr-" + attr, attr);
                    });
                }

                avalon.ready(function() {
                    avalon.scan(element.previousSibling, [vmodel].concat(vmodels));
                    $element.attr("ms-enabled", "enable");
                    $element.attr('ms-duplex', "value");
                    avalon.scan(element, [vmodel].concat(vmodels));
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                });

                if (!vmodel.multiple) {
                    var duplexName = (element.msData["ms-duplex"] || "").trim(),
                        duplexModel;

                    if (duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                        duplexModel[1].$watch(duplexModel[0], function(newValue) {
                            vmodel.value = newValue;
                        })
                        vmodel.$watch("value", function(newValue) {
                            duplexModel[1][duplexModel[0]] = newValue
                        })
                    }
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

                //同步readOnly
                var readOnlyAttr = vmodel.readonlyAttr,
                    readOnlyModel;

                if(readOnlyAttr && (readOnlyModel = avalon.getModel(readOnlyAttr, vmodels))) {
                    readOnlyModel[1].$watch(readOnlyModel[0], function(n) {
                        vmodel.readOnly = n;
                    });
                    vmodel.readOnly = readOnlyModel[1][readOnlyModel[0]];
                }

            }

            vm.$remove = function() {
                if (scrollHandler) {
                    avalon.unbind(window, "scroll", scrollHandler);
                }
                if (resizeHandler) {
                    avalon.unbind(window, "resize", resizeHandler);
                }
                vmodel.toggle = false;
                listNode && vmodel.container.removeChild(listNode);
                avalon.log("dropdown $remove")
            }


            vm._select = function(index, event) {
                var option = vm.data[index].$model;
                if (option && option.enable && !option.group) {
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
                    vmodel.currentOption = option;
                    vmodel.toggle = false;
                    if(avalon.type(vmodel.onSelect) === "function") {
                        vmodel.onSelect.call(this, event, vmodel.value);
                    }
                }
            };

            vm._listClick = function(event) {
                event.stopPropagation();
                event.preventDefault();
            };

            vm._keydown = function(event) {

                //如果是单选下拉框，可以通过键盘移动
                if (!vmodel.multiple) {

                    var index = vm.activeIndex || 0
                    var max = vmodel.data.size()
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
                            index = index - 1
                            if (index < 0) {
                                index = max - 1
                            }
                            vm.value = vm.data[index].value
                            vmodel.activeIndex = index
                            break;
                        case 40:
                        case 63235: //safari 向下
                            event.preventDefault();
                            index = index + 1
                            if (index === max) {
                                index = 0
                            }
                            vm.value = vm.data[index].value
                            vmodel.activeIndex = index
                            break
                    }
                }
            }
            //下拉列表的显示依赖toggle值，该函数用来处理下拉列表的初始化，定位
            vm._toggle = function(b) {
                if (!vmodel.enable || vmodel.readOnly) {
                    vmodel.toggle = false;
                    return;
                }

                //为了防止显示时调整高度造成的抖动，将节点初始化放在改变toggle值之前
                if (!listNode) {//只有单选下拉框才存在显示隐藏的情况
                    var list;
                    listNode = createListNode();
                    list = listNode.firstChild;
                    vmodel.container.appendChild(listNode)
                    avalon.scan(list, [vmodel].concat(vmodels))
                    listNode = list
                    vmodel.menuNode = document.getElementById("menu-" + vmodel.$id)     //下拉列表框内层容器 （包裹滚动条部分的容器）
                    vmodel.dropdownNode = document.getElementById("list-" + vmodel.$id) //下拉列表框内容（有滚动条的部分）
                    vmodel.updateScrollbar();
                }

                //如果参数b不为布尔值，对toggle值进行取反
                if (typeof b !== "boolean") {
                    vmodel.toggle = !vmodel.toggle;
                    return;
                }

                if (!b) {
                    avalon.type(vmodel.onHide) === "function" && vmodel.onHide.call(this, listNode);
                } else {
                    var firstItemIndex, selectedItemIndex, value = vmodel.value;
                    if (avalon.type(value) !== "array") {
                        value = [value];
                    }

                    //计算activeIndex的值
                    if (vmodel.activeIndex == void 0) {
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
                        vmodel.activeIndex = selectedItemIndex;
                    }
                    vmodel._styleFix();
                    vmodel._position();
                    if(avalon.type(vmodel.onShow) === "function") {
                        vmodel.onShow.call(this, listNode);
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

                if(offsetParent && offsetParent.tagName !== "BODY") {
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
            }

            vm._listleave = function() {
                vmodel.__cursorInList__ = false
            };
            vm._blur = function() {
                if (!vmodel.__cursorInList__ && !vmodel.multiple && vmodel.toggle) {
                    vmodel.toggle = false;
                }
            }

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

            //利用scrollbar的样式改变修正父节点的样式
            vm._styleFix = function() {
                var MAX_HEIGHT = options.height || 200,
                    $menu = avalon(vmodel.menuNode),
                    height = vmodel.dropdownNode.scrollHeight;

                vmodel.menuWidth = vmodel.listWidth - $menu.css("borderLeftWidth").replace(styleReg, "$1") - $menu.css("borderRightWidth").replace(styleReg, "$1");
                if (height > MAX_HEIGHT) {
                    height = MAX_HEIGHT;
                } else {
                    vmodel._disabledScrollbar(true);
                }
                vmodel.menuHeight = height;
                vmodel.updateScrollbar();
            };

            //当下拉列表中的项目发生改变时，调用该函数修正显示，顺序是修正下拉框高宽 --> 滚动条更新显示 --> 定位下拉框
            vm.updateScrollbar = function() {
                var scrollbar = avalon.vmodels["scrollbar-" + vmodel.$id];
                scrollbar && scrollbar.update();
            }

            //禁用滚动条，当下拉列表的高度小于最大高度时，只显示当前高度，需要对滚动条做禁用
            vm._disabledScrollbar = function(b) {
                var scrollbar = avalon.vmodels["scrollbar-" + vmodel.$id];
                scrollbar && (scrollbar.disabled = !!b);
            }

        });

        //对data的改变做监听，由于无法检测到对每一项的改变，检测数据项长度的改变
        vmodel.data.$watch('length', function(n) {
            //当data改变时，解锁滚动条
            vmodel._disabledScrollbar(false);
            if(n > 0) {

                //当data改变时，尝试使用之前的value对label和title进行赋值，如果失败，使用data第一项
                if(!setLabelTitle(vmodel.value)) {
                    vmodel.currentOption = vmodel.data[0].$model;
                    vmodel.activeIndex = 0;
                    setLabelTitle(vmodel.value = vmodel.data[0].value)
                }
            }
        });

        vmodel.$watch("value", function(n, o) {
            setLabelTitle(n);
            //如果有onChange回调，则执行该回调
            if(avalon.type(vmodel.onChange) === "function") {
                vmodel.onChange.call(element, n, o);
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

        function _buildOptions(opt) {
            //为options添加value与duplexName
            //如果原来的select元素绑定了ms-duplex，那么取得其值作value
            //如果没有，则先从上层VM的配置对象中取，再没有则从内置模板里抽取
            var duplexName = (element.msData["ms-duplex"] || "").trim()
            var duplexModel
            if (duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                opt.value = duplexModel[1][duplexModel[0]]
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

            if (!opt.multiple && Array.isArray(opt.value)) {
                opt.value = opt.value[0] || ""
            }

            //处理data-duplex-changed参数
            var changedCallbackName = $element.attr("data-duplex-changed"),
                changedCallbackModel;    //回调函数
            if (changedCallbackName && (changedCallbackModel = avalon.getModel(changedCallbackName, vmodels))) {
                opt.changedCallback = changedCallbackModel[1][changedCallbackModel[0]]
            }
            opt.duplexName = duplexName

            //处理container
            var docBody = document.body, container = options.container;

            // container必须是dom tree中某个元素节点对象或者元素的id，默认将dialog添加到body元素
            options.container = (avalon.type(container) === "object" && container.nodeType === 1 && docBody.contains(container) ? container : document.getElementById(container)) || docBody;
        }

        /**
         * 生成下拉框节点
         * @returns {*}
         */
        function createListNode() {
            return avalon.parseHTML(listTemplate);
        }

        //设置label以及title
        function setLabelTitle(n) {
            var option = vmodel.data.$model.filter(function(item) {
                return item.value === n;
            });

            option = option.length > 0 ? option[0] : null

            if(!option) {
                avalon.log("[log] avalon.dropdown 设置label出错");
            } else {
                vmodel.label = option.label;
                vmodel.title = option.title;
            }

            return option;
        }

        //计算title的宽度
        function computeTitleWidth() {
            var title = document.getElementById("title-" + vmodel.$id),
                $title = avalon(title);
            return vmodel.width - $title.css("paddingLeft").replace(styleReg, "$1") - $title.css("paddingRight").replace(styleReg, "$1");
        }

        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        container: null, //放置列表的容器
        width: 200, //自定义宽度
        listWidth: 200, //自定义下拉列表的宽度
        titleWidth: 0,  //title部分宽度
        height: 200, //下拉列表的高度
        enable: true, //组件是否可用
        readOnly: false, //组件是否只读
        readonlyAttr: null, //readonly依赖的属性
        currentOption: null,  //组件当前的选项
        data: [], //下拉列表显示的数据模型
        textFiled: "text", //模型数据项中对应显示text的字段,可以传function，根据数据源对text值进行格式化
        valueField: "value", //模型数据项中对应value的字段
        value: [], //设置组件的初始值
        label: null, //设置组件的提示文案，可以是一个字符串，也可以是一个对象
        multiple: false, //是否为多选模式
        listClass: "",   //列表添加自定义className来控制样式
        title: "",
        titleClass: "",   //title添加自定义className来控制样式
        activeIndex: NaN,
        size: 1,
        menuNode: {},
        dropdownNode: {},
        position: true, //是否自动定位下拉列表
        onSelect: null,  //点击选项时的回调
        onShow: null,    //下拉框展示的回调函数
        onHide: null,    //下拉框隐藏的回调函数
        onChange: null,  //value改变时的回调函数
        getTemplate: function(str, options) {
            return str
        },
        onInit: avalon.noop     //初始化时执行方法
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
                    parent: parent
                })
                getDataFromOption(el.options, ret, el)
            } else {
                ret.push({
                    label: el.label,
                    value: el.value,
                    title: el.title,
                    enable: ensureBool(parent && parent.enable, true) && ensureBool(el.enable, true),
                    group: false,
                    parent: parent,
                    data: el            //只有在dataModel的模式下有效
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
                        parent: false
                    }
                    ret.push(parent)
                    getDataFromHTML(el, ret, parent)
                } else if (el.tagName === "OPTION") {
                    ret.push({
                        label: el.text.trim(), //IE9-10有BUG，没有进行trim操作
                        title: el.title.trim(),
                        value: parseData(avalon(el).val()),
                        enable: ensureBool(parent && parent.enable, true) && !el.disabled,
                        group: false,
                        parent: parent
                    })
                }
            }
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

});