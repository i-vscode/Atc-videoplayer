import { PlayerError } from "@lib"

const contentTypeDash = /DASH/i;

/** MPD转换器 */
export type MPDConverter = { mpd: URL, asyncConverter?: () => Promise<Map<string, URL>> } |
{ mpd: string, asyncConverter: () =>Promise<Map<string, URL>> }

/** MPD转换器 */
export class Converter {
    /** 转换器 */
    asyncConverter: (keys: string[]) => Promise<Map<string, URL>>
    /** mpd  Response 请求响应  */
    asyncResponse: () => Promise<Response> = async () => new Response()
    constructor(p: URL | string | MPDConverter) {
        if (Converter.canParse(p)) {
            const mpd = typeof p === "string" || p instanceof URL ? URL.parse(p) || p : typeof p.mpd === "string" || p.mpd instanceof URL ? URL.parse(p.mpd) || p.mpd : p.mpd
            if (mpd instanceof URL) {
                this.asyncConverter = p.asyncConverter ||  (async (keys: string[]) => {
                    const urlMap = new Map<string, URL>()
                    Array.isArray(keys) && keys.forEach(key => {
                        const url = URL.parse(key, mpd)
                        if (url) { urlMap.set(key, url) }
                    })
                    return urlMap
                })
                this.asyncResponse = () => fetch(mpd)
            } else if (typeof mpd === "string") {
                this.asyncConverter = p.asyncConverter!
                this.asyncResponse = async () => {
                    return Promise.resolve(this.asyncConverter([mpd])).then(urlmap => {
                        const url = urlmap.get(mpd)
                        return url && fetch(url) ||  new Response()
                    })
                }
            } else {
                this.asyncConverter = async (_keys) => new Map<string, URL>()
              //  this.asyncResponse = async () => undefined
            }
            Object.isFrozen(this)
            return
        }
        throw new PlayerError(2, "MPDConverter : mpd or converter is undefined")
    }
    static canParse(p: unknown): p is MPDConverter {
        if (p instanceof URL 
            || (typeof p === "string" && URL.canParse(p)) 
            || (p instanceof Response && p.ok && contentTypeDash.test(p.headers.get("content-type") ?? ""))) return true;
        const mpdConverter = p as MPDConverter;
        return mpdConverter.mpd instanceof URL ||
            (typeof mpdConverter.mpd === "string" && (URL.canParse(mpdConverter.mpd) || typeof mpdConverter.asyncConverter === "function"))
            ? true : false
    }
    /** 解析 Object To MPDConverter对象  */
    static parse(p: unknown) {
        try {
            return new Converter(p as MPDConverter)
        } catch {
            return undefined
        }
    }
}
