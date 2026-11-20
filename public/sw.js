var wt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Dt(Y) {
  return Y && Y.__esModule && Object.prototype.hasOwnProperty.call(Y, "default") ? Y.default : Y;
}
function yt(Y) {
  throw new Error('Could not dynamically require "' + Y + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var xt = { exports: {} };
/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/
var At;
function Ft() {
  return At || (At = 1, (function(Y, V) {
    (function(c) {
      Y.exports = c();
    })(function() {
      return (function c(O, v, o) {
        function l(g, y) {
          if (!v[g]) {
            if (!O[g]) {
              var m = typeof yt == "function" && yt;
              if (!y && m) return m(g, !0);
              if (n) return n(g, !0);
              var b = new Error("Cannot find module '" + g + "'");
              throw b.code = "MODULE_NOT_FOUND", b;
            }
            var i = v[g] = { exports: {} };
            O[g][0].call(i.exports, function(d) {
              var r = O[g][1][d];
              return l(r || d);
            }, i, i.exports, c, O, v, o);
          }
          return v[g].exports;
        }
        for (var n = typeof yt == "function" && yt, u = 0; u < o.length; u++) l(o[u]);
        return l;
      })({ 1: [function(c, O, v) {
        var o = c("./utils"), l = c("./support"), n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        v.encode = function(u) {
          for (var g, y, m, b, i, d, r, h = [], a = 0, p = u.length, w = p, S = o.getTypeOf(u) !== "string"; a < u.length; ) w = p - a, m = S ? (g = u[a++], y = a < p ? u[a++] : 0, a < p ? u[a++] : 0) : (g = u.charCodeAt(a++), y = a < p ? u.charCodeAt(a++) : 0, a < p ? u.charCodeAt(a++) : 0), b = g >> 2, i = (3 & g) << 4 | y >> 4, d = 1 < w ? (15 & y) << 2 | m >> 6 : 64, r = 2 < w ? 63 & m : 64, h.push(n.charAt(b) + n.charAt(i) + n.charAt(d) + n.charAt(r));
          return h.join("");
        }, v.decode = function(u) {
          var g, y, m, b, i, d, r = 0, h = 0, a = "data:";
          if (u.substr(0, a.length) === a) throw new Error("Invalid base64 input, it looks like a data url.");
          var p, w = 3 * (u = u.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (u.charAt(u.length - 1) === n.charAt(64) && w--, u.charAt(u.length - 2) === n.charAt(64) && w--, w % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (p = l.uint8array ? new Uint8Array(0 | w) : new Array(0 | w); r < u.length; ) g = n.indexOf(u.charAt(r++)) << 2 | (b = n.indexOf(u.charAt(r++))) >> 4, y = (15 & b) << 4 | (i = n.indexOf(u.charAt(r++))) >> 2, m = (3 & i) << 6 | (d = n.indexOf(u.charAt(r++))), p[h++] = g, i !== 64 && (p[h++] = y), d !== 64 && (p[h++] = m);
          return p;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(c, O, v) {
        var o = c("./external"), l = c("./stream/DataWorker"), n = c("./stream/Crc32Probe"), u = c("./stream/DataLengthProbe");
        function g(y, m, b, i, d) {
          this.compressedSize = y, this.uncompressedSize = m, this.crc32 = b, this.compression = i, this.compressedContent = d;
        }
        g.prototype = { getContentWorker: function() {
          var y = new l(o.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new u("data_length")), m = this;
          return y.on("end", function() {
            if (this.streamInfo.data_length !== m.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), y;
        }, getCompressedWorker: function() {
          return new l(o.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, g.createWorkerFrom = function(y, m, b) {
          return y.pipe(new n()).pipe(new u("uncompressedSize")).pipe(m.compressWorker(b)).pipe(new u("compressedSize")).withStreamInfo("compression", m);
        }, O.exports = g;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(c, O, v) {
        var o = c("./stream/GenericWorker");
        v.STORE = { magic: "\0\0", compressWorker: function() {
          return new o("STORE compression");
        }, uncompressWorker: function() {
          return new o("STORE decompression");
        } }, v.DEFLATE = c("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(c, O, v) {
        var o = c("./utils"), l = (function() {
          for (var n, u = [], g = 0; g < 256; g++) {
            n = g;
            for (var y = 0; y < 8; y++) n = 1 & n ? 3988292384 ^ n >>> 1 : n >>> 1;
            u[g] = n;
          }
          return u;
        })();
        O.exports = function(n, u) {
          return n !== void 0 && n.length ? o.getTypeOf(n) !== "string" ? (function(g, y, m, b) {
            var i = l, d = b + m;
            g ^= -1;
            for (var r = b; r < d; r++) g = g >>> 8 ^ i[255 & (g ^ y[r])];
            return -1 ^ g;
          })(0 | u, n, n.length, 0) : (function(g, y, m, b) {
            var i = l, d = b + m;
            g ^= -1;
            for (var r = b; r < d; r++) g = g >>> 8 ^ i[255 & (g ^ y.charCodeAt(r))];
            return -1 ^ g;
          })(0 | u, n, n.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(c, O, v) {
        v.base64 = !1, v.binary = !1, v.dir = !1, v.createFolders = !0, v.date = null, v.compression = null, v.compressionOptions = null, v.comment = null, v.unixPermissions = null, v.dosPermissions = null;
      }, {}], 6: [function(c, O, v) {
        var o = null;
        o = typeof Promise < "u" ? Promise : c("lie"), O.exports = { Promise: o };
      }, { lie: 37 }], 7: [function(c, O, v) {
        var o = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Uint32Array < "u", l = c("pako"), n = c("./utils"), u = c("./stream/GenericWorker"), g = o ? "uint8array" : "array";
        function y(m, b) {
          u.call(this, "FlateWorker/" + m), this._pako = null, this._pakoAction = m, this._pakoOptions = b, this.meta = {};
        }
        v.magic = "\b\0", n.inherits(y, u), y.prototype.processChunk = function(m) {
          this.meta = m.meta, this._pako === null && this._createPako(), this._pako.push(n.transformTo(g, m.data), !1);
        }, y.prototype.flush = function() {
          u.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
        }, y.prototype.cleanUp = function() {
          u.prototype.cleanUp.call(this), this._pako = null;
        }, y.prototype._createPako = function() {
          this._pako = new l[this._pakoAction]({ raw: !0, level: this._pakoOptions.level || -1 });
          var m = this;
          this._pako.onData = function(b) {
            m.push({ data: b, meta: m.meta });
          };
        }, v.compressWorker = function(m) {
          return new y("Deflate", m);
        }, v.uncompressWorker = function() {
          return new y("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(c, O, v) {
        function o(i, d) {
          var r, h = "";
          for (r = 0; r < d; r++) h += String.fromCharCode(255 & i), i >>>= 8;
          return h;
        }
        function l(i, d, r, h, a, p) {
          var w, S, x = i.file, F = i.compression, B = p !== g.utf8encode, j = n.transformTo("string", p(x.name)), I = n.transformTo("string", g.utf8encode(x.name)), W = x.comment, $ = n.transformTo("string", p(W)), _ = n.transformTo("string", g.utf8encode(W)), R = I.length !== x.name.length, e = _.length !== W.length, D = "", Q = "", P = "", tt = x.dir, L = x.date, J = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          d && !r || (J.crc32 = i.crc32, J.compressedSize = i.compressedSize, J.uncompressedSize = i.uncompressedSize);
          var C = 0;
          d && (C |= 8), B || !R && !e || (C |= 2048);
          var E = 0, X = 0;
          tt && (E |= 16), a === "UNIX" ? (X = 798, E |= (function(G, at) {
            var ut = G;
            return G || (ut = at ? 16893 : 33204), (65535 & ut) << 16;
          })(x.unixPermissions, tt)) : (X = 20, E |= (function(G) {
            return 63 & (G || 0);
          })(x.dosPermissions)), w = L.getUTCHours(), w <<= 6, w |= L.getUTCMinutes(), w <<= 5, w |= L.getUTCSeconds() / 2, S = L.getUTCFullYear() - 1980, S <<= 4, S |= L.getUTCMonth() + 1, S <<= 5, S |= L.getUTCDate(), R && (Q = o(1, 1) + o(y(j), 4) + I, D += "up" + o(Q.length, 2) + Q), e && (P = o(1, 1) + o(y($), 4) + _, D += "uc" + o(P.length, 2) + P);
          var H = "";
          return H += `
\0`, H += o(C, 2), H += F.magic, H += o(w, 2), H += o(S, 2), H += o(J.crc32, 4), H += o(J.compressedSize, 4), H += o(J.uncompressedSize, 4), H += o(j.length, 2), H += o(D.length, 2), { fileRecord: m.LOCAL_FILE_HEADER + H + j + D, dirRecord: m.CENTRAL_FILE_HEADER + o(X, 2) + H + o($.length, 2) + "\0\0\0\0" + o(E, 4) + o(h, 4) + j + D + $ };
        }
        var n = c("../utils"), u = c("../stream/GenericWorker"), g = c("../utf8"), y = c("../crc32"), m = c("../signature");
        function b(i, d, r, h) {
          u.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = d, this.zipPlatform = r, this.encodeFileName = h, this.streamFiles = i, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        n.inherits(b, u), b.prototype.push = function(i) {
          var d = i.meta.percent || 0, r = this.entriesCount, h = this._sources.length;
          this.accumulate ? this.contentBuffer.push(i) : (this.bytesWritten += i.data.length, u.prototype.push.call(this, { data: i.data, meta: { currentFile: this.currentFile, percent: r ? (d + 100 * (r - h - 1)) / r : 100 } }));
        }, b.prototype.openedSource = function(i) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = i.file.name;
          var d = this.streamFiles && !i.file.dir;
          if (d) {
            var r = l(i, d, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: r.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = !0;
        }, b.prototype.closedSource = function(i) {
          this.accumulate = !1;
          var d = this.streamFiles && !i.file.dir, r = l(i, d, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(r.dirRecord), d) this.push({ data: (function(h) {
            return m.DATA_DESCRIPTOR + o(h.crc32, 4) + o(h.compressedSize, 4) + o(h.uncompressedSize, 4);
          })(i), meta: { percent: 100 } });
          else for (this.push({ data: r.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, b.prototype.flush = function() {
          for (var i = this.bytesWritten, d = 0; d < this.dirRecords.length; d++) this.push({ data: this.dirRecords[d], meta: { percent: 100 } });
          var r = this.bytesWritten - i, h = (function(a, p, w, S, x) {
            var F = n.transformTo("string", x(S));
            return m.CENTRAL_DIRECTORY_END + "\0\0\0\0" + o(a, 2) + o(a, 2) + o(p, 4) + o(w, 4) + o(F.length, 2) + F;
          })(this.dirRecords.length, r, i, this.zipComment, this.encodeFileName);
          this.push({ data: h, meta: { percent: 100 } });
        }, b.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, b.prototype.registerPrevious = function(i) {
          this._sources.push(i);
          var d = this;
          return i.on("data", function(r) {
            d.processChunk(r);
          }), i.on("end", function() {
            d.closedSource(d.previous.streamInfo), d._sources.length ? d.prepareNextSource() : d.end();
          }), i.on("error", function(r) {
            d.error(r);
          }), this;
        }, b.prototype.resume = function() {
          return !!u.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0));
        }, b.prototype.error = function(i) {
          var d = this._sources;
          if (!u.prototype.error.call(this, i)) return !1;
          for (var r = 0; r < d.length; r++) try {
            d[r].error(i);
          } catch {
          }
          return !0;
        }, b.prototype.lock = function() {
          u.prototype.lock.call(this);
          for (var i = this._sources, d = 0; d < i.length; d++) i[d].lock();
        }, O.exports = b;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(c, O, v) {
        var o = c("../compressions"), l = c("./ZipFileWorker");
        v.generateWorker = function(n, u, g) {
          var y = new l(u.streamFiles, g, u.platform, u.encodeFileName), m = 0;
          try {
            n.forEach(function(b, i) {
              m++;
              var d = (function(p, w) {
                var S = p || w, x = o[S];
                if (!x) throw new Error(S + " is not a valid compression method !");
                return x;
              })(i.options.compression, u.compression), r = i.options.compressionOptions || u.compressionOptions || {}, h = i.dir, a = i.date;
              i._compressWorker(d, r).withStreamInfo("file", { name: b, dir: h, date: a, comment: i.comment || "", unixPermissions: i.unixPermissions, dosPermissions: i.dosPermissions }).pipe(y);
            }), y.entriesCount = m;
          } catch (b) {
            y.error(b);
          }
          return y;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(c, O, v) {
        function o() {
          if (!(this instanceof o)) return new o();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var l = new o();
            for (var n in this) typeof this[n] != "function" && (l[n] = this[n]);
            return l;
          };
        }
        (o.prototype = c("./object")).loadAsync = c("./load"), o.support = c("./support"), o.defaults = c("./defaults"), o.version = "3.10.1", o.loadAsync = function(l, n) {
          return new o().loadAsync(l, n);
        }, o.external = c("./external"), O.exports = o;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(c, O, v) {
        var o = c("./utils"), l = c("./external"), n = c("./utf8"), u = c("./zipEntries"), g = c("./stream/Crc32Probe"), y = c("./nodejsUtils");
        function m(b) {
          return new l.Promise(function(i, d) {
            var r = b.decompressed.getContentWorker().pipe(new g());
            r.on("error", function(h) {
              d(h);
            }).on("end", function() {
              r.streamInfo.crc32 !== b.decompressed.crc32 ? d(new Error("Corrupted zip : CRC32 mismatch")) : i();
            }).resume();
          });
        }
        O.exports = function(b, i) {
          var d = this;
          return i = o.extend(i || {}, { base64: !1, checkCRC32: !1, optimizedBinaryString: !1, createFolders: !1, decodeFileName: n.utf8decode }), y.isNode && y.isStream(b) ? l.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : o.prepareContent("the loaded zip file", b, !0, i.optimizedBinaryString, i.base64).then(function(r) {
            var h = new u(i);
            return h.load(r), h;
          }).then(function(r) {
            var h = [l.Promise.resolve(r)], a = r.files;
            if (i.checkCRC32) for (var p = 0; p < a.length; p++) h.push(m(a[p]));
            return l.Promise.all(h);
          }).then(function(r) {
            for (var h = r.shift(), a = h.files, p = 0; p < a.length; p++) {
              var w = a[p], S = w.fileNameStr, x = o.resolve(w.fileNameStr);
              d.file(x, w.decompressed, { binary: !0, optimizedBinaryString: !0, date: w.date, dir: w.dir, comment: w.fileCommentStr.length ? w.fileCommentStr : null, unixPermissions: w.unixPermissions, dosPermissions: w.dosPermissions, createFolders: i.createFolders }), w.dir || (d.file(x).unsafeOriginalName = S);
            }
            return h.zipComment.length && (d.comment = h.zipComment), d;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(c, O, v) {
        var o = c("../utils"), l = c("../stream/GenericWorker");
        function n(u, g) {
          l.call(this, "Nodejs stream input adapter for " + u), this._upstreamEnded = !1, this._bindStream(g);
        }
        o.inherits(n, l), n.prototype._bindStream = function(u) {
          var g = this;
          (this._stream = u).pause(), u.on("data", function(y) {
            g.push({ data: y, meta: { percent: 0 } });
          }).on("error", function(y) {
            g.isPaused ? this.generatedError = y : g.error(y);
          }).on("end", function() {
            g.isPaused ? g._upstreamEnded = !0 : g.end();
          });
        }, n.prototype.pause = function() {
          return !!l.prototype.pause.call(this) && (this._stream.pause(), !0);
        }, n.prototype.resume = function() {
          return !!l.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
        }, O.exports = n;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(c, O, v) {
        var o = c("readable-stream").Readable;
        function l(n, u, g) {
          o.call(this, u), this._helper = n;
          var y = this;
          n.on("data", function(m, b) {
            y.push(m) || y._helper.pause(), g && g(b);
          }).on("error", function(m) {
            y.emit("error", m);
          }).on("end", function() {
            y.push(null);
          });
        }
        c("../utils").inherits(l, o), l.prototype._read = function() {
          this._helper.resume();
        }, O.exports = l;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(c, O, v) {
        O.exports = { isNode: typeof Buffer < "u", newBufferFrom: function(o, l) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(o, l);
          if (typeof o == "number") throw new Error('The "data" argument must not be a number');
          return new Buffer(o, l);
        }, allocBuffer: function(o) {
          if (Buffer.alloc) return Buffer.alloc(o);
          var l = new Buffer(o);
          return l.fill(0), l;
        }, isBuffer: function(o) {
          return Buffer.isBuffer(o);
        }, isStream: function(o) {
          return o && typeof o.on == "function" && typeof o.pause == "function" && typeof o.resume == "function";
        } };
      }, {}], 15: [function(c, O, v) {
        function o(x, F, B) {
          var j, I = n.getTypeOf(F), W = n.extend(B || {}, y);
          W.date = W.date || /* @__PURE__ */ new Date(), W.compression !== null && (W.compression = W.compression.toUpperCase()), typeof W.unixPermissions == "string" && (W.unixPermissions = parseInt(W.unixPermissions, 8)), W.unixPermissions && 16384 & W.unixPermissions && (W.dir = !0), W.dosPermissions && 16 & W.dosPermissions && (W.dir = !0), W.dir && (x = a(x)), W.createFolders && (j = h(x)) && p.call(this, j, !0);
          var $ = I === "string" && W.binary === !1 && W.base64 === !1;
          B && B.binary !== void 0 || (W.binary = !$), (F instanceof m && F.uncompressedSize === 0 || W.dir || !F || F.length === 0) && (W.base64 = !1, W.binary = !0, F = "", W.compression = "STORE", I = "string");
          var _ = null;
          _ = F instanceof m || F instanceof u ? F : d.isNode && d.isStream(F) ? new r(x, F) : n.prepareContent(x, F, W.binary, W.optimizedBinaryString, W.base64);
          var R = new b(x, _, W);
          this.files[x] = R;
        }
        var l = c("./utf8"), n = c("./utils"), u = c("./stream/GenericWorker"), g = c("./stream/StreamHelper"), y = c("./defaults"), m = c("./compressedObject"), b = c("./zipObject"), i = c("./generate"), d = c("./nodejsUtils"), r = c("./nodejs/NodejsStreamInputAdapter"), h = function(x) {
          x.slice(-1) === "/" && (x = x.substring(0, x.length - 1));
          var F = x.lastIndexOf("/");
          return 0 < F ? x.substring(0, F) : "";
        }, a = function(x) {
          return x.slice(-1) !== "/" && (x += "/"), x;
        }, p = function(x, F) {
          return F = F !== void 0 ? F : y.createFolders, x = a(x), this.files[x] || o.call(this, x, null, { dir: !0, createFolders: F }), this.files[x];
        };
        function w(x) {
          return Object.prototype.toString.call(x) === "[object RegExp]";
        }
        var S = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(x) {
          var F, B, j;
          for (F in this.files) j = this.files[F], (B = F.slice(this.root.length, F.length)) && F.slice(0, this.root.length) === this.root && x(B, j);
        }, filter: function(x) {
          var F = [];
          return this.forEach(function(B, j) {
            x(B, j) && F.push(j);
          }), F;
        }, file: function(x, F, B) {
          if (arguments.length !== 1) return x = this.root + x, o.call(this, x, F, B), this;
          if (w(x)) {
            var j = x;
            return this.filter(function(W, $) {
              return !$.dir && j.test(W);
            });
          }
          var I = this.files[this.root + x];
          return I && !I.dir ? I : null;
        }, folder: function(x) {
          if (!x) return this;
          if (w(x)) return this.filter(function(I, W) {
            return W.dir && x.test(I);
          });
          var F = this.root + x, B = p.call(this, F), j = this.clone();
          return j.root = B.name, j;
        }, remove: function(x) {
          x = this.root + x;
          var F = this.files[x];
          if (F || (x.slice(-1) !== "/" && (x += "/"), F = this.files[x]), F && !F.dir) delete this.files[x];
          else for (var B = this.filter(function(I, W) {
            return W.name.slice(0, x.length) === x;
          }), j = 0; j < B.length; j++) delete this.files[B[j].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(x) {
          var F, B = {};
          try {
            if ((B = n.extend(x || {}, { streamFiles: !1, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: l.utf8encode })).type = B.type.toLowerCase(), B.compression = B.compression.toUpperCase(), B.type === "binarystring" && (B.type = "string"), !B.type) throw new Error("No output type specified.");
            n.checkSupport(B.type), B.platform !== "darwin" && B.platform !== "freebsd" && B.platform !== "linux" && B.platform !== "sunos" || (B.platform = "UNIX"), B.platform === "win32" && (B.platform = "DOS");
            var j = B.comment || this.comment || "";
            F = i.generateWorker(this, B, j);
          } catch (I) {
            (F = new u("error")).error(I);
          }
          return new g(F, B.type || "string", B.mimeType);
        }, generateAsync: function(x, F) {
          return this.generateInternalStream(x).accumulate(F);
        }, generateNodeStream: function(x, F) {
          return (x = x || {}).type || (x.type = "nodebuffer"), this.generateInternalStream(x).toNodejsStream(F);
        } };
        O.exports = S;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(c, O, v) {
        O.exports = c("stream");
      }, { stream: void 0 }], 17: [function(c, O, v) {
        var o = c("./DataReader");
        function l(n) {
          o.call(this, n);
          for (var u = 0; u < this.data.length; u++) n[u] = 255 & n[u];
        }
        c("../utils").inherits(l, o), l.prototype.byteAt = function(n) {
          return this.data[this.zero + n];
        }, l.prototype.lastIndexOfSignature = function(n) {
          for (var u = n.charCodeAt(0), g = n.charCodeAt(1), y = n.charCodeAt(2), m = n.charCodeAt(3), b = this.length - 4; 0 <= b; --b) if (this.data[b] === u && this.data[b + 1] === g && this.data[b + 2] === y && this.data[b + 3] === m) return b - this.zero;
          return -1;
        }, l.prototype.readAndCheckSignature = function(n) {
          var u = n.charCodeAt(0), g = n.charCodeAt(1), y = n.charCodeAt(2), m = n.charCodeAt(3), b = this.readData(4);
          return u === b[0] && g === b[1] && y === b[2] && m === b[3];
        }, l.prototype.readData = function(n) {
          if (this.checkOffset(n), n === 0) return [];
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + n);
          return this.index += n, u;
        }, O.exports = l;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(c, O, v) {
        var o = c("../utils");
        function l(n) {
          this.data = n, this.length = n.length, this.index = 0, this.zero = 0;
        }
        l.prototype = { checkOffset: function(n) {
          this.checkIndex(this.index + n);
        }, checkIndex: function(n) {
          if (this.length < this.zero + n || n < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + n + "). Corrupted zip ?");
        }, setIndex: function(n) {
          this.checkIndex(n), this.index = n;
        }, skip: function(n) {
          this.setIndex(this.index + n);
        }, byteAt: function() {
        }, readInt: function(n) {
          var u, g = 0;
          for (this.checkOffset(n), u = this.index + n - 1; u >= this.index; u--) g = (g << 8) + this.byteAt(u);
          return this.index += n, g;
        }, readString: function(n) {
          return o.transformTo("string", this.readData(n));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var n = this.readInt(4);
          return new Date(Date.UTC(1980 + (n >> 25 & 127), (n >> 21 & 15) - 1, n >> 16 & 31, n >> 11 & 31, n >> 5 & 63, (31 & n) << 1));
        } }, O.exports = l;
      }, { "../utils": 32 }], 19: [function(c, O, v) {
        var o = c("./Uint8ArrayReader");
        function l(n) {
          o.call(this, n);
        }
        c("../utils").inherits(l, o), l.prototype.readData = function(n) {
          this.checkOffset(n);
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + n);
          return this.index += n, u;
        }, O.exports = l;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(c, O, v) {
        var o = c("./DataReader");
        function l(n) {
          o.call(this, n);
        }
        c("../utils").inherits(l, o), l.prototype.byteAt = function(n) {
          return this.data.charCodeAt(this.zero + n);
        }, l.prototype.lastIndexOfSignature = function(n) {
          return this.data.lastIndexOf(n) - this.zero;
        }, l.prototype.readAndCheckSignature = function(n) {
          return n === this.readData(4);
        }, l.prototype.readData = function(n) {
          this.checkOffset(n);
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + n);
          return this.index += n, u;
        }, O.exports = l;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(c, O, v) {
        var o = c("./ArrayReader");
        function l(n) {
          o.call(this, n);
        }
        c("../utils").inherits(l, o), l.prototype.readData = function(n) {
          if (this.checkOffset(n), n === 0) return new Uint8Array(0);
          var u = this.data.subarray(this.zero + this.index, this.zero + this.index + n);
          return this.index += n, u;
        }, O.exports = l;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(c, O, v) {
        var o = c("../utils"), l = c("../support"), n = c("./ArrayReader"), u = c("./StringReader"), g = c("./NodeBufferReader"), y = c("./Uint8ArrayReader");
        O.exports = function(m) {
          var b = o.getTypeOf(m);
          return o.checkSupport(b), b !== "string" || l.uint8array ? b === "nodebuffer" ? new g(m) : l.uint8array ? new y(o.transformTo("uint8array", m)) : new n(o.transformTo("array", m)) : new u(m);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(c, O, v) {
        v.LOCAL_FILE_HEADER = "PK", v.CENTRAL_FILE_HEADER = "PK", v.CENTRAL_DIRECTORY_END = "PK", v.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", v.ZIP64_CENTRAL_DIRECTORY_END = "PK", v.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(c, O, v) {
        var o = c("./GenericWorker"), l = c("../utils");
        function n(u) {
          o.call(this, "ConvertWorker to " + u), this.destType = u;
        }
        l.inherits(n, o), n.prototype.processChunk = function(u) {
          this.push({ data: l.transformTo(this.destType, u.data), meta: u.meta });
        }, O.exports = n;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(c, O, v) {
        var o = c("./GenericWorker"), l = c("../crc32");
        function n() {
          o.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        c("../utils").inherits(n, o), n.prototype.processChunk = function(u) {
          this.streamInfo.crc32 = l(u.data, this.streamInfo.crc32 || 0), this.push(u);
        }, O.exports = n;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(c, O, v) {
        var o = c("../utils"), l = c("./GenericWorker");
        function n(u) {
          l.call(this, "DataLengthProbe for " + u), this.propName = u, this.withStreamInfo(u, 0);
        }
        o.inherits(n, l), n.prototype.processChunk = function(u) {
          if (u) {
            var g = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = g + u.data.length;
          }
          l.prototype.processChunk.call(this, u);
        }, O.exports = n;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(c, O, v) {
        var o = c("../utils"), l = c("./GenericWorker");
        function n(u) {
          l.call(this, "DataWorker");
          var g = this;
          this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, u.then(function(y) {
            g.dataIsReady = !0, g.data = y, g.max = y && y.length || 0, g.type = o.getTypeOf(y), g.isPaused || g._tickAndRepeat();
          }, function(y) {
            g.error(y);
          });
        }
        o.inherits(n, l), n.prototype.cleanUp = function() {
          l.prototype.cleanUp.call(this), this.data = null;
        }, n.prototype.resume = function() {
          return !!l.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, o.delay(this._tickAndRepeat, [], this)), !0);
        }, n.prototype._tickAndRepeat = function() {
          this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (o.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
        }, n.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return !1;
          var u = null, g = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              u = this.data.substring(this.index, g);
              break;
            case "uint8array":
              u = this.data.subarray(this.index, g);
              break;
            case "array":
            case "nodebuffer":
              u = this.data.slice(this.index, g);
          }
          return this.index = g, this.push({ data: u, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, O.exports = n;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(c, O, v) {
        function o(l) {
          this.name = l || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        o.prototype = { push: function(l) {
          this.emit("data", l);
        }, end: function() {
          if (this.isFinished) return !1;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = !0;
          } catch (l) {
            this.emit("error", l);
          }
          return !0;
        }, error: function(l) {
          return !this.isFinished && (this.isPaused ? this.generatedError = l : (this.isFinished = !0, this.emit("error", l), this.previous && this.previous.error(l), this.cleanUp()), !0);
        }, on: function(l, n) {
          return this._listeners[l].push(n), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(l, n) {
          if (this._listeners[l]) for (var u = 0; u < this._listeners[l].length; u++) this._listeners[l][u].call(this, n);
        }, pipe: function(l) {
          return l.registerPrevious(this);
        }, registerPrevious: function(l) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = l.streamInfo, this.mergeStreamInfo(), this.previous = l;
          var n = this;
          return l.on("data", function(u) {
            n.processChunk(u);
          }), l.on("end", function() {
            n.end();
          }), l.on("error", function(u) {
            n.error(u);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return !1;
          var l = this.isPaused = !1;
          return this.generatedError && (this.error(this.generatedError), l = !0), this.previous && this.previous.resume(), !l;
        }, flush: function() {
        }, processChunk: function(l) {
          this.push(l);
        }, withStreamInfo: function(l, n) {
          return this.extraStreamInfo[l] = n, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var l in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, l) && (this.streamInfo[l] = this.extraStreamInfo[l]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = !0, this.previous && this.previous.lock();
        }, toString: function() {
          var l = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + l : l;
        } }, O.exports = o;
      }, {}], 29: [function(c, O, v) {
        var o = c("../utils"), l = c("./ConvertWorker"), n = c("./GenericWorker"), u = c("../base64"), g = c("../support"), y = c("../external"), m = null;
        if (g.nodestream) try {
          m = c("../nodejs/NodejsStreamOutputAdapter");
        } catch {
        }
        function b(d, r) {
          return new y.Promise(function(h, a) {
            var p = [], w = d._internalType, S = d._outputType, x = d._mimeType;
            d.on("data", function(F, B) {
              p.push(F), r && r(B);
            }).on("error", function(F) {
              p = [], a(F);
            }).on("end", function() {
              try {
                var F = (function(B, j, I) {
                  switch (B) {
                    case "blob":
                      return o.newBlob(o.transformTo("arraybuffer", j), I);
                    case "base64":
                      return u.encode(j);
                    default:
                      return o.transformTo(B, j);
                  }
                })(S, (function(B, j) {
                  var I, W = 0, $ = null, _ = 0;
                  for (I = 0; I < j.length; I++) _ += j[I].length;
                  switch (B) {
                    case "string":
                      return j.join("");
                    case "array":
                      return Array.prototype.concat.apply([], j);
                    case "uint8array":
                      for ($ = new Uint8Array(_), I = 0; I < j.length; I++) $.set(j[I], W), W += j[I].length;
                      return $;
                    case "nodebuffer":
                      return Buffer.concat(j);
                    default:
                      throw new Error("concat : unsupported type '" + B + "'");
                  }
                })(w, p), x);
                h(F);
              } catch (B) {
                a(B);
              }
              p = [];
            }).resume();
          });
        }
        function i(d, r, h) {
          var a = r;
          switch (r) {
            case "blob":
            case "arraybuffer":
              a = "uint8array";
              break;
            case "base64":
              a = "string";
          }
          try {
            this._internalType = a, this._outputType = r, this._mimeType = h, o.checkSupport(a), this._worker = d.pipe(new l(a)), d.lock();
          } catch (p) {
            this._worker = new n("error"), this._worker.error(p);
          }
        }
        i.prototype = { accumulate: function(d) {
          return b(this, d);
        }, on: function(d, r) {
          var h = this;
          return d === "data" ? this._worker.on(d, function(a) {
            r.call(h, a.data, a.meta);
          }) : this._worker.on(d, function() {
            o.delay(r, arguments, h);
          }), this;
        }, resume: function() {
          return o.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(d) {
          if (o.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
          return new m(this, { objectMode: this._outputType !== "nodebuffer" }, d);
        } }, O.exports = i;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(c, O, v) {
        if (v.base64 = !0, v.array = !0, v.string = !0, v.arraybuffer = typeof ArrayBuffer < "u" && typeof Uint8Array < "u", v.nodebuffer = typeof Buffer < "u", v.uint8array = typeof Uint8Array < "u", typeof ArrayBuffer > "u") v.blob = !1;
        else {
          var o = new ArrayBuffer(0);
          try {
            v.blob = new Blob([o], { type: "application/zip" }).size === 0;
          } catch {
            try {
              var l = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              l.append(o), v.blob = l.getBlob("application/zip").size === 0;
            } catch {
              v.blob = !1;
            }
          }
        }
        try {
          v.nodestream = !!c("readable-stream").Readable;
        } catch {
          v.nodestream = !1;
        }
      }, { "readable-stream": 16 }], 31: [function(c, O, v) {
        for (var o = c("./utils"), l = c("./support"), n = c("./nodejsUtils"), u = c("./stream/GenericWorker"), g = new Array(256), y = 0; y < 256; y++) g[y] = 252 <= y ? 6 : 248 <= y ? 5 : 240 <= y ? 4 : 224 <= y ? 3 : 192 <= y ? 2 : 1;
        g[254] = g[254] = 1;
        function m() {
          u.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function b() {
          u.call(this, "utf-8 encode");
        }
        v.utf8encode = function(i) {
          return l.nodebuffer ? n.newBufferFrom(i, "utf-8") : (function(d) {
            var r, h, a, p, w, S = d.length, x = 0;
            for (p = 0; p < S; p++) (64512 & (h = d.charCodeAt(p))) == 55296 && p + 1 < S && (64512 & (a = d.charCodeAt(p + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (a - 56320), p++), x += h < 128 ? 1 : h < 2048 ? 2 : h < 65536 ? 3 : 4;
            for (r = l.uint8array ? new Uint8Array(x) : new Array(x), p = w = 0; w < x; p++) (64512 & (h = d.charCodeAt(p))) == 55296 && p + 1 < S && (64512 & (a = d.charCodeAt(p + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (a - 56320), p++), h < 128 ? r[w++] = h : (h < 2048 ? r[w++] = 192 | h >>> 6 : (h < 65536 ? r[w++] = 224 | h >>> 12 : (r[w++] = 240 | h >>> 18, r[w++] = 128 | h >>> 12 & 63), r[w++] = 128 | h >>> 6 & 63), r[w++] = 128 | 63 & h);
            return r;
          })(i);
        }, v.utf8decode = function(i) {
          return l.nodebuffer ? o.transformTo("nodebuffer", i).toString("utf-8") : (function(d) {
            var r, h, a, p, w = d.length, S = new Array(2 * w);
            for (r = h = 0; r < w; ) if ((a = d[r++]) < 128) S[h++] = a;
            else if (4 < (p = g[a])) S[h++] = 65533, r += p - 1;
            else {
              for (a &= p === 2 ? 31 : p === 3 ? 15 : 7; 1 < p && r < w; ) a = a << 6 | 63 & d[r++], p--;
              1 < p ? S[h++] = 65533 : a < 65536 ? S[h++] = a : (a -= 65536, S[h++] = 55296 | a >> 10 & 1023, S[h++] = 56320 | 1023 & a);
            }
            return S.length !== h && (S.subarray ? S = S.subarray(0, h) : S.length = h), o.applyFromCharCode(S);
          })(i = o.transformTo(l.uint8array ? "uint8array" : "array", i));
        }, o.inherits(m, u), m.prototype.processChunk = function(i) {
          var d = o.transformTo(l.uint8array ? "uint8array" : "array", i.data);
          if (this.leftOver && this.leftOver.length) {
            if (l.uint8array) {
              var r = d;
              (d = new Uint8Array(r.length + this.leftOver.length)).set(this.leftOver, 0), d.set(r, this.leftOver.length);
            } else d = this.leftOver.concat(d);
            this.leftOver = null;
          }
          var h = (function(p, w) {
            var S;
            for ((w = w || p.length) > p.length && (w = p.length), S = w - 1; 0 <= S && (192 & p[S]) == 128; ) S--;
            return S < 0 || S === 0 ? w : S + g[p[S]] > w ? S : w;
          })(d), a = d;
          h !== d.length && (l.uint8array ? (a = d.subarray(0, h), this.leftOver = d.subarray(h, d.length)) : (a = d.slice(0, h), this.leftOver = d.slice(h, d.length))), this.push({ data: v.utf8decode(a), meta: i.meta });
        }, m.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: v.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, v.Utf8DecodeWorker = m, o.inherits(b, u), b.prototype.processChunk = function(i) {
          this.push({ data: v.utf8encode(i.data), meta: i.meta });
        }, v.Utf8EncodeWorker = b;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(c, O, v) {
        var o = c("./support"), l = c("./base64"), n = c("./nodejsUtils"), u = c("./external");
        function g(r) {
          return r;
        }
        function y(r, h) {
          for (var a = 0; a < r.length; ++a) h[a] = 255 & r.charCodeAt(a);
          return h;
        }
        c("setimmediate"), v.newBlob = function(r, h) {
          v.checkSupport("blob");
          try {
            return new Blob([r], { type: h });
          } catch {
            try {
              var a = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return a.append(r), a.getBlob(h);
            } catch {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var m = { stringifyByChunk: function(r, h, a) {
          var p = [], w = 0, S = r.length;
          if (S <= a) return String.fromCharCode.apply(null, r);
          for (; w < S; ) h === "array" || h === "nodebuffer" ? p.push(String.fromCharCode.apply(null, r.slice(w, Math.min(w + a, S)))) : p.push(String.fromCharCode.apply(null, r.subarray(w, Math.min(w + a, S)))), w += a;
          return p.join("");
        }, stringifyByChar: function(r) {
          for (var h = "", a = 0; a < r.length; a++) h += String.fromCharCode(r[a]);
          return h;
        }, applyCanBeUsed: { uint8array: (function() {
          try {
            return o.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
          } catch {
            return !1;
          }
        })(), nodebuffer: (function() {
          try {
            return o.nodebuffer && String.fromCharCode.apply(null, n.allocBuffer(1)).length === 1;
          } catch {
            return !1;
          }
        })() } };
        function b(r) {
          var h = 65536, a = v.getTypeOf(r), p = !0;
          if (a === "uint8array" ? p = m.applyCanBeUsed.uint8array : a === "nodebuffer" && (p = m.applyCanBeUsed.nodebuffer), p) for (; 1 < h; ) try {
            return m.stringifyByChunk(r, a, h);
          } catch {
            h = Math.floor(h / 2);
          }
          return m.stringifyByChar(r);
        }
        function i(r, h) {
          for (var a = 0; a < r.length; a++) h[a] = r[a];
          return h;
        }
        v.applyFromCharCode = b;
        var d = {};
        d.string = { string: g, array: function(r) {
          return y(r, new Array(r.length));
        }, arraybuffer: function(r) {
          return d.string.uint8array(r).buffer;
        }, uint8array: function(r) {
          return y(r, new Uint8Array(r.length));
        }, nodebuffer: function(r) {
          return y(r, n.allocBuffer(r.length));
        } }, d.array = { string: b, array: g, arraybuffer: function(r) {
          return new Uint8Array(r).buffer;
        }, uint8array: function(r) {
          return new Uint8Array(r);
        }, nodebuffer: function(r) {
          return n.newBufferFrom(r);
        } }, d.arraybuffer = { string: function(r) {
          return b(new Uint8Array(r));
        }, array: function(r) {
          return i(new Uint8Array(r), new Array(r.byteLength));
        }, arraybuffer: g, uint8array: function(r) {
          return new Uint8Array(r);
        }, nodebuffer: function(r) {
          return n.newBufferFrom(new Uint8Array(r));
        } }, d.uint8array = { string: b, array: function(r) {
          return i(r, new Array(r.length));
        }, arraybuffer: function(r) {
          return r.buffer;
        }, uint8array: g, nodebuffer: function(r) {
          return n.newBufferFrom(r);
        } }, d.nodebuffer = { string: b, array: function(r) {
          return i(r, new Array(r.length));
        }, arraybuffer: function(r) {
          return d.nodebuffer.uint8array(r).buffer;
        }, uint8array: function(r) {
          return i(r, new Uint8Array(r.length));
        }, nodebuffer: g }, v.transformTo = function(r, h) {
          if (h = h || "", !r) return h;
          v.checkSupport(r);
          var a = v.getTypeOf(h);
          return d[a][r](h);
        }, v.resolve = function(r) {
          for (var h = r.split("/"), a = [], p = 0; p < h.length; p++) {
            var w = h[p];
            w === "." || w === "" && p !== 0 && p !== h.length - 1 || (w === ".." ? a.pop() : a.push(w));
          }
          return a.join("/");
        }, v.getTypeOf = function(r) {
          return typeof r == "string" ? "string" : Object.prototype.toString.call(r) === "[object Array]" ? "array" : o.nodebuffer && n.isBuffer(r) ? "nodebuffer" : o.uint8array && r instanceof Uint8Array ? "uint8array" : o.arraybuffer && r instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, v.checkSupport = function(r) {
          if (!o[r.toLowerCase()]) throw new Error(r + " is not supported by this platform");
        }, v.MAX_VALUE_16BITS = 65535, v.MAX_VALUE_32BITS = -1, v.pretty = function(r) {
          var h, a, p = "";
          for (a = 0; a < (r || "").length; a++) p += "\\x" + ((h = r.charCodeAt(a)) < 16 ? "0" : "") + h.toString(16).toUpperCase();
          return p;
        }, v.delay = function(r, h, a) {
          setImmediate(function() {
            r.apply(a || null, h || []);
          });
        }, v.inherits = function(r, h) {
          function a() {
          }
          a.prototype = h.prototype, r.prototype = new a();
        }, v.extend = function() {
          var r, h, a = {};
          for (r = 0; r < arguments.length; r++) for (h in arguments[r]) Object.prototype.hasOwnProperty.call(arguments[r], h) && a[h] === void 0 && (a[h] = arguments[r][h]);
          return a;
        }, v.prepareContent = function(r, h, a, p, w) {
          return u.Promise.resolve(h).then(function(S) {
            return o.blob && (S instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(S)) !== -1) && typeof FileReader < "u" ? new u.Promise(function(x, F) {
              var B = new FileReader();
              B.onload = function(j) {
                x(j.target.result);
              }, B.onerror = function(j) {
                F(j.target.error);
              }, B.readAsArrayBuffer(S);
            }) : S;
          }).then(function(S) {
            var x = v.getTypeOf(S);
            return x ? (x === "arraybuffer" ? S = v.transformTo("uint8array", S) : x === "string" && (w ? S = l.decode(S) : a && p !== !0 && (S = (function(F) {
              return y(F, o.uint8array ? new Uint8Array(F.length) : new Array(F.length));
            })(S))), S) : u.Promise.reject(new Error("Can't read the data of '" + r + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(c, O, v) {
        var o = c("./reader/readerFor"), l = c("./utils"), n = c("./signature"), u = c("./zipEntry"), g = c("./support");
        function y(m) {
          this.files = [], this.loadOptions = m;
        }
        y.prototype = { checkSignature: function(m) {
          if (!this.reader.readAndCheckSignature(m)) {
            this.reader.index -= 4;
            var b = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + l.pretty(b) + ", expected " + l.pretty(m) + ")");
          }
        }, isSignature: function(m, b) {
          var i = this.reader.index;
          this.reader.setIndex(m);
          var d = this.reader.readString(4) === b;
          return this.reader.setIndex(i), d;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var m = this.reader.readData(this.zipCommentLength), b = g.uint8array ? "uint8array" : "array", i = l.transformTo(b, m);
          this.zipComment = this.loadOptions.decodeFileName(i);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var m, b, i, d = this.zip64EndOfCentralSize - 44; 0 < d; ) m = this.reader.readInt(2), b = this.reader.readInt(4), i = this.reader.readData(b), this.zip64ExtensibleData[m] = { id: m, length: b, value: i };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var m, b;
          for (m = 0; m < this.files.length; m++) b = this.files[m], this.reader.setIndex(b.localHeaderOffset), this.checkSignature(n.LOCAL_FILE_HEADER), b.readLocalPart(this.reader), b.handleUTF8(), b.processAttributes();
        }, readCentralDir: function() {
          var m;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(n.CENTRAL_FILE_HEADER); ) (m = new u({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(m);
          if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var m = this.reader.lastIndexOfSignature(n.CENTRAL_DIRECTORY_END);
          if (m < 0) throw this.isSignature(0, n.LOCAL_FILE_HEADER) ? new Error("Corrupted zip: can't find end of central directory") : new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
          this.reader.setIndex(m);
          var b = m;
          if (this.checkSignature(n.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === l.MAX_VALUE_16BITS || this.diskWithCentralDirStart === l.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === l.MAX_VALUE_16BITS || this.centralDirRecords === l.MAX_VALUE_16BITS || this.centralDirSize === l.MAX_VALUE_32BITS || this.centralDirOffset === l.MAX_VALUE_32BITS) {
            if (this.zip64 = !0, (m = this.reader.lastIndexOfSignature(n.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(m), this.checkSignature(n.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, n.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(n.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(n.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var i = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (i += 20, i += 12 + this.zip64EndOfCentralSize);
          var d = b - i;
          if (0 < d) this.isSignature(b, n.CENTRAL_FILE_HEADER) || (this.reader.zero = d);
          else if (d < 0) throw new Error("Corrupted zip: missing " + Math.abs(d) + " bytes.");
        }, prepareReader: function(m) {
          this.reader = o(m);
        }, load: function(m) {
          this.prepareReader(m), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, O.exports = y;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(c, O, v) {
        var o = c("./reader/readerFor"), l = c("./utils"), n = c("./compressedObject"), u = c("./crc32"), g = c("./utf8"), y = c("./compressions"), m = c("./support");
        function b(i, d) {
          this.options = i, this.loadOptions = d;
        }
        b.prototype = { isEncrypted: function() {
          return (1 & this.bitFlag) == 1;
        }, useUTF8: function() {
          return (2048 & this.bitFlag) == 2048;
        }, readLocalPart: function(i) {
          var d, r;
          if (i.skip(22), this.fileNameLength = i.readInt(2), r = i.readInt(2), this.fileName = i.readData(this.fileNameLength), i.skip(r), this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if ((d = (function(h) {
            for (var a in y) if (Object.prototype.hasOwnProperty.call(y, a) && y[a].magic === h) return y[a];
            return null;
          })(this.compressionMethod)) === null) throw new Error("Corrupted zip : compression " + l.pretty(this.compressionMethod) + " unknown (inner file : " + l.transformTo("string", this.fileName) + ")");
          this.decompressed = new n(this.compressedSize, this.uncompressedSize, this.crc32, d, i.readData(this.compressedSize));
        }, readCentralPart: function(i) {
          this.versionMadeBy = i.readInt(2), i.skip(2), this.bitFlag = i.readInt(2), this.compressionMethod = i.readString(2), this.date = i.readDate(), this.crc32 = i.readInt(4), this.compressedSize = i.readInt(4), this.uncompressedSize = i.readInt(4);
          var d = i.readInt(2);
          if (this.extraFieldsLength = i.readInt(2), this.fileCommentLength = i.readInt(2), this.diskNumberStart = i.readInt(2), this.internalFileAttributes = i.readInt(2), this.externalFileAttributes = i.readInt(4), this.localHeaderOffset = i.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
          i.skip(d), this.readExtraFields(i), this.parseZIP64ExtraField(i), this.fileComment = i.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var i = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), i == 0 && (this.dosPermissions = 63 & this.externalFileAttributes), i == 3 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = !0);
        }, parseZIP64ExtraField: function() {
          if (this.extraFields[1]) {
            var i = o(this.extraFields[1].value);
            this.uncompressedSize === l.MAX_VALUE_32BITS && (this.uncompressedSize = i.readInt(8)), this.compressedSize === l.MAX_VALUE_32BITS && (this.compressedSize = i.readInt(8)), this.localHeaderOffset === l.MAX_VALUE_32BITS && (this.localHeaderOffset = i.readInt(8)), this.diskNumberStart === l.MAX_VALUE_32BITS && (this.diskNumberStart = i.readInt(4));
          }
        }, readExtraFields: function(i) {
          var d, r, h, a = i.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); i.index + 4 < a; ) d = i.readInt(2), r = i.readInt(2), h = i.readData(r), this.extraFields[d] = { id: d, length: r, value: h };
          i.setIndex(a);
        }, handleUTF8: function() {
          var i = m.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = g.utf8decode(this.fileName), this.fileCommentStr = g.utf8decode(this.fileComment);
          else {
            var d = this.findExtraFieldUnicodePath();
            if (d !== null) this.fileNameStr = d;
            else {
              var r = l.transformTo(i, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(r);
            }
            var h = this.findExtraFieldUnicodeComment();
            if (h !== null) this.fileCommentStr = h;
            else {
              var a = l.transformTo(i, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(a);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var i = this.extraFields[28789];
          if (i) {
            var d = o(i.value);
            return d.readInt(1) !== 1 || u(this.fileName) !== d.readInt(4) ? null : g.utf8decode(d.readData(i.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var i = this.extraFields[25461];
          if (i) {
            var d = o(i.value);
            return d.readInt(1) !== 1 || u(this.fileComment) !== d.readInt(4) ? null : g.utf8decode(d.readData(i.length - 5));
          }
          return null;
        } }, O.exports = b;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(c, O, v) {
        function o(d, r, h) {
          this.name = d, this.dir = h.dir, this.date = h.date, this.comment = h.comment, this.unixPermissions = h.unixPermissions, this.dosPermissions = h.dosPermissions, this._data = r, this._dataBinary = h.binary, this.options = { compression: h.compression, compressionOptions: h.compressionOptions };
        }
        var l = c("./stream/StreamHelper"), n = c("./stream/DataWorker"), u = c("./utf8"), g = c("./compressedObject"), y = c("./stream/GenericWorker");
        o.prototype = { internalStream: function(d) {
          var r = null, h = "string";
          try {
            if (!d) throw new Error("No output type specified.");
            var a = (h = d.toLowerCase()) === "string" || h === "text";
            h !== "binarystring" && h !== "text" || (h = "string"), r = this._decompressWorker();
            var p = !this._dataBinary;
            p && !a && (r = r.pipe(new u.Utf8EncodeWorker())), !p && a && (r = r.pipe(new u.Utf8DecodeWorker()));
          } catch (w) {
            (r = new y("error")).error(w);
          }
          return new l(r, h, "");
        }, async: function(d, r) {
          return this.internalStream(d).accumulate(r);
        }, nodeStream: function(d, r) {
          return this.internalStream(d || "nodebuffer").toNodejsStream(r);
        }, _compressWorker: function(d, r) {
          if (this._data instanceof g && this._data.compression.magic === d.magic) return this._data.getCompressedWorker();
          var h = this._decompressWorker();
          return this._dataBinary || (h = h.pipe(new u.Utf8EncodeWorker())), g.createWorkerFrom(h, d, r);
        }, _decompressWorker: function() {
          return this._data instanceof g ? this._data.getContentWorker() : this._data instanceof y ? this._data : new n(this._data);
        } };
        for (var m = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], b = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, i = 0; i < m.length; i++) o.prototype[m[i]] = b;
        O.exports = o;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(c, O, v) {
        (function(o) {
          var l, n, u = o.MutationObserver || o.WebKitMutationObserver;
          if (u) {
            var g = 0, y = new u(d), m = o.document.createTextNode("");
            y.observe(m, { characterData: !0 }), l = function() {
              m.data = g = ++g % 2;
            };
          } else if (o.setImmediate || o.MessageChannel === void 0) l = "document" in o && "onreadystatechange" in o.document.createElement("script") ? function() {
            var r = o.document.createElement("script");
            r.onreadystatechange = function() {
              d(), r.onreadystatechange = null, r.parentNode.removeChild(r), r = null;
            }, o.document.documentElement.appendChild(r);
          } : function() {
            setTimeout(d, 0);
          };
          else {
            var b = new o.MessageChannel();
            b.port1.onmessage = d, l = function() {
              b.port2.postMessage(0);
            };
          }
          var i = [];
          function d() {
            var r, h;
            n = !0;
            for (var a = i.length; a; ) {
              for (h = i, i = [], r = -1; ++r < a; ) h[r]();
              a = i.length;
            }
            n = !1;
          }
          O.exports = function(r) {
            i.push(r) !== 1 || n || l();
          };
        }).call(this, typeof wt < "u" ? wt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}], 37: [function(c, O, v) {
        var o = c("immediate");
        function l() {
        }
        var n = {}, u = ["REJECTED"], g = ["FULFILLED"], y = ["PENDING"];
        function m(a) {
          if (typeof a != "function") throw new TypeError("resolver must be a function");
          this.state = y, this.queue = [], this.outcome = void 0, a !== l && r(this, a);
        }
        function b(a, p, w) {
          this.promise = a, typeof p == "function" && (this.onFulfilled = p, this.callFulfilled = this.otherCallFulfilled), typeof w == "function" && (this.onRejected = w, this.callRejected = this.otherCallRejected);
        }
        function i(a, p, w) {
          o(function() {
            var S;
            try {
              S = p(w);
            } catch (x) {
              return n.reject(a, x);
            }
            S === a ? n.reject(a, new TypeError("Cannot resolve promise with itself")) : n.resolve(a, S);
          });
        }
        function d(a) {
          var p = a && a.then;
          if (a && (typeof a == "object" || typeof a == "function") && typeof p == "function") return function() {
            p.apply(a, arguments);
          };
        }
        function r(a, p) {
          var w = !1;
          function S(B) {
            w || (w = !0, n.reject(a, B));
          }
          function x(B) {
            w || (w = !0, n.resolve(a, B));
          }
          var F = h(function() {
            p(x, S);
          });
          F.status === "error" && S(F.value);
        }
        function h(a, p) {
          var w = {};
          try {
            w.value = a(p), w.status = "success";
          } catch (S) {
            w.status = "error", w.value = S;
          }
          return w;
        }
        (O.exports = m).prototype.finally = function(a) {
          if (typeof a != "function") return this;
          var p = this.constructor;
          return this.then(function(w) {
            return p.resolve(a()).then(function() {
              return w;
            });
          }, function(w) {
            return p.resolve(a()).then(function() {
              throw w;
            });
          });
        }, m.prototype.catch = function(a) {
          return this.then(null, a);
        }, m.prototype.then = function(a, p) {
          if (typeof a != "function" && this.state === g || typeof p != "function" && this.state === u) return this;
          var w = new this.constructor(l);
          return this.state !== y ? i(w, this.state === g ? a : p, this.outcome) : this.queue.push(new b(w, a, p)), w;
        }, b.prototype.callFulfilled = function(a) {
          n.resolve(this.promise, a);
        }, b.prototype.otherCallFulfilled = function(a) {
          i(this.promise, this.onFulfilled, a);
        }, b.prototype.callRejected = function(a) {
          n.reject(this.promise, a);
        }, b.prototype.otherCallRejected = function(a) {
          i(this.promise, this.onRejected, a);
        }, n.resolve = function(a, p) {
          var w = h(d, p);
          if (w.status === "error") return n.reject(a, w.value);
          var S = w.value;
          if (S) r(a, S);
          else {
            a.state = g, a.outcome = p;
            for (var x = -1, F = a.queue.length; ++x < F; ) a.queue[x].callFulfilled(p);
          }
          return a;
        }, n.reject = function(a, p) {
          a.state = u, a.outcome = p;
          for (var w = -1, S = a.queue.length; ++w < S; ) a.queue[w].callRejected(p);
          return a;
        }, m.resolve = function(a) {
          return a instanceof this ? a : n.resolve(new this(l), a);
        }, m.reject = function(a) {
          var p = new this(l);
          return n.reject(p, a);
        }, m.all = function(a) {
          var p = this;
          if (Object.prototype.toString.call(a) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var w = a.length, S = !1;
          if (!w) return this.resolve([]);
          for (var x = new Array(w), F = 0, B = -1, j = new this(l); ++B < w; ) I(a[B], B);
          return j;
          function I(W, $) {
            p.resolve(W).then(function(_) {
              x[$] = _, ++F !== w || S || (S = !0, n.resolve(j, x));
            }, function(_) {
              S || (S = !0, n.reject(j, _));
            });
          }
        }, m.race = function(a) {
          var p = this;
          if (Object.prototype.toString.call(a) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var w = a.length, S = !1;
          if (!w) return this.resolve([]);
          for (var x = -1, F = new this(l); ++x < w; ) B = a[x], p.resolve(B).then(function(j) {
            S || (S = !0, n.resolve(F, j));
          }, function(j) {
            S || (S = !0, n.reject(F, j));
          });
          var B;
          return F;
        };
      }, { immediate: 36 }], 38: [function(c, O, v) {
        var o = {};
        (0, c("./lib/utils/common").assign)(o, c("./lib/deflate"), c("./lib/inflate"), c("./lib/zlib/constants")), O.exports = o;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(c, O, v) {
        var o = c("./zlib/deflate"), l = c("./utils/common"), n = c("./utils/strings"), u = c("./zlib/messages"), g = c("./zlib/zstream"), y = Object.prototype.toString, m = 0, b = -1, i = 0, d = 8;
        function r(a) {
          if (!(this instanceof r)) return new r(a);
          this.options = l.assign({ level: b, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: i, to: "" }, a || {});
          var p = this.options;
          p.raw && 0 < p.windowBits ? p.windowBits = -p.windowBits : p.gzip && 0 < p.windowBits && p.windowBits < 16 && (p.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new g(), this.strm.avail_out = 0;
          var w = o.deflateInit2(this.strm, p.level, p.method, p.windowBits, p.memLevel, p.strategy);
          if (w !== m) throw new Error(u[w]);
          if (p.header && o.deflateSetHeader(this.strm, p.header), p.dictionary) {
            var S;
            if (S = typeof p.dictionary == "string" ? n.string2buf(p.dictionary) : y.call(p.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(p.dictionary) : p.dictionary, (w = o.deflateSetDictionary(this.strm, S)) !== m) throw new Error(u[w]);
            this._dict_set = !0;
          }
        }
        function h(a, p) {
          var w = new r(p);
          if (w.push(a, !0), w.err) throw w.msg || u[w.err];
          return w.result;
        }
        r.prototype.push = function(a, p) {
          var w, S, x = this.strm, F = this.options.chunkSize;
          if (this.ended) return !1;
          S = p === ~~p ? p : p === !0 ? 4 : 0, typeof a == "string" ? x.input = n.string2buf(a) : y.call(a) === "[object ArrayBuffer]" ? x.input = new Uint8Array(a) : x.input = a, x.next_in = 0, x.avail_in = x.input.length;
          do {
            if (x.avail_out === 0 && (x.output = new l.Buf8(F), x.next_out = 0, x.avail_out = F), (w = o.deflate(x, S)) !== 1 && w !== m) return this.onEnd(w), !(this.ended = !0);
            x.avail_out !== 0 && (x.avail_in !== 0 || S !== 4 && S !== 2) || (this.options.to === "string" ? this.onData(n.buf2binstring(l.shrinkBuf(x.output, x.next_out))) : this.onData(l.shrinkBuf(x.output, x.next_out)));
          } while ((0 < x.avail_in || x.avail_out === 0) && w !== 1);
          return S === 4 ? (w = o.deflateEnd(this.strm), this.onEnd(w), this.ended = !0, w === m) : S !== 2 || (this.onEnd(m), !(x.avail_out = 0));
        }, r.prototype.onData = function(a) {
          this.chunks.push(a);
        }, r.prototype.onEnd = function(a) {
          a === m && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = l.flattenChunks(this.chunks)), this.chunks = [], this.err = a, this.msg = this.strm.msg;
        }, v.Deflate = r, v.deflate = h, v.deflateRaw = function(a, p) {
          return (p = p || {}).raw = !0, h(a, p);
        }, v.gzip = function(a, p) {
          return (p = p || {}).gzip = !0, h(a, p);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(c, O, v) {
        var o = c("./zlib/inflate"), l = c("./utils/common"), n = c("./utils/strings"), u = c("./zlib/constants"), g = c("./zlib/messages"), y = c("./zlib/zstream"), m = c("./zlib/gzheader"), b = Object.prototype.toString;
        function i(r) {
          if (!(this instanceof i)) return new i(r);
          this.options = l.assign({ chunkSize: 16384, windowBits: 0, to: "" }, r || {});
          var h = this.options;
          h.raw && 0 <= h.windowBits && h.windowBits < 16 && (h.windowBits = -h.windowBits, h.windowBits === 0 && (h.windowBits = -15)), !(0 <= h.windowBits && h.windowBits < 16) || r && r.windowBits || (h.windowBits += 32), 15 < h.windowBits && h.windowBits < 48 && (15 & h.windowBits) == 0 && (h.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new y(), this.strm.avail_out = 0;
          var a = o.inflateInit2(this.strm, h.windowBits);
          if (a !== u.Z_OK) throw new Error(g[a]);
          this.header = new m(), o.inflateGetHeader(this.strm, this.header);
        }
        function d(r, h) {
          var a = new i(h);
          if (a.push(r, !0), a.err) throw a.msg || g[a.err];
          return a.result;
        }
        i.prototype.push = function(r, h) {
          var a, p, w, S, x, F, B = this.strm, j = this.options.chunkSize, I = this.options.dictionary, W = !1;
          if (this.ended) return !1;
          p = h === ~~h ? h : h === !0 ? u.Z_FINISH : u.Z_NO_FLUSH, typeof r == "string" ? B.input = n.binstring2buf(r) : b.call(r) === "[object ArrayBuffer]" ? B.input = new Uint8Array(r) : B.input = r, B.next_in = 0, B.avail_in = B.input.length;
          do {
            if (B.avail_out === 0 && (B.output = new l.Buf8(j), B.next_out = 0, B.avail_out = j), (a = o.inflate(B, u.Z_NO_FLUSH)) === u.Z_NEED_DICT && I && (F = typeof I == "string" ? n.string2buf(I) : b.call(I) === "[object ArrayBuffer]" ? new Uint8Array(I) : I, a = o.inflateSetDictionary(this.strm, F)), a === u.Z_BUF_ERROR && W === !0 && (a = u.Z_OK, W = !1), a !== u.Z_STREAM_END && a !== u.Z_OK) return this.onEnd(a), !(this.ended = !0);
            B.next_out && (B.avail_out !== 0 && a !== u.Z_STREAM_END && (B.avail_in !== 0 || p !== u.Z_FINISH && p !== u.Z_SYNC_FLUSH) || (this.options.to === "string" ? (w = n.utf8border(B.output, B.next_out), S = B.next_out - w, x = n.buf2string(B.output, w), B.next_out = S, B.avail_out = j - S, S && l.arraySet(B.output, B.output, w, S, 0), this.onData(x)) : this.onData(l.shrinkBuf(B.output, B.next_out)))), B.avail_in === 0 && B.avail_out === 0 && (W = !0);
          } while ((0 < B.avail_in || B.avail_out === 0) && a !== u.Z_STREAM_END);
          return a === u.Z_STREAM_END && (p = u.Z_FINISH), p === u.Z_FINISH ? (a = o.inflateEnd(this.strm), this.onEnd(a), this.ended = !0, a === u.Z_OK) : p !== u.Z_SYNC_FLUSH || (this.onEnd(u.Z_OK), !(B.avail_out = 0));
        }, i.prototype.onData = function(r) {
          this.chunks.push(r);
        }, i.prototype.onEnd = function(r) {
          r === u.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = l.flattenChunks(this.chunks)), this.chunks = [], this.err = r, this.msg = this.strm.msg;
        }, v.Inflate = i, v.inflate = d, v.inflateRaw = function(r, h) {
          return (h = h || {}).raw = !0, d(r, h);
        }, v.ungzip = d;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(c, O, v) {
        var o = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
        v.assign = function(u) {
          for (var g = Array.prototype.slice.call(arguments, 1); g.length; ) {
            var y = g.shift();
            if (y) {
              if (typeof y != "object") throw new TypeError(y + "must be non-object");
              for (var m in y) y.hasOwnProperty(m) && (u[m] = y[m]);
            }
          }
          return u;
        }, v.shrinkBuf = function(u, g) {
          return u.length === g ? u : u.subarray ? u.subarray(0, g) : (u.length = g, u);
        };
        var l = { arraySet: function(u, g, y, m, b) {
          if (g.subarray && u.subarray) u.set(g.subarray(y, y + m), b);
          else for (var i = 0; i < m; i++) u[b + i] = g[y + i];
        }, flattenChunks: function(u) {
          var g, y, m, b, i, d;
          for (g = m = 0, y = u.length; g < y; g++) m += u[g].length;
          for (d = new Uint8Array(m), g = b = 0, y = u.length; g < y; g++) i = u[g], d.set(i, b), b += i.length;
          return d;
        } }, n = { arraySet: function(u, g, y, m, b) {
          for (var i = 0; i < m; i++) u[b + i] = g[y + i];
        }, flattenChunks: function(u) {
          return [].concat.apply([], u);
        } };
        v.setTyped = function(u) {
          u ? (v.Buf8 = Uint8Array, v.Buf16 = Uint16Array, v.Buf32 = Int32Array, v.assign(v, l)) : (v.Buf8 = Array, v.Buf16 = Array, v.Buf32 = Array, v.assign(v, n));
        }, v.setTyped(o);
      }, {}], 42: [function(c, O, v) {
        var o = c("./common"), l = !0, n = !0;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch {
          l = !1;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch {
          n = !1;
        }
        for (var u = new o.Buf8(256), g = 0; g < 256; g++) u[g] = 252 <= g ? 6 : 248 <= g ? 5 : 240 <= g ? 4 : 224 <= g ? 3 : 192 <= g ? 2 : 1;
        function y(m, b) {
          if (b < 65537 && (m.subarray && n || !m.subarray && l)) return String.fromCharCode.apply(null, o.shrinkBuf(m, b));
          for (var i = "", d = 0; d < b; d++) i += String.fromCharCode(m[d]);
          return i;
        }
        u[254] = u[254] = 1, v.string2buf = function(m) {
          var b, i, d, r, h, a = m.length, p = 0;
          for (r = 0; r < a; r++) (64512 & (i = m.charCodeAt(r))) == 55296 && r + 1 < a && (64512 & (d = m.charCodeAt(r + 1))) == 56320 && (i = 65536 + (i - 55296 << 10) + (d - 56320), r++), p += i < 128 ? 1 : i < 2048 ? 2 : i < 65536 ? 3 : 4;
          for (b = new o.Buf8(p), r = h = 0; h < p; r++) (64512 & (i = m.charCodeAt(r))) == 55296 && r + 1 < a && (64512 & (d = m.charCodeAt(r + 1))) == 56320 && (i = 65536 + (i - 55296 << 10) + (d - 56320), r++), i < 128 ? b[h++] = i : (i < 2048 ? b[h++] = 192 | i >>> 6 : (i < 65536 ? b[h++] = 224 | i >>> 12 : (b[h++] = 240 | i >>> 18, b[h++] = 128 | i >>> 12 & 63), b[h++] = 128 | i >>> 6 & 63), b[h++] = 128 | 63 & i);
          return b;
        }, v.buf2binstring = function(m) {
          return y(m, m.length);
        }, v.binstring2buf = function(m) {
          for (var b = new o.Buf8(m.length), i = 0, d = b.length; i < d; i++) b[i] = m.charCodeAt(i);
          return b;
        }, v.buf2string = function(m, b) {
          var i, d, r, h, a = b || m.length, p = new Array(2 * a);
          for (i = d = 0; i < a; ) if ((r = m[i++]) < 128) p[d++] = r;
          else if (4 < (h = u[r])) p[d++] = 65533, i += h - 1;
          else {
            for (r &= h === 2 ? 31 : h === 3 ? 15 : 7; 1 < h && i < a; ) r = r << 6 | 63 & m[i++], h--;
            1 < h ? p[d++] = 65533 : r < 65536 ? p[d++] = r : (r -= 65536, p[d++] = 55296 | r >> 10 & 1023, p[d++] = 56320 | 1023 & r);
          }
          return y(p, d);
        }, v.utf8border = function(m, b) {
          var i;
          for ((b = b || m.length) > m.length && (b = m.length), i = b - 1; 0 <= i && (192 & m[i]) == 128; ) i--;
          return i < 0 || i === 0 ? b : i + u[m[i]] > b ? i : b;
        };
      }, { "./common": 41 }], 43: [function(c, O, v) {
        O.exports = function(o, l, n, u) {
          for (var g = 65535 & o | 0, y = o >>> 16 & 65535 | 0, m = 0; n !== 0; ) {
            for (n -= m = 2e3 < n ? 2e3 : n; y = y + (g = g + l[u++] | 0) | 0, --m; ) ;
            g %= 65521, y %= 65521;
          }
          return g | y << 16 | 0;
        };
      }, {}], 44: [function(c, O, v) {
        O.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(c, O, v) {
        var o = (function() {
          for (var l, n = [], u = 0; u < 256; u++) {
            l = u;
            for (var g = 0; g < 8; g++) l = 1 & l ? 3988292384 ^ l >>> 1 : l >>> 1;
            n[u] = l;
          }
          return n;
        })();
        O.exports = function(l, n, u, g) {
          var y = o, m = g + u;
          l ^= -1;
          for (var b = g; b < m; b++) l = l >>> 8 ^ y[255 & (l ^ n[b])];
          return -1 ^ l;
        };
      }, {}], 46: [function(c, O, v) {
        var o, l = c("../utils/common"), n = c("./trees"), u = c("./adler32"), g = c("./crc32"), y = c("./messages"), m = 0, b = 4, i = 0, d = -2, r = -1, h = 4, a = 2, p = 8, w = 9, S = 286, x = 30, F = 19, B = 2 * S + 1, j = 15, I = 3, W = 258, $ = W + I + 1, _ = 42, R = 113, e = 1, D = 2, Q = 3, P = 4;
        function tt(t, T) {
          return t.msg = y[T], T;
        }
        function L(t) {
          return (t << 1) - (4 < t ? 9 : 0);
        }
        function J(t) {
          for (var T = t.length; 0 <= --T; ) t[T] = 0;
        }
        function C(t) {
          var T = t.state, A = T.pending;
          A > t.avail_out && (A = t.avail_out), A !== 0 && (l.arraySet(t.output, T.pending_buf, T.pending_out, A, t.next_out), t.next_out += A, T.pending_out += A, t.total_out += A, t.avail_out -= A, T.pending -= A, T.pending === 0 && (T.pending_out = 0));
        }
        function E(t, T) {
          n._tr_flush_block(t, 0 <= t.block_start ? t.block_start : -1, t.strstart - t.block_start, T), t.block_start = t.strstart, C(t.strm);
        }
        function X(t, T) {
          t.pending_buf[t.pending++] = T;
        }
        function H(t, T) {
          t.pending_buf[t.pending++] = T >>> 8 & 255, t.pending_buf[t.pending++] = 255 & T;
        }
        function G(t, T) {
          var A, f, s = t.max_chain_length, k = t.strstart, U = t.prev_length, N = t.nice_match, z = t.strstart > t.w_size - $ ? t.strstart - (t.w_size - $) : 0, Z = t.window, K = t.w_mask, M = t.prev, q = t.strstart + W, it = Z[k + U - 1], rt = Z[k + U];
          t.prev_length >= t.good_match && (s >>= 2), N > t.lookahead && (N = t.lookahead);
          do
            if (Z[(A = T) + U] === rt && Z[A + U - 1] === it && Z[A] === Z[k] && Z[++A] === Z[k + 1]) {
              k += 2, A++;
              do
                ;
              while (Z[++k] === Z[++A] && Z[++k] === Z[++A] && Z[++k] === Z[++A] && Z[++k] === Z[++A] && Z[++k] === Z[++A] && Z[++k] === Z[++A] && Z[++k] === Z[++A] && Z[++k] === Z[++A] && k < q);
              if (f = W - (q - k), k = q - W, U < f) {
                if (t.match_start = T, N <= (U = f)) break;
                it = Z[k + U - 1], rt = Z[k + U];
              }
            }
          while ((T = M[T & K]) > z && --s != 0);
          return U <= t.lookahead ? U : t.lookahead;
        }
        function at(t) {
          var T, A, f, s, k, U, N, z, Z, K, M = t.w_size;
          do {
            if (s = t.window_size - t.lookahead - t.strstart, t.strstart >= M + (M - $)) {
              for (l.arraySet(t.window, t.window, M, M, 0), t.match_start -= M, t.strstart -= M, t.block_start -= M, T = A = t.hash_size; f = t.head[--T], t.head[T] = M <= f ? f - M : 0, --A; ) ;
              for (T = A = M; f = t.prev[--T], t.prev[T] = M <= f ? f - M : 0, --A; ) ;
              s += M;
            }
            if (t.strm.avail_in === 0) break;
            if (U = t.strm, N = t.window, z = t.strstart + t.lookahead, Z = s, K = void 0, K = U.avail_in, Z < K && (K = Z), A = K === 0 ? 0 : (U.avail_in -= K, l.arraySet(N, U.input, U.next_in, K, z), U.state.wrap === 1 ? U.adler = u(U.adler, N, K, z) : U.state.wrap === 2 && (U.adler = g(U.adler, N, K, z)), U.next_in += K, U.total_in += K, K), t.lookahead += A, t.lookahead + t.insert >= I) for (k = t.strstart - t.insert, t.ins_h = t.window[k], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[k + 1]) & t.hash_mask; t.insert && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[k + I - 1]) & t.hash_mask, t.prev[k & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = k, k++, t.insert--, !(t.lookahead + t.insert < I)); ) ;
          } while (t.lookahead < $ && t.strm.avail_in !== 0);
        }
        function ut(t, T) {
          for (var A, f; ; ) {
            if (t.lookahead < $) {
              if (at(t), t.lookahead < $ && T === m) return e;
              if (t.lookahead === 0) break;
            }
            if (A = 0, t.lookahead >= I && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), A !== 0 && t.strstart - A <= t.w_size - $ && (t.match_length = G(t, A)), t.match_length >= I) if (f = n._tr_tally(t, t.strstart - t.match_start, t.match_length - I), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= I) {
              for (t.match_length--; t.strstart++, t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart, --t.match_length != 0; ) ;
              t.strstart++;
            } else t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + 1]) & t.hash_mask;
            else f = n._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
            if (f && (E(t, !1), t.strm.avail_out === 0)) return e;
          }
          return t.insert = t.strstart < I - 1 ? t.strstart : I - 1, T === b ? (E(t, !0), t.strm.avail_out === 0 ? Q : P) : t.last_lit && (E(t, !1), t.strm.avail_out === 0) ? e : D;
        }
        function et(t, T) {
          for (var A, f, s; ; ) {
            if (t.lookahead < $) {
              if (at(t), t.lookahead < $ && T === m) return e;
              if (t.lookahead === 0) break;
            }
            if (A = 0, t.lookahead >= I && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = I - 1, A !== 0 && t.prev_length < t.max_lazy_match && t.strstart - A <= t.w_size - $ && (t.match_length = G(t, A), t.match_length <= 5 && (t.strategy === 1 || t.match_length === I && 4096 < t.strstart - t.match_start) && (t.match_length = I - 1)), t.prev_length >= I && t.match_length <= t.prev_length) {
              for (s = t.strstart + t.lookahead - I, f = n._tr_tally(t, t.strstart - 1 - t.prev_match, t.prev_length - I), t.lookahead -= t.prev_length - 1, t.prev_length -= 2; ++t.strstart <= s && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), --t.prev_length != 0; ) ;
              if (t.match_available = 0, t.match_length = I - 1, t.strstart++, f && (E(t, !1), t.strm.avail_out === 0)) return e;
            } else if (t.match_available) {
              if ((f = n._tr_tally(t, 0, t.window[t.strstart - 1])) && E(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0) return e;
            } else t.match_available = 1, t.strstart++, t.lookahead--;
          }
          return t.match_available && (f = n._tr_tally(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < I - 1 ? t.strstart : I - 1, T === b ? (E(t, !0), t.strm.avail_out === 0 ? Q : P) : t.last_lit && (E(t, !1), t.strm.avail_out === 0) ? e : D;
        }
        function nt(t, T, A, f, s) {
          this.good_length = t, this.max_lazy = T, this.nice_length = A, this.max_chain = f, this.func = s;
        }
        function lt() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = p, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new l.Buf16(2 * B), this.dyn_dtree = new l.Buf16(2 * (2 * x + 1)), this.bl_tree = new l.Buf16(2 * (2 * F + 1)), J(this.dyn_ltree), J(this.dyn_dtree), J(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new l.Buf16(j + 1), this.heap = new l.Buf16(2 * S + 1), J(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new l.Buf16(2 * S + 1), J(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function st(t) {
          var T;
          return t && t.state ? (t.total_in = t.total_out = 0, t.data_type = a, (T = t.state).pending = 0, T.pending_out = 0, T.wrap < 0 && (T.wrap = -T.wrap), T.status = T.wrap ? _ : R, t.adler = T.wrap === 2 ? 0 : 1, T.last_flush = m, n._tr_init(T), i) : tt(t, d);
        }
        function ct(t) {
          var T = st(t);
          return T === i && (function(A) {
            A.window_size = 2 * A.w_size, J(A.head), A.max_lazy_match = o[A.level].max_lazy, A.good_match = o[A.level].good_length, A.nice_match = o[A.level].nice_length, A.max_chain_length = o[A.level].max_chain, A.strstart = 0, A.block_start = 0, A.lookahead = 0, A.insert = 0, A.match_length = A.prev_length = I - 1, A.match_available = 0, A.ins_h = 0;
          })(t.state), T;
        }
        function ft(t, T, A, f, s, k) {
          if (!t) return d;
          var U = 1;
          if (T === r && (T = 6), f < 0 ? (U = 0, f = -f) : 15 < f && (U = 2, f -= 16), s < 1 || w < s || A !== p || f < 8 || 15 < f || T < 0 || 9 < T || k < 0 || h < k) return tt(t, d);
          f === 8 && (f = 9);
          var N = new lt();
          return (t.state = N).strm = t, N.wrap = U, N.gzhead = null, N.w_bits = f, N.w_size = 1 << N.w_bits, N.w_mask = N.w_size - 1, N.hash_bits = s + 7, N.hash_size = 1 << N.hash_bits, N.hash_mask = N.hash_size - 1, N.hash_shift = ~~((N.hash_bits + I - 1) / I), N.window = new l.Buf8(2 * N.w_size), N.head = new l.Buf16(N.hash_size), N.prev = new l.Buf16(N.w_size), N.lit_bufsize = 1 << s + 6, N.pending_buf_size = 4 * N.lit_bufsize, N.pending_buf = new l.Buf8(N.pending_buf_size), N.d_buf = 1 * N.lit_bufsize, N.l_buf = 3 * N.lit_bufsize, N.level = T, N.strategy = k, N.method = A, ct(t);
        }
        o = [new nt(0, 0, 0, 0, function(t, T) {
          var A = 65535;
          for (A > t.pending_buf_size - 5 && (A = t.pending_buf_size - 5); ; ) {
            if (t.lookahead <= 1) {
              if (at(t), t.lookahead === 0 && T === m) return e;
              if (t.lookahead === 0) break;
            }
            t.strstart += t.lookahead, t.lookahead = 0;
            var f = t.block_start + A;
            if ((t.strstart === 0 || t.strstart >= f) && (t.lookahead = t.strstart - f, t.strstart = f, E(t, !1), t.strm.avail_out === 0) || t.strstart - t.block_start >= t.w_size - $ && (E(t, !1), t.strm.avail_out === 0)) return e;
          }
          return t.insert = 0, T === b ? (E(t, !0), t.strm.avail_out === 0 ? Q : P) : (t.strstart > t.block_start && (E(t, !1), t.strm.avail_out), e);
        }), new nt(4, 4, 8, 4, ut), new nt(4, 5, 16, 8, ut), new nt(4, 6, 32, 32, ut), new nt(4, 4, 16, 16, et), new nt(8, 16, 32, 32, et), new nt(8, 16, 128, 128, et), new nt(8, 32, 128, 256, et), new nt(32, 128, 258, 1024, et), new nt(32, 258, 258, 4096, et)], v.deflateInit = function(t, T) {
          return ft(t, T, p, 15, 8, 0);
        }, v.deflateInit2 = ft, v.deflateReset = ct, v.deflateResetKeep = st, v.deflateSetHeader = function(t, T) {
          return t && t.state ? t.state.wrap !== 2 ? d : (t.state.gzhead = T, i) : d;
        }, v.deflate = function(t, T) {
          var A, f, s, k;
          if (!t || !t.state || 5 < T || T < 0) return t ? tt(t, d) : d;
          if (f = t.state, !t.output || !t.input && t.avail_in !== 0 || f.status === 666 && T !== b) return tt(t, t.avail_out === 0 ? -5 : d);
          if (f.strm = t, A = f.last_flush, f.last_flush = T, f.status === _) if (f.wrap === 2) t.adler = 0, X(f, 31), X(f, 139), X(f, 8), f.gzhead ? (X(f, (f.gzhead.text ? 1 : 0) + (f.gzhead.hcrc ? 2 : 0) + (f.gzhead.extra ? 4 : 0) + (f.gzhead.name ? 8 : 0) + (f.gzhead.comment ? 16 : 0)), X(f, 255 & f.gzhead.time), X(f, f.gzhead.time >> 8 & 255), X(f, f.gzhead.time >> 16 & 255), X(f, f.gzhead.time >> 24 & 255), X(f, f.level === 9 ? 2 : 2 <= f.strategy || f.level < 2 ? 4 : 0), X(f, 255 & f.gzhead.os), f.gzhead.extra && f.gzhead.extra.length && (X(f, 255 & f.gzhead.extra.length), X(f, f.gzhead.extra.length >> 8 & 255)), f.gzhead.hcrc && (t.adler = g(t.adler, f.pending_buf, f.pending, 0)), f.gzindex = 0, f.status = 69) : (X(f, 0), X(f, 0), X(f, 0), X(f, 0), X(f, 0), X(f, f.level === 9 ? 2 : 2 <= f.strategy || f.level < 2 ? 4 : 0), X(f, 3), f.status = R);
          else {
            var U = p + (f.w_bits - 8 << 4) << 8;
            U |= (2 <= f.strategy || f.level < 2 ? 0 : f.level < 6 ? 1 : f.level === 6 ? 2 : 3) << 6, f.strstart !== 0 && (U |= 32), U += 31 - U % 31, f.status = R, H(f, U), f.strstart !== 0 && (H(f, t.adler >>> 16), H(f, 65535 & t.adler)), t.adler = 1;
          }
          if (f.status === 69) if (f.gzhead.extra) {
            for (s = f.pending; f.gzindex < (65535 & f.gzhead.extra.length) && (f.pending !== f.pending_buf_size || (f.gzhead.hcrc && f.pending > s && (t.adler = g(t.adler, f.pending_buf, f.pending - s, s)), C(t), s = f.pending, f.pending !== f.pending_buf_size)); ) X(f, 255 & f.gzhead.extra[f.gzindex]), f.gzindex++;
            f.gzhead.hcrc && f.pending > s && (t.adler = g(t.adler, f.pending_buf, f.pending - s, s)), f.gzindex === f.gzhead.extra.length && (f.gzindex = 0, f.status = 73);
          } else f.status = 73;
          if (f.status === 73) if (f.gzhead.name) {
            s = f.pending;
            do {
              if (f.pending === f.pending_buf_size && (f.gzhead.hcrc && f.pending > s && (t.adler = g(t.adler, f.pending_buf, f.pending - s, s)), C(t), s = f.pending, f.pending === f.pending_buf_size)) {
                k = 1;
                break;
              }
              k = f.gzindex < f.gzhead.name.length ? 255 & f.gzhead.name.charCodeAt(f.gzindex++) : 0, X(f, k);
            } while (k !== 0);
            f.gzhead.hcrc && f.pending > s && (t.adler = g(t.adler, f.pending_buf, f.pending - s, s)), k === 0 && (f.gzindex = 0, f.status = 91);
          } else f.status = 91;
          if (f.status === 91) if (f.gzhead.comment) {
            s = f.pending;
            do {
              if (f.pending === f.pending_buf_size && (f.gzhead.hcrc && f.pending > s && (t.adler = g(t.adler, f.pending_buf, f.pending - s, s)), C(t), s = f.pending, f.pending === f.pending_buf_size)) {
                k = 1;
                break;
              }
              k = f.gzindex < f.gzhead.comment.length ? 255 & f.gzhead.comment.charCodeAt(f.gzindex++) : 0, X(f, k);
            } while (k !== 0);
            f.gzhead.hcrc && f.pending > s && (t.adler = g(t.adler, f.pending_buf, f.pending - s, s)), k === 0 && (f.status = 103);
          } else f.status = 103;
          if (f.status === 103 && (f.gzhead.hcrc ? (f.pending + 2 > f.pending_buf_size && C(t), f.pending + 2 <= f.pending_buf_size && (X(f, 255 & t.adler), X(f, t.adler >> 8 & 255), t.adler = 0, f.status = R)) : f.status = R), f.pending !== 0) {
            if (C(t), t.avail_out === 0) return f.last_flush = -1, i;
          } else if (t.avail_in === 0 && L(T) <= L(A) && T !== b) return tt(t, -5);
          if (f.status === 666 && t.avail_in !== 0) return tt(t, -5);
          if (t.avail_in !== 0 || f.lookahead !== 0 || T !== m && f.status !== 666) {
            var N = f.strategy === 2 ? (function(z, Z) {
              for (var K; ; ) {
                if (z.lookahead === 0 && (at(z), z.lookahead === 0)) {
                  if (Z === m) return e;
                  break;
                }
                if (z.match_length = 0, K = n._tr_tally(z, 0, z.window[z.strstart]), z.lookahead--, z.strstart++, K && (E(z, !1), z.strm.avail_out === 0)) return e;
              }
              return z.insert = 0, Z === b ? (E(z, !0), z.strm.avail_out === 0 ? Q : P) : z.last_lit && (E(z, !1), z.strm.avail_out === 0) ? e : D;
            })(f, T) : f.strategy === 3 ? (function(z, Z) {
              for (var K, M, q, it, rt = z.window; ; ) {
                if (z.lookahead <= W) {
                  if (at(z), z.lookahead <= W && Z === m) return e;
                  if (z.lookahead === 0) break;
                }
                if (z.match_length = 0, z.lookahead >= I && 0 < z.strstart && (M = rt[q = z.strstart - 1]) === rt[++q] && M === rt[++q] && M === rt[++q]) {
                  it = z.strstart + W;
                  do
                    ;
                  while (M === rt[++q] && M === rt[++q] && M === rt[++q] && M === rt[++q] && M === rt[++q] && M === rt[++q] && M === rt[++q] && M === rt[++q] && q < it);
                  z.match_length = W - (it - q), z.match_length > z.lookahead && (z.match_length = z.lookahead);
                }
                if (z.match_length >= I ? (K = n._tr_tally(z, 1, z.match_length - I), z.lookahead -= z.match_length, z.strstart += z.match_length, z.match_length = 0) : (K = n._tr_tally(z, 0, z.window[z.strstart]), z.lookahead--, z.strstart++), K && (E(z, !1), z.strm.avail_out === 0)) return e;
              }
              return z.insert = 0, Z === b ? (E(z, !0), z.strm.avail_out === 0 ? Q : P) : z.last_lit && (E(z, !1), z.strm.avail_out === 0) ? e : D;
            })(f, T) : o[f.level].func(f, T);
            if (N !== Q && N !== P || (f.status = 666), N === e || N === Q) return t.avail_out === 0 && (f.last_flush = -1), i;
            if (N === D && (T === 1 ? n._tr_align(f) : T !== 5 && (n._tr_stored_block(f, 0, 0, !1), T === 3 && (J(f.head), f.lookahead === 0 && (f.strstart = 0, f.block_start = 0, f.insert = 0))), C(t), t.avail_out === 0)) return f.last_flush = -1, i;
          }
          return T !== b ? i : f.wrap <= 0 ? 1 : (f.wrap === 2 ? (X(f, 255 & t.adler), X(f, t.adler >> 8 & 255), X(f, t.adler >> 16 & 255), X(f, t.adler >> 24 & 255), X(f, 255 & t.total_in), X(f, t.total_in >> 8 & 255), X(f, t.total_in >> 16 & 255), X(f, t.total_in >> 24 & 255)) : (H(f, t.adler >>> 16), H(f, 65535 & t.adler)), C(t), 0 < f.wrap && (f.wrap = -f.wrap), f.pending !== 0 ? i : 1);
        }, v.deflateEnd = function(t) {
          var T;
          return t && t.state ? (T = t.state.status) !== _ && T !== 69 && T !== 73 && T !== 91 && T !== 103 && T !== R && T !== 666 ? tt(t, d) : (t.state = null, T === R ? tt(t, -3) : i) : d;
        }, v.deflateSetDictionary = function(t, T) {
          var A, f, s, k, U, N, z, Z, K = T.length;
          if (!t || !t.state || (k = (A = t.state).wrap) === 2 || k === 1 && A.status !== _ || A.lookahead) return d;
          for (k === 1 && (t.adler = u(t.adler, T, K, 0)), A.wrap = 0, K >= A.w_size && (k === 0 && (J(A.head), A.strstart = 0, A.block_start = 0, A.insert = 0), Z = new l.Buf8(A.w_size), l.arraySet(Z, T, K - A.w_size, A.w_size, 0), T = Z, K = A.w_size), U = t.avail_in, N = t.next_in, z = t.input, t.avail_in = K, t.next_in = 0, t.input = T, at(A); A.lookahead >= I; ) {
            for (f = A.strstart, s = A.lookahead - (I - 1); A.ins_h = (A.ins_h << A.hash_shift ^ A.window[f + I - 1]) & A.hash_mask, A.prev[f & A.w_mask] = A.head[A.ins_h], A.head[A.ins_h] = f, f++, --s; ) ;
            A.strstart = f, A.lookahead = I - 1, at(A);
          }
          return A.strstart += A.lookahead, A.block_start = A.strstart, A.insert = A.lookahead, A.lookahead = 0, A.match_length = A.prev_length = I - 1, A.match_available = 0, t.next_in = N, t.input = z, t.avail_in = U, A.wrap = k, i;
        }, v.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(c, O, v) {
        O.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
        };
      }, {}], 48: [function(c, O, v) {
        O.exports = function(o, l) {
          var n, u, g, y, m, b, i, d, r, h, a, p, w, S, x, F, B, j, I, W, $, _, R, e, D;
          n = o.state, u = o.next_in, e = o.input, g = u + (o.avail_in - 5), y = o.next_out, D = o.output, m = y - (l - o.avail_out), b = y + (o.avail_out - 257), i = n.dmax, d = n.wsize, r = n.whave, h = n.wnext, a = n.window, p = n.hold, w = n.bits, S = n.lencode, x = n.distcode, F = (1 << n.lenbits) - 1, B = (1 << n.distbits) - 1;
          t: do {
            w < 15 && (p += e[u++] << w, w += 8, p += e[u++] << w, w += 8), j = S[p & F];
            e: for (; ; ) {
              if (p >>>= I = j >>> 24, w -= I, (I = j >>> 16 & 255) === 0) D[y++] = 65535 & j;
              else {
                if (!(16 & I)) {
                  if ((64 & I) == 0) {
                    j = S[(65535 & j) + (p & (1 << I) - 1)];
                    continue e;
                  }
                  if (32 & I) {
                    n.mode = 12;
                    break t;
                  }
                  o.msg = "invalid literal/length code", n.mode = 30;
                  break t;
                }
                W = 65535 & j, (I &= 15) && (w < I && (p += e[u++] << w, w += 8), W += p & (1 << I) - 1, p >>>= I, w -= I), w < 15 && (p += e[u++] << w, w += 8, p += e[u++] << w, w += 8), j = x[p & B];
                r: for (; ; ) {
                  if (p >>>= I = j >>> 24, w -= I, !(16 & (I = j >>> 16 & 255))) {
                    if ((64 & I) == 0) {
                      j = x[(65535 & j) + (p & (1 << I) - 1)];
                      continue r;
                    }
                    o.msg = "invalid distance code", n.mode = 30;
                    break t;
                  }
                  if ($ = 65535 & j, w < (I &= 15) && (p += e[u++] << w, (w += 8) < I && (p += e[u++] << w, w += 8)), i < ($ += p & (1 << I) - 1)) {
                    o.msg = "invalid distance too far back", n.mode = 30;
                    break t;
                  }
                  if (p >>>= I, w -= I, (I = y - m) < $) {
                    if (r < (I = $ - I) && n.sane) {
                      o.msg = "invalid distance too far back", n.mode = 30;
                      break t;
                    }
                    if (R = a, (_ = 0) === h) {
                      if (_ += d - I, I < W) {
                        for (W -= I; D[y++] = a[_++], --I; ) ;
                        _ = y - $, R = D;
                      }
                    } else if (h < I) {
                      if (_ += d + h - I, (I -= h) < W) {
                        for (W -= I; D[y++] = a[_++], --I; ) ;
                        if (_ = 0, h < W) {
                          for (W -= I = h; D[y++] = a[_++], --I; ) ;
                          _ = y - $, R = D;
                        }
                      }
                    } else if (_ += h - I, I < W) {
                      for (W -= I; D[y++] = a[_++], --I; ) ;
                      _ = y - $, R = D;
                    }
                    for (; 2 < W; ) D[y++] = R[_++], D[y++] = R[_++], D[y++] = R[_++], W -= 3;
                    W && (D[y++] = R[_++], 1 < W && (D[y++] = R[_++]));
                  } else {
                    for (_ = y - $; D[y++] = D[_++], D[y++] = D[_++], D[y++] = D[_++], 2 < (W -= 3); ) ;
                    W && (D[y++] = D[_++], 1 < W && (D[y++] = D[_++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (u < g && y < b);
          u -= W = w >> 3, p &= (1 << (w -= W << 3)) - 1, o.next_in = u, o.next_out = y, o.avail_in = u < g ? g - u + 5 : 5 - (u - g), o.avail_out = y < b ? b - y + 257 : 257 - (y - b), n.hold = p, n.bits = w;
        };
      }, {}], 49: [function(c, O, v) {
        var o = c("../utils/common"), l = c("./adler32"), n = c("./crc32"), u = c("./inffast"), g = c("./inftrees"), y = 1, m = 2, b = 0, i = -2, d = 1, r = 852, h = 592;
        function a(_) {
          return (_ >>> 24 & 255) + (_ >>> 8 & 65280) + ((65280 & _) << 8) + ((255 & _) << 24);
        }
        function p() {
          this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new o.Buf16(320), this.work = new o.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function w(_) {
          var R;
          return _ && _.state ? (R = _.state, _.total_in = _.total_out = R.total = 0, _.msg = "", R.wrap && (_.adler = 1 & R.wrap), R.mode = d, R.last = 0, R.havedict = 0, R.dmax = 32768, R.head = null, R.hold = 0, R.bits = 0, R.lencode = R.lendyn = new o.Buf32(r), R.distcode = R.distdyn = new o.Buf32(h), R.sane = 1, R.back = -1, b) : i;
        }
        function S(_) {
          var R;
          return _ && _.state ? ((R = _.state).wsize = 0, R.whave = 0, R.wnext = 0, w(_)) : i;
        }
        function x(_, R) {
          var e, D;
          return _ && _.state ? (D = _.state, R < 0 ? (e = 0, R = -R) : (e = 1 + (R >> 4), R < 48 && (R &= 15)), R && (R < 8 || 15 < R) ? i : (D.window !== null && D.wbits !== R && (D.window = null), D.wrap = e, D.wbits = R, S(_))) : i;
        }
        function F(_, R) {
          var e, D;
          return _ ? (D = new p(), (_.state = D).window = null, (e = x(_, R)) !== b && (_.state = null), e) : i;
        }
        var B, j, I = !0;
        function W(_) {
          if (I) {
            var R;
            for (B = new o.Buf32(512), j = new o.Buf32(32), R = 0; R < 144; ) _.lens[R++] = 8;
            for (; R < 256; ) _.lens[R++] = 9;
            for (; R < 280; ) _.lens[R++] = 7;
            for (; R < 288; ) _.lens[R++] = 8;
            for (g(y, _.lens, 0, 288, B, 0, _.work, { bits: 9 }), R = 0; R < 32; ) _.lens[R++] = 5;
            g(m, _.lens, 0, 32, j, 0, _.work, { bits: 5 }), I = !1;
          }
          _.lencode = B, _.lenbits = 9, _.distcode = j, _.distbits = 5;
        }
        function $(_, R, e, D) {
          var Q, P = _.state;
          return P.window === null && (P.wsize = 1 << P.wbits, P.wnext = 0, P.whave = 0, P.window = new o.Buf8(P.wsize)), D >= P.wsize ? (o.arraySet(P.window, R, e - P.wsize, P.wsize, 0), P.wnext = 0, P.whave = P.wsize) : (D < (Q = P.wsize - P.wnext) && (Q = D), o.arraySet(P.window, R, e - D, Q, P.wnext), (D -= Q) ? (o.arraySet(P.window, R, e - D, D, 0), P.wnext = D, P.whave = P.wsize) : (P.wnext += Q, P.wnext === P.wsize && (P.wnext = 0), P.whave < P.wsize && (P.whave += Q))), 0;
        }
        v.inflateReset = S, v.inflateReset2 = x, v.inflateResetKeep = w, v.inflateInit = function(_) {
          return F(_, 15);
        }, v.inflateInit2 = F, v.inflate = function(_, R) {
          var e, D, Q, P, tt, L, J, C, E, X, H, G, at, ut, et, nt, lt, st, ct, ft, t, T, A, f, s = 0, k = new o.Buf8(4), U = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!_ || !_.state || !_.output || !_.input && _.avail_in !== 0) return i;
          (e = _.state).mode === 12 && (e.mode = 13), tt = _.next_out, Q = _.output, J = _.avail_out, P = _.next_in, D = _.input, L = _.avail_in, C = e.hold, E = e.bits, X = L, H = J, T = b;
          t: for (; ; ) switch (e.mode) {
            case d:
              if (e.wrap === 0) {
                e.mode = 13;
                break;
              }
              for (; E < 16; ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              if (2 & e.wrap && C === 35615) {
                k[e.check = 0] = 255 & C, k[1] = C >>> 8 & 255, e.check = n(e.check, k, 2, 0), E = C = 0, e.mode = 2;
                break;
              }
              if (e.flags = 0, e.head && (e.head.done = !1), !(1 & e.wrap) || (((255 & C) << 8) + (C >> 8)) % 31) {
                _.msg = "incorrect header check", e.mode = 30;
                break;
              }
              if ((15 & C) != 8) {
                _.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (E -= 4, t = 8 + (15 & (C >>>= 4)), e.wbits === 0) e.wbits = t;
              else if (t > e.wbits) {
                _.msg = "invalid window size", e.mode = 30;
                break;
              }
              e.dmax = 1 << t, _.adler = e.check = 1, e.mode = 512 & C ? 10 : 12, E = C = 0;
              break;
            case 2:
              for (; E < 16; ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              if (e.flags = C, (255 & e.flags) != 8) {
                _.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (57344 & e.flags) {
                _.msg = "unknown header flags set", e.mode = 30;
                break;
              }
              e.head && (e.head.text = C >> 8 & 1), 512 & e.flags && (k[0] = 255 & C, k[1] = C >>> 8 & 255, e.check = n(e.check, k, 2, 0)), E = C = 0, e.mode = 3;
            case 3:
              for (; E < 32; ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              e.head && (e.head.time = C), 512 & e.flags && (k[0] = 255 & C, k[1] = C >>> 8 & 255, k[2] = C >>> 16 & 255, k[3] = C >>> 24 & 255, e.check = n(e.check, k, 4, 0)), E = C = 0, e.mode = 4;
            case 4:
              for (; E < 16; ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              e.head && (e.head.xflags = 255 & C, e.head.os = C >> 8), 512 & e.flags && (k[0] = 255 & C, k[1] = C >>> 8 & 255, e.check = n(e.check, k, 2, 0)), E = C = 0, e.mode = 5;
            case 5:
              if (1024 & e.flags) {
                for (; E < 16; ) {
                  if (L === 0) break t;
                  L--, C += D[P++] << E, E += 8;
                }
                e.length = C, e.head && (e.head.extra_len = C), 512 & e.flags && (k[0] = 255 & C, k[1] = C >>> 8 & 255, e.check = n(e.check, k, 2, 0)), E = C = 0;
              } else e.head && (e.head.extra = null);
              e.mode = 6;
            case 6:
              if (1024 & e.flags && (L < (G = e.length) && (G = L), G && (e.head && (t = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Array(e.head.extra_len)), o.arraySet(e.head.extra, D, P, G, t)), 512 & e.flags && (e.check = n(e.check, D, G, P)), L -= G, P += G, e.length -= G), e.length)) break t;
              e.length = 0, e.mode = 7;
            case 7:
              if (2048 & e.flags) {
                if (L === 0) break t;
                for (G = 0; t = D[P + G++], e.head && t && e.length < 65536 && (e.head.name += String.fromCharCode(t)), t && G < L; ) ;
                if (512 & e.flags && (e.check = n(e.check, D, G, P)), L -= G, P += G, t) break t;
              } else e.head && (e.head.name = null);
              e.length = 0, e.mode = 8;
            case 8:
              if (4096 & e.flags) {
                if (L === 0) break t;
                for (G = 0; t = D[P + G++], e.head && t && e.length < 65536 && (e.head.comment += String.fromCharCode(t)), t && G < L; ) ;
                if (512 & e.flags && (e.check = n(e.check, D, G, P)), L -= G, P += G, t) break t;
              } else e.head && (e.head.comment = null);
              e.mode = 9;
            case 9:
              if (512 & e.flags) {
                for (; E < 16; ) {
                  if (L === 0) break t;
                  L--, C += D[P++] << E, E += 8;
                }
                if (C !== (65535 & e.check)) {
                  _.msg = "header crc mismatch", e.mode = 30;
                  break;
                }
                E = C = 0;
              }
              e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), _.adler = e.check = 0, e.mode = 12;
              break;
            case 10:
              for (; E < 32; ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              _.adler = e.check = a(C), E = C = 0, e.mode = 11;
            case 11:
              if (e.havedict === 0) return _.next_out = tt, _.avail_out = J, _.next_in = P, _.avail_in = L, e.hold = C, e.bits = E, 2;
              _.adler = e.check = 1, e.mode = 12;
            case 12:
              if (R === 5 || R === 6) break t;
            case 13:
              if (e.last) {
                C >>>= 7 & E, E -= 7 & E, e.mode = 27;
                break;
              }
              for (; E < 3; ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              switch (e.last = 1 & C, E -= 1, 3 & (C >>>= 1)) {
                case 0:
                  e.mode = 14;
                  break;
                case 1:
                  if (W(e), e.mode = 20, R !== 6) break;
                  C >>>= 2, E -= 2;
                  break t;
                case 2:
                  e.mode = 17;
                  break;
                case 3:
                  _.msg = "invalid block type", e.mode = 30;
              }
              C >>>= 2, E -= 2;
              break;
            case 14:
              for (C >>>= 7 & E, E -= 7 & E; E < 32; ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              if ((65535 & C) != (C >>> 16 ^ 65535)) {
                _.msg = "invalid stored block lengths", e.mode = 30;
                break;
              }
              if (e.length = 65535 & C, E = C = 0, e.mode = 15, R === 6) break t;
            case 15:
              e.mode = 16;
            case 16:
              if (G = e.length) {
                if (L < G && (G = L), J < G && (G = J), G === 0) break t;
                o.arraySet(Q, D, P, G, tt), L -= G, P += G, J -= G, tt += G, e.length -= G;
                break;
              }
              e.mode = 12;
              break;
            case 17:
              for (; E < 14; ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              if (e.nlen = 257 + (31 & C), C >>>= 5, E -= 5, e.ndist = 1 + (31 & C), C >>>= 5, E -= 5, e.ncode = 4 + (15 & C), C >>>= 4, E -= 4, 286 < e.nlen || 30 < e.ndist) {
                _.msg = "too many length or distance symbols", e.mode = 30;
                break;
              }
              e.have = 0, e.mode = 18;
            case 18:
              for (; e.have < e.ncode; ) {
                for (; E < 3; ) {
                  if (L === 0) break t;
                  L--, C += D[P++] << E, E += 8;
                }
                e.lens[U[e.have++]] = 7 & C, C >>>= 3, E -= 3;
              }
              for (; e.have < 19; ) e.lens[U[e.have++]] = 0;
              if (e.lencode = e.lendyn, e.lenbits = 7, A = { bits: e.lenbits }, T = g(0, e.lens, 0, 19, e.lencode, 0, e.work, A), e.lenbits = A.bits, T) {
                _.msg = "invalid code lengths set", e.mode = 30;
                break;
              }
              e.have = 0, e.mode = 19;
            case 19:
              for (; e.have < e.nlen + e.ndist; ) {
                for (; nt = (s = e.lencode[C & (1 << e.lenbits) - 1]) >>> 16 & 255, lt = 65535 & s, !((et = s >>> 24) <= E); ) {
                  if (L === 0) break t;
                  L--, C += D[P++] << E, E += 8;
                }
                if (lt < 16) C >>>= et, E -= et, e.lens[e.have++] = lt;
                else {
                  if (lt === 16) {
                    for (f = et + 2; E < f; ) {
                      if (L === 0) break t;
                      L--, C += D[P++] << E, E += 8;
                    }
                    if (C >>>= et, E -= et, e.have === 0) {
                      _.msg = "invalid bit length repeat", e.mode = 30;
                      break;
                    }
                    t = e.lens[e.have - 1], G = 3 + (3 & C), C >>>= 2, E -= 2;
                  } else if (lt === 17) {
                    for (f = et + 3; E < f; ) {
                      if (L === 0) break t;
                      L--, C += D[P++] << E, E += 8;
                    }
                    E -= et, t = 0, G = 3 + (7 & (C >>>= et)), C >>>= 3, E -= 3;
                  } else {
                    for (f = et + 7; E < f; ) {
                      if (L === 0) break t;
                      L--, C += D[P++] << E, E += 8;
                    }
                    E -= et, t = 0, G = 11 + (127 & (C >>>= et)), C >>>= 7, E -= 7;
                  }
                  if (e.have + G > e.nlen + e.ndist) {
                    _.msg = "invalid bit length repeat", e.mode = 30;
                    break;
                  }
                  for (; G--; ) e.lens[e.have++] = t;
                }
              }
              if (e.mode === 30) break;
              if (e.lens[256] === 0) {
                _.msg = "invalid code -- missing end-of-block", e.mode = 30;
                break;
              }
              if (e.lenbits = 9, A = { bits: e.lenbits }, T = g(y, e.lens, 0, e.nlen, e.lencode, 0, e.work, A), e.lenbits = A.bits, T) {
                _.msg = "invalid literal/lengths set", e.mode = 30;
                break;
              }
              if (e.distbits = 6, e.distcode = e.distdyn, A = { bits: e.distbits }, T = g(m, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, A), e.distbits = A.bits, T) {
                _.msg = "invalid distances set", e.mode = 30;
                break;
              }
              if (e.mode = 20, R === 6) break t;
            case 20:
              e.mode = 21;
            case 21:
              if (6 <= L && 258 <= J) {
                _.next_out = tt, _.avail_out = J, _.next_in = P, _.avail_in = L, e.hold = C, e.bits = E, u(_, H), tt = _.next_out, Q = _.output, J = _.avail_out, P = _.next_in, D = _.input, L = _.avail_in, C = e.hold, E = e.bits, e.mode === 12 && (e.back = -1);
                break;
              }
              for (e.back = 0; nt = (s = e.lencode[C & (1 << e.lenbits) - 1]) >>> 16 & 255, lt = 65535 & s, !((et = s >>> 24) <= E); ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              if (nt && (240 & nt) == 0) {
                for (st = et, ct = nt, ft = lt; nt = (s = e.lencode[ft + ((C & (1 << st + ct) - 1) >> st)]) >>> 16 & 255, lt = 65535 & s, !(st + (et = s >>> 24) <= E); ) {
                  if (L === 0) break t;
                  L--, C += D[P++] << E, E += 8;
                }
                C >>>= st, E -= st, e.back += st;
              }
              if (C >>>= et, E -= et, e.back += et, e.length = lt, nt === 0) {
                e.mode = 26;
                break;
              }
              if (32 & nt) {
                e.back = -1, e.mode = 12;
                break;
              }
              if (64 & nt) {
                _.msg = "invalid literal/length code", e.mode = 30;
                break;
              }
              e.extra = 15 & nt, e.mode = 22;
            case 22:
              if (e.extra) {
                for (f = e.extra; E < f; ) {
                  if (L === 0) break t;
                  L--, C += D[P++] << E, E += 8;
                }
                e.length += C & (1 << e.extra) - 1, C >>>= e.extra, E -= e.extra, e.back += e.extra;
              }
              e.was = e.length, e.mode = 23;
            case 23:
              for (; nt = (s = e.distcode[C & (1 << e.distbits) - 1]) >>> 16 & 255, lt = 65535 & s, !((et = s >>> 24) <= E); ) {
                if (L === 0) break t;
                L--, C += D[P++] << E, E += 8;
              }
              if ((240 & nt) == 0) {
                for (st = et, ct = nt, ft = lt; nt = (s = e.distcode[ft + ((C & (1 << st + ct) - 1) >> st)]) >>> 16 & 255, lt = 65535 & s, !(st + (et = s >>> 24) <= E); ) {
                  if (L === 0) break t;
                  L--, C += D[P++] << E, E += 8;
                }
                C >>>= st, E -= st, e.back += st;
              }
              if (C >>>= et, E -= et, e.back += et, 64 & nt) {
                _.msg = "invalid distance code", e.mode = 30;
                break;
              }
              e.offset = lt, e.extra = 15 & nt, e.mode = 24;
            case 24:
              if (e.extra) {
                for (f = e.extra; E < f; ) {
                  if (L === 0) break t;
                  L--, C += D[P++] << E, E += 8;
                }
                e.offset += C & (1 << e.extra) - 1, C >>>= e.extra, E -= e.extra, e.back += e.extra;
              }
              if (e.offset > e.dmax) {
                _.msg = "invalid distance too far back", e.mode = 30;
                break;
              }
              e.mode = 25;
            case 25:
              if (J === 0) break t;
              if (G = H - J, e.offset > G) {
                if ((G = e.offset - G) > e.whave && e.sane) {
                  _.msg = "invalid distance too far back", e.mode = 30;
                  break;
                }
                at = G > e.wnext ? (G -= e.wnext, e.wsize - G) : e.wnext - G, G > e.length && (G = e.length), ut = e.window;
              } else ut = Q, at = tt - e.offset, G = e.length;
              for (J < G && (G = J), J -= G, e.length -= G; Q[tt++] = ut[at++], --G; ) ;
              e.length === 0 && (e.mode = 21);
              break;
            case 26:
              if (J === 0) break t;
              Q[tt++] = e.length, J--, e.mode = 21;
              break;
            case 27:
              if (e.wrap) {
                for (; E < 32; ) {
                  if (L === 0) break t;
                  L--, C |= D[P++] << E, E += 8;
                }
                if (H -= J, _.total_out += H, e.total += H, H && (_.adler = e.check = e.flags ? n(e.check, Q, H, tt - H) : l(e.check, Q, H, tt - H)), H = J, (e.flags ? C : a(C)) !== e.check) {
                  _.msg = "incorrect data check", e.mode = 30;
                  break;
                }
                E = C = 0;
              }
              e.mode = 28;
            case 28:
              if (e.wrap && e.flags) {
                for (; E < 32; ) {
                  if (L === 0) break t;
                  L--, C += D[P++] << E, E += 8;
                }
                if (C !== (4294967295 & e.total)) {
                  _.msg = "incorrect length check", e.mode = 30;
                  break;
                }
                E = C = 0;
              }
              e.mode = 29;
            case 29:
              T = 1;
              break t;
            case 30:
              T = -3;
              break t;
            case 31:
              return -4;
            case 32:
            default:
              return i;
          }
          return _.next_out = tt, _.avail_out = J, _.next_in = P, _.avail_in = L, e.hold = C, e.bits = E, (e.wsize || H !== _.avail_out && e.mode < 30 && (e.mode < 27 || R !== 4)) && $(_, _.output, _.next_out, H - _.avail_out) ? (e.mode = 31, -4) : (X -= _.avail_in, H -= _.avail_out, _.total_in += X, _.total_out += H, e.total += H, e.wrap && H && (_.adler = e.check = e.flags ? n(e.check, Q, H, _.next_out - H) : l(e.check, Q, H, _.next_out - H)), _.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === 12 ? 128 : 0) + (e.mode === 20 || e.mode === 15 ? 256 : 0), (X == 0 && H === 0 || R === 4) && T === b && (T = -5), T);
        }, v.inflateEnd = function(_) {
          if (!_ || !_.state) return i;
          var R = _.state;
          return R.window && (R.window = null), _.state = null, b;
        }, v.inflateGetHeader = function(_, R) {
          var e;
          return _ && _.state ? (2 & (e = _.state).wrap) == 0 ? i : ((e.head = R).done = !1, b) : i;
        }, v.inflateSetDictionary = function(_, R) {
          var e, D = R.length;
          return _ && _.state ? (e = _.state).wrap !== 0 && e.mode !== 11 ? i : e.mode === 11 && l(1, R, D, 0) !== e.check ? -3 : $(_, R, D, D) ? (e.mode = 31, -4) : (e.havedict = 1, b) : i;
        }, v.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(c, O, v) {
        var o = c("../utils/common"), l = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], n = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], u = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], g = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        O.exports = function(y, m, b, i, d, r, h, a) {
          var p, w, S, x, F, B, j, I, W, $ = a.bits, _ = 0, R = 0, e = 0, D = 0, Q = 0, P = 0, tt = 0, L = 0, J = 0, C = 0, E = null, X = 0, H = new o.Buf16(16), G = new o.Buf16(16), at = null, ut = 0;
          for (_ = 0; _ <= 15; _++) H[_] = 0;
          for (R = 0; R < i; R++) H[m[b + R]]++;
          for (Q = $, D = 15; 1 <= D && H[D] === 0; D--) ;
          if (D < Q && (Q = D), D === 0) return d[r++] = 20971520, d[r++] = 20971520, a.bits = 1, 0;
          for (e = 1; e < D && H[e] === 0; e++) ;
          for (Q < e && (Q = e), _ = L = 1; _ <= 15; _++) if (L <<= 1, (L -= H[_]) < 0) return -1;
          if (0 < L && (y === 0 || D !== 1)) return -1;
          for (G[1] = 0, _ = 1; _ < 15; _++) G[_ + 1] = G[_] + H[_];
          for (R = 0; R < i; R++) m[b + R] !== 0 && (h[G[m[b + R]]++] = R);
          if (B = y === 0 ? (E = at = h, 19) : y === 1 ? (E = l, X -= 257, at = n, ut -= 257, 256) : (E = u, at = g, -1), _ = e, F = r, tt = R = C = 0, S = -1, x = (J = 1 << (P = Q)) - 1, y === 1 && 852 < J || y === 2 && 592 < J) return 1;
          for (; ; ) {
            for (j = _ - tt, W = h[R] < B ? (I = 0, h[R]) : h[R] > B ? (I = at[ut + h[R]], E[X + h[R]]) : (I = 96, 0), p = 1 << _ - tt, e = w = 1 << P; d[F + (C >> tt) + (w -= p)] = j << 24 | I << 16 | W | 0, w !== 0; ) ;
            for (p = 1 << _ - 1; C & p; ) p >>= 1;
            if (p !== 0 ? (C &= p - 1, C += p) : C = 0, R++, --H[_] == 0) {
              if (_ === D) break;
              _ = m[b + h[R]];
            }
            if (Q < _ && (C & x) !== S) {
              for (tt === 0 && (tt = Q), F += e, L = 1 << (P = _ - tt); P + tt < D && !((L -= H[P + tt]) <= 0); ) P++, L <<= 1;
              if (J += 1 << P, y === 1 && 852 < J || y === 2 && 592 < J) return 1;
              d[S = C & x] = Q << 24 | P << 16 | F - r | 0;
            }
          }
          return C !== 0 && (d[F + C] = _ - tt << 24 | 64 << 16 | 0), a.bits = Q, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(c, O, v) {
        O.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(c, O, v) {
        var o = c("../utils/common"), l = 0, n = 1;
        function u(s) {
          for (var k = s.length; 0 <= --k; ) s[k] = 0;
        }
        var g = 0, y = 29, m = 256, b = m + 1 + y, i = 30, d = 19, r = 2 * b + 1, h = 15, a = 16, p = 7, w = 256, S = 16, x = 17, F = 18, B = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], j = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], I = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], W = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], $ = new Array(2 * (b + 2));
        u($);
        var _ = new Array(2 * i);
        u(_);
        var R = new Array(512);
        u(R);
        var e = new Array(256);
        u(e);
        var D = new Array(y);
        u(D);
        var Q, P, tt, L = new Array(i);
        function J(s, k, U, N, z) {
          this.static_tree = s, this.extra_bits = k, this.extra_base = U, this.elems = N, this.max_length = z, this.has_stree = s && s.length;
        }
        function C(s, k) {
          this.dyn_tree = s, this.max_code = 0, this.stat_desc = k;
        }
        function E(s) {
          return s < 256 ? R[s] : R[256 + (s >>> 7)];
        }
        function X(s, k) {
          s.pending_buf[s.pending++] = 255 & k, s.pending_buf[s.pending++] = k >>> 8 & 255;
        }
        function H(s, k, U) {
          s.bi_valid > a - U ? (s.bi_buf |= k << s.bi_valid & 65535, X(s, s.bi_buf), s.bi_buf = k >> a - s.bi_valid, s.bi_valid += U - a) : (s.bi_buf |= k << s.bi_valid & 65535, s.bi_valid += U);
        }
        function G(s, k, U) {
          H(s, U[2 * k], U[2 * k + 1]);
        }
        function at(s, k) {
          for (var U = 0; U |= 1 & s, s >>>= 1, U <<= 1, 0 < --k; ) ;
          return U >>> 1;
        }
        function ut(s, k, U) {
          var N, z, Z = new Array(h + 1), K = 0;
          for (N = 1; N <= h; N++) Z[N] = K = K + U[N - 1] << 1;
          for (z = 0; z <= k; z++) {
            var M = s[2 * z + 1];
            M !== 0 && (s[2 * z] = at(Z[M]++, M));
          }
        }
        function et(s) {
          var k;
          for (k = 0; k < b; k++) s.dyn_ltree[2 * k] = 0;
          for (k = 0; k < i; k++) s.dyn_dtree[2 * k] = 0;
          for (k = 0; k < d; k++) s.bl_tree[2 * k] = 0;
          s.dyn_ltree[2 * w] = 1, s.opt_len = s.static_len = 0, s.last_lit = s.matches = 0;
        }
        function nt(s) {
          8 < s.bi_valid ? X(s, s.bi_buf) : 0 < s.bi_valid && (s.pending_buf[s.pending++] = s.bi_buf), s.bi_buf = 0, s.bi_valid = 0;
        }
        function lt(s, k, U, N) {
          var z = 2 * k, Z = 2 * U;
          return s[z] < s[Z] || s[z] === s[Z] && N[k] <= N[U];
        }
        function st(s, k, U) {
          for (var N = s.heap[U], z = U << 1; z <= s.heap_len && (z < s.heap_len && lt(k, s.heap[z + 1], s.heap[z], s.depth) && z++, !lt(k, N, s.heap[z], s.depth)); ) s.heap[U] = s.heap[z], U = z, z <<= 1;
          s.heap[U] = N;
        }
        function ct(s, k, U) {
          var N, z, Z, K, M = 0;
          if (s.last_lit !== 0) for (; N = s.pending_buf[s.d_buf + 2 * M] << 8 | s.pending_buf[s.d_buf + 2 * M + 1], z = s.pending_buf[s.l_buf + M], M++, N === 0 ? G(s, z, k) : (G(s, (Z = e[z]) + m + 1, k), (K = B[Z]) !== 0 && H(s, z -= D[Z], K), G(s, Z = E(--N), U), (K = j[Z]) !== 0 && H(s, N -= L[Z], K)), M < s.last_lit; ) ;
          G(s, w, k);
        }
        function ft(s, k) {
          var U, N, z, Z = k.dyn_tree, K = k.stat_desc.static_tree, M = k.stat_desc.has_stree, q = k.stat_desc.elems, it = -1;
          for (s.heap_len = 0, s.heap_max = r, U = 0; U < q; U++) Z[2 * U] !== 0 ? (s.heap[++s.heap_len] = it = U, s.depth[U] = 0) : Z[2 * U + 1] = 0;
          for (; s.heap_len < 2; ) Z[2 * (z = s.heap[++s.heap_len] = it < 2 ? ++it : 0)] = 1, s.depth[z] = 0, s.opt_len--, M && (s.static_len -= K[2 * z + 1]);
          for (k.max_code = it, U = s.heap_len >> 1; 1 <= U; U--) st(s, Z, U);
          for (z = q; U = s.heap[1], s.heap[1] = s.heap[s.heap_len--], st(s, Z, 1), N = s.heap[1], s.heap[--s.heap_max] = U, s.heap[--s.heap_max] = N, Z[2 * z] = Z[2 * U] + Z[2 * N], s.depth[z] = (s.depth[U] >= s.depth[N] ? s.depth[U] : s.depth[N]) + 1, Z[2 * U + 1] = Z[2 * N + 1] = z, s.heap[1] = z++, st(s, Z, 1), 2 <= s.heap_len; ) ;
          s.heap[--s.heap_max] = s.heap[1], (function(rt, ht) {
            var mt, dt, _t, ot, bt, kt, pt = ht.dyn_tree, Et = ht.max_code, Bt = ht.stat_desc.static_tree, Rt = ht.stat_desc.has_stree, Tt = ht.stat_desc.extra_bits, Ct = ht.stat_desc.extra_base, gt = ht.stat_desc.max_length, vt = 0;
            for (ot = 0; ot <= h; ot++) rt.bl_count[ot] = 0;
            for (pt[2 * rt.heap[rt.heap_max] + 1] = 0, mt = rt.heap_max + 1; mt < r; mt++) gt < (ot = pt[2 * pt[2 * (dt = rt.heap[mt]) + 1] + 1] + 1) && (ot = gt, vt++), pt[2 * dt + 1] = ot, Et < dt || (rt.bl_count[ot]++, bt = 0, Ct <= dt && (bt = Tt[dt - Ct]), kt = pt[2 * dt], rt.opt_len += kt * (ot + bt), Rt && (rt.static_len += kt * (Bt[2 * dt + 1] + bt)));
            if (vt !== 0) {
              do {
                for (ot = gt - 1; rt.bl_count[ot] === 0; ) ot--;
                rt.bl_count[ot]--, rt.bl_count[ot + 1] += 2, rt.bl_count[gt]--, vt -= 2;
              } while (0 < vt);
              for (ot = gt; ot !== 0; ot--) for (dt = rt.bl_count[ot]; dt !== 0; ) Et < (_t = rt.heap[--mt]) || (pt[2 * _t + 1] !== ot && (rt.opt_len += (ot - pt[2 * _t + 1]) * pt[2 * _t], pt[2 * _t + 1] = ot), dt--);
            }
          })(s, k), ut(Z, it, s.bl_count);
        }
        function t(s, k, U) {
          var N, z, Z = -1, K = k[1], M = 0, q = 7, it = 4;
          for (K === 0 && (q = 138, it = 3), k[2 * (U + 1) + 1] = 65535, N = 0; N <= U; N++) z = K, K = k[2 * (N + 1) + 1], ++M < q && z === K || (M < it ? s.bl_tree[2 * z] += M : z !== 0 ? (z !== Z && s.bl_tree[2 * z]++, s.bl_tree[2 * S]++) : M <= 10 ? s.bl_tree[2 * x]++ : s.bl_tree[2 * F]++, Z = z, it = (M = 0) === K ? (q = 138, 3) : z === K ? (q = 6, 3) : (q = 7, 4));
        }
        function T(s, k, U) {
          var N, z, Z = -1, K = k[1], M = 0, q = 7, it = 4;
          for (K === 0 && (q = 138, it = 3), N = 0; N <= U; N++) if (z = K, K = k[2 * (N + 1) + 1], !(++M < q && z === K)) {
            if (M < it) for (; G(s, z, s.bl_tree), --M != 0; ) ;
            else z !== 0 ? (z !== Z && (G(s, z, s.bl_tree), M--), G(s, S, s.bl_tree), H(s, M - 3, 2)) : M <= 10 ? (G(s, x, s.bl_tree), H(s, M - 3, 3)) : (G(s, F, s.bl_tree), H(s, M - 11, 7));
            Z = z, it = (M = 0) === K ? (q = 138, 3) : z === K ? (q = 6, 3) : (q = 7, 4);
          }
        }
        u(L);
        var A = !1;
        function f(s, k, U, N) {
          H(s, (g << 1) + (N ? 1 : 0), 3), (function(z, Z, K, M) {
            nt(z), X(z, K), X(z, ~K), o.arraySet(z.pending_buf, z.window, Z, K, z.pending), z.pending += K;
          })(s, k, U);
        }
        v._tr_init = function(s) {
          A || ((function() {
            var k, U, N, z, Z, K = new Array(h + 1);
            for (z = N = 0; z < y - 1; z++) for (D[z] = N, k = 0; k < 1 << B[z]; k++) e[N++] = z;
            for (e[N - 1] = z, z = Z = 0; z < 16; z++) for (L[z] = Z, k = 0; k < 1 << j[z]; k++) R[Z++] = z;
            for (Z >>= 7; z < i; z++) for (L[z] = Z << 7, k = 0; k < 1 << j[z] - 7; k++) R[256 + Z++] = z;
            for (U = 0; U <= h; U++) K[U] = 0;
            for (k = 0; k <= 143; ) $[2 * k + 1] = 8, k++, K[8]++;
            for (; k <= 255; ) $[2 * k + 1] = 9, k++, K[9]++;
            for (; k <= 279; ) $[2 * k + 1] = 7, k++, K[7]++;
            for (; k <= 287; ) $[2 * k + 1] = 8, k++, K[8]++;
            for (ut($, b + 1, K), k = 0; k < i; k++) _[2 * k + 1] = 5, _[2 * k] = at(k, 5);
            Q = new J($, B, m + 1, b, h), P = new J(_, j, 0, i, h), tt = new J(new Array(0), I, 0, d, p);
          })(), A = !0), s.l_desc = new C(s.dyn_ltree, Q), s.d_desc = new C(s.dyn_dtree, P), s.bl_desc = new C(s.bl_tree, tt), s.bi_buf = 0, s.bi_valid = 0, et(s);
        }, v._tr_stored_block = f, v._tr_flush_block = function(s, k, U, N) {
          var z, Z, K = 0;
          0 < s.level ? (s.strm.data_type === 2 && (s.strm.data_type = (function(M) {
            var q, it = 4093624447;
            for (q = 0; q <= 31; q++, it >>>= 1) if (1 & it && M.dyn_ltree[2 * q] !== 0) return l;
            if (M.dyn_ltree[18] !== 0 || M.dyn_ltree[20] !== 0 || M.dyn_ltree[26] !== 0) return n;
            for (q = 32; q < m; q++) if (M.dyn_ltree[2 * q] !== 0) return n;
            return l;
          })(s)), ft(s, s.l_desc), ft(s, s.d_desc), K = (function(M) {
            var q;
            for (t(M, M.dyn_ltree, M.l_desc.max_code), t(M, M.dyn_dtree, M.d_desc.max_code), ft(M, M.bl_desc), q = d - 1; 3 <= q && M.bl_tree[2 * W[q] + 1] === 0; q--) ;
            return M.opt_len += 3 * (q + 1) + 5 + 5 + 4, q;
          })(s), z = s.opt_len + 3 + 7 >>> 3, (Z = s.static_len + 3 + 7 >>> 3) <= z && (z = Z)) : z = Z = U + 5, U + 4 <= z && k !== -1 ? f(s, k, U, N) : s.strategy === 4 || Z === z ? (H(s, 2 + (N ? 1 : 0), 3), ct(s, $, _)) : (H(s, 4 + (N ? 1 : 0), 3), (function(M, q, it, rt) {
            var ht;
            for (H(M, q - 257, 5), H(M, it - 1, 5), H(M, rt - 4, 4), ht = 0; ht < rt; ht++) H(M, M.bl_tree[2 * W[ht] + 1], 3);
            T(M, M.dyn_ltree, q - 1), T(M, M.dyn_dtree, it - 1);
          })(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, K + 1), ct(s, s.dyn_ltree, s.dyn_dtree)), et(s), N && nt(s);
        }, v._tr_tally = function(s, k, U) {
          return s.pending_buf[s.d_buf + 2 * s.last_lit] = k >>> 8 & 255, s.pending_buf[s.d_buf + 2 * s.last_lit + 1] = 255 & k, s.pending_buf[s.l_buf + s.last_lit] = 255 & U, s.last_lit++, k === 0 ? s.dyn_ltree[2 * U]++ : (s.matches++, k--, s.dyn_ltree[2 * (e[U] + m + 1)]++, s.dyn_dtree[2 * E(k)]++), s.last_lit === s.lit_bufsize - 1;
        }, v._tr_align = function(s) {
          H(s, 2, 3), G(s, w, $), (function(k) {
            k.bi_valid === 16 ? (X(k, k.bi_buf), k.bi_buf = 0, k.bi_valid = 0) : 8 <= k.bi_valid && (k.pending_buf[k.pending++] = 255 & k.bi_buf, k.bi_buf >>= 8, k.bi_valid -= 8);
          })(s);
        };
      }, { "../utils/common": 41 }], 53: [function(c, O, v) {
        O.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(c, O, v) {
        (function(o) {
          (function(l, n) {
            if (!l.setImmediate) {
              var u, g, y, m, b = 1, i = {}, d = !1, r = l.document, h = Object.getPrototypeOf && Object.getPrototypeOf(l);
              h = h && h.setTimeout ? h : l, u = {}.toString.call(l.process) === "[object process]" ? function(S) {
                process.nextTick(function() {
                  p(S);
                });
              } : (function() {
                if (l.postMessage && !l.importScripts) {
                  var S = !0, x = l.onmessage;
                  return l.onmessage = function() {
                    S = !1;
                  }, l.postMessage("", "*"), l.onmessage = x, S;
                }
              })() ? (m = "setImmediate$" + Math.random() + "$", l.addEventListener ? l.addEventListener("message", w, !1) : l.attachEvent("onmessage", w), function(S) {
                l.postMessage(m + S, "*");
              }) : l.MessageChannel ? ((y = new MessageChannel()).port1.onmessage = function(S) {
                p(S.data);
              }, function(S) {
                y.port2.postMessage(S);
              }) : r && "onreadystatechange" in r.createElement("script") ? (g = r.documentElement, function(S) {
                var x = r.createElement("script");
                x.onreadystatechange = function() {
                  p(S), x.onreadystatechange = null, g.removeChild(x), x = null;
                }, g.appendChild(x);
              }) : function(S) {
                setTimeout(p, 0, S);
              }, h.setImmediate = function(S) {
                typeof S != "function" && (S = new Function("" + S));
                for (var x = new Array(arguments.length - 1), F = 0; F < x.length; F++) x[F] = arguments[F + 1];
                var B = { callback: S, args: x };
                return i[b] = B, u(b), b++;
              }, h.clearImmediate = a;
            }
            function a(S) {
              delete i[S];
            }
            function p(S) {
              if (d) setTimeout(p, 0, S);
              else {
                var x = i[S];
                if (x) {
                  d = !0;
                  try {
                    (function(F) {
                      var B = F.callback, j = F.args;
                      switch (j.length) {
                        case 0:
                          B();
                          break;
                        case 1:
                          B(j[0]);
                          break;
                        case 2:
                          B(j[0], j[1]);
                          break;
                        case 3:
                          B(j[0], j[1], j[2]);
                          break;
                        default:
                          B.apply(n, j);
                      }
                    })(x);
                  } finally {
                    a(S), d = !1;
                  }
                }
              }
            }
            function w(S) {
              S.source === l && typeof S.data == "string" && S.data.indexOf(m) === 0 && p(+S.data.slice(m.length));
            }
          })(typeof self > "u" ? o === void 0 ? this : o : self);
        }).call(this, typeof wt < "u" ? wt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}] }, {}, [10])(10);
    });
  })(xt)), xt.exports;
}
var Ut = Ft();
const Nt = /* @__PURE__ */ Dt(Ut), Pt = /^(?:\d+|historical-\d+)$/;
function jt(Y) {
  const V = Y.match(/^\/play-game\/([^/]+)\/(.+)$/);
  if (!V || !Pt.test(V[1])) return null;
  let c = V[2];
  try {
    c = decodeURIComponent(c);
  } catch {
  }
  return { key: V[1], filePath: c };
}
const Lt = {
  html: "text/html",
  htm: "text/html",
  js: "text/javascript",
  mjs: "text/javascript",
  css: "text/css",
  json: "application/json",
  wasm: "application/wasm",
  data: "application/octet-stream",
  pck: "application/octet-stream",
  apk: "application/octet-stream",
  txt: "text/plain",
  xml: "application/xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf"
}, Zt = /* @__PURE__ */ new Set(["gz", "br", "unityweb"]);
function Wt(Y) {
  const c = (Y.split("/").pop() ?? "").toLowerCase().split(".");
  if (c.length < 2) return "application/octet-stream";
  let O = c.pop();
  return Zt.has(O) && c.length >= 2 && (O = c.pop()), Lt[O] ?? "application/octet-stream";
}
function Mt(Y) {
  return Y.includes("Build/") && Y.endsWith(".gz");
}
const It = "arkad-game-", St = /* @__PURE__ */ new Map();
self.addEventListener("activate", (Y) => {
  Y.waitUntil(self.clients.claim());
});
self.addEventListener("push", (Y) => {
  let V = { title: "ARKAD", body: "", url: "/" };
  if (Y.data)
    try {
      V = { ...V, ...Y.data.json() };
    } catch {
      V.body = Y.data.text();
    }
  const c = typeof V.url == "string" && V.url.startsWith("/") ? V.url : "/";
  Y.waitUntil(self.registration.showNotification(V.title || "ARKAD", {
    body: V.body || "",
    data: { url: c },
    icon: "/arkadLight.svg",
    badge: "/arkadDark.svg"
  }));
});
self.addEventListener("notificationclick", (Y) => {
  var O;
  Y.notification.close();
  const V = (O = Y.notification.data) == null ? void 0 : O.url, c = typeof V == "string" && V.startsWith("/") ? V : "/";
  Y.waitUntil((async () => {
    const o = (await self.clients.matchAll({ type: "window", includeUncontrolled: !0 })).find((l) => new URL(l.url).pathname === c);
    return o ? (await o.focus(), o.navigate(c)) : self.clients.openWindow(c);
  })());
});
self.addEventListener("pushsubscriptionchange", (Y) => {
  Y.waitUntil((async () => {
    const V = await self.clients.matchAll({ type: "window", includeUncontrolled: !0 });
    V[0] && V[0].postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" });
  })());
});
self.addEventListener("message", (Y) => {
  var V, c;
  if (((V = Y.data) == null ? void 0 : V.type) === "CLAIM") {
    Y.waitUntil(self.clients.claim());
    return;
  }
  if (((c = Y.data) == null ? void 0 : c.type) === "LOAD_ZIP") {
    const { zipBuffer: O, gameId: v, entry: o } = Y.data;
    Y.waitUntil(Gt(O, v, o ?? "", Y.source));
  }
});
async function Gt(Y, V, c, O) {
  let v;
  try {
    const o = await Nt.loadAsync(Y);
    if (v = /* @__PURE__ */ new Map(), await Promise.all(
      Object.entries(o.files).map(async ([l, n]) => {
        n.dir || v.set(l, await n.async("arraybuffer"));
      })
    ), v.size === 0) throw new Error("El archivo del juego está vacío.");
    if (c && !v.has(c))
      throw new Error(`El archivo del juego no tiene ${c}, que es el que lo abre.`);
  } catch (o) {
    console.warn(`No se pudo abrir el zip del juego ${V}:`, o);
    const l = o instanceof Error && o.message.startsWith("El archivo del juego") ? o.message : "No se pudo abrir el archivo del juego: el .zip está dañado o no es un zip.";
    O == null || O.postMessage({ type: "ZIP_ERROR", gameId: V, message: l });
    return;
  }
  St.clear(), St.set(V, v), O == null || O.postMessage({ type: "ZIP_READY", gameId: V });
  try {
    await Ht(V, v);
  } catch (o) {
    console.warn(`No se pudo guardar el juego ${V} en caché:`, o);
  }
}
const zt = (Y) => `${It}${Y}`, Ot = (Y, V) => `/play-game/${Y}/${encodeURIComponent(V)}`;
async function Ht(Y, V) {
  await caches.delete(zt(Y));
  const c = await caches.open(zt(Y));
  await Promise.all([...V].map(([v, o]) => c.put(Ot(Y, v), new Response(o))));
  const O = (await caches.keys()).filter((v) => v.startsWith(It));
  await Promise.all(O.slice(0, -2).map((v) => caches.delete(v)));
}
async function Kt(Y, V) {
  var o;
  const c = (o = St.get(Y)) == null ? void 0 : o.get(V);
  if (c) return c;
  const v = await (await caches.open(zt(Y))).match(Ot(Y, V));
  return v ? v.arrayBuffer() : null;
}
self.addEventListener("fetch", (Y) => {
  const V = new URL(Y.request.url);
  if (Y.request.method !== "GET" || V.origin !== self.location.origin) return;
  const c = jt(V.pathname);
  c && Y.respondWith(
    Yt(c.key, c.filePath).catch((O) => (console.error("No se pudo servir el archivo del juego:", O), new Response("Error del service worker", { status: 500 })))
  );
});
async function Yt(Y, V) {
  const c = await Kt(Y, V);
  if (!c) return new Response("Archivo no encontrado en el juego", { status: 404 });
  let O = c;
  if (Mt(V))
    try {
      O = await qt(c);
    } catch (v) {
      console.warn(`No se pudo descomprimir ${V}:`, v);
    }
  return new Response(new Uint8Array(O), {
    headers: {
      "Content-Type": Wt(V),
      "Content-Length": O.byteLength.toString(),
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin"
    }
  });
}
async function qt(Y) {
  const V = new Blob([Y]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(V).arrayBuffer();
}
