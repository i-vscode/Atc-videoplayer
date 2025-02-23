
import { PlayerOptions } from "./Player-Options";
import { type ValidEvents, type Listener, PlayerEvent } from "./Player-Event";
import { Representation } from "./Player-Representation";
import { PlayerError } from "./Player-Error";
import type { Processor, ProcessorFactory, RepType } from "./Player-Processor";
import { isProcessor, isProcessorFactory, SwitchRepOptions } from "./Player-Processor";


/** 一个空的 处理器 为了避免 PlayerCore.processor为空 */
const NullProcessor = new class implements Processor {
    constructor() { }
    get(): Array<Representation> { return [] }
    switch(): void { }
    get src() { return "" }
    sourceBufferUpdate(): void { }
}

const processorList = new Map<string, ProcessorFactory>()

const getRepList = (repType: RepType, processor: Processor, currentTime: number): Array<Representation & { switch(options?: SwitchRepOptions): void }> =>
    processor.get(repType).map(rep => ({
        id: rep.id,
        duration: rep.duration,
        startTime: rep.startTime,
        codecs: rep.codecs,
        bandwidth: rep.bandwidth,
        mimeType: rep.mimeType,
        width: rep.width,
        height: rep.height,
        sar: rep.sar,
        switch(options: SwitchRepOptions = { switchMode: "soft" }) {
            processor.switch(repType, rep, currentTime, options)
        }
    })) || []

/**
 * 播放器 核心
 * 
 * 1、媒体源扩展 API（MSE）和 SourceBuffer 缓存对象的操作
 * 
 * 2、媒体分段文件的加载和处理
 */
export class PlayerCore {
    #options: PlayerOptions
    #el: HTMLMediaElement
    #processor: Processor = NullProcessor;
    #playerEvent: PlayerEvent = new PlayerEvent();
    #interval: number | NodeJS.Timeout = NaN
    get el() { return this.#el }
    constructor(el: HTMLMediaElement | string, options?: Partial<PlayerOptions>) {
        this.#options = new PlayerOptions(options ?? { minBufferTime: 13 })
        this.#el = typeof el === "string" ? document.getElementById(el) as HTMLMediaElement : el; 
    }
    /** 添加事件 */
    on<T extends ValidEvents>(event: T, listener: Listener<T>) {
        this.#playerEvent.on(event, listener)
    }
    /** 移除事件 */
    off<T extends ValidEvents>(event: T, listener: Listener<T>) {
        this.#playerEvent.off(event, listener)
    }
    /** 添加一次性事件 */
    once<T extends ValidEvents>(event: T, listener: Listener<T>) {
        this.#playerEvent.once(event, listener)
    }

    /** 装载 MPD文件 | 分段MP4文件 异步*/
    async loaderAsync<T>(result: T extends URLString | URL ? URLString | URL : NotBasicOrLiteral<T>, options?: Partial<PlayerOptions>) {
        if (result && this.#el instanceof HTMLMediaElement) {
            const playOptions = new PlayerOptions(Object.assign(Object.assign({}, this.#options), options))
            const response = await Promise.resolve(
                (result instanceof URL || typeof result === "string") && URL.canParse(result) ? fetch(result, { method: "HEAD" }) : result
            )
            if (response instanceof Response && response.ok || typeof response === "object") {                
                for await (const processor of processorList.values().map(p => p.asyncCreateProcessorInstance(response, this.#el, playOptions, this.#playerEvent.emit))) {
                    if (isProcessor(processor)) {
                        this.#processor = processor;
                        clearInterval(this.#interval)
                        this.#interval = setInterval(() => {                          
                            const currentTime = Math.trunc((this.#el.currentTime / 60) * 10) * 6
                            if(this.#el.error === null){ processor.sourceBufferUpdate(currentTime);}
                        }, this.#options.sourceBufferUpdateMinFrequency * 1000);
                        return (repType: RepType) => getRepList(repType, this.#processor, this.#el!.currentTime)
                    }
                }
            }
            throw new PlayerError(0, "addr 载入的类型没有处理器可以处理", result)
        }
        throw new PlayerError(1, "el 为空或者不为HTMLMediaElement类型", this.#el)
    }

    get(repType: RepType) { return getRepList(repType, this.#processor, this.#el!.currentTime) }

    /** 处理器 遍历器 */
    static processorEntries() { return processorList.entries() }

    /** 添加处理器  静态方法*/
    static setProcessor(processorFactory: ProcessorFactory) {
        if (isProcessorFactory(processorFactory)) {
            processorList.set(processorFactory.name, processorFactory)
        }
    }
} 