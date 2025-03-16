import { Processor, ProcessorFactory, Representation, RepType, SwitchRepOptions } from '../../../../../../../lib';
import { FragmentMp4Config } from './FragmentMp4Config';
import { SourceBufferTaskCollection } from './SourceBufferTaskCollection';

/**
 * FragmentMp4Processor
 */
export declare class FragmentMp4Processor implements Processor {
    #private;
    constructor(sourceBufferTaskCollection: SourceBufferTaskCollection);
    get(repType: RepType): Array<Representation>;
    switch(repType: RepType, repBase: Representation, currentTime: number, options: SwitchRepOptions): void;
    sourceBufferUpdate(currentTime: number): void;
}
/**
 * 碎片化MP4文件处理器工厂对象
 */
declare const FragmentMp4Factory: ProcessorFactory;
export { FragmentMp4Factory, type FragmentMp4Config };
