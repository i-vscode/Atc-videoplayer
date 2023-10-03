import type { VidoeDashEventType as eventType } from "./eventbus";

type opt = {
    /** 设置元素 */
    setup?: (el?: HTMLElement) => void,
    /** 回调 */
    cb?: (el?: HTMLElement) => void
}
/** 控制栏元素绑定实用类 */
export type VideoControllerbarbind = <T extends opt | HTMLElement | ((el?: HTMLElement) => void) > (ext?: T) => void

/** 控制栏实用类 */
export class VideoControllerbar {
    /** any 自定义元素功能 */
    [x: string]: VideoControllerbarbind;
    constructor(videoplayer: string | HTMLDivElement, ViodeDash2: VideoDash)
    /** 播放器根元素 */
    videoDiv: VideoControllerbarbind
    /** 播放器 元素 */
    el: VideoControllerbarbind
}
/** 将分段dash媒体文件推送到MSE扩展媒体源 */
export declare class VideoDash {
    el: HTMLVideoElement
    constructor(id: string | HTMLVideoElement, options?: Partial<VideoDashOptions>)
    on(eventname: eventType.BUFFER_FETCH_STATE, fn: (representation: RepresentationRuntime, controller: AbortController,) => void): void;
    on(eventname: eventType.BUFFER_FETCH_END, fn: (representation: RepresentationRuntime, e: number) => void): void;
    on(eventname: eventType.SOURCEBUFFERUPDATEEND, fn: (representation: RepresentationRuntime) => void): void;
    on(eventname: eventType, fn: (...args: any) => void): void;
    /** 设定画质 */
    SetQuality(mediatype: mediaType, index: number, isRemovesourceBuffer: boolean): void
    GetQuality(mediatype: mediaType): RepresentationRuntime | undefined
    GetQualityList(mediatype: mediaType): Representation[] | undefined
    /** 装载MPD文件 */
    loader(url: URL | string): void
}
/** 媒体源推送类设置选项 */
export  type VideoDashOptions = {
    /** 初始画质 */
    //  initquality?: QualityType | Array<QualityType>,
    /**最小缓冲时间 (秒) */
    minBufferTime: number,
    /** 解析信息文件Url字符串 */
    parseinit(r: RepresentationRuntime): string,
    /** 解析媒体Url字符串 */
    parsemedia(r: RepresentationRuntime, currentIndex: number): string,
}


/**  轨道类型 （扩展的运行时类型）*/
export type RepresentationRuntime = Representation & {
    /** 媒体正则数组 */
    mediaRegExecArray: RegExpExecArray | null,
    /**经过计算的持续时间 */
    computedDuratio: number,
    /** 初始化流缓存 */
    initstream: ArrayBuffer,
    /**缓冲时间范围对象 */
    buffered: TimeRanges,
    /** 当前Fetch索引 */
    currentfetchindex:number,
    /** 当前Fetch abort */
    currentfetchabort?:()=>void
}
/** 媒体类型 */
export declare type mediaType = "video" | "audio";

type AdaptationSet = {
    id?: string,
    contentType?: mediaType,
    startWithSAP?: number,
    segmentAlignment?: boolean,
    bitstreamSwitching?: boolean,
    frameRate?: string,
    maxFrameRate?: string,
    maxWidth?: number,
    maxHeight?: number,
    par?: string,
    lang?: string,
    SegmentTemplate?: SegmentTemplate,
    Representation: Representation[]
}
type SegmentTemplate = {
    timescale: number,
    duration: number,
    initialization?: string,
    media?: string,
    startNumber?: number,
    computedDuratio: number
}
type AudioChannelConfiguration = {
    schemeIdUri: string,
    value: number
}
/** 轨道表示 */
type Representation = {
    id?: string,
    mimeType?: string,
    codecs?: string,
    bandwidth?: number,
    width?: number,
    height?: number,
    sar?: string,
    SegmentTemplate?: SegmentTemplate,
    AudioChannelConfiguration?: AudioChannelConfiguration,
    frameRate?: string,
    mediaType: mediaType
}

/** dash流 清单类型 */
export declare type MpdType = {
    next(): MpdType["Period"][number]
    /** 最小缓冲时间 */
    minBufferTime: number,
    mediaPresentationDuration: number,
    Period: Array<{
        id?: string,
        start?: number,
        AdaptationSetVideo?: AdaptationSet
        AdaptationSetAudio?: AdaptationSet
    }>
}
