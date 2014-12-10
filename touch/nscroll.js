define(["./iscroll.js"], function(iScroll) {
	var SCROLL_OPT = {
        scrollX: false,
        scrollY: true,
        freeScroll: false,
        mouseWheel: false,
        probeType: 3
    };

    var DEFAULT_OPT = {
        builderNodes: true,
        template: '<div class="item"></div>',
        bindScrolls: {},
        scrollOpt: {},
    };

    var _ = {
    	extend: avalon.mix,
    	delay: function(func, delay) {
    		setTimeout(func, delay || 0)
    	},
    	makeArray: function(arrayLike) {
    		return [].slice(arrayLike)
    	},
    	size: function(node) {
    		var avalonNode = avalon(node)
    		return {
    			width: avalonNode.css("width"),
    			height: avalonNode.css("height")
    		}
    	},
    	builder: function(html) {
    		return _.makeArray(avalon.parseHTML(html))
    	},
    	css: function(node, pro, value) {
    		var obj = pro, avalonNode = avalon(node)
    		if(arguments.length > 2) {
    			obj = {}
    			obj[pro] = value
    		}
    		for(var i in obj) {
    			avalonNode.css(i, obj[i])
    		}
    	},
    	isFunction: avalon.isFunction,
    	contains: avalon.contains
    }

    function NScroll(el, opt) {
        var scroll = null,
            cur = {
                column: 0,
                row: 0
            },
            options = _.extend({}, DEFAULT_OPT, opt),
            swap = el && el.children[0],
            itemList = [],
            topScroll = options.bindScrolls.x,
            leftScroll = options.bindScrolls.y,
            i, j, node;

        options.scrollOpt = _.extend({}, SCROLL_OPT, options.scrollOpt);

        if (!swap) {
            throw 'Dom Structure Error!';
        }

        if (!_.isFunction(options.dataFilter)) {
            throw 'There must be a "dataFilter" Function!';
        }

        // 计算属性。
        if (options.scrollOpt.scrollX) {
            if (options.column) {
                options.column.num = options.column.num || parseInt(_.size(el).width / options.column.width) + 2;
                _.css(swap, 'width', options.column.total * options.column.width + 'px');
            } else {
                throw 'Must configure "column", when you can scroll "x"!';
            }
        } else {
            options.column = {
                num: 1,
                total: 1,
                width: 1
            };
        }

        if (options.scrollOpt.scrollY) {
            if (options.row) {
                options.row.num = options.row.num || parseInt(_.size(el).height / options.row.height) + 2;
                _.css(swap, 'height', options.row.total * options.row.height + 'px');
            } else {
                throw 'Must configure "row", when you can scroll "y"!';
            }
        } else {
            options.row = {
                num: 1,
                total: 1,
                height: 1
            };
        }

        function computeTranslateStyle(column, row) {
            var pos = 'translate3d(' + column * options.column.width + 'px, ' + row * options.row.height + 'px, 0)';
            return {
                transform: pos,
                '-webkit-transform': pos
            };
        }

        function computeItems(scrollX, scrollY, directionX, directionY) {
            var curColumn = 0,
                lastColumn = options.column.num - 1,
                curRow = 0,
                lastRow = options.row.num - 1;
            if (scrollX < 0 && scrollX > scroll.maxScrollX) {
                curColumn = parseInt(Math.abs(scrollX) / options.column.width);
                lastColumn = curColumn + options.column.num - 1;
            }
            if (scrollY < 0 && scrollY > scroll.maxScrollY) {
                curRow = parseInt(Math.abs(scrollY) / options.row.height);
                lastRow = curRow + options.row.num - 1;
            }

            cur.column = curColumn;
            cur.row = curRow;

            itemList.forEach(function(item) {
                var change = false,
                    toColumn = item.column,
                    toRow = item.row;
                if (directionX > 0 && toColumn < curColumn && toColumn + options.column.num < options.column.total) {
                    change = true;
                    toColumn += options.column.num;
                } else if (directionX < 0 && toColumn > lastColumn && toColumn - options.column.num > -1) {
                    change = true;
                    toColumn -= options.column.num;
                }
                if (directionY > 0 && toRow < curRow && toRow + options.row.num < options.row.total) {
                    change = true;
                    toRow += options.row.num;
                } else if (directionY < 0 && toRow > lastRow && toRow - options.row.num > -1) {
                    change = true;
                    toRow -= options.row.num;
                }
                if (change) {
                    options.dataFilter('remove', item.node, item.column, item.row);
                    if (options.builderNodes) {
                        _.css(item.node, computeTranslateStyle(toColumn, toRow));
                    }
                    item.column = toColumn;
                    item.row = toRow;
                    options.dataFilter('add', item.node, toColumn, toRow);
                }
            });
        }

        function computeX(x) {
            var dis = Math.abs(x),
                num = parseInt(dis / options.column.width),
                nextX = -((dis % options.column.width > options.column.width / 2) ? num + 1 : num) * options.column.width;
            return {
                move: nextX !== x,
                x: nextX
            };
        }

        function computeY(y) {
            var dis = Math.abs(y),
                num = parseInt(dis / options.row.height),
                nextY = -((dis % options.row.height > options.row.height / 2) ? num + 1 : num) * options.row.height;
            return {
                move: nextY !== y,
                y: nextY
            };
        }


        function fixPosition() {
            var ret1 = computeX(scroll.x),
                ret2 = computeY(scroll.y);
            if (ret1.move || ret2.move) {
                if (topScroll) {
                    topScroll.scrollTo(ret1.x, 0, 300, IScroll.utils.ease.circular);
                }
                if (leftScroll) {
                    leftScroll.scrollTo(0, ret2.y, 300, IScroll.utils.ease.circular);
                }
                scroll.scrollTo(ret1.x, ret2.y, 300, IScroll.utils.ease.circular);
            }
        }

        function inArea(column, row) {
            return (column >= cur.column && column < cur.column + options.column.num - 1 && row >= cur.row && row < cur.row + options.row.num - 1);
        }

        // 创建内部 Dom
        function buildInnerDom() {
            for (i = 0; i < options.column.num; i++) {
                for (j = 0; j < options.row.num; j++) {
                    if (options.builderNodes) {
                        node = _.builder(options.template).children[0];
                        _.css(node, computeTranslateStyle(i, j));
                        swap.appendChild(node);
                    }
                    itemList.push({
                        column: i,
                        row: j,
                        node: node
                    });
                    options.dataFilter('add', node || null, i, j);

                }
            }
        }

        scroll = new iScroll(el, options.scrollOpt);

        scroll.on('scroll', function() {
            computeItems(scroll.x, scroll.y, scroll.directionX, scroll.directionY);
        });

        scroll.on('scrollEnd', function() {
            if (topScroll && scroll.x <= 0 && scroll.x >= scroll.maxScrollX) {
                topScroll.scrollTo(scroll.x, 0);
            }
            if (leftScroll && scroll.y <= 0 && scroll.y >= scroll.maxScrollY) {
                leftScroll.scrollTo(0, scroll.y);
            }
        });

        if (topScroll) {
            scroll.on('scroll', function() {
                if (scroll.x <= 0 && scroll.x >= scroll.maxScrollX) {
                    topScroll.scrollTo(scroll.x, 0);
                }
            });
            topScroll.on('scroll', function() {
                if (topScroll.x <= 0 && topScroll.x >= topScroll.maxScrollX && topScroll.x >= scroll.maxScrollX) {
                    scroll.scrollTo(topScroll.x, scroll.y);
                    computeItems(topScroll.x, scroll.y, topScroll.directionX, 0);
                }
            });
        }

        if (leftScroll) {
            scroll.on('scroll', function() {
                if (scroll.y <= 0 && scroll.y >= scroll.maxScrollY) {
                    leftScroll.scrollTo(0, scroll.y);
                }
            });
            leftScroll.on('scroll', function() {
                if (leftScroll.y <= 0 && leftScroll.y >= leftScroll.maxScrollY && leftScroll.y >= scroll.maxScrollY) {
                    scroll.scrollTo(scroll.x, leftScroll.y);
                    computeItems(scroll.x, leftScroll.y, 0, leftScroll.directionY);
                }
            });
        }

        _.delay(buildInnerDom);

        return {
            scroll: scroll,
            scrollTo: function() {
                scroll.scrollTo.apply(scroll, _.makeArray(arguments));
            },
            fixPosition: function() {
                _.delay(fixPosition);
            },
            appendNode: function(node, column, row) {
                _.css(node, computeTranslateStyle(column, row));
                if (!_.contains(swap, node)) {
                    swap.appendChild(node);
                }
            },
            checkShow: function(pointArr) {
                return pointArr.some(function(item) {
                    return inArea(item[0], item[1]);
                });
            },
            resetTotal: function(column, row, directionX, directionY) {
                options.column.total = column;
                options.row.total = row;
                if (options.scrollOpt.scrollX) {
                    _.css(swap, 'width', options.column.total * options.column.width + 'px');
                }
                if (options.scrollOpt.scrollY) {
                    _.css(swap, 'height', options.row.total * options.row.height + 'px');
                }
            	scroll.refresh();
            	computeItems(scroll.x, scroll.y, directionX || 0, directionY || 0);
            },
            refresh: function() {
            	if(scroll) scroll.refresh()
            }
        };
    }

    NScroll.iScroll = iScroll;
    return NScroll
})