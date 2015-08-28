var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex13.html', function(){

        it('#通过duplex绑定视图默认值为"2"', function(){
            expect($("p").eq(1).text()).to.equal("2");
        });

        it('#点击dropdown，有4个选项', function(){
            var dropdown = $(".oni-dropdown").eq(0)
            dropdown.simulate("click")

            var items = $(".oni-dropdown-item")
            expect(items.length).to.equal(4);
        });

        it('#点击item 4，视图值变为"4"', function(){
            var item = $(".oni-dropdown-item").eq(3)
            item.simulate("click")

            setTimeout(function() {
                expect($("p").eq(1).text()).to.equal("4");
            }, 200)
        });
    })
});

