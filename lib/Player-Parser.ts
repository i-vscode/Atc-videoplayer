
/**
 * 异步 播放器 解析器
 * 
 */
class PlayerParser {
    #URL = new URL(window.location.href)
    constructor(addr:URL|string) {
        this.#URL = addr instanceof URL ? addr : new URL(addr, this.#URL);
        return 
    }
}
 