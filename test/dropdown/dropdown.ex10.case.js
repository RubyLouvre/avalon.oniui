var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex10.html', function(){

        it('#通过trigger触发dropdown menu显示', function(){
            $("button").parent().simulate("click")
            expect($(".oni-dropdown-menu").is(":visible")).to.equal(true);
        });

        it('#选取下拉框中title为"Value 2"的item，使视图同步为"value2"', function(){
            var item = $(".oni-dropdown-item[title='Value 2']")
            item.simulate("click")

            setTimeout(function() {
                expect($("p").eq(1).text()).to.equal("value2");
            }, 200)
        });

    })
});

