define(["browser/avalon.browser", "text!./avalon.uploader.html", "uploader/plupload.dev", "css!./avalon.uploader.css"], function(avalon, sourceHTML){

	var widget = avalon.ui.uploader = function(element, data, vmodels){

		var fileList = [],		// 存放file对象
			browseButtonClick,	// browseButton 绑定的 click 事件
			ie_version = avalon.browser.ie;

		var vmodel = avalon.define(data.uploaderId, function(vm){

			vm.files = [];

			avalon.mix(vm, data.uploaderOptions);

			vm.removeFile = function(index){
				vmodel.files.removeAt(index);
				fileList.splice(index, 1);
			};
			

			vm.$init = function(){

				// 创建 input 元素
				var input = avalon.parseHTML(sourceHTML).firstChild;
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
				var browseButton = document.getElementById(vmodel.browseButton);
				browseButtonClick = avalon.bind(browseButton, "click", function(){
					input.click();
				});


				// 插入 input 元素
				// ie9- 用其他异步事件来触发 input.click 无法取得文件本地路径
				// 必须还是要点到 input 上，所以插到按钮内部
				if(ie_version > 0 && ie_version < 10){
					browseButton.appendChild(input);
				}else{
					// 隐藏
					input.style.display = 'none';
					element.appendChild(input);
				}


				avalon.scan(element, [vmodel].concat(vmodels));

			};

			vm.$remove = function(){
				
			};
			
		});
		
		return vmodel;

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
					if(vmodel.files.length < vmodel.max){
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

	widget.version = 1.0;
	widget.defaults = {
		
	};

	return avalon;
});