#!/usr/bin/env node

const yargs = require("yargs");
const fetch = require("node-fetch")
const services = ['checkout', 'checkout utility', 'payments', 'recurring', 'payouts', 'platforms account', 'platforms fund', 'platforms notification configuration', 'platforms notification', 'platforms hosted onboard page', 'binlookup', 'pos terminal management'];
const argv = yargs
    .usage('Usage: $0 <command> [options]')
    .command('generate', 'Generate API models from an OpenAPI spec')
    .option('versionNumber', { alias: 'v', description: 'Version of the API to download. Does not work for local files. Use "latest" for latest version.', type: 'string' })
    .option('files', {alias: 'f', description: 'Generate model from a local file', type: "array" })
    .option('language', {
        alias: 'l', description: 'Generate model for specified language', type: 'string',
        choices: ['csharp', 'go', 'go-experimental', 'java', 'javascript', 'php', 'python', 'typescript-node']
    })
    .option('packageName', { alias: 'p', description: 'Name of the API Service '})
    .option('templatesPath', { alias: 't', description: 'Use custom templates from given path'})
    .option('services', {
        alias: 's', description: 'Generate models for specified services only', type: "array",
        choices: services
    })
    .option('output', { alias: 'o', description: 'Path where generated models are saved', type: 'string', default: './models' })
    .demandOption(['l'])
    .help()
    .alias('help', 'h')
    .argv;

const shell = require("shelljs");
const path = require("path");
const fs = require("fs");

const tmpFolder = "./tmp";
let baseUrl = "https://docs.adyen.com/api-explorer/json";
const repo = "https://api.github.com/repos/OpenAPITools/openapi-generator"
const latestReleaseUri = `${repo}/releases/latest`

shell.mkdir(tmpFolder);

const generateTemplate = (f, p = argv.packageName, o = argv.output) => {
    shell.exec(`node ./openapi-generator-cli/bin/openapi-generator generate -i "${f}" ${argv.templatesPath ? `-t ${argv.templatesPath}` : ""} ${p ? `-p ${p}` : ""} -g ${argv.language} -o ${o}`, { silent: true });
}

const fetchServices = async () => {
    const res = await fetch(`${baseUrl}/Services.json`)
    return await res.json()
}

const downloadApiFiles = async (value, filePath) => {
    const res = await fetch(`${baseUrl}/${value.reference}`)
    const json = await res.json()
    fs.writeFileSync(filePath, JSON.stringify(json, null, 4), {flag: 'w', encoding: 'utf8'}, function(err) {
        if (err) {
            return console.error(err)
        }
    })
}

const getLatestVersion = async () => {
    const res = await fetch(latestReleaseUri)
    const {tag_name: tagName} = await res.json()
    return tagName.slice(1)
}
const hasLatestVersion = async (tagName) => {
    if (fs.existsSync("./openapi-generator-cli")) {
        if (fs.existsSync("./openapi-generator-cli/bin/openapi-generator.jar")) {
            const { stdout, stderr } = shell.exec(`node ./openapi-generator-cli/bin/openapi-generator version`, { silent: true })
            if (!stderr) {
                return stdout.startsWith(tagName)
            }
            console.error(stderr)
            shell.exit(1)
        }
    } else {
        console.log("OpenAPI generator not found. Cloning repo and generating build...")
        shell.exec(`git clone https://github.com/OpenAPITools/openapi-generator-cli.git openapi-generator-cli`, { silent: true })
        shell.cd("./openapi-generator-cli")
        shell.exec("chmod -R 777 .")
        shell.rm("-rf", ".git")
        shell.rm("-rf", "lib")
        shell.cd("..")
        console.log("✔️  Done")
    }

    return false
}

(async function run() {
    const latestVer = await getLatestVersion()
    const isLatest = await hasLatestVersion(latestVer)
    if(!isLatest) {
        console.log("Downloading latest version of the OpenAPI Generator JAR file... (This will happen only once for every new version)")
        shell.rm("-rf", "./openapi-generator-cli/bin/openapi-generator-*.jar")
        shell.cd("./openapi-generator-cli")
        shell.exec(`curl https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/${latestVer}/openapi-generator-cli-${latestVer}.jar -o ./bin/openapi-generator.jar`, { silent: true })
        shell.cd("..")
        console.log("✔️  Done")
    }
    try {
        if (argv.files) {
            argv.files.forEach(f => {
                console.log(`┌ ⚙️  Generating specs for file: ${f}`);
                generateTemplate(f)
                console.log("└ ✔️  Done");
            })
        } else {
            const {services} = await fetchServices()
            const filteredServices = argv.services ? Object.entries(services).filter(([name]) => argv.services.includes(name.toLowerCase())) : Object.entries(services);
            console.log(`\n  💬    Models will be saved on ${path.resolve(__dirname, argv.output)} folder\n`)
            for ([name, service] of filteredServices) {
                const slicedName = name.split(" ").join("");
                const formattedName = slicedName.charAt(0).toLowerCase() + slicedName.slice(1);
                const serviceFolder = `${tmpFolder}/${formattedName}`;
                shell.mkdir(serviceFolder);
                const versions = Object.entries(service.versions);
                const filteredVersions = argv.versionNumber ?
                    argv.versionNumber === "latest" ? [versions.pop()] : versions.filter(([key]) => key === argv.versionNumber)
                    : versions;
                if (!filteredVersions.length) {
                    console.error('Error: API returned 0 results for given version number')
                    process.exit(1)
                }
                for([index, [key, value]] of filteredVersions.entries()) {
                    const versionFolder = `${serviceFolder}/v${key}`;
                    const filePath = `${versionFolder}/${formattedName}.json`;
                    const output = `${argv.output}/${formattedName}/v${key}`
                    shell.mkdir(versionFolder);
                    console.log(`   │   ┌  v${key} (${index + 1}/${versions.length})`);
                    console.log(`   │   │ 🗜   Downloading OpenAPI file from  ${baseUrl}/${value.reference}`);
                    try {
                        await downloadApiFiles(value, filePath)
                        // shell.exec(`curl ${baseUrl}/${value.reference} -o "${filePath}"`);
                        console.log(`   │   │ ⚙️   Generating specs for ${name} v${key}`);
                        generateTemplate(filePath, formattedName, output)
                    } catch (e) {
                        console.error(e)
                    } finally {
                        console.log("   │   └ ✔️  done");
                    }
                };
                console.log(`   └─ Done!`);
            };
        }
    } catch (e) {
        console.error(e)
    } finally {
        shell.rm("-rf", tmpFolder)
        console.log("                                                                        \r");
        console.log(" 🤘  All Done!");
    }
})()


