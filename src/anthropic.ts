import Anthropic from '@anthropic-ai/sdk';
import * as vscode from 'vscode';
import { PromptParams } from './types';

const config = vscode.workspace.getConfiguration('ya-copilot');
const apiKey = config.get('apikey') as string | undefined;

if (!apiKey) {
    throw new Error('API key is not set');
}

export const client = new Anthropic({
    apiKey,
});

export const createCompletion = async (prompt: string) => {
    const response = await client.messages.create({
        messages: [{ role: 'user', content: prompt }],
        system: 'You are a seasoned software engineer',
        max_tokens: config.get('maxTokens') as number,
        model: config.get('model') as string,
    });
    return response;
};

export const createDocumentationCompletion = async (code: string, language: string) => {
    const response = await client.messages.create({
        messages: [
            {
                role: 'user',
                content: `Generate only the documentation like (PHPDoc , jsDoc ...) for the following ${language} snippet : \n\n${code}`,
            },
            {
                role: 'assistant',
                content: `Here's the snippet documentation:`,
            },
        ],
        system: 'You are a seasoned software engineer. Provide documentation without using markdown code block indicators.',
        max_tokens: config.get('maxTokens') as number,
        model: config.get('model') as string,
    });
    
    if (response.content[0].type === 'text') {
        // Remove any remaining markdown code block indicators
        const cleanedText = response.content[0].text.replace(/```[\w]*\n?/g, '').trim();
        console.log(cleanedText);
        return {
            ...response,
            content: [{ ...response.content[0], text: cleanedText }]
        };
    }
    
    return response;
};

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
