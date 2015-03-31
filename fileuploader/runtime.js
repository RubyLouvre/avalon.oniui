
define(["avalon"], 
function ($$) {
	var mixFunction = $$.mix;
	var logFunction = $$.log;
	/*
	 * 文件状态代码。0-100为正常状态，101以后为错误状态
	 */
	var FILE_CACHED = 0; // 已被runtime缓存
	var FILE_QUEUED = 1; // 已进入发送队列
	// var FILE_READED = 2;	// 发送队列已读取文件结束
	//var FILE_IN_READING = 3; // 已开始读取文件数据
	//var FILE_SLICED = 4;	// 文件已经被切分成blob
	var FILE_IN_UPLOADING = 5;	// 文件已经开始上传
	var FILE_UPLOADED = 6;	// 文件上传结束

	var FILE_ERROR_FAIL_READ = 101;	// FileQueue无法读取文件
	//var FILE_ERROR_FAIL_SLICE = 102;	// FileQueue无法拆分文件
	var FILE_ERROR_FAIL_UPLOAD = 103;	// FileQueue发送文件时碰见错误

	var runtimeContructor = function (uploaderVm, blobConstructor, blobqueueConstructor) {
		this.vm = uploaderVm;
		this.files = {};
		this.files.length = 0;
		this.readBlobCallbacks = {};
		this.blobqueue = new blobqueueConstructor(this, uploaderVm.serverConfig);
		this.blobqueue.attachEvent("blobUploaded", function (blob, allBlobDone) {
			blob.purgeData();	// 释放数据区以减轻内存压力
			this.fireEvent("onFileProgress", blob.fileObj, this.sumUploadedSize(blob.fileObj), blob.fileObj.size);
			if (allBlobDone) {
				this.purgeFileObjData(blob.fileObj);
				this.setFileObjectStatus(blob.fileObj, FILE_UPLOADED);
			}
		}, this);
		this.blobqueue.attachEvent("blobProgressUpdated", function (blob) {
			this.fireEvent("onFileProgress", blob.fileObj, this.sumUploadedSize(blob.fileObj), blob.fileObj.size);
		}, this);

		this.blobqueue.attachEvent("blobFailToUpload", function(blob, textStatus, error) {
			this.setFileObjectStatus(blob.fileObj, FILE_ERROR_FAIL_UPLOAD);
		}, this)

		this.blobqueue.attachEvent("failToSendRequest", function (blob, error) {
			this.setFileObjectStatus(blob.fileObj, FILE_ERROR_FAIL_UPLOAD);
		}, this);
		this.blobConstructor = blobConstructor;
	};

	runtimeContructor.prototype.getFileByLocalToken = function (fileLocalToken) {
		return this.files[fileLocalToken];
	}

	/*
	 * 从runtime中移除一个文件。文件的引用和数据都会被销毁，正在进行的发送请求也会取消。
	 */
	runtimeContructor.prototype.removeFileByToken = function (fileLocalToken) {
		var fileObj = this.files[fileLocalToken];
		if (!fileObj) return;
		
		this.purgeFileObjData(fileObj);
		delete this.files[fileLocalToken];

		this.blobqueue.stopUploadByLocalToken(fileLocalToken);
	}

	/*
	 * 销毁fileObj的data区的文件数据。HTML5环境下，data区是一个File的引用；Flash环境下data区没有数据，但是文件数据被存在flash内，需要清除。
	 */
	runtimeContructor.prototype.purgeFileObjData = function (fileObj) {
		fileObj.data = null;
		if (fileObj.__flashfile) {
			this.flash.removeCacheFileByToken(fileLocalToken);
		}
	}


	// 调试Flash的函数。Flash调用此函数在浏览器打印Log
	runtimeContructor.prototype.printFlashLog = function (args) {
	//	logFunction.apply(logFunction, args);
	}

	/*
	 * 计算一个FileObj已上传的字节数
	 */
	runtimeContructor.prototype.sumUploadedSize = function (fileObj) {
		var s = 0;
		for (var i = 0; i < fileObj.blobsProgress.length; i++) {
			s+= fileObj.blobsProgress[i];
		}
		return s;
	}

	/*
	 * H5和Flash都会调用此方法，参数是一个{ name: xxx, size: 000 }的对象。
	 * 第一检查文件尺寸并申请一个唯一的fileLocalToken，第二根据文件的扩展名获取预览的参数。
	 */
	runtimeContructor.prototype.getFileContext = function (basicFileInfo) {
		var sizeOk = this.testFileSize(basicFileInfo);
		var context = {
			canBeAdded: false,
			defaultPreview: false,
			enablePreviewGen: false,
			previewWidth: 0,
			previewHeight: 0,
			fileLocalToken: this.applyFileLocalToken()
		};
		if (sizeOk) {
			context.canBeAdded = true;
			var fileName = basicFileInfo.name;
			var fileConfig = this.vm.getFileConfigByExtName(this.vm, fileName.substr(fileName.lastIndexOf('.')));

			context.defaultPreview = fileConfig.noPreviewPath;
			context.enablePreviewGen = fileConfig.enablePreview && fileConfig.isImageFile;
			context.previewWidth = fileConfig.previewWidth;
			context.previewHeight = fileConfig.previewHeight;
		}
		return context;
	}

	// 只有H5会调用此方法，参数必须是一个H5的File对象。增加文件时，检查文件大小限制和缓存池限制。
	runtimeContructor.prototype.tryAddFile = function (file) {
		var fileContext = this.getFileContext({ name: file.name, size: file.size });
		if (!fileContext.canBeAdded) return;
		
		var fileObj = {
			name: file.name,
			data: file,
			fileLocalToken: fileContext.fileLocalToken,
			fileKey: undefined,	// 分块上传时的关键词，server使用此属性来辨识分块的文件归属
			size: file.size,
			status: null,
			preview: fileContext.defaultPreview,
			__flashfile: false,
			__html5file: true,
			lastModified: file.lastModified,
			chunkAmount: 0,	// 进入实际发送队列后此属性才会被真正计算
			blobsProgress: [] // 每个Blob已经上传完毕的字节数
		};

		if (fileContext.enablePreviewGen) {
			this.getImagePreview(file, fileContext.previewWidth, fileContext.previewHeight, function (preview) {
				if (preview) fileObj.preview = preview;
				this.addFile(fileObj);
			});
		} else {
			this.addFile(fileObj);
		}
	}

	// 只有H5会调用此方法。生成文件预览图。
	runtimeContructor.prototype.getImagePreview = function (imgFile, previewWidth, previewHeight, callback) {
		var me = this;
		var promise = new Promise(function(resolve, reject) {
			var fileReader = new FileReader();
			fileReader.onload = function () {
				var img = new Image();
				img.onload = function () {
	                var canvasEl = document.createElement("canvas"),
	                    ctx = canvasEl.getContext('2d'),
	                    imgWidth = img.width,
	                    imgHeight = img.height,
	                    imageAspectRatio = imgWidth / imgHeight,    // 输入图片的宽高比
	                    canvasAspectRatio = previewWidth / previewHeight, // 预览的宽高比
	                    drawX = drawY = 0,
	                    drawHeight = previewHeight,    // 绘制入Canvas中的预览图高度
	                    drawWidth = previewWidth;      // 绘制入Canvas中的预览图宽度

	                canvasEl.width = previewWidth;
	                canvasEl.height = previewHeight;
	                // 等比压缩图片至Canvas。此处计算宽高比，并得出压缩图像在Canvas上的位置。
	                // drawY对于过宽的图像调整为纵向居中，drawX对于过长的图像调整为横向居中。
	                if (imageAspectRatio > canvasAspectRatio) {
	                    drawHeight = imgHeight * previewWidth / imgWidth;
	                    drawY = (previewHeight - drawHeight) / 2;
	                } else if (imageAspectRatio < canvasAspectRatio) {
	                    drawWidth = imgWidth * previewHeight / imgHeight;
	                    drawX = (previewWidth - drawWidth) / 2;
	                }

	                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
	                resolve(canvasEl.toDataURL("image/png"));
	                
	                // 释放内存。
	                ctx.clearRect(0, 0, previewWidth, previewHeight);
	                img.onload = img.onerror = null;
	                img = null;
	            }
	            img.onerror = function () {
	            	img.onload = img.onerror = null;
	                img = null;
	                resolve(false);
	            }
	            img.src = this.result;

				fileReader.onload = fileReader.onerror = null;
				fileReader = null;
			}
			fileReader.onerror = function () {
				resolve(false);
			}
			// 用setTimeout来解决图片过大时，浏览器卡死的问题
			setTimeout(function() {
				fileReader.readAsDataURL(imgFile);
			},100);
		});
		
		promise.then(function (preview) {
			callback.call(me, preview);
		});
	}

	runtimeContructor.prototype.fileLocalTokenSeed = 
		(runtimeContructor.prototype.fileLocalTokenSeed == undefined) ? 0 : runtimeContructor.prototype.fileLocalTokenSeed;

	runtimeContructor.prototype.applyFileLocalToken = function () {
		this.fileLocalTokenSeed++;
		return "__avalonfile"+this.fileLocalTokenSeed;
	}

	/*
	 * H5和Flash都会调用此方法。增加一个新的FileObj到runtime中。此时的FileObj的预览、LocalToken等关键数据已经全部生成。
	 */
	runtimeContructor.prototype.addFile = function (fileObj) {
		var me = this;

		if (me.fireEvent('beforeFileCache', fileObj)) {
			me.setFileObjectStatus(fileObj, FILE_CACHED);
			me.files[fileObj.fileLocalToken] = fileObj;
			me.files.length++;
		} else {
			// 如果不需要对此文件进行处理，从文件读取区域和缓存区域，移除此文件数据的引用以释放内存。
			if (fileObj.__flashfile) {
				me.flash.removeCacheFileByToken(fileObj.fileLocalToken);
			}
		}
	};

	/*
	 * 检查一个FileObj的文件大小是否符合规定。第一需要满足单个文件尺寸限制，第二需要满足文件池大小的限制。
	 */
	runtimeContructor.prototype.testFileSize = function (fileObj) {
		var fileSizeLimitation = this.vm.maxFileSize,
			poolSizeLimitation = this.vm.filePoolSize,
			size = fileObj.size;
		
		var fileSizeOK = (fileSizeLimitation <= 0) || (size <= fileSizeLimitation);
		var poolSizeOK = (poolSizeLimitation <= 0) || (this.getFilesSizeSum() + size <= poolSizeLimitation);

		if (fileSizeOK && poolSizeOK) {
			return true;
		} else if (!fileSizeOK) {
			this.fireEvent("onFileOverSize", fileObj);
		} else {
			this.fireEvent("onPoolOverSize", fileObj);
		}
		return false;
	}

	// flash在按钮第一次被点击时，调用此函数注册FlashObject。在HTML5状态下不会被调用。
	runtimeContructor.prototype.registFlash = function (flash) {
		if(navigator.appName.indexOf("Microsoft")!=-1){
            this.flash = window[flash];
        } else {
            this.flash = window.document[flash];
        }
        return 0;
	}

	runtimeContructor.prototype.queueFileByToken = function (fileLocalToken) {
		var me = this,
			fileObj = me.files[fileLocalToken],
			chunked = me.vm.chunked,
			chunkSize = me.vm.chunkSize;
		if (fileObj == undefined || fileObj.status != FILE_CACHED) return;

		var blobs = [];

		var promise = new Promise(function (resolve, reject) {
			if (!chunked) {
				blobs.push(new me.blobConstructor(0, fileObj.size, fileObj, blobs.length));
				resolve();
			} else {
				me.vm.getFileKey(me.vm, fileObj, function (fileKey) {
					fileObj.fileKey = fileKey;
					var offset = 0;
					while (offset < fileObj.size) {
						blobs.push(
							new me.blobConstructor(offset, Math.min(fileObj.size - offset, chunkSize), fileObj, blobs.length)
						);
						offset+=chunkSize;
					}
					resolve();
				}, me);
			}
		});

		promise.then(function() {
			me.setFileObjectStatus(fileObj, FILE_QUEUED);
			me.blobqueue.push(blobs);
			fileObj.chunkAmount = blobs.length;
			fileObj.blobsProgress = [];
		}, function () {
			debugger;
		})
	}

	runtimeContructor.prototype.readBlob = function(blob, callback, scope) {
		var me = this,
			fileObj = blob.fileObj,
			blobKey = fileObj.fileLocalToken+"#"+blob.index;

		if (fileObj.status == FILE_QUEUED) {
			this.setFileObjectStatus(fileObj, FILE_IN_UPLOADING);
		}

		// 因readBlob在Flash环境下是一个异步的过程，必须要将callback和scope注册到runtime本身，等待read结束后再调用callback
		this.readBlobCallbacks[blobKey] = {
			blob: blob,
			scope: scope,
			callback: callback
		};

		if (fileObj.__html5file) {
			var blobData = fileObj.data.slice(blob.offset, blob.offset + blob.size);
			var fileReader = new FileReader();
			fileReader.onload = function() {
				fileReader.onload = null;
				fileReader.onerror = null;
				me.readBlobEnd(blobKey, blobData, this.result.substr(this.result.indexOf(",")+1));
			}
			fileReader.onerror = function () {
				fileReader.onload = null;
				fileReader.onerror = null;
				me.setFileObjectStatus(blob.fileObj, FILE_ERROR_FAIL_READ)
			}
			fileReader.readAsDataURL(blobData);
		} else {
			this.flash.readBlob(blob.fileObj.fileLocalToken, blob.offset, blob.size, blobKey);
		}
	}

	runtimeContructor.prototype.readBlobEnd = function (blobKey, data, stringData) {
		var blob = this.readBlobCallbacks[blobKey].blob,
			scope = this.readBlobCallbacks[blobKey].scope,
			callback = this.readBlobCallbacks[blobKey].callback;

		if (typeof data == 'string' && stringData == undefined) stringData = data;

		delete this.readBlobCallbacks[blobKey];
		blob.data = data;
		if (this.vm.enableMd5Validation) blob.md5 = this.vm.getMd5(this.vm, stringData);
		callback.call(scope, blob);
	}

	runtimeContructor.prototype.getRequestParamConfig = function (blob) {
		var requiredParamsConfig = mixFunction({
			blobParamName: "blob",
			fileTokenParamName: "fileKey",
			totalChunkParamName: "total",
			chunkIndexParamName: "chunk",
			fileNameParamName: "fileName",
			blobMd5ParamName: "md5"
		}, this.vm.requiredParamsConfig);

		var customizedParams = {};

		if (typeof this.vm.madeRequestParams == "function") {
			customizedParams = this.vm.madeRequestParams.call(this.vm, blob.fileObj, blob) || {};
		}

		return {
			requiredParamsConfig: requiredParamsConfig,
			customizedParams: customizedParams
		}
	}

	runtimeContructor.prototype.setFileObjectStatus = function (fileObj, status, silent) {
		if (status == fileObj.status) return;
		var beforeStatus = fileObj.status,
			afterStatus = status;
		fileObj.status = status;
		if (!silent) {
			this.fireEvent("fileStatusChanged", fileObj, beforeStatus, afterStatus);
		}
	}

	runtimeContructor.prototype.purge = function () {
		this.blobqueue.purge();
		delete this.vm;
		delete this.blobqueue;
		delete this.files;
		delete this.blobConstructor;
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

	runtimeContructor.prototype.FILE_CACHED = FILE_CACHED;
	runtimeContructor.prototype.FILE_QUEUED = FILE_QUEUED;
	runtimeContructor.prototype.FILE_IN_UPLOADING = FILE_IN_UPLOADING;
	runtimeContructor.prototype.FILE_UPLOADED = FILE_UPLOADED;
	runtimeContructor.prototype.FILE_ERROR_FAIL_READ = FILE_ERROR_FAIL_READ;
	runtimeContructor.prototype.FILE_ERROR_FAIL_UPLOAD = FILE_ERROR_FAIL_UPLOAD;

	return runtimeContructor;
});