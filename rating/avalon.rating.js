define(["../avalon.getModel", 'text!./avalon.rating.html'],
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

            vm.value = vm.floatValue = element.value;
            vm._max = options.max;
            vm._size = options.size;
            vm._selectedImg = options.imgUrls[0];
            vm._notSelectedImg = options.imgUrls[1];
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
                if (element.value) {
                    var value = parseInt(element.value);
                    vm.value = vm.floatValue = (!value && value !== 0) ? options.defaultValue : value;
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
                    vm.value = vm.floatValue = options.defaultValue;
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
        imgUrls: ['rating_b.png', 'rating.png'],
        max: 5,
        size: 20
    };

    return avalon;
});
