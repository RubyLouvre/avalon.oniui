define(["avalon", "text!./avalon.uploader.html", "uploader/plupload.dev", "css!./avalon.uploader.css"], function(avalon, sourceHTML){

	var widget = avalon.ui.uploader = function(element, data, vmodels){
		var vmodel = avalon.define(data.uploaderId, function(vm){

			vm.$init = function(){

				// 取 dom
				var dom_arr = sourceHTML.split("MS_OPTION_COM").map(function(item){
						return avalon.parseHTML(item).firstChild;
					}),
					ul = dom_arr[0],
					ul_fileList = dom_arr[1],
					ul_container = dom_arr[2],
					ul_pick = dom_arr[3],
					ul_upload = dom_arr[4],
					ul_console = dom_arr[5],
					ul_preview = dom_arr[6];

				// 组装
				ul.appendChild(ul_fileList);
				ul_container.appendChild(ul_pick);
				ul_container.appendChild(ul_upload);
				ul.appendChild(ul_container);
				ul.appendChild(ul_console);
				ul.appendChild(ul_preview);

				element.parentNode.replaceChild(ul, element);

				// console.log(element);

				var uploader = new plupload.Uploader({
					runtimes : 'html5,flash,silverlight,html4',
					browse_button : ul_pick, // you can pass in id...
					container: ul_container, // ... or DOM Element itself
					url : 'upload.php',
					flash_swf_url : 'Moxie.swf',
					silverlight_xap_url : 'Moxie.xap',
					
					filters : {
						max_file_size : '10mb',
						mime_types: [
							{title : "Image files", extensions : "jpg,gif,png"},
							{title : "Zip files", extensions : "zip"}
						]
					},

					init: {
						PostInit: function() {
							ul_fileList.innerHTML = '';

							ul_upload.onclick = function() {
								uploader.start();
								return false;
							};
						},

						FilesAdded: function(up, files) {
							plupload.each(files, function(file) {

								ul_fileList.innerHTML += '<div id="' + file.id + '">' + file.name + ' (' + plupload.formatSize(file.size) + ') <b></b></div>';

								// window.file = file;
								// console.log(file.getSource());

								var img = new mOxie.Image();

								img.onload = function() {
									this.embed(ul_preview, {
										width: 100,
										height: 100,
										crop: true
									});
								};

								img.onembedded = function() {
									this.destroy();
								};

								img.onerror = function() {
									this.destroy();
								};

								img.load(file.getSource());        

							});
						},

						UploadProgress: function(up, file) {
							document.getElementById(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
						},

						Error: function(up, err) {
							ul_console.innerHTML += "\nError #" + err.code + ": " + err.message;
						}
					}
				});

				uploader.init();
			};
			vm.$remove = function(){
				
			};
			
		});
		
		return vmodel;
	};

	widget.version = 1.0;
	widget.defaults = {
		
	};

	return avalon;
});