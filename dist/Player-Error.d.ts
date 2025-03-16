/**
 *   播放器 错误类
 *
 */
export declare class PlayerError {
    #private;
    get code(): number;
    get mse(): string;
    get original(): unknown;
    /**
     * @param code 0 url类型错误
     * @param code 1 其它类型错误
     * @param mse 错误信息
     */
    constructor(code: number, mse: string, original?: unknown);
}
