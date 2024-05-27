import { MpdType } from './e';

/** MPD清单文件处理类 */
export declare class MPD3 implements MpdType {
    constructor(mpdstring: string);
    next(): any;
    minBufferTime: number;
    mediaPresentationDuration: number;
    Period: MpdType["Period"];
}
