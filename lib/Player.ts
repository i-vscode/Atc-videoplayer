import type { ProcessorType } from "./Player-Options";
import { Processor, PlayerOptions, PlayerError, throttle } from "./Player-Options";
import { MPDMSE, MP4, M3U8 } from "./Processor";
const processorList = new Map<ProcessorType["name"], ProcessorType["asyncFunctionProcessorInstance"]>()

const setProcessorList = (processorType: ProcessorType) => {
	if (typeof processorType.name === "string" && typeof processorType.asyncFunctionProcessorInstance === "function") {
		processorList.set(processorType.name, processorType.asyncFunctionProcessorInstance)
	}
}
setProcessorList(MPDMSE)
setProcessorList(MP4)
setProcessorList(M3U8)
export { PlayerOptions, PlayerError }
/**
 * 播放器
 */
export class Player {
	#options: PlayerOptions = new PlayerOptions({ minBufferTime: 15 })
	#el: HTMLMediaElement | null
	get el() { return this.#el }
	#processor?: Processor;
	constructor(el: HTMLMediaElement | string, options?: Partial<PlayerOptions>) {
		Object.assign(this.#options, options)
		this.#el = typeof el === "string" ? document.getElementById(el) as HTMLMediaElement : el;
		if (this.#el instanceof HTMLMediaElement) {
			this.#el.addEventListener("loadedmetadata", () => {
				console.log("loadedmetadata	--Player", this.#el!.error);
				this.#processor?.sourceBufferUpdate(this.#el!.currentTime, this.#options.minBufferTime);
			})
			this.#el?.addEventListener("timeupdate", throttle(() => {
				//console.log("timeupdate	当目前的播放位置已更改时触发。",this.#el!.currentTime);
				this.#processor?.sourceBufferUpdate(this.#el!.currentTime, this.#options.minBufferTime);
			}, 2000)); 
			this.#el.addEventListener("seeking", () => {  
				console.log("seeking  当用户开始移动/跳跃到音频/视频中的新位置时触发。",this.#el!.currentTime);
				this.#processor?.sourceBufferUpdate(this.#el!.currentTime, this.#options.minBufferTime);
			});
		}

	}
	/** 装载 MPD文件 | 分段MP4文件 异步*/
	async loaderAsync(result: URL | string | Object) {
		if (this.#el instanceof HTMLMediaElement) {
			result = typeof result === "string" || result instanceof URL ? await fetch(result, { method: "HEAD" }) : result
			for (const processor of processorList) {
				this.#processor = await Promise.resolve(processor[1](result, this.#el))
				if (this.#processor instanceof Processor) {
					return this.#processor.getRepList.bind(this.#processor)
				}
			}
			throw new PlayerError(0, "addr 载入类型 没有处理器 可以处理", result)
		}
		throw new PlayerError(1, "el 为空或者不为HTMLMediaElement类型", this.#el)
	}

	/** 添加处理器  */
	set(processorType: ProcessorType) { setProcessorList(processorType) }
	/** 返回键值对的遍历器 */
	entries() { return processorList?.entries() }
} 