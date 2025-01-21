import { Converter } from "./Converter";

/** fetch方法调度 */
export type FetchSchedule = {
    (keys: string): Promise<Response>,
    (keys: string[]): Promise<Response[]>,
    (startTime: number, endTime: number): Promise<Response[]>
}

/** 创建 fetch方法调度 */
export type CreateFetchSchedule = (getSegmentFiles: ((startTime: number, endTime: number) => Array<string>)) => FetchSchedule
 
/** 创建 fetch方法调度控制中心 */
export const createFetchScheduleControlCenter = (mpdConverter: Converter): CreateFetchSchedule => {
    const fetchURLs = async (keys: string[]) => {
        const urlMap = await mpdConverter.asyncConverter(keys);
        const fetchs = keys.map(key => urlMap.has(key) ? fetch(urlMap.get(key)!).catch(()=>Response.error()) : Response.error());
        return await Promise.all(fetchs);
    }
    return (getSegmentFiles): FetchSchedule => {
        const fetchSchedule = async (keysOrStartTime: string | string[] | number, bufferTime?: number) => {
            if (typeof keysOrStartTime === "string") {
                return fetchURLs([keysOrStartTime]).then(responses => {
                    return responses[0]
                })
            } else if (Array.isArray(keysOrStartTime)) {
                return fetchURLs(keysOrStartTime)
            } else if (Number.isFinite(keysOrStartTime) && Number.isFinite(bufferTime)) {
                const sfies = getSegmentFiles(keysOrStartTime,keysOrStartTime +  bufferTime!) 
                return fetchURLs(sfies) 
            }
            return []
        }
        return fetchSchedule as FetchSchedule
    }
} 