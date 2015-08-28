var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex5.html', function(){

        it('#通过duplex绑定视图默认值为"value5"', function(){
            expect($("p").eq(1).text()).to.equal("value5");
        });

        it('#选取下拉框中title为"Value 1"的item，使视图同步为"value1"', function(){
            var dropdown = $(".oni-dropdown").eq(0)
            dropdown.simulate("click")

            var item = $(".oni-dropdown-item[title='Value 1']")
            item.simulate("click")

            setTimeout(function () {
                expect($("p").eq(1).text()).to.equal("value1");
            }, 200);
        });
    })
});

