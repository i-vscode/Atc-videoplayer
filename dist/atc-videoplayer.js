class PlayerOptions {
  /**最小缓冲时间 (秒) */
  minBufferTime = 15;
  /**最大缓冲时间 (秒)*/
  maxBufferTime = 120;
  /**  转换过期时间  (秒) */
  convertExpiryTime = 3600;
  /** 源缓冲更新最小频率 (秒) */
  sourceBufferUpdateMinFrequency = 1;
  /** 
   * 分段文件 字符串转URL 的转换策略  
   * @example 
   * "MuchPossible" （尽可能的）一次转换最多的分段文件 ，减少转换请求
   * "BufferTime" （缓冲时间）每次根据缓冲时间所需的分段文件 请求转换
   * "InquireNow" （正在查询）仅转换当前需要加载请求的分段文件
   * @deprecated  暂时未实现
   */
  convertStrategy = "BufferTime";
  /**
   * 调度策略 
   *  @example
   *  "Single" （单次）每次同步请求一个分段文件，完成后请求下一次
   *  "Dynamic" （动态 根据已缓存时间，如果距离缓冲时间太远则单组，否则单次
   * @deprecated  暂时未实现
   */
  fetchScheduleStrategy = "Single";
  constructor(p) {
    Object.assign(this, p);
    if (this.minBufferTime > this.maxBufferTime)
      this.maxBufferTime = this.minBufferTime;
    Object.freeze(this);
  }
}
var QualityTab = /* @__PURE__ */ ((QualityTab2) => {
  QualityTab2["Auto"] = "auto";
  QualityTab2["P480"] = "480P";
  QualityTab2["P720"] = "720P";
  QualityTab2["P1080"] = "1080P";
  QualityTab2["P10804K"] = "1080P4K";
  return QualityTab2;
})(QualityTab || {});

class PlayerEvent {
  events;
  constructor() {
    this.events = /* @__PURE__ */ new Map();
  }
  /** 订阅事件 */
  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, /* @__PURE__ */ new Set());
    }
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.add(listener);
    }
  }
  /** 移除订阅的事件 */
  off(event, listener) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }
  /** 触发事件 */
  emit(event, e) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(e));
    }
  }
  /** 只触发一次的订阅 */
  once(event, listener) {
    const onceListener = (e) => {
      listener(e);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }
}

class PlayerError {
  #code = 0;
  get code() {
    return this.#code;
  }
  #mse = "";
  get mse() {
    return this.#mse;
  }
  #original;
  get original() {
    return this.#original;
  }
  /**
   * @param code 0 url类型错误
   * @param code 1 其它类型错误
   * @param mse 错误信息
   */
  constructor(code, mse, original) {
    this.#code = code;
    this.#mse = mse;
    this.#original = original;
  }
}

const debounce = (callback, delay = 200) => {
  let t;
  return (...e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      callback(...e);
    }, delay);
  };
};
const throttle = (callback, duration = 200) => {
  let lastTime = (/* @__PURE__ */ new Date()).getTime();
  return (...e) => {
    let now = (/* @__PURE__ */ new Date()).getTime();
    if (now - lastTime > duration) {
      callback(e);
      lastTime = now;
    }
  };
};
const divideAndRound = (dividend, divisor) => {
  dividend = typeof dividend === "string" ? parseInt(dividend) : dividend;
  divisor = typeof divisor === "string" ? parseInt(divisor) : divisor;
  return Math.round((dividend ?? 0) / (divisor ?? 0));
};
const parsePositiveInteger = (s, defaultValue = 0) => {
  defaultValue = typeof defaultValue === "number" ? defaultValue : 0;
  const num = Number.parseInt(s);
  return Number.isInteger(num) && num >= 0 ? num : defaultValue;
};
const parseFromString = (() => {
  const domParser = new DOMParser();
  return (string, type) => domParser.parseFromString(string, type);
})();

const isProcessor = (processor) => {
  return !!processor && typeof processor === "object" && typeof Reflect.get(processor, "sourceBufferUpdate") === "function" && typeof Reflect.get(processor, "get") === "function" && typeof Reflect.get(processor, "switch") === "function";
};
const isProcessorFactory = (processorFactory) => {
  return !!processorFactory && typeof processorFactory === "object" && typeof Reflect.get(processorFactory, "name") === "string" && typeof Reflect.get(processorFactory, "asyncCreateProcessorInstance") === "function";
};

const isRepresentation = (r) => {
  return !!r && typeof r === "object" && typeof Reflect.get(r, "id") === "string" && typeof Reflect.get(r, "startTime") === "number" && typeof Reflect.get(r, "duration") === "number" && typeof Reflect.get(r, "codecs") === "string" && typeof Reflect.get(r, "mimeType") === "string" && typeof Reflect.get(r, "bandwidth") === "number" && typeof Reflect.get(r, "width") === "number" && typeof Reflect.get(r, "height") === "number" && Object.values(Sar).includes(Reflect.get(r, "sar"));
};
const getSar = (width, height) => {
  width = Number.isInteger(width) ? width : 0;
  height = Number.isInteger(height) ? height : 0;
  const ratio = width / height;
  const ratio16by9 = 16 / 9;
  const ratio16by10 = 16 / 10;
  const diff16by9 = Math.abs(ratio - ratio16by9);
  const diff16by10 = Math.abs(ratio - ratio16by10);
  if (diff16by9 < diff16by10) {
    return "16:9" /* SixteenByNine */;
  } else if (diff16by10 < diff16by9) {
    return "16:10" /* SixteenByTen */;
  } else {
    return "Unknown" /* Unknown */;
  }
};
var Sar = /* @__PURE__ */ ((Sar2) => {
  Sar2["Unknown"] = "Unknown";
  Sar2["SixteenByNine"] = "16:9";
  Sar2["SixteenByTen"] = "16:10";
  return Sar2;
})(Sar || {});

const isFragmentMp4ConfigRepresentation = (reps, fragmentMp4Config) => {
  const url = Reflect.get(fragmentMp4Config, "baseUrl");
  if (reps && Array.isArray(reps)) {
    return reps.every((rep) => {
      const bandwidth = Number.parseInt(Reflect.get(rep, "bandwidth"));
      const initEndRange = Number.parseInt(Reflect.get(rep, "initEndRange"));
      const sidxEndRange = Number.parseInt(Reflect.get(rep, "sidxEndRange"));
      return typeof Reflect.get(rep, "id") === "string" && typeof Reflect.get(rep, "codecs") === "string" && typeof Reflect.get(rep, "mimeType") === "string" && (Number.isInteger(bandwidth) && bandwidth > 0) && URL.canParse(Reflect.get(rep, "url"), url) && (Number.isInteger(initEndRange) && initEndRange > 0) && (Number.isInteger(sidxEndRange) && sidxEndRange > 0) && (Reflect.has(rep, "width") ? typeof Reflect.get(rep, "width") === "number" : typeof Reflect.get(rep, "width") === "undefined") && (Reflect.has(rep, "height") ? typeof Reflect.get(rep, "height") === "number" : typeof Reflect.get(rep, "height") === "undefined");
    });
  }
  return false;
};
const isFragmentMp4ConfigMedia = (media, fragmentMp4Config) => {
  if (media && typeof media === "object") {
    return Object.entries(media).every(([k, v]) => typeof k === "string" && isFragmentMp4ConfigRepresentation(v, fragmentMp4Config));
  }
  return false;
};
const isFragmentMp4Config = (fragmentMp4Config) => {
  if (!fragmentMp4Config || typeof fragmentMp4Config !== "object")
    return false;
  if (!URL.canParse(Reflect.get(fragmentMp4Config, "baseUrl")))
    return false;
  if (!isFragmentMp4ConfigMedia(Reflect.get(fragmentMp4Config, "media"), fragmentMp4Config))
    return false;
  return true;
};
const createNormalFragmentMp4ConfigMediaRepresentation = (rep, normalFragmentMp4Config) => {
  const normalRep = {
    ...rep,
    duration: normalFragmentMp4Config.duration,
    url: new URL(rep.url, normalFragmentMp4Config.baseUrl),
    bandwidth: Number.parseInt(rep.bandwidth.toString()),
    initEndRange: Number.parseInt(rep.initEndRange.toString()),
    sidxEndRange: Number.parseInt(rep.sidxEndRange.toString()),
    width: Number.parseInt(rep.width?.toString()),
    height: Number.parseInt(rep.height?.toString())
  };
  return normalRep;
};
const createNormalFragmentMp4Config = (fragmentMp4Config) => {
  if (isFragmentMp4Config(fragmentMp4Config)) {
    const normalFragmentMp4Representation = {
      duration: Number.parseInt(fragmentMp4Config.duration?.toString() ?? ""),
      baseUrl: new URL(fragmentMp4Config.baseUrl),
      media: {}
    };
    if (!Number.isFinite(normalFragmentMp4Representation.duration)) {
      normalFragmentMp4Representation.duration = Infinity;
    }
    normalFragmentMp4Representation.media = Object.fromEntries(Object.entries(fragmentMp4Config.media).map(([k, v]) => {
      return [k, v.map((rep) => createNormalFragmentMp4ConfigMediaRepresentation(rep, normalFragmentMp4Representation))];
    }));
    return normalFragmentMp4Representation;
  }
};

const B_ftyp = 1718909296, B_moov = 1836019574, B_mvex = 1836475768, B_styp = 1937013104, B_sidx = 1936286840, B_moof = 1836019558, B_mdat = 1835295092, B_mfra = 1835430497;
const B_mvhd = 1836476516, B_trak = 1953653099;
const L_mvhd = 1684567661;
const TypeBoxIdentifierSet = /* @__PURE__ */ new Set([B_ftyp, B_moov, B_mvhd, B_trak, B_mvex, B_styp, B_sidx, B_moof, B_mdat, B_mfra, L_mvhd]);
const parseSidxBox = (dataView) => {
  const version = dataView.getUint8(8);
  if (version === 0 ? dataView.byteLength < 44 : dataView.byteLength < 52) {
    return;
  }
  const sidxBoxMetadata = {
    version,
    flags: dataView.getUint8(9) << 16 | dataView.getUint8(10) << 8 | dataView.getUint8(11),
    reference_ID: dataView.getUint32(12),
    timescale: dataView.getUint32(16),
    earliest_presentation_time: version === 0 ? dataView.getUint32(20) : dataView.getBigUint64(20),
    first_offset: version === 0 ? dataView.getUint32(24) : dataView.getBigUint64(28),
    reference_count: dataView.getUint16(version === 0 ? 30 : 38),
    references: []
  };
  let offset = version === 0 ? 32 : 40;
  for (let i = 0; i < sidxBoxMetadata.reference_count; i++) {
    const reference = {
      reference_type: (dataView.getUint32(offset) & 2147483648) >>> 31,
      referenced_size: dataView.getUint32(offset) & 2147483647,
      subsegment_duration: dataView.getUint32(offset + 4),
      starts_with_SAP: (dataView.getUint32(offset + 8) & 2147483648) >>> 31,
      SAP_type: (dataView.getUint32(offset + 8) & 1879048192) >>> 28,
      SAP_delta_time: dataView.getUint32(offset + 8) & 268435455
    };
    sidxBoxMetadata.references.push(reference);
    offset += 12;
  }
  return sidxBoxMetadata;
};
const parseMoovBox = (dataView) => {
  for (const box of findBox(new DataView(dataView.buffer, dataView.byteOffset + 8, dataView.byteLength))) {
    if (box.nameof === "mvhd") {
      return parseMvhdBox(box.dataView);
    }
  }
};
const parseMvhdBox = (dataView) => {
  return {
    version: dataView.getUint8(8),
    flags: dataView.getUint32(8) & 16777215,
    creationTime: dataView.getUint32(8 + 4),
    modificationTime: dataView.getUint32(16),
    timescale: dataView.getUint32(20),
    duration: dataView.getUint32(24)
  };
};
const findEndianTypeSwitch = (atomType) => {
  switch (atomType) {
    case B_ftyp:
      return "ftyp";
    case B_moov:
      return "moov";
    case (B_mvhd ):
      return "mvhd";
    case B_trak:
      return "trak";
    case B_mvex:
      return "mvex";
    case B_styp:
      return "styp";
    case B_sidx:
      return "sidx";
    case B_moof:
      return "moof";
    case B_mdat:
      return "mdat";
    case B_mfra:
      return "mfra";
    default:
      return "unknown";
  }
};
const findBox = function* (dataView) {
  let isLittleEndian = void 0;
  for (let offset = 0; offset < dataView.byteLength - 8; offset++) {
    if (isLittleEndian === void 0) {
      if (TypeBoxIdentifierSet.has(dataView.getUint32(offset + 4, false))) {
        isLittleEndian = false;
      } else if (TypeBoxIdentifierSet.has(dataView.getUint32(offset + 4, true))) {
        isLittleEndian = true;
      }
    }
    if (isLittleEndian !== void 0) {
      const atomType = dataView.getUint32(offset + 4, isLittleEndian);
      if (TypeBoxIdentifierSet.has(atomType)) {
        const byteLength = dataView.getUint32(offset, isLittleEndian);
        yield {
          dataView: new DataView(dataView.buffer, offset + dataView.byteOffset, byteLength),
          nameof: findEndianTypeSwitch(atomType)
        };
        offset += byteLength - 1;
      }
    }
  }
};
const parseFMP4Metadata = (arrayBuffer) => {
  const dataView = new DataView(arrayBuffer);
  let mvhdBoxMetadata = void 0;
  let sidxBoxMetadata = void 0;
  for (const box of findBox(dataView)) {
    if (box.nameof === "moov") {
      mvhdBoxMetadata = parseMoovBox(box.dataView);
    } else if (box.nameof === "sidx") {
      sidxBoxMetadata = parseSidxBox(box.dataView);
      break;
    }
  }
  if (mvhdBoxMetadata && sidxBoxMetadata) {
    return { ...mvhdBoxMetadata, inddexRange: sidxBoxMetadata };
  }
};

class Segment {
  #rangeTimes = new Array();
  #duration = NaN;
  get duration() {
    return this.#duration;
  }
  constructor(initSidxMetadataArrayBuffer, byteOffset) {
    const initSidxMetadata = parseFMP4Metadata(initSidxMetadataArrayBuffer);
    if (initSidxMetadata) {
      this.#duration = initSidxMetadata.duration;
      const timescale = initSidxMetadata?.inddexRange.timescale;
      initSidxMetadata?.inddexRange.references.reduce((accumulator, reference) => {
        const currentRangeTime = {
          startTime: Math.trunc(accumulator.float / 100),
          endTime: Math.ceil(accumulator.float / 100 + reference.subsegment_duration / timescale),
          float: accumulator.float + Math.trunc(reference.subsegment_duration / timescale * 100),
          byteOffset: accumulator.byteOffset + accumulator.byteLength,
          byteLength: reference.referenced_size
        };
        this.#rangeTimes.push({
          startTime: currentRangeTime.startTime,
          endTime: currentRangeTime.endTime,
          startByteRange: currentRangeTime.byteOffset,
          endByteRange: currentRangeTime.byteOffset + currentRangeTime.byteLength - 1
        });
        return currentRangeTime;
      }, { startTime: 0, endTime: 0, float: 0, byteLength: 0, byteOffset });
    }
  }
  /** 获取媒体时间段范围 */
  getMediaRangeSet(startTime, endTime) {
    const ranges = /* @__PURE__ */ new Set();
    for (const r of this.#rangeTimes) {
      if (r.startTime > endTime)
        break;
      if (startTime <= r.endTime && endTime >= r.startTime) {
        if (r === this.#rangeTimes.at(-1)) {
          ranges.add({
            startTime: r.endTime,
            endTime: r.endTime,
            startByteRange: r.startByteRange,
            endByteRange: 0
          });
        } else {
          ranges.add(r);
        }
      }
    }
    return ranges;
  }
}

class FMp4Representation {
  #id;
  get id() {
    return this.#id;
  }
  #startTime;
  get startTime() {
    return this.#startTime;
  }
  #duration;
  get duration() {
    return this.#duration;
  }
  #codecs;
  get codecs() {
    return this.#codecs;
  }
  #mimeType;
  get mimeType() {
    return this.#mimeType;
  }
  #bandwidth;
  get bandwidth() {
    return this.#bandwidth;
  }
  #width;
  get width() {
    return this.#width;
  }
  #height;
  get height() {
    return this.#height;
  }
  #sar;
  get sar() {
    return this.#sar;
  }
  #url;
  get url() {
    return this.#url;
  }
  #Segment;
  #initEndRange;
  #sidxEndRange;
  #asyncInitSidxMetadata = (() => {
    let initSidxMetadata = void 0;
    return () => {
      if (initSidxMetadata === void 0) {
        initSidxMetadata = fetch(this.#url, { headers: {
          range: `bytes=0-${this.#sidxEndRange}`
        } }).then((r) => {
          return r && r.ok ? r.arrayBuffer() : void 0;
        }).catch(() => {
          return void 0;
        });
      }
      return Promise.resolve(initSidxMetadata);
    };
  })();
  async asyncFetchInit() {
    return this.#asyncInitSidxMetadata().then((arrayBuffer) => arrayBuffer ? arrayBuffer.slice(0, this.#initEndRange) : void 0);
  }
  async asyncFetchSegment() {
    if (this.#Segment)
      return this.#Segment;
    return this.#asyncInitSidxMetadata().then((arrayBuffer) => arrayBuffer ? this.#Segment = new Segment(arrayBuffer, this.#sidxEndRange) : void 0);
  }
  constructor(fRepresentation) {
    this.#id = fRepresentation.id;
    this.#codecs = fRepresentation.codecs;
    this.#mimeType = fRepresentation.mimeType;
    this.#startTime = 0;
    this.#duration = fRepresentation.duration;
    this.#bandwidth = fRepresentation.bandwidth;
    this.#width = fRepresentation.width || NaN;
    this.#height = fRepresentation.height || NaN;
    this.#sar = getSar(fRepresentation.width || NaN, fRepresentation.height || NaN);
    this.#url = fRepresentation.url;
    this.#initEndRange = fRepresentation.initEndRange;
    this.#sidxEndRange = fRepresentation.sidxEndRange;
  }
}

class SourceBufferTask {
  #repSet = /* @__PURE__ */ new Set();
  #mse;
  #sourceBuffer;
  #currentRep;
  #fetch;
  #tasks = new Array();
  constructor(mse, fetchScheduleFactoryMethod) {
    this.#mse = mse;
    this.#sourceBuffer = mse.addSourceBuffer(`video/mp4; codecs="avc1.64001f,mp4a.40.2"`);
    this.#fetch = fetchScheduleFactoryMethod(() => this.#currentRep);
    this.#sourceBuffer.addEventListener("updateend", () => {
      this.run();
    });
  }
  sourceBufferUpdate(currentTime) {
    const timeRanges = this.#sourceBuffer.buffered;
    let bufferedTime = currentTime;
    for (let index = 0; index < timeRanges.length; index++) {
      if (currentTime >= timeRanges.start(index) && currentTime <= timeRanges.end(index)) {
        if (Math.ceil(timeRanges.end(index)) >= Math.trunc(Math.min(this.#currentRep?.duration ?? Infinity, this.#mse.duration)))
          return true;
        bufferedTime = timeRanges.end(index);
        break;
      }
    }
    this.#fetch(currentTime, bufferedTime).then((fMp4Uint8Array) => {
      this.run(fMp4Uint8Array);
    });
    return false;
  }
  /** 移除当前sourceBuffer源并清除适配集和任务列表*/
  remove() {
    this.#mse.removeSourceBuffer(this.#sourceBuffer);
    return this.clear();
  }
  /** 清除已保存的适配集，当前任务列表 */
  clear() {
    this.#repSet.clear();
    return this;
  }
  run(results) {
    if (results && this.#mse.readyState !== "closed") {
      results = Array.isArray(results) ? results : [results];
      results.forEach((result) => {
        if (typeof result === "function") {
          this.#tasks.push(result);
        } else if (result instanceof ArrayBuffer || result instanceof Uint8Array) {
          this.run(() => {
            this.#sourceBuffer.appendBuffer(result);
          });
        }
      });
    }
    if (this.#sourceBuffer.updating === false) {
      this.#tasks.shift()?.();
    }
    return this;
  }
  set(fragmentMp4Representations) {
    this.clear();
    fragmentMp4Representations.forEach((fragmentMp4Representation) => {
      this.#repSet.add(new FMp4Representation(fragmentMp4Representation));
    });
    return this;
  }
  switch(rep, currentTime, options) {
    if (this.#repSet.has(rep) && this.#currentRep !== rep) {
      this.#currentRep = rep;
      this.#currentRep.asyncFetchInit().then((init) => {
        if (init) {
          if (this.#mse.duration > 0) {
            switch (options?.switchMode) {
              case "radical":
                this.#fetch(currentTime, 0).then((fMp4Uint8Array) => {
                  this.run([
                    () => this.#sourceBuffer.remove(0, Infinity),
                    () => this.#sourceBuffer.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`),
                    init,
                    fMp4Uint8Array
                  ]);
                });
                break;
              case "soft":
                this.#fetch(currentTime, 0).then((fMp4Uint8Array) => {
                  this.run([
                    () => this.#sourceBuffer.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`),
                    init,
                    fMp4Uint8Array
                  ]);
                });
                break;
            }
          } else {
            this.run([() => this.#sourceBuffer.changeType(`${rep.mimeType}; codecs="${rep.codecs}"`), init]);
          }
        }
      });
    }
  }
  toArray() {
    return Array.from(this.#repSet.values());
  }
}

const createFetchScheduleFactoryMethod = (playerOptions) => {
  const fetchScheduleFactoryMethod = (getFMp4RepresentationMethod) => {
    let lastDifferenceRanges = /* @__PURE__ */ new Set();
    const fetchSchedule = async (currentTime, bufferedTime) => {
      if (bufferedTime >= currentTime + playerOptions.maxBufferTime)
        return void 0;
      const segment = await getFMp4RepresentationMethod()?.asyncFetchSegment();
      const url = getFMp4RepresentationMethod()?.url;
      if (segment && url) {
        const rangeSet = segment.getMediaRangeSet(bufferedTime, bufferedTime + playerOptions.minBufferTime).difference(lastDifferenceRanges);
        if (rangeSet.size > 0) {
          lastDifferenceRanges = rangeSet;
          const rangeArray = Array.from(rangeSet);
          const startByteRange = rangeArray.at(0)?.startByteRange;
          const endByteRange = rangeArray.at(-1)?.endByteRange;
          return fetch(url, { headers: {
            range: `bytes=${startByteRange}-${endByteRange}`
          } }).then((r) => r && r.ok ? r.arrayBuffer() : void 0).catch(() => {
            lastDifferenceRanges = /* @__PURE__ */ new Set();
          });
        }
      }
    };
    return fetchSchedule;
  };
  return fetchScheduleFactoryMethod;
};

class SourceBufferTaskCollection {
  sourceBufferTaskMap = /* @__PURE__ */ new Map();
  mse = new MediaSource();
  normafragmentMp4Config;
  fetchScheduleFactoryMethod;
  el;
  src;
  constructor(normafragmentMp4Config, el, options, _eventEmitter) {
    this.normafragmentMp4Config = normafragmentMp4Config;
    this.el = el;
    this.fetchScheduleFactoryMethod = createFetchScheduleFactoryMethod(options);
    this.mse.addEventListener("sourceclose", () => {
      URL.revokeObjectURL(this.src);
    });
    this.src = URL.createObjectURL(this.mse);
  }
  sourceBufferUpdate(currentTime) {
    if (this.mse.readyState !== "closed") {
      if (Array.from(this.sourceBufferTaskMap.values()).map(
        (sourceBufferTask) => sourceBufferTask.sourceBufferUpdate(currentTime) && this.mse.readyState === "open"
      ).every((everyEndOfStream) => everyEndOfStream)) {
        this.mse.endOfStream();
      }
    }
  }
  /** 获取 SourceBufferTask*/
  get(repType) {
    return this.sourceBufferTaskMap.get(repType);
  }
  switch(repType, rep, currentTime, options) {
    this.sourceBufferTaskMap.get(repType)?.switch(rep, currentTime, options);
  }
  /** 刷新 配置对象和重新设置源缓存任务类 */
  refresh() {
    const sourceBufferTaskMap = /* @__PURE__ */ new Map();
    if (Number.isFinite(this.normafragmentMp4Config.duration) && this.normafragmentMp4Config.duration > 0) {
      this.mse.duration = this.normafragmentMp4Config.duration;
    }
    Object.entries(this.normafragmentMp4Config.media).forEach(([repType, fragmentMp4Representations]) => {
      const sourceBufferTask = this.sourceBufferTaskMap.get(repType) ?? new SourceBufferTask(this.mse, this.fetchScheduleFactoryMethod);
      sourceBufferTaskMap.set(repType, sourceBufferTask.set(fragmentMp4Representations));
    });
    this.sourceBufferTaskMap.forEach((s) => {
      s.remove();
    });
    this.sourceBufferTaskMap = sourceBufferTaskMap;
    return this;
  }
  asyncSourceopen() {
    const { promise, resolve } = Promise.withResolvers();
    this.mse.addEventListener("sourceclose", async () => {
      this.sourceBufferTaskMap = /* @__PURE__ */ new Map();
    });
    if (this.mse.readyState === "closed") {
      this.mse.addEventListener("sourceopen", async () => {
        resolve(this.refresh());
      }, { once: true });
      this.el.src = this.src;
    } else {
      resolve(this);
    }
    return promise;
  }
}

class FragmentMp4Processor {
  #SourceBufferTaskCollection;
  constructor(sourceBufferTaskCollection) {
    this.#SourceBufferTaskCollection = sourceBufferTaskCollection;
  }
  get(repType) {
    return this.#SourceBufferTaskCollection.get(repType)?.toArray() ?? [];
  }
  switch(repType, repBase, currentTime, options) {
    this.#SourceBufferTaskCollection.switch(repType, repBase, currentTime, options);
  }
  sourceBufferUpdate(currentTime) {
    this.#SourceBufferTaskCollection.sourceBufferUpdate(currentTime);
  }
}
const FragmentMp4Factory = {
  name: "FragmentMp4",
  asyncCreateProcessorInstance: async (r, el, options, eventEmitter) => {
    const normalFragmentMp4Config = createNormalFragmentMp4Config(r);
    return normalFragmentMp4Config ? new SourceBufferTaskCollection(normalFragmentMp4Config, el, options, eventEmitter).asyncSourceopen().then((s) => new FragmentMp4Processor(s)) : void 0;
  }
};

const NullProcessor = new class {
  constructor() {
  }
  get() {
    return [];
  }
  switch() {
  }
  get src() {
    return "";
  }
  sourceBufferUpdate() {
  }
}();
const processorList = /* @__PURE__ */ new Map();
const getRepList = (repType, processor, currentTime) => processor.get(repType).map((rep) => ({
  id: rep.id,
  duration: rep.duration,
  startTime: rep.startTime,
  codecs: rep.codecs,
  bandwidth: rep.bandwidth,
  mimeType: rep.mimeType,
  width: rep.width,
  height: rep.height,
  sar: rep.sar,
  switch(options = { switchMode: "soft" }) {
    processor.switch(repType, rep, currentTime, options);
  }
})) || [];
class PlayerCore {
  #options;
  #el;
  #processor = NullProcessor;
  #playerEvent = new PlayerEvent();
  #interval = NaN;
  get el() {
    return this.#el;
  }
  constructor(el, options) {
    this.#options = new PlayerOptions(options ?? { minBufferTime: 13 });
    this.#el = typeof el === "string" ? document.getElementById(el) : el;
  }
  /** 添加事件 */
  on(event, listener) {
    this.#playerEvent.on(event, listener);
  }
  /** 移除事件 */
  off(event, listener) {
    this.#playerEvent.off(event, listener);
  }
  /** 添加一次性事件 */
  once(event, listener) {
    this.#playerEvent.once(event, listener);
  }
  /** 装载 MPD文件 | 分段MP4文件 异步*/
  async loaderAsync(result, options) {
    if (result && this.#el instanceof HTMLMediaElement) {
      const playOptions = new PlayerOptions(Object.assign(Object.assign({}, this.#options), options));
      const response = await Promise.resolve(
        (result instanceof URL || typeof result === "string") && URL.canParse(result) ? fetch(result, { method: "HEAD" }) : result
      );
      if (response instanceof Response && response.ok || typeof response === "object") {
        for await (const processor of processorList.values().map((p) => p.asyncCreateProcessorInstance(response, this.#el, playOptions, this.#playerEvent.emit))) {
          if (isProcessor(processor)) {
            this.#processor = processor;
            clearInterval(this.#interval);
            this.#interval = setInterval(() => {
              const currentTime = Math.trunc(this.#el.currentTime / 60 * 10) * 6;
              if (this.#el.error === null) {
                processor.sourceBufferUpdate(currentTime);
              }
            }, this.#options.sourceBufferUpdateMinFrequency * 1e3);
            return (repType) => getRepList(repType, this.#processor, this.#el.currentTime);
          }
        }
      }
      throw new PlayerError(0, "addr 载入的类型没有处理器可以处理", result);
    }
    throw new PlayerError(1, "el 为空或者不为HTMLMediaElement类型", this.#el);
  }
  get(repType) {
    return getRepList(repType, this.#processor, this.#el.currentTime);
  }
  /** 处理器 遍历器 */
  static processorEntries() {
    return processorList.entries();
  }
  /** 添加处理器  静态方法*/
  static setProcessor(processorFactory) {
    if (isProcessorFactory(processorFactory)) {
      processorList.set(processorFactory.name, processorFactory);
    }
  }
}

PlayerCore.setProcessor(FragmentMp4Factory);

export { FragmentMp4Factory, FragmentMp4Processor, PlayerCore as Player, PlayerError, PlayerEvent, PlayerOptions, QualityTab, Sar, debounce, divideAndRound, getSar, isProcessor, isProcessorFactory, isRepresentation, parseFromString, parsePositiveInteger, throttle };
