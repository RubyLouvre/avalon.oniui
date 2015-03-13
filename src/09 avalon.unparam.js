//将一个字符串转换为对象
avalon.unparam = function(input) {
    var items, temp,
            expBrackets = /\[(.*?)\]/g,
            expVarname = /(.+?)\[/,
            result = {};

    if ((temp = avalon.type(input)) != 'string' || (temp == 'string' && !temp.length))
        return {};
    if (input.indexOf("?") !== -1) {
        input = input.split("?").pop()
    }
    items = decode(input).split('&')

    if (!(temp = items.length) || (temp == 1 && temp === ''))
        return result;

    items.forEach(function(item) {
        if (!item.length)
            return
        temp = item.split("=")
        var key = temp.shift(),
                value = temp.join('=').replace(/\+/g, ' '),
                size, link, subitems = [];

        if (!key.length)
            return

        while ((temp = expBrackets.exec(key)))
            subitems.push(temp[1])

        if (!(size = subitems.length)) {
            result[key] = value
            return
        }
        size--
        temp = expVarname.exec(key)

        if (!temp || !(key = temp[1]) || !key.length)
            return

        if (avalon.type(result[key]) !== 'object')
            result[key] = {}

        link = result[key]

        avalon.each(subitems, function(subindex, subitem) {
            if (!(temp = subitem).length) {
                temp = 0

                avalon.each(link, function(num) {
                    if (!isNaN(num) && num >= 0 && (num % 1 === 0) && num >= temp)
                        temp = Number(num) + 1;
                });
            }
            if (subindex == size) {
                link[temp] = value;
            } else if (avalon.type(link[temp]) !== 'object') {
                link = link[temp] = {};
            } else {
                link = link[temp];
            }

        });

    });
    return result;
};
