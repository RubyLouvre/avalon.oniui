var expect = chai.expect;

describe('dropdown', function(){
    describe('dropdown.ex1.html', function(){

        var dropDown = $(".oni-dropdown"),
            dropDownItems = $(".oni-dropdown-item"),
            disabledItem = $(".oni-state-disabled")

        it('#dropdown可见', function(){
            expect(dropDown.is(":visible")).to.equal(true);
        });

        it('#点击 item1，item1变为active状态', function(){
            dropDownItems.eq(1).simulate("click");
            expect(dropDownItems.eq(1).hasClass("oni-state-active")).to.equal(true)
        });

        it('#再次点击 item1，item1取消active状态', function(){
            dropDownItems.eq(1).simulate("click");
            expect(dropDownItems.eq(1).hasClass("oni-state-active")).to.equal(false)
        });

        it('#点击 disabled item1，不会变为active状态', function(){
            disabledItem.eq(0).simulate("click");
            expect(dropDownItems.eq(0).hasClass("oni-state-active")).to.equal(false)
        });

        it('#hover item2，item2变为hover状态', function(){
            dropDownItems.eq(2).simulate("mouseover");
            expect(dropDownItems.eq(2).hasClass("oni-state-hover")).to.equal(true)
        });
    })
});

