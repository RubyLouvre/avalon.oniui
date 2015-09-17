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
        avalon(element).attr('ms-widget', ['switchdropdown', data.miniswitchId, '$opts'].join());
        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        width: 40,              //@config 自定义宽度
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
 [用空select节点生成默认组件](avalon.miniswitch.ex1.html)
 [用select结构配置组件](avalon.miniswitch.ex2.html)
 [用options配置组件](avalon.miniswitch.ex3.html)
 [用options配置组件并设置duplex](avalon.miniswitch.ex4.html)
 */