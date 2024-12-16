

import { PlayerOptions, QualityTab, PlayerError, Processor, Sar } from "../Player-Options"
import type { ProcessorType, Representation } from "../Player-Options"


/** PT时间段转换为秒 */
const PTdurationToSeconds = (() => {
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
const parseInitializationURL = (repid: string, url: URL, segmentElement?: Element | null) => {
    const attributeValue = segmentElement?.getAttribute("initialization") ||
        segmentElement?.getElementsByTagName("Initialization")?.[0].getAttribute("sourceURL")
    return attributeValue ? new URL(attributeValue.replace("$RepresentationID$", repid), url) : undefined
}
const parseSegmentForMap = (() => {
    const mediaReg = /\$Number%(\d+)d\$/;
    /** 除法结果四舍五入到整数 */
    const divideAndRound = (dividend: number | string | null, divisor: number | string | null) => {
        dividend = typeof dividend === "string" ? parseInt(dividend) : dividend;
        divisor = typeof divisor === "string" ? parseInt(divisor) : divisor; 0
        return Math.round((dividend ?? 0) / (divisor ?? 0))
    }
    const parseSegmentTemplateForMap = (repid: string, url: URL, mediaPresentationDuration: number, segmentTemplateElement: Element) => {
        const media = segmentTemplateElement.getAttribute("media")?.replace("$RepresentationID$", repid)
        const mediaRegExecArray = mediaReg.exec(media ?? "")
        const timescale = parseInt(segmentTemplateElement.getAttribute("timescale") ?? "")
        let startNumber = parseInt(segmentTemplateElement.getAttribute("startNumber") ?? "")
        const sElement = Array.from(segmentTemplateElement.getElementsByTagName("S"))
        const map = new Map<[number, number], URL>();
        if (Number.isFinite(timescale) && Number.isInteger(startNumber) && mediaPresentationDuration && mediaRegExecArray && media) {
            const mediaRegExecNumber = parseInt(mediaRegExecArray[1])
            let duration = divideAndRound(segmentTemplateElement.getAttribute("duration"), timescale)
            if (duration) {
                for (startNumber; startNumber * duration < mediaPresentationDuration + duration; startNumber++) {
                    map.set([startNumber * duration - duration, startNumber * duration],
                        new URL(media.replace(mediaRegExecArray[0], (startNumber.toString().padStart(mediaRegExecNumber, "0"))), url))
                }
            } else if (sElement.length > 0) {
                duration = divideAndRound(sElement.at(0)?.getAttribute("t") ?? NaN, timescale);
                for (const s of sElement) {
                    const sduration = divideAndRound(s.getAttribute("d"), timescale)
                    let srepeat = divideAndRound(s.getAttribute("r"), 1)
                    srepeat = Number.isInteger(srepeat) && srepeat > 0 ? srepeat + 1 : 1
                    if (Number.isFinite(sduration) && Number.isFinite(duration)) {
                        while (srepeat-- > 0) {
                            map.set([duration, sduration + duration],
                                new URL(media.replace(mediaRegExecArray[0], ((startNumber++).toString().padStart(mediaRegExecNumber, "0"))), url));
                            duration += sduration;
                        }
                    } else { map.clear(); return map }
                }
            }
        }
        return map
    }
    const parseSegmentListForMap = (repid: string, url: URL, segmentTemplate: Element) => {
        return new Map<[number, number], URL>()
    }
    return (repid: string, url: URL, mediaPresentationDuration: number, segmentElement?: Element | null) => {
        if (segmentElement?.localName === "SegmentTemplate") {
            return parseSegmentTemplateForMap(repid, url, mediaPresentationDuration, segmentElement)
        } else if (segmentElement?.localName === "SegmentList") {
            return parseSegmentListForMap(repid, url, segmentElement)
        }
        return new Map<[number, number], URL>()
    }
})()

/** 分段文件类 */
class Segment {
    #mpa: Map<[number, number], URL>
    #initializationURL?: URL
    get initializationURL() { return this.#initializationURL }
    constructor(repId: string, url: URL, mediaPresentationDuration: number, segmentElement?: Element | null,) {
        this.#initializationURL = parseInitializationURL(repId, url, segmentElement);
        this.#mpa = parseSegmentForMap(repId, url, mediaPresentationDuration, segmentElement)

    }
    getSegmentRangeURLs(startTime: number, endTime: number) {
        const urls = new Array()

        for (const [range, value] of this.#mpa) {
            const [rangeStart, reangeEnd] = range;
            // console.log("Segment--getSegmentURLs --- if", startTime, endTime);
            if (rangeStart > endTime) break
            if (startTime <= reangeEnd && endTime >= rangeStart) {
                urls.push(value)
            }
        }
        // console.group("Segment--getSegmentURLs --- return", startTime, endTime);
        // console.log(urls);
        // console.log(this.#mpa);
        // console.groupEnd();
        return urls
    }
}



/** 适配描述 */
class RepresentationMPD implements Representation {
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
    constructor(url: URL, repElement: Element, s: SourceBufferTask, segmentElement?: Element) {
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
            }
        }
        this.#segment = new Segment(this.id, url, s.duration,
            repElement.getElementsByTagName("SegmentTemplate")?.[0] ||
            repElement.getElementsByTagName("SegmentList")?.[0] ||
            segmentElement)
        this.setRep = () => s.setRep(this)
    }
    #segment: Segment;
    get initializationURL() { return this.#segment.initializationURL }
    getSegmentRangeURLs(startTime: number, endTime: number) { return this.#segment.getSegmentRangeURLs(startTime, endTime) }
    setRep: () => boolean
}

/** SourceBuffer 为 ArrayBuffer 添加任务获取 */
class SourceBufferAddTaskFetchForArrayBuffer {
    #map = new Map<URL, any>()
    #arrayBuffers = new Array<ArrayBuffer>()
    #sourceBuffer: SourceBuffer
    #sourceclose: boolean = false
    get sourceBuffer() { return this.#sourceBuffer }
    constructor(sourceBuffer: SourceBuffer) {
        this.#sourceBuffer = sourceBuffer
        this.#sourceBuffer.addEventListener("updateend", () => {
            console.log("uppd");

            this.#run()
        })
    }
    sourceclose() {
        this.#sourceclose = true;
        this.#map.clear()
    }
    #run(a?: ArrayBuffer) {
        a = a ? a : this.#arrayBuffers.shift()
        if (a && this.#sourceclose === false) {
            if (this.#sourceBuffer.updating === false) {
                this.#sourceBuffer.appendBuffer(a)
            } else {
                this.#arrayBuffers.push(a)
            }
        }
    }
    #set(url?: URL) {
        if (url instanceof URL && !this.#map.has(url)) {
            this.#map.set(url, fetch(url)
                .then(async r => { this.#run(await r.arrayBuffer()) })
                .finally(() => { this.#map.delete(url) }))
        }
    }
    add(urls?: Array<URL> | URL) {
        if (Array.isArray(urls)) {
            urls.forEach(url => this.#set(url))
        } else { this.#set(urls) }
    }
    changeType(type: string) { return this.#sourceBuffer.changeType(type) }
}
/** 源缓存任务类 */
class SourceBufferTask {
    #sTask: SourceBufferAddTaskFetchForArrayBuffer
    #repSet = new Set<RepresentationMPD>()
    #currentRep?: RepresentationMPD
    #mse: MediaSource
    get duration() { return this.#mse.duration }
    constructor(mse: MediaSource) {
        this.#mse = mse
        this.#sTask = new SourceBufferAddTaskFetchForArrayBuffer(mse.addSourceBuffer(`video/mp4; codecs="avc1.64001f"`))
        mse.addEventListener("sourceclose", () => this.#sTask.sourceclose(), { once: true })
    }
    /** 源缓存更新 */
    async sourceBufferUpdate(currentTime: number, minBufferTime: number) {
        const timeRanges = this.#sTask.sourceBuffer.buffered;
        let be = currentTime
        minBufferTime = currentTime + minBufferTime; 
        for (let index = 0; index < timeRanges.length; index++) {
            console.group("SourceBufferTask", currentTime);
            console.log(timeRanges.start(index), timeRanges.end(index));
            console.groupEnd();
            if (currentTime >= timeRanges.start(index) && currentTime <= timeRanges.end(index)) {
                currentTime = timeRanges.end(index);
                minBufferTime = minBufferTime - currentTime;
                be = be + (timeRanges.end(index) - timeRanges.start(index))
                break
            }
        }
        console.log("SourceBufferTask-sourceBufferUpdate", currentTime, minBufferTime, this.#mse.duration);
        this.#sTask.add(this.#currentRep?.getSegmentRangeURLs(currentTime, minBufferTime))
        return be >= this.#mse.duration ? false : true
    }
    clearReps() {
        this.#currentRep = undefined
        this.#repSet.clear();
        return this
    }
    addReps(url: URL, adaptationSetElement: Element) {
        for (const repElement of Array.from(adaptationSetElement.getElementsByTagName("Representation"))) {
            this.#repSet.add(new RepresentationMPD(url, repElement, this, adaptationSetElement.getElementsByTagName("SegmentTemplate")?.[0]))
        }
    }
    /**
     * 设置rep
     */
    setRep(rep: RepresentationMPD) {
        if (this.#currentRep === rep) return true;
        if (this.#repSet.has(rep) && rep.initializationURL) {
            this.#sTask.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`)
            this.#sTask.add(rep.initializationURL);
            this.#currentRep = rep;
            return true
        }
        return false
    }
    getRepList() { return Array.from(this.#repSet.values()) }

}
/** 源缓存任务映射集合 */
class SourceBufferTaskCollection {
    #map = new Map<string, SourceBufferTask>();
    #mse = new MediaSource();
    #url: URL;
    #el: HTMLMediaElement;
    constructor(url: URL, el: HTMLMediaElement) {
        this.#url = url
        this.#el = el;
    }
    sourceBufferUpdate(currentTime: number, minBufferTime: number) {
        let isBufferUpdate = true
       // if (this.#mse.readyState === "open") {
            this.#map.values().forEach((s, i) => {
                s.sourceBufferUpdate(currentTime, minBufferTime).then(u => {
                    isBufferUpdate = u
                    if (i === this.#map.size - 1 && !isBufferUpdate && this.#mse.readyState === "open") {

                        this.#mse.endOfStream()
                        console.log("sourceBufferUpdate--endOfStream", u, s, i, this.#map.size);

                    }
                    console.log("sourceBufferUpdate--u", u, s, i, this.#map.size);
                })
            })
       // }

    }
    #updateMpd = async () => {
        const response = await fetch(this.#url)
        if (response.ok) {
            const mpdElement = new DOMParser().parseFromString(await response.text(), "text/xml").documentElement;
            this.#mse.duration = PTdurationToSeconds(mpdElement.getAttribute("mediaPresentationDuration")) || this.#mse.duration
            this.#map.values().map(s => { s.clearReps() })
            for (const adaptationSetElement of Array.from(mpdElement.getElementsByTagName("AdaptationSet"))) {
                const contentType = adaptationSetElement.getAttribute("contentType")
                if (contentType) {
                    (this.#map.has(contentType) ? this.#map.get(contentType) :
                        this.#map.set(contentType, new SourceBufferTask(this.#mse))
                            .get(contentType))!.addReps(this.#url, adaptationSetElement)
                }
            }
        } else {
            throw new PlayerError(0, this.#url.href + " 无法加载")
        }
    }
    /** 获取或者添加 SourceBufferTask*/
    get(key: string) { return this.#map.get(key) }
    sourceopen() {
        return new Promise<SourceBufferTaskCollection>((r, j) => {
            this.#mse.addEventListener("sourceopen", () => {
                console.log("open sourceopen");
                this.#updateMpd().then(() => { r(this) })
            }, { once: true })
            this.#el.src = URL.createObjectURL(this.#mse);
        })
    }
}
/**
 * MPD MSE媒体源处理器
 */
class MPDMSE extends Processor {
    #SourceBufferTaskCollection: SourceBufferTaskCollection
    getRepList(repType: Parameters<Processor["getRepList"]>[0]) {
        return this.#SourceBufferTaskCollection.get(repType)?.getRepList()
    }
    sourceBufferUpdate(currentTime: number, minBufferTime: number) { this.#SourceBufferTaskCollection.sourceBufferUpdate(currentTime, minBufferTime) }
    constructor(sourceBufferTaskCollection: SourceBufferTaskCollection) {
        super()
        this.#SourceBufferTaskCollection = sourceBufferTaskCollection
    }
}
const extensionMPD = /\.MPD(?=[?#])|\.MPD$/i;
const contentTypeDash = /DASH/i;
const processor: ProcessorType = {
    name: "MPDMSE",
    asyncFunctionProcessorInstance: async (result: unknown, el: HTMLMediaElement) => {
        if (result instanceof Response && result.ok && extensionMPD.test(result.url) && contentTypeDash.test(result.headers.get("content-type") ?? "")) {
            return new MPDMSE(await (new SourceBufferTaskCollection(new URL(result.url), el).sourceopen()))
        }
        return undefined;
    }
}
export default processor
