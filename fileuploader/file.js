define(["avalon"], function ($$) {
	var fileConstructor = function (fileInfo, flashEventHub, chunked, chunkSize, blobConstructor) {
		this.name = fileInfo.name;
		this.size = fileInfo.size;
		this.data = fileInfo.data;
		this.modifyTime = fileInfo.modifyTime;
		this.fileLocalToken = fileInfo.fileLocalToken;
		this.__flashfile = fileInfo.__flashfile;
		this.__html5file = fileInfo.__html5file;
		this.status = this.FILE_INIT;
		this.chunked = chunked;
		this.blobs = [];
		this.flashEventHub = flashEventHub;

		this.doneBlobs = 0;	// 已成功上传的分片数量

		var offset = 0;
		var chunkIndex = 0;
		if (!chunked) chunkSize = this.size;

		while (offset < this.size) {
			var blob = new blobConstructor(offset, Math.min(chunkSize, this.size - offset), chunkIndex, this);
			blob.attachEvent("blobProgressed", this.onBlobProgressed, this);
			blob.attachEvent("blobUploaded", this.onBlobUploaded, this);
			blob.attachEvent("blobErrored", this.onBlobErrored, this);
			offset+=chunkSize;
			this.blobs.push(blob);
			chunkIndex++;
		}

		this.chunkAmount = this.blobs.length;
	}

	fileConstructor.prototype.onBlobProgressed = function (blob, uploadedBytes) {
		this.fireEvent("fileProgressed", this, Math.min(100, this.sumUploadedBytes() / this.size * 100));
	}

	fileConstructor.prototype.onBlobUploaded = function (blob, responseText) {
		this.doneBlobs++;
		if (this.doneBlobs != this.blobs.length) {
			this.fireEvent("fileProgressed", this, Math.min(100, this.sumUploadedBytes() / this.size * 100));
		} else {
			this.setStatus(this.FILE_UPLOADED);
		}
	}

	fileConstructor.prototype.onBlobErrored = function (blob, errorText) {
		this.setStatus(this.FILE_ERROR_FAIL_UPLOAD);
	}

	fileConstructor.prototype.sumUploadedBytes = function () {
		var bytes = 0;
		for (var i = 0; i < this.blobs.length; i++) {
			bytes += this.blobs[i].uploadedBytes;
		}
		return bytes;
	}

	fileConstructor.prototype.setStatus = function (status, silent) {
		var beforeStatus = this.status;
		this.status = status;
		if (silent !== true) {
			this.fireEvent("fileStatusChanged", this, beforeStatus, status);
		}
	}

	fileConstructor.prototype.purge = function () {
		for (var i = 0; i < this.blobs.length; i++) {
			this.blobs[i].purge();
		}
		this.blobs.length = 0;

		// Purge FLASH FileReference
		if (!!this.flashEventHub) {
			this.flashEventHub.sendFlashMessage("removeCacheFileByToken", this.fileLocalToken);
		}
	}

	/*
	 * 文件状态代码。0-100为正常状态，101以后为错误状态
	 */
	fileConstructor.prototype.FILE_INIT = 0;
	fileConstructor.prototype.FILE_CACHED = 1; // 已被runtime缓存
	fileConstructor.prototype.FILE_QUEUED = 2; // 已进入发送队列
	fileConstructor.prototype.FILE_IN_UPLOADING = 5; // 文件已经开始上传
	fileConstructor.prototype.FILE_UPLOADED = 6; // 文件上传结束
	fileConstructor.prototype.FILE_ERROR_FAIL_READ = 101; // FileQueue无法读取文件
	fileConstructor.prototype.FILE_ERROR_FAIL_UPLOAD = 103; // FileQueue发送文件时碰见错误

	return fileConstructor;
});