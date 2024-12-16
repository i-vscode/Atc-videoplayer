
import type { ProcessorType, HintedString } from "./Player-Options";
import { Processor, PlayerOptions, throttle } from "./Player-Options";




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
    #processor?: Processor
    constructor(el: HTMLMediaElement, options: PlayerOptions) {
        this.#el = el;
        this.#options = options;        
        this.#el.addEventListener("loadedmetadata", () => {
            console.log("loadedmetadata	--", this.#el.error);
        })
        el?.addEventListener("loadedmetadata", () => {console.log("loadedmetadata22	当浏览器已加载音频/视频的元数据时触发。");})
        this.#el.addEventListener("error", () => {
            console.log("errrr--", this.#el.error);
        })
    }
    /**
     * 设置播放器的装载器
     * @param loader 
     */
    async loaderAsync(addr: URL | Object) {
        if (typeof addr === "object") {
            const obj = addr instanceof URL ? await fetch(addr, { method: "HEAD" }) : addr
            for (const processor of this.#processorList) {
                this.#processor = await Promise.resolve(processor[1](obj,this.#el, this.#options))
                if (this.#processor instanceof Processor) { 
                    return this.#processor.getRepList.bind(this.#processor)
                }
            }
        }
        throw addr
    }
    #processorList = new Map<ProcessorType["name"], ProcessorType["asyncFunctionProcessorInstance"]>()

    /** 添加或者设置处理器 */
    set(processorType: ProcessorType) {
        if (typeof processorType.name === "string" && typeof processorType.asyncFunctionProcessorInstance === "function") {
            this.#processorList.set(processorType.name, processorType.asyncFunctionProcessorInstance)
        }
    }
    /** 返回键值对的遍历器 */
    entries() {
        return this.#processorList.entries()
    }
} 