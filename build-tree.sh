#!/usr/bin/env
echo "now building $1"
cp ${1}/avalon.${1}.js ${1}/avalon.${1}.jsbak
if [ $1"" == "tree" ];then
	cat ${1}/avalon.${1}.*.js >> ${1}/avalon.${1}.js
	scss ${1}/treeMenu.scss > ${1}/${1}-menu.css
else
	if [ $1"" == "mmRouter" ];then
		cat ${1}/new-mmS*.js >> ${1}/avalon.${1}.js
		echo ";" >> ${1}/avalon.${1}.js
		cat ${1}/mmH*.js >> ${1}/avalon.${1}.js
		cat ${1}/mmR*.js >> ${1}/avalon.${1}.js
	else
		cat ${1}/mm*.js >> ${1}/avalon.${1}.js
	fi
fi
avalon-doc ${1}
rm ${1}/avalon.${1}.js
mv ${1}/avalon.${1}.jsbak ${1}/avalon.${1}.js
