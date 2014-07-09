define(['avalon',
    'text!./avalon.miniswitch.html',
    '../switchdropdown/avalon.switchdropdown',
    'avalon.getModel'], function(avalon, tmpl) {

    //使用switchdropdown做代理，包装option，内部使用dropdown组件实现
    var widget = avalon.ui.miniswitch = function(element, data, vmodels) {

        var options = data.miniswitchOptions;
        var vmodel = avalon.define('miniswitch' + setTimeout("1"), function(vm) {
            vm.$opts = options;
        });
        avalon(element).attr('ms-widget', ['switchdropdown', data.miniswitchId, '$opts'].join());

        //由于对数据做预先处理，使用option模式传递数据，将element的内容清空
        element.innerHTML = "";
        avalon.scan(element, [vmodel].concat(vmodels));
        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        width: 40,              //自定义宽度
        listWidth: 100,         //自定义下拉列表的宽度
        height: 44,             //下拉列表的高度
        enable: true,           //组件是否可用
        readOnly: false,        //组件是否只读
        data: [],               //下拉列表显示的数据模型
        value: '',              //设置组件的初始值
        getTemplate: function() {
            return tmpl;
        }
    };

});