import { PlayerOptions, Processor } from "../Player-Options"
import type { ProcessorType, Representation } from "../Player-Options"
const extensionM3U8 = /\.M3U8(?=[?#])|\.M3U8$/gi;
/**
 * M3U8 hlc解析器
 */
class M3U8 extends Processor {


    constructor(addr: URL | Object, options: PlayerOptions) {
        super()
        console.log("M3U8", this);
    }
    getRepList(repType: Parameters<Processor["getRepList"]>[0]) {
        return undefined
    }

    get src(): string {
        throw new Error("Method not implemented.");
    }
    sourceBufferUpdate(currentTime: Number): void {
        throw new Error("Method not implemented.");
    }
}
const processor: ProcessorType = {
    name: "M3U8",
    asyncFunctionProcessorInstance: async (r: unknown, el: HTMLMediaElement,options: PlayerOptions) => {
        return r instanceof Response && r.ok && extensionM3U8.test(r.url) ?
            new M3U8(r, options) : undefined
    }
}
export default processor