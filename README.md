# 一个轻量的网页dash流媒体播放器

## 说明
> 目前暂不支持实时流，仅能播放采用DASH转码的视频。

> 使用 Typescript 和 vite 编写

> 没有使用任何第三方类库和依赖

> 暂无UI
 
## 简单使用方法

 ```Html
 <video width="800" height="600" id="video2">
 ```

 ```js 
/** mpd文件地址 */
const url = "/dash3/output.mpd";
/** 
 * 创建 daspPlayer 播放器类*
 * @param id string | HTMLMediaElement
 */
const player = new Player("video2") 
/** 装载 mpd文件 ，
 * 如果需要装载不同的mpd， 比如下一集的mpd，只需重新调用这个即可 */
player.loaderAsync(url).then(c => {
    /** 装载成功 
     *  可根据需要设置或切换不同码流rep源
     */
     c("video")?.at(0)?.switch()
     c("audio")?.at(0)?.switch()
})
``` 
## [更新](/CHANGELOG.md)

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

### 0.0.1-alpha.1

**创建初始版本**
 