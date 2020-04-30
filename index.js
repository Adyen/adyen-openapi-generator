#!/usr/bin/env node

const yargs = require("yargs");
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

shell.mkdir(tmpFolder);

const generateTemplate = (f, p = argv.packageName, o = argv.output) => {
    const dockerGenerate = `docker run --rm -v "${path.resolve(__dirname)}:/local" openapitools/openapi-generator-cli generate`
    shell.exec(`${dockerGenerate} --skip-validate-spec -i /local/${f} ${argv.templatesPath ? `-t /local/${argv.templatesPath}` : ""} ${p ? `-p ${p}` : ""} -g ${argv.language} -o /local/${o}`);
}

if (argv.files) {
    argv.files.forEach(f => {
        shell.echo(`┌ ⚙️  Generating specs for file: ${f}`);
        generateTemplate(f)
        shell.echo("└ ✔️  Done");
    })
} else {
    const tempServices = `${tmpFolder}/services.json`
    shell.exec(`curl ${baseUrl}/Services.json -o "${tempServices}"`);
    const file = fs.readFileSync("./tmp/services.json").toString();

    const {services} = JSON.parse(file);
    const filteredServices = argv.services ? Object.entries(services).filter(([name]) => argv.services.includes(name.toLowerCase())) : Object.entries(services);
    shell.echo(`\n  💬    Models will be saved on ${path.resolve(__dirname, argv.output)} folder\n`);
    filteredServices.forEach(([name, service]) => {
        const slicedName = name.split(" ").join("");
        const formattedName = slicedName.charAt(0).toLowerCase() + slicedName.slice(1);
        const serviceFolder = `${tmpFolder}/${formattedName}`;
        shell.mkdir(serviceFolder);
        const versions = Object.entries(service.versions);
        const filteredVersions = argv.versionNumber ?
            argv.versionNumber === "latest" ? [versions.pop()] : versions.filter(([key]) => key === argv.versionNumber)
            : versions;
        if (!filteredVersions.length) {
            shell.echo('Error: API returned 0 results for given version number')
            process.exit(1)
        }
        filteredVersions.forEach(([key, value], index) => {
            const versionFolder = `${serviceFolder}/v${key}`;
            const filePath = `${versionFolder}/${formattedName}.json`;
            const output = `${argv.output}/${formattedName}/v${key}`
            shell.mkdir(versionFolder);
            shell.echo(`   │   ┌  v${key} (${index + 1}/${versions.length})`);
            shell.echo(`   │   │ 🗜   Downloading OpenAPI file from  ${baseUrl}/${value.reference}`);
            shell.exec(`curl ${baseUrl}/${value.reference} -o "${filePath}"`);
            shell.echo(`   │   │ ⚙️   Generating specs for ${name} v${key}`);
            generateTemplate(filePath, formattedName, output)
            shell.echo("   │   └ ✔️  done");
        });
        shell.echo(`   └─ Done!`);
    });
}


shell.rm("-rf", tmpFolder);
shell.echo("-ne", "                                                                        \r");
shell.echo(" 🤘  All Done!");
