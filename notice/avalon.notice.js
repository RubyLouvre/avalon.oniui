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
    var containerMap = []; // 
    var affixBoxs = []; // 存储吸顶的notice元素，且只保存弹出的notice
    var affixHeights = []; //存储吸顶元素对应的height、width、offsetTop
    var isIE6 = (window.navigator.userAgent || '').toLowerCase().indexOf('msie 6') !== -1;

    var widget = avalon.ui.notice = function(element, data, vmodels) {
        var options = data.noticeOptions;
        options.template = template = options.getTemplate(template, options);
        // container选项可以是dom对象，或者元素ID("#id")
        var noticeDefineContainer = options.container;
        // 根据配置值将container转换为完全的dom对象，如果用户未配置container，则container容器默认是应用绑定的元素
        options.container =  noticeDefineContainer ? noticeDefineContainer.nodeType === 1? noticeDefineContainer: document.getElementById(noticeDefineContainer.substr(1)) : element;
        var templateView = null; // 保存模板解析后的dom对象的引用
        var elementInnerHTML = element.innerHTML.trim(); //如果notice的container是默认配置也就是绑定元素本身，元素的innerHTML就是notice的content
        element.innerHTML=""
        var vmodel = avalon.define(data.noticeId, function(vm) {
            avalon.mix(vm, options);          
            vm.$closeTimer = 0; // 定时器引用
            vm.$skipArray = ["template","widgetElement", "_isAffix"];
            vm.content = vm.content || elementInnerHTML;
            vm._isAffix = vm.isPlace && vm.isAffix;
            vm.widgetElement = element;
            // type的改变影响notice显示类的改变
            vm.typeClass = vm[vm.type+"Class"]; 
            vm.noticeAffixWidth = 0;
            vm.noticeAffixHeight = 0;
            vm.affixPlaceholderDisplay = "none";
            // 如果配置notice不占位则设置器容器为body
            !vm.isPlace ? vm.container = document.body : vm.container;
            vm.$show = function() { // toggle为true时调用此方法显示notice
                _timerClose();
                _affix(); 
                vmodel.onShow.call(element, data, vmodels); // 用户回调
            }
            vm.$close = function() { //close按钮click时的监听处理函数
                vmodel.toggle = false;
            }
            vm.$hide = function() { //toggle为false时隐藏notice
                var hideAffixIndex = affixBoxs.indexOf(templateView);
                //隐藏吸顶元素后将其从吸顶队列中删除，并修改吸顶队列中所有元素的position为static，以便affixPosition能重新调整吸顶元素位置
                if(hideAffixIndex !== -1) { 
                    templateView.style.position = "static"; //隐藏时改变position，方便再显示时调整元素位置(吸顶还是原位)
                    affixBoxs.splice(hideAffixIndex, 1);
                    affixHeights.splice(hideAffixIndex, 1);
                    for(var i=0,len=affixBoxs.length; i<len; i++) {
                        affixBoxs[i].style.position= "static";
                    }
                    if(len) { //如果依然存在吸顶元素，重新调整吸顶元素的位置
                        affixPosition(); 
                    } 
                }
                vmodel.onHide.call(element, data, vmodels); //用户回调
            }
            vm.$init = function() {
                var container = null;
                var sourceFragment = avalon.parseHTML(template);
                var AffixPlaceholder = sourceFragment.lastChild;
                templateView = sourceFragment.firstChild;
                container = positionNoticeElement(); //获取存储notice的容器
                container.appendChild(templateView);
                if(!vmodel.isPlace) { //不占位notice元素，使之保持和配置container同样的offsetLeft和width
                    var $container = avalon(options.container);
                    // IE7及以下元素为空其width为0，所以需要取到其父节点的width
                    var $containerParent =  avalon($container[0].parentNode); 
                    templateView.style.width = ($container.width() || $containerParent.width()) +"px";
                    templateView.style.position = "relative";
                    templateView.style.left = $container.offset().left +"px";
                }  
                if(vmodel._isAffix) {
                    container.appendChild(AffixPlaceholder);
                    avalon.scan(AffixPlaceholder, [vmodel]);
                }
                avalon.scan(templateView, [vmodel].concat(vmodels))
            }
            vm.$remove = function() { //删除组件绑定元素后的自清理方法
                var templateViewPar = templateView.parentNode;
                for (var i=0, len = containerMap.length; i<len; i++) {
                    var containerInfo = containerMap[i];
                    if (containerInfo[2] === options.container) {
                        break;
                    }
                }
                if(vmodel._isAffix) {
                    var templateViewNextSiblind = templateView.nextSibling;
                    templateViewPar.removeChild(templateViewNextSiblind);
                }
                templateView.innerHTML = templateView.textContent = "";
                templateViewPar.removeChild(templateView);
                if (!templateViewPar.children.length) {
                    templateViewPar.parentNode.removeChild(templateViewPar);
                    containerInfo[0] = void 0;
                }
            }
        });
        vmodel.$watch("toggle", function(v) { //改变toggle影响notice的显示、隐藏
            if(v) {
                vmodel.$show();
            } else {
                vmodel.$hide();
            }
        })
        vmodel.$watch("type", function(v) { //改变type影响notice的显示类型
            vmodel.typeClass = vmodel[v+"Class"];
        })
        vmodel.$watch("successClass", function(v) {
            vmodel.typeClass = vmodel.successClass;
        })
        vmodel.$watch("errorClass", function(v) {
            vmodel.typeClass = vmodel.errorClass;
        })
        vmodel.$watch("infoClass", function(v) {
            vmodel.typeClass = vmodel.infoClass;
        })
        // 如果配置了timer，则在notice显示timer时间后自动隐藏
        function _timerClose() { 
            if (!options.timer) { return; }
            window.clearTimeout(vmodel.$closeTimer);
            var self = this;
            vmodel.$closeTimer = window.setTimeout(function(){
                vmodel.toggle = false;
            }, options.timer);
        }
        // notice要求占位且吸顶则保存吸顶元素到affixBoxs中，将元素的width、height、offsetTop保存到affixHeights对应位置,并根据页面目前位置调整吸顶元素的位置
        function _affix(){
            if(!vmodel._isAffix){ return; }
            var $templateView = avalon(templateView);
            var offset = $templateView.offset();
            var templateViewWidth = templateView.offsetWidth;
            var templateViewHieght = templateView.offsetHeight;
            vmodel.noticeAffixWidth = templateViewWidth;
            vmodel.noticeAffixHeight = templateViewHieght;
            templateView.vmodel = vmodel;
            affixBoxs.push(templateView);
            affixHeights.push([templateViewHieght, templateViewWidth, offset.top, offset.left]);
            affixPosition();
        }
        // 根据占位与否以及配置的container获得最终插入notice的container
        function positionNoticeElement() { 
            var containerArr = [];
            var container = vmodel.container;
            var containerExist = false; // container是否被处理过的标志
            for (var i=0, len = containerMap.length; i<len; i++) {
                var containerInfo = containerMap[i];
                if (containerInfo[2] === container) {
                    containerExist = true;
                    // container已经被配置过，则直接获取container下的div
                    container = vmodel.isPlace? containerInfo[0] : containerInfo[1];
                    if (!container) { //因为存在占位和不占位两种情况，所以有可能得到的container还没有经过处理
                        var div = document.createElement("div");
                        var containerFirstChild = vmodel.container.childNodes[0];
                        if (!containerFirstChild) { // 如果container还没有子元素直接append
                            vmodel.container.appendChild(div); 
                        } else { //保证notice的容器始终在container的起始位置
                            vmodel.container.insertBefore(div, containerFirstChild);  
                        }
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
                    var containerFirstChild = container.childNodes[0];
                    if (!containerFirstChild) { // 如果container还没有子元素直接append
                        container.appendChild(div); 
                    } else { //保证notice的容器始终在container的起始位置
                        container.insertBefore(div, containerFirstChild);  
                    }
                } else { // 不占位的notice直接append到body后面
                    container.appendChild(div); 
                }
                avalon(div).addClass(vmodel.isPlace? "ui-notice-flow" : "ui-notice-detach");
                containerArr[2] = container; // 保存用户配置的container对象
                if (vmodel.isPlace) {
                    containerArr[0] = container = div; // 占位元素container下的ui-notice-flow
                } else {
                    containerArr[1] = container = div; // body下的ui-notice-detach元素
                }
                containerMap.push(containerArr);
            }
            return container;
        }
        return vmodel;
    }
    avalon.bind(window, "scroll", function() {
        affixPosition();
    })
    function affixPosition() { // 定位吸顶元素
        var scrollTop = avalon(document).scrollTop();
        for (var i=0,len=affixBoxs.length; i<len; i++) {
            var notice = affixBoxs[i];
            var style = notice.style;
            var vmodel = notice.vmodel;
            // 如果滚动距离大于吸顶元素的offsetTop，将元素吸顶，否则保存元素在页面的位置不变
            if(scrollTop >= affixHeights[i][2]) { 
                // IE6下fixed失效，使用absolute进行吸顶操作
                if(style.position !== "fixed" || (isIE6 && style.position !== "absolute")) { //滚动过程中如果元素已经吸顶，就不再重新计算位置并定位
                    var top = 0;
                    var left = 0;
                    for (var j=1;j<=i;j++) {
                        top += affixHeights[j-1][0];
                    }
                    top = isIE6 ? scrollTop + top : top; 
                    left = affixHeights[i][3];
                    style.width = affixHeights[i][1] + "px";
                    style.top = top + "px";
                    style.left = left + "px"
                    style.position = isIE6 ? "absolute" : "fixed";
                    vmodel.affixPlaceholderDisplay = "block";
                }
            } else { 
                style.position = "static";
                vmodel.affixPlaceholderDisplay = "none";
            }
        } 
    }
    widget.version = 1.0
    widget.defaults = {
        content: "", // 动态修改notice的content
        container: "", // 保存notice的容器
        type: "info", // 动态改变type影响notice的状态(success、error、info)
        header: "notice title", // 动态修改notice的header
        timer: 0, // notice显示之后自动隐藏的定时器
        hasCloseBtn: true, // 是否显示关闭按钮
        toggle: false, // 显示或隐藏notice
        isPlace: true,  //是否占位
        isAffix: false, // 是否吸顶，非占位元素不存在吸顶的问题
        onShow: avalon.noop, // notice显示之后回调
        onHide: avalon.noop, // notice隐藏之后的回调
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