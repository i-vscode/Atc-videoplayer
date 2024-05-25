import './style.css' 
import {  VideoDash } from '../lib/';
import {  videoui } from './Video-ui'; 
var videoElement = document.querySelector('#video2') as HTMLVideoElement;
videoElement.controls = false
const viodeDash = new VideoDash(videoElement,{minBufferTime:1})
const videoControllerbar=videoui("videoplayer",viodeDash)
viodeDash.loader("/dash/out.mpd")

setTimeout(() => {
    console.log("fffff");
    
viodeDash.loader("https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd")
}, 3000);
console.log("viodeDash", viodeDash);
console.log("videoControllerbar", videoControllerbar);

 
videoElement.addEventListener("canplay",()=>{console.log("	当浏览器可以开始播放音频/视频时触发。")})
videoElement.addEventListener("loadstart",()=>{console.log("当浏览器开始查找音频/视频时触发。")})
videoElement.addEventListener("playing",()=>{console.log("当音频/视频在因缓冲而暂停或停止后已就绪时触发。")})
videoElement.addEventListener("progress",()=>{console.log("	当浏览器正在下载音频/视频时触发。" );console.dir(videoElement);
})
videoElement.addEventListener("play",()=>{console.log("当音频/视频已开始或不再暂停时触发。")})
videoElement.addEventListener( "waiting",()=>{console.log("当视频由于需要缓冲下一帧而停止时触发。")})
videoElement.addEventListener( "loadeddata",()=>{console.log("当浏览器已加载音频/视频的当前帧时触发。")})
videoElement.addEventListener( "ended",()=>{console.log("当目前的播放列表已结束时触发。")})