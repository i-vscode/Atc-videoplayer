/** fmp4 init元数据对象 */
export type FMP4InitMetadata = MvhdBoxMetadata & {
    inddexRange: SidxBoxMetadata;
};
type MvhdBoxMetadata = {
    version: number;
    flags: number;
    creationTime: number;
    modificationTime: number;
    timescale: number;
    duration: number;
};
type SidxBoxMetadata = {
    version: number;
    flags: number;
    reference_ID: number;
    timescale: number;
    earliest_presentation_time: number | bigint;
    first_offset: number | bigint;
    reference_count: number;
    references: Array<{
        reference_type: number;
        referenced_size: number;
        subsegment_duration: number;
        starts_with_SAP: number;
        SAP_type: number;
        SAP_delta_time: number;
    }>;
};
/** 发现 fmp4分段盒 */
export declare const findBox: (dataView: DataView) => Generator<{
    dataView: DataView<ArrayBufferLike>;
    nameof: "ftyp" | "moov" | "mvhd" | "trak" | "mvex" | "styp" | "sidx" | "moof" | "mdat" | "mfra" | "unknown";
}, void, unknown>;
/** 解析 arrayBuffer fmp4元数据  */
export declare const parseFMP4Metadata: (arrayBuffer: ArrayBuffer) => FMP4InitMetadata | undefined;
export {};
