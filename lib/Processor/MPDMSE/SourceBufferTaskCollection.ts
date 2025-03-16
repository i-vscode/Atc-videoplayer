import { PlayerEventEmitter, PlayerOptions } from "@lib";
import type { SwitchRepOptions, Representation, RepType } from "@lib";
import { MPDDefaultConverter } from "./Converter";
import { parsePTdurationToSeconds } from "./Tools";
import { SourceBufferTask } from "./SourceBufferTask";
import { type FetchScheduleFactoryMethod, createFetchScheduleFactoryMethod } from "./FetchSchedule";
import { parseRepresentationElement } from "./Representation";

/** 更新 SourceBufferTasks */
const updateSourceBufferTasks = (mpdElement: Element, taskCollection: SourceBufferTaskCollection): void => {
    taskCollection.duration = parsePTdurationToSeconds(mpdElement.getAttribute("mediaPresentationDuration"), Infinity);
    taskCollection.clear();
    for (const adaptationSetElement of mpdElement.getElementsByTagName("AdaptationSet")) {
        const contentType = adaptationSetElement.getAttribute("contentType");
        if (contentType) {
            const sourceBufferTask = taskCollection.set(contentType)
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
    // #options: PlayerOptions
    #map = new Map<RepType, SourceBufferTask>();
    #mse = new MediaSource();
    #mpdConverter: MPDDefaultConverter;
    #fetchScheduleFactoryMethod: FetchScheduleFactoryMethod;
    //#eventEmitter: PlayerEventEmitter
    #el: HTMLMediaElement;
    constructor(mpdConverter: MPDDefaultConverter, el: HTMLMediaElement, options: PlayerOptions, _eventEmitter: PlayerEventEmitter) {
        this.#mpdConverter = mpdConverter
        this.#el = el;
        // this.#options = options
        //this.#eventEmitter = eventEmitter
        this.#fetchScheduleFactoryMethod = createFetchScheduleFactoryMethod(mpdConverter, options)

    }
    get duration() { return this.#mse.duration }
    set duration(val: number) { this.#mse.duration = val || this.#mse.duration }
    sourceBufferUpdate(currentTime: number) {
        if (this.#mse.readyState === "open") { 
            if (Array.from(this.#map.values()).every(sourceBufferTask =>
                sourceBufferTask.isLastFile(currentTime) ||!(sourceBufferTask.sourceBufferUpdate(currentTime)) )) {
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

        }
    }

    /** 清除所有类型任务的已经排序任务列队 */
    clear() {
        this.#map.values().forEach(s => s.clear())
        return this
    }
    /** 设置 SourceBufferTask */
    set(repType: RepType) {
        return this.#map.has(repType) ?
            this.#map.get(repType)!
            : this.#map.set(repType, new SourceBufferTask(this.#mse, this.#fetchScheduleFactoryMethod)).get(repType)!
    }
    /** 获取 SourceBufferTask*/
    get(repType: RepType) {
        return this.#map.has(repType) ?
            this.#map.get(repType)!
            : undefined
    }
    changeType(repType: RepType, rep: Representation, currentTime: number, options: SwitchRepOptions) {
        this.#map.get(repType)?.switch(rep, currentTime, options)
    }
    asyncSourceopen(res?: Response) {
        const { promise, resolve } = Promise.withResolvers<typeof this>()
        this.#mse.addEventListener("sourceopen", async () => {
            const response = res instanceof Response ? res : (await this.#mpdConverter.asyncResponse())
            if (response && response.ok) {
                const mpdElement = new DOMParser().parseFromString(await response.text(), "text/xml").documentElement;
                updateSourceBufferTasks(mpdElement, this)
            }
            resolve(this)
        }, { once: true })
        this.#el.src = URL.createObjectURL(this.#mse);
        return promise
    }
}
