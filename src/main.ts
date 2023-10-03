import './style.css' 
import {  VideoDash } from '../lib/';
import {  videoui } from './Video-ui'; 
var videoElement = document.querySelector('#video2') as HTMLVideoElement;
videoElement.controls = false
const viodeDash = new VideoDash(videoElement)
const videoControllerbar=videoui("videoplayer",viodeDash)
//viodeDash.loader("/dashav1/out.mpd")
//viodeDash.loader("https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd")
console.log("viodeDash", viodeDash);
console.log("videoControllerbar", videoControllerbar);

 
