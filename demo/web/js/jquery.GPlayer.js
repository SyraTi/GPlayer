;
(function ($, window, document, undefined) {
    var gplayer = function (ele, opt) {

        //选项
        this.$element = ele;
        this.default = {
            height: 'auto',
            width: 800,
            dmkSize: 30,
            ajaxPath: '../dmkEngine.jsp',
            load: ['g-dmkForm', 'g-vdoForm', 'g-vdo'], //'g-dmkForm'/'g-vdoForm'/'g-vdo'    //按顺序load 弹幕发送/视频上传/视频播放器
            testMode : false
        };
        this.option = $.extend({}, this.default, opt);
        var g = this;
      

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
                        '<button id="g-vdoBtn" class="g-btn" type="button">提交视频</button>' + '</form>'
                    );
                    break;
                case 'g-vdo':
                    this.$element.append('<div id="g-dmkPlayer"><video id="g-vdo" src="" controls>抱歉 你的浏览器不支持video标签</video><div id="g-err"></div></div>');
                    break;
            }
        }

       

        //变量定义

        this.$dmkForm = this.$element.children('#g-dmkForm');
        this.$vdoForm = this.$element.children('#g-vdoForm');
        this.$player = this.$element.children('#g-dmkPlayer');
        this.$video = this.$element.children('#g-dmkPlayer').eq(0).children('#g-vdo');
        //根据配置设定尺寸
        this.$element.attr({
            id: 'g-danmaku'
        }).css({
            height: this.option['height'],
            width: this.option['width']
        });


        this.$video.css({
            'width': this.option['width']
        });


        //绑定事件
        $('#g-dmkForm input').keydown(function (e) {
            if (e.keyCode == 13){
                e.preventDefault();
                g.subDmks();
            }
        });

        $('#g-vdoForm .g-btn').click(function(){
            g.subVdos()
        });

        $('#g-dmkForm .g-btn').click(function(){
            g.subDmks()
        });

        //测试代码 -- 开始 -- 开发中
        if(this.option.testMode){
                this.$element.append('<button id="g-testBtn" type="button">test</button>');
                $('#g-test').click(function(event) {
                  
                    
                });
        }
        //测试代码 结束


        //临时变量初始化
        this.dmks = new Array();
        this.vdos = new Array();
        this.vdoCntr = 0;
        this.dmkCntr = 0;
        this.vdoLen = null;


        //开始
        this.loadVdos();
    }


//函数
    gplayer.prototype = {

//视频上传
        subVdos: function () {
            var formData = new FormData(this.$vdoForm[0]);
            var ajaxOptions = {
                url: this.option.ajaxPath,
                context: this,
                type: 'POST',
                data: formData,
                dataType: 'json',
                contentType: false,
                processData: false,
                beforeSend: function(){
                    this.$element.append('<p id="g-wait">uploading... wait plzZZ..</p>')
                },
                success: function (data) {
                    $('#g-wait').remove();
                    for (i = 0; i < data['vdos'].length; i++) {             //向视频列表添加文件
                        this.vdos.push(data['vdos'][i]);
                    }
                    this.vdoLen = this.vdos.length;                                   //更新视频数量
                    this.loadVdos();                                             //加载视频
                    console.log("success");
                },
                complete: function () {
                    console.log("complete");
                },
                error: function () {
                    console.log("error");
                }
            };
            $.ajax(ajaxOptions);
        },

//加载视频
        loadVdos: function () {
            this.vdoCntr = -1;

            var ajaxOptions = {
                url: this.option.ajaxPath,
                context: this,
                type: 'POST',
                dataType: 'json',
                data: {
                    op: 'loadVdos'
                },
                success: function (data) {
                    if (data['status'] == 'success') {                                  //如果成功
                        $('#g-err').text(data['status']).hide();                        //隐藏#g-err 错误框
                        for (var i = 0; i < data['vdos'].length; i++) {                 //存储视频列表
                            this.vdos.push(data['vdos'][i]);
                        }
                        this.vdoLen = this.vdos.length;                                           //更新视频数量
                        this.$video.attr('src', this.vdos[++this.vdoCntr]);                            //更新src

                        this.$video[0].onended = function () {                               //播放结束后播放下一个（更新src）
                            if (this.vdoCntr >= this.vdoLen) {
                                this.vdoCntr = 0;
                            }
                            this.$video.attr('src', this.vdos[++this.vdoCntr]);
                            this.$video[0].play();
                        };
                        this.$video[0].play();
                        this.loadDmks();
                    }
                    else {
                        $('#g-err').text(data['status']).show();                        //错误则输出异常
                    }
                }
            };
            $.ajax(ajaxOptions);
        },

//从服务器加载弹幕
        loadDmks: function () {
            var vdoPlaying = this.$video.attr('src').substr(this.$video.attr('src').lastIndexOf('/') + 1);   //获取正在播放的视频名称
            var ajaxOptions = {
                url: this.option.ajaxPath,
                context: this,
                type: 'POST',
                dataType: 'json',
                data: {
                    op: 'loadDmks',
                    vdo: vdoPlaying
                },
                success: function (data) {
                    this.dmks = data;
                    this.dmkCntr = 0;
                    setInterval($.proxy(this.dmkListener,this), 1000);
                    console.log("success");
                },
                error: function () {
                    console.log("error");
                },
                complete: function () {
                    console.log("complete");
                }
            };

            $.ajax(ajaxOptions);
        },

//提交弹幕
        subDmks: function () {
            var vdoPlaying = this.$video.attr('src').substr(this.$video.attr('src').lastIndexOf('/') + 1);   //获取正在播放的视频名称
            var ajaxOptions = {
                url: this.option.ajaxPath,
                context: this,
                type: 'POST',
                dataType: 'json',
                data: {
                    op: 'subDmks',
                    dmk: $('#g-dmk2sub').val(),
                    color: '#fff',
                    vdo: vdoPlaying,
                    subTime: this.$video[0].currentTime
                },
                success: function (data) {
                    if (data['status'] == "success") {                                  //如果成功
                        var dmk2sub = $('#g-dmk2sub').val();
                        this.loadDmk(dmk2sub, '#fff');                                        //加载弹幕到播放器
                        $('#g-dmk2sub').attr({                                          //防止短时间内多次提交
                            disabled: 'disabled',
                            placeholder: '发送成功'
                        }).val('');
                        setTimeout(function () {                                         //三秒后允许提交
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
                },
                error: function () {
                    $('#g-dmk2sub').attr({                                              //未响应
                        placeholder: '发送失败#弹幕引擎未响应'
                    }).val('');
                    console.log("error");
                },
                complete: function () {
                    console.log("complete");
                }
            };
            $.ajax(ajaxOptions);
        },

//弹幕监听
        dmkListener: function () {
            while (this.dmks['dmk'].length > 0&&parseInt(this.$video[0].currentTime) == parseInt(this.dmks['subTime'][this.dmkCntr])) {                 //比较currentTime和subTime 如果一致则加载
                this.loadDmk(this.dmks["dmk"][this.dmkCntr], this.dmks["color"][this.dmkCntr++]);
            }
        },

//加载弹幕到播放器
        loadDmk: function (dmk, color) {
            var dmkSize = this.option.dmkSize;
            var top = parseInt(Math.random() * ((this.$video.height() - dmkSize) / dmkSize)) * dmkSize;        //随机top值
            var time = parseInt(Math.random() * 10000) + 10000;                                         //随机速度
            var $dmk = $('<div class="g-dmks">' + dmk + '</div>').load();                               //结构拼接
            $dmk.css({                                                                                  //弹幕css
                top: top,
                left: this.$video.width(),
                color: color,
                'font-size': this.option.dmkSize
            });
            $dmk.appendTo('#g-dmkPlayer').animate({                                                     //弹幕移动动画
                left: -$dmk.width()
            }, time, 'linear', function () {
                $dmk.remove();
            });
        }
    };
    $.fn.GPlayer = function (options) {
        var g = new gplayer(this, options);
        return this;
    }
})(jQuery, window, document);


