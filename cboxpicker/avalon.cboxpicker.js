define(["avalon.getModel", "text!./avalon.cboxpicker.html"], function(avalon, sourceHTML) {
    var widget = avalon.ui.cboxpicker = function(element, data, vmodels) {
        var getVMFunc = (function(data){
            return function ( name , isGetSet ) {
                if( !options[name] ) return avalon.noop;
                avalon.parseExprProxy( options[name] , vmodels , data , isGetSet ? 'duplex' : null );
                return data.evaluator.apply( 0 , data.args );
            }
        })(data);
        var options = data.cboxpickerOptions;
        var arr = avalon.getModel( options.duplex , vmodels );
        var $dlist = arr[1][arr[0]];
        var onfetch = getVMFunc('fetch');
        var onselect = getVMFunc('select');

        element.value = $dlist.$model.join(",");
        var vmodel = avalon.define(data.cboxpickerId, function(vm) {
            avalon.mix(vm, options);
            vm.widgetElement = element;
            // checkStatus中key分别代表每个选项，选中的选项对应key的value非0，没选中的value为0或者false
            vm.checkStatus = {};
            vm.inputduplex = arr[0];
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
            vm.click_all = function(event) {
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
                onselect.apply(0, [vm.data.$model, checkStatus]);
            }
            // 选中某一项之后的回调操作
            vm.click_one = function(event,index) {
                vm.checkStatus[vm.data[index].$model.value] = event.target.checked;
                vm.all = vmodel.isAll();
                onselect.apply(0, [vm.data.$model, event.target.checked]);
            }
            vm.$init = function() {
                var cboxpickerHTML = avalon.parseHTML(sourceHTML);
                var liHTML = cboxpickerHTML.lastChild;
                var input = liHTML.getElementsByTagName("input")[0];
                input.setAttribute("ms-duplex-text", arr[0]);
                avalon.clearHTML(element).appendChild(cboxpickerHTML);
                avalon.scan(element, [vmodel].concat(vmodels));
            };  
            vm.$remove = function() {
                element.innerHTML = "";
            };
        })
        // 为了兼容 jvalidator，将ul的value同步为duplex的值
        $dlist.$watch("length", function(newValue) {
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
            onfetch.apply(0, [function(data) {
                vmodel.data = data;
                syncCheckStatus(vmodel);
                xssFilter(vmodel);
            }])
        } else {
            var fragment = document.createElement("div");
            while(element.firstChild) {
                fragment.appendChild(element.firstChild);
            }
            switch (options.type) {
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
                    var inputs = fragment.getElementsByTagName("input");
                    var data = [];
                    for (var i=0; i<inputs.length; i++) {
                        var input = inputs[i],
                            li = input.parentNode,
                            txt = "";
                        while(li) {
                            if (li.tagName = "LI") {
                                break;
                            } else {
                                li = li.parentNode;
                            }
                        }
                        txt = li.textContent || li.innerText;
                        txt.replace(/^\s+/, "").replace(/\s+$/,"");
                        data.push({
                            text: (!~txt.indexOf(options.alltext || "全部") && txt),
                            value: input.value || txt
                        });
                    }
                break;
            }
            vmodel.data = data;
            syncCheckStatus();
            xssFilter();
        }
        function syncCheckStatus() {
            var duplex_list = getVMFunc("duplex");
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
        function excapeHTML(val) {
            // 防止grid xss注入
            var rAmp = /&/g,
                rLt = /</g,
                rGt = />/g,
                rApos = /\'/g,
                rQuot = /\"/g,
                hChars = /[&<>\"\']/;

            val = String((val === null || val === undefined) ? '' : val);
            return hChars.test(val) ?
                val
                    .replace(rAmp, '&amp;')
                    .replace(rLt, '&lt;')
                    .replace(rGt, '&gt;')
                    .replace(rApos, '&#39;')
                    .replace(rQuot, '&quot;') :
                val; 
        }
        function xssFilter() {
            avalon.each(vmodel.data, function(index, obj) {
                if (obj.text) {
                    obj.text = excapeHTML(obj.text);
                }
            })
        }
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        data: [],
        all: true,
        //duplex: "data",
        alltext: "全部",
        type: "" ,
        fetch: "",
        select: ""
    }
    return avalon;
});