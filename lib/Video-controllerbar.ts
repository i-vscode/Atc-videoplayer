 
import type { VideoControllerbar as VCB ,VideoDash, VideoControllerbarbind as CbBing, opt} from "./e"
/**
 * js事件节流
 * @param callback 方法
 * @param duration  设置节流时间，默认200
 */
export const throttle = <Fn extends (...args: any) => void>(callback: Fn, duration: number = 200) => {
    let lastTime = new Date().getTime()
    return (...e: Parameters<Fn>) => {
        let now = new Date().getTime()
        if (now - lastTime > duration) {
            callback(e);
            lastTime = now;
        }
    }
}
export class Elextend {
    constructor(el?: HTMLElement) { this.#el = el }
    #el?: HTMLElement
    #options!: opt
    get options() { return this.#options }
    set options(val: opt) { val?.setup?.(this.#el); this.#options = val; }
    get el() { return this.#el }
    set el(el: HTMLElement | undefined) { this.options?.setup?.(el); this.#el = el }
    cb() { this.options?.cb?.(this.#el) }
}

/** 播放器 UI */
export class VideoControllerbar implements VCB {
    [x: string]:CbBing;
    #SetProperty(el?: HTMLElement) {
        const elextend: Elextend = new Elextend(el);
        return <CbBing>((ext) => {
            if (ext instanceof HTMLElement) { elextend.el = ext }
            else if (ext instanceof Function) { ext(elextend.el) }
            else if (typeof ext === "object") { elextend.options = ext }
            else { elextend?.cb?.() }
        })
    }
    videoDiv: CbBing;
    el: CbBing;

    constructor(videoplayer: string | HTMLDivElement, ViodeDash2: VideoDash) {
        const videoDiv =
            ((typeof videoplayer === "string" ? document.getElementById(videoplayer) : videoplayer) ?? document.querySelector(`[${videoplayer}]`)) as HTMLDivElement
        this.videoDiv= this.#SetProperty(videoDiv)
        this.el=this.#SetProperty(ViodeDash2.el)        
        return new Proxy(this, {
            get(target, prop) {
                if (!Reflect.has(target, prop)) {
                    const el = (videoDiv.querySelector(`[${prop.toString()}]`) || 
                    videoDiv.querySelector(`#${prop.toString()}`) || 
                    videoDiv.querySelector(`.${prop.toString()}`)  )    as HTMLElement
                    if (el) Reflect.set(target, prop, target.#SetProperty(el))
                }
                return Reflect.get(target, prop)
            },
            set() {
                return false
            }
        })
    }
}