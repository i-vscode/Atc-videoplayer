export * from "./Player-Options"
export * from "./Player-Event"
export * from "./Player-Error"
export * from "./Player-Tools"
export * from "./Player-Processor";
export * from "./Player-Representation";
import { PlayerCore } from "./Player-Core";
import { MPDMSE, type MPDConverter, MP4, M3U8, InitObject } from "./Processor";
export { PlayerCore as Player } from "./Player-Core";
export { MPDConverter }
PlayerCore.setProcessor(MPDMSE)
PlayerCore.setProcessor(InitObject)
PlayerCore.setProcessor(MP4)
PlayerCore.setProcessor(M3U8)