var expect = chai.expect;

describe('accordion', function(){
    describe('accordion.ex1.html', function(){

        var vmodel = avalon.vmodels.aa,
            root = $("[avalonctrl=aa]"),
            triggers = $(".oni-accordion-header", root),
            panels = $(".oni-accordion-content", root);

        it('#初始化时面板第一项的文案为标题1', function(){
            expect(triggers.eq(0).find("span").text()).to.equal("标题1");
        });

        it('#点击setData后，面板有四项，第一项的文案为new title 1', function(){
            $("[value=setData]").simulate("click");
            triggers = $(".oni-accordion-header", root);
            expect(triggers.length).to.equal(4);
            expect(triggers.eq(0).find("span").text()).to.equal("new title 1");
        });

    })
});

