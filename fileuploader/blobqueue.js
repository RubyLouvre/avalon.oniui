define(["avalon"], function (avalon) {
	function blobQueue (runtime, serverConfig) {
		var me = this;
		this.$runtime = runtime;
		this.queue = [];
		this.requestPool = [];
		this.serverConfig = serverConfig;
		this.sendTaskId = setInterval(function () {
			me.taskFn.call(me);
		}, 100);

		this.filesBlobMonitor = {};	// 存放fileLocalToken和uploadedBlob数量的键值对
	}

	blobQueue.prototype.pop = function () {
		if (this.queue.length <= 0) {
			return false;
		} else {
			avalon.log("****FileUploader.blobQueue: Blob poped. Index: ", this.queue[0].index)
			return this.queue.shift();
		}
	}

	blobQueue.prototype.push = function (items) {
		if (!Array.isArray(items)) items = [items];
		var me = this;
		me.queue = me.queue.concat(items);
		me.length += items.length;

		items.forEach(function (blob) {
			if (!me.filesBlobMonitor.hasOwnProperty(blob.fileObj.fileLocalToken)) {
				me.filesBlobMonitor[blob.fileObj.fileLocalToken] = 0;
			}
		})
		// this.fireEvent('onFileQueued', fileObj);
	}

	blobQueue.prototype.wakeupSendTask = function () {

	}

	blobQueue.prototype.sleepSendTask = function () {
		// if (this.sendTaskId != undefined) clearInterval(this.sendTaskId);
	}

	blobQueue.prototype.taskFn = function () {
		var me = this;
		if (this.isRequestPoolFull() || this.queue.length == 0) {
			return;
		}

		this.$runtime.readBlob(this.pop(), function (blob) {
			var formData = this.buildRequestParams(blob);
			//request.send(request.formData);
			var requestPoolItem = {
				fileLocalToken: blob.fileObj.fileLocalToken,
				request: null
			};
			var requestConfig = {
			    type: "post",
			    url: this.serverConfig.url,
			    timeout: this.serverConfig.timeout || 30000,
			    password: this.serverConfig.password,
			    username: this.serverConfig.userName,
			    success: function () {
			    	me.onBlobSuccess.call(me, blob, this.response, requestPoolItem);
			    },
			    cache: false,
			    progressCallback: function (e) {
			    	me.onBlobProgress.call(me, e, blob, this, requestPoolItem);			    	
			    },
			    error: function (textStatus, error) {
			    	me.onBlobError.call(me, blob, textStatus, error, requestPoolItem);
			    }
			};
			if (window.FormData == undefined || !(formData instanceof FormData)) {
				requestConfig.data = formData;
			} else {
				requestConfig.form = formData;
			}
			try {
				var request = avalon.ajax(requestConfig);
				requestPoolItem.request = request;
				this.requestPool.push(requestPoolItem);
			} catch (e) {
				this.fireEvent("failToSendRequest", blob, e);
			}
		}, this);
	}

	
	blobQueue.prototype.onBlobProgress = function (e, blob, request, requestPoolItem) {
        if (e.lengthComputable) {
			var fileObj = blob.fileObj;
			fileObj.blobsProgress[blob.index] = e.loaded;
			this.fireEvent("blobProgressUpdated", blob);
        }
	}

	blobQueue.prototype.onBlobSuccess = function (blob, response, requestPoolItem) {
		var fileObj = blob.fileObj;
		avalon.log("FileUploader.blobqueue: Blob tranfered. File token: ", fileObj.fileLocalToken, ". Blob Index: ", blob.index);
		avalon.Array.remove(this.requestPool, requestPoolItem);
		fileObj.blobsProgress[blob.index] = blob.size;

		this.filesBlobMonitor[fileObj.fileLocalToken]++;

		var fileUploadDone = this.filesBlobMonitor[fileObj.fileLocalToken] == fileObj.chunkAmount;
		if (fileUploadDone) {
			delete this.filesBlobMonitor[fileObj.fileLocalToken];
		}
		this.fireEvent("blobUploaded", blob, fileUploadDone);
		avalon.log("****FileUploader.runtime: Blob upload done. File token: ", blob.fileObj.fileLocalToken, " .Chunk index: ", blob.index,  " . All blob done: ", fileUploadDone)
	}

	blobQueue.prototype.onBlobError = function (blob, textStatus, error, requestPoolItem) {
		/*****************************************************
		 * 1. 从队列中移除所有同文件的blob
		 * 2. 从RequestPool里取得同文件的其他blob，并取消发送
		 *****************************************************/
		var fileLocalToken = requestPoolItem.fileLocalToken,
			i = 0,
			queueBlob,
			requestPoolItem;

		// 清除Queue中的blob
		while (i < this.queue.length) {
			queueBlob = this.queue[i];
			if (queueBlob.fileObj.fileLocalToken == fileLocalToken) {
				avalon.Array.removeAt(this.queue, i);
			} else {
				i++;
			}
		}

		i = 0;
		while (i < this.requestPool.length) {
			requestPoolItem = this.requestPool[i];
			if (requestPoolItem.fileLocalToken == fileLocalToken) {
				avalon.Array.remove(this.requestPool, requestPoolItem);
				requestPoolItem.request.abort();
			} else {
				i++;
			}
		}

		this.fireEvent("blobFailToUpload", blob, textStatus, error);
		avalon.log("****FileUploader.runtime: Blob upload error. File token: ", blob.fileObj.fileLocalToken, " .Chunk index: ", blob.index, " . Message: ", textStatus)
	}

	blobQueue.prototype.buildRequestParams = function (blob) {
		var paramConfig = this.$runtime.getRequestParamConfig(blob),
			blobParamName = paramConfig.requiredParamsConfig.blobParamName,
			fileLocalTokenParamName = paramConfig.requiredParamsConfig.fileLocalTokenParamName,
			totalChunkParamName = paramConfig.requiredParamsConfig.totalChunkParamName,
			chunkIndexParamName = paramConfig.requiredParamsConfig.chunkIndexParamName,
			fileNameParamName = paramConfig.requiredParamsConfig.fileNameParamName,
			customizedParams = paramConfig.customizedParams,
			blobMd5ParamName = paramConfig.requiredParamsConfig.blobMd5ParamName;

		var data = {};
		data[blobParamName] = blob.data;
		if(!!blob.fileObj.fileKey) data[fileLocalTokenParamName] = blob.fileObj.fileKey;
		data[totalChunkParamName] = blob.fileObj.chunkAmount;
		data[chunkIndexParamName] = blob.index;
		data[fileNameParamName] = blob.fileObj.name;
		if(!!blob.md5) data[blobMd5ParamName] = blob.md5;


		data = avalon.mix(data, customizedParams);

		// 转FormData
		if (window.FormData != undefined) {
	        var formData = new FormData();
	        for (var i in data) {
	        	if (data.hasOwnProperty(i)) {
	        		formData.append(i, data[i]);
	        	}
	        }
	        data = formData;
	    }
		return data;
	}

	blobQueue.prototype.isRequestPoolFull = function () {
		return this.requestPool.length >= (this.serverConfig.concurrentRequest || 3);
	}

	blobQueue.prototype.purge = function () {
		this.queue = null;
		this.requestPool = null;
		clearInterval(this.sendTaskId);
	}
	return blobQueue;
});