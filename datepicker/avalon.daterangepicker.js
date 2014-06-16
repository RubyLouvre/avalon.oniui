define(["avalon.getModel","text!./avalon.daterangepicker.html", "datepicker/avalon.datepicker"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""],  
        calendarTemplate = arr[0],
        cssText = arr[1].replace(/<\/?style>/g, ""), // 组件的css
        styleEl = document.getElementById("avalonStyle");
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    var widget = avalon.ui.daterangepicker = function(element, data, vmodels) {
        var options = data.daterangepickerOptions;
        options.template = options.getTemplate(calendarTemplate, options);
        var vmodel = avalon.define(data.daterangepickerId, function(vm) {
            avalon.mix(vm, options);
            vm.msg = "";
            vm.toggle = false;
            vm._toggleDatepicker = function(val, event) {
                vmodel.toggle = !val;
            }
            vm.$init = function() {
                element.innerHTML = options.template;
                avalon.scan(element, [vmodel].concat(vmodels)); 
            }
            vm.$remove = function() {

            }
        })
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        container: null,
        fromLabel : '选择起始日期',
        toLabel : '选择结束日期',
        fromName : 'fromDate',
        toName : 'toDate',
        defaultLabel : '日期范围',
        widgetElement: "", // accordion容器
        getTemplate: function(str, options) {
            return str;
        }
    }
    return avalon;
})