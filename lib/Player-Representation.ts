
/** 适配描述 */
export type Representation = {
    /** id */
    readonly id: string
    /** 此片段在整个媒体的开始时间 */
    readonly startTime: number
    /** 此片段的持续时间 */
    readonly duration: number
    /** 编码 */
    readonly codecs: string
    /** mimeType类型 */
    readonly mimeType: string
    /** 宽带 */
    readonly bandwidth: number
    /** 视频宽度 */
    readonly width: number
    /**视频高度 */
    readonly height: number
    /** 媒体比例 */
    readonly sar: Sar
}
/** 判断是否符合  Representation类型 */
export const isRepresentation = (r: unknown): r is Representation => {

    return (
        !!r && typeof r === "object" &&
        typeof Reflect.get(r, "id") === "string" &&
        typeof Reflect.get(r, "startTime") === "number" &&
        typeof Reflect.get(r, "duration") === "number"  &&
        typeof Reflect.get(r, "codecs") === "string" &&
        typeof Reflect.get(r, "mimeType") === "string" &&
        typeof Reflect.get(r, "bandwidth") === "number" &&
        typeof Reflect.get(r, "width") === "number" &&
        typeof Reflect.get(r, "height") === "number" &&
        Object.values(Sar).includes(Reflect.get(r, "sar"))
    )
}

/** 视频比例 计算方法 */
export const getSar = (width: number, height: number): Sar => {
    width = Number.isInteger(width) ? width : 0
    height = Number.isInteger(height) ? height : 0
    // 计算给定宽高的比例
    const ratio = width / height;
    // 定义16:9 和 16:10的比例
    const ratio16by9 = 16 / 9;
    const ratio16by10 = 16 / 10;

    // 计算与这两个比例的差值
    const diff16by9 = Math.abs(ratio - ratio16by9);
    const diff16by10 = Math.abs(ratio - ratio16by10);

    // 根据差值选择最接近的比例
    if (diff16by9 < diff16by10) {
        return Sar.SixteenByNine;
    } else if (diff16by10 < diff16by9) {
        return Sar.SixteenByTen;
    } else {
        return Sar.Unknown; // 如果差值相等或者未能接近任何比率，返回 Unknown
    }
}
/** 视频比例  枚举*/
export enum Sar {
    /** 未知比例 */
    Unknown = "Unknown",
    /** 16:9 */
    SixteenByNine = "16:9",
    /** 16:10 */
    SixteenByTen = "16:10",
} 
