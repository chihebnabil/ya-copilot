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
 * Convert a gitignore pattern to a regular expression
 */
function gitignoreToRegExp(pattern: string): RegExp {
    let regexPattern = pattern
        .replaceAll(/[.+^${}()|[\]\\]/g, String.raw`\$&`) // Escape special regex characters
        .replaceAll('*', '.*') // Convert * to .*
        .replaceAll('?', '.') // Convert ? to .
        .replaceAll('[!', '[^'); // Convert [! to [^

    if (!pattern.startsWith('/')) {
        regexPattern = `(^|/)${regexPattern}`;
    }
    if (!pattern.endsWith('/')) {
        regexPattern = `${regexPattern}($|/)`;
    }

    return new RegExp(regexPattern);
}

/**
 * Check if a given name matches any ignore patterns
 */
function isIgnored(name: string, ignorePatterns: string[]): boolean {
    return ignorePatterns.some((pattern) => {
        try {
            return gitignoreToRegExp(pattern).test(name);
        } catch {
            // If the pattern is invalid, skip it
            return false;
        }
    });
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

// Function to get the root folder URI
export function getRootFolderUri(): vscode.Uri | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return workspaceFolders[0].uri;
    }
    return undefined;
}

// Main function to generate and display the ASCII tree
export async function generateAndDisplayASCIITree() {
    const rootUri = getRootFolderUri();
    if (!rootUri) {
        vscode.window.showErrorMessage('No workspace folder is open');
        return;
    }

    try {
        const asciiTree = await readFilesTreeAsASCII(rootUri);
        const document = await vscode.workspace.openTextDocument({
            content: asciiTree,
            language: 'plaintext',
        });
        await vscode.window.showTextDocument(document);
    } catch (error) {
        vscode.window.showErrorMessage(`Error generating ASCII tree: ${error}`);
    }
}
