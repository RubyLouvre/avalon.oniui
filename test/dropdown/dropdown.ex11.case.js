var expect = chai.expect;

describe('dropdown', function(){

    describe('dropdown.ex11.html', function(){
        this.timeout(3500);

        before(function(done){
            setTimeout(function () {
                done()
            }, 3000);
        });

        it('#异步获得dropdown items', function(){
            $(".oni-dropdown").simulate("click")
            expect($(".oni-dropdown-menu").is(":visible")).to.equal(true);
        });

        it('#选取下拉框中title为"2"的item，使视图同步为"2"', function(){
            var item = $(".oni-dropdown-item[title='2']")
            item.simulate("click")

            setTimeout(function() {
                expect($("p").eq(1).text()).to.equal("2");
            }, 200)
        });

    })
});