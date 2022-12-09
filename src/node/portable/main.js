import {jevkoml, jevkocfg, jevkodata, map, prep as prepdata, prettyFromJsonStr, parseJevkoWithHeredocs} from '../bundlable/deps.b.js'

import {importDirective} from './importDirective.js'

import {dirname, join, extname, isAbsolute, readTextFileSync, readStdinText, writeTextFileSync, mkdirRecursiveSync} from '../nonportable/deps.js'

export const main = async (argmap = {}) => {
  let {format, input} = argmap
  // todo: exactly 1?
  let source
  
  if (input !== undefined) {
    const fileName = argmap.input
    source = withoutShebang(readTextFileSync(fileName))
    argmap.dir = dirname(fileName)
    // format from args overrides extension
    // alternatively could error if extension doesn't match
    // note: now options precedence is:
    // cli options > file extension > in-file options
    //?todo: perhaps file extension should not override in-file options
    if (argmap.format === undefined) argmap.format = extname(fileName).slice(1)
  } else {
    source = await readStdinText()
    argmap.dir = '.'
  }
  
  if (argmap.format === 'json') {
    const result = prettyFromJsonStr(source)
    write(result, argmap)
    return
  }
  
  // todo: don't parse as jevko if format is json/xml, etc. (non-jevko)
  const jevko = parseJevkoWithHeredocs(source)
  
  const {jevko: preppedJevko1, props} = prep(jevko)

  const options = Object.assign(props, argmap)
  {
    // resolve imports
    // note: could be made optional
    const preppedJevko = importDirective(preppedJevko1, options)
    const {format} = options
    // if (format !== undefined) {
    //   const f = options.format
    //   if (f !== undefined && format !== f) throw Error(`declared format (${format}) inconsistent with command line format or file extension (${f})`)
    // }
    
    let result
    if (format === 'jevkoml') {
      const document = await jevkoml(preppedJevko, options)
      result = document
    } else if (format === 'jevkocfg') {
      // todo: support options in jevkocfg or lose jevkocfg
      result = jevkocfg(preppedJevko, options)
    } else if (format === 'jevkodata') {
      result = jevkodata(preppedJevko, options)
    } else throw Error(`Unrecognized format: ${format}`)
    
    write(result, options)
  }  
}

//?todo: create path if not exists
const write = (result, options) => {
  //?todo: rename /output to /to file
  const {output, dir} = options
  if (output === undefined) console.log(result)
  else {
    if (isAbsolute(output)) {
      mkdirRecursiveSync(dirname(output), {recursive: true})
      writeTextFileSync(output, result)
    } else {
      const outpath = join(dir, output)
      mkdirRecursiveSync(dirname(outpath), {recursive: true})
      writeTextFileSync(outpath, result)
    }
  }
}

const withoutShebang = source => {
  if (source.startsWith('#!')) {
    const index = source.indexOf('\n')
    if (index === -1) return ""
    return source.slice(index)
  }
  return source
}

const prep = jevko => {
  const {subjevkos, ...rest} = jevko

  let subs
  let props = Object.create(null)
  if (subjevkos.length > 0) {
    const sub0 = subjevkos[0]
    const pref = sub0.prefix

    if (pref.trim() === '') {
      // interpret top-level directives
      const tjevko = sub0.jevko
      const xyz = prepdata(tjevko)
      props = map(xyz.subjevkos)

      subs = subjevkos.slice(1)
    } else subs = subjevkos
  } else {
    subs = []
  }

  return {
    jevko: {subjevkos: subs, ...rest},
    props,
  }
}