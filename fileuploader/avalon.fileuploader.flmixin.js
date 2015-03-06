define(["avalon"], function() {
    return {
        getInputFiles: function (event) {
            return event;
        },

        isNewFile: function (key, file, vmId) {
            return avalon.vmodels[vmId].getFlashEl().isNewFile(key, file);
        },

        addManagedFile: function (key, file, vmId) {
            return avalon.vmodels[vmId].getFlashEl().addManagedFile(key, file);
        },

        generatePreview: function (key, file, callback, vmId) {
            avalon.vmodels[vmId].getFlashEl().generatePreview(key, file, "generatePreviewCallback", vmId);
        },

        fileManager: function (uploaderVm) {
            uploaderVm.useNativeInput = false;
            uploaderVm.flashId = "";
            this.init = function () {
                uploaderVm.flashId = uploaderVm.$id+"flash";
                var fileManager = this,
                    flashEl;
                var detectingFlashLoaded = setInterval(function(){
                    flashEl = fileManager.getFlashEl(uploaderVm.flashId);
                    if (!!flashEl && !!flashEl.loaded && flashEl.loaded()) {
                        clearInterval(detectingFlashLoaded);
                        flashEl.setContext({
                            vmId: uploaderVm.$id,
                            acceptFileTypes: uploaderVm.acceptFileTypes,
                            multipleFileAllowed: uploaderVm.multipleFileAllowed,
                            buttonStyle: {
                                label: "upload"
                            },
                            preview: {
                                generatePreview: true,
                                displayPreview: false,
                                height: uploaderVm.previewHeight,
                                width: uploaderVm.previewWidth,
                                callbackName: "previewGenerated"
                            }
                        });
                    }
                }, 50);
            };
            this.getFlashEl = function(id) {
                if(navigator.appName.indexOf("Microsoft")!=-1){
                    return window[id];
                } else {
                    return window.document[id];
                }
            }
        }
    };
});