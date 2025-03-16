import { PlayerOptions } from "@lib"
import { MPDDefaultConverter } from "./Converter";
import { type RangeTimeFileType, Segment } from "./Segment";


/** fetch方法调度 */
export type FetchSchedule = {
    /**
     *  载入初始化分段文件 initialization
     * @returns Array<Response> | undefined
     */
    (currentTime: number, bufferedTimeOrInit: "initialization"): Promise<Array<Response> | undefined>,
    /**
     * @param currentTime 当前播放时间
     * @param bufferedTime 已经缓存时间
     * @returns Array<Response> | undefined
     */
    (currentTime: number, bufferedTimeOrInit: number): Promise<Array<Response> | undefined>
}

/** 创建 Fetch调度 */
export type FetchScheduleFactoryMethod = (getSegmentMethod: (() => Segment)) => FetchSchedule



/** 创建 Fetch调度工厂 */
export const createFetchScheduleFactoryMethod = (mpdConverter: MPDDefaultConverter, playerOptions: PlayerOptions): FetchScheduleFactoryMethod => {
    let lastDifferenceRangeTimeFiles = new Set<RangeTimeFileType>()
    let cumulativeQueue = new Array<{
        resolve: (value: Response[]) => void
        rangeTimeFiles: RangeTimeFileType[]
    }>()
    let setTimeoutConut: number | any;
    /** 转换URL缓存 Map集合 */
    const converterCacheURLsMap = new Map<string, URL>()
    /** 上次差异化响应 Map集合 */
    const lastdifferenceResponsesMap = new Map<string, Response>();

    // 系数越大，延迟越小，使用反比计算
    const calculateTimeout = (coefficient: number) => {
        // 系数的最小值，避免除以0 
        const minCoefficient = 0.1;
        // 通过调整 乘数 *500 *1000 来决定懒转换查询是否等待更久或者更快
        const maxDelay = playerOptions.sourceBufferUpdateMinFrequency * 500
        // 使用反比公式，系数大时延迟小，系数小则接近 maxDelay
        const delay = maxDelay / Math.max(coefficient, minCoefficient);;
        // 限制延迟的最大和最小值，避免超出范围
        const minDelay = 100; // 设置最小延迟为100ms
        return Math.max(minDelay, Math.min(delay, maxDelay));
    }

    /** 转换列队获取响应 异步*/
    const asyncConverterQueueFetchResponses = (rangeTimeFilesQqueue: Array<RangeTimeFileType>, isLazyMode = true) => {
        const { promise, resolve } = Promise.withResolvers<Response[]>();
        cumulativeQueue.push({ resolve: resolve, rangeTimeFiles: rangeTimeFilesQqueue })

        const cumulativeDuration = cumulativeQueue.flatMap((currentValue) => currentValue.rangeTimeFiles).reduce((accumulator, currentValue) => {
            const duration = currentValue.endTime - currentValue.startTime;
            return accumulator + (Number.isInteger(duration) ? duration : 0)
        }, 0)
        const delay = calculateTimeout(cumulativeDuration / playerOptions.maxBufferTime);
        if (isLazyMode === false || cumulativeDuration > playerOptions.maxBufferTime) {
            clearTimeout(setTimeoutConut)
            setTimeoutConut = setTimeout(() => {
                const currentQueue = cumulativeQueue;
                const currentRangeTimeFiles = (new Set(currentQueue.flatMap(
                    (currentValue) => currentValue.rangeTimeFiles.map(rangeTimeFile => rangeTimeFile))))
                    .difference(lastDifferenceRangeTimeFiles);
                cumulativeQueue = new Array();
                lastDifferenceRangeTimeFiles = lastDifferenceRangeTimeFiles.union(currentRangeTimeFiles);

                const currentMap = new Map<string, URL>()
                const converters = new Array<string>()
                currentRangeTimeFiles.forEach((r) => {
                    if (converterCacheURLsMap.has(r.file)) {
                        currentMap.set(r.file, converterCacheURLsMap.get(r.file)!)
                    } else {
                        converters.push(r.file)
                    }
                })
                if (converters.length > 0) {
                    mpdConverter.asyncConverter(converters).then(urlsMap => {
                        lastDifferenceRangeTimeFiles = currentRangeTimeFiles
                        cacheConverterURLsMap(urlsMap)
                        asyncFetchResponsesMap(urlsMap).then(responseMap => {
                            currentQueue.forEach(subQueue => {
                                const resolveMap = new Map<string, Response | undefined>()
                                subQueue.rangeTimeFiles.forEach(rangeTimeFile => {
                                    resolveMap.set(rangeTimeFile.file, responseMap.get(rangeTimeFile.file))
                                })
                                subQueue.resolve(cacheResponsesMap(resolveMap))
                            })
                        })
                    })
                } else {
                    currentQueue.forEach(subQueue => { subQueue.resolve([]) })
                }
            }, delay);
        }
        return promise
    }
    //缓存转换URLsMap
    const cacheConverterURLsMap = (urlsMap: Map<string, URL | undefined>) => {
        if (playerOptions.convertExpiryTime > 45) {
            urlsMap.forEach((url, key) => {
                if (url) { converterCacheURLsMap.set(key, url)}
            })
            setTimeout(() => {
                urlsMap.forEach((_url, key) => { converterCacheURLsMap.delete(key)
                    
                })
            }, (playerOptions.convertExpiryTime - 30) * 1000)
        }
    }
    //缓存响应 Map
    const cacheResponsesMap = (responseMap: Map<string, Response | undefined>) => {
        const respnses = new Array()
        responseMap.forEach((value, key) => {
            if (value && value.ok) {
                respnses.push(value); lastdifferenceResponsesMap.set(key, value)
            }
        })
        return respnses
    }
    //  获取响应 Map集合 异步
    const asyncFetchResponsesMap = async (filesMap: Map<string, URL | undefined>) => {
        const responseMap = new Map<string, Response>()
        for (const [key, value] of filesMap) {
            if (lastdifferenceResponsesMap.has(key)) {
                responseMap.set(key, lastdifferenceResponsesMap.get(key)!)
            } else {
                value && responseMap.set(key, await fetch(value).catch(() => Response.error()))
            }
        }
        lastdifferenceResponsesMap.clear()
        return responseMap
    } 
    
    const fetchScheduleFactoryMethod: FetchScheduleFactoryMethod = (getSegmentMethod) => {
        const asyncLastDifferenceFetchURLs = async (rangeTimeFiles: Array<RangeTimeFileType>, isLastFile: boolean) => {
            if (rangeTimeFiles.length < 1) return []
            const normalSet = new Set(cumulativeQueue.flatMap((s) => s.rangeTimeFiles))
            const queueSet = (new Set(rangeTimeFiles)).difference(lastDifferenceRangeTimeFiles).difference(normalSet);
            if (queueSet.size < 1) return []
            return asyncConverterQueueFetchResponses(Array.from(queueSet), isLastFile)
        }
        const fetchSchedule = async (currentTime: number, bufferedTimeOrInit: number | "initialization") => {
            if (typeof currentTime === "number" && Number.isFinite(currentTime)) {
                const segment = getSegmentMethod()
                 
                if (bufferedTimeOrInit === "initialization" && segment.initialization) {
                    return asyncLastDifferenceFetchURLs(
                        [segment.initialization, ...segment.getRangeTimeFiles(currentTime, currentTime + playerOptions.minBufferTime)], false)
                } else if (typeof bufferedTimeOrInit === "number" && Number.isFinite(bufferedTimeOrInit)) {
                    return asyncLastDifferenceFetchURLs(segment.getRangeTimeFiles(bufferedTimeOrInit, currentTime + playerOptions.maxBufferTime), !segment.isLastFile(currentTime + playerOptions.maxBufferTime))
                }
                
            }
            return []
        }
        return fetchSchedule as FetchSchedule
    }
    return fetchScheduleFactoryMethod
} 