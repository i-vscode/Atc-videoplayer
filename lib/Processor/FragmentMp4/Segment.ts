
import { parseFMP4Metadata } from "./FindStructure";
/** 范围时间段文件类型 */
export type RangeTimeType = Readonly<{
    startTime: number,
    endTime: number,
    startByteRange: number,
    endByteRange: number
}>



/** 分段文件类 */
export class Segment {
    #rangeTimes = new Array<RangeTimeType>();
    #duration: number = NaN
    get duration() { return this.#duration }
    constructor(initSidxMetadataArrayBuffer: ArrayBuffer, byteOffset: number) {
        const initSidxMetadata = parseFMP4Metadata(initSidxMetadataArrayBuffer);
        if (initSidxMetadata) {

            this.#duration = initSidxMetadata.duration
            const timescale = initSidxMetadata?.inddexRange.timescale;
            initSidxMetadata?.inddexRange.references.reduce((accumulator, reference) => {
                const currentRangeTime = {
                    startTime: Math.trunc(accumulator.float / 100),
                    endTime: Math.ceil((accumulator.float / 100 + (reference.subsegment_duration / timescale))),
                    float: accumulator.float + Math.trunc((reference.subsegment_duration / timescale) * 100),
                    byteOffset: accumulator.byteOffset + accumulator.byteLength,
                    byteLength: reference.referenced_size,
                }
                this.#rangeTimes.push({
                    startTime: currentRangeTime.startTime,
                    endTime: currentRangeTime.endTime,
                    startByteRange: currentRangeTime.byteOffset,
                    endByteRange: currentRangeTime.byteOffset + currentRangeTime.byteLength - 1
                })
                return currentRangeTime
            }, { startTime: 0, endTime: 0, float: 0, byteLength: 0, byteOffset: byteOffset })
        }
    } 
    /** 获取媒体时间段范围 */
    getMediaRangeSet(startTime: number, endTime: number) {
        const ranges = new Set<RangeTimeType>()
        for (const r of this.#rangeTimes) {
            if (r.startTime > endTime) break;
            if (startTime <= r.endTime && endTime >= r.startTime) {
                if (r === this.#rangeTimes.at(-1)) {
                    ranges.add({
                        startTime: r.endTime,
                        endTime: r.endTime,
                        startByteRange: r.startByteRange,
                        endByteRange: 0
                    })
                } else {

                    ranges.add(r)
                }
            }
        }
        return ranges
    }
}