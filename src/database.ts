import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

interface Chat {
    id: number;
    message: string;
    timestamp: string;
    isAssistant: boolean;
}

interface Data {
    chats: Chat[];
}

export class DatabaseManager {
    /** Define db as Low<Data> type */
    private db: Low<Data>;
    /** Add a JSONFile instance */
    private file: JSONFile<Data>;
    /** Global database file path */
    private globalDbPath: string;

    constructor() {
        // Set the path for the global JSON file
        const homeDir = os.homedir(); // Get the home directory of the current user
        const globalDir = path.join(homeDir, '.ya'); // Define your global app folder name (e.g., .mychatapp)
        this.globalDbPath = path.join(globalDir, 'db.json'); // Full path for the database file

        // Create the global directory if it doesn't exist
        if (!fs.existsSync(globalDir)) {
            fs.mkdirSync(globalDir, { recursive: true });
        }

        console.log('DatabaseManager constructor', this.globalDbPath);

        this.file = new JSONFile<Data>(this.globalDbPath); // Create a new JSONFile instance
        this.db = new Low<Data>(this.file, { chats: [] }); // Create a new Low instance with the JSONFile
        console.log('DatabaseManager initialized', this.db);
    }

    async init(): Promise<void> {
        await this.db.read(); // Read existing data or create new if it doesn't exist
        // Set default data if db is empty
        this.db.data ||= { chats: [] };
    }

    async addChat(message: string, timestamp: string, isAssistant: boolean): Promise<void> {
        const newChat: Chat = {
            id: (this.db.data?.chats.length ?? 0) + 1, // Incremental ID
            message,
            timestamp,
            isAssistant,
        };
        this.db.data.chats.push(newChat); // Add new chat to the data
        await this.db.write(); // Write changes to the file
    }

    async getChats(): Promise<Chat[]> {
        return this.db.data.chats; // Return the list of chats
    }

    async getChat(id: number): Promise<Chat> {
        const chat = this.db.data.chats.find((c: Chat) => c.id === id); // Find chat by ID
        if (!chat) throw new Error('Chat not found');
        return chat; // Return the found chat
    }

    async close(): Promise<void> {
        // No explicit close method needed for lowdb since it writes directly to the file
    }
}
