import { PlayerError, PlayerOptions } from "@lib";
import { Converter } from "./Converter";
import { PTdurationToSeconds } from "./Tools";
import { SourceBufferTask } from "./SourceBufferTask";

/** 源缓存任务映射集合 */
export /** 源缓存任务映射集合 */
class SourceBufferTaskCollection {
    #options: PlayerOptions
    #map = new Map<string, SourceBufferTask>();
    #mse = new MediaSource();
    #mpdConverter: Converter;
    #el: HTMLMediaElement;
    constructor(mpdConverter: Converter, el: HTMLMediaElement, options: PlayerOptions) {
        this.#mpdConverter = mpdConverter
        this.#el = el;
        this.#options = options
    }

    sourceBufferUpdate(currentTime: number) {
        if(this.#mse.readyState === "open"){
            Promise.all(this.#map.values().map(s => s.sourceBufferUpdate(currentTime, currentTime + this.#options.minBufferTime))).then(e => {
                if (e.every(ued => ued === false) && this.#mse.readyState === "open") { 
                    if (Number.isInteger(this.#mse.duration)) {
                        this.#mse.endOfStream()
                    } else {
                        this.updateMpd()
                    }
                }
            })
        }
    }
    updateMpd = async (res?: Response) => {
        const response = await Promise.resolve(res || this.#mpdConverter.asyncResponse());
        if (response && response.ok) {
            if (this.#mse.readyState === "open") {
                const mpdElement = new DOMParser().parseFromString(await response.text(), "text/xml").documentElement;
                this.#mse.duration = PTdurationToSeconds(mpdElement.getAttribute("mediaPresentationDuration")) || this.#mse.duration;
                this.#map.values().forEach(s => { s.clearReps(); });
                for (const adaptationSetElement of Array.from(mpdElement.getElementsByTagName("AdaptationSet"))) {
                    const contentType = adaptationSetElement.getAttribute("contentType");
                    if (contentType) {
                        (this.#map.has(contentType) ? this.#map.get(contentType) :
                            this.#map.set(contentType, new SourceBufferTask(this.#mse, this.#mpdConverter))
                                .get(contentType))!.addReps(adaptationSetElement);
                    }
                }
            }
        } else {
            throw new PlayerError(0, "MPD 无法加载");
        }
    }
    /** 获取或者添加 SourceBufferTask*/
    get(key: string) { return this.#map.get(key) }
    sourceopen(res?: Response) {
        return new Promise<SourceBufferTaskCollection>((r, j) => {
            this.#mse.addEventListener("sourceopen", () => { 
                this.updateMpd(res).then(() => { r(this) })
            }, { once: true })

            this.#el.src = URL.createObjectURL(this.#mse);
        })
    }
}
