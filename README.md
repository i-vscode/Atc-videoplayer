# 一个轻量的网页dash流媒体播放器

## 说明
> 目前暂不支持实时流，仅能播放采用DASH转码的视频。

> 使用 Typescript 和 vite 编写

> 没有使用任何第三方类库和依赖

> 暂无UI
 
## 简单使用方法
 ```js 
/** mpd文件地址 */
const url = "/dash3/output.mpd";
/** 
 * 创建 daspPlayer 播放器类*
 * @param id string | HTMLVideoElement
 */
const dp = new VideoDash("video2")
/** 绑定的 video元素 */
const videoElement = dp.el
/** 装载 mpd文件 ，
 * 如果需要装载不同的mpd， 比如下一集的mpd，只需重新调用这个即可 */
dp.loaderAsync(url).then(b => {
    /** 装载成功
     *  通过 dp.videoSet/dp.audioSet获取码流列表， 
     *  可根据需要设置或切换不同码流rep源
     */
    dp.videoSet?.at(-1)?.switch()
    dp.audioSet?.at(-1)?.switch()
})
```
 ## VideoDash类说明

 ```Html
 <video width="800" height="600" id="video2">
 ```
  ```Js
  const dp = new VideoDash("video2")

/** 装载 mpd文件 可多次调用，重新调用会替换旧mdp设置*/
dp.loaderAsync();

  ```

## [更新](/CHANGELOG.md)

### 0.1.2

修复细节，调整编译配置

### 0.1.1

修复细节，移除无关代码

### 0.1.0-alpha.1

**重写VideoDash类 , 重写MPD解析器**

### 0.0.1-alpha.1

**创建初始版本**
 