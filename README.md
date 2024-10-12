# YA Copilot VSCode Extension

YA Copilot (Yet Another Copilot) is an open source copilot alternative, it is a VSCode extension that uses the Anthropic API to provide AI assistance.

Start by setting your anthropic API key in the extension settings

## Extension Settings

This extension contributes the following settings:

- `ya-copilot.apikey`: Your Anthropic API key
- `ya-copilot.model`: Anthropic model to use default to `claude-3-5-sonnet-20240620`
- `ya-copilot.maxTokens`: Max tokens to use default to `512`
- `ya-copilot.edgeCases`: Include the edge cases in the responce default to `false`
- `ya-copilot.deepExplanation`: Include the deep explanation in the responce for the complex parts default to `false`
- `ya-copilot.commonIgnoredFolders`: Patterns to ignore when generating the file tree for the prompt in order to avoid having a really long input prompt, if .gitignore was not available default to `[".git", ".github", "node_modules", "out", "dist", "vendor", ".vscode-test", ".vscode", "build"]`
- `ya-copilot.debug`: Enable debug mode (show the full prompt in the chatbox) default to `false`

## Development

Install dependencies by:

```shell
pnpm install
```

Then run and debug extension like in [official documentation](https://code.visualstudio.com/api/get-started/your-first-extension)

```shell
pnpm release
```
