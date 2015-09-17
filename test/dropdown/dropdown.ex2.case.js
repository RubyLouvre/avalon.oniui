var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex2.html', function(){

        it('#dropdown双工绑定：视图的内容为"select1: value1,1,,false"', function(){
            expect($("p").eq(1).text()).to.equal("select1: value1,1,,false");
        });

        it('#dropdown双工绑定：Value 1的item处于active状态"', function(){
            var item = $(".oni-dropdown-item[title='Value 1']")
            expect(item.hasClass("oni-state-active")).to.equal(true);
        });

        it('#dropdown双工绑定：Value 2的item处于active状态"', function(){
            var item = $(".oni-dropdown-item[title='Value 2']")
            expect(item.hasClass("oni-state-active")).to.equal(true);
        });

        it('#dropdown双工绑定：Value 3的item处于active状态"', function(){
            var item = $(".oni-dropdown-item[title='Value 3']")
            expect(item.hasClass("oni-state-active")).to.equal(true);
        });

        it('#dropdown双工绑定：Value 4的item处于active状态"', function(){
            var item = $(".oni-dropdown-item[title='Value 4']")
            expect(item.hasClass("oni-state-active")).to.equal(true);
        });

        it('#点击Value 1的item，使其处于取消active状态"', function(){
            var item = $(".oni-dropdown-item[title='Value 1']")
            item.simulate("click")
            expect(item.hasClass("oni-state-active")).to.equal(false);
            expect($("p").eq(1).text()).to.equal("select1: 1,,false");
        });

        it('#点击Value 1的item后，视图的内容为"select1: 1,,false"', function(){
            expect($("p").eq(1).text()).to.equal("select1: 1,,false");
        });

    })
});

