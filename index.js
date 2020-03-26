#!/usr/bin/env node

const yargs = require("yargs");
const services = ['checkout', 'checkout utility', 'payments', 'recurring', 'payouts', 'platforms account', 'platforms fund', 'platforms notification configuration', 'platforms notification', 'platforms hosted onboard page', 'binlookup', 'pos terminal management'];
const argv = yargs
    .usage('Usage: $0 <command> [options]')
    .command('generate', 'Generate API models from an OpenAPI spec')
    .option('version-number', { alias: 'v', description: 'Version of the API to download. Does not work for local files. Use together with the service option', type: 'string' })
    .option('file', {alias: 'f', description: 'Generate model from a local file', type: "array" })
    .option('language', {
        alias: 'l', description: 'Generate model for specified language', type: 'string',
        choices: ['csharp', 'go', 'java', 'javascript', 'php', 'python', 'typescript-node']
    })
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

const tmpFolder = path.resolve(__dirname, "./tmp");
let baseUrl = "https://docs.adyen.com/api-explorer/json";

shell.mkdir(tmpFolder);

if (argv.file) {
    argv.file.forEach(f => {
        shell.echo(`┌ ⚙️  Generating specs for file: ${f}`);
        shell.exec(`export JAVA_OPTS='-Dmodels -DskipFormModel=true' && npm run build -- generate -i ${f} -g ${argv.language} -o ${path.join(__dirname, argv.output)} >/dev/null`);
        shell.echo("└ ✔️  Done");
    })
} else {
    shell.exec(`wget ${baseUrl}/Services.json -O ${tmpFolder}/services.json -q`);
    const file = fs.readFileSync("./tmp/services.json").toString();

    const {services} = JSON.parse(file);
    const filteredServices = argv.services ? Object.entries(services).filter(([name]) => argv.services.includes(name.toLowerCase())) : Object.entries(services);
    shell.echo(`\n  💬    Models will be saved on ${path.resolve(__dirname, argv.output)} folder\n`);
    filteredServices.forEach(([name, service], idx) => {
        const slicedName = name.split(" ").join("");
        const formattedName = slicedName.charAt(0).toLowerCase() + slicedName.slice(1);
        const serviceFolder = path.join(tmpFolder, formattedName);
        shell.mkdir(serviceFolder);
        const versions = Object.entries(service.versions);
        const filteredVersions = argv.versionNumber ? versions.filter(([key]) => key === argv.versionNumber) : versions;
        if (!filteredVersions.length) {
            shell.echo('Error: API returned 0 results for given version number')
            process.exit(1)
        }
        filteredVersions.forEach(([key, value], index) => {
            const versionFolder = path.join(serviceFolder, `v${key}`);
            const filePath = `${versionFolder}/${formattedName}.json`;
            shell.mkdir(versionFolder);
            shell.echo(`   │   ┌  v${key} (${index + 1}/${versions.length})`);
            shell.echo(`   │   │ 🗜   Downloading OpenAPI file from  ${baseUrl}/${value.reference}`);
            shell.exec(`wget ${baseUrl}/${value.reference} -O ${filePath} -q`);
            shell.echo(`   │   │ ⚙️   Generating specs for ${name} v${key}`);
            shell.exec(`export JAVA_OPTS='-Dmodels' && npm run build -- generate -i ${filePath} -g ${argv.language} -o ${path.join(__dirname, argv.output, formattedName, `v${key}`)}>/dev/null`);
            shell.echo("   │   └ ✔️  done");
        });
        shell.echo(`   └─ Done!`);
    });
}


shell.rm("-rf", tmpFolder);
shell.echo("-ne", "                                                                        \r");
shell.echo(" 🤘  All Done!");
