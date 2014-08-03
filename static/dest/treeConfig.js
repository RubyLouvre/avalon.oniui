define(function() {
    return {
        "1": [{
            "name": "hotkeys",
            "url": "oniui/hotkeys/avalon.hotkeys.doc.html",
            "title": "组合键绑定",
            "des": "组合键，即在元素上同时按下ctrl/shift/meta + 其他任一字母键或数字键，就能触发回调。它实质上是keydown事件的封装语法：  ms-hotkeys-xxx=\"fn\"， fn可能为ctrl-a, shift-ctrl-y……",
            "cover": "doc/img/hotkeys.gif"
        }, {
            "name": "store",
            "url": "oniui/store/avalon.store.doc.html",
            "title": "本地储存组件",
            "des": "IE8+及高级浏览器使用localStorage，旧式IE使用userData注意：本组件是返回一个特殊的对象，而非avalon",
            "cover": "doc/img/store.gif"
        }, {
            "name": "textbox",
            "url": "oniui/textbox/avalon.textbox.doc.html",
            "title": "textbox文档说明",
            "des": "通过给简单的表单输入域设置不同的配置项可以使表单拥有舒服的视觉效果，也可以使其具有提示补全功能，接下来列出textbox组件可以使用的配置项，然后分别举例说明\n            ",
            "cover": "doc/img/textbox.gif"
        }],
        "2": [{
            "name": "accordion",
            "url": "oniui/accordion/avalon.accordion.doc.html",
            "title": "accordion文档说明",
            "des": "accordion组件是在有限的区域显示可折叠内容面板的信息，通过不同的配置选项和丰富的api可以灵活的设置和调用accordion，接下来对所有的配置项和可用的API做以说明\n            ",
            "cover": "doc/img/accordion.gif"
        }, {
            "name": "checkboxlist",
            "url": "oniui/checkboxlist/avalon.checkboxlist.doc.html",
            "title": "checkboxlist文档说明",
            "des": "通过checkboxlist可以方便的实现选框的全选、全不选，并可通过简单配置进行选中操作的回调处理，也可以通过多种方式来提供渲染选项视图所需要的数据\n            ",
            "cover": "doc/img/checkboxlist.gif"
        }, {
            "name": "notice",
            "url": "oniui/notice/avalon.notice.doc.html",
            "title": "notice文档说明",
            "des": "notice组件用来向用户显示一些提示信息",
            "cover": "doc/img/notice.gif"
        }],
        "3": [{
            "name": "draggable",
            "url": "oniui/draggable/avalon.draggable.doc.html",
            "title": "拖动组件",
            "des": "让一个定位元素可以拖动。使用时在目标元素上添加ms-draggable绑定属性，值可以为空。值不为空时，有两个可选设置项，用逗号隔开。\n                    第一个用于指放置配置对象的VM的$id，为$或不存在时默认为离它最近的VM。第二个用于指定配置对象。",
            "cover": "doc/img/draggable.gif"
        }, {
            "name": "flipswitch",
            "url": "oniui/flipswitch/avalon.flipswitch.doc.html",
            "title": "flipswitch组件",
            "des": "flipswitch组件，将checkbox表单元素转化成富UI的开关",
            "cover": "doc/img/flipswitch.gif"
        }, {
            "name": "miniswitch",
            "url": "oniui/miniswitch/avalon.miniswitch.doc.html",
            "title": "miniswitch文档说明",
            "des": "此组件基于switchdropdown",
            "cover": "doc/img/miniswitch.gif"
        }, {
            "name": "pager",
            "url": "oniui/pager/avalon.pager.doc.html",
            "title": "分页组件",
            "des": "用于各种列表与表格的下方",
            "cover": "doc/img/pager.gif"
        }],
        "4": [{
            "name": "spinner",
            "url": "oniui/spinner/avalon.spinner.doc.html",
            "title": "spinner文档说明",
            "des": "spinner组件是用来增强输入框的能力，使其可以通过上下按钮或者键盘上的up、down键来改变输入域的数值，而且确保输入域始终是数值字符，非数值字符无效，组件会默认将非数值字符转换为最近一次的输入域数值\n            ",
            "cover": "doc/img/spinner.gif"
        }, {
            "name": "switchdropdown",
            "url": "oniui/switchdropdown/avalon.switchdropdown.doc.html",
            "title": "swtichdropdown文档说明",
            "des": "此组件基于dropdown",
            "cover": "doc/img/switchdropdown.gif"
        }],
        "5": [{
            "name": "at",
            "url": "oniui/at/avalon.at.doc.html",
            "title": "avalon类似新浪微博的@提示组件",
            "des": "经常使用微博的人会发现，当我们在输入框输入@然后敲一个人的名字，会弹出一个tip提示层。这是社交网站或应用最近非常流行的功能。\n                    当你发布“@昵称 ”的信息时，在这里的意思是“向某某人说”，对方能看到你说的话，并能够回复，实现一对一的沟通。\n                ",
            "cover": "doc/img/at.gif"
        }, {
            "name": "datepicker",
            "url": "oniui/datepicker/avalon.datepicker.doc.html",
            "title": "日历组件",
            "des": "datepicker组件方便快速创建功能齐备的日历组件，通过不同的配置日历可以满足显示多个月份、通过prev、next切换月份、或者通过下拉选择框切换日历的年份、月份，当然也可以手动输入日期，日历组件也会根据输入域中的日期值高亮显示对应日期等等各种需求\n            ",
            "cover": "doc/img/datepicker.gif"
        }, {
            "name": "coupledatepicker"
        }, {
            "name": "daterangepicker"
        }, {
            "name": "preview",
            "url": "oniui/preview/avalon.preview.doc.html",
            "title": "图片预览组件",
            "des": "IE6-9只能一个个预览, 其他高级浏览器设置了multiple可以批量预览",
            "cover": "doc/img/preview.gif"
        }, {
            "name": "simplegrid",
            "url": "oniui/simplegrid/avalon.simplegrid.doc.html",
            "title": "表格组件",
            "des": "用于各种大数据的展示，但最好存在滚动条，方便让它不会卡死页面。",
            "cover": "doc/img/simplegrid.gif"
        }],
        "7": [{
            "name": "cookie",
            "url": "oniui/cookie/avalon.cookie.doc.html",
            "title": "cookie组件",
            "des": "一个操作cookie的工具集。\n                ",
            "cover": "doc/img/cookie.gif"
        }, {
            "name": "dropdown",
            "url": "oniui/dropdown/avalon.dropdown.doc.html",
            "title": "dropdown文档说明",
            "des": "用于代替原生select控件,支持更多制定",
            "cover": "doc/img/dropdown.gif"
        }, {
            "name": "progressbar",
            "url": "oniui/progressbar/avalon.progressbar.doc.html",
            "title": "progressbar组件",
            "des": "progressbar组件，可以通过接口控制或者随机模拟进度条效果，支持条形，圆形，倒计时等效果功能",
            "cover": "doc/img/progressbar.gif"
        }, {
            "name": "resizable",
            "url": "oniui/resizable/avalon.resizable.doc.html",
            "title": "伸缩组件",
            "des": "使用时在目标元素上添加ms-resizable绑定属性，值可以为空。值不为空时，有两个可选设置项，用逗号隔开。\n                    第一个用于指放置配置对象的VM的$id，为$或不存在时默认为离它最近的VM。第二个用于指定配置对象。",
            "cover": "doc/img/resizable.gif"
        }, {
            "name": "scrollbar",
            "url": "oniui/scrollbar/avalon.scrollbar.doc.html",
            "title": "scrollbar组件",
            "des": "scrollbar组件，自定义滚动条样式",
            "cover": "doc/img/scrollbar.gif"
        }],
        "8": [{
            "name": "dialog",
            "url": "oniui/dialog/avalon.dialog.doc.html",
            "title": "弹出层组件",
            "des": "dialog组件提供弹窗显示或者隐藏,通过简单配置可以水平居中显示dialog弹窗，此组件支持弹窗中再弹窗，也可以用来模拟alert的行为，非常方便\n            ",
            "cover": "doc/img/dialog.gif"
        }, {
            "name": "slider",
            "url": "oniui/slider/avalon.slider.doc.html",
            "title": "slider文档说明",
            "des": "slider组件用来拖动手柄选择数值，可以水平拖动、垂直拖动、设置range使得两边都可以拖动，或者根据设置的步长更新滑块数值\n            ",
            "cover": "doc/img/slider.gif"
        }],
        "9": [{
            "name": "menu",
            "url": "oniui/menu/avalon.menu.doc.html",
            "title": "menu组件",
            "des": "menu组件，实现扫描dom元素或者设置传参生成级联菜单的组件，注意扫描dom情形下，会销毁原有的dom，且会忽略所有的ol，ul，li元素上原有的绑定",
            "cover": "doc/img/menu.gif"
        }, {
            "name": "position",
            "url": "oniui/position/avalon.position.doc.html",
            "title": "position组件",
            "des": "position组件允许您相对窗体（window）、文档、另一个元素或指针（cursor）/鼠标（mouse）来定位一个元素，无需考虑相对父元素的偏移（offset），使用方法: avalon(element).position(option)",
            "cover": "doc/img/position.gif"
        }],
        "10": [{
            "name": "scrollspy",
            "url": "oniui/scrollspy/avalon.scrollspy.doc.html",
            "title": "scrollspy组件",
            "des": "scrollspy组件，可通过监听元素原生的scroll事件或者结合scrollbar组件使用时，监听其scroll，根据scrollTop，scrollLeft计算判定配置指定的panel list应该切换到什么位置，绑定方式是ms-scrollspy=\"\"，这样可以跟其他组件绑定在一个元素上",
            "cover": "doc/img/scrollspy.gif"
        }, {
            "name": "tab",
            "url": "oniui/tab/avalon.tab.doc.html",
            "title": "tab组件",
            "des": "tab组件，实现扫描DOM结构或者接受数组传参，生成tab，支持click、mouseenter事件响应切换，支持mouseenter情形延迟响应切换，支持click情形tab选中情况下再次点击回调，支持自动切换效果，支持tab增删禁用启用并可混合设置同步tab可删除状态，支持混合配制panel内容类型并支持panel内容是ajax配置回调，注意扫描dom情形下，会销毁原有的dom，且会忽略所有的ol，ul，li元素上原有的绑定",
            "cover": "doc/img/tab.gif"
        }, {
            "name": "tooltip",
            "url": "oniui/tooltip/avalon.tooltip.doc.html",
            "title": "tooltip组件",
            "des": "tooltip组件，给一个元素或者给元素里满足配置条件的系列元素添加一个富UI及交互的气泡提示框",
            "cover": "doc/img/tooltip.gif"
        }]
    }
});