package {
	import fl.controls.Button;
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
	
    public class Main extends Sprite {
		
        private var _btn:Button;
		private var _fileRefList:FileReferenceList;
		private var _fileRef:FileReference;
		
		private var _fileDics:Dictionary;
		
		// 来自JS的外部参数
		private var _vmId:String;	// VM的ID
		private var _acceptFileTypes:String;
		private var _buttonStyle:Object;
		private var _generatePreview:Boolean = false;
		private var _displayPreview:Boolean = false;
		private var _previewWidth:Number = 0;
		private var _previewHeight:Number = 0;
		private var _previewGeneratedJSCallbackName:String;
		private var _multipleFileAllowed:Boolean = true;
		
		
		public function Main():void{	
            if (stage) init();
            else addEventListener(Event.ADDED_TO_STAGE, init);
			_fileDics = new Dictionary();
			ExternalInterface.addCallback("loaded", loaded);
			ExternalInterface.addCallback("setContext", setContext);
		}
		
		// JS调用此函数，表示Flash已加载完毕
		public function loaded():Boolean {
			return true;
		}
		
		// JS发送VM的上下文和CSS信息等
		public function setContext(context:Object):void {
			_vmId = context.vmId as String;
			_acceptFileTypes = context.acceptFileTypes as String;
			_buttonStyle = context.buttonStyle as Object;
			_multipleFileAllowed = context.multipleFileAllowed as Boolean;
			
			if (context.preview != null) {
				_generatePreview = context.preview.generatePreview;
				_displayPreview = context.preview.displayPreview;
				_previewHeight = context.preview.height;
				_previewWidth = context.preview.width;
				_previewGeneratedJSCallbackName = context.preview.callbackName;
			}
			//_btn.setStyle("backgroundColor", 0);
			if (_buttonStyle != null) {
				_btn.label = _buttonStyle.label.toString();
			} else {
				_btn.label = "UPLOAD";
			}
		}
		
		private function init(e:Event = null):void {
            removeEventListener(Event.ADDED_TO_STAGE, init);
            // entry point
            inited();
			_fileDics = new Dictionary();
        }
        
        private function inited():void {
            _btn = new Button();
            _btn.x = 0;
            _btn.y = 0;
			_btn.width = stage.stageWidth;
			_btn.height = stage.stageHeight;
			
			
            addChild(_btn);
            
			stage.addEventListener(MouseEvent.CLICK, clickHandler);
            _btn.addEventListener(MouseEvent.CLICK, clickHandler);
			var textFormat:TextFormat = new TextFormat();
			textFormat.size = _btn.width*100;
            _btn.setStyle("textFormat", textFormat);
        }
        
		// 生成文件的过滤器
        private function getFilterTypes():Array {
			var types:Array = _acceptFileTypes.split(",");
			for (var i:int = 0; i < types.length; i++) {
				var fileType:String = types[i] as String;
				var filePrefix:String = fileType.replace("*.", "").toUpperCase();
				types[i] = new FileFilter(filePrefix + "文件 (" + fileType + ")", fileType);
			}
			
            return [new FileFilter("Images", "*.jpg;*.gif;*.png")].concat(types);
        }
        
		// 按钮的Click事件
        private function clickHandler(evt:MouseEvent):void {
			if (_multipleFileAllowed) {
				_fileRefList = new FileReferenceList();
				_fileRefList.addEventListener(Event.SELECT, selectHandler, false, 0, true);
				_fileRefList.browse(getFilterTypes());
			} else {
				_fileRef = new FileReference();
				_fileRef.addEventListener(Event.SELECT, selectHandler, false, 0, true);
				_fileRef.browse(getFilterTypes());
			}
        }
        
		// 生成文件的Key。以后可以用MD5
		private function getFileKey(file:FileReference):String {
			return file.name+file.type+file.size;
		}
		
		// 文件选择结束后的处理事件
        private function selectHandler(evt:Event):void {
			var files:Array;
			if (evt.currentTarget is FileReferenceList) {
				files = (evt.currentTarget as FileReferenceList).fileList;
			} else {
				files = new Array(evt.currentTarget as FileReference);
			}
			var count:Number = files.length;
			var file:FileReference;
			
			for(var i:int=0;i<count;i++) {
                file = files[i] as FileReference;
				var fileKey:String = getFileKey(file);
				if (_fileDics[fileKey] == null) {
					if (!_multipleFileAllowed) _fileDics = new Dictionary();
					_fileDics[fileKey] = file;
					if (_generatePreview) {
						generatePreview(fileKey);
					}
				}
            }
        }
		
		// 生成预览图。如果配置了Callback的话，发送Base64代码给JS
		private function generatePreview(key:String):void {
			var file:FileReference = _fileDics[key] as FileReference;
			if (file != null) {
				file.addEventListener(Event.COMPLETE, function():void {
					var imgLoader:Loader = new Loader();
					imgLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(event:Event):void {
						var imageWidth:Number = event.currentTarget.loader.content.width;
						var imageHeight:Number = event.currentTarget.loader.content.height;
						var scale:Number = Math.min(_previewHeight / imageHeight, _previewWidth / imageWidth);
						var tx:Number = (_previewWidth - scale * imageWidth) / 2;
						var ty:Number = (_previewHeight - scale * imageHeight) / 2;
						event.currentTarget.loader.content.width = scale * imageWidth;
						event.currentTarget.loader.content.height = scale * imageHeight;
						
						var bitmapData:BitmapData = new BitmapData(_previewWidth, _previewHeight, true, 0);
						
						bitmapData.draw(imgLoader, new Matrix(1, 0, 0, 1, tx, ty));
						
						var pngEncoder:PNGEncoder = new PNGEncoder();
						
						var c:Base64Encoder = new Base64Encoder();
						
						c.encodeBytes(pngEncoder.encode(bitmapData));
						
						if (_previewGeneratedJSCallbackName!=null) {
							ExternalInterface.call("avalon.vmodels."+_vmId+"." + _previewGeneratedJSCallbackName, key, "data:image/png;base64," + c.toString());
						}
						c = null;
						bitmapData = null;
						imgLoader = null;
					});
					imgLoader.loadBytes(file.data);
				});
				file.load();
			}
		}
	}
}
