const Fortnite = require('fortnite-api');
const Discord = require('discord.js');
const utils = require('./utils');

if (process.argv.length === 2) {
    const result = require('dotenv').config();

    if (result.error) {
        console.log(result.error);
        utils.writeToFile(result.error);
        process.exit(1);
    }
}

let logged_in_discord = false;
let channel;

const client = new Discord.Client();
discordLogin(client);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
});

client.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('Pong!').then();
    }
});


function discordLogin(client) {
    client.login(process.env.bot_token).then(message => {
        if (message !== process.env.bot_token) {
            const error = 'Wrong token returned after logging in';
            console.log(error);
            utils.writeToFile(error);
            process.exit(1);
        } else {
            logged_in_discord = true;
            // noinspection JSUnresolvedVariable
            channel = client.channels.find(value => value.id === process.env.channel_id);
        }
    }, error => {
        console.log(error);
        utils.writeToFile(error);
        process.exit(1);
    });
}


const fortnite_credentials = [
    process.env.email,
    process.env.password,
    process.env.fortnite_launcher_token,
    process.env.fortnite_client_token
];

const players = [
    ['Hamza141', 'pc'],
    ['owasim3', 'pc'],
    ['Isildur1996', 'pc'],
    ['Shaz2526', 'ps4'],
    // ['Ninja', 'pc'],
    // ['Tfue', 'pc']
];

let cache = utils.loadCache();
utils.writeToFile(cache);

let intervalID;
let current_index = 0;
const num_players = players.length;

let fortniteAPI = new Fortnite(fortnite_credentials);
fortniteLogin();


function fortniteLogin() {
    fortniteAPI.login().then(() => {
        intervalID = setInterval(getMatchDate, 2500);
    }).catch(error => {
        console.log(error);
        utils.writeToFile(error);
        process.exit(1);
    });
}


function restartFortnite() {
    const output = 'Restarting fortnite api';
    console.log([utils.getTimestamp(), output]);
    utils.writeToFile(output);

    logged_in_discord = false;
    clearInterval(intervalID);
    fortniteAPI.kill().then(message => {
        console.log(message);
        utils.writeToFile(message);
        fortniteLogin();
    }).catch(error => {
        console.log(error);
        utils.writeToFile(error);
        fortniteLogin();
    });
}


function getMatchDate() {
    const player = players[current_index];
    const username = player[0];
    const platform = player[1];

    // todo wait for response before sending new request
    fortniteAPI
        .getStatsBR(username, platform, "weekly")
        .then(stats => {
            processStats(username, stats.group);
        })
        .catch(err => {
            console.log([utils.getTimestamp(), err, username, platform]);
            restartFortnite();
        });

    current_index = (current_index + 1) % num_players;
}


function processStats(username, stats) {
    if (username === undefined || stats === undefined) {
        return;
    }

    let stats_updated = false;
    if (username in cache) {
        const wins = compareWins(username, stats);
        const kills = compareKills(username, stats);
        stats_updated = sendMessage(username, wins, kills);

        if (stats_updated) {
            cache[username] = stats;
            utils.dumpCache(cache);
            utils.writeToFile({username: stats});
        }
    } else {
        cache[username] = stats;
        utils.dumpCache(cache);
    }
}


function sendMessage(username, win, kills) {
    if (logged_in_discord) {
        let title = null;
        let description = null;

        if (win !== null) {
            title = 'Random message about win';
            if (kills === null) {
                description = '[' + win + '] ' + username + ' just won WITHOUT any kills!';
            } else {
                description = '[' + kills[0] + '] ' + username + ' just won and got ' + kills[1] + ' kills!';
            }
        } else if (kills != null && kills[1] >= kills[2] * 3) {
            title = 'Random message about kills';
            description = '[' + kills[0] + '] ' + username + ' just got ' + kills[1] + ' kills!';
        }

        if (description !== null) {
            const embed = new Discord.RichEmbed();
            if (kills !== null && kills[2] !== 1) {
                description += ' (in ' + kills[2] + ' matches - this shouldn\'t happen)'
            }
            embed.setTitle(title)
                .setColor(utils.getColor.next(username))
                .setDescription(description);
            channel.send(embed);
            console.log(utils.getTimestamp());
            console.log(description);
            utils.writeToFile(description);
        }

        if (win != null || kills != null) {
            return true;
        }
    }
    return false;
}


function compareWins(username, stats) {
    const old_stats = cache[username];
    if (old_stats.solo.wins < stats.solo.wins) {
        return 'solo';
    } else if (old_stats.duo.wins < stats.duo.wins) {
        return 'duos';
    } else if (old_stats.squad.wins < stats.squad.wins) {
        return 'squad';
    }
    return null;
}


function compareKills(username, stats) {
    const old_stats = cache[username];
    if (old_stats.solo.kills < stats.solo.kills) {
        return ['solo', stats.solo.kills - old_stats.solo.kills, stats.solo.matches - old_stats.solo.matches];
    } else if (old_stats.duo.kills < stats.duo.kills) {
        return ['duos', stats.duo.kills - old_stats.duo.kills, stats.duo.matches - old_stats.duo.matches];
    } else if (old_stats.squad.kills < stats.squad.kills) {
        return ['squad', stats.squad.kills - old_stats.squad.kills, stats.squad.matches - old_stats.squad.matches];
    }
    // todo don't return null
    return null;
}
