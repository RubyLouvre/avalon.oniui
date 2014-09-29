define(["../avalon.getModel", 'text!./avalon.rating.html', 'css!../chameleon/oniui-common.css'],
    function(avalon, sourceHTML) {

    var ratingTemplate = sourceHTML,
        getFunc = function(name, vmodels) {
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
            rating;

        var vmodel = avalon.define(data.ratingId, function(vm) {

            avalon.mix(vm, options);

            vm.value = vm.floatValue = element.value;

            vm.list = new Array(options.max);

            vm.mouseover = function(index) {
                vm.floatValue = index + 1;
            };

            vm.select = function(index) {
                vm.value = index + 1;
            };

            vm.mouseout = function() {
                vm.floatValue = vm.value;
            };

            vm.setByIp = function() {
                var value = parseInt(element.value);
                if (value !== vm.value) {
                    vm.value = vm.floatValue = value ? value : 0;
                }
            };

            vm.$init = function() {
                rating = avalon.parseHTML(ratingTemplate).firstChild;
                if (canEdit(element)) {
                    var parentNode = element.parentNode;
                    parentNode.insertBefore(rating, element);
                    parentNode.insertBefore(element, rating);
                    element.setAttribute("data-duplex-changed", "setByIp");
                    vm.$watch('value', function(v) {
                        element.value = v;
                    });
                } else {
                    vm.value = vm.floatValue = vm.defaultValue;
                    element.appendChild(rating);
                }
                avalon.scan(rating.parentNode, [vmodel].concat(vmodels));
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
        notSelectedContent: '&#xf006;',
        selectedColor: '#00A3C2',
        selectedContent: '&#xf005;',
        size: 20
    };

    return avalon;
});
