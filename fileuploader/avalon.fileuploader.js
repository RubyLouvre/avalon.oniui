
define(["avalon", "text!./avalon.fileuploader.html", "browser/avalon.browser", "./eventmixin",
    "./blob",
    "./file",
    "./flasheventhub",
    "./runtime",
    "./blobqueue",
    "./spark-md5",
    "./inputproxy",
    "mmRequest/mmRequest",
    "css!./avalon.fileuploader.css"], 
    function (avalon, template, browser, eventMixin, blobConstructor, fileConstructor, fehConstructor, runtimeConstructor, blobqueueConstructor, md5gen, inputProxyContructor) {
        var widgetName = 'fileuploader';
        var widget = avalon.ui[widgetName] = function(element, data, vmodels) {
        	var options = data[widgetName+'Options'],
                $element = avalon(element);


            var vmodel = avalon.define(data[widgetName+'Id'], function(vm) {
                avalon.mix(vm, options);

                var supportMultiple = (document.createElement('input').multiple != undefined),
                    supportFile = (window.file != undefined),
                    supportCanvas = (document.createElement('canvas').getContext && document.createElement('canvas').getContext('2d')),
                    isIE = avalon.browser.name.toLowerCase() == 'ie',
                    version = avalon.browser.version;

                vm.$supportBase64Img = (!isIE) || (version >= 8);
                vm.$base64Limitation = (isIE && version == 8) ? 32 * 1024 : Number.MAX_VALUE;
                vm.useHtml5Runtime = supportMultiple && supportFile && supportCanvas;
                vm.useFlashRuntime = true;

                vm.previews = [];
                
                eventMixin(blobConstructor);
                eventMixin(inputProxyContructor);
                eventMixin(blobqueueConstructor);
                eventMixin(runtimeConstructor);
                eventMixin(fileConstructor);

                vm.$md5gen = md5gen;

                vm.$runtime = null;

                vm.onPreviewRemoveClicked = function (el) {
                    var fileLocalToken = el.fileLocalToken;
                    vm.previews.remove(el);
                    vm.$runtime.removeFileByToken(el.fileLocalToken);
                }
                vm.addFileClicked = function (e) {
                    var target = e.target || e.srcElement;
                    if (!vm.__inputRegisted) {
                        vm.registInput(vm, target, true);
                        vm.__inputRegisted = true;
                    }
                    if (vm.useHtml5Runtime) {
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

                vm.$flashEventHub = undefined;
                vm.$fileInputProxy = undefined;

                vm.registInput = function (opts, target, isH5) {
                    if (typeof opts == 'string') {
                        opts = avalon.vmodels[opts];
                    }

                    var flashOrInput = undefined;

                    if (isH5) {
                        flashOrInput = target;
                    } else {
                        var flash = undefined;
                        if(navigator.appName.indexOf("Microsoft")!=-1){
                            flash = window.document.getElementById(target);
                        } else {
                            flash = window.document[target];
                        }
                        opts.$flashEventHub = new fehConstructor(flash);
                        flashOrInput = opts.$flashEventHub;
                    }

                    opts.$fileInputProxy = new inputProxyContructor(flashOrInput, isH5, {
                        fn: opts.getFileContext,
                        scope: opts
                    });
                    opts.$fileInputProxy.attachEvent("newFileSelected", function(fileInfo) {
                        var fileObj = new fileConstructor(fileInfo, this.$flashEventHub, this.chunked, this.chunkSize, blobConstructor);
                        fileObj.attachEvent("fileStatusChanged", this.onFileStatusChanged, this);

                        fileObj.attachEvent("fileProgressed", function (f, p) {
                            var previewVm = this.getPreviewVmByfileLocalToken(this, f.fileLocalToken);
                            if (!previewVm) return;
                            previewVm.uploadProgress = p;
                        }, this);

                        this.$runtime.addFile(fileObj);
                        this.previews.push({
                            name: fileInfo.name,
                            fileLocalToken: fileInfo.fileLocalToken,
                            preview: fileInfo.preview,
                            uploadProgress: fileInfo.progress,
                            uploadStatus: fileObj.status,
                            done: false,
                            size: fileObj.size,
                            message: "" // 显示在进度条上的文本
                        });
                    }, opts);

                    opts.$fileInputProxy.attachEvent("previewGenerated", function(fileLocalToken, preview) {
                        var previewVm = this.getPreviewVmByfileLocalToken(this, fileLocalToken);
                        if (!previewVm || previewVm.preview == preview) return;
                        previewVm.preview = preview;
                    }, opts)
                };

                vm.uploadClicked = function (event) {
                    vm.uploadAll(vm);
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
                    vm.$runtime = new runtimeConstructor(vm, blobqueueConstructor);

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
                            vm.$runtime.tryAddFile(f);
                        }
                    });
                };
                
                vm.removeFile = function (fileObj) {
                    if (typeof vm.afterFileRemoved == "function") {
                        vm.afterFileRemoved.call(vm, fileObj);
                    }
                };

                vm.$skipArray = [
                    "maxFileSize", "filePoolSize", "chunked", "chunkSize", 
                    "acceptFileTypes", "previewWidth", "previewHeight", "enablePreviewGenerating",
                    "enableRemoteKeyGen", "enableMd5Validation", "serverConfig", "noPreviewPath",
                    "previewFileTypes", "requiredParamsConfig", "__inputRegisted"
                    ];
            });
            return vmodel;
        };
        widget.defaults = {
            maxFileSize: 1024*1024*10,
            filePoolSize: 1024*1024*200,
            chunkSize: 1024 * 1024,
            chunked: false,

            __inputRegisted: false,

            addButtonText: "Add Files",
            uploadButtonText: "Upload",

            acceptFileTypes: "*.*",

            previewWidth: 100,
            previewHeight: 85,

            enablePreviewGenerating: true,
            showPreview: true,
            showProgress: true,

            multipleFileAllowed: true,
            enableRemoteKeyGen: false,
            enableMd5Validation: false,
            serverConfig: {
                timeout: 30000,
                concurrentRequest: 3,
                userName: undefined,
                password: undefined,
                url: undefined,
                previewUrl: undefined,
                keyGenUrl: undefined
            },
            noPreviewPath: "no-preview.png",
            previewFileTypes: { },

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

            requiredParamsConfig: {
                blobParamName: "blob",
                fileTokenParamName: "fileKey",
                totalChunkParamName: "total",
                chunkIndexParamName: "chunk",
                fileNameParamName: "fileName",
                blobMd5ParamName: "md5"
            },

            onFileOverSize: avalon.noop,
            onSameFileAdded: avalon.noop,
            onFilePoolOverSize: avalon.noop,
            madeRequestParams: avalon.noop,

            uploadAll: function (opts) {
                opts.previews.forEach(function(p) {
                    if (p.done) return;
                    opts.uploadFile(opts, p.fileLocalToken);
                });
            },
            uploadFile: function (opts, index) {
                var fileLocalToken = undefined,
                    inVarType = typeof index;
                if (inVarType == 'number') {
                    fileLocalToken = opts.preview[i].fileLocalToken;
                } else if (inVarType == 'string') {
                    fileLocalToken = index;
                } else {
                    // 不接受Index或者token以外的参数类型
                    return;
                }

                opts.$runtime.queueFileByToken(fileLocalToken);
            },
            getPreviewVmByfileLocalToken: function (opts, fileLocalToken) {
                var previewVm = null;
                for (var i = 0; i < opts.previews.length; i++) {
                    if (opts.previews[i].fileLocalToken == fileLocalToken) {
                        previewVm = opts.previews[i];
                        break;
                    }
                }
                return previewVm;
            },

            getFileKey: function (opts, fileObj, callback, scope) {
                var promise = new Promise(function (resolve, reject) {
                    if (opts.enableRemoteKeyGen) {
                        opts.remoteFileKeyGen(opts, fileObj, resolve, reject);
                    } else {
                        opts.localFileKeyGen(opts, fileObj, resolve, reject);
                    }
                });

                promise.then(function(key) {
                    callback.call(scope, key, true);
                }, function (reason) {
                    callback.call(scope, undefined, false);
                });
            },

            localFileKeyGen: function (opts, fileObj, resolve, reject) {
                resolve(opts.$md5gen(fileObj.name + "#" + fileObj.size + "#" + fileObj.fileLocalToken));
            },

            getMd5: function (opts, bytes) {
                return opts.$md5gen(bytes);
            },

            remoteFileKeyGen: function (opts, fileObj, resolve, reject) {
                avalon.ajax({
                    type: "get",
                    url: opts.serverConfig.keyGenUrl,
                    timeout: opts.serverConfig.timeout || 30000,
                    password: opts.serverConfig.password,
                    username: opts.serverConfig.userName,
                    cache: false,
                    success: function (response) {
                        resolve(response);
                    },
                    error: function (textStatus, error) {
                        reject(error);
                    }
                });
            },

            compareFileObjects: function(f1, f2) {
                return f1.size == f2.size && f1.name == f2.name;
            },
            getFileContext: function (basicFileInfo) {
                var context = {
                    canBeAdded: this.testFileBasicInfo(this, basicFileInfo),
                    defaultPreview: false,
                    enablePreviewGen: false,
                    previewWidth: 0,
                    previewHeight: 0,
                    fileLocalToken: undefined,
                    previewUrl: this.serverConfig.previewUrl || null,
                    timeout: this.serverConfig.timeout || null,
                    userName: this.serverConfig.userName || null,
                    password: this.serverConfig.password || null,
                    $env: {
                        supportBase64Img: this.$supportBase64Img,
                        base64Limitation: this.$base64Limitation
                    }
                };

                if (context.canBeAdded) {
                    var fileName = basicFileInfo.name;
                    var fileConfig = this.getFileConfigByExtName(this, fileName.substr(fileName.lastIndexOf('.')));

                    context.defaultPreview = fileConfig.noPreviewPath;
                    context.enablePreviewGen = fileConfig.enablePreview && fileConfig.isImageFile;
                    context.previewWidth = fileConfig.previewWidth;
                    context.previewHeight = fileConfig.previewHeight;
                }
                return context;
            },
            testFileBasicInfo: function (opts, basicFileInfo) {
                var sizeOk = opts.testFileSize(opts, basicFileInfo);
                if (sizeOk) {
                    for (var i = 0; i < opts.previews.length; i++) {
                        if (opts.compareFileObjects(opts.previews[i], basicFileInfo)) {
                            opts.onSameFileAdded.call(opts, basicFileInfo);
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            },
            /*
             * 检查一个FileObj的文件大小是否符合规定。第一需要满足单个文件尺寸限制，第二需要满足文件池大小的限制。
             */
            testFileSize: function (opts, fileObj) {
                var fileSizeLimitation = opts.maxFileSize,
                    poolSizeLimitation = opts.filePoolSize,
                    size = fileObj.size;
                
                var fileSizeOK = (fileSizeLimitation <= 0) || (size <= fileSizeLimitation);
                var poolSizeOK = (poolSizeLimitation <= 0) || (opts.$runtime.getFilesSizeSum() + size <= poolSizeLimitation);

                if (fileSizeOK && poolSizeOK) {
                    return true;
                } else if (!fileSizeOK) {
                    opts.onFileOverSize.call(opts, fileObj);
                } else {
                    opts.onFilePoolOverSize.call(opts, fileObj);
                }
                return false;
            },

            onFileStatusChanged: function (fileObj, beforeStatus, afterStatus) {
                var previewVm = this.getPreviewVmByfileLocalToken(this, fileObj.fileLocalToken);
                if (previewVm == null && beforeStatus != null && afterStatus != fileObj.FILE_CACHED) {
                    debugger    // 如果走到这里，应该是个编程错误
                    return;
                }
                switch (afterStatus) {
                    case fileObj.FILE_CACHED:
                        break;
                    case fileObj.FILE_QUEUED:
                        previewVm.message = "QUEUED";
                        break;
                    case fileObj.FILE_IN_UPLOADING:
                        previewVm.message = "UPLOADING";
                        break;
                    case fileObj.FILE_UPLOADED:
                        previewVm.message = "UPLOADED";
                        previewVm.uploadProgress = 100;
                        previewVm.done = true;
                        break;
                    case fileObj.FILE_ERROR_FAIL_READ:
                        previewVm.message = "FAIL_TO_READ";
                        break;
                    case fileObj.FILE_ERROR_FAIL_UPLOAD:
                        previewVm.message = "FAIL_TO_UPLOAD";
                        break;
                    default:
                        break;
                }
            },

            getFileConfigByExtName: function (opts, extName) {
                // flash会调用此方法获取文件类型的配置，但是opts只能传输vmId，所以opts在Flash调用时是vmId，需要转成vm本身
                if (typeof opts == 'string')
                    opts = avalon.vmodels[opts];


                var extNameNoDot = extName.replace(".", "").toLowerCase();
                var r = {
                    isImageFile: (opts.$mime.hasOwnProperty(extNameNoDot) && opts.$mime[extNameNoDot].indexOf("image/") == 0),
                    enablePreview: opts.enablePreviewGenerating,
                    previewWidth: opts.previewWidth,
                    previewHeight: opts.previewHeight,
                    noPreviewPath: opts.noPreviewPath,
                    fileSizeLimitation: opts.maxFileSize
                }
                if (!r.isImageFile && opts.previewFileTypes.hasOwnProperty(extName)) {
                    r.noPreviewPath = opts.previewFileTypes[extName];
                }
                return r;
            }
        };
        return avalon;
    }
);