var expect = chai.expect;

describe('carousel', function(){
    var vmodel = avalon.vmodels.carousel,
        root = $("[avalonctrl=carousel]"),
        carousel = $(".oni-carousel", root),
        arrows = $(".oni-carousel-arrow", root),
        navs = $(".oni-carousel-selection-link", root)

    describe('小部件可见性', function(){
        var listItems = $(".oni-carousel-item", root);

        it('#图片列表项数应该等于设置的图片数', function(){
            expect(listItems.length).to.equal(vmodel.pictures.length);
        });

        it('#初始化时，箭头应该不可见', function(){
            expect(arrows.is(":visible")).to.equal(false);
        });

        it('#hover到组件上时，箭头应该可见', function(done){
            carousel.simulate("mouseover");

            delay(done, function() {
                expect(arrows.is(":visible")).to.equal(true);
            }, 1000);
        });
    });

    describe('箭头切换图片', function() {
        afterEach(function(done){
            setTimeout(function () {
                done()
            }, 1000);
        });

        it('#点击右边箭头，切换到图2', function(){
            arrows.eq(1).simulate("click");

            delay(done, function() {
                expect(vmodel.currentIndex).to.equal(1);
            }, 100);
        });

        it('#点击左边箭头，切换到图1', function () {
            arrows.eq(0).simulate("click");

            delay(done, function() {
                expect(vmodel.currentIndex).to.equal(0);
            }, 100);
        });
    });

    describe('导航切换图片', function() {
        afterEach(function(done){
            setTimeout(function () {
                done();
            }, 1000);
        });

        it('#导航应该可见', function(){
            expect(navs.is(":visible")).to.equal(true);
        });

        it('#点击导航1，切换图2', function(){
            navs.eq(1).simulate("click");
            expect(vmodel.currentIndex).to.equal(1);
        });

        it('#点击导航4，切换图片5', function () {
            navs.eq(4).simulate("click");
            expect(vmodel.currentIndex).to.equal(4);
        });
    });
});

