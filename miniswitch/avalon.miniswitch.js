//avalon 1.3.6 2014.11.06
/**
 *
 * @cnName 迷你开关型下拉框
 * @enName switchdropdown
 * @introduce
 *
 <p>基于dropdown开发的迷你开关类型的下拉框</p>
 */
define(['avalon',
    'text!./avalon.miniswitch.html',
    '../switchdropdown/avalon.switchdropdown',
    '../avalon.getModel'], function(avalon, tmpl) {

    //使用switchdropdown做代理，包装option，内部使用dropdown组件实现
    var widget = avalon.ui.miniswitch = function(element, data, vmodels) {

        var options = data.miniswitchOptions;
        var vmodel = avalon.define('miniswitch' + setTimeout("1"), function(vm) {
            vm.$opts = options;
        });
        avalon(element).attr('ms-widget', ['switchdropdown', data.miniswitchId, '$opts'].join());
        avalon.scan(element, [vmodel].concat(vmodels));
        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        width: 40,              //自定义宽度
        listWidth: 100,         //自定义下拉列表的宽度
        height: 60,             //下拉列表的高度
        enable: true,           //组件是否可用
        readOnly: false,        //组件是否只读
        data: [],               //下拉列表显示的数据模型
        value: "",              //设置组件的初始值
        getTemplate: function() {
            return tmpl;
        }
    };
});

/**
 @links
 [用空select节点生成默认组件](avalon.miniswitch.ex1.html)
 [用select结构配置组件](avalon.miniswitch.ex2.htmll)
 [用options配置组件](avalon.miniswitch.ex3.html)
 [用options配置组件并设置duplex](avalon.miniswitch.ex4.html)
 */