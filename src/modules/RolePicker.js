
'use strict';
/** @typedef {import('discord-api-types/rest/v9').RESTPostAPIApplicationCommandsJSONBody} RESTPostAPIApplicationCommandsJSONBody */
/** @typedef {import('discord-bot-core/src/Core').Entry} Core.Entry */

import Discord from 'discord.js';
import { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from '@discordjs/builders';
import * as Bot from 'discord-bot-core';
const logger = Bot.logger;

export default class Presence extends Bot.Module {
    
    /** @param {Core.Entry} bot */
    constructor(bot) {
        super(bot);

        this.commands = ['rolepicker'];
        this.ROLES_CHANNEL = "779023303800782848"
        /** @type {{[name: string]: {id: string, name: string, emoji: string}}} */
        this.roles = {
            "z1-59": { id: "617023001476726784", name: "z1-59", emoji: ":zz_9_basic:371310618105610242"},
            "z60-180": { id: "617023258520190987", name: "z60-180", emoji: ":zz_8_common:371310618751270912"},
            "z181-229": { id: "617023417400426526", name: "z181-229", emoji: ":zz_7_rare:371310618247954433"},
            "z230-299": { id: "617023518672158731", name: "z230-299", emoji: ":zz_6_epic:371310618185039875"},
            "z300-499": { id: "617023648393461772", name: "z300-499", emoji: ":zz_5_legendary:371310618495680512"},
            "z500-700": { id: "617023773576790045", name: "z500-700", emoji: ":zz_4_magnificent:371310618512457728"},
            "U2 z1-69": { id: "617023880954904643", name: "U2 z1-69", emoji: ":zy_9_basic:371310618709590016"},
            "U2 z70-134": { id: "719165818788905000", name: "U2 z70-134", emoji: ":zy_8_common:371310618952728576"},
            "U2 z135-200": { id: "785546383943663626", name: "U2 z135-200", emoji: ":zy_7_rare:371310619158249472"},
            "U2 z201+": { id: "925443714153848873", name: "U2 z201+", emoji: ":zy_6_epic:371310618738688000"},
        }
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
        return false;
    }

    /**
     * 
     * @param {Discord.Interaction} interaction 
     */
    onInteractionCreate(interaction) {
        let guild = interaction.guild;
        let user = interaction.user;

        if(guild == null) return;

        (async () => {
            if(interaction.isButton()) {
                if(interaction.customId === "Verify") {
                    let member = await guild.members.fetch(user.id)
                    let role_id = this.bot.getRoleId(guild.id, "TRIMPS");
                    if(role_id == null) return;
                    await member.roles.add(role_id);
                    await interaction.reply({content: "Done! Enjoy access to all of this server's features.", ephemeral: true})
                    return;
                }
                else if(interaction.customId === "Sub_Event") {
                    let member = await guild.members.fetch(user.id)
                    let role_id = this.bot.getRoleId(guild.id, "EVENT_SUB");
                    if(role_id == null) return;
                    if(member.roles.cache.get(role_id) != null) {
                        await interaction.reply({content: "You are already subscribed to server events.", ephemeral: true})
                        return;
                    }
                    await member.roles.add(role_id);
                    await interaction.reply({content: "You have subscribed to server events!", ephemeral: true})
                    return;
                }
                else if(interaction.customId === "Unsub_Event") {
                    let member = await guild.members.fetch(user.id)
                    let role_id = this.bot.getRoleId(guild.id, "EVENT_SUB");
                    if(role_id == null) return;
                    if(member.roles.cache.get(role_id) == null) {
                        await interaction.reply({content: "You are not subscribed to server events.", ephemeral: true})
                        return;
                    }

                    await member.roles.remove(role_id);
                    await interaction.reply({content: "You are no longer subscribed to server events.", ephemeral: true})
                    return;
                }
            }
            else if(interaction.isStringSelectMenu()) {
                if(interaction.customId === "ProgressionRoleSelect") {

                    let roleDef = this.roles[interaction.values[0]]

                    let member = await guild.members.fetch(user.id)
                    for(let [name, role] of Array.from(member.roles.cache)) {
                        let match = Object.values(this.roles).some(v => v.id === role.id);
                        if(match && role.id != roleDef.id) {
                            await member.roles.remove(role.id)
                        }
                    }

                    if(!member.roles.cache.get(roleDef.id)) {
                        await member.roles.add(roleDef.id)
                    }

                    await interaction.reply({content: `Your current progression role is now ${roleDef.name}.`, ephemeral: true})
                    return;
                }
            }
        })().catch(logger.error);
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

        const subcommandName = interaction.options.getSubcommand();
        switch(subcommandName) {
            case 'verify': {
                const confirm = new ButtonBuilder()
                    .setCustomId('Verify')
                    .setLabel('Verify')
                    .setStyle(Discord.ButtonStyle.Primary);
                
                const row = /** @type {ActionRowBuilder<ButtonBuilder>} */(new ActionRowBuilder()
                    .addComponents(confirm));

                /** @type {Discord.APIEmbed} */
                let embed = {
                    color: 4830368,
                    title: "Member Verification",
                    description: "Click the Verify button below to verify that you have read our rules in <#371343532268716062> and would like to receive the <@&373250277110972416> role and access to all of this server's features."
                }

                let channel = interaction.guild.channels.cache.get(this.ROLES_CHANNEL)
                if(!(channel instanceof Discord.TextChannel)) return;

                channel.send({components: [row], embeds: [embed]}).catch(logger.error)
                break;
            }
            case 'progress': {
                const select = new StringSelectMenuBuilder()
                    .setCustomId('ProgressionRoleSelect')
                    .setPlaceholder('Choose your progression role.')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 1-59')
                            .setDescription('Your highest zone reached is between 1 and 59.')
                            .setValue('z1-59'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 60-180')
                            .setDescription('Your highest zone reached is between 60 and 180.')
                            .setValue('z60-180'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 181-229')
                            .setDescription('Your highest zone reached is between 181 and 229.')
                            .setValue('z181-229'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 230-299')
                            .setDescription('Your highest zone reached is between 230 and 299.')
                            .setValue('z230-299'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 300-499')
                            .setDescription('Your highest zone reached is between 300 and 499.')
                            .setValue('z300-499'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 500-700')
                            .setDescription('Your highest zone reached is between 500 and 700.')
                            .setValue('z500-700'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 1-69 [U2]')
                            .setDescription('Your highest zone reached is between 1 and 69 in Universe 2.')
                            .setValue('U2 z1-69'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 70-134 [U2]')
                            .setDescription('Your highest zone reached is between 70 and 134 in Universe 2.')
                            .setValue('U2 z70-134'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 135-200 [U2]')
                            .setDescription('Your highest zone reached is between 135 and 200 in Universe 2.')
                            .setValue('U2 z135-200'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Zone 201+ [U2]')
                            .setDescription('Your highest zone reached is 200 or higher in Universe 2.')
                            .setValue('U2 z201+'),
                    );


                

                const row = /** @type {ActionRowBuilder<StringSelectMenuBuilder>} */(new ActionRowBuilder()
                    .addComponents(select));
                    
                /** @type {Discord.APIEmbed} */
                let embed = {
                    color: 9344511,
                    title: "Highest Zone Reached",
                    description: "Choose an option below and receive a role based on your highest zone reached in Trimps! This role only gives you a color and nothing else, so you can pick whichever you feel comfortable with. To unlock extra progression channels, you must go to Channels & Roles on top of the channel list, and select them from there."
                }

                let channel = interaction.guild.channels.cache.get(this.ROLES_CHANNEL)
                if(!(channel instanceof Discord.TextChannel)) return;

                channel.send({components: [row], embeds: [embed]}).catch(logger.error)
                break;
            }
            case 'events': {
                const yes = new ButtonBuilder()
                    .setCustomId('Sub_Event')
                    .setLabel('Subscribe')
                    .setStyle(Discord.ButtonStyle.Success);

                const no = new ButtonBuilder()
                    .setCustomId('Unsub_Event')
                    .setLabel('Unsubscribe')
                    .setStyle(Discord.ButtonStyle.Danger);
                
                const row = /** @type {ActionRowBuilder<ButtonBuilder>} */(new ActionRowBuilder()
                    .addComponents(yes, no));

                /** @type {Discord.APIEmbed} */
                let embed = {
                    color: 11701577,
                    title: "Server Events",
                    description: "Press Subscribe to receive a role that may be mentioned when a social server event is being organized by one of our members."
                }

                let channel = interaction.guild.channels.cache.get(this.ROLES_CHANNEL)
                if(!(channel instanceof Discord.TextChannel)) return;

                channel.send({components: [row], embeds: [embed]}).catch(logger.error)
                break;
            }
        }
    }

    /**
     * 
     * @returns {RESTPostAPIApplicationCommandsJSONBody[]}
     */
    getSlashCommands() {
        return [
            new SlashCommandBuilder().setName('rolepicker')
                .setDescription('[Admin] Post role picker msg.')
                .setDefaultMemberPermissions('0')
                .addSubcommand(subcommand =>
                    subcommand.setName('verify')
                                .setDescription('.'))
                .addSubcommand(subcommand =>
                    subcommand.setName('progress')
                                .setDescription('.'))
                .addSubcommand(subcommand =>
                    subcommand.setName('events')
                                .setDescription('.'))
            .toJSON()
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