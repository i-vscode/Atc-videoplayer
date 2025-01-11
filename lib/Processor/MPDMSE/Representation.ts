import { Representation, Sar } from "@lib";
import { SourceBufferTask } from "./SourceBufferTask";

/** 解析 Initialization*/
export const parseInitialization = (repid: string, segmentElement?: Element | null) => {
    const attributeValue = segmentElement?.getAttribute("initialization") ||
        segmentElement?.getElementsByTagName("Initialization")?.[0].getAttribute("sourceURL")
    return attributeValue ? attributeValue.replace("$RepresentationID$", repid) : undefined
}

type RangeTimeURLType = Readonly<{
    startTime: number,
    endTime: number,
    url: string
}>
export const parseSegmentFromRangeTimeStringURLs = (() => {
    const mediaReg = /\$Number%(\d+)d\$/;
    /** 除法结果四舍五入到整数 */
    const divideAndRound = (dividend: number | string | null, divisor: number | string | null) => {
        dividend = typeof dividend === "string" ? parseInt(dividend) : dividend;
        divisor = typeof divisor === "string" ? parseInt(divisor) : divisor; 0
        return Math.round((dividend ?? 0) / (divisor ?? 0))
    }
    const parseSegmentTemplateFromRangeTimeStringURLs = (repid: string, mediaPresentationDuration: number, segmentTemplateElement: Element) => {
        const media = segmentTemplateElement.getAttribute("media")?.replace("$RepresentationID$", repid)
        const mediaRegExecArray = mediaReg.exec(media ?? "")
        const timescale = parseInt(segmentTemplateElement.getAttribute("timescale") ?? "")
        let startNumber = parseInt(segmentTemplateElement.getAttribute("startNumber") ?? "")
        const sElement = Array.from(segmentTemplateElement.getElementsByTagName("S"))
        const rangeTimeURLs = new Array<RangeTimeURLType>();
        if (Number.isFinite(timescale) && Number.isInteger(startNumber) && mediaPresentationDuration && mediaRegExecArray && media) {
            const mediaRegExecNumber = parseInt(mediaRegExecArray[1])
            let duration = divideAndRound(segmentTemplateElement.getAttribute("duration"), timescale)
            if (duration) {
                for (startNumber; startNumber * duration < mediaPresentationDuration + duration; startNumber++) {
                    rangeTimeURLs.push(Object.freeze({
                        startTime: startNumber * duration - duration,
                        endTime: startNumber * duration,
                        url: media.replace(mediaRegExecArray[0], (startNumber.toString().padStart(mediaRegExecNumber, "0")))
                    }))
                }
            } else if (sElement.length > 0) {
                duration = divideAndRound(sElement.at(0)?.getAttribute("t") ?? NaN, timescale);
                for (const s of sElement) {
                    const sduration = divideAndRound(s.getAttribute("d"), timescale)
                    let srepeat = divideAndRound(s.getAttribute("r"), 1)
                    srepeat = Number.isInteger(srepeat) && srepeat > 0 ? srepeat + 1 : 1
                    if (Number.isFinite(sduration) && Number.isFinite(duration)) {
                        while (srepeat-- > 0) {
                            rangeTimeURLs.push(Object.freeze({
                                startTime: duration,
                                endTime: sduration + duration,
                                url: media.replace(mediaRegExecArray[0], (startNumber++).toString().padStart(mediaRegExecNumber, "0"))
                            }))
                            duration += sduration;
                        }
                    } else { return new Array<RangeTimeURLType>() }
                }
            }
        }
        return rangeTimeURLs
    }
    const parseSegmentListFromRangeTimeStringURLs = (repid: string, segmentTemplate: Element) => {
        return new Array<RangeTimeURLType>()
    }
    return (repid: string, mediaPresentationDuration: number, segmentElement?: Element | null): Array<RangeTimeURLType> => {
        if (segmentElement?.localName === "SegmentTemplate") {
            return parseSegmentTemplateFromRangeTimeStringURLs(repid, mediaPresentationDuration, segmentElement)
        } else if (segmentElement?.localName === "SegmentList") {
            return parseSegmentListFromRangeTimeStringURLs(repid, segmentElement)
        }
        return new Array<RangeTimeURLType>()
    }
})()

/** 分段文件类 */
class Segment {
    #rangeTimeURLs: Array<RangeTimeURLType>
    #initialization?: string
    get initialization() { return this.#initialization }
    constructor(repId: string, mediaPresentationDuration: number, segmentElement?: Element | null,) {
        this.#initialization = parseInitialization(repId, segmentElement);
        this.#rangeTimeURLs = parseSegmentFromRangeTimeStringURLs(repId, mediaPresentationDuration, segmentElement)
    }
    /** 时间是否为属于最后一个分段文件范围内 */
    isLastFile(time: number) {
        const r = this.#rangeTimeURLs.at(-1);
        return r ? (time >= r.startTime && time <= r.endTime) ? true : false : true
    }
    getSegmentFiles(startTime: number, endTime: number) {
        const urls = new Array<string>()
        for (const r of this.#rangeTimeURLs) {
            if (r.startTime > endTime) break
            if (startTime <= r.endTime && endTime >= r.startTime) {
                urls.push(r.url)
            }
        }
        return urls
    }
}

/** 适配描述 */
export class RepresentationMPD implements Representation {
    #id = ""
    get id() { return this.#id }
    #start = 0
    get start() { return this.#start }
    #codecs = "avc1.64081f"
    get codecs() { return this.#codecs }
    #mimeType = ""
    get mimeType() { return this.#mimeType }
    #bandwidth = Infinity
    get bandwidth() { return this.#bandwidth }
    #width = 0
    get width(): number { return this.#width; }
    #height = 0
    get height(): number { return this.#height }
    #sar: Sar = Sar.Unknown
    get sar(): string { return this.#sar }
    constructor(repElement: Element, s: SourceBufferTask, segmentElement?: Element) {
        for (const attr of repElement.attributes) {
            switch (attr.localName) {
                case "id":
                    this.#id = attr.value
                    break;
                case "mimeType":
                    this.#mimeType = attr.value
                    break;
                case "codecs":
                    this.#codecs = attr.value
                    break;
                case "bandwidth":
                    this.#bandwidth = Number.parseInt(attr.value)
                    break;
            }
        }
        this.#segment = new Segment(this.id, s.duration,
            repElement.getElementsByTagName("SegmentTemplate")?.[0] ||
            repElement.getElementsByTagName("SegmentList")?.[0] ||
            segmentElement)

        this.setRep = (option) => s.setRep(this, option)
    }
    #segment: Segment;
    get initialization() { return this.#segment.initialization }
    getSegmentFiles(startTime: number, endTime: number) { return this.#segment.getSegmentFiles(startTime, endTime) }
    /** 时间是否为属于最后一个分段文件范围内 */
    isLastFile(time: number) { return this.#segment.isLastFile(time); }
    setRep: Representation["setRep"]
}
