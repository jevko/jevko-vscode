import { dirname, join, isAbsolute, readTextFileSync } from "../nonportable/deps.js";
import {parseJevkoWithHeredocs} from '../deps.b.js'

//?todo: extract to a separate lib
//?todo: handle via streaming (requires rearchitecting and rewriting the entire jevko cli)
// handles import and paste directives
export const importDirective = (jevko, options) => {
  const {dir} = options
  const {subjevkos, ...rest} = jevko

  const subs = []
  for (const sub of subjevkos) {
    const {prefix, jevko} = sub

    const trimmed = prefix.trim()

    // todo: pehaps configurable directive prefix /
    if (trimmed.startsWith('/')) {
      const directive = trimmed.slice(1).trim()
      // import would require blank suffix & the suffix would be lost on import
      if (directive === 'import') {
        const fileName = string(jevko)

        let path
        if (isAbsolute(fileName)) path = fileName
        else path = join(dir, fileName)

        const src = readTextFileSync(path)
        const parsed = parseJevkoWithHeredocs(src)
        if (parsed.suffix.trim() !== '') throw Error('oops: suffix of the imported file must be blank, was ' + parsed.suffix)

        //?todo: perhaps options should be extracted from the file first
        // maybe they should override this file's options -- or the other way around
        const prepped = importDirective(parsed, {
          ...options,
          // note: paths in imported file relative to IT rather than this file
          dir: dirname(path),
        })

        const {subjevkos} = prepped
        subs.push(...subjevkos)
        continue
      } else if (directive === 'paste') {
        // todo: perhaps change the behavior of that or add more paste flavors/options on the basis of the following old comment:

        // paste: how to be consistent accross formats?
        // maybe paste as `/jevko:paste/.../jevko:paste/

        const fileName = string(jevko)

        let path
        if (isAbsolute(fileName)) path = fileName
        else path = join(dir, fileName)

        // console.log(isAbsolute(fileName), fileName, dir, path)

        const src = readTextFileSync(path)
        subs.push(makeTextNode(src))
        continue
      }
      // note: unknown directives are treated as normal subjevkos
    }

    subs.push({prefix, jevko: importDirective(jevko, options)})
  }

  return {subjevkos: subs, ...rest}
}

const string = jevko => {
  const {subjevkos, suffix} = jevko

  if (subjevkos.length > 0) throw Error("oops")

  return suffix
}

const makeTextNode = text => {
  return {
    prefix: "", 
    jevko: suffixToJevko(text),
  }
}
const suffixToJevko = suffix => {
  return {
    subjevkos: [],
    suffix,
  }
}