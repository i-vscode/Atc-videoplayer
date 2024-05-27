import { VideoControllerbar as VCB, VideoDash, VideoControllerbarbind as CbBing, opt } from './e';

/**
 * js事件节流
 * @param callback 方法
 * @param duration  设置节流时间，默认200
 */
export declare const throttle: <Fn extends (...args: any) => void>(callback: Fn, duration?: number) => (...e: Parameters<Fn>) => void;
export declare class Elextend {
    #private;
    constructor(el?: HTMLElement);
    get options(): opt;
    set options(val: opt);
    get el(): HTMLElement | undefined;
    set el(el: HTMLElement | undefined);
    cb(): void;
}
/** 播放器 UI */
export declare class VideoControllerbar implements VCB {
    #private;
    [x: string]: CbBing;
    videoDiv: CbBing;
    el: CbBing;
    constructor(videoplayer: string | HTMLDivElement, ViodeDash2: VideoDash);
}
