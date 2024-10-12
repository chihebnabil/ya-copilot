import { Buffer } from 'buffer';

import * as vscode from 'vscode';

// Default common ignore patterns
const commonIgnorePatterns = ['node_modules', 'dist', '.git', '.DS_Store'];

/**
 * Function to parse gitignore contents into an array of patterns
 */
async function parseGitignore(rootUri: vscode.Uri): Promise<string[]> {
    const gitignoreUri = vscode.Uri.joinPath(rootUri, '.gitignore');
    try {
        const gitignoreContent = await vscode.workspace.fs.readFile(gitignoreUri);
        const gitignorePatterns = Buffer.from(gitignoreContent)
            .toString()
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#')); // Exclude comments and empty lines
        return gitignorePatterns;
    } catch {
        return [];
    }
}

/**
 * Check if a given name matches any ignore patterns
 */
function isIgnored(name: string, ignorePatterns: string[]): boolean {
    return ignorePatterns.some((pattern) => new RegExp(pattern).test(name));
}

export async function readFilesTreeAsASCII(
    rootUri: vscode.Uri,
    prefix: string = '',
): Promise<string> {
    let ignorePatterns = await parseGitignore(rootUri);
    if (ignorePatterns.length === 0) {
        ignorePatterns = commonIgnorePatterns;
    }

    const entries = await vscode.workspace.fs.readDirectory(rootUri);
    const output: string[] = [];
    const promises: Array<Promise<string>> = [];

    for (let i = 0; i < entries.length; i++) {
        const [name, type] = entries[i];
        const isLast = i === entries.length - 1;
        const newPrefix = prefix + (isLast ? '└── ' : '├── ');
        const childPrefix = prefix + (isLast ? '    ' : '│   ');

        // Skip ignored files or directories
        if (isIgnored(name, ignorePatterns)) continue;

        if (type === vscode.FileType.Directory) {
            output.push(newPrefix + name);
            const childUri = vscode.Uri.joinPath(rootUri, name);
            // Collect promises instead of awaiting here
            promises.push(readFilesTreeAsASCII(childUri, childPrefix));
        } else {
            output.push(newPrefix + name);
        }
    }

    // Resolve all promises at once
    const resolved = await Promise.all(promises);
    output.push(...resolved);

    return output.join('\n');
}

// New function to get the root folder
export function getRootFolder(): vscode.Uri | undefined {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        // If there's a workspace folder, use it
        return vscode.workspace.workspaceFolders[0].uri;
    } else if (vscode.window.activeTextEditor) {
        // If there's an active text editor, use its file's parent folder
        return vscode.Uri.joinPath(vscode.window.activeTextEditor.document.uri, '..');
    }
    return undefined;
}
