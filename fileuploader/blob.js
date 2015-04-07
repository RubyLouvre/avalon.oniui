/*
blob: {
  fileObj:
  offset:       // 相对于文件的Offset
  size:         // blob的尺寸
  uploadedBytes // 已上传的字节数
}
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

	blob.prototype.purgeData = function () {
		this.data = null;
	}

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

	blob.prototype.cancelUpload = function () {
		return true;
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
			fileObj.flashEventHub.listenTo(this.successEventBusToken, this.onSuccess, this);
			fileObj.flashEventHub.listenTo(this.errorEventBusToken, this.onError, this);
		}
	}
	
	/*
	 * 反注册EventHub事件。
	 */
	blob.prototype.unbindFlashEventHub = function () {
		var fileObj = this.fileObj;
		if (fileObj.flashEventHub) {
			/***** FLASH目前不支持Progress事件，不注册progress事件*************/
			fileObj.flashEventHub.unlisten(this.successEventBusToken, this.onSuccess, this);
			fileObj.flashEventHub.unlisten(this.errorEventBusToken, this.onError, this);
		}
	}

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
		data[totalChunkParamName] = this.fileObj.chunkAmount;
		data[chunkIndexParamName] = this.index;
		data[fileNameParamName] = this.fileObj.name;
		if(!!this.md5) data[blobMd5ParamName] = this.md5;
		data = avalon.mix(data, customizedParams);

		data["__dataField"] = blobParamName;	// __dateField是文件二进制字节的参数名。
		return data;
	}

	blob.prototype.onProgress = function (uploadedBytes) {
		this.uploadedBytes = this.uploadedBytes;
		this.fireEvent("blobProgressed", this, uploadedBytes);
	}

	blob.prototype.onSuccess = function (responseText) {
		this.unbindFlashEventHub();

		delete this.uploadConfig;
		this.uploadedBytes = this.size;
		this.fireEvent("blobUploaded", this, responseText);
	}

	blob.prototype.onError = function (textStatus) {
		this.retried++;
		if (this.retried < 3) {
			this.log("FileUploader: fail to upload blob. Retrying for ", this.retried, " time(s).");
			this.upload(this.uploadConfig);
		} else {
			delete this.uploadConfig;
			this.unbindFlashEventHub();
			this.fireEvent("blobErrored", this, textStatus);
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
			this.fireEvent("blobErrored", blob, e.message);
			return false;
		}
	}





	return blob;
});