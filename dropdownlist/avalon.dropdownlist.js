// avalon 1.3.6
/**
 * @cnName 下拉提示搜索框
 * @enName dropdownlist
 * @introduce
 *    <p>dropdownlist使得可以通过下拉搜索功能减少显示内容，方便用户查找选择</p>
 */
define(["avalon", "text!./avalon.dropdownlist.html", "text!./avalon.suggest.html", "../scrollbar/avalon.scrollbar.js", "../textbox/avalon.textbox.js", "css!../chameleon/oniui-common.css", "css!./avalon.dropdownlist.css"], function(avalon, sourceHTML, suggestHTML) {
    var dropdownVM = null

    var widget = avalon.ui.dropdownlist = function(element, data, vmodels) {
        var options = data.dropdownlistOptions,
            $element = avalon(element),
            limit = options.limit,
            listSeparation = [],
            textboxConfig = {
                suggestion: {
                    suggestCtr: {
                        _minIndex: 0,           // 显示口第一条suggest index
                        _maxIndex: 0,   // 显示口最后一条suggest index
                        listIndex: 0,
                        _items: "",            // ui-item
                        moveUp: function(index){
                            if (index < this._minIndex) {
                                // 向上滚动
                                this.listIndex = this.listIndex - 1
                                this._minIndex = listSeparation[this.listIndex]
                                this._maxIndex = listSeparation[this.listIndex + limit - 1]
                                
                                this._update()
                                this.scroll.pre()
                            } else if (index >= this._maxIndex) {
                                // 如果已经滚动到了最上面，滚到底部
                                this.listIndex = listSeparation.length - limit
                                this._minIndex = listSeparation[this.listIndex]
                                this._maxIndex = listSeparation[listSeparation.length - 1]

                                //先更新高度，再滚动
                                this._update();
                                this.scroll.set(this._getHeight(0, this._minIndex-1));
                            } else {
                                if(this.scroll.isScolled){
                                    this.scroll.recover()
                                }
                            }
                        },
                        moveDown: function(index) {
                            if(index >= this._maxIndex && listSeparation.length > limit){
                                // 向下滚动
                                this.listIndex = this.listIndex + 1
                                if (this.listIndex + limit > listSeparation.length) {
                                    this.listIndex = listSeparation.length - limit
                                }
                                this._minIndex = listSeparation[this.listIndex]
                                this._maxIndex = listSeparation[this.listIndex + limit - 1]
                                this._update()
                                this.scroll.next()
                            } else if (index <= this._minIndex && listSeparation.length > limit) {
                                //如果已经滚动到了最下面，滚到顶部
                                this.listIndex = 0
                                this._minIndex = listSeparation[0]
                                if (listSeparation.length > limit) {
                                    this._maxIndex = listSeparation[limit-1]
                                } else {
                                    this._maxIndex = listSeparation[listSeparation.length - 1]
                                }
                                this._update()
                                this.scroll.set(0)
                            } else {
                                if(this.scroll.isScolled){
                                    this.scroll.recover();
                                }
                            }
                        },
                        reset: function(){
                            var suggest = this.suggest
                            this.listIndex = 0
                            this._minIndex = listSeparation[0]
                            this._maxIndex = listSeparation[limit-1]
                            suggest.scrollTop = 0
                            this._items = suggest.getElementsByTagName("li");
                            this._update();
                        },
                        fixMinMaxIndex: function(selectedIndex) {
                            var seIndex = listSeparation.indexOf(selectedIndex),
                                listSeparationTrue = listSeparation.length > limit,
                                suggestHeight = this.suggest.style.height

                            if (seIndex !== -1) {
                                if (listSeparationTrue) {

                                    this.listIndex = seIndex - Math.floor(limit/2)
                                    if (this.listIndex < 0) {
                                        this.listIndex = 0
                                    }

                                    if (this.listIndex + limit > listSeparation.length) {
                                        this.listIndex = listSeparation.length - limit
                                    }
                                    this._minIndex = listSeparation[this.listIndex]
                                    this._maxIndex = listSeparation[this.listIndex + limit - 1]
                                    if (suggestHeight == "auto") {
                                        this._update()
                                    }
                                    if (this.listIndex == 0) {
                                        return
                                    }
                                    this.scroll.scrollTo(listSeparation[this.listIndex - 1])
                                } else {
                                    this.listIndex = 0
                                    this._minIndex = listSeparation[0]
                                    this._maxIndex = listSeparation[listSeparation.length -1]
                                    if (suggestHeight != "auto") {
                                        this._update()
                                    }
                                }
                            } else {
                                this.listIndex = 0
                                this._minIndex = listSeparation[0]
                                if (listSeparationTrue) {
                                    this._maxIndex = listSeparation[limit -1]
                                    if (suggestHeight == "auto") {
                                        this._update()
                                    }
                                } else {
                                    this._maxIndex = listSeparation[listSeparation.length -1]
                                    if (suggestHeight != "auto") {
                                        this._update()
                                    }
                                }
                            }
                        },
                        scroll: {
                            isScolled: false,       // 记录用户是否滚动过
                            set: function(val){
                                var suggestCtr = dropdownVM.suggestVM.suggestCtr
                                suggestCtr.suggest.scrollTop = val;
                                this.isScolled = false;
                            },
                            pre: function(){
                                var suggestCtr = dropdownVM.suggestVM.suggestCtr
                                if(this.isScolled){
                                    this.recover();
                                }else{
                                    suggestCtr.suggest.scrollTop -= suggestCtr._items[suggestCtr._minIndex].offsetHeight;
                                }
                            },
                            next: function(){
                                var suggestCtr = dropdownVM.suggestVM.suggestCtr
                                if(this.isScolled){
                                    this.recover();
                                }else{
                                    
                                    suggestCtr.suggest.scrollTop += suggestCtr._items[listSeparation[suggestCtr.listIndex - 1]].offsetHeight;
                                }
                            },
                            scrollTo: function(index) {
                                var suggestCtr = dropdownVM.suggestVM.suggestCtr
                                suggestCtr.suggest.scrollTop = suggestCtr._getHeight(0, index)
                            },
                            recover: function(){
                                var suggestCtr = dropdownVM.suggestVM.suggestCtr
                                this.set(suggestCtr._getHeight(0, suggestCtr._minIndex-1));
                            }
                        },
                        _update: function(len){
                            var listLen = len || listSeparation.length,
                                suggest = this.suggest
                            if(listLen > limit){
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
                                if(_items[i].style.display == "none") {
                                    continue
                                }
                                _height += _items[i].offsetHeight;
                            }
                            return _height;
                        }
                    },
                    limit: options.limit,
                    onChangeCallback: function(val) {
                        dropdownVM && (dropdownVM.searchItem = val)
                    },
                    onSelectItem: function(val, input) {
                        dropdownVM && (dropdownVM.textboxToggle = false)
                        input.value = ""
                    },
                    getTemplate: function(tmp) {
                        return suggestHTML
                    },
                    setSelectedClass: function (list, selectedIndex, item) {
                        if (!item) return false
                        return list[selectedIndex] == item
                    },
                    toggleItem: function (item) {
                        if (!item) return false
                        return item.toggle
                    },
                    renderItem: function (item) {
                        if (!item) return ""
                        return item.value
                    },
                    updateSource: function(val, suggestVM, dropdownVM, initList) {
                        var _data = [],
                            data = []

                        listSeparation = []
                        if (initList && suggestVM.list.length !== dropdownVM.data.length) {
                            data = dropdownVM.data
                            data.forEach(function(item, index) {
                                listSeparation.push(index)
                                if (typeof item === "string") {
                                    _data.push({
                                        value: item,
                                        toggle: true
                                    })
                                }
                            })
                            suggestVM.selectedIndex = 0
                            suggestVM.list = _data
                            return 
                        } else if (initList) {
                            suggestVM.list.forEach(function(item, index) {
                                listSeparation.push(index)
                                item.toggle = true
                            })
                            return
                        }
                        avalon.each(suggestVM.list, function(index, item) {
                            if (!~item.value.indexOf(val) && val) {
                                item.toggle = false
                            } else {
                                item.toggle = true
                                listSeparation.push(index)
                            }
                        })
                        suggestVM.suggestCtr.fixMinMaxIndex(suggestVM.selectedIndex)
                    },
                    keyDownOperation: function(vmodel, event, limit) {
                        var selectValue = vmodel.list[vmodel.selectedIndex] && vmodel.list[vmodel.selectedIndex].value,
                            selectedIndex = vmodel.selectedIndex

                        switch(event.which) {
                            case 13:
                                event.preventDefault();
                                if (!vmodel.toggle) {
                                    if (typeof vmodel.onSelectItem === "function") {
                                        vmodel.onSelectItem.call(null, selectValue, vmodel.inputElement)
                                    }
                                    return ;
                                } 
                                    
                                vmodel.toggle = false;

                                vmodel.onChangeCallback(selectValue, vmodel.inputElement, event );
                                if (typeof vmodel.onSelectItem === "function") {
                                    vmodel.onSelectItem.call(null, selectValue, vmodel.inputElement)
                                }
                            break;
                            case 38:
                                event.preventDefault()
                                // arrow up
                                if (!vmodel.toggle) return ;
                                for (var i = selectedIndex-1, listModel = vmodel.list.$model; i >= 0; i--) {
                                    var listItem = listModel[i]
                                    selectedIndex--
                                    if (listItem.toggle) {
                                        break
                                    }
                                }
                                if (i == -1) {
                                    var len = listModel.length
                                    selectedIndex = len-1
                                    for (i = selectedIndex; i > 0; i--) {
                                        listItem = listModel[i]
                                        if (listItem.toggle) {
                                            break
                                        } else {
                                            selectedIndex--
                                        }
                                    }
                                }
                                vmodel.selectedIndex = selectedIndex

                                // 下拉框
                                if (limit && listSeparation.length){
                                    vmodel.suggestCtr.moveUp(selectedIndex)
                                }
                                vmodel.onChangeCallback(selectValue, vmodel.inputElement, event );
                            break;
                            case 40:
                                event.preventDefault()
                                // arrow down
                                if (!vmodel.toggle) return ;
                                for (var i = selectedIndex+1, listModel = vmodel.list.$model, len = listModel.length; i < len; i++) {
                                    var listItem = listModel[i]
                                    selectedIndex++
                                    if (listItem.toggle) {
                                        break
                                    }
                                }
                                if (i == len) {
                                    selectedIndex = 0
                                    for (i = 0; i < len; i++) {
                                        listItem = listModel[i]
                                        if (listItem.toggle) {
                                            break
                                        } else {
                                            selectedIndex++
                                        }
                                    }
                                }
                                vmodel.selectedIndex = selectedIndex
                                // 下拉框
                                if(limit && listSeparation.length){
                                    vmodel.suggestCtr.moveDown(selectedIndex)
                                }
                                vmodel.onChangeCallback( vmodel.list[vmodel.selectedIndex].value , vmodel.inputElement, event );
                            break;
                            default:
                                var keyupFn = avalon.bind(vmodel.inputElement, 'keyup', function(){
                                    vmodel.searchText = this.value
                                    avalon.unbind(vmodel.inputElement, 'keyup', keyupFn);
                                })
                            break;
                        }
                    },
                    onInit: function(vm) {
                        vm.$watch("toggle", function(val) {
                            if (val) {
                                vm.suggestCtr.reset()
                            }
                        })
                        vmodel.suggestVM = vm
                        vm.updateSource("", vm, vmodel, true)
                    }
                },
                getTemplate: function(tmp) {
                    return tmp.replace(/MS_OPTION_ICON/, '<i class="oni-icon oni-textbox-icon" ms-visible="textboxToggle">&#xf002;</i>')
                }
            }

        options.textbox = avalon.mix(options.textbox, textboxConfig)
        options.template = options.getTemplate(sourceHTML)
        var vmodel = avalon.define(data.dropdownlistId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "data", "textbox", "searchBox", "suggestVM", "template"];
            // @config 绑定组件的元素引用
            vm.widgetElement = element; 
            vm.searchItem = ""
            vm.textboxToggle = false
            vm.searchBox = null
            vm.suggestVM = null
            vm.toggleDropdownList = function(event, textboxToggle) {
                event.stopPropagation()
                textboxToggle = !textboxToggle
                if (dropdownVM && dropdownVM != vmodel && dropdownVM.textboxToggle) {
                    dropdownVM.textboxToggle = false
                }
                if (textboxToggle) {
                    dropdownVM = vmodel
                } else {
                    if (dropdownVM) {
                        dropdownVM.searchBox && (dropdownVM.searchBox.value = "")
                        dropdownVM.suggestVM.selectedIndex = 0
                    }
                }
                vmodel.textboxToggle = textboxToggle
            }
            /**
             * @config 重新渲染模板源
             * @param data {Array} 要渲染的数据源
             */
            vm.render = function(data) {
                suggestVM = vmodel.suggestVM
                if (avalon.type(data) == "array") {
                    vmodel.data = data
                }
                suggestVM.updateSource("", suggestVM, vmodel, true)
            }
            vm.$init = function() {
                element.innerHTML = options.template
                $element.addClass("oni-dropdownlist")
                vmodel.searchBox = element.getElementsByTagName("input")[0]
                avalon.scan(element, [vmodel].concat(vmodels))
                avalon.bind(vmodel.searchBox, "focus", function() {
                    var suggestVM = vmodel.suggestVM
                    suggestVM.updateSource("", suggestVM, vmodel, true)
                    suggestVM.toggle = true
                })
                element.clickCallback = avalon.bind(document.body, "click", function(event) {
                    var target = event.target
                    if (!element.contains(target)) {
                        vmodel.textboxToggle = false
                    }
                })
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
                avalon.unbind(document.body, "click", element.clickCallback)
            }
        });
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        data: [], // @config搜索源
        limit: 10, // @config显示条数，超过限制出滚动条
        /**
         * @config 模板函数,方便用户自定义模板
         * @param tmp {String} 默认模板
         * @param opts {Object} vmodel
         * @returns {String} 新模板
         */
        getTemplate: function(tmp, opts) {
            return tmp
        }
    }
    return avalon;
})
/**
 @links
 [dropdownlist demo](avalon.dropdownlist.ex1.html)
 [render重新渲染搜索列表源](avalon.dropdownlist.ex2.html)
 */