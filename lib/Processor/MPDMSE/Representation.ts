import { Representation, Sar, getSar, parsePositiveInteger } from "@lib"; 
import { Segment } from "./Segment";

/** 解析 RepresentationElement 元素*/
export const parseRepresentationElement = (repElement: Element, duration: number,segmentElement:Element): [Representation,Segment] => {
    const rep = {
        id: repElement.getAttribute("id") || "",
        startTime: parsePositiveInteger(repElement.getAttribute("startTime") || "", NaN),
        duration: duration || parsePositiveInteger(repElement.getAttribute("duration") || "") || Infinity,
        codecs: repElement.getAttribute("codecs") ?? "",
        mimeType: repElement.getAttribute("mimeType") || "",
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
    return [Object.freeze(rep),segment]
}
