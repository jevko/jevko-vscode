const packagePath = './package.json'

const packageJson = JSON.parse(Deno.readTextFileSync(packagePath))

const localDependencies = JSON.parse(Deno.readTextFileSync('./localDeps.json'))

packageJson.dependencies = localDependencies

Deno.writeTextFileSync(packagePath, JSON.stringify(packageJson, null, 2))