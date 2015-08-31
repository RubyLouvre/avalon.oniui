var expect = chai.expect;

describe('textbox', function(){
    describe('textbox.ex1.html', function(){

        var textbox = $(".oni-textbox"),
            disabledTextbox = $(".oni-textbox-disabled")

        it('#hover到textbox0上，textbox0添加class oni-textbox-hover', function(){
            textbox.eq(0).simulate("mouseover");
            expect(textbox.eq(0).hasClass("oni-textbox-hover")).to.equal(true);
        });

        it('#设置textbox1的宽度为300', function(){
            expect(textbox.eq(1).css("width")).to.equal("300px");
        });

        it('#设置textbox1的tabIndex为1', function(){
            expect(textbox.eq(1).find("input")[0].tabIndex).to.equal(1);
        });

        it('#为disabled textbox添加class disableClass2', function(){
            expect(disabledTextbox.hasClass("disableClass2")).to.equal(true);
        });
    })
});

