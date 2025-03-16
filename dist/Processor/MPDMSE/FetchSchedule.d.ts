import { PlayerOptions } from '../../../../../../../lib';
import { MPDDefaultConverter } from './Converter';
import { Segment } from './Segment';

/** fetch方法调度 */
export type FetchSchedule = {
    /**
     *  载入初始化分段文件 initialization
     * @returns Array<Response> | undefined
     */
    (currentTime: number, bufferedTimeOrInit: "initialization"): Promise<Array<Response> | undefined>;
    /**
     * @param currentTime 当前播放时间
     * @param bufferedTime 已经缓存时间
     * @returns Array<Response> | undefined
     */
    (currentTime: number, bufferedTimeOrInit: number): Promise<Array<Response> | undefined>;
};
/** 创建 Fetch调度 */
export type FetchScheduleFactoryMethod = (getSegmentMethod: (() => Segment)) => FetchSchedule;
/** 创建 Fetch调度工厂 */
export declare const createFetchScheduleFactoryMethod: (mpdConverter: MPDDefaultConverter, playerOptions: PlayerOptions) => FetchScheduleFactoryMethod;
