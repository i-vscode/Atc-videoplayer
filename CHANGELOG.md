# Atc-videoplayer dash流播放器 变更日志

### 1.3.4

修改 tools > fragmentMp4.Tool 的用例说明

### 1.3.3

修复 PlayerCore.loaderAsync方法 没有正解使用PlayerOptions配置对象的问题

### 1.3.2
 
修复FragmentMp4 最后一个分段的加载问题

### 1.3.1

更新依赖

修复编译中的问题细节


### 1.3.0-alpha.1
 
新增 FragmentMp4 处理器

新增 tools / FragmentMp4-Tools 工具页面

修改类型名称 ProcessorType => ProcessorFactory 

增加 Player-Options 的配置属性

### 1.2.0-alpha.1 
 
MPDMSE FetchSchedule 完善功能  
增加（转换URL缓存 Map集合，上次差异化响应 Map集合，缓存转换URLsMap，转换列队获取响应 ，缓存转换URLsMap，缓存响应 Map，获取响应 Map集合）

MPDMSE SourceBufferTask sourceBufferUpdate调整参数 

### 1.1.0-alpha.1 

增加Player-Processor，Player-Representation，Player-Tools，Player-Event类型定义和相关方法

修改 Player中的方法名和处理逻辑

MPDMSE 处理器增加FetchSchedule调度类


### 1.0.0-alpha.3

MPDMSE增加一个MPDConverter类，适用于载入并mpd文件自定义ObjectStorage的查询请求和地址转换


### 1.0.0-alpha.2

修改Segment类 ，及流结束的判断和处理

### 1.0.0-alpha.1

**重构 播放器**

**针对不同类型的媒体文件以单独处理器的方式添加**

**重写MPD，MP4媒体文件的处理逻辑和代码**

### 0.1.2

修复细节，调整编译配置

### 0.1.1

修复细节，移除无关代码

### 0.1.0-alpha.1

**重写VideoDash类 , 重写MPD解析器**

### 0.0.1-alpha.1

**创建初始版本**
 