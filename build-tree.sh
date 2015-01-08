#!/usr/bin/env
echo "now building tree"
cp tree/avalon.tree.js tree/avalon.tree.jsbak
cat tree/avalon.tree.*.js >> tree/avalon.tree.js
avalon-doc tree
rm tree/avalon.tree.js
mv tree/avalon.tree.jsbak tree/avalon.tree.js
scss tree/treeMenu.scss > tree/tree-menu.css
