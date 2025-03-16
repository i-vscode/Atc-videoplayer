import { MPDRepresentation } from './Representation';

/** 范围时间段文件类型 */
export type RangeTimeFileType = Readonly<{
    startTime: number;
    endTime: number;
    file: string;
}>;
/** 分段文件类 */
export declare class Segment {
    #private;
    get initialization(): Readonly<{
        startTime: number;
        endTime: number;
        file: string;
    }> | undefined;
    constructor(representation: MPDRepresentation, segmentElement?: Element | null);
    /** 时间是否为属于最后一个分段文件范围内 */
    isLastFile(rangeTimeOrTime: number | RangeTimeFileType): boolean;
    /** 获取时间段范围文件 */
    getRangeTimeFiles(startTime: number, endTime: number): Readonly<{
        startTime: number;
        endTime: number;
        file: string;
    }>[];
}
