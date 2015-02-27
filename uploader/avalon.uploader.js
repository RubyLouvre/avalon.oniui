define(["browser/avalon.browser", "text!./avalon.uploader.html", "mmRequest/mmRequest", "./swfobject/swfobject"], function(avalon, sourceHTML){

	var widget = avalon.ui.uploader = function(element, data, vmodels){

		var uploaderId = data.uploaderId,
			swfId = uploaderId + 'Swf',
			swf,				// {Element} <object>
			fileList = [],		// 存放file对象
			browseButton,		// 按钮
			browseButtonClick,	// browseButton 绑定的 click 事件
			safeOpts = ['action', 'browseButton'],	// 需检测的配置项
			isSafe = true,		// 配置项安全检测标志
			ieVersion = avalon.browser.ie,
			hasLoadFlash = false;

		var vmodel = avalon.define(data.uploaderId, function(vm){

			vm.files = [];

			avalon.mix(vm, data.uploaderOptions);

			browseButton = document.getElementById(vm.browseButton);

			vm.deleteFile = function(index){

				avalon.post(vmodel.action, {
					id: vmodel.files[index].id
				}, function(data){
					
					if(data.errcode == 0){
						// 成功
						vmodel.files.removeAt(index);
						// ff 中 swf 有一定概率取不到 setUploadSuccessNum 方法
						if(swf.setUploadSuccessNum){
							swf.setUploadSuccessNum(vmodel.files.length);
						}
						
						vmodel.onDeleteSuccess(data);

					}else{
						// 失败
						vmodel.onDeleteFailed(data);
					}

				}, 'json');
			};
			
			vm.$init = function(){

				// 安全检测
				for(var i = 0, len = safeOpts.length; i < len; i++){
					var opt = safeOpts[i];
					if(!vmodel[opt]){
						avalon.log('avalon.uploader 缺少配置项：' + opt);
						isSafe = false;
						break;
					}
				}

				if(isSafe){
					loadFlash();
					// loadInput();
				}
				
				avalon.scan(element, [vmodel].concat(vmodels));

				if(typeof vmodel.onInit === 'function'){
					vmodel.onInit.call(element, vmodel, data.uploaderOptions, vmodels);
				}
			};

			vm.$remove = function(){
				
			};

			vm.$jsHandler = function(obj){

				switch(obj.type){
					case 'uploading':
						// 上传时触发
					break;
					case 'singleSuccess':
					break;
					case 'singleError':
						vmodel.onSingleFailed(obj.data.name);
					break;
					case 'uploaded':
						var items = obj.data.sucAry,
							imgs = [];

						for (var i = 0, len = items.length; i < len; i++) {
							var img = {
								name: items[i].name,
								src: items[i].source.data.images[0].url,
								id: items[i].source.data.images[0].id
							};
							vmodel.files.push(img);
							imgs.push(img);
						};

						vmodel.onSuccess(imgs, obj.data);
					break;
					case 'flashInit':
						// 初始化，取到 swf
						swf = document.getElementById(swfId);
						// 防止用户隐藏起 flash 导致原先配置丢失，这里重新配置 flash
						swf.setMaxFileNum(vmodel.maxFileCount);
						swf.setUploadSuccessNum(vmodel.files.length);
					break;
					case 'onSizeErr':
						vmodel.onFileSizeErr(obj.data);
					break;
					case 'fileNumErr':
						vmodel.onFileCountErr(vmodel.maxFileCount - vmodel.files.length, obj.data);
					break;
				}
			};
			
		});
		
		/*
		 * HACK
		 *
		 * 非 chrome 下，flash 被隐藏起会失效，这是 flash 本身的bug。
		 * 这里也仅仅是 猜测 当上传文件到达上限时，flash 会被隐藏，所以需要重新初始化下。
		 * 但这是不可靠的，不全面的。
		 */
		if(!avalon.browser.chrome){
			vmodel.files.$watch('length', function(val){
				if(val == vmodel.maxFileCount){
					vmodel.$init();
				}
			});
		}
		

		return vmodel;


		function loadInput(){
			// 创建 input 元素
			var input = avalon.parseHTML(sourceHTML.split("MS_OPTION_COM")[0]).firstChild;
			// 绑定事件
			input.onchange = function(e){

				var files = this.files;
				
				if(files){	// chrome, ff, ie10+
					for(var i = 0, len = files.length; i < len; i++){
						preViewImg(files[i]);
					}
				}else{		// ie9-
					/*
					 * 出于安全考虑浏览器一般会使用 fakepath 隐藏真实路径，
					 * 所以下面这行代码无效：
					 * vmodel.files.push(this.value.replace(/\\/g, '/'));
					 *
					 * 参考：http://www.iefans.net/ie-shangchuan-bendi-lujing-fakepath/
					 * 以下代码有效：
					 * 但是，如果该 change 事件是由其他事情异步触发的，则无效。
					 */
					this.select();
					this.blur();
					vmodel.files.push({
						src: document.selection.createRange().text
					});
				}

				// 清空input，保证下次change事件的触发
				this.value = '';
				// ie10-下无法清空，借用form的reset方法
				if(this.value){
					var _tempForm = document.createElement('form'),
						_nextElement = this.nextSibling,
						_parentElement = this.parentNode;

					// 取出并清空该input
					_tempForm.appendChild(this);
					_tempForm.reset();

					// 放回该input
					if(_nextElement){
						_nextElement.parentNode.insertBefore(this, _nextElement);
					}else{
						// 如果不存在后节点，通过父节点放回
						_parentElement.appendChild(this);
					}
				}

			};

			// 绑定 input click 事件
			browseButtonClick = avalon.bind(browseButton, "click", function(){
				input.click();
			});


			// 插入 input 元素
			if(ieVersion > 0 && ieVersion < 10){
				// ie9- 用其他异步事件来触发 input.click 无法取得文件本地路径
				// 必须还是要点到 input 上，所以插到按钮内部
				browseButton.appendChild(input);
			}else{
				// 其他浏览器随便插入，隐藏就行
				input.style.display = 'none';
				element.appendChild(input);
			}
		}

		function loadFlash(){
			
			var flash = avalon.parseHTML(sourceHTML.split("MS_OPTION_COM")[1]).firstChild;

			if(hasLoadFlash){
				browseButton.removeChild(browseButton.lastChild);
			}else{
				// 第一次
				if(getStyle(browseButton, 'position') == 'static'){
					browseButton.style.position = 'relative';
				}
			}

			// ie6 下 height: 100%失效
			if(ieVersion == 6){
				flash.style.height = getStyle(browseButton, 'height');
			}

			browseButton.appendChild(flash);

			var flashvars = {
				js_handler: 'avalon.vmodels.' + uploaderId + '.$jsHandler',
				uploadAPI: vmodel.action,
				maxFileSize: vmodel.maxFileSize,
				maxFileNum: vmodel.maxFileCount,
				imgMaxWidth: vmodel.imgMaxWidth,
				imgMaxHeight: vmodel.imgMaxHeight
			};
			var params = {
				menu: "false",
				scale: "noScale",
				allowFullscreen: "true",
				allowScriptAccess: "always",
				bgcolor: "",
				wmode: "transparent" // 透明
			};
			var attributes = {
				id: swfId
			};
			avalon.swfobject.embedSWF(
				"swfobject/multiPicUpload.swf", 
				"altContent", "100%", "100%", "10.0.0", 
				"expressInstall.swf", 
				flashvars, params, attributes
			);

			hasLoadFlash = true;
		}

		function preViewImg(file){
					
			if(/image/.test(file.type)){
				
				var reader = new FileReader();
				reader.readAsDataURL(file);
				
				reader.onprogress = function(e){
					/* if(e.lengthComputable){
						console.log('ok: ' + e.loaded + '/' + e.total);
					}else{
						console.log('no ok.');
					}*/
				};
				reader.onload = function(){
					if(vmodel.files.length < vmodel.maxFileCount){
						vmodel.files.push({
							src: reader.result,
							name: file.name,
							size: file.size
						});
						fileList.push(file);
					}
				};
			}
		}
	};

	widget.version = 1.2;
	widget.defaults = {
		
		maxFileSize: 1048576,	// 1MB
		maxFileCount: 100,
		imgMaxWidth: 10000,
		imgMaxHeight: 10000,

		// 回调
		onSuccess: avalon.noop,
		onSingleFailed: function(fileName){
			alert('文件' + fileName + '上传失败');
		},
		onFileSizeErr: function(fileName){
			alert('文件' + fileName + '太大了');
		},
		onFileCountErr: function(availableNum, selectNum){
			alert('还可选择' + availableNum + '个，你选择了' + selectNum + '个，超出了');
		},
		onDeleteSuccess: avalon.noop,
		onDeleteFailed: avalon.noop
	};

	// 获取元素样式
	function getStyle(ele, attr){
		if(window.getComputedStyle){
			return getComputedStyle(ele)[attr];
		}else{
			return ele.currentStyle[attr];
		}
	}

	return avalon;
});