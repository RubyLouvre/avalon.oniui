define(["../avalon.getModel", "text!./avalon.checkboxlist.html", "css!../chameleon/oniui-common.css", "css!./avalon.checkboxlist.css"], function(avalon, template) {

    var widget = avalon.ui.checkboxlist = function(element, data, vmodels) {
        var options = data.checkboxlistOptions,
            fetchVM = typeof options.fetch === "string" ? avalon.getModel(options.fetch, vmodels) : options.fetch,
            fetchFunc = fetchVM && avalon.type(fetchVM) === "array" && fetchVM[1][fetchVM[0]] || options.fetch || null,
            onSelectVM = typeof options.onSelect === "string" ? avalon.getModel(options.onSelect, vmodels) : false,
            onSelect = onSelectVM && onSelectVM[1][onSelectVM[0]] || avalon.noop,
            onfetch = avalon.type(fetchFunc) === "function" ? fetchFunc : null;
        
        var vmodel = avalon.define(data.checkboxlistId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "template", "keys"];
            vm.widgetElement = element;
            vm.keys = [];
            // 点击全选按钮之后的回调
            vm._clickAll = function(event) {
                setTimeout(function() {
                    var checkStatus = event.target.checked;
                    if (checkStatus) {
                        duplexVM[1][duplexVM[0]] = vmodel.keys.map(function(el) {
                            return el + ""
                        });
                    } else {
                        duplexVM[1][duplexVM[0]].clear()
                    }
                    // 执行onselect回调
                    onSelect.apply(0, [vm.data.$model, checkStatus, event.target]);
                }, 20)
            }
            // 选中某一项之后的回调操作
            vm._clickOne = function(event,index) {
                onSelect.apply(0, [vm.data.$model, event.target.checked, event.target]);
            }
            vm.$init = function() {
                var temp = template.replace("MS_OPTIONS_DUPLEX", options.duplex);
                vmodel.template = vmodel.getTemplate(temp, options);
                element.className += " ui-checkboxlist ui-checkboxlist-list ui-helper-clearfix";
                element.innerHTML = vmodel.template;
                avalon.scan(element, [vmodel].concat(vmodels));
                if(typeof options.onInit === "function" ){
                    //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            };  
            vm.$remove = function() {
                element.innerHTML = "";
            };
        })
        var duplexVM = avalon.getModel(options.duplex, [vmodel].concat(vmodels)),
            duplexArr = duplexVM && duplexVM[1][duplexVM[0]]

        vmodel.data.$watch("length", function(len) {
            if (len) {
                setKeys(vmodel, duplexArr)
            }
        })
        
        if (!duplexArr) {
            throw new Error("未配置duplex")
        }
        element.value = duplexArr.$model.join(",");
        // 为了兼容 jvalidator，将ul的value同步为duplex的值
        duplexArr.$watch("length", function(newValue) { // 当选中checkbox或者全校选中时判断vmodel.all，从而判断是否选中"全选"按钮
            if (newValue == 0 ) {
                element.value = "";
            } else {
                element.value = duplexVM[1][duplexVM[0]].join(",");
            }
            vmodel.all = (newValue == vmodel.data.length);
        })
        if (vmodel.data.length) {
            setKeys(vmodel, duplexArr)
            return vmodel
        }
        if (options.fetch) {
            /*
                通过回调返回数据，数据结构必须是
                [
                    { text : A , value : B , extra : C , ... }
                ]
                以 text 作为每一个选项的文字，value 为选项的值，如果没有则直接使用 text
            */
            // 取到数据之后进行视图的渲染
            onfetch.apply(0, [function(data) {
                vmodel.data = data;
                var data = [];
                
                avalon.each(vmodel.data, function(index, item) {
                    data.push(item.value || item.text);
                })
                vmodel.keys = data;
            }])
        } else {
            var fragment = document.createElement("div");
            while(element.firstChild) {
                fragment.appendChild(element.firstChild);
            }
            switch (options.type) {
                // 配置了type为week的话，使用组件默认的提供的data
                case "week":
                    var data = [
                        { text : '周一' , value : 'MONDAY' } ,
                        { text : '周二' , value : 'TUESDAY' } ,
                        { text : '周三' , value : 'WEDNESDAY' } ,
                        { text : '周四' , value : 'THURSDAY' } ,
                        { text : '周五' , value : 'FRIDAY' } ,
                        { text : '周六' , value : 'SATURDAY' } ,
                        { text : '周日' , value : 'SUNDAY' }
                    ];
                break;
                default:
                    // 既未配置fetch自取data，也没配置type使用默认的data，就需要通过页面提供的html抽取出data
                    var inputs = fragment.getElementsByTagName("input");
                    var data = [];
                    for (var i=0; i<inputs.length; i++) {
                        var input = inputs[i],
                            li = input.parentNode,
                            txt = "";
                        // 获取离input最近的父级li元素
                        while(li) {
                            if (li.tagName == "LI") {
                                break;
                            } else {
                                li = li.parentNode;
                            }
                        }
                        txt = li.textContent || li.innerText;
                        // trim掉li元素中文本两边的空格
                        txt.replace(/^\s+/, "").replace(/\s+$/,"");
                        // 将提取出来的数据保存在data中
                        data.push({
                            text: txt,
                            value: input.value || txt
                        });
                    }
                break;
            }
            vmodel.data = data;
        }
        return vmodel;
    }
    function setKeys(vmodel, duplexVM) {
        var data = [],
            allChecked = true
        duplexVM = duplexVM && duplexVM.$model
        avalon.each(vmodel.data, function(index, item) {
            data.push(item.value || item.text);
        })
        vmodel.keys = data;
        avalon.each(data, function(index, item) {
            if (duplexVM.indexOf(item) === -1) {
                allChecked = false
            }
        })
        vmodel.all = allChecked
    }
    widget.version = 1.0
    widget.defaults = {
        data: [], // 所有选项值的集合，通过此数据来渲染初始视图
        all: false, // 默认不选中所有选项
        alltext: "全部", // 显示"全部"按钮，方便进行全选或者全不选操作
        type: "" , // 内置type为week时的data，用户只需配置type为week即可显示周一到周日的选项 
        /*
            通过配置fetch来获得要显示的数据，数据格式必须如下所示：
             [
                { text : '文字1' , value : 'w1' } ,
                { text : '文字2' , value : 'w2' } ,
                { text : '文字3' , value : 'w3' } ,
                { text : '文字4' , value : 'w4' }
            ]
        */
        fetch: "", 
        template: "",
        onSelect: avalon.noop, // 通过配置onSelect来进行选中或者不选中选框的回调操作
        getTemplate: function(tmpl, options) {
            return tmpl
        },
        vertical: true
    }
    return avalon;
});