<%@ page contentType="text/html;charset=utf-8" language="java" %>
<%@ page import="java.util.*" %>
<%@ page import="com.db.DBC" %>
<%@ page import="net.sf.json.JSONObject" %>
<%@ page import="java.sql.*" %>
<%@ page import="com.jspsmart.upload.SmartUpload" %>
<%@ page import="com.jspsmart.upload.Files" %>
<%@ page import="com.jspsmart.upload.File" %>
<%

%>
<%

    Map<String, Object> map = new HashMap<String, Object>();                        //声明map对象用以返回

    try {
        DBC dbc = new DBC();                                               //数据库连接

        ArrayList vdoList = new ArrayList();                                //视频列表
        ArrayList dmkList = new ArrayList();                                //弹幕列表
        ArrayList subTimeList = new ArrayList();                            //上传时间列表
        ArrayList colorList = new ArrayList();                             //颜色列表
        request.setCharacterEncoding("utf-8");                              //设置编码

        String op = request.getParameter("op");                             //判定操作


        if(op!=null && op.equals("loadDmks")){                               //loadDmks 加载弹幕
            String vdo = request.getParameter("vdo");                           //得到正在播放的视频名称
            String sql ="CREATE TABLE IF NOT EXISTS `"+vdo+"` (" +              //创建弹幕表如果该表不存在
                        "  `id` int(11) NOT NULL AUTO_INCREMENT," +             //id字段 int 自增
                        "  `danmaku` varchar(255) NOT NULL," +                  //弹幕字段 varchar(255) 不为空
                        "  `color` int(11) NOT NULL," +                         //颜色字段 int(11) 不为空
                        "  `subTime` time NOT NULL," +                          //提交时间字段 time 不为空
                        "  PRIMARY KEY (`id`)" +                                //主键 id
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";                //utf8
            dbc.update(sql);                                                    //创建
            sql = "SELECT * FROM `"+vdo+"` ORDER BY `subTime`";                 //查询弹幕 按提交顺序排序
            ResultSet rs = dbc.select(sql);
            while (rs.next()){
                dmkList.add(rs.getString("danmaku"));                           //加到弹幕列表中
                subTimeList.add(rs.getDouble("subTime"));                       //加到提交列表中
                colorList.add(rs.getString("color"));                           //加到颜色列表中
            }
            map.put("dmk",dmkList);                                             //将数组存到map中
            map.put("subTime",subTimeList);
            map.put("color",colorList);
        }else if(op!=null && op.equals("subDmks")){                          //subDmks 提交弹幕
            String dmk = request.getParameter("dmk");                       //得到弹幕
            String color = request.getParameter("color");                   //得到颜色
            String subTime = request.getParameter("subTime");               //得到提交时间
            String vdo = request.getParameter("vdo");                       //得到正在播放的视频
            String sql ="CREATE TABLE IF NOT EXISTS `"+vdo+"` (" +          //如果表不存在 则创建表
                    "  `id` int(11) NOT NULL AUTO_INCREMENT," +             //id字段 int 自增
                    "  `danmaku` varchar(255) NOT NULL," +                  //弹幕字段 varchar(255) 不为空
                    "  `color` int(11) NOT NULL," +                         //颜色字段 int(11) 不为空
                    "  `subTime` time NOT NULL," +                          //提交时间字段 time 不为空
                    "  PRIMARY KEY (`id`)" +                                //主键 id
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";                //utf8
            dbc.update(sql);                                                //运行sql
            sql = "INSERT INTO `"+vdo+"`(`danmaku`, `color`, `subTime`) VALUES ('"+dmk+"','"+color+"',"+subTime+")";    //提交数据
            dbc.update(sql);                                                //运行sql
        }else if(op!=null && op.equals("loadVdos")){                        //loadVdos 加载视频
            String filePath = request.getServletContext().getRealPath("/") ;//获取文件路径，去当前web工程路径
            String uploadedPath = "g-upload";                               //设置上传目录名
            String uploadPath = filePath + "\\" + uploadedPath + "\\";      // realPath\g-upload\   //拼接上传目录




            java.io.File file=new java.io.File(uploadPath);                 //声明 上传目录 的 File对象

            if(!file.exists()) {                                            //如果目录不存在则创建目录
                file.mkdir();
                throw new Exception("No video exists! Upload one at least!");       //抛出异常——没有视频
            }else if(file.list().length == 0){                              //如果该目录没有文件 则抛出异常同上
                throw new Exception("no video exists! Upload one at least!");
            }

            java.io.File[] files=file.listFiles();                          //列出文件名
            for(java.io.File f :files)
            {
                vdoList.add(uploadedPath + "/" + f.getName());              //g-upload/name 放到视频列表中
            }
            map.put("vdos", vdoList);                                       //放到map中

        }else{
            SmartUpload smart = new SmartUpload();                          //声明 smart upload 的对象
            smart.initialize(pageContext);                                  //初始化smart对象
            String filePath = request.getServletContext().getRealPath("/") ;//获取文件路径，去当前web工程路径
            String uploadedPath = "g-upload";                               //设置上传目录名
            String uploadPath = filePath + "\\" + uploadedPath + "\\";   // realPath\g-upload\   //拼接上传目录

            java.io.File file = new java.io.File(uploadPath);               //声明 上传目录 的 File对象

            if(!file.exists()) {                                            //如目录不存在，则创建目录。
                file.mkdir();}

            smart.upload();                                                 //*上传

            String opVdo = smart.getRequest().getParameter("op");           //通过smart访问 op //此处因为表单封装所以只能用smart获取字段
            if(opVdo.equals("subVdos")) {                                   //如果是（一定是）上传文件
                Files vdos = smart.getFiles();                              //获取smart文件列表
                for (int i = 0; i < vdos.getCount(); i++) {                 //用currentTimeMillis()为文件命名
                    File vdo = vdos.getFile(i);
                    String vdoName = System.currentTimeMillis() + "." + vdo.getFileExt();//重命名
                    vdoList.add(uploadedPath + "/" + vdoName);              //拼接 src路径
                    vdo.saveAs(uploadPath + vdoName);                       //另存为
                }
                map.put("vdos", vdoList);                                   //放到map中
            }
        }



        map.put("status","success");                                        //如果未抛出异常则处理成功
        JSONObject jsonObject = JSONObject.fromObject(map);                 //新建JSONObject对象 并转换map对象
        out.print(jsonObject);                                              //返回json对象
    }catch (Exception e){
//        e.printStackTrace();
        map.put("status",e.getMessage());
        JSONObject jsonObject = JSONObject.fromObject(map);
        out.print(jsonObject);
    }
%>