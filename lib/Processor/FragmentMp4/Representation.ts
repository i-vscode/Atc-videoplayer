import { Representation, Sar, getSar } from "@lib";
import { Segment } from "./Segment";
import { NormalFragmentMp4Representation } from "./FragmentMp4Config";
 
/**
 * 分段mp4文件的适配描述
 * @see Representation
 */
export class FMp4Representation implements Representation {
    #id: string;
    get id() { return this.#id }
    #startTime: number;
    get startTime() { return this.#startTime }
    #duration: number;
    get duration() { return this.#duration }
    #codecs: string;
    get codecs() { return this.#codecs }
    #mimeType: string;
    get mimeType() { return this.#mimeType }
    #bandwidth: number;
    get bandwidth() { return this.#bandwidth }
    #width: number;
    get width() { return this.#width }
    #height: number;
    get height() { return this.#height }
    #sar: Sar;
    get sar() { return this.#sar }
    #url: URL
    get url() { return this.#url }
    #Segment?: Segment
    #initEndRange: number
    #sidxEndRange: number    
    #asyncInitSidxMetadata=(()=>{
        let initSidxMetadata : Promise<ArrayBuffer | undefined>  | undefined= undefined
        return ()=>{
            if (initSidxMetadata === undefined) {
                initSidxMetadata= fetch(this.#url, { headers: {
                    range: `bytes=0-${this.#sidxEndRange}` 
                    } }).then(r =>{ 
                     return r && r.ok? r.arrayBuffer():undefined}).catch(() =>{return undefined})
            }
            return Promise.resolve(initSidxMetadata)
        }        
    })()
    async asyncFetchInit() {
        return this.#asyncInitSidxMetadata()
        .then(arrayBuffer => arrayBuffer ? arrayBuffer.slice(0, this.#initEndRange) : undefined)
    }
    async asyncFetchSegment() { 
        if (this.#Segment) return this.#Segment
        return this.#asyncInitSidxMetadata()
        .then(arrayBuffer => arrayBuffer ? this.#Segment = new Segment(arrayBuffer, this.#sidxEndRange) : undefined)
    }

    constructor(fRepresentation: NormalFragmentMp4Representation) {
        this.#id = fRepresentation.id;
        this.#codecs = fRepresentation.codecs;
        this.#mimeType = fRepresentation.mimeType;
        this.#startTime = 0;
        this.#duration = fRepresentation.duration;
        this.#bandwidth = fRepresentation.bandwidth;
        this.#width = fRepresentation.width || NaN;
        this.#height = fRepresentation.height || NaN;
        this.#sar = getSar(fRepresentation.width || NaN, fRepresentation.height || NaN);
        this.#url = fRepresentation.url;
        this.#initEndRange = fRepresentation.initEndRange
        this.#sidxEndRange = fRepresentation.sidxEndRange
    }

}
