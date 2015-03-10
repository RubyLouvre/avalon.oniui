define(["avalon"], function(avalon) {
	return function (uploaderVm) {
        uploaderVm.previews = [];
        this.push = function (key, preview, fileName) {
            if (!uploaderVm.multipleFileAllowed) {
                while(uploaderVm.previews.length > 0) {
                    avalon.Array.removeAt(uploaderVm.previews, 0);
                }
            }
            uploaderVm.previews.push({
                key: key,
                img: preview,
                name: fileName,
                localPath: "C:\\Users\\zilong.xu\\Desktop\\603327d9tw1eorubiabc5j21hc0xcqej.jpg",
                uploadedProgress: 0
            });
        };
        this.remove = function (key) {
            for (var i = 0; i < uploaderVm.previews.length; i++) {
                var f = uploaderVm.previews[i];
                if (f.key == key) {
                    avalon.Array.removeAt(uploaderVm.previews, i);
                    break;
                }
            }
        };
        this.setProgress = function (key, progress) {
            for (var i = 0; i < uploaderVm.previews.length; i++) {
                var f = uploaderVm.previews[i];
                if (f.key == key) {
                    f.uploadedProgress = progress;
                    break;
                }
            }
        }
        return this;
    };    
});