
 
/** 事件总线 */
export const eventbus = class<T> {
    #Mpa = new Map<any, Set<(...args: any) => void>>();
    /** 添加事件 */
    on(eventname: T, fn: (...args: any) => void) {
        if(eventname){
            if (this.#Mpa.has(eventname)) {
                this.#Mpa.get(eventname)?.add(fn)
            } else {
                this.#Mpa.set(eventname, new Set([fn]))
            }
        }

    } 
    /** 删除事件 */
    off(eventname: T, fn: (...args: any) => void) {
        this.#Mpa.get(eventname)?.delete(fn)
    }
    /** 触发事件 */
    trigger(eventname: T,...params:any[]){
        if (this.#Mpa.has(eventname)) {
            for (const iterator of this.#Mpa.get(eventname)!) {
                iterator(...params)
            }            
        }  
    }
}

/**  VidoeDash 事件类型 */
export enum VidoeDashEventType {
    /** 当目前的播放位置已更改时触发。*/
    "TIMPE_UPDATE"="TIMPE_UPDATE",
    /** 当清单加载完成时触发，提供请求对象信息 */
    "MANIFEST_LOADING_FINISHED"="MANIFEST_LOADING_FINISHED",
    /** 当新的流（周期）开始时触发。 */
    "PERIOD_SWITCH_STARTED"="PERIOD_SWITCH_STARTED",
    /** 在一个周期的流结束时触发。 */
    "PERIOD_SWITCH_COMPLETED"="PERIOD_SWITCH_COMPLETED",
    /** 当缓冲区FETCH开始时触发*/
    "BUFFER_FETCH_STATE"="BUFFER_FETCH_STATE",
    /** 当缓冲区FETCH结束时触发*/
    "BUFFER_FETCH_END"="BUFFER_FETCH_END",
    /** 当缓冲区发生PUSH_MEDIASTREAM时触发*/
    "BUFFER_PUSH_MEDIASTREAM"="BUFFER_PUSH_MEDIASTREAM",
    /**当缓冲区发生PUSH_INITSTREAM时触发 */
    "BUFFER_PUSH_INITSTREAM"="BUFFER_PUSH_INITSTREAM",
    /** 缓冲区更新结束时触发 */
    "SOURCEBUFFERUPDATEEND"="SOURCEBUFFERUPDATEEND",
    /**请求质量更改时触发；由用户在手动模式下或通过 ABR 规则在自动模式下进行。 */
    "QUALITY_CHANGE_REQUESTED"="QUALITY_CHANGE_REQUESTED",
}


