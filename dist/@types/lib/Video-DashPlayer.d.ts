/** 媒体源推送类设置选项 */
export type VideoDashOptions = {
    /** 初始画质 */
    /**最小缓冲时间 (秒) */
    minBufferTime: number;
};
/**  DashPlayer 播放器 */
export declare class VideoDash {
    #private;
    get el(): HTMLVideoElement;
    /** 最近视频下载比特率 */
    get videoBitrate(): number;
    /** 最近音频下载比特率 */
    get audioBitrate(): number;
    /** 返回视频Rep集 */
    get videoSet(): {
        /** 此媒体需要传输的比特率*/
        bandwidth: number;
        /** 媒体类型 */
        mimeType: string;
        /** 视频媒体宽度 */
        width: number;
        /** 视频媒体高度 */
        height: number;
        /** 切换使用此rep源
         * @param timeupdate 要播放的开始时间，不能大于总时间，否则为 0
         * @param Ignorebuffered 默认false 是否忽略已经缓存的数据（软切换），直接使用新数据（强制切换）
        */
        switch(Ignorebuffered?: boolean | undefined): void;
    }[];
    get audioSet(): {
        /** 此媒体需要传输的比特率*/
        bandwidth: number;
        /** 媒体类型 */
        mimeType: string;
        /***/
        /** 切换使用此rep源
         * @param timeupdate 要播放的开始时间，不能大于总时间，否则为 0
         * @param Ignorebuffered 默认false 是否忽略已经缓存的数据（软切换），直接使用新数据（强制切换）
         */
        switch(Ignorebuffered?: boolean | undefined): void;
    }[];
    constructor(id: string | HTMLVideoElement, options?: Partial<VideoDashOptions>);
    /** 装载MPD文件 异步*/
    loaderAsync(addr: URL | string): Promise<unknown>;
}
