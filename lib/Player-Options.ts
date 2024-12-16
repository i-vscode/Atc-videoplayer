export * from "./Player-Error.ts"

/**
 * 播放器 配置
 */
export class PlayerOptions {
    /**最小缓冲时间 (秒) */
    minBufferTime: number = 15;
    constructor(p?:Partial<PlayerOptions>){
        Object.assign(this,p)
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
    setRep(): boolean
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
/**
 * 处理器抽象类
 */
export abstract class Processor { 
    /**
     * 更新源缓冲
     * @param timeupdate 当前播放时间 
     */
    abstract sourceBufferUpdate(currentTime:number,minBufferTime:number): void

    /** 获取适配集描述列表 */
    abstract getRepList(repType: HintedString<"video" | "audio">): Array<Representation> | undefined
}
/** 处理器的类型对象*/
export type ProcessorType = {
    /** 处理器 名称 */
    name: string,
    /** 
     * 异步方法 获取处理器实例
     * @returns 返回 undefined 则表示此处理器不支持此类型参数 </p>
     * */
    asyncFunctionProcessorInstance: (result: unknown, el: HTMLMediaElement) => Promise<Processor | undefined>
}