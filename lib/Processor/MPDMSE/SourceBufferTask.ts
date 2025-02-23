
import { isRepresentation, Representation, Sar, SwitchRepOptions } from "@lib";
import type { FetchSchedule, FetchScheduleFactoryMethod } from "./FetchSchedule";
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
const nullSegment = new Segment(rep)
/** 源缓存任务类 */
export class SourceBufferTask {
    #map = new Map<Representation, Segment>()
    #mse: MediaSource
    #tasks = new Array<(() => void) | undefined>()
    #sourceBuffer: SourceBuffer
    #current = rep
    #fetch: FetchSchedule
    constructor(mse: MediaSource, fetchScheduleFactoryMethod: FetchScheduleFactoryMethod) {
        this.#mse = mse;
        this.#fetch = fetchScheduleFactoryMethod(() => {
            return this.#map.get(this.#current) ?? nullSegment
        })
        this.#sourceBuffer = mse.addSourceBuffer(`video/mp4; codecs="avc1.64001f"`)
        this.#sourceBuffer.addEventListener("updateend", () => { this.run() })
    }
    /** 源缓存更新 */
    sourceBufferUpdate(currentTime: number) {
        const timeRanges = this.#sourceBuffer.buffered;
        let bufferedTime = currentTime;
        for (let index = 0; index < timeRanges.length; index++) {
            if (bufferedTime >= timeRanges.start(index) && bufferedTime <= timeRanges.end(index)) {
                bufferedTime = timeRanges.end(index);
                break
            }
        } 
        this.#fetch(currentTime, bufferedTime).then(async responses =>{
            this.run(responses);
        });
        return this;

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
    run(results?: Array<Response | ArrayBuffer | (() => void)> | Response | ArrayBuffer | (() => void)) {

        if (results && this.#mse.readyState === "open") {
            results = Array.isArray(results) ? results : [results]
            results.forEach(result => {
                if (typeof result === "function") {
                    this.#tasks.push(result)
                } else if (result instanceof Response && result.ok) {
                    result.arrayBuffer().then(a => {
                        this.run(() => this.#sourceBuffer.appendBuffer(a)) 
                    })
                } else if (result instanceof ArrayBuffer) {
                    this.#tasks.push(() => {
                        this.#sourceBuffer.appendBuffer(result) 
                    })
                }
            })
        }
        if (this.#sourceBuffer.updating === false) {
            this.#tasks.shift()?.();
        }
        return this
    }

    /**切换 Representation  */
    switch(rep: Representation, currentTime: number, options: SwitchRepOptions) {
        if (this.#map.has(rep) && this.#current !== rep) {
            this.#current = rep
            this.#fetch(currentTime, "initialization").then(async responses => {
                this.run(() => this.#sourceBuffer.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`))
                switch (options?.switchMode) {
                    case "radical":
                        this.run([() => this.#sourceBuffer.abort(), () => this.#sourceBuffer.remove(0, Infinity)])
                        break;
                    case "soft":
                        break
                }
                this.run(responses)
            })
        }
        return this;
    }
    toArray() {
        return Array.from(this.#map.keys())
    }

}