define(["avalon"], function() {
    return {
        fileManager: function (uploaderVm) {
            var fileManager = this,
                managedFiles = {};
            
            uploaderVm.useNativeInput = true;
            uploaderVm.onFileFieldChanged = function (event) {
                var files = event.target.files,
                    fileKey;

                for (var i = 0; i < files.length; i++) {
                    fileKey = uploaderVm.getFileKey(files[i]);

                    if (!managedFiles.hasOwnProperty(fileKey)) {
                        managedFiles[fileKey] = files[0];
                        if (uploaderVm.showPreview) {
                            generatePreview(fileKey, files[i], uploaderVm.previewGenerated, uploaderVm.$id);
                        }
                    }
                }
            };

            uploaderVm.getFileKey = function (file) {
                return [file.name, file.size, file.type].join("");
            };

            uploaderVm.uploadClicked = function (event) {
                var files = getInputField(event).files,
                    i = 0;

                var file = files[i],
                    fileSize = file.size;

  

                // formData.append('upload', files[0]);
                // formData.append('xx', "x");
                // var fireRequest = new avalon.xhr();
                // fireRequest.open("POST", uploaderVm.fileServerUrl, true, uploaderVm.serverUserName, uploaderVm.serverPassword);
                // fireRequest.upload.onprogress = function(e) {
                //     if (e.lengthComputable) {
                //         avalon.log((e.loaded / e.total) * 100);
                //     }
                // };
                // fireRequest.send(true);
            };

            /** Button点击后打开文件选择框的事件绑定 **/
            uploaderVm.addFileClicked = function(event) {
                getInputField(event).click();
            };

            function generatePreview (key, file, callback, vmId) {
                var reader = new FileReader(),
                    vm = avalon.vmodels[vmId]; 

                reader.onload = function(e) {
                    var img = new Image(),
                        canvasEl = document.createElement("canvas");
                    canvasEl.width = vm.previewWidth;
                    canvasEl.height = vm.previewHeight;

                    img.onload = function () {
                        // 压缩图像
                        var ctx = canvasEl.getContext('2d'),
                            imgWidth = img.width,
                            imgHeight = img.height,
                            imageAspectRatio = imgWidth / imgHeight,
                            canvasAspectRatio = vm.previewWidth / vm.previewHeight,
                            drawX = drawY = 0,
                            drawHeight = vm.previewHeight,
                            drawWidth = vm.previewWidth;

                        if (imageAspectRatio > canvasAspectRatio) {
                            drawHeight = imgHeight * vm.previewWidth / imgWidth;
                            drawY = (vm.previewHeight - drawHeight) / 2;
                        } else if (imageAspectRatio < canvasAspectRatio) {
                            drawWidth = imgWidth * vm.previewHeight / imgHeight;
                            drawX = (vm.previewWidth - drawWidth) / 2;
                        }
                        // ctx.fillStyle = '#a3a3a3';
                        // ctx.fillRect(0,0, vm.previewWidth, vm.previewHeight);

                        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                        callback.call(vm, key, canvasEl.toDataURL("image/png"));
                        ctx.clearRect(0, 0, vm.previewWidth, vm.previewHeight);
                    }
                    img.src = this.result;
                }
                reader.readAsDataURL(file); 
            }

            function getInputField(event) {
                var $wrapper = avalon(event.target.parentNode);
                for (var i = 0; i < $wrapper.element.children.length; i++) {
                    var subNode = $wrapper.element.children[i];
                    if (subNode.type == "file" && subNode.nodeType == 1) {
                        return subNode;
                    }
                }
                return null;
            }
            return this;
        },

        previewManager: function (uploaderVm) {
            uploaderVm.previews = [];
            this.push = function (key, base64Preview) {
                if (!uploaderVm.multipleFileAllowed) {
                    while(uploaderVm.previews.length > 0) {
                        avalon.Array.removeAt(uploaderVm.previews, 0);
                    }
                }
                uploaderVm.previews.push({
                    key: key,
                    img: base64Preview
                });
            };
            return this;
        }
    };
});