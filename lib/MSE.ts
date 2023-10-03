export class MSE {
    #mediaSource: MediaSource = new MediaSource();
    get mediaSource() { return this.#mediaSource }
    videoSourceTasks: ((...args: any) => void)[] = []
    audioSourceTasks: ((...args: any) => void)[] = [];
    createObjectURL: () => string;
    #videoSourceBuffer!: SourceBuffer
    #audioSourceBuffer!: SourceBuffer
    videoSourceBuffer!: SourceBuffer
    audioSourceBuffer!: SourceBuffer
    vpush: (fn: (sourceBuffer?: SourceBuffer) => void) => void;
    apush: (fn: (sourceBuffer?: SourceBuffer) => void) => void
    set duration(val: number) { this.#mediaSource.duration = val }
    constructor() {
      
        Reflect.defineProperty(this, "videoSourceBuffer", {
            get() { return this.#videoSourceBuffer },
            set(val: SourceBuffer) {
                if (val instanceof SourceBuffer) {
                    this.#videoSourceBuffer = val
                    val.onupdate = () => {
                        if (this.#videoSourceBuffer?.updating === false) this.videoSourceTasks?.shift()?.()
                    }
                   // val.onupdateend = endOfStream
                }
            },
        })
        Reflect.defineProperty(this, "audioSourceBuffer", {
            get() { return this.#audioSourceBuffer },
            set(val: SourceBuffer) {
                if (val instanceof SourceBuffer) {
                    this.#audioSourceBuffer = val;
                    val.onupdate = () => {
                        if (this.#audioSourceBuffer?.updating === false) this.audioSourceTasks?.shift()?.()
                    }
                 //   val.onupdateend = endOfStream
                }
            },
        })
        this.createObjectURL = () => {
            return URL.createObjectURL(this.#mediaSource);
        }

        this.vpush = (fn: (sourceBuffer?: SourceBuffer) => void) => {
            this.videoSourceTasks.push(() => { fn(this.#videoSourceBuffer) })
            if (this.#videoSourceBuffer?.updating === false) this.videoSourceTasks?.shift()?.()
        }
        this.apush = (fn: (sourceBuffer?: SourceBuffer) => void) => {
            this.audioSourceTasks.push(() => { fn(this.#audioSourceBuffer) })
            if (this.#audioSourceBuffer?.updating === false) this.audioSourceTasks?.shift()?.()
        }
    }
}