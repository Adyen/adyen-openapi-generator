const shell = require("shelljs");
const path = require("path");
const fs = require("fs");
const json = require("./config.json");

const tmpFolder = path.resolve(__dirname, "./tmp");
const baseUrl = "https://docs.adyen.com/api-explorer/json";

shell.mkdir(tmpFolder);
shell.exec(`wget ${baseUrl}/Services.json -O ${tmpFolder}/services.json -q`);

const file = fs.readFileSync("./tmp/services.json").toString();
const {services} = JSON.parse(file);
shell.echo(`\n  💬    Models will be saved on ${path.resolve(__dirname, json.outputPath)} folder\n`);
Object.entries(services).forEach(([name, service], idx) => {
    const slicedName = name.split(" ").join("");
    const formattedName = slicedName.charAt(0).toLowerCase() + slicedName.slice(1);
    const serviceFolder = path.join(tmpFolder, formattedName);
    shell.mkdir(serviceFolder);
    const versions = Object.entries(service.versions);
    shell.echo(`   ┌─ ${name}  (${idx + 1}/${Object.entries(services).length})`);
    versions.forEach(([key, value], index) => {
        const versionFolder = path.join(serviceFolder, `v${key}`);
        const filePath = `${versionFolder}/${formattedName}.json`;
        shell.mkdir(versionFolder);
        shell.echo(`   │   ┌  v${key} (${index + 1}/${versions.length})`); 
        shell.echo(`   │   │ 🗜   Downloading OpenAPI file from  ${baseUrl}/${value.reference}`);
        shell.exec(`wget ${baseUrl}/${value.reference} -O ${filePath} -q`);
        shell.echo(`   │   │ ⚙️   Generating specs for ${name} v${key}`);
        shell.exec(`npm run build -- generate -i ${filePath} -g ${json.client} -o ${path.join(__dirname, json.outputPath, formattedName, `v${key}`)} -Dmodels >/dev/null`);
        shell.echo("   │   └ ✔️  done");
    });
    shell.echo(`   └─ Done!`);
});

shell.rm("-rf", tmpFolder);
shell.echo("-ne", "                                                                        \r");
shell.echo(" 🤘  All Done!");
