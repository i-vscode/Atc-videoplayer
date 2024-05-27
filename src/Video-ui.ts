// import { VideoControllerbar, VideoDash, VideoDashEventType as evType } from '../lib/';

// /**
//  * js事件节流
//  * @param callback 方法
//  * @param duration  设置节流时间，默认200
//  */
// export const throttle = <Fn extends (...args: any) => void>(callback: Fn, duration: number = 200) => {
//     let lastTime = new Date().getTime()
//     return (...e: Parameters<Fn>) => {
//         let now = new Date().getTime()
//         if (now - lastTime > duration) {
//             callback(e);
//             lastTime = now;
//         }
//     }
// }
// export const debounce = <Fn extends (...args: any) => void>(callback: Fn, delay: number = 200) => {
//     let t: number;
//     return (...e: Parameters<Fn>) => {
//         clearTimeout(t)
//         t = setTimeout(() => {
//             callback(...e as [any])
//         }, delay);
//     }
// }
// function getTime(time: number) {
//     time ??= 0
//     // 转换为式分秒
//     let h = (Array(2).join("0") + Math.floor(time / 60 / 60 % 24)).slice(-2)
//     let m = (Array(2).join("0") + Math.floor(time / 60 % 60)).slice(-2)
//     let s = (Array(2).join("0") + Math.floor(time % 60)).slice(-2)
//     // 作为返回值返回
//     return `${h}:${m}:${s}`
// }

// export function videoui(param: string, videoDash: VideoDash) {
//     const videoElement = videoDash.el;
//     const videoControllerbar = new VideoControllerbar(param, videoDash)
//     /** 播放切换开关 */
//     videoControllerbar.playSwitch({
//         setup(el) {

//             videoElement?.addEventListener("pause", () => this.setstatus(el))
//             videoElement?.addEventListener("canplaythrough", () => this.setstatus(el))
//             videoElement?.addEventListener("play", () => this.setstatus(el))
//             el?.addEventListener("click", () => {
//                 this.cb(el)
//             })
//             window.addEventListener("keypress", (e) => {
//                 if (e.code === "Space") { this.cb(el) }
//             })
//         },
//         setstatus(el?: HTMLElement) {
//             el!.innerText = videoElement.paused ? "播放" : "暂停"
//         },
//         cb(el) {
//             if (videoElement?.paused) { videoElement?.play() } else { videoElement?.pause() }
//             this.setstatus(el)
//         }

//     })
//     /** 音量 */
//     videoControllerbar.volume({
//         setup(el) {
//             videoElement.addEventListener("volumechange", () => this.cb(el))
//             el?.addEventListener("change", () => {
//                 if (videoElement.muted) { videoElement.muted = false }
//                 videoElement.volume = Math.fround(Number.parseInt((el as HTMLInputElement)?.value) / 100)
//                 if (videoElement.volume === 0) videoElement.muted = true
//             })
//             this.cb(el)
//         },
//         cb: (el) => {
//             if (videoElement.muted) { (el as HTMLInputElement).value = "0"; }
//             else { (el as HTMLInputElement).value = Math.floor((videoElement.volume ?? 0) * 100).toString() }
//             videoControllerbar.controllerbar?.()
//         }
//     })
//     /** 静音开关 */
//     videoControllerbar.muted({
//         setup(el) {
//             const htmlel = el as HTMLElement
//             htmlel?.addEventListener("click", () => {
//                 videoElement.muted = !videoElement.muted
//             })
//             videoElement.addEventListener("volumechange", () => this.cb(el))
//             this.cb(el)
//         },
//         cb(el) {
//             const htmlel = el as HTMLElement
//             if (htmlel) {
//                 if (videoElement.muted) { htmlel.innerText = "静音" }
//                 else if (videoElement.volume === 0) {
//                     htmlel.innerText = "静音"
//                 }
//                 else {
//                     htmlel.innerText = Math.floor((videoElement.volume ?? 0) * 100).toString() ?? "静音"
//                 }
//             }

//         }
//     })

//     videoControllerbar.el({
//         setup(el) {
//             let isclick = true
//             window?.addEventListener("keydown", (e) => {
//                 if (videoElement)
//                     switch (e.code) {
//                         case "ArrowRight":
//                             videoElement.currentTime += 5
//                             break;

//                         case "ArrowLeft":
//                             videoElement.currentTime -= 5
//                             break;
//                     }

//                 //  if (e.code === "k") { (el as HTMLVideoElement).currentTime+=5}
//             })
//             el?.addEventListener("dblclick", () => { videoControllerbar.fullscreenSwitch() })
//             el?.addEventListener("touchstart", () => {
//                 videoControllerbar.controllerbar?.((el_controllerbar) => {
//                     if (el_controllerbar?.classList.contains("hide")) {
//                         videoControllerbar.controllerbar?.()
//                         isclick = false

//                     } else { isclick = true }
//                 });
//             })
//             el?.addEventListener("click", () => { if (isclick) videoControllerbar.playSwitch?.() })
//         },
//     })
//     videoControllerbar.qualitylist({
//         setup(el) {
            
//            videoDash.on(evType.BUFFER_FETCH_END,(r,e)=>{

//             console.log("eeess",r,e);
            
//            })
//             el?.addEventListener("click",()=>{
                
//                 videoDash.SetQuality("video",1)
//                 const vq= videoDash.GetQuality("video")
//                 console.log("fefefe",vq);
//             })
//         },
//     })
//     /** 显示的时间刻度文字 */
//     videoControllerbar.timescale_text({
//         setup(el_timescale) {
//             videoElement.addEventListener("timeupdate", throttle(() => {
//                 if (el_timescale) {
//                     el_timescale.innerText = getTime(videoElement.currentTime)
//                 }
//             }, 1000))
//             videoElement.addEventListener("seeking", () => {

//                 if (el_timescale)
//                     el_timescale.innerText = getTime(videoElement.currentTime)
//             })
//             if (el_timescale)
//                 el_timescale.innerText = getTime(videoElement.currentTime)
//         }
//     })
//     videoControllerbar.duration_text?.({
//         setup(el_duration) {
//             videoElement.addEventListener("canplay", () => {

//                 if (el_duration)
//                     el_duration.innerText = videoElement.duration ? getTime(videoElement.duration) : getTime(0)

//             })
//             if (el_duration)
//                 el_duration.innerText = (videoElement.duration) ? getTime(videoElement.duration) : getTime(0)
//         },
//     })
//     videoControllerbar.message_box_played?.({
//         setup(el) {
//             el?.addEventListener("click", () => { videoControllerbar.playSwitch?.() })
//         },
//         hide: debounce((el?: HTMLElement) => {
//             if (!videoElement.paused) { el?.classList.add("hide") }
//         }, 2000),
//         cb(el) {
//             el?.classList.remove("hide")
//             this.hide(el)
//             return this
//         }
//     })

//     videoControllerbar.message_box_loading?.({
//         setup(el) {
//             videoElement.addEventListener("canplay", () => {this.show(el,false)})
//             videoElement.addEventListener("loadstart", () => { this.show(el)})            
//             videoElement.addEventListener("waiting", () => { this.show(el) })
//             videoElement.addEventListener("seeking", () => { this.show(el) })

//         },
//         show(el?: HTMLElement,isshow=true){
//             if(isshow){
//                 el?.classList.add("show") 
//                 videoControllerbar.message_box_played?.((box_played)=>{
//                     box_played?.classList.add("hide")
//                 } )
//             }else{
//                 el?.classList.remove("show") 
//                 videoControllerbar.message_box_played?.(  )
//             }
            
          
//         }
//     })
//     videoControllerbar.videoDiv({
//         setup(el) {

//             /** 控制栏自动隐藏 */
//             videoControllerbar.controllerbar?.({
//                 setup(controllerbar) {
//                     el?.addEventListener("mouseleave", () => { this.hide(controllerbar) })
//                     el?.addEventListener("mousemove", () => { this.cb(controllerbar) })
//                     el?.addEventListener("click", () => { this.cb(controllerbar) })


//                 },
//                 hide: debounce((el?: HTMLElement) => {
//                     if (!videoElement.paused) {
//                         el?.classList.add("hide")
//                         setTimeout(() => {
//                             if (el?.classList.contains("hide")) { el?.classList.add("hide2") }
//                         }, 3000);
//                     }
//                 }, 2000),
//                 cb(el) {
//                     el?.classList.remove("hide")
//                     el?.classList.remove("hide2")
//                     this.hide(el)
//                   //  videoControllerbar.message_box_played()
//                 }
//             })

//             /** 全屏切换开关 */
//             videoControllerbar.fullscreenSwitch?.({
//                 setup(el_fullscreenSwitch) {
//                     document.addEventListener("fullscreenchange", () => { this.setstatus(el_fullscreenSwitch) })
//                     el_fullscreenSwitch?.addEventListener("click", () => { this.cb(el_fullscreenSwitch) })
//                 },
//                 setstatus(el_fullscreenSwitch?: HTMLElement) {
//                     el_fullscreenSwitch!.innerText = document.fullscreenElement === el ? "退出全屏" : "全屏"
//                 },
//                 cb(el_fullscreenSwitch) {
//                     if (document.fullscreenElement === el) {
//                         document?.exitFullscreen().then(() => {
//                             this.setstatus(el_fullscreenSwitch);
//                             screen.orientation!.unlock();
//                         })
//                     } else {
//                         el?.requestFullscreen().then(() => {
//                             this.setstatus(el_fullscreenSwitch);

//                             /**自动横屏 */
//                             //screen.orientation?.lock("landscape");
//                         })
//                     }
//                 }
//             })
//         },
//     })
//     videoControllerbar.timelines({
//         setup(el) {
//             el?.addEventListener("click", (e) => {
//                 console.log("tt_timeline", e, el);
//                 const ex = videoElement.duration * (e.offsetX / el.clientWidth)
//                 videoElement.currentTime = isNaN(ex) ? 0 : ex
//             })
//         },
//     })
//     /** 缓冲时间线 */
//     videoControllerbar.timeline({
//         setup(el) {
//             videoDash.on(evType.SOURCEBUFFERUPDATEEND, () => {
//                 const svg = document.createElement("SVG")
//                 for (let index = 0; index < videoElement.buffered.length; index++) {
//                     const use = document.createElement("rect")
//                     const x = Math.floor(videoElement.buffered.start(index) / (videoElement.duration ?? 0) * 100)
//                     const width = Math.fround(videoElement.buffered.end(index) / (videoElement.duration ?? 0) * 100) - x
//                     use.setAttribute("width", width.toString() + "%")
//                     use.setAttribute("height", "100%")
//                     use.setAttribute("x", x.toString() + "%")
//                     svg!.appendChild(use)
//                 }
//                 el!.innerHTML = svg.innerHTML
//             })
//         }
//     })
//     /** 播放进度 */
//     videoControllerbar.progress({
//         setup(el) {
//             const eltimescale = () => {
//                 const use = document.createElement("rect")
//                 const x = Math.fround(videoElement.currentTime / (videoElement.duration ?? 0) * 100)
//                 use.setAttribute("height", "100%")
//                 use.setAttribute("width", x > 100 ? "100" : (x + 0.5).toString() + "%")
//                 el!.innerHTML = use.outerHTML
//             }
//             videoElement.addEventListener("canplay", () => { eltimescale() })
//             videoElement.addEventListener("timeupdate", throttle(() => { eltimescale() }, 1000))
//             videoElement.addEventListener("seeking", () => { eltimescale() })
//         }
//     })

//     return videoControllerbar



// }
