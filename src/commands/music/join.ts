import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';

export default {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Joins the specified channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The voice channel to join')
                .addChannelTypes(2) // GuildVoice
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        try {
            await interaction.deferReply();
            const channel = interaction.options.getChannel('channel')!;
            const guildId = interaction.guildId!;
            const voiceConnection = getVoiceConnection(guildId);

            if (voiceConnection) {
                // Already connected: move to the requested channel
                voiceConnection.destroy();
            }

            joinVoiceChannel({
                channelId: channel.id,
                guildId: guildId,
                adapterCreator: interaction.guild!.voiceAdapterCreator
            });

            // this.music_service.add_music_player(String(guildId));

            await interaction.editReply(
                `Joined channel: \`${channel.name}\``
            );
        } catch (error) {
            console.error(error);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(
                    'I did a whoopsie... Please try that again...'
                );
            } else {
                await interaction.reply(
                    'I did a whoopsie... Please try that again...'
                );
            }
        }
    }
};