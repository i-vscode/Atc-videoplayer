import type { HintedString, Representation } from "./Player-Options";
import { PlayerOptions, throttle, PlayerError } from "./Player-Options";

/** URLString */
export type URLString = `${"http" | "https"}://${string & { length: 1 }}`;
/** NotBasicOrLiteral */
export type NotBasicOrLiteral<T> = T extends string | number | boolean | bigint | symbol | undefined | null ? T extends T ? never : T : T;
/**
 *播放器 处理器抽象类
 */
export abstract class Processor {
    /**
     * 更新源缓冲
     * @param timeupdate 当前播放时间 
     */
    abstract sourceBufferUpdate(currentTime: number): void

    /** 获取适配集描述列表 */
    abstract getRepList(repType: HintedString<"video" | "audio">): Array<Representation> | undefined
}


/**播放器 处理器的类型对象*/
export type ProcessorType = {
    /** 处理器 名称 */
    name: unknown
    /** 
     * 异步方法 获取处理器实例
     * @returns 返回 undefined 则表示此处理器不支持此类型参数 </p>
     * */
    asyncFunctionProcessorInstance: (result: unknown, el: HTMLMediaElement, options: PlayerOptions) => Promise<Processor | undefined>
}

const processorList = new Map<ProcessorType["name"], ProcessorType["asyncFunctionProcessorInstance"]>()


/**
 * 播放器 核心
 * 
 * 1、媒体源扩展 API（MSE）和 SourceBuffer 缓存对象的操作
 * 
 * 2、媒体分段文件的加载和处理
 */
export class PlayerCore {
    #options: PlayerOptions
    #el: HTMLMediaElement | null
    get el() { return this.#el }
    #processor?: Processor;
    constructor(el: HTMLMediaElement | string, options?: Partial<PlayerOptions>) {
        this.#options = new PlayerOptions(options ?? { minBufferTime: 13 })
        this.#el = typeof el === "string" ? document.getElementById(el) as HTMLMediaElement : el;
        if (this.#el instanceof HTMLMediaElement) {
            this.#el.addEventListener("loadedmetadata", () => {
                this.#processor?.sourceBufferUpdate(this.#el!.currentTime);
            })
            this.#el?.addEventListener("timeupdate", throttle(() => {
                this.#processor?.sourceBufferUpdate(this.#el!.currentTime);
            }, 2000));
            this.#el.addEventListener("seeking", () => {
                this.#processor?.sourceBufferUpdate(this.#el!.currentTime);
            });
        }

    }
    /** 装载 MPD文件 | 分段MP4文件 异步*/
    async loaderAsync<T>(result: T extends URLString | URL ? URLString | URL : NotBasicOrLiteral<T>, options?: PlayerOptions) { 
        if (this.#el instanceof HTMLMediaElement) {
            const playOptions = new PlayerOptions(Object.assign(Object.assign({}, this.#options), options))
            if (result) {
                const response = await Promise.resolve(
                    (result instanceof URL || typeof result=== "string") && URL.canParse(result)? fetch(result, { method: "HEAD" }) : result
                )
                if (response instanceof Response && response.ok || typeof response === "object") {
                    for (const processor of processorList) {
                        this.#processor = await Promise.resolve(processor[1](response, this.#el, playOptions))
                        if (this.#processor instanceof Processor) {
                            return this.#processor.getRepList.bind(this.#processor)
                        }
                    }
                }
            }
            throw new PlayerError(0, "addr 载入的类型没有处理器可以处理", result)
        }
        throw new PlayerError(1, "el 为空或者不为HTMLMediaElement类型", this.#el)
    }

    /** 添加处理器  */
    set(processorType: ProcessorType) { PlayerCore.set(processorType) }

    /** 添加处理器  静态方法*/
    static set(processorType: ProcessorType) {
        if (typeof processorType.name === "string" && typeof processorType.asyncFunctionProcessorInstance === "function") {
            processorList.set(processorType.name, processorType.asyncFunctionProcessorInstance)
        }
    }
    /** 返回键值对的遍历器 */
    entries() { return processorList?.entries() }
} 