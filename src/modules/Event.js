'use strict';
/** @typedef {import('discord-api-types/rest/v9').RESTPostAPIApplicationCommandsJSONBody} RESTPostAPIApplicationCommandsJSONBody */
/** @typedef {import('discord-bot-core/src/Core').Entry} Core.Entry */

import Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import * as Bot from 'discord-bot-core';
const logger = Bot.logger;

export default class Presence extends Bot.Module {
    
    /** @param {Core.Entry} bot */
    constructor(bot) {
        super(bot);

        this.commands = ['event'];
    }

    /** @param {Discord.Guild} guild - Current guild. */
    init(guild) {
        super.init(guild);
    }

    /**
     * 
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @returns {boolean}
     */
    interactionPermitted(interaction, guild, member) {
        let role_id = this.bot.getRoleId(guild.id, "EVENT_MOD");
        if(role_id == null)
            return false;

        if(!interaction.member.roles.cache.get(role_id))
            return false;

        return true;
    }

    /**
     * 
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @param {Discord.TextChannel | Discord.ThreadChannel} channel
     */
    async incomingInteraction(interaction, guild, member, channel) {
        if(!interaction.isChatInputCommand()) return;
        
        switch(interaction.commandName) {
            case "event":
                let description = interaction.options.getString('description', true);
                this.event(interaction, guild, member, { description });
                return;
        }
    }

    /**
     * 
     * @returns {RESTPostAPIApplicationCommandsJSONBody[]}
     */
    getSlashCommands() {
        return [
            new SlashCommandBuilder().setName('event')
                .setDescription('[Event Mod] Mention all Event subscribers with a new event message.')
                .setDefaultMemberPermissions('0')
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('The message to include with the mention.')
                        .setRequired(true)
                ).toJSON()
        ]
    }

     /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @param {{description: string}} opts
     */
    event(interaction, guild, member, opts) {
        let sub_id = this.bot.getRoleId(guild.id, "EVENT_SUB");
        if(sub_id == null) {
            interaction.reply("No subscriber role set").catch(logger.error)
            return;
        }
        interaction.reply({content: `<@&${sub_id}>\n${opts.description}`, allowedMentions: {roles: [sub_id]}}).catch(logger.error)
    }
}