import { PlayerEventEmitter } from "./Player-Event"
import { PlayerOptions } from "./Player-Options"
import type { Representation } from "./Player-Representation"

/** Representation 相关类型 */
export type RepType = HintedString<"video" | "audio">
/** 更改 Representation 类型选项 */
export type SwitchRepOptions = {
    /** 切换模式 */
    switchMode: "soft" | "radical"
}

/**
 *播放器 处理器抽象类
 */
export type Processor = {
    /**
     * 更新源缓冲
     * @param timeupdate 当前播放时间 
     */
    sourceBufferUpdate(currentTime: number): void

    /** 获取适配描述(基本) 列表 */
    get(repType: RepType): Array<Representation>

    /** 切换 Representation 类型 */
    switch(repType: RepType, rep: Representation, currentTime: number, options: SwitchRepOptions): void

}
/**
 * 判断给定的对象是否符合 Processor 类型的结构
 * @param processor 
 * @returns 
 */
export const isProcessor = (processor: unknown): processor is Processor => {
    return (
        !!processor && typeof processor === "object" &&
        typeof Reflect.get(processor, "sourceBufferUpdate") === "function" &&
        typeof Reflect.get(processor, "get") === "function" &&
        typeof Reflect.get(processor, "switch") === "function"
    );
};

/**播放器 处理器工厂对象 用于创建处理器实例*/
export type ProcessorFactory = {
    /** 处理器 名称 */
    name: string
    /** 
     * 异步方法 创建处理器实例
     * @returns 返回 undefined 则表示此处理器不支持此类型参数 </p>
     * */
    asyncCreateProcessorInstance: (result: unknown, el: HTMLMediaElement, options: PlayerOptions, eventEmitter: PlayerEventEmitter) => Promise<Processor | undefined>
}
/**
 * 判断给定的对象是否符合 ProcessorFactory 类型的结构
 * @param processorFactory 
 * @returns 
 */
export const isProcessorFactory = (processorFactory: unknown): processorFactory is ProcessorFactory => {
    return (
        !!processorFactory && typeof processorFactory === "object" &&
        typeof Reflect.get(processorFactory, "name") === "string" &&
        typeof Reflect.get(processorFactory, "asyncCreateProcessorInstance") === "function"
    );
};
