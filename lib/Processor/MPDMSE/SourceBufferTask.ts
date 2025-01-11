import { Converter } from "./Converter";
import { RepresentationMPD } from "./Representation";



/** SourceBuffer 为 ArrayBuffer 添加任务获取 */
class SourceBufferAddTaskFetchForArrayBuffer {
    #runingFetchSet = new Set<URL>()
    #tasks = new Array<(() => void) | undefined>()
    #sourceBuffer: SourceBuffer
    #mse: MediaSource
    get sourceBuffer() { return this.#sourceBuffer }
    constructor(mse: MediaSource,) {
        this.#mse = mse
        this.#sourceBuffer = mse.addSourceBuffer(`video/mp4; codecs="avc1.64001f"`)
        this.#sourceBuffer.addEventListener("updateend", () => { this.#run() })
        mse.addEventListener("sourceclose", () => {
            console.log("SourceBufferAddTaskFetchForArrayBuffer --- sourceclose", mse.readyState);
            this.#tasks = new Array()
        })

    }
    #run(t?: () => void) {
        this.#sourceBuffer.updating ? this.#tasks.push(t): t?.() ?? this.#tasks.shift()?.();
    }
    clear() {
        this.#tasks = new Array()
    }
    add(urls?: Array<URL> | URL | (() => void) | Set<URL>) {
        if (this.#mse.readyState === "open") {
            if (!urls || typeof urls === "function") return this.#run(urls)
            const newFetchSet = new Set(urls instanceof URL ? [urls] : urls instanceof Array || urls instanceof Set ? urls : []).difference(this.#runingFetchSet);
            if (newFetchSet.size < 1) return
            newFetchSet.forEach(url => {
                if (url instanceof URL && !this.#runingFetchSet.has(url)) {
                    fetch(url).then(async r => {
                        if (r.ok && this.#runingFetchSet.has(url)) {
                            const a = await r.arrayBuffer()
                            this.#tasks.push(() => { this.#sourceBuffer.appendBuffer(a); })
                        }
                    }).finally(() => { this.#runingFetchSet.delete(url); this.#run() })
                }
            })
            this.#runingFetchSet = this.#runingFetchSet.union(newFetchSet)
        }
    }

    changeType(type: string, option: Parameters<RepresentationMPD["setRep"]>[0]) {
        this.#sourceBuffer.changeType(type);
        if (option?.cacheSwitchMode) {
            switch (option?.cacheSwitchMode) {
                case "radical":
                    this.#tasks.length = 0
                    this.#run(() => { this.#sourceBuffer.abort() })
                    this.#runingFetchSet.clear()
                    break;
                case "soft":
                    this.#run(() => {
                        this.#sourceBuffer.remove(0, Infinity);
                    })
                    break
                case "disable":
                default:
                    break;
            }
        }
    }
}
/** 源缓存任务类 */
export class SourceBufferTask {
    #mpdConverter: Converter;
    #sTask: SourceBufferAddTaskFetchForArrayBuffer
    #repSet = new Set<RepresentationMPD>()
    #currentRep?: RepresentationMPD
    #convertedMap = new Map<string, URL>()
    #mse: MediaSource
    get duration() { return this.#mse.duration }
    constructor(mse: MediaSource, mpdConverter: Converter) {
        this.#mse = mse

        this.#mse.addEventListener("sourceclose", () => { 
            this.clearReps()
        })
        this.#mpdConverter = mpdConverter
        this.#sTask = new SourceBufferAddTaskFetchForArrayBuffer(mse)
    }
    /** 获取任务对象 */
    getTaskObject(startTime: number, endTime: number){
        return {
            segmentFiles:[],
            callbacks:()=>{

            }
        }

    }
    /** 源缓存更新 */
    sourceBufferUpdate(startTime: number, endTime: number) {
        return new Promise(resolve => {
            const timeRanges = this.#sTask.sourceBuffer.buffered; 
            for (let index = 0; index < timeRanges.length; index++) {
                if (startTime >= timeRanges.start(index) && startTime <= timeRanges.end(index)) {
                    startTime = timeRanges.end(index);
                    break
                }
            }
            if (this.#currentRep?.isLastFile(startTime)) {
                this.#sTask.add(() => { resolve(false) }); 
            } else {
                const segmentFiles = this.#currentRep?.getSegmentFiles(startTime, endTime) ?? []
                Promise.resolve(this.#mpdConverter.asyncConverter(segmentFiles)).then(urlMap => {
                    this.#sTask.add(Array.from(urlMap.values()))
                    resolve(true)
                }).catch(() => resolve(false))
            }
        })
    }
    clearReps() {
        this.#currentRep = undefined
        this.#repSet.clear();
        this.#sTask.clear();
        return this
    }
    addReps(adaptationSetElement: Element) {
        for (const repElement of adaptationSetElement.getElementsByTagName("Representation")) {
            this.#repSet.add(new RepresentationMPD(repElement, this, adaptationSetElement.getElementsByTagName("SegmentTemplate")?.[0]))
        }

    }
    /**
     * 设置rep
     */
    setRep(rep: RepresentationMPD, option: Parameters<RepresentationMPD["setRep"]>[0]) {
        if (this.#currentRep === rep) return;
        if (this.#repSet.has(rep) && rep.initialization) {
            Promise.resolve(this.#mpdConverter.asyncConverter([rep.initialization])).then(urls => { 
                if (urls.has(rep.initialization!)) {
                    this.#sTask.add(() => this.#sTask.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`, option))
                    this.#sTask.add(urls.get(rep.initialization!));
                    this.#currentRep = rep;
                }
            })
        }
    }
    getRepList() {
        return Array.from(this.#repSet.values())
    }

}