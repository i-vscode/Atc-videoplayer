import './style.css'
import { Player, PlayerOptions } from "../lib/Player"; 

const pl = new Player("video2",new PlayerOptions({minBufferTime:120})) 
const url = new URL(window.location.href + "/dash2/output.mpd?fwe")
//const url = new URL(window.location.href + "/dash/output.mpd?fwe")
//const url ="/outputh65.mp4" 
pl.loaderAsync(url).then(c => {
    console.log("200 ok", c("video"));
    c("video")?.at(0)?.setRep()
    c("audio")?.at(0)?.setRep()
    setTimeout(() => {
     //   c("video")?.at(1)?.setRep({cacheSwitchMode:"soft"})
    }, 12000);

}).catch(c => {    
    console.log("404 error 无法处理这个资源");
    throw c
}) 


// setTimeout(() => {
//     console.group("--------------------------------");
//     console.groupEnd();    
//     pl.loaderAsync(new URL(window.location.href + "/dash2/output.mpd?fwe")).then(c => {
//         console.log("200 ok-out", c("video"));
//         c("video")?.at(0)?.setRep()
//         c("audio")?.at(0)?.setRep()
//     }).catch(c => {    
//         console.log("404 error 无法处理这个资源");
//         throw c
//     }) 
// }, 5000);
//console.log(pl.getProcessors()); 

 

// pl.el?.addEventListener("abort", () => { console.log("abort 当音频/视频的加载已放弃时触发。") })
// pl.el?.addEventListener("canplay", () => { console.log("canplay	当浏览器可以开始播放音频/视频时触发。") })
// pl.el?.addEventListener("canplaythrough", () => { console.log("canplaythrough  当浏览器可在不因缓冲而停顿的情况下进行播放时触发。") })
// pl.el?.addEventListener("durationchange", () => { console.log("durationchange  当音频/视频的时长已更改时触发。",pl.el?.duration) })
// pl.el?.addEventListener("emptied", () => { console.log("emptied  当目前的播放列表为空时触发。") })
// pl.el?.addEventListener("ended", (e) => { console.log("ended  当目前的播放列表已结束时触发。") })
// pl.el?.addEventListener("error", (e) => { console.log("error  当在音频/视频加载期间发生错误时触发。", e, (e.target as HTMLVideoElement).error?.message)})
// pl.el?.addEventListener("loadeddata", () => { console.log("loadeddata  当浏览器已加载音频/视频的当前帧时触发。") })
// pl.el?.addEventListener("loadedmetadata", () => {console.log("loadedmetadata	当浏览器已加载音频/视频的元数据时触发。");})
// pl.el?.addEventListener("loadstart", () => { console.log("loadstart  当浏览器开始查找音频/视频时触发。") })
// pl.el?.addEventListener("play", () => { console.log("play  当音频/视频已开始或不再暂停时触发。") })
// pl.el?.addEventListener("pause", () => { console.log("pause  当音频/视频已暂停时触发。") })
// pl.el?.addEventListener("playing", () => { console.log("playing  当音频/视频在因缓冲而暂停或停止后已就绪时触发。") })
// pl.el?.addEventListener("progress", () => { console.log("progress  当浏览器正在下载音频/视频时触发。")});
// pl.el?.addEventListener("ratechange", () => { console.log("ratechange  当音频/视频的播放速度已更改时触发。") });
// pl.el?.addEventListener("seeked", () => { console.log("seeked  当用户已移动/跳跃到音频/视频中的新位置时触发。") });
// pl.el?.addEventListener("seeking", () => { console.log("seeking  当用户开始移动/跳跃到音频/视频中的新位置时触发。") });
// pl.el?.addEventListener("stalled", () => { console.log("stalled  当浏览器尝试获取媒体数据，但数据不可用时触发。") });
// pl.el?.addEventListener("suspend", () => { console.log("suspend  当浏览器刻意不获取媒体数据时触发。") });
// pl.el?.addEventListener("timeupdate", () => { console.log("timeupdate	当目前的播放位置已更改时触发。") });
// pl.el?.addEventListener("volumechange", () => { console.log("volumechange  当音量已更改时触发。") });
// pl.el?.addEventListener("waiting", () => { console.log("waiting  当视频由于需要缓冲下一帧而停止时触发。") })

