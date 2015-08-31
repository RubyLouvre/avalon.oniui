/**
 * @cnName FileUploader组件内部对于文件分块的包装。
 * @enName Wrap Blob in FileUploader
 * @introduce
 *    <p>对于文件分块的一个包装类，负责抹平HTML5和Flash文件接口的差异。每个实例对应一个文件分块。本类的实例不承载文件分块的实际数据。</p>
 *    <p>属性介绍</p>
 *    <p>offset：在文件字节中的开始位置。</p>
 *    <p>size：分块尺寸。按字节计算。</p>
 *    <p>fileObj：blob所属的文件对象。是FileUploader的File类的实例。</p>
 *    <p>uploadedBytes：已上传的字节数。</p>
 *    <p>retried：上传失败后重试的次数。</p>
 *    <p>successEventBusToken：采用Flash上传时，FlashEventHub中注册的分块上传成功的事件名。</p>
 *    <p>errorEventBusToken：采用Flash上传时，FlashEventHub中注册的分块上传失败  的事件名。</p>
 *    <p>事件介绍</p>
 *    <p>blobProgressed事件：使用Flash上传时该事件无效。当文件分块的上传进度发生变化时产生的事件。包含两个参数，参数1为文件分块对象本身，参数2为已上传的字节数。</p>
 *    <p>blobUploaded事件：当文件分块上传成功时产生的事件。包含两个参数，参数1为文件对象分块本身，参数2为服务器返回的responseText。</p>
 *    <p>blobErrored事件：当文件分块上传并且重试数次后仍然失败，此事件会触发。包含两个参数，参数1为文件对象分块本身，参数2为服务器返回的error状态文本。</p>
 *  @updatetime 2015-4-7
 */
define(["avalon"], function (avalon) {
	function blob(offset, size, index, fileObj) {
		this.offset = offset;
		this.size = size;
		this.index = index;
		this.fileObj = fileObj;
		this.uploadedBytes = 0;
		this.retried = 0;

		this.successEventBusToken = fileObj.fileLocalToken+"#"+this.index+"success";	// FlashEventHub注册Succuss事件的事件名称
		this.errorEventBusToken = fileObj.fileLocalToken+"#"+this.index+"error";	// FlashEventHub注册Error事件的事件名称

		return this;
	}

	/*
	 * 上传分块。
	 */
	blob.prototype.upload = function (config) {
		this.uploadConfig = config;
		var fileObj = this.fileObj;
		if (fileObj.__flashfile) {
			return this.__flashupload(config);
		} else {
			this.__html5upload(config);
		}
		return true;
	}


	/*
	 * 取消上传操作。TBD。
	 */
	blob.prototype.cancelUpload = function () {
		return true;	// TBD
	}

	blob.prototype.__flashupload = function (config) {
		var fileObj = this.fileObj;
		if (this.retried == 0) {
			this.bindFlashEventHub();
			/***** FLASH目前不支持Progress事件，不注册progress事件*************/
	    	config.onSuccess = this.successEventBusToken;
	    	config.onError = this.errorEventBusToken;

	    	config.paramConfig = this.__extraRequestData(config.paramConfig);
	    }

		this.log("FileUploader: blob sending. Index: ", this.index);

		fileObj.flashEventHub.sendFlashMessage("uploadBlob", fileObj.fileLocalToken, this.offset, this.size, config);

		return true;
	}

	/*
	 * 注册EventHub事件。
	 */
	blob.prototype.bindFlashEventHub = function () {
		var fileObj = this.fileObj;
		if (fileObj.flashEventHub) {
			/***** FLASH目前不支持Progress事件，不注册progress事件*************/
			fileObj.flashEventHub.addEventListener(this.successEventBusToken, this.onSuccess, this);
			fileObj.flashEventHub.addEventListener(this.errorEventBusToken, this.onError, this);
		}
	}
	
	/*
	 * 反注册EventHub事件。
	 */
	blob.prototype.unbindFlashEventHub = function () {
		var fileObj = this.fileObj;
		if (fileObj.flashEventHub) {
			/***** FLASH目前不支持Progress事件，不注册progress事件*************/
			fileObj.flashEventHub.removeEventListener(this.successEventBusToken, this.onSuccess, this);
			fileObj.flashEventHub.removeEventListener(this.errorEventBusToken, this.onError, this);
		}
	}

	/*
	 * 组装文件请求的参数和参数值。
	 */
	blob.prototype.__extraRequestData = function (paramConfig) {
		var me = this;
		// 合并文件参数，包括用户自定义的参数
		var blobParamName = paramConfig.requiredParamsConfig.blobParamName,
			fileTokenParamName = paramConfig.requiredParamsConfig.fileTokenParamName,
			totalChunkParamName = paramConfig.requiredParamsConfig.totalChunkParamName,
			chunkIndexParamName = paramConfig.requiredParamsConfig.chunkIndexParamName,
			fileNameParamName = paramConfig.requiredParamsConfig.fileNameParamName,
			customizedParams = paramConfig.customizedParams,
			blobMd5ParamName = paramConfig.requiredParamsConfig.blobMd5ParamName;
		var data = {};
		if(!!this.fileObj.fileKey) data[fileTokenParamName] = this.fileObj.fileKey;
		data[totalChunkParamName] = this.fileObj.blobs.length;
		data[chunkIndexParamName] = this.index;
		data[fileNameParamName] = this.fileObj.name;
		if(!!this.md5) data[blobMd5ParamName] = this.md5;
		data = avalon.mix(data, customizedParams);

		data["__dataField"] = blobParamName;	// __dateField是文件二进制字节的参数名。
		return data;
	}

	blob.prototype.onProgress = function (uploadedBytes) {
		this.uploadedBytes = this.uploadedBytes;
		this.dispatchEvent("blobProgressed", this, uploadedBytes);
	}

	blob.prototype.onSuccess = function (responseText) {
		this.unbindFlashEventHub();

		delete this.uploadConfig;
		this.uploadedBytes = this.size;
		this.dispatchEvent("blobUploaded", this, responseText);
	}

	blob.prototype.onError = function (textStatus) {
		this.retried++;
		var retryConfig = this.uploadConfig.blobRetryTimes ? this.uploadConfig.blobRetryTimes : 0;
		if (this.retried < retryConfig) {
			this.log("FileUploader: fail to upload blob. Retrying for ", this.retried, " time(s).");
			this.upload(this.uploadConfig);
		} else {
			delete this.uploadConfig;
			this.unbindFlashEventHub();
			this.dispatchEvent("blobErrored", this, textStatus);
		}
	}

	blob.prototype.__html5upload = function (config) {
		var me = this;
		var data = this.__extraRequestData(config.paramConfig);
		data[data.__dataField] = this.fileObj.data.slice(this.offset, this.offset + this.size);
		// 转FormData
        var formData = new FormData();
        for (var i in data) {
        	if (data.hasOwnProperty(i)) {
        		formData.append(i, data[i]);
        	}
        }

		var requestPoolItem = {
			fileLocalToken: this.fileObj.fileLocalToken,
			blob: this
		};
		var requestConfig = {
		    type: "post",
		    url: config.url,
		    form: formData,
		    timeout: config.timeout || 30000,
		    password: config.password,
		    username: config.userName,
		    success: function () {
		    	me.onSuccess();
		    },
		    cache: false,
		    progressCallback: function (e) {        
		    	if (e.lengthComputable) {
		    		me.onProgress(e.loaded);
		        }
		    },
		    error: function (textStatus, error) {
		    	me.onError(textStatus, error);
		    }
		};

		// 发送请求
		try {
			this.request = avalon.ajax(requestConfig);
			return true;
		} catch (e) {
			this.dispatchEvent("blobErrored", blob, e.message);
			return false;
		}
	}





	return blob;
});