import { PlayerOptions, PlayerEventEmitter, SwitchRepOptions } from "@lib"
import type { Representation, Processor, ProcessorType, RepType } from "@lib"
import { MPDDefaultConverter, MPDConverter } from "./Converter"
import { SourceBufferTaskCollection } from "./SourceBufferTaskCollection"
export { type MPDConverter }
/**
 * MPD MSE媒体源处理器
 */
class MPDMSE implements Processor {
    #SourceBufferTaskCollection: SourceBufferTaskCollection
    get(repType: RepType) {
        return this.#SourceBufferTaskCollection.getORset(repType).toArray()
    }
    switch(repType: RepType, rep: Representation, currentTime:number, options: SwitchRepOptions) { 
        this.#SourceBufferTaskCollection.changeType(repType, rep,currentTime, options)
    }
    sourceBufferUpdate(currentTime: number) { this.#SourceBufferTaskCollection.sourceBufferUpdate(currentTime) }
    constructor(sourceBufferTaskCollection: SourceBufferTaskCollection) {
        this.#SourceBufferTaskCollection = sourceBufferTaskCollection
    }

}

const processor: ProcessorType = {
    name: "MPDMSE",
    asyncFunctionProcessorInstance: async (result: unknown, el: HTMLMediaElement, options: PlayerOptions, eventEmitter: PlayerEventEmitter) => {
        const mpdConverter = MPDDefaultConverter.parse(result instanceof Response ? result.url : result)
        if (mpdConverter instanceof MPDDefaultConverter) {
            return mpdConverter.asyncResponse().then(response => { 
                return response.ok ? (new SourceBufferTaskCollection(mpdConverter, el, options, eventEmitter)).asyncSourceopen(response).then(s => {
                   // console.log("mpdmse",s,response);
                   // console.log(response);
                    return new MPDMSE(s)
                }).catch(()=>undefined) : undefined
            })
        }
        return undefined
    }
}
export default processor

