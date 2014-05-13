
define(['avalon', 'text!./avalon.dropdown.html'], function(avalon, tmpl) {
    var arr = tmpl.split("MS_OPTION_STYLE");
    var cssText = arr[1].replace(/<\/?style>/g, "");
    var styleEl = document.getElementById("avalonStyle");
    var template = arr[0];
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }

    var widget = avalon.ui.dropdown = function(element, data, vmodels) {
        var $element = avalon(element),
            options = data.dropdownOptions,
            templates, titleTemplate, listTemplate;

        //将元素的属性值copy到options中
        avalon.each(['autofocus', 'multiple', 'size'], function(i, name) {
            options[name] = element[name];
        });

        options.enable = !element.disabled;

        //读取template
        templates = options.template = options.getTemplate(template).split('MS_OPTION_TEMPLATE');
        titleTemplate = templates[0];
        listTemplate = templates[1];

        //TODO 同步元素的属性到组件中
        var vmodel = avalon.define(data.dropdownId, function(vm) {

            avalon.mix(vm, options);

            vm.$skipArray= ['widgetElement'];

            vm.widgetElement = element;

            vm.model = [];

            //处理model

            vm.$init = function() {
                //根据multiple的类型初始化组件
                if(options.multiple) {

                }
            };

            vm.$remove = function() {};


        });

        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        width: null,            //自定义宽度
        listWidth: null,        //自定义下拉列表的宽度
        height: 200,            //下拉列表的高度
        enable: true,           //组件是否可用
        readonly: false,        //组件是否只读
        model: null,            //下拉列表显示的数据模型
        textFiled: 'text',      //模型数据项中对应显示text的字段,可以传function，根据数据源对text值进行格式化
        valueField: 'value',    //模型数据项中对应value的字段
        value: null,            //设置组件的初始值
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