import { PlayerOptions, PlayerEventEmitter, SwitchRepOptions } from "@lib"
import type { Representation, Processor, ProcessorFactory, RepType } from "@lib"
import { MPDDefaultConverter, MPDConverter } from "./Converter"
import { SourceBufferTaskCollection } from "./SourceBufferTaskCollection"

/**
 * MPD MSE媒体源处理器
 */
class MPDMSEProcessor implements Processor {
    #SourceBufferTaskCollection: SourceBufferTaskCollection
    get(repType: RepType) {
        return this.#SourceBufferTaskCollection.get(repType)?.toArray() ?? []
    }
    switch(repType: RepType, rep: Representation, currentTime: number, options: SwitchRepOptions) {
        this.#SourceBufferTaskCollection.changeType(repType, rep, currentTime, options)
    }
    sourceBufferUpdate(currentTime: number) { this.#SourceBufferTaskCollection.sourceBufferUpdate(currentTime) }
    constructor(sourceBufferTaskCollection: SourceBufferTaskCollection) {
        this.#SourceBufferTaskCollection = sourceBufferTaskCollection
    }

}

const MPDMSEFactory: ProcessorFactory = {
    name: "MPDMSE",
    asyncCreateProcessorInstance: async (result: unknown, el: HTMLMediaElement, options: PlayerOptions, eventEmitter: PlayerEventEmitter) => {
        const mpdConverter = MPDDefaultConverter.parse(result instanceof Response ? result.url : result)
        if (mpdConverter instanceof MPDDefaultConverter) {
            return mpdConverter.asyncResponse().then(response => {
                return response.ok ? (new SourceBufferTaskCollection(mpdConverter, el, options, eventEmitter)).asyncSourceopen(response).then(s => {
                    // console.log("mpdmse",s,response);
                    // console.log(response);
                    return new MPDMSEProcessor(s)
                }).catch(() => undefined) : undefined
            })
        }
        return undefined
    }
}

export { MPDMSEFactory, type MPDConverter }
