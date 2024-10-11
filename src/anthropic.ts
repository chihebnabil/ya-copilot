import Anthropic from '@anthropic-ai/sdk';
import * as vscode from 'vscode';

const config = vscode.workspace.getConfiguration('ya-copilot');
const apiKey = config.get('apikey');

export const client = new Anthropic({
    apiKey, // This is the default and can be omitted
});

export const createCompletion = async (prompt: string) => {
    const response = await client.messages.create({
        messages: [{ role: 'user', content: prompt }],
        system: 'You are a seasoned software engineer',
        max_tokens: config.get('maxTokens'),
        model: config.get('model'),
    });
    return response;
};

interface PromptParams {
    userPrompt: string;
    projectTree: string;
    currentFileName: string;
    snippet: string;
    language?: string;
    dependencies?: string[];
    context?: string;
}

export function formatPrompt({
    userPrompt,
    projectTree,
    currentFileName,
    snippet,
    language,
    dependencies = [],
    context = '',
}: PromptParams): string {
    const edgeCasesConfig = config.get('edgeCases');
    const deepExplanationConfig = config.get('deepExplanation');

    return `${dependencies?.map((dependency) => `- Dependency: ${dependency}`).join('\n')}

As an AI coding assistant, please help with the following task:

${userPrompt}

Project Context:
${language ? `- Language: ${language}` : ''}
- Current file: ${currentFileName}
${context ? `- Additional context: ${context}` : ''}

Project structure:
${projectTree}

Relevant code snippet:
\`\`\`
${snippet}
\`\`\`

Please provide a detailed solution, including:
1. An explanation of the approach
2. The complete code implementation
${deepExplanationConfig ? `3. Any necessary explanations for complex parts` : ''}
${edgeCasesConfig ? `4. Potential edge cases or considerations` : ''}

Your response should be clear, well-commented, and follow best practices
`;
}
