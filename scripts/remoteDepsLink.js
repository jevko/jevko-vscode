const packagePath = './package.json'

const packageJson = JSON.parse(Deno.readTextFileSync(packagePath))

packageJson.dependencies = JSON.parse(Deno.readTextFileSync('./remoteDeps.json'))

Deno.writeTextFileSync(packagePath, JSON.stringify(packageJson, null, 2))