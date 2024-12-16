import { PlayerOptions, Processor } from "../Player-Options"
import type { ProcessorType } from "../Player-Options"

/**
 * MP4 处理器 
 */
class MP4 extends Processor {                     
    constructor(addr: string, el: HTMLMediaElement) {
        super() 
        el.src = addr
    }
    getRepList(_repType: Parameters<Processor["getRepList"]>[0]) {
        return undefined
    } 
    sourceBufferUpdate(_currentTime: Number): void {}
}
const processor: ProcessorType = (() => {
    const extensionMP4 = /\.MP4(?=[?#])|\.MP4$/gi;
    return {
        name: "MP4",
        asyncFunctionProcessorInstance: async (r: unknown, el: HTMLMediaElement) => {
            return r instanceof Response && r.ok && extensionMP4.test(r.url) ?
                new MP4(r.url, el) : undefined
        }
    }
})()
export default processor