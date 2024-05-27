export type Segment = {
    /** 此分段文件的平均持续时间 */
    duration: number;
    /** 当前 media 计数*/
    count: number;
    /** 当前分段文件 */
    media?: string;
    /** 跳转时间 */
    skip(index: number): Segment;
    /** 返回下一个媒体分段 */
    next(): Segment;
    /** 返回上一个媒体分段 */
    previous(): Segment;
};
export type RepType = {
    video: {
        /** id */
        id: string;
        /** 初始分段文件 */
        initialization?: string;
        /** 编码器 */
        codecs: string;
        /** 类型 */
        mimeType: string;
        /**此媒体需要传输的比特率 */
        bandwidth: number;
        /** 视频宽度 */
        width: number;
        /**视频高度 */
        height: number;
        /** 帧率 */
        frameRate: number;
        /** 开始数 */
        startNumber: number;
    } & Segment;
    audio: {
        /** id */
        id: string;
        /** 初始分段文件 */
        initialization?: string;
        /** 编码器 */
        codecs: string;
        /** 类型 */
        mimeType: string;
        /** 此媒体需要传输的比特率 */
        bandwidth: number;
        /** 开始数 */
        startNumber: number;
    } & Segment;
};
/** 媒体阶段 */
declare class Period {
    #private;
    get start(): number;
    set start(val: number);
    /** 视频适配集 */
    get videoSet(): ({
        /** id */
        id: string;
        /** 初始分段文件 */
        initialization?: string | undefined;
        /** 编码器 */
        codecs: string;
        /** 类型 */
        mimeType: string;
        /**此媒体需要传输的比特率 */
        bandwidth: number;
        /** 视频宽度 */
        width: number;
        /**视频高度 */
        height: number;
        /** 帧率 */
        frameRate: number;
        /** 开始数 */
        startNumber: number;
    } & Segment)[];
    /** 音频适配集 */
    get audioSet(): ({
        /** id */
        id: string;
        /** 初始分段文件 */
        initialization?: string | undefined;
        /** 编码器 */
        codecs: string;
        /** 类型 */
        mimeType: string;
        /** 此媒体需要传输的比特率 */
        bandwidth: number;
        /** 开始数 */
        startNumber: number;
    } & Segment)[];
    constructor(period: Element);
}
/** MPD清单解析器 文件处理类 */
export declare class MPD {
    #private;
    [key: string]: any;
    /** 总的时长 持续时间 */
    get mediaPresentationDuration(): number;
    /** 最大分段场持续时间  指的是加载的 每个m4s段的最大时间  */
    get maxSegmentDuration(): number;
    set maxSegmentDuration(val: number);
    /** 最小缓存时间 */
    get minBufferTime(): number;
    set minBufferTime(val: number);
    /** 媒体阶段数组 */
    get Period(): Period[];
    constructor(mpdstring: string);
}
export {};
