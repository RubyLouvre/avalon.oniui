/**
 * @cnName FileUploader组件内部对于HTML5 Input或者Flash的文件弹窗的封装。
 * @enName File Input wrapper in FileUploader
 * @introduce
 *    <p>屏蔽文件选择弹窗的差异。</p>
 *    <p>事件介绍</p>
 *    <p>newFileSelected事件：当一个新的文件被选中时，触发此事件。</p>
 *    <p>filePreviewUpdated事件：对某一文件的预览生成结束，并获得了结果后，触发此事件。</p>
 *  @updatetime 2015-4-7
 */
 define(["avalon"], 
function ($$) {
	var proxyContructor = function (contextGen) {
		this.contextGen = contextGen;
	}

	proxyContructor.prototype.bindFlashEvent = function (target) {
		target.addEventListener("newFileGenerated", this.onFlashFileAdded, this);
		target.addEventListener("filePreviewUpdated", this.onPreviewUpdated, this);
	}

	proxyContructor.prototype.onPreviewUpdated = function (fileLocalToken, preview) {
		this.dispatchEvent("previewGenerated", fileLocalToken, preview);
	}

	proxyContructor.prototype.fileLocalTokenSeed = (proxyContructor.prototype.fileLocalTokenSeed == undefined) ? 0 : (proxyContructor.prototype.fileLocalTokenSeed);

	proxyContructor.prototype.onH5FileFieldChanged = function (event) {
        var target = event.target || event.srcElement;
        // 这里先把input file移除出dom tree，重新建立一个新的input file，再加回dom tree。
        // 主要是为了清除input file的已选文件。暂时没有更好的办法。
        var html = target.outerHTML,
            pNode = target.parentNode,
            fileInputWrapper = document.createElement("div");
        if (!pNode) return;
        pNode.removeChild(target);
        fileInputWrapper.innerHTML = html;
        this.addEventListenerInput(fileInputWrapper.children[0]);
        pNode.appendChild(fileInputWrapper.children[0]);

        var files = target.files || target.value;
        this.addNewFiles(files);
	}

	proxyContructor.prototype.addNewFiles = function (files) {
        var me = this;
        for (var i = 0; i < files.length; i++) {
        	var fileContext = this.getFileContext({ name: files[i].name, size: files[i].size });
        	if (fileContext.canBeAdded) {
				var fileInfo = {
					name: files[i].name,
					data: files[i],
					fileLocalToken: fileContext.fileLocalToken,
					size: files[i].size,
					preview: fileContext.defaultPreview,
					__flashfile: false,
					__html5file: true,
					lastModified: files[i].lastModified
				};
				me.dispatchEvent("newFileSelected", fileInfo);

				if (fileContext.enablePreviewGen) {
					this.getImagePreview(fileInfo, fileContext.previewWidth, fileContext.previewHeight, function (fileInfo, preview) {
						if (preview && preview != fileInfo.preview) {
							me.onPreviewUpdated(fileInfo.fileLocalToken, preview);
						}
					});
				}
        	}
        }
	}

	proxyContructor.prototype.getImagePreview = function (fileInfo, previewWidth, previewHeight, callback) {
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
				fileReader.readAsDataURL(fileInfo.data);
			},100);
		});
		
		promise.then(function (preview) {
			callback.call(me, fileInfo, preview);
		});
	}

    proxyContructor.prototype.applyFileLocalToken = function () {
        this.fileLocalTokenSeed++;
        return "__avalonfile"+this.fileLocalTokenSeed;
    }

	proxyContructor.prototype.onFlashFileAdded = function (fileInfo) {
		this.dispatchEvent("newFileSelected", fileInfo);
	}

	proxyContructor.prototype.getFileContext = function (basicInfo) {
		var context = this.contextGen.fn.call(this.contextGen.scope, basicInfo);
		context.fileLocalToken = this.applyFileLocalToken();
		return context;
	}

	proxyContructor.prototype.addEventListenerInput = function (input) {
		var me = this;
        avalon(input).bind("change", function (event) {
        	me.onH5FileFieldChanged.call(me, event)
        });
	}

	return proxyContructor;
});