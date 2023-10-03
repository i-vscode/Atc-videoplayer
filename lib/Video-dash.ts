
import { MPD3 } from "./MPD3"
import { MSE } from "./MSE"
import type { MpdType, VideoDashOptions, RepresentationRuntime, VideoDash, mediaType } from "./e"
import { eventbus, VidoeDashEventType as eventType } from "./eventbus"


/** dash流播放器  私有*/
class VideoDashPrivate implements VideoDash {
    #el: HTMLVideoElement
    get el() { return this.#el; }
    #url?: URL;
    #MPD?: MpdType
    #Period?: MpdType["Period"][number]
    #RepresentationVideo?: RepresentationRuntime
    #RepresentationAudio?: RepresentationRuntime
    #eventbus = new eventbus<eventType>()
    #options: VideoDashOptions = {
        minBufferTime: 200,
        parseinit: (r) => { return r?.SegmentTemplate?.initialization?.replaceAll("$RepresentationID$", r.id ?? "") ?? "" },
        parsemedia(r, currentIndex) {
            let mediaRegExecArray = r.mediaRegExecArray
            if (!mediaRegExecArray) {
                mediaRegExecArray = /\$Number(.*)\$/.exec(
                    r?.SegmentTemplate?.media?.replaceAll("$RepresentationID$", r?.id ?? "") ?? "")
                Reflect.defineProperty(r, "mediaRegExecArray", { get() { return mediaRegExecArray } })
            }
            switch (mediaRegExecArray?.[1]) {
                case "%05d":
                    return mediaRegExecArray.input.replace(mediaRegExecArray[0], (Array(5).join("0") + currentIndex).slice(-5)) ?? ""
                default:
                    return mediaRegExecArray?.input.replace(mediaRegExecArray[0], currentIndex.toString()) ?? ""
            }
        }
    }
    constructor(id: string | HTMLVideoElement, options: Partial<VideoDashOptions> = {}) {
        Object.assign(this.#options, options)
        const mse = new MSE()
        this.#el = typeof id === "string" ? document.getElementById(id) as HTMLVideoElement : id;
        const trigger_BUFFER_PUSH_MEDIASTREAM = ((duration: number) => {
            let lastTime = new Date().getTime()
            return (isseek: boolean = false) => {
                let now = new Date().getTime()
                if (now - lastTime > duration) {
                    if (mse.mediaSource.readyState === "open" || isseek) {
                        if (isseek) {
                            //  this.#RepresentationVideo?.currentfetchabort?.()
                            //  this.#RepresentationAudio?.currentfetchabort?.()
                        }
                        console.log("trigger_BUFFER_PUSH_MEDIASTREAM....", this.el.currentTime, isseek);
                        this.#eventbus.trigger(eventType.BUFFER_PUSH_MEDIASTREAM, this.#RepresentationVideo)
                        this.#eventbus.trigger(eventType.BUFFER_PUSH_MEDIASTREAM, this.#RepresentationAudio)
                        lastTime = now;
                    }

                }
            }
        })(2000)
        this.#el.addEventListener("timeupdate", () => {
            trigger_BUFFER_PUSH_MEDIASTREAM()
        });
        this.#el.addEventListener("seeking", () => {
            console.log("跳转中.....");
            
            trigger_BUFFER_PUSH_MEDIASTREAM(true)
        });
        /** 下载 */
        const download = new class {
            #speed: number = NaN
            get speed() { return this.#speed }
            start() {
                return new class {
                    #startTime: number = (new Date()).getTime();
                    /** 结束速率检测 */
                    end(downloadSize: number) {
                        const endTime = (new Date()).getTime();
                        const duration = (endTime - this.#startTime) / 1000;
                        const speedBps = (downloadSize * 8) / duration;
                        return speedBps
                    }
                }
            }
        }
        const endOfStream = () => {
            if (mse.videoSourceBuffer?.updating || mse.audioSourceBuffer?.updating || mse.mediaSource.readyState == "ended") return
            if (mse.videoSourceBuffer?.buffered?.length > 0 && mse.audioSourceBuffer?.buffered?.length > 0) {
                let videoEndTime = mse.videoSourceBuffer?.buffered.end(mse.videoSourceBuffer?.buffered?.length - 1)
                let audioEndTime = mse.audioSourceBuffer?.buffered.end(mse.audioSourceBuffer?.buffered?.length - 1)
                if (videoEndTime >= mse.mediaSource.duration - 1 && audioEndTime >= mse.mediaSource.duration - 1) {
                    mse.mediaSource.endOfStream()
                }
            }
        } 
        mse.mediaSource.addEventListener("sourceopen", () => { 
            mse.duration = this.#MPD!.mediaPresentationDuration
            this.#Period = this.#MPD?.next()
            if ((this.#Period?.AdaptationSetVideo?.Representation.length ?? 0) > 0) {
                mse.videoSourceBuffer = mse.mediaSource.addSourceBuffer('video/mp4; codecs="av01.0.08M.08"')
                mse.videoSourceBuffer.onupdateend = endOfStream
                mse.videoSourceBuffer.addEventListener("updateend", () => {
                    this.#eventbus.trigger(eventType.SOURCEBUFFERUPDATEEND, this.#RepresentationVideo)
                    this.#eventbus.trigger(eventType.BUFFER_PUSH_MEDIASTREAM, this.#RepresentationVideo)
                })
            }
            if ((this.#Period?.AdaptationSetAudio?.Representation.length ?? 0) > 0) {
                mse.audioSourceBuffer = mse.mediaSource.addSourceBuffer('audio/mp4; codecs="mp4a.40.2"')
                mse.audioSourceBuffer.onupdateend = endOfStream
                mse.audioSourceBuffer.addEventListener("updateend", () => {
                    this.#eventbus.trigger(eventType.SOURCEBUFFERUPDATEEND, this.#RepresentationAudio)
                    this.#eventbus.trigger(eventType.BUFFER_PUSH_MEDIASTREAM, this.#RepresentationAudio)
                })
            }
            this.#eventbus.trigger(eventType.PERIOD_SWITCH_STARTED)
        }, { once: true })

        this.#eventbus.on(eventType.MANIFEST_LOADING_FINISHED, () => {
            if (mse.mediaSource.readyState === "open") { mse.mediaSource.endOfStream() }
            this.#el.src = mse.createObjectURL()
        })
        this.#eventbus.on(eventType.PERIOD_SWITCH_STARTED, () => {
            this.SetQuality("video", 0);
            this.SetQuality("audio", -1)

        })
        const sourceTasksPushBuffer = (arrt: ArrayBuffer, mediatype: mediaType) => {
            switch (mediatype) {
                case "video":
                    mse.vpush((sourceBuffer) => { sourceBuffer?.appendBuffer(arrt) })
                    break;
                case "audio":
                    mse.apush((sourceBuffer) => { sourceBuffer?.appendBuffer(arrt) })
                    break;
            }
        }
        this.#eventbus.on(eventType.BUFFER_PUSH_INITSTREAM, (representation: RepresentationRuntime) => {
            if (representation.initstream) {
                sourceTasksPushBuffer(representation.initstream, representation.mediaType)
            } else {
                if (representation.SegmentTemplate?.initialization && representation.id) {
                    fetch(new URL(this.#options.parseinit(representation), this.#url))
                        .then(arr => arr.arrayBuffer()).then(ab => {
                            Reflect.defineProperty(representation, "initstream", {
                                value: new Uint8Array(ab), writable: false, enumerable: false, configurable: false
                            })
                            sourceTasksPushBuffer(representation.initstream, representation.mediaType)
                        })
                }
            }
        })
        /** 获取下次分布媒体文件的缓冲Url */
        const GetBufferMediaNumber = (representation: RepresentationRuntime) => {
            const buffered = representation.buffered
            /** 经过计算的持续时间 */
            const computedDuratio = representation?.computedDuratio ?? Infinity
            const maxDurationTiem = this.#MPD?.mediaPresentationDuration ?? Infinity;
            const maxDurationNumber = Math.ceil(maxDurationTiem / computedDuratio);
            const minBufferTime = this.#options.minBufferTime;
            const startNumber = representation?.SegmentTemplate?.startNumber ?? 1;
            const buffer = {
                currentNumber: representation.currentfetchindex ?? 0,
                currentTime: this.#el.currentTime,
                StartTime: 0,
                EndTime: 0,
                /** 应该缓冲数量 */
                bufferNumber: NaN
            }
            /** 确定当前进度是否在已有缓冲时间内 */
            for (let index = 0; index < (buffered?.length ?? 0); index++) {
                buffer.EndTime = buffered?.end(index) ?? 0
                buffer.StartTime = buffered?.start(index) ?? 0
                if (buffer.EndTime >= buffer.currentTime) {
                    if (buffer.currentTime >= buffer.StartTime) {
                        buffer.bufferNumber = Math.ceil(
                            (minBufferTime - (buffer.EndTime - buffer.currentTime)) / computedDuratio)
                        buffer.currentTime = buffer.EndTime;
                    }
                    break
                }
            }
            /**  如果应缓冲数量小于 0 则不用缓冲 */
            if (buffer.bufferNumber > 0) {
                buffer.currentNumber++
                if (buffer.currentNumber < maxDurationNumber) {
                    representation.currentfetchindex = buffer.currentNumber
                    return new URL(this.#options.parsemedia(representation, buffer.currentNumber + startNumber), this.#url)
                }
            }
            else if (isNaN(buffer.bufferNumber)) {
                buffer.currentNumber = Math.floor(buffer.currentTime / computedDuratio);
                representation.currentfetchindex = buffer.currentNumber
                return new URL(this.#options.parsemedia(representation, buffer.currentNumber + startNumber), this.#url)
            }
        }
        this.#eventbus.on(eventType.BUFFER_PUSH_MEDIASTREAM, (representation: RepresentationRuntime) => {
            const controller = new AbortController();
            const speedtime = download.start()
            const mediaUrlNumber = GetBufferMediaNumber(representation)
            if (mediaUrlNumber) {
                representation?.currentfetchabort?.()
                representation.currentfetchabort = () => { controller.abort() }
                this.#eventbus.trigger(eventType.BUFFER_FETCH_STATE, representation, controller)
                fetch(mediaUrlNumber, { signal: controller.signal })
                    .then(r => { if (r.status < 400) { return r.arrayBuffer() } throw r }).then(arr => {
                        sourceTasksPushBuffer(new Uint8Array(arr), representation.mediaType)
                        this.#eventbus.trigger(eventType.BUFFER_FETCH_END, representation, speedtime.end(arr.byteLength))
                    }).catch(() => { }).finally(() => { })
            }
        })
        const mediaNumber = /\$Number(.*)\$/
        this.#eventbus.on(eventType.QUALITY_CHANGE_REQUESTED, (mediatype: mediaType, index: number, isRemovesourceBuffer: boolean = false) => {
            switch (mediatype) {
                case "video":
                    this.#RepresentationVideo?.currentfetchabort?.()
                    this.#RepresentationVideo = this.#Period?.AdaptationSetVideo?.Representation.at(index) as RepresentationRuntime | undefined
                    if (this.#RepresentationVideo) {
                        if (!Reflect.has(this.#RepresentationVideo, "SegmentTemplate")) {
                            Reflect.defineProperty(this.#RepresentationVideo, "SegmentTemplate", {
                                get: () => { return this.#Period?.AdaptationSetVideo?.SegmentTemplate }, enumerable: false
                            })
                        }
                        if (!Reflect.has(this.#RepresentationVideo, "mediaRegExecArray")) {
                            Reflect.defineProperty(this.#RepresentationVideo, "mediaRegExecArray", {
                                value: mediaNumber.exec(
                                    this.#RepresentationVideo?.SegmentTemplate?.media?.replaceAll("$RepresentationID$", this.#RepresentationVideo?.id ?? "") ?? "")
                            })
                        }
                        if (!Reflect.has(this.#RepresentationVideo, "buffered")) {
                            Reflect.defineProperty(this.#RepresentationVideo, "buffered", { get() { return mse.videoSourceBuffer.buffered }, })
                        }
                        this.#RepresentationVideo!.computedDuratio ??= Number((
                            (this.#RepresentationVideo?.SegmentTemplate?.duration && this.#RepresentationVideo?.SegmentTemplate?.timescale) ?
                                Math.round((this.#RepresentationVideo?.SegmentTemplate?.duration ?? 0) / (this.#RepresentationVideo?.SegmentTemplate?.timescale ?? 0))
                                : this.#RepresentationVideo?.SegmentTemplate?.duration ?? 0).toFixed(2));
                        if (isRemovesourceBuffer) mse.vpush((sourceBuffer) => { sourceBuffer!.remove(0, this.#el.currentTime + 1) })
                        mse.vpush((sourceBuffer) => {
                            if (sourceBuffer) {
                                sourceBuffer?.changeType(
                                    `${this.#RepresentationVideo?.mimeType ?? "video/mp4"}; codecs="${this.#RepresentationVideo?.codecs
                                    }"`)
                                this.#eventbus.trigger(eventType.BUFFER_PUSH_INITSTREAM, this.#RepresentationVideo)
                            }
                        })
                    }
                    break;
                case "audio":
                    this.#RepresentationAudio?.currentfetchabort?.()
                    this.#RepresentationAudio = (this.#Period?.AdaptationSetAudio?.Representation.at(-1) ?? {}) as RepresentationRuntime | undefined
                    if (this.#RepresentationAudio) {
                        if (!this.#RepresentationAudio?.SegmentTemplate) {
                            Reflect.defineProperty(this.#RepresentationAudio, "SegmentTemplate", {
                                get: () => { return this.#Period?.AdaptationSetAudio?.SegmentTemplate }, enumerable: false
                            })
                        }
                        if (!Reflect.has(this.#RepresentationAudio, "mediaRegExecArray")) {
                            Reflect.defineProperty(this.#RepresentationAudio, "mediaRegExecArray", {
                                value: mediaNumber.exec(
                                    this.#RepresentationAudio?.SegmentTemplate?.media?.replaceAll("$RepresentationID$", this.#RepresentationAudio?.id ?? "") ?? "")
                            })
                        }
                        if (!Reflect.has(this.#RepresentationAudio, "buffered")) {
                            Reflect.defineProperty(this.#RepresentationAudio, "buffered", { get() { return mse.audioSourceBuffer.buffered } })
                        }
                        this.#RepresentationAudio!.computedDuratio ??=
                            (this.#RepresentationAudio?.SegmentTemplate?.duration && this.#RepresentationAudio?.SegmentTemplate?.timescale) ?
                                (this.#RepresentationAudio?.SegmentTemplate?.duration ?? Infinity) / (this.#RepresentationAudio?.SegmentTemplate?.timescale ?? Infinity)
                                : this.#RepresentationAudio?.SegmentTemplate?.duration ?? Infinity;
                        if (isRemovesourceBuffer) mse.apush((sourceBuffer) => { sourceBuffer!.remove(0, this.#el.currentTime + 1) })
                        mse.apush((sourceBuffer) => {
                            if (sourceBuffer) {
                                sourceBuffer?.changeType(
                                    `${this.#RepresentationAudio?.mimeType ?? "audio/mp4"}; codecs="${this.#RepresentationAudio?.codecs ?? "mp4a.40.2"
                                    }"`)
                                this.#eventbus.trigger(eventType.BUFFER_PUSH_INITSTREAM, this.#RepresentationAudio)
                            }
                        })
                    }
                    break
            }
        })
    }
    on(eventname: eventType.BUFFER_FETCH_STATE, fn: (representation: RepresentationRuntime, controller: AbortController,) => void): void;
    on(eventname: eventType.BUFFER_FETCH_END, fn: (representation: RepresentationRuntime, e: number) => void): void;
    on(eventname: eventType.SOURCEBUFFERUPDATEEND, fn: (representation: RepresentationRuntime) => void): void;
    on<T extends eventType>(eventname: T, fn: any) { this.#eventbus.on(eventname, fn) }
    /** 设定画质 */
    SetQuality(mediatype: mediaType, index: number, isRemovesourceBuffer: boolean = false) {
        this.#eventbus.trigger(eventType.QUALITY_CHANGE_REQUESTED, mediatype, index, isRemovesourceBuffer)
    }

    GetQuality(mediatype: mediaType) {
        switch (mediatype) {
            case "video":
                return this.#RepresentationVideo;
            case "audio":
                return this.#RepresentationAudio;
            default:
                return undefined
        }
    }
    GetQualityList(mediatype: mediaType) {
        switch (mediatype) {
            case "video":
                return this.#Period?.AdaptationSetVideo?.Representation
            case "audio":
                return this.#Period?.AdaptationSetAudio?.Representation
            default:
                return undefined
        }
    }

    /** 装载MPD文件 */
    loader(url: URL | string) {
        this.#url = url instanceof URL ? url : new URL(url, window.location.href);
        fetch(url).then(c =>{
             if(c.status<400) return c.text()
             throw c
            }).then(c => {
            this.#MPD = new MPD3(c)
            this.#eventbus.trigger(eventType.MANIFEST_LOADING_FINISHED)
        })
    }
}
export { VideoDashPrivate as VideoDash, MPD3, MSE, eventbus, eventType as VideoDashEventType }