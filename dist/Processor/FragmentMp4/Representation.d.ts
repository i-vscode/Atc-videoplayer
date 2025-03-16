import { Representation, Sar } from '../../../../../../../lib';
import { Segment } from './Segment';
import { NormalFragmentMp4Representation } from './FragmentMp4Config';

/**
 * 分段mp4文件的适配描述
 * @see Representation
 */
export declare class FMp4Representation implements Representation {
    #private;
    get id(): string;
    get startTime(): number;
    get duration(): number;
    get codecs(): string;
    get mimeType(): string;
    get bandwidth(): number;
    get width(): number;
    get height(): number;
    get sar(): Sar;
    get url(): URL;
    asyncFetchInit(): Promise<ArrayBuffer | undefined>;
    asyncFetchSegment(): Promise<Segment | undefined>;
    constructor(fRepresentation: NormalFragmentMp4Representation);
}
