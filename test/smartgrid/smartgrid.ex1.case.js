var expect = chai.expect;

describe('smartgrid ex1', function(){

    it('初始化时渲染100条数据', function(){
        var rowsNum = $(".oni-smartgrid-row").length;
        expect(rowsNum).to.equal(100);
    });

    it('按年龄升序，第一条数据为10', function(){
        var ageAscendBtn = $(".oni-smartgrid-header .oni-smartgrid-column-cell:contains('年龄')").find(".oni-helper-sort-top")
        ageAscendBtn.simulate("click")

        var firstAge = $(".oni-smartgrid-row").eq(0).find(".oni-smartgrid-column-cell").eq(1).text().trim()
        expect(firstAge).to.equal("10")
    })

    it('按年龄降序，第一条数据为29', function(){
        var ageDecendBtn = $(".oni-smartgrid-header .oni-smartgrid-column-cell:contains('年龄')").find(".oni-helper-sort-bottom")
        ageDecendBtn.simulate("click")

        var firstAge = $(".oni-smartgrid-row").eq(0).find(".oni-smartgrid-column-cell").eq(1).text().trim()
        expect(firstAge).to.equal("29")
    })

    it('清空数据，数据条数为0', function(){
        var clearBtn = $("button:contains('清空数据')")
        clearBtn.simulate("click")

        var rowsNum = $(".oni-smartgrid-row").length;
        expect(rowsNum).to.equal(0);
    });

    it('重新渲染500条数据', function(){
        var clearBtn = $("button:contains('重新渲染数据')")
        clearBtn.simulate("click")

        var rowsNum = $(".oni-smartgrid-row").length;
        expect(rowsNum).to.equal(500);
    });

    it('pager可见', function(){
        var pager = $(".oni-pager")

        expect(pager.is(":visible")).to.equal(true)
    });
});

