import { PlayerOptions } from './Player-Options';
import { ValidEvents, Listener } from './Player-Event';
import { Representation } from './Player-Representation';
import { ProcessorFactory, RepType, SwitchRepOptions } from './Player-Processor';

/**
 * 播放器 核心
 *
 * 1、媒体源扩展 API（MSE）和 SourceBuffer 缓存对象的操作
 *
 * 2、媒体分段文件的加载和处理
 */
export declare class PlayerCore {
    #private;
    get el(): HTMLMediaElement;
    constructor(el: HTMLMediaElement | string, options?: Partial<PlayerOptions>);
    /** 添加事件 */
    on<T extends ValidEvents>(event: T, listener: Listener<T>): void;
    /** 移除事件 */
    off<T extends ValidEvents>(event: T, listener: Listener<T>): void;
    /** 添加一次性事件 */
    once<T extends ValidEvents>(event: T, listener: Listener<T>): void;
    /** 装载 MPD文件 | 分段MP4文件 异步*/
    loaderAsync<T>(result: T extends URLString | URL ? URLString | URL : NotBasicOrLiteral<T>, options?: Partial<PlayerOptions>): Promise<(repType: RepType) => (Representation & {
        switch(options?: SwitchRepOptions): void;
    })[]>;
    get(repType: RepType): (Representation & {
        switch(options?: SwitchRepOptions): void;
    })[];
    /** 处理器 遍历器 */
    static processorEntries(): MapIterator<[string, ProcessorFactory]>;
    /** 添加处理器  静态方法*/
    static setProcessor(processorFactory: ProcessorFactory): void;
}
