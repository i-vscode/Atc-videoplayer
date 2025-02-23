/** 防抖 */
export const debounce = <Fn extends (...args: any) => any>(callback: Fn, delay: number = 200) => {
    let t: number | any
    return (...e: Parameters<Fn>) => {
        clearTimeout(t)
        t = setTimeout(() => { callback(...e) }, delay);
    }
}
/** 节流 */
export const throttle = <Fn extends (...args: any) => void>(callback: Fn, duration: number = 200) => {
    let lastTime = new Date().getTime()
    return (...e: Parameters<Fn>) => {
        let now = new Date().getTime()
        if (now - lastTime > duration) {
            callback(e);
            lastTime = now;
        }
    }
}
/** 除法结果四舍五入到整数 */
export const divideAndRound = (dividend: number | string | null, divisor: number | string | null) => {
    dividend = typeof dividend === "string" ? parseInt(dividend) : dividend;
    divisor = typeof divisor === "string" ? parseInt(divisor) : divisor; 0
    return Math.round((dividend ?? 0) / (divisor ?? 0))
}
/**
 * 解析为正整数 
 * @param s 要解析的字符串
 * @param defaultValue 解析失败时的默认值
 * @returns 
 */
export const parsePositiveInteger = (s: string, defaultValue = 0) => {
    defaultValue = typeof defaultValue === "number" ? defaultValue : 0
    const num = Number.parseInt(s)
    return Number.isInteger(num) && num >= 0 ? num : defaultValue
}
/** 解析一个字符串到 Document*/
export const parseFromString = (() => {
    const domParser = new DOMParser()
    return (string: string, type: DOMParserSupportedType) => domParser.parseFromString(string, type)
})()