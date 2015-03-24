//avalon.vmodels.datepicker4.toggle
var expect = chai.expect;

describe('accordion', function(){
    describe('accordion.ex1.html', function(){

        var $widgetElement = $("input[avalonctrl]").eq(0),
            vmodel = avalon.vmodels[$widgetElement.attr("avalonctrl")],
            root = $widgetElement.parent(),
            datepickerPanel = root.find(".oni-datepicker");

        before(function() {
            vmodel.toggle = false;
        });

        it('#初始化时datepicker的toggle属性为false', function(){
            expect(vmodel.toggle).to.equal(false);
        });

        it('#初始化时datepicker的日历选择框隐藏', function(){
            expect(datepickerPanel.is(":visible")).to.equal(false);
        });

        it('#点击日历框，此时的toggle属性为true', function(){
            root.simulate("click");
            expect(vmodel.toggle).to.equal(true);
        });

        it('#点击日历框，展开datepicker，日历选择框显示', function(){
            root.simulate("click");
            expect(datepickerPanel.is(":visible")).to.equal(true);
        });

    })
});

