import { PlayerEventEmitter, PlayerOptions } from "@lib";
import type { SwitchRepOptions, Representation, RepType } from "@lib";
import { Converter } from "./Converter";
import { PTdurationToSeconds } from "./Tools";
import { SourceBufferTask } from "./SourceBufferTask";
import { CreateFetchSchedule, createFetchScheduleControlCenter } from "./FetchSchedule";
import { parseRepresentationElement } from "./Representation";

/** 更新 SourceBufferTasks */
const updateSourceBufferTasks = (mpdElement: Element, taskCollection: SourceBufferTaskCollection): void => {
    taskCollection.duration = PTdurationToSeconds(mpdElement.getAttribute("mediaPresentationDuration"));
    taskCollection.clear();
    for (const adaptationSetElement of mpdElement.getElementsByTagName("AdaptationSet")) {
        const contentType = adaptationSetElement.getAttribute("contentType");


        if (contentType) {
            const sourceBufferTask = taskCollection.getORset(contentType)

            for (const repElement of adaptationSetElement.getElementsByTagName("Representation")) {
                sourceBufferTask.set(
                    parseRepresentationElement(repElement, taskCollection.duration, adaptationSetElement.getElementsByTagName("SegmentList")?.[0])
                )
            }
        }
    }
}


/** 源缓存任务映射集合 */
export class SourceBufferTaskCollection {
    #options: PlayerOptions
    #map = new Map<RepType, SourceBufferTask>();
    #mse = new MediaSource();
    #mpdConverter: Converter;
    #createFetchSchedule: CreateFetchSchedule;
    #eventEmitter: PlayerEventEmitter
    #el: HTMLMediaElement;
    constructor(mpdConverter: Converter, el: HTMLMediaElement, options: PlayerOptions, eventEmitter: PlayerEventEmitter) {
        this.#mpdConverter = mpdConverter
        this.#el = el;
        this.#options = options
        this.#eventEmitter = eventEmitter
        this.#createFetchSchedule = createFetchScheduleControlCenter(mpdConverter)

    }
    get duration() { return this.#mse.duration }
    set duration(val: number) { this.#mse.duration = val || this.#mse.duration }
    sourceBufferUpdate(currentTime: number) {
        if (this.#mse.readyState === "open") {
        //    console.log("SourceBufferTaskCollection -sourceBufferUpdate",currentTime);
            Promise.all(this.#map.values().map(s => s.sourceBufferUpdate(currentTime, this.#options.minBufferTime))).then(sourceBufferTasks => {
                if (sourceBufferTasks.every(sourceBufferTask => sourceBufferTask.isLastFile(currentTime))) {
                    if (Number.isInteger(this.#mse.duration)) {
                        if (this.#mse.readyState === "open") { this.#mse.endOfStream() }
                    } else {
                        this.#mpdConverter.asyncResponse().then(async response => {
                            if (response && response.ok) {
                                const mpdElement = new DOMParser().parseFromString(await response.text(), "text/xml").documentElement;
                                updateSourceBufferTasks(mpdElement, this)
                            }
                        })
                    }
                }
            })
        }
    }

    /** 清除所有类型任务的已经排序任务列队 */
    clear() {
        this.#map.values().forEach(s => s.clear())
        return this
    }
    /** 获取或者设置 SourceBufferTask*/
    getORset(repType: RepType) {
        return this.#map.has(repType) ?
            this.#map.get(repType)!
            : this.#map.set(repType, new SourceBufferTask(this.#mse, this.#createFetchSchedule)).get(repType)!
    }
    changeType(repType: RepType, rep: Representation, options: SwitchRepOptions) {
        this.#map.get(repType)?.switch(rep, options)
    }
    sourceopen(res?: Response) {
        const { promise, resolve } = Promise.withResolvers<typeof this>()
        this.#mse.addEventListener("sourceopen", (f) => {
            this.#mpdConverter.asyncResponse().then(async response => {
                if (response && response.ok) {
                    const mpdElement = new DOMParser().parseFromString(await response.text(), "text/xml").documentElement;
                    updateSourceBufferTasks(mpdElement, this)
                }
                resolve(this)
            })
        }, { once: true })
        this.#el.src = URL.createObjectURL(this.#mse);
        return promise
    }
}
