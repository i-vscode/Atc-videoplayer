/** 分段化mp4 配置对象 */
export type FragmentMp4Config = {
    baseUrl: string;
    duration?: string | number;
    media: {
        [key in string]: Array<FragmentMp4Representation>;
    };
};
/** FragmentMp4Config 的适合集描述 */
export type FragmentMp4Representation = {
    id: string;
    codecs: string;
    bandwidth: string | number;
    mimeType: string;
    url: string;
    initEndRange: string | number;
    sidxEndRange: string | number;
    width?: string | number;
    height?: string | number;
};
/** 正常序列化后的 分段化mp4 配置对象*/
export type NormalFragmentMp4Config = {
    baseUrl: URL;
    duration: number;
    media: {
        [key in string]: Array<NormalFragmentMp4Representation>;
    };
};
/** 正常序列化后的 分段化mp4 配置对象 的适合集描述*/
export type NormalFragmentMp4Representation = Pick<FragmentMp4Representation, 'id' | "codecs" | "mimeType"> & {
    duration: number;
    bandwidth: number;
    initEndRange: number;
    sidxEndRange: number;
    width: number;
    height: number;
    url: URL;
};
/**
 * 检查是否为 分段化mp4 配置对象
 */
export declare const isFragmentMp4Config: (fragmentMp4Config: unknown) => fragmentMp4Config is FragmentMp4Config;
/**
 * 创建 正常化 分段化mp4 配置对象
 * @param fragmentMp4Config
 * @returns
 */
export declare const createNormalFragmentMp4Config: (fragmentMp4Config: unknown) => NormalFragmentMp4Config | undefined;
