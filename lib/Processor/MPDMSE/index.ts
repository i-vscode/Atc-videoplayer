import { PlayerOptions, Processor, ProcessorType } from "@lib"
import { Converter, MPDConverter } from "./Converter"
import { SourceBufferTaskCollection } from "./SourceBufferTaskCollection"
export { type MPDConverter }
/**
 * MPD MSE媒体源处理器
 */
class MPDMSE extends Processor {
    #SourceBufferTaskCollection: SourceBufferTaskCollection
    getRepList(repType: Parameters<Processor["getRepList"]>[0]) {
        return this.#SourceBufferTaskCollection.get(repType)?.getRepList()
    }
    sourceBufferUpdate(currentTime: number) { this.#SourceBufferTaskCollection.sourceBufferUpdate(currentTime) }
    constructor(sourceBufferTaskCollection: SourceBufferTaskCollection) {
        super()
        this.#SourceBufferTaskCollection = sourceBufferTaskCollection
    }
}
const contentTypeDash = /DASH/i;
const processor: ProcessorType = {
    name: "MPDMSE",
    asyncFunctionProcessorInstance: async (result: unknown, el: HTMLMediaElement, options: PlayerOptions) => {
        const mpdConverter = Converter.parse(result instanceof Response ? result.url : result) 
        return mpdConverter instanceof Converter ?
            mpdConverter.asyncResponse().then(response => { 
                return (response && response.ok && contentTypeDash.test(response.headers.get("content-type") ?? "")) ?
                    (new SourceBufferTaskCollection(mpdConverter, el, options).sourceopen(response)) : undefined;
            }).then(sourceBufferTaskCollection => {
                return sourceBufferTaskCollection ? new MPDMSE(sourceBufferTaskCollection) : undefined
            })
            : undefined
    }
}
export default processor

