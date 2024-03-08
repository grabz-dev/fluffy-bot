'use strict';

import Discord from 'discord.js';
import * as Bot from 'discord-bot-core';
const logger = Bot.logger;

const core = new Bot.Core({
    dbName: 'fluffy_bot',
    intents: [
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.GuildMembers,
        Discord.IntentsBitField.Flags.GuildModeration,
        Discord.IntentsBitField.Flags.GuildEmojisAndStickers,
        Discord.IntentsBitField.Flags.GuildIntegrations,
        Discord.IntentsBitField.Flags.GuildWebhooks,
        Discord.IntentsBitField.Flags.GuildInvites,
        Discord.IntentsBitField.Flags.GuildVoiceStates,
        Discord.IntentsBitField.Flags.GuildPresences,
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.GuildMessageReactions,
        Discord.IntentsBitField.Flags.GuildMessageTyping,
        Discord.IntentsBitField.Flags.DirectMessages,
        Discord.IntentsBitField.Flags.DirectMessageReactions,
        Discord.IntentsBitField.Flags.DirectMessageTyping,
        Discord.IntentsBitField.Flags.MessageContent
    ]
});

core.on('ready', bot => {
    (async () => {
        const presence = await core.getModule((await import('./src/modules/Presence.js')).default);

        setTimeout(() => {
            core.addLoop(1000 * 60 * 60, guild => {
                presence.loop(guild);
            });
        }, 5000);

    })().catch(logger.error);

    //zebraTimeout();
    /*async function zebraTimeout() {
        await zebra().catch(logger.error);

        const min = 1000 * 60 * 20;
        const max = 1000 * 60 * 360;
        const rolls = [
            Bot.Util.getRandomInt(min, max + 1),
            Bot.Util.getRandomInt(min, max + 1),
            Bot.Util.getRandomInt(min, max + 1)
        ]
        const roll = rolls.reduce((p, c) => Math.min(p, c))
        setTimeout(zebraTimeout, roll)
    }
    async function zebra() {
        const guild = await bot.client.guilds.fetch("371177798305447938")
        if(guild == null) return;
        const member = await guild.members.fetch("140225293049659392")
        if(member == null) return;

        if(member.roles.cache.get("927116553567211521")) {
            await member.roles.remove("927116553567211521", 'zebra')
            await member.roles.add("676905801323118602", 'zebra')
        }
        else if(member.roles.cache.get("676905801323118602")) {
            await member.roles.remove("676905801323118602", 'zebra')
            await member.roles.add("927116553567211521", 'zebra')
        }
    }*/

    
    rainbowTimeout();
    async function rainbowTimeout() {
        await rainbow().catch(logger.error);

        /*const min = 1000 * 60 * 60;
        const max = 1000 * 60 * 60 * 24;
        const rolls = [
            Bot.Util.getRandomInt(min, max + 1),
            Bot.Util.getRandomInt(min, max + 1),
            Bot.Util.getRandomInt(min, max + 1)
        ]
        const roll = rolls.reduce((p, c) => Math.min(p, c))*/

        setTimeout(rainbowTimeout, 1000 * 60 * 5)
    }
    async function rainbow() {
        const guild = await bot.client.guilds.fetch("371177798305447938")
        if(guild == null) return;
        const role = await guild.roles.fetch("1045808613228286105")
        if(role == null) return;

        // @ts-ignore
        await role.setColor('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, "0"))
    }
});

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // @ts-ignore
    console.dir(reason.stack);
});