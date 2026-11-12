import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder, Snowflake } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { createListeningStream } from '../../utility/createListeningStream';

export default {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Joins the specified channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The voice channel to join')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, recordable: Set<Snowflake>) {
        try {
            await interaction.deferReply();
            const channel = interaction.options.getChannel('channel')!;
            const guildId = interaction.guildId!;
            let voiceConnection = getVoiceConnection(guildId);

            if (voiceConnection) {
                // Already connected: move to the requested channel
                voiceConnection.destroy();
            }

            voiceConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guildId,
                adapterCreator: interaction.guild!.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });

            try {
                await entersState(voiceConnection, VoiceConnectionStatus.Ready, 20_000);
                const receiver = voiceConnection.receiver;

                receiver.speaking.on('start', async (userId) => {
                    if (!recordable.has(userId)) return;

                    try {
                        const user = await interaction.client.users.fetch(userId);
                        console.log("Creating listening stream from join command...");
                        createListeningStream(receiver, user);
                    } catch (error) {
                        console.error('Failed to start recording:', error);
                    }
                });
            } catch (error) {
                console.warn(error);
                await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
            }

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