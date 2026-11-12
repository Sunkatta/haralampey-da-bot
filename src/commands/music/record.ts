import { getVoiceConnection } from "@discordjs/voice";
import { ChatInputCommandInteraction, SlashCommandBuilder, Snowflake } from "discord.js";
import { createListeningStream } from "../../utility/createListeningStream";

export default {
    data: new SlashCommandBuilder()
        .setName('record')
        .setDescription('Start recording'),

    async execute(interaction: ChatInputCommandInteraction, recordable: Set<Snowflake>) {
        const connection = getVoiceConnection(interaction.guildId!);

        if (!connection) {
            await interaction.reply('Join a voice channel and then try that again!');
            return;
        }

        recordable.add(interaction.user.id);

        if (connection.receiver.speaking.users.has(interaction.user.id)) {
            console.log("Creating listening stream from record command...");
            createListeningStream(connection.receiver, interaction.user);
        }

        await interaction.reply('Listening!');
    }
};
