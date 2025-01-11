
/** PT时间段转换为秒 */
export const PTdurationToSeconds = (() => {
    /** PT时间类正则 */
    const reptms = /^PT(?:(\d+\.*\d*)H)?(?:(\d+\.*\d*)M)?(?:(\d+\.*\d*)S)?$/;
    return (PT?: unknown) => {
        let hours = 0, minutes = 0, seconds = 0
        if (typeof PT === "string") {
            if (reptms.test(PT)) {
                var matches = reptms.exec(PT);
                if (matches?.[1]) hours = Number(matches[1]);
                if (matches?.[2]) minutes = Number(matches[2]);
                if (matches?.[3]) seconds = Number(matches[3]);
                return Number((hours * 3600 + minutes * 60 + seconds).toFixed(2));
            }
        }
        return typeof PT === "number" && isFinite(PT) && PT > 0 ? PT : NaN
    }
})()

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