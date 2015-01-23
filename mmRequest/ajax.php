<?php
	$data = array(
		array("name" => "skipper"),
		array("name" => "luna"),
		array("name" => "vipper"),
		array("name" => "private"),
	);
	$header = getallheaders();
	if(isset($header['Accept'])) {
		$Accept = $header['Accept'];
		$res = json_encode($data);
		if(preg_match("/application\/json/", $Accept)) {
			echo $res;
		} else if(isset($_GET['callback'])) {
			echo "callback(" . $res . ");";
		}
	}
?>