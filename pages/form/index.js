var nationality = {}; //创建国籍对象
var model = avalon.define({
    $id: "formData",
    watchAct: false, //用来引发watch的变量
    name: "",//名称
    picture: "",//头像url
    nationData: [{//国籍数据
        "id": 1,
        "nation": "French",
        "checked": false
    }, {
        "id": 2,
        "nation": "American",
        "checked": false
    }, {
        "id": 3,
        "nation": "British",
        "checked": false
    }, {
        "id": 4,
        "nation": "Chinese",
        "checked": false
    }],
    checkNation: function() { //checkbox点击，改变nationData对象
        model.nationData.forEach(function(el) {
            if (el.checked === true) {
                nationality[el.id] = el.nation;
            } else {
                delete nationality[el.id];
            }
        });
        model.watchAct = !model.watchAct; //引发watch改变formdata对象
    },
    gender: "",//性别
    skillTitles: [],//保存slills中title属性，每添加一个skill则在addskill种push进一个空值
    skillLevels: [],//保存slills中level属性，每添加一个skill则在addskill种push进一个空值
    skillData: [],//保存skills的index，watch它的长度，响应skills的增减
    skillVisible: [],//保存skills是否可见，默认为true,remove事件之后为false
    addSkill: function() {
        model.skillData.push(model.skillData.length);
        model.skillTitles.push("");
        model.skillLevels.push("");
        model.skillVisible.push(true);
    },
    editSkill: function() {
        model.watchAct = !model.watchAct; //引发watch，响应修改skillTitles和skillLevels
    },
    removeSkill: function(el) {
        var noSkills = true;//判断此时skills数是否为0
        model.skillTitles[el] = "";
        model.skillLevels[el] = "";
        model.skillVisible[el] = false;
        model.skillVisible.push(false); //仅为了长度变化引发watch来删除dom
        model.skillVisible.pop(false);
        model.watchAct = !model.watchAct; //引发watch改变formdata对象
        model.skillVisible.forEach(function(el) { //检测如果所有都不可见则清空skills数据
            if (el === true) {
                noSkills = false;
            }
        });
        if (noSkills) { //清空skills数据
            model.skillTitles = [];
            model.skillLevels = [];
            model.skillData = [];
            model.skillVisible = [];
        }
    },
    formDataWrap: "{}", //内容的包裹层
    clearData: function() { //清空所有值
        model.name = "";
        model.picture = "";
        nationality = {};
        model.nationData.forEach(function(el) {
            el.checked = false;
        });
        model.gender = "";
        model.skillTitles = [];
        model.skillLevels = [];
        model.skillData = [];
        model.skillVisible = [];
    },
    formHtml : "" //获取表单html
});
model.formHtml=document.getElementById("form_wrap").innerHTML; //获取表单html
model.$watch("$all", function() {
    var obj = {}; //每次建立一个新的对象，以便于不显示空属性
    if (this.name !== "") {
        obj.name = this.name;
    }
    if (this.picture !== "") {
        obj.picture = this.picture;
    }
    if (!isEmpty(nationality)) {
        obj.nationality = nationality;
    }
    if (this.gender !== "") {
        obj.gender = this.gender;
    }
    if (this.skillData.length !== 0) { //创建skills对象
        var skills = [];
        for (var i = 0; i < this.skillData.length; i++) { 
            var newSkill = {
                "title": this.skillTitles[i],
                "level": this.skillLevels[i]
            }
            if (newSkill.title !== "" || newSkill.level !== "") { //skill属性都为空时不显示
                skills.push(newSkill);
            }
        }
        obj.skills = skills;
    }
    if (!isEmpty(obj)) { //创建formData对象
        var objWrap = {
            "formData": obj
        };
        model.formDataWrap = JSON.stringify(objWrap, null, 4);
    } else {
        model.formDataWrap = "{}";
    }
});

//判断对象是否为空
function isEmpty(obj) {
    for (var name in obj) {
        return false;
    }
    return true;
};