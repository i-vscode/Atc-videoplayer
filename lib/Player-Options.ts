export * from "./Player-Error.ts"
/**
 * 播放器 配置
 */
export class PlayerOptions {
    /**最小缓冲时间 (秒) */
    minBufferTime: number = 15;
    // asyncURLConverter = async (keys: string[]) => {
    //     const urlMap = new Map<string, URL>()
    //     console.log("ssssssssss-asyncURLConverter", this, keys);
    //     if (Array.isArray(keys) && this.#loadResult instanceof URL) {
    //         keys.forEach(key => {
    //             //       console.log("ssssssssss",key,this.#loadResult);

    //             const url = URL.parse(key, this.#loadResult as URL)
    //             if (url) {
    //                 urlMap.set(key, url)
    //             }
    //         })
    //     }
    //     return urlMap
    // }
    constructor(p?: Partial<PlayerOptions>) {
        Object.assign(this, p)
        // this.#loadResult = loadResult
        //console.log("acc,",this);

        Object.freeze(this)
    }
}

/** 防抖 */
export const debounce = <Fn extends (...args: any) => void>(callback: Fn, delay: number = 200) => {
    let t: number | any
    return (...e: Parameters<Fn>) => {
        clearTimeout(t)
        t = setTimeout(() => { callback(e) }, delay);
    }
}
/** 节流 */
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
/** 字面量和字符串联合类型用于智能提示 ,提示字符串 不是类型安全的！ */
export type HintedString<KnownValues extends string> = (string & {}) | KnownValues;

/** 适配描述 */
export interface Representation {
    /** id */
    get id(): string
    /** 开始时间 */
    get start(): number
    /** 编码 */
    get codecs(): string
    /** mimeType类型 */
    get mimeType(): string
    /** 宽带 */
    get bandwidth(): number
    /** 视频宽度 */
    get width(): number
    /**视频高度 */
    get height(): number
    /** 媒体比例 */
    get sar(): string
    /** 设置当前rep适配描述 */
    setRep(option?: { cacheSwitchMode: "radical" | "soft" | "disable" }): void
}
/** 视频比例  枚举*/
export enum Sar {
    /** 未知比例 */
    Unknown = "Unknown",
    SixteenByNine = "16:9",
    SixteenByTen = "16:10",
}
/**
 * 质量 枚举
 */
export enum QualityTab {
    Auto = "auto",
    P480 = "480P",
    P720 = "720P",
    P1080 = "1080P",
    P10804K = "1080P4K"
}
