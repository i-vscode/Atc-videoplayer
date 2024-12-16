import { type Processor, PlayerOptions } from "../Player-Options";
async function fetchPartialContent(url: string, start: Number, end: Number) {
    return fetch(url, { headers: new Headers({ "Range": `bytes=${start}-${end}` }) })
}

/**
 * 分段mp4文件的媒体源 处理器
 */
export class FragmentMp4 implements Processor {
    #options: PlayerOptions
    #response: Response
    #mse = new MediaSource()
    #sourceBuffer?: SourceBuffer
    #isUpdateing: boolean = false
    /** 每秒时间内容长度 */
    #contentLengthPerSecond: number = 0
    constructor(response: Response, options: PlayerOptions) {
        this.#response = response
        this.#options = options

        console.log("FragmentMp4", this);
    }
    get name(): string {
        throw new Error("Method not implemented.");
    }
    functionProcessor(r: unknown, options: PlayerOptions): Processor | undefined {
        throw new Error("Method not implemented.");
    }

    get src() {
        const sourceopen = () => {
            this.#sourceBuffer = this.#mse.addSourceBuffer(`video/mp4; codecs="avc1.64001e, mp4a.40.2"`)
            const contentlength = Number.parseInt(this.#response.headers.get("content-length") ?? "")


            if (contentlength > 2 * 1024 * 1024) {
                fetchPartialContent(this.#response.url, 0 * 1024 * 1024, 1 * 1024 * 1024).then(a => a.arrayBuffer()).then(b => {
                    //const  combinedData = new Uint8Array(contentlength);
                    //combinedData.set(new Uint8Array(b),0);
                    //console.log("unit8" ,combinedData);
                    
                   //this.#sourceBuffer?.appendBuffer(combinedData)
                    this.#sourceBuffer?.appendBuffer(b)

                    setTimeout(() => {
                        fetchPartialContent(this.#response.url, (1 * 1024 * 1024)+1, 3 * 1024 * 1024).then(a => a.arrayBuffer()).then(b => {
                         //   console.log("setTimeout---unit8" ,combinedData);
                          //  combinedData.set(new Uint8Array(b),(2 * 1024 * 1024)+1);
                            this.#sourceBuffer?.appendBuffer(b)
                        })
                    }, 2000);

                    // setTimeout(() => {
                    //     fetchPartialContent(this.#response.url, 2 * 1024 * 1024, 3 * 1024 * 1024).then(a => a.arrayBuffer()).then(b => {
                    //         combinedData.set(new Uint8Array(b),  (2 * 1024 * 1024));
                    //         console.log("unit82" ,combinedData);
                    //     })

                    // }, 2000);
                    // // 请求指定范围的数据
                    // function fetchRange(start, end) {
                    //     return fetch(url, {
                    //         method: 'GET',
                    //         headers: {
                    //             'Range': `bytes=${start}-${end}`
                    //         }
                    //     })
                    //         .then(response => {
                    //             if (response.ok || response.status === 206) { // 检查状态码，206 表示部分内容
                    //                 return response.arrayBuffer(); // 将响应转换为 ArrayBuffer
                    //             }
                    //             throw new Error('服务器不支持范围请求');
                    //         });
                    // }

                    // // 请求多个范围
                    // Promise.all([
                    //     fetchRange(0, 499),    // 第一个范围
                    //     fetchRange(1000, 1499) // 第二个范围
                    // ])
                    //     .then(dataArray => {
                    //         // 合并数据块
                    //         const combinedData = new Uint8Array(dataArray[0].byteLength + dataArray[1].byteLength);
                    //         combinedData.set(new Uint8Array(dataArray[0]), 0);
                    //         combinedData.set(new Uint8Array(dataArray[1]), dataArray[0].byteLength);

                    //         console.log('成功获取多个范围的数据:', combinedData);
                    //     })
                    //     .catch(error => {
                    //         console.error('请求失败:', error);
                    //     });


                })
            } else {
                fetch(this.#response.url).then(a => a.arrayBuffer()).then(b => {
                    this.#sourceBuffer?.appendBuffer(b)
                })
            }
            this.#sourceBuffer.addEventListener("updateend", () => {
                console.log("uped", this.#sourceBuffer);
                console.log("uped", this.#sourceBuffer?.updating);

                this.#isUpdateing = false
                //console.log("updateend--"); 
                this.#contentLengthPerSecond = Math.ceil(contentlength / this.#mse.duration);
            })
            this.#mse.removeEventListener('sourceopen', sourceopen)
        }
        this.#mse.addEventListener("sourceopen", sourceopen)
        this.#mse.addEventListener("sourceclose", () => {


            console.log("sourceclose");

        })
        return URL.createObjectURL(this.#mse)
    }
    sourceBufferUpdate(currentTime: number) {
        if (!this.#sourceBuffer || this.#isUpdateing) return;

        this.#isUpdateing = true
        console.group("sourceBufferUpdate", currentTime, this);
        const buffered = currentTime + this.#options.minBufferTime

        for (let index = 0; index < this.#sourceBuffer.buffered.length; index++) {
            console.log(this.#sourceBuffer.buffered.start(index));
            console.log(this.#sourceBuffer.buffered.end(index), this.#sourceBuffer.buffered.end(index) * this.#contentLengthPerSecond);
            if (this.#sourceBuffer.buffered.start(index) < (currentTime)) { currentTime = this.#sourceBuffer.buffered.end(index); }
            if (currentTime > buffered) return;
        }

        console.groupEnd();
        fetchPartialContent(
            this.#response.url, (2 * 1024 * 1024) + 1, 3 * 1024 * 1024
            //  this.#response.url, currentTime * this.#contentLengthPerSecond, buffered * this.#contentLengthPerSecond

        ).then(a => a.arrayBuffer()).then(b => {

            setTimeout(() => {
                this.#sourceBuffer?.abort()
                console.log("abort");
                setTimeout(() => {
                    console.log("sourceBufferUpdate", currentTime, buffered);
                    //  this.#sourceBuffer!.appendWindowStart=currentTime
                    this.#sourceBuffer?.appendBuffer(b)
                }, 2000);

            }, 2000);

        })
    }
}