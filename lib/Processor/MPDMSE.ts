

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

type RangeTimeURLType = Readonly<{
    startTime: number,
    endTime: number,
    url: URL
}>
const parseSegmentFromRangeTimeURLs = (() => {
    const mediaReg = /\$Number%(\d+)d\$/;
    /** 除法结果四舍五入到整数 */
    const divideAndRound = (dividend: number | string | null, divisor: number | string | null) => {
        dividend = typeof dividend === "string" ? parseInt(dividend) : dividend;
        divisor = typeof divisor === "string" ? parseInt(divisor) : divisor; 0
        return Math.round((dividend ?? 0) / (divisor ?? 0))
    }
    const parseSegmentTemplateFromRangeTimeURLs = (repid: string, url: URL, mediaPresentationDuration: number, segmentTemplateElement: Element) => {
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
                        url: new URL(media.replace(mediaRegExecArray[0], (startNumber.toString().padStart(mediaRegExecNumber, "0"))), url)
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
                                url: new URL(media.replace(mediaRegExecArray[0], ((startNumber++).toString().padStart(mediaRegExecNumber, "0"))), url)
                            }))
                            duration += sduration;
                        }
                    } else { return new Array<RangeTimeURLType>() }
                }
            }
        }
        return rangeTimeURLs
    }
    const parseSegmentListFromRangeTimeURLs = (repid: string, url: URL, segmentTemplate: Element) => {
        return new Array<RangeTimeURLType>()
    }
    return (repid: string, url: URL, mediaPresentationDuration: number, segmentElement?: Element | null): Array<RangeTimeURLType> => {
        if (segmentElement?.localName === "SegmentTemplate") {
            return parseSegmentTemplateFromRangeTimeURLs(repid, url, mediaPresentationDuration, segmentElement)
        } else if (segmentElement?.localName === "SegmentList") {
            return parseSegmentListFromRangeTimeURLs(repid, url, segmentElement)
        }
        return new Array<RangeTimeURLType>()
    }
})()

/** 分段文件类 */
class Segment {
    #rangeTimeURLs: Array<RangeTimeURLType>
    #initializationURL?: URL
    get initializationURL() { return this.#initializationURL }
    constructor(repId: string, url: URL, mediaPresentationDuration: number, segmentElement?: Element | null,) {
        this.#initializationURL = parseInitializationURL(repId, url, segmentElement);
        this.#rangeTimeURLs = parseSegmentFromRangeTimeURLs(repId, url, mediaPresentationDuration, segmentElement)

    }
    isLastURL(currentTime: number) {
        const r = this.#rangeTimeURLs.at(-1);
        return r ? currentTime > r.startTime && r.endTime ? true : false : true
    }
    getSegmentRangeURLs(startTime: number, endTime: number) {
        const urls = new Set<URL>()
        for (const r of this.#rangeTimeURLs) {
            if (r.startTime > endTime) break
            if (startTime <= r.endTime && endTime >= r.startTime) {
                urls.add(r.url)
            }
        }
        console.log("getSegmentRangeURLs", this.#rangeTimeURLs, startTime, endTime);
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
        this.setRep = (option) => s.setRep(this, option)
    }
    #segment: Segment;
    get initializationURL() { return this.#segment.initializationURL }
    getSegmentRangeURLs(startTime: number, endTime: number) { return this.#segment.getSegmentRangeURLs(startTime, endTime) }
    isLastURL(currentTime: number) { return this.#segment.isLastURL(currentTime); }
    setRep: Representation["setRep"]
}

/** SourceBuffer 为 ArrayBuffer 添加任务获取 */
class SourceBufferAddTaskFetchForArrayBuffer {
    #lastFetchSet = new Set<URL>()
    #runingFetchSet = new Set<URL>()
    #taskGroups = new Array<[() => void]>()
    #tasks = new Array<() => void>()
    #appendBufferTasks = new Array<() => void>()
    #sourceBuffer: SourceBuffer
    //#sourceclose: boolean = false
    get sourceBuffer() { return this.#sourceBuffer }
    constructor(sourceBuffer: SourceBuffer) {
        this.#sourceBuffer = sourceBuffer
        this.#sourceBuffer.addEventListener("updateend", () => {
            console.log("updateend");
            this.#run()
        })
    }

    endTask(f: () => void) {
        this.#tasks.length = 0
        this.#lastFetchSet.clear()
        this.#runingFetchSet.clear()
        console.log("endTask", this.#sourceBuffer.updating);
        this.#tasks.push(f)
        this.#run()
    }
    #run(t?: () => void) {
        if (this.#sourceBuffer.updating === false) {
            t?.() ?? this.#tasks.shift()?.();
            return
        } else if (t) {
            this.#tasks.push(t)
        }
    }
    add(urls?: Array<URL> | URL | (() => void) | Set<URL>) {
        console.log("addtask", urls);

        if (typeof urls === "function") {
            this.#tasks.push(urls);
            this.#run()
            return
        }
        const newFetchSet = new Set(urls instanceof URL ? [urls] : urls instanceof Array || urls instanceof Set ? urls : []).difference(this.#lastFetchSet);
        if (newFetchSet.size < 1) return

        newFetchSet.forEach(url => {
            if (url instanceof URL && !this.#runingFetchSet.has(url)) {
                this.#runingFetchSet.add(url)
                fetch(url).then(async r => {
                    if (r.ok && this.#runingFetchSet.has(url)) {
                        const a = await r.arrayBuffer()
                        this.#tasks.push(() => { this.#sourceBuffer.appendBuffer(a) })
                    }
                }).finally(() => { this.#runingFetchSet.delete(url); this.#run() })
            }
        })
        this.#lastFetchSet = newFetchSet
    }

    changeType(type: string, option: Parameters<Representation["setRep"]>[0]) {
        this.#sourceBuffer.changeType(type);
        if (option?.cacheSwitchMode) {
            if (option?.cacheSwitchMode === "radical") {
                this.#tasks.length = 0
                this.#tasks.push(() => { this.#sourceBuffer.abort() })
                this.#runingFetchSet.clear()
            }
            // console.log("changeType", option?.cacheSwitchMode);
            this.#tasks.push(() => { this.#sourceBuffer.remove(0, Infinity); })
            this.#run()
        }
    }
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
        //  mse.addEventListener("sourceclose", () => this.#sTask.sourceclose(), { once: true })
    }
    /** 源缓存更新 */
    sourceBufferUpdate(currentTime: number, minBufferTime: number) {

        console.group("SourceBufferTask-sourceBufferUpdate", currentTime, minBufferTime, this.#mse.duration);
        const { promise, resolve } = Promise.withResolvers();
        const timeRanges = this.#sTask.sourceBuffer.buffered;
        for (let index = 0; index < timeRanges.length; index++) {
            console.log("timeRanges", timeRanges.start(index), timeRanges.end(index));
            if (currentTime >= timeRanges.start(index) && currentTime <= timeRanges.end(index)) {
                currentTime = timeRanges.end(index);
                if (this.#currentRep?.isLastURL(currentTime)) {
                    this.#sTask.add(() => { console.log("resolve"); resolve(false) });
                    return promise
                }
                break
            }
        }
        this.#sTask.add(this.#currentRep?.getSegmentRangeURLs(currentTime, currentTime + minBufferTime))
        resolve(true);
        console.groupEnd();
        return promise;
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
    setRep(rep: RepresentationMPD, option: Parameters<Representation["setRep"]>[0]) {
        if (this.#currentRep === rep) return true;
        if (this.#repSet.has(rep) && rep.initializationURL) {
            this.#sTask.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`, option)
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
        Promise.all(this.#map.values().map(s => s.sourceBufferUpdate(currentTime, minBufferTime))).then(e => {
            if (e.every(ued => ued === false) && this.#mse.readyState === "open") {
                console.log("endOfStream", this.#mse.duration, this.#el.currentTime);
                if(Number.isInteger(this.#mse.duration)){
                    this.#mse.endOfStream()
                }else{
                    this.#updateMpd()
                }
                
            }
        })
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
