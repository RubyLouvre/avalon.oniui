package
{
    import flash.display.Loader;
    import flash.display.Sprite;
    import flash.events.DataEvent;
    import flash.events.Event;
    import flash.events.MouseEvent;
    import flash.filters.BevelFilter;
	import flash.geom.Matrix;
    import flash.net.FileFilter;
    import flash.net.FileReference;
	import flash.net.FileReferenceList;
    import flash.net.URLRequest;
	import flash.text.TextFormat;
    import flash.utils.ByteArray;
	import flash.external.*;
	import flash.external.ExternalInterface;
	import mx.graphics.codec.PNGEncoder;
	import mx.utils.Base64Encoder;
	import flash.events.TimerEvent;
	import flash.utils.*;
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	
	/**
	 * ...
	 * @author xuzicn
	 */
		
    public class Main extends Sprite {
		
        private var _fileRef:FileReferenceList;
		
		private var _fileDics:Dictionary;
		private var _fileStatusDics:Dictionary;
		private var FILE_READ_END:Number = 2;
		private var FILE_IN_READING:Number = 1;
		private var FILE_NOT_READ:Number = 0;
		
		// 来自JS的外部参数
		private var _vmId:String;	// VM的ID
		private var _registed:Boolean = false;
		
		
		public function Main():void {
			var param:Object = this.root.loaderInfo.parameters;
			_vmId = param.vmid;
			
            if (stage) init();
            else addEventListener(Event.ADDED_TO_STAGE, init);
			_fileDics = new Dictionary();
			_fileStatusDics = new Dictionary();
			ExternalInterface.addCallback("readBlob", readBlob);
			
			ExternalInterface.addCallback("removeCacheFileByToken", removeCacheFileByToken);
		}
		
		public function removeCacheFileByToken(fileToken:String):void {
			var file:FileReference = _fileDics[fileToken];
			
			if (file!=null) {
				delete _fileDics[fileToken];
				delete _fileStatusDics[file];
			}
		}
		
		private function readBlob(fileToken:String, offset:Number, size:Number, blobKey:String):void {
			var file:FileReference = _fileDics[fileToken];
			this.readFile(file, function ():void { 
				var result:String = "";
				try {
					jsLog(["****Flash.readBlob. Start to read file chunk. Token: ", fileToken, ". offset: ", offset, ". size: ", size]);
					var dataBytes:ByteArray = new ByteArray();
					file.data.position = offset;
					file.data.readBytes(dataBytes, 0, size);
					
					var b:Base64Encoder = new Base64Encoder();
					b.encodeBytes(dataBytes);
					jsLog(["****Flash.readBlob End."]);
					result = b.toString().replace(/[\r\n]/g, "");
				} catch (e:Error) {
					jsLog(["****Flash.readBlob Error. Message: ", e.message]);
				} finally {
					ExternalInterface.call("avalon.vmodels." + _vmId + ".$runtime.readBlobEnd", blobKey, result);
				}
			}, this, []);
		}
		private function jsLog(args):void {
			var logs:Array = null;
			if (args is String) {
				logs = [args];
			} else {
				logs = args;
			}
			ExternalInterface.call("avalon.vmodels." + _vmId + ".$runtime.printFlashLog", logs);
		}
		private function init(e:Event = null):void {
			stage.scaleMode = "exactFit";
			this.graphics.beginFill(0xFFCC00, 0);
			this.graphics.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
			removeEventListener(Event.ADDED_TO_STAGE, init);
            // entry point
			stage.addEventListener(MouseEvent.CLICK, clickHandler);
			
			_fileDics = new Dictionary();
        }
        
		// 生成文件的过滤器
        private function getFilterTypes():Array {
			var jsFilters:Array = ExternalInterface.call("avalon.vmodels." + _vmId + ".getInputAcceptTypes", true);
			var types:Array = new Array(); 
			for (var i:int = 0; i < jsFilters.length; i++) {
				types.push(new FileFilter(jsFilters[i].description as String, jsFilters[i].types as String));
			}
			
            return types;
        }
        
		// 按钮的Click事件
        private function clickHandler(evt:MouseEvent):void {
			// 第一次点击按钮时，向VM注册Flash。不能在初始化时注册，因为VM极有可能还未加载结束。
			if (!_registed) {
				ExternalInterface.call("avalon.vmodels." + _vmId + ".$runtime.registFlash", ExternalInterface.objectID);
				_registed = true;
			}
			
            _fileRef = null;
            
            _fileRef = new FileReferenceList();
            _fileRef.addEventListener(Event.SELECT, selectHandler, false, 0, true);
            
            _fileRef.browse(getFilterTypes());
        }
		
		// 文件选择结束后的处理事件
        private function selectHandler(evt:Event):void {
			var files:Array = (evt.currentTarget as FileReferenceList).fileList;
			var count:Number = files.length;
			var file:FileReference;
			
			for(var i:int=0;i<count;i++) {
                file = files[i] as FileReference;
				var fileContext:Object = ExternalInterface.call("avalon.vmodels." + _vmId + ".$runtime.getFileContext", { name: file.name, size: file.size } );
				if (!fileContext.canBeAdded) continue;
				
				_fileDics[fileContext.fileLocalToken] = file;
				_fileStatusDics[file] = FILE_NOT_READ;
				
				var fileObj:Object = {
					name: file.name,
					data: null,
					fileLocalToken:  fileContext.fileLocalToken,
					fileKey: undefined,	// 分块上传时的关键词，server使用此属性来辨识分块的文件归属
					size: file.size,
					status: null,
					preview: fileContext.defaultPreview,
					__flashfile: true,
					__html5file: false,
					chunkAmount: 0,
					modifyTime: file.modificationDate.getTime(),
					blobsProgress: []
				};
				fileObj.modifyTime = fileObj.modifyTime - fileObj.modifyTime % 1000; // 去除毫秒数，因为h5读不到毫秒。
				
				if (fileContext.enablePreviewGen) {
					generatePreview(file, fileContext.previewWidth, fileContext.previewHeight, function(preview:String):void {
						if (preview != null) {
							fileObj.preview = preview;
						}
						ExternalInterface.call("avalon.vmodels." + _vmId + ".$runtime.addFile", fileObj);
					});
				} else {
					ExternalInterface.call("avalon.vmodels." + _vmId + ".$runtime.addFile", fileObj);
				}
            }
        }
		
		private function readFile(file:FileReference, callback:Function, scope:Object, args:Array):void {
			if (file == null) return;
			var fileStatus:Number = _fileStatusDics[file];
			
			if (fileStatus == FILE_READ_END) {
				callback.apply(scope, args);
			} else {
				var fn:Function = function ():void {
					_fileStatusDics[file] = FILE_READ_END;
					file.removeEventListener(Event.COMPLETE, fn);
					callback.apply(scope, args);
				};
				file.addEventListener(Event.COMPLETE, fn);
				if (fileStatus == FILE_NOT_READ) {
					file.load();
					_fileStatusDics[file] = FILE_IN_READING;
				}
			}
		}
		
		
		// 生成PNG格式的预览图。
		private function generatePreview(file:FileReference, previewWidth:Number, previewHeight:Number, callback:Function):void {
			var fileloaded:Function = function ():void {
				var imgLoader:Loader = new Loader();
				imgLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(event:Event):void {
					var imageWidth:Number = event.currentTarget.loader.content.width;
					var imageHeight:Number = event.currentTarget.loader.content.height;
					var scale:Number = Math.min(previewHeight / imageHeight, previewWidth / imageWidth);
					var tx:Number = (previewWidth - scale * imageWidth) / 2;
					var ty:Number = (previewHeight - scale * imageHeight) / 2;
					event.currentTarget.loader.content.width = scale * imageWidth;
					event.currentTarget.loader.content.height = scale * imageHeight;
					
					var bitmapData:BitmapData = new BitmapData(previewWidth, previewHeight, false);
					
					bitmapData.draw(imgLoader, new Matrix(1, 0, 0, 1, tx, ty));
					
					var pngEncoder:PNGEncoder = new PNGEncoder();
					
					var c:Base64Encoder = new Base64Encoder();
					
					c.encodeBytes(pngEncoder.encode(bitmapData));
					var code:String =  "data:image/png;base64," + c.toString();
					callback(code);
					
					imgLoader.unload();
					c = null;
					bitmapData = null;
					imgLoader = null;
				});
				imgLoader.loadBytes(file.data);
			}
			
			this.readFile(file, fileloaded, this, []);
		}
	}
}