const mediaReg = /\$Number%(\d+)d\$/;
const reptms = /^PT(?:(\d+\.*\d*)H)?(?:(\d+\.*\d*)M)?(?:(\d+\.*\d*)S)?$/;
const PTdurationToSeconds = (PT) => {
  let hours = 0, minutes = 0, seconds = 0;
  if (typeof PT === "string") {
    if (reptms.test(PT)) {
      var matches = reptms.exec(PT);
      if (matches?.[1])
        hours = Number(matches[1]);
      if (matches?.[2])
        minutes = Number(matches[2]);
      if (matches?.[3])
        seconds = Number(matches[3]);
      return Number((hours * 3600 + minutes * 60 + seconds).toFixed(2));
    }
  }
  return NaN;
};
class SegmentTemplate {
  /** 持续时间  (持续时间 / 刻度 = 分段时长) */
  get duration() {
    return this.#duration;
  }
  #duration = NaN;
  /** 分段时长 (持续时间 / 刻度 = 分段时长)  */
  segmentduration = NaN;
  /** 初始化安装文件 */
  get initialization() {
    return this.#initialization;
  }
  #initialization = "";
  /** 媒体文件模板 */
  #getMedia(i) {
    const mediaRegExecArray = mediaReg.exec(this.#mediaTemplate);
    if (mediaRegExecArray) {
      const d = parseInt(mediaRegExecArray[1]);
      return this.#mediaTemplate.replace(mediaRegExecArray[0], (Array(d).join("0") + i).slice(0 - d));
    }
    return void 0;
  }
  #mediaTemplate = "";
  /** 开始数 */
  get startNumber() {
    return this.#startNumber;
  }
  #startNumber = NaN;
  /** 跳转 计数*/
  skipCount(i) {
    if (i > 0 && this.#S && i <= this.#S.length) {
      return {
        duration: this.#S[i - 1],
        count: i,
        media: this.#getMedia(i)
      };
    } else if (i > 0 && !this.#S) {
      return {
        duration: this.#duration,
        count: i,
        media: this.#getMedia(i)
      };
    }
    return { duration: NaN, count: NaN, media: void 0 };
  }
  /** 时间线数组 SegmentTimeline/S */
  #S = void 0;
  constructor(el, representationID) {
    let timescale = 0, duration = 0;
    for (const attr of el.attributes) {
      switch (attr.localName) {
        case "initialization":
          this.#initialization = attr.value.replace("$RepresentationID$", representationID);
          break;
        case "media":
          this.#mediaTemplate = attr.value.replace("$RepresentationID$", representationID);
          break;
        case "startNumber":
          this.#startNumber = parseInt(attr.value);
          break;
        case "timescale":
          timescale = parseInt(attr.value);
          break;
        case "duration":
          duration = parseInt(attr.value);
          break;
        default:
          Reflect.set(this, attr.localName, attr.value);
          break;
      }
    }
    for (const children of el.children) {
      if (children.localName === "SegmentTimeline") {
        this.#S = [];
        for (const Schildren of children.children) {
          if (Schildren.localName === "S") {
            for (const arrt of Schildren?.attributes) {
              if (arrt.localName === "d") {
                this.#S.push(
                  Math.floor(parseInt(arrt.value) / timescale * 100) / 100
                );
                break;
              }
            }
            continue;
          }
        }
        break;
      }
    }
    if (this.#S && this.#S.length > 0) {
      this.#duration = Math.floor(this.#S.reduce((previous, current) => current += previous) / this.#S.length * 100) / 100;
    } else {
      this.#duration = Math.floor(duration / timescale * 100) / 100;
    }
  }
}
class Representation {
  /** id */
  get id() {
    return this.#id;
  }
  #id = "";
  /** 媒体类型 */
  mimeType = "";
  /**编码器 */
  codecs = "";
  /**字节带宽 */
  get bandwidth() {
    return this.#bandwidth;
  }
  set bandwidth(val) {
    this.#bandwidth = Number.parseInt(val);
  }
  #bandwidth = 0;
  /** 帧率 */
  get frameRate() {
    return this.#frameRate;
  }
  #frameRate = NaN;
  /** 媒体比例 */
  sar = "";
  /** 媒体宽度 */
  get width() {
    return this.#width;
  }
  #width = NaN;
  /**初始化文件 */
  get initialization() {
    return this.#segment?.initialization;
  }
  /** 媒体高度 */
  get height() {
    return this.#height;
  }
  #height = NaN;
  #segment = void 0;
  /** 持续时间  (持续时间 / 刻度 = 分段时长) */
  get duration() {
    return this.#segment?.duration ?? NaN;
  }
  /** 开始数 */
  get startNumber() {
    return this.#segment?.startNumber ?? NaN;
  }
  /** 跳转 计数 */
  skipCount(i) {
    return this.#segment?.skipCount(i) ?? { duration: NaN, count: NaN, media: void 0 };
  }
  constructor(representation) {
    for (const attr of representation.attributes) {
      if (attr.localName === "id") {
        this.#id = attr.value;
        continue;
      }
      if (attr.localName === "frameRate") {
        const parts = attr.value.split("/");
        this.#frameRate = parseInt(parts[0]) / parseInt(parts[1]);
        continue;
      }
      if (attr.localName === "width") {
        this.#width = Number.parseInt(attr.value);
        continue;
      }
      if (attr.localName === "height") {
        this.#height = Number.parseInt(attr.value);
        continue;
      }
      Reflect.set(this, attr.localName, attr.value);
    }
    for (const children of representation.children) {
      if (children.localName === "SegmentTemplate") {
        this.#segment = new SegmentTemplate(children, this.id);
        break;
      }
    }
  }
}
class AdaptationSet {
  get contentType() {
    return this.#contentType;
  }
  #contentType = "";
  get representation() {
    return this.#representation;
  }
  #representation = [];
  /** 帧率 */
  get frameRate() {
    return this.#frameRate;
  }
  #frameRate = NaN;
  constructor(adaptationSet) {
    for (const attr of adaptationSet.attributes) {
      if (attr.localName === "contentType") {
        this.#contentType = attr.value;
        continue;
      }
      if (attr.localName === "frameRate") {
        const parts = attr.value.split("/");
        this.#frameRate = parseInt(parts[0]) / parseInt(parts[1]);
        continue;
      }
      Reflect.set(this, attr.localName, attr.value);
    }
    for (const children of adaptationSet.children) {
      if (children.localName === "Representation") {
        this.#representation.push(new Representation(children));
      }
    }
  }
}
class Period {
  #adaptationSetVideo = [];
  #adaptationSetAudio = [];
  get start() {
    return this.#start;
  }
  set start(val) {
    this.#start = PTdurationToSeconds(val);
  }
  #start = NaN;
  /** 视频适配集 */
  get videoSet() {
    return this.#videoSet;
  }
  #videoSet = [];
  /** 音频适配集 */
  get audioSet() {
    return this.#audioSet;
  }
  #audioSet = [];
  constructor(period) {
    for (const attr of period.attributes) {
      Reflect.set(this, attr.localName, attr.value);
    }
    for (const children of period.children) {
      if (children.localName === "AdaptationSet") {
        const _adaptationSet = new AdaptationSet(children);
        if (_adaptationSet.contentType.startsWith("video")) {
          this.#adaptationSetVideo.push(_adaptationSet);
        } else if (_adaptationSet.contentType.startsWith("audio")) {
          this.#adaptationSetAudio.push(_adaptationSet);
        }
      }
    }
    const videoNext = (rep) => {
      let i = rep.startNumber;
      const segment = {
        ...rep.skipCount(i),
        skip(duration) {
          i = Math.floor(duration / rep.duration);
          if (i < rep.startNumber)
            i = rep.startNumber;
          return { ...rep.skipCount(i), skip: segment.skip, next: segment.next, previous: segment.previous };
        },
        next() {
          return { ...rep.skipCount(++i), skip: segment.skip, next: segment.next, previous: segment.previous };
        },
        previous() {
          return { ...rep.skipCount(--i), skip: segment.skip, next: segment.next, previous: segment.previous };
        }
      };
      return segment;
    };
    const audioNext = (rep) => {
      let i = rep.startNumber;
      const segment = {
        ...rep.skipCount(i),
        skip(duration) {
          i = Math.floor(duration / rep.duration);
          if (i < rep.startNumber)
            i = rep.startNumber;
          return { ...rep.skipCount(i), skip: segment.skip, next: segment.next, previous: segment.previous };
        },
        next() {
          return { ...rep.skipCount(++i), skip: segment.skip, next: segment.next, previous: segment.previous };
        },
        previous() {
          return { ...rep.skipCount(--i), skip: segment.skip, next: segment.next, previous: segment.previous };
        }
      };
      return segment;
    };
    this.#adaptationSetVideo.forEach((v) => {
      v.representation.forEach((r) => {
        this.#videoSet.push({
          ...videoNext(r),
          initialization: r.initialization,
          codecs: r.codecs,
          mimeType: r.mimeType,
          bandwidth: r.bandwidth,
          width: r.width,
          height: r.height,
          frameRate: isNaN(r.frameRate) ? v.frameRate : r.frameRate,
          startNumber: r.startNumber
        });
      });
    }), this.#adaptationSetAudio.forEach((a) => {
      a.representation.forEach((r) => {
        this.#audioSet.push({
          ...audioNext(r),
          initialization: r.initialization,
          codecs: r.codecs,
          mimeType: r.mimeType,
          bandwidth: r.bandwidth,
          startNumber: r.startNumber
        });
      });
    });
  }
}
class MPD {
  /** 总的时长 持续时间 */
  get mediaPresentationDuration() {
    return this.#mediaPresentationDuration;
  }
  //set mediaPresentationDuration(val) { this.#mediaPresentationDuration = PTdurationToSeconds(val) }
  #mediaPresentationDuration = NaN;
  /** 最大分段场持续时间  指的是加载的 每个m4s段的最大时间  */
  get maxSegmentDuration() {
    return this.#maxSegmentDuration;
  }
  set maxSegmentDuration(val) {
    this.#maxSegmentDuration = PTdurationToSeconds(val);
  }
  #maxSegmentDuration = NaN;
  /** 最小缓存时间 */
  get minBufferTime() {
    return this.#minBufferTime;
  }
  set minBufferTime(val) {
    if (isFinite(val))
      this.#minBufferTime = PTdurationToSeconds(val);
  }
  #minBufferTime = NaN;
  /** 媒体阶段数组 */
  get Period() {
    return this.#Period;
  }
  #Period = [];
  constructor(mpdstring) {
    const mpd = new DOMParser().parseFromString(mpdstring, "text/xml").documentElement;
    for (const attr of mpd.attributes) {
      if (attr.localName === "mediaPresentationDuration") {
        this.#mediaPresentationDuration = PTdurationToSeconds(attr.value);
        continue;
      }
      if (attr.localName === "minBufferTime") {
        this.#minBufferTime = PTdurationToSeconds(attr.value);
        continue;
      }
      Reflect.set(this, attr.localName, attr.value);
    }
    for (const children of mpd.children) {
      switch (children.localName) {
        case "Period":
          this.#Period.push(new Period(children));
          break;
      }
    }
  }
}

const fetchMpd = async (url, options) => {
  return fetch(url).then(
    async (c) => {
      if (c.ok) {
        return Object.assign(new MPD(await c.text()), options);
      }
      return void 0;
    },
    () => void 0
  );
};
const debounce = (callback, delay = 200) => {
  let t;
  return (...e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      callback(e);
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
class SourceBufferTask {
  #SourceBuffer;
  #Url;
  #MPD;
  #tasks = { list: [], a: () => {
  } };
  #arrayBuffers = [];
  #Rep;
  /** 最近一个文件下载的比特率 */
  get bitrate() {
    return this.#bitrate;
  }
  #bitrate = NaN;
  #runTask(tasks) {
    tasks.forEach((t) => {
      this.#tasks.list.push(
        () => {
          const d = performance.now();
          fetch(t.url).then((f) => f.arrayBuffer()).then((a) => {
            try {
              this.#bitrate = Math.round(a.byteLength * 8 / (performance.now() - d));
              if (this.#SourceBuffer.updating) {
                this.#arrayBuffers.push(new Uint8Array(a));
              } else {
                this.#SourceBuffer?.appendBuffer(new Uint8Array(a));
              }
            } catch {
            }
          });
        }
      );
    });
    if (this.#SourceBuffer.updating == false) {
      this.#tasks.list.shift()?.();
    }
  }
  /** 重新设置 rep，需要 mimeType/codecs属性一样才会设置成功*/
  setRep(rep, url) {
    if (this.#Rep?.mimeType !== rep.mimeType || this.#Rep?.codecs !== rep.codecs) {
      this.#SourceBuffer.changeType(`${rep?.mimeType}; codecs="${rep?.codecs}"`);
      if (rep?.initialization) {
        this.#runTask([{ url: new URL(rep.initialization, this.#Url) }]);
      }
    }
    this.#Rep = rep;
    if (url)
      this.#Url = url;
  }
  addTask(timeupdate, mediaPresentationDuration, Ignorebuffered = false) {
    if (!this.#Rep)
      return;
    const bufferTime = Number.isFinite(this.#MPD.minBufferTime) ? timeupdate + this.#MPD.minBufferTime : timeupdate;
    const irep = Math.ceil((bufferTime > mediaPresentationDuration ? mediaPresentationDuration : bufferTime) / this.#Rep.duration);
    let buffered = timeupdate;
    if (Ignorebuffered === false) {
      for (let index = 0; index < this.#SourceBuffer?.buffered.length; index++) {
        if (this.#SourceBuffer.buffered.start(index) < timeupdate) {
          buffered = this.#SourceBuffer.buffered.end(index);
        }
        if (buffered > bufferTime)
          return;
      }
    } else if (Ignorebuffered === true) {
      this.#tasks.list.length = 0;
    }
    if (Math.abs(mediaPresentationDuration - buffered) < (this.#Rep?.duration ?? 2) / 2)
      return;
    const tasks = [];
    let segment = this.#Rep.skip(timeupdate > buffered ? timeupdate : buffered);
    if (Ignorebuffered === false && segment.count > this.#Rep.startNumber)
      segment = segment.next();
    while (segment.media && segment.count <= irep) {
      const url = new URL(segment.media, this.#Url);
      tasks.push({ url, duration: segment.duration });
      segment = segment.next();
    }
    this.#runTask(tasks);
  }
  constructor(mse, mpd, url) {
    this.#SourceBuffer = mse.addSourceBuffer(`video/mp4; codecs="avc1.64001f"`);
    this.#Url = url;
    this.#MPD = mpd;
    console.log("SourceBufferTask", this.#MPD);
    mse.addEventListener("sourceclose", () => {
      this.#tasks.list.length = 0;
    });
    this.#SourceBuffer.addEventListener("updateend", () => {
      const arrayBuffer = this.#arrayBuffers.shift();
      if (arrayBuffer)
        this.#SourceBuffer?.appendBuffer(arrayBuffer);
      this.#tasks.list.shift()?.();
    });
  }
}
class VideoDash {
  get el() {
    return this.#el;
  }
  #el;
  #MSE = new MediaSource();
  #MPD;
  #options = new class {
    get minBufferTime() {
      return this.#minBufferTime;
    }
    set minBufferTime(val) {
      this.#minBufferTime = isFinite(val) ? val : this.#minBufferTime;
    }
    #minBufferTime = NaN;
  }();
  #videoSourceBufferTask;
  #audioSourceBufferTask;
  /** 最近视频下载比特率 */
  get videoBitrate() {
    return this.#videoSourceBufferTask?.bitrate ?? NaN;
  }
  /** 最近音频下载比特率 */
  get audioBitrate() {
    return this.#audioSourceBufferTask?.bitrate ?? NaN;
  }
  /** 返回视频Rep集 */
  get videoSet() {
    return this.#videoSet;
  }
  #videoSet = [];
  get audioSet() {
    return this.#audioSet;
  }
  #audioSet = [];
  constructor(id, options = {}) {
    Object.assign(this.#options, options);
    this.#el = typeof id === "string" ? document.getElementById(id) : id;
    this.#el.addEventListener("seeking", debounce(() => {
      this.#videoSourceBufferTask?.addTask?.(this.#el.currentTime, this.#MSE.duration);
      this.#audioSourceBufferTask?.addTask?.(this.#el.currentTime, this.#MSE.duration);
    }, 500));
    this.#el.addEventListener("timeupdate", throttle(() => {
      if (this.#MSE.readyState === "open") {
        this.#videoSourceBufferTask?.addTask?.(this.#el.currentTime, this.#MSE.duration);
        this.#audioSourceBufferTask?.addTask?.(this.#el.currentTime, this.#MSE.duration);
        if (Math.abs(this.#MSE.duration - this.#el.currentTime) < 2) {
          this.#MSE.endOfStream();
        }
      }
    }, 2500));
  }
  #URL = new URL(window.location.href);
  /** 装载MPD文件 异步*/
  loaderAsync(addr) {
    this.#videoSet.length = 0;
    this.#audioSet.length = 0;
    this.#videoSourceBufferTask = void 0;
    this.#audioSourceBufferTask = void 0;
    return new Promise(async (r) => {
      if (this.#el.error)
        return r(false);
      this.#URL = addr instanceof URL ? addr : new URL(addr, this.#URL);
      this.#MPD = await fetchMpd(this.#URL, this.#options);
      if (!this.#MPD)
        return r(false);
      this.#options.minBufferTime = isFinite(this.#options.minBufferTime) ? this.#options.minBufferTime : this.#MPD.minBufferTime;
      const sourceopen = () => {
        if (this.#MPD?.mediaPresentationDuration && isFinite(this.#MPD.mediaPresentationDuration) && !isFinite(this.#MSE.duration)) {
          this.#MSE.duration = this.#MPD.mediaPresentationDuration;
        }
        this.#videoSourceBufferTask = new SourceBufferTask(this.#MSE, this.#MPD, this.#URL);
        this.#audioSourceBufferTask = new SourceBufferTask(this.#MSE, this.#MPD, this.#URL);
        (this.#MPD?.Period?.[0].videoSet ?? []).forEach((v) => this.#videoSet.push({
          bandwidth: v.bandwidth,
          width: v.width,
          height: v.height,
          mimeType: v.mimeType,
          switch: (Ignorebuffered = false) => {
            if (this.#videoSourceBufferTask) {
              this.#videoSourceBufferTask?.setRep(v);
              this.#videoSourceBufferTask?.addTask(this.el.currentTime, this.#el.duration, Ignorebuffered);
              return true;
            }
            return false;
          }
        }));
        (this.#MPD?.Period?.[0].audioSet ?? []).forEach((v) => this.#audioSet.push({
          bandwidth: v.bandwidth,
          mimeType: v.mimeType,
          switch: (Ignorebuffered = false) => {
            if (this.#audioSourceBufferTask) {
              this.#audioSourceBufferTask?.setRep(v);
              this.#audioSourceBufferTask?.addTask(this.#el.currentTime, this.#el.duration, Ignorebuffered);
              return true;
            }
            return false;
          }
        }));
        this.#MSE.removeEventListener("sourceopen", sourceopen);
        return r(true);
      };
      this.#MSE.addEventListener("sourceopen", sourceopen);
      this.#el.src = URL.createObjectURL(this.#MSE);
    });
  }
}

export { VideoDash };
