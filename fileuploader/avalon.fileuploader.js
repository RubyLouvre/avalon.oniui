
define(["avalon", "text!./avalon.fileuploader.html", "./eventmixin",
    "./blob",   // NO EVENT MIXIN
    "./runtime",
    "./blobqueue",
    "./spark-md5",
    "mmRequest/mmRequest",
    "css!./avalon.fileuploader.css"], 
    function (avalon, template, eventMixin, blobConstructor, runtimeConstructor, blobqueueConstructor, md5) {
        var widgetName = 'fileuploader';
        var widget = avalon.ui[widgetName] = function(element, data, vmodels) {
        	var options = data[widgetName+'Options'],
                $element = avalon(element);


            var vmodel = avalon.define(data[widgetName+'Id'], function(vm) {
                avalon.mix(vm, options);

                var supportMultiple = (document.createElement('input').multiple != undefined),
                supportBase64Decode = (window.atob != undefined),
                supportCanvas = (document.createElement('canvas').getContext && document.createElement('canvas').getContext('2d'));

                vm.useHtml5Runtime = supportMultiple && supportBase64Decode && supportCanvas;
                vm.useFlashRuntime = !vm.useHtml5Runtime;

                vm.previews = [];
                
                eventMixin(blobqueueConstructor);
                eventMixin(runtimeConstructor);

                vm.$runtime = null;

                vm.onPreviewRemoveClicked = function (el) {
                    var md5 = el.md5;
                    vm.previews.remove(el);
                    vm.$runtime.removeFileByMd5(el.md5);
                }
                vm.addFileClicked = function (e) {
                    if (vm.useHtml5Runtime) {
                        var target = e.target || e.srcElement;
                        var $wrapper = avalon(target);
                        for (var i = 0; i < $wrapper.element.children.length; i++) {
                            var subNode = $wrapper.element.children[i];
                            if (subNode.type == "file" && subNode.nodeType == 1) {
                                subNode.click();
                                return;
                            }
                        }
                    }
                }
                vm.uploadClicked = function (event) {
                    vm.uploadAll(vm);
                };
                vm.onFileFieldChanged = function (event) {
                    var target = event.target || event.srcElement;
                    var files = target.files || target.value;
                    vm.addFiles(files);
                };
                // Flash和H5都会调用此方法来生成文件扩展名过滤
                vm.getInputAcceptTypes = function (_isFalsh) {
                    var types = vm.acceptFileTypes.split(",");
                    var allTypes = "*.*";
                    var specialTypes = ["image.*", "audio.*", "video.*"];

                    if (_isFalsh) {
                        if (types.indexOf(allTypes) >= 0) return [];

                        var allFilters = [];
                        // category = image.* or audio.* or video.*
                        var getMIME4SpecialType = function (category) {

                            var filters = [];
                            var categoryMime = category.replace(".*", "/"); //替换成 image/  audio/ video/
                            for (var i in vm.$mime) {
                                if (vm.$mime.hasOwnProperty(i) && vm.$mime[i].indexOf(categoryMime) == 0) {
                                    filters.push("*." + i);
                                }
                            }
                            allFilters.push({ description: categoryMime.replace("/", ""), types: filters.join(";") });
                        };
                        for (var i = 0; i < specialTypes.length; i++) {
                            if (types.indexOf(specialTypes[i]) >= 0) {
                                getMIME4SpecialType(specialTypes[i]);
                            }
                        }

                        for (var i = 0; i < types.length; i++) {
                            if (specialTypes.indexOf(types[i]) >= 0) continue;
                            var extNameNoDot = types[i].replace("*.","");
                            allFilters.push({ description: extNameNoDot, types:types[i] });
                        }
                        return allFilters;
                    } else {
                        if (types.indexOf(allTypes) >= 0) return "*/*";

                        for (var i = 0; i < types.length; i++) {
                            if (specialTypes.indexOf(types[i]) >= 0) {
                                types[i] = types[i].replace(".", "/");
                            } else if (vm.$mime.hasOwnProperty(types[i].replace(".",""))) {
                                types[i] = vm.$mime[types[i].replace(".","")] + '/' + types[i].replace(".","");
                            } else {
                                continue;
                            }
                        }
                        return types.join(",");
                    }
                }
            	vm.$init = function() {
                    vm.$runtime = new runtimeConstructor(vm, blobConstructor, blobqueueConstructor, md5);

                    vm.$runtime.attachEvent("beforeFileCache", function (plainFileObject) {
                        // 检查单个文件的尺寸
                        if (plainFileObject.size > vm.maxFileSize) {
                            vm.onFileOverSize.call(vm, plainFileObject);
                            avalon.log("****FileUploader: 文件尺寸超出限制。");
                            return false;
                        }

                        // 检查所有待上传文件的尺寸
                        if (vm.$runtime.getFilesSizeSum() + plainFileObject.size > vm.filePoolSize) {
                            vm.onFilePoolOverSize.call(vm, plainFileObject);
                            avalon.log("****FileUploader: 待上传文件尺寸超出限制。");
                            return false;
                        }

                        var isDuplicatedFile = false;
                        for (var i = 0; i < vm.previews.length; i++) {
                            if (vm.previews[i].md5 == plainFileObject.md5) {
                                isDuplicatedFile = true;
                                break;
                            }
                        }
                        if (isDuplicatedFile) {
                            vm.onSameFileAdded.call(vm, plainFileObject);
                            avalon.log("****FileUploader: 不能添加一样的文件。");
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
                            case vm.$runtime.FILE_QUEUED:
                                previewVm.message = "QUEUED";
                                break;
                            case vm.$runtime.FILE_IN_UPLOADING:
                                previewVm.message = "UPLOADING";
                                break;
                            case vm.$runtime.FILE_UPLOADED:
                                previewVm.message = "UPLOADED";
                                previewVm.uploadProgress = 100;
                                break;
                            case vm.$runtime.FILE_ERROR_FAIL_READ:
                                previewVm.message = "FAIL_TO_READ";
                                debugger
                                alert(1)
                                break;
                            case vm.$runtime.FILE_ERROR_FAIL_UPLOAD:
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



	            	element.innerHTML = template.replace(/##VM_ID##/ig, vm.$id);  // 将vmid附加如flash的url中

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
            maxFileSize: 1024*1024*100,
            filePoolSize: 1024*1024*200,
            chunkSize: 1024 * 100,
            chunked: false,

            addButtonText: "Add Files",
            uploadButtonText: "Upload",

            acceptFileTypes: "*.*",

            previewWidth: 100,
            previewHeight: 85,

            enablePreviewGenerating: true,
            showPreview: true,
            showProgress: true,

            multipleFileAllowed: true,
            serverConfig: {},
            noPreviewPath: "no-preview.png",
            $previewFileTypes: {
                ".zip": "zip.png"
            },

            $mime: {
                "acx": "application/internet-property-stream",
                "ai": "application/postscript",
                "aif": "audio/x-aiff",
                "aifc": "audio/x-aiff",
                "aiff": "audio/x-aiff",
                "asf": "video/x-ms-asf",
                "asr": "video/x-ms-asf",
                "asx": "video/x-ms-asf",
                "au": "audio/basic",
                "avi": "video/x-msvideo",
                "axs": "application/olescript",
                "bas": "text/plain",
                "bcpio": "application/x-bcpio",
                "bin": "application/octet-stream",
                "bmp": "image/bmp",
                "c": "text/plain",
                "cat": "application/vnd.ms-pkiseccat",
                "cdf": "application/x-cdf",
                "cer": "application/x-x509-ca-cert",
                "class": "application/octet-stream",
                "clp": "application/x-msclip",
                "cmx": "image/x-cmx",
                "cod": "image/cis-cod",
                "cpio": "application/x-cpio",
                "crd": "application/x-mscardfile",
                "crl": "application/pkix-crl",
                "crt": "application/x-x509-ca-cert",
                "csh": "application/x-csh",
                "css": "text/css",
                "dcr": "application/x-director",
                "der": "application/x-x509-ca-cert",
                "dir": "application/x-director",
                "dll": "application/x-msdownload",
                "dms": "application/octet-stream",
                "doc": "application/msword",
                "dot": "application/msword",
                "dvi": "application/x-dvi",
                "dxr": "application/x-director",
                "eps": "application/postscript",
                "etx": "text/x-setext",
                "evy": "application/envoy",
                "exe": "application/octet-stream",
                "fif": "application/fractals",
                "flr": "x-world/x-vrml",
                "gif": "image/gif",
                "gtar": "application/x-gtar",
                "gz": "application/x-gzip",
                "h": "text/plain",
                "hdf": "application/x-hdf",
                "hlp": "application/winhlp",
                "hqx": "application/mac-binhex40",
                "hta": "application/hta",
                "htc": "text/x-component",
                "htm": "text/html",
                "html": "text/html",
                "htt": "text/webviewhtml",
                "ico": "image/x-icon",
                "ief": "image/ief",
                "iii": "application/x-iphone",
                "ins": "application/x-internet-signup",
                "isp": "application/x-internet-signup",
                "jfif": "image/pipeg",
                "jpe": "image/jpeg",
                "jpeg": "image/jpeg",
                "jpg": "image/jpeg",
                "js": "application/x-javascript",
                "latex": "application/x-latex",
                "lha": "application/octet-stream",
                "lsf": "video/x-la-asf",
                "lsx": "video/x-la-asf",
                "lzh": "application/octet-stream",
                "m13": "application/x-msmediaview",
                "m14": "application/x-msmediaview",
                "m3u": "audio/x-mpegurl",
                "man": "application/x-troff-man",
                "mdb": "application/x-msaccess",
                "me": "application/x-troff-me",
                "mht": "message/rfc822",
                "mhtml": "message/rfc822",
                "mid": "audio/mid",
                "mny": "application/x-msmoney",
                "mov": "video/quicktime",
                "movie": "video/x-sgi-movie",
                "mp2": "video/mpeg",
                "mp3": "audio/mpeg",
                "mpa": "video/mpeg",
                "mpe": "video/mpeg",
                "mpeg": "video/mpeg",
                "mpg": "video/mpeg",
                "mpp": "application/vnd.ms-project",
                "mpv2": "video/mpeg",
                "ms": "application/x-troff-ms",
                "mvb": "application/x-msmediaview",
                "nws": "message/rfc822",
                "oda": "application/oda",
                "png": "image/png",
                "p10": "application/pkcs10",
                "p12": "application/x-pkcs12",
                "p7b": "application/x-pkcs7-certificates",
                "p7c": "application/x-pkcs7-mime",
                "p7m": "application/x-pkcs7-mime",
                "p7r": "application/x-pkcs7-certreqresp",
                "p7s": "application/x-pkcs7-signature",
                "pbm": "image/x-portable-bitmap",
                "pdf": "application/pdf",
                "pfx": "application/x-pkcs12",
                "pgm": "image/x-portable-graymap",
                "pko": "application/ynd.ms-pkipko",
                "pma": "application/x-perfmon",
                "pmc": "application/x-perfmon",
                "pml": "application/x-perfmon",
                "pmr": "application/x-perfmon",
                "pmw": "application/x-perfmon",
                "pnm": "image/x-portable-anymap",
                "pot,": "application/vnd.ms-powerpoint",
                "ppm": "image/x-portable-pixmap",
                "pps": "application/vnd.ms-powerpoint",
                "ppt": "application/vnd.ms-powerpoint",
                "prf": "application/pics-rules",
                "ps": "application/postscript",
                "pub": "application/x-mspublisher",
                "qt": "video/quicktime",
                "ra": "audio/x-pn-realaudio",
                "ram": "audio/x-pn-realaudio",
                "ras": "image/x-cmu-raster",
                "rgb": "image/x-rgb",
                "rmi": "audio/mid",
                "roff": "application/x-troff",
                "rtf": "application/rtf",
                "rtx": "text/richtext",
                "scd": "application/x-msschedule",
                "sct": "text/scriptlet",
                "setpay": "application/set-payment-initiation",
                "setreg": "application/set-registration-initiation",
                "sh": "application/x-sh",
                "shar": "application/x-shar",
                "sit": "application/x-stuffit",
                "snd": "audio/basic",
                "spc": "application/x-pkcs7-certificates",
                "spl": "application/futuresplash",
                "src": "application/x-wais-source",
                "sst": "application/vnd.ms-pkicertstore",
                "stl": "application/vnd.ms-pkistl",
                "stm": "text/html",
                "svg": "image/svg+xml",
                "sv4cpio": "application/x-sv4cpio",
                "sv4crc": "application/x-sv4crc",
                "swf": "application/x-shockwave-flash",
                "t": "application/x-troff",
                "tar": "application/x-tar",
                "tcl": "application/x-tcl",
                "tex": "application/x-tex",
                "texi": "application/x-texinfo",
                "texinfo": "application/x-texinfo",
                "tgz": "application/x-compressed",
                "tif": "image/tiff",
                "tiff": "image/tiff",
                "tr": "application/x-troff",
                "trm": "application/x-msterminal",
                "tsv": "text/tab-separated-values",
                "txt": "text/plain",
                "uls": "text/iuls",
                "ustar": "application/x-ustar",
                "vcf": "text/x-vcard",
                "vrml": "x-world/x-vrml",
                "wav": "audio/x-wav",
                "wcm": "application/vnd.ms-works",
                "wdb": "application/vnd.ms-works",
                "wks": "application/vnd.ms-works",
                "wmf": "application/x-msmetafile",
                "wps": "application/vnd.ms-works",
                "wri": "application/x-mswrite",
                "wrl": "x-world/x-vrml",
                "wrz": "x-world/x-vrml",
                "xaf": "x-world/x-vrml",
                "xbm": "image/x-xbitmap",
                "xla": "application/vnd.ms-excel",
                "xlc": "application/vnd.ms-excel",
                "xlm": "application/vnd.ms-excel",
                "xls": "application/vnd.ms-excel",
                "xlt": "application/vnd.ms-excel",
                "xlw": "application/vnd.ms-excel",
                "xof": "x-world/x-vrml",
                "xpm": "image/x-xpixmap",
                "xwd": "image/x-xwindowdump",
                "z": "application/x-compress",
                "zip": "application/zip"
            },

            onFileOverSize: avalon.noop,
            onSameFileAdded: avalon.noop,
            onFilePoolOverSize: avalon.noop,

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


                var extNameNoDot = extName.replace(".", "");
                var r = {
                    md5Size: opts.md5Size,
                    isImageFile: (opts.$mime.hasOwnProperty(extNameNoDot) && opts.$mime[extNameNoDot].indexOf("image/") == 0),
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