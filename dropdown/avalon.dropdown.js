define(['avalon', 'avalon.getModel', 'text!./avalon.dropdown.html'], function(avalon, $$, tmpl) {
    var arr = tmpl.split("MS_OPTION_STYLE");
    var cssText = arr[1].replace(/<\/?style>/g, "");
    var styleEl = document.getElementById("avalonStyle");
    var template = arr[0];
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }

    var MODEL_ITEM = {
        value: '',
        label: '',
        enable: true,
        item: false,
        optGroup: false,
        divider: false
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

    //根据配置中textField及valueField做数据适配
    function modelMatch(data, text, value) {
        avalon.each(data, function(i, item) {
            if(text !== 'text') {
                if(avalon.type(text) === 'function') {
                    item.text = text.call(item, item);
                } else if(text in item) {
                    item.text = item[text];
                } else {
                    throw new Error('textField设置无效！');
                }
            }
            if(value !== 'value') {
                if(value in item) {
                    item.value = item[value];
                } else {
                    throw  new Error('valueField设置无效！');
                }
            }
        });

        return data;
    }

    //根据dataSource构建数据结构
    function getSelectModel(dataSource) {
        var group = {},
            groupSeq = [],
            exportGroup = [],
            options = [],
            data = [],
            hasGroup = false;

        /**
         * item can like this:
         * {
         *    value: '',    //option的值
         *    label: '',    //option或者optGroup显示的label
         *    optGroup: '', //是否属于某个group
         *    enable: true
         * }
         * group can like this:
         * {
         *     label: '',
         *     enable: true,
         *     options: [
         *          item
         *     ]
         * }
         */
        avalon.each(dataSource, function(i, item) {
            //如果item为group，直接对group进行抽取
            //如果item为option，对option进行抽取并分割成group组
            var groupName,
                option,
                enable,
                opts = [];
            if(item.options && item.options.length > 0) {
                groupName = item.label;
                enable = item.enable;
                opts = item.options.map(function(option) {
                    return avalon.mix(true, {}, MODEL_ITEM, option, {item: true });
                });
                opts = getOption(opts);
            } else {
                groupName = item.optGroup;
                option = avalon.mix(true, {}, MODEL_ITEM, item, {item: true });
                opts.push(option);
            }

            //如果该item属于组，将该item放入组中
            if(typeof groupName !== 'undefined') {
                groupName = groupName.trim();
                hasGroup = true;
                if(!group[groupName]) {
                    group[groupName] = [];
                    groupSeq.push(groupName);
                }
                if(typeof enable === 'undefined') {
                    enable = group[groupName].enable;
                }
                //如果已经通过options传递的有enable设置，使用该设置，否则使用保存的设置
                group[groupName] = group[groupName].concat(opts);
                group[groupName].enable = typeof enable === 'undefined' ? true : enable;

            } else {
                options = options.concat(opts);
            }
        });

        avalon.each(groupSeq, function(i, seq) {

            data.push({
                text: seq,
                items: false,
                divider: false,
                optGroup: true
            });
            data = data.concat(group[seq]);
            data.push({
                items: false,
                divider: true,
                optGroup: false
            });
            exportGroup.push({
                label: seq,
                enable: group[seq].enable,
                options: group[seq]
            });
        });

        data = data.concat(options);

        return {
            optGroup: exportGroup,
            options: options,
            data: data
        };
    }

    //提取options中的数据
    function getOption(options, isDom) {
        var ret = [];

        avalon.each(options, function(i, option) {
            ret.push({
                label: option.label.trim() || option.innerHTML || "",
                value: isDom?parseData( option.value ): option.value,
                enable: isDom?!option.disabled: option.enable,
                item: true,
                divider: false,
                optGroup: false
            });
        });

        return ret;
    }

    //提取select中的数据
    function getSource(el) {
        var ret = [],
            groups = el.getElementsByTagName('optgroup'),
            options = el.getElementsByTagName('option');

        if(options.length === 0) {
            return ret;
        } else if(groups.length === 0) {
            ret = ret.concat(getOption(options, true));
        } else {
            avalon.each(groups, function(i, group) {
                var options = group.getElementsByTagName('option');
                if(options.length > 0) {
                    ret.push({
                        text: group.label,
                        enable: !group.disabled,
                        items: false,
                        divider: false,
                        optGroup: true
                    });
                    ret = ret.concat(getOption(options, true));
                    ret.push({
                        items: false,
                        divider: true,
                        optGroup: false
                    });
                }
            });
            ret = ret.concat(getOption([].filter.call(options,function(option) {
                return option.parentNode.tagName !== 'OPTGROUP';
            }), true));
        }

        return ret;
    }

    var widget = avalon.ui.dropdown = function(element, data, vmodels) {
        var $element = avalon(element),
            elemParent = element.parentNode,
            options = data.dropdownOptions,
            modelPattern = false,   //标志是否通过model值构建下拉列表
            dataSource,
            dataModel,
            optionsModel,
            templates, titleTemplate, listTemplate, optionsTemplate,
            scrollHandler,
            resizeHandler;

        //将option适配为更适合vm的形式
        function _buildOptions(opt) {
            //dropdown的valueVm有两种形式：
            // 1，未配置duplex，使用内置vm，内置vm的取值参考页面select及options.value
            // 2，配置duplex，使用duplex的数据
            var duplexName = (element.msData['ms-duplex'] || '').trim(),
                duplexModel;

            if(duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                opt.value = duplexModel[1][duplexName];
            } else if(modelPattern) {
                if(avalon.type(opt.value) !== 'array') {
                    opt.value = [opt.value || ''];
                }
            } else {
                var options = element.getElementsByTagName('OPTION');
                options = Array.prototype.filter.call(options, function(option) {
                    return option.selected;
                });
                opt.value = Array.prototype.map.call(options, function(option) {
                    return parseData(option.value);
                });
            }

            if(!opt.multiple && avalon.type(opt.value) === 'array') {
                opt.value = opt.value[0] || "";
            }

            opt.duplexName = duplexName;
        }

        //将元素的属性值copy到options中
        avalon.each(['autofocus', 'multiple', 'size'], function(i, name) {
            if(element.hasAttribute(name)) {
                options[name] = element[name];
            }
        });

        if(element.hasAttribute('disabled')) {
            options.enable = !element.disabled;
        }

        //读取template
        templates = options.template = options.getTemplate(template).split('MS_OPTION_TEMPLATE');
        titleTemplate = templates[0];
        listTemplate = templates[1];
        optionsTemplate = templates[2];
        dataSource = options.data.$model || options.data;
        modelPattern = getSource(element).length === 0;

        //数据抽取
        dataModel = getSource(element);

        if(dataModel.length === 0) {
            optionsModel = getSelectModel(dataSource);
            dataModel =  optionsModel.data;
        }

        avalon(element).css('display', 'none');

        //转换option
        _buildOptions(options);

        var vmodel = avalon.define(data.dropdownId, function(vm) {

            var titleNode, listNode, optionsNode;

            avalon.mix(vm, options);
            vm.$skipArray= ['widgetElement', 'duplexName'];
            vm.widgetElement = element;
            vm.activeIndex = null;

            vm.dataSource = dataSource;     //源节点的数据源，通过dataSource传递的值将完全模拟select
            vm.data = dataModel;           //下拉列表的渲染model
            vm.__listenter__ = false;      //是否当前鼠标在list区域

            //当使用options.model生成相关结构时，使用下面的model同步element的节点
            vm.optionsModel = optionsModel || {
                optGroup: [],
                options: []
            };

            //对model的改变做监听，由于无法检测到对每一项的改变，检测数据项长度的改变
            if(options.modleBind && vm.dataSource.$watch) {
                vm.dataSource.$watch('length', function() {
                    vmodel.data = getSelectModel(vmodel.dataSource.$model).data;
                });
            }

            vm.$init = function() {
                if(vmodel.data.length === 0) {
                    throw new Error('the options is not enough for init a dropdown!');
                }

                //根据multiple的类型初始化组件
                if(options.multiple) {
                    listNode = vmodel.$createListNode();
                    elemParent.insertBefore(listNode, element);
                } else {
                    var title, defaultOption;
                    titleNode = avalon.parseHTML(titleTemplate);
                    title = titleNode.firstChild;
                    elemParent.insertBefore(titleNode, element);
                    titleNode = title;
                    if(typeof vmodel.value === 'undefined') {
                        defaultOption =  vmodel.data.filter(function(option) {
                            return option.item === true;
                        })[0];

                        vmodel.value = defaultOption.value;
                    } else {
                        defaultOption = vmodel.data.filter(function(option) {
                            return option.value === vmodel.value[0];
                        })[0];
                    }
                    //模拟浏览器对dropdown在scroll和resize事件下的行为
                    scrollHandler = avalon.bind(window, 'scroll', function() {
                        vmodel.toggle = false;
                    });
                    resizeHandler = avalon.bind(window, 'resize', function() {
                        vmodel.toggle = false;
                    });
                }

                //通过model构建的组件，需要同步select的结构
                if(modelPattern) {
                    optionsNode = avalon.parseHTML(optionsTemplate);
                    element.appendChild(optionsNode);
                    avalon.each(['autofocus', 'multiple', 'size'], function(i, attr) {
                        avalon(element).attr('ms-attr-' + attr, attr);
                    });
                }

                avalon.ready(function() {
                    avalon.scan(element.previousSibling, [vmodel].concat(vmodels));
                    $element.attr('ms-enabled', 'enable');
                    $element.attr('ms-duplex', 'value');
                    avalon.scan(element, [vmodel].concat(vmodels));
                });

                if(!vmodel.multiple) {
                    var duplexName = (element.msData['ms-duplex'] || '').trim(),
                        duplexModel;

                    if(duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                        duplexModel[1].$watch(duplexName, function(newValue) {
                            vmodel.value = newValue;
                        });
                        vmodel.$watch('value', function(newValue) {
                            duplexModel[1][duplexName] = newValue;
                        });
                    }
                }

            };

            vm.$hover = function(e, index) {
                e.preventDefault();
                vm.activeIndex = index;
            };

            vm.$mouseleave = function() {
                vm.activeIndex = null;
            };

            vm.$select = function(e, option) {
                if(!option.enable) {
                    return;
                }
                var index;

                //根据multiple区分对待, 多选时可以为空值
                if(vmodel.multiple) {
                    index = vmodel.value.indexOf(option.value);
                    if(index > -1) {
                        vmodel.value.splice(index, 1);
                    } else {
                        vmodel.value.push(option.value);
                    }
                } else {
                    vmodel.value = option.value;
                }

                vmodel.toggle = false;
                vmodel.onSelect.call(this, e, listNode);
            };

            vm.$listenter = function() {
                vmodel.__listenter__ = true;
            };

            vm.$listleave = function() {
                vmodel.__listenter__ = false;
            };

            vm.$createListNode = function() {
                return avalon.parseHTML(listTemplate);
            };

            vm.$toggle = function(b) {
                if(!vmodel.enable || vmodel.readOnly) {
                    vmodel.toggle = false;
                    return;
                }
                if(typeof b !== 'boolean') {
                    vmodel.toggle = !vmodel.toggle;
                    return;
                }
                if(!listNode) {
                    var list;
                    listNode = vm.$createListNode();
                    list = listNode.firstChild;
                    document.body.appendChild(listNode);
                    avalon.scan(list, [vmodel].concat(vmodels));
                    listNode = list;
                }
                var $listNode = avalon(listNode);
                if(!b) {
                    $listNode.css({
                        display: 'none'
                    });
                } else {
                    vmodel.$position();
                    $listNode.css({
                        display: 'block'
                    });
                }
            };

            vm.$getLabel = function(value) {
                var v = avalon.type(value) === 'array' ? value[0] : value,
                    label = vmodel.data.filter(function(option) {
                        return option.value == v;
                    });

                if(label.length > 0) {
                    return label[0].label;
                }
            };

            vm.$watch('toggle', function(b) {
                vmodel.$toggle(b);
            });

            vm.toggle = false;

            vm.$position = function() {
                var $titleNode = avalon(titleNode);
                //计算浮层当前位置，对其进行定位，默认定位正下方
                //获取title元素的尺寸及位置
                var offset = $titleNode.offset(),
                    outerHeight = $titleNode.outerHeight(true),
                    $listNode = avalon(listNode),
                    listHeight = $listNode.height(),
                    $window = avalon(window),
                    css = {};

                //计算浮层的位置
                if(options.position && offset.top + outerHeight + listHeight > $window.scrollTop() + $window.height() && offset.top - listHeight > $window.scrollTop() ) {
                    css.top = offset.top - listHeight;
                } else {
                    css.top = offset.top + outerHeight;
                }

                css.left = offset.left;

                //显示浮层
                $listNode.css(css);
            };

            vm.$remove = function() {
                if(scrollHandler) {
                    avalon.unbind(window, 'scroll', scrollHandler);
                }
                if(resizeHandler) {
                    avalon.unbind(window, 'resize', resizeHandler);
                }
                vmodel.toggle = false;
                avalon.log("dropdown $remove")
            };

            vm.$blur = function(e) {
                if( ( !vmodel.__listenter__ || !vmodel.data[vmodel.activeIndex].enable ) && vmodel.toggle ) {
                    vmodel.toggle = false;
                }
            };

            vm.val = function(newValue) {
                if(typeof newValue !== 'undefined') {
                    if(avalon.type(newValue) !== 'array') {
                        newValue = [newValue];
                    }
                    vmodel.value = newValue;
                }
                return vmodel.value;
            };

            vm.isSelected = function( value ) {
                if(vmodel.multiple) {
                    return vmodel.value.indexOf(value) > -1;
                } else {
                    return vmodel.value === value;
                }
            };

        });

        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        width: 200,             //自定义宽度
        listWidth: 200,         //自定义下拉列表的宽度
        height: 200,            //下拉列表的高度
        enable: true,           //组件是否可用
        readOnly: false,        //组件是否只读
        data: [],              //下拉列表显示的数据模型
        textFiled: 'text',      //模型数据项中对应显示text的字段,可以传function，根据数据源对text值进行格式化
        valueField: 'value',    //模型数据项中对应value的字段
        value: [],              //设置组件的初始值
        label: null,            //设置组件的提示文案，可以是一个字符串，也可以是一个对象
        autofocus: false,       //是否自动获取焦点
        multiple: false,        //是否为多选模式
        size: 1,
        position: true,         //是否自动定位下拉列表
        onSelect: avalon.noop,               //多选模式下显示的条数
        getTemplate: function(str, options) {
            return str
        }
    };

    return avalon;

});