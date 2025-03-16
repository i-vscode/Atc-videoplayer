import { Representation } from '../../../../../../../lib';
import { Segment } from './Segment';

export type MPDRepresentation = Representation & {
    duration: number;
};
/** 解析 RepresentationElement 元素*/
export declare const parseRepresentationElement: (repElement: Element, duration: number, segmentElement: Element) => [MPDRepresentation, Segment];
