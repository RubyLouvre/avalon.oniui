define(["avalon.getModel", "text!avalon.suggest.html"], function(avalon, sourceHTML) {

    var ttt = sourceHTML.split("MS_OPTION_STYLE"),
        suggestHtml = avalon.parseHTML(ttt[0]).firstChild,

        cssText = ttt[1].replace(/<\/?style>/g, ""),
        styleEl = document.getElementById("avalonStyle");

    try {
        styleEl.innerHTML += cssText ;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText ;
    }
    
    var widget = avalon.ui.suggest = function(element, data, vmodels) {

        var $element = avalon(element),
            options = data.suggestOptions ;

        console.log("options is : ");
        console.log(options);        
        

        var vmodel = avalon.define(data.suggestId, function(vm) {

            avalon.mix(vm, options);

            vm.onchange = function(val) {
                if( val.srcElement ) return;
                console.log("element.msData is :");
                console.log(options.inputElement.msData);
                if( options.inputElement.msData && options.inputElement.msData['ms-duplex'] ) {
                    console.log("执行此ddddddddddddddddddddddddddddddd");
                    var d = options.inputElement.msData['ms-duplex'];
                    var vm = avalon.getModel( d , vmodels );
                    vm[1][vm[0]] = val;
                } else {
                    // 当不存在duplex时执行此，很糟糕，除非38和40分别处理
                    options.inputElement.value = val;
                }
            }

            // if (options.changed) {
            //     var arr = avalon.getModel( options.changed , vmodels );
            //     var _onchange = onchange;

            //     onchange = function(){
            //         _onchange.apply( null , arguments );
                    
            //         arr[1][arr[0]].apply( arr[1] , arguments );
            //     } 
            // }

            vm.searchText = "";
            vm.list = [{text:"sss"}];
            vm.show = false;
            vm.loading = false;
            vm.selectedIndex = 0;

            vm.clk = function(idx, evt) {
                vmodel.onchange(vmodel.list[idx].value, vmodel.list[idx].$model, evt);
                vm.show = false;
            }

            if (options.focus) {

                avalon.bind(options.inputElement,"focus", function() {
                    // console.log("focus 中的vmodel us : ");
                    // console.log(vmodel);
                    var v = this.value;
                    if( vmodel.searchText == v ) {
                    
                        updateSource( v , vmodel );
                    } else {
                        vmodel.searchText = v;
                    }
                })

            }

            vm.$watch('show', function(v) {
                console.log("show suggest "+ v);
                if( v ) {
                    suggestHtml.style.width = options.textboxContainer.clientWidth+"px" ;
                }
            })

            vm.$watch('searchText',function(v){
                console.log("searchText watch");
                updateSource( v , vm);
            });

            // 当切换提示列表项的时候改变
            // vm.onValueChange = function( val ) {
            //     // 必须有值，如果是事件对象则不处理
            //     if ( val.srcElement ) return;

            //     if ( element.msData && element.msData['ms-duplex'] ) {
            //         var d = element.msData['ms-duplex'];
            //         var vm = avalon.getModel( d , vmodels );
            //         vm[1][vm[0]] = val;
            //     } else {
            //         element.value = val;
            //     }
            // }


            vm.hidepromptinfo = function(evt) {
                if( findParent( evt.target , options.textboxContainer ) ) return;
                vmodel.show = false;
            };




            vm.$init = function() {

                avalon.bind(options.inputElement, "keyup", function(evt) {
                    switch( evt.which ) {
                        case 9:

                            if (!vmodel.show) return ;
                            vmodel.show = false;
                            break;

                        case 27:
                            if (!vmodel.show) return ;

                            vmodel.show = false;
                            break;

                        case 13:
                            if (!vmodel.show) return ;
                            vmodel.show = false;
                            vmodel.onchange( vmodel.list[vmodel.selectedIndex].value , vmodel.list[vmodel.selectedIndex].$model, evt );
                            break;

                        case 38:
                            // up arrow
                            if( !vmodel.show ) return;
                            --vmodel.selectedIndex
                            if (vmodel.selectedIndex === -1) {
                                vmodel.selectedIndex = vmodel.list.length - 1
                            }
                            vmodel.onchange( vmodel.list[vmodel.selectedIndex].value , vmodel.list[vmodel.selectedIndex].$model, evt );
                            return false;

                        break;

                        case 40:
                            // down arrow
                            if( !vmodel.show ) return;
                            ++vmodel.selectedIndex
                            if (vmodel.selectedIndex === vmodel.list.length) {
                                vmodel.selectedIndex = 0
                            }
                            vmodel.onchange( vmodel.list[vmodel.selectedIndex].value , vmodel.list[vmodel.selectedIndex].$model, evt );
                            return false;
                        break;
                        default:

                            vmodel.searchText = this.value;
                            
                        break;
                    }
                })
                


                avalon.nextTick(function() {
                    element.appendChild(suggestHtml);
                    avalon.scan(element, [vmodel].concat(vmodels)); 
                })
                   
            };

            vm.$remove = function() {

            }
        });
    
        function updateSource( value , vm ) {
            console.log("value is : "+value);
            //if( vm.show != true ) return;
            if( vm.loading == true ) return;
            var s = avalon.ui["suggest"].strategies[ options.strategy ];
            if( !s ) return;

            vm.loading = true;
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
         
                console.log(vm);
                if( array.length == 0 ) {
                    vm.show = false;
                } else {
                   
                    vm.show = true;
                     console.log("show----------")
                }
            });
        };

        return vmodel ;
    };

    function findParent( element , findElement ) {
        if( !element ) return false;
        if( element == findElement ) return true;
        return findParent( element.parentNode , findElement );
    }


    widget.default = {

    };

    avalon.ui["suggest"].strategies = {

        // 添加策略
        // done( err , array ) {callback}
        "test" : function( value , done ) {
            console.log("test strategies");
            setTimeout(function(){
                done( null , value ? [
                    value + "1" ,
                    value + "2" ,
                    value + "3"  
                ] : [] )
            },100)
        }

    }
    return avalon ;
})