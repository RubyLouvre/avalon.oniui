//avalon 1.3.6 2014.11.06
/**
 *
 * @cnName 开关型下拉框
 * @enName switchdropdown
 * @introduce
 *
 <p>基于dropdown开发的开关类型的下拉框</p>
 */
define(['avalon',
    'text!./avalon.switchdropdown.html',
    '../dropdown/avalon.dropdown',
    '../avalon.getModel',
    'css!./avalon.switchdropdown.css'], function(avalon, tmpl) {

    /**
     * 默认的switch item
     * @type {Array}
     * value: option的值
     * label: option的label
     * class: option webfont的样式
     * title: option的title
     * font: option webfont的字符
     */
    var defaultData = [{
            value: 1,
            label : ' 启用',
            iconClass: 'g-icon-start',
            title: '启用',
            font: '&#xf084;',
            titleValue: ' 已启用'
        },
        {
            value: 2,
            label : ' 暂停',
            iconClass: 'g-icon-pause',
            title: '暂停',
            font: '&#xf086;',
            titleValue: ' 已暂停'
        }];

    //使用switchdropdown做代理，包装option，内部使用dropdown组件实现
    var widget = avalon.ui.switchdropdown = function(element, data, vmodels) {

        var options = data.switchdropdownOptions;
        //mix defaultData, getDataFromHTML, options.data
        options.data = setItemLabel( avalon.mix(true, [], defaultData, getDataFromHTML(element), options.data) );

        //检测options.value是否可以匹配到options.data中的选项
        //如果不能匹配，首先找到selected的选项
        //如果没有selected的选项，则把value设置为data中的第一项
        for(var preSet = options.value, value = options.data[0].value, i = 0, len = options.data.length, item; i < len; i++) {
            item = options.data[i];
            if(item.value === preSet) {
                value = preSet;
                break;
            }
            if(item.selected) {
                value = item.value;
            }
        }
        options.value = value;

        var vmodel = avalon.define('switchdropdown' + setTimeout("1"), function(vm) {
            vm.$opts = options;

            vm.$init = function(continueScan) {
                if(continueScan){
                    continueScan()
                }else{
                    avalon.log("请尽快升到avalon1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels));
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }
        });
        avalon(element).attr('ms-widget', ['dropdown', data.switchdropdownId, '$opts'].join());

        //由于对数据做预先处理，使用option模式传递数据，将element的内容清空
        element.innerHTML = "";


        return vmodel;
    };

    function getDataFromHTML(select, arr, parent) {
        var ret = arr || []
        var elems = select.children
        parent = parent || null
        for (var i = 0, el; el = elems[i++]; ) {
            if (el.nodeType === 1) {//过滤注释节点
                if (el.tagName === "OPTION") {
                    var option = {
                        label: ' ' + el.text.trim(), //IE9-10有BUG，没有进行trim操作
                        title: el.title.trim(),
                        value: parseData(avalon(el).val()),
                        enable: !el.disabled,
                        group: false,
                        selected: el.selected,
                        parent: parent
                    };
                    //设置了用于在标题处显示的文案：titleValue
                    if(avalon(el).attr("data-title-value")) {
                        option.titleValue = " " + avalon(el).attr("data-title-value").trim()
                    }
                    ret.push( option );
                    if(ret.length === 2) break;
                }
            }
        }
        return ret
    }

    //设置option的label
    function setItemLabel(items) {
        avalon.each(items, function(i, item) {
            item.text = item.label;
            item.label = ['<i class="oni-icon ', item.iconClass, '">', item.font, '</i>', item.label].join('');
            item.titleValue = ['<i class="oni-icon ', item.iconClass, '">', item.font, '</i>', item.titleValue].join('');
        });
        return items;
    }

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

    widget.version = "1.0";

    widget.defaults = {
        width: 100,             //@config 自定义宽度
        listWidth: 100,         //@config 自定义下拉列表的宽度
        height: 60,             //@config 下拉列表的高度
        enable: true,           //@config 组件是否可用
        readOnly: false,        //@config 组件是否只读
        data: [],               //@config 下拉列表显示的数据模型
        value: "",              //@config 设置组件的初始值
        /**
         * @config 模板函数,方便用户自定义模板
         * @param str {String} 默认模板
         * @param opts {Object} VM
         * @returns {String} 新模板
         */
        getTemplate: function() {
            return tmpl;
        },
        onInit: avalon.noop     //@config 初始化时执行方法
    };
});

/**
 @links
 [用空select节点使用默认配置生成组件](avalon.switchdropdown.ex1.html)
 [用html结构配置组件](avalon.switchdropdown.ex2.html)
 [用options配置组件](avalon.switchdropdown.ex3.html)
 [用options配置组件并设置duplex](avalon.switchdropdown.ex4.html)
 */