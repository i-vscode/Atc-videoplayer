import { PlayerOptions, Representation, RepType, SwitchRepOptions, type Processor } from "@lib";

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
    get(repType: (string & {}) | "video" | "audio"): Array<Representation> {
        throw new Error("Method not implemented.");
    }
    switch(repType: RepType, rep: Representation, options: SwitchRepOptions): void {
        throw new Error("Method not implemented.")
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