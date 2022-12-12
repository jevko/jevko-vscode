export {dirname, join, extname, basename, isAbsolute} from 'node:path'
export {readTextFileSync, readStdinText, writeTextFileSync, mkdirRecursiveSync, existsSync} from './io.js'

import {get} from 'node:https'

export const fetchText = async url => {
  return new Promise((resolve, reject) => {
    get(url, res => {
      let body = ""

      res.on("data", (chunk) => {
        body += chunk
      })

      res.on("end", () => {
        resolve(body)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}