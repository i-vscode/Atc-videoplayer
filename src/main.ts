import './style.css'
import { VideoDash } from '../lib/Video-DashPlayer';
const url = "/dash3/output.mpd";
const dp = new VideoDash("video2")
const videoElement = dp.el
dp.loaderAsync(url).then(b => {
    dp.videoSet?.at(-1)?.switch()
    dp.audioSet?.at(-1)?.switch()
    dp.videoBitrate/ dp.audioBitrate
})
setTimeout(() => {
    // console.log("切换mpd");
    // dp.loaderAsync("/dash3/output.mpd").then(b=>{        
    // dp.videoSet?.at(-1)?.switch(true)
    // dp.audioSet?.at(-1)?.switch(true)  
    // }//)
}, 15000);
// videoElement.addEventListener("abort", () => { console.log("abort 当音频/视频的加载已放弃时触发。") })
// videoElement.addEventListener("canplay", () => { console.log("canplay	当浏览器可以开始播放音频/视频时触发。") })
// videoElement.addEventListener("canplaythrough", () => { console.log("canplaythrough  当浏览器可在不因缓冲而停顿的情况下进行播放时触发。") })
// videoElement.addEventListener("durationchange", () => { console.log("durationchange  当音频/视频的时长已更改时触发。") })
// videoElement.addEventListener("emptied", () => { console.log("emptied  当目前的播放列表为空时触发。") })
// videoElement.addEventListener("ended", (e) => { console.log("ended  当目前的播放列表已结束时触发。") })
// videoElement.addEventListener("error", (e) => { console.log("error  当在音频/视频加载期间发生错误时触发。", e, (e.target as HTMLVideoElement).error?.message)})
// videoElement.addEventListener("loadeddata", () => { console.log("loadeddata  当浏览器已加载音频/视频的当前帧时触发。") })
// videoElement.addEventListener("loadedmetadata", () => {console.log("loadedmetadata	当浏览器已加载音频/视频的元数据时触发。",dp.videoBitrate);})
// videoElement.addEventListener("loadstart", () => { console.log("loadstart  当浏览器开始查找音频/视频时触发。") })
// videoElement.addEventListener("play", () => { console.log("play  当音频/视频已开始或不再暂停时触发。") })
// videoElement.addEventListener("pause", () => { console.log("pause  当音频/视频已暂停时触发。") })
// videoElement.addEventListener("playing", () => { console.log("playing  当音频/视频在因缓冲而暂停或停止后已就绪时触发。") })
// videoElement.addEventListener("progress", () => { console.log("progress  当浏览器正在下载音频/视频时触发。", dp.videoBitrate)});
// videoElement.addEventListener("ratechange", () => { console.log("ratechange  当音频/视频的播放速度已更改时触发。") });
// videoElement.addEventListener("seeked", () => { console.log("seeked  当用户已移动/跳跃到音频/视频中的新位置时触发。") });
// videoElement.addEventListener("seeking", () => { console.log("seeking  当用户开始移动/跳跃到音频/视频中的新位置时触发。") });
// videoElement.addEventListener("stalled", () => { console.log("stalled  当浏览器尝试获取媒体数据，但数据不可用时触发。") });
// videoElement.addEventListener("suspend", () => { console.log("suspend  当浏览器刻意不获取媒体数据时触发。") });
// videoElement.addEventListener("timeupdate", () => { console.log("timeupdate	当目前的播放位置已更改时触发。") });
// videoElement.addEventListener("volumechange", () => { console.log("volumechange  当音量已更改时触发。") });
// videoElement.addEventListener("waiting", () => { console.log("waiting  当视频由于需要缓冲下一帧而停止时触发。") })

