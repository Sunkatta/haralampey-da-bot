const { SlashCommandBuilder } = require('discord.js');
const {
    getVoiceConnection
} = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Disconnect from the current voice channel'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const guildId = interaction.guildId;

            const voiceConnection = getVoiceConnection(guildId);

            if (voiceConnection) {
                voiceConnection.destroy();
            }

            // this.music_service.remove_music_player_by_id(
            //     String(guildId)
            // );

            await interaction.editReply('Sayonara, losers');

        } catch (error) {
            console.error(error);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(
                    'Something went wrong...'
                );
            } else {
                await interaction.reply(
                    'Something went wrong...'
                );
            }
        }
    }
};
