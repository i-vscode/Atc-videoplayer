import { PlayerOptions } from '../../../../../../../lib';
import { FMp4Representation } from './Representation';

/** fetch方法调度 */
export type FetchSchedule = {
    /**
     * @param currentTime 当前播放时间
     * @param bufferedTime 已经缓存时间
     * @returns Array<Response> | undefined
     */
    (currentTime: number, bufferedTime: number): Promise<Uint8Array | undefined>;
};
/** 创建 Fetch调度 */
export type FetchScheduleFactoryMethod = (getFMp4RepresentationMethod: (() => FMp4Representation | undefined)) => FetchSchedule;
/** 创建 Fetch调度工厂 */
export declare const createFetchScheduleFactoryMethod: (playerOptions: PlayerOptions) => FetchScheduleFactoryMethod;
