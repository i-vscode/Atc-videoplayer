
import { PlayerCore } from "./Player-Core";
import { MPDMSE, type MPDConverter, MP4, M3U8, InitObject } from "./Processor";
PlayerCore.set(MPDMSE)
PlayerCore.set(InitObject)
PlayerCore.set(MP4)
PlayerCore.set(M3U8)
export * from "./Player-Options"
export { PlayerCore as Player, Processor, type ProcessorType } from "./Player-Core";
export { MPDConverter }