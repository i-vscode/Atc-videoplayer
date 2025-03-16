/** 防抖 */
export declare const debounce: <Fn extends (...args: any) => any>(callback: Fn, delay?: number) => (...e: Parameters<Fn>) => void;
/** 节流 */
export declare const throttle: <Fn extends (...args: any) => void>(callback: Fn, duration?: number) => (...e: Parameters<Fn>) => void;
/** 除法结果四舍五入到整数 */
export declare const divideAndRound: (dividend: number | string | null, divisor: number | string | null) => number;
/**
 * 解析为正整数
 * @param s 要解析的字符串
 * @param defaultValue 解析失败时的默认值
 * @returns
 */
export declare const parsePositiveInteger: (s: string, defaultValue?: number) => number;
/** 解析一个字符串到 Document*/
export declare const parseFromString: (string: string, type: DOMParserSupportedType) => Document;
