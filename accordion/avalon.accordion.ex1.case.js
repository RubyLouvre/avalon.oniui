var expect = chai.expect;

describe('accordion', function(){
    describe('accordion.ex1.html', function(){

        var vmodel = avalon.vmodels.aa,
            root = $("[avalonctrl=aa]"),
            triggers = $(".oni-accordion-header", root),
            panels = $(".oni-accordion-content", root);

        it('#data长度为2', function(){
            expect(vmodel.data.length).to.equal(2);
        });

        it('#data初始化时的第一项toggle为false', function(){
            expect(vmodel.data[0].toggle).to.equal(false);
        });

        it('#第一个面板初始化时的第一项为不可见', function(){
            expect(panels.eq(0).is(":visible")).to.equal(false);
        });

        it('#点击第一个选项卡后，data的第一项toggle为true', function(){

            //模拟点击第一个选项卡
            triggers.eq(0).simulate("click");
            expect(vmodel.data[0].toggle).to.equal(true);
        });

        it('#点击第一个选项卡后，第一个面板可见', function(){
            expect(panels.eq(0).is(":visible")).to.equal(true);
        });

        it('#点击第二个选项卡后，data的第二项toggle为false', function() {
            //模拟点击第二个选项卡
            triggers.eq(1).simulate("click");
            expect(vmodel.data[1].toggle).to.equal(false);
        });

        it('#点击第二个选项卡后，第二个面板不可见', function() {
            expect(panels.eq(1).is(":visible")).to.equal(false);
        });

    })
});

