define(["../avalon.getModel", "text!./avalon.suggest.html","css!../chameleon/oniui-common.css", "css!./avalon.suggest.css"], function(avalon, sourceHTML) {
    var widget = avalon.ui.suggest = function(element, data, vmodels) {

        var $element = avalon(element),
            options = data.suggestOptions ,
            template = options.getTemplate(sourceHTML),
            suggestHtml = avalon.parseHTML(template).firstChild ,
            dataValue = data.value.split(","),
            suggestOptions = !dataValue[2] ? 0 : avalon.getModel( dataValue[2] , vmodels ) || 0,
            styleReg = /^(\d+).*$/;
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

        /*
         * suggest 下拉框
         */
        var limit = options.limit,  // 最多显示条数配置：最多显示多少条suggest，超出显示滚动条
            disableLetter = options.disableLetter,//是否对字母的suggest进行过滤
            suggest,  // ui-suggest
            suggestCtr = options.suggestCtr || {
                _minIndex: 0,           // 显示口第一条suggest index
                _maxIndex: limit - 1,   // 显示口最后一条suggest index
                _items: "",            // ui-item
                moveUp: function(index){
                    if(index < this._minIndex){
                    // 如果已经跑到显示口第一条了
                        if(this._minIndex == 0){
                        // 如果已经滚动到了最上面，滚到底部
                            this._minIndex = vmodel.list.length - limit;
                            this._maxIndex = vmodel.list.length - 1;

                            //先更新高度，再滚动
                            this._update();
                            this.scroll.set(this._getHeight(0, this._minIndex-1));
                        }else{
                            this._minIndex--;
                            this._maxIndex--;
                            
                            this._update();
                            this.scroll.pre();
                        }
                    }else{
                        if(this.scroll.isScolled){
                            this.scroll.recover();
                        }
                    }
                },
                moveDown: function(index){
                    if(index > this._maxIndex){
                    // 如果已经跑到显示口最后一条了
                        if(this._maxIndex == vmodel.list.length -1){
                        // 如果已经滚动到了最下面，滚到顶部
                            this._minIndex = 0;
                            this._maxIndex = limit - 1;

                            this._update();
                            this.scroll.set(0);
                        }else{
                        // 向下滚动
                            this._minIndex++;
                            this._maxIndex++;
                            
                            this._update();
                            this.scroll.next();
                        }
                    }else{
                        if(this.scroll.isScolled){
                            this.scroll.recover();
                        }
                    }
                },
                reset: function(){
                    this._minIndex = 0;
                    this._maxIndex = limit - 1;
                    suggest.scrollTop = 0;
                    this._items = suggest.getElementsByTagName("li");
                    this._update();
                },
                scroll: {
                    isScolled: false,       // 记录用户是否滚动过
                    set: function(val){
                        suggest.scrollTop = val;
                        this.isScolled = false;
                    },
                    pre: function(){
                        if(this.isScolled){
                            this.recover();
                        }else{
                            suggest.scrollTop -= suggestCtr._items[suggestCtr._minIndex].offsetHeight;
                        }
                    },
                    next: function(){
                        if(this.isScolled){
                            this.recover();
                        }else{
                            suggest.scrollTop += suggestCtr._items[suggestCtr._minIndex - 1].offsetHeight;
                        }
                    },
                    recover: function(){
                        this.set(suggestCtr._getHeight(0, suggestCtr._minIndex-1));
                    }
                },
                _update: function(){
                    
                    if(vmodel.list.length > limit){
                    // 如果suggest条数大于配置数，显示滚动条
                        suggest.style.overflowY = 'scroll';    
                        suggest.style.height = this._getHeight(this._minIndex, this._maxIndex) + 'px';
                    }else{
                    // 否则，取消滚动条
                        suggest.style.overflowY = 'auto';    
                        suggest.style.height = 'auto';
                    }
                },
                _getHeight: function(fromIndex, toIndex){
                    var _height = 0,    //suggest列表高度
                        _items = this._items;

                    for(var i = fromIndex; i <= toIndex; i++){
                        _height += _items[i].offsetHeight;
                    }
                    return _height;
                }
            };

        var vmodel = avalon.define(data.suggestId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "puresuggest", "limit", "suggestCtr"];
            vm.widgetElement = element;
            vm.list = []
            vm.searchText = "";
            vm.toggle = false;
            vm.loading = false;
            vm.selectedIndex = 0;
            vm.suggestCtr = suggestCtr;
            vm._renderItem = function(item) {
                if (!item) return
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
                    suggestHtml.style.width = $textboxContainer.outerWidth() - 2 - avalon(suggestHtml).css("paddingLeft").replace(styleReg, '$1') - avalon(suggestHtml).css("paddingRight").replace(styleReg, '$1') + 'px';
                }
            })
            // 监控searchText值的变化，及时更新提示列表?
            vm.$watch('searchText',function(v){
                vmodel.updateSource(v , vmodel, limit, disableLetter);
            });
            
            // 处理提示项的鼠标点击，也就是更新input值，同时隐藏提示框?
            vm.clickcallback = function(idx, event) {
                var selectObj = vmodel.list[idx],
                    selectValue = selectObj.value

                vmodel.onChangeCallback(selectValue, vmodel.inputElement, event, selectObj);
                if (typeof vmodel.onSelectItem === "function") {
                    vmodel.onSelectItem.call(null, selectValue, vmodel.inputElement, event, selectObj)
                }
                vmodel.toggle = false;
            }
            // 当点击input框之外的区域时，隐藏提示框?
            vm.hidepromptinfo = function(event) {
                if (!vmodel.toggle) return false;
                /* 此判断是关键，当点击区域是在提示框上说明是在选择提示信息，隐藏提示框的操作放在提示项的click回调上处理，反之则隐藏提示框 */
                if (findParent( event.target , options.textboxContainer ) ) return;
                vmodel.toggle = false;
            };
            vm.$init = function() {
                avalon.bind(options.inputElement, "keydown", function(event) {
                    vmodel.keyDownOperation(vmodel, event, limit)
                })
                avalon.bind(document, "click", vm.hidepromptinfo);
                avalon.nextTick(function() {
                    element.appendChild(suggestHtml);
                    avalon.scan(element, [vmodel].concat(vmodels));
                    // suggest 下拉框初始化
                    suggestCtr.suggest = suggest = element.getElementsByTagName('ul')[0];
                    // 绑定 scroll 事件
                    avalon.bind(suggest, "scroll", function(){
                        suggestCtr.scroll.isScolled = true;
                    });
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                })
            };
            // 自动销毁
            vm.$remove = function() {
                element.innerHTML = "";
            }
        });
        // 如果input元素配置了suggest-focus项，则执行此条件块?
        if (options.focus) {
            // 特殊的suggest，即当searchText与input值相等时更新提示列表list，不相等时，更新searchText
            avalon.bind(options.inputElement,"focus", function(event) {
                var v = this.value;
                if( vmodel.searchText == v ) {
                    vmodel.updateSource( v , vmodel, limit);
                } else {
                    vmodel.searchText = v;
                }
            })
        }
        if (options.onChange) {
            var arr = avalon.getModel( options.onChange , vmodels );
            var _onchange = vmodel.onChangeCallback;
            vmodel.onChangeCallback = function(){
                _onchange.apply( null , arguments );
                arr[1][arr[0]].apply( arr[1] , arguments );
            }
        }
        return vmodel
    };
    // 判断点击目标元素是否在查找元素内部，在则返回true，否则返回false
    function findParent( element , findElement ) {
        if( !element ) return false;
        if( element == findElement ) return true;
        return findParent( element.parentNode , findElement );
    }
    function keyDownOperation(vmodel, event, limit) {
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
                vmodel.onChangeCallback( vmodel.list[vmodel.selectedIndex].value , vmodel.inputElement, event, vmodel.list[vmodel.selectedIndex]);
            break;
            case 38:
                // arrow up
                if (!vmodel.toggle) return ;
                --vmodel.selectedIndex

                // 下拉框
                if(limit){
                    vmodel.suggestCtr.moveUp(vmodel.selectedIndex);
                }

                if (vmodel.selectedIndex === -1) {
                    vmodel.selectedIndex = vmodel.list.length - 1
                }
                vmodel.onChangeCallback( vmodel.list[vmodel.selectedIndex].value , vmodel.inputElement, event, vmodel.list[vmodel.selectedIndex]);

                // prevent default behavior to move cursor at the the begenning
                event.preventDefault()
            break;
            case 40:
                // arrow down
                if (!vmodel.toggle) return ;
                ++vmodel.selectedIndex

                // 下拉框
                if(limit){
                    vmodel.suggestCtr.moveDown(vmodel.selectedIndex);
                }

                if (vmodel.selectedIndex === vmodel.list.length) {
                    vmodel.selectedIndex = 0
                }
                vmodel.onChangeCallback( vmodel.list[vmodel.selectedIndex].value , vmodel.inputElement, event, vmodel.list[vmodel.selectedIndex]);
                
                // prevent default behavior to move cursor at the the end
                event.preventDefault()
            break;
            default:
                var keyupFn = avalon.bind(vmodel.inputElement, 'keyup', function(){
                    vmodel.searchText = this.value || String.fromCharCode(event.which);
                    avalon.unbind(vmodel.inputElement, 'keyup', keyupFn);
                })
            break;
        }
    }
    function updateSource(value , vmodel, limit, disableLetter) {

        if( vmodel.loading == true ) return;
        var s = avalon.ui["suggest"].strategies[vmodel.strategy ];
        if( !s ) return;
        vmodel.loading = true;
        //判断是否对字母进行过滤，即输入包含字母时不调用s更新
        if(!disableLetter || !(disableLetter && /[a-z]/.test(value))){
             // 根据提示类型提供的方法过滤的数据来渲染提示视图?
            s(value, function (array) {
                vmodel.selectedIndex = 0;
                vmodel.list.removeAll();
                avalon.each(array, function (idx, val) {
                    if (typeof val == 'string') {
                        vmodel.list.push({
                            text: val,
                            value: val
                        });
                    } else {
                        vmodel.list.push(val);
                    }
                });
                vmodel.loading = false;
                if (array.length == 0) {
                    vmodel.toggle = false;
                } else {
                    vmodel.toggle = true;
                }
                //重置suggest列表
                if (limit) {
                    vmodel.suggestCtr.reset();
                }
            },vmodel.inputElement);
        }else{
            vmodel.list.clear();
            vmodel.loading = false;
        }
    };
    widget.defaults = {
        inputElement : "" , 
        strategy : "__getVal" , 
        textboxContainer : "" ,
        
        focus : false ,
        changed : false,
        onSelectItem: "",
        emphasize: true,
        getTemplate: function(tmp) {
            return tmp
        },
        keyDownOperation: keyDownOperation,
        // 当通过键盘上下箭头或者使用鼠标点击来切换提示项时触发
        onChangeCallback: function(val, input) {
            input.value = val;
        },
        updateSource: updateSource,
        renderItem : function(item, vmodel) {
            if (!vmodel.emphasize) {
                return item.text
            }
            item = item.text
            var query = escapeRegExp(vmodel.searchText)
            return item.replace(new RegExp('(' + query + ')', 'ig'), function($1, match) {
                // ie6 下奇怪的字符
                if(match.charCodeAt(0) < 32){
                    match = "" + match.slice(1)
                }
                return "<b style='color:#f55'>" + match + "</b>"
            })
        }
    };

    function escapeRegExp(str) {
        return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
    }
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
