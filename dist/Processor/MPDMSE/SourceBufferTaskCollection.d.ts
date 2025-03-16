import { PlayerEventEmitter, PlayerOptions, SwitchRepOptions, Representation, RepType } from '../../../../../../../lib';
import { MPDDefaultConverter } from './Converter';
import { SourceBufferTask } from './SourceBufferTask';

/** 源缓存任务映射集合 */
export declare class SourceBufferTaskCollection {
    #private;
    constructor(mpdConverter: MPDDefaultConverter, el: HTMLMediaElement, options: PlayerOptions, _eventEmitter: PlayerEventEmitter);
    get duration(): number;
    set duration(val: number);
    sourceBufferUpdate(currentTime: number): void;
    /** 清除所有类型任务的已经排序任务列队 */
    clear(): this;
    /** 设置 SourceBufferTask */
    set(repType: RepType): SourceBufferTask;
    /** 获取 SourceBufferTask*/
    get(repType: RepType): SourceBufferTask | undefined;
    changeType(repType: RepType, rep: Representation, currentTime: number, options: SwitchRepOptions): void;
    asyncSourceopen(res?: Response): Promise<this>;
}
