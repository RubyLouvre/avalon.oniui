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
            "afterTime": 3,
            "beforeTime": 3,
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