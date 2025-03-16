import { PlayerEventEmitter, PlayerOptions, Representation, RepType, SwitchRepOptions } from "@lib";
import { NormalFragmentMp4Config } from "./FragmentMp4Config";
import { SourceBufferTask } from "./SourceBufferTask";
import { createFetchScheduleFactoryMethod, FetchScheduleFactoryMethod } from "./FetchSchedule";


/** 源缓存任务映射集合 */
export class SourceBufferTaskCollection {
    sourceBufferTaskMap = new Map<RepType, SourceBufferTask>();
    mse = new MediaSource();
    normafragmentMp4Config: NormalFragmentMp4Config
    fetchScheduleFactoryMethod: FetchScheduleFactoryMethod;
    el: HTMLMediaElement;
    src: string
    constructor(normafragmentMp4Config: NormalFragmentMp4Config, el: HTMLMediaElement, options: PlayerOptions, _eventEmitter: PlayerEventEmitter) {
        this.normafragmentMp4Config = normafragmentMp4Config;
        this.el = el;
        this.fetchScheduleFactoryMethod = createFetchScheduleFactoryMethod(options)
        this.mse.addEventListener("sourceclose",()=>{URL.revokeObjectURL(this.src);})
        this.src = URL.createObjectURL(this.mse);
    }
    sourceBufferUpdate(currentTime: number) {
        if (this.mse.readyState !== "closed") { 
            if (Array.from(this.sourceBufferTaskMap.values()).map(sourceBufferTask =>
                sourceBufferTask.sourceBufferUpdate(currentTime) && this.mse.readyState === "open"
            ).every(everyEndOfStream => everyEndOfStream)) {this.mse.endOfStream()}
        }
    }
    /** 获取 SourceBufferTask*/
    get(repType: RepType) {
        return this.sourceBufferTaskMap.get(repType)
    }
    switch(repType: RepType, rep: Representation, currentTime: number, options: SwitchRepOptions) { 
        this.sourceBufferTaskMap.get(repType)?.switch(rep, currentTime, options)
    }
    /** 刷新 配置对象和重新设置源缓存任务类 */
    refresh() {
        const sourceBufferTaskMap = new Map<RepType, SourceBufferTask>();
        if (Number.isFinite(this.normafragmentMp4Config.duration) && this.normafragmentMp4Config.duration > 0) {
            this.mse.duration = this.normafragmentMp4Config.duration
        }
        Object.entries(this.normafragmentMp4Config.media).forEach(([repType, fragmentMp4Representations]) => {
            const sourceBufferTask = this.sourceBufferTaskMap.get(repType) ?? new SourceBufferTask(this.mse, this.fetchScheduleFactoryMethod);
            sourceBufferTaskMap.set(repType, sourceBufferTask.set(fragmentMp4Representations));
        })
        this.sourceBufferTaskMap.forEach((s) => { s.remove() })
        this.sourceBufferTaskMap = sourceBufferTaskMap;
        return this
    }
    asyncSourceopen() {
        const { promise, resolve } = Promise.withResolvers<typeof this>()
        this.mse.addEventListener("sourceclose", async () => {
            this.sourceBufferTaskMap = new Map()
        })
        if (this.mse.readyState === "closed") {
            this.mse.addEventListener("sourceopen", async () => {
                resolve(this.refresh())
            }, { once: true })
            this.el.src = this.src
        } else { resolve(this) }
        return promise
    }
}