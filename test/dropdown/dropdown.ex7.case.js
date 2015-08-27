var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex7.html', function(){

        it('#通过duplex绑定视图默认值为"1"', function(){
            expect($("p").eq(1).text()).to.equal("1");
        });

        it('#点击disabled dropdown，下拉框不可见', function(){
            var dropdown = $(".oni-dropdown").eq(0)
            dropdown.simulate("click")

            var menu = $(".oni-dropdown-menu")
            expect(menu.is(":visible")).to.equal(false);
        });
    })
});

