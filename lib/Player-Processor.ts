import { PlayerEventEmitter } from "./Player-Event"
import { PlayerOptions } from "./Player-Options"
import type { Representation } from "./Player-Representation"

/** Representation 相关类型 */
export type RepType = HintedString<"video" | "audio">
/** 更改 Representation 类型选项 */
export type SwitchRepOptions = {
    /** 切换模式 */
    switchMode: "soft" | "radical" | "disable"
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

    /** 获取适配集描述列表 */
    get(repType: RepType): Array<Representation>

    /** 切换 Representation 类型 */
    switch(repType: RepType, rep: Representation, options: SwitchRepOptions): void

}
export const isProcessor = (processor: unknown): processor is Processor => {
    return (
        !!processor && typeof processor === "object" &&
        typeof Reflect.get(processor, "sourceBufferUpdate") === "function" &&
        typeof Reflect.get(processor, "get") === "function" &&
        typeof Reflect.get(processor, "switch") === "function"
    );
};

/**播放器 处理器的类型对象*/
export type ProcessorType = {
    /** 处理器 名称 */
    name: unknown
    /** 
     * 异步方法 获取处理器实例
     * @returns 返回 undefined 则表示此处理器不支持此类型参数 </p>
     * */
    asyncFunctionProcessorInstance: (result: unknown, el: HTMLMediaElement, options: PlayerOptions, eventEmitter: PlayerEventEmitter) => Promise<Processor | undefined>
}


