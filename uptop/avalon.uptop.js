define(["avalon"], function(avalon) {
    var defaults = {
            distanceToRight: 50,
            distanceToBottom: 120,
            title: "回到顶部",
            width: 60,
            height: 60,
            animate: false, 
            toggle: false,
            backgroundUrl: "http://source.qunarzz.com/general/oniui/uptop/up.png"
        },
        template = "<div ms-css-right='distanceToRight' ms-css-bottom='distanceToBottom' ms-title='title' ms-click='goTop' ms-css-width='width' ms-css-height='height' ms-visible='toggle' class='ui-icon'></div>",
        element = avalon.parseHTML(template).firstChild,
        $element = avalon(element),
        $document = avalon(document),
        vmodel = {};

    document.body.appendChild(element)

    var goTop = avalon.bindingHandlers.uptop = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || ["$", "uptop"],
            ID = args[0].trim(), 
            opts = args[1], 
            model, 
            vmOptions,
            style = {},
            options = {};

        if (ID && ID != "$") {
            model = avalon.vmodels[ID]//如果指定了此VM的ID
            if (!model) {
                return
            }
        }
        data.element.removeAttribute("ms-uptop")
        if (!model) {//如果使用$或绑定值为空，那么就默认取最近一个VM
            model = vmodels.length ? vmodels[0] : {}
        }
        if (model && typeof model[opts] === "object") {//如果指定了配置对象，并且有VM
            vmOptions = model[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
        }

        options = avalon.mix({}, defaults, vmOptions || {}, data[opts] || {}, avalon.getWidgetData(data.element, "uptop"));

        vmodel = avalon.define("uptop", function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["timeId"]
            vm.timeId = 0
            vm.goTop = function() {
                var scrollTop = $document.scrollTop()
                if (options.animate) {
                    vmodel.timeId = setTimeout(function() {
                        window.scrollBy(0, -100)
                        vmodel.goTop()
                    },200)
                    if (scrollTop==0) {
                        clearTimeout(vmodel.timeId);
                    }
                } else {
                    window.scrollTo(0, 0)
                }
            }
        })
        style = {
                position: "fixed",
                "background-image": "url("+vmodel.backgroundUrl+")",
                cursor: "pointer"
            }
        $element.css(style)
        avalon.scan(element, vmodel);
    }
    
    avalon(document).bind("scroll", throttle(scrollCallback, 100, 200))
    function throttle(fn, delay, mustRunDelay, args){
        var timer = null;
        var t_start;
        return function(){
            var context = this, t_curr = +new Date();
            clearTimeout(timer);
            if(!t_start){
                t_start = t_curr;
            }
            if(t_curr - t_start >= mustRunDelay){
                fn.apply(context, args);
                t_start = t_curr;
            }
            else {
                timer = setTimeout(function(){
                    fn.apply(context, args);
                }, delay);
            }
        };
    }
    function scrollCallback() {
        var scrollTop = $document.scrollTop();
        if (scrollTop > 200) {
            vmodel.toggle = true;
        } else {
            vmodel.toggle = false
        }
    }
    return avalon
})
