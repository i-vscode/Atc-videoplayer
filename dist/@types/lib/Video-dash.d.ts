import { MPD3 } from './MPD3';
import { MSE } from './MSE';
import { VideoDashOptions, RepresentationRuntime, VideoDash, mediaType } from './e';
import { eventbus, VidoeDashEventType as eventType } from './eventbus';

/** dash流播放器  私有*/
declare class VideoDashPrivate implements VideoDash {
    #private;
    get el(): HTMLVideoElement;
    constructor(id: string | HTMLVideoElement, options?: Partial<VideoDashOptions>);
    on(eventname: eventType.BUFFER_FETCH_STATE, fn: (representation: RepresentationRuntime, controller: AbortController) => void): void;
    on(eventname: eventType.BUFFER_FETCH_END, fn: (representation: RepresentationRuntime, e: number) => void): void;
    on(eventname: eventType.SOURCEBUFFERUPDATEEND, fn: (representation: RepresentationRuntime) => void): void;
    /** 设定画质 */
    SetQuality(mediatype: mediaType, id: number | string, isRemovesourceBuffer?: boolean): void;
    GetQuality(mediatype: mediaType): RepresentationRuntime | undefined;
    GetQualityList(mediatype: mediaType): import('./e').Representation[] | undefined;
    /** 装载MPD文件 */
    loader(url: URL | string): void;
}
export { VideoDashPrivate as VideoDash, MPD3, MSE, eventbus, eventType as VideoDashEventType };
