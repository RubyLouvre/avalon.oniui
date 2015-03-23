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

		this.filesBlobMonitor = {};	// 存放Md5和uploadedBlob数量的键值对
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
			if (!me.filesBlobMonitor.hasOwnProperty(blob.fileObj.md5)) {
				me.filesBlobMonitor[blob.fileObj.md5] = 0;
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
				md5: blob.fileObj.md5,
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
        	// TODO:XUZICN
        }
	}

	blobQueue.prototype.onBlobSuccess = function (blob, response, requestPoolItem) {
		var fileObj = blob.fileObj;
		avalon.log("FileUploader.blobqueue: Blob tranfered. File MD5: ", fileObj.md5, ". Blob Index: ", blob.index);
		avalon.Array.remove(this.requestPool, requestPoolItem);
		fileObj.blobsProgress[blob.index] = blob.size;

		this.filesBlobMonitor[fileObj.md5]++;

		var fileUploadDone = this.filesBlobMonitor[fileObj.md5] == fileObj.chunkAmount;
		if (fileUploadDone) {
			delete this.filesBlobMonitor[fileObj.md5];
		}
		this.fireEvent("blobUploaded", blob, fileUploadDone);
		avalon.log("****FileUploader.runtime: Blob upload done. File MD5: ", blob.fileObj.md5, " .Chunk index: ", blob.index,  " . All blob done: ", fileUploadDone)
	}

	blobQueue.prototype.onBlobError = function (blob, textStatus, error, requestPoolItem) {
		/*****************************************************
		 * 1. 从队列中移除所有同文件的blob
		 * 2. 从RequestPool里取得同文件的其他blob，并取消发送
		 *****************************************************/
		var md5 = requestPoolItem.md5,
			i = 0,
			queueBlob,
			requestPoolItem;

		// 清除Queue中的blob
		while (i < this.queue.length) {
			queueBlob = this.queue[i];
			if (queueBlob.fileObj.md5 == md5) {
				avalon.Array.removeAt(this.queue, i);
			} else {
				i++;
			}
		}

		i = 0;
		while (i < this.requestPool.length) {
			requestPoolItem = this.requestPool[i];
			if (requestPoolItem.md5 == md5) {
				avalon.Array.remove(this.requestPool, requestPoolItem);
				requestPoolItem.request.abort();
			} else {
				i++;
			}
		}

		this.fireEvent("blobFailToUpload", blob, textStatus, error);
		avalon.log("****FileUploader.runtime: Blob upload error. File MD5: ", blob.fileObj.md5, " .Chunk index: ", blob.index, " . Message: ", textStatus)
	}

	blobQueue.prototype.buildRequestParams = function (blob) {
		if (window.FormData == undefined) {
			return {
				blob: blob.data,
				fileKey: blob.fileObj.md5,
				total: blob.fileObj.chunkAmount,
				chunk: blob.index,
				fileName: blob.fileObj.name
			};
		} else {
	        var formData = new FormData();
	        formData.append('blob', blob.data);
	        formData.append('fileKey', blob.fileObj.md5);
	        formData.append('total', blob.fileObj.chunkAmount);
	        formData.append('chunk', blob.index);
	        formData.append('fileName', blob.fileObj.name);
        	return formData;
	    }
	}

	blobQueue.prototype.isRequestPoolFull = function () {
		return this.requestPool.length >= this.serverConfig.requestQueueSize || 3;
	}

	blobQueue.prototype.purge = function () {
		this.queue = null;
		this.requestPool = null;
		clearInterval(this.sendTaskId);
	}
	return blobQueue;
});