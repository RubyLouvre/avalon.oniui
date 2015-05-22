/**
 * @cnName FileUploader组件内部对于文件的包装。
 * @enName Wrap File in FileUploader
 * @introduce
 *    <p>对于文件的一个包装类。每个实例对应一个真实的文件。</p>
 *    <p>属性介绍</p>
 *    <p>name：文件名</p>
 *    <p>size：文件尺寸。按字节计算。</p>
 *    <p>data：文件的数据。是一个HTML5的File对象。在IE6-9下为空。</p>
 *    <p>modifyTime：最后修改时间。</p>
 *    <p>fileLocalToken：在客户端生成的一个唯一的文件ID，不会和其他文件重复。</p>
 *    <p>__flashfile：是否为一个由flash产生的文件。IE6-9等不支持File接口的浏览器下始终为true，其他的浏览器下始终是false。</p>
 *    <p>__html5file：与__flashfile互斥。表示是一个HTML5的文件。</p>
 *    <p>status：与__flashfile互斥。表示是一个HTML5的文件。</p>
 *    <p>chunked：是否开启分块。</p>
 *    <p>blobs：分块的数组。里面包含1到多个blob类的实例。</p>
 *    <p>uploadedPercentage：已上传的百分比。0到100，精确到小数点后两位。</p>
 *    <p>doneBlobs：已成功上传的分块数量。</p>
 *    <p>flashEventHub：fehContructor的一个实例。使用Flash上传时与flash沟通的桥梁。</p>
 *    <p>事件介绍</p>
 *    <p>fileProgressed事件：当文件的上传进度发生变化时产生的事件。包含两个参数，参数1为文件对象本身，参数2为之前的文件上传进度。</p>
 *    <p>fileStatusChanged事件：当文件的状态发生变化时产生的事件。包含两个参数，参数1为文件对象本身，参数2为变化前的文件状态代码。</p>
 *  @updatetime 2015-4-7
 */
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
		this.uploadedPercentage = 0;
		this.flashEventHub = flashEventHub;

		this.doneBlobs = 0;

		if (!chunked) chunkSize = this.size;

		// 拆分文件，并构造blob的实例
		var offset = 0;
		var chunkIndex = 0;
		while (offset < this.size) {
			var blob = new blobConstructor(offset, Math.min(chunkSize, this.size - offset), chunkIndex, this);
			blob.addEventListener("blobProgressed", this.onBlobProgressed, this);
			blob.addEventListener("blobUploaded", this.onBlobUploaded, this);
			blob.addEventListener("blobErrored", this.onBlobErrored, this);
			offset+=chunkSize;
			this.blobs.push(blob);
			chunkIndex++;
		}
	}

	fileConstructor.prototype.onBlobProgressed = function (blob, uploadedBytes) {
		this.setUploadedPercentage(Math.min(100, this.sumUploadedBytes() / this.size * 100));
	}

	fileConstructor.prototype.setUploadedPercentage = function (percentage, silent) {
		var beforePercentage = this.uploadedPercentage;
		this.uploadedPercentage = Math.round(percentage*100) / 100;
		if (silent !== true) {
			this.dispatchEvent("fileProgressed", this, beforePercentage);
		}
	}

	fileConstructor.prototype.onBlobUploaded = function (blob, responseText) {
		this.doneBlobs++;
		if (this.doneBlobs != this.blobs.length) {
			this.setUploadedPercentage(Math.min(100, this.sumUploadedBytes() / this.size * 100));
		} else {
			this.setUploadedPercentage(100, true);
			this.setStatus(this.FILE_UPLOADED);
		}
	}

	fileConstructor.prototype.onBlobErrored = function (blob, errorText) {
		this.setStatus(this.FILE_ERROR_FAIL_UPLOAD);
	}

	/*
	 * 遍历所有的Blob，汇总已上传的字节数。
	 */
	fileConstructor.prototype.sumUploadedBytes = function () {
		var bytes = 0;
		for (var i = 0; i < this.blobs.length; i++) {
			bytes += this.blobs[i].uploadedBytes;
		}
		return bytes;
	}

	/*
	 * 修改文件状态，并Fire一个fileStatusChanged事件。
	 * @param status {int} 新的文件状态代码
	 * @param silent {boolean} silent为true时，不触发fileStatusChanged事件。
	 */
	fileConstructor.prototype.setStatus = function (status, silent) {
		var beforeStatus = this.status;
		this.status = status;
		if (silent !== true) {
			this.dispatchEvent("fileStatusChanged", this, beforeStatus);
		}
	}

	/*
	 * 销毁文件对象，包括Flash内的文件引用和所有的blob。
	 */
	fileConstructor.prototype.purge = function () {
		for (var i = 0; i < this.blobs.length; i++) {
			this.blobs[i].purge();
		}
		this.blobs.length = 0;

		// Purge FLASH FileReference
		if (!!this.flashEventHub && this.__flashfile) {
			this.flashEventHub.sendFlashMessage("removeCacheFileByToken", this.fileLocalToken);
		}
	}

	/*
	 * 文件状态代码。0-100为正常状态，101以后为错误状态
	 */
	fileConstructor.prototype.FILE_INIT = 0;	// 原始状态
	fileConstructor.prototype.FILE_CACHED = 1; // 已被runtime缓存
	fileConstructor.prototype.FILE_QUEUED = 2; // 已进入发送队列
	fileConstructor.prototype.FILE_IN_UPLOADING = 5; // 文件已经开始上传
	fileConstructor.prototype.FILE_UPLOADED = 6; // 文件上传结束
	fileConstructor.prototype.FILE_ERROR_FAIL_READ = 101; // FileQueue无法读取文件
	fileConstructor.prototype.FILE_ERROR_FAIL_UPLOAD = 103; // FileQueue发送文件时碰见错误

	return fileConstructor;
});