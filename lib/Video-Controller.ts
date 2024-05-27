
//class Messagebox{}

/** 控制栏按钮 */
class Controllerbar {
    #video?: HTMLVideoElement
    get played() { return this.#played }
    set played(val) { 
        this.#played = val;   
        this.#played?.addEventListener("click",()=>{
            console.log("fewf",this.#video?.paused );            
            if(this.#video?.paused ){
                this.#video?.play();
            }else{
                this.#video?.pause();
            }
        }) 
    }
    #played?: HTMLElement;
    constructor(video?: HTMLVideoElement, bar?: Element) { 
        this.#video = video;
        for (const c of bar?.children ?? []) {
            if (c.localName === "buttons") {
                for (const button of c?.children ?? []) {
                    switch (button.localName) {
                        case "played": 
                            this.played = button as HTMLElement
                            break;
                        default:
                            break;
                    }
                }
                continue;
            }
        }
    }

}

/** DashPlayer 播放器 控制器 */
export class VideoController {
    #root?: HTMLDivElement;
    #video?: HTMLVideoElement;
    //#messagebox=new Messagebox();
    get controllerbar() { return this.#controllerbar }
    #controllerbar = new Controllerbar(this.#video,);
    constructor(id: string | HTMLDivElement,) {
        this.#root = typeof id === "string" ? document.getElementById(id) as HTMLDivElement : id;

        for (const children of this.#root.children) {
            switch (children.localName) {
                case "video": 
                    this.#video = children as HTMLVideoElement
                    break;
                case "controllerbar": 
                this.#controllerbar = new Controllerbar(this.#video, children);
                    break;
                default:
                    break;
            } 
        }
        //  this.#video =  this.#root?.getElementsByTagName("video").
    }
}