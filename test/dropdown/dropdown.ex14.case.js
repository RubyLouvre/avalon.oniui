var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex14.html', function(){

        // 第一个dropdown选第二项"2"
        $(".oni-dropdown").eq(0).simulate("click")
        $(".oni-dropdown-item[title='2']").eq(0).simulate("click")

        it('#第一个dropdown选第二项"2"', function(){
            expect($(".oni-dropdown-input").eq(0).text()).to.equal("2");
        });

        it('#其它的dropdown第二项变为disabled', function(){
            for(var i = 1; i <= 3; i++){
                $(".oni-dropdown").eq(i).simulate("click")
                expect($(".oni-dropdown-menu").eq(i).find(".oni-dropdown-item[title='2']").hasClass("oni-state-disabled")).to.equal(true);
            }
        });
    })
});

