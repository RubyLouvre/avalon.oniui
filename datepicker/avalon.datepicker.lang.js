define(function() {
    var HolidayStyle = {
        "元旦节" : {
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_yuandan",
            "holidayText" : "元旦"
        },
        "除夕" : {
            "afterTime": 0,
            "beforeTime": 0,
            "dayIndex": 0,
            "holidayClass" : "c_chuxi",
            "holidayText" : "除夕"
        },
        "春节" : {
            "afterTime": 0,
            "beforeTime": 0,
            "dayIndex": 0,
            "holidayClass" : "c_chunjie",
            "holidayText" : "春节"
        },
        "元宵节" : {
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_yuanxiao",
            "holidayText" : "元宵"
        },
        "清明节" : {
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_qingming",
            "holidayText" : "清明"
        },
        "劳动节" :{
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_wuyi",
            "holidayText" : "劳动"
        },
        "端午节":{
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_duanwu",
            "holidayText" : "端午"
        },
        "中秋节":{
            "afterTime": 2,
            "beforeTime": 2,
            "dayIndex": 0,
            "holidayClass" : "c_zhongqiu",
            "holidayText" : "中秋"
        },
        "国庆节":{
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_guoqing",
            "holidayText" : "国庆"
        },
        "圣诞节":{
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_shengdan",
            "holidayText" : "圣诞"
        }
    };
    var HolidayData = {
        "2014-01-01": {
            "holidayName": "元旦节"
        },
        "2014-01-30": {
            "holidayName": "除夕"
        },
        "2014-01-31": {
            "holidayName": "春节"
        },
        "2014-02-01": {
            "holidayName": "正月初二"
        },
        "2014-02-02": {
            "holidayName": "正月初三"
        },
        "2014-02-14": {
            "holidayName": "元宵节"
        },
        "2014-04-05": {
            "holidayName": "清明节"
        },
        "2014-05-01": {
            "holidayName": "劳动节"
        },
        "2014-06-01": {
            "holidayName": "儿童节"
        },
        "2014-06-02": {
            "holidayName": "端午节"
        },
        "2014-09-08": {
            "holidayName": "中秋节"
        },
        "2014-09-10": {
            "holidayName": "教师节"
        },
        "2014-10-01": {
            "holidayName": "国庆节"
        },
        "2014-12-25": {
            "holidayName": "圣诞节"
        },
        "2015-01-01": {
            "holidayName": "元旦节"
        },
        "2015-02-18": {
            "holidayName": "除夕"
        },
        "2015-02-19": {
            "holidayName": "春节"
        },
        "2015-02-20": {
            "holidayName": "正月初二"
        },
        "2015-02-21": {
            "holidayName": "正月初三"
        },
        "2015-03-05": {
            "holidayName": "元宵节"
        },
        "2015-04-05": {
            "holidayName": "清明节"
        },
        "2015-05-01": {
            "holidayName": "劳动节"
        },
        "2015-06-01": {
            "holidayName": "儿童节"
        },
        "2015-06-20": {
            "holidayName": "端午节"
        },
        "2015-09-27": {
            "holidayName": "中秋节"
        },
        "2015-10-01": {
            "holidayName": "国庆节"
        },
        "2015-12-25": {
            "holidayName": "圣诞节"
        },
        "2016-01-01": {
            "holidayName": "元旦节"
        },
        "2016-02-07": {
            "holidayName": "除夕"
        },
        "2016-02-08": {
            "holidayName": "春节"
        },
        "2016-02-09": {
            "holidayName": "正月初二"
        },
        "2016-02-10": {
            "holidayName": "正月初三"
        },
        "2016-02-22": {
            "holidayName": "元宵节"
        },
        "2016-04-04": {
            "holidayName": "清明节"
        },
        "2016-05-01": {
            "holidayName": "劳动节"
        },
        "2016-06-01": {
            "holidayName": "儿童节"
        },
        "2016-06-09": {
            "holidayName": "端午节"
        },
        "2016-09-15": {
            "holidayName": "中秋节"
        },
        "2016-10-01": {
            "holidayName": "国庆节"
        },
        "2016-12-25": {
            "holidayName": "圣诞节"
        },
        "2017-01-01": {
            "holidayName": "元旦节"
        },
        "2017-01-27": {
            "holidayName": "除夕"
        },
        "2017-01-28": {
            "holidayName": "春节"
        },
        "2017-01-29": {
            "holidayName": "正月初二"
        },
        "2017-01-30": {
            "holidayName": "正月初三"
        },
        "2017-02-11": {
            "holidayName": "元宵节"
        },
        "2017-04-04": {
            "holidayName": "清明节"
        },
        "2017-05-01": {
            "holidayName": "劳动节"
        },
        "2017-06-01": {
            "holidayName": "儿童节"
        },
        "2017-05-30": {
            "holidayName": "端午节"
        },
        "2017-10-01": {
            "holidayName": "国庆节"
        },
        "2017-10-04": {
            "holidayName": "中秋节"
        },
        "2017-12-25": {
            "holidayName": "圣诞节"
        },
        "2018-01-01": {
            "holidayName": "元旦节"
        },
        "2018-02-15": {
            "holidayName": "除夕"
        },
        "2018-02-16": {
            "holidayName": "春节"
        },
        "2018-02-17": {
            "holidayName": "正月初二"
        },
        "2018-02-18": {
            "holidayName": "正月初三"
        },
        "2018-03-02": {
            "holidayName": "元宵节"
        },
        "2018-04-05": {
            "holidayName": "清明节"
        },
        "2018-05-01": {
            "holidayName": "劳动节"
        },
        "2018-06-01": {
            "holidayName": "儿童节"
        },
        "2018-06-18": {
            "holidayName": "端午节"
        },
        "2018-09-24": {
            "holidayName": "中秋节"
        },
        "2018-10-01": {
            "holidayName": "国庆节"
        },
        "2018-12-25": {
            "holidayName": "圣诞节"
        },
        "2019-01-01": {
            "holidayName": "元旦节"
        },
        "2019-02-04": {
            "holidayName": "除夕"
        },
        "2019-02-05": {
            "holidayName": "春节"
        },
        "2019-02-06": {
            "holidayName": "正月初二"
        },
        "2019-02-07": {
            "holidayName": "正月初三"
        },
        "2019-02-19": {
            "holidayName": "元宵节"
        },
        "2019-04-05": {
            "holidayName": "清明节"
        },
        "2019-05-01": {
            "holidayName": "劳动节"
        },
        "2019-06-01": {
            "holidayName": "儿童节"
        },
        "2019-06-07": {
            "holidayName": "端午节"
        },
        "2019-09-13": {
            "holidayName": "中秋节"
        },
        "2019-10-01": {
            "holidayName": "国庆节"
        },
        "2019-12-25": {
            "holidayName": "圣诞节"
        },
        "2020-01-01": {
            "holidayName": "元旦节"
        },
        "2020-01-24": {
            "holidayName": "除夕"
        },
        "2020-01-25": {
            "holidayName": "春节"
        },
        "2020-01-26": {
            "holidayName": "正月初二"
        },
        "2020-01-27": {
            "holidayName": "正月初三"
        },
        "2020-02-08": {
            "holidayName": "元宵节"
        },
        "2020-04-04": {
            "holidayName": "清明节"
        },
        "2020-05-01": {
            "holidayName": "劳动节"
        },
        "2020-06-01": {
            "holidayName": "儿童节"
        },
        "2020-06-25": {
            "holidayName": "端午节"
        },
        "2020-10-01": {
            "holidayName": "国庆节" // 中秋节同一天
        },
        "2020-12-25": {
            "holidayName": "圣诞节"
        }
    };

    for( var x in HolidayData ){
        if( HolidayData.hasOwnProperty(x)){
            var data = HolidayData[x],
                name = data.holidayName;
            if( name && HolidayStyle[ name ] ){
                var style = HolidayStyle[ name ];
                for( var y in style){
                    if( style.hasOwnProperty(y) && !(y in data)){
                        data[y] = style[y];
                    }
                }
            }
        }
    }
    return HolidayData;
})