;
(function($, window, document, undefined) {
        var gplayer = function(ele, opt) {

            //选项
            this.$element = ele;
            this.default = {
                height: 'auto',
                width: 800,
                dmkSize : 30,
                ajaxPath: '../dmkEngine.jsp',
                load: ['g-dmkForm', 'g-vdoForm', 'g-vdo'] //'g-dmkForm'/'g-vdoForm'/'g-vdo'    //按顺序load 弹幕发送/视频上传/视频播放器
            };
            this.option = $.extend({}, this.default, opt);



            //创建结构
            for (var i = 0; i < this.option['load'].length; i++) {
                switch (this.option['load'][i]) {
                    case 'g-dmkForm':
                        this.$element.append('<form id="g-dmkForm" action="">' +
                            '<input id="g-dmk2sub" type="text" name="danmaku" placeholder="在这里输入弹幕">' +
                            '<button id="g-dmkBtn" class="g-btn" type="button">提交</button>' +
                            '</form>');
                        break;
                    case 'g-vdoForm':
                        this.$element.append('<form id="g-vdoForm" action="" method="post" enctype="multipart/form-data">' +
                            '<input type="hidden" name="op" value="subVdos">' +
                            '<input id="g-vdo2sub" type="file" name="video" >' +
                            '<button id="g-vdoBtn" class="g-btn" type="button">提交视频</button>' + '</form>')
                        break;
                    case 'g-vdo':
                        this.$element.append('<div id="g-dmkPlayer"><video id="g-vdo" src="" controls>抱歉 你的浏览器不支持video标签</video><div id="g-err"></div></div>');
                        break;
                }
            }



            //变量定义
            var $dmkForm = this.$element.children('#g-dmkForm'),
            	$vdoForm = this.$element.children('#g-vdoForm'),
                $player = this.$element.children('#g-dmkPlayer');
            	$video = this.$element.children('#g-dmkPlayer').eq(0).children('#g-vdo');



            //根据配置设定尺寸
            this.$element.attr({
                id: 'g-danmaku'
            }).css({
                height: this.option['height'],
                width: this.option['width']
            });


            $video.css({
                'width': this.option['width']
            });



            //绑定事件
            $('#g-dmkForm input').keydown(function(e) {
            	e.preventDefault();
            	if (e.keyCode == 13) subDmk();
            });

            $('#g-vdoForm .g-btn').click(function(e) {
                subVdos();
            });

            $('#g-dmkForm .g-btn').click(function(e) {
                subDmk();
            });




            //临时变量定义
            var dmks = new Array(),
                vdos = new Array(),
                vdoCntr = 0,
                dmkCntr = 0,
                vdoLen = null,
                dmkSize = this.option['dmkSize'],
                ajaxPath = this.option['ajaxPath'];

            //开始
            loadVdos();



            //函数
            //视频上传
            function subVdos() {
                $.ajax({
                    url: ajaxPath,
                    type: 'POST',
                    data: new FormData($vdoForm[0]),
                    dataType: 'json',
                    contentType: false,
                    processData: false
                }).done(function(data) {
                    for (i = 0; i < data['vdos'].length; i++) {             //向视频列表添加文件
                        vdos.push(data['vdos'][i]);
                    }
                    vdoLen = vdos.length;                                   //更新视频数量
                    loadVdos();                                             //加载视频
                    console.log("success");
                }).fail(function() {
                    console.log("error");
                }).always(function() {
                    console.log("complete");
                });
            }


            //加载视频
            function loadVdos() {
                vdoCntr = -1;

                $.ajax({
                    url: ajaxPath,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        op: 'loadVdos'
                    }
                }).done(function(data) {                                   
                    if (data['status'] == 'success') {                                  //如果成功
                        $('#g-err').text(data['status']).hide();                        //隐藏#g-err 错误框
                        for (var i = 0; i < data['vdos'].length; i++) {                 //存储视频列表
                            vdos.push(data['vdos'][i]);
                        }
                        vdoLen = vdos.length;                                           //更新视频数量
                        $video.attr('src', vdos[++vdoCntr]);                            //更新src

                        $video[0].onended = function () {                               //播放结束后播放下一个（更新src）
                            if (vdoCntr >= vdoLen) {
                                vdoCntr = 0;
                            }
                            $video.attr('src', vdos[++vdoCntr]);
                            $video[0].play();
                        };
                        $video[0].play();
                        loadDmks();
                    }
                    else{
                        $('#g-err').text(data['status']).show();                        //错误则输出异常
                    }
                });
            }


            //从服务器加载弹幕
            function loadDmks() {
                var vdoPlaying = $video.attr('src').substr($video.attr('src').lastIndexOf('/') + 1);   //获取正在播放的视频名称
                $.ajax({
                    url: ajaxPath,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        op: 'loadDmks',
                        vdo: vdoPlaying                             
                    }
                }).done(function(data) {
                    dmks = data;
                    dmkCntr = 0;
                    setInterval(dmkListener, 1000);
                    console.log("success");
                }).fail(function() {
                    console.log("error");
                }).always(function() {
                    console.log("complete");
                });
            }


            //提交弹幕
            function subDmks() {
                var vdoPlaying = $video.attr('src').substr($video.attr('src').lastIndexOf('/') + 1);   //获取正在播放的视频名称
                $.ajax({
                    url: ajaxPath,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        op: 'subDmks',
                        dmk: $('#g-dmk2sub').val(),
                        color: '#fff',
                        vdo: vdoPlaying,
                        subTime: $video[0].currentTime
                    }
                }).done(function(data) {
                    if (data['status'] == "success") {                                  //如果成功
                        var dmk2sub = $('#g-dmk2sub').val();
                        loadDmk(dmk2sub,'#fff');                                        //加载弹幕到播放器
                        $('#g-dmk2sub').attr({                                          //防止短时间内多次提交
                            disabled: 'disabled',
                            placeholder: '发送成功'
                        }).val('');
                        setTimeout(function() {                                         //三秒后允许提交
                            $('#g-dmk2sub').attr({
                                placeholder: '在这里输入弹幕'
                            }).removeAttr('disabled');
                        }, 3000);
                    } else {                                                            //显示异常
                        $('#g-dmk2sub').attr({
                            placeholder: '发送失败#' + data['status']
                        }).val('');
                    }
                    console.log("success");
                }).fail(function() {
                    $('#g-dmk2sub').attr({                                              //未响应
                        placeholder: '发送失败#弹幕引擎未响应'
                    }).val('');
                    console.log("error");
                }).always(function() {
                    console.log("complete");
                });
            }

            //弹幕监听
            function dmkListener() {
                while (parseInt($video[0].currentTime) == parseInt(dmks["subTime"][dmkCntr])) {                 //比较currentTime和subTime 如果一致则加载
                    loadDmk(dmks["dmk"][dmkCntr], dmks["color"][dmkCntr++]);
                }
            }

            //加载弹幕到播放器
            function loadDmk(dmk, color) {                              
                var top = parseInt(Math.random() * (($video.height()-dmkSize) / dmkSize)) * dmkSize;        //随机top值
                var time = parseInt(Math.random() * 10000) + 10000;                                         //随机速度
                var $dmk = $('<div class="g-dmks">' + dmk + '</div>').load();                               //结构拼接
                $dmk.css({                                                                                  //弹幕css
                    top: top,
                    left: $video.width(),
                    color: color,
                    'font-size':dmkSize
                });
                $dmk.appendTo('#g-dmkPlayer').animate({                                                     //弹幕移动动画
                    left: -$dmk.width()
                }, time, 'linear', function() {
                    $dmk.remove();
                });
            }
        }
    $.fn.GPlayer = function(options) {      
        var g = new gplayer(this, options);
        return this;
    }
})(jQuery, window, document);