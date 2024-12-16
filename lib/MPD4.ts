
//const reptms = /^PT(\d+H)*(\d+M)*(\d+S)*/;
const mediaReg = /\$Number%(\d+)d\$/

const reptms = /^PT(?:(\d+\.*\d*)H)?(?:(\d+\.*\d*)M)?(?:(\d+\.*\d*)S)?$/;

/** PT时间段转换为秒 */
const PTdurationToSeconds = (PT?: unknown) => {
    let hours = 0, minutes = 0, seconds = 0
    if (typeof PT === "string") {
        if (reptms.test(PT)) {
            var matches = reptms.exec(PT);
            if (matches?.[1]) hours = Number(matches[1]);
            if (matches?.[2]) minutes = Number(matches[2]);
            if (matches?.[3]) seconds = Number(matches[3]);
            // return  (hours * 3600 + minutes * 60 + seconds); 
            return Number((hours * 3600 + minutes * 60 + seconds).toFixed(2));
        }
    }
    return NaN
}


/**　分段模块 */
class SegmentTemplate {
    /** 持续时间  (持续时间 / 刻度 = 分段时长) */
    get duration() { return this.#duration }
    #duration = NaN
    /** 分段时长 (持续时间 / 刻度 = 分段时长)  */
    segmentduration = NaN
    /** 初始化安装文件 */
    get initialization() { return this.#initialization }
    #initialization = ""
    /** 媒体文件模板 */
    #getMedia(i: number) {
        const mediaRegExecArray = mediaReg.exec(this.#mediaTemplate)

        if (mediaRegExecArray) {
            const d = parseInt(mediaRegExecArray[1])
            return this.#mediaTemplate.replace(mediaRegExecArray[0], (Array(d).join("0") + i).slice(0 - d))
        }
        return undefined
    }
    #mediaTemplate = ""

    /** 开始数 */
    get startNumber() { return this.#startNumber }
    #startNumber = NaN

    /** 跳转 计数*/
    skipCount(i: number) {
        if (i > 0 && this.#S && i <= this.#S.length) {
            return {
                duration: (this.#S[i - 1]),
                count: i,
                media: this.#getMedia(i)
            }
        }
        else if (i > 0 && !this.#S) {
            return {
                duration: this.#duration,
                count: i,
                media: this.#getMedia(i)
            }
        }
        return { duration: NaN, count: NaN, media: undefined }
    }

    /** 时间线数组 SegmentTimeline/S */
    #S = undefined as Array<number> | undefined

    constructor(el: Element, representationID: string) {
        let timescale = 0, duration = 0
        for (const attr of el.attributes) {
            switch (attr.localName) {
                case "initialization":
                    this.#initialization = attr.value.replace("$RepresentationID$", representationID);
                    break;
                case "media":
                    this.#mediaTemplate = attr.value.replace("$RepresentationID$", representationID);
                    break;
                case "startNumber":
                    this.#startNumber = parseInt(attr.value);
                    break;
                case "timescale":
                    timescale = parseInt(attr.value);
                    break;
                case "duration":
                    duration = parseInt(attr.value);
                    break;
                default:
                    Reflect.set(this, attr.localName, attr.value)
                    break;
            }
        }
        for (const children of el.children) {
            if (children.localName === "SegmentTimeline") {
                this.#S = [];
                for (const Schildren of children.children) {
                    if (Schildren.localName === "S") {
                        for (const arrt of Schildren?.attributes) {
                            if (arrt.localName === "d") {
                                this.#S.push(
                                    Math.floor((parseInt(arrt.value) / timescale) * 100) / 100); break;
                            }
                        }
                        continue;
                    }
                }
                break;
            }
        }
        if (this.#S && this.#S.length > 0) {
            this.#duration = Math.floor((this.#S.reduce((previous, current) => current += previous) / this.#S.length) * 100) / 100;
        } else {
            this.#duration = Math.floor((duration / timescale) * 100) / 100;
        }
    }
}

/** 表示 媒体不同的清晰度，音频不同质量 */
class Representation {
    [key: string]: any

    /** id */
    get id() { return this.#id }
    #id = ""
    /** 媒体类型 */
    mimeType = ""

    /**编码器 */
    codecs = ""

    /**字节带宽 */
    get bandwidth() { return this.#bandwidth }
    set bandwidth(val) { this.#bandwidth = Number.parseInt(val as any) }
    #bandwidth = 0

    /** 帧率 */
    get frameRate() { return this.#frameRate }
    #frameRate = NaN

    /** 媒体比例 */
    sar = ""
    /** 媒体宽度 */
    get width() { return this.#width }
    #width = NaN

    /**初始化文件 */
    get initialization() { return this.#segment?.initialization }

    /** 媒体高度 */
    get height() { return this.#height }
    #height = NaN

    #segment = undefined as SegmentTemplate | undefined

    /** 持续时间  (持续时间 / 刻度 = 分段时长) */
    get duration() { return this.#segment?.duration ?? NaN }
    /** 开始数 */
    get startNumber() { return this.#segment?.startNumber ?? NaN }


    /** 跳转 计数 */
    skipCount(i: number) { return this.#segment?.skipCount(i) ?? { duration: NaN, count: NaN, media: undefined } }

    constructor(representation: Element) {
        for (const attr of representation.attributes) {
            if (attr.localName === "id") { this.#id = attr.value; continue }
            if (attr.localName === "frameRate") {
                const parts = attr.value.split("/");
                this.#frameRate = parseInt(parts[0]) / parseInt(parts[1]);
                continue
            }
            if (attr.localName === "width") { this.#width = Number.parseInt(attr.value); continue }
            if (attr.localName === "height") { this.#height = Number.parseInt(attr.value); continue }
            Reflect.set(this, attr.localName, attr.value)
        }
        for (const children of representation.children) {
            if (children.localName === "SegmentTemplate") {
                this.#segment = new SegmentTemplate(children, this.id);
                break;
            }
        }
    }
}

/** 适配集 */
class AdaptationSet {
    [key: string]: any
    get contentType() { return this.#contentType }
    #contentType = "";
    get representation() { return this.#representation }
    #representation = [] as Array<Representation>
    /** 帧率 */
    get frameRate() { return this.#frameRate }
    #frameRate = NaN

    constructor(adaptationSet: Element) {
        for (const attr of adaptationSet.attributes) {
            if (attr.localName === "contentType") { this.#contentType = attr.value; continue; }
            if (attr.localName === "frameRate") {
                const parts = attr.value.split("/");
                this.#frameRate = parseInt(parts[0]) / parseInt(parts[1]);
                continue
            }
            Reflect.set(this, attr.localName, attr.value)
        }
        for (const children of adaptationSet.children) {
            if (children.localName === "Representation") {
                this.#representation.push(new Representation(children))
            }
        }
    }
}
export type Segment = {
    /** 此分段文件的平均持续时间 */
    duration: number,
    /** 当前 media 计数*/
    count: number,
    /** 当前分段文件 */
    media?: string,
    /** 跳转时间 */
    skip(index: number): Segment
    /** 返回下一个媒体分段 */
    next(): Segment
    /** 返回上一个媒体分段 */
    previous(): Segment
}
export type RepType = {
    video: {
        /** id */
        id: string,
        /** 初始分段文件 */
        initialization?: string,
        /** 编码器 */
        codecs: string
        /** 类型 */
        mimeType: string,
        /**此媒体需要传输的比特率 */
        bandwidth: number,
        /** 视频宽度 */
        width: number,
        /**视频高度 */
        height: number,
        /** 帧率 */
        frameRate: number,
        /** 开始数 */
        startNumber: number
    } & Segment,
    audio: {
        /** id */
        id: string,
        /** 初始分段文件 */
        initialization?: string,
        /** 编码器 */
        codecs: string
        /** 类型 */
        mimeType: string,
        /** 此媒体需要传输的比特率 */
        bandwidth: number,
        /** 开始数 */
        startNumber: number
    } & Segment,

}
/** 媒体阶段 */
class Period {
    #adaptationSetVideo = [] as Array<AdaptationSet>
    #adaptationSetAudio = [] as Array<AdaptationSet>

    get start() { return this.#start }
    set start(val) { this.#start = PTdurationToSeconds(val) }
    #start = NaN

    /** 视频适配集 */
    get videoSet() { return this.#videoSet }
    #videoSet = [] as Array<RepType["video"]>
    /** 音频适配集 */
    get audioSet() { return this.#audioSet }
    #audioSet = [] as Array<RepType["audio"]>
    constructor(period: Element) {
        for (const attr of period.attributes) {
            Reflect.set(this, attr.localName, attr.value)
        }
        for (const children of period.children) {
            if (children.localName === "AdaptationSet") {
                const _adaptationSet = new AdaptationSet(children)
                if (_adaptationSet.contentType.startsWith("video")) {
                    this.#adaptationSetVideo.push(_adaptationSet)
                }
                else if (_adaptationSet.contentType.startsWith("audio")) {
                    this.#adaptationSetAudio.push(_adaptationSet)
                }
            }
        }
        const videoNext = (rep: Representation): Segment => {
            let i = rep.startNumber
            const segment: Segment = {
                ...rep.skipCount(i),
                skip(duration) {
                    i = Math.floor(duration / rep.duration)
                    if (i < rep.startNumber) i = rep.startNumber
                    return { ...rep.skipCount(i), skip: segment.skip, next: segment.next, previous: segment.previous }
                },
                next() { return { ...rep.skipCount(++i), skip: segment.skip, next: segment.next, previous: segment.previous } },
                previous() { return { ...rep.skipCount(--i), skip: segment.skip, next: segment.next, previous: segment.previous } }
            }
            return segment
        }

        const audioNext = (rep: Representation): Segment => {
            let i = rep.startNumber
            const segment: Segment = {
                ...rep.skipCount(i),
                skip(duration) {
                    i = Math.floor(duration / rep.duration)
                    if (i < rep.startNumber) i = rep.startNumber
                    return { ...rep.skipCount(i), skip: segment.skip, next: segment.next, previous: segment.previous }
                },
                next() { return { ...rep.skipCount(++i), skip: segment.skip, next: segment.next, previous: segment.previous } },
                previous() { return { ...rep.skipCount(--i), skip: segment.skip, next: segment.next, previous: segment.previous } }
            }
            return segment
        }

        this.#adaptationSetVideo.forEach(v => {
            v.representation.forEach(r => {
                this.#videoSet.push({
                    ...videoNext(r),
                    id:r.id,
                    initialization: r.initialization,
                    codecs: r.codecs,
                    mimeType: r.mimeType,
                    bandwidth: r.bandwidth,
                    width: r.width,
                    height: r.height,
                    frameRate: isNaN(r.frameRate) ? v.frameRate : r.frameRate,
                    startNumber: r.startNumber
                })
            })
        }),
            this.#adaptationSetAudio.forEach(a => {
                a.representation.forEach(r => {
                    this.#audioSet.push({
                        ...audioNext(r),
                        id:r.id, 
                        initialization: r.initialization,
                        codecs: r.codecs,
                        mimeType: r.mimeType,
                        bandwidth: r.bandwidth,
                        startNumber: r.startNumber
                    })
                })
            })
    }

}


/** MPD清单解析器 文件处理类 */
export class MPD {
    [key: string]: any


    /** 总的时长 持续时间 */
    get mediaPresentationDuration() { return this.#mediaPresentationDuration }
    //set mediaPresentationDuration(val) { this.#mediaPresentationDuration = PTdurationToSeconds(val) }
    #mediaPresentationDuration = NaN

    /** 最大分段场持续时间  指的是加载的 每个m4s段的最大时间  */
    get maxSegmentDuration() { return this.#maxSegmentDuration }
    set maxSegmentDuration(val) { this.#maxSegmentDuration = PTdurationToSeconds(val) }
    #maxSegmentDuration = NaN

    /** 最小缓存时间 */
    get minBufferTime() { return this.#minBufferTime }
    set minBufferTime(val) {
        console.log("MPD4",val);
        
        if (isFinite(val)) this.#minBufferTime = PTdurationToSeconds(val);
    }
    #minBufferTime = NaN

    /** 媒体阶段数组 */
    get Period() { return this.#Period }
    #Period = [] as Array<Period>

    constructor(mpdstring: string) {
        const mpd = new DOMParser().parseFromString(mpdstring, "text/xml").documentElement;
        for (const attr of mpd.attributes) {
            if (attr.localName === "mediaPresentationDuration") {
                this.#mediaPresentationDuration = PTdurationToSeconds(attr.value); continue;
            }
            if (attr.localName === "minBufferTime") {
                this.#minBufferTime = PTdurationToSeconds(attr.value); continue;
            }
            Reflect.set(this, attr.localName, attr.value)
        }
        for (const children of mpd.children) {
            switch (children.localName) {
                case "Period":
                    this.#Period.push(new Period(children)); break;
            }
        }
    }
}
