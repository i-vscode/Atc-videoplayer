//big-endian
const B_ftyp = 1718909296, B_moov = 1836019574, B_mvex = 1836475768, B_styp = 1937013104,
    B_sidx = 1936286840, B_moof = 1836019558, B_mdat = 1835295092, B_mfra = 1835430497
// moov >> mvhd  | moov >> trak
const B_mvhd = 1836476516, B_trak = 1953653099
// little-endian
// moov >> mvhd  
const L_mvhd = 1684567661 // moov
const TypeBoxIdentifierSet = new Set([B_ftyp, B_moov, B_mvhd, B_trak, B_mvex, B_styp, B_sidx, B_moof, B_mdat, B_mfra, L_mvhd]);
const findEndianTypeSwitch = (atomType) => {
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
const findBox = function* (dataView) {
    let isLittleEndian = undefined //是否使用小端序   
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

const mpdObj = {
    baseUrl: document.getElementById("baseUrl"),
    duration: document.getElementById("duration"),
    mediaArray: new Array()
}

const addstreambutton = document.getElementById("addstreambutton");
const generatestreambutton = document.getElementById("generatestreambutton");
const ulElement = document.getElementById("slist");
const inputType = ["trackName", "id", "codecs", "mimeType", "bandwidth", "width", "height"]
const addflist = () => {
    const mediaArray = mpdObj.mediaArray
    const media = {
        trackName: "video",
        id: `${mediaArray.length + 1}`,
        url: "",
        codecs: "avc1.64081f",
        mimeType: "video/mp4",
        bandwidth: "20000",
        initEndRange: undefined,
        sidxEndRange: undefined,
        width: undefined,
        height: undefined
    }
    mediaArray.push(media)
    // ulElement.innerHTML = "" 
    const liElement = document.createElement("li");
    const fileInput = liElement.appendChild(document.createElement("input"));
    fileInput.type = "file";
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        media.url = file.name
        reader.readAsArrayBuffer(file);
        reader.onload = (e) => {
            const dataView = new DataView(e.target.result);
            for (const box of findBox(dataView)) {
                if (box.nameof === "moov") {
                    media.initEndRange = box.dataView.byteOffset + box.dataView.byteLength - 1
                } else if (box.nameof === "sidx") {
                    media.sidxEndRange = box.dataView.byteOffset + box.dataView.byteLength - 1;
                }
                if (media.initEndRange && media.sidxEndRange) break
            }
        };
    })
    for (const typeName of inputType) {
        const typeSpan = liElement.appendChild(document.createElement("span"));
        typeSpan.textContent = typeName + ": ";
        const typeInput = liElement.appendChild(document.createElement("input"));
        typeInput.type = "text";
        typeInput.value = media[typeName]
        media[typeName + "Input"] = typeInput
        typeInput.addEventListener("change", () => { media[typeName] = typeInput.value })
    }

    ulElement.appendChild(liElement)

}
addstreambutton.addEventListener("click", addflist);
generatestreambutton.addEventListener("click", () => {
    const duration = Number.parseInt(mpdObj.duration.value);
    const mpdJson = {
        baseUrl: mpdObj.baseUrl.value ?? "",
        duration: Number.isFinite(duration) ? duration : undefined,
        media: {

        }
    }

    for (const m of mpdObj.mediaArray) {
        const track = m.trackName in mpdJson.media ? mpdJson.media[m.trackName] : (mpdJson.media[m.trackName] = new Array())
        track.push({
            id: m.id,
            url: m.url,
            bandwidth: m.bandwidth,
            codecs: m.codecs,
            initEndRange: m.initEndRange,
            mimeType: m.mimeType,
            sidxEndRange: m.sidxEndRange,
            width: Number.parseInt(m.width) || undefined,
            height: Number.parseInt(m.height) || undefined,
        })
    }

    const blob = new Blob([JSON.stringify(mpdJson)], { type: "application/json;charset=utf-8" });
    // 4. 创建临时下载链接
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "data.json"; // 设置默认文件名

    // 5. 模拟点击下载
    downloadLink.click();

    // 6. 释放内存
    URL.revokeObjectURL(downloadLink.href);

})
addflist() 