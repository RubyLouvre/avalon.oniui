// handle multiple browsers for requestAnimationFrame()
var requestAFrame = (function () {
    var func = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame;

    if(!func) {
        func = function(callback) {
            return window.setTimeout(callback, 1000 / 60); // shoot for 60 fps
        };

        func.noSupportAnimationFrame = true;
    }

    return func;
})();

function Statistics() {
    this.beginTime = new Date().getTime();
    this.step = 1;
    this.times = 60 * 3;
    this.id = null;
    this.data = [];
    this.data.push( {
        time: 0,
        nodes: $(document).find('*:visible').length
    } );
    this.scanData = [];
}

Statistics.prototype.INTERVAL = 16;

Statistics.prototype.tick = function() {
    var me = this;

    requestAFrame(function() {
        me.data.push( {
            time: new Date().getTime() - me.beginTime,
            nodes: $.find('*:visible').length
        } );
        me.times --;

        if(me.times > 0) {
            me.tick();
        } else {
            top.connector && top.connector(me.data, me.scanData);
        }
    });

};

Statistics.prototype.start = function() {
    this.tick();
};

Statistics.prototype.getMax = function() {

    var data = this.data;

    var times = $.map(data, function(d, index) {
        return d.time - (data[index - 1] && data[index - 1].time) || 0;
    }).sort(function(a, b) {
                return a - b;
            }),
        nodes = $.map(data, function(d) {
            return d.nodes;
        }).sort(function(a, b) {
                return a - b;
            });

    return [times[times.length - 1], nodes[nodes.length - 1]];

};

Statistics.prototype.get = function() {
    return this.data;
};

//展示ns命名空间下花销的时间
Statistics.prototype.show = function( ns ) {
    var max = this.getMax();
    alert('最长间隔时间：' + max[0] + '。最大可见节点数目：' + max[1]);

    var records = this.scanData;

    if(typeof ns !== 'undefined') {
        records = $.grep(records, function(r) {
            return r.ns === ns;
        });
    }

    $.each(records, function(i, d) {
        console.log('item：' + d.elem);
        console.log("该操作花费：" + d.cost + "ms");
    });
};

var statistics = new Statistics();

avalon.Statistic = {}
//扩展avalon的statistics方法
avalon.Statistic.record = function(elem, cost, ns) {
    statistics.scanData.push({
        elem : elem,
        cost: cost,
        ns: ns
    });
};

avalon.mix(avalon.Statistic, {
    start: function( elem, ns ) {
        var df = $.Deferred(),
            time = new Date();
        df.done(function() {
            avalon.Statistic.record(elem, new Date() - time, ns);
        });

        return df;
    },

    end: function( df ) {
        df.resolve();
    }
});

avalon.ready(function() {
    statistics.start();
});

if(typeof QTA === 'undefined') window.QTA = {};

QTA.statistics = statistics;

