export * from "./Player-Options"
export * from "./Player-Event"
export * from "./Player-Error"
export * from "./Player-Tools"
export * from "./Player-Processor";
export * from "./Player-Representation"; 
export * from "./Processor"
export { PlayerCore as Player } from "./Player-Core";
import { PlayerCore } from "./Player-Core";
//import { MPDMSEFactory, FragmentMp4Factory, M3U8Factory, MP4Factory } from "./Processor";
import { FragmentMp4Factory } from "./Processor";
//PlayerCore.setProcessor(MPDMSEFactory)
PlayerCore.setProcessor(FragmentMp4Factory)
//PlayerCore.setProcessor(MP4Factory)
//PlayerCore.setProcessor(M3U8Factory) 