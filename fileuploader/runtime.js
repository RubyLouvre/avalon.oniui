
define(["avalon"], 
function (avalon) {
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

	var runtimeContructor = function (uploaderVm, blobConstructor, blobqueueConstructor, md5) {
		this.vm = uploaderVm;
		this.md5gen = md5;
		this.files = {};
		this.files.length = 0;
		this.blobqueue = new blobqueueConstructor(this, uploaderVm.serverConfig);
		this.blobqueue.attachEvent("blobUploaded", function (blob, allBlobDone) {
			blob.purgeData();	// 释放数据区以减轻内存压力
			this.fireEvent("onFileProgress", blob.fileObj, this.sumUploadedSize(blob.fileObj), blob.fileObj.size);
			if (allBlobDone) {
				this.setFileObjectStatus(blob.fileObj, FILE_UPLOADED);
				//blob.fileObj.destroy
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

	runtimeContructor.prototype.purgeFileData = function (fileObj) {
		fileObj.data = null;
		if (fileObj.__flashfile) {
			this.flash.removeCacheFileByMd5(fileObj.md5);
		}
	}

	runtimeContructor.prototype.removeFileByMd5 = function (md5) {
		var fileObj = this.files[md5];
		if (!fileObj) return;

		if (fileObj.__flashfile) {
			this.flash.removeCacheFileByMd5(md5);
		}
		this.files.length--;
		this.purgeFileData(fileObj);
		delete this.files[md5];
	}


	// 调试Flash的函数。Flash调用此函数在浏览器打印Log
	runtimeContructor.prototype.printFlashLog = function (args) {
		
	//	avalon.log.apply(avalon.log, args);
	}

	runtimeContructor.prototype.sumUploadedSize = function (fileObj) {
		var s = 0;
		for (var i = 0; i < fileObj.blobsProgress.length; i++) {
			s+= fileObj.blobsProgress[i];
		}
		return s;
	}

	// file参数只接受两种类型，第一为HTML5的File对象，第二为Flash生成的FileObj
	runtimeContructor.prototype.addFile = function (file) {
		var me = this;

		var promise = new Promise(function(resolve, reject) {
			var fileObj = null;

			if (window.File != undefined && file instanceof File) {
				var extName = file.name.substr(file.name.lastIndexOf('.')),
					fileConfig = me.vm.getFileConfigByExtName(me.vm, extName);
				fileObj = {
					name: file.name,
					data: file,
					md5: undefined,
					size: file.size,
					status: 0,
					preview: fileConfig.noPreviewPath,
					__flashfile: false,
					__html5file: true,
					chunkAmount: 0,	// 进入实际发送队列后此属性才会被真正计算
					blobsProgress: [] // 每个Blob已经上传完毕的字节数
				};
				var fileReader = new FileReader();

				fileReader.onload = function () {
					var result = this.result;

					// 释放内存
					fileReader.onload = null;
					fileReader = null;

					// H5输出的base64code上带有“data:;base64,”之类的格式信息，需要除掉。第一个逗号后才是真正的文件内容，所以MD5需要截断result
					fileObj.md5 = me.md5Bytes(result.substr(result.indexOf(',') + 1));

					// 如果不需要生成Preview或者文件类型不被认为是图片类型，则直接resolve，否则需要重新读图生成base64预览
					if (!fileConfig.enablePreview || !fileConfig.isImageFile) {
						resolve(fileObj);
					} else {
						fileReader = new FileReader();
						fileReader.onload = function () {
							var img = new Image();
							img.onload = function () {
	                            var canvasEl = document.createElement("canvas"),
	                                ctx = canvasEl.getContext('2d'),
	                                imgWidth = img.width,
	                                imgHeight = img.height,
	                                imageAspectRatio = imgWidth / imgHeight,    // 输入图片的宽高比
	                                canvasAspectRatio = fileConfig.previewWidth / fileConfig.previewHeight, // 预览的宽高比
	                                drawX = drawY = 0,
	                                drawHeight = fileConfig.previewHeight,    // 绘制入Canvas中的预览图高度
	                                drawWidth = fileConfig.previewWidth;      // 绘制入Canvas中的预览图宽度

	                            canvasEl.width = fileConfig.previewWidth;
	                            canvasEl.height = fileConfig.previewHeight;
	                            // 等比压缩图片至Canvas。此处计算宽高比，并得出压缩图像在Canvas上的位置。
	                            // drawY对于过宽的图像调整为纵向居中，drawX对于过长的图像调整为横向居中。
	                            if (imageAspectRatio > canvasAspectRatio) {
	                                drawHeight = imgHeight * fileConfig.previewWidth / imgWidth;
	                                drawY = (fileConfig.previewHeight - drawHeight) / 2;
	                            } else if (imageAspectRatio < canvasAspectRatio) {
	                                drawWidth = imgWidth * fileConfig.previewHeight / imgHeight;
	                                drawX = (fileConfig.previewWidth - drawWidth) / 2;
	                            }

	                            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
	                            fileObj.preview = canvasEl.toDataURL("image/png");
	                            
	                            // 释放内存。
	                            ctx.clearRect(0, 0, fileConfig.previewWidth, fileConfig.previewHeight);
	                            img.onload = img.onerror = null;
	                            img = null;

	                            resolve(fileObj);
	                        }
	                        img.onerror = function () {
	                        	img.onload = img.onerror = null;
	                            img = null;
	                            resolve(fileObj);

	                        //     me.fireEvent('failToGeneratePreview', fileObj); 要不要发送一个错误事件？看以后的需求
	                        }
	                        img.src = this.result;

							fileReader.onload = null;
							fileReader = null;
						}
						fileReader.readAsDataURL(file);
					}
				}
				fileReader.readAsDataURL(file.slice(0, fileConfig.md5Size <= fileObj.size ? fileConfig.md5Size : fileObj.size));
			} else if (file.__flashfile) {
				// ---Flash文件在读入时---
				// 已经生成了Preview和Md5
				// name, size等其他属性已经预备完毕
				fileObj = file;
				// fileObj.md5 = me.md5Bytes(fileObj.md5);
				resolve(fileObj);
			} else {
				debugger;
				reject("无法识别的文件块");
			}
		});

		promise.then(function (fileObj) {
			if (me.fireEvent('beforeFileCache', fileObj)) {
				me.setFileObjectStatus(fileObj, FILE_CACHED);
				me.files[fileObj.md5] = fileObj;
				me.files.length++;

				// 由于Flash读取文件后是放在读取区域，还未进入文件缓存区域，所以需要通知Flash进行缓存。
				if (fileObj.__flashfile) {
					me.flash.cacheFileByMd5(fileObj.md5);
				}
			} else {
				// 如果不需要对此文件进行处理，从文件读取区域和缓存区域，移除此文件数据的引用以释放内存。
				if (fileObj.__flashfile) {
					me.flash.removeCacheFileByMd5(fileObj.md5);
				}
			}
		});
	};


	runtimeContructor.prototype.md5Bytes = function (bytes) {
		var m = bytes;
		if (bytes.length > this.vm.md5Size) {
			m = bytes.slice(0, this.vm.md5Size);
		}
		return this.md5gen(m);
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

	runtimeContructor.prototype.queueFileByMd5 = function (fileMd5) {
		var me = this,
			fileObj = me.files[fileMd5],
			chunked = me.vm.chunked,
			chunkSize = me.vm.chunkSize;
		if (fileObj == undefined || fileObj.status != FILE_CACHED) return;

		var blobs = [];
		if (!chunked || fileObj.size <= chunkSize) {
			blobs.push(new me.blobConstructor(0, fileObj.size, fileObj, blobs.length));
		} else {
			var offset = 0;
			while (offset < fileObj.size) {
				blobs.push(
					new me.blobConstructor(offset, Math.min(fileObj.size - offset, chunkSize), fileObj, blobs.length)
				);
				offset+=chunkSize;
			}
		}
		me.setFileObjectStatus(fileObj, FILE_QUEUED);
		this.blobqueue.push(blobs);
		fileObj.chunkAmount = blobs.length;
		fileObj.blobsProgress = [];

		// this.blobqueue.wakeupSendTask();

		// if (window.File != undefined && fileObj.data != undefined && fileObj.data instanceof File) {
		// 	this.queueHtml5File(fileObj, chunked, chunkSize);
		// } else {
		// 	this.queueFlashFile(fileObj, chunked, chunkSize);
		// }
	}

	runtimeContructor.prototype.readBlob = function(blob, callback, scope) {
		var fileObj = blob.fileObj;

		if (fileObj.status == FILE_QUEUED) {
			this.setFileObjectStatus(fileObj, FILE_IN_UPLOADING);
		}
		try {
			if (window.File != undefined && fileObj.data != undefined && fileObj.data instanceof File) {
				blob.data = fileObj.data.slice(blob.offset, blob.offset + blob.size);
			} else {
				avalon.log("****FileUploader: Start to get flash blob data. Blob index: ", blob.index);
				blob.data = this.flash.readBlob(blob.fileObj.md5, blob.offset, blob.size);
				avalon.log("****FileUploader: JS Get the FLASH BLOB result. LENGTH: ", blob.data.length, ". Blob Size: ", blob.size);
			}
			callback.call(scope, blob);
		} catch (e) {
			this.setFileObjectStatus(fileObj, FILE_ERROR_FAIL_READ);
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
		delete this.md5gen;
		delete this.blobConstructor;
	}

	return runtimeContructor;
});



	// runtimeContructor.prototype.readFileBytes = function (fileObj, start, length, callback, scope) {
	// 	if (fileObj.data instanceof File) {
	// 		return fileObj.data.slice(start, length);
	// 	} else {

	// 	}
	// };
	// runtimeContructor.prototype.queueHtml5File = function (fileObj, chunked, chunkSize) {
	// 	var blobs = [];
	// 	fileObj.status = FILE_IN_READING;
	// 	if (chunked && fileObj.size > chunkSize) {
	// 		var fileCursor = 0;
	// 		while (fileCursor < fileObj.size) {
	// 			var fileStart = fileCursor,
	// 				fileEnd = Math.min(fileCursor+chunkSize, fileObj.size);
	// 			blobs.push(fileObj.data.slice(fileStart, fileEnd));
	// 			fileCursor = fileEnd;
	// 		}
	// 	} else {
	// 		blobs.push(fileObj.data.slice(0, fileObj.size));
	// 	}

	// 	fileObj.status = FILE_SLICED;
	// 	this.blobqueue.queueBlobs(blobs, fileObj);
	// }

	// runtimeContructor.prototype.queueFlashFile = function (fileObj, chunked, chunkSize) {
	// 	fileObj.status = FILE_IN_READING;
	// 	this.flash.startChunkFile(fileObj.md5, chunked, chunkSize);
	// }

	// // flash.startChunkFile执行结束后的回调，由Flash元素调用。Html5运行时不会调用此函数
	// runtimeContructor.prototype.onFlashFileChunked = function (fileMd5, blobs) {

	// }