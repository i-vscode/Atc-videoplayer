import { Representation, Sar, getSar, parsePositiveInteger } from "@lib";
import { Segment } from "./Segment";
import { parsePTdurationToSeconds } from "./Tools";


const parseAttributePTdurationToSeconds = (element: Element | null, attributeName: string, defaultValue = NaN): number => {
    if (element && attributeName) {
        const startTimeAttribute = element.getAttribute(attributeName)
        return startTimeAttribute ? parsePTdurationToSeconds(startTimeAttribute, defaultValue)
            : parseAttributePTdurationToSeconds(element.parentElement, attributeName, defaultValue)
    }
    return defaultValue
}
/** 解析 RepresentationElement 元素*/
export const parseRepresentationElement = (repElement: Element, duration: number, segmentElement: Element): [Representation, Segment] => {
    const rep = {
        id: repElement.getAttribute("id") || "",
        startTime: parseAttributePTdurationToSeconds(repElement, "start"),
        duration: duration || parseAttributePTdurationToSeconds(repElement,"duration",Infinity),
        codecs: repElement.getAttribute("codecs") ?? "",
        mimeType: repElement.getAttribute("mimeType") ?? "",
        bandwidth: parsePositiveInteger(repElement.getAttribute("bandwidth") ?? ""),
        width: parsePositiveInteger(repElement.getAttribute("bandwidth") ?? ""),
        height: parsePositiveInteger(repElement.getAttribute("bandwidth") ?? ""),
        sar: Sar.Unknown
    }

    rep.sar = getSar(rep.width, rep.height);

    const segment = new Segment(
        rep,
        repElement.getElementsByTagName("SegmentTemplate")?.[0] ||
        repElement.getElementsByTagName("SegmentList")?.[0] ||
        segmentElement
    )
    return [Object.freeze(rep), segment]
}
