/** 适配描述 */
export type Representation = {
    /** id */
    readonly id: string;
    /** 此片段在整个媒体的开始时间 */
    readonly startTime: number;
    /** 此片段的持续时间 */
    readonly duration: number;
    /** 编码 */
    readonly codecs: string;
    /** mimeType类型 */
    readonly mimeType: string;
    /** 宽带 */
    readonly bandwidth: number;
    /** 视频宽度 */
    readonly width: number;
    /**视频高度 */
    readonly height: number;
    /** 媒体比例 */
    readonly sar: Sar;
};
/** 判断是否符合  Representation类型 */
export declare const isRepresentation: (r: unknown) => r is Representation;
/** 视频比例 计算方法 */
export declare const getSar: (width: number, height: number) => Sar;
/** 视频比例  枚举*/
export declare enum Sar {
    /** 未知比例 */
    Unknown = "Unknown",
    /** 16:9 */
    SixteenByNine = "16:9",
    /** 16:10 */
    SixteenByTen = "16:10"
}
