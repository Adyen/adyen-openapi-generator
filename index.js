const shell = require("shelljs");
const path = require("path");
const fs = require("fs");
const json = require("./config.json");

const tmpFolder = path.resolve(__dirname, "./tmp");
const baseUrl = "https://docs.adyen.com/api-explorer/json";
const createHeaderTxt = (service, version) => `
/*
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 *
 * Adyen NodeJS API Library
 *
 * Version of ${service}: v${version}
 *
 * Copyright (c) 2019 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 */
 
`

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
    shell.echo(`   ┌─ ${name}`);
    const [key, value] = versions.pop();
    const versionFolder = path.join(serviceFolder, `v${key}`);
    const filePath = `${versionFolder}/${formattedName}.json`;
    const outputPath = path.join(__dirname, json.outputPath, `${formattedName}.ts`);
    const headerTxt = createHeaderTxt(name, key);

    shell.mkdir(versionFolder);
    shell.echo(`   │   ┌  Latest version: ${key}`);
    shell.echo(`   │   │ 🗜   Downloading OpenAPI file from  ${baseUrl}/${value.reference}`);
    shell.exec(`wget ${baseUrl}/${value.reference} -O ${filePath} -q`);
    shell.echo(`   │   │ ⚙️   Generating specs for ${name} v${key}`);
    shell.exec(`./node_modules/dtsgenerator/bin/dtsgen -n I${name.replace(/\s/g, "")} -o ${outputPath} ${filePath}`);
    const data = fs.readFileSync(outputPath).toString().split("\n");
    data.splice(0, 0, headerTxt);
    const text = data.join("\n");
    fs.writeFile(outputPath, text, e => { shell.exit(e) });
    // shell.exec(`npm run build -- generate -i ${filePath} -g ${json.client} -o ${path.join(__dirname, json.outputPath, formattedName, `v${key}`)} -DnpmName=@adyen/api-library -DsupportsES6=true -Dmodels >/dev/null`);
    shell.echo("   │   └ ✔️  done");
    shell.echo(`   └─ Done!`);
});

shell.rm("-rf", tmpFolder);
shell.echo("-ne", "                                                                        \r");
shell.echo(" 🤘  All Done!");
