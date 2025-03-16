import { Representation, SwitchRepOptions } from '../../../../../../../lib';
import { FetchScheduleFactoryMethod } from './FetchSchedule';
import { Segment } from './Segment';

/** 源缓存任务类 */
export declare class SourceBufferTask {
    #private;
    constructor(mse: MediaSource, fetchScheduleFactoryMethod: FetchScheduleFactoryMethod);
    /** 源缓存更新 */
    sourceBufferUpdate(currentTime: number): this;
    isLastFile(currentTime: number): boolean;
    clear(): this;
    /**  设置 Representation 类型的键 和 获取 SegmentFiles的方法 */
    set(args: [Representation, Segment]): this;
    run(results?: Array<Response | ArrayBuffer | (() => void)> | Response | ArrayBuffer | (() => void)): this;
    /**切换 Representation  */
    switch(rep: Representation, currentTime: number, options: SwitchRepOptions): this;
    toArray(): Representation[];
}
