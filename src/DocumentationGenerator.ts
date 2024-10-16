
import { createDocumentationCompletion } from './anthropic';
import * as vscode from 'vscode';

export class DocumentationGenerator {
    public static async generateDocumentation() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor');
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        const selectedText = document.getText(selection);

        if (!selectedText) {
            vscode.window.showErrorMessage('No code selected');
            return;
        }

        const language = document.languageId;
        const docComp = await createDocumentationCompletion(selectedText, language);

        try {
            vscode.window.setStatusBarMessage('Generating documentation...', 2000);
            if (docComp.content[0].type === 'text') {
                const documentation = docComp.content[0].text;
                this.insertDocumentation(editor, selection, documentation);
                vscode.window.showInformationMessage('Documentation generated successfully');
            } else {
                vscode.window.showErrorMessage('Unexpected response format');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error generating documentation: ${error.message}`);
        }
    }

    private static insertDocumentation(editor: vscode.TextEditor, selection: vscode.Selection, documentation: string) {
        editor.edit(editBuilder => {
            // Insert the documentation above the selected code
            editBuilder.insert(selection.start, documentation + '\n\n');
        });
    }
}