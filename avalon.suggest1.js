define(["avalon.getModel", "text!avalon.suggest.html"], function(avalon, sourceHTML) {

    var parseHtmlStruction = sourceHTML.split("MS_OPTION_STYLE"),
        cssText = parseHtmlStruction[1].replace(/<\/?style>/g, ""),
        styleEl = document.getElementById("avalonStyle");
    try {
        styleEl.innerHTML += cssText ;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText ;
    }
    var widget = avalon.ui.suggest = function(element, data, vmodels) {
        var $element = avalon(element),
            options = data.suggestOptions ,
            suggestHtml = avalon.parseHTML(parseHtmlStruction[0]).firstChild ;
        var vmodel = avalon.define(data.suggestId, function(vm) {
            avalon.mix(vm, options);
            vm.widgetElement = element;
            vm.searchText = "";
            vm.list = [{text: "sss"}];
            vm.toggle = false;
            vm.loading = false;
            vm.selectedIndex = 0;
            // 监控toggle值变化，当toggle为true时更新提示框尺寸
            vm.$watch('toggle', function(v) {
                if( v ) {
                    suggestHtml.style.width = options.textboxContainer.clientWidth+"px" ;
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
            if (options.changed) {
                var arr = avalon.getModel( options.changed , vmodels );
                var _onchange = vm.onchange;
                vm.onchange = function(){
                    _onchange.apply( null , arguments );
                    arr[1][arr[0]].apply( arr[1] , arguments );
                }
            }
            // 当点击input框之外的区域时，隐藏提示框?
            vm.hidepromptinfo = function(event) {
                if (!vmodel.toggle) return false;
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
                            vmodel.searchText = this.value;
                        break;
                    }
                })
                avalon.bind(options.inputElement, "blur", vm.hidepromptinfo);
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
            s( value , function( err , array ){
                vm.selectedIndex = 0;
                vm.list.removeAll();
                avalon.each( array , function( idx , val ){
                    if( typeof val == 'string' ) {
                        vm.list.push({  text : val , value : val  });
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
        inputElement : element , 
        strategy : options.suggest , 
        textboxContainer : sourceList ,
        focus : options.suggestFocus ,
        changed : options.suggestChanged
    };
    // 根据提示类型的不同提供提示信息，也就是信息的过滤方式完全由用户自己决定?
    avalon.ui["suggest"].strategies = {}
    return avalon ;
})