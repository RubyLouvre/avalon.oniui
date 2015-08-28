var expect = chai.expect;

describe('dialog', function(){
    describe('dialog.ex.html', function(){

        it('#点击"打开对话框"按钮，使oni-dialog从不可见到可见', function(){
            var trigger = $("fieldset").eq(0).find("button"),
                dialog = $(".oni-dialog").eq(0)

            expect(dialog.is(":visible")).to.equal(false)
            trigger.simulate("click");
            expect(dialog.is(":visible")).to.equal(true)
        });

        it('#对话框的标题为"dialog title"', function(){
            var dialogTitleText = $(".oni-dialog-title").eq(0).text()

            expect(dialogTitleText).to.equal("dialog title")
        });

        it('#点击dialog的取消按钮，alert提示"执行了cancel"', function(){
            var dialogCancelButton =  $(".oni-dialog").eq(0).find(".oni-button").eq(1)
            dialogCancelButton.simulate("click");

            var alertText = $("#alert").text()
            expect(alertText).to.equal("执行了cancel")
        });

        it('#打开层上层对话框，显示遮罩层', function(){
            var trigger = $("fieldset").eq(1).find("button"),
                dialogLayout = $(".oni-dialog-layout")

            trigger.simulate("click");
            expect(dialogLayout.is(":visible")).to.equal(true)
        });

        it('#在层上层对话框中，继续点击打开对话框，显示第二层dialog', function(){
            var openButton = $(".oni-dialog").eq(1).find(".oni-dialog-content button"),
                upLayerDialog = $(".oni-dialog").eq(2)

            openButton.simulate("click");
            expect(upLayerDialog.is(":visible")).to.equal(true)
        });

        it('#打开设置宽度的对话框，其宽度为300', function(){
            var trigger = $("fieldset").eq(3).find("button"),
                dialog = $(".oni-dialog").eq(5)

            trigger.simulate("click");
            expect(dialog.css("width")).to.equal("300px")
        });
    })
});

