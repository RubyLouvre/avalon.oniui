define(["../avalon.getModel", "text!./avalon.suggest.html","css!../chameleon/oniui-common.css", "css!./avalon.suggest.css"], function(avalon, sourceHTML) {
    var widget = avalon.ui.suggest = function(element, data, vmodels) {

        var $element = avalon(element),
            options = data.suggestOptions ,
            suggestHtml = avalon.parseHTML(sourceHTML).firstChild ,
            dataValue = data.value.split(","),
            suggestOptions = !dataValue[2] ? 0 : avalon.getModel( dataValue[2] , vmodels ) || 0;

        suggestOptions = !!options.notpuresuggest ? suggestOptions[1][suggestOptions[0]] : 0;
        if(suggestOptions) {
            avalon.mix(options, suggestOptions);
        }
        /**
         * 如果options.notpuresuggest为true说明是与textbox组件结合的，
         * 否则与textbox组件无关，options.inputElement就是进行自动补全的输入域节点对应的id 
         */
        options.inputElement = !!options.notpuresuggest ? options.inputElement : document.getElementById(options.inputElement);
        /**
         * 如果options.textboxContainer为空，说明此suggest组件是独立的，
         * 与textbox组件无关，下面将通过输入框的位置、大小来
         * 设置suggest提示框的position和width
        */
        options.textboxContainer = options.textboxContainer == "" ? options.inputElement : options.textboxContainer;
        var vmodel = avalon.define(data.suggestId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "puresuggest"];
            vm.widgetElement = element;
            vm.searchText = "";
            vm.list = [{text: "sss"}];
            vm.toggle = false;
            vm.loading = false;
            vm.selectedIndex = 0;
            vm._renderItem = function(item) {
                return vmodel.renderItem(item, vmodel);
            }
            
            // 监控toggle值变化，当toggle为true时更新提示框尺寸
            vm.$watch('toggle', function(v) {
                var inputElement = options.inputElement,
                    textboxContainer = options.textboxContainer,
                    $inputElement = avalon(inputElement),
                    $textboxContainer = avalon(textboxContainer);
                if( v ) {
                    if (textboxContainer === inputElement) {
                        var offset = $element.offset(),
                            suggestHtmlWidth = $inputElement.width()+"px";
                        element.style.cssText = "position: absolute; left:"+offset.left+"px;top:"+offset.top+"px;";
                        
                        suggestHtml.style.cssText = "margin:0;left:0;top:0;width:"+suggestHtmlWidth ;
                        return ;
                    }
                    suggestHtml.style.width = ($textboxContainer.outerWidth()-2)+"px" ;
                }
            })
            // 监控searchText值的变化，及时更新提示列表?
            vm.$watch('searchText',function(v){
                updateSource( v , vm);
            });
            // 当通过键盘上下箭头或者使用鼠标点击来切换提示项时触发
            vm.onchange = function(val) {
                // 如果存在双向数据绑定，则更新绑定的属性值?
                if( options.inputElement.msData && options.inputElement.msData['ms-duplex'] ) {
                    var d = options.inputElement.msData['ms-duplex'];
                    var vm = avalon.getModel( d , vmodels );
                    vm[1][vm[0]] = val;
                } else {
                    options.inputElement.value = val;
                }
            }
            // 处理提示项的鼠标点击，也就是更新input值，同时隐藏提示框?
            vm.clickcallback = function(idx, event) {
                vmodel.onchange(vmodel.list[idx].value, vmodel.list[idx].$model, event);
                vm.toggle = false;
            }
            // 如果input元素配置了suggest-focus项，则执行此条件块?
            if (options.focus) {
                // 特殊的suggest，即当searchText与input值相等时更新提示列表list，不相等时，更新searchText
                avalon.bind(options.inputElement,"focus", function(event) {
                    var v = this.value;
                    if( vmodel.searchText == v ) {
                        updateSource( v , vmodel );
                    } else {
                        vmodel.searchText = v;
                    }
                })
            }
            if (options.onChange) {
                var arr = avalon.getModel( options.onChange , vmodels );
                var _onchange = vm.onchange;
                vm.onchange = function(){
                    _onchange.apply( null , arguments );
                    arr[1][arr[0]].apply( arr[1] , arguments );
                }
            }
            // 当点击input框之外的区域时，隐藏提示框?
            vm.hidepromptinfo = function(event) {
                if (!vmodel.toggle) return false;
                /* 此判断是关键，当点击区域是在提示框上说明是在选择提示信息，隐藏提示框的操作放在提示项的click回调上处理，反之则隐藏提示框 */
                if (findParent( event.target , options.textboxContainer ) ) return;
                vmodel.toggle = false;
            };
            vm.$init = function() {
                avalon.bind(options.inputElement, "keyup", function(event) {
                    switch( event.which ) {
                        case 9:
                            if (!vmodel.toggle) return ;
                            vmodel.toggle = false;
                        break;
                        case 27:
                            if (!vmodel.toggle) return ;
                            vmodel.toggle = false;
                        break;
                        case 13:
                            event.preventDefault();
                            if (!vmodel.toggle) return ;
                            vmodel.toggle = false;
                            vmodel.onchange( vmodel.list[vmodel.selectedIndex].value , vmodel.list[vmodel.selectedIndex].$model, event );
                        break;
                        case 38:
                            // up arrow
                            if (!vmodel.toggle) return ;
                            --vmodel.selectedIndex
                            if (vmodel.selectedIndex === -1) {
                                vmodel.selectedIndex = vmodel.list.length - 1
                            }
                            vmodel.onchange( vmodel.list[vmodel.selectedIndex].value , vmodel.list[vmodel.selectedIndex].$model, event );
                        break;
                        case 40:
                            // down arrow
                            if (!vmodel.toggle) return ;
                            ++vmodel.selectedIndex
                            if (vmodel.selectedIndex === vmodel.list.length) {
                                vmodel.selectedIndex = 0
                            }
                            vmodel.onchange( vmodel.list[vmodel.selectedIndex].value , vmodel.list[vmodel.selectedIndex].$model, event );
                        break;
                        default:
                            vmodel.searchText = this.value || String.fromCharCode(event.which);
                        break;
                    }
                })
                avalon.bind(document, "click", vm.hidepromptinfo);
                avalon.nextTick(function() {
                    element.appendChild(suggestHtml);
                    avalon.scan(element, [vmodel].concat(vmodels)); 
                })
            };
            // 自动销毁
            vm.$remove = function() {
                element.innerHTML = "";
            }
        });
        function updateSource( value , vm ) {
            if( vm.loading == true ) return;
            var s = avalon.ui["suggest"].strategies[ options.strategy ];
            if( !s ) return;
            vm.loading = true;
            // 根据提示类型提供的方法过滤的数据来渲染提示视图?
            s(value, function(array){
                vm.selectedIndex = 0;
                vm.list.removeAll();
                avalon.each(array , function(idx, val){
                    if( typeof val == 'string' ) {
                        vm.list.push({text: val , value: val});
                    } else {
                        vm.list.push( val );
                    }
                })
                vm.loading = false;
                if( array.length == 0 ) {
                    vm.toggle = false;
                } else {
                    vm.toggle = true;
                }
            });
        };
        return vmodel ;
    };
    // 判断点击目标元素是否在查找元素内部，在则返回true，否则返回false
    function findParent( element , findElement ) {
        if( !element ) return false;
        if( element == findElement ) return true;
        return findParent( element.parentNode , findElement );
    }
    widget.defaults = {
        inputElement : "" , 
        strategy : "__getVal" , 
        textboxContainer : "" ,
        focus : false ,
        changed : false,
        renderItem : function(item, vmodel) {
            return item.replace(vmodel.searchText, "<b style='color:#f55'>$&</b>")
        }
    };
    // 根据提示类型的不同提供提示信息，也就是信息的过滤方式完全由用户自己决定?
    avalon.ui["suggest"].strategies = {
        __getVal: function(value, done) {
            done(value ? [
                value + "1" ,
                value + "2" ,
                value + "3" ,
                value + "4" ,
                value + "5" ,
                value + "6" ,
                value + "7" ,
                value + "8" ,
                value + "9"   
            ] : [] )
        }
    }
    return avalon ;
})