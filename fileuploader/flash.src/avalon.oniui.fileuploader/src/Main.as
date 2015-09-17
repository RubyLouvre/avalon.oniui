package
{
    import flash.display.Loader;
    import flash.display.Sprite;
    import flash.events.DataEvent;
    import flash.events.Event;
    import flash.events.MouseEvent;
	import flash.events.UncaughtErrorEvent;
    import flash.filters.BevelFilter;
	import flash.geom.Matrix;
    import flash.net.FileFilter;
    import flash.net.FileReference;
	import flash.net.FileReferenceList;
	import flash.net.URLLoader;
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
	import flash.net.URLRequestMethod;
	import flash.net.navigateToURL;
	import flash.net.*;
	import flash.events.ProgressEvent;
	import flash.events.IOErrorEvent;
	import flash.events.SecurityErrorEvent;
	import flash.events.HTTPStatusEvent;
	import flash.events.ErrorEvent;
	import flash.events.IEventDispatcher;
	
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
			ExternalInterface.addCallback("test", test);
			ExternalInterface.addCallback("uploadBlob", uploadBlob);
			
			ExternalInterface.addCallback("removeCacheFileByToken", removeCacheFileByToken);
		}
		
		public function test(fileToken:String, offset:Number, size:Number, config:Object):String {
			return fileToken + offset.toString() + size.toString();
		}
		
		private function blobReadCall(e:Event):void {
			var file:FileReference = e.currentTarget as FileReference;
			
		}
		
		public function uploadBlob(fileToken:String, offset:Number, size:Number, config:Object):void {
			var file:FileReference = _fileDics[fileToken];
			if (file == null) return;
			this.readFile(file, function (position:Number, length:Number, c:Object, f:FileReference):void {
				
				var successCallback:String = c.onSuccess;
				var errorCallback:String = c.onError;
				
				//jsLog([successCallback, errorCallback, progressCallback]);
				
				var dataBytes:ByteArray = new ByteArray();
				f.data.position = position;
				f.data.readBytes(dataBytes, 0, Math.min(length, f.data.length - position));
				
				var request:URLRequest = new URLRequest(c.url);
				request.method = URLRequestMethod.POST;
				
				var form:MsMultiPartFormData = new MsMultiPartFormData();
				for (var pname:String in c.paramConfig) {
					if (pname == "__dataField") {
						form.AddStreamFile(c.paramConfig[pname], f.name, dataBytes);
					} else {
						form.AddFormField(pname, c.paramConfig[pname]);
					}
				}
				f = null;
				form.PrepareFormData();
				var header:URLRequestHeader = new URLRequestHeader("Content-Type", "multipart/form-data; boundary="+form.Boundary);
				request.requestHeaders.push(header);
				request.data = form.GetFormData(); 
				var urlLoader:URLLoader = new URLLoader();
				var completeFn:Function = function(e:Event):void {
					urlLoader.removeEventListener(Event.COMPLETE, completeFn);
					urlLoader.removeEventListener(IOErrorEvent.IO_ERROR, errorFn);
					urlLoader.removeEventListener(SecurityErrorEvent.SECURITY_ERROR, errorFn);
					fireAsyncBridgeEvent(successCallback, [urlLoader.data as String], false);
				};
				var errorFn: Function = function(e:ErrorEvent):void {
					urlLoader.removeEventListener(Event.COMPLETE, completeFn);
					urlLoader.removeEventListener(IOErrorEvent.IO_ERROR, errorFn);
					urlLoader.removeEventListener(SecurityErrorEvent.SECURITY_ERROR, errorFn);
					fireAsyncBridgeEvent(successCallback, [urlLoader.data as String], false);
					fireAsyncBridgeEvent(errorCallback, [e.toString()], false);
				};
				urlLoader.addEventListener(Event.COMPLETE, completeFn);
				urlLoader.addEventListener(IOErrorEvent.IO_ERROR, errorFn);
				urlLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, errorFn);
				urlLoader.load(request);
			}, this, [offset, size, config, file]);
		}
		
		private function uploadBlobCompleted(e:Event):void {
		}
		
		public function removeCacheFileByToken(fileToken:String):void {
			var file:FileReference = _fileDics[fileToken];
			
			if (file!=null) {
				delete _fileDics[fileToken];
				delete _fileStatusDics[file];
			}
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
				ExternalInterface.call("avalon.vmodels." + _vmId + ".registInput", _vmId, ExternalInterface.objectID, false);
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
                file = files[i] as FileReference;/*
				file.addEventListener(Event.COMPLETE, blobReadCall, false, 0, true);
				file.load();
			
				continue;*/
				
				
				var fileContext:Object = ExternalInterface.call("avalon.vmodels." + _vmId + ".$fileInputProxy.getFileContext", { name: file.name, size: file.size } );
				if (!fileContext.canBeAdded) continue;
				_fileDics[fileContext.fileLocalToken] = file;
				_fileStatusDics[file] = {
					status: FILE_NOT_READ,
					listeners: []
				};
				
				var fileObj:Object = {
					name: file.name,
					fileLocalToken:  fileContext.fileLocalToken,
					size: file.size,
					preview: fileContext.defaultPreview,
					__flashfile: true,
					__html5file: false,
					modifyTime: file.modificationDate.getTime(),
					data: null
				};
				fileObj.modifyTime = fileObj.modifyTime - fileObj.modifyTime % 1000; // 去除毫秒数，因为h5读不到毫秒。
				fireAsyncBridgeEvent("newFileGenerated", [fileObj], false);
				
				if (fileContext.enablePreviewGen) {
					generatePreview(file, fileContext.previewWidth, fileContext.previewHeight, fileObj, function(preview:String, fObj:Object):void {
						if (preview == null) return;
						
						// 得到base64代码后，如果浏览器无法显示，需要找server要一个图片地址。$env传入了浏览器特性。
						var browserSupportBase64:Boolean = fileContext.$env.supportBase64Img as Boolean;
						var browserBase64LengthLmt:Number = fileContext.$env.base64Limitation as Number;
						
						if (browserSupportBase64 && preview.length <= browserBase64LengthLmt) {
							fireAsyncBridgeEvent("filePreviewUpdated", [fObj.fileLocalToken, preview], false);
						} else if (fileContext.previewUrl != null) {
							var request:URLRequest = new URLRequest(fileContext.previewUrl);
							request.method = URLRequestMethod.POST;

							var form:MsMultiPartFormData = new MsMultiPartFormData(); 
							form.AddFormField("img", preview);
							form.PrepareFormData();
							var header:URLRequestHeader = new URLRequestHeader("Content-Type", "multipart/form-data; boundary="+form.Boundary);
							request.requestHeaders.push(header);
							request.data = form.GetFormData(); 
							var urlLoader:URLLoader = new URLLoader();
							
							var completeFn:Function = function(e:Event):void {
								urlLoader.removeEventListener(Event.ACTIVATE, completeFn);
								urlLoader.removeEventListener(HTTPStatusEvent.HTTP_STATUS, statusChangeFn);
								urlLoader.removeEventListener(IOErrorEvent.IO_ERROR, errorFn);
								urlLoader.removeEventListener(SecurityErrorEvent.SECURITY_ERROR, errorFn);
								fireAsyncBridgeEvent("filePreviewUpdated", [fObj.fileLocalToken, urlLoader.data], false);
							};
							var errorFn: Function = function(e:ErrorEvent):void {
								urlLoader.removeEventListener(Event.ACTIVATE, completeFn);
								urlLoader.removeEventListener(HTTPStatusEvent.HTTP_STATUS, statusChangeFn);
								urlLoader.removeEventListener(IOErrorEvent.IO_ERROR, errorFn);
								urlLoader.removeEventListener(SecurityErrorEvent.SECURITY_ERROR, errorFn);
							//	fireAsyncBridgeEvent("filePreviewUpdated", [fObj], false);
							};
							var statusChangeFn:Function = function(e:HTTPStatusEvent):void {
								if (e.status == 200) return;
								else {
									urlLoader.removeEventListener(Event.ACTIVATE, completeFn);
									urlLoader.removeEventListener(HTTPStatusEvent.HTTP_STATUS, statusChangeFn);
									urlLoader.removeEventListener(IOErrorEvent.IO_ERROR, errorFn);
									urlLoader.removeEventListener(SecurityErrorEvent.SECURITY_ERROR, errorFn);
								//	fireAsyncBridgeEvent("filePreviewUpdated", [fObj], false);
								}
							};
							urlLoader.addEventListener(Event.COMPLETE, completeFn, false, 0, true);
							urlLoader.addEventListener(HTTPStatusEvent.HTTP_STATUS, statusChangeFn, false, 0, true);
							urlLoader.addEventListener(IOErrorEvent.IO_ERROR, errorFn, false, 0, true);
							urlLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, errorFn, false, 0, true);
							urlLoader.load(request);
						}
					});
				}
            }
        }
		
		private function fireAsyncBridgeEvent(fnName:String, args:Array, removeListeners:Boolean):void {
			ExternalInterface.call("avalon.vmodels." + _vmId + ".$flashEventHub.dispatchEventAsync", fnName, args, removeListeners);
		}
		
		private function readFile(file:FileReference, callback:Function, scope:Object, args:Array):void {
			if (file == null) return;
			var fileStatus:Number = _fileStatusDics[file].status;
			
			if (fileStatus == FILE_READ_END) {
				callback.apply(scope, args);
				_fileStatusDics[file].listeners = [];
			} else {
				_fileStatusDics[file].listeners.push({
					scope: scope,
					args: args,
					fn: callback
				});
				
				if (fileStatus == FILE_NOT_READ) {
					file.addEventListener(Event.COMPLETE, readFileDone, false, 0, true);
					_fileStatusDics[file].status = FILE_IN_READING;
					file.load();
				}
			}
		}
		
		private function readFileDone(e:Event):void {
			var file:FileReference = e.target as FileReference;
			_fileStatusDics[file].status = FILE_READ_END;
			var listeners:Array = _fileStatusDics[file].listeners as Array;
			_fileStatusDics[file].listeners = [];
			
			for (var i:Number = 0; i < listeners.length; i++) {
				var fn:Function = listeners[i].fn;
				var scope:Object = listeners[i].scope;
				var args:Array = listeners[i].args;
				fn.apply(scope, args);
			}
		}
		
		
		// 生成PNG格式的预览图。
		private function generatePreview(file:FileReference, previewWidth:Number, previewHeight:Number, fileObj:Object, callback:Function):void {
					//ExternalInterface.call("alert", -1);
			var fileloaded:Function = function (f:FileReference, pWidth:Number, pHeight:Number, fObj:Object, fn:Function):void {
				var imgLoader:Loader = new Loader();
				imgLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(event:Event):void {
					//ExternalInterface.call("alert", 0);
					var imageWidth:Number = event.currentTarget.loader.content.width;
					var imageHeight:Number = event.currentTarget.loader.content.height;
					var scale:Number = Math.min(pHeight / imageHeight, pWidth / imageWidth);
					var tx:Number = (pWidth - scale * imageWidth) / 2;
					var ty:Number = (pHeight - scale * imageHeight) / 2;
					event.currentTarget.loader.content.width = scale * imageWidth;
					event.currentTarget.loader.content.height = scale * imageHeight;
					
					var bitmapData:BitmapData = new BitmapData(pWidth, pHeight, false);
					
					bitmapData.draw(imgLoader, new Matrix(1, 0, 0, 1, tx, ty));
					
					var pngEncoder:PNGEncoder = new PNGEncoder();
					
					var c:Base64Encoder = new Base64Encoder();
					
					c.encodeBytes(pngEncoder.encode(bitmapData));
					var code:String =  "data:image/png;base64," + c.toString();
					fn(code, fObj);
					
					imgLoader.unload();
					c = null;
					bitmapData = null;
					imgLoader = null;
				}, false, 0, true);
				imgLoader.uncaughtErrorEvents.addEventListener(UncaughtErrorEvent.UNCAUGHT_ERROR, function(e:UncaughtErrorEvent):void {
					//ExternalInterface.call("alert", 1);
					fn(null, fObj);
				}, false, 0, true);
				imgLoader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(e:IOErrorEvent):void {
					//ExternalInterface.call("alert", 2);
					fn(null, fObj);
				}, false, 0, true);
				imgLoader.contentLoaderInfo.addEventListener(UncaughtErrorEvent.UNCAUGHT_ERROR, function(e:UncaughtErrorEvent):void {
					//ExternalInterface.call("alert", 3);
					fn(null, fObj);
				}, false, 0, true);
				//ExternalInterface.call("alert", 4);
				imgLoader.loadBytes(f.data);
				//ExternalInterface.call("alert", 5);
			}
			
			this.readFile(file, fileloaded, this, [file, previewWidth, previewHeight, fileObj, callback]);
		}
	}
}