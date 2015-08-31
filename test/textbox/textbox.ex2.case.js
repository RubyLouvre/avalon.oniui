var expect = chai.expect;

describe('textbox', function(){
    describe('textbox.ex2.html', function(){
        beforeEach(function(done){
            setTimeout(function () {
                done()
            }, 500);
        });

        var textbox = $(".oni-textbox")

        it('#设置textbox0的占位符', function(){
            var placeholder = textbox.eq(0).find("textarea").attr("placeholder");
            expect(placeholder).to.equal("表单域为空且存在占位符表单域为空且存在占位符表单域为空且存在占位符表单域为空且存在占位符");
        });

        textbox.eq(1).find("textarea").val("value")
        it('#设置textbox1的内容，使其同步到下面绑定的节点中', function(){
            expect(textbox.eq(1).next().text()).to.equal("输入框的值是： value");
        });
    })
});

