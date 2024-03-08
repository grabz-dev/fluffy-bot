'use strict';
/** @typedef {import('discord-bot-core/src/Core').Entry} Core.Entry */

import Discord from 'discord.js';
import * as Bot from 'discord-bot-core';
const logger = Bot.logger;

export default class Presence extends Bot.Module {
    /** @param {Core.Entry} bot */
    constructor(bot) {
        super(bot);
    }

    /** @param {Discord.Guild} guild - Current guild. */
    init(guild) {
        super.init(guild);
    }

    /** 
     * @param {Discord.Guild} guild 
     * @returns {Promise<void>}
     */
    async loop(guild) {
        logger.info("Starting routine presence check...");
        const roleId = this.bot.getRoleId(guild.id, 'PLAYING_TRIMPS');
        if(roleId == null) return;
        const role = await guild.roles.fetch(roleId);
        if(role == null) return;
        for(const member of role.members.values()) {
            if(member.presence == null) continue;
            if(!hasTrimps(member.presence)) {
                logger.info(`ROUTINE: Removing playing role from ${member.nickname ?? member.user.username}`);
                await member.roles.remove(role).catch(() => {});
                await Bot.Util.Promise.sleep(1000);
            }
        }
        logger.info("Routine presence check finished");
    }

    /**
     * 
     * @param {Discord.Presence|null} oldPresence 
     * @param {Discord.Presence} newPresence 
     */
    async onPresenceUpdate(oldPresence, newPresence) {
        if(newPresence.guild == null) return;
        if(newPresence.member == null) return;
        
        const guild = newPresence.guild;
        const member = newPresence.member;
        let roleId = this.bot.getRoleId(guild.id, 'PLAYING_TRIMPS');
        if(roleId == null) return;

        if((oldPresence != null && hasTrimps(oldPresence)) && !hasTrimps(newPresence)) {
            logger.info(`Removing playing role from ${member.nickname ?? member.user.username}`);
            member.roles.remove(roleId);
        }
        else if(hasTrimps(newPresence) && (oldPresence == null || !hasTrimps(oldPresence))) {
            logger.info(`Adding playing role to ${member.nickname ?? member.user.username}`);
            member.roles.add(roleId);
        }
    }
}

/**
 * 
 * @param {Discord.Presence} presence 
 */
function hasTrimps(presence) {
    return presence.activities.find(v => v.name === 'Trimps') != null;
}