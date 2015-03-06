
define(["avalon", "text!./avalon.fileuploader.html", "./avalon.fileuploader.h5mixin", "./avalon.fileuploader.flmixin", "mmRequest/mmRequest", "mmPromise/mmPromise"], 
    function (avalon, template, h5mixin, flmixin) {
        var widgetName = 'fileuploader';
        var widget = avalon.ui[widgetName] = function(element, data, vmodels) {
        	var options = data[widgetName+'Options'],
                $element = avalon(element);

            var vmodel = avalon.define(data[widgetName+'Id'], function(vm) {
            	avalon.mix(vm, options);
	            vm.$fileManager = new flmixin.fileManager(vm);
	            vm.$previewManager = new h5mixin.previewManager(vm);
            	vm.$init = function() {
	            	element.innerHTML = template;

	            	if (vm.$fileManager.init) vm.$fileManager.init();
	            	if (vm.$previewManager.init) vm.$previewManager.init();

                    vmodels = [vm].concat(vmodels);
                    avalon.scan(element, vmodels);
                    if(typeof vmodel.onInit === "function"){
                        vmodel.onInit.call(element, vmodel, options, vmodels)
                    }
	            };
                vm.$remove = function() {
                };
	            vm.previewGenerated = function(key, base64Preview) {
	            	vm.$previewManager.push(key, base64Preview);
	            }
            });
            return vmodel;
        };
        widget.defaults = {
            preview: 0,
            acceptFileTypes: "*.gif,*.jpg,*.png,*.jpeg",
            previewWidth: 80,
            previewHeight: 80,
            showPreview: true,
            multipleFileAllowed: false,
            fileServerUrl: "http://localhost:53066/Handler1.ashx",
            serverUserName: undefined,
            serverPassword: undefined,
            chunked: true,
            chunkSize: 1024 * 1024
        };
        return avalon;
    }
);