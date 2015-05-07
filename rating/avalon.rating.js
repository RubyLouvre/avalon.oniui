define(["../avalon.getModel", 'text!./avalon.rating.html', 'css!../chameleon/oniui-common.css'],
    function(avalon, sourceHTML) {

    var getFunc = function(name, vmodels) {
            var changeVM = avalon.getModel(name, vmodels);
            return changeVM && changeVM[1][changeVM[0]] || avalon.noop;
        },
        canEdit = function(el) {
            var tagName = el.tagName.toUpperCase();
            return tagName === 'INPUT' || tagName === 'SELECT';
        };

    var widget = avalon.ui.rating = function(element, data, vmodels) {
        var options = data.ratingOptions,
            onSelect = getFunc('onSelect', vmodels),
            onFloat = getFunc('onFloat', vmodels),
            ratingTemplate = options.getTemplate(sourceHTML),
            rating;

        var vmodel = avalon.define(data.ratingId, function(vm) {

            avalon.mix(vm, options);
            vm.rootElement = ""
            vm.widgetElement = element

            vm.value = vm.floatValue = element.value;

            vm.list = new Array(options.max);

            vm.mouseover = function(index) {
                vmodel.floatValue = index + 1;
            };

            vm.select = function(index) {
                vmodel.value = index + 1;
            };

            vm.mouseout = function() {
                vmodel.floatValue = vmodel.value;
            };

            vm.setByIp = function() {
                var value = parseInt(element.value);
                if (value !== vmodel.value) {
                    vmodel.value = vmodel.floatValue = value ? value : 0;
                }
            };

            vm.getRating = function() {
                return vmodel.value
            }

            vm.set = function(value) {
                vmodel.value = value;
                vmodel.floatValue = value;
            };

            vm.$init = function() {
                rating = avalon.parseHTML(ratingTemplate).firstChild;
                vm.rootElement = rating
                if (canEdit(element)) {
                    var parentNode = element.parentNode;
                    parentNode.insertBefore(rating, element);
                    parentNode.insertBefore(element, rating);
                    element.setAttribute("data-duplex-changed", "setByIp");
                    vmodel.$watch('value', function(v) {
                        element.value = v;
                    });
                } else {
                    vmodel.value = vmodel.floatValue = vmodel.defaultValue;
                    element.appendChild(rating);
                }
                avalon.scan(rating.parentNode, [vmodel].concat(vmodels));
                if (typeof options.onInit === "function") {
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            };

            vm.$remove = function() {
                rating.parentNode.removeChild(rating);
                rating = null;
            };

            vm.$watch('value', function(v) {
                onSelect.call(null, v,
                    data.ratingId, avalon(element).data());
            });

            vm.$watch('floatValue', function(v) {
                onFloat.call(null, v,
                    data.ratingId, avalon(element).data());
            });
        });

        return vmodel;
    };

    widget.defaults = {
        defaultValue: 3,
        max: 5,
        margin: 3,
        notSelectedColor: '#CECECE',
        notSelectedContent: '&#xf08A;',
        selectedColor: '#00A3C2',
        selectedContent: '&#xf038;',
        size: 20,
        getTemplate: function(tmp) {
            return tmp
        }
    };

    return avalon;
});
