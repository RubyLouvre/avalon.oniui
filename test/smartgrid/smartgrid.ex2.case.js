var expect = chai.expect;

describe('smartgrid ex2', function(){
    this.timeout(5000);

    it('初始化时渲染8条数据', function(){
        var clearBtn = $("button:contains('重新渲染数据')")
        clearBtn.simulate("click")

        var rowsNum = $(".oni-smartgrid-row").length;
        expect(rowsNum).to.equal(8);
    });

    it('第一行数据最左部有一个checkbox', function(){
        var checkbox = $(".oni-smartgrid-row").eq(0).find(".oni-smartgrid-column").eq(0).find("input[type=checkbox]");
        expect(checkbox.is(":visible")).to.equal(true);
    });

    it('点击操作列会弹出dropdown menu', function(done){
        // 等待组件渲染完毕
        delay(done, function(){
            var dropdown = $(".oni-smartgrid-row").eq(0).find(".oni-smartgrid-column").eq(2).find(".oni-dropdown");
            dropdown.simulate("click")

            var dropdownMenu = $(".oni-dropdown-menu").eq(0)
            expect(dropdownMenu.is(":visible")).to.equal(true);
        }, 0)
    });
});

