<?php
	// to generate data
	$id = isset($_GET["id"]) ? intval($_GET["id"]) : "";
	if(!$id) $id = isset($_POST["id"]) ? intval($_POST["id"]) : "";
	if(!$id) $id = "";
	$res = array();
	while(count($res) < 10) {
		array_push($res, array(
			"pId" => $id,
			"name"=> "異步加載節點" . count($res),
			"id"  => $id . count($res),
			"async"=>1,
			"isParent"=> rand(0, 1) > 0.5,
		));
	}
	sleep(rand(1,3));
	echo json_encode($res);