/*
blob: {
  fileObj:
  loaded:       // 数据是否已经加载
  offset:       // 相对于文件的Offset
  size:         // blob的尺寸
  data:         // 装载的文件二进制字节
}
*/
define(["avalon"], function (avalon) {
	function blob(offset, size, fileObj, index) {
		this.offset = offset;
		this.size = size;
		this.index = index;
		this.data = undefined;
		this.fileObj = fileObj;
		return this;
	}

	blob.prototype.purgeData = function () {
		this.data = null;
	}

	return blob;
});