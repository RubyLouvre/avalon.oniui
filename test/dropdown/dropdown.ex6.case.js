var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex6.html', function(){

        it('#通过duplex绑定视图默认值为"1"', function(){
            expect($("p").eq(1).text()).to.equal("1");
        });

        it('#选取下拉框中title为"2"的item，使视图同步为"2"', function(){
            var dropdown = $(".oni-dropdown").eq(0)
            dropdown.simulate("click")

            var item = $(".oni-dropdown-item[title='2']")
            item.simulate("click")

            setTimeout(function(){
                expect($("p").eq(1).text()).to.equal("2");
            }, 200)
        });
    })
});

