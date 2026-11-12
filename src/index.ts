import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, MessageFlags, Snowflake } from 'discord.js';
import { Command } from './interfaces/command';

// Extend the Discord.js Client interface
declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, Command>;
    }
}

dotenv.config({
    path: path.resolve(__dirname, '.env'),
});

/**
 * The ids of the users that can be recorded by the bot.
 */
const recordable = new Set<Snowflake>();

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(process.env.BOT_AUTH_TOKEN);
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const imported = require(filePath);
        const command = (imported.default ?? imported) as Partial<Command>;

        if (
            command.data &&
            typeof command.data.name === 'string' &&
            typeof command.execute === 'function'
        ) {
            client.commands.set(command.data.name, command as Command);
        } else {
            console.warn(
                `The command at ${filePath} is missing a required "data" or "execute" property.`,
            );
        }
    }
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction, recordable);
    } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            });
        }
    }
});
