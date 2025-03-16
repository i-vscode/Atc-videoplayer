import { PlayerError } from './Player-Error';
import { Representation } from './Player-Representation';

/** 定义的事件 和 事件方法中的回传参数 */
type EventTypes = {
    'loadedmetadata': Representation;
    'error': PlayerError;
};
export type ValidEvents = (string & {}) | keyof EventTypes;
export type ListenerParameters<T> = T extends keyof EventTypes ? EventTypes[T] : unknown;
export type Listener<T> = (e: ListenerParameters<T>) => void;
/** 播放器事件发射器 */
export type PlayerEventEmitter = <T extends ValidEvents>(event: T, e: ListenerParameters<T>) => void;
/** 播放器事件 */
export declare class PlayerEvent {
    private events;
    constructor();
    /** 订阅事件 */
    on<T extends ValidEvents>(event: T, listener: Listener<T>): void;
    /** 移除订阅的事件 */
    off<T extends ValidEvents>(event: T, listener: Listener<T>): void;
    /** 触发事件 */
    emit<T extends ValidEvents>(event: T, e: ListenerParameters<T>): void;
    /** 只触发一次的订阅 */
    once<T extends ValidEvents>(event: T, listener: Listener<T>): void;
}
export {};
