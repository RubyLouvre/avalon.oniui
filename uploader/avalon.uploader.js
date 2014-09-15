define(["avalon", "text!./avalon.uploader.html", "uploader/plupload.dev", "css!./avalon.uploader.css"], function(avalon, sourceHTML){

	var widget = avalon.ui.uploader = function(element, data, vmodels){
		var vmodel = avalon.define(data.uploaderId, function(vm){

			vm.$init = function(){
				element.outerHTML = sourceHTML;
				console.log(element);

				var uploader = new plupload.Uploader({
					runtimes : 'html5,flash,silverlight,html4',
					browse_button : 'pickfiles', // you can pass in id...
					container: document.getElementById('container'), // ... or DOM Element itself
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
							document.getElementById('filelist').innerHTML = '';

							document.getElementById('uploadfiles').onclick = function() {
								uploader.start();
								return false;
							};
						},

						FilesAdded: function(up, files) {
							plupload.each(files, function(file) {

								document.getElementById('filelist').innerHTML += '<div id="' + file.id + '">' + file.name + ' (' + plupload.formatSize(file.size) + ') <b></b></div>';

								// window.file = file;
								// console.log(file.getSource());

								var img = new mOxie.Image();

								img.onload = function() {
									this.embed(document.getElementById('preview'), {
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
							document.getElementById('console').innerHTML += "\nError #" + err.code + ": " + err.message;
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