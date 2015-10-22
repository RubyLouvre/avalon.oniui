var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex3.html', function(){

        it('#使用option配置双工绑定：视图的内容为"1,2,,false,3"', function(){
            expect($("p").eq(1).text()).to.equal("1,2,,false,3");
        });

        it('#点击item 1的，使视图的内容为2,,false,3"', function(){
            var item = $(".oni-dropdown-item[title='1']")
            item.simulate("click")
            expect($("p").eq(1).text()).to.equal("2,,false,3");
        });
    })
});

