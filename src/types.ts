export interface PromptParams {
    userPrompt: string;
    projectTree: string;
    currentFileName: string;
    snippet: string;
    language?: string;
    dependencies?: string[];
    context?: string;
}


export interface Chat {
    id: number;
    message: string;
    timestamp: string;
    isAssistant: boolean;
}

export interface Data {
    chats: Chat[];
}
