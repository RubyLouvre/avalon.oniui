define(["avalon", "./spark-md5"], function(avalon, fileKeyGen) {
    return {
        fileManager: function (uploaderVm) {
            var fileManager = this,
                managedFiles = {};
            
            uploaderVm.useNativeInput = true;

            function getFileExtensionName(fileName) {
                var dotIndex = fileName.lastIndexOf('.');
                return dotIndex > 0 ? fileName.substr(dotIndex) : "";
            }

            function generatePreview(uploaderVm, fileName, fileKey, readerResult) {
                var fileType = getFileExtensionName(fileName),
                    previewConfig = uploaderVm.getPreviewConfig(fileType);

                // 生成新文件的预览
                if (uploaderVm.isImagePreviewConfig(previewConfig)) {
                    var img = new Image();
                    img.onload = function () {
                        // 压缩图像
                        var canvasEl = document.createElement("canvas"),
                            ctx = canvasEl.getContext('2d'),
                            imgWidth = img.width,
                            imgHeight = img.height,
                            imageAspectRatio = imgWidth / imgHeight,
                            canvasAspectRatio = uploaderVm.previewWidth / uploaderVm.previewHeight,
                            drawX = drawY = 0,
                            drawHeight = uploaderVm.previewHeight,
                            drawWidth = uploaderVm.previewWidth;

                        canvasEl.width = uploaderVm.previewWidth;
                        canvasEl.height = uploaderVm.previewHeight
                        if (imageAspectRatio > canvasAspectRatio) {
                            drawHeight = imgHeight * uploaderVm.previewWidth / imgWidth;
                            drawY = (uploaderVm.previewHeight - drawHeight) / 2;
                        } else if (imageAspectRatio < canvasAspectRatio) {
                            drawWidth = imgWidth * uploaderVm.previewHeight / imgHeight;
                            drawX = (uploaderVm.previewWidth - drawWidth) / 2;
                        }
                        // ctx.fillStyle = '#a3a3a3';
                        // ctx.fillRect(0,0, vm.previewWidth, vm.previewHeight);

                        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                        uploaderVm.previewGenerated.call(uploaderVm, fileKey, canvasEl.toDataURL("image/png"), fileName);
                        ctx.clearRect(0, 0, uploaderVm.previewWidth, uploaderVm.previewHeight);
                    }
                    img.onerror = function () {
                        uploaderVm.previewGenerated.call(uploaderVm, fileKey, uploaderVm.noPreviewPath, fileName);
                    }
                    img.src = readerResult;
                } else {
                    uploaderVm.previewGenerated.call(uploaderVm, fileKey, previewConfig, fileName);
                }
            }

            uploaderVm.onFileFieldChanged = function (event) {
                var files = event.target.files;

                for (var i = 0; i < files.length; i++) {
                    (function(file){
                        var fileKey;
                        new Promise(function(resolve, reject) {
                            var reader = new FileReader()
                        
                            reader.onload = function() {
                                resolve(reader.result);
                            };
                            reader.readAsDataURL(file);
                        }).then(function(readerResult) {
                            // 生成文件Key。默认采用MD5
                            fileKey = fileKeyGen(file.name);

                            // 查找文件，如果已经添加过就结束。
                            if (managedFiles.hasOwnProperty(fileKey)) return;
                            managedFiles[fileKey] = file;
                            
                            if (uploaderVm.showPreview) generatePreview(uploaderVm, file.name, fileKey, readerResult);
                        }, function() {
                            if (!!fileKey) {
                                delete managedFiles[fileKey];
                                uploaderVm.removePreviewByKey(fileKey);
                            }
                        });
                    }(files[i]));
                }
            };

            uploaderVm.uploadClicked = function (event) {
                for (var fileKey in managedFiles) {
                    var file = managedFiles[fileKey],
                        fileSize = file.size,
                        chunkAmount = uploaderVm.chunked ? Math.ceil(fileSize / uploaderVm.chunkSize) : 1,
                        fileBlobStart = 0,
                        fileBlobEnd = chunkAmount == 1 ? fileSize : uploaderVm.chunkSize,
                        fileType = getFileExtensionName(file.name),
                        allChunkProgress = [];

                    for (var j = 0; j < chunkAmount; j++) {
                        var formData = new FormData();
                        formData.append('blob', file.slice(fileBlobStart, fileBlobEnd));
                        fileBlobStart = fileBlobEnd;
                        fileBlobEnd = Math.min(fileBlobEnd + uploaderVm.chunkSize, fileSize);
                        formData.append('fileKey', fileKey);
                        formData.append('total', chunkAmount);
                        formData.append('chunk', j);
                        formData.append('fileType', fileType);
                        allChunkProgress.push({ uploadedBytes: 0 });

                        ((function (progressObj) {
                            var fireRequest = new avalon.xhr();
                            fireRequest.open("POST", uploaderVm.fileServerUrl, true, uploaderVm.serverUserName, uploaderVm.serverPassword);
                            fireRequest.upload.onprogress = function(e) {
                                if (e.lengthComputable) {
                                    progressObj.uploadedBytes = e.loaded;
                                    var total = 0;
                                    allChunkProgress.forEach(function (g) {
                                        total += g.uploadedBytes;
                                    });
                                    uploaderVm.setUploadedPrgress(fileKey, Math.round(total / fileSize * 100));
                                }
                            };
                            fireRequest.send(formData);
                        })(allChunkProgress[allChunkProgress.length - 1]));
                    }
                }
            };

            /** Button点击后打开文件选择框的事件绑定 **/
            uploaderVm.addFileClicked = function(event) {
                getInputField(event).click();
            };

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

            this.remove = function (fileKey) {
                delete managedFiles[fileKey];
            };

            this.getFileLocalPath = function (fileKey) {
                return false; // For security reason, the mordern browsers does not allow access to absolute path & file systems directly to Javascript
            };
            return this;
        }
    };
});