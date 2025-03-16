import { PlayerOptions } from "@lib"
import type { PlayerEventEmitter, Processor, ProcessorFactory, Representation, RepType, SwitchRepOptions, } from "@lib"
import { type FragmentMp4Config, createNormalFragmentMp4Config } from "./FragmentMp4Config";
import { SourceBufferTaskCollection } from "./SourceBufferTaskCollection";

/**
 * FragmentMp4Processor
 */
export class FragmentMp4Processor implements Processor {
    #SourceBufferTaskCollection: SourceBufferTaskCollection
    constructor(sourceBufferTaskCollection: SourceBufferTaskCollection) {
        this.#SourceBufferTaskCollection = sourceBufferTaskCollection
    }
    get(repType: RepType): Array<Representation> {
        return this.#SourceBufferTaskCollection.get(repType)?.toArray() ?? []
    }
    switch(repType: RepType, repBase: Representation, currentTime: number, options: SwitchRepOptions): void {
        this.#SourceBufferTaskCollection.switch(repType, repBase, currentTime, options)
    }
    sourceBufferUpdate(currentTime: number): void {
        this.#SourceBufferTaskCollection.sourceBufferUpdate(currentTime)
    }
}
/**
 * 碎片化MP4文件处理器工厂对象
 */
const FragmentMp4Factory: ProcessorFactory = {
    name: "FragmentMp4",
    asyncCreateProcessorInstance: async (r: unknown, el: HTMLMediaElement, options: PlayerOptions, eventEmitter: PlayerEventEmitter) => {
        const normalFragmentMp4Config =createNormalFragmentMp4Config(r)
        return normalFragmentMp4Config ?
            (new SourceBufferTaskCollection(normalFragmentMp4Config, el, options, eventEmitter)).asyncSourceopen().then(s => new FragmentMp4Processor(s))
            : undefined
    }
}
export { FragmentMp4Factory, type FragmentMp4Config }