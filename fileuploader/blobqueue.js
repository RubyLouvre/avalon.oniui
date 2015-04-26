/**
 * @cnName FileUploader组件内部Blob队列。列中的Blob在队列不忙的时候会被自动发送。
 * @enName Blobqueue for FileUploader. Upload blobs automaticlly when the queue is not busy.
 * @introduce
 *    <p>具备并发请求管理、自动发送的功能。</p>
 *  @updatetime 2015-4-10
 */
 define(["avalon"], function (avalon) {
	function blobQueue (runtime, serverConfig) {
		var me = this;
		this.$runtime = runtime;
		this.queue = [];
		this.requestPool = [];
		this.serverConfig = serverConfig;
		this.inSending = 0;	//正在发送的请求数量
		this.sendTaskId = setInterval(function () {
			me.taskFn.call(me);
		}, 20);

		this.filesBlobMonitor = {};	// 存放fileLocalToken和uploadedBlob数量的键值对
	}

	blobQueue.prototype.pop = function () {
		if (this.queue.length <= 0) {
			return false;
		} else {
			return this.queue.shift();
		}
	}

	/*
	 * 1. 从队列中移除所有同文件的blob
	 * 2. 从RequestPool里取得同文件的其他blob，并取消发送
	 */
	blobQueue.prototype.stopUploadByLocalToken = function (fileLocalToken) {
		var i = 0,
			queueBlob, poolBlob;
		// 清除Queue中的blob
		while (i < this.queue.length) {
			queueBlob = this.queue[i];
			if (queueBlob.fileObj.fileLocalToken == fileLocalToken) {
				avalon.Array.removeAt(this.queue, i);
			} else {
				i++;
			}
		}

		// 从RequestPool中移除相关的上传请求，并取消这些请求
		i = 0;
		while (i < this.requestPool.length) {
			poolBlob = this.requestPool[i];
			if (poolBlob.fileObj.fileLocalToken == fileLocalToken) {
				avalon.Array.remove(this.requestPool, poolBlob);
				poolBlob.cancelUpload();
				this.inSending--;
			} else {
				i++;
			}
		}
	}

	blobQueue.prototype.push = function (items) {
		if (!Array.isArray(items)) items = [items];
		var me = this;
		me.queue = me.queue.concat(items);

		items.forEach(function (blob) {
			if (!me.filesBlobMonitor.hasOwnProperty(blob.fileObj.fileLocalToken)) {
				me.filesBlobMonitor[blob.fileObj.fileLocalToken] = 0;
			}
		})
	}
/*
	blobQueue.prototype.wakeupSendTask = function () {

	}

	blobQueue.prototype.sleepSendTask = function () {
		// if (this.sendTaskId != undefined) clearInterval(this.sendTaskId);
	}
*/
	blobQueue.prototype.taskFn = function () {
		var me = this;
		
		while (!this.isRequestPoolFull() && this.queue.length != 0) {
			this.inSending++;	// 正在发送+1
			var blob = this.pop();
			// FILE_QUEUED状态表示文件是首次发送，修改文件状态至FILE_IN_UPLOADING
			if (blob.fileObj.status == blob.fileObj.FILE_QUEUED) {
				blob.fileObj.setStatus(blob.fileObj.FILE_IN_UPLOADING);
			}

			blob.addEventListener("blobUploaded", me.onBlobSuccess, me);
			blob.addEventListener("blobErrored", me.onBlobError, me);

			var paramConfig = this.$runtime.getRequestParamConfig(blob);
			var sentSucessed = blob.upload({
				url: this.serverConfig.url,
				paramConfig: paramConfig,
			    timeout: this.serverConfig.timeout || 30000,
			    password: this.serverConfig.password,
			    username: this.serverConfig.userName,
			    blobRetryTimes: this.serverConfig.blobRetryTimes
			});

			if (sentSucessed) {
				this.requestPool.push(blob);
			} else {
				blob.fileObj.setStatus(blob.fileObj.FILE_ERROR_FAIL_UPLOAD);
			}
		}
	}


	blobQueue.prototype.onBlobSuccess = function (blob, response) {
		this.inSending--;
		this.log("****FileUploader.blobqueue: Blob tranfered. File token: ", blob.fileObj.fileLocalToken, ". Blob Index: ", blob.index);
		avalon.Array.remove(this.requestPool, blob);
	}

	blobQueue.prototype.onBlobError = function (blob, textStatus, error) {
		this.inSending--;
		this.stopUploadByLocalToken(blob.fileObj.fileLocalToken);
		this.log("****FileUploader.runtime: Blob upload error. File token: ", blob.fileObj.fileLocalToken, " .Chunk index: ", blob.index, " . Message: ", textStatus)
	}

	blobQueue.prototype.isRequestPoolFull = function () {
		return this.inSending >= (this.serverConfig.concurrentRequest || 3);
	}

	blobQueue.prototype.purge = function () {
		this.queue = null;
		this.requestPool = null;
		clearInterval(this.sendTaskId);
	}
	return blobQueue;
});