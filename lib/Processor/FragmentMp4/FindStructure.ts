
/** fmp4 init元数据对象 */
export type FMP4InitMetadata = MvhdBoxMetadata & { inddexRange: SidxBoxMetadata }
type MvhdBoxMetadata = {
    version: number
    flags: number
    creationTime: number
    modificationTime: number
    timescale: number
    duration: number,
}
type SidxBoxMetadata = {
    version: number,
    flags: number,
    reference_ID: number,
    timescale: number,
    earliest_presentation_time: number | bigint,
    first_offset: number | bigint,
    reference_count: number,
    references: Array<{
        reference_type:number,
        referenced_size:number,
        subsegment_duration:number,
        starts_with_SAP: number,
        SAP_type: number,
        SAP_delta_time: number,
    }>,
}
type TypeBox = {
    /** 盒数据 */
    dataView: DataView,
    /** 盒类型名 */
    nameof: "ftyp" | "moov" | "mvhd" | "trak" | "mvex" | "styp" | "sidx" | "moof" | "mdat" | "mfra" | "unknown"
}
//big-endian
const B_ftyp = 1718909296, B_moov = 1836019574, B_mvex = 1836475768, B_styp = 1937013104,
    B_sidx = 1936286840, B_moof = 1836019558, B_mdat = 1835295092, B_mfra = 1835430497
// moov >> mvhd  | moov >> trak
const B_mvhd = 1836476516, B_trak = 1953653099
// little-endian
// moov >> mvhd  
const L_mvhd = 1684567661 // moov
const TypeBoxIdentifierSet = new Set([B_ftyp, B_moov, B_mvhd, B_trak, B_mvex, B_styp, B_sidx, B_moof, B_mdat, B_mfra, L_mvhd]);


/** 解析 sidx盒 */
const parseSidxBox = (dataView: DataView) => {
    
    const version = dataView.getUint8(8);
    if((version === 0 ? dataView.byteLength < 44 :  dataView.byteLength < 52 )){ return}
    const sidxBoxMetadata: SidxBoxMetadata = {
        version: version,
        flags: (dataView.getUint8(9) << 16 | (dataView.getUint8(10)) << 8 | dataView.getUint8(11)),
        reference_ID: dataView.getUint32(12),
        timescale: dataView.getUint32(16),
        earliest_presentation_time: version === 0 ? dataView.getUint32(20) : dataView.getBigUint64(20),
        first_offset: version === 0 ? dataView.getUint32(24) : dataView.getBigUint64(28),
        reference_count:  dataView.getUint16(version === 0 ? 30:38),
        references:[]
    }
    let  offset = version === 0 ? 32 : 40
    for (let i = 0; i < sidxBoxMetadata.reference_count; i++) {
        const reference = {
            reference_type: (dataView.getUint32(offset) & 0x80000000) >>> 31,
            referenced_size: dataView.getUint32(offset) & 0x7FFFFFFF,
            subsegment_duration: dataView.getUint32(offset + 4),
            starts_with_SAP: (dataView.getUint32(offset + 8) & 0x80000000) >>> 31,
            SAP_type: (dataView.getUint32(offset + 8) & 0x70000000) >>> 28,
            SAP_delta_time: dataView.getUint32(offset + 8) & 0x0FFFFFFF,
        };
        sidxBoxMetadata.references.push(reference);
        offset += 12;
    } 

    return  sidxBoxMetadata
}


/** 解析 moov盒 */
const parseMoovBox = (dataView: DataView) => {
    for (const box of findBox(new DataView(dataView.buffer, dataView.byteOffset + 8, dataView.byteLength))) {
        if (box.nameof === "mvhd") {
            return parseMvhdBox(box.dataView);
        }
    }
}

const parseMvhdBox = (dataView: DataView): MvhdBoxMetadata => { 
    return {
        version: dataView.getUint8(8),
        flags: dataView.getUint32(8) & 0x00ffffff,
        creationTime: dataView.getUint32(8 + 4),
        modificationTime:  dataView.getUint32(16),
        timescale:  dataView.getUint32(20),
        duration: dataView.getUint32(24)
    } 
}
const findEndianTypeSwitch = (atomType: number): TypeBox["nameof"] => {
    switch (atomType) {
        case B_ftyp: return "ftyp";
        case B_moov: return "moov";
        case B_mvhd || L_mvhd: return "mvhd";
        case B_trak: return "trak";
        case B_mvex: return "mvex";
        case B_styp: return "styp";
        case B_sidx: return "sidx";
        case B_moof: return "moof";
        case B_mdat: return "mdat";
        case B_mfra: return "mfra";
        default: return "unknown"
    }
}
/** 发现 fmp4分段盒 */
export const findBox = function* (dataView: DataView,) {
    let isLittleEndian: boolean | undefined = undefined //是否使用小端序   
    for (let offset = 0; offset < dataView.byteLength - 8; offset++) {
        if (isLittleEndian === undefined) {
            if (TypeBoxIdentifierSet.has(dataView.getUint32(offset + 4, false))) { isLittleEndian = false; }
            else if (TypeBoxIdentifierSet.has(dataView.getUint32(offset + 4, true))) { isLittleEndian = true; }
        }
        if (isLittleEndian !== undefined) {
            const atomType = dataView.getUint32(offset + 4, isLittleEndian);
            if (TypeBoxIdentifierSet.has(atomType)) {
                const byteLength = dataView.getUint32(offset, isLittleEndian);
                yield {
                    dataView: new DataView(dataView.buffer, offset + dataView.byteOffset, byteLength),
                    nameof: findEndianTypeSwitch(atomType)
                }
                offset += (byteLength - 1)
            }
        }
    }
}

/** 解析 arrayBuffer fmp4元数据  */
export const parseFMP4Metadata = (arrayBuffer: ArrayBuffer) : FMP4InitMetadata | undefined=> {
    const dataView = new DataView(arrayBuffer);
    let mvhdBoxMetadata: MvhdBoxMetadata | undefined = undefined
    let sidxBoxMetadata:SidxBoxMetadata | undefined = undefined 
    for (const box of findBox(dataView)) {
        if (box.nameof === "moov") {
            mvhdBoxMetadata = parseMoovBox(box.dataView); 
        }else if ( box.nameof === "sidx") {
            sidxBoxMetadata = parseSidxBox(box.dataView);
            break;            
        } 
    }
    if(mvhdBoxMetadata && sidxBoxMetadata){
        return {...mvhdBoxMetadata,inddexRange:sidxBoxMetadata}  
    }
}
