import { PlayerOptions, Processor } from "../Player-Options";

/**
 * 文档节点型 MPD解析器
 */
export class NodeMPD implements Processor {
    #options: PlayerOptions
    #response: Response
    #mse = new MediaSource()
    #videoSourceBuffer: SourceBuffer
    #audioSourceBuffer: SourceBuffer
    constructor(response: Response, options: PlayerOptions) {
        this.#response = response
        this.#options = options
        this.#videoSourceBuffer = this.#mse.addSourceBuffer(`video/mp4; codecs="avc1.64001e"`)
        this.#audioSourceBuffer = this.#mse.addSourceBuffer(`video/mp4; codecs="mp4a.40.2"`)
        this.#src = URL.createObjectURL(this.#mse);
        console.log("NodeMPD", this);
    }
    #src: string
    get src(): string {
        const sourceopen = () => {
            this.#mse.removeEventListener('sourceopen', sourceopen)
        }
        this.#mse.addEventListener("sourceopen", sourceopen)
        this.#mse.addEventListener("sourceclose", () => {
            console.log("sourceclose");
        })
        return this.#src
    }
    sourceBufferUpdate(currentTime: Number): void {
        throw new Error("Method not implemented.");
    }
}