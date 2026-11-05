import { ChatInputCommandInteraction } from "discord.js";

export interface Command {
    data: {
        name: string;
    };
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
