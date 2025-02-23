

/**
 *   播放器 错误类
 * 
 */
export class PlayerError {
    #code: number = 0
    get code() { return this.#code }
    #mse: string = ""
    get mse() { return this.#mse }
    #original: unknown
    get original() { return this.#original }
    /**
     * @param code 0 url类型错误
     * @param code 1 其它类型错误
     * @param mse 错误信息
     */
    constructor(code: number, mse: string, original?: unknown) {
        this.#code = code
        this.#mse = mse
        this.#original = original
    }
}
