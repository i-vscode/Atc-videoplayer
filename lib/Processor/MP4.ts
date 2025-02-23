import { PlayerOptions, Processor } from "../Player"
import type { ProcessorFactory, Representation, RepType, SwitchRepOptions } from "@lib"

/**
 * MP4 处理器 
 */
class MP4Processor implements Processor {
    constructor(addr: string, el: HTMLMediaElement) {
        el.src = addr
    }
    get(repType: RepType): Array<Representation> {
        throw new Error("Method not implemented.")
    }
    switch(repType: RepType, rep: Representation, currentTime: number, options: SwitchRepOptions): void {
        throw new Error("Method not implemented.")
    }
    getRepList(_repType: RepType) {
        return undefined
    }
    sourceBufferUpdate(_currentTime: Number): void { }
}
const MP4Factory: ProcessorFactory = (() => {
    const extensionMP4 = /\.MP4(?=[?#])|\.MP4$/gi;
    return {
        name: "MP4",
        asyncCreateProcessorInstance: async (r: unknown, el: HTMLMediaElement) => {
            return r instanceof Response && r.ok && extensionMP4.test(r.url) ?
                new MP4Processor(r.url, el) : undefined
        }
    }
})()
export { MP4Factory }