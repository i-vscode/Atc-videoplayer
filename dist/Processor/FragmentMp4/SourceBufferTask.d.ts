import { Representation, SwitchRepOptions } from '../../../../../../../lib';
import { NormalFragmentMp4Representation } from './FragmentMp4Config';
import { FetchScheduleFactoryMethod } from './FetchSchedule';

/** 源缓存任务类 */
export declare class SourceBufferTask {
    #private;
    constructor(mse: MediaSource, fetchScheduleFactoryMethod: FetchScheduleFactoryMethod);
    sourceBufferUpdate(currentTime: number): boolean;
    /** 移除当前sourceBuffer源并清除适配集和任务列表*/
    remove(): this;
    /** 清除已保存的适配集，当前任务列表 */
    clear(): this;
    run(results?: Array<ArrayBuffer | Uint8Array | (() => void) | undefined> | ArrayBuffer | Uint8Array | (() => void)): this;
    set(fragmentMp4Representations: NormalFragmentMp4Representation[]): this;
    switch(rep: Representation, currentTime: number, options: SwitchRepOptions): void;
    toArray(): Representation[];
}
