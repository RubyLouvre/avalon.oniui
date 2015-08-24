 /**
 * @cnName 上传组件
 * @enName FileUploader
 * @introduce
 *    <p>文件上传组件。支持预览、大文件和分块上传。</p>
 *  @updatetime 2015-4-10
 */
define(["avalon", "text!./avalon.fileuploader.html", "browser/avalon.browser", "./eventmixin",
    "./blob",
    "./file",
    "./flasheventhub",
    "./runtime",
    "./blobqueue",
    "./spark-md5",
    "./inputproxy",
    "mmRequest/mmRequest",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.fileuploader.css"],
    function (avalon, template, browser, eventMixin, blobConstructor, fileConstructor, fehConstructor, runtimeConstructor, blobqueueConstructor, md5gen, inputProxyContructor) {
        var widgetName = 'fileuploader';
        var widget = avalon.ui[widgetName] = function(element, data, vmodels) {
        	var options = data[widgetName+'Options'],
                $element = avalon(element);


            var vmodel = avalon.define(data[widgetName+'Id'], function(vm) {
                avalon.mix(vm, options);
                avalon.mix(vm.$serverConfigDefault, vm.serverConfig);
                avalon.mix(vm.$requiredParamsConfig, vm.requiredParamsConfig);

                var supportMultiple = (document.createElement('input').multiple != undefined),
                    supportFile = (window.File != undefined),
                    supportCanvas = (document.createElement('canvas').getContext && document.createElement('canvas').getContext('2d')),
                    isIE = avalon.browser.name.toLowerCase() == 'ie',
                    version = avalon.browser.version;

                vm.$supportBase64Img = (!isIE) || (version >= 8);
                vm.$base64Limitation = (isIE && version == 8) ? 32 * 1024 : Number.MAX_VALUE;
                vm.useHtml5Runtime = supportMultiple && supportFile && supportCanvas;
                vm.useFlashRuntime = !vm.useHtml5Runtime;

                vm.previews = [];   // 渲染到Template上的预览数据
                
                eventMixin(blobConstructor);
                eventMixin(inputProxyContructor);
                eventMixin(blobqueueConstructor);
                eventMixin(runtimeConstructor);
                eventMixin(fileConstructor);

                vm.$md5gen = md5gen;

                vm.$runtime = null;
                vm.$flashEventHub = undefined;
                vm.$fileInputProxy = undefined;


                vm.$fileInputProxy = new inputProxyContructor({
                    fn: vm.getFileContext,
                    scope: vm
                });
                vm.$fileInputProxy.addEventListener("newFileSelected", function(fileInfo) {
                    var fileObj = new fileConstructor(fileInfo, this.$flashEventHub, this.chunked, this.chunkSize, blobConstructor);
                    fileObj.addEventListener("fileStatusChanged", this.onFileStatusChanged, this);

                    fileObj.addEventListener("fileProgressed", function (f, beforePercentage) {
                        var previewVm = this.getPreviewByToken(this, f.fileLocalToken);
                        if (!previewVm) return;
                        previewVm.message = this.getFileMessageText(f);
                        previewVm.uploadProgress = f.uploadedPercentage;
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
                        message: this.getFileMessageText(fileObj)
                    });
                }, vm);

                vm.$fileInputProxy.addEventListener("previewGenerated", function(fileLocalToken, preview) {
                    var previewVm = this.getPreviewByToken(this, fileLocalToken);
                    if (!previewVm || previewVm.preview == preview) return;
                    previewVm.preview = preview;
                }, vm);

                /**
                 * @interface 侦听Preview上的x按钮。负责移除Preview和runtime的FileObj。
                 */
                vm.onPreviewRemoveClicked = function (el) {
                    var fileLocalToken = el.fileLocalToken;
                    vm.previews.remove(el);
                    vm.$runtime.removeFileByToken(el.fileLocalToken);
                }

                vm.onDragOver = function (e) {
                    if (vm.enableDragDrop) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
                vm.onDrop = function (e) {
                    if (vm.enableDragDrop) {
                        e.preventDefault();
                        e.stopPropagation();
                        vm.$fileInputProxy.addNewFiles(e.dataTransfer.files);
                    }
                }
                avalon.bind(window, "dragover", vm.onDragOver);
                avalon.bind(window, "drop", vm.onDrop);
                /**
                 * @interface 侦听Add按钮的Click事件。
                 */
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

                /**
                 * @interface Add按钮首次点击或者首次接收Drop文件时调用此函数，生成InputProxy、FlashEventHub和runtime的实例。
                 */
                vm.registInput = function (opts, target, isH5) {
                    if (typeof opts == 'string') {
                        opts = avalon.vmodels[opts];
                    }

                    if (isH5) {
                        opts.$fileInputProxy.addEventListenerInput(target);
                    } else {
                        var flash = undefined;
                        if(navigator.appName.indexOf("Microsoft")!=-1){
                            flash = window.document.getElementById(target);
                        } else {
                            flash = window.document[target];
                        }
                        opts.$flashEventHub = new fehConstructor(flash);
                        opts.$fileInputProxy.bindFlashEvent(opts.$flashEventHub);
                    }
                };
                /**
                 * @interface 上传按钮的事件侦听函数。
                 */
                vm.uploadClicked = function (event) {
                    vm.uploadAll(vm);
                };            
                /**
                 * @interface Flash和H5都会调用此方法来生成文件扩展名过滤。根据acceptTypes配置返回文件类型的Filter。
                 */
                vm.getInputAcceptTypes = function (_isFalsh) {
                    var types = vm.acceptFileTypes.split(",");
                    var allTypes = "*.*";
                    var specialTypes = ["image.*", "audio.*", "video.*"];

                    if (_isFalsh) {
                        if (types.indexOf(allTypes) >= 0) return [];

                        var allFilters = [];

                        // 此函数将category转换成Flash可以识别的文件Filter。category = image.* or audio.* or video.*。
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

                        // 处理特殊文件类型
                        for (var i = 0; i < specialTypes.length; i++) {
                            if (types.indexOf(specialTypes[i]) >= 0) {
                                getMIME4SpecialType(specialTypes[i]);
                            }
                        }

                        // 处理一般文件类型。
                        for (var i = 0; i < types.length; i++) {
                            if (specialTypes.indexOf(types[i]) >= 0) continue;
                            var extNameNoDot = types[i].replace("*.","");
                            allFilters.push({ description: extNameNoDot, types:types[i] });
                        }
                        return allFilters;
                    } else {
                        if (types.indexOf(allTypes) >= 0) return "*/*";
                        // HTML Input接受的类型参数格式为 image/png，所以需要将.替换成/
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
                vm.rootElement = null;
            	vm.$init = function() {
                    vm.$runtime = new runtimeConstructor(vm, blobqueueConstructor);
	            	element.innerHTML = template.replace(/##VM_ID##/ig, vm.$id);  // 将vmid附加如flash的url中

                    vm.rootElement = element.getElementsByTagName("*")[0];
                    
                    vmodels = [vm].concat(vmodels);
                    avalon.scan(element, vmodels);
                    if(typeof vmodel.onInit === "function"){
                        vmodel.onInit.call(element, vmodel, options, vmodels)
                    }
	            };


                vm.$remove = function() {
                    this.$runtime.purge();
                };

                vm.$skipArray = [
                    "maxFileSize", "filePoolSize", "chunked", "chunkSize", "rootElement",
                    "acceptFileTypes", "previewWidth", "previewHeight", "enablePreviewGenerating",
                    "enableRemoteKeyGen", "enableMd5Validation", "serverConfig", "noPreviewPath",
                    "previewFileTypes", "requiredParamsConfig", "__inputRegisted"
                    ];
            });
            return vmodel;
        };
        widget.defaults = {
            maxFileSize: 1024*1024*10, //@config {Number} 单个文件的大小限制
            filePoolSize: 1024*1024*200,    //@config {Number} 未上传文件的总大小限制。
            chunkSize: 1024 * 1024, //@config {Number} 分块上传时的分块大小。
            chunked: false, //@config {Boolean} 是否开启分块上传。

            __inputRegisted: false,

            addButtonText: "Add Files", //@config {String} 添加文件按钮的文本
            uploadButtonText: "Upload", //@config {String} 上传按钮的文本

            acceptFileTypes: "*.*", //@config {String} 可接收的文件类型

            previewWidth: 100,  //@config {Number} 预览图的宽度
            previewHeight: 85,  //@config {Number} 预览图的高度

            enablePreviewGenerating: true,  //@config {Boolean} 是否开启预览图的生成功能
            showPreview: true,  //@config {Boolean} 是否显示预览图
            showProgress: true, //@config {Boolean} 是否显示进度条

            multipleFileAllowed: true,
            enableRemoteKeyGen: false,   //@config {Boolean} 分块上传时，是否预先和服务器握手，获取一个文件Id
            enableMd5Validation: false, 
            /*
            * @config {Object} 服务器请求配置对象。具体属性参看下表
            * @param timeout {Number} 请求超时的毫秒数。默认为30000（30秒）
            * @param concurrentRequest {Number} 并发的请求最大数量。默认为3
            * @param blobRetryTimes {Number} 发生错误后的重试次数。默认为1
            * @param userName {String} 发生错误后的重试次数。默认为1
            * @param password {String} 发生错误后的重试次数。默认为1
            * @param url {String} 提交文件数据的接口地址。无默认值。必选
            * @param previewUrl {String} IE6-9开启图片预览时，图片服务的地址。无默认值。
            * @param keyGenUrl {String} 分块上传时生成文件key的服务地址。无默认值。
            */
            serverConfig: { },

            $serverConfigDefault: {
                timeout: 30000,
                concurrentRequest: 3,
                blobRetryTimes: 1,
                userName: undefined,
                password: undefined,
                url: undefined,
                previewUrl: undefined,
                keyGenUrl: undefined
            },

            /*
            * @config {Object} 服务器Ajax请求参数配置对象，这个属性用于配置Ajax请求的参数名称。具体属性参看下表
            * @param blobParamName {String} 文件数据领域的参数名。默认为"blob"
            * @param fileTokenParamName {String} 文件标识领域的参数名。默认为"fileKey"
            * @param totalChunkParamName {String} 分块总数的参数名称。默认为"total"
            * @param chunkIndexParamName {String} 分块的序列号参数名称。默认为"chunk"
            * @param fileNameParamName {String} 文件名领域的参数名。默认为"fileName"
            
            */
            requiredParamsConfig: { },

            $requiredParamsConfig: {
                blobParamName: "blob",
                fileTokenParamName: "fileKey",
                totalChunkParamName: "total",
                chunkIndexParamName: "chunk",
                fileNameParamName: "fileName",
                blobMd5ParamName: "md5"
            },

            //@config {Boolean} 是否开启文件拖放，只支持Chrome、FireFox、Safari及IE10+。默认关闭
            enableDragDrop: false,

            //@config {String} 无预览的图片文件地址。
            noPreviewPath: "http://source.qunarzz.com/general/oniui/fileuploader/no-preview.png",
            //@config {Object} 为不同类型后缀名配置预览图的配置对象。
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
            /*
            * @config {Function} 新增加的文件超过了fileSize配置时的回调函数。
            * @param opts {Object} vmodel
            * @param fileTokenParamName {Object} 试图添加的文件对象。
            */
            onFileOverSize: avalon.noop,

            /*
            * @config {Function} 新增的文件被识别为重复文件时的回调函数。
            * @param opts {Object} vmodel
            * @param fileTokenParamName {Object} 试图添加的文件基本信息。
            */
            onSameFileAdded: avalon.noop,
            /*
            * @config {Function} 托管文件超过了filePoolSize配置时的回调函数。
            * @param opts {Object} vmodel
            * @param fileTokenParamName {Object} 试图添加的文件对象。
            */
            onFilePoolOverSize: avalon.noop,
            /*
            * @config {Function} 用于自定义Ajax请求的数据。发送Blob数据时，组件会调用此函数。返回的Object键值对会被加入到Ajax请求中。
            * @param fileObj {Object} 文件对象
            * @param blobObj {Object} 文件分块对象
            */
            madeRequestParams: avalon.noop,
            /*
            * @config {Function} 开启所有的文件的上传。
            * @param opts {Object} vmodel
            */
            uploadAll: function (opts) {
                opts.previews.forEach(function(p) {
                    if (p.done) return;
                    opts.uploadFile(opts, p.fileLocalToken);
                });
            },
            /*
            * @config {Function} 开启某个文件的上传。
            * @param opts {Object} vmodel
            * @param index {Number or String} 文件的Index或者LocalToken。
            */
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
            /*
             * @interface 使用localToken获取一个Preview的VM对象
             * @param opts {Object} vmodel
             * @param fileLocalToken {String} 文件的LocalToken。
             */
            getPreviewByToken: function (opts, fileLocalToken) {
                var previewVm = null;
                for (var i = 0; i < opts.previews.length; i++) {
                    if (opts.previews[i].fileLocalToken == fileLocalToken) {
                        previewVm = opts.previews[i];
                        break;
                    }
                }
                return previewVm;
            },
            /*
             * @interface 分块上传时，为文件生成一个RemoteKey的方法。enableRemoteKeyGen配置为true时，会调用remoteFileKeyGen方法生成key。否则使用localFileKeyGen。
             * @param opts {Object} vmodel
             * @param fileLocalToken {String} 文件的LocalToken。
             * @param callback {Function} 生成成功后的回调函数。
             * @param scope {Object} callback的作用域。
             */
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
            /*
             * @config 分块上传时，为文件生成一个RemoteKey的方法。enableRemoteKeyGen配置为true时，会调用此方法。重写此方法时，生成key成功后，调用resolve(key)来结束此方法。
             * @param opts {Object} vmodel
             * @param fileLocalToken {String} 文件的LocalToken。
             * @param resolve {Function} Promise的resolve函数。
             * @param reject {Object} Promise的reject函数。
             */
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
            /*
             * @config 分块上传时，为文件生成一个RemoteKey的方法。enableRemoteKeyGen配置为false时，会调用此方法。重写此方法时，生成key成功后，调用resolve(key)来结束此方法。
             * @param opts {Object} vmodel
             * @param fileLocalToken {String} 文件的LocalToken。
             * @param resolve {Function} Promise的resolve函数。
             * @param reject {Object} Promise的reject函数。
             */
            localFileKeyGen: function (opts, fileObj, resolve, reject) {
                resolve(opts.$md5gen(fileObj.name + "#" + fileObj.size + "#" + fileObj.fileLocalToken));
            },
            
            getMd5: function (opts, bytes) {
                return opts.$md5gen(bytes);
            },
            /*
             * @interface 比较两个文件对象，并返回true或者false表示是否为相同的文件。
             * @param f1 {Object} 第一个文件对象
             * @param f2 {Object} 第二个文件对象
             */
            compareFileObjects: function(f1, f2) {
                return f1.size == f2.size && f1.name == f2.name;
            },
            /*
             * 根据文件基本信息，获取文件的上下文环境，包括是否重复文件、尺寸是否合规、预览配置、文件类型等。不要覆盖这个方法。
             * basicFileInfo {Object} 文件基本信息对象
             */
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

            /*
             * @config 获取文件预览上的文本信息。重写此方法可以自定义文件上传时的文本。当文件被加入、开始上传、进度变更、上传完毕以及发生错误时都会调用此方法。
             * @param fileObj {Object} 文件对象
             */
            getFileMessageText: function (fileObj) {
                var message = "";
                switch (fileObj.status) {
                    case fileObj.FILE_CACHED:
                        message = "File cached.";
                        break;
                    case fileObj.FILE_QUEUED:
                        message = "File queued.";
                        break;
                    case fileObj.FILE_IN_UPLOADING:
                        message = "{0}%".replace('{0}', fileObj.uploadedPercentage);
                        break;
                    case fileObj.FILE_UPLOADED:
                        message = "File uploaded.";
                        break;
                    case fileObj.FILE_ERROR_FAIL_READ:
                        message = "Fail to read file.";
                        break;
                    case fileObj.FILE_ERROR_FAIL_UPLOAD:
                        message = "Fail to upload file.";
                        break;
                    default:
                        break;
                }
                return message;
            },

            onFileStatusChanged: function (fileObj, beforeStatus) {
                var previewVm = this.getPreviewByToken(this, fileObj.fileLocalToken);
                if (previewVm == null) {
                    return;
                }
                previewVm.message = this.getFileMessageText(fileObj);
                if (fileObj.status == fileObj.FILE_UPLOADED) {
                    previewVm.uploadProgress = 100;
                    previewVm.done = true;
                }
            },

            getFileConfigByExtName: function (opts, extName) {
                if (typeof opts == 'string')
                    opts = avalon.vmodels[opts];

                var imgFileExts = ["png", "jpg", "jpeg", "gif"];    // 暂时不支持其他类型的图片预览
                var extNameNoDot = extName.replace(".", "").toLowerCase();
                var r = {
                    isImageFile: imgFileExts.indexOf(extNameNoDot) >= 0,
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
/**
 @links
 [uploader基础配置项](avalon.fileuploader.ex1.html)
 [预览图和进度条配置](avalon.fileuploader.ex2.html)
 [大文件和分块配置](avalon.fileuploader.ex3.html)
 [文件Ajax请求参数的配置](avalon.fileuploader.ex5.html)
*/