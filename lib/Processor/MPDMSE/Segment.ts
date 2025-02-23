import { divideAndRound, Representation } from "@lib"
import { MPDRepresentation } from "./Representation"

/** 范围时间段文件类型 */
export type RangeTimeFileType = Readonly<{
    startTime: number,
    endTime: number,
    file: string
}>
const parseInitialization = (repid: string, segmentElement?: Element | null) : RangeTimeFileType | undefined => {   
    const attributeValue = segmentElement?.getAttribute("initialization") ||
        segmentElement?.getElementsByTagName("Initialization")?.[0].getAttribute("sourceURL")
    return attributeValue ? {startTime:0,endTime:0,file: attributeValue.replace("$RepresentationID$", repid)} : undefined
}

const parseSegmentFromRangeTimeStringURLs = (() => {
    const mediaReg = /\$Number%(\d+)d\$/;
 
    const parseSegmentTemplateFromRangeTimeStringURLs = (repid: string, mediaPresentationDuration: number, segmentTemplateElement: Element) => {
        const media = segmentTemplateElement.getAttribute("media")?.replace("$RepresentationID$", repid)
        const mediaRegExecArray = mediaReg.exec(media ?? "")
        const timescale = parseInt(segmentTemplateElement.getAttribute("timescale") ?? "")
        let startNumber = parseInt(segmentTemplateElement.getAttribute("startNumber") ?? "")
        const sElement = Array.from(segmentTemplateElement.getElementsByTagName("S"))
        const rangeTimeURLs = new Array<RangeTimeFileType>();
        if (Number.isFinite(timescale) && Number.isInteger(startNumber) && mediaPresentationDuration && mediaRegExecArray && media) {
            const mediaRegExecNumber = parseInt(mediaRegExecArray[1])
            let duration = divideAndRound(segmentTemplateElement.getAttribute("duration"), timescale)
            if (duration) {
                for (startNumber; startNumber * duration < mediaPresentationDuration + duration; startNumber++) {
                    rangeTimeURLs.push(Object.freeze({
                        startTime: startNumber * duration - duration,
                        endTime: startNumber * duration,
                        file: media.replace(mediaRegExecArray[0], (startNumber.toString().padStart(mediaRegExecNumber, "0")))
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
                                file: media.replace(mediaRegExecArray[0], (startNumber++).toString().padStart(mediaRegExecNumber, "0"))
                            }))
                            duration += sduration;
                        }
                    } else { return new Array<RangeTimeFileType>() }
                }
            }
        }
        return rangeTimeURLs
    }
    const parseSegmentListFromRangeTimeStringURLs = (repid: string, segmentTemplate: Element) => {
        return new Array<RangeTimeFileType>()
    }
    return (repid: string, mediaPresentationDuration: number, segmentElement?: Element | null): Array<RangeTimeFileType> => {
        if (segmentElement?.localName === "SegmentTemplate") {
            return parseSegmentTemplateFromRangeTimeStringURLs(repid, mediaPresentationDuration, segmentElement)
        } else if (segmentElement?.localName === "SegmentList") {
            return parseSegmentListFromRangeTimeStringURLs(repid, segmentElement)
        }
        return new Array<RangeTimeFileType>()
    }
})()

/** 分段文件类 */
export class Segment {
    #rangeTimeURLs: Array<RangeTimeFileType>
    #initialization?: RangeTimeFileType
    get initialization() { return this.#initialization }
    constructor(representation: MPDRepresentation, segmentElement?: Element | null,) {
        this.#initialization = parseInitialization(representation.id, segmentElement);        
        this.#rangeTimeURLs = parseSegmentFromRangeTimeStringURLs(representation.id, representation.duration, segmentElement)
    }
    /** 时间是否为属于最后一个分段文件范围内 */
    isLastFile(rangeTimeOrTime: number | RangeTimeFileType) {
        const r = this.#rangeTimeURLs.at(-1);        
        return r ? (typeof rangeTimeOrTime === "number"  && (rangeTimeOrTime >= r.endTime || (rangeTimeOrTime >= r.startTime && rangeTimeOrTime <= r.endTime))) ||  rangeTimeOrTime === r ? true : false: true
    }
    /** 获取时间段范围文件 */
    getRangeTimeFiles(startTime: number, endTime: number) {
        
        const urls = new Array<RangeTimeFileType>()
        for (const r of this.#rangeTimeURLs) {
            if (r.startTime > endTime) break
            if (startTime <= r.endTime && endTime >= r.startTime) {
                urls.push(r)
            }
        }
        return urls
    }
}
