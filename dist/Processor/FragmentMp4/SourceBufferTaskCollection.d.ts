import { PlayerEventEmitter, PlayerOptions, Representation, RepType, SwitchRepOptions } from '../../../../../../../lib';
import { NormalFragmentMp4Config } from './FragmentMp4Config';
import { SourceBufferTask } from './SourceBufferTask';
import { FetchScheduleFactoryMethod } from './FetchSchedule';

/** 源缓存任务映射集合 */
export declare class SourceBufferTaskCollection {
    sourceBufferTaskMap: Map<RepType, SourceBufferTask>;
    mse: MediaSource;
    normafragmentMp4Config: NormalFragmentMp4Config;
    fetchScheduleFactoryMethod: FetchScheduleFactoryMethod;
    el: HTMLMediaElement;
    src: string;
    constructor(normafragmentMp4Config: NormalFragmentMp4Config, el: HTMLMediaElement, options: PlayerOptions, _eventEmitter: PlayerEventEmitter);
    sourceBufferUpdate(currentTime: number): void;
    /** 获取 SourceBufferTask*/
    get(repType: RepType): SourceBufferTask | undefined;
    switch(repType: RepType, rep: Representation, currentTime: number, options: SwitchRepOptions): void;
    /** 刷新 配置对象和重新设置源缓存任务类 */
    refresh(): this;
    asyncSourceopen(): Promise<this>;
}
