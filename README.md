# YA Copilot VSCode Extension

YA Copilot (Yet Another Copilot) is an open source copilot alternative, it is a VSCode extension that uses the Anthropic Copilot API to provide AI assistance.

Start by setting your anthropic API key in the extension settings

## Extension Settings

This extension contributes the following settings:

- `ya-copilot.apikey`: Your Copilot API key
- `ya-copilot.model`: Anthropic model to use
- `ya-copilot.maxTokens`: Max tokens to use
- `ya-copilot.edgeCases`: Include the edge cases in the responce
- `ya-copilot.deepExplanation`: Include the deep explanation in the responce for the complex parts
- `ya-copilot.commonIgnoredFolders`: Patterns to ignore when generating the file tree for the prompt in order to avoid having a really long input prompt, if .gitignore was not available
- `ya-copilot.debug`: Enable debug mode (show the full prompt in the chatbox)

## Development

Install dependencies by:

```shell
pnpm install
```

Then run and debug extension like in [official documentation](https://code.visualstudio.com/api/get-started/your-first-extension)

```shell
pnpm release
```
