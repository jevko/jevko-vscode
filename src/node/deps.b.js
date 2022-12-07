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
const convert = (jevko)=>nodes(prep1(jevko));
const prep1 = (jevko)=>{
    const { subjevkos , ...rest } = jevko;
    const subs = [];
    for (const { prefix , jevko: jevko1  } of subjevkos){
        const lines = prefix.split('\n');
        const trimmed = lines.at(-1).trim();
        if (trimmed.startsWith('-')) continue;
        subs.push({
            prefix: trimmed,
            jevko: prep1(jevko1)
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
            currentSection[prefix] = inner(jevko1);
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
const inner = (jevko)=>{
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
        if (prefix in ret) throw Error('dupe');
        ret[prefix] = inner(jevko);
    }
    return ret;
};
const jevkocfg = (jevko)=>{
    return JSON.stringify(convert(jevko));
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
export { jevkodata as jevkodata, map as map, prep as prep, prettyFromJsonStr as prettyFromJsonStr };
export { jevkocfg as jevkocfg };
export { parseJevkoWithHeredocs1 as parseJevkoWithHeredocs };
