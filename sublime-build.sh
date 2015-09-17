#!/bin/bash
if [ x$1 != "x" ] && [ x$2 != "x" ];then
	avalon=`echo $1|awk '{split($0, a, ".");print a[1]}'`
	uiname=`echo $1|awk '{split($0, a, ".");print a[2]}'`
	ex=`echo $1|awk '{split($0, a, ".");print a[3]}'`
	# if [ $avalon = "avalon" ] && [ x$uiname != "x" ];then
	# 	if [ $2 = "scss" ] || [ $2 = "css" ];then
	# 		#build css
	# 		ui buildcss $uiname
	# 	elif [ $2 = "js" ];then
	# 		#build docs
	# 		if [ $uiname = "tree" ] || [ ${uiname/mm/} != $uiname ];then
	# 			sh build-tree.sh $uiname
	# 		else
	# 			avalon-doc $uiname
	# 		fi
	# 		ui buildex $uiname
	# 		ui buildcss $uiname
	# 	elif [ $2 = "html" ] && [ x$ex != "x" ]; then
	# 		#build examples
	# 		ui buildex $uiname
	# 	fi
	# fi
	bash mvc.sh
fi