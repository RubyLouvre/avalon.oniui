var expect = chai.expect;

describe('dropdown', function(){

    describe('dropdown.ex12.html', function(){

        var dropdown = $(".oni-dropdown").eq(0),
            province = $(".oni-dropdown-input").eq(1),
            city = $(".oni-dropdown-input").eq(2),
            currentArea = $(".oni-dropdown-input").eq(0).text()

        var shouldChangeArea, shouldChangeProvince, shouldChangeCity

        if(currentArea === "南"){
            shouldChangeArea = "北"
            shouldChangeProvince = "河北"
            shouldChangeCity = "石家庄"
        } else{
            shouldChangeArea = "南"
            shouldChangeProvince = "江苏"
            shouldChangeCity = "南京"
        }

        dropdown.simulate("click")

        var areaItem = $(".oni-dropdown-item[title='" + shouldChangeArea + "']").eq(0)
        areaItem.simulate("click")

        it('#通过联动改变省', function(){
            setTimeout(function(){
                expect(province.text()).to.equal(shouldChangeProvince);
            }, 200)
        });

        it('#通过联动改变城市', function(){
            setTimeout(function() {
                expect(city.text()).to.equal(shouldChangeCity);
            }, 200)
        });

    })
});


