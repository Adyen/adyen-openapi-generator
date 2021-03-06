# Adyen open-api generator
Generate OpenApi models from Adyen APIs to adopt to the Adyen API libraries.

## Requirements
* Node 

## Installation
`$ npm install`

## Support
If you have a feature request, or spotted a bug or a technical problem, create a GitHub issue. For other questions, contact our [support team](https://support.adyen.com/hc/en-us/requests/new?ticket_form_id=360000705420).

## Usage:
```console
Usage: index.js <command> [options]

Commands:
  index.js generate  Generate API models from an OpenAPI spec

Options:
  --version             Show version number                            [boolean]
  --version-number, -v  Version of the API to download. Does not work for local
                        files. Use together with the service option     [string]
  --files, -f           Generate model from local files                  [array]
  --language, -l        Generate model for specified language
      [string] [required] [choices: "csharp", "go", "go-experimental", "java", "javascript", "php",
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


## License
MIT license. For more information, see the LICENSE file.
