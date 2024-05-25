import { MPD, RepType } from "./MPD4";

/** 媒体源推送类设置选项 */
export type VideoDashOptions = {
    /** 初始画质 */
    //  initquality?: QualityType | Array<QualityType>,
    /**最小缓冲时间 (秒) */
    minBufferTime: number,
}
const fetchMpd = async (url: URL, options: VideoDashOptions) => {
    return fetch(url).then(async c => {
        if (c.ok) {
            //const mpd =  
            return Object.assign(new MPD(await c.text()), options)
        }
        return undefined
    },

        () => undefined
    )
}
const debounce = <Fn extends (...args: any) => void>(callback: Fn, delay: number = 200) => {
    let t: number;
    return (...e: Parameters<Fn>) => {
        clearTimeout(t)
        t = setTimeout(() => { callback(e) }, delay);
    }
}
const throttle = <Fn extends (...args: any) => void>(callback: Fn, duration: number = 200) => {
    let lastTime = new Date().getTime()
    return (...e: Parameters<Fn>) => {
        let now = new Date().getTime()
        if (now - lastTime > duration) {
            callback(e);
            lastTime = now;
        }
    }
}

class SourceBufferTask {
    #SourceBuffer: SourceBuffer;
    #Url: URL;
    #MPD: MPD;
    #tasks = { list: [], a: () => { } } as { list: Array<() => void>, a: () => void }
    #arrayBuffers = [] as Array<Uint8Array>
    #Rep: RepType["video"] | RepType["audio"] | undefined;
    /** 最近一个文件下载的比特率 */
    get bitrate() { return this.#bitrate }
    #bitrate = NaN;
    #runTask(tasks: Array<{ url: URL, duration?: number }>) {
        tasks.forEach(t => {
            this.#tasks.list.push(
                () => {
                    const d = performance.now();
                    fetch(t.url).then(f => f.arrayBuffer()).then(a => {
                        try {
                            this.#bitrate = Math.round(a.byteLength * 8 / (performance.now() - d));
                            if (this.#SourceBuffer.updating) {
                                this.#arrayBuffers.push(new Uint8Array(a))
                            } else {
                                this.#SourceBuffer?.appendBuffer(new Uint8Array(a))
                            }
                        } catch { }
                    })
                }
            )
        })
        if (this.#SourceBuffer.updating == false) {
            this.#tasks.list.shift()?.();
        }
    }
    /** 重新设置 rep，需要 mimeType/codecs属性一样才会设置成功*/
    setRep(rep: RepType["video"] | RepType["audio"], url?: URL) {
        if ((this.#Rep?.mimeType !== rep.mimeType || this.#Rep?.codecs !== rep.codecs)) {
            this.#SourceBuffer.changeType(`${rep?.mimeType}; codecs="${rep?.codecs}"`)
            if (rep?.initialization) {
                this.#runTask([{ url: new URL(rep.initialization!, this.#Url) }])
            }
        }
        this.#Rep = rep;
        if (url) this.#Url = url;

    }
    addTask(timeupdate: number, mediaPresentationDuration: number, Ignorebuffered: boolean = false) {
        if (!this.#Rep) return;
        const bufferTime = Number.isFinite(this.#MPD.minBufferTime) ? timeupdate + this.#MPD.minBufferTime : timeupdate;
        const irep = Math.ceil((bufferTime > mediaPresentationDuration ? mediaPresentationDuration : bufferTime) / this.#Rep.duration)
        let buffered = timeupdate;
        if (Ignorebuffered === false) {
            for (let index = 0; index < this.#SourceBuffer?.buffered.length ?? 0; index++) {
                if (this.#SourceBuffer.buffered.start(index) < (timeupdate)) { buffered = this.#SourceBuffer.buffered.end(index); }
                if (buffered > bufferTime) return;
            }
        } else if (Ignorebuffered === true) {
            this.#tasks.list.length = 0
        }
        if (Math.abs(mediaPresentationDuration - buffered) < ((this.#Rep?.duration ?? 2) / 2)) return;
        const tasks = [] as Array<{ url: URL, duration?: number }>
        let segment = this.#Rep.skip(timeupdate > buffered ? timeupdate : buffered);
        if (Ignorebuffered === false && segment.count > this.#Rep.startNumber) segment = segment.next()
        while (segment.media && segment.count <= irep) {
            const url = new URL(segment.media!, this.#Url)
            tasks.push({ url, duration: segment.duration })
            segment = segment.next()
        }
        this.#runTask(tasks)
    }
    constructor(mse: MediaSource, mpd: MPD, url: URL,) {
        this.#SourceBuffer = mse.addSourceBuffer(`video/mp4; codecs="avc1.64001f"`)
        this.#Url = url;
        this.#MPD = mpd;
        console.log("SourceBufferTask", this.#MPD);
        //媒体源 关闭事件
        mse.addEventListener("sourceclose", () => {
            this.#tasks.list.length = 0;
        })
        // 源缓存对象 更新结束事件
        this.#SourceBuffer.addEventListener("updateend", () => {
            const arrayBuffer = this.#arrayBuffers.shift()
            if (arrayBuffer) this.#SourceBuffer?.appendBuffer(arrayBuffer)
            this.#tasks.list.shift()?.()
        })
    }
}

/**  DashPlayer 播放器 */
export class VideoDash {
    get el() { return this.#el }
    #el: HTMLVideoElement
    #MSE = new MediaSource()
    #MPD: MPD | undefined
    #options: VideoDashOptions = new class {
        get minBufferTime() { return this.#minBufferTime }
        set minBufferTime(val) {
            this.#minBufferTime = isFinite(val) ? val : this.#minBufferTime
        }
        #minBufferTime = NaN
    }
    #videoSourceBufferTask?: SourceBufferTask;
    #audioSourceBufferTask?: SourceBufferTask;
    /** 最近视频下载比特率 */
    get videoBitrate() { return this.#videoSourceBufferTask?.bitrate ?? NaN }
    /** 最近音频下载比特率 */
    get audioBitrate() { return this.#audioSourceBufferTask?.bitrate ?? NaN }
    /** 返回视频Rep集 */
    get videoSet() { return this.#videoSet }
    #videoSet: Array<
        {
            /** 此媒体需要传输的比特率*/
            bandwidth: number,
            /** 媒体类型 */
            mimeType: string,
            /** 视频媒体宽度 */
            width: number,
            /** 视频媒体高度 */
            height: number,
            /** 切换使用此rep源 
             * @param timeupdate 要播放的开始时间，不能大于总时间，否则为 0
             * @param Ignorebuffered 默认false 是否忽略已经缓存的数据（软切换），直接使用新数据（强制切换）
            */
            switch(Ignorebuffered?: boolean): void

        }> = []
    get audioSet() { return this.#audioSet }
    #audioSet: Array<{
        /** 此媒体需要传输的比特率*/
        bandwidth: number,
        /** 媒体类型 */
        mimeType: string,
        /***/
        /** 切换使用此rep源 
         * @param timeupdate 要播放的开始时间，不能大于总时间，否则为 0
         * @param Ignorebuffered 默认false 是否忽略已经缓存的数据（软切换），直接使用新数据（强制切换）
         */
        switch(Ignorebuffered?: boolean): void
    }> = []
    constructor(id: string | HTMLVideoElement, options: Partial<VideoDashOptions> = {}) {
        Object.assign(this.#options, options)
        this.#el = typeof id === "string" ? document.getElementById(id) as HTMLVideoElement : id;
        this.#el.addEventListener("seeking", debounce(() => {
            this.#videoSourceBufferTask?.addTask?.(this.#el.currentTime, this.#MSE.duration)
            this.#audioSourceBufferTask?.addTask?.(this.#el.currentTime, this.#MSE.duration)
            //clearInterval(endOfStream)
        }, 500));
        this.#el.addEventListener("timeupdate", throttle(() => {
            if (this.#MSE.readyState === "open") {
                this.#videoSourceBufferTask?.addTask?.(this.#el.currentTime, this.#MSE.duration)
                this.#audioSourceBufferTask?.addTask?.(this.#el.currentTime, this.#MSE.duration);
                if (Math.abs(this.#MSE.duration - this.#el.currentTime) < 2) {
                    this.#MSE.endOfStream()
                }
            }
        }, 2500));
    }
    #URL = new URL(window.location.href)
    /** 装载MPD文件 异步*/
    loaderAsync(addr: URL | string) {
        this.#videoSet.length = 0
        this.#audioSet.length = 0

        this.#videoSourceBufferTask = undefined
        this.#audioSourceBufferTask = undefined
        return new Promise(async (r) => {
            if (this.#el.error) return r(false)
            this.#URL = addr instanceof URL ? addr : new URL(addr, this.#URL);
            this.#MPD = await fetchMpd(this.#URL, this.#options);
            if (!this.#MPD) return r(false);
            this.#options.minBufferTime = isFinite(this.#options.minBufferTime) ? this.#options.minBufferTime : this.#MPD.minBufferTime;
            const sourceopen = () => {
                if (this.#MPD?.mediaPresentationDuration && isFinite(this.#MPD.mediaPresentationDuration) && !isFinite(this.#MSE.duration)) {
                    this.#MSE.duration = this.#MPD.mediaPresentationDuration
                }
                this.#videoSourceBufferTask = new SourceBufferTask(this.#MSE, this.#MPD!, this.#URL);
                this.#audioSourceBufferTask = new SourceBufferTask(this.#MSE, this.#MPD!, this.#URL);
                (this.#MPD?.Period?.[0].videoSet ?? []).forEach(v => this.#videoSet.push({
                    bandwidth: v.bandwidth,
                    width: v.width,
                    height: v.height,
                    mimeType: v.mimeType,
                    switch: (Ignorebuffered = false) => {
                        if (this.#videoSourceBufferTask) {
                            this.#videoSourceBufferTask?.setRep(v);
                            this.#videoSourceBufferTask?.addTask(this.el.currentTime, this.#el.duration, Ignorebuffered)
                            return true;
                        }
                        return false;
                    },
                }));

                (this.#MPD?.Period?.[0].audioSet ?? []).forEach(v => this.#audioSet.push({
                    bandwidth: v.bandwidth,
                    mimeType: v.mimeType,
                    switch: (Ignorebuffered = false) => {
                        if (this.#audioSourceBufferTask) {
                            this.#audioSourceBufferTask?.setRep(v)
                            this.#audioSourceBufferTask?.addTask(this.#el.currentTime, this.#el.duration, Ignorebuffered);
                            return true;
                        }
                        return false;
                    },
                }))
                this.#MSE.removeEventListener("sourceopen", sourceopen);
                return r(true)
            }
            this.#MSE.addEventListener("sourceopen", sourceopen)
            this.#el.src = URL.createObjectURL(this.#MSE);
        })

    }
}