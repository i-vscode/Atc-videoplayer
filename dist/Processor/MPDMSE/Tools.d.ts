/** 解析 PT时间字符串段转换为秒 */
export declare const parsePTdurationToSeconds: (PT?: unknown, defaultValue?: number) => number;
/** 解析 Initialization*/
export declare const parseInitialization: (repid: string, segmentElement?: Element | null) => string | undefined;
type RangeTimeURLType = Readonly<{
    startTime: number;
    endTime: number;
    url: string;
}>;
export declare const parseSegmentFromRangeTimeStringURLs: (repid: string, mediaPresentationDuration: number, segmentElement?: Element | null) => Array<RangeTimeURLType>;
export {};
