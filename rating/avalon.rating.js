define(["../avalon.getModel", 'text!./avalon.rating.html'],
    function(avalon, sourceHTML) {

    var ratingTemplate = sourceHTML;

    var widget = avalon.ui.rating = function(element, data, vmodels) {
        var options = data.ratingOptions,
            parentNode = element.parentNode,
            changeVM = avalon.getModel('onSelect', vmodels),
            onSelect = changeVM && changeVM[1][changeVM[0]] || avalon.noop,
            value = parseInt(element.value),
            rating;

        options.value = element.value =
            (!value && value !== 0) ? options.value : value;

        var vmodel = avalon.define(data.ratingId, function(vm) {

            vm.value = vm.fixedValue = element.value;
            vm._max = options.max;
            vm._size = options.size;
            vm._selectedImg = options.imgUrls[0];
            vm._notSelectedImg = options.imgUrls[1];
            vm.list = new Array(options.max);

            vm.mouseover = function(index) {
                vm.fixedValue = index + 1;
            };

            vm.select = function(index) {
                vm.value = index + 1;
                onSelect.call(null, vm.value,
                    data.ratingId, avalon(element).data());
            };

            vm.mouseout = function() {
                vm.fixedValue = vm.value;
            };

            vm.$init = function() {
                rating = avalon.parseHTML(ratingTemplate).firstChild;
                parentNode.insertBefore(rating, element);
                parentNode.insertBefore(element, rating);
                avalon.scan(rating, [vmodel].concat(vmodels));
                if (element.tagName.toUpperCase() === 'INPUT') {
                    avalon.bind(element, 'change', function() {
                        vm.valve = vm.fixedValue =
                            parseInt(element.value);
                    });
                    vm.$watch('value', function(v) {
                        element.value = v;
                    });
                }
            };

            vm.$remove = function() {
                parentNode.removeChild(rating);
                rating = null;
                parentNode = null;
            };
        });

        return vmodel;
    };

    widget.defaults = {
        value: 3,
        max: 5,
        size: 20,
        imgUrls: ['rating_b.png', 'rating.png']
    };

    return avalon;
});
