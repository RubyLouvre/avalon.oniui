
define(["avalon", "text!./avalon.fileuploader.html",
    "./blob",
    "./runtime",
    "./spark-md5"], 
    function (avalon, template, blobConstructor, runtimeConstructor, md5) {
        var FILE_CACHED = 0; // 已被runtime缓存
        var FILE_QUEUED = 1; // 已进入发送队列
        var FILE_IN_UPLOADING = 5;  // 文件已经开始上传
        var FILE_UPLOADED = 6;  // 文件上传结束

        var FILE_ERROR_FAIL_READ = 101; // FileQueue无法读取文件
        var FILE_ERROR_FAIL_UPLOAD = 103;   // FileQueue发送文件时碰见错误


        var widgetName = 'fileuploader';
        var widget = avalon.ui[widgetName] = function(element, data, vmodels) {
        	var options = data[widgetName+'Options'],
                $element = avalon(element);

            var vmodel = avalon.define(data[widgetName+'Id'], function(vm) {
                avalon.mix(vm, options);

                vm.previews = [];

                vm.$runtime = null;

            	vm.$init = function() {
                    vm.$runtime = new runtimeConstructor(vm, md5);

                    vm.$runtime.attachEvent("beforeFileCache", function (plainFileObject) {
                        var isDuplicatedFile = false;
                        for (var i = 0; i < vm.previews.length; i++) {
                            if (vm.previews[i].md5 == plainFileObject.md5) {
                                isDuplicatedFile = true;
                                break;
                            }
                        }
                        if (isDuplicatedFile) {
                            alert("SAME FILE"); // TODO
                            return false;   // False会阻止runtime缓存文件。
                        } else {
                            vm.previews.push({
                                name: plainFileObject.name,
                                md5: plainFileObject.md5,
                                preview: plainFileObject.preview,
                                uploadProgress: 0,
                                uploadStatus: 0,
                                message: ""
                            });
                            return true;   // True让runtime继续缓存文件。
                        }
                    }, vm);
                    vm.$runtime.attachEvent("fileStatusChanged", function (fileObj, beforeStatus, afterStatus) {
                        var previewVm = this.getPreviewVmByMd5(this, fileObj.md5);
                        if (previewVm == null) {
                            debugger    // 如果走到这里，应该是个编程错误
                            return;
                        }
                        switch (afterStatus) {
                            case FILE_QUEUED:
                                previewVm.message = "QUEUED";
                                break;
                            case FILE_IN_UPLOADING:
                                previewVm.message = "UPLOADING";
                                break;
                            case FILE_UPLOADED:
                                previewVm.message = "UPLOADED";
                                previewVm.uploadProgress = 100;
                                break;
                            case FILE_ERROR_FAIL_READ:
                                previewVm.message = "FAIL_TO_READ";
                                debugger
                                alert(1)
                                break;
                            case FILE_ERROR_FAIL_UPLOAD:
                                previewVm.message = "FAIL_TO_UPLOAD";
                                break;
                            default:
                                break;
                        }
                    }, vm);
                    vm.$runtime.attachEvent("onFileProgress", function (fileObj, uploadedSize, fileSize) {
                        var previewVm = this.getPreviewVmByMd5(this, fileObj.md5);
                        if (previewVm == null) {
                            debugger    // 如果走到这里，应该是个编程错误
                            return;
                        }
                        previewVm.uploadProgress = Math.min(100, uploadedSize / fileSize);
                    }, vm);



	            	element.innerHTML = template;

                    vmodels = [vm].concat(vmodels);
                    avalon.scan(element, vmodels);
                    if(typeof vmodel.onInit === "function"){
                        vmodel.onInit.call(element, vmodel, options, vmodels)
                    }
	            };


                vm.$remove = function() {
                    this.$runtime.purge();
                };

                vm.addFiles = function (files) {
                    // 确保输入的参数是数组。
                    if (window.FileList != undefined && files instanceof FileList) {
                        var fTemp = [];
                        [].forEach.call(files, function (f) {
                            fTemp.push(f)
                        });
                        files = fTemp;
                    } else if (!Array.isArray(files)) {
                        files = [files];
                    }

                    files.forEach(function (f) {
                        if ((window.File != undefined && f instanceof File) || f.__flashfile) {
                            vm.$runtime.addFile(f);
                        }
                    });
                };
                
                vm.removeFile = function (fileObj) {
                    if (typeof vm.afterFileRemoved == "function") {
                        vm.afterFileRemoved.call(vm, fileObj);
                    }
                };

                vm.$skipArray = ["serverConfig", "md5Size", "acceptFileTypes", "previewWidth", "previewHeight", "enablePreviewGenerating", "chunked", "chunkSize", "noPreviewPath"];
            });
            return vmodel;
        };
        widget.defaults = {
            md5Size: 1024*64,
            acceptFileTypes: "*.gif,*.jpg,*.png,*.jpeg",
            previewWidth: 100,
            previewHeight: 85,
            enablePreviewGenerating: true,
            showPreview: true,
            showProgress: true,
            serverConfig: {
                url: "http://localhost:8081/Handler1.ashx",
                userName: undefined,
                password: undefined
            },
            chunked: true,
            chunkSize: 1024 * 100,
            noPreviewPath: "no-preview.png",
            $imageTypes: [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
            $previewFileTypes: {
                ".zip": "zip.png"
            },

            compareFileObjects: function (fileA, fileB) {
                return (!fileA.$blob || !fileA.$blob) ? (fileA.address == fileB.address) : (fileA.name == fileB.name || fileA.$blob.size == fileB.$blob.size);
            },
            isDuplicatedFile: function (opts, fileObj) {
                var hasSameFile = false;
                for (var i = 0; i < opts.files.length; i++) {
                    if (opts.compareFileObjects(opts.files[i], fileObj)) {
                        hasSameFile = true; 
                        break;
                    }
                }
                return hasSameFile;
            },
            uploadAll: function (opts) {
                opts.previews.forEach(function(p) {
                    opts.uploadFile(opts, p.md5);
                });
            },
            uploadFile: function (opts, index) {
                var fileMd5 = undefined,
                    inVarType = typeof index;
                if (inVarType == 'number') {
                    fileMd5 = opts.preview[i].md5;
                } else if (inVarType == 'string') {
                    fileMd5 = index;
                } else {
                    // 不接受Index或者Md5以外的参数类型
                    return;
                }

                opts.$runtime.queueFileByMd5(fileMd5);
            },
            getPreviewVmByMd5: function (opts, md5) {
                var previewVm = null;
                for (var i = 0; i < opts.previews.length; i++) {
                    if (opts.previews[i].md5 == md5) {
                        previewVm = opts.previews[i];
                        break;
                    }
                }
                return previewVm;
            },
            getFileConfigByExtName: function (opts, extName) {
                // flash会调用此方法获取文件类型的配置，但是opts只能传输vmId，所以opts在Flash调用时是vmId，需要转成vm本身
                if (typeof opts == 'string')
                    opts = avalon.vmodels[opts];


                var r = {
                    md5Size: opts.md5Size,
                    isImageFile: (opts.$imageTypes.indexOf(extName) >= 0),
                    enablePreview: opts.enablePreviewGenerating,
                    previewWidth: opts.previewWidth,
                    previewHeight: opts.previewHeight,
                    noPreviewPath: opts.noPreviewPath
                }
                if (!r.isImageFile && opts.$previewFileTypes.hasOwnProperty(extName)) {
                    r.noPreviewPath = opts.$previewFileTypes[extName];
                }
                return r;
            }
        };
        return avalon;
    }
);