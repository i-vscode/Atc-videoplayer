/** 分段化mp4 配置对象 */
export type FragmentMp4Config = {
    baseUrl: string,
    duration?: string | number,
    media: {
        [key in string]: Array<FragmentMp4Representation>
    },
}
/** FragmentMp4Config 的适合集描述 */
export type FragmentMp4Representation = {
    id: string,
    codecs: string,
    bandwidth: string | number,
    mimeType: string,
    url: string,
    initEndRange: string | number,
    sidxEndRange: string | number,
    width?: string | number,
    height?: string | number,
}
/** 正常序列化后的 分段化mp4 配置对象*/
export type NormalFragmentMp4Config = {
    baseUrl: URL,
    duration: number,
    media: {
        [key in string]: Array<NormalFragmentMp4Representation>
    },
}
/** 正常序列化后的 分段化mp4 配置对象 的适合集描述*/
export type NormalFragmentMp4Representation = Pick<FragmentMp4Representation, 'id' | "codecs" | "mimeType"> & {
    duration: number,
    bandwidth: number,
    initEndRange: number,
    sidxEndRange: number,
    width: number,
    height: number,
    url: URL,
}
const isFragmentMp4ConfigRepresentation = (reps: unknown, fragmentMp4Config: Object): reps is Array<FragmentMp4Representation> => {
    const url = Reflect.get(fragmentMp4Config, "baseUrl")
    if (reps && Array.isArray(reps)) {
        return reps.every(rep => {
            const bandwidth = Number.parseInt(Reflect.get(rep, "bandwidth"))
            const initEndRange = Number.parseInt(Reflect.get(rep, "initEndRange"))
            const sidxEndRange = Number.parseInt(Reflect.get(rep, "sidxEndRange"))
            return (typeof Reflect.get(rep, "id") === "string"
                && typeof Reflect.get(rep, "codecs") === "string"
                && typeof Reflect.get(rep, "mimeType") === "string"
                && (Number.isInteger(bandwidth) && bandwidth > 0)
                && URL.canParse(Reflect.get(rep, "url"), url)
                && (Number.isInteger(initEndRange) && initEndRange > 0)
                && (Number.isInteger(sidxEndRange) && sidxEndRange > 0)
                && (Reflect.has(rep, "width") ? typeof Reflect.get(rep, "width") === "number" : typeof Reflect.get(rep, "width") === "undefined")
                && (Reflect.has(rep, "height") ? typeof Reflect.get(rep, "height") === "number" : typeof Reflect.get(rep, "height") === "undefined")
            )
        })
    }
    return false;
}
const isFragmentMp4ConfigMedia = (media: unknown, fragmentMp4Config: Object): media is FragmentMp4Config["media"] => {
    if (media && typeof media === "object") {
        return Object.entries(media).every(([k, v]) => typeof k === "string" && isFragmentMp4ConfigRepresentation(v, fragmentMp4Config))
    }
    return false;
}

/**
 * 检查是否为 分段化mp4 配置对象
 */
export const isFragmentMp4Config = (fragmentMp4Config: unknown): fragmentMp4Config is FragmentMp4Config => {      
    if (!fragmentMp4Config || typeof fragmentMp4Config !== "object") return false
    if (!URL.canParse(Reflect.get(fragmentMp4Config, "baseUrl"))) return false  
    if (!isFragmentMp4ConfigMedia(Reflect.get(fragmentMp4Config, "media"), fragmentMp4Config)) return false
    return true
}
// 创建正常化的 NormalFragmentMp4Representation
const createNormalFragmentMp4ConfigMediaRepresentation = (rep: FragmentMp4Representation, normalFragmentMp4Config: NormalFragmentMp4Config) => {
    const normalRep: NormalFragmentMp4Representation = {
        ...rep,
        duration: normalFragmentMp4Config.duration,
        url: new URL(rep.url, normalFragmentMp4Config.baseUrl),
        bandwidth: Number.parseInt(rep.bandwidth.toString()),
        initEndRange: Number.parseInt(rep.initEndRange.toString()),
        sidxEndRange: Number.parseInt(rep.sidxEndRange.toString()),
        width: Number.parseInt(rep.width?.toString() as string),
        height: Number.parseInt(rep.height?.toString() as string),
    }


    return normalRep
}
/**
 * 创建 正常化 分段化mp4 配置对象
 * @param fragmentMp4Config 
 * @returns 
 */
export const createNormalFragmentMp4Config = (fragmentMp4Config: unknown) => { 
    if (isFragmentMp4Config(fragmentMp4Config)) {
        const normalFragmentMp4Representation: NormalFragmentMp4Config = {
            duration: Number.parseInt(fragmentMp4Config.duration?.toString() ?? ""),
            baseUrl: new URL(fragmentMp4Config.baseUrl),
            media: {}
        }
        if (!Number.isFinite(normalFragmentMp4Representation.duration)) {
            normalFragmentMp4Representation.duration = Infinity
        }
        normalFragmentMp4Representation.media = Object.fromEntries(Object.entries(fragmentMp4Config.media).map(([k, v]) => {
            return [k, v.map(rep => createNormalFragmentMp4ConfigMediaRepresentation(rep, normalFragmentMp4Representation))]
        }))
        return normalFragmentMp4Representation
    }
}

