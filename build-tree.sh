#!/usr/bin/env
echo "now building $1"
cp ${1}/avalon.${1}.js ${1}/avalon.${1}.jsbak
if [ $1"" == "tree" ];then
	cat ${1}/avalon.${1}.*.js >> ${1}/avalon.${1}.js
	scss.bat ${1}/treeMenu.scss --default-encoding utf-8 > ${1}/${1}-menu.css
else
	cat ${1}/mm*.js >> ${1}/avalon.${1}.js
fi
avalon-doc ${1}
rm ${1}/avalon.${1}.js
mv ${1}/avalon.${1}.jsbak ${1}/avalon.${1}.js
