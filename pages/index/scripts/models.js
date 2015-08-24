/**
 * 页面数据
 */

define("models", function(){
    return {
        widgets: {
            "UI组件": {
                "accordion": "手风琴",
                "at": "@组件",
                "browser": "浏览器检测模块",
                "button": "按钮",
                "camera": "百叶窗图片轮播",
                "carousel": "轮播/跑马灯",
                "checkboxlist": "复选框列表",
                "colorpicker": "颜色选择器/取色器",
                "coupledatepicker": "日期范围选择的双日历",
                "datepicker": "日期选择器",
                "daterangepicker": "日期范围选择日历",
                "dialog": "对话框弹窗",
                "doublelist": "平衡木/左右列表/双列表",
                "dropdown": "下拉框",
                "dropdownlist": "下拉列表",
                "flipswitch": "滑动式开关",
                "fileuploader": "文件上传",
                "kindeditor": "富文本编辑器",
                "layout": "布局",
                "loading": "加载动画效果",
                "live": "事件代理绑定",
                "mask": "遮罩层",
                "menu": "菜单",
                "miniswitch": "下拉式开关",
                "notice": "提示/提示信息",
                "pager": "分页",
                "preview": "图片预览/图片批量预览",
                "progressbar": "进度条/倒计时",
                "rating": "评分",
                "scrollbar": "滚动条",
                "scrollspy": "滚动监听",
                "smartgrid": "静态模板表格",
                "simplegrid": "表格/大数据展示",
                "slider": "滑块",
                "spinner": "数字输入框",
                "switchdropdown": "切换下拉框",
                "tab": "选项卡/标签页",
                "textbox": "提示功能的输入框",
                "timer": "时间选择器",
                "tree": "树",
                "tooltip": "气泡提示"
            },
            "功能组件": {
                "cookie": "cookie工具集",
                "draggable": "拖拽/可拖动",
                "lazyload": "懒加载",
                "mmPromise": "异步列队",
                "mmRouter": "路由",
                "position": "定位",
                "resizable": "伸缩",
                "store": "本地储存",
                "validation": "验证"
            }
        },
        examples: {
            "accordion": {
                "简单例子": "avalon.accordion.ex1.html",
                "使用setData或者refresh(data)重新渲染accordion": "avalon.accordion.ex2.html",
                "accordion提供的各种API": "avalon.accordion.ex3.html",
                "嵌套的accordion": "avalon.accordion.ex4.html",
                "文字内容水平展开的accordion": "avalon.accordion.ex5.html"
            },
            "mmAnimate": {
                "": "avalon.animation.ex.html",
                "算子 &amp;&amp; fps 修改 with &amp;&amp; backgroundColor": "avalon.animation.ex1.html",
                "算子 &amp;&amp; fps slideToggle, slideUp, slideDown": "avalon.animation.ex2.html",
                "算子 &amp;&amp; fps fadeToggle, fadeIn, fadeOut": "avalon.animation.ex3.html",
                "算子 &amp;&amp; fps toggle, show, hide": "avalon.animation.ex4.html"
            },
            "at": {
                "例子1": "avalon.at.ex1.html"
            },
            "browser": {
                "例子": "avalon.browser.ex.html"
            },
            "camera": {
                "图片百叶窗切换组件": "avalon.camera.ex.html",
                "图片百叶窗切换组件-自定义宽高": "avalon.camera.ex1.html",
                "图片百叶窗切换组件-自定义切换间隔和切换速度": "avalon.camera.ex2.html",
                "图片百叶窗切换组件-自定义区块数量": "avalon.camera.ex3.html"
            },
            "button": {
                "设置button的大小、宽度，展示不同类型的button": "avalon.button.ex1.html",
                "设置button的width和color": "avalon.button.ex2.html",
                "通过ms-widget=\"button, $, buttonConfig\"的方式设置button组": "avalon.button.ex3.html",
                "通过ms-widget=\"buttonset\"的方式设置button": "avalon.button.ex4.html"
            },
            "carousel": {
                "图片轮播组件-默认配置": "avalon.carousel.ex.html",
                "图片轮播组件-自定义宽高": "avalon.carousel.ex1.html",
                "图片轮播组件-自定义图片切换时间间隔 / 图片切换速度": "avalon.carousel.ex2.html",
                "图片轮播组件-配置小部件": "avalon.carousel.ex3.html",
                "图片轮播组件-自定义切换动画效果": "avalon.carousel.ex4.html",
                "图片轮播组件-自定义动画缓动类型": "avalon.carousel.ex5.html",
                "图片轮播组件-自适应容器尺寸": "avalon.carousel.ex6.html",
                "图片轮播组件-自定义图片标题和描述": "avalon.carousel.ex7.html",
                "图片轮播组件-自定义懒加载loading图": "avalon.carousel.ex8.html"
            },
            "colorpicker": {
                "例子": "avalon.colorpicker.ex.html"
            },
            "checkboxlist": {
                "checkboxlist功能全览": "avalon.checkboxlist.ex.html",
                "默认配置的checkboxlist组件": "avalon.checkboxlist.ex1.html",
                "配置checkboxlist-duplex初始化初始选中的选项，而且可以通过duplex值的改变修正选中项状态": "avalon.checkboxlist.ex2.html",
                "checkboxlist组件默认提供了type为week时的data": "avalon.checkboxlist.ex3.html",
                "配置checkboxlist-fetch获取用户定义的所有选项值": "avalon.checkboxlist.ex4.html",
                "配置onselect回调": "avalon.checkboxlist.ex5.html",
                "配置data选项来渲染checkbox": "avalon.checkboxlist.ex6.html"
            },
            "cookie": {
                "例子1": "avalon.cookie.ex1.html"
            },
            "coupledatepicker": {
                "不同构建方式的coupledatepicker，注意按demo说明方式设置": "avalon.coupledatepicker.ex1.html",
                "配置双日历框的日历说明文字、设置日历显示每周的第一天从周日开始": "avalon.coupledatepicker.ex2.html",
                "初始化双日历框的起始日期和结束日期、不同方式切换禁用日历": "avalon.coupledatepicker.ex3.html",
                "初始日期和截止日期之间的最小相隔天数和最大相隔天数": "avalon.coupledatepicker.ex4.html",
                "配置双日历框的解析和显示规则": "avalon.coupledatepicker.ex5.html"
            },
            "datepicker": {
                "默认配置的日历框、allowBlank为true时的不同": "avalon.datepicker.ex1.html",
                "配置日历周一-周日的对应的显示名、使日历的每一周从周日开始、通过下拉选框切换选择日历显示年份、月份": "avalon.datepicker.ex2.html",
                "显示非当前月日期、通过prev、next每次切换3个月、一次显示多个月份": "avalon.datepicker.ex3.html",
                "设置日期可选的最小日期、最大日期、以及初始值异常的显示情况": "avalon.datepicker.ex4.html",
                "设置toggle切换日历显示与隐藏、calendarLabel配置日历顶部说明文字": "avalon.datepicker.ex5.html",
                "ms-duplex初始化日期、allowBlank为false or true时组件对不同初始值的处理方式": "avalon.datepicker.ex6.html",
                "组件选择日期后的change回调、关闭时的onClose回调、切换月份、年份的onChangeMonthYear回调": "avalon.datepicker.ex7.html",
                "自定义parseDate、formatDate方法正确解析和显示日期": "avalon.datepicker.ex8.html",
                "切换日历组件的禁用与否，以及手动输入日期的结果": "avalon.datepicker.ex9.html",
                "移动端日期、年份选择": "avalon.datepicker.ex10.html",
                "具有时间选择功能的datepicker": "avalon.datepicker.ex11.html",
                "带格式化输出配置的datepicker": "avalon.datepicker.ex12.html",
                "多语言支持": "avalon.datepicker.ex13.html",
                "datepicker的验证": "avalon.datepicker.ex14.html",
                "datepicker显示位置的设置": "avalon.datepicker.ex15.html",
                "datepicker宽度、格式自定义": "avalon.datepicker.ex16.html",
                "onBeforRender异步获取数据格式化日历": "avalon.datepicker.ex17.html"
            },
            "daterangepicker": {
                "基本配置的日期范围框，设置其初始说明文字、起始日历说明文字、结束日历说明文字": "avalon.daterangepicker.ex1.html",
                "配置日期范围框每一周第一天从周日开始、选择框下方说明文字显示内容": "avalon.daterangepicker.ex2.html",
                "初始化起始日期结束日期、各种方式切换禁用日历组件": "avalon.daterangepicker.ex3.html",
                "初始日期和截止日期之间的最小相隔天数和最大相隔天数、最小日期可选日期、最大可选日期": "avalon.daterangepicker.ex4.html",
                "自定义日期范围框解析和显示规则": "avalon.daterangepicker.ex5.html",
                "日期的onSelect回调、初始值为null的处理、setDates修正日期、setLabel修正提示文字": "avalon.daterangepicker.ex6.html"
            },
            "doublelist": {
                "doublelist-隐藏已选中条目，限制选中条数": "avalon.doublelist.ex.html",
                "doublelist-显示已选中条目，不限制选中条数": "avalon.doublelist.ex1.html"
            },
            "dialog": {
                "dialog功能全览": "avalon.dialog.ex.html",
                "默认配置的dialog组件": "avalon.dialog.ex1.html",
                "拥有回调操作的dialog": "avalon.dialog.ex2.html",
                "不显示关闭按钮的dialog": "avalon.dialog.ex3.html",
                "嵌套dialog": "avalon.dialog.ex4.html",
                "模拟alert": "avalon.dialog.ex5.html",
                "模拟alert，showClose配置无效": "avalon.dialog.ex6.html",
                "自定义dialog的width": "avalon.dialog.ex7.html",
                "通过container配置项设置dialog元素的上下文父元素": "avalon.dialog.ex8.html",
                "修改dialog的title、content、或者重新渲染dialog": "avalon.dialog.ex9.html",
                "通过加载avalon.draggable实现拖拽": "avalon.dialog.ex10.html",
                "改变dialog的z-index": "avalon.dialog.ex11.html"
            },
            "draggable": {
                "简单例子": "avalon.draggable.ex1.html",
                "方向的限制": "avalon.draggable.ex2.html",
                "区域拖动": "avalon.draggable.ex3.html",
                "影子拖动": "avalon.draggable.ex4.html",
                "手柄拖动": "avalon.draggable.ex5.html",
                "各种回调": "avalon.draggable.ex6.html"
            },
            "dropdownlist": {
                "使用html配置dropdownlist组件": "avalon.dropdownlist.ex1.html",
                "使用data配置dropdownlist组件": "avalon.dropdownlist.ex2.html",
                "使用data分组配置dropdownlist组件": "avalon.dropdownlist.ex3.html",
                "通过搜索条件实时获取选项列表": "avalon.dropdownlist.ex4.html",
                "禁用dropdownlist": "avalon.dropdownlist.ex5.html",
                "获取选项值": "avalon.dropdownlist.ex6.html"
            },
            "hotkeys": {
                "简单例子": "avalon.hotkeys.ex1.html"
            },
            "flipswitch": {
                "不同大小size，默认设置，选中状态": "avalon.flipswitch.ex.html",
                "不同大小size，支持可拖动切换，选中状态": "avalon.flipswitch.ex1.html",
                "不同大小size，OFF-ON顺序排列，选中状态": "avalon.flipswitch.ex2.html",
                "不同大小size，disabled状态，选中状态": "avalon.flipswitch.ex3.html",
                "不同大小size，自定义ON-OFF文本，选中状态": "avalon.flipswitch.ex4.html",
                "不同大小size，通过接口修改状态，选中状态": "avalon.flipswitch.ex5.html",
                "flipswitch + tooltip": "avalon.flipswitch.ex6.html"
            },
            "dropdown": {
                "使用html配置multiple组件": "avalon.dropdown.ex1.html",
                "使用html配置multiple并使用双工绑定": "avalon.dropdown.ex2.html",
                "使用option配置multiple并使用双工绑定": "avalon.dropdown.ex3.html",
                "使用html配置dropdown组件": "avalon.dropdown.ex4.html",
                "使用html配置dropdown并使用双工绑定": "avalon.dropdown.ex5.html",
                "使用option配置dropdown并使用双工绑定": "avalon.dropdown.ex6.html",
                "dropdown disabled": "avalon.dropdown.ex7.html",
                "dropdown readOnly": "avalon.dropdown.ex8.html",
                "options可以使用repeat生成": "avalon.dropdown.ex9.html",
                "更改模板，使用button作为触发器": "avalon.dropdown.ex10.html",
                "异步渲染组件的选项": "avalon.dropdown.ex11.html",
                "联动的dropdown": "avalon.dropdown.ex12.html",
                "dropdown状态保持功能": "avalon.dropdown.ex13.html",
                "多个dropdown共享状态": "avalon.dropdown.ex14.html",
                "鼠标移入移出下拉菜单自动显示隐藏": "avalon.dropdown.ex15.html"
            },
            "fileuploader": {
                "uploader基础配置项": "avalon.fileuploader.ex1.html",
                "预览图和进度条配置": "avalon.fileuploader.ex2.html",
                "大文件和分块配置": "avalon.fileuploader.ex3.html",
                "文件Ajax请求参数的配置": "avalon.fileuploader.ex5.html"
            },
            "kindeditor": {
                "默认配置": "avalon.kindeditor.ex1.html",
                "简单模式": "avalon.kindeditor.ex2.html",
                "异步加载": "avalon.kindeditor.ex3.html",
                "多语言设置": "avalon.kindeditor.ex4.html",
                "只读模式": "avalon.kindeditor.ex5.html",
                "统计字数": "avalon.kindeditor.ex6.html",
                "异步修改数据": "avalon.kindeditor.ex7.html"
            },
            "layout": {
                "最基础的Layout配置": "avalon.layout.ex1.html",
                "移除和增加区域": "avalon.layout.ex2.html",
                "嵌套的Layout": "avalon.layout.ex3.html",
                "百分比尺寸的Layout，改变Layout尺寸": "avalon.layout.ex4.html"
            },
            "lazyload": {
                "懒加载组件-默认配置": "avalon.lazyload.ex.html",
                "懒加载组件-自定义effect(加载效果)和各自delay(加载延迟)": "avalon.lazyload.ex1.html",
                "懒加载组件-自定义加载中图片": "avalon.lazyload.ex2.html",
                "懒加载组件-预加载采用文字模式": "avalon.lazyload.ex3.html",
                "懒加载组件-懒加载页面元素": "avalon.lazyload.ex4.html",
                "懒加载组件-自定义懒加载尺寸": "avalon.lazyload.ex5.html"
            },
            "JSON": {},
            "live": {
                "例子": "avalon.live.ex1.html"
            },
            "loading": {
                "loading:ball": "avalon.loading.ex.html",
                "loading:spin": "avalon.loading.ex1.html",
                "loading:ticks": "avalon.loading.ex2.html",
                "loading:spokes": "avalon.loading.ex3.html",
                "loading:spinning-bubbles": "avalon.loading.ex4.html",
                "loading:bubbles-这个只有在高级非IE浏览器上才能work good": "avalon.loading.ex5.html",
                "loading:spinning-spin": "avalon.loading.ex6.html",
                "loading:img": "avalon.loading.ex7.html"
            },
            "menu": {
                "menu": "avalon.menu.ex.html",
                "": "avalon.menu.ex2.html"
            },
            "switchdropdown": {
                "用空select节点使用默认配置生成组件": "avalon.switchdropdown.ex1.html",
                "用html结构配置组件": "avalon.switchdropdown.ex2.html",
                "用options配置组件": "avalon.switchdropdown.ex3.html",
                "用options配置组件并设置duplex": "avalon.switchdropdown.ex4.html"
            },
            "mask": {
                "例子1": "avalon.mask.ex1.html",
                "例子2": "avalon.mask.ex2.html",
                "例子3": "avalon.mask.ex3.html"
            },
            "mmPromise": {
                "例子0": "avalon.mmPromise.ex.html",
                "例子1": "avalon.mmPromise.ex1.html",
                "例子2": "avalon.mmPromise.ex2.html",
                "例子3": "avalon.mmPromise.ex3.html",
                "例子4": "avalon.mmPromise.ex4.html",
                "例子5": "avalon.mmPromise.ex5.html",
                "例子6": "avalon.mmPromise.ex6.html",
                "例子7": "avalon.mmPromise.ex7.html",
                "例子8": "avalon.mmPromise.ex8.html",
                "例子9": "avalon.mmPromise.ex9.html",
                "例子10": "avalon.mmPromise.ex10.html"
            },
            "mmRequest": {
                "mmRequest-getJSON": "avalon.mmRequest.ex.html",
                "mmRequest-getScript": "avalon.mmRequest.ex1.html",
                "mmRequest-post": "avalon.mmRequest.ex2.html",
                "mmRequest-get": "avalon.mmRequest.ex3.html"
            },
            "miniswitch": {
                "mmRequest-getScript": "avalon.miniswitch.ex1.html",
                "mmRequest-post": "avalon.miniswitch.ex2.html",
                "mmRequest-get": "avalon.miniswitch.ex3.html",
                "mmRequest-getJSON": "avalon.miniswitch.ex4.html"
            },
            "pager": {
                "显示跳转台": "avalon.pager.ex1.html ",
                "指定回调onJump": "avalon.pager.ex2.html ",
                "改变每页显示的数量": "avalon.pager.ex3.html ",
                "指定上一页,下一页的文本": "avalon.pager.ex4.html ",
                "通过左右方向键或滚轮改变页码": "avalon.pager.ex5.html ",
                "总是显示上一页与下一页按钮": "avalon.pager.ex6.html ",
                "多语言支持": "avalon.pager.ex7.html "
            },
            "notice": {
                "notice组件概览，具体使用demo及说明请看avalon.notice.ex1...6": "avalon.notice.ex.html",
                "使用默认配置的notice组件，可以动态改变其content、header、type": "avalon.notice.ex1.html",
                "自定义notice的container，设置isPlace可以决定notice是占位还是不占位": "avalon.notice.ex2.html",
                "当配置notice占位且可吸顶时，notice会在页面滚动到它所在位置时吸顶显示": "avalon.notice.ex3.html",
                "自定义notice的回调": "avalon.notice.ex4.html",
                "设置timer使得notice在显示一段时间之后隐藏": "avalon.notice.ex5.html",
                "自定义notice type的样式类": "avalon.notice.ex6.html"
            },
            "position": {
                "position+spinner+dropdown+draggable": "avalon.position.ex.html"
            },
            "preview": {
                "示例1": "avalon.preview.ex1.html",
                "示例2": "avalon.preview.ex2.html"
            },
            "mmRouter": {
                "mmRouter综合实例一: avalon.get": "avalon.mmRouter.ex.html",
                "mmRouter综合示例二: avalon.router + avalon.state": "avalon.mmRouter.ex1.html",
                "mmRouter综合示例三: scrolltoview": "avalon.mmRouter.ex2.html",
                "mmRouter试验田: 最新版mmRouter试验田": "avalon.mmRouter.ex3.html",
                "mmRouter: avalon.state": "avalon.mmRouter.ex4.html",
                "mmRouter综合示例五: html5Mode[pushState,popState]，可能需要服务器支持": "avalon.mmRouter.ex5.html",
                "mmRouter：登录跳转": "avalon.mmRouter.ex6.html",
                "mmRouter：异步": "avalon.mmRouter.ex7.html",
                "todos": "avalon.mmRouter.ex8.html",
                "mmRouter-基于状态机的路由器": "avalon.mmRouter.ex9.html"
            },
            "progressbar": {
                "外部设置进度值": "avalon.progressbar.ex.html",
                "模拟进度条，带label": "avalon.progressbar.ex1.html",
                "外部设置进度值，带label": "avalon.progressbar.ex2.html",
                "模拟进度条，带label，进度indeterminate，接口调用": "avalon.progressbar.ex3.html",
                "占比进度条，带label，左右两段，接口调用": "avalon.progressbar.ex4.html",
                "模拟进度条倒计时": "avalon.progressbar.ex5.html",
                "圆形进度条，外部设置进度值，带label": "avalon.progressbar.ex6.html",
                "圆形进度条，外部设置进度值，带label，倒计时": "avalon.progressbar.ex7.html"
            },
            "resizable": {
                "各种回调": "avalon.resizable.ex1.html",
                "最小最大尺寸": "avalon.resizable.ex2.html",
                "按比例缩放": "avalon.resizable.ex3.html",
                "使用shift键": "avalon.resizable.ex4.html",
                "缩放textarea, select, input等控件": "avalon.resizable.ex5.html",
                "既能调整大小又能拖": "avalon.resizable.ex6.html"
            },
            "rating": {
                "例子": "avalon.rating.ex.html"
            },
            "scrollbar": {
                "scrollbar-document.body带上下小箭头": "avalon.scrollbar.ex.html",
                "scrollbar-元素带上下小箭头双滚动条": "avalon.scrollbar.ex1.html",
                "scrollbar-带上下小箭头嵌套": "avalon.scrollbar.ex2.html",
                "scrollbar-元素无上下小箭头双滚动条": "avalon.scrollbar.ex3.html",
                "scrollbar-滚动条hover或者滚动时候可见，初始不可见": "avalon.scrollbar.ex4.html",
                "scrollbar-滚动条不可见": "avalon.scrollbar.ex5.html"
            },
            "slider": {
                "slider组件使用概览": "avalon.slider.ex.html",
                "基本的slider组件，配置有dragstart、drag、dragend回调": "avalon.slider.ex1.html",
                "切换禁用slider组件": "avalon.slider.ex2.html",
                "配置slider组件max、min、value值": "avalon.slider.ex3.html",
                "配置slider的range为true、min、max实现不同的slider效果": "avalon.slider.ex4.html",
                "配置slider的步长step": "avalon.slider.ex5.html",
                "配置orientation选项使得slider为垂直拖动块": "avalon.slider.ex6.html",
                "利用slider组件滚动图片": "avalon.slider.ex7.html"
            },
            "simplegrid": {
                "最简单的例子,只有columns与data": "avalon.simplegrid.ex1.html",
                "演示tbodyTemplate的使用": "avalon.simplegrid.ex11.html",
                "演示className, renderCell, align, columnsOrder的使用": "avalon.simplegrid.ex3.html",
                "指定百分比列宽": "avalon.simplegrid.ex4.html",
                "表头拖动改变列宽": "avalon.simplegrid.ex5.html",
                "演示无限拖": "avalon.simplegrid.ex6.html",
                "演示无限拖与分页栏": "avalon.simplegrid.ex7.html",
                "右边添加一个全选非全选的checkbox栏": "avalon.simplegrid.ex8.html",
                "演示斑马线效果": "avalon.simplegrid.ex9.html",
                "演示十字线效果": "avalon.simplegrid.ex10.html",
                "演示theadRenderedCallback的使用(数据汇总)": "avalon.simplegrid.ex12.html",
                "演示环比同比表格": "avalon.simplegrid.ex13.html",
                "切换卡(非组件)里面套着表格": "avalon.simplegrid.ex14.html",
                "表格套textbox组件": "avalon.simplegrid.ex15.html",
                "当数据为零时显示没有结果的情况": "avalon.simplegrid.ex16.html"
            },
            "scrollspy": {
                "scrollspy：侦听内容元素是否在viewport": "avalon.scrollspy.ex.html",
                "scrollspy-与tab联动[结合tab、scrollbar组件]": "avalon.scrollspy.ex1.html"
            },
            "spinner": {
                "spinner demo": "avalon.spinner.ex.html",
                "动态设置spinner的min、max的值": "avalon.spinner.ex1.html"
            },
            "smartgrid": {
                "除设置columns和data外都是默认配置的smartgrid": "avalon.smartgrid.ex1.html",
                "通过htmlHelper配置数据包装函数集合，定义columns时设置要包装列的format为对应的包装函数": "avalon.smartgrid.ex2.html",
                "演示表格吸顶效果，并且取消pager的显示": "avalon.smartgrid.ex3.html",
                "表格排序操作": "avalon.smartgrid.ex4.html",
                "自定义smartgrid各种事件回调": "avalon.smartgrid.ex5.html",
                "供用户调用API": "avalon.smartgrid.ex6.html",
                "配置addRow为表格添加新行": "avalon.smartgrid.ex7.html",
                "通过data的disable属性禁用部分数据": "avalon.smartgrid.ex8.html",
                "通过avalon.filters.sanitize(str)来防止xss攻击": "avalon.smartgrid.ex9.html",
                "嵌套的表格": "avalon.smartgrid.ex10.html",
                "grid会根据columns配置的width自主决定是否显示水平滚动条": "avalon.smartgrid.ex11.html",
                "通过设置bodyHeight使得表格体可以垂直滚动": "avalon.smartgrid.ex12.html",
                "自定义列的显示/隐藏": "avalon.smartgrid.ex13.html"
            },
            "store": {
                "例子1": "avalon.store.ex1.html"
            },
            "tab": {
                "扫描dom树获取数据": "avalon.tab.ex.html",
                "传参配置数据 - mouseenter切换tab": "avalon.tab.ex1.html",
                "传参配置数据 - 点击切换tab": "avalon.tab.ex2.html",
                "传参配置数据 - 自动切换tab": "avalon.tab.ex3.html",
                "传参配置数据 - mouseenter延迟切换tab - 纵向排列效果": "avalon.tab.ex4.html",
                "传参配置数据 - click切换tab，修改默认模板 - 纵向排列字数多出效果": "avalon.tab.ex5.html",
                "传参配置数据 - mouseenter延迟切换tab - 小尺寸横向排列效果": "avalon.tab.ex6.html",
                "传参配置数据 - click切换tab - 纵向排列字数多出强制截断并且不要省略号效果": "avalon.tab.ex7.html",
                "使用ms-repeat生成html结构": "avalon.tab.ex8.html",
                "tab很多以slider形式展示": "avalon.tab.ex9.html"
            },
            "timer": {
                "通过鼠标拖动来分别选择dates、hour、minute": "avalon.timer.ex1.html",
                "通过鼠标滚动来分别选择dates、hour、minute": "avalon.timer.ex2.html"
            },
            "textbox": {
                "基本textbox、配置了width、tabIndex的textbox以及配置了disabledClass的textbox": "avalon.textbox.ex1.html",
                "拥有占位符的textbox": "avalon.textbox.ex2.html",
                "切换禁用textbox": "avalon.textbox.ex3.html",
                "有自动补全功能的textbox": "avalon.textbox.ex4.html",
                "无视用户输入的自动补全": "avalon.textbox.ex5.html",
                "添加回调操作的自动补全": "avalon.textbox.ex6.html",
                "自适应高度textarea": "avalon.textbox.ex7.html"
            },
            "tooltip": {
                "input元素不绑定事件，人工触发": "avalon.tooltip.ex.html",
                "input元素hover显示tip-父容器做代理": "avalon.tooltip.ex1.html",
                "不使用代理，各个方向绑定，改变位置，点击展示": "avalon.tooltip.ex2.html",
                "箭头位置自动调整，点击展示": "avalon.tooltip.ex3.html",
                "input元素获取焦点显示tip，不展示箭头": "avalon.tooltip.ex4.html",
                "鼠标跟随": "avalon.tooltip.ex5.html",
                "input元素获取焦点显示tip": "avalon.tooltip.ex6.html",
                "显示tooltip时动态获取最大z-index": "avalon.tooltip.ex7.html"
            },
            "touch": {
                "touch功能全览": "avalon.touch.ex.html",
                "shake摇一摇": "avalon.shake.ex.html",
                "iscroll无限下拉效果": "avalon.iscroll.ex.html",
                "iscroll普通效果": "avalon.iscroll.ex2.html"
            },
            "uploader": {
                "概览": "avalon.uploader.ex1.html",
                "各种回调": "avalon.uploader.ex2.html"
            },
            "tree": {
                "tree - Base模块功能": "avalon.tree.ex.html",
                "tree - Edit模块": "avalon.tree.ex1.html",
                "tree - 简单数据模式": "avalon.tree.ex2.html",
                "tree - Check模块": "avalon.tree.ex3.html",
                "tree - 異步加載，且必须是携带了async标记的节点": "avalon.tree.ex4.html",
                "tree - 自定义菜单": "avalon.tree.ex5.html"
            },
            "validation": {
                "自带验证规则required,int,decimal,alpha,chs,ipv4,phone": "avalon.validation.ex1.html",
                "自带验证规则qq,id,email,url,date,passport,pattern": "avalon.validation.ex2.html",
                "自带验证规则maxlength,minlength,lt,gt,eq,repeat": "avalon.validation.ex3.html",
                "自带验证规则contains,contain": "avalon.validation.ex4.html",
                "自带验证规则repeat(重复密码)": "avalon.validation.ex5.html",
                "自定义验证规则": "avalon.validation.ex6.html",
                "自带验证规则norequied": "avalon.validation.ex7.html",
                "禁止获得焦点时的onRest回调 resetInFocus": "avalon.validation.ex8.html",
                "与textbox组件的混用, ms-duplex-string的使用": "avalon.validation.ex9.html",
                "验证表单元素存在disabled的情况": "avalon.validation.ex10.html",
                "deduplicateInValidateAll:true对validatieAll回调的reasons数组根据element进行去重": "avalon.validation.ex13.html",
                "验证dropdown组件": "avalon.validation.ex14.html"
            }
        },
        apis: {
            "核心概念": {
                "非监控属性": "concepts/unobservable.html",
                "监控属性": "concepts/observable.html",
                "监控数组": "concepts/collection.html",
                "计算属性": "concepts/computed.html",
                "watch方法": "concepts/$watch.html",
                "fire方法": "concepts/$fire.html",
                "视图模型": "concepts/vmodel.html",
                "数据模型": "concepts/$model.html"
            },
            "bindings": {
                "ms-alt": "bindings/string-bindings.html",
                "ms-attr": "bindings/ms-attr.html",
                "ms-checked": "bindings/ms-attr.html",
                "ms-class": "bindings/ms-class.html",
                "ms-css": "bindings/ms-css.html",
                "ms-data": "bindings/ms-data.html",
                "ms-disabled": "bindings/ms-attr.html",
                "ms-duplex": "bindings/ms-duplex.html",
                "ms-href": "bindings/string-bindings.html",
                "ms-html": "bindings/ms-html.html",
                "ms-if": "bindings/ms-if.html",
                "ms-include": "bindings/ms-include.html",
                "ms-on": "bindings/ms-on.html",
                "ms-readonly": "bindings/ms-attr.html",
                "ms-repeat": "bindings/ms-repeat.html",
                "ms-selected": "bindings/ms-attr.html",
                "ms-src": "bindings/string-bindings.html",
                "ms-text": "bindings/ms-text.html",
                "ms-title": "bindings/string-bindings.html",
                "ms-value": "bindings/string-bindings.html",
                "ms-visible": "bindings/ms-visible.html",
                "ms-widget": "bindings/ms-widget.html"
            },
            "回调方法": {
                "data-callback": "callbacks/data-callback.html"
            },
            "静态方法": {
                "statics": "statics/statics.html"
            },
            "原型方法": {
                "prototypes": "prototypes/prototypes.html"
            },
            "表单示例": {
                "form": "form/index.html"
            }
        },
        statics: {
            "mix(a,b)": "★★★相当于jQuery.extend, 或用于深浅拷贝属性",
            "log(s)": "打印日志,如avalon.log(a); avalon.log(a, b)",
            "isFunction(s)": "判定是否为函数,1.3.6新增",
            "error(s)": "抛出异常",
            "ui": "用于放置组件",
            "vmodels": "★★★用于放置avalon.define(id, fn)产生的ViewModel",
            "noop": "一个空函数",
            "ready(fn)": "★★★domReady，将回调延迟到DOM树后才执行",
            "oneObject(str | array, val?)": "★★★如果传入一个字符串则将它以逗号转换为一个字符串数组，否则一定要传字符串数组，第二个参数可选，为生成的对象的值。此方法是用于生成一个键名不一样，但键值都一样的对象。如{a:1, b:1, c:1, d:1}",
            "type(obj)": "★★★返回传参的数据类型，值可能为array, date, object, json, number, string, null, undefined",
            "isWindow(obj)": "判定是否为window对象",
            "isPlainObject(obj)": "判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例",
            "slice(obj, start?, end?)": "用于转换一个类数组对象为一个纯数组，后面两个为索引值，可以只取原对象的一部分元素",
            "range(start, end, step)": "生成一个整数数组，功能与underscorejs或python的同名函数一致",
            "bind(el, type, fn, phase)": "绑定事件，返回一个回调给你自行卸载",
            "unbind(el, type, fn, phase)": "卸载事件",
            "each(obj,fn)": "★★★功能同jQuery.each， 都是索引值或键名在前，值或元素在后",
            "avalon.define(id, factory)": "★★★定义一个ViewModel",
            "scan(el?, vmodels?, group ?)": "★★★扫描DOM树，抽取绑定(el默认为DOM,vmodels默认为空数组",

            "define(id?, deps?, factory)": "●一个全局方法，用于定义AMD规范的JS模块",
            "require(deps, callback)": "●一个全局方法，用于加载JS模块",
            "css(node, name, value?)": "如果只有两个参数，读取元素的某个样式，三个参数时，设置元素某个样式;<br/>" +
            "在设置样式时,如果是长宽等计量属性,你可以直接传一个数值,框架会自动帮你添加px单位;<br/>" +
            "如果是取值时,你的第三个参数是true,它会帮你去掉单位,转换为纯数值",
            "nextTick(fn)": "延迟执行某个函数，类似于setTimeout(fn, 0)",
            "contains(a, b)": "判定A元素包含B元素",
            "parseHTML(str)": "将一段字符串转换为文档碎片",
            "innerHTML(node, str)": "对节点node进行innerHTML操作，在旧式IE下，head, table, td, tr, th等元素的innerHTML是只读，这个方法进行了兼容处理",
            "clearHTML(node)": "清空元素的所有子节点",
            "Array.remove(array, el)": "移除某个元素，成功返回true，失败返回false",
            "Array.removeAt(array, index)": "移除某个位置上的元素，成功返回true，失败返回false",
            "Array.ensure(array, el)": "只有数组不存在此元素时才添加它",
            "avalon.filters.uppercase(str)": "全部大写",
            "avalon.filters.lowercase(str)": "全部小写",
            "avalon.filters.truncate(str, length, truncation)": "length，新字符串长度，truncation，新字符串的结尾的字段",
            "avalon.filters.camelize(str)": "驼峰化",
            "avalon.filters.escape(str)": "将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 &lt; 为 &amplt;",
            "avalon.filters.currency(str,symbol)": "货币处理，默认第2个参数为￥",
            "avalon.filters.number(str, decimals, dec_point, thousands_sep)": "数字格式化<br/>" +
            "str 必需 要格式化的数字<br/>" +
            "decimals	可选，规定多少个小数位<br/>" +
            "dec_point	可选，规定用作小数点的字符串（默认为 . ）<br/>" +
            "thousands_sep 可选，规定用作千位分隔符的字符串（默认为','）。如果设置了该参数，那么所有其他参数都是必需的"
        }
    }
})