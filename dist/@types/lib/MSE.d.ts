export declare class MSE {
    #private;
    get mediaSource(): MediaSource;
    videoSourceTasks: ((...args: any) => void)[];
    audioSourceTasks: ((...args: any) => void)[];
    createObjectURL: () => string;
    videoSourceBuffer: SourceBuffer;
    audioSourceBuffer: SourceBuffer;
    vpush: (fn: (sourceBuffer?: SourceBuffer) => void) => void;
    apush: (fn: (sourceBuffer?: SourceBuffer) => void) => void;
    set duration(val: number);
    constructor();
}
