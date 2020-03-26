# adyen-openapi-generator
Generate OpenApi models from Adyen Services APIs

1) `$ npm install`
2) `$ node index.js <command> [options]`

## Usage:
```console
Usage: index.js <command> [options]

Commands:
  index.js generate  Generate API models from an OpenAPI spec

Options:
  --version             Show version number                            [boolean]
  --version-number, -v  Version of the API to download. Does not work for local
                        files. Use together with the service option     [string]
  --file, -f            Generate model from a local file                 [array]
  --language, -l        Generate model for specified language
      [string] [required] [choices: "csharp", "go", "java", "javascript", "php",
                                                    "python", "typescript-node"]
  --services, -s        Generate models for specified services only
      [array] [choices: "checkout", "checkout utility", "payments", "recurring",
       "payouts", "platforms account", "platforms fund", "platforms notification
      configuration", "platforms notification", "platforms hosted onboard page",
                                         "binlookup", "pos terminal management"]
  --output, -o          Path where generated models are saved
                                                  [string] [default: "./models"]
  --help, -h            Show help                                      [boolean]
```
