define(['../avalon',
    'text!./avalon.switchdropdown.html',
    '../dropdown/avalon.dropdown',
    '../avalon.getModel',
    'css!./avalon.switchdropdown.css'], function(avalon, tmpl) {

    /**
     * 默认的switch item
     * @type {Array}
     * value: option的值
     * label: option的label
     * cls: option webfont的样式
     * title: option的title
     * font: option webfont的字符
     */
    var defaultData = [{
            value: 1,
            label : ' 启用',
            cls: 'g-icon-start',
            title: '启用',
            font: '&#xf111;'
        },
        {
            value: 2,
            label : ' 暂停',
            cls: 'g-icon-pause',
            title: '暂停',
            font: '&#xf04c;'
        }];

    //使用switchdropdown做代理，包装option，内部使用dropdown组件实现
    var widget = avalon.ui.switchdropdown = function(element, data, vmodels) {

        var options = data.switchdropdownOptions;

        //mix defaultData, getDataFromHTML, options.data
        options.data = setItemLabel( avalon.mix(true, defaultData, getDataFromHTML(element), options.data) );
        options.value = options.data[0].value;
        var vmodel = avalon.define('switchdropdown' + setTimeout("1"), function(vm) {
            vm.$opts = options;
        });
        avalon(element).attr('ms-widget', ['dropdown', data.switchdropdownId, '$opts'].join());

        //由于对数据做预先处理，使用option模式传递数据，将element的内容清空
        element.innerHTML = "";
        avalon.scan(element, [vmodel].concat(vmodels));
        return vmodel;
    };

    function getDataFromHTML(select, arr, parent) {
        var ret = arr || []
        var elems = select.children
        parent = parent || null
        for (var i = 0, el; el = elems[i++]; ) {
            if (el.nodeType === 1) {//过滤注释节点
                if (el.tagName === "OPTION") {
                    ret.push({
                        label: ' ' + el.text.trim(), //IE9-10有BUG，没有进行trim操作
                        title: el.title.trim(),
                        value: parseData(avalon(el).val()),
                        enable: !el.disabled,
                        group: false,
                        parent: parent
                    });
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
            item.label = ['<i class="ui-icon ', item.cls, '">', item.font, '</i>', item.label].join('');
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
        width: 100,             //自定义宽度
        listWidth: 100,         //自定义下拉列表的宽度
        height: 60,             //下拉列表的高度
        enable: true,           //组件是否可用
        readOnly: false,        //组件是否只读
        data: [],               //下拉列表显示的数据模型
        value: '',              //设置组件的初始值
        getTemplate: function() {
            return tmpl;
        }
    };


});