define(['avalon',
    'text!./avalon.dropdown.html',
    'avalon.getModel',
    'scrollbar/avalon.scrollbar',
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


        function _buildOptions(opt) {
            //为options添加value与duplexName
            //如果原来的select元素绑定了ms-duplex，那么取得其值作value
            //如果没有，则先从上层VM的配置对象中取，再没有则从内置模板里抽取
            var duplexName = (element.msData['ms-duplex'] || '').trim()
            var duplexModel
            if (duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                opt.value = duplexModel[1][duplexName]

            } else if (!hasBuiltinTemplate) {
                if (!Array.isArray(opt.value)) {
                    opt.value = [opt.value || '']
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

            opt.label = opt.value + ""
            opt.duplexName = duplexName
        }

        //将元素的属性值copy到options中
        "autofocus,multiple,size".replace(avalon.rword, function(name) {
            if (hasAttribute(element, name)) {
                options[name] = element[name]
            }
        })
        //将元素的属性值copy到options中
        options.enable = !element.disabled

        //读取template
        templates = options.template = options.getTemplate(template, options)
            .replace(/MS_OPTION_ID/g, data.dropdownId).split('MS_OPTION_TEMPLATE')
        titleTemplate = templates[0]
        listTemplate = templates[1]

        dataSource = options.data.$model || options.data

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
            vm.$skipArray = ['widgetElement', 'duplexName', "menuNode", "dropdownNode"];
            vm.widgetElement = element;


            vm.dataSource = dataSource;    //源节点的数据源，通过dataSource传递的值将完全模拟select
            vm.data = dataModel;           //下拉列表的渲染model

            vm.$init = function() {
                if (vmodel.data.length === 0) {
                    throw new Error('the options is not enough for init a dropdown!');
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

                    if (typeof vmodel.value === 'undefined') {
                        defaultOption = vmodel.data.filter(function(option) {
                            return !option.group
                        })[0];

                        vmodel.value = defaultOption.value;
                    } else {
                        defaultOption = vmodel.data.filter(function(option) {
                            return option.value === vmodel.value[0];
                        })[0];
                    }
                }

                //如果原来的select没有子节点，那么为它添加option与optgroup
                if (!hasBuiltinTemplate) {
                    element.appendChild(getFragmentFromData(dataModel));
                    avalon.each(['autofocus', 'multiple', 'size'], function(i, attr) {
                        avalon(element).attr('ms-attr-' + attr, attr);
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
                    var duplexName = (element.msData['ms-duplex'] || "").trim(),
                        duplexModel;

                    if (duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                        duplexModel[1].$watch(duplexName, function(newValue) {
                            vmodel.value = newValue;
                        })
                        vmodel.$watch('value', function(newValue) {
                            duplexModel[1][duplexName] = newValue
                        })
                    }
                }
            }

            vm.$remove = function() {
                if (scrollHandler) {
                    avalon.unbind(window, 'scroll', scrollHandler);
                }
                if (resizeHandler) {
                    avalon.unbind(window, 'resize', resizeHandler);
                }
                vmodel.toggle = false;
                avalon.log("dropdown $remove")

            }


            vm._select = function(index, event) {
                var option = vm.data[index]
                if (!option || !option.enable || option.group) {
                    return;
                }
                event.stopPropagation()
                event.preventDefault()
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
                vmodel.label = vmodel.value + ""
                vmodel.toggle = false;
                vmodel.onSelect.call(this, event, listNode)
                titleNode && titleNode.focus()
            }

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

            vm._toggle = function(b) {
                if (!vmodel.enable || vmodel.readOnly) {
                    vmodel.toggle = false;
                    return;
                }
                if (typeof b !== 'boolean') {
                    vmodel.toggle = !vmodel.toggle;
                    return;
                }
                if (!listNode) {//只有单选下拉框才存在显示隐藏的情况
                    var list;
                    listNode = createListNode();
                    list = listNode.firstChild;
                    document.body.appendChild(listNode)
                    avalon.scan(list, [vmodel].concat(vmodels))
                    listNode = list
                    vmodel.menuNode = document.getElementById("menu-" + vmodel.$id)
                    vmodel.dropdownNode = document.getElementById("list-" + vmodel.$id)
                }
                var $listNode = avalon(listNode);
                if (!b) {
                    $listNode.css({
                        display: 'none'
                    });
                } else {
                    var firstItemIndex, selectedItemIndex, value = vmodel.value;

                    vmodel.$styleFix();

                    if (avalon.type(value) !== 'array') {
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
                    vmodel._position();
                    $listNode.css({
                        display: 'block'
                    });
                    var scrollbar = avalon.vmodels["scrollbar-" + vmodel.$id];
                    scrollbar && scrollbar.update();
                    titleNode && titleNode.focus();
                }
            };



            vm.$watch('toggle', function(b) {
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
                    css = {};

                while ($sourceNode.element && $sourceNode.element.nodeType != 1) {
                    $sourceNode = avalon($sourceNode.element.nextSibling);
                }

                //计算浮层的位置
                if (options.position && offset.top + outerHeight + listHeight > $window.scrollTop() + $window.height() && offset.top - listHeight > $window.scrollTop()) {
                    css.top = offset.top - listHeight;
                } else {
                    css.top = offset.top + outerHeight;
                }

                //修正由于边框带来的重叠样式
                css.top = css.top - $sourceNode.css('borderBottomWidth').replace(styleReg, '$1');
                css.left = offset.left;

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
                    vmodel.toggle = false
                }
            }

            vm.val = function(newValue) {
                if (typeof newValue !== 'undefined') {
                    if (avalon.type(newValue) !== 'array') {
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
            vm.$styleFix = function() {
                var MAX_HEIGHT = 200,
                    $menu = avalon(vmodel.menuNode),
                    $dropdown = avalon(vmodel.dropdownNode),
                    height = $dropdown.height(),
                    css = {};

                css.width = vmodel.listWidth - $menu.css('borderLeftWidth').replace(styleReg, '$1') - $menu.css('borderRightWidth').replace(styleReg, '$1');
                if (height > MAX_HEIGHT) {
                    height = MAX_HEIGHT;
                }
                css.height = height;

                $menu.css(css)
            };

        });

        //对model的改变做监听，由于无法检测到对每一项的改变，检测数据项长度的改变
        if (options.modleBind && vmodel.dataSource.$watch) {
            vmodel.dataSource.$watch('length', function() {
                vmodel.data = getDataFromOption(vmodel.dataSource.$model).data;
            });
        }
        // update scrollbar, if data changed
        vmodel.data.$watch('length', function() {
            var scrollbar = avalon.vmodels["scrollbar-" + vmodel.$id];
            scrollbar && scrollbar.update();
        })

        function createListNode() {
            return avalon.parseHTML(listTemplate);
        }

        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        width: 200, //自定义宽度
        listWidth: 200, //自定义下拉列表的宽度
        height: 200, //下拉列表的高度
        enable: true, //组件是否可用
        readOnly: false, //组件是否只读
        data: [], //下拉列表显示的数据模型
        textFiled: 'text', //模型数据项中对应显示text的字段,可以传function，根据数据源对text值进行格式化
        valueField: 'value', //模型数据项中对应value的字段
        value: [], //设置组件的初始值
        label: null, //设置组件的提示文案，可以是一个字符串，也可以是一个对象
        autofocus: false, //是否自动获取焦点
        multiple: false, //是否为多选模式
        activeIndex: NaN,
        size: 1,
        menuNode: {},
        dropdownNode: {},
        position: true, //是否自动定位下拉列表
        onSelect: avalon.noop, //多选模式下显示的条数
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
                    enable: ensureBool(el.enable, true),
                    group: false,
                    parent: parent
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
                        enable: !el.disabled,
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