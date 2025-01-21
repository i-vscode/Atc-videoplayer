
import { isRepresentation, Representation, Sar, SwitchRepOptions } from "@lib";
import { FetchSchedule, CreateFetchSchedule } from "./FetchSchedule";
import { Segment } from "./Segment";
const rep: Representation = {
    id: "",
    startTime: 0,
    duration: 0,
    codecs: "",
    mimeType: "",
    bandwidth: 0,
    width: 0,
    height: 0,
    sar: Sar.Unknown
}
/** 源缓存任务类 */
export class SourceBufferTask {
    #map = new Map<Representation, Segment>()
    #mse: MediaSource
    #tasks = new Array<(() => void) | undefined>()
    #sourceBuffer: SourceBuffer
    #current = rep
    #fetch: FetchSchedule
    constructor(mse: MediaSource, createFetchSchedule: CreateFetchSchedule) {
        this.#mse = mse;
        this.#fetch = createFetchSchedule((startTime, endTime) => this.#map.get(this.#current)?.getSegmentFiles(startTime, endTime) ?? [])
        this.#sourceBuffer = mse.addSourceBuffer(`video/mp4; codecs="avc1.64001f"`)
        this.#sourceBuffer.addEventListener("updateend", () => { this.run() })
        this.#mse.addEventListener("sourceclose", () => {
            this.clear()
        })
    }
    /** 源缓存更新 */
    sourceBufferUpdate(currentTime: number, bufferTime: number) {
        const timeRanges = this.#sourceBuffer.buffered;
        let startTime = currentTime
       
        for (let index = 0; index < timeRanges.length; index++) {
            if (startTime >= timeRanges.start(index) && startTime <= timeRanges.end(index)) {
                startTime = timeRanges.end(index);
                break
            }
        } 
        
        
        if (this.isLastFile(startTime) === false) {
   //         console.log("SourceBufferTask--sourceBufferUpdate",currentTime,startTime,bufferTime);

            return this.#fetch(startTime, bufferTime).then(async all => {
                for (const response of all) {
                    if (response && response.ok) {
                        this.run(await response.arrayBuffer())
                    }
                }
                return this
            })
        }
        return this
    }
    isLastFile(currentTime: number) {
        return this.#map.get(this.#current)?.isLastFile(currentTime) ?? true
    }
    clear() {
        this.#map.clear();
        return this
    }
    /**  设置 Representation 类型的键 和 获取 SegmentFiles的方法 */
    set(args: [Representation, Segment]) {
        const [key, value] = args
        if (isRepresentation(key) && value instanceof Segment) {
            this.#map.set(key, value)
        }
        return this
    }
    run(results?: Array<ArrayBuffer | (() => void)> | ArrayBuffer | (() => void)) {
        if (results && this.#mse.readyState === "open") {
            results = Array.isArray(results) ? results : [results]
            results.forEach(result => {
                if (typeof result === "function") {
                    this.#tasks.push(result)
                } else if (result instanceof ArrayBuffer) {
                    this.#tasks.push(() => this.#sourceBuffer.appendBuffer(result))
                }
            })
        }
        if (this.#sourceBuffer.updating === false) {
            this.#tasks.shift()?.();
        }
        return this
    }
    /** 当前  Representation*/
    get current() { return this.#current }

    /**切换 Representation  */
    switch(rep: Representation, options: SwitchRepOptions) {
        if (this.#map.has(rep) && this.#map.get(rep)?.initialization) {
            this.#fetch(this.#map.get(rep)!.initialization!).then(async response => {
                this.#sourceBuffer.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`)
                this.#current = rep
                if (response && response.ok && options?.switchMode) {
                    switch (options?.switchMode) {
                        case "radical":
                            this.clear().run([() => { this.#sourceBuffer.abort() }, await response.arrayBuffer()])
                            break;
                        case "soft":
                            this.run([() => { this.#sourceBuffer.remove(0, Infinity) }, await response.arrayBuffer()])
                            break
                        case "disable":
                        default:
                            break;
                    }
                }
            }) 
        }
        return this;
    }
    toArray() {
        return Array.from(this.#map.keys())
    }

}