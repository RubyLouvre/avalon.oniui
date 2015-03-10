
define(["avalon", "text!./avalon.fileuploader.html", 
    "./avalon.fileuploader.h5mixin", 
    "./avalon.fileuploader.flmixin", 
    "./avalon.fileuploader.previewmanager",
    "mmRequest/mmRequest", 
    "mmPromise/mmPromise"], 
    function (avalon, template, h5mixin, flmixin, previewManager) {
        var widgetName = 'fileuploader';
        var widget = avalon.ui[widgetName] = function(element, data, vmodels) {
        	var options = data[widgetName+'Options'],
                $element = avalon(element);

            var vmodel = avalon.define(data[widgetName+'Id'], function(vm) {
            	avalon.mix(vm, options);
                vm.$fileManager = new h5mixin.fileManager(vm);
	            vm.$previewManager = new previewManager(vm);
                vm.base64Preview = true;
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
	            vm.previewGenerated = function(key, priview, fileName) {
	            	vm.$previewManager.push(key, priview, fileName);
	            };
                vm.getPreviewConfig = function(fileType) {
                    var config = vm.$previewFileTypes[fileType];
                    return !config ? vm.noPreviewPath : config;
                }
                vm.removePreviewByKey = function(fileKey) {
                    vm.$previewManager.remove(fileKey);
                }
                vm.removeFileByKey = function(fileKey) {
                    vm.$fileManager.remove(fileKey);
                }
                vm.isImagePreviewConfig = function(previewConfig) {
                    return previewConfig == "#image-preview";
                }
                vm.onRemoveClick = function (event) {
                    var fileKey = avalon(event.target.parentNode).attr("file-id");
                    vm.removeFileByKey(fileKey);
                    vm.removePreviewByKey(fileKey);
                }
                vm.setUploadedPrgress = function (fileKey, progress) {
                    vm.$previewManager.setProgress(fileKey, progress);
                }
            });
            return vmodel;
        };
        widget.defaults = {
            preview: 0,
            acceptFileTypes: "*.gif,*.jpg,*.png,*.jpeg",
            previewWidth: 100,
            previewHeight: 85,
            showPreview: true,
            showProgress: true,
            multipleFileAllowed: true,
            fileServerUrl: "http://localhost:53066/Handler1.ashx",
            serverUserName: undefined,
            serverPassword: undefined,
            chunked: true,
            chunkSize: 1024 * 1024,
            maxThred: 3,
            noPreviewPath: "no-preview.png",
            $previewFileTypes: {
                ".png": "#image-preview",
                ".jpg": "#image-preview",
                ".jpeg": "#image-preview",
                ".gif": "#image-preview",
                ".bmp": "#image-preview",
                ".zip": "zip.png"
            }
        };
        return avalon;
    }
);