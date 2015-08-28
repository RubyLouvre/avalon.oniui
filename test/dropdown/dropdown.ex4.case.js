var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex4.html', function(){

        var dropdown = $(".oni-dropdown-input").eq(0)

        it('#设置select默认值为"Value 2"', function(){
            expect(dropdown.text()).to.equal("Value 2");
        });

        it('#默认状态下，下拉框不可见', function(){
            expect($(".oni-dropdown-menu").is(":visible")).to.equal(false);
        });

        it('#点击select，下拉框可见', function(){
            dropdown.simulate("click")
            expect($(".oni-dropdown-menu").is(":visible")).to.equal(true);
        });

        it('#选择title为"Value 1"的item，下拉框消失', function(){
            var item = $(".oni-dropdown-item[title='Value 1']")
            item.simulate("click")
            expect($(".oni-dropdown-menu").is(":visible")).to.equal(false);
        });

        it('#此时select值同步为"Value 1"', function(){
            setTimeout(function () {
                expect($(".oni-dropdown-input").eq(0).text()).to.equal("Value 1");
            }, 200);
        });
    })
});

