import { PlayerOptions, Processor } from "@lib"
import type { ProcessorType, Representation, RepType, SwitchRepOptions } from "@lib"
const extensionM3U8 = /\.M3U8(?=[?#])|\.M3U8$/gi;
/**
 * M3U8 hlc解析器
 */
class M3U8 implements Processor {


    constructor(addr: URL | Object, options: PlayerOptions) { 
        console.log("M3U8", this);
    }
    get(repType: RepType): Array<Representation> {
        throw new Error("Method not implemented.");
    }
    switch(repType: RepType, rep: Representation, options: SwitchRepOptions): void {
        throw new Error("Method not implemented.");
    }
    getRepList(repType: RepType) {
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