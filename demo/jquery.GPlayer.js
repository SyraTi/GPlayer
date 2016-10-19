;
(function($, window, document, undefined) {
        var obj = function(ele, opt) {
            //options
            this.$element = ele;
            this.default = {
                height: 'auto',
                width: 800,
                dmkSize : 30,
                ajaxPath: '../dmkEngine.jsp',
                load: ['g-dmkForm', 'g-vdoForm', 'g-vdo'] //'g-dmkForm'/'g-vdoForm'/'g-vdo'     subDmk&subVdo&vdoPlayer
            };
            this.option = $.extend({}, this.default, opt);

            //constructor
            for (var i = 0; i < this.option['load'].length; i++) {
                switch (this.option['load'][i]) {
                    case 'g-dmkForm':
                        this.$element.append('<form action="" id="g-dmkForm" class="form-inline">' +
                            '<input class="form-control" id="g-dmk2sub" type="text" name="danmaku" placeholder="在这里输入弹幕">' +
                            '<button type="button" class="g-btn">提交</button>' +
                            '</form>');
                        break;
                    case 'g-vdoForm':
                        this.$element.append('<form id="g-vdoForm" action="" method="post" enctype="multipart/form-data">' +
                            '<input type="hidden" name="op" value="subVdos">' +
                            '<input class="form-control" id="g-vdo2sub" name="video" type="file">' +
                            '<button type="button" class="g-btn">提交视频</button>' + '</form>')
                        break;
                    case 'g-vdo':
                        this.$element.append('<div id="g-dmkPlayer"><video id="g-vdo" src="" controls>抱歉 你的浏览器不支持video标签</video><div id="g-err"></div></div>');
                        break;
                }
            }

            //do sth
            var $dmkForm = this.$element.children('#g-dmkForm'),
            	$vdoForm = this.$element.children('#g-vdoForm'),
                $player = this.$element.children('#g-dmkPlayer');
            	$video = this.$element.children('#g-dmkPlayer').eq(0).children('#g-vdo');

            this.$element.attr({
                id: 'g-danmaku'
            }).css({
                height: this.option['height'],
                width: this.option['width']
            });
            $video.css({
                'width': this.option['width']
            });
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




            //vars
            var dmks = new Array(),
                vdos = new Array(),
                vdoCntr = 0,
                dmkCntr = 0,
                vdoLen = null,
                dmkSize = this.option['dmkSize'],
                ajaxPath = this.option['ajaxPath'];

            loadVdos();

            //funcs
            function subVdos() {
                $.ajax({
                    url: ajaxPath,
                    type: 'POST',
                    data: new FormData($vdoForm[0]),
                    dataType: 'json',
                    contentType: false,
                    processData: false
                }).done(function(data) {
                    for (i = 0; i < data['vdos'].length; i++) {
                        vdos.push(data['vdos'][i]);
                    }
                    vdoLen = vdos.length;
                    loadVdos();
                    console.log("success");
                }).fail(function() {
                    console.log("error");
                }).always(function() {
                    console.log("complete");
                });
            }

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
                    if (data['status'] == 'success') {
                        $('#g-err').text(data['status']).hide();
                        for (var i = 0; i < data['vdos'].length; i++) {
                            vdos.push(data['vdos'][i]);
                        }
                        vdoLen = vdos.length;
                        $video.attr('src', vdos[++vdoCntr]);

                        $video[0].onended = function () {
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
                        $('#g-err').text(data['status']).show();
                    }
                });
            }

            function loadDmks() {
                var vdoPlaying = $video.attr('src').substr($video.attr('src').lastIndexOf('/') + 1);   //get the video on playing
                $.ajax({
                    url: ajaxPath,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        op: 'loadDmk',
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

            function subDmk() {
                var vdoPlaying = $video.attr('src').substr($video.attr('src').lastIndexOf('/') + 1);   //get the video on playing
                $.ajax({
                    url: ajaxPath,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        op: 'subDmk',
                        dmk: $('#g-dmk2sub').val(),
                        color: '#fff',
                        vdo: vdoPlaying,
                        subTime: $video[0].currentTime
                    }
                }).done(function(data) {
                    if (data['status'] == "success") {
                        var dmk2sub = $('#g-dmk2sub').val();
                        loadDmk(dmk2sub,'#fff');
                        $('#g-dmk2sub').attr({
                            disabled: 'disabled',
                            placeholder: '发送成功'
                        }).val('');
                        setTimeout(function() {
                            $('#g-dmk2sub').attr({
                                placeholder: '在这里输入弹幕'
                            }).removeAttr('disabled');
                        }, 3000);
                    } else {
                        $('#g-dmk2sub').attr({
                            placeholder: '发送失败#' + data['status']
                        }).val('');
                    }
                    console.log("success");
                }).fail(function() {
                    $('#g-dmk2sub').attr({
                        placeholder: '发送失败#弹幕引擎未响应'
                    }).val('');
                    console.log("error");
                }).always(function() {
                    console.log("complete");
                });
            }

            function dmkListener() {
                while (parseInt($video[0].currentTime) == parseInt(dmks["subTime"][dmkCntr])) {
                    loadDmk(dmks["dmk"][dmkCntr], dmks["color"][dmkCntr++]);
                }
            }

            function loadDmk(dmk, color) {
                var top = parseInt(Math.random() * (($video.height()-dmkSize) / dmkSize)) * dmkSize;
                var time = parseInt(Math.random() * 10000) + 10000;
                var $dmk = $('<div class="g-dmks">' + dmk + '</div>').load();
                $dmk.css({
                    top: top,
                    left: $video.width(),
                    color: color,
                    'font-size':dmkSize
                });
                $dmk.appendTo('#g-dmkPlayer').animate({
                    left: -$dmk.width()
                }, time, 'linear', function() {
                    $dmk.remove();
                });
            }
        }
    $.fn.GPlayer = function(options) {
        var o = new obj(this, options);
        return this;
    }
})(jQuery, window, document);