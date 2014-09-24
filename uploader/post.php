<?php
    
    // 文件保存目录
    $targetPath = "./_file/";
    
    if(isset($_POST['id'])){
        // 删除文件

        if(unlink($targetPath.$_POST['id'])){
            // 成功
            echo json_encode(array(
                'errcode' => 0,
                'errmsg' => 'success'
            ));

        }
    }else{
        // 上传文件
        // sleep(10);
        // 获取FILES的缓存文件
        $tempFile = $_FILES['images']['tmp_name'];
        // 创建目录
        @mkdir($targetPath);
        // 要生成的文件名(id)
        $id = uniqid();
        // $targetFile = $_FILES['images']['name'];
        // 存放路径
        $targetUrl = $targetPath.$id;
        // 存文件
        $result = move_uploaded_file($tempFile, $targetUrl);

        if($result){

            $data = array(
                'url' => $targetUrl,
                'id' => $id
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
        
    }

?>