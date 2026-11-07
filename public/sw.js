var vt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Bt(Q) {
  return Q && Q.__esModule && Object.prototype.hasOwnProperty.call(Q, "default") ? Q.default : Q;
}
function wt(Q) {
  throw new Error('Could not dynamically require "' + Q + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
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
  return Et || (Et = 1, (function(Q, nt) {
    (function(p) {
      Q.exports = p();
    })(function() {
      return (function p(T, y, l) {
        function s(m, v) {
          if (!y[m]) {
            if (!T[m]) {
              var _ = typeof wt == "function" && wt;
              if (!v && _) return _(m, !0);
              if (r) return r(m, !0);
              var b = new Error("Cannot find module '" + m + "'");
              throw b.code = "MODULE_NOT_FOUND", b;
            }
            var i = y[m] = { exports: {} };
            T[m][0].call(i.exports, function(c) {
              var n = T[m][1][c];
              return s(n || c);
            }, i, i.exports, p, T, y, l);
          }
          return y[m].exports;
        }
        for (var r = typeof wt == "function" && wt, u = 0; u < l.length; u++) s(l[u]);
        return s;
      })({ 1: [function(p, T, y) {
        var l = p("./utils"), s = p("./support"), r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        y.encode = function(u) {
          for (var m, v, _, b, i, c, n, h = [], a = 0, d = u.length, w = d, S = l.getTypeOf(u) !== "string"; a < u.length; ) w = d - a, _ = S ? (m = u[a++], v = a < d ? u[a++] : 0, a < d ? u[a++] : 0) : (m = u.charCodeAt(a++), v = a < d ? u.charCodeAt(a++) : 0, a < d ? u.charCodeAt(a++) : 0), b = m >> 2, i = (3 & m) << 4 | v >> 4, c = 1 < w ? (15 & v) << 2 | _ >> 6 : 64, n = 2 < w ? 63 & _ : 64, h.push(r.charAt(b) + r.charAt(i) + r.charAt(c) + r.charAt(n));
          return h.join("");
        }, y.decode = function(u) {
          var m, v, _, b, i, c, n = 0, h = 0, a = "data:";
          if (u.substr(0, a.length) === a) throw new Error("Invalid base64 input, it looks like a data url.");
          var d, w = 3 * (u = u.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (u.charAt(u.length - 1) === r.charAt(64) && w--, u.charAt(u.length - 2) === r.charAt(64) && w--, w % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (d = s.uint8array ? new Uint8Array(0 | w) : new Array(0 | w); n < u.length; ) m = r.indexOf(u.charAt(n++)) << 2 | (b = r.indexOf(u.charAt(n++))) >> 4, v = (15 & b) << 4 | (i = r.indexOf(u.charAt(n++))) >> 2, _ = (3 & i) << 6 | (c = r.indexOf(u.charAt(n++))), d[h++] = m, i !== 64 && (d[h++] = v), c !== 64 && (d[h++] = _);
          return d;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(p, T, y) {
        var l = p("./external"), s = p("./stream/DataWorker"), r = p("./stream/Crc32Probe"), u = p("./stream/DataLengthProbe");
        function m(v, _, b, i, c) {
          this.compressedSize = v, this.uncompressedSize = _, this.crc32 = b, this.compression = i, this.compressedContent = c;
        }
        m.prototype = { getContentWorker: function() {
          var v = new s(l.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new u("data_length")), _ = this;
          return v.on("end", function() {
            if (this.streamInfo.data_length !== _.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), v;
        }, getCompressedWorker: function() {
          return new s(l.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, m.createWorkerFrom = function(v, _, b) {
          return v.pipe(new r()).pipe(new u("uncompressedSize")).pipe(_.compressWorker(b)).pipe(new u("compressedSize")).withStreamInfo("compression", _);
        }, T.exports = m;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(p, T, y) {
        var l = p("./stream/GenericWorker");
        y.STORE = { magic: "\0\0", compressWorker: function() {
          return new l("STORE compression");
        }, uncompressWorker: function() {
          return new l("STORE decompression");
        } }, y.DEFLATE = p("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(p, T, y) {
        var l = p("./utils"), s = (function() {
          for (var r, u = [], m = 0; m < 256; m++) {
            r = m;
            for (var v = 0; v < 8; v++) r = 1 & r ? 3988292384 ^ r >>> 1 : r >>> 1;
            u[m] = r;
          }
          return u;
        })();
        T.exports = function(r, u) {
          return r !== void 0 && r.length ? l.getTypeOf(r) !== "string" ? (function(m, v, _, b) {
            var i = s, c = b + _;
            m ^= -1;
            for (var n = b; n < c; n++) m = m >>> 8 ^ i[255 & (m ^ v[n])];
            return -1 ^ m;
          })(0 | u, r, r.length, 0) : (function(m, v, _, b) {
            var i = s, c = b + _;
            m ^= -1;
            for (var n = b; n < c; n++) m = m >>> 8 ^ i[255 & (m ^ v.charCodeAt(n))];
            return -1 ^ m;
          })(0 | u, r, r.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(p, T, y) {
        y.base64 = !1, y.binary = !1, y.dir = !1, y.createFolders = !0, y.date = null, y.compression = null, y.compressionOptions = null, y.comment = null, y.unixPermissions = null, y.dosPermissions = null;
      }, {}], 6: [function(p, T, y) {
        var l = null;
        l = typeof Promise < "u" ? Promise : p("lie"), T.exports = { Promise: l };
      }, { lie: 37 }], 7: [function(p, T, y) {
        var l = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Uint32Array < "u", s = p("pako"), r = p("./utils"), u = p("./stream/GenericWorker"), m = l ? "uint8array" : "array";
        function v(_, b) {
          u.call(this, "FlateWorker/" + _), this._pako = null, this._pakoAction = _, this._pakoOptions = b, this.meta = {};
        }
        y.magic = "\b\0", r.inherits(v, u), v.prototype.processChunk = function(_) {
          this.meta = _.meta, this._pako === null && this._createPako(), this._pako.push(r.transformTo(m, _.data), !1);
        }, v.prototype.flush = function() {
          u.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
        }, v.prototype.cleanUp = function() {
          u.prototype.cleanUp.call(this), this._pako = null;
        }, v.prototype._createPako = function() {
          this._pako = new s[this._pakoAction]({ raw: !0, level: this._pakoOptions.level || -1 });
          var _ = this;
          this._pako.onData = function(b) {
            _.push({ data: b, meta: _.meta });
          };
        }, y.compressWorker = function(_) {
          return new v("Deflate", _);
        }, y.uncompressWorker = function() {
          return new v("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(p, T, y) {
        function l(i, c) {
          var n, h = "";
          for (n = 0; n < c; n++) h += String.fromCharCode(255 & i), i >>>= 8;
          return h;
        }
        function s(i, c, n, h, a, d) {
          var w, S, x = i.file, F = i.compression, O = d !== m.utf8encode, P = r.transformTo("string", d(x.name)), I = r.transformTo("string", m.utf8encode(x.name)), Z = x.comment, q = r.transformTo("string", d(Z)), g = r.transformTo("string", m.utf8encode(Z)), B = I.length !== x.name.length, e = g.length !== Z.length, D = "", J = "", N = "", $ = x.dir, j = x.date, V = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          c && !n || (V.crc32 = i.crc32, V.compressedSize = i.compressedSize, V.uncompressedSize = i.uncompressedSize);
          var E = 0;
          c && (E |= 8), O || !B && !e || (E |= 2048);
          var C = 0, X = 0;
          $ && (C |= 16), a === "UNIX" ? (X = 798, C |= (function(H, at) {
            var ut = H;
            return H || (ut = at ? 16893 : 33204), (65535 & ut) << 16;
          })(x.unixPermissions, $)) : (X = 20, C |= (function(H) {
            return 63 & (H || 0);
          })(x.dosPermissions)), w = j.getUTCHours(), w <<= 6, w |= j.getUTCMinutes(), w <<= 5, w |= j.getUTCSeconds() / 2, S = j.getUTCFullYear() - 1980, S <<= 4, S |= j.getUTCMonth() + 1, S <<= 5, S |= j.getUTCDate(), B && (J = l(1, 1) + l(v(P), 4) + I, D += "up" + l(J.length, 2) + J), e && (N = l(1, 1) + l(v(q), 4) + g, D += "uc" + l(N.length, 2) + N);
          var G = "";
          return G += `
\0`, G += l(E, 2), G += F.magic, G += l(w, 2), G += l(S, 2), G += l(V.crc32, 4), G += l(V.compressedSize, 4), G += l(V.uncompressedSize, 4), G += l(P.length, 2), G += l(D.length, 2), { fileRecord: _.LOCAL_FILE_HEADER + G + P + D, dirRecord: _.CENTRAL_FILE_HEADER + l(X, 2) + G + l(q.length, 2) + "\0\0\0\0" + l(C, 4) + l(h, 4) + P + D + q };
        }
        var r = p("../utils"), u = p("../stream/GenericWorker"), m = p("../utf8"), v = p("../crc32"), _ = p("../signature");
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
            var n = s(i, c, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: n.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = !0;
        }, b.prototype.closedSource = function(i) {
          this.accumulate = !1;
          var c = this.streamFiles && !i.file.dir, n = s(i, c, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(n.dirRecord), c) this.push({ data: (function(h) {
            return _.DATA_DESCRIPTOR + l(h.crc32, 4) + l(h.compressedSize, 4) + l(h.uncompressedSize, 4);
          })(i), meta: { percent: 100 } });
          else for (this.push({ data: n.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, b.prototype.flush = function() {
          for (var i = this.bytesWritten, c = 0; c < this.dirRecords.length; c++) this.push({ data: this.dirRecords[c], meta: { percent: 100 } });
          var n = this.bytesWritten - i, h = (function(a, d, w, S, x) {
            var F = r.transformTo("string", x(S));
            return _.CENTRAL_DIRECTORY_END + "\0\0\0\0" + l(a, 2) + l(a, 2) + l(d, 4) + l(w, 4) + l(F.length, 2) + F;
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
        }, T.exports = b;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(p, T, y) {
        var l = p("../compressions"), s = p("./ZipFileWorker");
        y.generateWorker = function(r, u, m) {
          var v = new s(u.streamFiles, m, u.platform, u.encodeFileName), _ = 0;
          try {
            r.forEach(function(b, i) {
              _++;
              var c = (function(d, w) {
                var S = d || w, x = l[S];
                if (!x) throw new Error(S + " is not a valid compression method !");
                return x;
              })(i.options.compression, u.compression), n = i.options.compressionOptions || u.compressionOptions || {}, h = i.dir, a = i.date;
              i._compressWorker(c, n).withStreamInfo("file", { name: b, dir: h, date: a, comment: i.comment || "", unixPermissions: i.unixPermissions, dosPermissions: i.dosPermissions }).pipe(v);
            }), v.entriesCount = _;
          } catch (b) {
            v.error(b);
          }
          return v;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(p, T, y) {
        function l() {
          if (!(this instanceof l)) return new l();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var s = new l();
            for (var r in this) typeof this[r] != "function" && (s[r] = this[r]);
            return s;
          };
        }
        (l.prototype = p("./object")).loadAsync = p("./load"), l.support = p("./support"), l.defaults = p("./defaults"), l.version = "3.10.1", l.loadAsync = function(s, r) {
          return new l().loadAsync(s, r);
        }, l.external = p("./external"), T.exports = l;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(p, T, y) {
        var l = p("./utils"), s = p("./external"), r = p("./utf8"), u = p("./zipEntries"), m = p("./stream/Crc32Probe"), v = p("./nodejsUtils");
        function _(b) {
          return new s.Promise(function(i, c) {
            var n = b.decompressed.getContentWorker().pipe(new m());
            n.on("error", function(h) {
              c(h);
            }).on("end", function() {
              n.streamInfo.crc32 !== b.decompressed.crc32 ? c(new Error("Corrupted zip : CRC32 mismatch")) : i();
            }).resume();
          });
        }
        T.exports = function(b, i) {
          var c = this;
          return i = l.extend(i || {}, { base64: !1, checkCRC32: !1, optimizedBinaryString: !1, createFolders: !1, decodeFileName: r.utf8decode }), v.isNode && v.isStream(b) ? s.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : l.prepareContent("the loaded zip file", b, !0, i.optimizedBinaryString, i.base64).then(function(n) {
            var h = new u(i);
            return h.load(n), h;
          }).then(function(n) {
            var h = [s.Promise.resolve(n)], a = n.files;
            if (i.checkCRC32) for (var d = 0; d < a.length; d++) h.push(_(a[d]));
            return s.Promise.all(h);
          }).then(function(n) {
            for (var h = n.shift(), a = h.files, d = 0; d < a.length; d++) {
              var w = a[d], S = w.fileNameStr, x = l.resolve(w.fileNameStr);
              c.file(x, w.decompressed, { binary: !0, optimizedBinaryString: !0, date: w.date, dir: w.dir, comment: w.fileCommentStr.length ? w.fileCommentStr : null, unixPermissions: w.unixPermissions, dosPermissions: w.dosPermissions, createFolders: i.createFolders }), w.dir || (c.file(x).unsafeOriginalName = S);
            }
            return h.zipComment.length && (c.comment = h.zipComment), c;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(p, T, y) {
        var l = p("../utils"), s = p("../stream/GenericWorker");
        function r(u, m) {
          s.call(this, "Nodejs stream input adapter for " + u), this._upstreamEnded = !1, this._bindStream(m);
        }
        l.inherits(r, s), r.prototype._bindStream = function(u) {
          var m = this;
          (this._stream = u).pause(), u.on("data", function(v) {
            m.push({ data: v, meta: { percent: 0 } });
          }).on("error", function(v) {
            m.isPaused ? this.generatedError = v : m.error(v);
          }).on("end", function() {
            m.isPaused ? m._upstreamEnded = !0 : m.end();
          });
        }, r.prototype.pause = function() {
          return !!s.prototype.pause.call(this) && (this._stream.pause(), !0);
        }, r.prototype.resume = function() {
          return !!s.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
        }, T.exports = r;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(p, T, y) {
        var l = p("readable-stream").Readable;
        function s(r, u, m) {
          l.call(this, u), this._helper = r;
          var v = this;
          r.on("data", function(_, b) {
            v.push(_) || v._helper.pause(), m && m(b);
          }).on("error", function(_) {
            v.emit("error", _);
          }).on("end", function() {
            v.push(null);
          });
        }
        p("../utils").inherits(s, l), s.prototype._read = function() {
          this._helper.resume();
        }, T.exports = s;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(p, T, y) {
        T.exports = { isNode: typeof Buffer < "u", newBufferFrom: function(l, s) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(l, s);
          if (typeof l == "number") throw new Error('The "data" argument must not be a number');
          return new Buffer(l, s);
        }, allocBuffer: function(l) {
          if (Buffer.alloc) return Buffer.alloc(l);
          var s = new Buffer(l);
          return s.fill(0), s;
        }, isBuffer: function(l) {
          return Buffer.isBuffer(l);
        }, isStream: function(l) {
          return l && typeof l.on == "function" && typeof l.pause == "function" && typeof l.resume == "function";
        } };
      }, {}], 15: [function(p, T, y) {
        function l(x, F, O) {
          var P, I = r.getTypeOf(F), Z = r.extend(O || {}, v);
          Z.date = Z.date || /* @__PURE__ */ new Date(), Z.compression !== null && (Z.compression = Z.compression.toUpperCase()), typeof Z.unixPermissions == "string" && (Z.unixPermissions = parseInt(Z.unixPermissions, 8)), Z.unixPermissions && 16384 & Z.unixPermissions && (Z.dir = !0), Z.dosPermissions && 16 & Z.dosPermissions && (Z.dir = !0), Z.dir && (x = a(x)), Z.createFolders && (P = h(x)) && d.call(this, P, !0);
          var q = I === "string" && Z.binary === !1 && Z.base64 === !1;
          O && O.binary !== void 0 || (Z.binary = !q), (F instanceof _ && F.uncompressedSize === 0 || Z.dir || !F || F.length === 0) && (Z.base64 = !1, Z.binary = !0, F = "", Z.compression = "STORE", I = "string");
          var g = null;
          g = F instanceof _ || F instanceof u ? F : c.isNode && c.isStream(F) ? new n(x, F) : r.prepareContent(x, F, Z.binary, Z.optimizedBinaryString, Z.base64);
          var B = new b(x, g, Z);
          this.files[x] = B;
        }
        var s = p("./utf8"), r = p("./utils"), u = p("./stream/GenericWorker"), m = p("./stream/StreamHelper"), v = p("./defaults"), _ = p("./compressedObject"), b = p("./zipObject"), i = p("./generate"), c = p("./nodejsUtils"), n = p("./nodejs/NodejsStreamInputAdapter"), h = function(x) {
          x.slice(-1) === "/" && (x = x.substring(0, x.length - 1));
          var F = x.lastIndexOf("/");
          return 0 < F ? x.substring(0, F) : "";
        }, a = function(x) {
          return x.slice(-1) !== "/" && (x += "/"), x;
        }, d = function(x, F) {
          return F = F !== void 0 ? F : v.createFolders, x = a(x), this.files[x] || l.call(this, x, null, { dir: !0, createFolders: F }), this.files[x];
        };
        function w(x) {
          return Object.prototype.toString.call(x) === "[object RegExp]";
        }
        var S = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(x) {
          var F, O, P;
          for (F in this.files) P = this.files[F], (O = F.slice(this.root.length, F.length)) && F.slice(0, this.root.length) === this.root && x(O, P);
        }, filter: function(x) {
          var F = [];
          return this.forEach(function(O, P) {
            x(O, P) && F.push(P);
          }), F;
        }, file: function(x, F, O) {
          if (arguments.length !== 1) return x = this.root + x, l.call(this, x, F, O), this;
          if (w(x)) {
            var P = x;
            return this.filter(function(Z, q) {
              return !q.dir && P.test(Z);
            });
          }
          var I = this.files[this.root + x];
          return I && !I.dir ? I : null;
        }, folder: function(x) {
          if (!x) return this;
          if (w(x)) return this.filter(function(I, Z) {
            return Z.dir && x.test(I);
          });
          var F = this.root + x, O = d.call(this, F), P = this.clone();
          return P.root = O.name, P;
        }, remove: function(x) {
          x = this.root + x;
          var F = this.files[x];
          if (F || (x.slice(-1) !== "/" && (x += "/"), F = this.files[x]), F && !F.dir) delete this.files[x];
          else for (var O = this.filter(function(I, Z) {
            return Z.name.slice(0, x.length) === x;
          }), P = 0; P < O.length; P++) delete this.files[O[P].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(x) {
          var F, O = {};
          try {
            if ((O = r.extend(x || {}, { streamFiles: !1, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: s.utf8encode })).type = O.type.toLowerCase(), O.compression = O.compression.toUpperCase(), O.type === "binarystring" && (O.type = "string"), !O.type) throw new Error("No output type specified.");
            r.checkSupport(O.type), O.platform !== "darwin" && O.platform !== "freebsd" && O.platform !== "linux" && O.platform !== "sunos" || (O.platform = "UNIX"), O.platform === "win32" && (O.platform = "DOS");
            var P = O.comment || this.comment || "";
            F = i.generateWorker(this, O, P);
          } catch (I) {
            (F = new u("error")).error(I);
          }
          return new m(F, O.type || "string", O.mimeType);
        }, generateAsync: function(x, F) {
          return this.generateInternalStream(x).accumulate(F);
        }, generateNodeStream: function(x, F) {
          return (x = x || {}).type || (x.type = "nodebuffer"), this.generateInternalStream(x).toNodejsStream(F);
        } };
        T.exports = S;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(p, T, y) {
        T.exports = p("stream");
      }, { stream: void 0 }], 17: [function(p, T, y) {
        var l = p("./DataReader");
        function s(r) {
          l.call(this, r);
          for (var u = 0; u < this.data.length; u++) r[u] = 255 & r[u];
        }
        p("../utils").inherits(s, l), s.prototype.byteAt = function(r) {
          return this.data[this.zero + r];
        }, s.prototype.lastIndexOfSignature = function(r) {
          for (var u = r.charCodeAt(0), m = r.charCodeAt(1), v = r.charCodeAt(2), _ = r.charCodeAt(3), b = this.length - 4; 0 <= b; --b) if (this.data[b] === u && this.data[b + 1] === m && this.data[b + 2] === v && this.data[b + 3] === _) return b - this.zero;
          return -1;
        }, s.prototype.readAndCheckSignature = function(r) {
          var u = r.charCodeAt(0), m = r.charCodeAt(1), v = r.charCodeAt(2), _ = r.charCodeAt(3), b = this.readData(4);
          return u === b[0] && m === b[1] && v === b[2] && _ === b[3];
        }, s.prototype.readData = function(r) {
          if (this.checkOffset(r), r === 0) return [];
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, u;
        }, T.exports = s;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(p, T, y) {
        var l = p("../utils");
        function s(r) {
          this.data = r, this.length = r.length, this.index = 0, this.zero = 0;
        }
        s.prototype = { checkOffset: function(r) {
          this.checkIndex(this.index + r);
        }, checkIndex: function(r) {
          if (this.length < this.zero + r || r < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + r + "). Corrupted zip ?");
        }, setIndex: function(r) {
          this.checkIndex(r), this.index = r;
        }, skip: function(r) {
          this.setIndex(this.index + r);
        }, byteAt: function() {
        }, readInt: function(r) {
          var u, m = 0;
          for (this.checkOffset(r), u = this.index + r - 1; u >= this.index; u--) m = (m << 8) + this.byteAt(u);
          return this.index += r, m;
        }, readString: function(r) {
          return l.transformTo("string", this.readData(r));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var r = this.readInt(4);
          return new Date(Date.UTC(1980 + (r >> 25 & 127), (r >> 21 & 15) - 1, r >> 16 & 31, r >> 11 & 31, r >> 5 & 63, (31 & r) << 1));
        } }, T.exports = s;
      }, { "../utils": 32 }], 19: [function(p, T, y) {
        var l = p("./Uint8ArrayReader");
        function s(r) {
          l.call(this, r);
        }
        p("../utils").inherits(s, l), s.prototype.readData = function(r) {
          this.checkOffset(r);
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, u;
        }, T.exports = s;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(p, T, y) {
        var l = p("./DataReader");
        function s(r) {
          l.call(this, r);
        }
        p("../utils").inherits(s, l), s.prototype.byteAt = function(r) {
          return this.data.charCodeAt(this.zero + r);
        }, s.prototype.lastIndexOfSignature = function(r) {
          return this.data.lastIndexOf(r) - this.zero;
        }, s.prototype.readAndCheckSignature = function(r) {
          return r === this.readData(4);
        }, s.prototype.readData = function(r) {
          this.checkOffset(r);
          var u = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, u;
        }, T.exports = s;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(p, T, y) {
        var l = p("./ArrayReader");
        function s(r) {
          l.call(this, r);
        }
        p("../utils").inherits(s, l), s.prototype.readData = function(r) {
          if (this.checkOffset(r), r === 0) return new Uint8Array(0);
          var u = this.data.subarray(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, u;
        }, T.exports = s;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(p, T, y) {
        var l = p("../utils"), s = p("../support"), r = p("./ArrayReader"), u = p("./StringReader"), m = p("./NodeBufferReader"), v = p("./Uint8ArrayReader");
        T.exports = function(_) {
          var b = l.getTypeOf(_);
          return l.checkSupport(b), b !== "string" || s.uint8array ? b === "nodebuffer" ? new m(_) : s.uint8array ? new v(l.transformTo("uint8array", _)) : new r(l.transformTo("array", _)) : new u(_);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(p, T, y) {
        y.LOCAL_FILE_HEADER = "PK", y.CENTRAL_FILE_HEADER = "PK", y.CENTRAL_DIRECTORY_END = "PK", y.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", y.ZIP64_CENTRAL_DIRECTORY_END = "PK", y.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(p, T, y) {
        var l = p("./GenericWorker"), s = p("../utils");
        function r(u) {
          l.call(this, "ConvertWorker to " + u), this.destType = u;
        }
        s.inherits(r, l), r.prototype.processChunk = function(u) {
          this.push({ data: s.transformTo(this.destType, u.data), meta: u.meta });
        }, T.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(p, T, y) {
        var l = p("./GenericWorker"), s = p("../crc32");
        function r() {
          l.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        p("../utils").inherits(r, l), r.prototype.processChunk = function(u) {
          this.streamInfo.crc32 = s(u.data, this.streamInfo.crc32 || 0), this.push(u);
        }, T.exports = r;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(p, T, y) {
        var l = p("../utils"), s = p("./GenericWorker");
        function r(u) {
          s.call(this, "DataLengthProbe for " + u), this.propName = u, this.withStreamInfo(u, 0);
        }
        l.inherits(r, s), r.prototype.processChunk = function(u) {
          if (u) {
            var m = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = m + u.data.length;
          }
          s.prototype.processChunk.call(this, u);
        }, T.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(p, T, y) {
        var l = p("../utils"), s = p("./GenericWorker");
        function r(u) {
          s.call(this, "DataWorker");
          var m = this;
          this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, u.then(function(v) {
            m.dataIsReady = !0, m.data = v, m.max = v && v.length || 0, m.type = l.getTypeOf(v), m.isPaused || m._tickAndRepeat();
          }, function(v) {
            m.error(v);
          });
        }
        l.inherits(r, s), r.prototype.cleanUp = function() {
          s.prototype.cleanUp.call(this), this.data = null;
        }, r.prototype.resume = function() {
          return !!s.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, l.delay(this._tickAndRepeat, [], this)), !0);
        }, r.prototype._tickAndRepeat = function() {
          this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (l.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
        }, r.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return !1;
          var u = null, m = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              u = this.data.substring(this.index, m);
              break;
            case "uint8array":
              u = this.data.subarray(this.index, m);
              break;
            case "array":
            case "nodebuffer":
              u = this.data.slice(this.index, m);
          }
          return this.index = m, this.push({ data: u, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, T.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(p, T, y) {
        function l(s) {
          this.name = s || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        l.prototype = { push: function(s) {
          this.emit("data", s);
        }, end: function() {
          if (this.isFinished) return !1;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = !0;
          } catch (s) {
            this.emit("error", s);
          }
          return !0;
        }, error: function(s) {
          return !this.isFinished && (this.isPaused ? this.generatedError = s : (this.isFinished = !0, this.emit("error", s), this.previous && this.previous.error(s), this.cleanUp()), !0);
        }, on: function(s, r) {
          return this._listeners[s].push(r), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(s, r) {
          if (this._listeners[s]) for (var u = 0; u < this._listeners[s].length; u++) this._listeners[s][u].call(this, r);
        }, pipe: function(s) {
          return s.registerPrevious(this);
        }, registerPrevious: function(s) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = s.streamInfo, this.mergeStreamInfo(), this.previous = s;
          var r = this;
          return s.on("data", function(u) {
            r.processChunk(u);
          }), s.on("end", function() {
            r.end();
          }), s.on("error", function(u) {
            r.error(u);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return !1;
          var s = this.isPaused = !1;
          return this.generatedError && (this.error(this.generatedError), s = !0), this.previous && this.previous.resume(), !s;
        }, flush: function() {
        }, processChunk: function(s) {
          this.push(s);
        }, withStreamInfo: function(s, r) {
          return this.extraStreamInfo[s] = r, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var s in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, s) && (this.streamInfo[s] = this.extraStreamInfo[s]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = !0, this.previous && this.previous.lock();
        }, toString: function() {
          var s = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + s : s;
        } }, T.exports = l;
      }, {}], 29: [function(p, T, y) {
        var l = p("../utils"), s = p("./ConvertWorker"), r = p("./GenericWorker"), u = p("../base64"), m = p("../support"), v = p("../external"), _ = null;
        if (m.nodestream) try {
          _ = p("../nodejs/NodejsStreamOutputAdapter");
        } catch {
        }
        function b(c, n) {
          return new v.Promise(function(h, a) {
            var d = [], w = c._internalType, S = c._outputType, x = c._mimeType;
            c.on("data", function(F, O) {
              d.push(F), n && n(O);
            }).on("error", function(F) {
              d = [], a(F);
            }).on("end", function() {
              try {
                var F = (function(O, P, I) {
                  switch (O) {
                    case "blob":
                      return l.newBlob(l.transformTo("arraybuffer", P), I);
                    case "base64":
                      return u.encode(P);
                    default:
                      return l.transformTo(O, P);
                  }
                })(S, (function(O, P) {
                  var I, Z = 0, q = null, g = 0;
                  for (I = 0; I < P.length; I++) g += P[I].length;
                  switch (O) {
                    case "string":
                      return P.join("");
                    case "array":
                      return Array.prototype.concat.apply([], P);
                    case "uint8array":
                      for (q = new Uint8Array(g), I = 0; I < P.length; I++) q.set(P[I], Z), Z += P[I].length;
                      return q;
                    case "nodebuffer":
                      return Buffer.concat(P);
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
            this._internalType = a, this._outputType = n, this._mimeType = h, l.checkSupport(a), this._worker = c.pipe(new s(a)), c.lock();
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
          return new _(this, { objectMode: this._outputType !== "nodebuffer" }, c);
        } }, T.exports = i;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(p, T, y) {
        if (y.base64 = !0, y.array = !0, y.string = !0, y.arraybuffer = typeof ArrayBuffer < "u" && typeof Uint8Array < "u", y.nodebuffer = typeof Buffer < "u", y.uint8array = typeof Uint8Array < "u", typeof ArrayBuffer > "u") y.blob = !1;
        else {
          var l = new ArrayBuffer(0);
          try {
            y.blob = new Blob([l], { type: "application/zip" }).size === 0;
          } catch {
            try {
              var s = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              s.append(l), y.blob = s.getBlob("application/zip").size === 0;
            } catch {
              y.blob = !1;
            }
          }
        }
        try {
          y.nodestream = !!p("readable-stream").Readable;
        } catch {
          y.nodestream = !1;
        }
      }, { "readable-stream": 16 }], 31: [function(p, T, y) {
        for (var l = p("./utils"), s = p("./support"), r = p("./nodejsUtils"), u = p("./stream/GenericWorker"), m = new Array(256), v = 0; v < 256; v++) m[v] = 252 <= v ? 6 : 248 <= v ? 5 : 240 <= v ? 4 : 224 <= v ? 3 : 192 <= v ? 2 : 1;
        m[254] = m[254] = 1;
        function _() {
          u.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function b() {
          u.call(this, "utf-8 encode");
        }
        y.utf8encode = function(i) {
          return s.nodebuffer ? r.newBufferFrom(i, "utf-8") : (function(c) {
            var n, h, a, d, w, S = c.length, x = 0;
            for (d = 0; d < S; d++) (64512 & (h = c.charCodeAt(d))) == 55296 && d + 1 < S && (64512 & (a = c.charCodeAt(d + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (a - 56320), d++), x += h < 128 ? 1 : h < 2048 ? 2 : h < 65536 ? 3 : 4;
            for (n = s.uint8array ? new Uint8Array(x) : new Array(x), d = w = 0; w < x; d++) (64512 & (h = c.charCodeAt(d))) == 55296 && d + 1 < S && (64512 & (a = c.charCodeAt(d + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (a - 56320), d++), h < 128 ? n[w++] = h : (h < 2048 ? n[w++] = 192 | h >>> 6 : (h < 65536 ? n[w++] = 224 | h >>> 12 : (n[w++] = 240 | h >>> 18, n[w++] = 128 | h >>> 12 & 63), n[w++] = 128 | h >>> 6 & 63), n[w++] = 128 | 63 & h);
            return n;
          })(i);
        }, y.utf8decode = function(i) {
          return s.nodebuffer ? l.transformTo("nodebuffer", i).toString("utf-8") : (function(c) {
            var n, h, a, d, w = c.length, S = new Array(2 * w);
            for (n = h = 0; n < w; ) if ((a = c[n++]) < 128) S[h++] = a;
            else if (4 < (d = m[a])) S[h++] = 65533, n += d - 1;
            else {
              for (a &= d === 2 ? 31 : d === 3 ? 15 : 7; 1 < d && n < w; ) a = a << 6 | 63 & c[n++], d--;
              1 < d ? S[h++] = 65533 : a < 65536 ? S[h++] = a : (a -= 65536, S[h++] = 55296 | a >> 10 & 1023, S[h++] = 56320 | 1023 & a);
            }
            return S.length !== h && (S.subarray ? S = S.subarray(0, h) : S.length = h), l.applyFromCharCode(S);
          })(i = l.transformTo(s.uint8array ? "uint8array" : "array", i));
        }, l.inherits(_, u), _.prototype.processChunk = function(i) {
          var c = l.transformTo(s.uint8array ? "uint8array" : "array", i.data);
          if (this.leftOver && this.leftOver.length) {
            if (s.uint8array) {
              var n = c;
              (c = new Uint8Array(n.length + this.leftOver.length)).set(this.leftOver, 0), c.set(n, this.leftOver.length);
            } else c = this.leftOver.concat(c);
            this.leftOver = null;
          }
          var h = (function(d, w) {
            var S;
            for ((w = w || d.length) > d.length && (w = d.length), S = w - 1; 0 <= S && (192 & d[S]) == 128; ) S--;
            return S < 0 || S === 0 ? w : S + m[d[S]] > w ? S : w;
          })(c), a = c;
          h !== c.length && (s.uint8array ? (a = c.subarray(0, h), this.leftOver = c.subarray(h, c.length)) : (a = c.slice(0, h), this.leftOver = c.slice(h, c.length))), this.push({ data: y.utf8decode(a), meta: i.meta });
        }, _.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: y.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, y.Utf8DecodeWorker = _, l.inherits(b, u), b.prototype.processChunk = function(i) {
          this.push({ data: y.utf8encode(i.data), meta: i.meta });
        }, y.Utf8EncodeWorker = b;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(p, T, y) {
        var l = p("./support"), s = p("./base64"), r = p("./nodejsUtils"), u = p("./external");
        function m(n) {
          return n;
        }
        function v(n, h) {
          for (var a = 0; a < n.length; ++a) h[a] = 255 & n.charCodeAt(a);
          return h;
        }
        p("setimmediate"), y.newBlob = function(n, h) {
          y.checkSupport("blob");
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
        var _ = { stringifyByChunk: function(n, h, a) {
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
          var h = 65536, a = y.getTypeOf(n), d = !0;
          if (a === "uint8array" ? d = _.applyCanBeUsed.uint8array : a === "nodebuffer" && (d = _.applyCanBeUsed.nodebuffer), d) for (; 1 < h; ) try {
            return _.stringifyByChunk(n, a, h);
          } catch {
            h = Math.floor(h / 2);
          }
          return _.stringifyByChar(n);
        }
        function i(n, h) {
          for (var a = 0; a < n.length; a++) h[a] = n[a];
          return h;
        }
        y.applyFromCharCode = b;
        var c = {};
        c.string = { string: m, array: function(n) {
          return v(n, new Array(n.length));
        }, arraybuffer: function(n) {
          return c.string.uint8array(n).buffer;
        }, uint8array: function(n) {
          return v(n, new Uint8Array(n.length));
        }, nodebuffer: function(n) {
          return v(n, r.allocBuffer(n.length));
        } }, c.array = { string: b, array: m, arraybuffer: function(n) {
          return new Uint8Array(n).buffer;
        }, uint8array: function(n) {
          return new Uint8Array(n);
        }, nodebuffer: function(n) {
          return r.newBufferFrom(n);
        } }, c.arraybuffer = { string: function(n) {
          return b(new Uint8Array(n));
        }, array: function(n) {
          return i(new Uint8Array(n), new Array(n.byteLength));
        }, arraybuffer: m, uint8array: function(n) {
          return new Uint8Array(n);
        }, nodebuffer: function(n) {
          return r.newBufferFrom(new Uint8Array(n));
        } }, c.uint8array = { string: b, array: function(n) {
          return i(n, new Array(n.length));
        }, arraybuffer: function(n) {
          return n.buffer;
        }, uint8array: m, nodebuffer: function(n) {
          return r.newBufferFrom(n);
        } }, c.nodebuffer = { string: b, array: function(n) {
          return i(n, new Array(n.length));
        }, arraybuffer: function(n) {
          return c.nodebuffer.uint8array(n).buffer;
        }, uint8array: function(n) {
          return i(n, new Uint8Array(n.length));
        }, nodebuffer: m }, y.transformTo = function(n, h) {
          if (h = h || "", !n) return h;
          y.checkSupport(n);
          var a = y.getTypeOf(h);
          return c[a][n](h);
        }, y.resolve = function(n) {
          for (var h = n.split("/"), a = [], d = 0; d < h.length; d++) {
            var w = h[d];
            w === "." || w === "" && d !== 0 && d !== h.length - 1 || (w === ".." ? a.pop() : a.push(w));
          }
          return a.join("/");
        }, y.getTypeOf = function(n) {
          return typeof n == "string" ? "string" : Object.prototype.toString.call(n) === "[object Array]" ? "array" : l.nodebuffer && r.isBuffer(n) ? "nodebuffer" : l.uint8array && n instanceof Uint8Array ? "uint8array" : l.arraybuffer && n instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, y.checkSupport = function(n) {
          if (!l[n.toLowerCase()]) throw new Error(n + " is not supported by this platform");
        }, y.MAX_VALUE_16BITS = 65535, y.MAX_VALUE_32BITS = -1, y.pretty = function(n) {
          var h, a, d = "";
          for (a = 0; a < (n || "").length; a++) d += "\\x" + ((h = n.charCodeAt(a)) < 16 ? "0" : "") + h.toString(16).toUpperCase();
          return d;
        }, y.delay = function(n, h, a) {
          setImmediate(function() {
            n.apply(a || null, h || []);
          });
        }, y.inherits = function(n, h) {
          function a() {
          }
          a.prototype = h.prototype, n.prototype = new a();
        }, y.extend = function() {
          var n, h, a = {};
          for (n = 0; n < arguments.length; n++) for (h in arguments[n]) Object.prototype.hasOwnProperty.call(arguments[n], h) && a[h] === void 0 && (a[h] = arguments[n][h]);
          return a;
        }, y.prepareContent = function(n, h, a, d, w) {
          return u.Promise.resolve(h).then(function(S) {
            return l.blob && (S instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(S)) !== -1) && typeof FileReader < "u" ? new u.Promise(function(x, F) {
              var O = new FileReader();
              O.onload = function(P) {
                x(P.target.result);
              }, O.onerror = function(P) {
                F(P.target.error);
              }, O.readAsArrayBuffer(S);
            }) : S;
          }).then(function(S) {
            var x = y.getTypeOf(S);
            return x ? (x === "arraybuffer" ? S = y.transformTo("uint8array", S) : x === "string" && (w ? S = s.decode(S) : a && d !== !0 && (S = (function(F) {
              return v(F, l.uint8array ? new Uint8Array(F.length) : new Array(F.length));
            })(S))), S) : u.Promise.reject(new Error("Can't read the data of '" + n + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(p, T, y) {
        var l = p("./reader/readerFor"), s = p("./utils"), r = p("./signature"), u = p("./zipEntry"), m = p("./support");
        function v(_) {
          this.files = [], this.loadOptions = _;
        }
        v.prototype = { checkSignature: function(_) {
          if (!this.reader.readAndCheckSignature(_)) {
            this.reader.index -= 4;
            var b = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + s.pretty(b) + ", expected " + s.pretty(_) + ")");
          }
        }, isSignature: function(_, b) {
          var i = this.reader.index;
          this.reader.setIndex(_);
          var c = this.reader.readString(4) === b;
          return this.reader.setIndex(i), c;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var _ = this.reader.readData(this.zipCommentLength), b = m.uint8array ? "uint8array" : "array", i = s.transformTo(b, _);
          this.zipComment = this.loadOptions.decodeFileName(i);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var _, b, i, c = this.zip64EndOfCentralSize - 44; 0 < c; ) _ = this.reader.readInt(2), b = this.reader.readInt(4), i = this.reader.readData(b), this.zip64ExtensibleData[_] = { id: _, length: b, value: i };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var _, b;
          for (_ = 0; _ < this.files.length; _++) b = this.files[_], this.reader.setIndex(b.localHeaderOffset), this.checkSignature(r.LOCAL_FILE_HEADER), b.readLocalPart(this.reader), b.handleUTF8(), b.processAttributes();
        }, readCentralDir: function() {
          var _;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(r.CENTRAL_FILE_HEADER); ) (_ = new u({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(_);
          if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var _ = this.reader.lastIndexOfSignature(r.CENTRAL_DIRECTORY_END);
          if (_ < 0) throw this.isSignature(0, r.LOCAL_FILE_HEADER) ? new Error("Corrupted zip: can't find end of central directory") : new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
          this.reader.setIndex(_);
          var b = _;
          if (this.checkSignature(r.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === s.MAX_VALUE_16BITS || this.diskWithCentralDirStart === s.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === s.MAX_VALUE_16BITS || this.centralDirRecords === s.MAX_VALUE_16BITS || this.centralDirSize === s.MAX_VALUE_32BITS || this.centralDirOffset === s.MAX_VALUE_32BITS) {
            if (this.zip64 = !0, (_ = this.reader.lastIndexOfSignature(r.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(_), this.checkSignature(r.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, r.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(r.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(r.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var i = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (i += 20, i += 12 + this.zip64EndOfCentralSize);
          var c = b - i;
          if (0 < c) this.isSignature(b, r.CENTRAL_FILE_HEADER) || (this.reader.zero = c);
          else if (c < 0) throw new Error("Corrupted zip: missing " + Math.abs(c) + " bytes.");
        }, prepareReader: function(_) {
          this.reader = l(_);
        }, load: function(_) {
          this.prepareReader(_), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, T.exports = v;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(p, T, y) {
        var l = p("./reader/readerFor"), s = p("./utils"), r = p("./compressedObject"), u = p("./crc32"), m = p("./utf8"), v = p("./compressions"), _ = p("./support");
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
            for (var a in v) if (Object.prototype.hasOwnProperty.call(v, a) && v[a].magic === h) return v[a];
            return null;
          })(this.compressionMethod)) === null) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
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
            this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = i.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = i.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = i.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = i.readInt(4));
          }
        }, readExtraFields: function(i) {
          var c, n, h, a = i.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); i.index + 4 < a; ) c = i.readInt(2), n = i.readInt(2), h = i.readData(n), this.extraFields[c] = { id: c, length: n, value: h };
          i.setIndex(a);
        }, handleUTF8: function() {
          var i = _.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = m.utf8decode(this.fileName), this.fileCommentStr = m.utf8decode(this.fileComment);
          else {
            var c = this.findExtraFieldUnicodePath();
            if (c !== null) this.fileNameStr = c;
            else {
              var n = s.transformTo(i, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(n);
            }
            var h = this.findExtraFieldUnicodeComment();
            if (h !== null) this.fileCommentStr = h;
            else {
              var a = s.transformTo(i, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(a);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var i = this.extraFields[28789];
          if (i) {
            var c = l(i.value);
            return c.readInt(1) !== 1 || u(this.fileName) !== c.readInt(4) ? null : m.utf8decode(c.readData(i.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var i = this.extraFields[25461];
          if (i) {
            var c = l(i.value);
            return c.readInt(1) !== 1 || u(this.fileComment) !== c.readInt(4) ? null : m.utf8decode(c.readData(i.length - 5));
          }
          return null;
        } }, T.exports = b;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(p, T, y) {
        function l(c, n, h) {
          this.name = c, this.dir = h.dir, this.date = h.date, this.comment = h.comment, this.unixPermissions = h.unixPermissions, this.dosPermissions = h.dosPermissions, this._data = n, this._dataBinary = h.binary, this.options = { compression: h.compression, compressionOptions: h.compressionOptions };
        }
        var s = p("./stream/StreamHelper"), r = p("./stream/DataWorker"), u = p("./utf8"), m = p("./compressedObject"), v = p("./stream/GenericWorker");
        l.prototype = { internalStream: function(c) {
          var n = null, h = "string";
          try {
            if (!c) throw new Error("No output type specified.");
            var a = (h = c.toLowerCase()) === "string" || h === "text";
            h !== "binarystring" && h !== "text" || (h = "string"), n = this._decompressWorker();
            var d = !this._dataBinary;
            d && !a && (n = n.pipe(new u.Utf8EncodeWorker())), !d && a && (n = n.pipe(new u.Utf8DecodeWorker()));
          } catch (w) {
            (n = new v("error")).error(w);
          }
          return new s(n, h, "");
        }, async: function(c, n) {
          return this.internalStream(c).accumulate(n);
        }, nodeStream: function(c, n) {
          return this.internalStream(c || "nodebuffer").toNodejsStream(n);
        }, _compressWorker: function(c, n) {
          if (this._data instanceof m && this._data.compression.magic === c.magic) return this._data.getCompressedWorker();
          var h = this._decompressWorker();
          return this._dataBinary || (h = h.pipe(new u.Utf8EncodeWorker())), m.createWorkerFrom(h, c, n);
        }, _decompressWorker: function() {
          return this._data instanceof m ? this._data.getContentWorker() : this._data instanceof v ? this._data : new r(this._data);
        } };
        for (var _ = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], b = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, i = 0; i < _.length; i++) l.prototype[_[i]] = b;
        T.exports = l;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(p, T, y) {
        (function(l) {
          var s, r, u = l.MutationObserver || l.WebKitMutationObserver;
          if (u) {
            var m = 0, v = new u(c), _ = l.document.createTextNode("");
            v.observe(_, { characterData: !0 }), s = function() {
              _.data = m = ++m % 2;
            };
          } else if (l.setImmediate || l.MessageChannel === void 0) s = "document" in l && "onreadystatechange" in l.document.createElement("script") ? function() {
            var n = l.document.createElement("script");
            n.onreadystatechange = function() {
              c(), n.onreadystatechange = null, n.parentNode.removeChild(n), n = null;
            }, l.document.documentElement.appendChild(n);
          } : function() {
            setTimeout(c, 0);
          };
          else {
            var b = new l.MessageChannel();
            b.port1.onmessage = c, s = function() {
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
          T.exports = function(n) {
            i.push(n) !== 1 || r || s();
          };
        }).call(this, typeof vt < "u" ? vt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}], 37: [function(p, T, y) {
        var l = p("immediate");
        function s() {
        }
        var r = {}, u = ["REJECTED"], m = ["FULFILLED"], v = ["PENDING"];
        function _(a) {
          if (typeof a != "function") throw new TypeError("resolver must be a function");
          this.state = v, this.queue = [], this.outcome = void 0, a !== s && n(this, a);
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
        (T.exports = _).prototype.finally = function(a) {
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
        }, _.prototype.catch = function(a) {
          return this.then(null, a);
        }, _.prototype.then = function(a, d) {
          if (typeof a != "function" && this.state === m || typeof d != "function" && this.state === u) return this;
          var w = new this.constructor(s);
          return this.state !== v ? i(w, this.state === m ? a : d, this.outcome) : this.queue.push(new b(w, a, d)), w;
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
            a.state = m, a.outcome = d;
            for (var x = -1, F = a.queue.length; ++x < F; ) a.queue[x].callFulfilled(d);
          }
          return a;
        }, r.reject = function(a, d) {
          a.state = u, a.outcome = d;
          for (var w = -1, S = a.queue.length; ++w < S; ) a.queue[w].callRejected(d);
          return a;
        }, _.resolve = function(a) {
          return a instanceof this ? a : r.resolve(new this(s), a);
        }, _.reject = function(a) {
          var d = new this(s);
          return r.reject(d, a);
        }, _.all = function(a) {
          var d = this;
          if (Object.prototype.toString.call(a) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var w = a.length, S = !1;
          if (!w) return this.resolve([]);
          for (var x = new Array(w), F = 0, O = -1, P = new this(s); ++O < w; ) I(a[O], O);
          return P;
          function I(Z, q) {
            d.resolve(Z).then(function(g) {
              x[q] = g, ++F !== w || S || (S = !0, r.resolve(P, x));
            }, function(g) {
              S || (S = !0, r.reject(P, g));
            });
          }
        }, _.race = function(a) {
          var d = this;
          if (Object.prototype.toString.call(a) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var w = a.length, S = !1;
          if (!w) return this.resolve([]);
          for (var x = -1, F = new this(s); ++x < w; ) O = a[x], d.resolve(O).then(function(P) {
            S || (S = !0, r.resolve(F, P));
          }, function(P) {
            S || (S = !0, r.reject(F, P));
          });
          var O;
          return F;
        };
      }, { immediate: 36 }], 38: [function(p, T, y) {
        var l = {};
        (0, p("./lib/utils/common").assign)(l, p("./lib/deflate"), p("./lib/inflate"), p("./lib/zlib/constants")), T.exports = l;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(p, T, y) {
        var l = p("./zlib/deflate"), s = p("./utils/common"), r = p("./utils/strings"), u = p("./zlib/messages"), m = p("./zlib/zstream"), v = Object.prototype.toString, _ = 0, b = -1, i = 0, c = 8;
        function n(a) {
          if (!(this instanceof n)) return new n(a);
          this.options = s.assign({ level: b, method: c, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: i, to: "" }, a || {});
          var d = this.options;
          d.raw && 0 < d.windowBits ? d.windowBits = -d.windowBits : d.gzip && 0 < d.windowBits && d.windowBits < 16 && (d.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new m(), this.strm.avail_out = 0;
          var w = l.deflateInit2(this.strm, d.level, d.method, d.windowBits, d.memLevel, d.strategy);
          if (w !== _) throw new Error(u[w]);
          if (d.header && l.deflateSetHeader(this.strm, d.header), d.dictionary) {
            var S;
            if (S = typeof d.dictionary == "string" ? r.string2buf(d.dictionary) : v.call(d.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(d.dictionary) : d.dictionary, (w = l.deflateSetDictionary(this.strm, S)) !== _) throw new Error(u[w]);
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
          S = d === ~~d ? d : d === !0 ? 4 : 0, typeof a == "string" ? x.input = r.string2buf(a) : v.call(a) === "[object ArrayBuffer]" ? x.input = new Uint8Array(a) : x.input = a, x.next_in = 0, x.avail_in = x.input.length;
          do {
            if (x.avail_out === 0 && (x.output = new s.Buf8(F), x.next_out = 0, x.avail_out = F), (w = l.deflate(x, S)) !== 1 && w !== _) return this.onEnd(w), !(this.ended = !0);
            x.avail_out !== 0 && (x.avail_in !== 0 || S !== 4 && S !== 2) || (this.options.to === "string" ? this.onData(r.buf2binstring(s.shrinkBuf(x.output, x.next_out))) : this.onData(s.shrinkBuf(x.output, x.next_out)));
          } while ((0 < x.avail_in || x.avail_out === 0) && w !== 1);
          return S === 4 ? (w = l.deflateEnd(this.strm), this.onEnd(w), this.ended = !0, w === _) : S !== 2 || (this.onEnd(_), !(x.avail_out = 0));
        }, n.prototype.onData = function(a) {
          this.chunks.push(a);
        }, n.prototype.onEnd = function(a) {
          a === _ && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = s.flattenChunks(this.chunks)), this.chunks = [], this.err = a, this.msg = this.strm.msg;
        }, y.Deflate = n, y.deflate = h, y.deflateRaw = function(a, d) {
          return (d = d || {}).raw = !0, h(a, d);
        }, y.gzip = function(a, d) {
          return (d = d || {}).gzip = !0, h(a, d);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(p, T, y) {
        var l = p("./zlib/inflate"), s = p("./utils/common"), r = p("./utils/strings"), u = p("./zlib/constants"), m = p("./zlib/messages"), v = p("./zlib/zstream"), _ = p("./zlib/gzheader"), b = Object.prototype.toString;
        function i(n) {
          if (!(this instanceof i)) return new i(n);
          this.options = s.assign({ chunkSize: 16384, windowBits: 0, to: "" }, n || {});
          var h = this.options;
          h.raw && 0 <= h.windowBits && h.windowBits < 16 && (h.windowBits = -h.windowBits, h.windowBits === 0 && (h.windowBits = -15)), !(0 <= h.windowBits && h.windowBits < 16) || n && n.windowBits || (h.windowBits += 32), 15 < h.windowBits && h.windowBits < 48 && (15 & h.windowBits) == 0 && (h.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new v(), this.strm.avail_out = 0;
          var a = l.inflateInit2(this.strm, h.windowBits);
          if (a !== u.Z_OK) throw new Error(m[a]);
          this.header = new _(), l.inflateGetHeader(this.strm, this.header);
        }
        function c(n, h) {
          var a = new i(h);
          if (a.push(n, !0), a.err) throw a.msg || m[a.err];
          return a.result;
        }
        i.prototype.push = function(n, h) {
          var a, d, w, S, x, F, O = this.strm, P = this.options.chunkSize, I = this.options.dictionary, Z = !1;
          if (this.ended) return !1;
          d = h === ~~h ? h : h === !0 ? u.Z_FINISH : u.Z_NO_FLUSH, typeof n == "string" ? O.input = r.binstring2buf(n) : b.call(n) === "[object ArrayBuffer]" ? O.input = new Uint8Array(n) : O.input = n, O.next_in = 0, O.avail_in = O.input.length;
          do {
            if (O.avail_out === 0 && (O.output = new s.Buf8(P), O.next_out = 0, O.avail_out = P), (a = l.inflate(O, u.Z_NO_FLUSH)) === u.Z_NEED_DICT && I && (F = typeof I == "string" ? r.string2buf(I) : b.call(I) === "[object ArrayBuffer]" ? new Uint8Array(I) : I, a = l.inflateSetDictionary(this.strm, F)), a === u.Z_BUF_ERROR && Z === !0 && (a = u.Z_OK, Z = !1), a !== u.Z_STREAM_END && a !== u.Z_OK) return this.onEnd(a), !(this.ended = !0);
            O.next_out && (O.avail_out !== 0 && a !== u.Z_STREAM_END && (O.avail_in !== 0 || d !== u.Z_FINISH && d !== u.Z_SYNC_FLUSH) || (this.options.to === "string" ? (w = r.utf8border(O.output, O.next_out), S = O.next_out - w, x = r.buf2string(O.output, w), O.next_out = S, O.avail_out = P - S, S && s.arraySet(O.output, O.output, w, S, 0), this.onData(x)) : this.onData(s.shrinkBuf(O.output, O.next_out)))), O.avail_in === 0 && O.avail_out === 0 && (Z = !0);
          } while ((0 < O.avail_in || O.avail_out === 0) && a !== u.Z_STREAM_END);
          return a === u.Z_STREAM_END && (d = u.Z_FINISH), d === u.Z_FINISH ? (a = l.inflateEnd(this.strm), this.onEnd(a), this.ended = !0, a === u.Z_OK) : d !== u.Z_SYNC_FLUSH || (this.onEnd(u.Z_OK), !(O.avail_out = 0));
        }, i.prototype.onData = function(n) {
          this.chunks.push(n);
        }, i.prototype.onEnd = function(n) {
          n === u.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = s.flattenChunks(this.chunks)), this.chunks = [], this.err = n, this.msg = this.strm.msg;
        }, y.Inflate = i, y.inflate = c, y.inflateRaw = function(n, h) {
          return (h = h || {}).raw = !0, c(n, h);
        }, y.ungzip = c;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(p, T, y) {
        var l = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
        y.assign = function(u) {
          for (var m = Array.prototype.slice.call(arguments, 1); m.length; ) {
            var v = m.shift();
            if (v) {
              if (typeof v != "object") throw new TypeError(v + "must be non-object");
              for (var _ in v) v.hasOwnProperty(_) && (u[_] = v[_]);
            }
          }
          return u;
        }, y.shrinkBuf = function(u, m) {
          return u.length === m ? u : u.subarray ? u.subarray(0, m) : (u.length = m, u);
        };
        var s = { arraySet: function(u, m, v, _, b) {
          if (m.subarray && u.subarray) u.set(m.subarray(v, v + _), b);
          else for (var i = 0; i < _; i++) u[b + i] = m[v + i];
        }, flattenChunks: function(u) {
          var m, v, _, b, i, c;
          for (m = _ = 0, v = u.length; m < v; m++) _ += u[m].length;
          for (c = new Uint8Array(_), m = b = 0, v = u.length; m < v; m++) i = u[m], c.set(i, b), b += i.length;
          return c;
        } }, r = { arraySet: function(u, m, v, _, b) {
          for (var i = 0; i < _; i++) u[b + i] = m[v + i];
        }, flattenChunks: function(u) {
          return [].concat.apply([], u);
        } };
        y.setTyped = function(u) {
          u ? (y.Buf8 = Uint8Array, y.Buf16 = Uint16Array, y.Buf32 = Int32Array, y.assign(y, s)) : (y.Buf8 = Array, y.Buf16 = Array, y.Buf32 = Array, y.assign(y, r));
        }, y.setTyped(l);
      }, {}], 42: [function(p, T, y) {
        var l = p("./common"), s = !0, r = !0;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch {
          s = !1;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch {
          r = !1;
        }
        for (var u = new l.Buf8(256), m = 0; m < 256; m++) u[m] = 252 <= m ? 6 : 248 <= m ? 5 : 240 <= m ? 4 : 224 <= m ? 3 : 192 <= m ? 2 : 1;
        function v(_, b) {
          if (b < 65537 && (_.subarray && r || !_.subarray && s)) return String.fromCharCode.apply(null, l.shrinkBuf(_, b));
          for (var i = "", c = 0; c < b; c++) i += String.fromCharCode(_[c]);
          return i;
        }
        u[254] = u[254] = 1, y.string2buf = function(_) {
          var b, i, c, n, h, a = _.length, d = 0;
          for (n = 0; n < a; n++) (64512 & (i = _.charCodeAt(n))) == 55296 && n + 1 < a && (64512 & (c = _.charCodeAt(n + 1))) == 56320 && (i = 65536 + (i - 55296 << 10) + (c - 56320), n++), d += i < 128 ? 1 : i < 2048 ? 2 : i < 65536 ? 3 : 4;
          for (b = new l.Buf8(d), n = h = 0; h < d; n++) (64512 & (i = _.charCodeAt(n))) == 55296 && n + 1 < a && (64512 & (c = _.charCodeAt(n + 1))) == 56320 && (i = 65536 + (i - 55296 << 10) + (c - 56320), n++), i < 128 ? b[h++] = i : (i < 2048 ? b[h++] = 192 | i >>> 6 : (i < 65536 ? b[h++] = 224 | i >>> 12 : (b[h++] = 240 | i >>> 18, b[h++] = 128 | i >>> 12 & 63), b[h++] = 128 | i >>> 6 & 63), b[h++] = 128 | 63 & i);
          return b;
        }, y.buf2binstring = function(_) {
          return v(_, _.length);
        }, y.binstring2buf = function(_) {
          for (var b = new l.Buf8(_.length), i = 0, c = b.length; i < c; i++) b[i] = _.charCodeAt(i);
          return b;
        }, y.buf2string = function(_, b) {
          var i, c, n, h, a = b || _.length, d = new Array(2 * a);
          for (i = c = 0; i < a; ) if ((n = _[i++]) < 128) d[c++] = n;
          else if (4 < (h = u[n])) d[c++] = 65533, i += h - 1;
          else {
            for (n &= h === 2 ? 31 : h === 3 ? 15 : 7; 1 < h && i < a; ) n = n << 6 | 63 & _[i++], h--;
            1 < h ? d[c++] = 65533 : n < 65536 ? d[c++] = n : (n -= 65536, d[c++] = 55296 | n >> 10 & 1023, d[c++] = 56320 | 1023 & n);
          }
          return v(d, c);
        }, y.utf8border = function(_, b) {
          var i;
          for ((b = b || _.length) > _.length && (b = _.length), i = b - 1; 0 <= i && (192 & _[i]) == 128; ) i--;
          return i < 0 || i === 0 ? b : i + u[_[i]] > b ? i : b;
        };
      }, { "./common": 41 }], 43: [function(p, T, y) {
        T.exports = function(l, s, r, u) {
          for (var m = 65535 & l | 0, v = l >>> 16 & 65535 | 0, _ = 0; r !== 0; ) {
            for (r -= _ = 2e3 < r ? 2e3 : r; v = v + (m = m + s[u++] | 0) | 0, --_; ) ;
            m %= 65521, v %= 65521;
          }
          return m | v << 16 | 0;
        };
      }, {}], 44: [function(p, T, y) {
        T.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(p, T, y) {
        var l = (function() {
          for (var s, r = [], u = 0; u < 256; u++) {
            s = u;
            for (var m = 0; m < 8; m++) s = 1 & s ? 3988292384 ^ s >>> 1 : s >>> 1;
            r[u] = s;
          }
          return r;
        })();
        T.exports = function(s, r, u, m) {
          var v = l, _ = m + u;
          s ^= -1;
          for (var b = m; b < _; b++) s = s >>> 8 ^ v[255 & (s ^ r[b])];
          return -1 ^ s;
        };
      }, {}], 46: [function(p, T, y) {
        var l, s = p("../utils/common"), r = p("./trees"), u = p("./adler32"), m = p("./crc32"), v = p("./messages"), _ = 0, b = 4, i = 0, c = -2, n = -1, h = 4, a = 2, d = 8, w = 9, S = 286, x = 30, F = 19, O = 2 * S + 1, P = 15, I = 3, Z = 258, q = Z + I + 1, g = 42, B = 113, e = 1, D = 2, J = 3, N = 4;
        function $(t, R) {
          return t.msg = v[R], R;
        }
        function j(t) {
          return (t << 1) - (4 < t ? 9 : 0);
        }
        function V(t) {
          for (var R = t.length; 0 <= --R; ) t[R] = 0;
        }
        function E(t) {
          var R = t.state, A = R.pending;
          A > t.avail_out && (A = t.avail_out), A !== 0 && (s.arraySet(t.output, R.pending_buf, R.pending_out, A, t.next_out), t.next_out += A, R.pending_out += A, t.total_out += A, t.avail_out -= A, R.pending -= A, R.pending === 0 && (R.pending_out = 0));
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
          var A, f, o = t.max_chain_length, k = t.strstart, U = t.prev_length, L = t.nice_match, z = t.strstart > t.w_size - q ? t.strstart - (t.w_size - q) : 0, W = t.window, K = t.w_mask, M = t.prev, Y = t.strstart + Z, it = W[k + U - 1], et = W[k + U];
          t.prev_length >= t.good_match && (o >>= 2), L > t.lookahead && (L = t.lookahead);
          do
            if (W[(A = R) + U] === et && W[A + U - 1] === it && W[A] === W[k] && W[++A] === W[k + 1]) {
              k += 2, A++;
              do
                ;
              while (W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && W[++k] === W[++A] && k < Y);
              if (f = Z - (Y - k), k = Y - Z, U < f) {
                if (t.match_start = R, L <= (U = f)) break;
                it = W[k + U - 1], et = W[k + U];
              }
            }
          while ((R = M[R & K]) > z && --o != 0);
          return U <= t.lookahead ? U : t.lookahead;
        }
        function at(t) {
          var R, A, f, o, k, U, L, z, W, K, M = t.w_size;
          do {
            if (o = t.window_size - t.lookahead - t.strstart, t.strstart >= M + (M - q)) {
              for (s.arraySet(t.window, t.window, M, M, 0), t.match_start -= M, t.strstart -= M, t.block_start -= M, R = A = t.hash_size; f = t.head[--R], t.head[R] = M <= f ? f - M : 0, --A; ) ;
              for (R = A = M; f = t.prev[--R], t.prev[R] = M <= f ? f - M : 0, --A; ) ;
              o += M;
            }
            if (t.strm.avail_in === 0) break;
            if (U = t.strm, L = t.window, z = t.strstart + t.lookahead, W = o, K = void 0, K = U.avail_in, W < K && (K = W), A = K === 0 ? 0 : (U.avail_in -= K, s.arraySet(L, U.input, U.next_in, K, z), U.state.wrap === 1 ? U.adler = u(U.adler, L, K, z) : U.state.wrap === 2 && (U.adler = m(U.adler, L, K, z)), U.next_in += K, U.total_in += K, K), t.lookahead += A, t.lookahead + t.insert >= I) for (k = t.strstart - t.insert, t.ins_h = t.window[k], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[k + 1]) & t.hash_mask; t.insert && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[k + I - 1]) & t.hash_mask, t.prev[k & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = k, k++, t.insert--, !(t.lookahead + t.insert < I)); ) ;
          } while (t.lookahead < q && t.strm.avail_in !== 0);
        }
        function ut(t, R) {
          for (var A, f; ; ) {
            if (t.lookahead < q) {
              if (at(t), t.lookahead < q && R === _) return e;
              if (t.lookahead === 0) break;
            }
            if (A = 0, t.lookahead >= I && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), A !== 0 && t.strstart - A <= t.w_size - q && (t.match_length = H(t, A)), t.match_length >= I) if (f = r._tr_tally(t, t.strstart - t.match_start, t.match_length - I), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= I) {
              for (t.match_length--; t.strstart++, t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart, --t.match_length != 0; ) ;
              t.strstart++;
            } else t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + 1]) & t.hash_mask;
            else f = r._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
            if (f && (C(t, !1), t.strm.avail_out === 0)) return e;
          }
          return t.insert = t.strstart < I - 1 ? t.strstart : I - 1, R === b ? (C(t, !0), t.strm.avail_out === 0 ? J : N) : t.last_lit && (C(t, !1), t.strm.avail_out === 0) ? e : D;
        }
        function tt(t, R) {
          for (var A, f, o; ; ) {
            if (t.lookahead < q) {
              if (at(t), t.lookahead < q && R === _) return e;
              if (t.lookahead === 0) break;
            }
            if (A = 0, t.lookahead >= I && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = I - 1, A !== 0 && t.prev_length < t.max_lazy_match && t.strstart - A <= t.w_size - q && (t.match_length = H(t, A), t.match_length <= 5 && (t.strategy === 1 || t.match_length === I && 4096 < t.strstart - t.match_start) && (t.match_length = I - 1)), t.prev_length >= I && t.match_length <= t.prev_length) {
              for (o = t.strstart + t.lookahead - I, f = r._tr_tally(t, t.strstart - 1 - t.prev_match, t.prev_length - I), t.lookahead -= t.prev_length - 1, t.prev_length -= 2; ++t.strstart <= o && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + I - 1]) & t.hash_mask, A = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), --t.prev_length != 0; ) ;
              if (t.match_available = 0, t.match_length = I - 1, t.strstart++, f && (C(t, !1), t.strm.avail_out === 0)) return e;
            } else if (t.match_available) {
              if ((f = r._tr_tally(t, 0, t.window[t.strstart - 1])) && C(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0) return e;
            } else t.match_available = 1, t.strstart++, t.lookahead--;
          }
          return t.match_available && (f = r._tr_tally(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < I - 1 ? t.strstart : I - 1, R === b ? (C(t, !0), t.strm.avail_out === 0 ? J : N) : t.last_lit && (C(t, !1), t.strm.avail_out === 0) ? e : D;
        }
        function rt(t, R, A, f, o) {
          this.good_length = t, this.max_lazy = R, this.nice_length = A, this.max_chain = f, this.func = o;
        }
        function lt() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = d, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new s.Buf16(2 * O), this.dyn_dtree = new s.Buf16(2 * (2 * x + 1)), this.bl_tree = new s.Buf16(2 * (2 * F + 1)), V(this.dyn_ltree), V(this.dyn_dtree), V(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new s.Buf16(P + 1), this.heap = new s.Buf16(2 * S + 1), V(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new s.Buf16(2 * S + 1), V(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function st(t) {
          var R;
          return t && t.state ? (t.total_in = t.total_out = 0, t.data_type = a, (R = t.state).pending = 0, R.pending_out = 0, R.wrap < 0 && (R.wrap = -R.wrap), R.status = R.wrap ? g : B, t.adler = R.wrap === 2 ? 0 : 1, R.last_flush = _, r._tr_init(R), i) : $(t, c);
        }
        function ct(t) {
          var R = st(t);
          return R === i && (function(A) {
            A.window_size = 2 * A.w_size, V(A.head), A.max_lazy_match = l[A.level].max_lazy, A.good_match = l[A.level].good_length, A.nice_match = l[A.level].nice_length, A.max_chain_length = l[A.level].max_chain, A.strstart = 0, A.block_start = 0, A.lookahead = 0, A.insert = 0, A.match_length = A.prev_length = I - 1, A.match_available = 0, A.ins_h = 0;
          })(t.state), R;
        }
        function ft(t, R, A, f, o, k) {
          if (!t) return c;
          var U = 1;
          if (R === n && (R = 6), f < 0 ? (U = 0, f = -f) : 15 < f && (U = 2, f -= 16), o < 1 || w < o || A !== d || f < 8 || 15 < f || R < 0 || 9 < R || k < 0 || h < k) return $(t, c);
          f === 8 && (f = 9);
          var L = new lt();
          return (t.state = L).strm = t, L.wrap = U, L.gzhead = null, L.w_bits = f, L.w_size = 1 << L.w_bits, L.w_mask = L.w_size - 1, L.hash_bits = o + 7, L.hash_size = 1 << L.hash_bits, L.hash_mask = L.hash_size - 1, L.hash_shift = ~~((L.hash_bits + I - 1) / I), L.window = new s.Buf8(2 * L.w_size), L.head = new s.Buf16(L.hash_size), L.prev = new s.Buf16(L.w_size), L.lit_bufsize = 1 << o + 6, L.pending_buf_size = 4 * L.lit_bufsize, L.pending_buf = new s.Buf8(L.pending_buf_size), L.d_buf = 1 * L.lit_bufsize, L.l_buf = 3 * L.lit_bufsize, L.level = R, L.strategy = k, L.method = A, ct(t);
        }
        l = [new rt(0, 0, 0, 0, function(t, R) {
          var A = 65535;
          for (A > t.pending_buf_size - 5 && (A = t.pending_buf_size - 5); ; ) {
            if (t.lookahead <= 1) {
              if (at(t), t.lookahead === 0 && R === _) return e;
              if (t.lookahead === 0) break;
            }
            t.strstart += t.lookahead, t.lookahead = 0;
            var f = t.block_start + A;
            if ((t.strstart === 0 || t.strstart >= f) && (t.lookahead = t.strstart - f, t.strstart = f, C(t, !1), t.strm.avail_out === 0) || t.strstart - t.block_start >= t.w_size - q && (C(t, !1), t.strm.avail_out === 0)) return e;
          }
          return t.insert = 0, R === b ? (C(t, !0), t.strm.avail_out === 0 ? J : N) : (t.strstart > t.block_start && (C(t, !1), t.strm.avail_out), e);
        }), new rt(4, 4, 8, 4, ut), new rt(4, 5, 16, 8, ut), new rt(4, 6, 32, 32, ut), new rt(4, 4, 16, 16, tt), new rt(8, 16, 32, 32, tt), new rt(8, 16, 128, 128, tt), new rt(8, 32, 128, 256, tt), new rt(32, 128, 258, 1024, tt), new rt(32, 258, 258, 4096, tt)], y.deflateInit = function(t, R) {
          return ft(t, R, d, 15, 8, 0);
        }, y.deflateInit2 = ft, y.deflateReset = ct, y.deflateResetKeep = st, y.deflateSetHeader = function(t, R) {
          return t && t.state ? t.state.wrap !== 2 ? c : (t.state.gzhead = R, i) : c;
        }, y.deflate = function(t, R) {
          var A, f, o, k;
          if (!t || !t.state || 5 < R || R < 0) return t ? $(t, c) : c;
          if (f = t.state, !t.output || !t.input && t.avail_in !== 0 || f.status === 666 && R !== b) return $(t, t.avail_out === 0 ? -5 : c);
          if (f.strm = t, A = f.last_flush, f.last_flush = R, f.status === g) if (f.wrap === 2) t.adler = 0, X(f, 31), X(f, 139), X(f, 8), f.gzhead ? (X(f, (f.gzhead.text ? 1 : 0) + (f.gzhead.hcrc ? 2 : 0) + (f.gzhead.extra ? 4 : 0) + (f.gzhead.name ? 8 : 0) + (f.gzhead.comment ? 16 : 0)), X(f, 255 & f.gzhead.time), X(f, f.gzhead.time >> 8 & 255), X(f, f.gzhead.time >> 16 & 255), X(f, f.gzhead.time >> 24 & 255), X(f, f.level === 9 ? 2 : 2 <= f.strategy || f.level < 2 ? 4 : 0), X(f, 255 & f.gzhead.os), f.gzhead.extra && f.gzhead.extra.length && (X(f, 255 & f.gzhead.extra.length), X(f, f.gzhead.extra.length >> 8 & 255)), f.gzhead.hcrc && (t.adler = m(t.adler, f.pending_buf, f.pending, 0)), f.gzindex = 0, f.status = 69) : (X(f, 0), X(f, 0), X(f, 0), X(f, 0), X(f, 0), X(f, f.level === 9 ? 2 : 2 <= f.strategy || f.level < 2 ? 4 : 0), X(f, 3), f.status = B);
          else {
            var U = d + (f.w_bits - 8 << 4) << 8;
            U |= (2 <= f.strategy || f.level < 2 ? 0 : f.level < 6 ? 1 : f.level === 6 ? 2 : 3) << 6, f.strstart !== 0 && (U |= 32), U += 31 - U % 31, f.status = B, G(f, U), f.strstart !== 0 && (G(f, t.adler >>> 16), G(f, 65535 & t.adler)), t.adler = 1;
          }
          if (f.status === 69) if (f.gzhead.extra) {
            for (o = f.pending; f.gzindex < (65535 & f.gzhead.extra.length) && (f.pending !== f.pending_buf_size || (f.gzhead.hcrc && f.pending > o && (t.adler = m(t.adler, f.pending_buf, f.pending - o, o)), E(t), o = f.pending, f.pending !== f.pending_buf_size)); ) X(f, 255 & f.gzhead.extra[f.gzindex]), f.gzindex++;
            f.gzhead.hcrc && f.pending > o && (t.adler = m(t.adler, f.pending_buf, f.pending - o, o)), f.gzindex === f.gzhead.extra.length && (f.gzindex = 0, f.status = 73);
          } else f.status = 73;
          if (f.status === 73) if (f.gzhead.name) {
            o = f.pending;
            do {
              if (f.pending === f.pending_buf_size && (f.gzhead.hcrc && f.pending > o && (t.adler = m(t.adler, f.pending_buf, f.pending - o, o)), E(t), o = f.pending, f.pending === f.pending_buf_size)) {
                k = 1;
                break;
              }
              k = f.gzindex < f.gzhead.name.length ? 255 & f.gzhead.name.charCodeAt(f.gzindex++) : 0, X(f, k);
            } while (k !== 0);
            f.gzhead.hcrc && f.pending > o && (t.adler = m(t.adler, f.pending_buf, f.pending - o, o)), k === 0 && (f.gzindex = 0, f.status = 91);
          } else f.status = 91;
          if (f.status === 91) if (f.gzhead.comment) {
            o = f.pending;
            do {
              if (f.pending === f.pending_buf_size && (f.gzhead.hcrc && f.pending > o && (t.adler = m(t.adler, f.pending_buf, f.pending - o, o)), E(t), o = f.pending, f.pending === f.pending_buf_size)) {
                k = 1;
                break;
              }
              k = f.gzindex < f.gzhead.comment.length ? 255 & f.gzhead.comment.charCodeAt(f.gzindex++) : 0, X(f, k);
            } while (k !== 0);
            f.gzhead.hcrc && f.pending > o && (t.adler = m(t.adler, f.pending_buf, f.pending - o, o)), k === 0 && (f.status = 103);
          } else f.status = 103;
          if (f.status === 103 && (f.gzhead.hcrc ? (f.pending + 2 > f.pending_buf_size && E(t), f.pending + 2 <= f.pending_buf_size && (X(f, 255 & t.adler), X(f, t.adler >> 8 & 255), t.adler = 0, f.status = B)) : f.status = B), f.pending !== 0) {
            if (E(t), t.avail_out === 0) return f.last_flush = -1, i;
          } else if (t.avail_in === 0 && j(R) <= j(A) && R !== b) return $(t, -5);
          if (f.status === 666 && t.avail_in !== 0) return $(t, -5);
          if (t.avail_in !== 0 || f.lookahead !== 0 || R !== _ && f.status !== 666) {
            var L = f.strategy === 2 ? (function(z, W) {
              for (var K; ; ) {
                if (z.lookahead === 0 && (at(z), z.lookahead === 0)) {
                  if (W === _) return e;
                  break;
                }
                if (z.match_length = 0, K = r._tr_tally(z, 0, z.window[z.strstart]), z.lookahead--, z.strstart++, K && (C(z, !1), z.strm.avail_out === 0)) return e;
              }
              return z.insert = 0, W === b ? (C(z, !0), z.strm.avail_out === 0 ? J : N) : z.last_lit && (C(z, !1), z.strm.avail_out === 0) ? e : D;
            })(f, R) : f.strategy === 3 ? (function(z, W) {
              for (var K, M, Y, it, et = z.window; ; ) {
                if (z.lookahead <= Z) {
                  if (at(z), z.lookahead <= Z && W === _) return e;
                  if (z.lookahead === 0) break;
                }
                if (z.match_length = 0, z.lookahead >= I && 0 < z.strstart && (M = et[Y = z.strstart - 1]) === et[++Y] && M === et[++Y] && M === et[++Y]) {
                  it = z.strstart + Z;
                  do
                    ;
                  while (M === et[++Y] && M === et[++Y] && M === et[++Y] && M === et[++Y] && M === et[++Y] && M === et[++Y] && M === et[++Y] && M === et[++Y] && Y < it);
                  z.match_length = Z - (it - Y), z.match_length > z.lookahead && (z.match_length = z.lookahead);
                }
                if (z.match_length >= I ? (K = r._tr_tally(z, 1, z.match_length - I), z.lookahead -= z.match_length, z.strstart += z.match_length, z.match_length = 0) : (K = r._tr_tally(z, 0, z.window[z.strstart]), z.lookahead--, z.strstart++), K && (C(z, !1), z.strm.avail_out === 0)) return e;
              }
              return z.insert = 0, W === b ? (C(z, !0), z.strm.avail_out === 0 ? J : N) : z.last_lit && (C(z, !1), z.strm.avail_out === 0) ? e : D;
            })(f, R) : l[f.level].func(f, R);
            if (L !== J && L !== N || (f.status = 666), L === e || L === J) return t.avail_out === 0 && (f.last_flush = -1), i;
            if (L === D && (R === 1 ? r._tr_align(f) : R !== 5 && (r._tr_stored_block(f, 0, 0, !1), R === 3 && (V(f.head), f.lookahead === 0 && (f.strstart = 0, f.block_start = 0, f.insert = 0))), E(t), t.avail_out === 0)) return f.last_flush = -1, i;
          }
          return R !== b ? i : f.wrap <= 0 ? 1 : (f.wrap === 2 ? (X(f, 255 & t.adler), X(f, t.adler >> 8 & 255), X(f, t.adler >> 16 & 255), X(f, t.adler >> 24 & 255), X(f, 255 & t.total_in), X(f, t.total_in >> 8 & 255), X(f, t.total_in >> 16 & 255), X(f, t.total_in >> 24 & 255)) : (G(f, t.adler >>> 16), G(f, 65535 & t.adler)), E(t), 0 < f.wrap && (f.wrap = -f.wrap), f.pending !== 0 ? i : 1);
        }, y.deflateEnd = function(t) {
          var R;
          return t && t.state ? (R = t.state.status) !== g && R !== 69 && R !== 73 && R !== 91 && R !== 103 && R !== B && R !== 666 ? $(t, c) : (t.state = null, R === B ? $(t, -3) : i) : c;
        }, y.deflateSetDictionary = function(t, R) {
          var A, f, o, k, U, L, z, W, K = R.length;
          if (!t || !t.state || (k = (A = t.state).wrap) === 2 || k === 1 && A.status !== g || A.lookahead) return c;
          for (k === 1 && (t.adler = u(t.adler, R, K, 0)), A.wrap = 0, K >= A.w_size && (k === 0 && (V(A.head), A.strstart = 0, A.block_start = 0, A.insert = 0), W = new s.Buf8(A.w_size), s.arraySet(W, R, K - A.w_size, A.w_size, 0), R = W, K = A.w_size), U = t.avail_in, L = t.next_in, z = t.input, t.avail_in = K, t.next_in = 0, t.input = R, at(A); A.lookahead >= I; ) {
            for (f = A.strstart, o = A.lookahead - (I - 1); A.ins_h = (A.ins_h << A.hash_shift ^ A.window[f + I - 1]) & A.hash_mask, A.prev[f & A.w_mask] = A.head[A.ins_h], A.head[A.ins_h] = f, f++, --o; ) ;
            A.strstart = f, A.lookahead = I - 1, at(A);
          }
          return A.strstart += A.lookahead, A.block_start = A.strstart, A.insert = A.lookahead, A.lookahead = 0, A.match_length = A.prev_length = I - 1, A.match_available = 0, t.next_in = L, t.input = z, t.avail_in = U, A.wrap = k, i;
        }, y.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(p, T, y) {
        T.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
        };
      }, {}], 48: [function(p, T, y) {
        T.exports = function(l, s) {
          var r, u, m, v, _, b, i, c, n, h, a, d, w, S, x, F, O, P, I, Z, q, g, B, e, D;
          r = l.state, u = l.next_in, e = l.input, m = u + (l.avail_in - 5), v = l.next_out, D = l.output, _ = v - (s - l.avail_out), b = v + (l.avail_out - 257), i = r.dmax, c = r.wsize, n = r.whave, h = r.wnext, a = r.window, d = r.hold, w = r.bits, S = r.lencode, x = r.distcode, F = (1 << r.lenbits) - 1, O = (1 << r.distbits) - 1;
          t: do {
            w < 15 && (d += e[u++] << w, w += 8, d += e[u++] << w, w += 8), P = S[d & F];
            e: for (; ; ) {
              if (d >>>= I = P >>> 24, w -= I, (I = P >>> 16 & 255) === 0) D[v++] = 65535 & P;
              else {
                if (!(16 & I)) {
                  if ((64 & I) == 0) {
                    P = S[(65535 & P) + (d & (1 << I) - 1)];
                    continue e;
                  }
                  if (32 & I) {
                    r.mode = 12;
                    break t;
                  }
                  l.msg = "invalid literal/length code", r.mode = 30;
                  break t;
                }
                Z = 65535 & P, (I &= 15) && (w < I && (d += e[u++] << w, w += 8), Z += d & (1 << I) - 1, d >>>= I, w -= I), w < 15 && (d += e[u++] << w, w += 8, d += e[u++] << w, w += 8), P = x[d & O];
                r: for (; ; ) {
                  if (d >>>= I = P >>> 24, w -= I, !(16 & (I = P >>> 16 & 255))) {
                    if ((64 & I) == 0) {
                      P = x[(65535 & P) + (d & (1 << I) - 1)];
                      continue r;
                    }
                    l.msg = "invalid distance code", r.mode = 30;
                    break t;
                  }
                  if (q = 65535 & P, w < (I &= 15) && (d += e[u++] << w, (w += 8) < I && (d += e[u++] << w, w += 8)), i < (q += d & (1 << I) - 1)) {
                    l.msg = "invalid distance too far back", r.mode = 30;
                    break t;
                  }
                  if (d >>>= I, w -= I, (I = v - _) < q) {
                    if (n < (I = q - I) && r.sane) {
                      l.msg = "invalid distance too far back", r.mode = 30;
                      break t;
                    }
                    if (B = a, (g = 0) === h) {
                      if (g += c - I, I < Z) {
                        for (Z -= I; D[v++] = a[g++], --I; ) ;
                        g = v - q, B = D;
                      }
                    } else if (h < I) {
                      if (g += c + h - I, (I -= h) < Z) {
                        for (Z -= I; D[v++] = a[g++], --I; ) ;
                        if (g = 0, h < Z) {
                          for (Z -= I = h; D[v++] = a[g++], --I; ) ;
                          g = v - q, B = D;
                        }
                      }
                    } else if (g += h - I, I < Z) {
                      for (Z -= I; D[v++] = a[g++], --I; ) ;
                      g = v - q, B = D;
                    }
                    for (; 2 < Z; ) D[v++] = B[g++], D[v++] = B[g++], D[v++] = B[g++], Z -= 3;
                    Z && (D[v++] = B[g++], 1 < Z && (D[v++] = B[g++]));
                  } else {
                    for (g = v - q; D[v++] = D[g++], D[v++] = D[g++], D[v++] = D[g++], 2 < (Z -= 3); ) ;
                    Z && (D[v++] = D[g++], 1 < Z && (D[v++] = D[g++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (u < m && v < b);
          u -= Z = w >> 3, d &= (1 << (w -= Z << 3)) - 1, l.next_in = u, l.next_out = v, l.avail_in = u < m ? m - u + 5 : 5 - (u - m), l.avail_out = v < b ? b - v + 257 : 257 - (v - b), r.hold = d, r.bits = w;
        };
      }, {}], 49: [function(p, T, y) {
        var l = p("../utils/common"), s = p("./adler32"), r = p("./crc32"), u = p("./inffast"), m = p("./inftrees"), v = 1, _ = 2, b = 0, i = -2, c = 1, n = 852, h = 592;
        function a(g) {
          return (g >>> 24 & 255) + (g >>> 8 & 65280) + ((65280 & g) << 8) + ((255 & g) << 24);
        }
        function d() {
          this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new l.Buf16(320), this.work = new l.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function w(g) {
          var B;
          return g && g.state ? (B = g.state, g.total_in = g.total_out = B.total = 0, g.msg = "", B.wrap && (g.adler = 1 & B.wrap), B.mode = c, B.last = 0, B.havedict = 0, B.dmax = 32768, B.head = null, B.hold = 0, B.bits = 0, B.lencode = B.lendyn = new l.Buf32(n), B.distcode = B.distdyn = new l.Buf32(h), B.sane = 1, B.back = -1, b) : i;
        }
        function S(g) {
          var B;
          return g && g.state ? ((B = g.state).wsize = 0, B.whave = 0, B.wnext = 0, w(g)) : i;
        }
        function x(g, B) {
          var e, D;
          return g && g.state ? (D = g.state, B < 0 ? (e = 0, B = -B) : (e = 1 + (B >> 4), B < 48 && (B &= 15)), B && (B < 8 || 15 < B) ? i : (D.window !== null && D.wbits !== B && (D.window = null), D.wrap = e, D.wbits = B, S(g))) : i;
        }
        function F(g, B) {
          var e, D;
          return g ? (D = new d(), (g.state = D).window = null, (e = x(g, B)) !== b && (g.state = null), e) : i;
        }
        var O, P, I = !0;
        function Z(g) {
          if (I) {
            var B;
            for (O = new l.Buf32(512), P = new l.Buf32(32), B = 0; B < 144; ) g.lens[B++] = 8;
            for (; B < 256; ) g.lens[B++] = 9;
            for (; B < 280; ) g.lens[B++] = 7;
            for (; B < 288; ) g.lens[B++] = 8;
            for (m(v, g.lens, 0, 288, O, 0, g.work, { bits: 9 }), B = 0; B < 32; ) g.lens[B++] = 5;
            m(_, g.lens, 0, 32, P, 0, g.work, { bits: 5 }), I = !1;
          }
          g.lencode = O, g.lenbits = 9, g.distcode = P, g.distbits = 5;
        }
        function q(g, B, e, D) {
          var J, N = g.state;
          return N.window === null && (N.wsize = 1 << N.wbits, N.wnext = 0, N.whave = 0, N.window = new l.Buf8(N.wsize)), D >= N.wsize ? (l.arraySet(N.window, B, e - N.wsize, N.wsize, 0), N.wnext = 0, N.whave = N.wsize) : (D < (J = N.wsize - N.wnext) && (J = D), l.arraySet(N.window, B, e - D, J, N.wnext), (D -= J) ? (l.arraySet(N.window, B, e - D, D, 0), N.wnext = D, N.whave = N.wsize) : (N.wnext += J, N.wnext === N.wsize && (N.wnext = 0), N.whave < N.wsize && (N.whave += J))), 0;
        }
        y.inflateReset = S, y.inflateReset2 = x, y.inflateResetKeep = w, y.inflateInit = function(g) {
          return F(g, 15);
        }, y.inflateInit2 = F, y.inflate = function(g, B) {
          var e, D, J, N, $, j, V, E, C, X, G, H, at, ut, tt, rt, lt, st, ct, ft, t, R, A, f, o = 0, k = new l.Buf8(4), U = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!g || !g.state || !g.output || !g.input && g.avail_in !== 0) return i;
          (e = g.state).mode === 12 && (e.mode = 13), $ = g.next_out, J = g.output, V = g.avail_out, N = g.next_in, D = g.input, j = g.avail_in, E = e.hold, C = e.bits, X = j, G = V, R = b;
          t: for (; ; ) switch (e.mode) {
            case c:
              if (e.wrap === 0) {
                e.mode = 13;
                break;
              }
              for (; C < 16; ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
              }
              if (2 & e.wrap && E === 35615) {
                k[e.check = 0] = 255 & E, k[1] = E >>> 8 & 255, e.check = r(e.check, k, 2, 0), C = E = 0, e.mode = 2;
                break;
              }
              if (e.flags = 0, e.head && (e.head.done = !1), !(1 & e.wrap) || (((255 & E) << 8) + (E >> 8)) % 31) {
                g.msg = "incorrect header check", e.mode = 30;
                break;
              }
              if ((15 & E) != 8) {
                g.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (C -= 4, t = 8 + (15 & (E >>>= 4)), e.wbits === 0) e.wbits = t;
              else if (t > e.wbits) {
                g.msg = "invalid window size", e.mode = 30;
                break;
              }
              e.dmax = 1 << t, g.adler = e.check = 1, e.mode = 512 & E ? 10 : 12, C = E = 0;
              break;
            case 2:
              for (; C < 16; ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
              }
              if (e.flags = E, (255 & e.flags) != 8) {
                g.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (57344 & e.flags) {
                g.msg = "unknown header flags set", e.mode = 30;
                break;
              }
              e.head && (e.head.text = E >> 8 & 1), 512 & e.flags && (k[0] = 255 & E, k[1] = E >>> 8 & 255, e.check = r(e.check, k, 2, 0)), C = E = 0, e.mode = 3;
            case 3:
              for (; C < 32; ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
              }
              e.head && (e.head.time = E), 512 & e.flags && (k[0] = 255 & E, k[1] = E >>> 8 & 255, k[2] = E >>> 16 & 255, k[3] = E >>> 24 & 255, e.check = r(e.check, k, 4, 0)), C = E = 0, e.mode = 4;
            case 4:
              for (; C < 16; ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
              }
              e.head && (e.head.xflags = 255 & E, e.head.os = E >> 8), 512 & e.flags && (k[0] = 255 & E, k[1] = E >>> 8 & 255, e.check = r(e.check, k, 2, 0)), C = E = 0, e.mode = 5;
            case 5:
              if (1024 & e.flags) {
                for (; C < 16; ) {
                  if (j === 0) break t;
                  j--, E += D[N++] << C, C += 8;
                }
                e.length = E, e.head && (e.head.extra_len = E), 512 & e.flags && (k[0] = 255 & E, k[1] = E >>> 8 & 255, e.check = r(e.check, k, 2, 0)), C = E = 0;
              } else e.head && (e.head.extra = null);
              e.mode = 6;
            case 6:
              if (1024 & e.flags && (j < (H = e.length) && (H = j), H && (e.head && (t = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Array(e.head.extra_len)), l.arraySet(e.head.extra, D, N, H, t)), 512 & e.flags && (e.check = r(e.check, D, H, N)), j -= H, N += H, e.length -= H), e.length)) break t;
              e.length = 0, e.mode = 7;
            case 7:
              if (2048 & e.flags) {
                if (j === 0) break t;
                for (H = 0; t = D[N + H++], e.head && t && e.length < 65536 && (e.head.name += String.fromCharCode(t)), t && H < j; ) ;
                if (512 & e.flags && (e.check = r(e.check, D, H, N)), j -= H, N += H, t) break t;
              } else e.head && (e.head.name = null);
              e.length = 0, e.mode = 8;
            case 8:
              if (4096 & e.flags) {
                if (j === 0) break t;
                for (H = 0; t = D[N + H++], e.head && t && e.length < 65536 && (e.head.comment += String.fromCharCode(t)), t && H < j; ) ;
                if (512 & e.flags && (e.check = r(e.check, D, H, N)), j -= H, N += H, t) break t;
              } else e.head && (e.head.comment = null);
              e.mode = 9;
            case 9:
              if (512 & e.flags) {
                for (; C < 16; ) {
                  if (j === 0) break t;
                  j--, E += D[N++] << C, C += 8;
                }
                if (E !== (65535 & e.check)) {
                  g.msg = "header crc mismatch", e.mode = 30;
                  break;
                }
                C = E = 0;
              }
              e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), g.adler = e.check = 0, e.mode = 12;
              break;
            case 10:
              for (; C < 32; ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
              }
              g.adler = e.check = a(E), C = E = 0, e.mode = 11;
            case 11:
              if (e.havedict === 0) return g.next_out = $, g.avail_out = V, g.next_in = N, g.avail_in = j, e.hold = E, e.bits = C, 2;
              g.adler = e.check = 1, e.mode = 12;
            case 12:
              if (B === 5 || B === 6) break t;
            case 13:
              if (e.last) {
                E >>>= 7 & C, C -= 7 & C, e.mode = 27;
                break;
              }
              for (; C < 3; ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
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
                  g.msg = "invalid block type", e.mode = 30;
              }
              E >>>= 2, C -= 2;
              break;
            case 14:
              for (E >>>= 7 & C, C -= 7 & C; C < 32; ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
              }
              if ((65535 & E) != (E >>> 16 ^ 65535)) {
                g.msg = "invalid stored block lengths", e.mode = 30;
                break;
              }
              if (e.length = 65535 & E, C = E = 0, e.mode = 15, B === 6) break t;
            case 15:
              e.mode = 16;
            case 16:
              if (H = e.length) {
                if (j < H && (H = j), V < H && (H = V), H === 0) break t;
                l.arraySet(J, D, N, H, $), j -= H, N += H, V -= H, $ += H, e.length -= H;
                break;
              }
              e.mode = 12;
              break;
            case 17:
              for (; C < 14; ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
              }
              if (e.nlen = 257 + (31 & E), E >>>= 5, C -= 5, e.ndist = 1 + (31 & E), E >>>= 5, C -= 5, e.ncode = 4 + (15 & E), E >>>= 4, C -= 4, 286 < e.nlen || 30 < e.ndist) {
                g.msg = "too many length or distance symbols", e.mode = 30;
                break;
              }
              e.have = 0, e.mode = 18;
            case 18:
              for (; e.have < e.ncode; ) {
                for (; C < 3; ) {
                  if (j === 0) break t;
                  j--, E += D[N++] << C, C += 8;
                }
                e.lens[U[e.have++]] = 7 & E, E >>>= 3, C -= 3;
              }
              for (; e.have < 19; ) e.lens[U[e.have++]] = 0;
              if (e.lencode = e.lendyn, e.lenbits = 7, A = { bits: e.lenbits }, R = m(0, e.lens, 0, 19, e.lencode, 0, e.work, A), e.lenbits = A.bits, R) {
                g.msg = "invalid code lengths set", e.mode = 30;
                break;
              }
              e.have = 0, e.mode = 19;
            case 19:
              for (; e.have < e.nlen + e.ndist; ) {
                for (; rt = (o = e.lencode[E & (1 << e.lenbits) - 1]) >>> 16 & 255, lt = 65535 & o, !((tt = o >>> 24) <= C); ) {
                  if (j === 0) break t;
                  j--, E += D[N++] << C, C += 8;
                }
                if (lt < 16) E >>>= tt, C -= tt, e.lens[e.have++] = lt;
                else {
                  if (lt === 16) {
                    for (f = tt + 2; C < f; ) {
                      if (j === 0) break t;
                      j--, E += D[N++] << C, C += 8;
                    }
                    if (E >>>= tt, C -= tt, e.have === 0) {
                      g.msg = "invalid bit length repeat", e.mode = 30;
                      break;
                    }
                    t = e.lens[e.have - 1], H = 3 + (3 & E), E >>>= 2, C -= 2;
                  } else if (lt === 17) {
                    for (f = tt + 3; C < f; ) {
                      if (j === 0) break t;
                      j--, E += D[N++] << C, C += 8;
                    }
                    C -= tt, t = 0, H = 3 + (7 & (E >>>= tt)), E >>>= 3, C -= 3;
                  } else {
                    for (f = tt + 7; C < f; ) {
                      if (j === 0) break t;
                      j--, E += D[N++] << C, C += 8;
                    }
                    C -= tt, t = 0, H = 11 + (127 & (E >>>= tt)), E >>>= 7, C -= 7;
                  }
                  if (e.have + H > e.nlen + e.ndist) {
                    g.msg = "invalid bit length repeat", e.mode = 30;
                    break;
                  }
                  for (; H--; ) e.lens[e.have++] = t;
                }
              }
              if (e.mode === 30) break;
              if (e.lens[256] === 0) {
                g.msg = "invalid code -- missing end-of-block", e.mode = 30;
                break;
              }
              if (e.lenbits = 9, A = { bits: e.lenbits }, R = m(v, e.lens, 0, e.nlen, e.lencode, 0, e.work, A), e.lenbits = A.bits, R) {
                g.msg = "invalid literal/lengths set", e.mode = 30;
                break;
              }
              if (e.distbits = 6, e.distcode = e.distdyn, A = { bits: e.distbits }, R = m(_, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, A), e.distbits = A.bits, R) {
                g.msg = "invalid distances set", e.mode = 30;
                break;
              }
              if (e.mode = 20, B === 6) break t;
            case 20:
              e.mode = 21;
            case 21:
              if (6 <= j && 258 <= V) {
                g.next_out = $, g.avail_out = V, g.next_in = N, g.avail_in = j, e.hold = E, e.bits = C, u(g, G), $ = g.next_out, J = g.output, V = g.avail_out, N = g.next_in, D = g.input, j = g.avail_in, E = e.hold, C = e.bits, e.mode === 12 && (e.back = -1);
                break;
              }
              for (e.back = 0; rt = (o = e.lencode[E & (1 << e.lenbits) - 1]) >>> 16 & 255, lt = 65535 & o, !((tt = o >>> 24) <= C); ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
              }
              if (rt && (240 & rt) == 0) {
                for (st = tt, ct = rt, ft = lt; rt = (o = e.lencode[ft + ((E & (1 << st + ct) - 1) >> st)]) >>> 16 & 255, lt = 65535 & o, !(st + (tt = o >>> 24) <= C); ) {
                  if (j === 0) break t;
                  j--, E += D[N++] << C, C += 8;
                }
                E >>>= st, C -= st, e.back += st;
              }
              if (E >>>= tt, C -= tt, e.back += tt, e.length = lt, rt === 0) {
                e.mode = 26;
                break;
              }
              if (32 & rt) {
                e.back = -1, e.mode = 12;
                break;
              }
              if (64 & rt) {
                g.msg = "invalid literal/length code", e.mode = 30;
                break;
              }
              e.extra = 15 & rt, e.mode = 22;
            case 22:
              if (e.extra) {
                for (f = e.extra; C < f; ) {
                  if (j === 0) break t;
                  j--, E += D[N++] << C, C += 8;
                }
                e.length += E & (1 << e.extra) - 1, E >>>= e.extra, C -= e.extra, e.back += e.extra;
              }
              e.was = e.length, e.mode = 23;
            case 23:
              for (; rt = (o = e.distcode[E & (1 << e.distbits) - 1]) >>> 16 & 255, lt = 65535 & o, !((tt = o >>> 24) <= C); ) {
                if (j === 0) break t;
                j--, E += D[N++] << C, C += 8;
              }
              if ((240 & rt) == 0) {
                for (st = tt, ct = rt, ft = lt; rt = (o = e.distcode[ft + ((E & (1 << st + ct) - 1) >> st)]) >>> 16 & 255, lt = 65535 & o, !(st + (tt = o >>> 24) <= C); ) {
                  if (j === 0) break t;
                  j--, E += D[N++] << C, C += 8;
                }
                E >>>= st, C -= st, e.back += st;
              }
              if (E >>>= tt, C -= tt, e.back += tt, 64 & rt) {
                g.msg = "invalid distance code", e.mode = 30;
                break;
              }
              e.offset = lt, e.extra = 15 & rt, e.mode = 24;
            case 24:
              if (e.extra) {
                for (f = e.extra; C < f; ) {
                  if (j === 0) break t;
                  j--, E += D[N++] << C, C += 8;
                }
                e.offset += E & (1 << e.extra) - 1, E >>>= e.extra, C -= e.extra, e.back += e.extra;
              }
              if (e.offset > e.dmax) {
                g.msg = "invalid distance too far back", e.mode = 30;
                break;
              }
              e.mode = 25;
            case 25:
              if (V === 0) break t;
              if (H = G - V, e.offset > H) {
                if ((H = e.offset - H) > e.whave && e.sane) {
                  g.msg = "invalid distance too far back", e.mode = 30;
                  break;
                }
                at = H > e.wnext ? (H -= e.wnext, e.wsize - H) : e.wnext - H, H > e.length && (H = e.length), ut = e.window;
              } else ut = J, at = $ - e.offset, H = e.length;
              for (V < H && (H = V), V -= H, e.length -= H; J[$++] = ut[at++], --H; ) ;
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
                  j--, E |= D[N++] << C, C += 8;
                }
                if (G -= V, g.total_out += G, e.total += G, G && (g.adler = e.check = e.flags ? r(e.check, J, G, $ - G) : s(e.check, J, G, $ - G)), G = V, (e.flags ? E : a(E)) !== e.check) {
                  g.msg = "incorrect data check", e.mode = 30;
                  break;
                }
                C = E = 0;
              }
              e.mode = 28;
            case 28:
              if (e.wrap && e.flags) {
                for (; C < 32; ) {
                  if (j === 0) break t;
                  j--, E += D[N++] << C, C += 8;
                }
                if (E !== (4294967295 & e.total)) {
                  g.msg = "incorrect length check", e.mode = 30;
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
          return g.next_out = $, g.avail_out = V, g.next_in = N, g.avail_in = j, e.hold = E, e.bits = C, (e.wsize || G !== g.avail_out && e.mode < 30 && (e.mode < 27 || B !== 4)) && q(g, g.output, g.next_out, G - g.avail_out) ? (e.mode = 31, -4) : (X -= g.avail_in, G -= g.avail_out, g.total_in += X, g.total_out += G, e.total += G, e.wrap && G && (g.adler = e.check = e.flags ? r(e.check, J, G, g.next_out - G) : s(e.check, J, G, g.next_out - G)), g.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === 12 ? 128 : 0) + (e.mode === 20 || e.mode === 15 ? 256 : 0), (X == 0 && G === 0 || B === 4) && R === b && (R = -5), R);
        }, y.inflateEnd = function(g) {
          if (!g || !g.state) return i;
          var B = g.state;
          return B.window && (B.window = null), g.state = null, b;
        }, y.inflateGetHeader = function(g, B) {
          var e;
          return g && g.state ? (2 & (e = g.state).wrap) == 0 ? i : ((e.head = B).done = !1, b) : i;
        }, y.inflateSetDictionary = function(g, B) {
          var e, D = B.length;
          return g && g.state ? (e = g.state).wrap !== 0 && e.mode !== 11 ? i : e.mode === 11 && s(1, B, D, 0) !== e.check ? -3 : q(g, B, D, D) ? (e.mode = 31, -4) : (e.havedict = 1, b) : i;
        }, y.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(p, T, y) {
        var l = p("../utils/common"), s = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], r = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], u = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], m = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        T.exports = function(v, _, b, i, c, n, h, a) {
          var d, w, S, x, F, O, P, I, Z, q = a.bits, g = 0, B = 0, e = 0, D = 0, J = 0, N = 0, $ = 0, j = 0, V = 0, E = 0, C = null, X = 0, G = new l.Buf16(16), H = new l.Buf16(16), at = null, ut = 0;
          for (g = 0; g <= 15; g++) G[g] = 0;
          for (B = 0; B < i; B++) G[_[b + B]]++;
          for (J = q, D = 15; 1 <= D && G[D] === 0; D--) ;
          if (D < J && (J = D), D === 0) return c[n++] = 20971520, c[n++] = 20971520, a.bits = 1, 0;
          for (e = 1; e < D && G[e] === 0; e++) ;
          for (J < e && (J = e), g = j = 1; g <= 15; g++) if (j <<= 1, (j -= G[g]) < 0) return -1;
          if (0 < j && (v === 0 || D !== 1)) return -1;
          for (H[1] = 0, g = 1; g < 15; g++) H[g + 1] = H[g] + G[g];
          for (B = 0; B < i; B++) _[b + B] !== 0 && (h[H[_[b + B]]++] = B);
          if (O = v === 0 ? (C = at = h, 19) : v === 1 ? (C = s, X -= 257, at = r, ut -= 257, 256) : (C = u, at = m, -1), g = e, F = n, $ = B = E = 0, S = -1, x = (V = 1 << (N = J)) - 1, v === 1 && 852 < V || v === 2 && 592 < V) return 1;
          for (; ; ) {
            for (P = g - $, Z = h[B] < O ? (I = 0, h[B]) : h[B] > O ? (I = at[ut + h[B]], C[X + h[B]]) : (I = 96, 0), d = 1 << g - $, e = w = 1 << N; c[F + (E >> $) + (w -= d)] = P << 24 | I << 16 | Z | 0, w !== 0; ) ;
            for (d = 1 << g - 1; E & d; ) d >>= 1;
            if (d !== 0 ? (E &= d - 1, E += d) : E = 0, B++, --G[g] == 0) {
              if (g === D) break;
              g = _[b + h[B]];
            }
            if (J < g && (E & x) !== S) {
              for ($ === 0 && ($ = J), F += e, j = 1 << (N = g - $); N + $ < D && !((j -= G[N + $]) <= 0); ) N++, j <<= 1;
              if (V += 1 << N, v === 1 && 852 < V || v === 2 && 592 < V) return 1;
              c[S = E & x] = J << 24 | N << 16 | F - n | 0;
            }
          }
          return E !== 0 && (c[F + E] = g - $ << 24 | 64 << 16 | 0), a.bits = J, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(p, T, y) {
        T.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(p, T, y) {
        var l = p("../utils/common"), s = 0, r = 1;
        function u(o) {
          for (var k = o.length; 0 <= --k; ) o[k] = 0;
        }
        var m = 0, v = 29, _ = 256, b = _ + 1 + v, i = 30, c = 19, n = 2 * b + 1, h = 15, a = 16, d = 7, w = 256, S = 16, x = 17, F = 18, O = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], P = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], I = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], Z = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], q = new Array(2 * (b + 2));
        u(q);
        var g = new Array(2 * i);
        u(g);
        var B = new Array(512);
        u(B);
        var e = new Array(256);
        u(e);
        var D = new Array(v);
        u(D);
        var J, N, $, j = new Array(i);
        function V(o, k, U, L, z) {
          this.static_tree = o, this.extra_bits = k, this.extra_base = U, this.elems = L, this.max_length = z, this.has_stree = o && o.length;
        }
        function E(o, k) {
          this.dyn_tree = o, this.max_code = 0, this.stat_desc = k;
        }
        function C(o) {
          return o < 256 ? B[o] : B[256 + (o >>> 7)];
        }
        function X(o, k) {
          o.pending_buf[o.pending++] = 255 & k, o.pending_buf[o.pending++] = k >>> 8 & 255;
        }
        function G(o, k, U) {
          o.bi_valid > a - U ? (o.bi_buf |= k << o.bi_valid & 65535, X(o, o.bi_buf), o.bi_buf = k >> a - o.bi_valid, o.bi_valid += U - a) : (o.bi_buf |= k << o.bi_valid & 65535, o.bi_valid += U);
        }
        function H(o, k, U) {
          G(o, U[2 * k], U[2 * k + 1]);
        }
        function at(o, k) {
          for (var U = 0; U |= 1 & o, o >>>= 1, U <<= 1, 0 < --k; ) ;
          return U >>> 1;
        }
        function ut(o, k, U) {
          var L, z, W = new Array(h + 1), K = 0;
          for (L = 1; L <= h; L++) W[L] = K = K + U[L - 1] << 1;
          for (z = 0; z <= k; z++) {
            var M = o[2 * z + 1];
            M !== 0 && (o[2 * z] = at(W[M]++, M));
          }
        }
        function tt(o) {
          var k;
          for (k = 0; k < b; k++) o.dyn_ltree[2 * k] = 0;
          for (k = 0; k < i; k++) o.dyn_dtree[2 * k] = 0;
          for (k = 0; k < c; k++) o.bl_tree[2 * k] = 0;
          o.dyn_ltree[2 * w] = 1, o.opt_len = o.static_len = 0, o.last_lit = o.matches = 0;
        }
        function rt(o) {
          8 < o.bi_valid ? X(o, o.bi_buf) : 0 < o.bi_valid && (o.pending_buf[o.pending++] = o.bi_buf), o.bi_buf = 0, o.bi_valid = 0;
        }
        function lt(o, k, U, L) {
          var z = 2 * k, W = 2 * U;
          return o[z] < o[W] || o[z] === o[W] && L[k] <= L[U];
        }
        function st(o, k, U) {
          for (var L = o.heap[U], z = U << 1; z <= o.heap_len && (z < o.heap_len && lt(k, o.heap[z + 1], o.heap[z], o.depth) && z++, !lt(k, L, o.heap[z], o.depth)); ) o.heap[U] = o.heap[z], U = z, z <<= 1;
          o.heap[U] = L;
        }
        function ct(o, k, U) {
          var L, z, W, K, M = 0;
          if (o.last_lit !== 0) for (; L = o.pending_buf[o.d_buf + 2 * M] << 8 | o.pending_buf[o.d_buf + 2 * M + 1], z = o.pending_buf[o.l_buf + M], M++, L === 0 ? H(o, z, k) : (H(o, (W = e[z]) + _ + 1, k), (K = O[W]) !== 0 && G(o, z -= D[W], K), H(o, W = C(--L), U), (K = P[W]) !== 0 && G(o, L -= j[W], K)), M < o.last_lit; ) ;
          H(o, w, k);
        }
        function ft(o, k) {
          var U, L, z, W = k.dyn_tree, K = k.stat_desc.static_tree, M = k.stat_desc.has_stree, Y = k.stat_desc.elems, it = -1;
          for (o.heap_len = 0, o.heap_max = n, U = 0; U < Y; U++) W[2 * U] !== 0 ? (o.heap[++o.heap_len] = it = U, o.depth[U] = 0) : W[2 * U + 1] = 0;
          for (; o.heap_len < 2; ) W[2 * (z = o.heap[++o.heap_len] = it < 2 ? ++it : 0)] = 1, o.depth[z] = 0, o.opt_len--, M && (o.static_len -= K[2 * z + 1]);
          for (k.max_code = it, U = o.heap_len >> 1; 1 <= U; U--) st(o, W, U);
          for (z = Y; U = o.heap[1], o.heap[1] = o.heap[o.heap_len--], st(o, W, 1), L = o.heap[1], o.heap[--o.heap_max] = U, o.heap[--o.heap_max] = L, W[2 * z] = W[2 * U] + W[2 * L], o.depth[z] = (o.depth[U] >= o.depth[L] ? o.depth[U] : o.depth[L]) + 1, W[2 * U + 1] = W[2 * L + 1] = z, o.heap[1] = z++, st(o, W, 1), 2 <= o.heap_len; ) ;
          o.heap[--o.heap_max] = o.heap[1], (function(et, ht) {
            var mt, dt, _t, ot, bt, kt, pt = ht.dyn_tree, zt = ht.max_code, At = ht.stat_desc.static_tree, It = ht.stat_desc.has_stree, Ot = ht.stat_desc.extra_bits, Ct = ht.stat_desc.extra_base, gt = ht.stat_desc.max_length, yt = 0;
            for (ot = 0; ot <= h; ot++) et.bl_count[ot] = 0;
            for (pt[2 * et.heap[et.heap_max] + 1] = 0, mt = et.heap_max + 1; mt < n; mt++) gt < (ot = pt[2 * pt[2 * (dt = et.heap[mt]) + 1] + 1] + 1) && (ot = gt, yt++), pt[2 * dt + 1] = ot, zt < dt || (et.bl_count[ot]++, bt = 0, Ct <= dt && (bt = Ot[dt - Ct]), kt = pt[2 * dt], et.opt_len += kt * (ot + bt), It && (et.static_len += kt * (At[2 * dt + 1] + bt)));
            if (yt !== 0) {
              do {
                for (ot = gt - 1; et.bl_count[ot] === 0; ) ot--;
                et.bl_count[ot]--, et.bl_count[ot + 1] += 2, et.bl_count[gt]--, yt -= 2;
              } while (0 < yt);
              for (ot = gt; ot !== 0; ot--) for (dt = et.bl_count[ot]; dt !== 0; ) zt < (_t = et.heap[--mt]) || (pt[2 * _t + 1] !== ot && (et.opt_len += (ot - pt[2 * _t + 1]) * pt[2 * _t], pt[2 * _t + 1] = ot), dt--);
            }
          })(o, k), ut(W, it, o.bl_count);
        }
        function t(o, k, U) {
          var L, z, W = -1, K = k[1], M = 0, Y = 7, it = 4;
          for (K === 0 && (Y = 138, it = 3), k[2 * (U + 1) + 1] = 65535, L = 0; L <= U; L++) z = K, K = k[2 * (L + 1) + 1], ++M < Y && z === K || (M < it ? o.bl_tree[2 * z] += M : z !== 0 ? (z !== W && o.bl_tree[2 * z]++, o.bl_tree[2 * S]++) : M <= 10 ? o.bl_tree[2 * x]++ : o.bl_tree[2 * F]++, W = z, it = (M = 0) === K ? (Y = 138, 3) : z === K ? (Y = 6, 3) : (Y = 7, 4));
        }
        function R(o, k, U) {
          var L, z, W = -1, K = k[1], M = 0, Y = 7, it = 4;
          for (K === 0 && (Y = 138, it = 3), L = 0; L <= U; L++) if (z = K, K = k[2 * (L + 1) + 1], !(++M < Y && z === K)) {
            if (M < it) for (; H(o, z, o.bl_tree), --M != 0; ) ;
            else z !== 0 ? (z !== W && (H(o, z, o.bl_tree), M--), H(o, S, o.bl_tree), G(o, M - 3, 2)) : M <= 10 ? (H(o, x, o.bl_tree), G(o, M - 3, 3)) : (H(o, F, o.bl_tree), G(o, M - 11, 7));
            W = z, it = (M = 0) === K ? (Y = 138, 3) : z === K ? (Y = 6, 3) : (Y = 7, 4);
          }
        }
        u(j);
        var A = !1;
        function f(o, k, U, L) {
          G(o, (m << 1) + (L ? 1 : 0), 3), (function(z, W, K, M) {
            rt(z), X(z, K), X(z, ~K), l.arraySet(z.pending_buf, z.window, W, K, z.pending), z.pending += K;
          })(o, k, U);
        }
        y._tr_init = function(o) {
          A || ((function() {
            var k, U, L, z, W, K = new Array(h + 1);
            for (z = L = 0; z < v - 1; z++) for (D[z] = L, k = 0; k < 1 << O[z]; k++) e[L++] = z;
            for (e[L - 1] = z, z = W = 0; z < 16; z++) for (j[z] = W, k = 0; k < 1 << P[z]; k++) B[W++] = z;
            for (W >>= 7; z < i; z++) for (j[z] = W << 7, k = 0; k < 1 << P[z] - 7; k++) B[256 + W++] = z;
            for (U = 0; U <= h; U++) K[U] = 0;
            for (k = 0; k <= 143; ) q[2 * k + 1] = 8, k++, K[8]++;
            for (; k <= 255; ) q[2 * k + 1] = 9, k++, K[9]++;
            for (; k <= 279; ) q[2 * k + 1] = 7, k++, K[7]++;
            for (; k <= 287; ) q[2 * k + 1] = 8, k++, K[8]++;
            for (ut(q, b + 1, K), k = 0; k < i; k++) g[2 * k + 1] = 5, g[2 * k] = at(k, 5);
            J = new V(q, O, _ + 1, b, h), N = new V(g, P, 0, i, h), $ = new V(new Array(0), I, 0, c, d);
          })(), A = !0), o.l_desc = new E(o.dyn_ltree, J), o.d_desc = new E(o.dyn_dtree, N), o.bl_desc = new E(o.bl_tree, $), o.bi_buf = 0, o.bi_valid = 0, tt(o);
        }, y._tr_stored_block = f, y._tr_flush_block = function(o, k, U, L) {
          var z, W, K = 0;
          0 < o.level ? (o.strm.data_type === 2 && (o.strm.data_type = (function(M) {
            var Y, it = 4093624447;
            for (Y = 0; Y <= 31; Y++, it >>>= 1) if (1 & it && M.dyn_ltree[2 * Y] !== 0) return s;
            if (M.dyn_ltree[18] !== 0 || M.dyn_ltree[20] !== 0 || M.dyn_ltree[26] !== 0) return r;
            for (Y = 32; Y < _; Y++) if (M.dyn_ltree[2 * Y] !== 0) return r;
            return s;
          })(o)), ft(o, o.l_desc), ft(o, o.d_desc), K = (function(M) {
            var Y;
            for (t(M, M.dyn_ltree, M.l_desc.max_code), t(M, M.dyn_dtree, M.d_desc.max_code), ft(M, M.bl_desc), Y = c - 1; 3 <= Y && M.bl_tree[2 * Z[Y] + 1] === 0; Y--) ;
            return M.opt_len += 3 * (Y + 1) + 5 + 5 + 4, Y;
          })(o), z = o.opt_len + 3 + 7 >>> 3, (W = o.static_len + 3 + 7 >>> 3) <= z && (z = W)) : z = W = U + 5, U + 4 <= z && k !== -1 ? f(o, k, U, L) : o.strategy === 4 || W === z ? (G(o, 2 + (L ? 1 : 0), 3), ct(o, q, g)) : (G(o, 4 + (L ? 1 : 0), 3), (function(M, Y, it, et) {
            var ht;
            for (G(M, Y - 257, 5), G(M, it - 1, 5), G(M, et - 4, 4), ht = 0; ht < et; ht++) G(M, M.bl_tree[2 * Z[ht] + 1], 3);
            R(M, M.dyn_ltree, Y - 1), R(M, M.dyn_dtree, it - 1);
          })(o, o.l_desc.max_code + 1, o.d_desc.max_code + 1, K + 1), ct(o, o.dyn_ltree, o.dyn_dtree)), tt(o), L && rt(o);
        }, y._tr_tally = function(o, k, U) {
          return o.pending_buf[o.d_buf + 2 * o.last_lit] = k >>> 8 & 255, o.pending_buf[o.d_buf + 2 * o.last_lit + 1] = 255 & k, o.pending_buf[o.l_buf + o.last_lit] = 255 & U, o.last_lit++, k === 0 ? o.dyn_ltree[2 * U]++ : (o.matches++, k--, o.dyn_ltree[2 * (e[U] + _ + 1)]++, o.dyn_dtree[2 * C(k)]++), o.last_lit === o.lit_bufsize - 1;
        }, y._tr_align = function(o) {
          G(o, 2, 3), H(o, w, q), (function(k) {
            k.bi_valid === 16 ? (X(k, k.bi_buf), k.bi_buf = 0, k.bi_valid = 0) : 8 <= k.bi_valid && (k.pending_buf[k.pending++] = 255 & k.bi_buf, k.bi_buf >>= 8, k.bi_valid -= 8);
          })(o);
        };
      }, { "../utils/common": 41 }], 53: [function(p, T, y) {
        T.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(p, T, y) {
        (function(l) {
          (function(s, r) {
            if (!s.setImmediate) {
              var u, m, v, _, b = 1, i = {}, c = !1, n = s.document, h = Object.getPrototypeOf && Object.getPrototypeOf(s);
              h = h && h.setTimeout ? h : s, u = {}.toString.call(s.process) === "[object process]" ? function(S) {
                process.nextTick(function() {
                  d(S);
                });
              } : (function() {
                if (s.postMessage && !s.importScripts) {
                  var S = !0, x = s.onmessage;
                  return s.onmessage = function() {
                    S = !1;
                  }, s.postMessage("", "*"), s.onmessage = x, S;
                }
              })() ? (_ = "setImmediate$" + Math.random() + "$", s.addEventListener ? s.addEventListener("message", w, !1) : s.attachEvent("onmessage", w), function(S) {
                s.postMessage(_ + S, "*");
              }) : s.MessageChannel ? ((v = new MessageChannel()).port1.onmessage = function(S) {
                d(S.data);
              }, function(S) {
                v.port2.postMessage(S);
              }) : n && "onreadystatechange" in n.createElement("script") ? (m = n.documentElement, function(S) {
                var x = n.createElement("script");
                x.onreadystatechange = function() {
                  d(S), x.onreadystatechange = null, m.removeChild(x), x = null;
                }, m.appendChild(x);
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
                      var O = F.callback, P = F.args;
                      switch (P.length) {
                        case 0:
                          O();
                          break;
                        case 1:
                          O(P[0]);
                          break;
                        case 2:
                          O(P[0], P[1]);
                          break;
                        case 3:
                          O(P[0], P[1], P[2]);
                          break;
                        default:
                          O.apply(r, P);
                      }
                    })(x);
                  } finally {
                    a(S), c = !1;
                  }
                }
              }
            }
            function w(S) {
              S.source === s && typeof S.data == "string" && S.data.indexOf(_) === 0 && d(+S.data.slice(_.length));
            }
          })(typeof self > "u" ? l === void 0 ? this : l : self);
        }).call(this, typeof vt < "u" ? vt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}] }, {}, [10])(10);
    });
  })(xt)), xt.exports;
}
var Tt = Rt();
const Dt = /* @__PURE__ */ Bt(Tt), St = /* @__PURE__ */ new Map();
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (Q) => {
  Q.waitUntil(self.clients.claim());
});
self.addEventListener("push", (Q) => {
  let nt = { title: "ARKAD", body: "", url: "/" };
  if (Q.data)
    try {
      nt = { ...nt, ...Q.data.json() };
    } catch {
      nt.body = Q.data.text();
    }
  const p = typeof nt.url == "string" && nt.url.startsWith("/") ? nt.url : "/";
  Q.waitUntil(self.registration.showNotification(nt.title || "ARKAD", {
    body: nt.body || "",
    data: { url: p },
    icon: "/arkadLight.svg",
    badge: "/arkadDark.svg"
  }));
});
self.addEventListener("notificationclick", (Q) => {
  var T;
  Q.notification.close();
  const nt = (T = Q.notification.data) == null ? void 0 : T.url, p = typeof nt == "string" && nt.startsWith("/") ? nt : "/";
  Q.waitUntil((async () => {
    const l = (await self.clients.matchAll({ type: "window", includeUncontrolled: !0 })).find((s) => new URL(s.url).pathname === p);
    return l ? (await l.focus(), l.navigate(p)) : self.clients.openWindow(p);
  })());
});
self.addEventListener("pushsubscriptionchange", (Q) => {
  Q.waitUntil((async () => {
    const nt = await self.clients.matchAll({ type: "window", includeUncontrolled: !0 });
    nt[0] && nt[0].postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" });
  })());
});
self.addEventListener("message", async (Q) => {
  var nt;
  if (Q.data.type === "CLAIM") {
    await self.clients.claim();
    return;
  }
  if (Q.data.type === "LOAD_ZIP") {
    const { zipBuffer: p, gameId: T } = Q.data, y = await Dt.loadAsync(p), l = /* @__PURE__ */ new Map();
    await Promise.all(
      Object.entries(y.files).map(async ([s, r]) => {
        r.dir || l.set(s, await r.async("arraybuffer"));
      })
    ), St.set(T, l), console.log("gameFiles state: ", St), (nt = Q.source) == null || nt.postMessage({ type: "ZIP_READY", gameId: T });
  }
});
self.addEventListener("fetch", (Q) => {
  const p = new URL(Q.request.url).pathname.match(/\/play-game\/([^/]+)\/(.*)/);
  if (!p)
    return;
  const [, T, y] = p;
  console.log("gameId: ", T, `
filePath: `, y);
  const l = St.get(T), s = l == null ? void 0 : l.get(y);
  if (!s) {
    console.log("file not found! ", s);
    return;
  }
  const r = y.includes("Build/") && y.endsWith(".gz");
  console.log("should decompress?: ", r);
  const u = y.includes(".br");
  console.log("should debrotli?: ", u), Q.respondWith(
    (async () => {
      let m = s;
      if (r)
        try {
          m = await Ut(s), console.log("decompressed successfully, size:", m.byteLength);
        } catch (_) {
          console.warn(`Failed to decompress ${y}:`, _);
        }
      console.log("responding with buffer size:", m.byteLength);
      const v = new Response(new Uint8Array(m), {
        headers: {
          "Content-Type": Ft(y),
          "Cross-Origin-Embedder-Policy": "require-corp",
          "Cross-Origin-Opener-Policy": "same-origin",
          "Cross-Origin-Resource-Policy": "same-origin",
          ...r && {
            "Content-Length": m.byteLength.toString()
          }
        }
      });
      return console.log("response constructed:", v, `
headers:`, [...v.headers.entries()]), v;
    })().catch((m) => (console.error("respondWith failed:", m), new Response("SW error", { status: 500 })))
  );
});
function Ft(Q) {
  var l, s;
  const nt = Q.split("."), p = (l = nt.pop()) == null ? void 0 : l.toLowerCase(), T = (s = nt.pop()) == null ? void 0 : s.toLowerCase(), y = {
    html: "text/html",
    js: "application/javascript",
    wasm: "application/wasm",
    data: "application/octet-stream",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    css: "text/css"
  };
  return y[T ?? ""] ? y[T ?? ""] : y[p ?? ""] ?? "application/octet-stream";
}
async function Ut(Q) {
  const nt = new DecompressionStream("gzip"), p = nt.writable.getWriter(), T = nt.readable.getReader();
  p.write(Q), p.close();
  const y = [];
  for (; ; ) {
    const { done: u, value: m } = await T.read();
    if (u) break;
    y.push(m);
  }
  const l = y.reduce((u, m) => u + m.byteLength, 0), s = new Uint8Array(l);
  let r = 0;
  for (const u of y)
    s.set(u, r), r += u.byteLength;
  return s.buffer;
}
