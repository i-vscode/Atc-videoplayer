import { PlayerError } from "./Player-Error";
import { Representation } from "./Player-Representation";

/** 定义的事件 和 事件方法中的回传参数 */
type EventTypes = {
    'loadedmetadata': Representation;
    'error': PlayerError;
};
export type ValidEvents = (string & {}) | keyof EventTypes;
export type ListenerParameters<T> = T extends keyof EventTypes ? EventTypes[T] : unknown
export type Listener<T> = (e: ListenerParameters<T>) => void;
export class PlayerEventEmitter {
    private events: Map<string, Set<Listener<any>>>;
    constructor() {
        this.events = new Map();
    }

    /** 订阅事件 */
    on<T extends ValidEvents>(event: T, listener: Listener<T>): void {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.add(listener);
        }
    }

    /** 移除订阅的事件 */
    off<T extends ValidEvents>(event: T, listener: Listener<T>): void {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.delete(listener);
        }
    }

    /** 触发事件 */
    emit<T extends ValidEvents>(event: T, e: ListenerParameters<T>): void {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(listener => listener(e));
        }
    }

    /** 只触发一次的订阅 */
    once<T extends ValidEvents>(event: T, listener: Listener<T>): void {
        const onceListener = (e: ListenerParameters<T>) => {
            listener(e);
            this.off(event, onceListener); // 触发后移除该监听器
        };
        this.on(event, onceListener);
    }
} 