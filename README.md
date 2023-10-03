# 一个轻量的网页dash流播放器

## 说明
目前暂不支持实时流，仅能播放采用DASH转码的视频。

使用 Typescript 和 vite 编写

没有使用任何第三方类库和依赖
 
## 简单使用方法
 ```js
//import {viodeDash} from 'atc-videoplayer';

/** 获取元素对象 */
const videoElement = document.querySelector('#video') as HTMLVideoElement;
/** 创建VideoDash对象 */
const viodeDash = new VideoDash(videoElement)
 /** 加载MPD文件 */
 viodeDash.loader("example.mpd")
``` 
## MPD3 （MDP文件解析类）
将字符串转换为适用VideoDash类使用的对象，一般不单独使用，VideoDash类会在内部调用。
``` ts
const mpd=new MPD3(MPDText as string)
```
## VideoDash （das分段媒体文件推送类）
加载解析MPD信息文件，并将dash分段媒体文件推送到原生MSE媒体源扩展SourceBuffer缓冲对象中，此对象只实现读取、加载、跳转、多码率选择等播放核心功能，不包含UI和控制栏实现。（注：单独使用此对象并配合浏览器原生控制栏可实现大多数的播放功能）
``` ts
const videoDash=new VideoDash(videoElement)
```
#### VideoDash 选项
``` ts
const videoDash=new VideoDash(videoElement,{
    /** 最小缓冲时间 (秒)*/
     minBufferTime: number //默认 100
})
```
#### VideoDash 事件
``` js
const videoDash=new VideoDash(videoElement)
/** 添加事件 
 * @param VidoeDashEventType 事件类型
 * @param r 当前码率轨道类型（扩展类）
*/
videoDash.on(VidoeDashEventType,(r:RepresentationRuntime)=>{
 
})
/**  VidoeDash 事件类型 */
export enum VidoeDashEventType {
    /** 当目前的播放位置已更改时触发。*/
    "TIMPE_UPDATE"="TIMPE_UPDATE",
    /** 当清单加载完成时触发，提供请求对象信息 */
    "MANIFEST_LOADING_FINISHED"="MANIFEST_LOADING_FINISHED",
    /** 当新的流（周期）开始时触发。 */
    "PERIOD_SWITCH_STARTED"="PERIOD_SWITCH_STARTED",
    /** 在一个周期的流结束时触发。 */
    "PERIOD_SWITCH_COMPLETED"="PERIOD_SWITCH_COMPLETED",
    /** 当缓冲区FETCH开始时触发*/
    "BUFFER_FETCH_STATE"="BUFFER_FETCH_STATE",
    /** 当缓冲区FETCH结束时触发*/
    "BUFFER_FETCH_END"="BUFFER_FETCH_END",
    /** 当缓冲区发生PUSH_MEDIASTREAM时触发*/
    "BUFFER_PUSH_MEDIASTREAM"="BUFFER_PUSH_MEDIASTREAM",
    /**当缓冲区发生PUSH_INITSTREAM时触发 */
    "BUFFER_PUSH_INITSTREAM"="BUFFER_PUSH_INITSTREAM",
    /** 缓冲区更新结束时触发 */
    "SOURCEBUFFERUPDATEEND"="SOURCEBUFFERUPDATEEND",
    /**请求质量更改时触发；由用户在手动模式下或通过 ABR 规则在自动模式下进行。 */
    "QUALITY_CHANGE_REQUESTED"="QUALITY_CHANGE_REQUESTED",
}

```
## VideoControllerbar 控制栏实用类
用于UI和控制栏功能实现
[更多完整示例](/src/main.ts)
``` html
    <div videoplayer>
        <video width="800" height="600" id="video2"></video>
        <div controllerbar>
            <!-- 定义一个播放暂停切换按钮-->       
            <button playStopSwitch>播放</button>
        </div>
    </div>
```
``` ts
/** 获取元素对象 */
const videoElement = document.querySelector('#video') as HTMLVideoElement;
/** 创建VideoDash对象 */
const viodeDash = new VideoDash(videoElement)
 /** 加载MPD文件 */
 viodeDash.loader("example.mpd")
/** 创建 VideoControllerbar 对象*/
 const videoControllerbar = new VideoControllerbar("videoplayer", viodeDash)

 /** 
  * 绑定播放暂停切换开关元素并设置 
  * 元素获取方式 元素属性>id名>元素class类名
 */
videoControllerbar.playStopSwitch?.({
    /** 设置元素 */
    setup(el) {
        videoElement?.addEventListener("pause", () => this.setstatus(el))
        videoElement?.addEventListener("canplaythrough", () => this.setstatus(el))
        videoElement?.addEventListener("play", () => this.setstatus(el))
        el?.addEventListener("click", () => {
            this.cb(el)
        })
        window.addEventListener("keypress", (e) => {
            if (e.code === "Space") { this.cb(el) }
        })
    },
    setstatus(el?: HTMLElement) {
      el!.innerText = videoElement.paused ? "播放" : "暂停"
    },
    cb(el) {
        if (videoElement?.paused) { videoElement?.play() } else { videoElement?.pause() }
        this.setstatus(el)
    }
})
```
 

## [更新](/CHANGELOG.md)

### 1.0.0-alpha.1

 *  创建初始版本
 