/**
 * @cnName FileUploader组件内部的文件管理器。
 * @enName File manager for FileUploader.
 * @introduce
 *    <p>管理FileUploader的文件对象；持有发送队列。</p>
 *  @updatetime 2015-4-7
 */
define(["./avalon.fileuploaderAdapter", "./eventmixin", "./blobqueue", "./file", "./flasheventhub",
    "./inputproxy",
    "./spark-md5"], 
function (adapter, eventMixin, blobqueueConstructor, fileConstructor, flasheventhub, inputProxyContructor, md5gen) {
	var runtimeContructor = function (config, uploadButtonDom, addButtonDom, fileInputDom, flashId) {
		adapter.bindEvent(uploadButtonDom, 'click', this.onUploadClick, this);
		if (!!addButtonDom && !!fileInputDom) {
			adapter.bindEvent(addButtonDom, 'click', function (e) {
				if (e.target === addButtonDom) {
					e.stopPropagation();
					this.__inputProxy.__fileInput.click();
				}
			}, this);
			this.constructInputProxy(fileInputDom, true);
        }
		this.files = {};

		config.serverConfig = adapter.extend({
            timeout: 30000,
            concurrentRequest: 3,
            blobRetryTimes: 1,
            userName: undefined,
            password: undefined,
            url: undefined,
            previewUrl: undefined,
            keyGenUrl: undefined
        }, config.serverConfig);
		this.config = config;

		this.blobqueue = new blobqueueConstructor(this, config.serverConfig);
		this.md5gen = md5gen;
	};

    runtimeContructor.prototype.registFlash = function (flashId) {
        var flash = undefined;
        if(navigator.appName.indexOf("Microsoft")!=-1){
            flash = window.document.getElementById(flashId);
        } else {
            flash = window.document[flashId];
        }
        this.$flashEventHub = new flasheventhub(flash);
        this.constructInputProxy(this.$flashEventHub, false);
    }


    /*
     * @interface 分块上传时，为文件生成一个RemoteKey的方法。enableRemoteKeyGen配置为true时，会调用remoteFileKeyGen方法生成key。否则使用localFileKeyGen。
     * @param fileLocalToken {String} 文件的LocalToken。
     * @param callback {Function} 生成成功后的回调函数。
     * @param scope {Object} callback的作用域。
     */
    runtimeContructor.prototype.getFileKey = function (fileObj, callback, scope) {
    	var me = this;
        var promise = new Promise(function (resolve, reject) {
        	
            if (me.config.enableRemoteKeyGen) {
                me.remoteFileKeyGen(fileObj, resolve, reject);
            } else {
                me.localFileKeyGen(fileObj, resolve, reject);
            }
        });

        promise.then(function(key) {
            callback.call(scope, key, true);
        }, function (reason) {
            callback.call(scope, undefined, false);
        });
    }
    /*
     * @config 分块上传时，为文件生成一个RemoteKey的方法。enableRemoteKeyGen配置为true时，会调用此方法。重写此方法时，生成key成功后，调用resolve(key)来结束此方法。
     * @param fileLocalToken {String} 文件的LocalToken。
     * @param resolve {Function} Promise的resolve函数。
     * @param reject {Object} Promise的reject函数。
     */
    runtimeContructor.prototype.remoteFileKeyGen = function (fileObj, resolve, reject) {
        avalon.ajax({
            type: "get",
            url: this.config.serverConfig.keyGenUrl,
            timeout: this.config.serverConfig.timeout || 30000,
            password: this.config.serverConfig.password,
            username: this.config.serverConfig.userName,
            cache: false,
            success: function (response) {
                resolve(response);
            },
            error: function (textStatus, error) {
                reject(error);
            }
        });
    }
    /*
     * @config 分块上传时，为文件生成一个RemoteKey的方法。enableRemoteKeyGen配置为false时，会调用此方法。重写此方法时，生成key成功后，调用resolve(key)来结束此方法。
     * @param fileLocalToken {String} 文件的LocalToken。
     * @param resolve {Function} Promise的resolve函数。
     * @param reject {Object} Promise的reject函数。
     */
    runtimeContructor.prototype.localFileKeyGen = function (fileObj, resolve, reject) {
        resolve(this.md5gen(fileObj.name + "#" + fileObj.size + "#" + fileObj.fileLocalToken));
    }

	runtimeContructor.prototype.onUploadClick = function (event) {
		this.uploadAllFiles();
	}

	runtimeContructor.prototype.onPreviewGenerated = function (fileLocalToken, preview) {
		this.fireEvent("previewGenerated", fileLocalToken, preview);
	}

	runtimeContructor.prototype.onNewFileSelected = function (fileInfo) {
    	var fileObj = new fileConstructor(fileInfo, this.$flashEventHub, this.config.chunked, this.config.chunkSize);
        fileObj.attachEvent("fileStatusChanged", this.onFileStatusChanged, this);
        fileObj.attachEvent("fileProgressed", this.onFileProgressed, this);
        this.addFile(fileObj);
        this.fireEvent("newFileAdded", fileInfo, fileObj);
	}

	runtimeContructor.prototype.onFileProgressed = function (fileObj, beforePercentage) {
		this.fireEvent("fileProgressed", fileObj, beforePercentage);
	}

	runtimeContructor.prototype.constructInputProxy = function (fileInputDom, h5) {
        var inputProxy = new inputProxyContructor(fileInputDom, h5, {
            fn: this.getFileContext,
            scope: this
        });
        inputProxy.attachEvent("newFileSelected", this.onNewFileSelected, this);
        inputProxy.attachEvent("previewGenerated", this.onPreviewGenerated, this);
        this.__inputProxy = inputProxy;
	}


    /*
     * 根据文件基本信息，获取文件的上下文环境，包括是否重复文件、尺寸是否合规、预览配置、文件类型等。不要覆盖这个方法。
     * basicFileInfo {Object} 文件基本信息对象
     */
    runtimeContructor.prototype.getFileContext = function (basicFileInfo) {
        var context = {
            canBeAdded: this.testFileBasicInfo(basicFileInfo),
            defaultPreview: false,
            enablePreviewGen: false,
            previewWidth: 0,
            previewHeight: 0,
            fileLocalToken: undefined,
            previewUrl: this.config.serverConfig.previewUrl || null,
            timeout: this.config.serverConfig.timeout || null,
            userName: this.config.serverConfig.userName || null,
            password: this.config.serverConfig.password || null,
            $env: {
                supportBase64Img: this.$supportBase64Img,
                base64Limitation: this.$base64Limitation
            }
        };

        if (context.canBeAdded) {
            var fileName = basicFileInfo.name;
            var fileConfig = this.getFileConfigByExtName(fileName.substr(fileName.lastIndexOf('.')));

            context.defaultPreview = fileConfig.noPreviewPath;
            context.enablePreviewGen = fileConfig.enablePreview && fileConfig.isImageFile;
            context.previewWidth = fileConfig.previewWidth;
            context.previewHeight = fileConfig.previewHeight;
        }
        return context;
    }

	/*
	 * 开始上传所有文件。
	 */
	runtimeContructor.prototype.uploadAllFiles = function () {
		for (var n in this.files) {
			var f = this.files[n];
			if (f.__isFileObject) {
				this.queueFileByToken(f.fileLocalToken);
			}
		}
	}



    runtimeContructor.prototype.getFileConfigByExtName = function (extName) {
	    var config = this.config;
	    var imgFileExts = ["png", "jpg", "jpeg", "gif"];    // 暂时不支持其他类型的图片预览
	    var extNameNoDot = extName.replace(".", "").toLowerCase();
	    var r = {
	        isImageFile: imgFileExts.indexOf(extNameNoDot) >= 0,
	        enablePreview: config.enablePreviewGenerating,
	        previewWidth: config.previewWidth,
	        previewHeight: config.previewHeight,
	        noPreviewPath: config.noPreviewPath,
	        fileSizeLimitation: config.maxFileSize
	    }
	    if (!r.isImageFile && !!config.previewFileTypes && config.previewFileTypes.hasOwnProperty(extName)) {
	        r.noPreviewPath = config.previewFileTypes[extName];
	    }
	    return r;
	}

	/*
	 * 从runtime中移除一个文件。文件的引用和数据都会被销毁，正在进行的发送请求也会取消。
	 */
	runtimeContructor.prototype.removeFileByToken = function (fileLocalToken) {
		var fileObj = this.files[fileLocalToken];
		if (!fileObj) return;

		delete this.files[fileLocalToken];

		this.blobqueue.stopUploadByLocalToken(fileLocalToken);
		fileObj.purge();
	}

	/*
	 * 增加一个新的FileObj到runtime中。
	 */
	runtimeContructor.prototype.addFile = function (fileObj) {
		this.files[fileObj.fileLocalToken] = fileObj;
		fileObj.setStatus(fileObj.FILE_CACHED);

		fileObj.addEventListener("fileStatusChanged", this.onFileStatusChanged, this);
	};

	/*
	 * 对所有管理的文件状态监控的回调函数。
	 */
	runtimeContructor.prototype.onFileStatusChanged = function (fileObj, beforeStatus) {
		this.fireEvent('fileStatusChanged', fileObj, beforeStatus);
		// 为了优化内存使用，上传成功后自动移除并销毁文件。
		if (fileObj.status == fileObj.FILE_UPLOADED) {
			delete this.files[fileObj.fileLocalToken];
			fileObj.purge();
		}
	}

	/**
	 * 将文件加入发送队列。
	 */
	runtimeContructor.prototype.queueFileByToken = function (fileLocalToken) {
		var me = this,
			fileObj = me.files[fileLocalToken],
			chunked = fileObj.chunked;
		if (fileObj == undefined || fileObj.status != fileObj.FILE_CACHED) return;

		var blobs = [];

		var promise = new Promise(function (resolve, reject) {
			if (!chunked) {
				resolve();
			} else {
				// 分块的文件需要生成一个远程的FileKey。
				me.getFileKey(fileObj, function (fileKey) {
					fileObj.fileKey = fileKey;
					resolve();
				}, me);
			}
		});

		promise.then(function() {
			fileObj.setStatus(fileObj.FILE_QUEUED);
			me.blobqueue.push(fileObj.blobs);
		}, function () {
			debugger;
		})
	}

    /*
     * @interface 比较两个文件对象，并返回true或者false表示是否为相同的文件。
     * @param f1 {Object} 第一个文件对象
     * @param f2 {Object} 第二个文件对象
     */
    runtimeContructor.prototype.compareFileObjects = function(f1, f2) {
        return f1.size == f2.size && f1.name == f2.name;
    }


    runtimeContructor.prototype.testFileBasicInfo = function (basicFileInfo) {
        var sizeOk = this.testFileSize(basicFileInfo);
        if (sizeOk) {
        	for (var f in this.files) {
                if (this.compareFileObjects(this.files[f], basicFileInfo)) {
                    this.fireEvent("sameFileSelected", basicFileInfo);
                    return false;
                }
        	}
            return true;
        } else {
            return false;
        }
    }
    /*
     * 检查一个FileObj的文件大小是否符合规定。第一需要满足单个文件尺寸限制，第二需要满足文件池大小的限制。
     */
    runtimeContructor.prototype.testFileSize = function (fileObj) {
        var config = this.config,
        	fileSizeLimitation = config.maxFileSize,
            poolSizeLimitation = config.filePoolSize,
            size = fileObj.size;
        
        var fileSizeOK = (fileSizeLimitation <= 0) || (size <= fileSizeLimitation);
        var poolSizeOK = (poolSizeLimitation <= 0) || (this.getFilesSizeSum() + size <= poolSizeLimitation);

        if (fileSizeOK && poolSizeOK) {
            return true;
        } else if (!fileSizeOK) {
        	this.fireEvent("fileOverSize", fileObj);
        } else {
        	this.fireEvent("filePoolOverSize", fileObj);
        }
        return false;
    }

	runtimeContructor.prototype.getRequestParamConfig = function (blob) {
		var requiredParamsConfig = adapter.extend({
			blobParamName: "blob",
			fileTokenParamName: "fileKey",
			totalChunkParamName: "total",
			chunkIndexParamName: "chunk",
			fileNameParamName: "fileName",
			blobMd5ParamName: "md5"
		}, this.config.requiredParamsConfig);

		var customizedParams = {};

		if (typeof this.config.madeRequestParams == "function") {
			customizedParams = this.config.madeRequestParams.call(this, blob.fileObj, blob) || {};
		}

		return {
			requiredParamsConfig: requiredParamsConfig,
			customizedParams: customizedParams
		}
	}

	runtimeContructor.prototype.purge = function () {
		this.blobqueue.purge();
		delete this.blobqueue;
		delete this.files;
	}

	/*
	 * 计算runtime管理的所有文件的大小总和。
	 */
	runtimeContructor.prototype.getFilesSizeSum = function () {
		var sum = 0;
		for (var i in this.files) {
			if (this.files.hasOwnProperty(i) && i!="length") {
				sum += this.files[i].size;
			}
		}
		return sum;
	}

	eventMixin(runtimeContructor);
	return runtimeContructor;
});