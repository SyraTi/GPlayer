# GPlayer
这是个弹幕播放器


###你需要引入的文件
	<script src="core/jquery.js"></script>
	<script src="core/jquery.GPlayer.js"></script>
###用法
	$('any blocks').GPlayer();

###可配置的选项
以及默认值如下

	$('any blocks').GPlayer({
		height: 'auto',	      //该模块的大小 
		width: 800,			  //该模块的宽度		
		dmkSize : 30,		  //弹幕的字号
		ajaxPath: '../dmkEngine.jsp',	// 处理ajax的服务器页面
		load: ['g-dmkForm', 'g-vdoForm', 'g-vdo'] //可用选项:'g-dmkForm'/'g-vdoForm'/'g-vdo' 
												//按顺序加载 弹幕提交模块/视频提交模块/弹幕播放器模块
	    autoPlay:false //自动播放
	});

###结构
通过该插件生成的结构是这样的，所有的css都是可控的，你可以根据id来添加样式

#### 弹幕提交模块#g-dmkForm
	<form id="g-dmkForm" action="">	
		<input id="g-dmk2sub" type="text" name="danmaku" placeholder="在这里输入弹幕">
		<button id="g-dmkBtn" class="g-btn" type="button">提交</button> <br>
	</form>												
#### 视频提交模块#g-vdoForm
	<form id="g-vdoForm" action="" method="post" enctype="multipart/form-data"> 
		<input type="hidden" name="op" value="subVdos">
		<input id="g-vdo2sub" type="file" name="video">
		<button id="g-vdoBtn" class="g-btn" type="button" >提交视频</button>
	</form>
#### 弹幕播放器模块#g-dmkPlayer
	<div id="g-dmkPlayer">								
		<video id="g-vdo" src="" controls>抱歉 你的浏览器不支持video标签</video>
		<div id="g-err"></div>
	</div>
	

###Tips
	这份demo包含了一份带注释的jsp后台可供参考 //dmkEngine.jsp
###Tips
	这是个直接从IDEA上传的仓库 如果你有IntelliJ IDEA 那么你可以直接导入使用
