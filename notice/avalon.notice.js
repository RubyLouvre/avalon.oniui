define(["avalon", "text!./avalon.notice.html"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""],
        cssText = arr[1].replace(/<\/?style>/g, ""), // 组件的css
        template = arr[0],
        styleEl = document.getElementById("avalonStyle");

    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    var containerMap = [];

    var widget = avalon.ui.notice = function(element, data, vmodels) {

        var options = data.noticeOptions;
        options.template = template = options.getTemplate(template, options);

        var vmodel = avalon.define(data.noticeId, function(vm) {
            avalon.mix(vm, options);
            var container = vm.container;
            var templateView = null;
            vm.$closeTimer = 0;
            vm.$skipArray = ["template","widgetElement"];
            vm.widgetElement = element;
            vm.typeClass = vm.infoClass;
            vm.container = container ? container.nodeType === 1? container: document.getElementById(container.substr(1)) : element;
            !vm.isPlace ? vm.container = document.body : vm.container;
            vm.$show = function() {
                _timerClose();
                vmodel.onShow.call(element, data, vmodels);
            }
            vm.$hide = function() {
                if (vmodel.toggle) {
                    vmodel.toggle = false
                }
                vmodel.onHide.call(element, data, vmodels);
            }
            vm.$init = function() {
                var container = null;
                template.replace("MS_OPTION_TYPE_CLASS", options.type+"Class");
                templateView = avalon.parseHTML(template).firstChild;
                container = positionNoticeElement();    
                container.appendChild(templateView);
                avalon.scan(templateView, [vmodel].concat(vmodels))
            }
            vm.$remove = function() {
                var templateViewPar = templateView.parentNode;
                templateView.innerHTML = templateView.textContent = "";
                templateViewPar.removeChild(templateView);
                if (!templateViewPar.children.length) {
                    templateViewPar.parentNode.removeChild(templateViewPar);
                }
            }
            // _affix : function(){
            //     if(!this._isAffix){ return; }

            //     var range, top;

            //     if(this.options.isFixed) {
            //         range = 0;
            //         top = this.options.fixedTop || 0;
            //     } else {
            //         range = function() {
            //             return self.affix.affix.getOriDomOffset().top - self._affixHeight();
            //         };
            //         top = function(){
            //             return self._affixHeight();
            //         };
            //     }

            //     var self = this;
            //     setTimeout(function(){
            //         self.div.width(self.width);

            //         affixBoxs.push(self.div);
            //         affixBoxHeights.push(self.div.height());

            //         self.affix = new onion.ui.Affix({
            //             top : top,
            //             range : range,
            //             autoRender: false,
            //             container : self.div
            //         });
            //         self.affix.render();
            //     }, 0);
            // },

            // _affixHeight : function(){
            //     var heigthCount = 0;
            //     var i = $.inArray(this.div, affixBoxs);
            //     for(i--; i >= 0; i--){
            //         heigthCount += affixBoxHeights[i];
            //     }
            //     return heigthCount;
            // },

            // _affixDestory : function(){
            //     var index = $.inArray(this.div, affixBoxs);
            //     if(index != -1){
            //         affixBoxs.splice(index, 1);
            //         affixBoxHeights.splice(index, 1);
            //     }
            //     this.affix && this.affix.affix.destroy();
            //     this.affix && this.affix.affix.refreshAll();
            // },



            // /**
            // *   重新计算容器宽度    
            // *   对应不占位的notice容器是absolute的，所以当容器的父容器位置变化时，请调用此方法
            // */
            // refreshContainerOffset: function(){
            //     this.holder.css(this.container.offset());
            // }

            // destory : function(){
            //     if(this.options.hasCloseBtn){
            //         this.div && this.div.off('click', '.js_notice_close');
            //         this._div && this._div.off('click', '.js_notice_close');
            //     }

            //     this.div = this._div = null;
            //     window.clearTimeout(this.closeTimer);
            //     this._affixDestory();
            // }
            
        });
        vmodel.$watch("toggle", function(v) {
            if(v) {
                vmodel.$show();
            } else {
                vmodel.$hide();
            }
        })
        vmodel.$watch("type", function(v) {
            vmodel.typeClass = vmodel[v+"Class"];
        })
        function _timerClose() {
            if (!options.timer) { return; }
            window.clearTimeout(vmodel.$closeTimer);
            var self = this;
            vmodel.$closeTimer = window.setTimeout(function(){
                vmodel.$hide();
            }, options.timer);
        }
        function positionNoticeElement() {
            var containerArr = [];
            var container = vmodel.container;
            var containerExist = false;
            for (var i=0, len = containerMap.length; i<len; i++) {
                var containerInfo = containerMap[i];
                if (containerInfo[2] === container) {
                    containerExist = true;
                    container = vmodel.isPlace? containerInfo[0] : containerInfo[1];
                    if (!container) {
                        var div = document.createElement("div");
                        vmodel.container.appendChild(div);
                        if (vmodel.isPlace) {
                            containerInfo[0] = container = div;
                            avalon(div).addClass("ui-notice-flow")
                        } else {
                            avalon(div).addClass("ui-notice-detach")
                            containerInfo[1] = container = div;
                        }
                    }
                    break;
                } 
            }
            if (!containerExist) {
                var div = document.createElement("div");
                if (vmodel.isPlace) {
                    var containerFirstChild = container.children[0];
                    console.log(containerFirstChild);
                    if (!containerFirstChild) {
                        container.appendChild(div); 
                    } else {
                        container.insertBefore(div, containerFirstChild);  
                    }
                } else {
                    container.appendChild(div); 
                }
                //container.appendChild(div); 
                avalon(div).addClass(vmodel.isPlace? "ui-notice-flow" : "ui-notice-detach");
                containerArr[2] = container;
                if (vmodel.isPlace) {
                    containerArr[0] = container = div;
                } else {
                    containerArr[1] = container = div;
                }
                containerMap.push(containerArr);
            }
            return container;
        }
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        content: '',
        container: "",
        type: 'info', // 可以通过type的配置来切换notice的type
        header: '提示信息',
        timer: 0,
        hasCloseBtn: true,
        toggle: false,
        isPlace: true,  //是否占位
        // isFixed: false,  //是否采用fixed定位
        fixedTop: null,  //fixed定位的元素
        isAffix: false,
        onShow: avalon.noop,
        onHide: avalon.noop,
        successClass: "ui-notice-info", // 成功提示类名
        errorClass: "ui-notice-danger", // error提示类名
        infoClass: "", // type为info时提示类名
        widgetElement: "", // accordion容器
        getTemplate: function(str, options) {
            return str;
        }
    }
    return avalon;
})