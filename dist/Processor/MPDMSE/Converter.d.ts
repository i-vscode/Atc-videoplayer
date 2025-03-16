/**
 * 转换返回类型
 */
export type MPDConverterReturnType = Promise<Map<string, URL | undefined>>;
/** MPD 转换器Type */
export type MPDConverter = {
    mpd: URL;
    asyncConverter?: (keys: Iterable<string>) => MPDConverterReturnType;
} | {
    mpd: string;
    asyncConverter: (keys: Iterable<string>) => MPDConverterReturnType;
};
/** MPD 默认转换器 */
export declare class MPDDefaultConverter {
    /** 转换器 */
    asyncConverter: (keys: Array<string>) => MPDConverterReturnType;
    /** mpd  Response 请求响应  */
    asyncResponse: () => Promise<Response>;
    constructor(p: URL | string | MPDConverter);
    static canParse(p: unknown): p is MPDConverter;
    /** 解析 Object To MPDConverter对象  */
    static parse(p: unknown): MPDDefaultConverter | undefined;
}
