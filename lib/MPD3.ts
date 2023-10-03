import { MpdType } from "./e";


const reptms = /^PT(?:(\d+\.*\d*)H)?(?:(\d+\.*\d*)M)?(?:(\d+\.*\d*)S)?$/;
/** PT时间段转换为秒 */
function PTdurationToSeconds(PT?: string) :number{
    let hours = 0, minutes = 0, seconds = 0
    if (PT) {
        if (reptms.test(PT)) {
            var matches = reptms.exec(PT);
            if (matches?.[1]) hours = Number(matches[1]);
            if (matches?.[2]) minutes = Number(matches[2]);
            if (matches?.[3]) seconds = Number(matches[3]);
            // return  (hours * 3600 + minutes * 60 + seconds);
             return  Number((hours * 3600 + minutes * 60 + seconds).toFixed(2)) ;
        }
    }
    return NaN
}

const defineProperty = (target: object, attr: Attr) => {
    let value: any = attr.value;
    switch (attr.localName) {
        case "minBufferTime":
        case "mediaPresentationDuration":
        case "start":
            value = PTdurationToSeconds(value);
            break;
        case "duration":
        case "startNumber":
        case "timescale":
        case "width":
        case "height":
        case "maxHeight":
        case "bandwidth":
            value = Number.parseInt(value)
            break;
        case "value":
            if (attr.ownerElement?.localName === "AudioChannelConfiguration") value = Number.parseInt(value)
            break;
        case "segmentAlignment":
        case "bitstreamSwitching":
            value = !!value.
                break
    }
    Reflect.defineProperty(target, attr.localName, { value: value, writable: false, enumerable: true, configurable: false })
}
const attributes = (target: object, source: Element) => {
    for (const attr of source.attributes) {
        defineProperty(target, attr)
    }
}
const defineChildren = (target: { [x: string]: any }, el: Element, elname?: string) => {
    elname ??= el.localName
    if (el.childElementCount === 0 && el.attributes.length === 0 && el.firstChild?.nodeType === 3 && el.lastChild?.nodeType === 3) {
        Reflect.defineProperty(target, elname, { value: el.textContent, writable: false, enumerable: true, configurable: false })
    } else {
        const ch = {}
        attributes(ch, el)
        childrens(ch, el)
        switch (elname) {
            case "Representation":
                Reflect.defineProperty(ch, "mediaType", { value: target.contentType, writable: false, enumerable: true, configurable: false })
                break;
        }
        if (target?.[el.localName] instanceof Array) {
            Reflect.get(target, elname)?.push(ch)
        }
        else {
            Reflect.defineProperty(target, elname, { value: ch, writable: false, enumerable: true, configurable: false })
        }
    }
}
/**  AdaptationSet 节点元素处理 */
const adaptationSetChildren = (target: object, el: Element) => {
    const contentType = el.attributes.getNamedItem("contentType")?.value
    switch (contentType) {
        case "video":
            defineChildren(target, el, "AdaptationSetVideo")
            break;
        case "audio":
            defineChildren(target, el, "AdaptationSetAudio")
            break
        case "image":
            defineChildren(target, el, "AdaptationSetImage")
            break
    }
}
const childrens = (target: object, source: Element) => {
    for (const iterator of source.children) {
        switch (iterator.localName) {
            case "Period":
            case "Representation":
                if (!(Reflect.get(target, iterator.localName) instanceof Array)) {
                    Reflect.defineProperty(target, iterator.localName, {
                        value: [],
                        writable: false, enumerable: true, configurable: false
                    })
                }
                break;
            case "AdaptationSet":
                adaptationSetChildren(target, iterator)
                continue
        }
        defineChildren(target, iterator)
    }
}
/** MPD清单文件处理类 */
export class MPD3 implements MpdType {
    constructor(mpdstring: string) {
        const mpd = new DOMParser().parseFromString(mpdstring, "text/xml").documentElement;
        attributes(this, mpd)
        childrens(this, mpd)
    }
    next() {
        return this.Period[Symbol.iterator]().next().value
    }
    minBufferTime: number = NaN;
    mediaPresentationDuration: number = Infinity;
    Period!: MpdType["Period"];

}
