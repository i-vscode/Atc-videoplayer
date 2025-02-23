import { PlayerError, PlayerOptions, Processor } from "@lib"
import type { ProcessorType, Representation, RepType, SwitchRepOptions } from "@lib"
const extensionM3U8 = /\.M3U8(?=[?#])|\.M3U8$/gi;



/** 自定义分段对象 */
export class InitConverter {
    init: {
        id: string,

    }[]

    converter = () => { }
    constructor(p: InitConverter) {
        if (p.init && typeof p.converter === "function") {
            this.init = p.init
            this.converter = p.converter
            Object.isFrozen(this)
        }
        throw new PlayerError(2, "MPDConverter : mpd or converter is undefined")
    }
    static canParse(p: URL | Object) {
        return false
    }
    /** 解析 Object To MPDConverter对象  */
    static parse(p: URL | Object) {
        return undefined
    }
}



/**
 * InitObject 解析器
 */
class InitObject implements Processor {


    constructor(addr: URL | Object, options: PlayerOptions) {

        console.log("M3U8", this);
    }
    get(repType: RepType): Array<Representation> {
        throw new Error("Method not implemented.");
    }
    switch(repType: RepType, rep: Representation, options: SwitchRepOptions): void {
        throw new Error("Method not implemented.");
    }
    sourceBufferUpdate(currentTime: Number): void {
        throw new Error("Method not implemented.");
    }
}
const processor: ProcessorType = {
    name: "M3U8",
    asyncFunctionProcessorInstance: async (r: unknown, el: HTMLMediaElement, options: PlayerOptions) => {
        return r instanceof Response && r.ok && extensionM3U8.test(r.url) ?
            new InitObject(r, options) : undefined
    }
}
export default processor