
/**
 * 播放器 配置
 */
export class PlayerOptions {
    /**最小缓冲时间 (秒) */
    minBufferTime: number = 15;
    /**最大缓冲时间 (秒)*/
    maxBufferTime: number = 120; 
    /**  转换过期时间  (秒) */
    cconvertExpiryTime: number = 3600;
    /** 源缓冲更新最小频率 (秒) */
    sourceBufferUpdateMinFrequency: number = 2;
    /** 
     * 分段文件 字符串转URL 的转换策略  
     * @example 
     * "MuchPossible" （尽可能的）一次转换最多的分段文件 ，减少转换请求
     * "BufferTime" （缓冲时间）每次根据缓冲时间所需的分段文件 请求转换
     * "InquireNow" （正在查询）仅转换当前需要加载请求的分段文件
     * @deprecated  暂时未实现
     */
    convertStrategy: "InquireNow" | "BufferTime" | "MuchPossible" = "BufferTime"
    /**
     * 调度策略 
     *  @example
     *  "Single" （单次）每次同步请求一个分段文件，完成后请求下一次
     *  "Dynamic" （动态 根据已缓存时间，如果距离缓冲时间太远则单组，否则单次
     * @deprecated  暂时未实现
     */
    fetchScheduleStrategy: "Single" | "Group" | "Dynamic" = "Single"
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
