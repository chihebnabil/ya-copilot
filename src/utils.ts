import { Buffer } from 'buffer';
import * as path from 'path';

import * as vscode from 'vscode';

function getIgnorePatternsFromSettings(): string[] {
    const config = vscode.workspace.getConfiguration('ya-copilot');
    return config.get<string[]>('commonIgnoredFolders', [
        'node_modules',
        'dist',
        '.git',
        '.DS_Store',
    ]);
}

async function parseGitignore(rootUri: vscode.Uri): Promise<string[]> {
    const gitignoreUri = vscode.Uri.joinPath(rootUri, '.gitignore');
    try {
        const gitignoreContent = await vscode.workspace.fs.readFile(gitignoreUri);
        const gitignorePatterns = Buffer.from(gitignoreContent)
            .toString()
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'));
        return gitignorePatterns;
    } catch {
        return [];
    }
}

function gitignoreToRegExp(pattern: string): RegExp {
    let regexPattern = pattern
        .replaceAll(/[.+^${}()|[\]\\]/g, String.raw`\$&`)
        .replaceAll('*', '.*')
        .replaceAll('?', '.')
        .replaceAll('[!', '[^');

    if (pattern.endsWith('/')) {
        regexPattern += '.*';
    } else if (!pattern.includes('/')) {
        regexPattern = `(^|/)${regexPattern}($|/)`;
    }

    return new RegExp(regexPattern);
}

function isIgnored(filePath: string, rootPath: string, ignorePatterns: string[]): boolean {
    const relativePath = path.relative(rootPath, filePath).replaceAll('\\', '/');
    return ignorePatterns.some((pattern) => {
        try {
            const regex = gitignoreToRegExp(pattern);
            return regex.test(relativePath) || regex.test(`/${relativePath}`);
        } catch {
            return false;
        }
    });
}

export async function readFilesTreeAsASCII(
    rootUri: vscode.Uri,
    prefix: string = '',
    ignorePatterns: string[] = [],
): Promise<string> {
    if (ignorePatterns.length === 0) {
        ignorePatterns = await parseGitignore(rootUri);
        if (ignorePatterns.length === 0) {
            ignorePatterns = getIgnorePatternsFromSettings();
        }
    }

    const entries = await vscode.workspace.fs.readDirectory(rootUri);
    const output: string[] = [];
    const promises: Array<Promise<string>> = [];

    for (let i = 0; i < entries.length; i++) {
        const [name, type] = entries[i];
        const isLast = i === entries.length - 1;
        const newPrefix = prefix + (isLast ? '└── ' : '├── ');
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        const fullPath = vscode.Uri.joinPath(rootUri, name).fsPath;

        if (isIgnored(fullPath, rootUri.fsPath, ignorePatterns)) continue;

        if (type === vscode.FileType.Directory) {
            output.push(newPrefix + name);
            const childUri = vscode.Uri.joinPath(rootUri, name);
            promises.push(readFilesTreeAsASCII(childUri, childPrefix, ignorePatterns));
        } else {
            output.push(newPrefix + name);
        }
    }

    const resolved = await Promise.all(promises);
    output.push(...resolved.filter((s) => s.trim() !== ''));

    return output.join('\n');
}

export function getRootFolderUri(): vscode.Uri | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return workspaceFolders[0].uri;
    }
    return undefined;
}
