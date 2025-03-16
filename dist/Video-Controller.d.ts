/**
 * 播放器 控制器
 */
declare class Controllerbar {
    #private;
    get played(): HTMLElement | undefined;
    set played(val: HTMLElement | undefined);
    constructor(video?: HTMLVideoElement, bar?: Element);
}
/** DashPlayer 播放器 控制器 */
export declare class VideoController {
    #private;
    get controllerbar(): Controllerbar;
    constructor(id: string | HTMLDivElement);
}
export {};
