var yt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Bt(nt) {
  return nt && nt.__esModule && Object.prototype.hasOwnProperty.call(nt, "default") ? nt.default : nt;
}
function wt(nt) {
  throw new Error('Could not dynamically require "' + nt + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
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
var Et;
function Rt() {
  return Et || (Et = 1, (function(nt, ft) {
    (function(g) {
      nt.exports = g();
    })(function() {
      return (function g(D, v, u) {
        function o(p, y) {
          if (!v[p]) {
            if (!D[p]) {
              var m = typeof wt == "function" && wt;
              if (!y && m) return m(p, !0);
              if (r) return r(p, !0);
              var b = new Error("Cannot find module '" + p + "'");
              throw b.code = "MODULE_NOT_FOUND", b;
            }
            var i = v[p] = { exports: {} };
            D[p][0].call(i.exports, function(c) {
              var n = D[p][1][c];
              return o(n || c);
            }, i, i.exports, g, D, v, u);
          }
          return v[p].exports;
        }
        for (var r = typeof wt == "function" && wt, l = 0; l < u.length; l++) o(u[l]);
        return o;
      })({ 1: [function(g, D, v) {
        var u = g("./utils"), o = g("./support"), r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        v.encode = function(l) {
          for (var p, y, m, b, i, c, n, h = [], a = 0, d = l.length, w = d, S = u.getTypeOf(l) !== "string"; a < l.length; ) w = d - a, m = S ? (p = l[a++], y = a < d ? l[a++] : 0, a < d ? l[a++] : 0) : (p = l.charCodeAt(a++), y = a < d ? l.charCodeAt(a++) : 0, a < d ? l.charCodeAt(a++) : 0), b = p >> 2, i = (3 & p) << 4 | y >> 4, c = 1 < w ? (15 & y) << 2 | m >> 6 : 64, n = 2 < w ? 63 & m : 64, h.push(r.charAt(b) + r.charAt(i) + r.charAt(c) + r.charAt(n));
          return h.join("");
        }, v.decode = function(l) {
          var p, y, m, b, i, c, n = 0, h = 0, a = "data:";
          if (l.substr(0, a.length) === a) throw new Error("Invalid base64 input, it looks like a data url.");
          var d, w = 3 * (l = l.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (l.charAt(l.length - 1) === r.charAt(64) && w--, l.charAt(l.length - 2) === r.charAt(64) && w--, w % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (d = o.uint8array ? new Uint8Array(0 | w) : new Array(0 | w); n < l.length; ) p = r.indexOf(l.charAt(n++)) << 2 | (b = r.indexOf(l.charAt(n++))) >> 4, y = (15 & b) << 4 | (i = r.indexOf(l.charAt(n++))) >> 2, m = (3 & i) << 6 | (c = r.indexOf(l.charAt(n++))), d[h++] = p, i !== 64 && (d[h++] = y), c !== 64 && (d[h++] = m);
          return d;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(g, D, v) {
        var u = g("./external"), o = g("./stream/DataWorker"), r = g("./stream/Crc32Probe"), l = g("./stream/DataLengthProbe");
        function p(y, m, b, i, c) {
          this.compressedSize = y, this.uncompressedSize = m, this.crc32 = b, this.compression = i, this.compressedContent = c;
        }
        p.prototype = { getContentWorker: function() {
          var y = new o(u.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new l("data_length")), m = this;
          return y.on("end", function() {
            if (this.streamInfo.data_length !== m.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), y;
        }, getCompressedWorker: function() {
          return new o(u.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, p.createWorkerFrom = function(y, m, b) {
          return y.pipe(new r()).pipe(new l("uncompressedSize")).pipe(m.compressWorker(b)).pipe(new l("compressedSize")).withStreamInfo("compression", m);
        }, D.exports = p;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(g, D, v) {
        var u = g("./stream/GenericWorker");
        v.STORE = { magic: "\0\0", compressWorker: function() {
          return new u("STORE compression");
        }, uncompressWorker: function() {
          return new u("STORE decompression");
        } }, v.DEFLATE = g("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(g, D, v) {
        var u = g("./utils"), o = (function() {
          for (var r, l = [], p = 0; p < 256; p++) {
            r = p;
            for (var y = 0; y < 8; y++) r = 1 & r ? 3988292384 ^ r >>> 1 : r >>> 1;
            l[p] = r;
          }
          return l;
        })();
        D.exports = function(r, l) {
          return r !== void 0 && r.length ? u.getTypeOf(r) !== "string" ? (function(p, y, m, b) {
            var i = o, c = b + m;
            p ^= -1;
            for (var n = b; n < c; n++) p = p >>> 8 ^ i[255 & (p ^ y[n])];
            return -1 ^ p;
          })(0 | l, r, r.length, 0) : (function(p, y, m, b) {
            var i = o, c = b + m;
            p ^= -1;
            for (var n = b; n < c; n++) p = p >>> 8 ^ i[255 & (p ^ y.charCodeAt(n))];
            return -1 ^ p;
          })(0 | l, r, r.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(g, D, v) {
        v.base64 = !1, v.binary = !1, v.dir = !1, v.createFolders = !0, v.date = null, v.compression = null, v.compressionOptions = null, v.comment = null, v.unixPermissions = null, v.dosPermissions = null;
      }, {}], 6: [function(g, D, v) {
        var u = null;
        u = typeof Promise < "u" ? Promise : g("lie"), D.exports = { Promise: u };
      }, { lie: 37 }], 7: [function(g, D, v) {
        var u = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Uint32Array < "u", o = g("pako"), r = g("./utils"), l = g("./stream/GenericWorker"), p = u ? "uint8array" : "array";
        function y(m, b) {
          l.call(this, "FlateWorker/" + m), this._pako = null, this._pakoAction = m, this._pakoOptions = b, this.meta = {};
        }
        v.magic = "\b\0", r.inherits(y, l), y.prototype.processChunk = function(m) {
          this.meta = m.meta, this._pako === null && this._createPako(), this._pako.push(r.transformTo(p, m.data), !1);
        }, y.prototype.flush = function() {
          l.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
        }, y.prototype.cleanUp = function() {
          l.prototype.cleanUp.call(this), this._pako = null;
        }, y.prototype._createPako = function() {
          this._pako = new o[this._pakoAction]({ raw: !0, level: this._pakoOptions.level || -1 });
          var m = this;
          this._pako.onData = function(b) {
            m.push({ data: b, meta: m.meta });
          };
        }, v.compressWorker = function(m) {
          return new y("Deflate", m);
        }, v.uncompressWorker = function() {
          return new y("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(g, D, v) {
        function u(i, c) {
          var n, h = "";
          for (n = 0; n < c; n++) h += String.fromCharCode(255 & i), i >>>= 8;
          return h;
        }
        function o(i, c, n, h, a, d) {
          var w, S, x = i.file, F = i.compression, O = d !== p.utf8encode, L = r.transformTo("string", d(x.name)), I = r.transformTo("string", p.utf8encode(x.name)), Z = x.comment, q = r.transformTo("string", d(Z)), _ = r.transformTo("string", p.utf8encode(Z)), B = I.length !== x.name.length, e = _.length !== Z.length, T = "", J = "", U = "", $ = x.dir, j = x.date, V = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          c && !n || (V.crc32 = i.crc32, V.compressedSize = i.compressedSize, V.uncompressedSize = i.uncompressedSize);
          var E = 0;
          c && (E |= 8), O || !B && !e || (E |= 2048);
          var C = 0, X = 0;
          $ && (C |= 16), a === "UNIX" ? (X = 798, C |= (function(H, it) {
            var lt = H;
            return H || (lt = it ? 16893 : 33204), (65535 & lt) << 16;
          })(x.unixPermissions, $)) : (X = 20, C |= (function(H) {
            return 63 & (H || 0);
          })(x.dosPermissions)), w = j.getUTCHours(), w <<= 6, w |= j.getUTCMinutes(), w <<= 5, w |= j.getUTCSeconds() / 2, S = j.getUTCFullYear() - 1980, S <<= 4, S |= j.getUTCMonth() + 1, S <<= 5, S |= j.getUTCDate(), B && (J = u(1, 1) + u(y(L), 4) + I, T += "up" + u(J.length, 2) + J), e && (U = u(1, 1) + u(y(q), 4) + _, T += "uc" + u(U.length, 2) + U);
          var G = "";
          return G += `
\0`, G += u(E, 2), G += F.magic, G += u(w, 2), G += u(S, 2), G += u(V.crc32, 4), G += u(V.compressedSize, 4), G += u(V.uncompressedSize, 4), G += u(L.length, 2), G += u(T.length, 2), { fileRecord: m.LOCAL_FILE_HEADER + G + L + T, dirRecord: m.CENTRAL_FILE_HEADER + u(X, 2) + G + u(q.length, 2) + "\0\0\0\0" + u(C, 4) + u(h, 4) + L + T + q };
        }
        var r = g("../utils"), l = g("../stream/GenericWorker"), p = g("../utf8"), y = g("../crc32"), m = g("../signature");
        function b(i, c, n, h) {
          l.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = c, this.zipPlatform = n, this.encodeFileName = h, this.streamFiles = i, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        r.inherits(b, l), b.prototype.push = function(i) {
          var c = i.meta.percent || 0, n = this.entriesCount, h = this._sources.length;
          this.accumulate ? this.contentBuffer.push(i) : (this.bytesWritten += i.data.length, l.prototype.push.call(this, { data: i.data, meta: { currentFile: this.currentFile, percent: n ? (c + 100 * (n - h - 1)) / n : 100 } }));
        }, b.prototype.openedSource = function(i) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = i.file.name;
          var c = this.streamFiles && !i.file.dir;
          if (c) {
            var n = o(i, c, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: n.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = !0;
        }, b.prototype.closedSource = function(i) {
          this.accumulate = !1;
          var c = this.streamFiles && !i.file.dir, n = o(i, c, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(n.dirRecord), c) this.push({ data: (function(h) {
            return m.DATA_DESCRIPTOR + u(h.crc32, 4) + u(h.compressedSize, 4) + u(h.uncompressedSize, 4);
          })(i), meta: { percent: 100 } });
          else for (this.push({ data: n.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, b.prototype.flush = function() {
          for (var i = this.bytesWritten, c = 0; c < this.dirRecords.length; c++) this.push({ data: this.dirRecords[c], meta: { percent: 100 } });
          var n = this.bytesWritten - i, h = (function(a, d, w, S, x) {
            var F = r.transformTo("string", x(S));
            return m.CENTRAL_DIRECTORY_END + "\0\0\0\0" + u(a, 2) + u(a, 2) + u(d, 4) + u(w, 4) + u(F.length, 2) + F;
          })(this.dirRecords.length, n, i, this.zipComment, this.encodeFileName);
          this.push({ data: h, meta: { percent: 100 } });
        }, b.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, b.prototype.registerPrevious = function(i) {
          this._sources.push(i);
          var c = this;
          return i.on("data", function(n) {
            c.processChunk(n);
          }), i.on("end", function() {
            c.closedSource(c.previous.streamInfo), c._sources.length ? c.prepareNextSource() : c.end();
          }), i.on("error", function(n) {
            c.error(n);
          }), this;
        }, b.prototype.resume = function() {
          return !!l.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0));
        }, b.prototype.error = function(i) {
          var c = this._sources;
          if (!l.prototype.error.call(this, i)) return !1;
          for (var n = 0; n < c.length; n++) try {
            c[n].error(i);
          } catch {
          }
          return !0;
        }, b.prototype.lock = function() {
          l.prototype.lock.call(this);
          for (var i = this._sources, c = 0; c < i.length; c++) i[c].lock();
        }, D.exports = b;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(g, D, v) {
        var u = g("../compressions"), o = g("./ZipFileWorker");
        v.generateWorker = function(r, l, p) {
          var y = new o(l.streamFiles, p, l.platform, l.encodeFileName), m = 0;
          try {
            r.forEach(function(b, i) {
              m++;
              var c = (function(d, w) {
                var S = d || w, x = u[S];
                if (!x) throw new Error(S + " is not a valid compression method !");
                return x;
              })(i.options.compression, l.compression), n = i.options.compressionOptions || l.compressionOptions || {}, h = i.dir, a = i.date;
              i._compressWorker(c, n).withStreamInfo("file", { name: b, dir: h, date: a, comment: i.comment || "", unixPermissions: i.unixPermissions, dosPermissions: i.dosPermissions }).pipe(y);
            }), y.entriesCount = m;
          } catch (b) {
            y.error(b);
          }
          return y;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(g, D, v) {
        function u() {
          if (!(this instanceof u)) return new u();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var o = new u();
            for (var r in this) typeof this[r] != "function" && (o[r] = this[r]);
            return o;
          };
        }
        (u.prototype = g("./object")).loadAsync = g("./load"), u.support = g("./support"), u.defaults = g("./defaults"), u.version = "3.10.1", u.loadAsync = function(o, r) {
          return new u().loadAsync(o, r);
        }, u.external = g("./external"), D.exports = u;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(g, D, v) {
        var u = g("./utils"), o = g("./external"), r = g("./utf8"), l = g("./zipEntries"), p = g("./stream/Crc32Probe"), y = g("./nodejsUtils");
        function m(b) {
          return new o.Promise(function(i, c) {
            var n = b.decompressed.getContentWorker().pipe(new p());
            n.on("error", function(h) {
              c(h);
            }).on("end", function() {
              n.streamInfo.crc32 !== b.decompressed.crc32 ? c(new Error("Corrupted zip : CRC32 mismatch")) : i();
            }).resume();
          });
        }
        D.exports = function(b, i) {
          var c = this;
          return i = u.extend(i || {}, { base64: !1, checkCRC32: !1, optimizedBinaryString: !1, createFolders: !1, decodeFileName: r.utf8decode }), y.isNode && y.isStream(b) ? o.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", b, !0, i.optimizedBinaryString, i.base64).then(function(n) {
            var h = new l(i);
            return h.load(n), h;
          }).then(function(n) {
            var h = [o.Promise.resolve(n)], a = n.files;
            if (i.checkCRC32) for (var d = 0; d < a.length; d++) h.push(m(a[d]));
            return o.Promise.all(h);
          }).then(function(n) {
            for (var h = n.shift(), a = h.files, d = 0; d < a.length; d++) {
              var w = a[d], S = w.fileNameStr, x = u.resolve(w.fileNameStr);
              c.file(x, w.decompressed, { binary: !0, optimizedBinaryString: !0, date: w.date, dir: w.dir, comment: w.fileCommentStr.length ? w.fileCommentStr : null, unixPermissions: w.unixPermissions, dosPermissions: w.dosPermissions, createFolders: i.createFolders }), w.dir || (c.file(x).unsafeOriginalName = S);
            }
            return h.zipComment.length && (c.comment = h.zipComment), c;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(g, D, v) {
        var u = g("../utils"), o = g("../stream/GenericWorker");
        function r(l, p) {
          o.call(this, "Nodejs stream input adapter for " + l), this._upstreamEnded = !1, this._bindStream(p);
        }
        u.inherits(r, o), r.prototype._bindStream = function(l) {
          var p = this;
          (this._stream = l).pause(), l.on("data", function(y) {
            p.push({ data: y, meta: { percent: 0 } });
          }).on("error", function(y) {
            p.isPaused ? this.generatedError = y : p.error(y);
          }).on("end", function() {
            p.isPaused ? p._upstreamEnded = !0 : p.end();
          });
        }, r.prototype.pause = function() {
          return !!o.prototype.pause.call(this) && (this._stream.pause(), !0);
        }, r.prototype.resume = function() {
          return !!o.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
        }, D.exports = r;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(g, D, v) {
        var u = g("readable-stream").Readable;
        function o(r, l, p) {
          u.call(this, l), this._helper = r;
          var y = this;
          r.on("data", function(m, b) {
            y.push(m) || y._helper.pause(), p && p(b);
          }).on("error", function(m) {
            y.emit("error", m);
          }).on("end", function() {
            y.push(null);
          });
        }
        g("../utils").inherits(o, u), o.prototype._read = function() {
          this._helper.resume();
        }, D.exports = o;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(g, D, v) {
        D.exports = { isNode: typeof Buffer < "u", newBufferFrom: function(u, o) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(u, o);
          if (typeof u == "number") throw new Error('The "data" argument must not be a number');
          return new Buffer(u, o);
        }, allocBuffer: function(u) {
          if (Buffer.alloc) return Buffer.alloc(u);
          var o = new Buffer(u);
          return o.fill(0), o;
        }, isBuffer: function(u) {
          return Buffer.isBuffer(u);
        }, isStream: function(u) {
          return u && typeof u.on == "function" && typeof u.pause == "function" && typeof u.resume == "function";
        } };
      }, {}], 15: [function(g, D, v) {
        function u(x, F, O) {
          var L, I = r.getTypeOf(F), Z = r.extend(O || {}, y);
          Z.date = Z.date || /* @__PURE__ */ new Date(), Z.compression !== null && (Z.compression = Z.compression.toUpperCase()), typeof Z.unixPermissions == "string" && (Z.unixPermissions = parseInt(Z.unixPermissions, 8)), Z.unixPermissions && 16384 & Z.unixPermissions && (Z.dir = !0), Z.dosPermissions && 16 & Z.dosPermissions && (Z.dir = !0), Z.dir && (x = a(x)), Z.createFolders && (L = h(x)) && d.call(this, L, !0);
          var q = I === "string" && Z.binary === !1 && Z.base64 === !1;
          O && O.binary !== void 0 || (Z.binary = !q), (F instanceof m && F.uncompressedSize === 0 || Z.dir || !F || F.length === 0) && (Z.base64 = !1, Z.binary = !0, F = "", Z.compression = "STORE", I = "string");
          var _ = null;
          _ = F instanceof m || F instanceof l ? F : c.isNode && c.isStream(F) ? new n(x, F) : r.prepareContent(x, F, Z.binary, Z.optimizedBinaryString, Z.base64);
          var B = new b(x, _, Z);
          this.files[x] = B;
        }
        var o = g("./utf8"), r = g("./utils"), l = g("./stream/GenericWorker"), p = g("./stream/StreamHelper"), y = g("./defaults"), m = g("./compressedObject"), b = g("./zipObject"), i = g("./generate"), c = g("./nodejsUtils"), n = g("./nodejs/NodejsStreamInputAdapter"), h = function(x) {
          x.slice(-1) === "/" && (x = x.substring(0, x.length - 1));
          var F = x.lastIndexOf("/");
          return 0 < F ? x.substring(0, F) : "";
        }, a = function(x) {
          return x.slice(-1) !== "/" && (x += "/"), x;
        }, d = function(x, F) {
          return F = F !== void 0 ? F : y.createFolders, x = a(x), this.files[x] || u.call(this, x, null, { dir: !0, createFolders: F }), this.files[x];
        };
        function w(x) {
          return Object.prototype.toString.call(x) === "[object RegExp]";
        }
        var S = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(x) {
          var F, O, L;
          for (F in this.files) L = this.files[F], (O = F.slice(this.root.length, F.length)) && F.slice(0, this.root.length) === this.root && x(O, L);
        }, filter: function(x) {
          var F = [];
          return this.forEach(function(O, L) {
            x(O, L) && F.push(L);
          }), F;
        }, file: function(x, F, O) {
          if (arguments.length !== 1) return x = this.root + x, u.call(this, x, F, O), this;
          if (w(x)) {
            var L = x;
            return this.filter(function(Z, q) {
              return !q.dir && L.test(Z);
            });
          }
          var I = this.files[this.root + x];
          return I && !I.dir ? I : null;
        }, folder: function(x) {
          if (!x) return this;
          if (w(x)) return this.filter(function(I, Z) {
            return Z.dir && x.test(I);
          });
          var F = this.root + x, O = d.call(this, F), L = this.clone();
          return L.root = O.name, L;
        }, remove: function(x) {
          x = this.root + x;
          var F = this.files[x];
          if (F || (x.slice(-1) !== "/" && (x += "/"), F = this.files[x]), F && !F.dir) delete this.files[x];
          else for (var O = this.filter(function(I, Z) {
            return Z.name.slice(0, x.length) === x;
          }), L = 0; L < O.length; L++) delete this.files[O[L].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(x) {
          var F, O = {};
          try {
            if ((O = r.extend(x || {}, { streamFiles: !1, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: o.utf8encode })).type = O.type.toLowerCase(), O.compression = O.compression.toUpperCase(), O.type === "binarystring" && (O.type = "string"), !O.type) throw new Error("No output type specified.");
            r.checkSupport(O.type), O.platform !== "darwin" && O.platform !== "freebsd" && O.platform !== "linux" && O.platform !== "sunos" || (O.platform = "UNIX"), O.platform === "win32" && (O.platform = "DOS");
            var L = O.comment || this.comment || "";
            F = i.generateWorker(this, O, L);
          } catch (I) {
            (F = new l("error")).error(I);
          }
          return new p(F, O.type || "string", O.mimeType);
        }, generateAsync: function(x, F) {
          return this.generateInternalStream(x).accumulate(F);
        }, generateNodeStream: function(x, F) {
          return (x = x || {}).type || (x.type = "nodebuffer"), this.generateInternalStream(x).toNodejsStream(F);
        } };
        D.exports = S;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(g, D, v) {
        D.exports = g("stream");
      }, { stream: void 0 }], 17: [function(g, D, v) {
        var u = g("./DataReader");
        function o(r) {
          u.call(this, r);
          for (var l = 0; l < this.data.length; l++) r[l] = 255 & r[l];
        }
        g("../utils").inherits(o, u), o.prototype.byteAt = function(r) {
          return this.data[this.zero + r];
        }, o.prototype.lastIndexOfSignature = function(r) {
          for (var l = r.charCodeAt(0), p = r.charCodeAt(1), y = r.charCodeAt(2), m = r.charCodeAt(3), b = this.length - 4; 0 <= b; --b) if (this.data[b] === l && this.data[b + 1] === p && this.data[b + 2] === y && this.data[b + 3] === m) return b - this.zero;
          return -1;
        }, o.prototype.readAndCheckSignature = function(r) {
          var l = r.charCodeAt(0), p = r.charCodeAt(1), y = r.charCodeAt(2), m = r.charCodeAt(3), b = this.readData(4);
          return l === b[0] && p === b[1] && y === b[2] && m === b[3];
        }, o.prototype.readData = function(r) {
          if (this.checkOffset(r), r === 0) return [];
          var l = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, l;
        }, D.exports = o;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(g, D, v) {
        var u = g("../utils");
        function o(r) {
          this.data = r, this.length = r.length, this.index = 0, this.zero = 0;
        }
        o.prototype = { checkOffset: function(r) {
          this.checkIndex(this.index + r);
        }, checkIndex: function(r) {
          if (this.length < this.zero + r || r < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + r + "). Corrupted zip ?");
        }, setIndex: function(r) {
          this.checkIndex(r), this.index = r;
        }, skip: function(r) {
          this.setIndex(this.index + r);
        }, byteAt: function() {
        }, readInt: function(r) {
          var l, p = 0;
          for (this.checkOffset(r), l = this.index + r - 1; l >= this.index; l--) p = (p << 8) + this.byteAt(l);
          return this.index += r, p;
        }, readString: function(r) {
          return u.transformTo("string", this.readData(r));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var r = this.readInt(4);
          return new Date(Date.UTC(1980 + (r >> 25 & 127), (r >> 21 & 15) - 1, r >> 16 & 31, r >> 11 & 31, r >> 5 & 63, (31 & r) << 1));
        } }, D.exports = o;
      }, { "../utils": 32 }], 19: [function(g, D, v) {
        var u = g("./Uint8ArrayReader");
        function o(r) {
          u.call(this, r);
        }
        g("../utils").inherits(o, u), o.prototype.readData = function(r) {
          this.checkOffset(r);
          var l = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, l;
        }, D.exports = o;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(g, D, v) {
        var u = g("./DataReader");
        function o(r) {
          u.call(this, r);
        }
        g("../utils").inherits(o, u), o.prototype.byteAt = function(r) {
          return this.data.charCodeAt(this.zero + r);
        }, o.prototype.lastIndexOfSignature = function(r) {
          return this.data.lastIndexOf(r) - this.zero;
        }, o.prototype.readAndCheckSignature = function(r) {
          return r === this.readData(4);
        }, o.prototype.readData = function(r) {
          this.checkOffset(r);
          var l = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, l;
        }, D.exports = o;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(g, D, v) {
        var u = g("./ArrayReader");
        function o(r) {
          u.call(this, r);
        }
        g("../utils").inherits(o, u), o.prototype.readData = function(r) {
          if (this.checkOffset(r), r === 0) return new Uint8Array(0);
          var l = this.data.subarray(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, l;
        }, D.exports = o;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(g, D, v) {
        var u = g("../utils"), o = g("../support"), r = g("./ArrayReader"), l = g("./StringReader"), p = g("./NodeBufferReader"), y = g("./Uint8ArrayReader");
        D.exports = function(m) {
          var b = u.getTypeOf(m);
          return u.checkSupport(b), b !== "string" || o.uint8array ? b === "nodebuffer" ? new p(m) : o.uint8array ? new y(u.transformTo("uint8array", m)) : new r(u.transformTo("array", m)) : new l(m);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(g, D, v) {
        v.LOCAL_FILE_HEADER = "PK", v.CENTRAL_FILE_HEADER = "PK", v.CENTRAL_DIRECTORY_END = "PK", v.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", v.ZIP64_CENTRAL_DIRECTORY_END = "PK", v.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(g, D, v) {
        var u = g("./GenericWorker"), o = g("../utils");
        function r(l) {
          u.call(this, "ConvertWorker to " + l), this.destType = l;
        }
        o.inherits(r, u), r.prototype.processChunk = function(l) {
          this.push({ data: o.transformTo(this.destType, l.data), meta: l.meta });
        }, D.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(g, D, v) {
        var u = g("./GenericWorker"), o = g("../crc32");
        function r() {
          u.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        g("../utils").inherits(r, u), r.prototype.processChunk = function(l) {
          this.streamInfo.crc32 = o(l.data, this.streamInfo.crc32 || 0), this.push(l);
        }, D.exports = r;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(g, D, v) {
        var u = g("../utils"), o = g("./GenericWorker");
        function r(l) {
          o.call(this, "DataLengthProbe for " + l), this.propName = l, this.withStreamInfo(l, 0);
        }
        u.inherits(r, o), r.prototype.processChunk = function(l) {
          if (l) {
            var p = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = p + l.data.length;
          }
          o.prototype.processChunk.call(this, l);
        }, D.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(g, D, v) {
        var u = g("../utils"), o = g("./GenericWorker");
        function r(l) {
          o.call(this, "DataWorker");
          var p = this;
          this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, l.then(function(y) {
            p.dataIsReady = !0, p.data = y, p.max = y && y.length || 0, p.type = u.getTypeOf(y), p.isPaused || p._tickAndRepeat();
          }, function(y) {
            p.error(y);
          });
        }
        u.inherits(r, o), r.prototype.cleanUp = function() {
          o.prototype.cleanUp.call(this), this.data = null;
        }, r.prototype.resume = function() {
          return !!o.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, u.delay(this._tickAndRepeat, [], this)), !0);
        }, r.prototype._tickAndRepeat = function() {
          this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (u.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
        }, r.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return !1;
          var l = null, p = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              l = this.data.substring(this.index, p);
              break;
            case "uint8array":
              l = this.data.subarray(this.index, p);
              break;
            case "array":
            case "nodebuffer":
              l = this.data.slice(this.index, p);
          }
          return this.index = p, this.push({ data: l, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, D.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(g, D, v) {
        function u(o) {
          this.name = o || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        u.prototype = { push: function(o) {
          this.emit("data", o);
        }, end: function() {
          if (this.isFinished) return !1;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = !0;
          } catch (o) {
            this.emit("error", o);
          }
          return !0;
        }, error: function(o) {
          return !this.isFinished && (this.isPaused ? this.generatedError = o : (this.isFinished = !0, this.emit("error", o), this.previous && this.previous.error(o), this.cleanUp()), !0);
        }, on: function(o, r) {
          return this._listeners[o].push(r), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(o, r) {
          if (this._listeners[o]) for (var l = 0; l < this._listeners[o].length; l++) this._listeners[o][l].call(this, r);
        }, pipe: function(o) {
          return o.registerPrevious(this);
        }, registerPrevious: function(o) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = o.streamInfo, this.mergeStreamInfo(), this.previous = o;
          var r = this;
          return o.on("data", function(l) {
            r.processChunk(l);
          }), o.on("end", function() {
            r.end();
          }), o.on("error", function(l) {
            r.error(l);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return !1;
          var o = this.isPaused = !1;
          return this.generatedError && (this.error(this.generatedError), o = !0), this.previous && this.previous.resume(), !o;
        }, flush: function() {
        }, processChunk: function(o) {
          this.push(o);
        }, withStreamInfo: function(o, r) {
          return this.extraStreamInfo[o] = r, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var o in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, o) && (this.streamInfo[o] = this.extraStreamInfo[o]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = !0, this.previous && this.previous.lock();
        }, toString: function() {
          var o = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + o : o;
        } }, D.exports = u;
      }, {}], 29: [function(g, D, v) {
        var u = g("../utils"), o = g("./ConvertWorker"), r = g("./GenericWorker"), l = g("../base64"), p = g("../support"), y = g("../external"), m = null;
        if (p.nodestream) try {
          m = g("../nodejs/NodejsStreamOutputAdapter");
        } catch {
        }
        function b(c, n) {
          return new y.Promise(function(h, a) {
            var d = [], w = c._internalType, S = c._outputType, x = c._mimeType;
            c.on("data", function(F, O) {
              d.push(F), n && n(O);
            }).on("error", function(F) {
              d = [], a(F);
            }).on("end", function() {
              try {
                var F = (function(O, L, I) {
                  switch (O) {
                    case "blob":
                      return u.newBlob(u.transformTo("arraybuffer", L), I);
                    case "base64":
                      return l.encode(L);
                    default:
                      return u.transformTo(O, L);
                  }
                })(S, (function(O, L) {
                  var I, Z = 0, q = null, _ = 0;
                  for (I = 0; I < L.length; I++) _ += L[I].length;
                  switch (O) {
                    case "string":
                      return L.join("");
                    case "array":
                      return Array.prototype.concat.apply([], L);
                    case "uint8array":
                      for (q = new Uint8Array(_), I = 0; I < L.length; I++) q.set(L[I], Z), Z += L[I].length;
                      return q;
                    case "nodebuffer":
                      return Buffer.concat(L);
                    default:
                      throw new Error("concat : unsupported type '" + O + "'");
                  }
                })(w, d), x);
                h(F);
              } catch (O) {
                a(O);
              }
              d = [];
            }).resume();
          });
        }
        function i(c, n, h) {
          var a = n;
          switch (n) {
            case "blob":
            case "arraybuffer":
              a = "uint8array";
              break;
            case "base64":
              a = "string";
          }
          try {
            this._internalType = a, this._outputType = n, this._mimeType = h, u.checkSupport(a), this._worker = c.pipe(new o(a)), c.lock();
          } catch (d) {
            this._worker = new r("error"), this._worker.error(d);
          }
        }
        i.prototype = { accumulate: function(c) {
          return b(this, c);
        }, on: function(c, n) {
          var h = this;
          return c === "data" ? this._worker.on(c, function(a) {
            n.call(h, a.data, a.meta);
          }) : this._worker.on(c, function() {
            u.delay(n, arguments, h);
          }), this;
        }, resume: function() {
          return u.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(c) {
          if (u.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
          return new m(this, { objectMode: this._outputType !== "nodebuffer" }, c);
        } }, D.exports = i;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(g, D, v) {
        if (v.base64 = !0, v.array = !0, v.string = !0, v.arraybuffer = typeof ArrayBuffer < "u" && typeof Uint8Array < "u", v.nodebuffer = typeof Buffer < "u", v.uint8array = typeof Uint8Array < "u", typeof ArrayBuffer > "u") v.blob = !1;
        else {
          var u = new ArrayBuffer(0);
          try {
            v.blob = new Blob([u], { type: "application/zip" }).size === 0;
          } catch {
            try {
              var o = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              o.append(u), v.blob = o.getBlob("application/zip").size === 0;
            } catch {
              v.blob = !1;
            }
          }
        }
        try {
          v.nodestream = !!g("readable-stream").Readable;
        } catch {
          v.nodestream = !1;
        }
      }, { "readable-stream": 16 }], 31: [function(g, D, v) {
        for (var u = g("./utils"), o = g("./support"), r = g("./nodejsUtils"), l = g("./stream/GenericWorker"), p = new Array(256), y = 0; y < 256; y++) p[y] = 252 <= y ? 6 : 248 <= y ? 5 : 240 <= y ? 4 : 224 <= y ? 3 : 192 <= y ? 2 : 1;
        p[254] = p[254] = 1;
        function m() {
          l.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function b() {
          l.call(this, "utf-8 encode");
        }
        v.utf8encode = function(i) {
          return o.nodebuffer ? r.newBufferFrom(i, "utf-8") : (function(c) {
            var n, h, a, d, w, S = c.length, x = 0;
            for (d = 0; d < S; d++) (64512 & (h = c.charCodeAt(d))) == 55296 && d + 1 < S && (64512 & (a = c.charCodeAt(d + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (a - 56320), d++), x += h < 128 ? 1 : h < 2048 ? 2 : h < 65536 ? 3 : 4;
            for (n = o.uint8array ? new Uint8Array(x) : new Array(x), d = w = 0; w < x; d++) (64512 & (h = c.charCodeAt(d))) == 55296 && d + 1 < S && (64512 & (a = c.charCodeAt(d + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (a - 56320), d++), h < 128 ? n[w++] = h : (h < 2048 ? n[w++] = 192 | h >>> 6 : (h < 65536 ? n[w++] = 224 | h >>> 12 : (n[w++] = 240 | h >>> 18, n[w++] = 128 | h >>> 12 & 63), n[w++] = 128 | h >>> 6 & 63), n[w++] = 128 | 63 & h);
            return n;
          })(i);
        }, v.utf8decode = function(i) {
          return o.nodebuffer ? u.transformTo("nodebuffer", i).toString("utf-8") : (function(c) {
            var n, h, a, d, w = c.length, S = new Array(2 * w);
            for (n = h = 0; n < w; ) if ((a = c[n++]) < 128) S[h++] = a;
            else if (4 < (d = p[a])) S[h++] = 65533, n += d - 1;
            else {
              for (a &= d === 2 ? 31 : d === 3 ? 15 : 7; 1 < d && n < w; ) a = a << 6 | 63 & c[n++], d--;
              1 < d ? S[h++] = 65533 : a < 65536 ? S[h++] = a : (a -= 65536, S[h++] = 55296 | a >> 10 & 1023, S[h++] = 56320 | 1023 & a);
            }
            return S.length !== h && (S.subarray ? S = S.subarray(0, h) : S.length = h), u.applyFromCharCode(S);
          })(i = u.transformTo(o.uint8array ? "uint8array" : "array", i));
        }, u.inherits(m, l), m.prototype.processChunk = function(i) {
          var c = u.transformTo(o.uint8array ? "uint8array" : "array", i.data);
          if (this.leftOver && this.leftOver.length) {
            if (o.uint8array) {
              var n = c;
              (c = new Uint8Array(n.length + this.leftOver.length)).set(this.leftOver, 0), c.set(n, this.leftOver.length);
            } else c = this.leftOver.concat(c);
            this.leftOver = null;
          }
          var h = (function(d, w) {
            var S;
            for ((w = w || d.length) > d.length && (w = d.length), S = w - 1; 0 <= S && (192 & d[S]) == 128; ) S--;
            return S < 0 || S === 0 ? w : S + p[d[S]] > w ? S : w;
          })(c), a = c;
          h !== c.length && (o.uint8array ? (a = c.subarray(0, h), this.leftOver = c.subarray(h, c.length)) : (a = c.slice(0, h), this.leftOver = c.slice(h, c.length))), this.push({ data: v.utf8decode(a), meta: i.meta });
        }, m.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: v.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, v.Utf8DecodeWorker = m, u.inherits(b, l), b.prototype.processChunk = function(i) {
          this.push({ data: v.utf8encode(i.data), meta: i.meta });
        }, v.Utf8EncodeWorker = b;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(g, D, v) {
        var u = g("./support"), o = g("./base64"), r = g("./nodejsUtils"), l = g("./external");
        function p(n) {
          return n;
        }
        function y(n, h) {
          for (var a = 0; a < n.length; ++a) h[a] = 255 & n.charCodeAt(a);
          return h;
        }
        g("setimmediate"), v.newBlob = function(n, h) {
          v.checkSupport("blob");
          try {
            return new Blob([n], { type: h });
          } catch {
            try {
              var a = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return a.append(n), a.getBlob(h);
            } catch {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var m = { stringifyByChunk: function(n, h, a) {
          var d = [], w = 0, S = n.length;
          if (S <= a) return String.fromCharCode.apply(null, n);
          for (; w < S; ) h === "array" || h === "nodebuffer" ? d.push(String.fromCharCode.apply(null, n.slice(w, Math.min(w + a, S)))) : d.push(String.fromCharCode.apply(null, n.subarray(w, Math.min(w + a, S)))), w += a;
          return d.join("");
        }, stringifyByChar: function(n) {
          for (var h = "", a = 0; a < n.length; a++) h += String.fromCharCode(n[a]);
          return h;
        }, applyCanBeUsed: { uint8array: (function() {
          try {
            return u.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
          } catch {
            return !1;
          }
        })(), nodebuffer: (function() {
          try {
            return u.nodebuffer && String.fromCharCode.apply(null, r.allocBuffer(1)).length === 1;
          } catch {
            return !1;
          }
        })() } };
        function b(n) {
          var h = 65536, a = v.getTypeOf(n), d = !0;
          if (a === "uint8array" ? d = m.applyCanBeUsed.uint8array : a === "nodebuffer" && (d = m.applyCanBeUsed.nodebuffer), d) for (; 1 < h; ) try {
            return m.stringifyByChunk(n, a, h);
          } catch {
            h = Math.floor(h / 2);
          }
          return m.stringifyByChar(n);
        }
        function i(n, h) {
          for (var a = 0; a < n.length; a++) h[a] = n[a];
          return h;
        }
        v.applyFromCharCode = b;
        var c = {};
        c.string = { string: p, array: function(n) {
          return y(n, new Array(n.length));
        }, arraybuffer: function(n) {
          return c.string.uint8array(n).buffer;
        }, uint8array: function(n) {
          return y(n, new Uint8Array(n.length));
        }, nodebuffer: function(n) {
          return y(n, r.allocBuffer(n.length));
        } }, c.array = { string: b, array: p, arraybuffer: function(n) {
          return new Uint8Array(n).buffer;
        }, uint8array: function(n) {
          return new Uint8Array(n);
        }, nodebuffer: function(n) {
          return r.newBufferFrom(n);
        } }, c.arraybuffer = { string: function(n) {
          return b(new Uint8Array(n));
        }, array: function(n) {
          return i(new Uint8Array(n), new Array(n.byteLength));
        }, arraybuffer: p, uint8array: function(n) {
          return new Uint8Array(n);
        }, nodebuffer: function(n) {
          return r.newBufferFrom(new Uint8Array(n));
        } }, c.uint8array = { string: b, array: function(n) {
          return i(n, new Array(n.length));
        }, arraybuffer: function(n) {
          return n.buffer;
        }, uint8array: p, nodebuffer: function(n) {
          return r.newBufferFrom(n);
        } }, c.nodebuffer = { string: b, array: function(n) {
          return i(n, new Array(n.length));
        }, arraybuffer: function(n) {
          return c.nodebuffer.uint8array(n).buffer;
        }, uint8array: function(n) {
          return i(n, new Uint8Array(n.length));
        }, nodebuffer: p }, v.transformTo = function(n, h) {
          if (h = h || "", !n) return h;
          v.checkSupport(n);
          var a = v.getTypeOf(h);
          return c[a][n](h);
        }, v.resolve = function(n) {
          for (var h = n.split("/"), a = [], d = 0; d < h.length; d++) {
            var w = h[d];
            w === "." || w === "" && d !== 0 && d !== h.length - 1 || (w === ".." ? a.pop() : a.push(w));
          }
          return a.join("/");
        }, v.getTypeOf = function(n) {
          return typeof n == "string" ? "string" : Object.prototype.toString.call(n) === "[object Array]" ? "array" : u.nodebuffer && r.isBuffer(n) ? "nodebuffer" : u.uint8array && n instanceof Uint8Array ? "uint8array" : u.arraybuffer && n instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, v.checkSupport = function(n) {
          if (!u[n.toLowerCase()]) throw new Error(n + " is not supported by this platform");
        }, v.MAX_VALUE_16BITS = 65535, v.MAX_VALUE_32BITS = -1, v.pretty = function(n) {
          var h, a, d = "";
          for (a = 0; a < (n || "").length; a++) d += "\\x" + ((h = n.charCodeAt(a)) < 16 ? "0" : "") + h.toString(16).toUpperCase();
          return d;
        }, v.delay = function(n, h, a) {
          setImmediate(function() {
            n.apply(a || null, h || []);
          });
        }, v.inherits = function(n, h) {
          function a() {
          }
          a.prototype = h.prototype, n.prototype = new a();
        }, v.extend = function() {
          var n, h, a = {};
          for (n = 0; n < arguments.length; n++) for (h in arguments[n]) Object.prototype.hasOwnProperty.call(arguments[n], h) && a[h] === void 0 && (a[h] = arguments[n][h]);
          return a;
        }, v.prepareContent = function(n, h, a, d, w) {
          return l.Promise.resolve(h).then(function(S) {
            return u.blob && (S instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(S)) !== -1) && typeof FileReader < "u" ? new l.Promise(function(x, F) {
              var O = new FileReader();
              O.onload = function(L) {
                x(L.target.result);
              }, O.onerror = function(L) {
                F(L.target.error);
              }, O.readAsArrayBuffer(S);
            }) : S;
          }).then(function(S) {
            var x = v.getTypeOf(S);
            return x ? (x === "arraybuffer" ? S = v.transformTo("uint8array", S) : x === "string" && (w ? S = o.decode(S) : a && d !== !0 && (S = (function(F) {
              return y(F, u.uint8array ? new Uint8Array(F.length) : new Array(F.length));
            })(S))), S) : l.Promise.reject(new Error("Can't read the data of '" + n + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(g, D, v) {
        var u = g("./reader/readerFor"), o = g("./utils"), r = g("./signature"), l = g("./zipEntry"), p = g("./support");
        function y(m) {
          this.files = [], this.loadOptions = m;
        }
        y.prototype = { checkSignature: function(m) {
          if (!this.reader.readAndCheckSignature(m)) {
            this.reader.index -= 4;
            var b = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + o.pretty(b) + ", expected " + o.pretty(m) + ")");
          }
        }, isSignature: function(m, b) {
          var i = this.reader.index;
          this.reader.setIndex(m);
          var c = this.reader.readString(4) === b;
          return this.reader.setIndex(i), c;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var m = this.reader.readData(this.zipCommentLength), b = p.uint8array ? "uint8array" : "array", i = o.transformTo(b, m);
          this.zipComment = this.loadOptions.decodeFileName(i);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var m, b, i, c = this.zip64EndOfCentralSize - 44; 0 < c; ) m = this.reader.readInt(2), b = this.reader.readInt(4), i = this.reader.readData(b), this.zip64ExtensibleData[m] = { id: m, length: b, value: i };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var m, b;
          for (m = 0; m < this.files.length; m++) b = this.files[m], this.reader.setIndex(b.localHeaderOffset), this.checkSignature(r.LOCAL_FILE_HEADER), b.readLocalPart(this.reader), b.handleUTF8(), b.processAttributes();
        }, readCentralDir: function() {
          var m;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(r.CENTRAL_FILE_HEADER); ) (m = new l({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(m);
          if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var m = this.reader.lastIndexOfSignature(r.CENTRAL_DIRECTORY_END);
          if (m < 0) throw this.isSignature(0, r.LOCAL_FILE_HEADER) ? new Error("Corrupted zip: can't find end of central directory") : new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
          this.reader.setIndex(m);
          var b = m;
          if (this.checkSignature(r.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === o.MAX_VALUE_16BITS || this.diskWithCentralDirStart === o.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === o.MAX_VALUE_16BITS || this.centralDirRecords === o.MAX_VALUE_16BITS || this.centralDirSize === o.MAX_VALUE_32BITS || this.centralDirOffset === o.MAX_VALUE_32BITS) {
            if (this.zip64 = !0, (m = this.reader.lastIndexOfSignature(r.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(m), this.checkSignature(r.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, r.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(r.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(r.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var i = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (i += 20, i += 12 + this.zip64EndOfCentralSize);
          var c = b - i;
          if (0 < c) this.isSignature(b, r.CENTRAL_FILE_HEADER) || (this.reader.zero = c);
          else if (c < 0) throw new Error("Corrupted zip: missing " + Math.abs(c) + " bytes.");
        }, prepareReader: function(m) {
          this.reader = u(m);
        }, load: function(m) {
          this.prepareReader(m), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, D.exports = y;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(g, D, v) {
        var u = g("./reader/readerFor"), o = g("./utils"), r = g("./compressedObject"), l = g("./crc32"), p = g("./utf8"), y = g("./compressions"), m = g("./support");
        function b(i, c) {
          this.options = i, this.loadOptions = c;
        }
        b.prototype = { isEncrypted: function() {
          return (1 & this.bitFlag) == 1;
        }, useUTF8: function() {
          return (2048 & this.bitFlag) == 2048;
        }, readLocalPart: function(i) {
          var c, n;
          if (i.skip(22), this.fileNameLength = i.readInt(2), n = i.readInt(2), this.fileName = i.readData(this.fileNameLength), i.skip(n), this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if ((c = (function(h) {
            for (var a in y) if (Object.prototype.hasOwnProperty.call(y, a) && y[a].magic === h) return y[a];
            return null;
          })(this.compressionMethod)) === null) throw new Error("Corrupted zip : compression " + o.pretty(this.compressionMethod) + " unknown (inner file : " + o.transformTo("string", this.fileName) + ")");
          this.decompressed = new r(this.compressedSize, this.uncompressedSize, this.crc32, c, i.readData(this.compressedSize));
        }, readCentralPart: function(i) {
          this.versionMadeBy = i.readInt(2), i.skip(2), this.bitFlag = i.readInt(2), this.compressionMethod = i.readString(2), this.date = i.readDate(), this.crc32 = i.readInt(4), this.compressedSize = i.readInt(4), this.uncompressedSize = i.readInt(4);
          var c = i.readInt(2);
          if (this.extraFieldsLength = i.readInt(2), this.fileCommentLength = i.readInt(2), this.diskNumberStart = i.readInt(2), this.internalFileAttributes = i.readInt(2), this.externalFileAttributes = i.readInt(4), this.localHeaderOffset = i.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
          i.skip(c), this.readExtraFields(i), this.parseZIP64ExtraField(i), this.fileComment = i.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var i = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), i == 0 && (this.dosPermissions = 63 & this.externalFileAttributes), i == 3 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = !0);
        }, parseZIP64ExtraField: function() {
          if (this.extraFields[1]) {
            var i = u(this.extraFields[1].value);
            this.uncompressedSize === o.MAX_VALUE_32BITS && (this.uncompressedSize = i.readInt(8)), this.compressedSize === o.MAX_VALUE_32BITS && (this.compressedSize = i.readInt(8)), this.localHeaderOffset === o.MAX_VALUE_32BITS && (this.localHeaderOffset = i.readInt(8)), this.diskNumberStart === o.MAX_VALUE_32BITS && (this.diskNumberStart = i.readInt(4));
          }
        }, readExtraFields: function(i) {
          var c, n, h, a = i.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); i.index + 4 < a; ) c = i.readInt(2), n = i.readInt(2), h = i.readData(n), this.extraFields[c] = { id: c, length: n, value: h };
          i.setIndex(a);
        }, handleUTF8: function() {
          var i = m.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = p.utf8decode(this.fileName), this.fileCommentStr = p.utf8decode(this.fileComment);
          else {
            var c = this.findExtraFieldUnicodePath();
            if (c !== null) this.fileNameStr = c;
            else {
              var n = o.transformTo(i, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(n);
            }
            var h = this.findExtraFieldUnicodeComment();
            if (h !== null) this.fileCommentStr = h;
            else {
              var a = o.transformTo(i, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(a);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var i = this.extraFields[28789];
          if (i) {
            var c = u(i.value);
            return c.readInt(1) !== 1 || l(this.fileName) !== c.readInt(4) ? null : p.utf8decode(c.readData(i.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var i = this.extraFields[25461];
          if (i) {
            var c = u(i.value);
            return c.readInt(1) !== 1 || l(this.fileComment) !== c.readInt(4) ? null : p.utf8decode(c.readData(i.length - 5));
          }
          return null;
        } }, D.exports = b;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(g, D, v) {
        function u(c, n, h) {
          this.name = c, this.dir = h.dir, this.date = h.date, this.comment = h.comment, this.unixPermissions = h.unixPermissions, this.dosPermissions = h.dosPermissions, this._data = n, this._dataBinary = h.binary, this.options = { compression: h.compression, compressionOptions: h.compressionOptions };
        }
        var o = g("./stream/StreamHelper"), r = g("./stream/DataWorker"), l = g("./utf8"), p = g("./compressedObject"), y = g("./stream/GenericWorker");
        u.prototype = { internalStream: function(c) {
          var n = null, h = "string";
          try {
            if (!c) throw new Error("No output type specified.");
            var a = (h = c.toLowerCase()) === "string" || h === "text";
            h !== "binarystring" && h !== "text" || (h = "string"), n = this._decompressWorker();
            var d = !this._dataBinary;
            d && !a && (n = n.pipe(new l.Utf8EncodeWorker())), !d && a && (n = n.pipe(new l.Utf8DecodeWorker()));
          } catch (w) {
            (n = new y("error")).error(w);
          }
          return new o(n, h, "");
        }, async: function(c, n) {
          return this.internalStream(c).accumulate(n);
        }, nodeStream: function(c, n) {
          return this.internalStream(c || "nodebuffer").toNodejsStream(n);
        }, _compressWorker: function(c, n) {
          if (this._data instanceof p && this._data.compression.magic === c.magic) return this._data.getCompressedWorker();
          var h = this._decompressWorker();
          return this._dataBinary || (h = h.pipe(new l.Utf8EncodeWorker())), p.createWorkerFrom(h, c, n);
        }, _decompressWorker: function() {
          return this._data instanceof p ? this._data.getContentWorker() : this._data instanceof y ? this._data : new r(this._data);
        } };
        for (var m = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], b = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, i = 0; i < m.length; i++) u.prototype[m[i]] = b;
        D.exports = u;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(g, D, v) {
        (function(u) {
          var o, r, l = u.MutationObserver || u.WebKitMutationObserver;
          if (l) {
            var p = 0, y = new l(c), m = u.document.createTextNode("");
            y.observe(m, { characterData: !0 }), o = function() {
              m.data = p = ++p % 2;
            };
          } else if (u.setImmediate || u.MessageChannel === void 0) o = "document" in u && "onreadystatechange" in u.document.createElement("script") ? function() {
            var n = u.document.createElement("script");
            n.onreadystatechange = function() {
              c(), n.onreadystatechange = null, n.parentNode.removeChild(n), n = null;
            }, u.document.documentElement.appendChild(n);
          } : function() {
            setTimeout(c, 0);
          };
          else {
            var b = new u.MessageChannel();
            b.port1.onmessage = c, o = function() {
              b.port2.postMessage(0);
            };
          }
          var i = [];
          function c() {
            var n, h;
            r = !0;
            for (var a = i.length; a; ) {
              for (h = i, i = [], n = -1; ++n < a; ) h[n]();
              a = i.length;
            }
            r = !1;
          }
          D.exports = function(n) {
            i.push(n) !== 1 || r || o();
          };
        }).call(this, typeof yt < "u" ? yt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}], 37: [function(g, D, v) {
        var u = g("immediate");
        function o() {
        }
        var r = {}, l = ["REJECTED"], p = ["FULFILLED"], y = ["PENDING"];
        function m(a) {
          if (typeof a != "function") throw new TypeError("resolver must be a function");
          this.state = y, this.queue = [], this.outcome = void 0, a !== o && n(this, a);
        }
        function b(a, d, w) {
          this.promise = a, typeof d == "function" && (this.onFulfilled = d, this.callFulfilled = this.otherCallFulfilled), typeof w == "function" && (this.onRejected = w, this.callRejected = this.otherCallRejected);
        }
        function i(a, d, w) {
          u(function() {
            var S;
            try {
              S = d(w);
            } catch (x) {
              return r.reject(a, x);
            }
            S === a ? r.reject(a, new TypeError("Cannot resolve promise with itself")) : r.resolve(a, S);
          });
        }
        function c(a) {
          var d = a && a.then;
          if (a && (typeof a == "object" || typeof a == "function") && typeof d == "function") return function() {
            d.apply(a, arguments);
          };
        }
        function n(a, d) {
          var w = !1;
          function S(O) {
            w || (w = !0, r.reject(a, O));
          }
          function x(O) {
            w || (w = !0, r.resolve(a, O));
          }
          var F = h(function() {
            d(x, S);
          });
          F.status === "error" && S(F.value);
        }
        function h(a, d) {
          var w = {};
          try {
            w.value = a(d), w.status = "success";
          } catch (S) {
            w.status = "error", w.value = S;
          }
          return w;
        }
        (D.exports = m).prototype.finally = function(a) {
          if (typeof a != "function") return this;
          var d = this.constructor;
          return this.then(function(w) {
            return d.resolve(a()).then(function() {
              return w;
            });
          }, function(w) {
            return d.resolve(a()).then(function() {
              throw w;
            });
          });
        }, m.prototype.catch = function(a) {
          return this.then(null, a);
        }, m.prototype.then = function(a, d) {
          if (typeof a != "function" && this.state === p || typeof d != "function" && this.state === l) return this;
          var w = new this.constructor(o);
          return this.state !== y ? i(w, this.state === p ? a : d, this.outcome) : this.queue.push(new b(w, a, d)), w;
        }, b.prototype.callFulfilled = function(a) {
          r.resolve(this.promise, a);
        }, b.prototype.otherCallFulfilled = function(a) {
          i(this.promise, this.onFulfilled, a);
        }, b.prototype.callRejected = function(a) {
          r.reject(this.promise, a);
        }, b.prototype.otherCallRejected = function(a) {
          i(this.promise, this.onRejected, a);
        }, r.resolve = function(a, d) {
          var w = h(c, d);
          if (w.status === "error") return r.reject(a, w.value);
          var S = w.value;
          if (S) n(a, S);
          else {
            a.state = p, a.outcome = d;
            for (var x = -1, F = a.queue.length; ++x < F; ) a.queue[x].callFulfilled(d);
          }
          return a;
        }, r.reject = function(a, d) {
          a.state = l, a.outcome = d;
          for (var w = -1, S = a.queue.length; ++w < S; ) a.queue[w].callRejected(d);
          return a;
        }, m.resolve = function(a) {
          return a instanceof this ? a : r.resolve(new this(o), a);
        }, m.reject = function(a) {
          var d = new this(o);
          return r.reject(d, a);
        }, m.all = function(a) {
          var d = this;
          if (Object.prototype.toString.call(a) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var w = a.length, S = !1;
          if (!w) return this.resolve([]);
          for (var x = new Array(w), F = 0, O = -1, L = new this(o); ++O < w; ) I(a[O], O);
          return L;
          function I(Z, q) {
            d.resolve(Z).then(function(_) {
              x[q] = _, ++F !== w || S || (S = !0, r.resolve(L, x));
            }, function(_) {
              S || (S = !0, r.reject(L, _));
            });
          }
        }, m.race = function(a) {
          var d = this;
          if (Object.prototype.toString.call(a) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var w = a.length, S = !1;
          if (!w) return this.resolve([]);
          for (var x = -1, F = new this(o); ++x < w; ) O = a[x], d.resolve(O).then(function(L) {
            S || (S = !0, r.resolve(F, L));
          }, function(L) {
            S || (S = !0, r.reject(F, L));
          });
          var O;
          return F;
        };
      }, { immediate: 36 }], 38: [function(g, D, v) {
        var u = {};
        (0, g("./lib/utils/common").assign)(u, g("./lib/deflate"), g("./lib/inflate"), g("./lib/zlib/constants")), D.exports = u;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(g, D, v) {
        var u = g("./zlib/deflate"), o = g("./utils/common"), r = g("./utils/strings"), l = g("./zlib/messages"), p = g("./zlib/zstream"), y = Object.prototype.toString, m = 0, b = -1, i = 0, c = 8;
        function n(a) {
          if (!(this instanceof n)) return new n(a);
          this.options = o.assign({ level: b, method: c, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: i, to: "" }, a || {});
          var d = this.options;
          d.raw && 0 < d.windowBits ? d.windowBits = -d.windowBits : d.gzip && 0 < d.windowBits && d.windowBits < 16 && (d.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new p(), this.strm.avail_out = 0;
          var w = u.deflateInit2(this.strm, d.level, d.method, d.windowBits, d.memLevel, d.strategy);
          if (w !== m) throw new Error(l[w]);
          if (d.header && u.deflateSetHeader(this.strm, d.header), d.dictionary) {
            var S;
            if (S = typeof d.dictionary == "string" ? r.string2buf(d.dictionary) : y.call(d.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(d.dictionary) : d.dictionary, (w = u.deflateSetDictionary(this.strm, S)) !== m) throw new Error(l[w]);
            this._dict_set = !0;
          }
        }
        function h(a, d) {
          var w = new n(d);
          if (w.push(a, !0), w.err) throw w.msg || l[w.err];
          return w.result;
        }
        n.prototype.push = function(a, d) {
          var w, S, x = this.strm, F = this.options.chunkSize;
          if (this.ended) return !1;
          S = d === ~~d ? d : d === !0 ? 4 : 0, typeof a == "string" ? x.input = r.string2buf(a) : y.call(a) === "[object ArrayBuffer]" ? x.input = new Uint8Array(a) : x.input = a, x.next_in = 0, x.avail_in = x.input.length;
          do {
            if (x.avail_out === 0 && (x.output = new o.Buf8(F), x.next_out = 0, x.avail_out = F), (w = u.deflate(x, S)) !== 1 && w !== m) return this.onEnd(w), !(this.ended = !0);
            x.avail_out !== 0 && (x.avail_in !== 0 || S !== 4 && S !== 2) || (this.options.to === "string" ? this.onData(r.buf2binstring(o.shrinkBuf(x.output, x.next_out))) : this.onData(o.shrinkBuf(x.output, x.next_out)));
          } while ((0 < x.avail_in || x.avail_out === 0) && w !== 1);
          return S === 4 ? (w = u.deflateEnd(this.strm), this.onEnd(w), this.ended = !0, w === m) : S !== 2 || (this.onEnd(m), !(x.avail_out = 0));
        }, n.prototype.onData = function(a) {
          this.chunks.push(a);
        }, n.prototype.onEnd = function(a) {
          a === m && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = a, this.msg = this.strm.msg;
        }, v.Deflate = n, v.deflate = h, v.deflateRaw = function(a, d) {
          return (d = d || {}).raw = !0, h(a, d);
        }, v.gzip = function(a, d) {
          return (d = d || {}).gzip = !0, h(a, d);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(g, D, v) {
        var u = g("./zlib/inflate"), o = g("./utils/common"), r = g("./utils/strings"), l = g("./zlib/constants"), p = g("./zlib/messages"), y = g("./zlib/zstream"), m = g("./zlib/gzheader"), b = Object.prototype.toString;
        function i(n) {
          if (!(this instanceof i)) return new i(n);
          this.options = o.assign({ chunkSize: 16384, windowBits: 0, to: "" }, n || {});
          var h = this.options;
          h.raw && 0 <= h.windowBits && h.windowBits < 16 && (h.windowBits = -h.windowBits, h.windowBits === 0 && (h.windowBits = -15)), !(0 <= h.windowBits && h.windowBits < 16) || n && n.windowBits || (h.windowBits += 32), 15 < h.windowBits && h.windowBits < 48 && (15 & h.windowBits) == 0 && (h.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new y(), this.strm.avail_out = 0;
          var a = u.inflateInit2(this.strm, h.windowBits);
          if (a !== l.Z_OK) throw new Error(p[a]);
          this.header = new m(), u.inflateGetHeader(this.strm, this.header);
        }
        function c(n, h) {
          var a = new i(h);
          if (a.push(n, !0), a.err) throw a.msg || p[a.err];
          return a.result;
        }
        i.prototype.push = function(n, h) {
          var a, d, w, S, x, F, O = this.strm, L = this.options.chunkSize, I = this.options.dictionary, Z = !1;
          if (this.ended) return !1;
          d = h === ~~h ? h : h === !0 ? l.Z_FINISH : l.Z_NO_FLUSH, typeof n == "string" ? O.input = r.binstring2buf(n) : b.call(n) === "[object ArrayBuffer]" ? O.input = new Uint8Array(n) : O.input = n, O.next_in = 0, O.avail_in = O.input.length;
          do {
            if (O.avail_out === 0 && (O.output = new o.Buf8(L), O.next_out = 0, O.avail_out = L), (a = u.inflate(O, l.Z_NO_FLUSH)) === l.Z_NEED_DICT && I && (F = typeof I == "string" ? r.string2buf(I) : b.call(I) === "[object ArrayBuffer]" ? new Uint8Array(I) : I, a = u.inflateSetDictionary(this.strm, F)), a === l.Z_BUF_ERROR && Z === !0 && (a = l.Z_OK, Z = !1), a !== l.Z_STREAM_END && a !== l.Z_OK) return this.onEnd(a), !(this.ended = !0);
            O.next_out && (O.avail_out !== 0 && a !== l.Z_STREAM_END && (O.avail_in !== 0 || d !== l.Z_FINISH && d !== l.Z_SYNC_FLUSH) || (this.options.to === "string" ? (w = r.utf8border(O.output, O.next_out), S = O.next_out - w, x = r.buf2string(O.output, w), O.next_out = S, O.avail_out = L - S, S && o.arraySet(O.output, O.output, w, S, 0), this.onData(x)) : this.onData(o.shrinkBuf(O.output, O.next_out)))), O.avail_in === 0 && O.avail_out === 0 && (Z = !0);
          } while ((0 < O.avail_in || O.avail_out === 0) && a !== l.Z_STREAM_END);
          return a === l.Z_STREAM_END && (d = l.Z_FINISH), d === l.Z_FINISH ? (a = u.inflateEnd(this.strm), this.onEnd(a), this.ended = !0, a === l.Z_OK) : d !== l.Z_SYNC_FLUSH || (this.onEnd(l.Z_OK), !(O.avail_out = 0));
        }, i.prototype.onData = function(n) {
          this.chunks.push(n);
        }, i.prototype.onEnd = function(n) {
          n === l.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = n, this.msg = this.strm.msg;
        }, v.Inflate = i, v.inflate = c, v.inflateRaw = function(n, h) {
          return (h = h || {}).raw = !0, c(n, h);
        }, v.ungzip = c;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(g, D, v) {
        var u = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
        v.assign = function(l) {
          for (var p = Array.prototype.slice.call(arguments, 1); p.length; ) {
            var y = p.shift();
            if (y) {
              if (typeof y != "object") throw new TypeError(y + "must be non-object");
              for (var m in y) y.hasOwnProperty(m) && (l[m] = y[m]);
            }
          }
          return l;
        }, v.shrinkBuf = function(l, p) {
          return l.length === p ? l : l.subarray ? l.subarray(0, p) : (l.length = p, l);
        };
        var o = { arraySet: function(l, p, y, m, b) {
          if (p.subarray && l.subarray) l.set(p.subarray(y, y + m), b);
          else for (var i = 0; i < m; i++) l[b + i] = p[y + i];
        }, flattenChunks: function(l) {
          var p, y, m, b, i, c;
          for (p = m = 0, y = l.length; p < y; p++) m += l[p].length;
          for (c = new Uint8Array(m), p = b = 0, y = l.length; p < y; p++) i = l[p], c.set(i, b), b += i.length;
          return c;
        } }, r = { arraySet: function(l, p, y, m, b) {
          for (var i = 0; i < m; i++) l[b + i] = p[y + i];
        }, flattenChunks: function(l) {
          return [].concat.apply([], l);
        } };
        v.setTyped = function(l) {
          l ? (v.Buf8 = Uint8Array, v.Buf16 = Uint16Array, v.Buf32 = Int32Array, v.assign(v, o)) : (v.Buf8 = Array, v.Buf16 = Array, v.Buf32 = Array, v.assign(v, r));
        }, v.setTyped(u);
      }, {}], 42: [function(g, D, v) {
        var u = g("./common"), o = !0, r = !0;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch {
          o = !1;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch {
          r = !1;
        }
        for (var l = new u.Buf8(256), p = 0; p < 256; p++) l[p] = 252 <= p ? 6 : 248 <= p ? 5 : 240 <= p ? 4 : 224 <= p ? 3 : 192 <= p ? 2 : 1;
        function y(m, b) {
          if (b < 65537 && (m.subarray && r || !m.subarray && o)) return String.fromCharCode.apply(null, u.shrinkBuf(m, b));
          for (var i = "", c = 0; c < b; c++) i += String.fromCharCode(m[c]);
          return i;
        }
        l[254] = l[254] = 1, v.string2buf = function(m) {
          var b, i, c, n, h, a = m.length, d = 0;
          for (n = 0; n < a; n++) (64512 & (i = m.charCodeAt(n))) == 55296 && n + 1 < a && (64512 & (c = m.charCodeAt(n + 1))) == 56320 && (i = 65536 + (i - 55296 << 10) + (c - 56320), n++), d += i < 128 ? 1 : i < 2048 ? 2 : i < 65536 ? 3 : 4;
          for (b = new u.Buf8(d), n = h = 0; h < d; n++) (64512 & (i = m.charCodeAt(n))) == 55296 && n + 1 < a && (64512 & (c = m.charCodeAt(n + 1))) == 56320 && (i = 65536 + (i - 55296 << 10) + (c - 56320), n++), i < 128 ? b[h++] = i : (i < 2048 ? b[h++] = 192 | i >>> 6 : (i < 65536 ? b[h++] = 224 | i >>> 12 : (b[h++] = 240 | i >>> 18, b[h++] = 128 | i >>> 12 & 63), b[h++] = 128 | i >>> 6 & 63), b[h++] = 128 | 63 & i);
          return b;
        }, v.buf2binstring = function(m) {
          return y(m, m.length);
        }, v.binstring2buf = function(m) {
          for (var b = new u.Buf8(m.length), i = 0, c = b.length; i < c; i++) b[i] = m.charCodeAt(i);
          return b;
        }, v.buf2string = function(m, b) {
          var i, c, n, h, a = b || m.length, d = new Array(2 * a);
          for (i = c = 0; i < a; ) if ((n = m[i++]) < 128) d[c++] = n;
          else if (4 < (h = l[n])) d[c++] = 65533, i += h - 1;
          else {
            for (n &= h === 2 ? 31 : h === 3 ? 15 : 7; 1 < h && i < a; ) n = n << 6 | 63 & m[i++], h--;
            1 < h ? d[c++] = 65533 : n < 65536 ? d[c++] = n : (n -= 65536, d[c++] = 55296 | n >> 10 & 1023, d[c++] = 56320 | 1023 & n);
          }
          return y(d, c);
        }, v.utf8border = function(m, b) {
          var i;
          for ((b = b || m.length) > m.length && (b = m.length), i = b - 1; 0 <= i && (192 & m[i]) == 128; ) i--;
          return i < 0 || i === 0 ? b : i + l[m[i]] > b ? i : b;
        };
      }, { "./common": 41 }], 43: [function(g, D, v) {
        D.exports = function(u, o, r, l) {
          for (var p = 65535 & u | 0, y = u >>> 16 & 65535 | 0, m = 0; r !== 0; ) {
            for (r -= m = 2e3 < r ? 2e3 : r; y = y + (p = p + o[l++] | 0) | 0, --m; ) ;
            p %= 65521, y %= 65521;
          }
          return p | y << 16 | 0;
        };
      }, {}], 44: [function(g, D, v) {
        D.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(g, D, v) {
        var u = (function() {
          for (var o, r = [], l = 0; l < 256; l++) {
            o = l;
            for (var p = 0; p < 8; p++) o = 1 & o ? 3988292384 ^ o >>> 1 : o >>> 1;
            r[l] = o;
          }
          return r;
        })();
        D.exports = function(o, r, l, p) {
          var y = u, m = p + l;
          o ^= -1;
          for (var b = p; b < m; b++) o = o >>> 8 ^ y[255 & (o ^ r[b])];
          return -1 ^ o;
        };
      }, {}], 46: [function(g, D, v) {
        var u, o = g("../utils/common"), r = g("./trees"), l = g("./adler32"), p = g("./crc32"), y = g("./messages"), m = 0, b = 4, i = 0, c = -2, n = -1, h = 4, a = 2, d = 8, w = 9, S = 286, x = 30, F = 19, O = 2 * S + 1, L = 15, I = 3, Z = 258, q = Z + I + 1, _ = 42, B = 113, e = 1, T = 2, J = 3, U = 4;
        function $(t, R) {
          return t.msg = y[R], R;
        }
        function j(t) {
          return (t << 1) - (4 < t ? 9 : 0);
        }
        function V(t) {
          for (var R = t.length; 0 <= --R; ) t[R] = 0;
        }
        function E(t) {
          var R = t.state, A = R.pending;
          A > t.avail_out && (A = t.avail_out), A !== 0 && (o.arraySet(t.output, R.pending_buf, R.pending_out, A, t.next_out), t.next_out += A, R.pending_out += A, t.total_out += A, t.avail_out -= A, R.pending -= A, R.pending === 0 && (R.pending_out = 0));
        }
        function C(t, R) {
          r._tr_flush_block(t, 0 <= t.block_start ? t.block_start : -1, t.strstart - t.block_start, R), t.block_start = t.strstart, E(t.strm);
        }
        function X(t, R) {
          t.pending_buf[t.pending++] = R;
        }
        function G(t, R) {
          t.pending_buf[t.pending++] = R >>> 8 & 255, t.pending_buf[t.pending++] = 255 & R;
        }
        function H(t, R) {
          var A, f, s = t.max_chain_length, k = t.strstart, P = t.prev_length, N = t.nice_match, z = t.strstart > t.w_size - q ? t.strstart - (t.w_size - q) : 0, W = t.window, K = t.w_mask, M = t.prev, Y = t.strstart + Z, rt = W[k + P - 1], tt = W[k + P];
          t.prev_length >= t.good_match && (s >>= 2), N > t.lookahead && (N = t.lookahead);
          do
            if (W[(A = R) + P] === tt && W[A + P - 1] === rt && W[A] === W[k] && W[++A] === W[k + 1]) {
              k += 2, A++;
              do
                ;
              while (W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && k < Y);
              if (f = Z - (Y - k), k = Y - Z, P < f) {
                if (t.match_start = R, N <= (P = f)) break;
                rt = W[k + P - 1], tt = W[k + P];
              }
            }
          while ((R = M[R & K]) > z && --s != 0);
          return P <= t.lookahead ? P : t.lookahead;
        }
        function it(t) {
          var R, A, f, s, k, P, N, z, W, K, M = t.w_size;
          do {
            if (s = t.window_size - t.lookahead - t.strstart, t.strstart >= M + (M - q)) {
              for (o.arraySet(t.window, t.window, M, M, 0), t.match_start -= M, t.strstart -= M, t.block_start -= M, R = A = t.hash_size; f = t.head[--R], t.head[R] = M <= f ? f - M : 0, --A; ) ;
              for (R = A = M; f = t.prev[--R], t.prev[R] = M <= f ? f - M : 0, --A; ) ;
              s += M;
            }
            if (t.strm.avail_in === 0) break;
            if (P = t.strm, N = t.window, z = t.strstart + t.lookahead, W = s, K = void 0, K = P.avail_in, W < K && (K = W), A = K === 0 ? 0 : (P.avail_in -= K, o.arraySet(N, P.input, P.next_in, K, z), P.state.wrap === 1 ? P.adler = l(P.adler, N, K, z) : P.state.wrap === 2 && (P.adler = p(P.adler, N, K, z)), P.next_in += K, P.total_in += K, K), t.lookahead += A, t.lookahead + t.insert >= I) for (k = t.strstart - t.insert, t.ins_h = t.window[k], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[k + 1]) & t.hash_mask; t.insert && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[k + I - 1]) & t.hash_mask, t.prev[k & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = k, k++, t.insert--, !(t.lookahead + t.insert < I)); ) ;
          } while (t.lookahead < q && t.strm.avail_in !== 0);
        }
        function lt(t, R) {
          for (var A, f; ; ) {
            if (t.lookahead < q) {
              if (it(t), t.lookahead < q && R === m) return e;
              if (t.lookahead === 0) break;
            }
            if (A = 0, t.lookahead >= I && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), A !== 0 && t.strstart - A <= t.w_size - q && (t.match_length = H(t, A)), t.match_length >= I) if (f = r._tr_tally(t, t.strstart - t.match_start, t.match_length - I), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= I) {
              for (t.match_length--; t.strstart++, t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart, --t.match_length != 0; ) ;
              t.strstart++;
            } else t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + 1]) & t.hash_mask;
            else f = r._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
            if (f && (C(t, !1), t.strm.avail_out === 0)) return e;
          }
          return t.insert = t.strstart < I - 1 ? t.strstart : I - 1, R === b ? (C(t, !0), t.strm.avail_out === 0 ? J : U) : t.last_lit && (C(t, !1), t.strm.avail_out === 0) ? e : T;
        }
        function Q(t, R) {
          for (var A, f, s; ; ) {
            if (t.lookahead < q) {
              if (it(t), t.lookahead < q && R === m) return e;
              if (t.lookahead === 0) break;
            }
            if (A = 0, t.lookahead >= I && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = I - 1, A !== 0 && t.prev_length < t.max_lazy_match && t.strstart - A <= t.w_size - q && (t.match_length = H(t, A), t.match_length <= 5 && (t.strategy === 1 || t.match_length === I && 4096 < t.strstart - t.match_start) && (t.match_length = I - 1)), t.prev_length >= I && t.match_length <= t.prev_length) {
              for (s = t.strstart + t.lookahead - I, f = r._tr_tally(t, t.strstart - 1 - t.prev_match, t.prev_length - I), t.lookahead -= t.prev_length - 1, t.prev_length -= 2; ++t.strstart <= s && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), --t.prev_length != 0; ) ;
              if (t.match_available = 0, t.match_length = I - 1, t.strstart++, f && (C(t, !1), t.strm.avail_out === 0)) return e;
            } else if (t.match_available) {
              if ((f = r._tr_tally(t, 0, t.window[t.strstart - 1])) && C(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0) return e;
            } else t.match_available = 1, t.strstart++, t.lookahead--;
          }
          return t.match_available && (f = r._tr_tally(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < I - 1 ? t.strstart : I - 1, R === b ? (C(t, !0), t.strm.avail_out === 0 ? J : U) : t.last_lit && (C(t, !1), t.strm.avail_out === 0) ? e : T;
        }
        function et(t, R, A, f, s) {
          this.good_length = t, this.max_lazy = R, this.nice_length = A, this.max_chain = f, this.func = s;
        }
        function ot() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = d, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new o.Buf16(2 * O), this.dyn_dtree = new o.Buf16(2 * (2 * x + 1)), this.bl_tree = new o.Buf16(2 * (2 * F + 1)), V(this.dyn_ltree), V(this.dyn_dtree), V(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new o.Buf16(L + 1), this.heap = new o.Buf16(2 * S + 1), V(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new o.Buf16(2 * S + 1), V(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function at(t) {
          var R;
          return t && t.state ? (t.total_in = t.total_out = 0, t.data_type = a, (R = t.state).pending = 0, R.pending_out = 0, R.wrap < 0 && (R.wrap = -R.wrap), R.status = R.wrap ? _ : B, t.adler = R.wrap === 2 ? 0 : 1, R.last_flush = m, r._tr_init(R), i) : $(t, c);
        }
        function ct(t) {
          var R = at(t);
          return R === i && (function(A) {
            A.window_size = 2 * A.w_size, V(A.head), A.max_lazy_match = u[A.level].max_lazy, A.good_match = u[A.level].good_length, A.nice_match = u[A.level].nice_length, A.max_chain_length = u[A.level].max_chain, A.strstart = 0, A.block_start = 0, A.lookahead = 0, A.insert = 0, A.match_length = A.prev_length = I - 1, A.match_available = 0, A.ins_h = 0;
          })(t.state), R;
        }
        function ht(t, R, A, f, s, k) {
          if (!t) return c;
          var P = 1;
          if (R === n && (R = 6), f < 0 ? (P = 0, f = -f) : 15 < f && (P = 2, f -= 16), s < 1 || w < s || A !== d || f < 8 || 15 < f || R < 0 || 9 < R || k < 0 || h < k) return $(t, c);
          f === 8 && (f = 9);
          var N = new ot();
          return (t.state = N).strm = t, N.wrap = P, N.gzhead = null, N.w_bits = f, N.w_size = 1 << N.w_bits, N.w_mask = N.w_size - 1, N.hash_bits = s + 7, N.hash_size = 1 << N.hash_bits, N.hash_mask = N.hash_size - 1, N.hash_shift = ~~((N.hash_bits + I - 1) / I), N.window = new o.Buf8(2 * N.w_size), N.head = new o.Buf16(N.hash_size), N.prev = new o.Buf16(N.w_size), N.lit_bufsize = 1 << s + 6, N.pending_buf_size = 4 * N.lit_bufsize, N.pending_buf = new o.Buf8(N.pending_buf_size), N.d_buf = 1 * N.lit_bufsize, N.l_buf = 3 * N.lit_bufsize, N.level = R, N.strategy = k, N.method = A, ct(t);
        }
        u = [new et(0, 0, 0, 0, function(t, R) {
          var A = 65535;
          for (A > t.pending_buf_size - 5 && (A = t.pending_buf_size - 5); ; ) {
            if (t.lookahead <= 1) {
              if (it(t), t.lookahead === 0 && R === m) return e;
              if (t.lookahead === 0) break;
            }
            t.strstart += t.lookahead, t.lookahead = 0;
            var f = t.block_start + A;
            if ((t.strstart === 0 || t.strstart >= f) && (t.lookahead = t.strstart - f, t.strstart = f, C(t, !1), t.strm.avail_out === 0) || t.strstart - t.block_start >= t.w_size - q && (C(t, !1), t.strm.avail_out === 0)) return e;
          }
          return t.insert = 0, R === b ? (C(t, !0), t.strm.avail_out === 0 ? J : U) : (t.strstart > t.block_start && (C(t, !1), t.strm.avail_out), e);
        }), new et(4, 4, 8, 4, lt), new et(4, 5, 16, 8, lt), new et(4, 6, 32, 32, lt), new et(4, 4, 16, 16, Q), new et(8, 16, 32, 32, Q), new et(8, 16, 128, 128, Q), new et(8, 32, 128, 256, Q), new et(32, 128, 258, 1024, Q), new et(32, 258, 258, 4096, Q)], v.deflateInit = function(t, R) {
          return ht(t, R, d, 15, 8, 0);
        }, v.deflateInit2 = ht, v.deflateReset = ct, v.deflateResetKeep = at, v.deflateSetHeader = function(t, R) {
          return t && t.state ? t.state.wrap !== 2 ? c : (t.state.gzhead = R, i) : c;
        }, v.deflate = function(t, R) {
          var A, f, s, k;
          if (!t || !t.state || 5 < R || R < 0) return t ? $(t, c) : c;
          if (f = t.state, !t.output || !t.input && t.avail_in !== 0 || f.status === 666 && R !== b) return $(t, t.avail_out === 0 ? -5 : c);
          if (f.strm = t, A = f.last_flush, f.last_flush = R, f.status === _) if (f.wrap === 2) t.adler = 0, X(f, 31), X(f, 139), X(f, 8), f.gzhead ? (X(f, (f.gzhead.text ? 1 : 0) + (f.gzhead.hcrc ? 2 : 0) + (f.gzhead.extra ? 4 : 0) + (f.gzhead.name ? 8 : 0) + (f.gzhead.comment ? 16 : 0)), X(f, 255 & f.gzhead.time), X(f, f.gzhead.time >> 8 & 255), X(f, f.gzhead.time >> 16 & 255), X(f, f.gzhead.time >> 24 & 255), X(f, f.level === 9 ? 2 : 2 <= f.strategy || f.level < 2 ? 4 : 0), X(f, 255 & f.gzhead.os), f.gzhead.extra && f.gzhead.extra.length && (X(f, 255 & f.gzhead.extra.length), X(f, f.gzhead.extra.length >> 8 & 255)), f.gzhead.hcrc && (t.adler = p(t.adler, f.pending_buf, f.pending, 0)), f.gzindex = 0, f.status = 69) : (X(f, 0), X(f, 0), X(f, 0), X(f, 0), X(f, 0), X(f, f.level === 9 ? 2 : 2 <= f.strategy || f.level < 2 ? 4 : 0), X(f, 3), f.status = B);
          else {
            var P = d + (f.w_bits - 8 << 4) << 8;
            P |= (2 <= f.strategy || f.level < 2 ? 0 : f.level < 6 ? 1 : f.level === 6 ? 2 : 3) << 6, f.strstart !== 0 && (P |= 32), P += 31 - P % 31, f.status = B, G(f, P), f.strstart !== 0 && (G(f, t.adler >>> 16), G(f, 65535 & t.adler)), t.adler = 1;
          }
          if (f.status === 69) if (f.gzhead.extra) {
            for (s = f.pending; f.gzindex < (65535 & f.gzhead.extra.length) && (f.pending !== f.pending_buf_size || (f.gzhead.hcrc && f.pending > s && (t.adler = p(t.adler, f.pending_buf, f.pending - s, s)), E(t), s = f.pending, f.pending !== f.pending_buf_size)); ) X(f, 255 & f.gzhead.extra[f.gzindex]), f.gzindex++;
            f.gzhead.hcrc && f.pending > s && (t.adler = p(t.adler, f.pending_buf, f.pending - s, s)), f.gzindex === f.gzhead.extra.length && (f.gzindex = 0, f.status = 73);
          } else f.status = 73;
          if (f.status === 73) if (f.gzhead.name) {
            s = f.pending;
            do {
              if (f.pending === f.pending_buf_size && (f.gzhead.hcrc && f.pending > s && (t.adler = p(t.adler, f.pending_buf, f.pending - s, s)), E(t), s = f.pending, f.pending === f.pending_buf_size)) {
                k = 1;
                break;
              }
              k = f.gzindex < f.gzhead.name.length ? 255 & f.gzhead.name.charCodeAt(f.gzindex++) : 0, X(f, k);
            } while (k !== 0);
            f.gzhead.hcrc && f.pending > s && (t.adler = p(t.adler, f.pending_buf, f.pending - s, s)), k === 0 && (f.gzindex = 0, f.status = 91);
          } else f.status = 91;
          if (f.status === 91) if (f.gzhead.comment) {
            s = f.pending;
            do {
              if (f.pending === f.pending_buf_size && (f.gzhead.hcrc && f.pending > s && (t.adler = p(t.adler, f.pending_buf, f.pending - s, s)), E(t), s = f.pending, f.pending === f.pending_buf_size)) {
                k = 1;
                break;
              }
              k = f.gzindex < f.gzhead.comment.length ? 255 & f.gzhead.comment.charCodeAt(f.gzindex++) : 0, X(f, k);
            } while (k !== 0);
            f.gzhead.hcrc && f.pending > s && (t.adler = p(t.adler, f.pending_buf, f.pending - s, s)), k === 0 && (f.status = 103);
          } else f.status = 103;
          if (f.status === 103 && (f.gzhead.hcrc ? (f.pending + 2 > f.pending_buf_size && E(t), f.pending + 2 <= f.pending_buf_size && (X(f, 255 & t.adler), X(f, t.adler >> 8 & 255), t.adler = 0, f.status = B)) : f.status = B), f.pending !== 0) {
            if (E(t), t.avail_out === 0) return f.last_flush = -1, i;
          } else if (t.avail_in === 0 && j(R) <= j(A) && R !== b) return $(t, -5);
          if (f.status === 666 && t.avail_in !== 0) return $(t, -5);
          if (t.avail_in !== 0 || f.lookahead !== 0 || R !== m && f.status !== 666) {
            var N = f.strategy === 2 ? (function(z, W) {
              for (var K; ; ) {
                if (z.lookahead === 0 && (it(z), z.lookahead === 0)) {
                  if (W === m) return e;
                  break;
                }
                if (z.match_length = 0, K = r._tr_tally(z, 0, z.window[z.strstart]), z.lookahead--, z.strstart++, K && (C(z, !1), z.strm.avail_out === 0)) return e;
              }
              return z.insert = 0, W === b ? (C(z, !0), z.strm.avail_out === 0 ? J : U) : z.last_lit && (C(z, !1), z.strm.avail_out === 0) ? e : T;
            })(f, R) : f.strategy === 3 ? (function(z, W) {
              for (var K, M, Y, rt, tt = z.window; ; ) {
                if (z.lookahead <= Z) {
                  if (it(z), z.lookahead <= Z && W === m) return e;
                  if (z.lookahead === 0) break;
                }
                if (z.match_length = 0, z.lookahead >= I && 0 < z.strstart && (M = tt[Y = z.strstart - 1]) === tt[++Y] && M === tt[++Y] && M === tt[++Y]) {
                  rt = z.strstart + Z;
                  do
                    ;
                  while (M === tt[++Y] && M === tt[++Y] && M === tt[++Y] && M === tt[++Y] && M === tt[++Y] && M === tt[++Y] && M === tt[++Y] && M === tt[++Y] && Y < rt);
                  z.match_length = Z - (rt - Y), z.match_length > z.lookahead && (z.match_length = z.lookahead);
                }
                if (z.match_length >= I ? (K = r._tr_tally(z, 1, z.match_length - I), z.lookahead -= z.match_length, z.strstart += z.match_length, z.match_length = 0) : (K = r._tr_tally(z, 0, z.window[z.strstart]), z.lookahead--, z.strstart++), K && (C(z, !1), z.strm.avail_out === 0)) return e;
              }
              return z.insert = 0, W === b ? (C(z, !0), z.strm.avail_out === 0 ? J : U) : z.last_lit && (C(z, !1), z.strm.avail_out === 0) ? e : T;
            })(f, R) : u[f.level].func(f, R);
            if (N !== J && N !== U || (f.status = 666), N === e || N === J) return t.avail_out === 0 && (f.last_flush = -1), i;
            if (N === T && (R === 1 ? r._tr_align(f) : R !== 5 && (r._tr_stored_block(f, 0, 0, !1), R === 3 && (V(f.head), f.lookahead === 0 && (f.strstart = 0, f.block_start = 0, f.insert = 0))), E(t), t.avail_out === 0)) return f.last_flush = -1, i;
          }
          return R !== b ? i : f.wrap <= 0 ? 1 : (f.wrap === 2 ? (X(f, 255 & t.adler), X(f, t.adler >> 8 & 255), X(f, t.adler >> 16 & 255), X(f, t.adler >> 24 & 255), X(f, 255 & t.total_in), X(f, t.total_in >> 8 & 255), X(f, t.total_in >> 16 & 255), X(f, t.total_in >> 24 & 255)) : (G(f, t.adler >>> 16), G(f, 65535 & t.adler)), E(t), 0 < f.wrap && (f.wrap = -f.wrap), f.pending !== 0 ? i : 1);
        }, v.deflateEnd = function(t) {
          var R;
          return t && t.state ? (R = t.state.status) !== _ && R !== 69 && R !== 73 && R !== 91 && R !== 103 && R !== B && R !== 666 ? $(t, c) : (t.state = null, R === B ? $(t, -3) : i) : c;
        }, v.deflateSetDictionary = function(t, R) {
          var A, f, s, k, P, N, z, W, K = R.length;
          if (!t || !t.state || (k = (A = t.state).wrap) === 2 || k === 1 && A.status !== _ || A.lookahead) return c;
          for (k === 1 && (t.adler = l(t.adler, R, K, 0)), A.wrap = 0, K >= A.w_size && (k === 0 && (V(A.head), A.strstart = 0, A.block_start = 0, A.insert = 0), W = new o.Buf8(A.w_size), o.arraySet(W, R, K - A.w_size, A.w_size, 0), R = W, K = A.w_size), P = t.avail_in, N = t.next_in, z = t.input, t.avail_in = K, t.next_in = 0, t.input = R, it(A); A.lookahead >= I; ) {
            for (f = A.strstart, s = A.lookahead - (I - 1); A.ins_h = (A.ins_h << A.hash_shift ^ A.window[f + I - 1]) & A.hash_mask, A.prev[f & A.w_mask] = A.head[A.ins_h], A.head[A.ins_h] = f, f++, --s; ) ;
            A.strstart = f, A.lookahead = I - 1, it(A);
          }
          return A.strstart += A.lookahead, A.block_start = A.strstart, A.insert = A.lookahead, A.lookahead = 0, A.match_length = A.prev_length = I - 1, A.match_available = 0, t.next_in = N, t.input = z, t.avail_in = P, A.wrap = k, i;
        }, v.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(g, D, v) {
        D.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
        };
      }, {}], 48: [function(g, D, v) {
        D.exports = function(u, o) {
          var r, l, p, y, m, b, i, c, n, h, a, d, w, S, x, F, O, L, I, Z, q, _, B, e, T;
          r = u.state, l = u.next_in, e = u.input, p = l + (u.avail_in - 5), y = u.next_out, T = u.output, m = y - (o - u.avail_out), b = y + (u.avail_out - 257), i = r.dmax, c = r.wsize, n = r.whave, h = r.wnext, a = r.window, d = r.hold, w = r.bits, S = r.lencode, x = r.distcode, F = (1 << r.lenbits) - 1, O = (1 << r.distbits) - 1;
          t: do {
            w < 15 && (d += e[l++] << w, w += 8, d += e[l++] << w, w += 8), L = S[d & F];
            e: for (; ; ) {
              if (d >>>= I = L >>> 24, w -= I, (I = L >>> 16 & 255) === 0) T[y++] = 65535 & L;
              else {
                if (!(16 & I)) {
                  if ((64 & I) == 0) {
                    L = S[(65535 & L) + (d & (1 << I) - 1)];
                    continue e;
                  }
                  if (32 & I) {
                    r.mode = 12;
                    break t;
                  }
                  u.msg = "invalid literal/length code", r.mode = 30;
                  break t;
                }
                Z = 65535 & L, (I &= 15) && (w < I && (d += e[l++] << w, w += 8), Z += d & (1 << I) - 1, d >>>= I, w -= I), w < 15 && (d += e[l++] << w, w += 8, d += e[l++] << w, w += 8), L = x[d & O];
                r: for (; ; ) {
                  if (d >>>= I = L >>> 24, w -= I, !(16 & (I = L >>> 16 & 255))) {
                    if ((64 & I) == 0) {
                      L = x[(65535 & L) + (d & (1 << I) - 1)];
                      continue r;
                    }
                    u.msg = "invalid distance code", r.mode = 30;
                    break t;
                  }
                  if (q = 65535 & L, w < (I &= 15) && (d += e[l++] << w, (w += 8) < I && (d += e[l++] << w, w += 8)), i < (q += d & (1 << I) - 1)) {
                    u.msg = "invalid distance too far back", r.mode = 30;
                    break t;
                  }
                  if (d >>>= I, w -= I, (I = y - m) < q) {
                    if (n < (I = q - I) && r.sane) {
                      u.msg = "invalid distance too far back", r.mode = 30;
                      break t;
                    }
                    if (B = a, (_ = 0) === h) {
                      if (_ += c - I, I < Z) {
                        for (Z -= I; T[y++] = a[_++], --I; ) ;
                        _ = y - q, B = T;
                      }
                    } else if (h < I) {
                      if (_ += c + h - I, (I -= h) < Z) {
                        for (Z -= I; T[y++] = a[_++], --I; ) ;
                        if (_ = 0, h < Z) {
                          for (Z -= I = h; T[y++] = a[_++], --I; ) ;
                          _ = y - q, B = T;
                        }
                      }
                    } else if (_ += h - I, I < Z) {
                      for (Z -= I; T[y++] = a[_++], --I; ) ;
                      _ = y - q, B = T;
                    }
                    for (; 2 < Z; ) T[y++] = B[_++], T[y++] = B[_++], T[y++] = B[_++], Z -= 3;
                    Z && (T[y++] = B[_++], 1 < Z && (T[y++] = B[_++]));
                  } else {
                    for (_ = y - q; T[y++] = T[_++], T[y++] = T[_++], T[y++] = T[_++], 2 < (Z -= 3); ) ;
                    Z && (T[y++] = T[_++], 1 < Z && (T[y++] = T[_++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (l < p && y < b);
          l -= Z = w >> 3, d &= (1 << (w -= Z << 3)) - 1, u.next_in = l, u.next_out = y, u.avail_in = l < p ? p - l + 5 : 5 - (l - p), u.avail_out = y < b ? b - y + 257 : 257 - (y - b), r.hold = d, r.bits = w;
        };
      }, {}], 49: [function(g, D, v) {
        var u = g("../utils/common"), o = g("./adler32"), r = g("./crc32"), l = g("./inffast"), p = g("./inftrees"), y = 1, m = 2, b = 0, i = -2, c = 1, n = 852, h = 592;
        function a(_) {
          return (_ >>> 24 & 255) + (_ >>> 8 & 65280) + ((65280 & _) << 8) + ((255 & _) << 24);
        }
        function d() {
          this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new u.Buf16(320), this.work = new u.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function w(_) {
          var B;
          return _ && _.state ? (B = _.state, _.total_in = _.total_out = B.total = 0, _.msg = "", B.wrap && (_.adler = 1 & B.wrap), B.mode = c, B.last = 0, B.havedict = 0, B.dmax = 32768, B.head = null, B.hold = 0, B.bits = 0, B.lencode = B.lendyn = new u.Buf32(n), B.distcode = B.distdyn = new u.Buf32(h), B.sane = 1, B.back = -1, b) : i;
        }
        function S(_) {
          var B;
          return _ && _.state ? ((B = _.state).wsize = 0, B.whave = 0, B.wnext = 0, w(_)) : i;
        }
        function x(_, B) {
          var e, T;
          return _ && _.state ? (T = _.state, B < 0 ? (e = 0, B = -B) : (e = 1 + (B >> 4), B < 48 && (B &= 15)), B && (B < 8 || 15 < B) ? i : (T.window !== null && T.wbits !== B && (T.window = null), T.wrap = e, T.wbits = B, S(_))) : i;
        }
        function F(_, B) {
          var e, T;
          return _ ? (T = new d(), (_.state = T).window = null, (e = x(_, B)) !== b && (_.state = null), e) : i;
        }
        var O, L, I = !0;
        function Z(_) {
          if (I) {
            var B;
            for (O = new u.Buf32(512), L = new u.Buf32(32), B = 0; B < 144; ) _.lens[B++] = 8;
            for (; B < 256; ) _.lens[B++] = 9;
            for (; B < 280; ) _.lens[B++] = 7;
            for (; B < 288; ) _.lens[B++] = 8;
            for (p(y, _.lens, 0, 288, O, 0, _.work, { bits: 9 }), B = 0; B < 32; ) _.lens[B++] = 5;
            p(m, _.lens, 0, 32, L, 0, _.work, { bits: 5 }), I = !1;
          }
          _.lencode = O, _.lenbits = 9, _.distcode = L, _.distbits = 5;
        }
        function q(_, B, e, T) {
          var J, U = _.state;
          return U.window === null && (U.wsize = 1 << U.wbits, U.wnext = 0, U.whave = 0, U.window = new u.Buf8(U.wsize)), T >= U.wsize ? (u.arraySet(U.window, B, e - U.wsize, U.wsize, 0), U.wnext = 0, U.whave = U.wsize) : (T < (J = U.wsize - U.wnext) && (J = T), u.arraySet(U.window, B, e - T, J, U.wnext), (T -= J) ? (u.arraySet(U.window, B, e - T, T, 0), U.wnext = T, U.whave = U.wsize) : (U.wnext += J, U.wnext === U.wsize && (U.wnext = 0), U.whave < U.wsize && (U.whave += J))), 0;
        }
        v.inflateReset = S, v.inflateReset2 = x, v.inflateResetKeep = w, v.inflateInit = function(_) {
          return F(_, 15);
        }, v.inflateInit2 = F, v.inflate = function(_, B) {
          var e, T, J, U, $, j, V, E, C, X, G, H, it, lt, Q, et, ot, at, ct, ht, t, R, A, f, s = 0, k = new u.Buf8(4), P = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!_ || !_.state || !_.output || !_.input && _.avail_in !== 0) return i;
          (e = _.state).mode === 12 && (e.mode = 13), $ = _.next_out, J = _.output, V = _.avail_out, U = _.next_in, T = _.input, j = _.avail_in, E = e.hold, C = e.bits, X = j, G = V, R = b;
          t: for (; ; ) switch (e.mode) {
            case c:
              if (e.wrap === 0) {
                e.mode = 13;
                break;
              }
              for (; C < 16; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              if (2 & e.wrap && E === 35615) {
                k[e.check = 0] = 255 & E, k[1] = E >>> 8 & 255, e.check = r(e.check, k, 2, 0), C = E = 0, e.mode = 2;
                break;
              }
              if (e.flags = 0, e.head && (e.head.done = !1), !(1 & e.wrap) || (((255 & E) << 8) + (E >> 8)) % 31) {
                _.msg = "incorrect header check", e.mode = 30;
                break;
              }
              if ((15 & E) != 8) {
                _.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (C -= 4, t = 8 + (15 & (E >>>= 4)), e.wbits === 0) e.wbits = t;
              else if (t > e.wbits) {
                _.msg = "invalid window size", e.mode = 30;
                break;
              }
              e.dmax = 1 << t, _.adler = e.check = 1, e.mode = 512 & E ? 10 : 12, C = E = 0;
              break;
            case 2:
              for (; C < 16; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              if (e.flags = E, (255 & e.flags) != 8) {
                _.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (57344 & e.flags) {
                _.msg = "unknown header flags set", e.mode = 30;
                break;
              }
              e.head && (e.head.text = E >> 8 & 1), 512 & e.flags && (k[0] = 255 & E, k[1] = E >>> 8 & 255, e.check = r(e.check, k, 2, 0)), C = E = 0, e.mode = 3;
            case 3:
              for (; C < 32; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              e.head && (e.head.time = E), 512 & e.flags && (k[0] = 255 & E, k[1] = E >>> 8 & 255, k[2] = E >>> 16 & 255, k[3] = E >>> 24 & 255, e.check = r(e.check, k, 4, 0)), C = E = 0, e.mode = 4;
            case 4:
              for (; C < 16; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              e.head && (e.head.xflags = 255 & E, e.head.os = E >> 8), 512 & e.flags && (k[0] = 255 & E, k[1] = E >>> 8 & 255, e.check = r(e.check, k, 2, 0)), C = E = 0, e.mode = 5;
            case 5:
              if (1024 & e.flags) {
                for (; C < 16; ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                e.length = E, e.head && (e.head.extra_len = E), 512 & e.flags && (k[0] = 255 & E, k[1] = E >>> 8 & 255, e.check = r(e.check, k, 2, 0)), C = E = 0;
              } else e.head && (e.head.extra = null);
              e.mode = 6;
            case 6:
              if (1024 & e.flags && (j < (H = e.length) && (H = j), H && (e.head && (t = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Array(e.head.extra_len)), u.arraySet(e.head.extra, T, U, H, t)), 512 & e.flags && (e.check = r(e.check, T, H, U)), j -= H, U += H, e.length -= H), e.length)) break t;
              e.length = 0, e.mode = 7;
            case 7:
              if (2048 & e.flags) {
                if (j === 0) break t;
                for (H = 0; t = T[U + H++], e.head && t && e.length < 65536 && (e.head.name += String.fromCharCode(t)), t && H < j; ) ;
                if (512 & e.flags && (e.check = r(e.check, T, H, U)), j -= H, U += H, t) break t;
              } else e.head && (e.head.name = null);
              e.length = 0, e.mode = 8;
            case 8:
              if (4096 & e.flags) {
                if (j === 0) break t;
                for (H = 0; t = T[U + H++], e.head && t && e.length < 65536 && (e.head.comment += String.fromCharCode(t)), t && H < j; ) ;
                if (512 & e.flags && (e.check = r(e.check, T, H, U)), j -= H, U += H, t) break t;
              } else e.head && (e.head.comment = null);
              e.mode = 9;
            case 9:
              if (512 & e.flags) {
                for (; C < 16; ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                if (E !== (65535 & e.check)) {
                  _.msg = "header crc mismatch", e.mode = 30;
                  break;
                }
                C = E = 0;
              }
              e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), _.adler = e.check = 0, e.mode = 12;
              break;
            case 10:
              for (; C < 32; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              _.adler = e.check = a(E), C = E = 0, e.mode = 11;
            case 11:
              if (e.havedict === 0) return _.next_out = $, _.avail_out = V, _.next_in = U, _.avail_in = j, e.hold = E, e.bits = C, 2;
              _.adler = e.check = 1, e.mode = 12;
            case 12:
              if (B === 5 || B === 6) break t;
            case 13:
              if (e.last) {
                E >>>= 7 & C, C -= 7 & C, e.mode = 27;
                break;
              }
              for (; C < 3; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              switch (e.last = 1 & E, C -= 1, 3 & (E >>>= 1)) {
                case 0:
                  e.mode = 14;
                  break;
                case 1:
                  if (Z(e), e.mode = 20, B !== 6) break;
                  E >>>= 2, C -= 2;
                  break t;
                case 2:
                  e.mode = 17;
                  break;
                case 3:
                  _.msg = "invalid block type", e.mode = 30;
              }
              E >>>= 2, C -= 2;
              break;
            case 14:
              for (E >>>= 7 & C, C -= 7 & C; C < 32; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              if ((65535 & E) != (E >>> 16 ^ 65535)) {
                _.msg = "invalid stored block lengths", e.mode = 30;
                break;
              }
              if (e.length = 65535 & E, C = E = 0, e.mode = 15, B === 6) break t;
            case 15:
              e.mode = 16;
            case 16:
              if (H = e.length) {
                if (j < H && (H = j), V < H && (H = V), H === 0) break t;
                u.arraySet(J, T, U, H, $), j -= H, U += H, V -= H, $ += H, e.length -= H;
                break;
              }
              e.mode = 12;
              break;
            case 17:
              for (; C < 14; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              if (e.nlen = 257 + (31 & E), E >>>= 5, C -= 5, e.ndist = 1 + (31 & E), E >>>= 5, C -= 5, e.ncode = 4 + (15 & E), E >>>= 4, C -= 4, 286 < e.nlen || 30 < e.ndist) {
                _.msg = "too many length or distance symbols", e.mode = 30;
                break;
              }
              e.have = 0, e.mode = 18;
            case 18:
              for (; e.have < e.ncode; ) {
                for (; C < 3; ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                e.lens[P[e.have++]] = 7 & E, E >>>= 3, C -= 3;
              }
              for (; e.have < 19; ) e.lens[P[e.have++]] = 0;
              if (e.lencode = e.lendyn, e.lenbits = 7, A = { bits: e.lenbits }, R = p(0, e.lens, 0, 19, e.lencode, 0, e.work, A), e.lenbits = A.bits, R) {
                _.msg = "invalid code lengths set", e.mode = 30;
                break;
              }
              e.have = 0, e.mode = 19;
            case 19:
              for (; e.have < e.nlen + e.ndist; ) {
                for (; et = (s = e.lencode[E & (1 << e.lenbits) - 1]) >>> 16 & 255, ot = 65535 & s, !((Q = s >>> 24) <= C); ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                if (ot < 16) E >>>= Q, C -= Q, e.lens[e.have++] = ot;
                else {
                  if (ot === 16) {
                    for (f = Q + 2; C < f; ) {
                      if (j === 0) break t;
                      j--, E += T[U++] << C, C += 8;
                    }
                    if (E >>>= Q, C -= Q, e.have === 0) {
                      _.msg = "invalid bit length repeat", e.mode = 30;
                      break;
                    }
                    t = e.lens[e.have - 1], H = 3 + (3 & E), E >>>= 2, C -= 2;
                  } else if (ot === 17) {
                    for (f = Q + 3; C < f; ) {
                      if (j === 0) break t;
                      j--, E += T[U++] << C, C += 8;
                    }
                    C -= Q, t = 0, H = 3 + (7 & (E >>>= Q)), E >>>= 3, C -= 3;
                  } else {
                    for (f = Q + 7; C < f; ) {
                      if (j === 0) break t;
                      j--, E += T[U++] << C, C += 8;
                    }
                    C -= Q, t = 0, H = 11 + (127 & (E >>>= Q)), E >>>= 7, C -= 7;
                  }
                  if (e.have + H > e.nlen + e.ndist) {
                    _.msg = "invalid bit length repeat", e.mode = 30;
                    break;
                  }
                  for (; H--; ) e.lens[e.have++] = t;
                }
              }
              if (e.mode === 30) break;
              if (e.lens[256] === 0) {
                _.msg = "invalid code -- missing end-of-block", e.mode = 30;
                break;
              }
              if (e.lenbits = 9, A = { bits: e.lenbits }, R = p(y, e.lens, 0, e.nlen, e.lencode, 0, e.work, A), e.lenbits = A.bits, R) {
                _.msg = "invalid literal/lengths set", e.mode = 30;
                break;
              }
              if (e.distbits = 6, e.distcode = e.distdyn, A = { bits: e.distbits }, R = p(m, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, A), e.distbits = A.bits, R) {
                _.msg = "invalid distances set", e.mode = 30;
                break;
              }
              if (e.mode = 20, B === 6) break t;
            case 20:
              e.mode = 21;
            case 21:
              if (6 <= j && 258 <= V) {
                _.next_out = $, _.avail_out = V, _.next_in = U, _.avail_in = j, e.hold = E, e.bits = C, l(_, G), $ = _.next_out, J = _.output, V = _.avail_out, U = _.next_in, T = _.input, j = _.avail_in, E = e.hold, C = e.bits, e.mode === 12 && (e.back = -1);
                break;
              }
              for (e.back = 0; et = (s = e.lencode[E & (1 << e.lenbits) - 1]) >>> 16 & 255, ot = 65535 & s, !((Q = s >>> 24) <= C); ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              if (et && (240 & et) == 0) {
                for (at = Q, ct = et, ht = ot; et = (s = e.lencode[ht + ((E & (1 << at + ct) - 1) >> at)]) >>> 16 & 255, ot = 65535 & s, !(at + (Q = s >>> 24) <= C); ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                E >>>= at, C -= at, e.back += at;
              }
              if (E >>>= Q, C -= Q, e.back += Q, e.length = ot, et === 0) {
                e.mode = 26;
                break;
              }
              if (32 & et) {
                e.back = -1, e.mode = 12;
                break;
              }
              if (64 & et) {
                _.msg = "invalid literal/length code", e.mode = 30;
                break;
              }
              e.extra = 15 & et, e.mode = 22;
            case 22:
              if (e.extra) {
                for (f = e.extra; C < f; ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                e.length += E & (1 << e.extra) - 1, E >>>= e.extra, C -= e.extra, e.back += e.extra;
              }
              e.was = e.length, e.mode = 23;
            case 23:
              for (; et = (s = e.distcode[E & (1 << e.distbits) - 1]) >>> 16 & 255, ot = 65535 & s, !((Q = s >>> 24) <= C); ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              if ((240 & et) == 0) {
                for (at = Q, ct = et, ht = ot; et = (s = e.distcode[ht + ((E & (1 << at + ct) - 1) >> at)]) >>> 16 & 255, ot = 65535 & s, !(at + (Q = s >>> 24) <= C); ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                E >>>= at, C -= at, e.back += at;
              }
              if (E >>>= Q, C -= Q, e.back += Q, 64 & et) {
                _.msg = "invalid distance code", e.mode = 30;
                break;
              }
              e.offset = ot, e.extra = 15 & et, e.mode = 24;
            case 24:
              if (e.extra) {
                for (f = e.extra; C < f; ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                e.offset += E & (1 << e.extra) - 1, E >>>= e.extra, C -= e.extra, e.back += e.extra;
              }
              if (e.offset > e.dmax) {
                _.msg = "invalid distance too far back", e.mode = 30;
                break;
              }
              e.mode = 25;
            case 25:
              if (V === 0) break t;
              if (H = G - V, e.offset > H) {
                if ((H = e.offset - H) > e.whave && e.sane) {
                  _.msg = "invalid distance too far back", e.mode = 30;
                  break;
                }
                it = H > e.wnext ? (H -= e.wnext, e.wsize - H) : e.wnext - H, H > e.length && (H = e.length), lt = e.window;
              } else lt = J, it = $ - e.offset, H = e.length;
              for (V < H && (H = V), V -= H, e.length -= H; J[$++] = lt[it++], --H; ) ;
              e.length === 0 && (e.mode = 21);
              break;
            case 26:
              if (V === 0) break t;
              J[$++] = e.length, V--, e.mode = 21;
              break;
            case 27:
              if (e.wrap) {
                for (; C < 32; ) {
                  if (j === 0) break t;
                  j--, E |= T[U++] << C, C += 8;
                }
                if (G -= V, _.total_out += G, e.total += G, G && (_.adler = e.check = e.flags ? r(e.check, J, G, $ - G) : o(e.check, J, G, $ - G)), G = V, (e.flags ? E : a(E)) !== e.check) {
                  _.msg = "incorrect data check", e.mode = 30;
                  break;
                }
                C = E = 0;
              }
              e.mode = 28;
            case 28:
              if (e.wrap && e.flags) {
                for (; C < 32; ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                if (E !== (4294967295 & e.total)) {
                  _.msg = "incorrect length check", e.mode = 30;
                  break;
                }
                C = E = 0;
              }
              e.mode = 29;
            case 29:
              R = 1;
              break t;
            case 30:
              R = -3;
              break t;
            case 31:
              return -4;
            case 32:
            default:
              return i;
          }
          return _.next_out = $, _.avail_out = V, _.next_in = U, _.avail_in = j, e.hold = E, e.bits = C, (e.wsize || G !== _.avail_out && e.mode < 30 && (e.mode < 27 || B !== 4)) && q(_, _.output, _.next_out, G - _.avail_out) ? (e.mode = 31, -4) : (X -= _.avail_in, G -= _.avail_out, _.total_in += X, _.total_out += G, e.total += G, e.wrap && G && (_.adler = e.check = e.flags ? r(e.check, J, G, _.next_out - G) : o(e.check, J, G, _.next_out - G)), _.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === 12 ? 128 : 0) + (e.mode === 20 || e.mode === 15 ? 256 : 0), (X == 0 && G === 0 || B === 4) && R === b && (R = -5), R);
        }, v.inflateEnd = function(_) {
          if (!_ || !_.state) return i;
          var B = _.state;
          return B.window && (B.window = null), _.state = null, b;
        }, v.inflateGetHeader = function(_, B) {
          var e;
          return _ && _.state ? (2 & (e = _.state).wrap) == 0 ? i : ((e.head = B).done = !1, b) : i;
        }, v.inflateSetDictionary = function(_, B) {
          var e, T = B.length;
          return _ && _.state ? (e = _.state).wrap !== 0 && e.mode !== 11 ? i : e.mode === 11 && o(1, B, T, 0) !== e.check ? -3 : q(_, B, T, T) ? (e.mode = 31, -4) : (e.havedict = 1, b) : i;
        }, v.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(g, D, v) {
        var u = g("../utils/common"), o = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], r = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], l = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], p = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        D.exports = function(y, m, b, i, c, n, h, a) {
          var d, w, S, x, F, O, L, I, Z, q = a.bits, _ = 0, B = 0, e = 0, T = 0, J = 0, U = 0, $ = 0, j = 0, V = 0, E = 0, C = null, X = 0, G = new u.Buf16(16), H = new u.Buf16(16), it = null, lt = 0;
          for (_ = 0; _ <= 15; _++) G[_] = 0;
          for (B = 0; B < i; B++) G[m[b + B]]++;
          for (J = q, T = 15; 1 <= T && G[T] === 0; T--) ;
          if (T < J && (J = T), T === 0) return c[n++] = 20971520, c[n++] = 20971520, a.bits = 1, 0;
          for (e = 1; e < T && G[e] === 0; e++) ;
          for (J < e && (J = e), _ = j = 1; _ <= 15; _++) if (j <<= 1, (j -= G[_]) < 0) return -1;
          if (0 < j && (y === 0 || T !== 1)) return -1;
          for (H[1] = 0, _ = 1; _ < 15; _++) H[_ + 1] = H[_] + G[_];
          for (B = 0; B < i; B++) m[b + B] !== 0 && (h[H[m[b + B]]++] = B);
          if (O = y === 0 ? (C = it = h, 19) : y === 1 ? (C = o, X -= 257, it = r, lt -= 257, 256) : (C = l, it = p, -1), _ = e, F = n, $ = B = E = 0, S = -1, x = (V = 1 << (U = J)) - 1, y === 1 && 852 < V || y === 2 && 592 < V) return 1;
          for (; ; ) {
            for (L = _ - $, Z = h[B] < O ? (I = 0, h[B]) : h[B] > O ? (I = it[lt + h[B]], C[X + h[B]]) : (I = 96, 0), d = 1 << _ - $, e = w = 1 << U; c[F + (E >> $) + (w -= d)] = L << 24 | I << 16 | Z | 0, w !== 0; ) ;
            for (d = 1 << _ - 1; E & d; ) d >>= 1;
            if (d !== 0 ? (E &= d - 1, E += d) : E = 0, B++, --G[_] == 0) {
              if (_ === T) break;
              _ = m[b + h[B]];
            }
            if (J < _ && (E & x) !== S) {
              for ($ === 0 && ($ = J), F += e, j = 1 << (U = _ - $); U + $ < T && !((j -= G[U + $]) <= 0); ) U++, j <<= 1;
              if (V += 1 << U, y === 1 && 852 < V || y === 2 && 592 < V) return 1;
              c[S = E & x] = J << 24 | U << 16 | F - n | 0;
            }
          }
          return E !== 0 && (c[F + E] = _ - $ << 24 | 64 << 16 | 0), a.bits = J, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(g, D, v) {
        D.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(g, D, v) {
        var u = g("../utils/common"), o = 0, r = 1;
        function l(s) {
          for (var k = s.length; 0 <= --k; ) s[k] = 0;
        }
        var p = 0, y = 29, m = 256, b = m + 1 + y, i = 30, c = 19, n = 2 * b + 1, h = 15, a = 16, d = 7, w = 256, S = 16, x = 17, F = 18, O = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], L = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], I = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], Z = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], q = new Array(2 * (b + 2));
        l(q);
        var _ = new Array(2 * i);
        l(_);
        var B = new Array(512);
        l(B);
        var e = new Array(256);
        l(e);
        var T = new Array(y);
        l(T);
        var J, U, $, j = new Array(i);
        function V(s, k, P, N, z) {
          this.static_tree = s, this.extra_bits = k, this.extra_base = P, this.elems = N, this.max_length = z, this.has_stree = s && s.length;
        }
        function E(s, k) {
          this.dyn_tree = s, this.max_code = 0, this.stat_desc = k;
        }
        function C(s) {
          return s < 256 ? B[s] : B[256 + (s >>> 7)];
        }
        function X(s, k) {
          s.pending_buf[s.pending++] = 255 & k, s.pending_buf[s.pending++] = k >>> 8 & 255;
        }
        function G(s, k, P) {
          s.bi_valid > a - P ? (s.bi_buf |= k << s.bi_valid & 65535, X(s, s.bi_buf), s.bi_buf = k >> a - s.bi_valid, s.bi_valid += P - a) : (s.bi_buf |= k << s.bi_valid & 65535, s.bi_valid += P);
        }
        function H(s, k, P) {
          G(s, P[2 * k], P[2 * k + 1]);
        }
        function it(s, k) {
          for (var P = 0; P |= 1 & s, s >>>= 1, P <<= 1, 0 < --k; ) ;
          return P >>> 1;
        }
        function lt(s, k, P) {
          var N, z, W = new Array(h + 1), K = 0;
          for (N = 1; N <= h; N++) W[N] = K = K + P[N - 1] << 1;
          for (z = 0; z <= k; z++) {
            var M = s[2 * z + 1];
            M !== 0 && (s[2 * z] = it(W[M]++, M));
          }
        }
        function Q(s) {
          var k;
          for (k = 0; k < b; k++) s.dyn_ltree[2 * k] = 0;
          for (k = 0; k < i; k++) s.dyn_dtree[2 * k] = 0;
          for (k = 0; k < c; k++) s.bl_tree[2 * k] = 0;
          s.dyn_ltree[2 * w] = 1, s.opt_len = s.static_len = 0, s.last_lit = s.matches = 0;
        }
        function et(s) {
          8 < s.bi_valid ? X(s, s.bi_buf) : 0 < s.bi_valid && (s.pending_buf[s.pending++] = s.bi_buf), s.bi_buf = 0, s.bi_valid = 0;
        }
        function ot(s, k, P, N) {
          var z = 2 * k, W = 2 * P;
          return s[z] < s[W] || s[z] === s[W] && N[k] <= N[P];
        }
        function at(s, k, P) {
          for (var N = s.heap[P], z = P << 1; z <= s.heap_len && (z < s.heap_len && ot(k, s.heap[z + 1], s.heap[z], s.depth) && z++, !ot(k, N, s.heap[z], s.depth)); ) s.heap[P] = s.heap[z], P = z, z <<= 1;
          s.heap[P] = N;
        }
        function ct(s, k, P) {
          var N, z, W, K, M = 0;
          if (s.last_lit !== 0) for (; N = s.pending_buf[s.d_buf + 2 * M] << 8 | s.pending_buf[s.d_buf + 2 * M + 1], z = s.pending_buf[s.l_buf + M], M++, N === 0 ? H(s, z, k) : (H(s, (W = e[z]) + m + 1, k), (K = O[W]) !== 0 && G(s, z -= T[W], K), H(s, W = C(--N), P), (K = L[W]) !== 0 && G(s, N -= j[W], K)), M < s.last_lit; ) ;
          H(s, w, k);
        }
        function ht(s, k) {
          var P, N, z, W = k.dyn_tree, K = k.stat_desc.static_tree, M = k.stat_desc.has_stree, Y = k.stat_desc.elems, rt = -1;
          for (s.heap_len = 0, s.heap_max = n, P = 0; P < Y; P++) W[2 * P] !== 0 ? (s.heap[++s.heap_len] = rt = P, s.depth[P] = 0) : W[2 * P + 1] = 0;
          for (; s.heap_len < 2; ) W[2 * (z = s.heap[++s.heap_len] = rt < 2 ? ++rt : 0)] = 1, s.depth[z] = 0, s.opt_len--, M && (s.static_len -= K[2 * z + 1]);
          for (k.max_code = rt, P = s.heap_len >> 1; 1 <= P; P--) at(s, W, P);
          for (z = Y; P = s.heap[1], s.heap[1] = s.heap[s.heap_len--], at(s, W, 1), N = s.heap[1], s.heap[--s.heap_max] = P, s.heap[--s.heap_max] = N, W[2 * z] = W[2 * P] + W[2 * N], s.depth[z] = (s.depth[P] >= s.depth[N] ? s.depth[P] : s.depth[N]) + 1, W[2 * P + 1] = W[2 * N + 1] = z, s.heap[1] = z++, at(s, W, 1), 2 <= s.heap_len; ) ;
          s.heap[--s.heap_max] = s.heap[1], (function(tt, ut) {
            var mt, dt, _t, st, bt, kt, pt = ut.dyn_tree, zt = ut.max_code, At = ut.stat_desc.static_tree, It = ut.stat_desc.has_stree, Ot = ut.stat_desc.extra_bits, Ct = ut.stat_desc.extra_base, gt = ut.stat_desc.max_length, vt = 0;
            for (st = 0; st <= h; st++) tt.bl_count[st] = 0;
            for (pt[2 * tt.heap[tt.heap_max] + 1] = 0, mt = tt.heap_max + 1; mt < n; mt++) gt < (st = pt[2 * pt[2 * (dt = tt.heap[mt]) + 1] + 1] + 1) && (st = gt, vt++), pt[2 * dt + 1] = st, zt < dt || (tt.bl_count[st]++, bt = 0, Ct <= dt && (bt = Ot[dt - Ct]), kt = pt[2 * dt], tt.opt_len += kt * (st + bt), It && (tt.static_len += kt * (At[2 * dt + 1] + bt)));
            if (vt !== 0) {
              do {
                for (st = gt - 1; tt.bl_count[st] === 0; ) st--;
                tt.bl_count[st]--, tt.bl_count[st + 1] += 2, tt.bl_count[gt]--, vt -= 2;
              } while (0 < vt);
              for (st = gt; st !== 0; st--) for (dt = tt.bl_count[st]; dt !== 0; ) zt < (_t = tt.heap[--mt]) || (pt[2 * _t + 1] !== st && (tt.opt_len += (st - pt[2 * _t + 1]) * pt[2 * _t], pt[2 * _t + 1] = st), dt--);
            }
          })(s, k), lt(W, rt, s.bl_count);
        }
        function t(s, k, P) {
          var N, z, W = -1, K = k[1], M = 0, Y = 7, rt = 4;
          for (K === 0 && (Y = 138, rt = 3), k[2 * (P + 1) + 1] = 65535, N = 0; N <= P; N++) z = K, K = k[2 * (N + 1) + 1], ++M < Y && z === K || (M < rt ? s.bl_tree[2 * z] += M : z !== 0 ? (z !== W && s.bl_tree[2 * z]++, s.bl_tree[2 * S]++) : M <= 10 ? s.bl_tree[2 * x]++ : s.bl_tree[2 * F]++, W = z, rt = (M = 0) === K ? (Y = 138, 3) : z === K ? (Y = 6, 3) : (Y = 7, 4));
        }
        function R(s, k, P) {
          var N, z, W = -1, K = k[1], M = 0, Y = 7, rt = 4;
          for (K === 0 && (Y = 138, rt = 3), N = 0; N <= P; N++) if (z = K, K = k[2 * (N + 1) + 1], !(++M < Y && z === K)) {
            if (M < rt) for (; H(s, z, s.bl_tree), --M != 0; ) ;
            else z !== 0 ? (z !== W && (H(s, z, s.bl_tree), M--), H(s, S, s.bl_tree), G(s, M - 3, 2)) : M <= 10 ? (H(s, x, s.bl_tree), G(s, M - 3, 3)) : (H(s, F, s.bl_tree), G(s, M - 11, 7));
            W = z, rt = (M = 0) === K ? (Y = 138, 3) : z === K ? (Y = 6, 3) : (Y = 7, 4);
          }
        }
        l(j);
        var A = !1;
        function f(s, k, P, N) {
          G(s, (p << 1) + (N ? 1 : 0), 3), (function(z, W, K, M) {
            et(z), X(z, K), X(z, ~K), u.arraySet(z.pending_buf, z.window, W, K, z.pending), z.pending += K;
          })(s, k, P);
        }
        v._tr_init = function(s) {
          A || ((function() {
            var k, P, N, z, W, K = new Array(h + 1);
            for (z = N = 0; z < y - 1; z++) for (T[z] = N, k = 0; k < 1 << O[z]; k++) e[N++] = z;
            for (e[N - 1] = z, z = W = 0; z < 16; z++) for (j[z] = W, k = 0; k < 1 << L[z]; k++) B[W++] = z;
            for (W >>= 7; z < i; z++) for (j[z] = W << 7, k = 0; k < 1 << L[z] - 7; k++) B[256 + W++] = z;
            for (P = 0; P <= h; P++) K[P] = 0;
            for (k = 0; k <= 143; ) q[2 * k + 1] = 8, k++, K[8]++;
            for (; k <= 255; ) q[2 * k + 1] = 9, k++, K[9]++;
            for (; k <= 279; ) q[2 * k + 1] = 7, k++, K[7]++;
            for (; k <= 287; ) q[2 * k + 1] = 8, k++, K[8]++;
            for (lt(q, b + 1, K), k = 0; k < i; k++) _[2 * k + 1] = 5, _[2 * k] = it(k, 5);
            J = new V(q, O, m + 1, b, h), U = new V(_, L, 0, i, h), $ = new V(new Array(0), I, 0, c, d);
          })(), A = !0), s.l_desc = new E(s.dyn_ltree, J), s.d_desc = new E(s.dyn_dtree, U), s.bl_desc = new E(s.bl_tree, $), s.bi_buf = 0, s.bi_valid = 0, Q(s);
        }, v._tr_stored_block = f, v._tr_flush_block = function(s, k, P, N) {
          var z, W, K = 0;
          0 < s.level ? (s.strm.data_type === 2 && (s.strm.data_type = (function(M) {
            var Y, rt = 4093624447;
            for (Y = 0; Y <= 31; Y++, rt >>>= 1) if (1 & rt && M.dyn_ltree[2 * Y] !== 0) return o;
            if (M.dyn_ltree[18] !== 0 || M.dyn_ltree[20] !== 0 || M.dyn_ltree[26] !== 0) return r;
            for (Y = 32; Y < m; Y++) if (M.dyn_ltree[2 * Y] !== 0) return r;
            return o;
          })(s)), ht(s, s.l_desc), ht(s, s.d_desc), K = (function(M) {
            var Y;
            for (t(M, M.dyn_ltree, M.l_desc.max_code), t(M, M.dyn_dtree, M.d_desc.max_code), ht(M, M.bl_desc), Y = c - 1; 3 <= Y && M.bl_tree[2 * Z[Y] + 1] === 0; Y--) ;
            return M.opt_len += 3 * (Y + 1) + 5 + 5 + 4, Y;
          })(s), z = s.opt_len + 3 + 7 >>> 3, (W = s.static_len + 3 + 7 >>> 3) <= z && (z = W)) : z = W = P + 5, P + 4 <= z && k !== -1 ? f(s, k, P, N) : s.strategy === 4 || W === z ? (G(s, 2 + (N ? 1 : 0), 3), ct(s, q, _)) : (G(s, 4 + (N ? 1 : 0), 3), (function(M, Y, rt, tt) {
            var ut;
            for (G(M, Y - 257, 5), G(M, rt - 1, 5), G(M, tt - 4, 4), ut = 0; ut < tt; ut++) G(M, M.bl_tree[2 * Z[ut] + 1], 3);
            R(M, M.dyn_ltree, Y - 1), R(M, M.dyn_dtree, rt - 1);
          })(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, K + 1), ct(s, s.dyn_ltree, s.dyn_dtree)), Q(s), N && et(s);
        }, v._tr_tally = function(s, k, P) {
          return s.pending_buf[s.d_buf + 2 * s.last_lit] = k >>> 8 & 255, s.pending_buf[s.d_buf + 2 * s.last_lit + 1] = 255 & k, s.pending_buf[s.l_buf + s.last_lit] = 255 & P, s.last_lit++, k === 0 ? s.dyn_ltree[2 * P]++ : (s.matches++, k--, s.dyn_ltree[2 * (e[P] + m + 1)]++, s.dyn_dtree[2 * C(k)]++), s.last_lit === s.lit_bufsize - 1;
        }, v._tr_align = function(s) {
          G(s, 2, 3), H(s, w, q), (function(k) {
            k.bi_valid === 16 ? (X(k, k.bi_buf), k.bi_buf = 0, k.bi_valid = 0) : 8 <= k.bi_valid && (k.pending_buf[k.pending++] = 255 & k.bi_buf, k.bi_buf >>= 8, k.bi_valid -= 8);
          })(s);
        };
      }, { "../utils/common": 41 }], 53: [function(g, D, v) {
        D.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(g, D, v) {
        (function(u) {
          (function(o, r) {
            if (!o.setImmediate) {
              var l, p, y, m, b = 1, i = {}, c = !1, n = o.document, h = Object.getPrototypeOf && Object.getPrototypeOf(o);
              h = h && h.setTimeout ? h : o, l = {}.toString.call(o.process) === "[object process]" ? function(S) {
                process.nextTick(function() {
                  d(S);
                });
              } : (function() {
                if (o.postMessage && !o.importScripts) {
                  var S = !0, x = o.onmessage;
                  return o.onmessage = function() {
                    S = !1;
                  }, o.postMessage("", "*"), o.onmessage = x, S;
                }
              })() ? (m = "setImmediate$" + Math.random() + "$", o.addEventListener ? o.addEventListener("message", w, !1) : o.attachEvent("onmessage", w), function(S) {
                o.postMessage(m + S, "*");
              }) : o.MessageChannel ? ((y = new MessageChannel()).port1.onmessage = function(S) {
                d(S.data);
              }, function(S) {
                y.port2.postMessage(S);
              }) : n && "onreadystatechange" in n.createElement("script") ? (p = n.documentElement, function(S) {
                var x = n.createElement("script");
                x.onreadystatechange = function() {
                  d(S), x.onreadystatechange = null, p.removeChild(x), x = null;
                }, p.appendChild(x);
              }) : function(S) {
                setTimeout(d, 0, S);
              }, h.setImmediate = function(S) {
                typeof S != "function" && (S = new Function("" + S));
                for (var x = new Array(arguments.length - 1), F = 0; F < x.length; F++) x[F] = arguments[F + 1];
                var O = { callback: S, args: x };
                return i[b] = O, l(b), b++;
              }, h.clearImmediate = a;
            }
            function a(S) {
              delete i[S];
            }
            function d(S) {
              if (c) setTimeout(d, 0, S);
              else {
                var x = i[S];
                if (x) {
                  c = !0;
                  try {
                    (function(F) {
                      var O = F.callback, L = F.args;
                      switch (L.length) {
                        case 0:
                          O();
                          break;
                        case 1:
                          O(L[0]);
                          break;
                        case 2:
                          O(L[0], L[1]);
                          break;
                        case 3:
                          O(L[0], L[1], L[2]);
                          break;
                        default:
                          O.apply(r, L);
                      }
                    })(x);
                  } finally {
                    a(S), c = !1;
                  }
                }
              }
            }
            function w(S) {
              S.source === o && typeof S.data == "string" && S.data.indexOf(m) === 0 && d(+S.data.slice(m.length));
            }
          })(typeof self > "u" ? u === void 0 ? this : u : self);
        }).call(this, typeof yt < "u" ? yt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}] }, {}, [10])(10);
    });
  })(xt)), xt.exports;
}
var Tt = Rt();
const Dt = /* @__PURE__ */ Bt(Tt), St = /* @__PURE__ */ new Map();
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (nt) => {
  nt.waitUntil(self.clients.claim());
});
self.addEventListener("message", async (nt) => {
  var ft;
  if (nt.data.type === "CLAIM") {
    await self.clients.claim();
    return;
  }
  if (nt.data.type === "LOAD_ZIP") {
    const { zipBuffer: g, gameId: D } = nt.data, v = await Dt.loadAsync(g), u = /* @__PURE__ */ new Map();
    await Promise.all(
      Object.entries(v.files).map(async ([o, r]) => {
        r.dir || u.set(o, await r.async("arraybuffer"));
      })
    ), St.set(D, u), console.log("gameFiles state: ", St), (ft = nt.source) == null || ft.postMessage({ type: "ZIP_READY", gameId: D });
  }
});
self.addEventListener("fetch", (nt) => {
  const g = new URL(nt.request.url).pathname.match(/\/play-game\/([^/]+)\/(.*)/);
  if (!g)
    return;
  const [, D, v] = g;
  console.log("gameId: ", D, `
filePath: `, v);
  const u = St.get(D), o = u == null ? void 0 : u.get(v);
  if (!o) {
    console.log("file not found! ", o);
    return;
  }
  const r = v.includes("Build/") && v.endsWith(".gz");
  console.log("should decompress?: ", r);
  const l = v.includes(".br");
  console.log("should debrotli?: ", l), nt.respondWith(
    (async () => {
      let p = o;
      if (r)
        try {
          p = await Pt(o), console.log("decompressed successfully, size:", p.byteLength);
        } catch (m) {
          console.warn(`Failed to decompress ${v}:`, m);
        }
      console.log("responding with buffer size:", p.byteLength);
      const y = new Response(new Uint8Array(p), {
        headers: {
          "Content-Type": Ft(v),
          "Cross-Origin-Embedder-Policy": "require-corp",
          "Cross-Origin-Opener-Policy": "same-origin",
          "Cross-Origin-Resource-Policy": "same-origin",
          ...r && {
            "Content-Length": p.byteLength.toString()
          }
        }
      });
      return console.log("response constructed:", y, `
headers:`, [...y.headers.entries()]), y;
    })().catch((p) => (console.error("respondWith failed:", p), new Response("SW error", { status: 500 })))
  );
});
function Ft(nt) {
  var u, o;
  const ft = nt.split("."), g = (u = ft.pop()) == null ? void 0 : u.toLowerCase(), D = (o = ft.pop()) == null ? void 0 : o.toLowerCase(), v = {
    html: "text/html",
    js: "application/javascript",
    wasm: "application/wasm",
    data: "application/octet-stream",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    css: "text/css"
  };
  return v[D ?? ""] ? v[D ?? ""] : v[g ?? ""] ?? "application/octet-stream";
}
async function Pt(nt) {
  const ft = new DecompressionStream("gzip"), g = ft.writable.getWriter(), D = ft.readable.getReader();
  g.write(nt), g.close();
  const v = [];
  for (; ; ) {
    const { done: l, value: p } = await D.read();
    if (l) break;
    v.push(p);
  }
  const u = v.reduce((l, p) => l + p.byteLength, 0), o = new Uint8Array(u);
  let r = 0;
  for (const l of v)
    o.set(l, r), r += l.byteLength;
  return o.buffer;
}

self.addEventListener("push", (event) => {
  let payload = { title: "ARKAD", body: "", url: "/" };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const url = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/";
  event.waitUntil(self.registration.showNotification(payload.title || "ARKAD", {
    body: payload.body || "",
    data: { url },
    icon: "/arkadLight.svg",
    badge: "/arkadDark.svg",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  const target = typeof url === "string" && url.startsWith("/") ? url : "/";

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const matching = clientsList.find((client) => new URL(client.url).pathname === target);
    if (matching) {
      await matching.focus();
      return matching.navigate(target);
    }
    return self.clients.openWindow(target);
  })());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (clientsList[0]) {
      clientsList[0].postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" });
    }
  })());
});
