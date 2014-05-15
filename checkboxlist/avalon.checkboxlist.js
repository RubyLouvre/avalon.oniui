define(["avalon.getModel", "text!./avalon.checkboxlist.html"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""];
    var cssText = arr[1].replace(/<\/?style>/g, "");
    var styleEl = document.getElementById("avalonStyle");
    var template = arr[0];
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    var widget = avalon.ui.checkboxlist = function(element, data, vmodels) {
        // 获取配置项        
        var getVMFunc = (function(data){
            return function ( name , isGetSet ) {
                if( !options[name] ) return avalon.noop;
                avalon.mix(vmodels, data);
                avalon.parseExprProxy( options[name] , vmodels , data , isGetSet ? 'duplex' : null );
                
                return data.evaluator.apply( 0 , data.args );
            }
        })(data);
        var options = data.checkboxlistOptions;
        var onfetch = getVMFunc('fetch');
        var onselect = getVMFunc('select');
        options.template = options.getTemplate(template, options);

        var vmodel = avalon.define(data.checkboxlistId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "template"];
            vm.widgetElement = element;
            vm.alltext = options.alltext !== undefined ? options.alltext : options.allText;
            // 判断是否全部选中
            vm.isAll = function() {
                var arr = vm.data.$model.map(function(obj, index){
                    return obj.value || obj.name;
                });
                var allChecked = true
                arr = Array.prototype.slice.call(arr,0);
                avalon.each(arr, function(i, key) {
                    // 通过vm.checkStatus对象来判断是否为全选中状态
                    if(!vm.checkStatus[key]) {
                        allChecked = false;
                    }
                })
                return allChecked;
            }
            // 点击全选按钮之后的回调
            vm.clickAll = function(event) {
                var checkStatus = event.target.checked;
                avalon.each(vm.checkStatus.$model, function(key, value) {
                    vm.checkStatus[key] = checkStatus;
                })
                if (options.duplex) {
                    if (checkStatus) {
                        avalon.each(vm.checkStatus.$model, function(key) {
                            // 数组不存在key时添加key
                            $dlist.ensure(key);
                        })
                    } else {
                        $dlist.clear();
                    }
                }
                // 执行onselect回调
                onselect.apply(0, [vm.data.$model, checkStatus, event.target]);
            }
            // 选中某一项之后的回调操作
            vm.clickOne = function(event,index) {
                vm.checkStatus[vm.data[index].$model.value] = event.target.checked;
                onselect.apply(0, [vm.data.$model, event.target.checked, event.target]);
            }
            vm.$init = function() {
                options.template = options.template.replace("MS_OPTIONS_DUPLEX", options.duplex);
                element.innerHTML = options.template;
                avalon.scan(element, [vmodel].concat(vmodels));
            };  
            vm.$remove = function() {
                console.log("$remove");
                element.innerHTML = "";
            };
        })
        var arr = avalon.getModel( options.duplex , [vmodel].concat(vmodels) );
        var $dlist = arr[1][arr[0]];
        element.value = $dlist.$model.join(",");
        // 为了兼容 jvalidator，将ul的value同步为duplex的值
        $dlist.$watch("length", function(newValue) { // 当选中checkbox或者全校选中时判断vmodel.all，从而判断是否选中"全选"按钮
            if (newValue == 0 ) {
                element.value = "";
            } else {
                element.value = $dlist.join(",");
            }
            avalon.nextTick(function() {
                vmodel.all = (newValue == vmodel.data.length);
            });
        })
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
                syncCheckStatus(vmodel);
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
                            if (li.tagName = "LI") {
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
                            text: (!~txt.indexOf(vmodel.allText) && txt),
                            value: input.value || txt
                        });
                    }
                break;
            }
            vmodel.data = data;
            syncCheckStatus();
        }
        /* 根据duplex的配置信息判断data中哪些选项是被选中的，哪些是不被选中的，不被选中的选项的key对应0，选中选项的key对应其在duplex中的位置取反 */
        function syncCheckStatus() {
            var modelArr = avalon.getModel(options.duplex, [vmodel].concat(vmodels));
            var duplex_list = modelArr[1][arr[0]];
            duplex_list = duplex_list && duplex_list.$model ? duplex_list.$model : [];
            var obj = {}
            avalon.each( vmodel.data.$model , function(idx,o){
                var key = o.value || o.text;
                // 按位取反运算符,实际就是原值+1取负
                obj[ key ] = ~duplex_list.indexOf(key);
            })
            vmodel.checkStatus = obj;
            vmodel.all = vmodel.isAll();
        }
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        data: [], // 所有选项值的集合，通过此数据来渲染初始视图
        all: false, // 默认不选中所有选项
        _val: [], // 默认双向绑定的变量
        duplex: "_val", // 通过此配置实现双向绑定，从而判断是否全选
        checkStatus: {}, // 通过此对象判断选框的选中状态，从而选中或者不选中对应选框
        allText: "全部", // 显示"全部"按钮，方便进行全选或者全不选操作
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
        select: "", // 通过配置select来进行选中或者不选中选框的回调操作
        getTemplate: function(tmpl, options) {
            return tmpl
        }
    }
    return avalon;
});