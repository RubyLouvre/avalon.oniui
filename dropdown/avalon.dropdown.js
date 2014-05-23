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
    function modelMatch(model, text, value) {
        avalon.each(model, function(i, item) {
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

        return model;
    }

    //根据dataSource构建数据结构
    function getSelectModel(dataSource) {
        var group = {},
            groupSeq = [],
            exportGroup = [],
            options = [],
            model = [],
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
                opts = [];
            if(item.options && item.options.length > 0) {
                groupName = item.label;
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
                    group[groupName].enable = item.enable;
                    groupSeq.push(groupName);
                }
                group[groupName] = group[groupName].concat(opts);
            } else {
                options = options.concat(opts);
            }
        });

        avalon.each(groupSeq, function(i, seq) {

            model.push({
                text: seq,
                items: false,
                divider: false,
                optGroup: true
            });
            model = model.concat(group[seq]);
            model.push({
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

        model = model.concat(options);

        return {
            optGroup: exportGroup,
            options: options,
            model: model
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
            templates, titleTemplate, listTemplate, optionsTemplate;

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

        }

        //首先扫描该元素
        avalon.scan(element, vmodels);

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

        dataSource = options.model.$model || options.model;
        modelPattern = getSource(element).length === 0;

        //数据抽取
        dataModel = getSource(element);

        if(dataModel.length === 0) {
            optionsModel = getSelectModel(dataSource);
            dataModel =  optionsModel.model;
        }

        //转换option
        _buildOptions(options);

        var vmodel = avalon.define(data.dropdownId, function(vm) {

            var titleNode, listNode, optionsNode;

            avalon.mix(vm, options);
            vm.$skipArray= ['widgetElement'];
            vm.widgetElement = element;
            vm.activeIndex = null;

            vm.dataSource = dataSource;     //源节点的数据源，通过dataSource传递的值将完全模拟select
            vm.model = dataModel;           //下拉列表的渲染model
            vm.label = '';                  //title显示文字

            //当使用options.model生成相关结构时，使用下面的model同步element的节点
            vm.optionsModel = optionsModel || {
                optGroup: [],
                options: []
            };

            //对model的改变做监听，由于无法检测到对每一项的改变，检测数据项长度的改变
            if(options.modleBind && vm.dataSource.$watch) {
                vm.dataSource.$watch('length', function() {
                    vmodel.model = getSelectModel(vmodel.dataSource.$model).model;
                });
            }

            vm.$init = function() {

                //根据multiple的类型初始化组件
                if(options.multiple) {
                    listNode = vmodel.$createListNode();
                    elemParent.insertBefore(listNode, element);
                } else {
                    var title;
                    titleNode = avalon.parseHTML(titleTemplate);
                    title = titleNode.firstChild;
                    elemParent.insertBefore(titleNode, element);
                    titleNode = title;
                    vmodel.label = vmodel.model.filter(function(option) {
                        return option.value === vmodel.value.join('');
                    })[0].label;
                }

                avalon(element).css('display', 'none');
                avalon.ready(function() {
                    avalon.scan(element.previousSibling, [vmodel].concat(vmodels));
                });

                //通过model构建的组件，需要同步select的结构
                if(modelPattern) {
                    optionsNode = avalon.parseHTML(optionsTemplate);
                    element.appendChild(optionsNode);
                    avalon.each(['autofocus', 'multiple', 'size'], function(i, attr) {
                        avalon(element).attr('ms-attr-' + attr, attr);
                    });
                    avalon(element).attr('ms-enabled', 'enable');
                    avalon.ready(function() {
                        avalon.scan(element, [vmodel].concat(vmodels));
                    });
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

                var index = vmodel.value.indexOf(option.value);
                //根据multiple区分对待
                if( index > -1) {
                    vmodel.value.splice(index, 1);
                } else if(vmodel.multiple) {
                    vmodel.value.push(option.value);
                } else {
                    vmodel.value.set(0, option.value);
                    vmodel.label = option.label;
                }

                vmodel.$toggle();
            };

            vm.$createListNode = function() {
                return avalon.parseHTML(listTemplate);
            };

            vm.$toggle = function() {
                var $titleNode = avalon(titleNode)

                if(!listNode) {
                    var list;
                    listNode = vm.$createListNode();
                    list = listNode.firstChild;
                    document.body.appendChild(listNode);
                    avalon.scan(list, [vmodel].concat(vmodels));
                    listNode = list;
                }

                var $listNode = avalon(listNode);

                if(vmodel.toggle) {
                    $listNode.css({
                        display: 'none'
                    });
                } else {
                    vmodel.$position();
                    $listNode.css({
                        display: 'block'
                    });
                }

                vmodel.toggle = !vmodel.toggle;
            };

            vm.toggle = false;

            vm.$position = function() {
                var $titleNode = avalon(titleNode);
                //计算浮层当前位置，对其进行定位，默认定位正下方
                //获取title元素的尺寸及位置
                var offset = $titleNode.offset(),
                    outerHeight = $titleNode.outerHeight(true),
                    $listNode = avalon(listNode),
                    listHeight = $listNode.outerHeight(true),
                    $document = avalon(document),
                    css = {};

                //计算浮层的位置
                if(offset.top + outerHeight + listHeight > $document.scrollTop() + $document.height() && offset.top - listHeight > $document.scrollTop() ) {
                    css.top = offset.top - listHeight;
                } else {
                    css.top = offset.top + outerHeight;
                }

                css.left = offset.left;

                //显示浮层
                $listNode.css(css);
            };

            vm.$remove = function() {};

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
                return vmodel.value.indexOf(value) > -1;
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
        readonly: false,        //组件是否只读
        model: [],              //下拉列表显示的数据模型
        textFiled: 'text',      //模型数据项中对应显示text的字段,可以传function，根据数据源对text值进行格式化
        valueField: 'value',    //模型数据项中对应value的字段
        value: [],              //设置组件的初始值
        label: null,            //设置组件的提示文案，可以是一个字符串，也可以是一个对象
        autofocus: false,       //是否自动获取焦点
        multiple: false,        //是否为多选模式
        size: 1,                //多选模式下显示的条数
        getTemplate: function(str, options) {
            return str
        }
    };

    return avalon;

});