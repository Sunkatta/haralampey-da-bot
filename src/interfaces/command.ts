import { ChatInputCommandInteraction, Snowflake } from "discord.js";

export interface Command {
    data: {
        name: string;
    };
    execute: (interaction: ChatInputCommandInteraction, recordable: Set<Snowflake>) => Promise<void>;
}
