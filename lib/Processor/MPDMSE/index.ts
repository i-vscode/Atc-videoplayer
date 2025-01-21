import { PlayerOptions, PlayerEventEmitter, SwitchRepOptions } from "@lib"
import type { Representation, Processor, ProcessorType, RepType } from "@lib"
import { Converter, MPDConverter } from "./Converter"
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
    switch(repType: RepType, rep: Representation, options: SwitchRepOptions) {

        this.#SourceBufferTaskCollection.changeType(repType,rep,options)
    }
    sourceBufferUpdate(currentTime: number) { this.#SourceBufferTaskCollection.sourceBufferUpdate(currentTime) }
    constructor(sourceBufferTaskCollection: SourceBufferTaskCollection) {
        this.#SourceBufferTaskCollection = sourceBufferTaskCollection
    }
 
}

const processor: ProcessorType = {
    name: "MPDMSE",
    asyncFunctionProcessorInstance: async (result: unknown, el: HTMLMediaElement, options: PlayerOptions, eventEmitter: PlayerEventEmitter) => {
        const mpdConverter = Converter.parse(result instanceof Response ? result.url : result)
        if(mpdConverter instanceof Converter ){
            return  mpdConverter.asyncResponse().then(response => {
                return response.ok  ? Promise.resolve((new SourceBufferTaskCollection(mpdConverter, el, options, eventEmitter)).sourceopen()).then(s=>{
                    return  new MPDMSE(s)
                }) :undefined 
            }) 
        }      
        return undefined
    }
}
export default processor

