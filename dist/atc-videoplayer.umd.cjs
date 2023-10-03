(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.index = {}));
})(this, (function (exports) { 'use strict';

    const reptms = /^PT(?:(\d+\.*\d*)H)?(?:(\d+\.*\d*)M)?(?:(\d+\.*\d*)S)?$/;
    function PTdurationToSeconds(PT) {
      let hours = 0, minutes = 0, seconds = 0;
      if (PT) {
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
    }
    const defineProperty = (target, attr) => {
      let value = attr.value;
      switch (attr.localName) {
        case "minBufferTime":
        case "mediaPresentationDuration":
        case "start":
          value = PTdurationToSeconds(value);
          break;
        case "duration":
        case "startNumber":
        case "timescale":
        case "width":
        case "height":
        case "maxHeight":
        case "bandwidth":
          value = Number.parseInt(value);
          break;
        case "value":
          if (attr.ownerElement?.localName === "AudioChannelConfiguration")
            value = Number.parseInt(value);
          break;
        case "segmentAlignment":
        case "bitstreamSwitching":
          value = !!value.break;
      }
      Reflect.defineProperty(target, attr.localName, { value, writable: false, enumerable: true, configurable: false });
    };
    const attributes = (target, source) => {
      for (const attr of source.attributes) {
        defineProperty(target, attr);
      }
    };
    const defineChildren = (target, el, elname) => {
      elname ??= el.localName;
      if (el.childElementCount === 0 && el.attributes.length === 0 && el.firstChild?.nodeType === 3 && el.lastChild?.nodeType === 3) {
        Reflect.defineProperty(target, elname, { value: el.textContent, writable: false, enumerable: true, configurable: false });
      } else {
        const ch = {};
        attributes(ch, el);
        childrens(ch, el);
        switch (elname) {
          case "Representation":
            Reflect.defineProperty(ch, "mediaType", { value: target.contentType, writable: false, enumerable: true, configurable: false });
            break;
        }
        if (target?.[el.localName] instanceof Array) {
          Reflect.get(target, elname)?.push(ch);
        } else {
          Reflect.defineProperty(target, elname, { value: ch, writable: false, enumerable: true, configurable: false });
        }
      }
    };
    const adaptationSetChildren = (target, el) => {
      const contentType = el.attributes.getNamedItem("contentType")?.value;
      switch (contentType) {
        case "video":
          defineChildren(target, el, "AdaptationSetVideo");
          break;
        case "audio":
          defineChildren(target, el, "AdaptationSetAudio");
          break;
        case "image":
          defineChildren(target, el, "AdaptationSetImage");
          break;
      }
    };
    const childrens = (target, source) => {
      for (const iterator of source.children) {
        switch (iterator.localName) {
          case "Period":
          case "Representation":
            if (!(Reflect.get(target, iterator.localName) instanceof Array)) {
              Reflect.defineProperty(target, iterator.localName, {
                value: [],
                writable: false,
                enumerable: true,
                configurable: false
              });
            }
            break;
          case "AdaptationSet":
            adaptationSetChildren(target, iterator);
            continue;
        }
        defineChildren(target, iterator);
      }
    };
    class MPD3 {
      constructor(mpdstring) {
        const mpd = new DOMParser().parseFromString(mpdstring, "text/xml").documentElement;
        attributes(this, mpd);
        childrens(this, mpd);
      }
      next() {
        return this.Period[Symbol.iterator]().next().value;
      }
      minBufferTime = NaN;
      mediaPresentationDuration = Infinity;
      Period;
    }

    class MSE {
      #mediaSource = new MediaSource();
      get mediaSource() {
        return this.#mediaSource;
      }
      videoSourceTasks = [];
      audioSourceTasks = [];
      createObjectURL;
      #videoSourceBuffer;
      #audioSourceBuffer;
      videoSourceBuffer;
      audioSourceBuffer;
      vpush;
      apush;
      set duration(val) {
        this.#mediaSource.duration = val;
      }
      constructor() {
        Reflect.defineProperty(this, "videoSourceBuffer", {
          get() {
            return this.#videoSourceBuffer;
          },
          set(val) {
            if (val instanceof SourceBuffer) {
              this.#videoSourceBuffer = val;
              val.onupdate = () => {
                if (this.#videoSourceBuffer?.updating === false)
                  this.videoSourceTasks?.shift()?.();
              };
            }
          }
        });
        Reflect.defineProperty(this, "audioSourceBuffer", {
          get() {
            return this.#audioSourceBuffer;
          },
          set(val) {
            if (val instanceof SourceBuffer) {
              this.#audioSourceBuffer = val;
              val.onupdate = () => {
                if (this.#audioSourceBuffer?.updating === false)
                  this.audioSourceTasks?.shift()?.();
              };
            }
          }
        });
        this.createObjectURL = () => {
          return URL.createObjectURL(this.#mediaSource);
        };
        this.vpush = (fn) => {
          this.videoSourceTasks.push(() => {
            fn(this.#videoSourceBuffer);
          });
          if (this.#videoSourceBuffer?.updating === false)
            this.videoSourceTasks?.shift()?.();
        };
        this.apush = (fn) => {
          this.audioSourceTasks.push(() => {
            fn(this.#audioSourceBuffer);
          });
          if (this.#audioSourceBuffer?.updating === false)
            this.audioSourceTasks?.shift()?.();
        };
      }
    }

    const eventbus = class {
      #Mpa = /* @__PURE__ */ new Map();
      /** 添加事件 */
      on(eventname, fn) {
        if (eventname) {
          if (this.#Mpa.has(eventname)) {
            this.#Mpa.get(eventname)?.add(fn);
          } else {
            this.#Mpa.set(eventname, /* @__PURE__ */ new Set([fn]));
          }
        }
      }
      /** 删除事件 */
      off(eventname, fn) {
        this.#Mpa.get(eventname)?.delete(fn);
      }
      /** 触发事件 */
      trigger(eventname, ...params) {
        if (this.#Mpa.has(eventname)) {
          for (const iterator of this.#Mpa.get(eventname)) {
            iterator(...params);
          }
        }
      }
    };
    var VidoeDashEventType = /* @__PURE__ */ ((VidoeDashEventType2) => {
      VidoeDashEventType2["TIMPE_UPDATE"] = "TIMPE_UPDATE";
      VidoeDashEventType2["MANIFEST_LOADING_FINISHED"] = "MANIFEST_LOADING_FINISHED";
      VidoeDashEventType2["PERIOD_SWITCH_STARTED"] = "PERIOD_SWITCH_STARTED";
      VidoeDashEventType2["PERIOD_SWITCH_COMPLETED"] = "PERIOD_SWITCH_COMPLETED";
      VidoeDashEventType2["BUFFER_FETCH_STATE"] = "BUFFER_FETCH_STATE";
      VidoeDashEventType2["BUFFER_FETCH_END"] = "BUFFER_FETCH_END";
      VidoeDashEventType2["BUFFER_PUSH_MEDIASTREAM"] = "BUFFER_PUSH_MEDIASTREAM";
      VidoeDashEventType2["BUFFER_PUSH_INITSTREAM"] = "BUFFER_PUSH_INITSTREAM";
      VidoeDashEventType2["SOURCEBUFFERUPDATEEND"] = "SOURCEBUFFERUPDATEEND";
      VidoeDashEventType2["QUALITY_CHANGE_REQUESTED"] = "QUALITY_CHANGE_REQUESTED";
      return VidoeDashEventType2;
    })(VidoeDashEventType || {});

    class VideoDashPrivate {
      #el;
      get el() {
        return this.#el;
      }
      #url;
      #MPD;
      #Period;
      #RepresentationVideo;
      #RepresentationAudio;
      #eventbus = new eventbus();
      #options = {
        minBufferTime: 200,
        parseinit: (r) => {
          return r?.SegmentTemplate?.initialization?.replaceAll("$RepresentationID$", r.id ?? "") ?? "";
        },
        parsemedia(r, currentIndex) {
          let mediaRegExecArray = r.mediaRegExecArray;
          if (!mediaRegExecArray) {
            mediaRegExecArray = /\$Number(.*)\$/.exec(
              r?.SegmentTemplate?.media?.replaceAll("$RepresentationID$", r?.id ?? "") ?? ""
            );
            Reflect.defineProperty(r, "mediaRegExecArray", { get() {
              return mediaRegExecArray;
            } });
          }
          switch (mediaRegExecArray?.[1]) {
            case "%05d":
              return mediaRegExecArray.input.replace(mediaRegExecArray[0], (Array(5).join("0") + currentIndex).slice(-5)) ?? "";
            default:
              return mediaRegExecArray?.input.replace(mediaRegExecArray[0], currentIndex.toString()) ?? "";
          }
        }
      };
      constructor(id, options = {}) {
        Object.assign(this.#options, options);
        const mse = new MSE();
        this.#el = typeof id === "string" ? document.getElementById(id) : id;
        const trigger_BUFFER_PUSH_MEDIASTREAM = ((duration) => {
          let lastTime = (/* @__PURE__ */ new Date()).getTime();
          return (isseek = false) => {
            let now = (/* @__PURE__ */ new Date()).getTime();
            if (now - lastTime > duration) {
              if (mse.mediaSource.readyState === "open" || isseek) {
                console.log("trigger_BUFFER_PUSH_MEDIASTREAM....", this.el.currentTime, isseek);
                this.#eventbus.trigger(VidoeDashEventType.BUFFER_PUSH_MEDIASTREAM, this.#RepresentationVideo);
                this.#eventbus.trigger(VidoeDashEventType.BUFFER_PUSH_MEDIASTREAM, this.#RepresentationAudio);
                lastTime = now;
              }
            }
          };
        })(2e3);
        this.#el.addEventListener("timeupdate", () => {
          trigger_BUFFER_PUSH_MEDIASTREAM();
        });
        this.#el.addEventListener("seeking", () => {
          console.log("跳转中.....");
          trigger_BUFFER_PUSH_MEDIASTREAM(true);
        });
        const download = new class {
          #speed = NaN;
          get speed() {
            return this.#speed;
          }
          start() {
            return new class {
              #startTime = (/* @__PURE__ */ new Date()).getTime();
              /** 结束速率检测 */
              end(downloadSize) {
                const endTime = (/* @__PURE__ */ new Date()).getTime();
                const duration = (endTime - this.#startTime) / 1e3;
                const speedBps = downloadSize * 8 / duration;
                return speedBps;
              }
            }();
          }
        }();
        const endOfStream = () => {
          if (mse.videoSourceBuffer?.updating || mse.audioSourceBuffer?.updating || mse.mediaSource.readyState == "ended")
            return;
          if (mse.videoSourceBuffer?.buffered?.length > 0 && mse.audioSourceBuffer?.buffered?.length > 0) {
            let videoEndTime = mse.videoSourceBuffer?.buffered.end(mse.videoSourceBuffer?.buffered?.length - 1);
            let audioEndTime = mse.audioSourceBuffer?.buffered.end(mse.audioSourceBuffer?.buffered?.length - 1);
            if (videoEndTime >= mse.mediaSource.duration - 1 && audioEndTime >= mse.mediaSource.duration - 1) {
              mse.mediaSource.endOfStream();
            }
          }
        };
        mse.mediaSource.addEventListener("sourceopen", () => {
          mse.duration = this.#MPD.mediaPresentationDuration;
          this.#Period = this.#MPD?.next();
          if ((this.#Period?.AdaptationSetVideo?.Representation.length ?? 0) > 0) {
            mse.videoSourceBuffer = mse.mediaSource.addSourceBuffer('video/mp4; codecs="av01.0.08M.08"');
            mse.videoSourceBuffer.onupdateend = endOfStream;
            mse.videoSourceBuffer.addEventListener("updateend", () => {
              this.#eventbus.trigger(VidoeDashEventType.SOURCEBUFFERUPDATEEND, this.#RepresentationVideo);
              this.#eventbus.trigger(VidoeDashEventType.BUFFER_PUSH_MEDIASTREAM, this.#RepresentationVideo);
            });
          }
          if ((this.#Period?.AdaptationSetAudio?.Representation.length ?? 0) > 0) {
            mse.audioSourceBuffer = mse.mediaSource.addSourceBuffer('audio/mp4; codecs="mp4a.40.2"');
            mse.audioSourceBuffer.onupdateend = endOfStream;
            mse.audioSourceBuffer.addEventListener("updateend", () => {
              this.#eventbus.trigger(VidoeDashEventType.SOURCEBUFFERUPDATEEND, this.#RepresentationAudio);
              this.#eventbus.trigger(VidoeDashEventType.BUFFER_PUSH_MEDIASTREAM, this.#RepresentationAudio);
            });
          }
          this.#eventbus.trigger(VidoeDashEventType.PERIOD_SWITCH_STARTED);
        }, { once: true });
        this.#eventbus.on(VidoeDashEventType.MANIFEST_LOADING_FINISHED, () => {
          if (mse.mediaSource.readyState === "open") {
            mse.mediaSource.endOfStream();
          }
          this.#el.src = mse.createObjectURL();
        });
        this.#eventbus.on(VidoeDashEventType.PERIOD_SWITCH_STARTED, () => {
          this.SetQuality("video", 0);
          this.SetQuality("audio", -1);
        });
        const sourceTasksPushBuffer = (arrt, mediatype) => {
          switch (mediatype) {
            case "video":
              mse.vpush((sourceBuffer) => {
                sourceBuffer?.appendBuffer(arrt);
              });
              break;
            case "audio":
              mse.apush((sourceBuffer) => {
                sourceBuffer?.appendBuffer(arrt);
              });
              break;
          }
        };
        this.#eventbus.on(VidoeDashEventType.BUFFER_PUSH_INITSTREAM, (representation) => {
          if (representation.initstream) {
            sourceTasksPushBuffer(representation.initstream, representation.mediaType);
          } else {
            if (representation.SegmentTemplate?.initialization && representation.id) {
              fetch(new URL(this.#options.parseinit(representation), this.#url)).then((arr) => arr.arrayBuffer()).then((ab) => {
                Reflect.defineProperty(representation, "initstream", {
                  value: new Uint8Array(ab),
                  writable: false,
                  enumerable: false,
                  configurable: false
                });
                sourceTasksPushBuffer(representation.initstream, representation.mediaType);
              });
            }
          }
        });
        const GetBufferMediaNumber = (representation) => {
          const buffered = representation.buffered;
          const computedDuratio = representation?.computedDuratio ?? Infinity;
          const maxDurationTiem = this.#MPD?.mediaPresentationDuration ?? Infinity;
          const maxDurationNumber = Math.ceil(maxDurationTiem / computedDuratio);
          const minBufferTime = this.#options.minBufferTime;
          const startNumber = representation?.SegmentTemplate?.startNumber ?? 1;
          const buffer = {
            currentNumber: representation.currentfetchindex ?? 0,
            currentTime: this.#el.currentTime,
            StartTime: 0,
            EndTime: 0,
            /** 应该缓冲数量 */
            bufferNumber: NaN
          };
          for (let index = 0; index < (buffered?.length ?? 0); index++) {
            buffer.EndTime = buffered?.end(index) ?? 0;
            buffer.StartTime = buffered?.start(index) ?? 0;
            if (buffer.EndTime >= buffer.currentTime) {
              if (buffer.currentTime >= buffer.StartTime) {
                buffer.bufferNumber = Math.ceil(
                  (minBufferTime - (buffer.EndTime - buffer.currentTime)) / computedDuratio
                );
                buffer.currentTime = buffer.EndTime;
              }
              break;
            }
          }
          if (buffer.bufferNumber > 0) {
            buffer.currentNumber++;
            if (buffer.currentNumber < maxDurationNumber) {
              representation.currentfetchindex = buffer.currentNumber;
              return new URL(this.#options.parsemedia(representation, buffer.currentNumber + startNumber), this.#url);
            }
          } else if (isNaN(buffer.bufferNumber)) {
            buffer.currentNumber = Math.floor(buffer.currentTime / computedDuratio);
            representation.currentfetchindex = buffer.currentNumber;
            return new URL(this.#options.parsemedia(representation, buffer.currentNumber + startNumber), this.#url);
          }
        };
        this.#eventbus.on(VidoeDashEventType.BUFFER_PUSH_MEDIASTREAM, (representation) => {
          const controller = new AbortController();
          const speedtime = download.start();
          const mediaUrlNumber = GetBufferMediaNumber(representation);
          if (mediaUrlNumber) {
            representation?.currentfetchabort?.();
            representation.currentfetchabort = () => {
              controller.abort();
            };
            this.#eventbus.trigger(VidoeDashEventType.BUFFER_FETCH_STATE, representation, controller);
            fetch(mediaUrlNumber, { signal: controller.signal }).then((r) => {
              if (r.status < 400) {
                return r.arrayBuffer();
              }
              throw r;
            }).then((arr) => {
              sourceTasksPushBuffer(new Uint8Array(arr), representation.mediaType);
              this.#eventbus.trigger(VidoeDashEventType.BUFFER_FETCH_END, representation, speedtime.end(arr.byteLength));
            }).catch(() => {
            }).finally(() => {
            });
          }
        });
        const mediaNumber = /\$Number(.*)\$/;
        this.#eventbus.on(VidoeDashEventType.QUALITY_CHANGE_REQUESTED, (mediatype, index, isRemovesourceBuffer = false) => {
          switch (mediatype) {
            case "video":
              this.#RepresentationVideo?.currentfetchabort?.();
              this.#RepresentationVideo = this.#Period?.AdaptationSetVideo?.Representation.at(index);
              if (this.#RepresentationVideo) {
                if (!Reflect.has(this.#RepresentationVideo, "SegmentTemplate")) {
                  Reflect.defineProperty(this.#RepresentationVideo, "SegmentTemplate", {
                    get: () => {
                      return this.#Period?.AdaptationSetVideo?.SegmentTemplate;
                    },
                    enumerable: false
                  });
                }
                if (!Reflect.has(this.#RepresentationVideo, "mediaRegExecArray")) {
                  Reflect.defineProperty(this.#RepresentationVideo, "mediaRegExecArray", {
                    value: mediaNumber.exec(
                      this.#RepresentationVideo?.SegmentTemplate?.media?.replaceAll("$RepresentationID$", this.#RepresentationVideo?.id ?? "") ?? ""
                    )
                  });
                }
                if (!Reflect.has(this.#RepresentationVideo, "buffered")) {
                  Reflect.defineProperty(this.#RepresentationVideo, "buffered", { get() {
                    return mse.videoSourceBuffer.buffered;
                  } });
                }
                this.#RepresentationVideo.computedDuratio ??= Number((this.#RepresentationVideo?.SegmentTemplate?.duration && this.#RepresentationVideo?.SegmentTemplate?.timescale ? Math.round((this.#RepresentationVideo?.SegmentTemplate?.duration ?? 0) / (this.#RepresentationVideo?.SegmentTemplate?.timescale ?? 0)) : this.#RepresentationVideo?.SegmentTemplate?.duration ?? 0).toFixed(2));
                if (isRemovesourceBuffer)
                  mse.vpush((sourceBuffer) => {
                    sourceBuffer.remove(0, this.#el.currentTime + 1);
                  });
                mse.vpush((sourceBuffer) => {
                  if (sourceBuffer) {
                    sourceBuffer?.changeType(
                      `${this.#RepresentationVideo?.mimeType ?? "video/mp4"}; codecs="${this.#RepresentationVideo?.codecs}"`
                    );
                    this.#eventbus.trigger(VidoeDashEventType.BUFFER_PUSH_INITSTREAM, this.#RepresentationVideo);
                  }
                });
              }
              break;
            case "audio":
              this.#RepresentationAudio?.currentfetchabort?.();
              this.#RepresentationAudio = this.#Period?.AdaptationSetAudio?.Representation.at(-1) ?? {};
              if (this.#RepresentationAudio) {
                if (!this.#RepresentationAudio?.SegmentTemplate) {
                  Reflect.defineProperty(this.#RepresentationAudio, "SegmentTemplate", {
                    get: () => {
                      return this.#Period?.AdaptationSetAudio?.SegmentTemplate;
                    },
                    enumerable: false
                  });
                }
                if (!Reflect.has(this.#RepresentationAudio, "mediaRegExecArray")) {
                  Reflect.defineProperty(this.#RepresentationAudio, "mediaRegExecArray", {
                    value: mediaNumber.exec(
                      this.#RepresentationAudio?.SegmentTemplate?.media?.replaceAll("$RepresentationID$", this.#RepresentationAudio?.id ?? "") ?? ""
                    )
                  });
                }
                if (!Reflect.has(this.#RepresentationAudio, "buffered")) {
                  Reflect.defineProperty(this.#RepresentationAudio, "buffered", { get() {
                    return mse.audioSourceBuffer.buffered;
                  } });
                }
                this.#RepresentationAudio.computedDuratio ??= this.#RepresentationAudio?.SegmentTemplate?.duration && this.#RepresentationAudio?.SegmentTemplate?.timescale ? (this.#RepresentationAudio?.SegmentTemplate?.duration ?? Infinity) / (this.#RepresentationAudio?.SegmentTemplate?.timescale ?? Infinity) : this.#RepresentationAudio?.SegmentTemplate?.duration ?? Infinity;
                if (isRemovesourceBuffer)
                  mse.apush((sourceBuffer) => {
                    sourceBuffer.remove(0, this.#el.currentTime + 1);
                  });
                mse.apush((sourceBuffer) => {
                  if (sourceBuffer) {
                    sourceBuffer?.changeType(
                      `${this.#RepresentationAudio?.mimeType ?? "audio/mp4"}; codecs="${this.#RepresentationAudio?.codecs ?? "mp4a.40.2"}"`
                    );
                    this.#eventbus.trigger(VidoeDashEventType.BUFFER_PUSH_INITSTREAM, this.#RepresentationAudio);
                  }
                });
              }
              break;
          }
        });
      }
      on(eventname, fn) {
        this.#eventbus.on(eventname, fn);
      }
      /** 设定画质 */
      SetQuality(mediatype, index, isRemovesourceBuffer = false) {
        this.#eventbus.trigger(VidoeDashEventType.QUALITY_CHANGE_REQUESTED, mediatype, index, isRemovesourceBuffer);
      }
      GetQuality(mediatype) {
        switch (mediatype) {
          case "video":
            return this.#RepresentationVideo;
          case "audio":
            return this.#RepresentationAudio;
          default:
            return void 0;
        }
      }
      GetQualityList(mediatype) {
        switch (mediatype) {
          case "video":
            return this.#Period?.AdaptationSetVideo?.Representation;
          case "audio":
            return this.#Period?.AdaptationSetAudio?.Representation;
          default:
            return void 0;
        }
      }
      /** 装载MPD文件 */
      loader(url) {
        this.#url = url instanceof URL ? url : new URL(url, window.location.href);
        fetch(url).then((c) => {
          if (c.status < 400)
            return c.text();
          throw c;
        }).then((c) => {
          this.#MPD = new MPD3(c);
          this.#eventbus.trigger(VidoeDashEventType.MANIFEST_LOADING_FINISHED);
        });
      }
    }

    class Elextend {
      constructor(el) {
        this.#el = el;
      }
      #el;
      #options;
      get options() {
        return this.#options;
      }
      set options(val) {
        val?.setup?.(this.#el);
        this.#options = val;
      }
      get el() {
        return this.#el;
      }
      set el(el) {
        this.options?.setup?.(el);
        this.#el = el;
      }
      cb() {
        this.options?.cb?.(this.#el);
      }
    }
    class VideoControllerbar {
      #SetProperty(el) {
        const elextend = new Elextend(el);
        return (ext) => {
          if (ext instanceof HTMLElement) {
            elextend.el = ext;
          } else if (ext instanceof Function) {
            ext(elextend.el);
          } else if (typeof ext === "object") {
            elextend.options = ext;
          } else {
            elextend?.cb?.();
          }
        };
      }
      videoDiv;
      el;
      constructor(videoplayer, ViodeDash2) {
        const videoDiv = (typeof videoplayer === "string" ? document.getElementById(videoplayer) : videoplayer) ?? document.querySelector(`[${videoplayer}]`);
        this.videoDiv = this.#SetProperty(videoDiv);
        this.el = this.#SetProperty(ViodeDash2.el);
        return new Proxy(this, {
          get(target, prop) {
            if (!Reflect.has(target, prop)) {
              const el = videoDiv.querySelector(`[${prop.toString()}]`) || videoDiv.querySelector(`#${prop.toString()}`) || videoDiv.querySelector(`.${prop.toString()}`);
              if (el)
                Reflect.set(target, prop, target.#SetProperty(el));
            }
            return Reflect.get(target, prop);
          },
          set() {
            return false;
          }
        });
      }
    }

    exports.MPD3 = MPD3;
    exports.VideoControllerbar = VideoControllerbar;
    exports.VideoDash = VideoDashPrivate;
    exports.VideoDashEventType = VidoeDashEventType;
    exports.eventbus = eventbus;

    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

}));
