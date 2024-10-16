import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { formatPrompt, createCompletion } from './anthropic';
import { readFilesTreeAsASCII } from './utils';

class ChatboxViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'chatboxView';
    private _view?: vscode.WebviewView;
    private _messages: Array<{ type: string; value: string; snippet?: string }> = [];
    private _storageUri: vscode.Uri;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext,
    ) {
        this._storageUri = vscode.Uri.joinPath(this._context.globalStorageUri, 'messages.json');
        this._loadMessages();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);


        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    await this._handleSendMessage(data);
                    break;
            }
        });
    }

    private async _handleSendMessage(data: { value: any }) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                this._sendMessage({ type: 'error', value: 'No active text editor' });
                return;
            }

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                this._sendMessage({ type: 'error', value: 'No workspace folder open' });
                return;
            }

            const rootUri = workspaceFolders[0].uri;

            const fileNameRelativePath = editor.document.uri.fsPath.replace(rootUri.fsPath, '');
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            const tree = await readFilesTreeAsASCII(rootUri.fsPath);

            const prompt = formatPrompt({
                userPrompt: data.value,
                projectTree: tree,
                currentFileName: fileNameRelativePath,
                snippet: selectedText,
                language: undefined,
                dependencies: [],
                context: undefined,
            });

            // Send a single message with the user query and snippet
            this._sendMessage({
                type: 'userMessage',
                value: data.value,
                snippet: selectedText,
            });

            const config = vscode.workspace.getConfiguration('ya-copilot');
            const debug = config.get('debug');
            if (debug) {
                this._sendMessage({
                    type: 'userMessage',
                    value: `<pre>${prompt}</pre>`,
                });
            }

            const res = await createCompletion(prompt);
            if (res.content[0].type === 'text') {
                this._sendMessage({ type: 'assistantMessage', value: res.content[0].text });
            } else {
                this._sendMessage({ type: 'error', value: 'Unexpected response format' });
            }
        } catch (error: any) {
            this._sendMessage({ type: 'error', value: `Error: ${error.message}` });
        }
    }

    private _loadMessages() {
        try {
            if (fs.existsSync(this._storageUri.fsPath)) {
                const data = fs.readFileSync(this._storageUri.fsPath, 'utf8');
                this._messages = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    private _saveMessages() {
        try {
            const dirPath = path.dirname(this._storageUri.fsPath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            fs.writeFileSync(this._storageUri.fsPath, JSON.stringify(this._messages), 'utf8');
        } catch (error) {
            console.error('Error saving messages:', error);
        }
    }

    public clearMessages() {
        this._messages = [];
        this._saveMessages();
        if (this._view) {
            this._view.webview.postMessage({ type: 'clearMessages' });
        }
    }

    private _sendMessage(message: { type: string; value: string; snippet?: string }) {
        if (this._view) {
            this._messages.push(message);
            this._saveMessages();
            this._view.webview.postMessage(message);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'),
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'),
        );

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/dark.min.css" rel="stylesheet">
            <title>Chatbox</title>
        </head>
        <body>
            <div id="chat-messages"></div>
            <div id="loader"></div>
            <div id="input-container">
                <textarea id="message-input" placeholder="Chat with your codebase!"></textarea>
            </div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/4.0.2/marked.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/marked-highlight/2.0.1/index.umd.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}

export function activate(context: vscode.ExtensionContext) {
    const provider = new ChatboxViewProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.commands.registerCommand('ya-copilot.setApiKey', async () => {
            const config = vscode.workspace.getConfiguration('ya-copilot');
            const apiKey = await vscode.window.showInputBox({
                prompt: 'Enter your Anthropic API key',
                password: true,
            });

            if (apiKey) {
                await config.update('apikey', apiKey, true);
                vscode.window.showInformationMessage('Anthropic API Key has been set.');
            }
        }),
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatboxViewProvider.viewType, provider),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ya-copilot.clearMessages', () => {
            provider.clearMessages();
        }),
    );

    console.log('Chatbox extension is now active!');
}

export function deactivate() {}
