var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node/portable/main.js
var main_exports = {};
__export(main_exports, {
  main: () => main
});
module.exports = __toCommonJS(main_exports);

// node/bundlable/deps.b.js
var defaultOpener = "[";
var defaultCloser = "]";
var defaultEscaper = "`";
var defaultQuoter = "'";
var defaultDelimiters = {
  opener: defaultOpener,
  closer: defaultCloser,
  escaper: defaultEscaper,
  quoter: defaultQuoter
};
var normalizeDelimiters = (delims) => {
  const { opener: opener2 = defaultOpener, closer: closer2 = defaultCloser, escaper: escaper2 = defaultEscaper, quoter: quoter2 = defaultQuoter } = delims ?? {};
  const delimiters = [
    opener2,
    closer2,
    escaper2,
    quoter2
  ];
  const delimiterSetSize = new Set(delimiters).size;
  if (delimiterSetSize !== delimiters.length) {
    throw Error(`Delimiters must be unique! ${delimiters.length - delimiterSetSize} of them are identical:
${delimiters.join("\n")}`);
  }
  return {
    opener: opener2,
    closer: closer2,
    escaper: escaper2,
    quoter: quoter2
  };
};
var jevkoFromString = (str, delimiters) => {
  const { opener: opener2, closer: closer2, escaper: escaper2, quoter: quoter2 } = normalizeDelimiters(delimiters);
  const parents = [];
  let parent = {
    subjevkos: []
  }, prefix = "", h = 0, mode = "normal";
  let line = 1, column = 1;
  let tag = "", t = 0;
  let sawFirstQuoter = false;
  for (let i = 0; i < str.length; ++i) {
    const c = str[i];
    if (mode === "escaped") {
      if (c === escaper2 || c === opener2 || c === closer2)
        mode = "normal";
      else if (c === quoter2) {
        mode = "tag";
        t = i + 1;
      } else
        throw SyntaxError(`Invalid digraph (${escaper2}${c}) at ${line}:${column}!`);
    } else if (mode === "tag") {
      if (c === quoter2) {
        tag = str.slice(t, i);
        h = i + 1;
        t = h;
        mode = "heredoc";
      }
    } else if (mode === "heredoc") {
      if (c === quoter2) {
        if (sawFirstQuoter === false) {
          h = i + 1;
          sawFirstQuoter = true;
        } else {
          const found = str.slice(h, i);
          if (found === tag) {
            const jevko = {
              subjevkos: [],
              suffix: str.slice(t, h - 1),
              tag
            };
            parent.subjevkos.push({
              prefix,
              jevko
            });
            prefix = "";
            h = i + 1;
            tag = "";
            mode = "normal";
            sawFirstQuoter = false;
          } else {
            h = i + 1;
          }
        }
      }
    } else if (c === escaper2) {
      prefix += str.slice(h, i);
      h = i + 1;
      mode = "escaped";
    } else if (c === opener2) {
      const jevko1 = {
        subjevkos: []
      };
      parent.subjevkos.push({
        prefix: prefix + str.slice(h, i),
        jevko: jevko1
      });
      prefix = "";
      h = i + 1;
      parents.push(parent);
      parent = jevko1;
    } else if (c === closer2) {
      parent.suffix = prefix + str.slice(h, i);
      prefix = "";
      h = i + 1;
      if (parents.length < 1)
        throw SyntaxError(`Unexpected closer (${closer2}) at ${line}:${column}!`);
      parent = parents.pop();
    }
    if (c === "\n") {
      ++line;
      column = 1;
    } else {
      ++column;
    }
  }
  if (mode === "escaped")
    throw SyntaxError(`Unexpected end after escaper (${escaper2})!`);
  if (mode === "tag")
    throw SyntaxError(`Unexpected end after quoter (${quoter2})!`);
  if (mode === "heredoc" || mode === "heredoc0")
    throw SyntaxError(`Unexpected end after quoter (${quoter2})!`);
  if (parents.length > 0)
    throw SyntaxError(`Unexpected end: missing ${parents.length} closer(s) (${closer2})!`);
  parent.suffix = prefix + str.slice(h);
  parent.opener = opener2;
  parent.closer = closer2;
  parent.escaper = escaper2;
  parent.quoter = quoter2;
  return parent;
};
var escape = (str, { opener: opener2 = defaultOpener, closer: closer2 = defaultCloser, escaper: escaper2 = defaultEscaper } = {}) => {
  let ret = "";
  for (const c of str) {
    if (c === opener2 || c === closer2 || c === escaper2)
      ret += escaper2;
    ret += c;
  }
  return ret;
};
var stringToHeredoc = (str, tag, delimiters) => {
  const { quoter: q } = delimiters;
  let id = tag;
  let tok = `${q}${tag}${q}`;
  let stret = `${str}${tok}`;
  const pad = q === "=" ? "-" : "=";
  while (stret.indexOf(tok) !== str.length) {
    id += pad;
    tok = `${q}${id}${q}`;
    stret = `${str}${tok}`;
  }
  return `${delimiters.escaper}${tok}${stret}`;
};
var DenoStdInternalError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "DenoStdInternalError";
  }
};
function assert(expr, msg = "") {
  if (!expr) {
    throw new DenoStdInternalError(msg);
  }
}
function copy(src, dst, off = 0) {
  off = Math.max(0, Math.min(off, dst.byteLength));
  const dstBytesAvailable = dst.byteLength - off;
  if (src.byteLength > dstBytesAvailable) {
    src = src.subarray(0, dstBytesAvailable);
  }
  dst.set(src, off);
  return src.byteLength;
}
var MIN_READ = 32 * 1024;
var MAX_SIZE = 2 ** 32 - 2;
var Buffer2 = class {
  #buf;
  #off = 0;
  constructor(ab) {
    this.#buf = ab === void 0 ? new Uint8Array(0) : new Uint8Array(ab);
  }
  bytes(options = {
    copy: true
  }) {
    if (options.copy === false)
      return this.#buf.subarray(this.#off);
    return this.#buf.slice(this.#off);
  }
  empty() {
    return this.#buf.byteLength <= this.#off;
  }
  get length() {
    return this.#buf.byteLength - this.#off;
  }
  get capacity() {
    return this.#buf.buffer.byteLength;
  }
  truncate(n) {
    if (n === 0) {
      this.reset();
      return;
    }
    if (n < 0 || n > this.length) {
      throw Error("bytes.Buffer: truncation out of range");
    }
    this.#reslice(this.#off + n);
  }
  reset() {
    this.#reslice(0);
    this.#off = 0;
  }
  #tryGrowByReslice(n) {
    const l = this.#buf.byteLength;
    if (n <= this.capacity - l) {
      this.#reslice(l + n);
      return l;
    }
    return -1;
  }
  #reslice(len) {
    assert(len <= this.#buf.buffer.byteLength);
    this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
  }
  readSync(p) {
    if (this.empty()) {
      this.reset();
      if (p.byteLength === 0) {
        return 0;
      }
      return null;
    }
    const nread = copy(this.#buf.subarray(this.#off), p);
    this.#off += nread;
    return nread;
  }
  read(p) {
    const rr = this.readSync(p);
    return Promise.resolve(rr);
  }
  writeSync(p) {
    const m = this.#grow(p.byteLength);
    return copy(p, this.#buf, m);
  }
  write(p) {
    const n = this.writeSync(p);
    return Promise.resolve(n);
  }
  #grow(n1) {
    const m = this.length;
    if (m === 0 && this.#off !== 0) {
      this.reset();
    }
    const i = this.#tryGrowByReslice(n1);
    if (i >= 0) {
      return i;
    }
    const c = this.capacity;
    if (n1 <= Math.floor(c / 2) - m) {
      copy(this.#buf.subarray(this.#off), this.#buf);
    } else if (c + n1 > MAX_SIZE) {
      throw new Error("The buffer cannot be grown beyond the maximum size.");
    } else {
      const buf = new Uint8Array(Math.min(2 * c + n1, MAX_SIZE));
      copy(this.#buf.subarray(this.#off), buf);
      this.#buf = buf;
    }
    this.#off = 0;
    this.#reslice(Math.min(m + n1, MAX_SIZE));
    return m;
  }
  grow(n) {
    if (n < 0) {
      throw Error("Buffer.grow: negative count");
    }
    const m = this.#grow(n);
    this.#reslice(m);
  }
  async readFrom(r) {
    let n = 0;
    const tmp = new Uint8Array(MIN_READ);
    while (true) {
      const shouldGrow = this.capacity - this.length < MIN_READ;
      const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
      const nread = await r.read(buf);
      if (nread === null) {
        return n;
      }
      if (shouldGrow)
        this.writeSync(buf.subarray(0, nread));
      else
        this.#reslice(this.length + nread);
      n += nread;
    }
  }
  readFromSync(r) {
    let n = 0;
    const tmp = new Uint8Array(MIN_READ);
    while (true) {
      const shouldGrow = this.capacity - this.length < MIN_READ;
      const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
      const nread = r.readSync(buf);
      if (nread === null) {
        return n;
      }
      if (shouldGrow)
        this.writeSync(buf.subarray(0, nread));
      else
        this.#reslice(this.length + nread);
      n += nread;
    }
  }
};
async function readAll(r) {
  const buf = new Buffer2();
  await buf.readFrom(r);
  return buf.bytes();
}
var breakPrefix = (prefix) => {
  let i = prefix.length - 1;
  for (; i >= 0; --i) {
    const c = prefix[i];
    if (c === "\r" || c === "\n" || c === "\\") {
      break;
    }
  }
  if (i > 0) {
    const text = prefix.slice(0, i);
    const tag = prefix.slice(i + 1).trim();
    return [
      text,
      tag
    ];
  }
  return [
    "",
    prefix.trim()
  ];
};
var prep = (jevko, dir = ".") => {
  const { subjevkos, ...rest } = jevko;
  const subs = [];
  for (const { prefix, jevko: jevko1 } of subjevkos) {
    const [text, tag] = breakPrefix(prefix);
    if (text !== "")
      subs.push({
        prefix: "",
        jevko: {
          subjevkos: [],
          suffix: text
        }
      });
    if (tag.startsWith("-"))
      continue;
    subs.push({
      prefix: tag,
      jevko: prep(jevko1, dir)
    });
  }
  return {
    subjevkos: subs,
    ...rest
  };
};
var string = (jevko) => {
  const { subjevkos, suffix } = jevko;
  if (subjevkos.length > 0)
    throw Error("oops");
  return suffix;
};
var htmlEscape = (str) => {
  let ret = "";
  let h = 0;
  for (let i = 0; i < str.length; ++i) {
    const c = str[i];
    if (c === "<") {
      ret += str.slice(h, i) + "&lt;";
      h = i + 1;
    } else if (c === "&") {
      ret += str.slice(h, i) + "&amp;";
      h = i + 1;
    } else if (c === '"') {
      ret += str.slice(h, i) + "&quot;";
      h = i + 1;
    }
  }
  return ret + str.slice(h);
};
var toHtml = async (jevko) => {
  const { subjevkos, suffix } = jevko;
  if (subjevkos.length === 0) {
    const { tag } = jevko;
    if (tag === "xml" || tag === "html") {
      return suffix;
    } else if (tag !== void 0) {
      const highlighter = highlighters.get(tag) ?? makeHighlighter(tag);
      return highlighter(suffix);
    }
    return htmlEscape(suffix);
  }
  let ret = "";
  for (const { prefix, jevko: jevko1 } of subjevkos) {
    const maker = ctx.get(prefix) ?? makeTag(prefix);
    ret += await maker(jevko1);
  }
  return ret + htmlEscape(suffix.trimEnd());
};
var makeHighlighter = (tag) => async (text) => {
  const pandoc = Deno.run({
    cmd: [
      "pandoc",
      "-f",
      "markdown"
    ],
    stdin: "piped",
    stdout: "piped"
  });
  await pandoc.stdin.write(new TextEncoder().encode("```" + tag + "\n" + text + "\n```\n"));
  await pandoc.stdin.close();
  const out = await readAll(pandoc.stdout);
  await pandoc.stdout.close();
  const outt = new TextDecoder().decode(out);
  await pandoc.status();
  return outt;
};
var cdata = (text) => htmlEscape(text);
var highlighters = /* @__PURE__ */ new Map([
  [
    "",
    cdata
  ]
]);
var makeTop = (jevko) => {
  const { subjevkos, suffix } = jevko;
  const attrs = [];
  const children1 = [];
  const classes = [];
  for (const s of subjevkos) {
    const { prefix, jevko: jevko1 } = s;
    if (prefix === ".")
      classes.push(jevko1.suffix);
    else if (prefix.endsWith("="))
      attrs.push(`${prefix}"${htmlEscape(jevko1.suffix)}"`);
    else
      children1.push(s);
  }
  if (classes.length > 0)
    attrs.push(`class="${classes.join(" ")}"`);
  return {
    attrs,
    jevko: {
      subjevkos: children1,
      suffix
    }
  };
};
var makeTag = (tag) => async (jevko) => {
  const { subjevkos, suffix, ...rest } = jevko;
  const tagWithAttrs = [
    tag
  ];
  const children1 = [];
  const classes = [];
  for (const s of subjevkos) {
    const { prefix, jevko: jevko1 } = s;
    if (prefix === ".")
      classes.push(jevko1.suffix);
    else if (prefix.endsWith("="))
      tagWithAttrs.push(`${prefix}"${htmlEscape(jevko1.suffix)}"`);
    else
      children1.push(s);
  }
  if (classes.length > 0)
    tagWithAttrs.push(`class="${classes.join(" ")}"`);
  return `<${tagWithAttrs.join(" ")}>${await toHtml({
    subjevkos: children1,
    suffix,
    ...rest
  })}</${tag}>`;
};
var makeSelfClosingTag = (tag) => (jevko) => {
  const { subjevkos, suffix } = jevko;
  console.assert(suffix.trim() === "");
  const tagWithAttrs = [
    tag
  ];
  const classes = [];
  for (const s of subjevkos) {
    const { prefix, jevko: jevko1 } = s;
    if (prefix === ".")
      classes.push(jevko1.suffix);
    else if (prefix.endsWith("="))
      tagWithAttrs.push(`${prefix}"${htmlEscape(jevko1.suffix)}"`);
    else
      children.push(s);
  }
  if (classes.length > 0)
    tagWithAttrs.push(`class="${classes.join(" ")}"`);
  return `<${tagWithAttrs.join(" ")} />`;
};
var span = makeTag("span");
var makeSpanWithClass = (...clzs) => async (jevko) => {
  const subs = [
    ...clzs.map((clz) => ({
      prefix: ".",
      jevko: {
        subjevkos: [],
        suffix: clz
      }
    })),
    ...jevko.subjevkos
  ];
  return await span({
    subjevkos: subs,
    suffix: jevko.suffix
  });
};
var suffixToJevko = (suffix) => {
  return {
    subjevkos: [],
    suffix
  };
};
var makeTextNode = (text) => {
  return {
    prefix: "",
    jevko: suffixToJevko(text)
  };
};
var makeTagWithAnchor = (tag) => {
  const t = makeTag(tag);
  return (jevko) => {
    const id = jevko.suffix.toLowerCase().replaceAll(" ", "-");
    const tree = parseHtmlJevko(`a [id=[${id}] href=[#${id}][#]]`);
    const headerContents = {
      subjevkos: [
        ...jevko.subjevkos,
        ...tree.subjevkos,
        makeTextNode(" " + jevko.suffix)
      ],
      suffix: ""
    };
    return t(headerContents);
  };
};
var ctx = /* @__PURE__ */ new Map([
  [
    "",
    toHtml
  ],
  [
    "#",
    makeTagWithAnchor("h1")
  ],
  [
    "##",
    makeTagWithAnchor("h2")
  ],
  [
    "br",
    makeSelfClosingTag("br")
  ],
  [
    "sub",
    makeSpanWithClass("sub")
  ],
  [
    "suf",
    makeSpanWithClass("suf")
  ],
  [
    "suffix",
    makeSpanWithClass("suf", "inline")
  ],
  [
    "prefix",
    makeSpanWithClass("prefix")
  ],
  [
    "jevko",
    makeSpanWithClass("jevko")
  ],
  [
    "gray",
    makeSpanWithClass("gray")
  ],
  [
    "cdata",
    async (jevko) => {
      const ret = await toHtml(jevko);
      return `<![CDATA[${ret}]]>`;
    }
  ],
  [
    "doctype",
    async (jevko) => {
      const ret = await string(jevko);
      return `<!DOCTYPE ${ret}>`;
    }
  ]
]);
var parseHtmlJevko = (source, dir = ".") => {
  return prep(jevkoFromString(source), dir);
};
var jevkoml = async (preppedjevko, options) => {
  const { dir, root, prepend } = options;
  const document = prep(preppedjevko, dir);
  const { attrs, jevko } = makeTop(document);
  if (root === void 0) {
    if (attrs.length > 0)
      throw Error("unexpected top-level attributes; remove or add /root");
  }
  let content = await toHtml(jevko);
  if (root !== void 0) {
    let main2, rest;
    if (Array.isArray(root)) {
      console.assert(root.every((v) => typeof v === "string"));
      [main2, ...rest] = root;
    } else {
      console.assert(typeof root === "string");
      main2 = root;
      rest = [];
    }
    let openers = "";
    let closers = "";
    for (const s of rest) {
      openers += `<${s}>`;
      closers = `</${s}>` + closers;
    }
    content = `<${[
      main2,
      ...attrs
    ].join(" ")}>${openers}${content}${closers}</${main2}>`;
  }
  if (prepend !== void 0) {
    const keywords = prepend;
    if (keywords.includes("viewport")) {
      content = `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />` + content;
    }
    if (keywords.includes("doctype")) {
      content = `<!doctype html>
` + content;
    }
    if (keywords.includes("xml1")) {
      content = `<?xml version="1.0" encoding="UTF-8"?>
` + content;
    }
  }
  return content;
};
var CodePoint = {
  _0_: "0".codePointAt(0),
  _1_: "1".codePointAt(0),
  _9_: "9".codePointAt(0),
  _a_: "a".codePointAt(0),
  _f_: "f".codePointAt(0),
  _A_: "A".codePointAt(0),
  _F_: "F".codePointAt(0),
  _openCurly_: "{".codePointAt(0),
  _openSquare_: "[".codePointAt(0),
  _closeCurly_: "}".codePointAt(0),
  _closeSquare_: "]".codePointAt(0),
  _quoteMark_: '"'.codePointAt(0),
  _plus_: "+".codePointAt(0),
  _minus_: "-".codePointAt(0),
  _space_: " ".codePointAt(0),
  _newline_: "\n".codePointAt(0),
  _tab_: "	".codePointAt(0),
  _return_: "\r".codePointAt(0),
  _backslash_: "\\".codePointAt(0),
  _slash_: "/".codePointAt(0),
  _comma_: ",".codePointAt(0),
  _colon_: ":".codePointAt(0),
  _t_: "t".codePointAt(0),
  _n_: "n".codePointAt(0),
  _b_: "b".codePointAt(0),
  _r_: "r".codePointAt(0),
  _u_: "u".codePointAt(0),
  _dot_: ".".codePointAt(0),
  _e_: "e".codePointAt(0),
  _E_: "E".codePointAt(0),
  _l_: "l".codePointAt(0),
  _s_: "s".codePointAt(0)
};
var { _0_, _1_, _9_, _A_, _E_, _F_, _a_, _b_, _backslash_, _closeCurly_, _closeSquare_, _colon_, _comma_, _dot_, _e_, _f_, _l_, _minus_, _n_, _newline_, _openCurly_, _openSquare_, _plus_, _quoteMark_, _r_, _return_, _s_, _slash_, _space_, _t_, _tab_, _u_ } = CodePoint;
var JsonFeedbackType = {
  error: "JsonFeedbackType.error"
};
var JsonErrorType = {
  unexpected: "JsonErrorType.unexpected",
  unexpectedEnd: "JsonErrorType.unexpectedEnd"
};
var error = (message) => {
  return {
    type: JsonFeedbackType.error,
    message
  };
};
var unexpected = (code, context, expected) => {
  return {
    type: JsonFeedbackType.error,
    errorType: JsonErrorType.unexpected,
    codePoint: code,
    context,
    expected
  };
};
var unexpectedEnd = (context, expected) => {
  return {
    type: JsonFeedbackType.error,
    errorType: JsonErrorType.unexpectedEnd,
    context,
    expected
  };
};
var isZeroNine = (code) => code >= _0_ && code <= _9_;
var isOneNine = (code) => code >= _1_ && code <= _9_;
var isWhitespace = (code) => code === _space_ || code === _newline_ || code === _tab_ || code === _return_;
var JsonLow = (next, initialState = {}) => {
  let mode = initialState.mode ?? "Mode._value";
  let parents = initialState.parents ?? [
    "Parent.top"
  ];
  let hexIndex = initialState.hexIndex ?? 0;
  let maxDepth = initialState.maxDepth ?? 65536;
  const fraction = (code) => {
    if (code === _dot_) {
      mode = "Mode.dot_";
      return next.codePoint?.(code);
    }
    return exponent(code);
  };
  const exponent = (code) => {
    if (code === _e_ || code === _E_) {
      mode = "Mode.exponent_";
      return next.codePoint?.(code);
    }
    return number(code);
  };
  const number = (code) => {
    mode = parents[parents.length - 1] === "Parent.top" ? "Mode._value" : "Mode.value_";
    next.closeNumber?.();
    return self.codePoint(code);
  };
  const maxDepthExceeded = () => error(`Invalid parser state! Max depth of ${maxDepth} exceeded!`);
  const closeParent = (code) => {
    const parent = parents.pop();
    if (code === _closeCurly_) {
      if (parent === "Parent.object") {
        mode = parents[parents.length - 1] === "Parent.top" ? "Mode._value" : "Mode.value_";
        return next.closeObject?.(code);
      }
    }
    if (code === _closeSquare_) {
      if (parent === "Parent.array") {
        mode = parents[parents.length - 1] === "Parent.top" ? "Mode._value" : "Mode.value_";
        return next.closeArray?.(code);
      }
    }
    return unexpected(code, `in ${parentToString(parent)}`);
  };
  const self = {
    codePoint: (code) => {
      switch (mode) {
        case "Mode._value":
          switch (code) {
            case _openCurly_: {
              if (parents.length >= maxDepth)
                return maxDepthExceeded();
              parents.push("Parent.object");
              parents.push("Parent.key");
              mode = "Mode._key";
              return next.openObject?.(code);
            }
            case _openSquare_: {
              if (parents.length >= maxDepth)
                return maxDepthExceeded();
              parents.push("Parent.array");
              mode = "Mode._value";
              return next.openArray?.(code);
            }
            case _quoteMark_:
              mode = "Mode.string_";
              return next.openString?.(code);
            case _t_:
              mode = "Mode.t_rue";
              return next.openTrue?.(code);
            case _f_:
              mode = "Mode.f_alse";
              return next.openFalse?.(code);
            case _n_:
              mode = "Mode.n_ull";
              return next.openNull?.(code);
            case _minus_:
              mode = "Mode.minus_";
              return next.openNumber?.(code);
            case _0_:
              mode = "Mode.zero_";
              return next.openNumber?.(code);
            default:
              if (isOneNine(code)) {
                mode = "Mode.onenine_";
                return next.openNumber?.(code);
              }
              if (isWhitespace(code))
                return next.whitespace?.(code);
              return closeParent(code);
          }
        case "Mode.value_":
          if (code === _comma_) {
            const parent = parents[parents.length - 1];
            if (parent === "Parent.object") {
              parents.push("Parent.key");
              mode = "Mode._key";
              return next.comma?.(code);
            }
            if (parent === "Parent.array") {
              mode = "Mode._value";
              return next.comma?.(code);
            }
            return error(`Invalid parser state! Unexpected parent ${parent}.`);
          }
          if (isWhitespace(code))
            return next.whitespace?.(code);
          return closeParent(code);
        case "Mode._key":
          if (code === _quoteMark_) {
            mode = "Mode.string_";
            return next.openKey?.(code);
          }
          if (code === _closeCurly_) {
            parents.pop();
            parents.pop();
            mode = parents[parents.length - 1] === "Parent.top" ? "Mode._value" : "Mode.value_";
            return next.closeObject?.(code);
          }
          if (isWhitespace(code))
            return next.whitespace?.(code);
          return unexpected(code, "in an object", [
            '"',
            "}",
            "whitespace"
          ]);
        case "Mode.key_":
          if (code === _colon_) {
            parents.pop();
            mode = "Mode._value";
            return next.colon?.(code);
          }
          if (isWhitespace(code))
            return next.whitespace?.(code);
          return unexpected(code, "after key", [
            ":",
            "whitespace"
          ]);
        case "Mode.string_":
          if (code === _quoteMark_) {
            const parent1 = parents[parents.length - 1];
            if (parent1 === "Parent.key") {
              mode = "Mode.key_";
              return next.closeKey?.(code);
            }
            mode = parents[parents.length - 1] === "Parent.top" ? "Mode._value" : "Mode.value_";
            return next.closeString?.(code);
          }
          if (code === _backslash_) {
            mode = "Mode.escape_";
            return next.escape?.(code);
          }
          if (code >= 32 && code <= 1114111)
            return next.codePoint?.(code);
          return unexpected(code, "in a string", [
            '"',
            "\\",
            "a code point 0x0020 thru 0x10ffff"
          ]);
        case "Mode.escape_":
          if (code === _quoteMark_ || code === _n_ || code === _backslash_ || code === _t_ || code === _slash_ || code === _b_ || code === _f_ || code === _r_) {
            mode = "Mode.string_";
            return next.codePoint?.(code);
          }
          if (code === _u_) {
            mode = "Mode.hex_";
            return next.openHex?.(code);
          }
          return unexpected(code, "after escape", [
            '"',
            "n",
            "\\",
            "t",
            "/",
            "b",
            "f",
            "r",
            "u"
          ]);
        case "Mode.hex_":
          if (code >= _0_ && code <= _9_ || code >= _a_ && code <= _f_ || code >= _A_ && code <= _F_) {
            if (hexIndex < 3) {
              hexIndex += 1;
              return next.codePoint?.(code);
            }
            hexIndex = 0;
            mode = "Mode.string_";
            return next.closeHex?.(code);
          }
          return unexpected(code, `at index ${hexIndex} of a hexadecimal escape sequence`, [
            [
              "a",
              "f"
            ],
            [
              "A",
              "F"
            ],
            [
              "0",
              "9"
            ]
          ]);
        case "Mode.minus_":
          if (code === _0_) {
            mode = "Mode.zero_";
            return next.codePoint?.(code);
          }
          if (isOneNine(code)) {
            mode = "Mode.onenine_";
            return next.codePoint?.(code);
          }
          return unexpected(code, `after '-'`, [
            [
              "0",
              "9"
            ]
          ]);
        case "Mode.zero_":
          return fraction(code);
        case "Mode.onenine_":
          if (isZeroNine(code)) {
            mode = "Mode.onenineDigit_";
            return next.codePoint?.(code);
          }
          return fraction(code);
        case "Mode.dot_":
          if (isZeroNine(code)) {
            mode = "Mode.digitDotDigit_";
            return next.codePoint?.(code);
          }
          return unexpected(code, `after '.'`, [
            [
              "0",
              "9"
            ]
          ]);
        case "Mode.exponent_":
          if (code === _plus_ || code === _minus_) {
            mode = "Mode.exponentSign_";
            return next.codePoint?.(code);
          }
          if (isZeroNine(code)) {
            mode = "Mode.exponentSignDigit_";
            return next.codePoint?.(code);
          }
          return unexpected(code, `after exponent`, [
            "+",
            "-",
            [
              "0",
              "9"
            ]
          ]);
        case "Mode.exponentSign_":
          if (isZeroNine(code)) {
            mode = "Mode.exponentSignDigit_";
            return next.codePoint?.(code);
          }
          return unexpected(code, `after exponent sign`, [
            [
              "0",
              "9"
            ]
          ]);
        case "Mode.onenineDigit_":
          if (isZeroNine(code))
            return next.codePoint?.(code);
          return fraction(code);
        case "Mode.digitDotDigit_":
          if (isZeroNine(code))
            return next.codePoint?.(code);
          return exponent(code);
        case "Mode.exponentSignDigit_":
          if (isZeroNine(code))
            return next.codePoint?.(code);
          return number(code);
        case "Mode.t_rue":
          if (code === _r_) {
            mode = "Mode.tr_ue";
            return next.codePoint?.(code);
          }
          return unexpected(code, `at the second position in true`, [
            "r"
          ]);
        case "Mode.tr_ue":
          if (code === _u_) {
            mode = "Mode.tru_e";
            return next.codePoint?.(code);
          }
          return unexpected(code, `at the third position in true`, [
            "u"
          ]);
        case "Mode.tru_e":
          if (code === _e_) {
            mode = parents[parents.length - 1] === "Parent.top" ? "Mode._value" : "Mode.value_";
            return next.closeTrue?.(code);
          }
          return unexpected(code, `at the fourth position in true`, [
            "e"
          ]);
        case "Mode.f_alse":
          if (code === _a_) {
            mode = "Mode.fa_lse";
            return next.codePoint?.(code);
          }
          return unexpected(code, `at the second position in false`, [
            "a"
          ]);
        case "Mode.fa_lse":
          if (code === _l_) {
            mode = "Mode.fal_se";
            return next.codePoint?.(code);
          }
          return unexpected(code, `at the third position in false`, [
            "l"
          ]);
        case "Mode.fal_se":
          if (code === _s_) {
            mode = "Mode.fals_e";
            return next.codePoint?.(code);
          }
          return unexpected(code, `at the fourth position in false`, [
            "s"
          ]);
        case "Mode.fals_e":
          if (code === _e_) {
            mode = parents[parents.length - 1] === "Parent.top" ? "Mode._value" : "Mode.value_";
            return next.closeFalse?.(code);
          }
          return unexpected(code, `at the fifth position in false`, [
            "e"
          ]);
        case "Mode.n_ull":
          if (code === _u_) {
            mode = "Mode.nu_ll";
            return next.codePoint?.(code);
          }
          return unexpected(code, `at the second position in null`, [
            "u"
          ]);
        case "Mode.nu_ll":
          if (code === _l_) {
            mode = "Mode.nul_l";
            return next.codePoint?.(code);
          }
          return unexpected(code, `at the third position in null`, [
            "l"
          ]);
        case "Mode.nul_l":
          if (code === _l_) {
            mode = parents[parents.length - 1] === "Parent.top" ? "Mode._value" : "Mode.value_";
            return next.closeNull?.(code);
          }
          return unexpected(code, `at the fourth position in null`, [
            "l"
          ]);
        default:
          return error(`Invalid parser mode: ${mode}`);
      }
    },
    end: () => {
      const parent = parents[parents.length - 1];
      switch (parent) {
        case "Parent.key":
          return unexpectedEnd(`a key/object left unclosed!`);
        case "Parent.top":
          break;
        default:
          return unexpectedEnd(`${parentToString(parent)} left unclosed!`);
      }
      switch (mode) {
        case "Mode._value":
          return next.end?.();
        case "Mode.key_":
          return error("a key/object left unclosed!");
        case "Mode._key":
          return unexpectedEnd("an object left unclosed!");
        case "Mode.exponentSignDigit_":
        case "Mode.onenine_":
        case "Mode.onenineDigit_":
        case "Mode.digitDotDigit_":
        case "Mode.zero_":
          mode = parents[parents.length - 1] === "Parent.top" ? "Mode._value" : "Mode.value_";
          next.closeNumber?.();
          return next.end?.();
        case "Mode.minus_":
        case "Mode.dot_":
        case "Mode.exponent_":
        case "Mode.exponentSign_":
          return unexpectedEnd(`incomplete number!`);
        case "Mode.hex_":
          return unexpectedEnd("after hexadecimal escape in string!");
        case "Mode.escape_":
          return unexpectedEnd("after escape in string!");
        case "Mode.string_":
          return unexpectedEnd("a string left unclosed!");
        case "Mode.t_rue":
          return unexpectedEnd(`before the second position in true!`, [
            "r"
          ]);
        case "Mode.tr_ue":
          return unexpectedEnd(`before the third position in true!`, [
            "u"
          ]);
        case "Mode.tru_e":
          return unexpectedEnd(`before the fourth position in true!`, [
            "e"
          ]);
        case "Mode.f_alse":
          return unexpectedEnd(`before the second position in false!`, [
            "a"
          ]);
        case "Mode.fa_lse":
          return unexpectedEnd(`before the third position in false!`, [
            "l"
          ]);
        case "Mode.fal_se":
          return unexpectedEnd(`before the fourth position in false!`, [
            "s"
          ]);
        case "Mode.fals_e":
          return unexpectedEnd(`before the fifth position in false!`, [
            "e"
          ]);
        case "Mode.n_ull":
          return unexpectedEnd(`before the second position in null!`, [
            "u"
          ]);
        case "Mode.nu_ll":
          return unexpectedEnd(`before the third position in null!`, [
            "l"
          ]);
        case "Mode.nul_l":
          return unexpectedEnd(`before the fourth position in null!`, [
            "l"
          ]);
        default:
          return unexpectedEnd();
      }
    },
    state: () => {
      const downstream = next.state?.();
      return {
        mode,
        parents: [
          ...parents
        ],
        downstream
      };
    }
  };
  return self;
};
var parentToString = (parent) => {
  switch (parent) {
    case "Parent.array":
      return "an array";
    case "Parent.object":
      return "an object";
    case "Parent.key":
      return "a key";
    case "Parent.top":
      return "the top-level value";
  }
};
var { _t_: _t_1, _n_: _n_1, _b_: _b_1, _r_: _r_1, _f_: _f_1 } = CodePoint;
var JsonLowToHigh = (next) => {
  let mode = "top";
  let stringBuffer = "";
  let numberBuffer = "";
  let hexBuf = [];
  const feedbackQueue = [];
  const valFeedback = (val) => {
    return feedbackQueue.length > 0 ? [
      feedbackQueue.pop(),
      val
    ] : [
      val
    ];
  };
  const openStringKey = () => {
    stringBuffer = "";
    mode = "string";
    return feedbackQueue.length > 0 ? [
      feedbackQueue.pop()
    ] : [];
  };
  const self = {
    openString: openStringKey,
    openKey: openStringKey,
    openNumber: (codePoint) => {
      numberBuffer = String.fromCharCode(codePoint);
      mode = "number";
      return feedbackQueue.length > 0 ? [
        feedbackQueue.pop()
      ] : [];
    },
    openObject: () => {
      return valFeedback(next.openObject?.());
    },
    openArray: () => {
      return valFeedback(next.openArray?.());
    },
    closeObject: () => {
      return valFeedback(next.closeObject?.());
    },
    closeArray: () => {
      return valFeedback(next.closeArray?.());
    },
    closeTrue: () => {
      return valFeedback(next.value?.(true));
    },
    closeFalse: () => {
      return valFeedback(next.value?.(false));
    },
    closeNull: () => {
      return valFeedback(next.value?.(null));
    },
    codePoint: (codePoint) => {
      if (mode === "string") {
        stringBuffer += String.fromCodePoint(codePoint);
      } else if (mode === "escape") {
        if (codePoint === _n_1)
          stringBuffer += "\n";
        else if (codePoint === _t_1)
          stringBuffer += "	";
        else if (codePoint === _r_1)
          stringBuffer += "\r";
        else if (codePoint === _b_1)
          stringBuffer += "\b";
        else if (codePoint === _f_1)
          stringBuffer += "\f";
        else {
          stringBuffer += String.fromCharCode(codePoint);
        }
        mode = "string";
      } else if (mode === "hex") {
        hexBuf.push(codePoint);
      } else if (mode === "number") {
        numberBuffer += String.fromCharCode(codePoint);
      }
      return feedbackQueue.length > 0 ? [
        feedbackQueue.pop()
      ] : [];
    },
    escape: () => {
      mode = "escape";
      return feedbackQueue.length > 0 ? [
        feedbackQueue.pop()
      ] : [];
    },
    openHex: () => {
      hexBuf = [];
      mode = "hex";
      return feedbackQueue.length > 0 ? [
        feedbackQueue.pop()
      ] : [];
    },
    closeString: () => {
      mode = "top";
      return valFeedback(next.value?.(stringBuffer));
    },
    closeKey: () => {
      mode = "top";
      return valFeedback(next.key?.(stringBuffer));
    },
    closeHex: (codePoint) => {
      hexBuf.push(codePoint);
      stringBuffer += String.fromCharCode(Number.parseInt(String.fromCharCode(...hexBuf), 16));
      mode = "string";
      return feedbackQueue.length > 0 ? [
        feedbackQueue.pop()
      ] : [];
    },
    closeNumber: () => {
      mode = "top";
      feedbackQueue.push(next.value?.(Number.parseFloat(numberBuffer)));
      return [];
    },
    end: () => {
      const feedback = [];
      if (feedbackQueue.length > 0)
        feedback.push(feedbackQueue.pop());
      feedback.push(next.end?.());
      return feedback;
    }
  };
  return self;
};
var _newline_1 = "\n".charCodeAt(0);
var PosInfoAdapter = (stream) => {
  let pos = 0, line = 0, col = 0;
  const self = {
    codePoint: (code) => {
      const ret = stream.codePoint(code);
      const wret = {
        pos,
        line,
        col,
        ...ret
      };
      pos += 1;
      if (code === _newline_1) {
        line += 1;
        col = 0;
      } else {
        col += 1;
      }
      return wret;
    },
    end: () => {
      const ret = stream.end();
      pos += 1;
      col += 1;
      return {
        pos,
        line,
        col,
        ...ret
      };
    }
  };
  return new Proxy(stream, {
    get: (target, prop, rec) => {
      return self[prop] || target[prop];
    }
  });
};
var JsonHigh = (next) => {
  const stream = PosInfoAdapter(JsonLow(JsonLowToHigh(next)));
  const self = {
    chunk(chunk) {
      for (const c of chunk) {
        const feedback = [
          stream.codePoint(c.codePointAt(0))
        ].flat();
        for (const f of feedback) {
          if (f.type === JsonFeedbackType.error)
            throw Error(JSON.stringify(f));
        }
      }
      return self;
    },
    end() {
      return stream.end();
    },
    state() {
      return stream.state();
    }
  };
  return self;
};
var stringToHeredoc1 = (str) => {
  return stringToHeredoc(str, "", defaultDelimiters);
};
var convertKey = (key) => convertString(key);
var convertString = (str) => {
  const escaped = escape(str);
  if (str.trim() !== str || str[0] === "'" || str.at(-1) === "'") {
    return `'${escaped}'`;
  }
  return escaped;
};
var { opener, closer } = defaultDelimiters;
var convertValue = (value) => {
  if (typeof value === "string") {
    const str = convertString(value);
    if (str.length > value.length)
      return stringToHeredoc1(value);
    return opener + str + closer;
  }
  return opener + value + closer;
};
var makeStream = (write2) => {
  let isEmpty = false;
  let depth = 0;
  const stream = JsonHigh({
    openArray: () => {
      isEmpty = true;
      if (depth > 0)
        write2(opener);
      ++depth;
    },
    openObject: () => {
      isEmpty = true;
      if (depth > 0)
        write2(opener);
      ++depth;
    },
    closeArray: () => {
      if (isEmpty)
        write2("seq");
      --depth;
      if (depth > 0)
        write2(closer);
      isEmpty = false;
    },
    closeObject: () => {
      if (isEmpty)
        write2("map");
      --depth;
      if (depth > 0)
        write2(closer);
      isEmpty = false;
    },
    key: (key) => {
      write2(convertKey(key));
    },
    value: (value) => {
      isEmpty = false;
      write2(convertValue(value));
    }
  });
  return stream;
};
var fromJsonStr = (str) => {
  let ret = "";
  const stream = makeStream((str2) => ret += str2);
  stream.chunk(str);
  stream.end();
  return ret;
};
var { opener: opener1, closer: closer1, escaper, quoter } = defaultDelimiters;
var strToHeredoc = (str, tag) => `${escaper}${quoter}${tag}${quoter}${str}${quoter}${tag}${quoter}`;
var jevkoToPrettyString = (jevko) => {
  const { subjevkos, suffix, tag } = jevko;
  if (tag !== void 0)
    return strToHeredoc(suffix, tag);
  let ret = "";
  for (const { prefix, jevko: jevko1 } of subjevkos) {
    ret += `${escapePrefix(prefix)}${recur1(jevko1, "  ", "")}
`;
  }
  return ret + escape(suffix);
};
var escapePrefix = (prefix) => prefix === "" ? "" : escape(prefix) + " ";
var recur1 = (jevko, indent, prevIndent) => {
  const { subjevkos, suffix, tag } = jevko;
  if (tag !== void 0)
    return strToHeredoc(suffix, tag);
  let ret = "";
  if (subjevkos.length > 0) {
    ret += "\n";
    for (const { prefix, jevko: jevko1 } of subjevkos) {
      ret += `${indent}${escapePrefix(prefix)}${recur1(jevko1, indent + "  ", indent)}
`;
    }
    ret += prevIndent;
  }
  return opener1 + ret + escape(suffix) + closer1;
};
var prettyFromJsonStr = (str) => jevkoToPrettyString(jevkoFromString(fromJsonStr(str)));
var jevkodata = (jevko, props) => {
  if (props.pretty === true || Array.isArray(props.flags) && props.flags.includes("pretty")) {
    return JSON.stringify(convert(jevko), null, 2);
  }
  return JSON.stringify(convert(jevko));
};
var convert = (jevko) => inner(prep1(jevko));
var prep1 = (jevko) => {
  const { subjevkos, ...rest } = jevko;
  const subs = [];
  for (const { prefix, jevko: jevko1 } of subjevkos) {
    const trimmed = prefix.trim();
    let key;
    if (trimmed.startsWith("'")) {
      key = trimmed;
    } else {
      const lines = prefix.split("\n");
      key = lines.at(-1).trim();
      if (key.startsWith("-"))
        continue;
    }
    subs.push({
      prefix: key,
      jevko: prep1(jevko1)
    });
  }
  return {
    subjevkos: subs,
    ...rest
  };
};
var inner = (jevko) => {
  const { subjevkos, suffix } = jevko;
  if (subjevkos.length === 0) {
    const { tag } = jevko;
    if (tag === "json")
      return JSON.parse(suffix);
    else if (tag !== void 0)
      return suffix;
    const trimmed = suffix.trim();
    if (trimmed.startsWith("'")) {
      if (trimmed.at(-1) === "'")
        return trimmed.slice(1, -1);
      return trimmed.slice(1);
    }
    if (trimmed === "")
      return trimmed;
    if (trimmed === "true")
      return true;
    if (trimmed === "false")
      return false;
    if (trimmed === "null" || trimmed === "nil")
      return null;
    if (trimmed === "map")
      return /* @__PURE__ */ Object.create(null);
    if (trimmed === "list" || trimmed === "seq")
      return [];
    if (trimmed === "NaN")
      return NaN;
    const num = Number(trimmed);
    if (Number.isNaN(num) === false)
      return num;
    return trimmed;
  }
  if (suffix.trim() !== "")
    throw Error(`Expected blank suffix, was: ${suffix}`);
  const sub0 = subjevkos[0];
  if (sub0.prefix === "")
    return list(subjevkos);
  return map(subjevkos);
};
var list = (subjevkos) => {
  const ret = [];
  for (const { prefix, jevko } of subjevkos) {
    if (prefix !== "")
      throw Error("oops");
    ret.push(inner(jevko));
  }
  return ret;
};
var map = (subjevkos) => {
  const ret = /* @__PURE__ */ Object.create(null);
  for (const { prefix, jevko } of subjevkos) {
    if (prefix === "")
      throw Error("oops");
    let key;
    if (prefix.startsWith("'")) {
      if (prefix.at(-1) === "'")
        key = prefix.slice(1, -1);
      else
        key = prefix.slice(1);
    } else
      key = prefix;
    if (key in ret)
      throw Error("dupe");
    ret[key] = inner(jevko);
  }
  return ret;
};
var convert1 = (jevko) => nodes(prep2(jevko));
var prep2 = (jevko) => {
  const { subjevkos, ...rest } = jevko;
  const subs = [];
  for (const { prefix, jevko: jevko1 } of subjevkos) {
    const lines = prefix.split("\n");
    const trimmed = lines.at(-1).trim();
    if (trimmed.startsWith("-"))
      continue;
    subs.push({
      prefix: trimmed,
      jevko: prep2(jevko1)
    });
  }
  return {
    subjevkos: subs,
    ...rest
  };
};
var toKey = (jevko) => {
  const { subjevkos, suffix } = jevko;
  if (subjevkos.length === 0) {
    const trimmed = suffix.trim();
    if (trimmed === "")
      throw Error("empty key not allowed");
    return trimmed;
  }
  console.error(jevko);
  throw Error("not a valid key");
};
var nodes = (jevko) => {
  const topMap = /* @__PURE__ */ Object.create(null);
  let currentSection = topMap;
  let currentSectionKey = "";
  const { subjevkos, suffix } = jevko;
  if (suffix.trim() !== "")
    throw Error("1");
  for (const { prefix, jevko: jevko1 } of subjevkos) {
    if (prefix === "") {
      const { path, isRelative } = toPath(jevko1);
      if (isRelative === false)
        currentSection = topMap;
      for (const p of path) {
        currentSectionKey = p;
        if (currentSectionKey in currentSection === false) {
          currentSection[currentSectionKey] = /* @__PURE__ */ Object.create(null);
        }
        currentSection = currentSection[currentSectionKey];
      }
    } else {
      currentSection[prefix] = inner1(jevko1);
    }
  }
  return topMap;
};
var toPath = (jevko) => {
  const { subjevkos, suffix } = jevko;
  if (subjevkos.length === 0)
    return {
      path: [
        toKey(jevko)
      ],
      isRelative: false
    };
  if (suffix.trim() !== "")
    throw Error("oops");
  const { prefix, jevko: jevko0 } = subjevkos[0];
  const ret = [];
  let isRelative = false;
  if (prefix === "./") {
    isRelative = true;
  } else if (prefix !== "")
    throw Error("oops");
  ret.push(toKey(jevko0));
  for (const { prefix: prefix1, jevko: jevko1 } of subjevkos.slice(1)) {
    if (prefix1 !== "")
      throw Error("oops");
    ret.push(toKey(jevko1));
  }
  return {
    path: ret,
    isRelative
  };
};
var inner1 = (jevko) => {
  const { subjevkos, suffix } = jevko;
  if (subjevkos.length === 0) {
    const { tag } = jevko;
    if (tag === "json")
      return JSON.parse(suffix);
    const trimmed = suffix.trim();
    if (trimmed.startsWith("'")) {
      if (trimmed.at(-1) === "'")
        return trimmed.slice(1, -1);
      return trimmed.slice(1);
    }
    if (trimmed === "true")
      return true;
    if (trimmed === "false")
      return false;
    if (trimmed === "null")
      return null;
    if (trimmed === "map")
      return /* @__PURE__ */ Object.create(null);
    if (trimmed === "list")
      return [];
    if (trimmed === "NaN")
      return NaN;
    const num = Number(trimmed);
    if (Number.isNaN(num) === false)
      return num;
    return suffix;
  }
  if (suffix.trim() !== "")
    throw Error("oops");
  const sub0 = subjevkos[0];
  if (sub0.prefix === "")
    return list1(subjevkos);
  return map1(subjevkos);
};
var list1 = (subjevkos) => {
  const ret = [];
  for (const { prefix, jevko } of subjevkos) {
    if (prefix !== "")
      throw Error("oops");
    ret.push(inner1(jevko));
  }
  return ret;
};
var map1 = (subjevkos) => {
  const ret = /* @__PURE__ */ Object.create(null);
  for (const { prefix, jevko } of subjevkos) {
    if (prefix === "")
      throw Error("oops");
    if (prefix in ret)
      throw Error("dupe");
    ret[prefix] = inner1(jevko);
  }
  return ret;
};
var jevkocfg = (jevko) => {
  return JSON.stringify(convert1(jevko));
};
var defaultOpener1 = "[";
var defaultCloser1 = "]";
var defaultEscaper1 = "`";
var defaultQuoter1 = "'";
var normalizeDelimiters1 = (delims) => {
  const { opener: opener2 = defaultOpener1, closer: closer2 = defaultCloser1, escaper: escaper2 = defaultEscaper1, quoter: quoter2 = defaultQuoter1 } = delims ?? {};
  const delimiters = [
    opener2,
    closer2,
    escaper2,
    quoter2
  ];
  const delimiterSetSize = new Set(delimiters).size;
  if (delimiterSetSize !== delimiters.length) {
    throw Error(`Delimiters must be unique! ${delimiters.length - delimiterSetSize} of them are identical:
${delimiters.join("\n")}`);
  }
  return {
    opener: opener2,
    closer: closer2,
    escaper: escaper2,
    quoter: quoter2
  };
};
var jevkoFromString1 = (str, delimiters) => {
  const { opener: opener2, closer: closer2, escaper: escaper2, quoter: quoter2 } = normalizeDelimiters1(delimiters);
  const parents = [];
  let parent = {
    subjevkos: []
  }, prefix = "", h = 0, mode = "normal";
  let line = 1, column = 1;
  let tag = "", t = 0;
  let sawFirstQuoter = false;
  for (let i = 0; i < str.length; ++i) {
    const c = str[i];
    if (mode === "escaped") {
      if (c === escaper2 || c === opener2 || c === closer2)
        mode = "normal";
      else if (c === quoter2) {
        mode = "tag";
        t = i + 1;
      } else
        throw SyntaxError(`Invalid digraph (${escaper2}${c}) at ${line}:${column}!`);
    } else if (mode === "tag") {
      if (c === quoter2) {
        tag = str.slice(t, i);
        h = i + 1;
        t = h;
        mode = "heredoc";
      }
    } else if (mode === "heredoc") {
      if (c === quoter2) {
        if (sawFirstQuoter === false) {
          h = i + 1;
          sawFirstQuoter = true;
        } else {
          const found = str.slice(h, i);
          if (found === tag) {
            const jevko = {
              subjevkos: [],
              suffix: str.slice(t, h - 1),
              tag
            };
            parent.subjevkos.push({
              prefix,
              jevko
            });
            prefix = "";
            h = i + 1;
            tag = "";
            mode = "normal";
            sawFirstQuoter = false;
          } else {
            h = i + 1;
          }
        }
      }
    } else if (c === escaper2) {
      prefix += str.slice(h, i);
      h = i + 1;
      mode = "escaped";
    } else if (c === opener2) {
      const jevko1 = {
        subjevkos: []
      };
      parent.subjevkos.push({
        prefix: prefix + str.slice(h, i),
        jevko: jevko1
      });
      prefix = "";
      h = i + 1;
      parents.push(parent);
      parent = jevko1;
    } else if (c === closer2) {
      parent.suffix = prefix + str.slice(h, i);
      prefix = "";
      h = i + 1;
      if (parents.length < 1)
        throw SyntaxError(`Unexpected closer (${closer2}) at ${line}:${column}!`);
      parent = parents.pop();
    }
    if (c === "\n") {
      ++line;
      column = 1;
    } else {
      ++column;
    }
  }
  if (mode === "escaped")
    throw SyntaxError(`Unexpected end after escaper (${escaper2})!`);
  if (mode === "tag")
    throw SyntaxError(`Unexpected end after quoter (${quoter2})!`);
  if (mode === "heredoc" || mode === "heredoc0")
    throw SyntaxError(`Unexpected end after quoter (${quoter2})!`);
  if (parents.length > 0)
    throw SyntaxError(`Unexpected end: missing ${parents.length} closer(s) (${closer2})!`);
  parent.suffix = prefix + str.slice(h);
  parent.opener = opener2;
  parent.closer = closer2;
  parent.escaper = escaper2;
  parent.quoter = quoter2;
  return parent;
};

// node/nonportable/deps.js
var import_node_path = require("node:path");

// node/nonportable/io.js
var import_node_fs = require("node:fs");
var readTextFileSync = (fileName) => {
  return (0, import_node_fs.readFileSync)(fileName, "utf-8");
};
var writeTextFileSync = (fileName, contents) => {
  return (0, import_node_fs.writeFileSync)(fileName, contents, "utf-8");
};
var readStdinText = async () => {
  const readable = process.stdin;
  const chunks = [];
  readable.on("readable", () => {
    let chunk;
    while (null !== (chunk = readable.read())) {
      chunks.push(chunk);
    }
  });
  return new Promise((res, rej) => {
    readable.on("end", () => {
      res(chunks.join(""));
    });
  });
};
var mkdirRecursiveSync = (path) => {
  (0, import_node_fs.mkdirSync)(path, { recursive: true });
};
var existsSync = (path) => {
  try {
    (0, import_node_fs.lstatSync)(path);
    return true;
  } catch (e) {
    if (e.code === "ENOENT")
      return false;
    throw e;
  }
};

// node/portable/importDirective.js
var importDirective = (jevko, options) => {
  const { dir } = options;
  const { subjevkos, ...rest } = jevko;
  const subs = [];
  for (const sub of subjevkos) {
    const { prefix, jevko: jevko2 } = sub;
    const trimmed = prefix.trim();
    if (trimmed.startsWith("/")) {
      const directive = trimmed.slice(1).trim();
      if (directive === "import") {
        const fileName = string2(jevko2);
        let path;
        if ((0, import_node_path.isAbsolute)(fileName))
          path = fileName;
        else
          path = (0, import_node_path.join)(dir, fileName);
        const src = readTextFileSync(path);
        const parsed = jevkoFromString1(src);
        if (parsed.suffix.trim() !== "")
          throw Error("oops: suffix of the imported file must be blank, was " + parsed.suffix);
        const prepped = importDirective(parsed, {
          ...options,
          dir: (0, import_node_path.dirname)(path)
        });
        const { subjevkos: subjevkos2 } = prepped;
        subs.push(...subjevkos2);
        continue;
      } else if (directive === "paste") {
        const fileName = string2(jevko2);
        let path;
        if ((0, import_node_path.isAbsolute)(fileName))
          path = fileName;
        else
          path = (0, import_node_path.join)(dir, fileName);
        const src = readTextFileSync(path);
        subs.push(makeTextNode2(src));
        continue;
      }
    }
    subs.push({ prefix, jevko: importDirective(jevko2, options) });
  }
  return { subjevkos: subs, ...rest };
};
var string2 = (jevko) => {
  const { subjevkos, suffix } = jevko;
  if (subjevkos.length > 0)
    throw Error("oops");
  return suffix;
};
var makeTextNode2 = (text) => {
  return {
    prefix: "",
    jevko: suffixToJevko2(text)
  };
};
var suffixToJevko2 = (suffix) => {
  return {
    subjevkos: [],
    suffix
  };
};

// node/portable/main.js
var defaultOptions = {
  platform: "deno"
};
var main = async (argmap = {}) => {
  let { format, input } = argmap;
  let source;
  if (input !== void 0) {
    const fileName = argmap.input;
    source = withoutShebang(readTextFileSync(fileName));
    argmap.dir = (0, import_node_path.dirname)(fileName);
    if (argmap.format === void 0)
      argmap.format = (0, import_node_path.extname)(fileName).slice(1);
  } else {
    source = await readStdinText();
    argmap.dir = ".";
  }
  if (argmap.format === "json") {
    const result = prettyFromJsonStr(source);
    write(result, argmap);
    return;
  }
  const { options: opts, source: src } = extractOptions(source);
  const options = Object.assign({}, defaultOptions, opts, argmap);
  {
    const jevko = jevkoFromString1(src);
    const preppedJevko = importDirective(jevko, options);
    const { format: format2 } = options;
    let result;
    if (format2 === "jevkoml") {
      const document = await jevkoml(preppedJevko, options);
      result = document;
    } else if (format2 === "jevkocfg") {
      result = jevkocfg(preppedJevko, options);
    } else if (format2 === "jevkodata") {
      result = jevkodata(preppedJevko, options);
    } else
      throw Error(`Unrecognized format: ${format2}`);
    write(result, options);
  }
};
var write = (result, options) => {
  let { output, dir } = options;
  if (output === void 0 && options["infer output"] === true) {
    const { input, format } = options;
    if (input !== void 0) {
      const name = (0, import_node_path.basename)(input, (0, import_node_path.extname)(input));
      if (format === "jevkoml") {
        output = name + ".xml";
      } else if (format === "jevkodata") {
        output = name + ".json";
      } else if (format === "json") {
        output = name + ".jevkodata";
      }
    }
  }
  const commit = async (output2) => {
    if (existsSync(output2)) {
      const { overwrite } = options;
      if (typeof overwrite === "function") {
        if (await overwrite(output2) === false) {
          return;
        }
      } else if (typeof overwrite === "boolean") {
        if (overwrite === false)
          return;
      } else {
        throw Error(`File ${output2} exists!`);
      }
    }
    mkdirRecursiveSync((0, import_node_path.dirname)(output2), { recursive: true });
    writeTextFileSync(output2, result);
  };
  if (output === void 0)
    console.log(result);
  else {
    if ((0, import_node_path.isAbsolute)(output)) {
      commit(output);
    } else {
      const outpath = (0, import_node_path.join)(dir, output);
      commit(outpath);
    }
  }
};
var withoutShebang = (source) => {
  if (source.startsWith("#!")) {
    const index = source.indexOf("\n");
    if (index === -1)
      return "";
    return source.slice(index);
  }
  return source;
};
var extractOptions = (source) => {
  let depth = 0, a = 0;
  for (let i = 0; i < source.length; ++i) {
    const c = source[i];
    if (c === "[") {
      if (depth === 0) {
        if (source.slice(0, i).trim() !== "")
          return {
            options: /* @__PURE__ */ Object.create(null),
            source
          };
        a = i + 1;
      }
      ++depth;
    } else if (c === "]") {
      if (depth === 0)
        throw Error(`Unbalanced ] while parsing options!`);
      --depth;
      if (depth === 0) {
        const optionsText = source.slice(a, i);
        const optionsJevko = jevkoFromString1(optionsText);
        const xyz = prep1(optionsJevko);
        const options = map(xyz.subjevkos);
        return {
          options,
          source: source.slice(i + 1)
        };
      }
    }
  }
  if (depth > 0)
    throw Error(`Error while parsing options: unexpected end before ${depth} brackets closed!`);
  throw Error(`Error while parsing options!`);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
