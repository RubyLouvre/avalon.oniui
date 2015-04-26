/**
 * @cnName FileUploader组件内部的文件管理器。
 * @enName File manager for FileUploader.
 * @introduce
 *    <p>管理FileUploader的文件对象；持有发送队列。</p>
 *  @updatetime 2015-4-7
 */
define(["avalon"], 
function ($$) {
	var mixFunction = $$.mix;
	var logFunction = $$.log;

	var runtimeContructor = function (uploaderVm, blobqueueConstructor) {
		this.vm = uploaderVm;
		this.files = {};
		this.blobqueue = new blobqueueConstructor(this, uploaderVm.serverConfig);
	};

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

	// 调试Flash的函数。Flash调用此函数在浏览器打印Log
	runtimeContructor.prototype.printFlashLog = function (args) {
		logFunction.apply(logFunction, args);
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
				me.vm.getFileKey(me.vm, fileObj, function (fileKey) {
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
	runtimeContructor.prototype.recieveBlobData2 = function (blobKey, blobArrays) {
		this.readBlobEnd(blobKey, blobArrays.join(""));
	}

	runtimeContructor.prototype.recieveBlobData = function (blobKey, index, stringData, total) {
		if (this.__flashBlobBuffer == undefined) this.__flashBlobBuffer = {};
		if (this.__flashBlobBuffer[blobKey] == undefined) {
			this.__flashBlobBuffer[blobKey] = [];
			this.__flashBlobBuffer[blobKey].recieved = 0;
		}

		var buffer = this.__flashBlobBuffer[blobKey];
		buffer.recieved++;
		while (buffer.length <= index) {
			buffer.push("");
		}
		buffer[index] = stringData;
		if (buffer.recieved == total) {
			var blobData = buffer[0];
			this.readBlobEnd(blobKey, blobData, blobData);
		}
	}
*/
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

	runtimeContructor.prototype.purge = function () {
		this.blobqueue.purge();
		delete this.vm;
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
	return runtimeContructor;
});