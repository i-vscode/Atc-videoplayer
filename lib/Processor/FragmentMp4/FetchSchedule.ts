import { PlayerOptions } from "@lib"
import { FMp4Representation } from "./Representation"
import { type RangeTimeType } from "./Segment";
/** fetch方法调度 */
export type FetchSchedule = {
    /**
     * @param currentTime 当前播放时间
     * @param bufferedTime 已经缓存时间
     * @returns Array<Response> | undefined
     */
    (currentTime: number, bufferedTime: number): Promise<Uint8Array | undefined>
}

/** 创建 Fetch调度 */
export type FetchScheduleFactoryMethod = (getFMp4RepresentationMethod: (() => FMp4Representation | undefined)) => FetchSchedule;
/** 创建 Fetch调度工厂 */
export const createFetchScheduleFactoryMethod = (playerOptions: PlayerOptions): FetchScheduleFactoryMethod => { 
    const fetchScheduleFactoryMethod: FetchScheduleFactoryMethod = (getFMp4RepresentationMethod) => { 
        let lastDifferenceRanges = new Set<RangeTimeType>()
        const fetchSchedule = async (currentTime: number, bufferedTime: number) => { 
            if (bufferedTime >= currentTime + playerOptions.maxBufferTime) return undefined; 
            const segment = await getFMp4RepresentationMethod()?.asyncFetchSegment();
            const url = getFMp4RepresentationMethod()?.url;
            if (segment && url) {
                const rangeSet = segment.getMediaRangeSet(bufferedTime, bufferedTime + playerOptions.minBufferTime).difference(lastDifferenceRanges); 
                if (rangeSet.size > 0) {
                    lastDifferenceRanges = rangeSet;
                    const rangeArray = Array.from(rangeSet)
                    const startByteRange = (rangeArray.at(0)?.startByteRange)  
                    const endByteRange = (rangeArray.at(-1)?.endByteRange) 
                    return fetch(url, {headers: {
                        range: `bytes=${startByteRange}-${endByteRange}`
                    }})
                        .then(r => r && r.ok ? r.arrayBuffer():undefined).catch(() => { lastDifferenceRanges = new Set() })
                }
            }
        }
        return fetchSchedule as FetchSchedule
    }
    return fetchScheduleFactoryMethod
}
