 
/**
 * 播放器 配置
 */
export class PlayerOptions {
    /**最小缓冲时间 (秒) */
    minBufferTime: number = 15;
    conversionStrategy: "minBufferTime" | number = "minBufferTime"
    constructor(p?: Partial<PlayerOptions>) {
        Object.assign(this, p) 
        Object.freeze(this)
    }
} 

/**
 * 质量 枚举
 */
export enum QualityTab {
    Auto = "auto",
    P480 = "480P",
    P720 = "720P",
    P1080 = "1080P",
    P10804K = "1080P4K"
}
