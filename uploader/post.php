<?php
/*	$len = count($_FILES["file"]["name"]);
	echo $len;*/
	// echo '{"ret":true,"errcode":1,"errmsg":"success","ver":1,"data":{"images":[{"id":1892867,"fileName":"DSC01924.JPG","width":1600,"height":1200,"originalUrl":"http://img1.qunarzz.com/travel/d7/1409/18/7493daad8873466ffffffffc8d65eac.jpg","smallUrl":"http://img1.qunarzz.com/travel/d7/1409/18/7493daad8873466ffffffffc8d65eac.jpg_r_160x120x95_0ced9337.jpg","middleUrl":"http://img1.qunarzz.com/travel/d7/1409/18/7493daad8873466ffffffffc8d65eac.jpg_r_480x360x95_f8eb19b2.jpg","middleBigUrl":"http://img1.qunarzz.com/travel/d7/1409/18/7493daad8873466ffffffffc8d65eac.jpg_r_650x500x95_1f42eca1.jpg","bigUrl":"http://img1.qunarzz.com/travel/d7/1409/18/7493daad8873466ffffffffc8d65eac.jpg_r_1024x683x95_955324ce.jpg","bookId":4437344,"bookElementId":916215,"bookElementType":2}]}}';

	// 获取FILES的缓存文件
	$tempFile = $_FILES['images']['tmp_name'];
    // 要保存到的新目录
    $targetPath = "./_file/";
    // 创建目录
    @mkdir($targetPath);
    // 要生成的文件名
    $targetFile = "2.jpg";
    // 存文件
    $result = move_uploaded_file($tempFile, $targetPath.$targetFile);

    if($result){
    	// echo $targetPath.$targetFile;
        $data = array(
            'url' => $targetPath.$targetFile
        );

        $imgae_arr = array($data);

        $arr = array(
            'ret' => 0,
            'errcode' => 0,
            'errmsg' => 'success',
            'ver' => 1,
            'data' => array(
                'images' => $imgae_arr
            )
        );

        echo json_encode($arr);
    }

?>