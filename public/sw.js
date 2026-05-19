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
      return (function g(D, v, l) {
        function o(_, y) {
          if (!v[_]) {
            if (!D[_]) {
              var p = typeof wt == "function" && wt;
              if (!y && p) return p(_, !0);
              if (r) return r(_, !0);
              var b = new Error("Cannot find module '" + _ + "'");
              throw b.code = "MODULE_NOT_FOUND", b;
            }
            var i = v[_] = { exports: {} };
            D[_][0].call(i.exports, function(c) {
              var n = D[_][1][c];
              return o(n || c);
            }, i, i.exports, g, D, v, l);
          }
          return v[_].exports;
        }
        for (var r = typeof wt == "function" && wt, u = 0; u < l.length; u++) o(l[u]);
        return o;
      })({ 1: [function(g, D, v) {
        var l = g("./utils"), o = g("./support"), r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        v.encode = function(u) {
          for (var _, y, p, b, i, c, n, h = [], a = 0, d = u.length, w = d, S = l.getTypeOf(u) !== "string"; a < u.length; ) w = d - a, p = S ? (_ = u[a++], y = a < d ? u[a++] : 0, a < d ? u[a++] : 0) : (_ = u.charCodeAt(a++), y = a < d ? u.charCodeAt(a++) : 0, a < d ? u.charCodeAt(a++) : 0), b = _ >> 2, i = (3 & _) << 4 | y >> 4, c = 1 < w ? (15 & y) << 2 | p >> 6 : 64, n = 2 < w ? 63 & p : 64, h.push(r.charAt(b) + r.charAt(i) + r.charAt(c) + r.charAt(n));
          return h.join("");
        }, v.decode = function(u) {
          var _, y, p, b, i, c, n = 0, h = 0, a = "data:";
          if (u.substr(0, a.length) === a) throw new Error("Invalid base64 input, it looks like a data url.");
          var d, w = 3 * (u = u.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (u.charAt(u.length - 1) === r.charAt(64) && w--, u.charAt(u.length - 2) === r.charAt(64) && w--, w % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (d = o.uint8array ? new Uint8Array(0 | w) : new Array(0 | w); n < u.length; ) _ = r.indexOf(u.charAt(n++)) << 2 | (b = r.indexOf(u.charAt(n++))) >> 4, y = (15 & b) << 4 | (i = r.indexOf(u.charAt(n++))) >> 2, p = (3 & i) << 6 | (c = r.indexOf(u.charAt(n++))), d[h++] = _, i !== 64 && (d[h++] = y), c !== 64 && (d[h++] = p);
          return d;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(g, D, v) {
        var l = g("./external"), o = g("./stream/DataWorker"), r = g("./stream/Crc32Probe"), u = g("./stream/DataLengthProbe");
        function _(y, p, b, i, c) {
          this.compressedSize = y, this.uncompressedSize = p, this.crc32 = b, this.compression = i, this.compressedContent = c;
        }
        _.prototype = { getContentWorker: function() {
          var y = new o(l.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new u("data_length")), p = this;
          return y.on("end", function() {
            if (this.streamInfo.data_length !== p.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), y;
        }, getCompressedWorker: function() {
          return new o(l.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, _.createWorkerFrom = function(y, p, b) {
          return y.pipe(new r()).pipe(new u("uncompressedSize")).pipe(p.compressWorker(b)).pipe(new u("compressedSize")).withStreamInfo("compression", p);
        }, D.exports = _;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(g, D, v) {
        var l = g("./stream/GenericWorker");
        v.STORE = { magic: "\0\0", compressWorker: function() {
          return new l("STORE compression");
        }, uncompressWorker: function() {
          return new l("STORE decompression");
        } }, v.DEFLATE = g("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(g, D, v) {
        var l = g("./utils"), o = (function() {
          for (var r, u = [], _ = 0; _ < 256; _++) {
            r = _;
            for (var y = 0; y < 8; y++) r = 1 & r ? 3988292384 ^ r >>> 1 : r >>> 1;
            u[_] = r;
          }
          return u;
        })();
        D.exports = function(r, u) {
          return r !== void 0 && r.length ? l.getTypeOf(r) !== "string" ? (function(_, y, p, b) {
            var i = o, c = b + p;
            _ ^= -1;
            for (var n = b; n < c; n++) _ = _ >>> 8 ^ i[255 & (_ ^ y[n])];
            return -1 ^ _;
          })(0 | u, r, r.length, 0) : (function(_, y, p, b) {
            var i = o, c = b + p;
            _ ^= -1;
            for (var n = b; n < c; n++) _ = _ >>> 8 ^ i[255 & (_ ^ y.charCodeAt(n))];
            return -1 ^ _;
          })(0 | u, r, r.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(g, D, v) {
        v.base64 = !1, v.binary = !1, v.dir = !1, v.createFolders = !0, v.date = null, v.compression = null, v.compressionOptions = null, v.comment = null, v.unixPermissions = null, v.dosPermissions = null;
      }, {}], 6: [function(g, D, v) {
        var l = null;
        l = typeof Promise < "u" ? Promise : g("lie"), D.exports = { Promise: l };
      }, { lie: 37 }], 7: [function(g, D, v) {
        var l = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Uint32Array < "u", o = g("pako"), r = g("./utils"), u = g("./stream/GenericWorker"), _ = l ? "uint8array" : "array";
        function y(p, b) {
          u.call(this, "FlateWorker/" + p), this._pako = null, this._pakoAction = p, this._pakoOptions = b, this.meta = {};
        }
        v.magic = "\b\0", r.inherits(y, u), y.prototype.processChunk = function(p) {
          this.meta = p.meta, this._pako === null && this._createPako(), this._pako.push(r.transformTo(_, p.data), !1);
        }, y.prototype.flush = function() {
          u.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
        }, y.prototype.cleanUp = function() {
          u.prototype.cleanUp.call(this), this._pako = null;
        }, y.prototype._createPako = function() {
          this._pako = new o[this._pakoAction]({ raw: !0, level: this._pakoOptions.level || -1 });
          var p = this;
          this._pako.onData = function(b) {
            p.push({ data: b, meta: p.meta });
          };
        }, v.compressWorker = function(p) {
          return new y("Deflate", p);
        }, v.uncompressWorker = function() {
          return new y("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(g, D, v) {
        function l(i, c) {
          var n, h = "";
          for (n = 0; n < c; n++) h += String.fromCharCode(255 & i), i >>>= 8;
          return h;
        }
        function o(i, c, n, h, a, d) {
          var w, S, x = i.file, F = i.compression, O = d !== _.utf8encode, L = r.transformTo("string", d(x.name)), I = r.transformTo("string", _.utf8encode(x.name)), Z = x.comment, q = r.transformTo("string", d(Z)), m = r.transformTo("string", _.utf8encode(Z)), B = I.length !== x.name.length, e = m.length !== Z.length, T = "", J = "", U = "", $ = x.dir, j = x.date, V = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          c && !n || (V.crc32 = i.crc32, V.compressedSize = i.compressedSize, V.uncompressedSize = i.uncompressedSize);
          var E = 0;
          c && (E |= 8), O || !B && !e || (E |= 2048);
          var C = 0, X = 0;
          $ && (C |= 16), a === "UNIX" ? (X = 798, C |= (function(H, it) {
            var ut = H;
            return H || (ut = it ? 16893 : 33204), (65535 & ut) << 16;
          })(x.unixPermissions, $)) : (X = 20, C |= (function(H) {
            return 63 & (H || 0);
          })(x.dosPermissions)), w = j.getUTCHours(), w <<= 6, w |= j.getUTCMinutes(), w <<= 5, w |= j.getUTCSeconds() / 2, S = j.getUTCFullYear() - 1980, S <<= 4, S |= j.getUTCMonth() + 1, S <<= 5, S |= j.getUTCDate(), B && (J = l(1, 1) + l(y(L), 4) + I, T += "up" + l(J.length, 2) + J), e && (U = l(1, 1) + l(y(q), 4) + m, T += "uc" + l(U.length, 2) + U);
          var G = "";
          return G += `
\0`, G += l(E, 2), G += F.magic, G += l(w, 2), G += l(S, 2), G += l(V.crc32, 4), G += l(V.compressedSize, 4), G += l(V.uncompressedSize, 4), G += l(L.length, 2), G += l(T.length, 2), { fileRecord: p.LOCAL_FILE_HEADER + G + L + T, dirRecord: p.CENTRAL_FILE_HEADER + l(X, 2) + G + l(q.length, 2) + "\0\0\0\0" + l(C, 4) + l(h, 4) + L + T + q };
        }
        var r = g("../utils"), u = g("../stream/GenericWorker"), _ = g("../utf8"), y = g("../crc32"), p = g("../signature");
        function b(i, c, n, h) {
          u.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = c, this.zipPlatform = n, this.encodeFileName = h, this.streamFiles = i, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        r.inherits(b, u), b.prototype.push = function(i) {
          var c = i.meta.percent || 0, n = this.entriesCount, h = this._sources.length;
          this.accumulate ? this.contentBuffer.push(i) : (this.bytesWritten += i.data.length, u.prototype.push.call(this, { data: i.data, meta: { currentFile: this.currentFile, percent: n ? (c + 100 * (n - h - 1)) / n : 100 } }));
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
            return p.DATA_DESCRIPTOR + l(h.crc32, 4) + l(h.compressedSize, 4) + l(h.uncompressedSize, 4);
          })(i), meta: { percent: 100 } });
          else for (this.push({ data: n.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, b.prototype.flush = function() {
          for (var i = this.bytesWritten, c = 0; c < this.dirRecords.length; c++) this.push({ data: this.dirRecords[c], meta: { percent: 100 } });
          var n = this.bytesWritten - i, h = (function(a, d, w, S, x) {
            var F = r.transformTo("string", x(S));
            return p.CENTRAL_DIRECTORY_END + "\0\0\0\0" + l(a, 2) + l(a, 2) + l(d, 4) + l(w, 4) + l(F.length, 2) + F;
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
          return !!u.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0));
        }, b.prototype.error = function(i) {
          var c = this._sources;
          if (!u.prototype.error.call(this, i)) return !1;
          for (var n = 0; n < c.length; n++) try {
            c[n].error(i);
          } catch {
          }
          return !0;
        }, b.prototype.lock = function() {
          u.prototype.lock.call(this);
          for (var i = this._sources, c = 0; c < i.length; c++) i[c].lock();
        }, D.exports = b;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(g, D, v) {
        var l = g("../compressions"), o = g("./ZipFileWorker");
        v.generateWorker = function(r, u, _) {
          var y = new o(u.streamFiles, _, u.platform, u.encodeFileName), p = 0;
          try {
            r.forEach(function(b, i) {
              p++;
              var c = (function(d, w) {
                var S = d || w, x = l[S];
                if (!x) throw new Error(S + " is not a valid compression method !");
                return x;
              })(i.options.compression, u.compression), n = i.options.compressionOptions || u.compressionOptions || {}, h = i.dir, a = i.date;
              i._compressWorker(c, n).withStreamInfo("file", { name: b, dir: h, date: a, comment: i.comment || "", unixPermissions: i.unixPermissions, dosPermissions: i.dosPermissions }).pipe(y);
            }), y.entriesCount = p;
          } catch (b) {
            y.error(b);
          }
          return y;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(g, D, v) {
        function l() {
          if (!(this instanceof l)) return new l();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var o = new l();
            for (var r in this) typeof this[r] != "function" && (o[r] = this[r]);
            return o;
          };
        }
        (l.prototype = g("./object")).loadAsync = g("./load"), l.support = g("./support"), l.defaults = g("./defaults"), l.version = "3.10.1", l.loadAsync = function(o, r) {
          return new l().loadAsync(o, r);
        }, l.external = g("./external"), D.exports = l;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(g, D, v) {
        var l = g("./utils"), o = g("./external"), r = g("./utf8"), u = g("./zipEntries"), _ = g("./stream/Crc32Probe"), y = g("./nodejsUtils");
        function p(b) {
          return new o.Promise(function(i, c) {
            var n = b.decompressed.getContentWorker().pipe(new _());
            n.on("error", function(h) {
              c(h);
            }).on("end", function() {
              n.streamInfo.crc32 !== b.decompressed.crc32 ? c(new Error("Corrupted zip : CRC32 mismatch")) : i();
            }).resume();
          });
        }
        D.exports = function(b, i) {
          var c = this;
          return i = l.extend(i || {}, { base64: !1, checkCRC32: !1, optimizedBinaryString: !1, createFolders: !1, decodeFileName: r.utf8decode }), y.isNode && y.isStream(b) ? o.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : l.prepareContent("the loaded zip file", b, !0, i.optimizedBinaryString, i.base64).then(function(n) {
            var h = new u(i);
            return h.load(n), h;
          }).then(function(n) {
            var h = [o.Promise.resolve(n)], a = n.files;
            if (i.checkCRC32) for (var d = 0; d < a.length; d++) h.push(p(a[d]));
            return o.Promise.all(h);
          }).then(function(n) {
            for (var h = n.shift(), a = h.files, d = 0; d < a.length; d++) {
              var w = a[d], S = w.fileNameStr, x = l.resolve(w.fileNameStr);
              c.file(x, w.decompressed, { binary: !0, optimizedBinaryString: !0, date: w.date, dir: w.dir, comment: w.fileCommentStr.length ? w.fileCommentStr : null, unixPermissions: w.unixPermissions, dosPermissions: w.dosPermissions, createFolders: i.createFolders }), w.dir || (c.file(x).unsafeOriginalName = S);
            }
            return h.zipComment.length && (c.comment = h.zipComment), c;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(g, D, v) {
        var l = g("../utils"), o = g("../stream/GenericWorker");
        function r(u, _) {
          o.call(this, "Nodejs stream input adapter for " + u), this._upstreamEnded = !1, this._bindStream(_);
        }
        l.inherits(r, o), r.prototype._bindStream = function(u) {
          var _ = this;
          (this._stream = u).pause(), u.on("data", function(y) {
            _.push({ data: y, meta: { percent: 0 } });
          }).on("error", function(y) {
            _.isPaused ? this.generatedError = y : _.error(y);
          }).on("end", function() {
            _.isPaused ? _._upstreamEnded = !0 : _.end();
          });
        }, r.prototype.pause = function() {
          return !!o.prototype.pause.call(this) && (this._stream.pause(), !0);
        }, r.prototype.resume = function() {
          return !!o.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
        }, D.exports = r;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(g, D, v) {
        var l = g("readable-stream").Readable;
        function o(r, u, _) {
          l.call(this, u), this._helper = r;
          var y = this;
          r.on("data", function(p, b) {
            y.push(p) || y._helper.pause(), _ && _(b);
          }).on("error", function(p) {
            y.emit("error", p);
          }).on("end", function() {
            y.push(null);
          });
        }
        g("../utils").inherits(o, l), o.prototype._read = function() {
          this._helper.resume();
        }, D.exports = o;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(g, D, v) {
        D.exports = { isNode: typeof Buffer < "u", newBufferFrom: function(l, o) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(l, o);
          if (typeof l == "number") throw new Error('The "data" argument must not be a number');
          return new Buffer(l, o);
        }, allocBuffer: function(l) {
          if (Buffer.alloc) return Buffer.alloc(l);
          var o = new Buffer(l);
          return o.fill(0), o;
        }, isBuffer: function(l) {
          return Buffer.isBuffer(l);
        }, isStream: function(l) {
          return l && typeof l.on == "function" && typeof l.pause == "function" && typeof l.resume == "function";
        } };
      }, {}], 15: [function(g, D, v) {
        function l(x, F, O) {
          var L, I = r.getTypeOf(F), Z = r.extend(O || {}, y);
          Z.date = Z.date || /* @__PURE__ */ new Date(), Z.compression !== null && (Z.compression = Z.compression.toUpperCase()), typeof Z.unixPermissions == "string" && (Z.unixPermissions = parseInt(Z.unixPermissions, 8)), Z.unixPermissions && 16384 & Z.unixPermissions && (Z.dir = !0), Z.dosPermissions && 16 & Z.dosPermissions && (Z.dir = !0), Z.dir && (x = a(x)), Z.createFolders && (L = h(x)) && d.call(this, L, !0);
          var q = I === "string" && Z.binary === !1 && Z.base64 === !1;
          O && O.binary !== void 0 || (Z.binary = !q), (F instanceof p && F.uncompressedSize === 0 || Z.dir || !F || F.length === 0) && (Z.base64 = !1, Z.binary = !0, F = "", Z.compression = "STORE", I = "string");
          var m = null;
          m = F instanceof p || F instanceof u ? F : c.isNode && c.isStream(F) ? new n(x, F) : r.prepareContent(x, F, Z.binary, Z.optimizedBinaryString, Z.base64);
          var B = new b(x, m, Z);
          this.files[x] = B;
        }
        var o = g("./utf8"), r = g("./utils"), u = g("./stream/GenericWorker"), _ = g("./stream/StreamHelper"), y = g("./defaults"), p = g("./compressedObject"), b = g("./zipObject"), i = g("./generate"), c = g("./nodejsUtils"), n = g("./nodejs/NodejsStreamInputAdapter"), h = function(x) {
          x.slice(-1) === "/" && (x = x.substring(0, x.length - 1));
          var F = x.lastIndexOf("/");
          return 0 < F ? x.substring(0, F) : "";
        }, a = function(x) {
          return x.slice(-1) !== "/" && (x += "/"), x;
        }, d = function(x, F) {
          return F = F !== void 0 ? F : y.createFolders, x = a(x), this.files[x] || l.call(this, x, null, { dir: !0, createFolders: F }), this.files[x];
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
          if (arguments.length !== 1) return x = this.root + x, l.call(this, x, F, O), this;
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
            (F = new u("error")).error(I);
          }
          return new _(F, O.type || "string", O.mimeType);
        }, generateAsync: function(x, F) {
          return this.generateInternalStream(x).accumulate(F);
        }, generateNodeStream: function(x, F) {
          return (x = x || {}).type || (x.type = "nodebuffer"), this.generateInternalStream(x).toNodejsStream(F);
        } };
        D.exports = S;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(g, D, v) {
        D.exports = g("stream");
      }, { stream: void 0 }], 17: [function(g, D, v) {
        var l = g("./DataReader");
        function o(r) {
          l.call(this, r);
          for (var u = 0; u < this.data.length; u++) r[u] = 255 & r[u];
        }
        g("../utils").inherits(o, l), o.prototype.byteAt = function(r) {
          return this.data[this.zero + r];
        }, o.prototype.lastIndexOfSignature = function(r) {
          for (var u = r.charCodeAt(0), _ = r.charCodeAt(1), y = r.charCodeAt(2), p = r.charCodeAt(3), b = this.length - 4; 0 <= b; --b) if (this.data[b] === u && this.data[b + 1] === _ && this.data[b + 2] === y && this.data[b + 3] === p) return b - this.zero;
          return -1;
        }, o.prototype.readAndCheckSignature = function(r) {
          var u = r.charCodeAt(0), _ = r.charCodeAt(1), y = r.charCodeAt(2), p = r.charCodeAt(3), b = this.readData(4);
          return u === b[0] && _ === b[1] && y === b[2] && p === b[3];
        }, o.prototype.readData = function(r) {
          if (this.checkOffset(r), r === 0) return [];
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, u;
        }, D.exports = o;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(g, D, v) {
        var l = g("../utils");
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
          var u, _ = 0;
          for (this.checkOffset(r), u = this.index + r - 1; u >= this.index; u--) _ = (_ << 8) + this.byteAt(u);
          return this.index += r, _;
        }, readString: function(r) {
          return l.transformTo("string", this.readData(r));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var r = this.readInt(4);
          return new Date(Date.UTC(1980 + (r >> 25 & 127), (r >> 21 & 15) - 1, r >> 16 & 31, r >> 11 & 31, r >> 5 & 63, (31 & r) << 1));
        } }, D.exports = o;
      }, { "../utils": 32 }], 19: [function(g, D, v) {
        var l = g("./Uint8ArrayReader");
        function o(r) {
          l.call(this, r);
        }
        g("../utils").inherits(o, l), o.prototype.readData = function(r) {
          this.checkOffset(r);
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, u;
        }, D.exports = o;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(g, D, v) {
        var l = g("./DataReader");
        function o(r) {
          l.call(this, r);
        }
        g("../utils").inherits(o, l), o.prototype.byteAt = function(r) {
          return this.data.charCodeAt(this.zero + r);
        }, o.prototype.lastIndexOfSignature = function(r) {
          return this.data.lastIndexOf(r) - this.zero;
        }, o.prototype.readAndCheckSignature = function(r) {
          return r === this.readData(4);
        }, o.prototype.readData = function(r) {
          this.checkOffset(r);
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, u;
        }, D.exports = o;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(g, D, v) {
        var l = g("./ArrayReader");
        function o(r) {
          l.call(this, r);
        }
        g("../utils").inherits(o, l), o.prototype.readData = function(r) {
          if (this.checkOffset(r), r === 0) return new Uint8Array(0);
          var u = this.data.subarray(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, u;
        }, D.exports = o;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(g, D, v) {
        var l = g("../utils"), o = g("../support"), r = g("./ArrayReader"), u = g("./StringReader"), _ = g("./NodeBufferReader"), y = g("./Uint8ArrayReader");
        D.exports = function(p) {
          var b = l.getTypeOf(p);
          return l.checkSupport(b), b !== "string" || o.uint8array ? b === "nodebuffer" ? new _(p) : o.uint8array ? new y(l.transformTo("uint8array", p)) : new r(l.transformTo("array", p)) : new u(p);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(g, D, v) {
        v.LOCAL_FILE_HEADER = "PK", v.CENTRAL_FILE_HEADER = "PK", v.CENTRAL_DIRECTORY_END = "PK", v.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", v.ZIP64_CENTRAL_DIRECTORY_END = "PK", v.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(g, D, v) {
        var l = g("./GenericWorker"), o = g("../utils");
        function r(u) {
          l.call(this, "ConvertWorker to " + u), this.destType = u;
        }
        o.inherits(r, l), r.prototype.processChunk = function(u) {
          this.push({ data: o.transformTo(this.destType, u.data), meta: u.meta });
        }, D.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(g, D, v) {
        var l = g("./GenericWorker"), o = g("../crc32");
        function r() {
          l.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        g("../utils").inherits(r, l), r.prototype.processChunk = function(u) {
          this.streamInfo.crc32 = o(u.data, this.streamInfo.crc32 || 0), this.push(u);
        }, D.exports = r;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(g, D, v) {
        var l = g("../utils"), o = g("./GenericWorker");
        function r(u) {
          o.call(this, "DataLengthProbe for " + u), this.propName = u, this.withStreamInfo(u, 0);
        }
        l.inherits(r, o), r.prototype.processChunk = function(u) {
          if (u) {
            var _ = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = _ + u.data.length;
          }
          o.prototype.processChunk.call(this, u);
        }, D.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(g, D, v) {
        var l = g("../utils"), o = g("./GenericWorker");
        function r(u) {
          o.call(this, "DataWorker");
          var _ = this;
          this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, u.then(function(y) {
            _.dataIsReady = !0, _.data = y, _.max = y && y.length || 0, _.type = l.getTypeOf(y), _.isPaused || _._tickAndRepeat();
          }, function(y) {
            _.error(y);
          });
        }
        l.inherits(r, o), r.prototype.cleanUp = function() {
          o.prototype.cleanUp.call(this), this.data = null;
        }, r.prototype.resume = function() {
          return !!o.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, l.delay(this._tickAndRepeat, [], this)), !0);
        }, r.prototype._tickAndRepeat = function() {
          this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (l.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
        }, r.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return !1;
          var u = null, _ = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              u = this.data.substring(this.index, _);
              break;
            case "uint8array":
              u = this.data.subarray(this.index, _);
              break;
            case "array":
            case "nodebuffer":
              u = this.data.slice(this.index, _);
          }
          return this.index = _, this.push({ data: u, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, D.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(g, D, v) {
        function l(o) {
          this.name = o || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        l.prototype = { push: function(o) {
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
          if (this._listeners[o]) for (var u = 0; u < this._listeners[o].length; u++) this._listeners[o][u].call(this, r);
        }, pipe: function(o) {
          return o.registerPrevious(this);
        }, registerPrevious: function(o) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = o.streamInfo, this.mergeStreamInfo(), this.previous = o;
          var r = this;
          return o.on("data", function(u) {
            r.processChunk(u);
          }), o.on("end", function() {
            r.end();
          }), o.on("error", function(u) {
            r.error(u);
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
        } }, D.exports = l;
      }, {}], 29: [function(g, D, v) {
        var l = g("../utils"), o = g("./ConvertWorker"), r = g("./GenericWorker"), u = g("../base64"), _ = g("../support"), y = g("../external"), p = null;
        if (_.nodestream) try {
          p = g("../nodejs/NodejsStreamOutputAdapter");
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
                      return l.newBlob(l.transformTo("arraybuffer", L), I);
                    case "base64":
                      return u.encode(L);
                    default:
                      return l.transformTo(O, L);
                  }
                })(S, (function(O, L) {
                  var I, Z = 0, q = null, m = 0;
                  for (I = 0; I < L.length; I++) m += L[I].length;
                  switch (O) {
                    case "string":
                      return L.join("");
                    case "array":
                      return Array.prototype.concat.apply([], L);
                    case "uint8array":
                      for (q = new Uint8Array(m), I = 0; I < L.length; I++) q.set(L[I], Z), Z += L[I].length;
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
            this._internalType = a, this._outputType = n, this._mimeType = h, l.checkSupport(a), this._worker = c.pipe(new o(a)), c.lock();
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
            l.delay(n, arguments, h);
          }), this;
        }, resume: function() {
          return l.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(c) {
          if (l.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
          return new p(this, { objectMode: this._outputType !== "nodebuffer" }, c);
        } }, D.exports = i;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(g, D, v) {
        if (v.base64 = !0, v.array = !0, v.string = !0, v.arraybuffer = typeof ArrayBuffer < "u" && typeof Uint8Array < "u", v.nodebuffer = typeof Buffer < "u", v.uint8array = typeof Uint8Array < "u", typeof ArrayBuffer > "u") v.blob = !1;
        else {
          var l = new ArrayBuffer(0);
          try {
            v.blob = new Blob([l], { type: "application/zip" }).size === 0;
          } catch {
            try {
              var o = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              o.append(l), v.blob = o.getBlob("application/zip").size === 0;
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
        for (var l = g("./utils"), o = g("./support"), r = g("./nodejsUtils"), u = g("./stream/GenericWorker"), _ = new Array(256), y = 0; y < 256; y++) _[y] = 252 <= y ? 6 : 248 <= y ? 5 : 240 <= y ? 4 : 224 <= y ? 3 : 192 <= y ? 2 : 1;
        _[254] = _[254] = 1;
        function p() {
          u.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function b() {
          u.call(this, "utf-8 encode");
        }
        v.utf8encode = function(i) {
          return o.nodebuffer ? r.newBufferFrom(i, "utf-8") : (function(c) {
            var n, h, a, d, w, S = c.length, x = 0;
            for (d = 0; d < S; d++) (64512 & (h = c.charCodeAt(d))) == 55296 && d + 1 < S && (64512 & (a = c.charCodeAt(d + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (a - 56320), d++), x += h < 128 ? 1 : h < 2048 ? 2 : h < 65536 ? 3 : 4;
            for (n = o.uint8array ? new Uint8Array(x) : new Array(x), d = w = 0; w < x; d++) (64512 & (h = c.charCodeAt(d))) == 55296 && d + 1 < S && (64512 & (a = c.charCodeAt(d + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (a - 56320), d++), h < 128 ? n[w++] = h : (h < 2048 ? n[w++] = 192 | h >>> 6 : (h < 65536 ? n[w++] = 224 | h >>> 12 : (n[w++] = 240 | h >>> 18, n[w++] = 128 | h >>> 12 & 63), n[w++] = 128 | h >>> 6 & 63), n[w++] = 128 | 63 & h);
            return n;
          })(i);
        }, v.utf8decode = function(i) {
          return o.nodebuffer ? l.transformTo("nodebuffer", i).toString("utf-8") : (function(c) {
            var n, h, a, d, w = c.length, S = new Array(2 * w);
            for (n = h = 0; n < w; ) if ((a = c[n++]) < 128) S[h++] = a;
            else if (4 < (d = _[a])) S[h++] = 65533, n += d - 1;
            else {
              for (a &= d === 2 ? 31 : d === 3 ? 15 : 7; 1 < d && n < w; ) a = a << 6 | 63 & c[n++], d--;
              1 < d ? S[h++] = 65533 : a < 65536 ? S[h++] = a : (a -= 65536, S[h++] = 55296 | a >> 10 & 1023, S[h++] = 56320 | 1023 & a);
            }
            return S.length !== h && (S.subarray ? S = S.subarray(0, h) : S.length = h), l.applyFromCharCode(S);
          })(i = l.transformTo(o.uint8array ? "uint8array" : "array", i));
        }, l.inherits(p, u), p.prototype.processChunk = function(i) {
          var c = l.transformTo(o.uint8array ? "uint8array" : "array", i.data);
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
            return S < 0 || S === 0 ? w : S + _[d[S]] > w ? S : w;
          })(c), a = c;
          h !== c.length && (o.uint8array ? (a = c.subarray(0, h), this.leftOver = c.subarray(h, c.length)) : (a = c.slice(0, h), this.leftOver = c.slice(h, c.length))), this.push({ data: v.utf8decode(a), meta: i.meta });
        }, p.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: v.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, v.Utf8DecodeWorker = p, l.inherits(b, u), b.prototype.processChunk = function(i) {
          this.push({ data: v.utf8encode(i.data), meta: i.meta });
        }, v.Utf8EncodeWorker = b;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(g, D, v) {
        var l = g("./support"), o = g("./base64"), r = g("./nodejsUtils"), u = g("./external");
        function _(n) {
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
        var p = { stringifyByChunk: function(n, h, a) {
          var d = [], w = 0, S = n.length;
          if (S <= a) return String.fromCharCode.apply(null, n);
          for (; w < S; ) h === "array" || h === "nodebuffer" ? d.push(String.fromCharCode.apply(null, n.slice(w, Math.min(w + a, S)))) : d.push(String.fromCharCode.apply(null, n.subarray(w, Math.min(w + a, S)))), w += a;
          return d.join("");
        }, stringifyByChar: function(n) {
          for (var h = "", a = 0; a < n.length; a++) h += String.fromCharCode(n[a]);
          return h;
        }, applyCanBeUsed: { uint8array: (function() {
          try {
            return l.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
          } catch {
            return !1;
          }
        })(), nodebuffer: (function() {
          try {
            return l.nodebuffer && String.fromCharCode.apply(null, r.allocBuffer(1)).length === 1;
          } catch {
            return !1;
          }
        })() } };
        function b(n) {
          var h = 65536, a = v.getTypeOf(n), d = !0;
          if (a === "uint8array" ? d = p.applyCanBeUsed.uint8array : a === "nodebuffer" && (d = p.applyCanBeUsed.nodebuffer), d) for (; 1 < h; ) try {
            return p.stringifyByChunk(n, a, h);
          } catch {
            h = Math.floor(h / 2);
          }
          return p.stringifyByChar(n);
        }
        function i(n, h) {
          for (var a = 0; a < n.length; a++) h[a] = n[a];
          return h;
        }
        v.applyFromCharCode = b;
        var c = {};
        c.string = { string: _, array: function(n) {
          return y(n, new Array(n.length));
        }, arraybuffer: function(n) {
          return c.string.uint8array(n).buffer;
        }, uint8array: function(n) {
          return y(n, new Uint8Array(n.length));
        }, nodebuffer: function(n) {
          return y(n, r.allocBuffer(n.length));
        } }, c.array = { string: b, array: _, arraybuffer: function(n) {
          return new Uint8Array(n).buffer;
        }, uint8array: function(n) {
          return new Uint8Array(n);
        }, nodebuffer: function(n) {
          return r.newBufferFrom(n);
        } }, c.arraybuffer = { string: function(n) {
          return b(new Uint8Array(n));
        }, array: function(n) {
          return i(new Uint8Array(n), new Array(n.byteLength));
        }, arraybuffer: _, uint8array: function(n) {
          return new Uint8Array(n);
        }, nodebuffer: function(n) {
          return r.newBufferFrom(new Uint8Array(n));
        } }, c.uint8array = { string: b, array: function(n) {
          return i(n, new Array(n.length));
        }, arraybuffer: function(n) {
          return n.buffer;
        }, uint8array: _, nodebuffer: function(n) {
          return r.newBufferFrom(n);
        } }, c.nodebuffer = { string: b, array: function(n) {
          return i(n, new Array(n.length));
        }, arraybuffer: function(n) {
          return c.nodebuffer.uint8array(n).buffer;
        }, uint8array: function(n) {
          return i(n, new Uint8Array(n.length));
        }, nodebuffer: _ }, v.transformTo = function(n, h) {
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
          return typeof n == "string" ? "string" : Object.prototype.toString.call(n) === "[object Array]" ? "array" : l.nodebuffer && r.isBuffer(n) ? "nodebuffer" : l.uint8array && n instanceof Uint8Array ? "uint8array" : l.arraybuffer && n instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, v.checkSupport = function(n) {
          if (!l[n.toLowerCase()]) throw new Error(n + " is not supported by this platform");
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
          return u.Promise.resolve(h).then(function(S) {
            return l.blob && (S instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(S)) !== -1) && typeof FileReader < "u" ? new u.Promise(function(x, F) {
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
              return y(F, l.uint8array ? new Uint8Array(F.length) : new Array(F.length));
            })(S))), S) : u.Promise.reject(new Error("Can't read the data of '" + n + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(g, D, v) {
        var l = g("./reader/readerFor"), o = g("./utils"), r = g("./signature"), u = g("./zipEntry"), _ = g("./support");
        function y(p) {
          this.files = [], this.loadOptions = p;
        }
        y.prototype = { checkSignature: function(p) {
          if (!this.reader.readAndCheckSignature(p)) {
            this.reader.index -= 4;
            var b = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + o.pretty(b) + ", expected " + o.pretty(p) + ")");
          }
        }, isSignature: function(p, b) {
          var i = this.reader.index;
          this.reader.setIndex(p);
          var c = this.reader.readString(4) === b;
          return this.reader.setIndex(i), c;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var p = this.reader.readData(this.zipCommentLength), b = _.uint8array ? "uint8array" : "array", i = o.transformTo(b, p);
          this.zipComment = this.loadOptions.decodeFileName(i);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var p, b, i, c = this.zip64EndOfCentralSize - 44; 0 < c; ) p = this.reader.readInt(2), b = this.reader.readInt(4), i = this.reader.readData(b), this.zip64ExtensibleData[p] = { id: p, length: b, value: i };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var p, b;
          for (p = 0; p < this.files.length; p++) b = this.files[p], this.reader.setIndex(b.localHeaderOffset), this.checkSignature(r.LOCAL_FILE_HEADER), b.readLocalPart(this.reader), b.handleUTF8(), b.processAttributes();
        }, readCentralDir: function() {
          var p;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(r.CENTRAL_FILE_HEADER); ) (p = new u({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(p);
          if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var p = this.reader.lastIndexOfSignature(r.CENTRAL_DIRECTORY_END);
          if (p < 0) throw this.isSignature(0, r.LOCAL_FILE_HEADER) ? new Error("Corrupted zip: can't find end of central directory") : new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
          this.reader.setIndex(p);
          var b = p;
          if (this.checkSignature(r.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === o.MAX_VALUE_16BITS || this.diskWithCentralDirStart === o.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === o.MAX_VALUE_16BITS || this.centralDirRecords === o.MAX_VALUE_16BITS || this.centralDirSize === o.MAX_VALUE_32BITS || this.centralDirOffset === o.MAX_VALUE_32BITS) {
            if (this.zip64 = !0, (p = this.reader.lastIndexOfSignature(r.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(p), this.checkSignature(r.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, r.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(r.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(r.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var i = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (i += 20, i += 12 + this.zip64EndOfCentralSize);
          var c = b - i;
          if (0 < c) this.isSignature(b, r.CENTRAL_FILE_HEADER) || (this.reader.zero = c);
          else if (c < 0) throw new Error("Corrupted zip: missing " + Math.abs(c) + " bytes.");
        }, prepareReader: function(p) {
          this.reader = l(p);
        }, load: function(p) {
          this.prepareReader(p), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, D.exports = y;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(g, D, v) {
        var l = g("./reader/readerFor"), o = g("./utils"), r = g("./compressedObject"), u = g("./crc32"), _ = g("./utf8"), y = g("./compressions"), p = g("./support");
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
            var i = l(this.extraFields[1].value);
            this.uncompressedSize === o.MAX_VALUE_32BITS && (this.uncompressedSize = i.readInt(8)), this.compressedSize === o.MAX_VALUE_32BITS && (this.compressedSize = i.readInt(8)), this.localHeaderOffset === o.MAX_VALUE_32BITS && (this.localHeaderOffset = i.readInt(8)), this.diskNumberStart === o.MAX_VALUE_32BITS && (this.diskNumberStart = i.readInt(4));
          }
        }, readExtraFields: function(i) {
          var c, n, h, a = i.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); i.index + 4 < a; ) c = i.readInt(2), n = i.readInt(2), h = i.readData(n), this.extraFields[c] = { id: c, length: n, value: h };
          i.setIndex(a);
        }, handleUTF8: function() {
          var i = p.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = _.utf8decode(this.fileName), this.fileCommentStr = _.utf8decode(this.fileComment);
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
            var c = l(i.value);
            return c.readInt(1) !== 1 || u(this.fileName) !== c.readInt(4) ? null : _.utf8decode(c.readData(i.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var i = this.extraFields[25461];
          if (i) {
            var c = l(i.value);
            return c.readInt(1) !== 1 || u(this.fileComment) !== c.readInt(4) ? null : _.utf8decode(c.readData(i.length - 5));
          }
          return null;
        } }, D.exports = b;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(g, D, v) {
        function l(c, n, h) {
          this.name = c, this.dir = h.dir, this.date = h.date, this.comment = h.comment, this.unixPermissions = h.unixPermissions, this.dosPermissions = h.dosPermissions, this._data = n, this._dataBinary = h.binary, this.options = { compression: h.compression, compressionOptions: h.compressionOptions };
        }
        var o = g("./stream/StreamHelper"), r = g("./stream/DataWorker"), u = g("./utf8"), _ = g("./compressedObject"), y = g("./stream/GenericWorker");
        l.prototype = { internalStream: function(c) {
          var n = null, h = "string";
          try {
            if (!c) throw new Error("No output type specified.");
            var a = (h = c.toLowerCase()) === "string" || h === "text";
            h !== "binarystring" && h !== "text" || (h = "string"), n = this._decompressWorker();
            var d = !this._dataBinary;
            d && !a && (n = n.pipe(new u.Utf8EncodeWorker())), !d && a && (n = n.pipe(new u.Utf8DecodeWorker()));
          } catch (w) {
            (n = new y("error")).error(w);
          }
          return new o(n, h, "");
        }, async: function(c, n) {
          return this.internalStream(c).accumulate(n);
        }, nodeStream: function(c, n) {
          return this.internalStream(c || "nodebuffer").toNodejsStream(n);
        }, _compressWorker: function(c, n) {
          if (this._data instanceof _ && this._data.compression.magic === c.magic) return this._data.getCompressedWorker();
          var h = this._decompressWorker();
          return this._dataBinary || (h = h.pipe(new u.Utf8EncodeWorker())), _.createWorkerFrom(h, c, n);
        }, _decompressWorker: function() {
          return this._data instanceof _ ? this._data.getContentWorker() : this._data instanceof y ? this._data : new r(this._data);
        } };
        for (var p = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], b = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, i = 0; i < p.length; i++) l.prototype[p[i]] = b;
        D.exports = l;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(g, D, v) {
        (function(l) {
          var o, r, u = l.MutationObserver || l.WebKitMutationObserver;
          if (u) {
            var _ = 0, y = new u(c), p = l.document.createTextNode("");
            y.observe(p, { characterData: !0 }), o = function() {
              p.data = _ = ++_ % 2;
            };
          } else if (l.setImmediate || l.MessageChannel === void 0) o = "document" in l && "onreadystatechange" in l.document.createElement("script") ? function() {
            var n = l.document.createElement("script");
            n.onreadystatechange = function() {
              c(), n.onreadystatechange = null, n.parentNode.removeChild(n), n = null;
            }, l.document.documentElement.appendChild(n);
          } : function() {
            setTimeout(c, 0);
          };
          else {
            var b = new l.MessageChannel();
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
        var l = g("immediate");
        function o() {
        }
        var r = {}, u = ["REJECTED"], _ = ["FULFILLED"], y = ["PENDING"];
        function p(a) {
          if (typeof a != "function") throw new TypeError("resolver must be a function");
          this.state = y, this.queue = [], this.outcome = void 0, a !== o && n(this, a);
        }
        function b(a, d, w) {
          this.promise = a, typeof d == "function" && (this.onFulfilled = d, this.callFulfilled = this.otherCallFulfilled), typeof w == "function" && (this.onRejected = w, this.callRejected = this.otherCallRejected);
        }
        function i(a, d, w) {
          l(function() {
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
        (D.exports = p).prototype.finally = function(a) {
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
        }, p.prototype.catch = function(a) {
          return this.then(null, a);
        }, p.prototype.then = function(a, d) {
          if (typeof a != "function" && this.state === _ || typeof d != "function" && this.state === u) return this;
          var w = new this.constructor(o);
          return this.state !== y ? i(w, this.state === _ ? a : d, this.outcome) : this.queue.push(new b(w, a, d)), w;
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
            a.state = _, a.outcome = d;
            for (var x = -1, F = a.queue.length; ++x < F; ) a.queue[x].callFulfilled(d);
          }
          return a;
        }, r.reject = function(a, d) {
          a.state = u, a.outcome = d;
          for (var w = -1, S = a.queue.length; ++w < S; ) a.queue[w].callRejected(d);
          return a;
        }, p.resolve = function(a) {
          return a instanceof this ? a : r.resolve(new this(o), a);
        }, p.reject = function(a) {
          var d = new this(o);
          return r.reject(d, a);
        }, p.all = function(a) {
          var d = this;
          if (Object.prototype.toString.call(a) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var w = a.length, S = !1;
          if (!w) return this.resolve([]);
          for (var x = new Array(w), F = 0, O = -1, L = new this(o); ++O < w; ) I(a[O], O);
          return L;
          function I(Z, q) {
            d.resolve(Z).then(function(m) {
              x[q] = m, ++F !== w || S || (S = !0, r.resolve(L, x));
            }, function(m) {
              S || (S = !0, r.reject(L, m));
            });
          }
        }, p.race = function(a) {
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
        var l = {};
        (0, g("./lib/utils/common").assign)(l, g("./lib/deflate"), g("./lib/inflate"), g("./lib/zlib/constants")), D.exports = l;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(g, D, v) {
        var l = g("./zlib/deflate"), o = g("./utils/common"), r = g("./utils/strings"), u = g("./zlib/messages"), _ = g("./zlib/zstream"), y = Object.prototype.toString, p = 0, b = -1, i = 0, c = 8;
        function n(a) {
          if (!(this instanceof n)) return new n(a);
          this.options = o.assign({ level: b, method: c, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: i, to: "" }, a || {});
          var d = this.options;
          d.raw && 0 < d.windowBits ? d.windowBits = -d.windowBits : d.gzip && 0 < d.windowBits && d.windowBits < 16 && (d.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new _(), this.strm.avail_out = 0;
          var w = l.deflateInit2(this.strm, d.level, d.method, d.windowBits, d.memLevel, d.strategy);
          if (w !== p) throw new Error(u[w]);
          if (d.header && l.deflateSetHeader(this.strm, d.header), d.dictionary) {
            var S;
            if (S = typeof d.dictionary == "string" ? r.string2buf(d.dictionary) : y.call(d.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(d.dictionary) : d.dictionary, (w = l.deflateSetDictionary(this.strm, S)) !== p) throw new Error(u[w]);
            this._dict_set = !0;
          }
        }
        function h(a, d) {
          var w = new n(d);
          if (w.push(a, !0), w.err) throw w.msg || u[w.err];
          return w.result;
        }
        n.prototype.push = function(a, d) {
          var w, S, x = this.strm, F = this.options.chunkSize;
          if (this.ended) return !1;
          S = d === ~~d ? d : d === !0 ? 4 : 0, typeof a == "string" ? x.input = r.string2buf(a) : y.call(a) === "[object ArrayBuffer]" ? x.input = new Uint8Array(a) : x.input = a, x.next_in = 0, x.avail_in = x.input.length;
          do {
            if (x.avail_out === 0 && (x.output = new o.Buf8(F), x.next_out = 0, x.avail_out = F), (w = l.deflate(x, S)) !== 1 && w !== p) return this.onEnd(w), !(this.ended = !0);
            x.avail_out !== 0 && (x.avail_in !== 0 || S !== 4 && S !== 2) || (this.options.to === "string" ? this.onData(r.buf2binstring(o.shrinkBuf(x.output, x.next_out))) : this.onData(o.shrinkBuf(x.output, x.next_out)));
          } while ((0 < x.avail_in || x.avail_out === 0) && w !== 1);
          return S === 4 ? (w = l.deflateEnd(this.strm), this.onEnd(w), this.ended = !0, w === p) : S !== 2 || (this.onEnd(p), !(x.avail_out = 0));
        }, n.prototype.onData = function(a) {
          this.chunks.push(a);
        }, n.prototype.onEnd = function(a) {
          a === p && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = a, this.msg = this.strm.msg;
        }, v.Deflate = n, v.deflate = h, v.deflateRaw = function(a, d) {
          return (d = d || {}).raw = !0, h(a, d);
        }, v.gzip = function(a, d) {
          return (d = d || {}).gzip = !0, h(a, d);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(g, D, v) {
        var l = g("./zlib/inflate"), o = g("./utils/common"), r = g("./utils/strings"), u = g("./zlib/constants"), _ = g("./zlib/messages"), y = g("./zlib/zstream"), p = g("./zlib/gzheader"), b = Object.prototype.toString;
        function i(n) {
          if (!(this instanceof i)) return new i(n);
          this.options = o.assign({ chunkSize: 16384, windowBits: 0, to: "" }, n || {});
          var h = this.options;
          h.raw && 0 <= h.windowBits && h.windowBits < 16 && (h.windowBits = -h.windowBits, h.windowBits === 0 && (h.windowBits = -15)), !(0 <= h.windowBits && h.windowBits < 16) || n && n.windowBits || (h.windowBits += 32), 15 < h.windowBits && h.windowBits < 48 && (15 & h.windowBits) == 0 && (h.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new y(), this.strm.avail_out = 0;
          var a = l.inflateInit2(this.strm, h.windowBits);
          if (a !== u.Z_OK) throw new Error(_[a]);
          this.header = new p(), l.inflateGetHeader(this.strm, this.header);
        }
        function c(n, h) {
          var a = new i(h);
          if (a.push(n, !0), a.err) throw a.msg || _[a.err];
          return a.result;
        }
        i.prototype.push = function(n, h) {
          var a, d, w, S, x, F, O = this.strm, L = this.options.chunkSize, I = this.options.dictionary, Z = !1;
          if (this.ended) return !1;
          d = h === ~~h ? h : h === !0 ? u.Z_FINISH : u.Z_NO_FLUSH, typeof n == "string" ? O.input = r.binstring2buf(n) : b.call(n) === "[object ArrayBuffer]" ? O.input = new Uint8Array(n) : O.input = n, O.next_in = 0, O.avail_in = O.input.length;
          do {
            if (O.avail_out === 0 && (O.output = new o.Buf8(L), O.next_out = 0, O.avail_out = L), (a = l.inflate(O, u.Z_NO_FLUSH)) === u.Z_NEED_DICT && I && (F = typeof I == "string" ? r.string2buf(I) : b.call(I) === "[object ArrayBuffer]" ? new Uint8Array(I) : I, a = l.inflateSetDictionary(this.strm, F)), a === u.Z_BUF_ERROR && Z === !0 && (a = u.Z_OK, Z = !1), a !== u.Z_STREAM_END && a !== u.Z_OK) return this.onEnd(a), !(this.ended = !0);
            O.next_out && (O.avail_out !== 0 && a !== u.Z_STREAM_END && (O.avail_in !== 0 || d !== u.Z_FINISH && d !== u.Z_SYNC_FLUSH) || (this.options.to === "string" ? (w = r.utf8border(O.output, O.next_out), S = O.next_out - w, x = r.buf2string(O.output, w), O.next_out = S, O.avail_out = L - S, S && o.arraySet(O.output, O.output, w, S, 0), this.onData(x)) : this.onData(o.shrinkBuf(O.output, O.next_out)))), O.avail_in === 0 && O.avail_out === 0 && (Z = !0);
          } while ((0 < O.avail_in || O.avail_out === 0) && a !== u.Z_STREAM_END);
          return a === u.Z_STREAM_END && (d = u.Z_FINISH), d === u.Z_FINISH ? (a = l.inflateEnd(this.strm), this.onEnd(a), this.ended = !0, a === u.Z_OK) : d !== u.Z_SYNC_FLUSH || (this.onEnd(u.Z_OK), !(O.avail_out = 0));
        }, i.prototype.onData = function(n) {
          this.chunks.push(n);
        }, i.prototype.onEnd = function(n) {
          n === u.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = n, this.msg = this.strm.msg;
        }, v.Inflate = i, v.inflate = c, v.inflateRaw = function(n, h) {
          return (h = h || {}).raw = !0, c(n, h);
        }, v.ungzip = c;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(g, D, v) {
        var l = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
        v.assign = function(u) {
          for (var _ = Array.prototype.slice.call(arguments, 1); _.length; ) {
            var y = _.shift();
            if (y) {
              if (typeof y != "object") throw new TypeError(y + "must be non-object");
              for (var p in y) y.hasOwnProperty(p) && (u[p] = y[p]);
            }
          }
          return u;
        }, v.shrinkBuf = function(u, _) {
          return u.length === _ ? u : u.subarray ? u.subarray(0, _) : (u.length = _, u);
        };
        var o = { arraySet: function(u, _, y, p, b) {
          if (_.subarray && u.subarray) u.set(_.subarray(y, y + p), b);
          else for (var i = 0; i < p; i++) u[b + i] = _[y + i];
        }, flattenChunks: function(u) {
          var _, y, p, b, i, c;
          for (_ = p = 0, y = u.length; _ < y; _++) p += u[_].length;
          for (c = new Uint8Array(p), _ = b = 0, y = u.length; _ < y; _++) i = u[_], c.set(i, b), b += i.length;
          return c;
        } }, r = { arraySet: function(u, _, y, p, b) {
          for (var i = 0; i < p; i++) u[b + i] = _[y + i];
        }, flattenChunks: function(u) {
          return [].concat.apply([], u);
        } };
        v.setTyped = function(u) {
          u ? (v.Buf8 = Uint8Array, v.Buf16 = Uint16Array, v.Buf32 = Int32Array, v.assign(v, o)) : (v.Buf8 = Array, v.Buf16 = Array, v.Buf32 = Array, v.assign(v, r));
        }, v.setTyped(l);
      }, {}], 42: [function(g, D, v) {
        var l = g("./common"), o = !0, r = !0;
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
        for (var u = new l.Buf8(256), _ = 0; _ < 256; _++) u[_] = 252 <= _ ? 6 : 248 <= _ ? 5 : 240 <= _ ? 4 : 224 <= _ ? 3 : 192 <= _ ? 2 : 1;
        function y(p, b) {
          if (b < 65537 && (p.subarray && r || !p.subarray && o)) return String.fromCharCode.apply(null, l.shrinkBuf(p, b));
          for (var i = "", c = 0; c < b; c++) i += String.fromCharCode(p[c]);
          return i;
        }
        u[254] = u[254] = 1, v.string2buf = function(p) {
          var b, i, c, n, h, a = p.length, d = 0;
          for (n = 0; n < a; n++) (64512 & (i = p.charCodeAt(n))) == 55296 && n + 1 < a && (64512 & (c = p.charCodeAt(n + 1))) == 56320 && (i = 65536 + (i - 55296 << 10) + (c - 56320), n++), d += i < 128 ? 1 : i < 2048 ? 2 : i < 65536 ? 3 : 4;
          for (b = new l.Buf8(d), n = h = 0; h < d; n++) (64512 & (i = p.charCodeAt(n))) == 55296 && n + 1 < a && (64512 & (c = p.charCodeAt(n + 1))) == 56320 && (i = 65536 + (i - 55296 << 10) + (c - 56320), n++), i < 128 ? b[h++] = i : (i < 2048 ? b[h++] = 192 | i >>> 6 : (i < 65536 ? b[h++] = 224 | i >>> 12 : (b[h++] = 240 | i >>> 18, b[h++] = 128 | i >>> 12 & 63), b[h++] = 128 | i >>> 6 & 63), b[h++] = 128 | 63 & i);
          return b;
        }, v.buf2binstring = function(p) {
          return y(p, p.length);
        }, v.binstring2buf = function(p) {
          for (var b = new l.Buf8(p.length), i = 0, c = b.length; i < c; i++) b[i] = p.charCodeAt(i);
          return b;
        }, v.buf2string = function(p, b) {
          var i, c, n, h, a = b || p.length, d = new Array(2 * a);
          for (i = c = 0; i < a; ) if ((n = p[i++]) < 128) d[c++] = n;
          else if (4 < (h = u[n])) d[c++] = 65533, i += h - 1;
          else {
            for (n &= h === 2 ? 31 : h === 3 ? 15 : 7; 1 < h && i < a; ) n = n << 6 | 63 & p[i++], h--;
            1 < h ? d[c++] = 65533 : n < 65536 ? d[c++] = n : (n -= 65536, d[c++] = 55296 | n >> 10 & 1023, d[c++] = 56320 | 1023 & n);
          }
          return y(d, c);
        }, v.utf8border = function(p, b) {
          var i;
          for ((b = b || p.length) > p.length && (b = p.length), i = b - 1; 0 <= i && (192 & p[i]) == 128; ) i--;
          return i < 0 || i === 0 ? b : i + u[p[i]] > b ? i : b;
        };
      }, { "./common": 41 }], 43: [function(g, D, v) {
        D.exports = function(l, o, r, u) {
          for (var _ = 65535 & l | 0, y = l >>> 16 & 65535 | 0, p = 0; r !== 0; ) {
            for (r -= p = 2e3 < r ? 2e3 : r; y = y + (_ = _ + o[u++] | 0) | 0, --p; ) ;
            _ %= 65521, y %= 65521;
          }
          return _ | y << 16 | 0;
        };
      }, {}], 44: [function(g, D, v) {
        D.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(g, D, v) {
        var l = (function() {
          for (var o, r = [], u = 0; u < 256; u++) {
            o = u;
            for (var _ = 0; _ < 8; _++) o = 1 & o ? 3988292384 ^ o >>> 1 : o >>> 1;
            r[u] = o;
          }
          return r;
        })();
        D.exports = function(o, r, u, _) {
          var y = l, p = _ + u;
          o ^= -1;
          for (var b = _; b < p; b++) o = o >>> 8 ^ y[255 & (o ^ r[b])];
          return -1 ^ o;
        };
      }, {}], 46: [function(g, D, v) {
        var l, o = g("../utils/common"), r = g("./trees"), u = g("./adler32"), _ = g("./crc32"), y = g("./messages"), p = 0, b = 4, i = 0, c = -2, n = -1, h = 4, a = 2, d = 8, w = 9, S = 286, x = 30, F = 19, O = 2 * S + 1, L = 15, I = 3, Z = 258, q = Z + I + 1, m = 42, B = 113, e = 1, T = 2, J = 3, U = 4;
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
          var A, f, s = t.max_chain_length, k = t.strstart, N = t.prev_length, P = t.nice_match, z = t.strstart > t.w_size - q ? t.strstart - (t.w_size - q) : 0, W = t.window, K = t.w_mask, M = t.prev, Y = t.strstart + Z, rt = W[k + N - 1], tt = W[k + N];
          t.prev_length >= t.good_match && (s >>= 2), P > t.lookahead && (P = t.lookahead);
          do
            if (W[(A = R) + N] === tt && W[A + N - 1] === rt && W[A] === W[k] && W[++A] === W[k + 1]) {
              k += 2, A++;
              do
                ;
              while (W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && k < Y);
              if (f = Z - (Y - k), k = Y - Z, N < f) {
                if (t.match_start = R, P <= (N = f)) break;
                rt = W[k + N - 1], tt = W[k + N];
              }
            }
          while ((R = M[R & K]) > z && --s != 0);
          return N <= t.lookahead ? N : t.lookahead;
        }
        function it(t) {
          var R, A, f, s, k, N, P, z, W, K, M = t.w_size;
          do {
            if (s = t.window_size - t.lookahead - t.strstart, t.strstart >= M + (M - q)) {
              for (o.arraySet(t.window, t.window, M, M, 0), t.match_start -= M, t.strstart -= M, t.block_start -= M, R = A = t.hash_size; f = t.head[--R], t.head[R] = M <= f ? f - M : 0, --A; ) ;
              for (R = A = M; f = t.prev[--R], t.prev[R] = M <= f ? f - M : 0, --A; ) ;
              s += M;
            }
            if (t.strm.avail_in === 0) break;
            if (N = t.strm, P = t.window, z = t.strstart + t.lookahead, W = s, K = void 0, K = N.avail_in, W < K && (K = W), A = K === 0 ? 0 : (N.avail_in -= K, o.arraySet(P, N.input, N.next_in, K, z), N.state.wrap === 1 ? N.adler = u(N.adler, P, K, z) : N.state.wrap === 2 && (N.adler = _(N.adler, P, K, z)), N.next_in += K, N.total_in += K, K), t.lookahead += A, t.lookahead + t.insert >= I) for (k = t.strstart - t.insert, t.ins_h = t.window[k], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[k + 1]) & t.hash_mask; t.insert && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[k + I - 1]) & t.hash_mask, t.prev[k & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = k, k++, t.insert--, !(t.lookahead + t.insert < I)); ) ;
          } while (t.lookahead < q && t.strm.avail_in !== 0);
        }
        function ut(t, R) {
          for (var A, f; ; ) {
            if (t.lookahead < q) {
              if (it(t), t.lookahead < q && R === p) return e;
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
              if (it(t), t.lookahead < q && R === p) return e;
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
          return t && t.state ? (t.total_in = t.total_out = 0, t.data_type = a, (R = t.state).pending = 0, R.pending_out = 0, R.wrap < 0 && (R.wrap = -R.wrap), R.status = R.wrap ? m : B, t.adler = R.wrap === 2 ? 0 : 1, R.last_flush = p, r._tr_init(R), i) : $(t, c);
        }
        function ct(t) {
          var R = at(t);
          return R === i && (function(A) {
            A.window_size = 2 * A.w_size, V(A.head), A.max_lazy_match = l[A.level].max_lazy, A.good_match = l[A.level].good_length, A.nice_match = l[A.level].nice_length, A.max_chain_length = l[A.level].max_chain, A.strstart = 0, A.block_start = 0, A.lookahead = 0, A.insert = 0, A.match_length = A.prev_length = I - 1, A.match_available = 0, A.ins_h = 0;
          })(t.state), R;
        }
        function ht(t, R, A, f, s, k) {
          if (!t) return c;
          var N = 1;
          if (R === n && (R = 6), f < 0 ? (N = 0, f = -f) : 15 < f && (N = 2, f -= 16), s < 1 || w < s || A !== d || f < 8 || 15 < f || R < 0 || 9 < R || k < 0 || h < k) return $(t, c);
          f === 8 && (f = 9);
          var P = new ot();
          return (t.state = P).strm = t, P.wrap = N, P.gzhead = null, P.w_bits = f, P.w_size = 1 << P.w_bits, P.w_mask = P.w_size - 1, P.hash_bits = s + 7, P.hash_size = 1 << P.hash_bits, P.hash_mask = P.hash_size - 1, P.hash_shift = ~~((P.hash_bits + I - 1) / I), P.window = new o.Buf8(2 * P.w_size), P.head = new o.Buf16(P.hash_size), P.prev = new o.Buf16(P.w_size), P.lit_bufsize = 1 << s + 6, P.pending_buf_size = 4 * P.lit_bufsize, P.pending_buf = new o.Buf8(P.pending_buf_size), P.d_buf = 1 * P.lit_bufsize, P.l_buf = 3 * P.lit_bufsize, P.level = R, P.strategy = k, P.method = A, ct(t);
        }
        l = [new et(0, 0, 0, 0, function(t, R) {
          var A = 65535;
          for (A > t.pending_buf_size - 5 && (A = t.pending_buf_size - 5); ; ) {
            if (t.lookahead <= 1) {
              if (it(t), t.lookahead === 0 && R === p) return e;
              if (t.lookahead === 0) break;
            }
            t.strstart += t.lookahead, t.lookahead = 0;
            var f = t.block_start + A;
            if ((t.strstart === 0 || t.strstart >= f) && (t.lookahead = t.strstart - f, t.strstart = f, C(t, !1), t.strm.avail_out === 0) || t.strstart - t.block_start >= t.w_size - q && (C(t, !1), t.strm.avail_out === 0)) return e;
          }
          return t.insert = 0, R === b ? (C(t, !0), t.strm.avail_out === 0 ? J : U) : (t.strstart > t.block_start && (C(t, !1), t.strm.avail_out), e);
        }), new et(4, 4, 8, 4, ut), new et(4, 5, 16, 8, ut), new et(4, 6, 32, 32, ut), new et(4, 4, 16, 16, Q), new et(8, 16, 32, 32, Q), new et(8, 16, 128, 128, Q), new et(8, 32, 128, 256, Q), new et(32, 128, 258, 1024, Q), new et(32, 258, 258, 4096, Q)], v.deflateInit = function(t, R) {
          return ht(t, R, d, 15, 8, 0);
        }, v.deflateInit2 = ht, v.deflateReset = ct, v.deflateResetKeep = at, v.deflateSetHeader = function(t, R) {
          return t && t.state ? t.state.wrap !== 2 ? c : (t.state.gzhead = R, i) : c;
        }, v.deflate = function(t, R) {
          var A, f, s, k;
          if (!t || !t.state || 5 < R || R < 0) return t ? $(t, c) : c;
          if (f = t.state, !t.output || !t.input && t.avail_in !== 0 || f.status === 666 && R !== b) return $(t, t.avail_out === 0 ? -5 : c);
          if (f.strm = t, A = f.last_flush, f.last_flush = R, f.status === m) if (f.wrap === 2) t.adler = 0, X(f, 31), X(f, 139), X(f, 8), f.gzhead ? (X(f, (f.gzhead.text ? 1 : 0) + (f.gzhead.hcrc ? 2 : 0) + (f.gzhead.extra ? 4 : 0) + (f.gzhead.name ? 8 : 0) + (f.gzhead.comment ? 16 : 0)), X(f, 255 & f.gzhead.time), X(f, f.gzhead.time >> 8 & 255), X(f, f.gzhead.time >> 16 & 255), X(f, f.gzhead.time >> 24 & 255), X(f, f.level === 9 ? 2 : 2 <= f.strategy || f.level < 2 ? 4 : 0), X(f, 255 & f.gzhead.os), f.gzhead.extra && f.gzhead.extra.length && (X(f, 255 & f.gzhead.extra.length), X(f, f.gzhead.extra.length >> 8 & 255)), f.gzhead.hcrc && (t.adler = _(t.adler, f.pending_buf, f.pending, 0)), f.gzindex = 0, f.status = 69) : (X(f, 0), X(f, 0), X(f, 0), X(f, 0), X(f, 0), X(f, f.level === 9 ? 2 : 2 <= f.strategy || f.level < 2 ? 4 : 0), X(f, 3), f.status = B);
          else {
            var N = d + (f.w_bits - 8 << 4) << 8;
            N |= (2 <= f.strategy || f.level < 2 ? 0 : f.level < 6 ? 1 : f.level === 6 ? 2 : 3) << 6, f.strstart !== 0 && (N |= 32), N += 31 - N % 31, f.status = B, G(f, N), f.strstart !== 0 && (G(f, t.adler >>> 16), G(f, 65535 & t.adler)), t.adler = 1;
          }
          if (f.status === 69) if (f.gzhead.extra) {
            for (s = f.pending; f.gzindex < (65535 & f.gzhead.extra.length) && (f.pending !== f.pending_buf_size || (f.gzhead.hcrc && f.pending > s && (t.adler = _(t.adler, f.pending_buf, f.pending - s, s)), E(t), s = f.pending, f.pending !== f.pending_buf_size)); ) X(f, 255 & f.gzhead.extra[f.gzindex]), f.gzindex++;
            f.gzhead.hcrc && f.pending > s && (t.adler = _(t.adler, f.pending_buf, f.pending - s, s)), f.gzindex === f.gzhead.extra.length && (f.gzindex = 0, f.status = 73);
          } else f.status = 73;
          if (f.status === 73) if (f.gzhead.name) {
            s = f.pending;
            do {
              if (f.pending === f.pending_buf_size && (f.gzhead.hcrc && f.pending > s && (t.adler = _(t.adler, f.pending_buf, f.pending - s, s)), E(t), s = f.pending, f.pending === f.pending_buf_size)) {
                k = 1;
                break;
              }
              k = f.gzindex < f.gzhead.name.length ? 255 & f.gzhead.name.charCodeAt(f.gzindex++) : 0, X(f, k);
            } while (k !== 0);
            f.gzhead.hcrc && f.pending > s && (t.adler = _(t.adler, f.pending_buf, f.pending - s, s)), k === 0 && (f.gzindex = 0, f.status = 91);
          } else f.status = 91;
          if (f.status === 91) if (f.gzhead.comment) {
            s = f.pending;
            do {
              if (f.pending === f.pending_buf_size && (f.gzhead.hcrc && f.pending > s && (t.adler = _(t.adler, f.pending_buf, f.pending - s, s)), E(t), s = f.pending, f.pending === f.pending_buf_size)) {
                k = 1;
                break;
              }
              k = f.gzindex < f.gzhead.comment.length ? 255 & f.gzhead.comment.charCodeAt(f.gzindex++) : 0, X(f, k);
            } while (k !== 0);
            f.gzhead.hcrc && f.pending > s && (t.adler = _(t.adler, f.pending_buf, f.pending - s, s)), k === 0 && (f.status = 103);
          } else f.status = 103;
          if (f.status === 103 && (f.gzhead.hcrc ? (f.pending + 2 > f.pending_buf_size && E(t), f.pending + 2 <= f.pending_buf_size && (X(f, 255 & t.adler), X(f, t.adler >> 8 & 255), t.adler = 0, f.status = B)) : f.status = B), f.pending !== 0) {
            if (E(t), t.avail_out === 0) return f.last_flush = -1, i;
          } else if (t.avail_in === 0 && j(R) <= j(A) && R !== b) return $(t, -5);
          if (f.status === 666 && t.avail_in !== 0) return $(t, -5);
          if (t.avail_in !== 0 || f.lookahead !== 0 || R !== p && f.status !== 666) {
            var P = f.strategy === 2 ? (function(z, W) {
              for (var K; ; ) {
                if (z.lookahead === 0 && (it(z), z.lookahead === 0)) {
                  if (W === p) return e;
                  break;
                }
                if (z.match_length = 0, K = r._tr_tally(z, 0, z.window[z.strstart]), z.lookahead--, z.strstart++, K && (C(z, !1), z.strm.avail_out === 0)) return e;
              }
              return z.insert = 0, W === b ? (C(z, !0), z.strm.avail_out === 0 ? J : U) : z.last_lit && (C(z, !1), z.strm.avail_out === 0) ? e : T;
            })(f, R) : f.strategy === 3 ? (function(z, W) {
              for (var K, M, Y, rt, tt = z.window; ; ) {
                if (z.lookahead <= Z) {
                  if (it(z), z.lookahead <= Z && W === p) return e;
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
            })(f, R) : l[f.level].func(f, R);
            if (P !== J && P !== U || (f.status = 666), P === e || P === J) return t.avail_out === 0 && (f.last_flush = -1), i;
            if (P === T && (R === 1 ? r._tr_align(f) : R !== 5 && (r._tr_stored_block(f, 0, 0, !1), R === 3 && (V(f.head), f.lookahead === 0 && (f.strstart = 0, f.block_start = 0, f.insert = 0))), E(t), t.avail_out === 0)) return f.last_flush = -1, i;
          }
          return R !== b ? i : f.wrap <= 0 ? 1 : (f.wrap === 2 ? (X(f, 255 & t.adler), X(f, t.adler >> 8 & 255), X(f, t.adler >> 16 & 255), X(f, t.adler >> 24 & 255), X(f, 255 & t.total_in), X(f, t.total_in >> 8 & 255), X(f, t.total_in >> 16 & 255), X(f, t.total_in >> 24 & 255)) : (G(f, t.adler >>> 16), G(f, 65535 & t.adler)), E(t), 0 < f.wrap && (f.wrap = -f.wrap), f.pending !== 0 ? i : 1);
        }, v.deflateEnd = function(t) {
          var R;
          return t && t.state ? (R = t.state.status) !== m && R !== 69 && R !== 73 && R !== 91 && R !== 103 && R !== B && R !== 666 ? $(t, c) : (t.state = null, R === B ? $(t, -3) : i) : c;
        }, v.deflateSetDictionary = function(t, R) {
          var A, f, s, k, N, P, z, W, K = R.length;
          if (!t || !t.state || (k = (A = t.state).wrap) === 2 || k === 1 && A.status !== m || A.lookahead) return c;
          for (k === 1 && (t.adler = u(t.adler, R, K, 0)), A.wrap = 0, K >= A.w_size && (k === 0 && (V(A.head), A.strstart = 0, A.block_start = 0, A.insert = 0), W = new o.Buf8(A.w_size), o.arraySet(W, R, K - A.w_size, A.w_size, 0), R = W, K = A.w_size), N = t.avail_in, P = t.next_in, z = t.input, t.avail_in = K, t.next_in = 0, t.input = R, it(A); A.lookahead >= I; ) {
            for (f = A.strstart, s = A.lookahead - (I - 1); A.ins_h = (A.ins_h << A.hash_shift ^ A.window[f + I - 1]) & A.hash_mask, A.prev[f & A.w_mask] = A.head[A.ins_h], A.head[A.ins_h] = f, f++, --s; ) ;
            A.strstart = f, A.lookahead = I - 1, it(A);
          }
          return A.strstart += A.lookahead, A.block_start = A.strstart, A.insert = A.lookahead, A.lookahead = 0, A.match_length = A.prev_length = I - 1, A.match_available = 0, t.next_in = P, t.input = z, t.avail_in = N, A.wrap = k, i;
        }, v.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(g, D, v) {
        D.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
        };
      }, {}], 48: [function(g, D, v) {
        D.exports = function(l, o) {
          var r, u, _, y, p, b, i, c, n, h, a, d, w, S, x, F, O, L, I, Z, q, m, B, e, T;
          r = l.state, u = l.next_in, e = l.input, _ = u + (l.avail_in - 5), y = l.next_out, T = l.output, p = y - (o - l.avail_out), b = y + (l.avail_out - 257), i = r.dmax, c = r.wsize, n = r.whave, h = r.wnext, a = r.window, d = r.hold, w = r.bits, S = r.lencode, x = r.distcode, F = (1 << r.lenbits) - 1, O = (1 << r.distbits) - 1;
          t: do {
            w < 15 && (d += e[u++] << w, w += 8, d += e[u++] << w, w += 8), L = S[d & F];
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
                  l.msg = "invalid literal/length code", r.mode = 30;
                  break t;
                }
                Z = 65535 & L, (I &= 15) && (w < I && (d += e[u++] << w, w += 8), Z += d & (1 << I) - 1, d >>>= I, w -= I), w < 15 && (d += e[u++] << w, w += 8, d += e[u++] << w, w += 8), L = x[d & O];
                r: for (; ; ) {
                  if (d >>>= I = L >>> 24, w -= I, !(16 & (I = L >>> 16 & 255))) {
                    if ((64 & I) == 0) {
                      L = x[(65535 & L) + (d & (1 << I) - 1)];
                      continue r;
                    }
                    l.msg = "invalid distance code", r.mode = 30;
                    break t;
                  }
                  if (q = 65535 & L, w < (I &= 15) && (d += e[u++] << w, (w += 8) < I && (d += e[u++] << w, w += 8)), i < (q += d & (1 << I) - 1)) {
                    l.msg = "invalid distance too far back", r.mode = 30;
                    break t;
                  }
                  if (d >>>= I, w -= I, (I = y - p) < q) {
                    if (n < (I = q - I) && r.sane) {
                      l.msg = "invalid distance too far back", r.mode = 30;
                      break t;
                    }
                    if (B = a, (m = 0) === h) {
                      if (m += c - I, I < Z) {
                        for (Z -= I; T[y++] = a[m++], --I; ) ;
                        m = y - q, B = T;
                      }
                    } else if (h < I) {
                      if (m += c + h - I, (I -= h) < Z) {
                        for (Z -= I; T[y++] = a[m++], --I; ) ;
                        if (m = 0, h < Z) {
                          for (Z -= I = h; T[y++] = a[m++], --I; ) ;
                          m = y - q, B = T;
                        }
                      }
                    } else if (m += h - I, I < Z) {
                      for (Z -= I; T[y++] = a[m++], --I; ) ;
                      m = y - q, B = T;
                    }
                    for (; 2 < Z; ) T[y++] = B[m++], T[y++] = B[m++], T[y++] = B[m++], Z -= 3;
                    Z && (T[y++] = B[m++], 1 < Z && (T[y++] = B[m++]));
                  } else {
                    for (m = y - q; T[y++] = T[m++], T[y++] = T[m++], T[y++] = T[m++], 2 < (Z -= 3); ) ;
                    Z && (T[y++] = T[m++], 1 < Z && (T[y++] = T[m++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (u < _ && y < b);
          u -= Z = w >> 3, d &= (1 << (w -= Z << 3)) - 1, l.next_in = u, l.next_out = y, l.avail_in = u < _ ? _ - u + 5 : 5 - (u - _), l.avail_out = y < b ? b - y + 257 : 257 - (y - b), r.hold = d, r.bits = w;
        };
      }, {}], 49: [function(g, D, v) {
        var l = g("../utils/common"), o = g("./adler32"), r = g("./crc32"), u = g("./inffast"), _ = g("./inftrees"), y = 1, p = 2, b = 0, i = -2, c = 1, n = 852, h = 592;
        function a(m) {
          return (m >>> 24 & 255) + (m >>> 8 & 65280) + ((65280 & m) << 8) + ((255 & m) << 24);
        }
        function d() {
          this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new l.Buf16(320), this.work = new l.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function w(m) {
          var B;
          return m && m.state ? (B = m.state, m.total_in = m.total_out = B.total = 0, m.msg = "", B.wrap && (m.adler = 1 & B.wrap), B.mode = c, B.last = 0, B.havedict = 0, B.dmax = 32768, B.head = null, B.hold = 0, B.bits = 0, B.lencode = B.lendyn = new l.Buf32(n), B.distcode = B.distdyn = new l.Buf32(h), B.sane = 1, B.back = -1, b) : i;
        }
        function S(m) {
          var B;
          return m && m.state ? ((B = m.state).wsize = 0, B.whave = 0, B.wnext = 0, w(m)) : i;
        }
        function x(m, B) {
          var e, T;
          return m && m.state ? (T = m.state, B < 0 ? (e = 0, B = -B) : (e = 1 + (B >> 4), B < 48 && (B &= 15)), B && (B < 8 || 15 < B) ? i : (T.window !== null && T.wbits !== B && (T.window = null), T.wrap = e, T.wbits = B, S(m))) : i;
        }
        function F(m, B) {
          var e, T;
          return m ? (T = new d(), (m.state = T).window = null, (e = x(m, B)) !== b && (m.state = null), e) : i;
        }
        var O, L, I = !0;
        function Z(m) {
          if (I) {
            var B;
            for (O = new l.Buf32(512), L = new l.Buf32(32), B = 0; B < 144; ) m.lens[B++] = 8;
            for (; B < 256; ) m.lens[B++] = 9;
            for (; B < 280; ) m.lens[B++] = 7;
            for (; B < 288; ) m.lens[B++] = 8;
            for (_(y, m.lens, 0, 288, O, 0, m.work, { bits: 9 }), B = 0; B < 32; ) m.lens[B++] = 5;
            _(p, m.lens, 0, 32, L, 0, m.work, { bits: 5 }), I = !1;
          }
          m.lencode = O, m.lenbits = 9, m.distcode = L, m.distbits = 5;
        }
        function q(m, B, e, T) {
          var J, U = m.state;
          return U.window === null && (U.wsize = 1 << U.wbits, U.wnext = 0, U.whave = 0, U.window = new l.Buf8(U.wsize)), T >= U.wsize ? (l.arraySet(U.window, B, e - U.wsize, U.wsize, 0), U.wnext = 0, U.whave = U.wsize) : (T < (J = U.wsize - U.wnext) && (J = T), l.arraySet(U.window, B, e - T, J, U.wnext), (T -= J) ? (l.arraySet(U.window, B, e - T, T, 0), U.wnext = T, U.whave = U.wsize) : (U.wnext += J, U.wnext === U.wsize && (U.wnext = 0), U.whave < U.wsize && (U.whave += J))), 0;
        }
        v.inflateReset = S, v.inflateReset2 = x, v.inflateResetKeep = w, v.inflateInit = function(m) {
          return F(m, 15);
        }, v.inflateInit2 = F, v.inflate = function(m, B) {
          var e, T, J, U, $, j, V, E, C, X, G, H, it, ut, Q, et, ot, at, ct, ht, t, R, A, f, s = 0, k = new l.Buf8(4), N = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!m || !m.state || !m.output || !m.input && m.avail_in !== 0) return i;
          (e = m.state).mode === 12 && (e.mode = 13), $ = m.next_out, J = m.output, V = m.avail_out, U = m.next_in, T = m.input, j = m.avail_in, E = e.hold, C = e.bits, X = j, G = V, R = b;
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
                m.msg = "incorrect header check", e.mode = 30;
                break;
              }
              if ((15 & E) != 8) {
                m.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (C -= 4, t = 8 + (15 & (E >>>= 4)), e.wbits === 0) e.wbits = t;
              else if (t > e.wbits) {
                m.msg = "invalid window size", e.mode = 30;
                break;
              }
              e.dmax = 1 << t, m.adler = e.check = 1, e.mode = 512 & E ? 10 : 12, C = E = 0;
              break;
            case 2:
              for (; C < 16; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              if (e.flags = E, (255 & e.flags) != 8) {
                m.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (57344 & e.flags) {
                m.msg = "unknown header flags set", e.mode = 30;
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
              if (1024 & e.flags && (j < (H = e.length) && (H = j), H && (e.head && (t = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Array(e.head.extra_len)), l.arraySet(e.head.extra, T, U, H, t)), 512 & e.flags && (e.check = r(e.check, T, H, U)), j -= H, U += H, e.length -= H), e.length)) break t;
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
                  m.msg = "header crc mismatch", e.mode = 30;
                  break;
                }
                C = E = 0;
              }
              e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), m.adler = e.check = 0, e.mode = 12;
              break;
            case 10:
              for (; C < 32; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              m.adler = e.check = a(E), C = E = 0, e.mode = 11;
            case 11:
              if (e.havedict === 0) return m.next_out = $, m.avail_out = V, m.next_in = U, m.avail_in = j, e.hold = E, e.bits = C, 2;
              m.adler = e.check = 1, e.mode = 12;
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
                  m.msg = "invalid block type", e.mode = 30;
              }
              E >>>= 2, C -= 2;
              break;
            case 14:
              for (E >>>= 7 & C, C -= 7 & C; C < 32; ) {
                if (j === 0) break t;
                j--, E += T[U++] << C, C += 8;
              }
              if ((65535 & E) != (E >>> 16 ^ 65535)) {
                m.msg = "invalid stored block lengths", e.mode = 30;
                break;
              }
              if (e.length = 65535 & E, C = E = 0, e.mode = 15, B === 6) break t;
            case 15:
              e.mode = 16;
            case 16:
              if (H = e.length) {
                if (j < H && (H = j), V < H && (H = V), H === 0) break t;
                l.arraySet(J, T, U, H, $), j -= H, U += H, V -= H, $ += H, e.length -= H;
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
                m.msg = "too many length or distance symbols", e.mode = 30;
                break;
              }
              e.have = 0, e.mode = 18;
            case 18:
              for (; e.have < e.ncode; ) {
                for (; C < 3; ) {
                  if (j === 0) break t;
                  j--, E += T[U++] << C, C += 8;
                }
                e.lens[N[e.have++]] = 7 & E, E >>>= 3, C -= 3;
              }
              for (; e.have < 19; ) e.lens[N[e.have++]] = 0;
              if (e.lencode = e.lendyn, e.lenbits = 7, A = { bits: e.lenbits }, R = _(0, e.lens, 0, 19, e.lencode, 0, e.work, A), e.lenbits = A.bits, R) {
                m.msg = "invalid code lengths set", e.mode = 30;
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
                      m.msg = "invalid bit length repeat", e.mode = 30;
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
                    m.msg = "invalid bit length repeat", e.mode = 30;
                    break;
                  }
                  for (; H--; ) e.lens[e.have++] = t;
                }
              }
              if (e.mode === 30) break;
              if (e.lens[256] === 0) {
                m.msg = "invalid code -- missing end-of-block", e.mode = 30;
                break;
              }
              if (e.lenbits = 9, A = { bits: e.lenbits }, R = _(y, e.lens, 0, e.nlen, e.lencode, 0, e.work, A), e.lenbits = A.bits, R) {
                m.msg = "invalid literal/lengths set", e.mode = 30;
                break;
              }
              if (e.distbits = 6, e.distcode = e.distdyn, A = { bits: e.distbits }, R = _(p, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, A), e.distbits = A.bits, R) {
                m.msg = "invalid distances set", e.mode = 30;
                break;
              }
              if (e.mode = 20, B === 6) break t;
            case 20:
              e.mode = 21;
            case 21:
              if (6 <= j && 258 <= V) {
                m.next_out = $, m.avail_out = V, m.next_in = U, m.avail_in = j, e.hold = E, e.bits = C, u(m, G), $ = m.next_out, J = m.output, V = m.avail_out, U = m.next_in, T = m.input, j = m.avail_in, E = e.hold, C = e.bits, e.mode === 12 && (e.back = -1);
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
                m.msg = "invalid literal/length code", e.mode = 30;
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
                m.msg = "invalid distance code", e.mode = 30;
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
                m.msg = "invalid distance too far back", e.mode = 30;
                break;
              }
              e.mode = 25;
            case 25:
              if (V === 0) break t;
              if (H = G - V, e.offset > H) {
                if ((H = e.offset - H) > e.whave && e.sane) {
                  m.msg = "invalid distance too far back", e.mode = 30;
                  break;
                }
                it = H > e.wnext ? (H -= e.wnext, e.wsize - H) : e.wnext - H, H > e.length && (H = e.length), ut = e.window;
              } else ut = J, it = $ - e.offset, H = e.length;
              for (V < H && (H = V), V -= H, e.length -= H; J[$++] = ut[it++], --H; ) ;
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
                if (G -= V, m.total_out += G, e.total += G, G && (m.adler = e.check = e.flags ? r(e.check, J, G, $ - G) : o(e.check, J, G, $ - G)), G = V, (e.flags ? E : a(E)) !== e.check) {
                  m.msg = "incorrect data check", e.mode = 30;
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
                  m.msg = "incorrect length check", e.mode = 30;
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
          return m.next_out = $, m.avail_out = V, m.next_in = U, m.avail_in = j, e.hold = E, e.bits = C, (e.wsize || G !== m.avail_out && e.mode < 30 && (e.mode < 27 || B !== 4)) && q(m, m.output, m.next_out, G - m.avail_out) ? (e.mode = 31, -4) : (X -= m.avail_in, G -= m.avail_out, m.total_in += X, m.total_out += G, e.total += G, e.wrap && G && (m.adler = e.check = e.flags ? r(e.check, J, G, m.next_out - G) : o(e.check, J, G, m.next_out - G)), m.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === 12 ? 128 : 0) + (e.mode === 20 || e.mode === 15 ? 256 : 0), (X == 0 && G === 0 || B === 4) && R === b && (R = -5), R);
        }, v.inflateEnd = function(m) {
          if (!m || !m.state) return i;
          var B = m.state;
          return B.window && (B.window = null), m.state = null, b;
        }, v.inflateGetHeader = function(m, B) {
          var e;
          return m && m.state ? (2 & (e = m.state).wrap) == 0 ? i : ((e.head = B).done = !1, b) : i;
        }, v.inflateSetDictionary = function(m, B) {
          var e, T = B.length;
          return m && m.state ? (e = m.state).wrap !== 0 && e.mode !== 11 ? i : e.mode === 11 && o(1, B, T, 0) !== e.check ? -3 : q(m, B, T, T) ? (e.mode = 31, -4) : (e.havedict = 1, b) : i;
        }, v.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(g, D, v) {
        var l = g("../utils/common"), o = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], r = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], u = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], _ = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        D.exports = function(y, p, b, i, c, n, h, a) {
          var d, w, S, x, F, O, L, I, Z, q = a.bits, m = 0, B = 0, e = 0, T = 0, J = 0, U = 0, $ = 0, j = 0, V = 0, E = 0, C = null, X = 0, G = new l.Buf16(16), H = new l.Buf16(16), it = null, ut = 0;
          for (m = 0; m <= 15; m++) G[m] = 0;
          for (B = 0; B < i; B++) G[p[b + B]]++;
          for (J = q, T = 15; 1 <= T && G[T] === 0; T--) ;
          if (T < J && (J = T), T === 0) return c[n++] = 20971520, c[n++] = 20971520, a.bits = 1, 0;
          for (e = 1; e < T && G[e] === 0; e++) ;
          for (J < e && (J = e), m = j = 1; m <= 15; m++) if (j <<= 1, (j -= G[m]) < 0) return -1;
          if (0 < j && (y === 0 || T !== 1)) return -1;
          for (H[1] = 0, m = 1; m < 15; m++) H[m + 1] = H[m] + G[m];
          for (B = 0; B < i; B++) p[b + B] !== 0 && (h[H[p[b + B]]++] = B);
          if (O = y === 0 ? (C = it = h, 19) : y === 1 ? (C = o, X -= 257, it = r, ut -= 257, 256) : (C = u, it = _, -1), m = e, F = n, $ = B = E = 0, S = -1, x = (V = 1 << (U = J)) - 1, y === 1 && 852 < V || y === 2 && 592 < V) return 1;
          for (; ; ) {
            for (L = m - $, Z = h[B] < O ? (I = 0, h[B]) : h[B] > O ? (I = it[ut + h[B]], C[X + h[B]]) : (I = 96, 0), d = 1 << m - $, e = w = 1 << U; c[F + (E >> $) + (w -= d)] = L << 24 | I << 16 | Z | 0, w !== 0; ) ;
            for (d = 1 << m - 1; E & d; ) d >>= 1;
            if (d !== 0 ? (E &= d - 1, E += d) : E = 0, B++, --G[m] == 0) {
              if (m === T) break;
              m = p[b + h[B]];
            }
            if (J < m && (E & x) !== S) {
              for ($ === 0 && ($ = J), F += e, j = 1 << (U = m - $); U + $ < T && !((j -= G[U + $]) <= 0); ) U++, j <<= 1;
              if (V += 1 << U, y === 1 && 852 < V || y === 2 && 592 < V) return 1;
              c[S = E & x] = J << 24 | U << 16 | F - n | 0;
            }
          }
          return E !== 0 && (c[F + E] = m - $ << 24 | 64 << 16 | 0), a.bits = J, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(g, D, v) {
        D.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(g, D, v) {
        var l = g("../utils/common"), o = 0, r = 1;
        function u(s) {
          for (var k = s.length; 0 <= --k; ) s[k] = 0;
        }
        var _ = 0, y = 29, p = 256, b = p + 1 + y, i = 30, c = 19, n = 2 * b + 1, h = 15, a = 16, d = 7, w = 256, S = 16, x = 17, F = 18, O = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], L = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], I = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], Z = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], q = new Array(2 * (b + 2));
        u(q);
        var m = new Array(2 * i);
        u(m);
        var B = new Array(512);
        u(B);
        var e = new Array(256);
        u(e);
        var T = new Array(y);
        u(T);
        var J, U, $, j = new Array(i);
        function V(s, k, N, P, z) {
          this.static_tree = s, this.extra_bits = k, this.extra_base = N, this.elems = P, this.max_length = z, this.has_stree = s && s.length;
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
        function G(s, k, N) {
          s.bi_valid > a - N ? (s.bi_buf |= k << s.bi_valid & 65535, X(s, s.bi_buf), s.bi_buf = k >> a - s.bi_valid, s.bi_valid += N - a) : (s.bi_buf |= k << s.bi_valid & 65535, s.bi_valid += N);
        }
        function H(s, k, N) {
          G(s, N[2 * k], N[2 * k + 1]);
        }
        function it(s, k) {
          for (var N = 0; N |= 1 & s, s >>>= 1, N <<= 1, 0 < --k; ) ;
          return N >>> 1;
        }
        function ut(s, k, N) {
          var P, z, W = new Array(h + 1), K = 0;
          for (P = 1; P <= h; P++) W[P] = K = K + N[P - 1] << 1;
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
        function ot(s, k, N, P) {
          var z = 2 * k, W = 2 * N;
          return s[z] < s[W] || s[z] === s[W] && P[k] <= P[N];
        }
        function at(s, k, N) {
          for (var P = s.heap[N], z = N << 1; z <= s.heap_len && (z < s.heap_len && ot(k, s.heap[z + 1], s.heap[z], s.depth) && z++, !ot(k, P, s.heap[z], s.depth)); ) s.heap[N] = s.heap[z], N = z, z <<= 1;
          s.heap[N] = P;
        }
        function ct(s, k, N) {
          var P, z, W, K, M = 0;
          if (s.last_lit !== 0) for (; P = s.pending_buf[s.d_buf + 2 * M] << 8 | s.pending_buf[s.d_buf + 2 * M + 1], z = s.pending_buf[s.l_buf + M], M++, P === 0 ? H(s, z, k) : (H(s, (W = e[z]) + p + 1, k), (K = O[W]) !== 0 && G(s, z -= T[W], K), H(s, W = C(--P), N), (K = L[W]) !== 0 && G(s, P -= j[W], K)), M < s.last_lit; ) ;
          H(s, w, k);
        }
        function ht(s, k) {
          var N, P, z, W = k.dyn_tree, K = k.stat_desc.static_tree, M = k.stat_desc.has_stree, Y = k.stat_desc.elems, rt = -1;
          for (s.heap_len = 0, s.heap_max = n, N = 0; N < Y; N++) W[2 * N] !== 0 ? (s.heap[++s.heap_len] = rt = N, s.depth[N] = 0) : W[2 * N + 1] = 0;
          for (; s.heap_len < 2; ) W[2 * (z = s.heap[++s.heap_len] = rt < 2 ? ++rt : 0)] = 1, s.depth[z] = 0, s.opt_len--, M && (s.static_len -= K[2 * z + 1]);
          for (k.max_code = rt, N = s.heap_len >> 1; 1 <= N; N--) at(s, W, N);
          for (z = Y; N = s.heap[1], s.heap[1] = s.heap[s.heap_len--], at(s, W, 1), P = s.heap[1], s.heap[--s.heap_max] = N, s.heap[--s.heap_max] = P, W[2 * z] = W[2 * N] + W[2 * P], s.depth[z] = (s.depth[N] >= s.depth[P] ? s.depth[N] : s.depth[P]) + 1, W[2 * N + 1] = W[2 * P + 1] = z, s.heap[1] = z++, at(s, W, 1), 2 <= s.heap_len; ) ;
          s.heap[--s.heap_max] = s.heap[1], (function(tt, lt) {
            var mt, dt, _t, st, bt, kt, pt = lt.dyn_tree, zt = lt.max_code, At = lt.stat_desc.static_tree, It = lt.stat_desc.has_stree, Ot = lt.stat_desc.extra_bits, Ct = lt.stat_desc.extra_base, gt = lt.stat_desc.max_length, vt = 0;
            for (st = 0; st <= h; st++) tt.bl_count[st] = 0;
            for (pt[2 * tt.heap[tt.heap_max] + 1] = 0, mt = tt.heap_max + 1; mt < n; mt++) gt < (st = pt[2 * pt[2 * (dt = tt.heap[mt]) + 1] + 1] + 1) && (st = gt, vt++), pt[2 * dt + 1] = st, zt < dt || (tt.bl_count[st]++, bt = 0, Ct <= dt && (bt = Ot[dt - Ct]), kt = pt[2 * dt], tt.opt_len += kt * (st + bt), It && (tt.static_len += kt * (At[2 * dt + 1] + bt)));
            if (vt !== 0) {
              do {
                for (st = gt - 1; tt.bl_count[st] === 0; ) st--;
                tt.bl_count[st]--, tt.bl_count[st + 1] += 2, tt.bl_count[gt]--, vt -= 2;
              } while (0 < vt);
              for (st = gt; st !== 0; st--) for (dt = tt.bl_count[st]; dt !== 0; ) zt < (_t = tt.heap[--mt]) || (pt[2 * _t + 1] !== st && (tt.opt_len += (st - pt[2 * _t + 1]) * pt[2 * _t], pt[2 * _t + 1] = st), dt--);
            }
          })(s, k), ut(W, rt, s.bl_count);
        }
        function t(s, k, N) {
          var P, z, W = -1, K = k[1], M = 0, Y = 7, rt = 4;
          for (K === 0 && (Y = 138, rt = 3), k[2 * (N + 1) + 1] = 65535, P = 0; P <= N; P++) z = K, K = k[2 * (P + 1) + 1], ++M < Y && z === K || (M < rt ? s.bl_tree[2 * z] += M : z !== 0 ? (z !== W && s.bl_tree[2 * z]++, s.bl_tree[2 * S]++) : M <= 10 ? s.bl_tree[2 * x]++ : s.bl_tree[2 * F]++, W = z, rt = (M = 0) === K ? (Y = 138, 3) : z === K ? (Y = 6, 3) : (Y = 7, 4));
        }
        function R(s, k, N) {
          var P, z, W = -1, K = k[1], M = 0, Y = 7, rt = 4;
          for (K === 0 && (Y = 138, rt = 3), P = 0; P <= N; P++) if (z = K, K = k[2 * (P + 1) + 1], !(++M < Y && z === K)) {
            if (M < rt) for (; H(s, z, s.bl_tree), --M != 0; ) ;
            else z !== 0 ? (z !== W && (H(s, z, s.bl_tree), M--), H(s, S, s.bl_tree), G(s, M - 3, 2)) : M <= 10 ? (H(s, x, s.bl_tree), G(s, M - 3, 3)) : (H(s, F, s.bl_tree), G(s, M - 11, 7));
            W = z, rt = (M = 0) === K ? (Y = 138, 3) : z === K ? (Y = 6, 3) : (Y = 7, 4);
          }
        }
        u(j);
        var A = !1;
        function f(s, k, N, P) {
          G(s, (_ << 1) + (P ? 1 : 0), 3), (function(z, W, K, M) {
            et(z), X(z, K), X(z, ~K), l.arraySet(z.pending_buf, z.window, W, K, z.pending), z.pending += K;
          })(s, k, N);
        }
        v._tr_init = function(s) {
          A || ((function() {
            var k, N, P, z, W, K = new Array(h + 1);
            for (z = P = 0; z < y - 1; z++) for (T[z] = P, k = 0; k < 1 << O[z]; k++) e[P++] = z;
            for (e[P - 1] = z, z = W = 0; z < 16; z++) for (j[z] = W, k = 0; k < 1 << L[z]; k++) B[W++] = z;
            for (W >>= 7; z < i; z++) for (j[z] = W << 7, k = 0; k < 1 << L[z] - 7; k++) B[256 + W++] = z;
            for (N = 0; N <= h; N++) K[N] = 0;
            for (k = 0; k <= 143; ) q[2 * k + 1] = 8, k++, K[8]++;
            for (; k <= 255; ) q[2 * k + 1] = 9, k++, K[9]++;
            for (; k <= 279; ) q[2 * k + 1] = 7, k++, K[7]++;
            for (; k <= 287; ) q[2 * k + 1] = 8, k++, K[8]++;
            for (ut(q, b + 1, K), k = 0; k < i; k++) m[2 * k + 1] = 5, m[2 * k] = it(k, 5);
            J = new V(q, O, p + 1, b, h), U = new V(m, L, 0, i, h), $ = new V(new Array(0), I, 0, c, d);
          })(), A = !0), s.l_desc = new E(s.dyn_ltree, J), s.d_desc = new E(s.dyn_dtree, U), s.bl_desc = new E(s.bl_tree, $), s.bi_buf = 0, s.bi_valid = 0, Q(s);
        }, v._tr_stored_block = f, v._tr_flush_block = function(s, k, N, P) {
          var z, W, K = 0;
          0 < s.level ? (s.strm.data_type === 2 && (s.strm.data_type = (function(M) {
            var Y, rt = 4093624447;
            for (Y = 0; Y <= 31; Y++, rt >>>= 1) if (1 & rt && M.dyn_ltree[2 * Y] !== 0) return o;
            if (M.dyn_ltree[18] !== 0 || M.dyn_ltree[20] !== 0 || M.dyn_ltree[26] !== 0) return r;
            for (Y = 32; Y < p; Y++) if (M.dyn_ltree[2 * Y] !== 0) return r;
            return o;
          })(s)), ht(s, s.l_desc), ht(s, s.d_desc), K = (function(M) {
            var Y;
            for (t(M, M.dyn_ltree, M.l_desc.max_code), t(M, M.dyn_dtree, M.d_desc.max_code), ht(M, M.bl_desc), Y = c - 1; 3 <= Y && M.bl_tree[2 * Z[Y] + 1] === 0; Y--) ;
            return M.opt_len += 3 * (Y + 1) + 5 + 5 + 4, Y;
          })(s), z = s.opt_len + 3 + 7 >>> 3, (W = s.static_len + 3 + 7 >>> 3) <= z && (z = W)) : z = W = N + 5, N + 4 <= z && k !== -1 ? f(s, k, N, P) : s.strategy === 4 || W === z ? (G(s, 2 + (P ? 1 : 0), 3), ct(s, q, m)) : (G(s, 4 + (P ? 1 : 0), 3), (function(M, Y, rt, tt) {
            var lt;
            for (G(M, Y - 257, 5), G(M, rt - 1, 5), G(M, tt - 4, 4), lt = 0; lt < tt; lt++) G(M, M.bl_tree[2 * Z[lt] + 1], 3);
            R(M, M.dyn_ltree, Y - 1), R(M, M.dyn_dtree, rt - 1);
          })(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, K + 1), ct(s, s.dyn_ltree, s.dyn_dtree)), Q(s), P && et(s);
        }, v._tr_tally = function(s, k, N) {
          return s.pending_buf[s.d_buf + 2 * s.last_lit] = k >>> 8 & 255, s.pending_buf[s.d_buf + 2 * s.last_lit + 1] = 255 & k, s.pending_buf[s.l_buf + s.last_lit] = 255 & N, s.last_lit++, k === 0 ? s.dyn_ltree[2 * N]++ : (s.matches++, k--, s.dyn_ltree[2 * (e[N] + p + 1)]++, s.dyn_dtree[2 * C(k)]++), s.last_lit === s.lit_bufsize - 1;
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
        (function(l) {
          (function(o, r) {
            if (!o.setImmediate) {
              var u, _, y, p, b = 1, i = {}, c = !1, n = o.document, h = Object.getPrototypeOf && Object.getPrototypeOf(o);
              h = h && h.setTimeout ? h : o, u = {}.toString.call(o.process) === "[object process]" ? function(S) {
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
              })() ? (p = "setImmediate$" + Math.random() + "$", o.addEventListener ? o.addEventListener("message", w, !1) : o.attachEvent("onmessage", w), function(S) {
                o.postMessage(p + S, "*");
              }) : o.MessageChannel ? ((y = new MessageChannel()).port1.onmessage = function(S) {
                d(S.data);
              }, function(S) {
                y.port2.postMessage(S);
              }) : n && "onreadystatechange" in n.createElement("script") ? (_ = n.documentElement, function(S) {
                var x = n.createElement("script");
                x.onreadystatechange = function() {
                  d(S), x.onreadystatechange = null, _.removeChild(x), x = null;
                }, _.appendChild(x);
              }) : function(S) {
                setTimeout(d, 0, S);
              }, h.setImmediate = function(S) {
                typeof S != "function" && (S = new Function("" + S));
                for (var x = new Array(arguments.length - 1), F = 0; F < x.length; F++) x[F] = arguments[F + 1];
                var O = { callback: S, args: x };
                return i[b] = O, u(b), b++;
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
              S.source === o && typeof S.data == "string" && S.data.indexOf(p) === 0 && d(+S.data.slice(p.length));
            }
          })(typeof self > "u" ? l === void 0 ? this : l : self);
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
    const { zipBuffer: g, gameId: D } = nt.data, v = await Dt.loadAsync(g), l = /* @__PURE__ */ new Map();
    await Promise.all(
      Object.entries(v.files).map(async ([o, r]) => {
        r.dir || l.set(o, await r.async("arraybuffer"));
      })
    ), St.set(D, l), console.log("gameFiles state: ", St), (ft = nt.source) == null || ft.postMessage({ type: "ZIP_READY", gameId: D });
  }
});
self.addEventListener("fetch", (nt) => {
  const g = new URL(nt.request.url).pathname.match(/\/play-game\/([^/]+)\/(.*)/);
  if (!g)
    return;
  const [, D, v] = g;
  console.log("gameId: ", D, `
filePath: `, v);
  const l = St.get(D), o = l == null ? void 0 : l.get(v);
  if (!o) {
    console.log("file not found! ", o);
    return;
  }
  const r = v.includes("Build/") && v.endsWith(".gz");
  console.log("should decompress?: ", r), nt.respondWith(
    (async () => {
      let u = o;
      if (r)
        try {
          u = await Nt(o), console.log("decompressed successfully, size:", u.byteLength);
        } catch (y) {
          console.warn(`Failed to decompress ${v}:`, y);
        }
      console.log("responding with buffer size:", u.byteLength);
      const _ = new Response(new Uint8Array(u), {
        headers: {
          "Content-Type": Ft(v),
          "Cross-Origin-Embedder-Policy": "require-corp",
          ...r && {
            "Content-Length": u.byteLength.toString()
          }
        }
      });
      return console.log("response constructed:", _, `
headers:`, _.headers), _;
    })().catch((u) => (console.error("respondWith failed:", u), new Response("SW error", { status: 500 })))
  );
});
function Ft(nt) {
  var l, o;
  const ft = nt.split("."), g = (l = ft.pop()) == null ? void 0 : l.toLowerCase(), D = (o = ft.pop()) == null ? void 0 : o.toLowerCase(), v = {
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
async function Nt(nt) {
  const ft = new DecompressionStream("gzip"), g = ft.writable.getWriter(), D = ft.readable.getReader();
  g.write(nt), g.close();
  const v = [];
  for (; ; ) {
    const { done: u, value: _ } = await D.read();
    if (u) break;
    v.push(_);
  }
  const l = v.reduce((u, _) => u + _.byteLength, 0), o = new Uint8Array(l);
  let r = 0;
  for (const u of v)
    o.set(u, r), r += u.byteLength;
  return o.buffer;
}
