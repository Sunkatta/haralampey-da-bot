const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Repeat a phrase')
        .addStringOption(option =>
            option
                .setName('input')
                .setDescription('The phrase to repeat')
                .setRequired(true),
        ),

    async execute(interaction) {
        try {
            const input = interaction.options.getString('input');

            await interaction.reply(input);
        } catch (error) {
            console.error(error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(
                    'My creators are dumbasses and did not teach me how to repeat this...',
                );
            } else {
                await interaction.reply(
                    'My creators are dumbasses and did not teach me how to repeat this...',
                );
            }
        }
    },
};
