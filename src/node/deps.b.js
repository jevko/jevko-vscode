// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const parseJevkoWithHeredocs = (str, { opener ='[' , closer =']' , escaper ='`' , blocker ='/'  } = {})=>{
    if (new Set([
        opener,
        closer,
        escaper,
        blocker
    ]).size !== 4) throw Error('oops');
    const parents = [];
    let parent = {
        subjevkos: []
    }, prefix = '', h = 0, mode = 'normal';
    let line = 1, column = 1;
    let tag = '', t = 0;
    for(let i = 0; i < str.length; ++i){
        const c = str[i];
        if (mode === 'escaped') {
            if (c === escaper || c === opener || c === closer) mode = 'normal';
            else if (c === blocker) {
                mode = 'tag';
                t = i + 1;
            } else throw SyntaxError(`Invalid digraph (${escaper}${c}) at ${line}:${column}!`);
        } else if (mode === 'tag') {
            if (c === blocker) {
                tag = str.slice(t, i);
                h = i + 1;
                t = h;
                mode = 'block';
            }
        } else if (mode === 'block') {
            if (c === blocker) {
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
                    prefix = '';
                    h = i + 1;
                    tag = '';
                    mode = 'normal';
                } else {
                    h = i + 1;
                }
            }
        } else if (c === escaper) {
            prefix += str.slice(h, i);
            h = i + 1;
            mode = 'escaped';
        } else if (c === opener) {
            const jevko1 = {
                subjevkos: []
            };
            parent.subjevkos.push({
                prefix: prefix + str.slice(h, i),
                jevko: jevko1
            });
            prefix = '';
            h = i + 1;
            parents.push(parent);
            parent = jevko1;
        } else if (c === closer) {
            parent.suffix = prefix + str.slice(h, i);
            prefix = '';
            h = i + 1;
            if (parents.length < 1) throw SyntaxError(`Unexpected closer (${closer}) at ${line}:${column}!`);
            parent = parents.pop();
        }
        if (c === '\n') {
            ++line;
            column = 1;
        } else {
            ++column;
        }
    }
    if (mode === 'escaped') throw SyntaxError(`Unexpected end after escaper (${escaper})!`);
    if (mode === 'tag') throw SyntaxError(`Unexpected end after blocker (${blocker})!`);
    if (mode === 'block') throw SyntaxError(`Unexpected end after blocker (${blocker})!`);
    if (parents.length > 0) throw SyntaxError(`Unexpected end: missing ${parents.length} closer(s) (${closer})!`);
    parent.suffix = prefix + str.slice(h);
    parent.opener = opener;
    parent.closer = closer;
    parent.escaper = escaper;
    parent.blocker = blocker;
    return parent;
};
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
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
const MIN_READ = 32 * 1024;
const MAX_SIZE = 2 ** 32 - 2;
class Buffer {
    #buf;
    #off = 0;
    constructor(ab){
        this.#buf = ab === undefined ? new Uint8Array(0) : new Uint8Array(ab);
    }
    bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this.#buf.subarray(this.#off);
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
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = await r.read(buf);
            if (nread === null) {
                return n;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
    readFromSync(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = r.readSync(buf);
            if (nread === null) {
                return n;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
}
async function readAll(r) {
    const buf = new Buffer();
    await buf.readFrom(r);
    return buf.bytes();
}
const breakPrefix = (prefix)=>{
    let i = prefix.length - 1;
    for(; i >= 0; --i){
        const c = prefix[i];
        if (c === '\r' || c === '\n' || c === '\\') {
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
        '',
        prefix.trim()
    ];
};
const prep = (jevko, dir = '.')=>{
    const { subjevkos , ...rest } = jevko;
    const subs = [];
    for (const { prefix , jevko: jevko1  } of subjevkos){
        const [text, tag] = breakPrefix(prefix);
        if (text !== '') subs.push({
            prefix: '',
            jevko: {
                subjevkos: [],
                suffix: text
            }
        });
        if (tag.startsWith('-')) continue;
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
const string = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    if (subjevkos.length > 0) throw Error("oops");
    return suffix;
};
const htmlEscape = (str)=>{
    let ret = '';
    let h = 0;
    for(let i = 0; i < str.length; ++i){
        const c = str[i];
        if (c === '<') {
            ret += str.slice(h, i) + '&lt;';
            h = i + 1;
        } else if (c === '&') {
            ret += str.slice(h, i) + '&amp;';
            h = i + 1;
        } else if (c === '"') {
            ret += str.slice(h, i) + '&quot;';
            h = i + 1;
        }
    }
    return ret + str.slice(h);
};
const toHtml = async (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    if (subjevkos.length === 0) {
        const { tag  } = jevko;
        if (tag === 'xml' || tag === 'html') {
            return suffix;
        } else if (tag !== undefined) {
            const highlighter = highlighters.get(tag) ?? makeHighlighter(tag);
            return highlighter(suffix);
        }
        return htmlEscape(suffix);
    }
    let ret = '';
    for (const { prefix , jevko: jevko1  } of subjevkos){
        const maker = ctx.get(prefix) ?? makeTag(prefix);
        ret += await maker(jevko1);
    }
    return ret + htmlEscape(suffix.trimEnd());
};
const makeHighlighter = (tag)=>async (text)=>{
        const pandoc = Deno.run({
            cmd: [
                'pandoc',
                '-f',
                'markdown'
            ],
            stdin: "piped",
            stdout: 'piped'
        });
        await pandoc.stdin.write(new TextEncoder().encode('```' + tag + '\n' + text + '\n```\n'));
        await pandoc.stdin.close();
        const out = await readAll(pandoc.stdout);
        await pandoc.stdout.close();
        const outt = new TextDecoder().decode(out);
        await pandoc.status();
        return outt;
    };
const cdata = (text)=>htmlEscape(text);
const highlighters = new Map([
    [
        '',
        cdata
    ]
]);
const makeTop = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    const attrs = [];
    const children1 = [];
    const classes = [];
    for (const s of subjevkos){
        const { prefix , jevko: jevko1  } = s;
        if (prefix === '.') classes.push(jevko1.suffix);
        else if (prefix.endsWith('=')) attrs.push(`${prefix}"${htmlEscape(jevko1.suffix)}"`);
        else children1.push(s);
    }
    if (classes.length > 0) attrs.push(`class="${classes.join(' ')}"`);
    return {
        attrs,
        jevko: {
            subjevkos: children1,
            suffix
        }
    };
};
const makeTag = (tag)=>async (jevko)=>{
        const { subjevkos , suffix , ...rest } = jevko;
        const tagWithAttrs = [
            tag
        ];
        const children1 = [];
        const classes = [];
        for (const s of subjevkos){
            const { prefix , jevko: jevko1  } = s;
            if (prefix === '.') classes.push(jevko1.suffix);
            else if (prefix.endsWith('=')) tagWithAttrs.push(`${prefix}"${htmlEscape(jevko1.suffix)}"`);
            else children1.push(s);
        }
        if (classes.length > 0) tagWithAttrs.push(`class="${classes.join(' ')}"`);
        return `<${tagWithAttrs.join(' ')}>${await toHtml({
            subjevkos: children1,
            suffix,
            ...rest
        })}</${tag}>`;
    };
const makeSelfClosingTag = (tag)=>(jevko)=>{
        const { subjevkos , suffix  } = jevko;
        console.assert(suffix.trim() === "");
        const tagWithAttrs = [
            tag
        ];
        const classes = [];
        for (const s of subjevkos){
            const { prefix , jevko: jevko1  } = s;
            if (prefix === '.') classes.push(jevko1.suffix);
            else if (prefix.endsWith('=')) tagWithAttrs.push(`${prefix}"${htmlEscape(jevko1.suffix)}"`);
            else children.push(s);
        }
        if (classes.length > 0) tagWithAttrs.push(`class="${classes.join(' ')}"`);
        return `<${tagWithAttrs.join(' ')} />`;
    };
const span = makeTag('span');
const makeSpanWithClass = (...clzs)=>async (jevko)=>{
        const subs = [
            ...clzs.map((clz)=>({
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
const suffixToJevko = (suffix)=>{
    return {
        subjevkos: [],
        suffix
    };
};
const makeTextNode = (text)=>{
    return {
        prefix: "",
        jevko: suffixToJevko(text)
    };
};
const makeTagWithAnchor = (tag)=>{
    const t = makeTag(tag);
    return (jevko)=>{
        const id = jevko.suffix.toLowerCase().replaceAll(' ', '-');
        const tree = parseHtmlJevko(`a [id=[${id}] href=[#${id}][#]]`);
        const headerContents = {
            subjevkos: [
                ...jevko.subjevkos,
                ...tree.subjevkos,
                makeTextNode(' ' + jevko.suffix)
            ],
            suffix: ""
        };
        return t(headerContents);
    };
};
const ctx = new Map([
    [
        '',
        toHtml
    ],
    [
        '#',
        makeTagWithAnchor('h1')
    ],
    [
        '##',
        makeTagWithAnchor('h2')
    ],
    [
        'br',
        makeSelfClosingTag('br')
    ],
    [
        'sub',
        makeSpanWithClass('sub')
    ],
    [
        'suf',
        makeSpanWithClass('suf')
    ],
    [
        'suffix',
        makeSpanWithClass('suf', 'inline')
    ],
    [
        'prefix',
        makeSpanWithClass('prefix')
    ],
    [
        'jevko',
        makeSpanWithClass('jevko')
    ],
    [
        'gray',
        makeSpanWithClass('gray')
    ],
    [
        'cdata',
        async (jevko)=>{
            const ret = await toHtml(jevko);
            return `<![CDATA[${ret}]]>`;
        }
    ],
    [
        'doctype',
        async (jevko)=>{
            const ret = await string(jevko);
            return `<!DOCTYPE ${ret}>`;
        }
    ]
]);
const parseHtmlJevko = (source, dir = '.')=>{
    return prep(parseJevkoWithHeredocs(source), dir);
};
const jevkoml = async (preppedjevko, options)=>{
    const { dir , root , prepend  } = options;
    const document = prep(preppedjevko, dir);
    const { attrs , jevko  } = makeTop(document);
    if (root === undefined) {
        if (attrs.length > 0) throw Error('unexpected top-level attributes; remove or add /root');
    }
    let content = await toHtml(jevko);
    if (root !== undefined) {
        let main, rest;
        if (Array.isArray(root)) {
            console.assert(root.every((v)=>typeof v === 'string'));
            [main, ...rest] = root;
        } else {
            console.assert(typeof root === 'string');
            main = root;
            rest = [];
        }
        let openers = '';
        let closers = '';
        for (const s of rest){
            openers += `<${s}>`;
            closers = `</${s}>` + closers;
        }
        content = `<${[
            main,
            ...attrs
        ].join(' ')}>${openers}${content}${closers}</${main}>`;
    }
    if (prepend !== undefined) {
        const keywords = prepend;
        if (keywords.includes('viewport')) {
            content = `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />` + content;
        }
        if (keywords.includes('doctype')) {
            content = `<!doctype html>\n` + content;
        }
        if (keywords.includes('xml1')) {
            content = `<?xml version="1.0" encoding="UTF-8"?>\n` + content;
        }
    }
    return content;
};
const CodePoint = {
    _0_: '0'.codePointAt(0),
    _1_: '1'.codePointAt(0),
    _9_: '9'.codePointAt(0),
    _a_: 'a'.codePointAt(0),
    _f_: 'f'.codePointAt(0),
    _A_: 'A'.codePointAt(0),
    _F_: 'F'.codePointAt(0),
    _openCurly_: '{'.codePointAt(0),
    _openSquare_: '['.codePointAt(0),
    _closeCurly_: '}'.codePointAt(0),
    _closeSquare_: ']'.codePointAt(0),
    _quoteMark_: '"'.codePointAt(0),
    _plus_: '+'.codePointAt(0),
    _minus_: '-'.codePointAt(0),
    _space_: ' '.codePointAt(0),
    _newline_: '\n'.codePointAt(0),
    _tab_: '\t'.codePointAt(0),
    _return_: '\r'.codePointAt(0),
    _backslash_: '\\'.codePointAt(0),
    _slash_: '/'.codePointAt(0),
    _comma_: ','.codePointAt(0),
    _colon_: ':'.codePointAt(0),
    _t_: 't'.codePointAt(0),
    _n_: 'n'.codePointAt(0),
    _b_: 'b'.codePointAt(0),
    _r_: 'r'.codePointAt(0),
    _u_: 'u'.codePointAt(0),
    _dot_: '.'.codePointAt(0),
    _e_: 'e'.codePointAt(0),
    _E_: 'E'.codePointAt(0),
    _l_: 'l'.codePointAt(0),
    _s_: 's'.codePointAt(0)
};
const { _0_ , _1_ , _9_ , _A_ , _E_ , _F_ , _a_ , _b_ , _backslash_ , _closeCurly_ , _closeSquare_ , _colon_ , _comma_ , _dot_ , _e_ , _f_ , _l_ , _minus_ , _n_ , _newline_ , _openCurly_ , _openSquare_ , _plus_ , _quoteMark_ , _r_ , _return_ , _s_ , _slash_ , _space_ , _t_ , _tab_ , _u_  } = CodePoint;
const JsonFeedbackType = {
    error: 'JsonFeedbackType.error'
};
const JsonErrorType = {
    unexpected: 'JsonErrorType.unexpected',
    unexpectedEnd: 'JsonErrorType.unexpectedEnd'
};
const error = (message)=>{
    return {
        type: JsonFeedbackType.error,
        message
    };
};
const unexpected = (code, context, expected)=>{
    return {
        type: JsonFeedbackType.error,
        errorType: JsonErrorType.unexpected,
        codePoint: code,
        context,
        expected
    };
};
const unexpectedEnd = (context, expected)=>{
    return {
        type: JsonFeedbackType.error,
        errorType: JsonErrorType.unexpectedEnd,
        context,
        expected
    };
};
const isZeroNine = (code)=>code >= _0_ && code <= _9_;
const isOneNine = (code)=>code >= _1_ && code <= _9_;
const isWhitespace = (code)=>code === _space_ || code === _newline_ || code === _tab_ || code === _return_;
const JsonLow = (next, initialState = {})=>{
    let mode = initialState.mode ?? 'Mode._value';
    let parents = initialState.parents ?? [
        'Parent.top'
    ];
    let hexIndex = initialState.hexIndex ?? 0;
    let maxDepth = initialState.maxDepth ?? 65536;
    const fraction = (code)=>{
        if (code === _dot_) {
            mode = 'Mode.dot_';
            return next.codePoint?.(code);
        }
        return exponent(code);
    };
    const exponent = (code)=>{
        if (code === _e_ || code === _E_) {
            mode = 'Mode.exponent_';
            return next.codePoint?.(code);
        }
        return number(code);
    };
    const number = (code)=>{
        mode = parents[parents.length - 1] === 'Parent.top' ? 'Mode._value' : 'Mode.value_';
        next.closeNumber?.();
        return self.codePoint(code);
    };
    const maxDepthExceeded = ()=>error(`Invalid parser state! Max depth of ${maxDepth} exceeded!`);
    const closeParent = (code)=>{
        const parent = parents.pop();
        if (code === _closeCurly_) {
            if (parent === 'Parent.object') {
                mode = parents[parents.length - 1] === 'Parent.top' ? 'Mode._value' : 'Mode.value_';
                return next.closeObject?.(code);
            }
        }
        if (code === _closeSquare_) {
            if (parent === 'Parent.array') {
                mode = parents[parents.length - 1] === 'Parent.top' ? 'Mode._value' : 'Mode.value_';
                return next.closeArray?.(code);
            }
        }
        return unexpected(code, `in ${parentToString(parent)}`);
    };
    const self = {
        codePoint: (code)=>{
            switch(mode){
                case 'Mode._value':
                    switch(code){
                        case _openCurly_:
                            {
                                if (parents.length >= maxDepth) return maxDepthExceeded();
                                parents.push('Parent.object');
                                parents.push('Parent.key');
                                mode = 'Mode._key';
                                return next.openObject?.(code);
                            }
                        case _openSquare_:
                            {
                                if (parents.length >= maxDepth) return maxDepthExceeded();
                                parents.push('Parent.array');
                                mode = 'Mode._value';
                                return next.openArray?.(code);
                            }
                        case _quoteMark_:
                            mode = 'Mode.string_';
                            return next.openString?.(code);
                        case _t_:
                            mode = 'Mode.t_rue';
                            return next.openTrue?.(code);
                        case _f_:
                            mode = 'Mode.f_alse';
                            return next.openFalse?.(code);
                        case _n_:
                            mode = 'Mode.n_ull';
                            return next.openNull?.(code);
                        case _minus_:
                            mode = 'Mode.minus_';
                            return next.openNumber?.(code);
                        case _0_:
                            mode = 'Mode.zero_';
                            return next.openNumber?.(code);
                        default:
                            if (isOneNine(code)) {
                                mode = 'Mode.onenine_';
                                return next.openNumber?.(code);
                            }
                            if (isWhitespace(code)) return next.whitespace?.(code);
                            return closeParent(code);
                    }
                case 'Mode.value_':
                    if (code === _comma_) {
                        const parent = parents[parents.length - 1];
                        if (parent === 'Parent.object') {
                            parents.push('Parent.key');
                            mode = 'Mode._key';
                            return next.comma?.(code);
                        }
                        if (parent === 'Parent.array') {
                            mode = 'Mode._value';
                            return next.comma?.(code);
                        }
                        return error(`Invalid parser state! Unexpected parent ${parent}.`);
                    }
                    if (isWhitespace(code)) return next.whitespace?.(code);
                    return closeParent(code);
                case 'Mode._key':
                    if (code === _quoteMark_) {
                        mode = 'Mode.string_';
                        return next.openKey?.(code);
                    }
                    if (code === _closeCurly_) {
                        parents.pop();
                        parents.pop();
                        mode = parents[parents.length - 1] === 'Parent.top' ? 'Mode._value' : 'Mode.value_';
                        return next.closeObject?.(code);
                    }
                    if (isWhitespace(code)) return next.whitespace?.(code);
                    return unexpected(code, 'in an object', [
                        '"',
                        '}',
                        'whitespace'
                    ]);
                case 'Mode.key_':
                    if (code === _colon_) {
                        parents.pop();
                        mode = 'Mode._value';
                        return next.colon?.(code);
                    }
                    if (isWhitespace(code)) return next.whitespace?.(code);
                    return unexpected(code, 'after key', [
                        ':',
                        'whitespace'
                    ]);
                case 'Mode.string_':
                    if (code === _quoteMark_) {
                        const parent1 = parents[parents.length - 1];
                        if (parent1 === 'Parent.key') {
                            mode = 'Mode.key_';
                            return next.closeKey?.(code);
                        }
                        mode = parents[parents.length - 1] === 'Parent.top' ? 'Mode._value' : 'Mode.value_';
                        return next.closeString?.(code);
                    }
                    if (code === _backslash_) {
                        mode = 'Mode.escape_';
                        return next.escape?.(code);
                    }
                    if (code >= 0x0020 && code <= 0x10ffff) return next.codePoint?.(code);
                    return unexpected(code, 'in a string', [
                        '"',
                        '\\',
                        'a code point 0x0020 thru 0x10ffff'
                    ]);
                case 'Mode.escape_':
                    if (code === _quoteMark_ || code === _n_ || code === _backslash_ || code === _t_ || code === _slash_ || code === _b_ || code === _f_ || code === _r_) {
                        mode = 'Mode.string_';
                        return next.codePoint?.(code);
                    }
                    if (code === _u_) {
                        mode = 'Mode.hex_';
                        return next.openHex?.(code);
                    }
                    return unexpected(code, 'after escape', [
                        '"',
                        'n',
                        '\\',
                        't',
                        '/',
                        'b',
                        'f',
                        'r',
                        'u'
                    ]);
                case 'Mode.hex_':
                    if (code >= _0_ && code <= _9_ || code >= _a_ && code <= _f_ || code >= _A_ && code <= _F_) {
                        if (hexIndex < 3) {
                            hexIndex += 1;
                            return next.codePoint?.(code);
                        }
                        hexIndex = 0;
                        mode = 'Mode.string_';
                        return next.closeHex?.(code);
                    }
                    return unexpected(code, `at index ${hexIndex} of a hexadecimal escape sequence`, [
                        [
                            'a',
                            'f'
                        ],
                        [
                            'A',
                            'F'
                        ],
                        [
                            '0',
                            '9'
                        ]
                    ]);
                case 'Mode.minus_':
                    if (code === _0_) {
                        mode = 'Mode.zero_';
                        return next.codePoint?.(code);
                    }
                    if (isOneNine(code)) {
                        mode = 'Mode.onenine_';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `after '-'`, [
                        [
                            '0',
                            '9'
                        ]
                    ]);
                case 'Mode.zero_':
                    return fraction(code);
                case 'Mode.onenine_':
                    if (isZeroNine(code)) {
                        mode = 'Mode.onenineDigit_';
                        return next.codePoint?.(code);
                    }
                    return fraction(code);
                case 'Mode.dot_':
                    if (isZeroNine(code)) {
                        mode = 'Mode.digitDotDigit_';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `after '.'`, [
                        [
                            '0',
                            '9'
                        ]
                    ]);
                case 'Mode.exponent_':
                    if (code === _plus_ || code === _minus_) {
                        mode = 'Mode.exponentSign_';
                        return next.codePoint?.(code);
                    }
                    if (isZeroNine(code)) {
                        mode = 'Mode.exponentSignDigit_';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `after exponent`, [
                        '+',
                        '-',
                        [
                            '0',
                            '9'
                        ]
                    ]);
                case 'Mode.exponentSign_':
                    if (isZeroNine(code)) {
                        mode = 'Mode.exponentSignDigit_';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `after exponent sign`, [
                        [
                            '0',
                            '9'
                        ]
                    ]);
                case 'Mode.onenineDigit_':
                    if (isZeroNine(code)) return next.codePoint?.(code);
                    return fraction(code);
                case 'Mode.digitDotDigit_':
                    if (isZeroNine(code)) return next.codePoint?.(code);
                    return exponent(code);
                case 'Mode.exponentSignDigit_':
                    if (isZeroNine(code)) return next.codePoint?.(code);
                    return number(code);
                case 'Mode.t_rue':
                    if (code === _r_) {
                        mode = 'Mode.tr_ue';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `at the second position in true`, [
                        'r'
                    ]);
                case 'Mode.tr_ue':
                    if (code === _u_) {
                        mode = 'Mode.tru_e';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `at the third position in true`, [
                        'u'
                    ]);
                case 'Mode.tru_e':
                    if (code === _e_) {
                        mode = parents[parents.length - 1] === 'Parent.top' ? 'Mode._value' : 'Mode.value_';
                        return next.closeTrue?.(code);
                    }
                    return unexpected(code, `at the fourth position in true`, [
                        'e'
                    ]);
                case 'Mode.f_alse':
                    if (code === _a_) {
                        mode = 'Mode.fa_lse';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `at the second position in false`, [
                        'a'
                    ]);
                case 'Mode.fa_lse':
                    if (code === _l_) {
                        mode = 'Mode.fal_se';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `at the third position in false`, [
                        'l'
                    ]);
                case 'Mode.fal_se':
                    if (code === _s_) {
                        mode = 'Mode.fals_e';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `at the fourth position in false`, [
                        's'
                    ]);
                case 'Mode.fals_e':
                    if (code === _e_) {
                        mode = parents[parents.length - 1] === 'Parent.top' ? 'Mode._value' : 'Mode.value_';
                        return next.closeFalse?.(code);
                    }
                    return unexpected(code, `at the fifth position in false`, [
                        'e'
                    ]);
                case 'Mode.n_ull':
                    if (code === _u_) {
                        mode = 'Mode.nu_ll';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `at the second position in null`, [
                        'u'
                    ]);
                case 'Mode.nu_ll':
                    if (code === _l_) {
                        mode = 'Mode.nul_l';
                        return next.codePoint?.(code);
                    }
                    return unexpected(code, `at the third position in null`, [
                        'l'
                    ]);
                case 'Mode.nul_l':
                    if (code === _l_) {
                        mode = parents[parents.length - 1] === 'Parent.top' ? 'Mode._value' : 'Mode.value_';
                        return next.closeNull?.(code);
                    }
                    return unexpected(code, `at the fourth position in null`, [
                        'l'
                    ]);
                default:
                    return error(`Invalid parser mode: ${mode}`);
            }
        },
        end: ()=>{
            const parent = parents[parents.length - 1];
            switch(parent){
                case 'Parent.key':
                    return unexpectedEnd(`a key/object left unclosed!`);
                case 'Parent.top':
                    break;
                default:
                    return unexpectedEnd(`${parentToString(parent)} left unclosed!`);
            }
            switch(mode){
                case 'Mode._value':
                    return next.end?.();
                case 'Mode.key_':
                    return error('a key/object left unclosed!');
                case 'Mode._key':
                    return unexpectedEnd('an object left unclosed!');
                case 'Mode.exponentSignDigit_':
                case 'Mode.onenine_':
                case 'Mode.onenineDigit_':
                case 'Mode.digitDotDigit_':
                case 'Mode.zero_':
                    mode = parents[parents.length - 1] === 'Parent.top' ? 'Mode._value' : 'Mode.value_';
                    next.closeNumber?.();
                    return next.end?.();
                case 'Mode.minus_':
                case 'Mode.dot_':
                case 'Mode.exponent_':
                case 'Mode.exponentSign_':
                    return unexpectedEnd(`incomplete number!`);
                case 'Mode.hex_':
                    return unexpectedEnd('after hexadecimal escape in string!');
                case 'Mode.escape_':
                    return unexpectedEnd('after escape in string!');
                case 'Mode.string_':
                    return unexpectedEnd('a string left unclosed!');
                case 'Mode.t_rue':
                    return unexpectedEnd(`before the second position in true!`, [
                        'r'
                    ]);
                case 'Mode.tr_ue':
                    return unexpectedEnd(`before the third position in true!`, [
                        'u'
                    ]);
                case 'Mode.tru_e':
                    return unexpectedEnd(`before the fourth position in true!`, [
                        'e'
                    ]);
                case 'Mode.f_alse':
                    return unexpectedEnd(`before the second position in false!`, [
                        'a'
                    ]);
                case 'Mode.fa_lse':
                    return unexpectedEnd(`before the third position in false!`, [
                        'l'
                    ]);
                case 'Mode.fal_se':
                    return unexpectedEnd(`before the fourth position in false!`, [
                        's'
                    ]);
                case 'Mode.fals_e':
                    return unexpectedEnd(`before the fifth position in false!`, [
                        'e'
                    ]);
                case 'Mode.n_ull':
                    return unexpectedEnd(`before the second position in null!`, [
                        'u'
                    ]);
                case 'Mode.nu_ll':
                    return unexpectedEnd(`before the third position in null!`, [
                        'l'
                    ]);
                case 'Mode.nul_l':
                    return unexpectedEnd(`before the fourth position in null!`, [
                        'l'
                    ]);
                default:
                    return unexpectedEnd();
            }
        },
        state: ()=>{
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
const parentToString = (parent)=>{
    switch(parent){
        case 'Parent.array':
            return 'an array';
        case 'Parent.object':
            return 'an object';
        case 'Parent.key':
            return 'a key';
        case 'Parent.top':
            return 'the top-level value';
    }
};
const { _t_: _t_1 , _n_: _n_1 , _b_: _b_1 , _r_: _r_1 , _f_: _f_1  } = CodePoint;
const JsonLowToHigh = (next)=>{
    let mode = 'top';
    let stringBuffer = '';
    let numberBuffer = '';
    let hexBuf = [];
    const feedbackQueue = [];
    const valFeedback = (val)=>{
        return feedbackQueue.length > 0 ? [
            feedbackQueue.pop(),
            val
        ] : [
            val
        ];
    };
    const openStringKey = ()=>{
        stringBuffer = '';
        mode = 'string';
        return feedbackQueue.length > 0 ? [
            feedbackQueue.pop()
        ] : [];
    };
    const self = {
        openString: openStringKey,
        openKey: openStringKey,
        openNumber: (codePoint)=>{
            numberBuffer = String.fromCharCode(codePoint);
            mode = 'number';
            return feedbackQueue.length > 0 ? [
                feedbackQueue.pop()
            ] : [];
        },
        openObject: ()=>{
            return valFeedback(next.openObject?.());
        },
        openArray: ()=>{
            return valFeedback(next.openArray?.());
        },
        closeObject: ()=>{
            return valFeedback(next.closeObject?.());
        },
        closeArray: ()=>{
            return valFeedback(next.closeArray?.());
        },
        closeTrue: ()=>{
            return valFeedback(next.value?.(true));
        },
        closeFalse: ()=>{
            return valFeedback(next.value?.(false));
        },
        closeNull: ()=>{
            return valFeedback(next.value?.(null));
        },
        codePoint: (codePoint)=>{
            if (mode === 'string') {
                stringBuffer += String.fromCodePoint(codePoint);
            } else if (mode === 'escape') {
                if (codePoint === _n_1) stringBuffer += '\n';
                else if (codePoint === _t_1) stringBuffer += '\t';
                else if (codePoint === _r_1) stringBuffer += '\r';
                else if (codePoint === _b_1) stringBuffer += '\b';
                else if (codePoint === _f_1) stringBuffer += '\f';
                else {
                    stringBuffer += String.fromCharCode(codePoint);
                }
                mode = 'string';
            } else if (mode === 'hex') {
                hexBuf.push(codePoint);
            } else if (mode === 'number') {
                numberBuffer += String.fromCharCode(codePoint);
            }
            return feedbackQueue.length > 0 ? [
                feedbackQueue.pop()
            ] : [];
        },
        escape: ()=>{
            mode = 'escape';
            return feedbackQueue.length > 0 ? [
                feedbackQueue.pop()
            ] : [];
        },
        openHex: ()=>{
            hexBuf = [];
            mode = 'hex';
            return feedbackQueue.length > 0 ? [
                feedbackQueue.pop()
            ] : [];
        },
        closeString: ()=>{
            mode = 'top';
            return valFeedback(next.value?.(stringBuffer));
        },
        closeKey: ()=>{
            mode = 'top';
            return valFeedback(next.key?.(stringBuffer));
        },
        closeHex: (codePoint)=>{
            hexBuf.push(codePoint);
            stringBuffer += String.fromCharCode(Number.parseInt(String.fromCharCode(...hexBuf), 16));
            mode = 'string';
            return feedbackQueue.length > 0 ? [
                feedbackQueue.pop()
            ] : [];
        },
        closeNumber: ()=>{
            mode = 'top';
            feedbackQueue.push(next.value?.(Number.parseFloat(numberBuffer)));
            return [];
        },
        end: ()=>{
            const feedback = [];
            if (feedbackQueue.length > 0) feedback.push(feedbackQueue.pop());
            feedback.push(next.end?.());
            return feedback;
        }
    };
    return self;
};
const _newline_1 = '\n'.charCodeAt(0);
const PosInfoAdapter = (stream)=>{
    let pos = 0, line = 0, col = 0;
    const self = {
        codePoint: (code)=>{
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
        end: ()=>{
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
        get: (target, prop, rec)=>{
            return self[prop] || target[prop];
        }
    });
};
const JsonHigh = (next)=>{
    const stream = PosInfoAdapter(JsonLow(JsonLowToHigh(next)));
    const self = {
        chunk (chunk) {
            for (const c of chunk){
                const feedback = [
                    stream.codePoint(c.codePointAt(0))
                ].flat();
                for (const f of feedback){
                    if (f.type === JsonFeedbackType.error) throw Error(JSON.stringify(f));
                }
            }
            return self;
        },
        end () {
            return stream.end();
        },
        state () {
            return stream.state();
        }
    };
    return self;
};
const escape = (str)=>{
    let ret = '';
    for (const c of str){
        if (c === '[' || c === ']' || c === '`') ret += '`';
        ret += c;
    }
    return ret;
};
const escapePrefix = (prefix)=>prefix === '' ? '' : escape(prefix) + ' ';
const recur = (jevko, indent, prevIndent)=>{
    const { subjevkos , suffix  } = jevko;
    let ret = '';
    if (subjevkos.length > 0) {
        ret += '\n';
        for (const { prefix , jevko: jevko1  } of subjevkos){
            ret += `${indent}${escapePrefix(prefix)}[${recur(jevko1, indent + '  ', indent)}]\n`;
        }
        ret += prevIndent;
    }
    return ret + escape(suffix);
};
const argsToJevko = (...args)=>{
    const subjevkos = [];
    let subjevko = {
        prefix: ''
    };
    for(let i = 0; i < args.length; ++i){
        const arg = args[i];
        if (Array.isArray(arg)) {
            subjevko.jevko = argsToJevko(...arg);
            subjevkos.push(subjevko);
            subjevko = {
                prefix: ''
            };
        } else if (typeof arg === 'string') {
            subjevko.prefix += arg;
        } else throw Error(`Argument #${i} has unrecognized type (${typeof arg})! Only strings and arrays are allowed. The argument's value is: ${arg}`);
    }
    return {
        subjevkos,
        suffix: subjevko.prefix
    };
};
const escapePrefix1 = (prefix)=>prefix === '' ? '' : prefix + ' ';
const recur1 = (jevko, indent, prevIndent)=>{
    const { subjevkos , suffix  } = jevko;
    let ret = [];
    if (subjevkos.length > 0) {
        ret.push('\n');
        for (const { prefix , jevko: jevko1  } of subjevkos){
            ret.push(indent, escapePrefix1(prefix), recur1(jevko1, indent + '  ', indent), '\n');
        }
        ret.push(prevIndent);
    }
    ret.push(suffix);
    return ret;
};
const jevkoToString = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    let ret = '';
    for (const { prefix , jevko: jevko1  } of subjevkos){
        ret += `${escape(prefix)}[${jevkoToString(jevko1)}]`;
    }
    return ret + escape(suffix);
};
const stringToHeredoc = (str)=>{
    let id = '';
    let tok = '//';
    let stret = `${str}${tok}`;
    while(stret.indexOf(tok) !== str.length){
        id += '=';
        tok = `/${id}/`;
        stret = `${str}${tok}`;
    }
    return `\`${tok}${stret}`;
};
const convertKey = (key)=>convertString(key);
const convertString = (str)=>{
    const escaped = escape(str);
    if (str.trim() !== str) return `'${escaped}'`;
    return escaped;
};
const convertValue = (value)=>{
    if (typeof value === 'string') {
        return stringToHeredoc(value);
    }
    return `[${value}]`;
};
const makeStream = (write)=>{
    let isEmpty = false;
    let depth = 0;
    const stream = JsonHigh({
        openArray: ()=>{
            isEmpty = true;
            if (depth > 0) write('[');
            ++depth;
        },
        openObject: ()=>{
            isEmpty = true;
            if (depth > 0) write('[');
            ++depth;
        },
        closeArray: ()=>{
            if (isEmpty) write('seq');
            --depth;
            if (depth > 0) write(']');
            isEmpty = false;
        },
        closeObject: ()=>{
            if (isEmpty) write('map');
            --depth;
            if (depth > 0) write(']');
            isEmpty = false;
        },
        key: (key)=>{
            write(convertKey(key));
        },
        value: (value)=>{
            isEmpty = false;
            write(convertValue(value));
        }
    });
    return stream;
};
const fromJsonStr = (str)=>{
    let ret = '';
    const stream = makeStream((str)=>ret += str);
    stream.chunk(str);
    stream.end();
    return ret;
};
const strToHeredoc = (str, tag)=>`\`/${tag}/${str}/${tag}/`;
const jevkoToPrettyString = (jevko)=>{
    const { subjevkos , suffix , tag  } = jevko;
    if (tag !== undefined) return strToHeredoc(suffix, tag);
    let ret = '';
    for (const { prefix , jevko: jevko1  } of subjevkos){
        ret += `${escapePrefix2(prefix)}${recur2(jevko1, '  ', '')}\n`;
    }
    return ret + escape(suffix);
};
const escapePrefix2 = (prefix)=>prefix === '' ? '' : escape(prefix) + ' ';
const recur2 = (jevko, indent, prevIndent)=>{
    const { subjevkos , suffix , tag  } = jevko;
    if (tag !== undefined) return strToHeredoc(suffix, tag);
    let ret = '';
    if (subjevkos.length > 0) {
        ret += '\n';
        for (const { prefix , jevko: jevko1  } of subjevkos){
            ret += `${indent}${escapePrefix2(prefix)}${recur2(jevko1, indent + '  ', indent)}\n`;
        }
        ret += prevIndent;
    }
    return '[' + ret + escape(suffix) + ']';
};
const prettyFromJsonStr = (str)=>jevkoToPrettyString(parseJevkoWithHeredocs(fromJsonStr(str)));
const jevkodata = (jevko, props)=>{
    if (Array.isArray(props.flags) && props.flags.includes('pretty')) {
        return JSON.stringify(convert(jevko), null, 2);
    }
    return JSON.stringify(convert(jevko));
};
const convert = (jevko)=>inner(prep1(jevko));
const prep1 = (jevko)=>{
    const { subjevkos , ...rest } = jevko;
    const subs = [];
    for (const { prefix , jevko: jevko1  } of subjevkos){
        const trimmed = prefix.trim();
        let key;
        if (trimmed.startsWith("'")) {
            key = trimmed;
        } else {
            const lines = prefix.split('\n');
            key = lines.at(-1).trim();
            if (key.startsWith('-')) continue;
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
const inner = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    if (subjevkos.length === 0) {
        const { tag  } = jevko;
        if (tag === 'json') return JSON.parse(suffix);
        else if (tag !== undefined) return suffix;
        const trimmed = suffix.trim();
        if (trimmed.startsWith("'")) {
            if (trimmed.at(-1) === "'") return trimmed.slice(1, -1);
            return trimmed.slice(1);
        }
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        if (trimmed === 'null' || trimmed === "nil") return null;
        if (trimmed === 'map') return Object.create(null);
        if (trimmed === 'list' || trimmed === "seq") return [];
        if (trimmed === 'NaN') return NaN;
        const num = Number(trimmed);
        if (Number.isNaN(num) === false) return num;
        return suffix;
    }
    if (suffix.trim() !== '') throw Error('oops');
    const sub0 = subjevkos[0];
    if (sub0.prefix === '') return list(subjevkos);
    return map(subjevkos);
};
const list = (subjevkos)=>{
    const ret = [];
    for (const { prefix , jevko  } of subjevkos){
        if (prefix !== '') throw Error('oops');
        ret.push(inner(jevko));
    }
    return ret;
};
const map = (subjevkos)=>{
    const ret = Object.create(null);
    for (const { prefix , jevko  } of subjevkos){
        if (prefix === '') throw Error('oops');
        let key;
        if (prefix.startsWith("'")) {
            if (prefix.at(-1) === "'") key = prefix.slice(1, -1);
            else key = prefix.slice(1);
        } else key = prefix;
        if (key in ret) throw Error('dupe');
        ret[key] = inner(jevko);
    }
    return ret;
};
const convert1 = (jevko)=>nodes(prep2(jevko));
const prep2 = (jevko)=>{
    const { subjevkos , ...rest } = jevko;
    const subs = [];
    for (const { prefix , jevko: jevko1  } of subjevkos){
        const lines = prefix.split('\n');
        const trimmed = lines.at(-1).trim();
        if (trimmed.startsWith('-')) continue;
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
const toKey = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    if (subjevkos.length === 0) {
        const trimmed = suffix.trim();
        if (trimmed === '') throw Error('empty key not allowed');
        return trimmed;
    }
    console.error(jevko);
    throw Error('not a valid key');
};
const nodes = (jevko)=>{
    const topMap = Object.create(null);
    let currentSection = topMap;
    let currentSectionKey = '';
    const { subjevkos , suffix  } = jevko;
    if (suffix.trim() !== '') throw Error('1');
    for (const { prefix , jevko: jevko1  } of subjevkos){
        if (prefix === '') {
            const { path , isRelative  } = toPath(jevko1);
            if (isRelative === false) currentSection = topMap;
            for (const p of path){
                currentSectionKey = p;
                if (currentSectionKey in currentSection === false) {
                    currentSection[currentSectionKey] = Object.create(null);
                }
                currentSection = currentSection[currentSectionKey];
            }
        } else {
            currentSection[prefix] = inner1(jevko1);
        }
    }
    return topMap;
};
const toPath = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    if (subjevkos.length === 0) return {
        path: [
            toKey(jevko)
        ],
        isRelative: false
    };
    if (suffix.trim() !== '') throw Error('oops');
    const { prefix , jevko: jevko0  } = subjevkos[0];
    const ret = [];
    let isRelative = false;
    if (prefix === './') {
        isRelative = true;
    } else if (prefix !== '') throw Error('oops');
    ret.push(toKey(jevko0));
    for (const { prefix: prefix1 , jevko: jevko1  } of subjevkos.slice(1)){
        if (prefix1 !== '') throw Error('oops');
        ret.push(toKey(jevko1));
    }
    return {
        path: ret,
        isRelative
    };
};
const inner1 = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    if (subjevkos.length === 0) {
        const { tag  } = jevko;
        if (tag === 'json') return JSON.parse(suffix);
        const trimmed = suffix.trim();
        if (trimmed.startsWith("'")) {
            if (trimmed.at(-1) === "'") return trimmed.slice(1, -1);
            return trimmed.slice(1);
        }
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        if (trimmed === 'null') return null;
        if (trimmed === 'map') return Object.create(null);
        if (trimmed === 'list') return [];
        if (trimmed === 'NaN') return NaN;
        const num = Number(trimmed);
        if (Number.isNaN(num) === false) return num;
        return suffix;
    }
    if (suffix.trim() !== '') throw Error('oops');
    const sub0 = subjevkos[0];
    if (sub0.prefix === '') return list1(subjevkos);
    return map1(subjevkos);
};
const list1 = (subjevkos)=>{
    const ret = [];
    for (const { prefix , jevko  } of subjevkos){
        if (prefix !== '') throw Error('oops');
        ret.push(inner1(jevko));
    }
    return ret;
};
const map1 = (subjevkos)=>{
    const ret = Object.create(null);
    for (const { prefix , jevko  } of subjevkos){
        if (prefix === '') throw Error('oops');
        if (prefix in ret) throw Error('dupe');
        ret[prefix] = inner1(jevko);
    }
    return ret;
};
const jevkocfg = (jevko)=>{
    return JSON.stringify(convert1(jevko));
};
const parseJevkoWithHeredocs1 = (str, { opener ='[' , closer =']' , escaper ='`' , blocker ='/'  } = {})=>{
    if (new Set([
        opener,
        closer,
        escaper,
        blocker
    ]).size !== 4) throw Error('oops');
    const parents = [];
    let parent = {
        subjevkos: []
    }, prefix = '', h = 0, mode = 'normal';
    let line = 1, column = 1;
    let tag = '', t = 0;
    for(let i = 0; i < str.length; ++i){
        const c = str[i];
        if (mode === 'escaped') {
            if (c === escaper || c === opener || c === closer) mode = 'normal';
            else if (c === blocker) {
                mode = 'tag';
                t = i + 1;
            } else throw SyntaxError(`Invalid digraph (${escaper}${c}) at ${line}:${column}!`);
        } else if (mode === 'tag') {
            if (c === blocker) {
                tag = str.slice(t, i);
                h = i + 1;
                t = h;
                mode = 'block';
            }
        } else if (mode === 'block') {
            if (c === blocker) {
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
                    prefix = '';
                    h = i + 1;
                    tag = '';
                    mode = 'normal';
                } else {
                    h = i + 1;
                }
            }
        } else if (c === escaper) {
            prefix += str.slice(h, i);
            h = i + 1;
            mode = 'escaped';
        } else if (c === opener) {
            const jevko1 = {
                subjevkos: []
            };
            parent.subjevkos.push({
                prefix: prefix + str.slice(h, i),
                jevko: jevko1
            });
            prefix = '';
            h = i + 1;
            parents.push(parent);
            parent = jevko1;
        } else if (c === closer) {
            parent.suffix = prefix + str.slice(h, i);
            prefix = '';
            h = i + 1;
            if (parents.length < 1) throw SyntaxError(`Unexpected closer (${closer}) at ${line}:${column}!`);
            parent = parents.pop();
        }
        if (c === '\n') {
            ++line;
            column = 1;
        } else {
            ++column;
        }
    }
    if (mode === 'escaped') throw SyntaxError(`Unexpected end after escaper (${escaper})!`);
    if (mode === 'tag') throw SyntaxError(`Unexpected end after blocker (${blocker})!`);
    if (mode === 'block') throw SyntaxError(`Unexpected end after blocker (${blocker})!`);
    if (parents.length > 0) throw SyntaxError(`Unexpected end: missing ${parents.length} closer(s) (${closer})!`);
    parent.suffix = prefix + str.slice(h);
    parent.opener = opener;
    parent.closer = closer;
    parent.escaper = escaper;
    parent.blocker = blocker;
    return parent;
};
export { jevkoml as jevkoml };
export { jevkodata as jevkodata, map as map, prep1 as prep, prettyFromJsonStr as prettyFromJsonStr };
export { jevkocfg as jevkocfg };
export { parseJevkoWithHeredocs1 as parseJevkoWithHeredocs };
