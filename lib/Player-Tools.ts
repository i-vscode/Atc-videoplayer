/** 防抖 */
export const debounce = <Fn extends (...args: any) => void>(callback: Fn, delay: number = 200) => {
    let t: number | any
    return (...e: Parameters<Fn>) => {
        clearTimeout(t)
        t = setTimeout(() => { callback(e) }, delay);
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

/** 解析为正整数 */
export const parsePositiveInteger = (s: string, illegal = 0) => {
    illegal = typeof illegal === "number" ? illegal : 0
    const num = Number.parseInt(s)
    return Number.isInteger(num) && num >= 0 ? num : illegal
}
/** 解析一个字符串到 Document*/
export const parseFromString = (() => {
    const domParser = new DOMParser()
    return (string: string, type: DOMParserSupportedType) => domParser.parseFromString(string, type)
})()