'use strict';
/** @typedef {import('discord-api-types/rest/v9').RESTPostAPIApplicationCommandsJSONBody} RESTPostAPIApplicationCommandsJSONBody */
/** @typedef {import('discord-bot-core/src/Core').Entry} Core.Entry */
/** @typedef {import('discord-bot-core/src/structures/SQLWrapper').Query} SQLWrapper.Query */

import Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import * as Bot from 'discord-bot-core';
const logger = Bot.logger;
import Util from '../utils/Util.js'

import * as AIBrain from './Farkle/AIBrain.js';

/**
 * @typedef {object} Db.farkle_channels
 * @property {Discord.Snowflake} guild_id
 * @property {Discord.Snowflake} channel_id
 * @property {Discord.Snowflake} leaderboard_msg_id
 */

/**
 * @typedef {object} Db.farkle_servers
 * @property {number=} id
 * @property {Discord.Snowflake} guild_id
 * @property {Discord.Snowflake} user_id
 * @property {Discord.Snowflake} user_id_host
 * @property {Discord.Snowflake} channel_id
 * @property {Discord.Snowflake} message_id
 */

/**
 * @typedef {object} Db.farkle_viewers
 * @property {number=} id
 * @property {Discord.Snowflake} user_id_target
 * @property {Discord.Snowflake} user_id
 * @property {Discord.Snowflake} channel_dm_id
 */

/**
 * @typedef {object} Db.farkle_current_players
 * @property {number=} id
 * @property {number} id_current_games
 * @property {boolean} ready_status
 * @property {number} turn_order
 * @property {Discord.Snowflake} user_id
 * @property {(Discord.Snowflake|null)=} channel_dm_id
 * @property {number} total_points_banked
 * @property {number} total_points_lost
 * @property {number} total_points_skipped
 * @property {number} total_points_piggybacked_banked
 * @property {number} total_points_piggybacked_lost
 * @property {number} total_points_welfare_gained
 * @property {number} total_points_welfare_lost
 * @property {number} total_rolls
 * @property {number} total_folds
 * @property {number} total_finishes
 * @property {number} total_skips
 * @property {number} total_welfares
 * @property {number} highest_points_banked
 * @property {number} highest_points_lost
 * @property {number} highest_points_skipped
 * @property {number} highest_points_piggybacked_banked
 * @property {number} highest_points_piggybacked_lost
 * @property {number} highest_points_welfare_gained
 * @property {number} highest_points_welfare_lost
 * @property {number} highest_rolls_in_turn
 * @property {number} highest_rolls_in_turn_without_fold
 * @property {number} passive_moneys_gained
 */

/**
 * @typedef {object} Db.farkle_current_games
 * @property {number=} id
 * @property {Discord.Snowflake} guild_id
 * @property {boolean} has_started
 * @property {number} match_start_time
 * @property {number} points_goal
 * @property {Discord.Snowflake} current_player_user_id
 * @property {string} current_player_rolls
 * @property {number} current_player_points
 * @property {number} current_player_rolls_count
 * @property {number} current_player_points_piggybacked
 * @property {number} opening_turn_point_threshold
 * @property {boolean} high_stakes_variant
 * @property {boolean} current_player_high_stakes_choice
 * @property {boolean} welfare_variant
 * @property {Discord.Snowflake=} last_turn_victory_user_id
 * @property {Discord.Snowflake=} user_id_winner
 * @property {number} ai_version
 * @property {number} wager
 * @property {number} wager_pool
 */

/**
 * @typedef {object} Db.farkle_history_players
 * @property {number} id
 * @property {number} id_history_games
 * @property {Discord.Snowflake} user_id
 * @property {number} turn_order
 * @property {boolean} has_conceded
 * @property {number} total_points_banked
 * @property {number} total_points_lost
 * @property {number} total_points_skipped
 * @property {number} total_points_piggybacked_banked
 * @property {number} total_points_piggybacked_lost
 * @property {number} total_points_welfare_gained
 * @property {number} total_points_welfare_lost
 * @property {number} total_rolls
 * @property {number} total_folds
 * @property {number} total_finishes
 * @property {number} total_skips
 * @property {number} total_welfares
 * @property {number} highest_points_banked
 * @property {number} highest_points_lost
 * @property {number} highest_points_skipped
 * @property {number} highest_points_piggybacked_banked
 * @property {number} highest_points_piggybacked_lost
 * @property {number} highest_points_welfare_gained
 * @property {number} highest_points_welfare_lost
 * @property {number} highest_rolls_in_turn
 * @property {number} highest_rolls_in_turn_without_fold
 * @property {number} passive_moneys_gained
 */

/**
 * @typedef {object} Db.farkle_history_games
 * @property {number} id
 * @property {Discord.Snowflake} guild_id
 * @property {number} match_start_time
 * @property {number} match_end_time
 * @property {number} points_goal
 * @property {Discord.Snowflake} user_id_winner
 * @property {number} opening_turn_point_threshold
 * @property {boolean} high_stakes_variant
 * @property {boolean} welfare_variant
 * @property {number} ai_version
 * @property {number} wager
 * @property {number} wager_pool
 */

/**
 * @typedef {object} Db.farkle_users
 * @property {number=} id
 * @property {Discord.Snowflake} user_id
 * @property {string} skin
 * @property {number} moneys
 */

/** @typedef {"ready"|"reject"|"keep"|"finish"|"help"|"hurry"|"concede"|"new"|"continue"|"moves"|"quick_moves"|"emote"|"emote_used"} ActionType */
/** @typedef {"fold"|"welfare"|"lastturn"} GameType */

const MAX_DICE = 6;
const MONEYS_ICON = `:bone:`

const F = Object.freeze({
    matches: AIBrain.matches,
    colors: Object.freeze([
        0,         
        11460749,
        7911119,
        13016423,
        12084573,
        6512567,
        6075827,
        12693569,
        11881878,
        9718194,
        1151377
    ]),
    /** @type {Object.<string, Object.<number, string>>} */
    skins: Object.freeze({
        braille: {
            1: "⡀",
            2: "⣀",
            3: "⣄",
            4: "⣤",
            5: "⣦",
            6: "⣶"
        },
        keycaps: {
            1: "1️⃣",
            2: "2️⃣",
            3: "3️⃣",
            4: "4️⃣",
            5: "5️⃣",
            6: "6️⃣"
        },
        dice: {
            1: "⚀",
            2: "⚁",
            3: "⚂",
            4: "⚃",
            5: "⚄",
            6: "⚅"
        },
        digits: {
            1: "1",
            2: "2",
            3: "3",
            4: "4",
            5: "5",
            6: "6"
        },
        chinese: {
            1: "一",
            2: "二",
            3: "三",
            4: "四",
            5: "五",
            6: "六"
        }
    }),
    skinsSlashChoices: [
        {name: '⡀⣀⣄⣤⣦⣶', value: 'braille'},
        {name: 'Keycap emoji, :one:, :two: etc.', value: 'keycaps'},
        {name: '⚀⚁⚂⚃⚄⚅', value: 'dice'},
        {name: '123456', value: 'digits'},
        {name: '一二三四五六', value: 'chinese'}
    ],
    currency: "\💎", //₿ ƒ
    startingCurrency: 1
});



export default class Farkle extends Bot.Module {
    /** @param {Core.Entry} bot */
    constructor(bot) {
        super(bot);
        this.commands = ['f', 'mod_f'];
    }
    
    /** @param {Discord.Guild} guild - Current guild. */
    init(guild) {
        super.init(guild);

        (async () => {
            await this.bot.sql.transaction(async query => {
                await query(`CREATE TABLE IF NOT EXISTS farkle_channels (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, guild_id TINYTEXT NOT NULL, channel_id TINYTEXT NOT NULL, leaderboard_msg_id TINYTEXT)`);

                await query(`CREATE TABLE IF NOT EXISTS farkle_current_players (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, id_current_games BIGINT UNSIGNED NOT NULL, ready_status BOOLEAN NOT NULL, turn_order SMALLINT NOT NULL, user_id TINYTEXT NOT NULL, channel_dm_id TINYTEXT, total_points_banked SMALLINT UNSIGNED NOT NULL, total_points_lost SMALLINT UNSIGNED NOT NULL, total_points_skipped SMALLINT UNSIGNED NOT NULL, total_points_piggybacked_banked SMALLINT UNSIGNED NOT NULL, total_points_piggybacked_lost SMALLINT UNSIGNED NOT NULL, total_points_welfare_gained SMALLINT UNSIGNED NOT NULL, total_points_welfare_lost SMALLINT UNSIGNED NOT NULL, total_rolls INT UNSIGNED NOT NULL, total_folds INT UNSIGNED NOT NULL, total_finishes INT UNSIGNED NOT NULL, total_skips INT UNSIGNED NOT NULL, total_welfares INT UNSIGNED NOT NULL, highest_points_banked SMALLINT UNSIGNED NOT NULL, highest_points_lost SMALLINT UNSIGNED NOT NULL, highest_points_skipped SMALLINT UNSIGNED NOT NULL, highest_points_piggybacked_banked SMALLINT UNSIGNED NOT NULL, highest_points_piggybacked_lost SMALLINT UNSIGNED NOT NULL, highest_points_welfare_gained SMALLINT UNSIGNED NOT NULL, highest_points_welfare_lost SMALLINT UNSIGNED NOT NULL, highest_rolls_in_turn INT UNSIGNED NOT NULL, highest_rolls_in_turn_without_fold INT UNSIGNED NOT NULL, passive_moneys_gained SMALLINT UNSIGNED NOT NULL);`);
                await query(`CREATE TABLE IF NOT EXISTS farkle_current_games (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, guild_id TINYTEXT NOT NULL, has_started BOOLEAN NOT NULL, match_start_time BIGINT NOT NULL, points_goal SMALLINT UNSIGNED NOT NULL, current_player_user_id TINYTEXT NOT NULL, current_player_rolls TINYTEXT NOT NULL, current_player_points SMALLINT UNSIGNED NOT NULL, current_player_rolls_count INT UNSIGNED NOT NULL, current_player_points_piggybacked INT UNSIGNED NOT NULL, opening_turn_point_threshold SMALLINT UNSIGNED NOT NULL, high_stakes_variant BOOLEAN NOT NULL, current_player_high_stakes_choice BOOLEAN NOT NULL, welfare_variant BOOLEAN NOT NULL, last_turn_victory_user_id TINYTEXT, user_id_winner TINYTEXT, ai_version TINYINT NOT NULL, wager INT UNSIGNED NOT NULL, wager_pool INT UNSIGNED NOT NULL);`);
            
                await query(`CREATE TABLE IF NOT EXISTS farkle_history_players (id BIGINT UNSIGNED PRIMARY KEY, id_history_games BIGINT UNSIGNED NOT NULL, user_id TINYTEXT NOT NULL, turn_order SMALLINT NOT NULL, has_conceded BOOLEAN NOT NULL, total_points_banked SMALLINT UNSIGNED NOT NULL, total_points_lost SMALLINT UNSIGNED NOT NULL, total_points_skipped SMALLINT UNSIGNED NOT NULL, total_points_piggybacked_banked SMALLINT UNSIGNED NOT NULL, total_points_piggybacked_lost SMALLINT UNSIGNED NOT NULL, total_points_welfare_gained SMALLINT UNSIGNED NOT NULL, total_points_welfare_lost SMALLINT UNSIGNED NOT NULL, total_rolls INT UNSIGNED NOT NULL, total_folds INT UNSIGNED NOT NULL, total_finishes INT UNSIGNED NOT NULL, total_skips INT UNSIGNED NOT NULL, total_welfares INT UNSIGNED NOT NULL, highest_points_banked SMALLINT UNSIGNED NOT NULL, highest_points_lost SMALLINT UNSIGNED NOT NULL, highest_points_skipped SMALLINT UNSIGNED NOT NULL, highest_points_piggybacked_banked SMALLINT UNSIGNED NOT NULL, highest_points_piggybacked_lost SMALLINT UNSIGNED NOT NULL, highest_points_welfare_gained SMALLINT UNSIGNED NOT NULL, highest_points_welfare_lost SMALLINT UNSIGNED NOT NULL, highest_rolls_in_turn INT UNSIGNED NOT NULL, highest_rolls_in_turn_without_fold INT UNSIGNED NOT NULL, passive_moneys_gained SMALLINT UNSIGNED NOT NULL);`);
                await query(`CREATE TABLE IF NOT EXISTS farkle_history_games (id BIGINT UNSIGNED PRIMARY KEY, guild_id TINYTEXT NOT NULL, match_start_time BIGINT NOT NULL, match_end_time BIGINT NOT NULL, points_goal SMALLINT UNSIGNED NOT NULL, user_id_winner TINYTEXT NOT NULL, opening_turn_point_threshold SMALLINT UNSIGNED NOT NULL, high_stakes_variant BOOLEAN NOT NULL, welfare_variant BOOLEAN NOT NULL, ai_version TINYINT NOT NULL, wager INT UNSIGNED NOT NULL, wager_pool INT UNSIGNED NOT NULL);`);
            
                await query(`CREATE TABLE IF NOT EXISTS farkle_servers (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, guild_id TINYTEXT NOT NULL, user_id TINYTEXT NOT NULL, user_id_host TINYTEXT NOT NULL, channel_id TINYTEXT NOT NULL, message_id TINYTEXT NOT NULL)`)
                await query(`CREATE TABLE IF NOT EXISTS farkle_users (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id TINYTEXT NOT NULL, skin TINYTEXT NOT NULL, moneys INT UNSIGNED NOT NULL)`);
                await query(`CREATE TABLE IF NOT EXISTS farkle_viewers (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id_target TINYTEXT NOT NULL, user_id TINYTEXT NOT NULL, channel_dm_id TINYTEXT NOT NULL)`);

                /** @type {Db.farkle_current_players[]} */
                var docCPs = (await query(`SELECT * FROM farkle_current_players cp JOIN farkle_current_games cg ON cp.id_current_games = cg.id WHERE cg.guild_id = ${guild.id}`)).results;

                /** @type {Db.farkle_viewers[]} */
                var docVs = (await query(`SELECT v.id, v.user_id_target, v.user_id, v.channel_dm_id FROM farkle_viewers v JOIN farkle_current_players cp ON v.user_id_target = cp.user_id JOIN farkle_current_games cg ON cp.id_current_games = cg.id WHERE cg.guild_id = ${guild.id}`)).results;

                /** @type {(Db.farkle_current_players|Db.farkle_viewers)[]} */
                var docCPVs = [];
                docCPVs = docCPVs.concat(docCPs, docVs);

                for(let attendee of docCPVs) {
                    let member = await guild.members.fetch(attendee.user_id);
                    if(!member) return; //TODO
                    if(attendee.channel_dm_id != null) await member.createDM();
                }
            }).catch(logger.error);

            await this.bot.sql.transaction(async query => {
                await query('ALTER TABLE farkle_current_players MODIFY COLUMN channel_dm_id TINYTEXT').catch(() => {});
                await query('ALTER TABLE farkle_current_games ADD COLUMN ai_version TINYINT NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_history_games ADD COLUMN ai_version TINYINT NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_servers ADD COLUMN channel_id TINYTEXT NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_servers ADD COLUMN message_id TINYTEXT NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_current_games ADD COLUMN last_turn_victory_user_id TINYTEXT').catch(() => {});
                await query('ALTER TABLE farkle_current_games ADD COLUMN user_id_winner TINYTEXT').catch(() => {});

                await query('ALTER TABLE farkle_current_games ADD COLUMN wager INT UNSIGNED NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_history_games ADD COLUMN wager INT UNSIGNED NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_current_games ADD COLUMN wager_pool INT UNSIGNED NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_history_games ADD COLUMN wager_pool INT UNSIGNED NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_current_players ADD COLUMN passive_moneys_gained SMALLINT UNSIGNED NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_history_players ADD COLUMN passive_moneys_gained SMALLINT UNSIGNED NOT NULL').catch(() => {});
                await query('ALTER TABLE farkle_users ADD COLUMN moneys INT UNSIGNED NOT NULL').catch(() => {});

                await query('ALTER TABLE farkle_channels ADD COLUMN leaderboard_msg_id TINYTEXT').catch(() => {});

                if(guild.client.user) {
                    /** @type {Db.farkle_current_games[]} */
                    let docCGs = (await query(`SELECT * FROM farkle_current_games WHERE current_player_user_id = ${guild.client.user.id}`)).results;
                    for(let docCG of docCGs) {
                        let docCPs = (await query(`SELECT * FROM farkle_current_players WHERE id_current_games = ${docCG.id}`)).results;
                        this._onNewTurn(docCG, docCPs);
                    }
                }
            }).catch(logger.error);

            await this.bot.sql.transaction(async query => {
                /** @type {Db.farkle_channels} */
                let resultChannels = (await query(`SELECT * FROM farkle_channels WHERE guild_id = ?`, [guild.id])).results[0];
                if(resultChannels) this.cache.set(guild.id, "farkle_channel_id", resultChannels.channel_id);
            }).catch(logger.error);

            await this.bot.sql.transaction(async query => {
                let botId = this.bot.client.user?.id;
                if(botId == null) {
                    logger.error("[FARKLE] Could not initialize client user!!");
                    return
                }
                /** @type {Db.farkle_users|undefined} */
                let docU = (await query(`SELECT * FROM farkle_users WHERE user_id = ${botId}`)).results[0];
                if(!docU) {
                    /** @type {Db.farkle_users} */
                    let user = {
                        user_id: botId,
                        skin: "braille",
                        moneys: 0
                    }
                    await query(Bot.Util.SQL.getInsert(user, "farkle_users"));
                }
            }).catch(logger.error)

            await this.bot.sql.transaction(async query => {
                await updateLeaderboard.call(this, this.bot.client, query, guild.id);
            }).catch(logger.error)
        })()
    }

    /** @param {Discord.Message|{user: Discord.User, msg: string, gameId: number}} message - The message that was sent. */
    onMessageDM(message) {
        (async () => {
            if(message instanceof Discord.Message) {
                await this.play({ author: message.author, content: message.content.toLowerCase(), client: message.author.client, gameId: null });
            }
            else {
                await this.play({ author: message.user, content: message.msg.toLowerCase(), client: message.user.client, gameId: message.gameId });
            }
        })();
    }

    /**
     * 
     * @param {{author: Discord.User, content: string, client: Discord.Client, gameId: number?}} message 
     * @returns 
     */
    async play(message) {
        const user = message.author;
        const msg = message.content.toLowerCase();

        if(message.client.user?.id !== user.id) {
            let antilag = this.cache.get("0", `antilag${user.id}`);
            if(antilag && Date.now() - antilag < 500) {
                return;
            }
            this.cache.set("0", `antilag${user.id}`, Date.now());
        }
        
        /** @type {""|ActionType|GameType} */
        let type = "";
        type = msg === "r" ? "ready" : type;
        type = msg === "n" ? "new" : type;
        type = msg === "c" ? "continue" : type;
        type = msg === "m" ? "quick_moves" : type;
        type = msg === "e" ? "emote" : type;
        type = msg === "gl" ? "emote_used" : type;
        type = msg === "wp" ? "emote_used" : type;

        type = msg.indexOf("k") > -1 ? "keep" : type;
        type = msg.indexOf("f") > -1 ? "finish" : type;
        
        type = msg.indexOf("ready") > -1 ? "ready" : type;
        type = msg.indexOf("reject") > -1 ? "reject" : type;
        type = msg.indexOf("keep") > -1 ? "keep" : type;
        type = msg.indexOf("finish") > -1 ? "finish" : type;
        type = msg.indexOf("new") > -1 ? "new" : type;
        type = msg.indexOf("continue") > -1 ? "continue" : type;
        type = msg.indexOf("help") > -1 ? "help" : type;
        type = msg.indexOf("hurry") > -1 ? "hurry" : type;
        type = msg.indexOf("concede") > -1 ? "concede" : type;
        type = msg.indexOf("move") > -1 ? "moves" : type;
        type = msg.indexOf("moves") > -1 ? "moves" : type;
        type = msg.indexOf("emote") > -1 ? "emote" : type;
        type = msg.indexOf("thanks") > -1 ? "emote_used" : type;
        type = (msg.indexOf("well") > -1 && msg.indexOf("played") > -1) ? "emote_used" : type;
        type = msg.indexOf("wow") > -1 ? "emote_used" : type;
        type = msg.indexOf("oops") > -1 ? "emote_used" : type;
        type = msg.indexOf("taunt") > -1 ? "emote_used" : type;
        type = msg.indexOf("good luck") > -1 ? "emote_used" : type;

        if(type === "") return;

        /** @type { { type: ActionType, updateCurrentMatch: boolean, gameEnded: boolean } } */
        const state = {
            type: type,
            updateCurrentMatch: false,
            gameEnded: false,
        }

        await this.bot.sql.transaction(async query => {
            /** @type {Db.farkle_current_players|undefined} */
            var _docCP = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${user.id}${message.gameId != null ? ` AND id_current_games = ${message.gameId}` : ''} FOR UPDATE`)).results[0];
            if(!_docCP) return;

            /** @type {Db.farkle_current_players[]} */
            var docCPs = (await query(`SELECT * FROM farkle_current_players WHERE id_current_games = ${_docCP.id_current_games} FOR UPDATE`)).results;
            var _docCP = docCPs.find(v => v.user_id === user.id);
            if(!_docCP) return;

            var docCP = _docCP;

            /** @type {Db.farkle_current_games} */
            var docCG = (await query(`SELECT * FROM farkle_current_games WHERE id = ${docCP.id_current_games} FOR UPDATE`)).results[0];
            if(!docCG) return;

            /** @type {Db.farkle_viewers[]} */
            var docVs = (await query(`SELECT v.id, v.user_id_target, v.user_id, v.channel_dm_id FROM farkle_viewers v JOIN farkle_current_players cp ON v.user_id_target = cp.user_id WHERE cp.id_current_games = ${docCG.id} FOR UPDATE`)).results;

            /** @type {(Db.farkle_current_players|Db.farkle_viewers)[]} */
            var docCPVs = [];
            docCPVs = docCPVs.concat(docCPs, docVs);

            let detectedEmote = '';
            if(msg.indexOf("thanks") > -1) {
                detectedEmote = 'Thanks';
            }
            else if(msg === "wp" || (msg.indexOf("well") > -1 && msg.indexOf("played") > -1)) {
                detectedEmote = 'Well played';
            }
            else if(msg.indexOf("wow") > -1) {
                detectedEmote = 'Wow';
            }
            else if(msg.indexOf("oops") > -1) {
                detectedEmote = 'Oops';
            }
            else if(msg.indexOf("taunt") > -1) {
                let options = [
                    'Hope you like your next triple two!',
                    'Farkle!',
                    '300 points in the bank, add one more... 0 points in the bank.'
                ]

                detectedEmote = options[Bot.Util.getRandomInt(0, options.length)]
            }
            else if(msg === "gl" || msg.indexOf("good luck") > -1) {
                detectedEmote = 'Good luck';
            }

            if(detectedEmote.length > 0) {
                let emotestagger = this.cache.get("0", `emotestagger_${user.id}`);
                if(emotestagger && Date.now() - emotestagger < 10000) {
                    return;
                }
                this.cache.set("0", `emotestagger_${user.id}`, Date.now());

                let embed = getEmbedUser(docCG, docCPs, false, true)
                embed.color = F.colors[docCP.turn_order];
                embed.description += `<@${docCP.user_id}> says: ${detectedEmote}`;
                for(let docCPV of docCPVs) {
                    await sendDM(user.client, docCPV.user_id, docCPV, embed);
                }
            }
            else if(type === "help") {
                if(docCG.current_player_user_id.length === 0)
                    return;

                var embed = getEmbedBlank();

                //if(docCP.user_id === docCG.current_player_user_id)
                embed.description = `The game is played by scoring combos of dice each round, then finishing your turn and banking your points before you lose them.\n\nTo score some dice and continue your turn rolling the remaining dice, we use \`keep\` or \`k\`, e.g. \`k111\` scores a triplet of 1's and continues your turn. If no scoring dice are rolled on the next turn, you lose all your scored points this round.\n\nTo score some dice and end your turn, banking your scored points and moving on to the next player, we use \`finish\` or \`f\`, e.g. \`f15222\` scores a single 1, a single 5, and a triplet of 2's, and ends your turn.\n\n* If you are the current player, type \`moves\` to get a hint what combos you can score on your current turn.\n* If you are not the current player, type \`hurry\` to put the current player on a 90 second timer until their next action, or they will lose their turn.\n* Type \`concede\` to drop out of the match.`

                await sendDM(user.client, docCP.user_id, docCP, embed);
                return;
            }
            else if(type === "emote") {
                var embed = getEmbedBlank();
                embed.description = "To send a message to other players, type one of the phrases below. You can omit letter casing and spaces. Emotes have a 10 second cooldown.\n"
                embed.description += "`Thanks` • `Well played` • `Good luck` • `Wow` • `Oops` • `Taunt`";
                await sendDM(user.client, docCP.user_id, docCP, embed);
            }
            else if(type === "moves" || type === "quick_moves") {
                let docU = (await query(`SELECT * FROM farkle_users WHERE user_id = ${docCP.user_id}`)).results[0];

                var embed = getEmbedBlank();

                if(type === "moves") embed.description = "You can make the following moves:\n\n"

                if(docCP.user_id !== docCG.current_player_user_id)
                    return;

                /** @type {number[]} */
                let rolls = JSON.parse(docCG.current_player_rolls)

                /** @type {number[][]} */
                let allRollsCombinations = []

                for(let i = 1; i <= rolls.length; i++) {
                    allRollsCombinations.push(...getCombinations(rolls.slice(), i))
                }

                /**
                 * @type {{match: number[], combo: string[], points: number}[]}
                 */
                let finalResult = []

                for(let combination of allRollsCombinations) {
                    let resultPoints = 0;
                    /** @type {number[]} */
                    let resultMatchArr = [];
                    /** @type {string[]} */
                    let resultComboArr = [];
                    let skin = F.skins[docU.skin];

                    for(let i = 0; i < F.matches.length; i++) {
                        let matches = F.matches[i].m;
                        let isMatch = true;
                        while(isMatch) {
                            isMatch = Util.arrayValuesMatchUniquely(matches.slice(), combination.slice())
                            if(isMatch) {
                                resultMatchArr.push(...matches)
                                resultComboArr.push(`${matches.map(v => skin[v]).join('')} for ${F.matches[i].p} points`)
                                resultPoints += F.matches[i].p;

                                //delete from combination
                                for(let j = 0; j < matches.length; j++) {
                                    let index = combination.findIndex(v => v === matches[j])
                                    if(index > -1) combination.splice(index, 1)
                                }
                            }
                        }
                    }

                    resultMatchArr.sort()

                    if(finalResult.some(v => v.combo.join('') === resultComboArr.join('') && v.match.join('') === resultMatchArr.join('') && v.points === resultPoints)) {
                        //pass
                    }
                    else if(resultPoints > 0) {
                        finalResult.push({
                            combo: resultComboArr,
                            match: resultMatchArr,
                            points: resultPoints
                        })
                    }
                }

                finalResult.sort((a, b) => b.points - a.points);

                for(let r of finalResult) {
                    embed.description += `\`k${r.match.join("")}\` or \`f${r.match.join("")}\` - score ${r.points} points.\n> ${r.combo.join(" plus ")}\n`
                }

                if(type === "moves") {
                    embed.description += `\nUsing \`k\` (or \`keep\`) will score the chosen dice, and continue your turn by rolling the remaining dice. You may lose all points scored this round, if no scoring dice are rolled next turn. If you score all dice, you earn *hot dice*, letting you roll all six dice again.\nUsing \`f\` (or \`finish\`) will score the chosen dice, and end your turn, banking all of your points scored this round.\nYou can use the \`m\` command to skip this extra description when checking available moves.`
                }

                await sendDM(user.client, docCP.user_id, docCP, embed);
                return;
            }
            else if(type === "hurry") {
                if(this.cache.get("0", `hurry${docCG.id}`) != null)
                    return;
                if(docCG.current_player_user_id.length === 0)
                    return;
                if(docCP.user_id === docCG.current_player_user_id)
                    return;
                
                for(let attendee of docCPVs) {
                    let embed = getEmbedBlank();
                    embed.description = `<@${docCP.user_id}> wants to hurry. <@${docCG.current_player_user_id}> has 90 seconds to make a move.`;
                    await sendDM(user.client, attendee.user_id, attendee, embed);
                }

                var timeout = setTimeout(() => {
                    this.bot.sql.transaction(async query => {
                        let playerCurrent = docCPs.find(v=>v.user_id===docCG.current_player_user_id);
                        if(!playerCurrent) {
                            this.cache.set("0", `hurry${docCG.id}`, undefined);
                            return;
                        }
                        playerCurrent.total_skips++;
                        playerCurrent.total_points_skipped += docCG.current_player_points;
                        if(docCG.current_player_points > playerCurrent.highest_points_skipped)
                            playerCurrent.highest_points_skipped = docCG.current_player_points;
                        
                        let player = docCG.current_player_user_id;
                        /** @type { { type: "ready"|"reject"|"keep"|"finish"|"help"|"hurry"|"concede", updateCurrentMatch: boolean, gameEnded: boolean } } */
                        let state = {
                            type: "hurry",
                            updateCurrentMatch: true,
                            gameEnded: false
                        }

                        if(!(await turn.call(this, message.client, docCG, docCPs, docVs, query, "hurry", state, {}))) {
                            await roll.call(this, message.client, { type: "hurry", keep: [], points: docCG.current_player_points, player: player }, docCG, docCPs, docVs, docCPVs, query, state);
                        }
                        await commit.call(this, state, docCG, docCP, docCPs, query, message.client);

                        this.cache.set("0", `hurry${docCG.id}`, undefined);
                    }).catch(logger.error);
                }, 1000*90);

                this.cache.set("0", `hurry${docCG.id}`, {
                    timeout: timeout
                });

                return;
            }
            else if(type === "ready") {
                if(docCG.current_player_user_id.length > 0)
                    return;

                if(!docCP.ready_status) {
                    for(let attendee of docCPVs) {
                        let embed = getEmbedBlank();
                        embed.description = `${user} is ready to play!`;
                        await sendDM(user.client, attendee.user_id, attendee, embed);
                    }

                    docCP.ready_status = true;
                    await query(`UPDATE farkle_current_players SET ready_status = ${docCP.ready_status} WHERE user_id = ${docCP.user_id}`);
                }

                let ready = !docCPs.some(v=>!v.ready_status);
                if(!ready) return;

                let embed = getEmbedBlank();
                embed.description = `Everyone is ready, and the game begins!\n\n`;
                
                if(docCG.wager > 0) {
                    for(let player of docCPs) {
                        let wager = docCG.wager;
                        await query(`UPDATE farkle_users SET moneys = moneys - ${wager} WHERE user_id = ${player.user_id}`);
                        await query(`UPDATE farkle_current_games SET wager_pool = wager_pool + ${wager} WHERE id = ${docCG.id}`);
                        embed.description += `${MONEYS_ICON} -${docCG.wager} <@${player.user_id}>\n`;
                    }
                }

                for(let attendee of docCPVs) {
                    await sendDM(user.client, attendee.user_id, attendee, embed);
                }

                await Bot.Util.Promise.sleep(2500);

                await decide.call(this, message.client, docCG, docCP, docCPs, docCPVs);
                await roll.call(this, message.client, { type: null, keep: [], points: 0, player: "" }, docCG, docCPs, docVs, docCPVs, query, state);
                state.updateCurrentMatch = true;
            }
            else if(type === "concede") {
                if(docCG.current_player_user_id.length === 0)
                    return;
                
                for(let attendee of docCPVs) {
                    let embed = getEmbedBlank();
                    embed.description = `<@${docCP.user_id}> has conceded the match.`;
                    await sendDM(user.client, attendee.user_id, attendee, embed);
                }

                if(docCPs.length === 2) {
                    if(docCP.user_id === docCG.current_player_user_id) {
                        await turn.call(this, message.client, docCG, docCPs, docVs, query, "concede", state, null);
                    }
                    await end.call(this, message.client, { type: "concede", keep: [], points: 0, player: docCP.user_id }, docCG, docVs, docCPs, query);
                    state.gameEnded = true;
                }
                else {
                    if(docCP.user_id === docCG.current_player_user_id) {
                        let player = docCG.current_player_user_id;
                        if(!(await turn.call(this, message.client, docCG, docCPs, docVs, query, "concede", state, {}))) {
                            await roll.call(this, message.client, { type: "concede", keep: [], points: 0, player: player }, docCG, docCPs, docVs, docCPVs, query, state);
                        }
                        state.updateCurrentMatch = true;
                    }
                    
                    let to = docCP.turn_order;
                    while(true) {
                        to++;
                        /** @type {Db.farkle_current_players|undefined} */
                        let player = docCPs.find(v => v.turn_order === to);
                        if(!player) break;
                        player.turn_order--;
                    }
                }
            }
            else if(type === "reject") {
                if(docCG.current_player_user_id.length > 0)
                    return;

                for(let attendee of docCPVs) {
                    let embed = getEmbedBlank();
                    embed.description = `<@${user.id}> does not want to play. Match cancelled.`;
                    await sendDM(user.client, attendee.user_id, attendee, embed);
                }
            }
            else if(type === "keep" || type === "finish" || type === "continue" || type === "new") {
                if(docCG.current_player_user_id.length === 0)
                    return;
                if(docCG.current_player_user_id !== docCP.user_id) {
                    await sendDM(user.client, docCP.user_id, docCP, `It's not your turn yet! Waiting on <@${docCG.current_player_user_id}>.`);
                    return;
                }

                if(type === "keep" || type === "finish") {
                    if(docCG.current_player_high_stakes_choice)
                        return;

                    var temp = msg.replace(/[^0-9]/g, "").split("");
                    /** @type {number[]} */
                    let keep = [];
                    for(let i = 0; i < temp.length; i++) {
                        let number = Math.floor(Number(temp[i]));
                        if(!Number.isNaN(number) && number >= 1 && number <= 6)
                            keep.push(number);
                    }

                    if(!getValidKeep(JSON.parse(docCG.current_player_rolls), keep)) {
                        await sendDM(user.client, docCP.user_id, docCP, "Selected dice do not match the rolls. Type `moves` for a hint.");
                        return;
                    }

                    let rolls = JSON.parse(docCG.current_player_rolls);
                    let points = processFarkleKeep(rolls, [...keep]);
                    docCG.current_player_rolls = JSON.stringify(rolls);

                    if(points === 0) {
                        await sendDM(user.client, docCP.user_id, docCP, "This keep is invalid. Type `moves` for a hint.");
                        return;
                    }

                    let totalPoints = points + docCG.current_player_points;
                    if(type === "finish" && docCP.total_points_banked === 0 && totalPoints < docCG.opening_turn_point_threshold) {
                        await sendDM(user.client, docCP.user_id, docCP, `You cannot finish your opening turn with less than ${docCG.opening_turn_point_threshold} points. This finish would bank ${totalPoints}.`);
                        return;
                    }

                    let hurry = this.cache.get("0", `hurry${docCG.id}`);
                    if(hurry) {
                        clearTimeout(hurry.timeout);
                        this.cache.set("0", `hurry${docCG.id}`, undefined);
                    }

                    if(docCG.welfare_variant && totalPoints + docCP.total_points_banked > docCG.points_goal) {
                        docCP.total_welfares++;
                        state.updateCurrentMatch = true;

                        let currentPlayer = docCG.current_player_user_id;
                        await welfare.call(this, message.client, { type: type, keep: keep, points: points, player: currentPlayer }, docCG, docCPs, docCPVs, query);
                        type = "welfare";

                        let lowestBankedPointsCurrently = docCPs.reduce((acc, loc) => acc < loc.total_points_banked ? acc : loc.total_points_banked, Infinity);
                        //Furthest in turn order
                        let leastPointsPlayer = (() => {
                            //players sorted descending
                            let d = docCPs.slice().sort((a, b) => b.turn_order - a.turn_order);
                            //rotate array so that it is sorted from players furthest to closest in turn order, with current player being first
                            d.unshift.apply(d, d.splice(d.findIndex(v => v.turn_order === docCP.turn_order), d.length));
                            //find the nearest player in the array which has the lowest points banked
                            d.splice(0, 1);
                            return d.find(v => v.total_points_banked === lowestBankedPointsCurrently);
                        })();

                        //only give out welfare points if the player with the least amount of points is not the current player
                        if(leastPointsPlayer != null) {
                            leastPointsPlayer.total_points_banked += totalPoints;
                            leastPointsPlayer.total_points_welfare_gained += totalPoints;
                            docCP.total_points_welfare_lost += totalPoints;
                            if(totalPoints > leastPointsPlayer.highest_points_welfare_gained)
                                leastPointsPlayer.highest_points_welfare_gained = totalPoints;
                            if(totalPoints > docCP.highest_points_welfare_lost)
                                docCP.highest_points_welfare_lost = totalPoints;

                            if(leastPointsPlayer.total_points_banked >= docCG.points_goal) {
                                while(leastPointsPlayer.user_id !== docCG.current_player_user_id) await turn.call(this, message.client, docCG, docCPs, docVs, query, "welfare", state, null);
                                await end.call(this, message.client, { type: "welfare", keep: keep, points: totalPoints, bank: leastPointsPlayer.total_points_banked, player: currentPlayer, targetPlayer: leastPointsPlayer.user_id }, docCG, docVs, docCPs, query);
                                state.gameEnded = true;
                                await commit.call(this, state, docCG, docCP, docCPs, query, message.client);
                                return;
                            }
                        }
                        
                        await turn.call(this, message.client, docCG, docCPs, docVs, query, "welfare", state, null);
                        await roll.call(this, message.client, { type: "welfare", keep: keep, points: totalPoints, bank: leastPointsPlayer == null ? 0 : leastPointsPlayer.total_points_banked, player: currentPlayer, targetPlayer: leastPointsPlayer == null ? undefined: leastPointsPlayer.user_id }, docCG, docCPs, docVs, docCPVs, query, state);
                        await commit.call(this, state, docCG, docCP, docCPs, query, message.client);
                        return;
                    }
                    //welfare return ends here

                    docCG.current_player_points += points;

                    if(type === "keep") {
                        let player = docCG.current_player_user_id;
                        await roll.call(this, message.client, { type: "keep", keep: keep, points: points, player: player }, docCG, docCPs, docVs, docCPVs, query, state);
                        state.updateCurrentMatch = true;
                    }
                    else if(type === "finish") {
                        docCP.total_points_banked += docCG.current_player_points;
                        docCP.total_points_piggybacked_banked += docCG.current_player_points_piggybacked;
                        if(docCG.current_player_points > docCP.highest_points_banked)
                            docCP.highest_points_banked = docCG.current_player_points;
                        if(docCG.current_player_points_piggybacked > docCP.highest_points_piggybacked_banked)
                            docCP.highest_points_piggybacked_banked = docCG.current_player_points_piggybacked;
                        docCP.total_finishes++;

                        if(docCG.current_player_rolls_count > docCP.highest_rolls_in_turn_without_fold)
                            docCP.highest_rolls_in_turn_without_fold = docCG.current_player_rolls_count;

                        let player = docCG.current_player_user_id;
                        let points = docCG.current_player_points;
                        let bank = docCP.total_points_banked;
                        const goalReached = docCP.total_points_banked >= docCG.points_goal;

                        //Do not do last turn thing if welfare variant
                        if(!docCG.welfare_variant) {
                            if(goalReached && docCG.last_turn_victory_user_id == null) 
                                docCG.last_turn_victory_user_id = docCP.user_id;
                        }

                        if(docCG.last_turn_victory_user_id == null && docCP.total_points_banked >= docCG.points_goal) {
                            await end.call(this, message.client, { type: "finish", keep: keep, points: points, bank: bank, player: player }, docCG, docVs, docCPs, query);
                            state.gameEnded = true;
                        }
                        else {
                            if(await turn.call(this, message.client, docCG, docCPs, docVs, query, "finish", state, { keep: keep, points: points, bank: bank, player: player })) {
                                //do nothing
                            }
                            else if(docCG.high_stakes_variant)
                                await highstakes.call(this, message.client, { type: "finish", keep: keep, points: points, bank: bank, player: player }, docCG, docCPs, docCPVs, query);
                            else
                                await roll.call(this, message.client, { type: "finish", keep: keep, points: points, bank: bank, player: player }, docCG, docCPs, docVs, docCPVs, query, state);
                        }

                        state.updateCurrentMatch = true;
                    }
                }
                else if(type === "new" || type === "continue") {
                    if(!docCG.current_player_high_stakes_choice)
                        return;

                    docCG.current_player_high_stakes_choice = false;

                    if(type === "new") {
                        docCG.current_player_points = 0;
                        docCG.current_player_rolls = "[]";
                    }
                    else if(type === "continue") {
                        docCG.current_player_points_piggybacked = docCG.current_player_points;
                    }

                    await roll.call(this, message.client, { type: type, keep: [], points: docCG.current_player_points, bank: docCP.total_points_banked, player: docCG.current_player_user_id }, docCG, docCPs, docVs, docCPVs, query, state);
                    state.updateCurrentMatch = true;
                }
            }

            await commit.call(this, state, docCG, docCP, docCPs, query, message.client);

            if(type === "ready" || state.gameEnded) {
                await updateLeaderboard.call(this, this.bot.client, query, docCG.guild_id);
            }
        }).catch(logger.error);
    }

    /**
     * 
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @returns {boolean}
     */
    interactionPermitted(interaction, guild, member) {
        if(!interaction.isChatInputCommand()) return false;

        const subcommandName = interaction.options.getSubcommand();
        switch(subcommandName) {
        case 'solo':
        case 'host':
        case 'leave':
        case 'join':
        case 'start':
        case 'skin':
        case 'games':
        case 'profile':
        case 'spectate':
        case 'rules': {
            return true;
        }
        case 'setchannel': {
            const roleId = this.bot.getRoleId(guild.id, "MODERATOR");
            if(roleId == null) return false;
            if(member.roles.cache.has(roleId)) return true;
            return false;
        }
        }
        return false;
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

        if(subcommandName != 'setchannel') {
            let fChannelId = this.cache.get(guild.id, 'farkle_channel_id');
            if(channel.id !== fChannelId) {
                await interaction.reply({ content: `You can only use this command in the ${fChannelId == null ? 'Farkle' : `<#${fChannelId}>`} channel.`, ephemeral: true });
                return;
            };
        }

        await this.bot.sql.transaction(async query => {
            /** @type {Db.farkle_users|undefined} */
            let docU = (await query(`SELECT * FROM farkle_users WHERE user_id = ${member.id}`)).results[0];
            if(!docU) {
                /** @type {Db.farkle_users} */
                let user = {
                    user_id: member.id,
                    skin: "braille",
                    moneys: 0
                }
                await query(Bot.Util.SQL.getInsert(user, "farkle_users"));
            }
        })

        switch(subcommandName) {
        case 'setchannel': {
            this.setChannel(interaction, guild, channel);
            return;
        }
        case 'solo': {
            let goal = interaction.options.getInteger('goal', true);
            let wager = interaction.options.getInteger('wager') ?? 0;
            this.solo(interaction, guild, member, { goal, wager });
            return;
        }
        case 'host': {
            this.host(interaction, guild, member, channel);
            return;
        }
        case 'leave': {
            this.leave(interaction, guild, member);
            return;
        }
        case 'join': {
            let player = interaction.options.getUser('player');
            this.join(interaction, guild, member, channel, (player?.id)??undefined);
            return;
        }
        case 'start': {
            let goal = interaction.options.getInteger('goal', true);
            let wager = interaction.options.getInteger('wager') ?? 0;
            let openingThreshold = interaction.options.getInteger('opening_threshold')??undefined;
            let ai = interaction.options.getBoolean('ai')??false;
            let welfare = interaction.options.getBoolean('welfare')??false;
            let highStakes = interaction.options.getBoolean('high_stakes')??false;

            this.start(interaction, guild, member, { goal, wager, openingThreshold, ai, welfare, highStakes });
            return;
        }
        case 'skin': {
            let skin = interaction.options.getString('skin', true);
            this.skin(interaction, member, skin);
            return;
        }
        case 'games': {
            let nonEphemeral = interaction.options.getBoolean('public');
            this.games(interaction, !!nonEphemeral);
            return;
        }
        case 'profile': {
            let nonEphemeral = interaction.options.getBoolean('public');
            let fluffy = interaction.options.getBoolean('fluffy');
            this.profile(interaction, fluffy ? interaction.client.user.id : member.id, !!nonEphemeral, !!fluffy);
            return;
        }
        case 'spectate': {
            let player = interaction.options.getUser('player', true);
            this.spectate(interaction, guild, member, player.id);
            return;
        }
        case 'rules': {
            this.rules(interaction, member);
            return;
        }
        }
    }

    /**
     * 
     * @returns {RESTPostAPIApplicationCommandsJSONBody[]}
     */
    getSlashCommands() {
        return [
            new SlashCommandBuilder().setName('mod_f')
                .setDescription('[Mod] Collection of Farkle related commands.')
                .setDefaultMemberPermissions('0')
                .addSubcommand(subcommand =>
                    subcommand.setName('setchannel')
                        .setDescription('[Mod] Set the Farkle channel.')
                ).toJSON(),
            new SlashCommandBuilder().setName('f')
                .setDescription('Collection of Farkle related commands.')
                .addSubcommand(subcommand =>
                    subcommand.setName('solo')
                        .setDescription('Start a solo Farkle game against me!')
                        .addIntegerOption(option =>
                            option.setName('goal')
                                .setDescription('The match goal, between 1000 and 50000. 4000 is a good average game length.')
                                .setRequired(true)
                        ).addIntegerOption(option =>
                            option.setName('wager')
                                .setDescription('The match bone wager. Cannot be higher than the lowest bones owned between you or Fluffy.')
                        )
                ).addSubcommand(subcommand =>
                    subcommand.setName('host')
                        .setDescription('Host a new Farkle pre-game lobby that others can join.')
                ).addSubcommand(subcommand =>
                    subcommand.setName('leave')
                        .setDescription('Leave the Farkle pre-game lobby you\'re in, if any. This does not affect currently running games!')
                ).addSubcommand(subcommand =>
                    subcommand.setName('join')
                        .setDescription('Join the last created Farkle pre-game lobby.')
                        .addUserOption(option =>
                            option.setName('player')
                                .setDescription('Join this specific player instead.')
                        )
                ).addSubcommand(subcommand =>
                    subcommand.setName('start')
                        .setDescription('If you\'re hosting a Farkle pre-game lobby, this will begin the game!')
                        .addIntegerOption(option =>
                            option.setName('goal')
                                .setDescription('The match goal, between 1000 and 50000. 4000 is a good average game length.')
                                .setRequired(true)
                        ).addIntegerOption(option =>
                            option.setName('wager')
                                .setDescription('The match bone wager. Cannot be higher than the lowest bones owned by a participating player.')
                        ).addIntegerOption(option =>
                            option.setName('opening_threshold')
                                .setDescription('Opening threshold, between 100 and 5000. Players must score this value of points on first turn.')
                        ).addBooleanOption(option =>
                            option.setName('ai')
                                .setDescription('If True, an AI player will join. Games with AI can only specify goal, no other options.')
                        ).addBooleanOption(option =>
                            option.setName('high_stakes')
                                .setDescription('If True, rules of the High Stakes variant will apply.')
                        ).addBooleanOption(option =>
                            option.setName('welfare')
                                .setDescription('If True, rules of the Welfare variant will apply.')
                        )
                ).addSubcommand(subcommand =>
                    subcommand.setName('skin')
                        .setDescription('Choose the look of your Farkle dice.')
                        .addStringOption(option => 
                            option.setName('skin')
                                .setDescription('The skin to use.')
                                .setRequired(true)
                                .setChoices(...F.skinsSlashChoices)
                        )
                ).addSubcommand(subcommand =>
                    subcommand.setName('games')
                        .setDescription('Display a list of currently active Farkle games.')
                        .addStringOption(option => 
                            option.setName('public')
                                .setDescription('Set to True if the message should be posted to everyone instead of just to you.')
                        )
                ).addSubcommand(subcommand =>
                    subcommand.setName('profile')
                        .setDescription('Show your Farkle profile.')
                        .addStringOption(option => 
                            option.setName('public')
                                .setDescription('Set to True if the message should be posted to everyone instead of just to you.')
                        )
                        .addBooleanOption(option => 
                            option.setName('fluffy')
                                .setDescription('Instead of yours, see Fluffy\'s profile.')
                        )
                ).addSubcommand(subcommand =>
                    subcommand.setName('spectate')
                        .setDescription('Spectate a player currently playing Farkle.')
                        .addUserOption(option =>
                            option.setName('player')
                                .setDescription('Spectate this player.')
                                .setRequired(true)
                        )
                ).addSubcommand(subcommand =>
                    subcommand.setName('rules')
                        .setDescription('Display Farkle rules')
                ).toJSON()
        ]
    }

    /**
     * 
     * @param {Db.farkle_current_games} docCG 
     * @param {Db.farkle_current_players[]} docCPs 
     */
    _onNewTurn(docCG, docCPs) {
        for(let docCP of docCPs) {
            if(docCP.user_id === docCG.current_player_user_id && docCP.channel_dm_id == null) {
                let time = (Math.random() + 1) * 2500;
                setTimeout(this._botPlayerLoop.bind(this), time, docCG.id);
                break;
            }
        }
    }

    /**
     * 
     * @param {number} gameId 
     */
    async _botPlayerLoop(gameId) {
        await this.bot.sql.transaction(async query => {
            /** @type {Db.farkle_current_games} */
            let docCG = (await query(`SELECT * FROM farkle_current_games WHERE id = ${gameId} AND current_player_user_id = ${this.bot.client.user?.id}`)).results[0];
            if(docCG == null) {
                console.warn('Farkle AI: Current game is null');
                return;
            }

            /** @type {Db.farkle_current_players[]} */
            let docCPs = (await query(`SELECT * FROM farkle_current_players WHERE id_current_games = ${gameId}`)).results;
            if(docCPs.length === 0) {
                console.warn('Farkle AI: Current game has no players');
                return;
            }
            
            /** @type {Db.farkle_current_players|null} */
            let docCP = (await query(`SELECT * FROM farkle_current_players WHERE id_current_games = ${gameId} AND user_id = ${docCG.current_player_user_id}`)).results[0];
            if(docCP == null) {
                console.warn('Farkle AI: Current player is null');
                return;
            }

            const indexCurrent = docCPs.findIndex(v => v.user_id === docCP?.user_id);
            if(indexCurrent < 0) {
                console.warn('Farkle AI: Internal error');
                return;
            }

            if(this.bot.client.user == null) {
                console.warn('Farkle AI: User is null');
                return;
            }

            let docCPsWithoutCurrent = docCPs.slice();
            docCPsWithoutCurrent.splice(indexCurrent, 1);

            let currentPlayerRolls = docCG.current_player_rolls;
            let str = AIBrain.determineMove(JSON.parse(currentPlayerRolls), {
                pointsGoal: docCG.points_goal,
                pointsCurrent: docCG.current_player_points,
                pointsBanked: docCP.total_points_banked,
                secondToBestPointsBanked: docCPsWithoutCurrent.slice().sort((a, b) => b.total_points_banked - a.total_points_banked)[0]?.total_points_banked??0,
                lastTurn: docCG.last_turn_victory_user_id ? (() => {
                    let players = docCPs.slice().sort((a, b) => b.total_points_banked - a.total_points_banked);

                    return {
                        pointsToBeat: players[0]?.total_points_banked ?? 0
                    }
                })() : undefined
            }, {});
            this.onMessageDM({ user: this.bot.client.user, msg: str, gameId });
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.TextChannel|Discord.ThreadChannel} channel
     */
    setChannel(interaction, guild, channel) {
        this.bot.sql.transaction(async query => {
            await interaction.deferReply();

            /** @type {Db.farkle_channels=} */
            var resultChannels = (await query(`SELECT * FROM farkle_channels WHERE guild_id = ${guild.id}`)).results[0]
            if(resultChannels == null) {
                await query(`INSERT INTO farkle_channels (guild_id, channel_id) VALUES (?, ?)`, [guild.id, channel.id]);
            }
            else {
                await query(`UPDATE farkle_channels SET channel_id = ? WHERE guild_id = ?`, [channel.id, guild.id]);
            }

            await interaction.editReply('Farkle channel set.');
            this.cache.set(guild.id, "farkle_channel_id", channel.id);
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @param {{goal: number, wager: number, openingThreshold?: number, ai?: boolean, welfare?: boolean, highStakes?: boolean}} matchOpts
     */
    solo(interaction, guild, member, matchOpts) {
        this.bot.sql.transaction(async query => {
            await interaction.deferReply();

            /** @type {Db.farkle_current_players[]} */
            var docCPs = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${member.id}`)).results;
            if(docCPs.length > 0) {
                await interaction.editReply("You're already in a Farkle match!");
                return false;
            }
            
            /** @type {Db.farkle_servers|undefined} */
            var docS = (await query(`SELECT * FROM farkle_servers WHERE user_id = ${member.id}`)).results[0];
            if(docS) {
                if(docS.user_id !== docS.user_id_host) {
                    await interaction.editReply("You are already in another lobby! Leave it first.");
                    return false;
                }
            }

            return true;
        }).then(go => {
            if(go) this.farkle(interaction, guild, member, [], matchOpts);
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @param {Discord.Snowflake[]} otherPlayers
     * @param {{goal: number, wager: number, openingThreshold?: number, ai?: boolean, welfare?: boolean, highStakes?: boolean}} matchOpts
     * 
     */
    farkle(interaction, guild, member, otherPlayers, matchOpts) {
        /** @type {Discord.GuildMember[]} */
        var members = [member];
        for(let snowflake of otherPlayers) {
            let member = guild.members.cache.get(snowflake);
            if(!member) continue;
            members.push(member);
        }
        members = [ ...new Set(members) ];
        //if(members.length <= 1) {
        //    return "No valid members found. Mention the users or type their user ID's.";
        //}
        if(members.some(v => v.user.bot)) {
            interaction.reply({ content: "You can't invite a bot!" }).catch(logger.error);
            return;
        }
        this.bot.sql.transaction(async query => {
            if(!interaction.deferred) await interaction.deferReply();

            for(let member of members) {
                var docS = (await query(`SELECT * FROM farkle_servers WHERE user_id = ${member.id}`)).results[0];
                if(docS) {
                    await interaction.editReply("One or more invited players are already in a Farkle lobby looking for a game.");
                    return;
                }
            }

            /** @type {Discord.DMChannel[]} */
            const channels = [];
            for(let i = 0; i < members.length; i++) {
                channels[i] = await members[i].createDM();
            }

            /** @type {Db.farkle_current_players[]} */
            var docCPs = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${member.id}`)).results;
            if(docCPs.length > 0) {
                await interaction.editReply("You're already in a Farkle match!");
                return;
            }
 
            /** @type {Db.farkle_current_players[]} */
            var docCPs = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${members.map(v=>v.id).join(" OR user_id = ")}`)).results;
            if(docCPs.length > 0) {
                await interaction.editReply(`${docCPs.map(v=>`<@${v.user_id}>`).join(", ")} are already in another Farkle match!`);
                return;
            }

            let goal = matchOpts.goal;
            let wager = matchOpts.wager;
            let ai = matchOpts.ai??false;
            let welfare = matchOpts.welfare??false;
            let highStakes = matchOpts.highStakes??false;
            let threshold = matchOpts.openingThreshold??0;
            if(members.length === 1 || ai) {
                welfare = false;
                highStakes = false;
                threshold = 0;
            }

            if(!Number.isFinite(goal)) {
                await interaction.editReply("The specified point goal is invalid.");
                return;
            }

            goal = Math.ceil(goal / 50) * 50;
            if(goal < 1000 || goal > 50000) {
                await interaction.editReply("Point goal must be between 1000 and 50000.");
                return;
            }

            if(!Number.isFinite(threshold)) {
                await interaction.editReply("The specified opening turn point threshold is invalid.");
                return;
            }

            threshold = Math.ceil(threshold / 50) * 50;
            if(threshold !== 0 && threshold < 100 || threshold > 5000) {
                await interaction.editReply("Opening turn point threshold must be between 100 and 5000.");
                return;
            }

            /** @type {Db.farkle_current_players[]} */
            var docCPs = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${member.id}`)).results;
            if(docCPs.length > 0) {
                await interaction.editReply("Somehow, there weren't any players.");
                return;
            }

            for(let member of members) {
                /** @type {Db.farkle_users} */
                let docU = (await query(`SELECT * FROM farkle_users WHERE user_id = ${member.id}`)).results[0];
                if(docU.moneys < wager) {
                    await interaction.editReply("One or more players can't afford the chosen wager.");
                    return;
                }
            }
            if(members.length === 1 || ai) {
                const botId = guild.client.user?.id??'';
                /** @type {Db.farkle_users} */
                let docU = (await query(`SELECT * FROM farkle_users WHERE user_id = ${botId}`)).results[0];
                let moneys = docU.moneys;
                /** @type {Db.farkle_current_players[]} */
                let docCPs = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${botId}`)).results;
                for(let docCP of docCPs) {
                    /** @type {Db.farkle_current_games} */
                    let docCG = (await query(`SELECT * FROM farkle_current_games WHERE id = ${docCP.id_current_games}`)).results[0];
                    if(!docCG.has_started)
                        moneys -= docCG.wager;
                }

                if(moneys < wager) {
                    await interaction.editReply("Fluffy can't afford the chosen wager.");
                    return;
                }
            }

            /** @type {Db.farkle_current_games} */
            const game = {
                guild_id: guild.id,
                has_started: false,
                match_start_time: 0,
                points_goal: goal,
                current_player_user_id: "",
                current_player_points: 0,
                current_player_points_piggybacked: 0,
                current_player_rolls: "[]",
                current_player_rolls_count: 0,
                opening_turn_point_threshold: threshold,
                high_stakes_variant: highStakes,
                current_player_high_stakes_choice: false,
                welfare_variant: welfare,
                ai_version: AIBrain.VERSION,
                wager: wager,
                wager_pool: 0
            }

            var doc = (await query(Bot.Util.SQL.getInsert(game, "farkle_current_games") + "; SELECT LAST_INSERT_ID();")).results[1][0];
            game.id = Object.values(doc)[0];

            const botId = guild.client.user?.id??'';
            if(members.length === 1 || ai) {
                members.push(await guild.members.fetch(botId));
            }

            for(let i = 0; i < members.length; i++) {
                /** @type {Db.farkle_current_players[]} */
                var docCPs = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${members[i].id} AND id_current_games = ${game.id}`)).results;
                if(docCPs.length > 0) continue;

                var embed = getEmbedBlank();
                if(i === 0)
                    embed.description = `Waiting for everyone to be ready.`;
                else
                    embed.description = `${members[0]} invited you to play Farkle!`;

                embed.description += `\n  • Point goal: ${goal}`;
                if(wager > 0) embed.description += `\n  • ${MONEYS_ICON} Wager: ${wager}`;
                if(threshold > 0) embed.description += `\n  • Opening turn point threshold: ${threshold}`;
                if(highStakes) embed.description += `\n  • **High Stakes**`;
                if(welfare) embed.description += `\n  • **Welfare**`;
                embed.description += `\n  • Players: ${members.join(", ")}\n`;
                embed.description += `\nType \`ready\` or \`r\` if you want to play.\nType \`reject\` to cancel the match.`;
                
                try {
                    if(channels[i]) await channels[i].send({ embeds: [embed] });
                }
                catch(e) {
                    if(otherPlayers.length === 0) {
                        await interaction.editReply("Your DM's must be open to play Farkle.");
                    }
                    else {
                        await interaction.editReply("One or more players in this match have DM's closed.");
                    }
                    throw e;
                }
                const isBot = members[i].id === botId;

                /** @type {Db.farkle_current_players} */
                const player = {
                    id_current_games: /** @type {number} */(game.id),
                    ready_status: isBot ? true : false,
                    turn_order: 0,
                    user_id: members[i].id,
                    channel_dm_id: isBot ? null : channels[i].id,
                    total_points_banked: 0,
                    total_points_lost: 0,
                    total_points_skipped: 0,
                    total_points_piggybacked_banked: 0,
                    total_points_piggybacked_lost: 0,
                    total_points_welfare_gained: 0,
                    total_points_welfare_lost: 0,
                    total_rolls: 0,
                    total_folds: 0,
                    total_finishes: 0,
                    total_skips: 0,
                    total_welfares: 0,
                    highest_points_banked: 0,
                    highest_points_lost: 0,
                    highest_points_skipped: 0,
                    highest_points_piggybacked_banked: 0,
                    highest_points_piggybacked_lost: 0,
                    highest_points_welfare_gained: 0,
                    highest_points_welfare_lost: 0,
                    highest_rolls_in_turn: 0,
                    highest_rolls_in_turn_without_fold: 0,
                    passive_moneys_gained: 0
                }
                if(player.channel_dm_id == null) delete player.channel_dm_id;
                
                await query(Bot.Util.SQL.getInsert(player, "farkle_current_players"));
            }

            await interaction.editReply(`Game started. Check your DM\'s!${wager>0?`\nWager: ${MONEYS_ICON} ${wager}`:''}`);
        }).catch(console.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @param {Discord.TextChannel|Discord.ThreadChannel} channel
     */
    host(interaction, guild, member, channel) {
        this.bot.sql.transaction(async query => {
            await interaction.deferReply();

            /** @type {Db.farkle_current_players[]} */
            var docCPs = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${member.id}`)).results;
            if(docCPs.length > 0) {
                await interaction.editReply("You're already in a Farkle match!");
                return;
            }

            /** @type {Db.farkle_servers} */
            let server = {
                guild_id: guild.id,
                user_id: member.id,
                user_id_host: member.id,
                channel_id: channel.id,
                message_id: ''
            }

            let embed = getEmbedBlank();
            embed.description = `<@${server.user_id}> is looking for people to play Farkle!\nUse \`/f join\` to join.\nUse \`/f start\` to start a solo game with an AI player.\nUse \`/f leave\` to disband the lobby.`;

            /** @type {Db.farkle_servers|undefined} */
            var docS = (await query(`SELECT * FROM farkle_servers WHERE user_id = ${member.id}`)).results[0];
            if(docS) {
                const prevMessageChannel = await guild.channels.fetch(docS.channel_id).catch(() => {});
                const prevMessage = prevMessageChannel instanceof Discord.TextChannel ? await prevMessageChannel.messages.fetch(docS.message_id).catch(() => {}) : undefined;

                if(docS.user_id === docS.user_id_host) {
                    if(prevMessage) prevMessage.delete();
                    const serverMessage = await interaction.editReply({ embeds: [embed]});
                    server.message_id = serverMessage.id;
                    await query(`UPDATE farkle_servers SET channel_id = ${serverMessage.channel.id}, message_id = ${serverMessage.id} WHERE id = ${docS.id}`);
                    return;
                }
                else {
                    await interaction.editReply("You are already in another lobby! Leave it first.");
                    return;
                }
            }
            
            const serverMessage = await interaction.editReply({ embeds: [embed] });
            server.message_id = serverMessage.id;

            await query(Bot.Util.SQL.getInsert(server, "farkle_servers"));
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     */
    leave(interaction, guild, member) {
        this.bot.sql.transaction(async query => {
            await interaction.deferReply();

            /** @type {Db.farkle_servers | undefined} */
            var docS = (await query(`SELECT * FROM farkle_servers WHERE user_id = ${member.id}`)).results[0];
            if(!docS) {
                await interaction.editReply("You're not in a lobby.");
                return;
            }

            
            /** @type {Db.farkle_servers|undefined} */
            var docShost = (await query(`SELECT * FROM farkle_servers WHERE user_id_host = ${docS.user_id_host} AND guild_id = ${guild.id} AND user_id = ${docS.user_id_host}`)).results[0];
            if(!docShost) throw new Error('no host');
        
            const prevMessageChannel = await guild.channels.fetch(docShost.channel_id).catch(() => {});
            const prevMessage = prevMessageChannel instanceof Discord.TextChannel ? await prevMessageChannel.messages.fetch(docShost.message_id).catch(() => {}) : undefined;
            if(prevMessage) prevMessage.delete().catch(logger.error);
            /** @type {null|Discord.Message} */ let serverMessage = null;
            
            if(docS.user_id_host !== docS.user_id) {
                await query(`DELETE FROM farkle_servers WHERE user_id = ${member.id}`);

                /** @type {Db.farkle_servers[]} */
                let docSs = (await query(`SELECT * FROM farkle_servers WHERE user_id_host = ${docS.user_id_host}`)).results;

                let embed = getEmbedBlank();
                embed.description = `<@${docS.user_id}> left.\nThere's ${docSs.length} player(s) waiting: ${docSs.map(v => `<@${v.user_id}> `)}\n\n${docSs.length > 1 ? `<@${docS.user_id_host}> needs to use \`/f start\` to begin the game, or wait for more players.\nUse\`/f leave\` to leave the lobby.` : ""}`;
                serverMessage = await interaction.editReply({ content: docSs.length > 1 ? `<@${docS.user_id_host}>` : undefined, embeds: [embed] });

                await query(`UPDATE farkle_servers SET channel_id = ${serverMessage.channel.id}, message_id = ${serverMessage.id} WHERE user_id_host = ${docShost.user_id_host}`);
            }
            else {
                await query(`DELETE FROM farkle_servers WHERE user_id_host = ${member.id}`);

                let embed = getEmbedBlank();
                embed.description = `${member} disbanded the lobby.`;
                serverMessage = await interaction.editReply({ embeds: [embed] });
            }
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.GuildMember} member
     * @param {Discord.Guild} guild 
     * @param {Discord.TextChannel|Discord.ThreadChannel} channel
     * @param {Discord.GuildMember} hostMember
     * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
     */
    async _join(interaction, member, guild, channel, hostMember, query) {
        /** @type {Db.farkle_current_players[]} */
        var docCPs = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${member.id}`)).results;
        if(docCPs.length > 0) {
            await interaction.reply("You're already in a Farkle match!");
            return;
        }
        /** @type {Db.farkle_servers[]} */
        var docSs = (await query(`SELECT * FROM farkle_servers WHERE user_id_host = ${hostMember.id} AND guild_id = ${guild.id}`)).results;
        if(docSs.length === 0) {
            await interaction.reply("This user isn't hosting a lobby!");
            return;
        }
        /** @type {Db.farkle_servers[]} */
        var docSs = (await query(`SELECT * FROM farkle_servers WHERE user_id_host = ${hostMember.id} AND guild_id = ${guild.id} AND user_id = ${member.id}`)).results;
        if(docSs.length > 0) {
            await interaction.reply("You're already in this lobby.");
            return;
        }
        /** @type {Db.farkle_servers[]} */
        var docSs = (await query(`SELECT * FROM farkle_servers WHERE user_id = ${member.id}`)).results;
        if(docSs.length > 0) {
            await interaction.reply("You are already in another lobby! Leave it first.");
            return;
        }

        const message = await interaction.reply({ fetchReply: true, content: `${hostMember}`, allowedMentions: {parse: ["users"]} });

        /** @type {Db.farkle_servers|undefined} */
        var docS = (await query(`SELECT * FROM farkle_servers WHERE user_id_host = ${hostMember.id} AND guild_id = ${guild.id} AND user_id = ${hostMember.id}`)).results[0];
        if(docS) {
            const prevMessageChannel = await guild.channels.fetch(docS.channel_id).catch(() => {});
            const prevMessage = prevMessageChannel instanceof Discord.TextChannel ? await prevMessageChannel.messages.fetch(docS.message_id).catch(() => {}) : undefined;
            if(prevMessage) prevMessage.delete().catch(logger.error);

            await query(`UPDATE farkle_servers SET channel_id = ${channel.id}, message_id = ${message.id} WHERE user_id_host = ${docS.user_id_host}`);
        }

        /** @type {Db.farkle_servers} */
        let server = {
            guild_id: guild.id,
            user_id: member.id,
            user_id_host: hostMember.id,
            channel_id: channel.id,
            message_id: message.id
        }

        await query(Bot.Util.SQL.getInsert(server, "farkle_servers")); 

        /** @type {Db.farkle_servers[]} */
        var docSs = (await query(`SELECT * FROM farkle_servers WHERE user_id_host = ${hostMember.id}`)).results;

        let maxWager = Infinity;
        for(let docS of docSs) {
            /** @type {Db.farkle_users} */
            let docU = (await query(`SELECT * FROM farkle_users WHERE user_id = ${docS.user_id}`)).results[0];
            if(docU == null) {
                maxWager = 0;
                break;
            }
            maxWager = Math.min(docU.moneys, maxWager);
        }

        let embed = getEmbedBlank();
        embed.description = `${member} has joined!\nThere's ${docSs.length} player(s) waiting: ${docSs.map(v => `<@${v.user_id}> `)}\n\n${hostMember} needs to use \`/f start\` to begin the game, or wait for more players.\nThe maximum wager between all players is ${MONEYS_ICON} ${maxWager}\nUse\`/f leave\` to leave the lobby.`;
        await interaction.editReply({ content: `${hostMember}`, embeds: [embed], allowedMentions: {parse: ["users"]} });
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @param {Discord.TextChannel|Discord.ThreadChannel} channel
     * @param {Discord.Snowflake=} targetLobbyMember
     */
    join(interaction, guild, member, channel, targetLobbyMember) {
        let prep = this.cache.get("0", `prep${member.id}`);
        if(prep) return;

        if(targetLobbyMember == null) {
            this.bot.sql.transaction(async query => {
                /** @type {Db.farkle_servers[]} */
                let docSs = (await query(`SELECT * FROM farkle_servers WHERE guild_id = ${guild.id} AND user_id = user_id_host`)).results;
                if(docSs.length === 0) {
                    await interaction.reply("There are no lobbies to join.");
                    return;
                }

                for(let i = docSs.length - 1; i >= 0; i--) {
                    let docS = docSs[i];

                    let hostMember = await guild.members.fetch(docS.user_id_host);
                    if(hostMember == null) {
                        await interaction.reply("The user who created this lobby is no longer a member of this server. The lobby has been deleted.");
                        await query(`DELETE FROM farkle_servers WHERE user_id_host = ${docS.user_id_host}`);
                        return;
                    }

                    await this._join(interaction, member, guild, channel, hostMember, query);
                    return;
                }

                await interaction.editReply("There are no lobbies to join (2).");
                return;
            }).catch(logger.error);
            return;
        }

        this.bot.sql.transaction(async query => {
            let hostMember = await guild.members.fetch(targetLobbyMember);
            if(!hostMember) {
                await interaction.reply("Mentioned user is not a member of this server.");
                return;
            }

            await this._join(interaction, member, guild, channel, hostMember, query);
            return;
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @param {{goal: number, wager: number, openingThreshold?: number, ai?: boolean, welfare?: boolean, highStakes?: boolean}} matchOpts
     */
    start(interaction, guild, member, matchOpts) {
        this.bot.sql.transaction(async query => {
            await interaction.deferReply();

            /** @type {Db.farkle_servers[]} */
            var docSs = (await query(`SELECT * FROM farkle_servers WHERE guild_id = ${guild.id} AND user_id_host = ${member.id} AND user_id = user_id_host`)).results;
            if(docSs.length === 0) {
                await interaction.editReply("You're not a host of a lobby.");
                return false;
            }

            /** @type {Db.farkle_servers[]} */
            var docSs = (await query(`SELECT * FROM farkle_servers WHERE guild_id = ${guild.id} AND user_id_host = ${member.id}`)).results;
            //if(docSs.length <= 1) {
            //    await interaction.editReply("Nobody has joined your lobby yet.");
            //    return false;
            //}

            /** @type {Db.farkle_servers|undefined} */
            var docS = (await query(`SELECT * FROM farkle_servers WHERE user_id = ${member.id}`)).results[0];
            if(docS) {
                const prevMessageChannel = await guild.channels.fetch(docS.channel_id).catch(() => {});
                const prevMessage = prevMessageChannel instanceof Discord.TextChannel ? await prevMessageChannel.messages.fetch(docS.message_id).catch(() => {}) : undefined;
                if(prevMessage) prevMessage.delete().catch(logger.error);
            }

            await query(`DELETE FROM farkle_servers WHERE user_id_host = ${member.id}`);

            let args = docSs.map(v => v.user_id);
            return args;
        }).then(args => {
            if(args == false) return;
            this.farkle(interaction, guild, member, args, matchOpts);
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.GuildMember} member
     * @param {string} name
     */
    skin(interaction, member, name) {
        this.bot.sql.transaction(async query => {
            await interaction.deferReply({ephemeral: true});

            /** @type {{user_id: string; skin: string}} */
            let user = {
                user_id: member.id,
                skin: name,
            }

            await query(`UPDATE farkle_users SET skin = "${name}" WHERE user_id = ${member.id}`);
            await interaction.editReply(`Skin changed: ${Object.values(F.skins[name]).join("")}`);
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {boolean} nonEphemeral
     */
    games(interaction, nonEphemeral) {
        this.bot.sql.transaction(async query => {
            await interaction.deferReply({ephemeral: !nonEphemeral});

            const embed = getEmbedBlank();

            var str = "";

            /** @type {Db.farkle_current_games[]} */
            let docCGs = (await query(`SELECT * FROM farkle_current_games`)).results;
            if(docCGs.length === 0) {
                await interaction.editReply("There are no games being played right now.");
                return;
            }

            var i = 1;
            for(let docCG of docCGs) {
                str += `Game #${i} • Goal: ${docCG.points_goal}\n`;

                /** @type {Db.farkle_current_players[]} */
                let docCPs = (await query(`SELECT * FROM farkle_current_players WHERE id_current_games = ${docCG.id} ORDER BY total_points_banked DESC`)).results;

                for(let docCP of docCPs) {
                    str += `  • <@${docCP.user_id}>: ${docCP.total_points_banked} pts`;
                    str += "\n";
                }
                str += "\n";
                i++;
            }
            embed.description = str;
            await interaction.editReply({ embeds: [embed] });
            return;
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Snowflake} memberId
     * @param {boolean} nonEphemeral
     * @param {boolean} fluffy
     */
    profile(interaction, memberId, nonEphemeral, fluffy) {
        this.bot.sql.transaction(async query => {
            await interaction.deferReply({ephemeral: !nonEphemeral});

            let user = fluffy ? interaction.client.user : interaction.user;

            let embed = getEmbedBlank();
            embed.title = "Farkle";
            embed.author = {
                name: getUserDisplayName(null, user),
                icon_url: user.displayAvatarURL()
            }
            const lastSeen = await Q.getPlayerLastSeen(memberId, query);

            var doc = (await query(`SELECT * FROM farkle_users WHERE user_id = ${memberId}`)).results[0];
            embed.description = `Last Seen: ${lastSeen > 0 ? Bot.Util.getFormattedDate(lastSeen, true) : "Never"}\n${MONEYS_ICON} ${doc ? doc.moneys : 0}`;

            embed.fields = [];

            const players = await Q.getPlayerHighestPlayerCountGamePlayed(memberId, query);
            const wl = {
                regular: {
                    wins: 0,
                    losses: 0,
                },
                weighted: {
                    wins: 0,
                    losses: 0
                }
            }

            for(let i = 2; i <= players; i++) {
                const wins = await Q.getPlayerWinsInXPlayerMatches(memberId, query, i);
                const losses = await Q.getPlayerGamesInXPPlayerMatches(memberId, query, i) - wins;

                wl.regular.wins += wins;
                wl.regular.losses += losses;

                wl.weighted.wins += wins * i / 2;
                wl.weighted.losses += losses / i * 2;
            }

            embed.fields.push({
                inline: true,
                name: "Wins • Losses",
                value: `${wl.regular.wins} • ${wl.regular.losses} (Total)\n${dollarify(Math.round, wl.weighted.wins)} • ${dollarify(Math.round, wl.weighted.losses)} (Weighted)`
            });

            const fieldTotal = {
                inline: true,
                name: "Totals",
                value: ""
            };

            var doc = (await query(`select sum(total_points_banked) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Pts banked: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_points_lost) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Pts lost: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_points_skipped) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Pts skipped: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_points_piggybacked_banked) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Piggybacks banked: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_points_piggybacked_lost) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Piggybacks lost: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_points_welfare_gained) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Welfares given: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_points_welfare_lost) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Welfares lost: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_rolls) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Rolls: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_folds) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Folds: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_finishes) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Finishes: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_skips) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Skips: ${doc ? doc.total : 0}\n`;

            var doc = (await query(`select sum(total_welfares) as 'total' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldTotal.value += `Welfares: ${doc ? doc.total : 0}\n`;

            embed.fields.push(fieldTotal);


            const fieldBest = {
                inline: true,
                name: "Single turn highest",
                value: ""
            };

            var doc = (await query(`select max(highest_points_banked) as 'highest' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldBest.value += `Pts banked: ${doc ? doc.highest : 0}\n`;

            var doc = (await query(`select max(highest_points_lost) as 'highest' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldBest.value += `Pts lost: ${doc ? doc.highest : 0}\n`;

            var doc = (await query(`select max(highest_points_skipped) as 'highest' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldBest.value += `Pts skipped: ${doc ? doc.highest : 0}\n`;

            var doc = (await query(`select max(highest_points_piggybacked_banked) as 'highest' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldBest.value += `Piggybacks banked: ${doc ? doc.highest : 0}\n`;

            var doc = (await query(`select max(highest_points_piggybacked_lost) as 'highest' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldBest.value += `Piggybacks lost: ${doc ? doc.highest : 0}\n`;

            var doc = (await query(`select max(highest_points_welfare_gained) as 'highest' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldBest.value += `Welfares given: ${doc ? doc.highest : 0}\n`;

            var doc = (await query(`select max(highest_points_welfare_lost) as 'highest' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldBest.value += `Welfares lost: ${doc ? doc.highest : 0}\n`;

            var doc = (await query(`select max(highest_rolls_in_turn) as 'highest' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldBest.value += `Rolls: ${doc ? doc.highest : 0}\n`;

            var doc = (await query(`select max(highest_rolls_in_turn_without_fold) as 'highest' from farkle_history_players where user_id = ${memberId} group by user_id`)).results[0];
            fieldBest.value += `Rolls w/o farkle: ${doc ? doc.highest : 0}\n`;

            embed.fields.push(fieldBest);

            embed.fields.push({
                inline: true,
                name: "⠀",
                value: `⠀`
            });
            
            await interaction.editReply({ embeds: [embed] });
            return;
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.Guild} guild
     * @param {Discord.GuildMember} member
     * @param {Discord.Snowflake} hostSnowflake
     */
    spectate(interaction, guild, member, hostSnowflake) {
        this.bot.sql.transaction(async query => {
            await interaction.deferReply();

            let hostMember = await guild.members.fetch(hostSnowflake);
            if(!hostMember) {
                await interaction.editReply("Mentioned user is not a member of this server.");
                return;
            }

            /** @type {Db.farkle_current_players[]} */
            var docCPs = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${member.id}`)).results;
            if(docCPs.length > 0) {
                await interaction.editReply("You're already in a Farkle match!");
                return;
            }
            /** @type {Db.farkle_current_players|undefined} */
            var docCP = (await query(`SELECT * FROM farkle_current_players WHERE user_id = ${hostMember.id}`)).results[0];
            if(docCP == null) {
                await interaction.editReply("This user is not in a game.");
                return;
            }

            if(docCP.channel_dm_id == null) {
                await interaction.editReply("You can't spectate me. Spectate a player that's playing against me instead.");
                return;
            }

            let dm = await member.createDM();

            /** @type {Db.farkle_viewers} */
            let viewer = {
                user_id_target: docCP.user_id,
                user_id: member.id,
                channel_dm_id: dm.id
            }

            /** @type {Db.farkle_viewers|undefined} */
            let docV = (await query(`SELECT * FROM farkle_viewers WHERE user_id = ${member.id}`)).results[0];
            if(docV) {
                await query(`DELETE FROM farkle_viewers WHERE user_id = ${member.id}`);

                if(docV.user_id_target === viewer.user_id_target) {
                    await interaction.editReply("You're no longer spectating this game.");
                    return;
                }
            }

            await query(Bot.Util.SQL.getInsert(viewer, "farkle_viewers"));

            await interaction.editReply("Now spectating...");
        }).catch(logger.error);
    }

    /**
     * @param {Discord.CommandInteraction<"cached">} interaction 
     * @param {Discord.GuildMember} member
     */
    rules(interaction, member) {
        var embed = getEmbedBlank();
        
        this.bot.sql.transaction(async query => {
            await interaction.deferReply({ephemeral: true})

            /** @type {Db.farkle_users} */
            let docU = (await query(`SELECT * FROM farkle_users WHERE user_id = ${member.id}`)).results[0];
            let skin = F.skins[docU.skin];

            var str = `https://en.wikipedia.org/wiki/Farkle
            
Farkle is played by two or more players, with each player in succession having a turn at throwing the dice. Each player's turn results in a score, and the scores for each player accumulate to some winning total. 
   At the beginning of each turn, the player throws six dice at once.
   After each throw, one or more scoring dice must be set aside (see sections on scoring below).
   The player may then either end their turn and bank the score accumulated so far, or continue to throw the remaining dice.
   If the player has scored all six dice, they have "hot dice" and may continue their turn with a new throw of all six dice, adding to the score they have already accumulated. There is no limit to the number of "hot dice" a player may roll in one turn.
   If none of the dice score in any given throw, the player has "farkled" and all points for that turn are lost.
   At the end of the player's turn, the dice are handed to the next player in succession, and they have their turn.

__Local terminology:__
   \`keep\` command - Set aside one or more scoring dice, then continue to throw the remaining dice. e.g. \`keep 111\` = set aside three 1's and continue to roll the remaining dice.
   \`finish\` command - Set aside one or more scoring dice, then bank the accumulated score end your turn. e.g. \`finish 111\` = set aside three 1's, bank your points and end your turn.
            
__Scoring rules:__
   **Single ${skin[1]}** - 100 points
   **Single ${skin[5]}** - 50 points

   **Three of a kind** - 100 points times the number on the dice. ${skin[1]} counts as 10.
   **Four or more of a kind** - double the points of a three of a kind.
   e.g. three 4's are worth 400, four 4's 800, five 4's 1600, six 4's 3200.

   **Five in a row**
   ${skin[1]}${skin[2]}${skin[3]}${skin[4]}${skin[5]} - 500 points
   ${skin[2]}${skin[3]}${skin[4]}${skin[5]}${skin[6]} - 750 points

   **Six in a row**
   ${skin[1]}${skin[2]}${skin[3]}${skin[4]}${skin[5]}${skin[6]} - 1500 points
   
__High-stakes:__
   In a variant described as "piggybacking" or "high-stakes", each player after the first can choose to begin their turn either with a fresh set of six dice, or by throwing the dice remaining after the previous player has completed their turn. For example, if a player banks three 1's for a score of 1000, the next player may choose to roll the remaining three dice. If they score at least one die, they score 1000 plus whatever additional score they accumulate. Players may thus assume the greater risk of farkling for the chance of scoring the points already accumulated by the player before them. If a player ends their turn on a "hot dice", the next player may "piggyback" using all six dice.
   
__Welfare:__
   An end-of-game variation described as "welfare" requires the winner to score exactly the required amount of points. If a player scores more than than that in a turn, the player automatically farkles and all points scored in that turn are given to the player with the lowest score (unless it is the current player). If multiple other players have the same lowest score, points are given to the player furthest away in turn order.`;
            embed.description = str;
            await interaction.editReply({ embeds: [embed] });
        }).catch(logger.error);
    }
}

/**
 * @param {(arg0: number) => number} method
 * @param {number} number 
 * @returns {number}
 */
function dollarify(method, number) {
    return method(number * 100) / 100;
}

/**
 * @returns {Discord.APIEmbed}
 */
function getEmbedBlank() {
    return {
        description: "",
    };
}

/**
 * @param {Db.farkle_current_games} docCG
 * @param {Db.farkle_current_players[]} docCPs
 * @param {boolean=} totalIsBank
 * @param {boolean=} shortFooter
 * @returns {Discord.APIEmbed}
 */
function getEmbedUser(docCG, docCPs, totalIsBank, shortFooter) {
    var docCP = docCPs.find(v => v.user_id === docCG.current_player_user_id);
    const bank = docCP ? docCP.total_points_banked : -1;
    const round = docCG.current_player_points;

    let footer = ''
    if(shortFooter) footer = '';
    else footer = `Farkle • Goal: ${docCG.points_goal} • Bank: ${bank} • Round: ${round} • Total: ${totalIsBank ? bank : bank+round}`

    /** @type {Discord.APIEmbed} */
    return {
        color: docCP ? F.colors[docCP.turn_order] : 0,
        footer: {
            text: footer
        },
        description: ""
    };
}

/**
 * 
 * @param {number[]} rolls 
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function getRollsGrid(rolls, width, height) {
    /** @type {Array<number[]>} */
    var arr = [];
    for(let y = 0; y < height; y++) {
        arr[y] = [];
    }

    for(let i = 0; i < rolls.length; i++) {
        let roll = rolls[i];

        let x, y;
        loop:
        while(true) {
            x = Bot.Util.getRandomInt(0, width);
            y = Bot.Util.getRandomInt(0, height);

            if(arr[y][x] != null) continue loop;
            if(arr[y - 1] && arr[y - 1][x] != null) continue loop;
            if(arr[y + 1] && arr[y + 1][x] != null) continue loop;
            if(arr[y][x - 1] != null) continue loop;
            if(arr[y][x + 1] != null) continue loop;

            arr[y][x] = roll;
            break;
        }
    }

    var str = "";
    for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            if(arr[y][x] == null)
                str += `   `;
            else
                str += `%${arr[y][x]}%`;
        }
        str += "\n";
    }

    return "```" + str + "```";
}













//*****************************
//************LOGIC************
//*****************************

/**
 * Does not modify arrays. `true` if current rolls are a fold, otherwise `false`.
 * @param {number[]} rolls 
 * @returns {boolean}
 */
function getFold(rolls) {
    for(let match of F.matches) {
        if(getValidKeep(rolls, match.m))
            return false;
    }
    return true;
}

/**
 * Does not modify arrays. `true` if `keep` is valid with `rolls`, otherwise `false`.
 * @param {number[]} rolls 
 * @param {number[]} keep
 * @returns {boolean} 
 */
function getValidKeep(rolls, keep) {
    let rollsT = [...rolls];
    let keepT = [...keep];

    for(let i = 0; i < rollsT.length; i++) {
        for(let j = 0; j < keepT.length; j++) {
            if(rollsT[i] === keepT[j]) {
                rollsT.splice(i, 1);
                keepT.splice(j, 1);
                i--;
                j--;
            }
        }
    }

    if(keepT.length > 0)
        return false;
    return true;
}

/**
 * Modifies arrays. Returns points current player will get. 0 if `keep` is invalid.
 * @param {number[]} rolls 
 * @param {number[]} keep 
 * @returns {number}
 */
function processFarkleKeep(rolls, keep) {
    var points = 0;

    loop:
    while(true) {
        for(let match of F.matches) {
            let matchT = [...match.m];
            let keepT = [...keep];

            for(let i = 0; i < matchT.length; i++) {
                for(let j = 0; j < keepT.length; j++) {
                    if(matchT[i] === keepT[j]) {
                        matchT.splice(i, 1);
                        keepT.splice(j, 1);
                        i--;
                        j--;
                    }
                }
            }

            if(matchT.length === 0) {
                match.m.forEach(n => {
                    rolls.splice(rolls.indexOf(n), 1);
                    keep.splice(keep.indexOf(n), 1);
                });
                keep = keepT;
                points += match.p;
                continue loop;
            }

            if(keep.length === 0) return points;
        }
        if(keep.length > 0) return 0;

        return points;
    }
}







//*****************************
//****FARKLE LOOP HELPERS******
//*****************************
/**
 * @this Farkle
 * @param { { type: ActionType|GameType, updateCurrentMatch: boolean, gameEnded: boolean } } state
 * @param {Db.farkle_current_games} docCG 
 * @param {Db.farkle_current_players} docCP 
 * @param {Db.farkle_current_players[]} docCPs 
 * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
 * @param {Discord.Client} client
 */
async function commit(state, docCG, docCP, docCPs, query, client) {
    if(state.type === "reject") {
        for(let player of docCPs) {
            await query(`DELETE FROM farkle_viewers WHERE user_id_target = ${player.user_id}`);
        }
        await query(`DELETE FROM farkle_current_players WHERE id_current_games = ${docCG.id}`);
        await query(`DELETE FROM farkle_current_games WHERE id = ${docCG.id}`);

        return;
    }

    if(state.type === "ready") {
        for(let player of docCPs) {
            await query(`DELETE FROM farkle_viewers WHERE user_id = ${player.user_id}`);
            await query(`UPDATE farkle_current_games SET has_started = true, match_start_time = ${Date.now()} WHERE id = ${docCG.id}`);
            for(let player of docCPs) {
                await query (`UPDATE farkle_current_players SET turn_order = ${player.turn_order} WHERE user_id = ${player.user_id} AND id_current_games = ${player.id_current_games}`);
            }
        }
    }

    if(state.type === "concede") {
        await query(`DELETE FROM farkle_viewers WHERE user_id_target = ${docCP.user_id}`);
        await query(`DELETE FROM farkle_current_players WHERE user_id = ${docCP.user_id} AND id_current_games = ${docCP.id_current_games}`);
        docCPs = (await query(`SELECT * FROM farkle_current_players WHERE id_current_games = ${docCP.id_current_games}`)).results;

        for(let player of docCPs) {
            await query (`UPDATE farkle_current_players SET turn_order = ${player.turn_order} WHERE user_id = ${player.user_id} AND id_current_games = ${player.id_current_games}`);
        }

        /** @type {Db.farkle_history_players} */
        let playerH = {
            id: /** @type {number} */(docCP.id),
            id_history_games: /** @type {number} */(docCG.id),
            user_id: docCP.user_id,
            turn_order: docCP.turn_order,
            has_conceded: true,
            total_points_banked: docCP.total_points_banked,
            total_points_lost: docCP.total_points_lost,
            total_points_skipped: docCP.total_points_skipped,
            total_points_piggybacked_banked: docCP.total_points_piggybacked_banked,
            total_points_piggybacked_lost: docCP.total_points_piggybacked_lost,
            total_points_welfare_gained: docCP.total_points_welfare_gained,
            total_points_welfare_lost: docCP.total_points_welfare_lost, 
            total_rolls: docCP.total_rolls,
            total_folds: docCP.total_folds,
            total_finishes: docCP.total_finishes,
            total_skips: docCP.total_skips,
            total_welfares: docCP.total_welfares,
            highest_points_banked: docCP.highest_points_banked,
            highest_points_lost: docCP.highest_points_lost,
            highest_points_skipped: docCP.highest_points_skipped,
            highest_points_piggybacked_banked: docCP.highest_points_piggybacked_banked,
            highest_points_piggybacked_lost: docCP.highest_points_piggybacked_lost,
            highest_points_welfare_gained: docCP.highest_points_welfare_gained,
            highest_points_welfare_lost: docCP.highest_points_welfare_lost,
            highest_rolls_in_turn: docCP.highest_rolls_in_turn,
            highest_rolls_in_turn_without_fold: docCP.highest_rolls_in_turn_without_fold,
            passive_moneys_gained: docCP.passive_moneys_gained
        }
        await query(Bot.Util.SQL.getInsert(playerH, "farkle_history_players"));
    }

    //TODO this needs to be manually updated when these kinds of new values are added
    if(state.updateCurrentMatch) {
        await query(`UPDATE farkle_current_games SET current_player_user_id = ${docCG.current_player_user_id}, 
                     current_player_rolls = "${docCG.current_player_rolls}", 
                     current_player_points = ${docCG.current_player_points}, 
                     current_player_rolls_count = ${docCG.current_player_rolls_count}, 
                     current_player_high_stakes_choice = ${docCG.current_player_high_stakes_choice}, 
                     current_player_points_piggybacked = ${docCG.current_player_points_piggybacked},
                     last_turn_victory_user_id = ${docCG.last_turn_victory_user_id},
                     user_id_winner = ${docCG.user_id_winner}
        WHERE id = ${docCG.id}`);

        for(let player of docCPs) {
            await query (`UPDATE farkle_current_players SET total_points_banked = ${player.total_points_banked}, 
                          total_points_lost = ${player.total_points_lost}, 
                          total_points_skipped = ${player.total_points_skipped}, 
                          total_points_piggybacked_banked = ${player.total_points_piggybacked_banked}, 
                          total_points_piggybacked_lost = ${player.total_points_piggybacked_lost}, 
                          total_points_welfare_gained = ${player.total_points_welfare_gained}, 
                          total_points_welfare_lost = ${player.total_points_welfare_lost}, 
                          total_rolls = ${player.total_rolls}, 
                          total_folds = ${player.total_folds}, 
                          total_finishes = ${player.total_finishes}, 
                          total_skips = ${player.total_skips}, 
                          total_welfares = ${player.total_welfares}, 
                          highest_points_banked = ${player.highest_points_banked}, 
                          highest_points_lost = ${player.highest_points_lost}, 
                          highest_points_skipped = ${player.highest_points_skipped}, 
                          highest_points_piggybacked_banked = ${player.highest_points_piggybacked_banked}, 
                          highest_points_piggybacked_lost = ${player.highest_points_piggybacked_lost}, 
                          highest_points_welfare_gained = ${player.highest_points_welfare_gained}, 
                          highest_points_welfare_lost = ${player.highest_points_welfare_lost}, 
                          highest_rolls_in_turn = ${player.highest_rolls_in_turn}, 
                          highest_rolls_in_turn_without_fold = ${player.highest_rolls_in_turn_without_fold}
            WHERE user_id = ${player.user_id} AND id_current_games = ${player.id_current_games}`);
        }
    }

    if(state.gameEnded) {
        for(let player of docCPs) {
            await query(`DELETE FROM farkle_viewers WHERE user_id_target = ${player.user_id}`);
        }
        await query(`DELETE FROM farkle_current_players WHERE id_current_games = ${docCG.id}`);
        await query(`DELETE FROM farkle_current_games WHERE id = ${docCG.id}`);

        /** @type {Db.farkle_history_games} */
        let gameH = {
            id: /** @type {number} */(docCG.id),
            guild_id: docCG.guild_id,
            match_start_time: docCG.match_start_time,
            match_end_time: Date.now(),
            points_goal: docCG.points_goal,
            user_id_winner: docCG.user_id_winner ?? docCG.current_player_user_id,
            opening_turn_point_threshold: docCG.opening_turn_point_threshold,
            high_stakes_variant: docCG.high_stakes_variant,
            welfare_variant: docCG.welfare_variant,
            ai_version: docCG.ai_version,
            wager: docCG.wager,
            wager_pool: docCG.wager_pool
        }
        await query(Bot.Util.SQL.getInsert(gameH, "farkle_history_games"));

        for(let player of docCPs) {
            /** @type {Db.farkle_history_players} */
            let playerH = {
                id: /** @type {number} */(player.id),
                id_history_games: /** @type {number} */(gameH.id),
                user_id: player.user_id,
                turn_order: player.turn_order,
                has_conceded: false,
                total_points_banked: player.total_points_banked,
                total_points_lost: player.total_points_lost,
                total_points_skipped: player.total_points_skipped,
                total_points_piggybacked_banked: player.total_points_piggybacked_banked,
                total_points_piggybacked_lost: player.total_points_piggybacked_lost,
                total_points_welfare_gained: player.total_points_welfare_gained,
                total_points_welfare_lost: player.total_points_welfare_lost,
                total_rolls: player.total_rolls,
                total_folds: player.total_folds,
                total_finishes: player.total_finishes,
                total_skips: player.total_skips,
                total_welfares: player.total_welfares,
                highest_points_banked: player.highest_points_banked,
                highest_points_lost: player.highest_points_lost,
                highest_points_skipped: player.highest_points_skipped,
                highest_points_piggybacked_banked: player.highest_points_piggybacked_banked,
                highest_points_piggybacked_lost: player.highest_points_piggybacked_lost,
                highest_points_welfare_gained: player.highest_points_welfare_gained,
                highest_points_welfare_lost: player.highest_points_welfare_lost,
                highest_rolls_in_turn: player.highest_rolls_in_turn,
                highest_rolls_in_turn_without_fold: player.highest_rolls_in_turn_without_fold,
                passive_moneys_gained: player.passive_moneys_gained
            }
            await query(Bot.Util.SQL.getInsert(playerH, "farkle_history_players"));
        }

        /** @type {(Db.farkle_current_players|Db.farkle_history_players)[]} */
        let thisGameCHPs = Array.from((await query(`SELECT * FROM farkle_current_players WHERE id_current_games = ${docCG.id}`)).results).concat((await query(`SELECT * FROM farkle_history_players WHERE id_history_games = ${docCG.id}`)).results);

        postGameEndMessage.call(this, client, docCG, thisGameCHPs).catch(logger.error);
    }
    
}

/**
 * @this Farkle
 * @param {Discord.Client} client
 * @param {Db.farkle_current_games} docCG 
 * @param {Db.farkle_current_players} docCP
 * @param {Db.farkle_current_players[]} docCPs
 * @param {(Db.farkle_viewers|Db.farkle_current_players)[]} docCPVs
 */
async function decide(client, docCG, docCP, docCPs, docCPVs) {
    var docCPsRemaining = docCPs.slice();
    var docCPsTemp = docCPsRemaining.slice();
    var embed = getEmbedBlank();
    var turn = 1;

    while(true) {
        let str = "";

        /** @type {{rolls: number[], players: Db.farkle_current_players[], highest: number}} */
        let obj = _decide(docCPsTemp);

        for(let i = 0; i < docCPsTemp.length; i++) {
            let player = docCPsTemp[i];
            str += `🎲\`${obj.rolls[i]}\`: <@${player.user_id}>\n`
        }
        str += "\n";

        if(obj.players.length > 1) {
            docCPsTemp = docCPsTemp.filter(v => {
                for(let i = 0; i < obj.players.length; i++) {
                    if(v === obj.players[i])
                        return true;
                }
            });
        }
        else {
            str += `<@${obj.players[0].user_id}> is in place ${turn}.`;
            docCPsRemaining = docCPsRemaining.filter(v => {
                if(v !== obj.players[0])
                    return true;
            });
            docCPsTemp = docCPsRemaining.slice();

            obj.players[0].turn_order = turn;

            if(turn === 1) {
                docCG.current_player_user_id = obj.players[0].user_id;
            }
            turn++;

            if(docCPsRemaining.length === 1) {
                str += `\n<@${docCPsRemaining[0].user_id}> is in place ${turn}.`;

                docCPsRemaining[0].turn_order = turn;
            }
        }

        embed.description = str;
        for(let attendee of docCPVs) {
            await sendDM(client, attendee.user_id, attendee, embed);
        }

        await Bot.Util.Promise.sleep(2500);

        if(docCPsRemaining.length === 1) return;
    }
}
/**
 * 
 * @param {Db.farkle_current_players[]} docCPs
 * @returns {{rolls: number[], players: Db.farkle_current_players[], highest: number}} 
 */
function _decide(docCPs) {
    /** @type {number[]} */
    let rolls = [];

    //skip rolls where the dice is the same
    while(rolls.length === 0 || rolls.every(v => v === rolls[0])) {
        rolls.splice(0, rolls.length);
        for(let player of docCPs) {
            rolls.push(Bot.Util.getRandomInt(1, 7));
        }
    }

    let highest = 0;
    /** @type {Db.farkle_current_players[]} */ let players = [];

    for(let i = 0; i < rolls.length; i++) {
        let roll = rolls[i];
        if(roll === highest) {
            players.push(docCPs[i]);
        }
        else if(roll > highest) {
            players = [];
            highest = roll;
            players.push(docCPs[i]);
        }
    }

    return {
        rolls: rolls,
        players: players,
        highest: highest
    }
}

/**
 * @param {Db.farkle_current_players | Db.farkle_viewers} attendee
 * @param {{ type: ActionType|GameType|null, keep?: number[], points?: number, bank?: number, player?: Discord.Snowflake, targetPlayer?: Discord.Snowflake }} action 
 * @param {Db.farkle_current_games} docCG
 * @param {boolean=} victoryHeld
 * @returns {string}
 */
function getLastActionString(attendee, action, docCG, victoryHeld) {
    let str = "";

    if(action.type) {
        let name = `<@${action.player}>`;
        if(attendee.user_id === action.player) name = "You";

        switch(action.type) {
        case "keep":
            str = `> ${name} kept ${action.keep?.join(", ")} for ${action.points} points.`;
            break;
        case "finish":
            str = `> ${name} finished ${attendee.user_id===action.player?"your":"their"} turn with ${action.points} points, having last kept ${action.keep?.join(", ")}.`;
            //action.bank can be undefined in case of welfare end.
            if(action.bank != null) str += `\n> ${attendee.user_id===action.player?"Your":"Their"} bank is now ${action.bank}.`;
            break;
        case "hurry":
            str = `> ${name} ${attendee.user_id===action.player?"were":"was"} hurried and lost ${action.points} points, as well as the current turn.`;
            break;
        case "concede":
            str = `> ${name} ${attendee.user_id===action.player?"have":"has"} conceded the match.`
            break;
        case "fold":
            str = `> ${name} farkled.`
            break;
        case "new":
            str = `> ${name} chose to begin ${attendee.user_id===action.player?"your":"their"} turn with a new set of six dice.`
            break;
        case "continue":
            str = `> ${name} chose to continue the previous player's turn. ${attendee.user_id===action.player?"You":"They"} start with ${action.points} points.`
            break;
        case "welfare":
            str = `> ${name} farkled.`;
            //targetPlayer can be undefined in case of current player having the lowest amount of points
            if(action.targetPlayer != null) str += ` <@${action.targetPlayer}> received ${action.points} points and is now at ${action.bank} points.`;
            break;
        case "lastturn":
            if(victoryHeld)
                str = `> ${attendee.user_id===docCG.last_turn_victory_user_id?"You":`<@${docCG.last_turn_victory_user_id}>`} held ${attendee.user_id===docCG.last_turn_victory_user_id?"your":"their"} victory.`;
            else {
                str = '';
                if(action.points != null && action.keep != null && action.bank != null) {
                    str += `> ${name} finished ${attendee.user_id===action.player?"your":"their"} turn with ${action.points} points, having last kept ${action.keep?.join(", ")}.`;
                    if(action.bank != null) str += `\n> ${attendee.user_id===action.player?"Your":"Their"} bank is now ${action.bank}.`;
                }
                str += `\n> ${attendee.user_id===docCG.last_turn_victory_user_id?"You":`<@${docCG.last_turn_victory_user_id}>`} failed to hold ${attendee.user_id===docCG.last_turn_victory_user_id?"your":"their"} victory.`;
            }
            break;
        }
        if(action.type != null) str += "\n\n";
    }
    return str;
}

/**
 * @this {Farkle}
 * @param {Discord.Client} client
 * @param {{ type: "keep"|"finish"|"fold"|"hurry"|"concede"|null, keep: number[], points: number, bank?: number, player: Discord.Snowflake }} action
 * @param {Db.farkle_current_games} docCG
 * @param {Db.farkle_current_players[]} docCPs
 * @param {(Db.farkle_viewers|Db.farkle_current_players)[]} docCPVs
 * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
 */
async function highstakes(client, action, docCG, docCPs, docCPVs, query) {
    docCG.current_player_high_stakes_choice = true;

    for(let attendee of docCPVs) {
        let embed = getEmbedUser(docCG, docCPs);
        embed.fields = [];

        embed.description = getLastActionString(attendee, action, docCG);

        let count = JSON.parse(docCG.current_player_rolls).length;
        if(count === 0) count = MAX_DICE;
        
        if(attendee.user_id === docCG.current_player_user_id) {
            embed.description += `Type \`new\` or \`n\` to begin your turn with a fresh set of six dice.\nType \`continue\` or \`c\` to continue the previous player's turn. There ${count === 1 ? `**is 1 die**` : `**are ${count} dice**`} on the table to reroll, and you would start with **${action.points} points**.`;
        }
        else {
            embed.description += `<@${docCG.current_player_user_id}> is choosing to either begin their turn with a fresh set of six dice, or to continue the previous player's turn. There ${count === 1 ? `**is 1 die**` : `**are ${count} dice**`} on the table to reroll, and <@${docCG.current_player_user_id}> would start with **${action.points} points**.`;
        }

        await sendDM(client, attendee.user_id, attendee, embed);
    }
    
}
/**
 * @this {Farkle}
 * @param {Discord.Client} client
 * @param {{ type: "keep"|"finish"|"fold"|"hurry"|"concede"|null, keep: number[], points: number, bank?: number, player: Discord.Snowflake }} action
 * @param {Db.farkle_current_games} docCG
 * @param {Db.farkle_current_players[]} docCPs
 * @param {(Db.farkle_viewers|Db.farkle_current_players)[]} docCPVs
 * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
 */
 async function welfare(client, action, docCG, docCPs, docCPVs, query) {
    for(let attendee of docCPVs) {
        let embed = getEmbedUser(docCG, docCPs);
        embed.fields = [];

        embed.description = getLastActionString(attendee, action, docCG);

        if(attendee.user_id === docCG.current_player_user_id) {
            embed.description += `You scored more than the goal of ${docCG.points_goal} points. You must finish your turn with exactly ${docCG.points_goal} points to win.`;
        }
        else {
            embed.description += `<@${docCG.current_player_user_id}> scored more than the goal of ${docCG.points_goal} points. They must finish their turn with exactly ${docCG.points_goal} points to win.`;
        }
        embed.description += '\n\n**--- Farkle! ---**';

        await sendDM(client, attendee.user_id, attendee, embed);

        await Bot.Util.Promise.sleep(2500);
    }
 }

/**
 * Modifies `doc` object. Rolls dice until a player can `keep`.
 * @this {Farkle}
 * @param {Discord.Client} client
 * @param {{ type: ActionType|GameType|null, keep: number[], points: number, bank?: number, player: Discord.Snowflake, targetPlayer?: Discord.Snowflake }} action
 * @param {Db.farkle_current_games} docCG
 * @param {Db.farkle_current_players[]} docCPs
 * @param {Db.farkle_viewers[]} docVs
 * @param {(Db.farkle_viewers|Db.farkle_current_players)[]} docCPVs
 * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
 * @param {{ type: ActionType; updateCurrentMatch: boolean; gameEnded: boolean;}} state
}}
 */
async function roll(client, action, docCG, docCPs, docVs, docCPVs, query, state) {
    while(true) {
        let count = JSON.parse(docCG.current_player_rolls).length;
        if(count === 0) count = MAX_DICE;

        const rolls = [];
        for(let i = 0; i < count; i++) {
            rolls[i] = Bot.Util.getRandomInt(1, 7);
        }
        docCG.current_player_rolls = JSON.stringify(rolls);

        let playerCurrent = docCPs.find(v=>v.user_id === docCG.current_player_user_id);
        if(!playerCurrent) throw new Error("Farkle.roll: Player is null");
        playerCurrent.total_rolls++;
        docCG.current_player_rolls_count++;
        if(docCG.current_player_rolls_count > playerCurrent.highest_rolls_in_turn)
            playerCurrent.highest_rolls_in_turn = docCG.current_player_rolls_count;

        const fold = getFold(rolls);
        let grid = getRollsGrid(rolls, 5, 5);
        for(let attendee of docCPVs) {
            let embed = getEmbedUser(docCG, docCPs);
            embed.fields = [];

            embed.description = getLastActionString(attendee, action, docCG);

            /** @type {Db.farkle_users} */
            let docU = (await query(`SELECT * FROM farkle_users WHERE user_id = ${attendee.user_id}`)).results[0];

            let g = grid;
            let s = docU.skin;
            g = g.replace(/%1%/g, ` ${F.skins[s][1]} `);
            g = g.replace(/%2%/g, ` ${F.skins[s][2]} `);
            g = g.replace(/%3%/g, ` ${F.skins[s][3]} `);
            g = g.replace(/%4%/g, ` ${F.skins[s][4]} `);
            g = g.replace(/%5%/g, ` ${F.skins[s][5]} `);
            g = g.replace(/%6%/g, ` ${F.skins[s][6]} `);

            if(docCG.last_turn_victory_user_id != null) {
                const pointsNeeded = docCPs.slice().sort((a, b) => b.total_points_banked - a.total_points_banked)[0]?.total_points_banked??0;
                const pointsNeededUserId = docCPs.slice().sort((a, b) => b.total_points_banked - a.total_points_banked)[0]?.user_id??null;
                const pointsLeft = pointsNeeded - docCG.current_player_points - playerCurrent.total_points_banked + 50;

                embed.description += `${attendee.user_id === docCG.last_turn_victory_user_id ? "You have" : `<@${docCG.last_turn_victory_user_id}> has`} reached the goal! This is ${attendee.user_id === docCG.current_player_user_id ? "your" : `<@${docCG.current_player_user_id}>'s`} last chance to finish with more than ${pointsNeeded} points in the bank for a chance to win.\n${pointsLeft > 0 ? `${attendee.user_id === docCG.current_player_user_id ? "You have" : `<@${docCG.current_player_user_id}> has`} ${pointsLeft} points left to go to beat <@${pointsNeededUserId}>.` : `${attendee.user_id === docCG.current_player_user_id ? "You have" : `<@${docCG.current_player_user_id}> has`} enough points, with ${-pointsLeft} points ahead.`}\n\n`;
            }

            //${attendee.user_id === docCG.current_player_user_id ? "You" : `<@${docCG.last_turn_victory_user_id}>'s`}

            if(attendee.user_id === docCG.current_player_user_id)
                embed.description += `**Your rolls:**\n`;
            else
                embed.description += `**<@${docCG.current_player_user_id}>'s rolls:**\n`;
            if(docCG.opening_turn_point_threshold > 0 && docCPs.find(v => v.user_id === docCG.current_player_user_id)?.total_points_banked === 0) {
                embed.description += `This is ${attendee.user_id === docCG.current_player_user_id ? "your" : `<@${docCG.current_player_user_id}>'s`} __opening turn__. In order to be able to \`finish\`, ${attendee.user_id === docCG.current_player_user_id ? "you" : "they"} must do it with a total of at least ${docCG.opening_turn_point_threshold} points.\n`
            }

            embed.description += g;

            if(docCG.welfare_variant) {
                embed.description += `${attendee.user_id === docCG.current_player_user_id ? "You" : `<@${docCG.current_player_user_id}>`} must have exactly ${docCG.points_goal} points in the bank to win.\n`;
            }

            if(fold) {
                embed.description += `\n**--- Farkle! ---**`;
            }
            else {
                if(docCPs.includes(/** @type {Db.farkle_current_players} */(attendee))) {
                    if(attendee.user_id === docCG.current_player_user_id)
                        embed.description += `\n\`help\` • \`moves\` • \`emote\` • \`concede\``;
                    else
                        embed.description += `\n\`help\` • \`hurry\` • \`emote\` • \`concede\``;
                }
            }

            await sendDM(client, attendee.user_id, attendee, embed);
            if(fold) await Bot.Util.Promise.sleep(2500);
        }
        
        if(fold) {
            action.type = "fold";
            action.player = docCG.current_player_user_id;
            playerCurrent.total_folds++;
            playerCurrent.total_points_lost += docCG.current_player_points;
            playerCurrent.total_points_piggybacked_lost += docCG.current_player_points_piggybacked;
            if(docCG.current_player_points > playerCurrent.highest_points_lost)
                playerCurrent.highest_points_lost = docCG.current_player_points;
            if(docCG.current_player_points_piggybacked > playerCurrent.highest_points_piggybacked_lost)
                playerCurrent.highest_points_piggybacked_lost = docCG.current_player_points_piggybacked;
            
            if(await turn.call(this, client, docCG, docCPs, docVs, query, "fold", state, {})) {
                //game ended
                break;
            }
        }
        else {
            this._onNewTurn(docCG, docCPs);
            break;
        }
    }
}

/**
 * Modifies `docG` object. Moves to next turn.
 * @this {Farkle}
 * @param {Discord.Client} client
 * @param {Db.farkle_current_games} docCG 
 * @param {Db.farkle_current_players[]} docCPs
 * @param {Db.farkle_viewers[]} docVs
 * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
 * @param {"finish"|"fold"|"concede"|"hurry"|"welfare"} type
 * @param {{ type: ActionType; updateCurrentMatch: boolean; gameEnded: boolean;}} state
 * @param {null|{ keep?: number[], points?: number, bank?: number, player?: Discord.Snowflake, targetPlayer?: Discord.Snowflake }} lastTurnAction
 * @returns {Promise<boolean>}  true if game ended, false otherwise
 */
async function turn(client, docCG, docCPs, docVs, query, type, state, lastTurnAction) {
    docCG.current_player_rolls_count = 0;
    docCG.current_player_points_piggybacked = 0;

    //Do not reset these here if we are playing the high stakes variant and the last player just finished their turn.
    //These will be reset if the player chooses to start from a new set of dice in high stakes.
    if(!(docCG.high_stakes_variant && type === "finish")) {
        docCG.current_player_points = 0;
        docCG.current_player_rolls = "[]";
    }

    var player = docCPs.find(v => v.user_id === docCG.current_player_user_id);
    if(!player) throw new Error('player not found')
    let playerCurrent = player;

    var player = docCPs.find(v => v.turn_order === playerCurrent.turn_order + 1);
    if(!player) {
        player = docCPs.find(v => v.turn_order === 1);
        if(!player) throw new Error('player not found')
    }
    let playerNext = player;

    docCG.current_player_user_id = playerNext.user_id;


    let embed = getEmbedBlank();
    embed.footer = undefined;
    let str = "";
    var arr = [];
    for(let player of docCPs) {
        arr.push(player);
    }
    arr.sort((a, b) => b.total_points_banked - a.total_points_banked);
    for(let player of arr) {
        str += `${player.total_points_banked} pts - <@${player.user_id}>\n`;
    }
    embed.description = str;
    
    await sendDM(client, playerNext.user_id, playerNext, embed);

    if(lastTurnAction != null) {
        if(docCG.last_turn_victory_user_id != null && docCG.last_turn_victory_user_id === docCG.current_player_user_id) {
            await end.call(this, client, Object.assign({ type: /** @type {"lastturn"} */("lastturn") }, lastTurnAction), docCG, docVs, docCPs, query);
            state.gameEnded = true;
            return true;
        }
    }
    return false;
}

/**
 * @this Farkle
 * @param {Discord.Client} client
 * @param {{ type: ActionType|GameType|null, keep?: number[], points?: number, bank?: number, player?: Discord.Snowflake, targetPlayer?: Discord.Snowflake }} action
 * @param {Db.farkle_current_games} docCG 
 * @param {Db.farkle_viewers[]} docVs
 * @param {Db.farkle_current_players[]} docCPs
 * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
 */
async function end(client, action, docCG, docVs, docCPs, query) {
    //Fallback behavior
    docCG.user_id_winner = docCG.current_player_user_id;
    let victoryHeld = true;

    if(action.type === 'lastturn') {
        //Determine who has the most points
        let sorted = docCPs.slice().sort((a, b) => b.total_points_banked - a.total_points_banked);
        //Ignore determination if there is a tie
        if(sorted.length >= 2 && sorted[0].total_points_banked !== sorted[1].total_points_banked) {
            if(docCG.user_id_winner !== sorted[0].user_id) {
                docCG.user_id_winner = sorted[0].user_id;
                victoryHeld = false;
            }
        }
    }

    //Winner is determined. 
    for(let player of docCPs) {
        let str = "";
        if(player.user_id === docCG.user_id_winner) {
            let wagerGained = docCG.wager_pool;
            str = `You win!\n`;

            if(wagerGained > 0) {
                await query(`UPDATE farkle_users SET moneys = moneys + ${wagerGained} WHERE user_id = ${player.user_id}`)
                str += `You got ${MONEYS_ICON} ${wagerGained} from wagers. Well done!\n`;
            }
        }
        else
            str = `<@${docCG.user_id_winner}> wins!\n`;

        //Give passive income if player is winner or player is not winner and hasn't conceded when only 2 players are remaining
        if(player.user_id === docCG.user_id_winner || (!(player.user_id === docCG.user_id_winner) && action.type !== "concede")) {
            let passiveMoneysGained = player.total_points_banked / 50;
            if(passiveMoneysGained > 0) {
                player.passive_moneys_gained = passiveMoneysGained;
                await query(`UPDATE farkle_users SET moneys = moneys + ${passiveMoneysGained} WHERE user_id = ${player.user_id}`)
                str += `You got ${MONEYS_ICON} ${passiveMoneysGained} from playing. \\o/`;
            }
        }

        let embed = getEmbedUser(docCG, docCPs, true);
        embed.description = `${getLastActionString(player, action, docCG, victoryHeld)}${str}`;

        await sendDM(client, player.user_id, player, embed);
    }

    for(let viewer of docVs) {
        let str = `<@${docCG.user_id_winner}> wins!`;

        let embed = getEmbedUser(docCG, docCPs, true);
        embed.description = `${getLastActionString(viewer, action, docCG, victoryHeld)}${str}`;
        await sendDM(client, viewer.user_id, viewer, embed);
    }
}

const Q = Object.freeze({
    /**
     * @param {Discord.Snowflake} id 
     * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
     * @returns {Promise<number>}
     */
    getPlayerLastSeen: async (id, query) => {
        var q = (await query(`select max(hg.match_end_time)
        from farkle_history_games hg
        join farkle_history_players hp on hg.id = hp.id_history_games
        where hp.user_id = ${id}
        group by hp.user_id`)).results[0];
        if(q) return Object.values(q)[0];
        return 0;
    },

    /**
     * @param {Discord.Snowflake} id 
     * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
     * @returns {Promise<number>}
     */
    getPlayerHighestPlayerCountGamePlayed: async (id, query) => {
        var q = (await query(`select max(sub1.players) as 'players' from(
            select count(hp.id_history_games) as 'players', 'a' as 'a' from farkle_history_players hp
            where hp.id_history_games in (
            select hp2.id_history_games from farkle_history_players hp2
            where hp2.user_id = ${id}
            ) group by hp.id_history_games
            ) sub1 group by sub1.a`)).results[0];
        
        return q ? q.players : 0;
    },

    /**
     * @param {Discord.Snowflake} id 
     * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
     * @param {number} players
     * @returns {Promise<number>}
     */
    getPlayerWinsInXPlayerMatches: async (id, query, players) => {
        var q = (await query(`select count(hg.user_id_winner) as 'wins' from (
            select hp.id_history_games from farkle_history_players hp
            group by hp.id_history_games
            having count(hp.id_history_games) = ${players}) 
            subquery join farkle_history_games hg on subquery.id_history_games = hg.id
            where hg.user_id_winner = ${id}
            group by hg.user_id_winner`)).results[0];

        return q ? q.wins : 0;
    },

    /**
     * @param {Discord.Snowflake} id 
     * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
     * @param {number} players
     * @returns {Promise<number>}
     */
    getPlayerGamesInXPPlayerMatches: async (id, query, players) => {
        var q = (await query(`select count(sub1.id_history_games) as 'games' from (
            select hp.id_history_games as 'id_history_games', 'a' as 'a' from farkle_history_players hp
            where hp.user_id = ${id}) sub1
            where sub1.id_history_games in (
            select hp2.id_history_games from farkle_history_players hp2
            group by hp2.id_history_games
            having count(hp2.id_history_games) = ${players})
            group by sub1.a`)).results[0];
        
        return q ? q.games : 0;
    },
});

/**
 * @this {Farkle}
 * @param {Discord.Client} client
 * @param {(s: string) => Promise<{results: any, fields: any[] | undefined}>} query
 * @param {Discord.Snowflake} guildId
 */
async function updateLeaderboard(client, query, guildId) {
    var embed = getEmbedBlank();
    embed.title = "Bones";
    embed.timestamp = undefined;

    const now = Date.now()

    /** @type {Db.farkle_channels} */
    let channels = (await query(`SELECT * FROM farkle_channels`)).results[0];

    /** @type {Db.farkle_users[]} */
    let users = (await query(`SELECT * FROM farkle_users`)).results;
    users.sort((a, b) => b.moneys - a.moneys);

    /** @type {null|Db.farkle_users} */
    let fluffyUser = null;

    /** @type {null|Db.farkle_users} */
    let sUser = null;
    
    let remainingTotal = 0;

    for(let i = 0; i < users.length; i++) {
        let user = users[i]
        if(user.user_id === client.user?.id) {
            fluffyUser = user;
            users.splice(i, 1);
            i--;
            continue;
        }

        if(user.user_id === this.bot.fullAuthorityOverride) {
            sUser = user;
            users.splice(i, 1);
            i--;
            continue;
        }

        //TODO this might be too slow
        const lastSeen = await Q.getPlayerLastSeen(user.user_id, query);
        if(lastSeen < now - (1000*60*60*24*30)) {
            remainingTotal += users[i].moneys;
            users.splice(i, 1);
            i--;
            continue;
        }
    }

    if(fluffyUser != null) {
        embed.description += `${MONEYS_ICON} *${Util.getFormattedLargeNumber(fluffyUser.moneys)} - <@${fluffyUser.user_id}> the Dice Master*\n`;
    }
    else {
        embed.description = '';
    }

    if(sUser != null) {
        embed.description += `${MONEYS_ICON} *${Util.getFormattedLargeNumber(sUser.moneys)} - <@${sUser.user_id}> the Janitor*\n`;
    }
    embed.description += '\n';
    
    let i = 0;
    let guild = await client.guilds.fetch(guildId).catch(() => null);
    if(guild != null) {
        for(let user of users) {
            let member = await guild.members.fetch(user.user_id).catch(() => null);
            if(member != null) {
                if(i === 0) {
                    let r = this.bot.getRoleId(guild.id, "FARKLE_CHAMPION");
                    embed.description += (r == null ? "*The Farkle Champion:*" : `*The <@&${r}>:*`) + "\n"
                }
                if(i === 1) {
                    embed.description += "\n*The common folk:*\n"
                }
                embed.description += `${i===0?'**':''}${MONEYS_ICON} ${Util.getFormattedLargeNumber(user.moneys)} - ${member.nickname??member.displayName??member.user.username}${i===0?'**':''}\n`;
                i++;
            }
        }
        if(remainingTotal > 0)
            embed.description += `${MONEYS_ICON} ${Util.getFormattedLargeNumber(remainingTotal)} - *Other players*\n`;
        embed.description += "*Only players active recently are shown*\n*You can also use `/f profile` to see your bones*";
    }

    var farkleChannel = this.cache.get(guildId, "farkle_channel_id");
    if(guild != null && farkleChannel != null) {
        let channel = await guild.channels.fetch(farkleChannel).catch(() => null);
        if(channel instanceof Discord.TextChannel) {
            let message = null;
            if(channels.leaderboard_msg_id != null) {
                message = await channel.messages.fetch(channels.leaderboard_msg_id).catch(() => null)
            }

            if(message == null) {
                let message = await channel.send({ embeds: [embed] });
                await query(`UPDATE farkle_channels SET leaderboard_msg_id = ${message.id}`)
            }
            else {
                await message.edit({embeds: [embed]});
            }
        }

        if(users.length > 0) {
            let championId = users[0].user_id;

            let roleId = this.bot.getRoleId(guild.id, "FARKLE_CHAMPION");
            if(roleId) {
                let role = guild.roles.cache.get(roleId);
                if(role != null) {
                    let members = role.members;
                    for(let [id, member] of members) {
                        if(id !== championId) member.roles.remove(role).catch(logger.error);
                    }
                }

                let member = await guild.members.fetch(championId).catch(() => null);
                if(member && role) {
                    if(!member.roles.cache.get(roleId)) member.roles.add(role).catch(logger.error);
                }
            }
        }
    }
}

/**
 * @this {Farkle}
 * @param {Discord.Client} client
 * @param {Db.farkle_current_games} docCG
 * @param {(Db.farkle_current_players|Db.farkle_history_players)[]} thisGameCHPs
 */
async function postGameEndMessage(client, docCG, thisGameCHPs) {
    var embed = getEmbedBlank();
    embed.title = undefined;
    embed.timestamp = undefined;

    let players = thisGameCHPs.slice().sort((a, b) => b.total_points_banked - a.total_points_banked);
    embed.description = `Game ended between `;
    for(let i = 0; i < players.length; i++) {
        let docCP = players[i];
        embed.description += `<@${docCP.user_id}> (${docCP.total_points_banked})`;
        if(i + 1 !== players.length) {
            embed.description += ', ';
        }
    }

    embed.description += `\nPoint goal: **${docCG.points_goal}**${docCG.opening_turn_point_threshold > 0 ? ` (**${docCG.opening_turn_point_threshold}**)`:``}`;
    if(docCG.high_stakes_variant) embed.description += `  •  **High Stakes**`;
    if(docCG.welfare_variant) embed.description += `  •  **Welfare**`;

    embed.description += `\n${thisGameCHPs.reduce((a, v) => a += v.total_rolls, 0)} rolls were thrown • <@${docCG.user_id_winner}> won${docCG.wager_pool > 0 ? ` ${MONEYS_ICON} ${docCG.wager_pool}`:''}.`;

    var farkleChannel = this.cache.get(docCG.guild_id, "farkle_channel_id");
    if(farkleChannel != null) {
        let guild = await client.guilds.fetch(docCG.guild_id);
        let channel = await guild.channels.fetch(farkleChannel);
        if(channel instanceof Discord.TextChannel) {
            channel.send({ embeds: [embed] });
        }
    }
}

/**
 * @param {Discord.Client} client 
 * @param {string} user_id
 * @param {Db.farkle_current_players|Db.farkle_viewers} docCPV
 * @param {Discord.APIEmbed|string} embed
 */
async function sendDM(client, user_id, docCPV, embed) {
    if(docCPV.channel_dm_id == null) return;
    await (await (await client.users.fetch(user_id))?.createDM()).send(typeof embed === 'string' ? embed : { embeds: [embed] });
}


/**
 * @param {Discord.GuildMember|null} member
 * @param {Discord.User} user
 *
 */
function getUserDisplayName(member, user) {
    return member?.nickname ?? member?.displayName ?? user.displayName ?? user.username
}

/**
 * https://stackoverflow.com/a/72096323
 * I'll write my own one day
 * @param {number[]} chars 
 * @param {number} len 
 * @returns 
 */
function getCombinations(chars, len) {
    /** @type {number[][]} */
    var result = [];
    /**
     * 
     * @param {number[]} prefix 
     * @param {number[]} chars 
     */
    var f = function(prefix, chars) {
      for (var i = 0; i < chars.length; i++) {
        var elem = [...prefix, chars[i]];
        if(elem.length == len)
          result.push(elem);
        f(elem, chars.slice(i + 1));
      }
    }
    f([], chars);
    return result;
  }