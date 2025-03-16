import { Representation, SwitchRepOptions } from "@lib";
import { NormalFragmentMp4Representation } from "./FragmentMp4Config";
import { FetchSchedule, FetchScheduleFactoryMethod } from "./FetchSchedule";
import { FMp4Representation } from "./Representation";
/** 源缓存任务类 */
export class SourceBufferTask {
    #repSet = new Set<Representation>()
    #mse: MediaSource;
    #sourceBuffer: SourceBuffer;
    #currentRep?: FMp4Representation
    #fetch: FetchSchedule
    #tasks = new Array<(() => void) | undefined>()

    constructor(mse: MediaSource, fetchScheduleFactoryMethod: FetchScheduleFactoryMethod) {
        this.#mse = mse;
        this.#sourceBuffer = mse.addSourceBuffer(`video/mp4; codecs="avc1.64001f,mp4a.40.2"`)
        this.#fetch = fetchScheduleFactoryMethod(() => this.#currentRep)
        this.#sourceBuffer.addEventListener("updateend", () => { this.run() })
    }
    sourceBufferUpdate(currentTime: number) {
        const timeRanges = this.#sourceBuffer.buffered;
        let bufferedTime = currentTime; 
        for (let index = 0; index < timeRanges.length; index++) {
            if (currentTime >= timeRanges.start(index) && currentTime <= timeRanges.end(index)) {                
                if (Math.ceil(timeRanges.end(index)) >= Math.trunc(Math.min(this.#currentRep?.duration ?? Infinity, this.#mse.duration))) return true;
                bufferedTime = timeRanges.end(index);break;
            }
        }
        this.#fetch(currentTime, bufferedTime).then(fMp4Uint8Array => { this.run(fMp4Uint8Array) })
        return false;
    }
    /** 移除当前sourceBuffer源并清除适配集和任务列表*/
    remove() {
        this.#mse.removeSourceBuffer(this.#sourceBuffer);
        return this.clear();
    }
    /** 清除已保存的适配集，当前任务列表 */
    clear() {
        this.#repSet.clear();
        return this
    }
    run(results?: Array<ArrayBuffer | Uint8Array | (() => void) | undefined> | ArrayBuffer | Uint8Array | (() => void)) {
        if (results && this.#mse.readyState !== "closed") {
            results = Array.isArray(results) ? results : [results]
            results.forEach(result => {
                if (typeof result === "function") {
                    this.#tasks.push(result)
                } else if (result instanceof ArrayBuffer || result instanceof Uint8Array) {
                    this.run(() => { this.#sourceBuffer.appendBuffer(result) })
                }
            })
        }
        if (this.#sourceBuffer.updating === false) {
            this.#tasks.shift()?.();
        }
        return this
    }
    set(fragmentMp4Representations: NormalFragmentMp4Representation[]) {
        this.clear();
        fragmentMp4Representations.forEach(fragmentMp4Representation => {
            this.#repSet.add(new FMp4Representation(fragmentMp4Representation))
        })
        return this
    }
    switch(rep: Representation, currentTime: number, options: SwitchRepOptions) {
        if (this.#repSet.has(rep) && this.#currentRep !== rep) {
            this.#currentRep = rep as FMp4Representation;
            this.#currentRep.asyncFetchInit().then(init => {
                if (init) {
                    if (this.#mse.duration > 0) {
                        switch (options?.switchMode) {
                            case "radical":
                                this.#fetch(currentTime, 0).then(fMp4Uint8Array => {
                                    this.run([
                                        () => this.#sourceBuffer.remove(0, Infinity),
                                        () => this.#sourceBuffer.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`),
                                        init,fMp4Uint8Array,
                                    ])
                                })
                                break;
                            case "soft":
                                this.#fetch(currentTime, 0).then(fMp4Uint8Array => {
                                    this.run([ 
                                        () => this.#sourceBuffer.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`),
                                        init,fMp4Uint8Array,
                                    ])
                                })
                                break
                        }
                    } else {
                        this.run([() => this.#sourceBuffer.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`), init])
                    }

                }
            })
        }
    }
    toArray() {
        return Array.from(this.#repSet.values())
    }
}