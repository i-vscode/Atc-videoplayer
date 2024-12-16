
import { PlayerCore } from "./Player-Core";
import { type ProcessorType, PlayerOptions } from "./Player-Options";
import { MPDMSE, MP4, M3U8 } from "./Processor";
/**
 * 播放器
 */
export class Player {
	#options: PlayerOptions = new PlayerOptions()
	#playerCore: PlayerCore
	#el: HTMLMediaElement
	get el() { return this.#el }
	constructor(el: HTMLMediaElement | string, options?: Partial<PlayerOptions>) {
		Object.assign(this.#options, options)
		this.#el = typeof el === "string" ? document.getElementById(el) as HTMLMediaElement : el;
		if (this.#el instanceof HTMLMediaElement) {
			this.#playerCore = new PlayerCore(this.#el, this.#options)
			this.#playerCore.set(MP4)
			this.#playerCore.set(M3U8)
			this.#playerCore.set(MPDMSE)
		} else {
			throw "el HTMLMediaElement 元素不存在 "
		}
	}
	/** 装载 MPD文件 | 分段MP4文件 异步*/
	async loaderAsync(addr: URL | string | Object) {
		return this.#playerCore.loaderAsync(typeof addr === "string" ? new URL(addr, window.location.href) : addr)
	}

	/** 添加处理器  */
	set(processorType: ProcessorType) {
		this.#playerCore?.set(processorType)
	}
	/** 返回键值对的遍历器 */
	entries() {
		return this.#playerCore?.entries()
	}
} 