import * as fs from 'fs';
import * as path from 'path';

import ignore from 'ignore';
import * as vscode from 'vscode';

function getIgnorePatternsFromSettings(): string[] {
    const config = vscode.workspace.getConfiguration('ya-copilot');
    return config.get<string[]>('commonIgnoredFolders', ['node_modules', 'dist', '.git']);
}

export function readFilesTreeAsASCII(dir: string, prefix: string = ''): string {
    let result = '';
    const ig = ignore();

    // Try to read .gitignore file
    try {
        const gitignoreContent = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
        ig.add(gitignoreContent);
    } catch (error) {
        // If .gitignore is not found, use ignore patterns from settings
        ig.add(getIgnorePatternsFromSettings());
        console.log('No .gitignore file found, using ignore patterns from settings', error);
    }

    const files = fs.readdirSync(dir);
    files.forEach((file, index) => {
        const filePath = path.join(dir, file);
        const relPath = path.relative(vscode.workspace.rootPath || '', filePath);

        // Skip if the file/folder should be ignored
        if (ig.ignores(relPath)) {
            return;
        }

        const isLast = index === files.length - 1;
        const newPrefix = prefix + (isLast ? '└── ' : '├── ');

        result += `${newPrefix + file}\n`;

        if (fs.statSync(filePath).isDirectory()) {
            result += readFilesTreeAsASCII(filePath, prefix + (isLast ? '    ' : '│   '));
        }
    });

    return result;
}
