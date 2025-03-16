/** 范围时间段文件类型 */
export type RangeTimeType = Readonly<{
    startTime: number;
    endTime: number;
    startByteRange: number;
    endByteRange: number;
}>;
/** 分段文件类 */
export declare class Segment {
    #private;
    get duration(): number;
    constructor(initSidxMetadataArrayBuffer: ArrayBuffer, byteOffset: number);
    /** 获取媒体时间段范围 */
    getMediaRangeSet(startTime: number, endTime: number): Set<Readonly<{
        startTime: number;
        endTime: number;
        startByteRange: number;
        endByteRange: number;
    }>>;
}
