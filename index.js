const fs = require('fs');
const Fortnite = require("fortnite-api");
const Discord = require('discord.js');

const client = new Discord.Client();

if (process.argv.length === 2) {
    const result = require('dotenv').config();

    if (result.error) {
        console.log(result.error);
        writeToFile(result.error);
        process.exit(1);
    }
}

let logged_in_discord = false;
let channel;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
});

client.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('Pong!')
    }
});

client.login(process.env.bot_token).then(message => {
    if (message !== process.env.bot_token) {
        const error = 'Wrong token returned after logging in';
        console.log(error);
        writeToFile(error);
    } else {
        logged_in_discord = true;
        // noinspection JSUnresolvedVariable
        channel = client.channels.find(value => value.id === process.env.channel_id);
    }
}, err => {
    console.log(err);
});

const fortnite_credentials = [
    process.env.email,
    process.env.password,
    process.env.fortnite_launcher_token,
    process.env.fortnite_client_token];

let fortniteAPI = new Fortnite(fortnite_credentials);


const players = {
    'Hamza141': 'pc',
    'owasim3': 'pc',
    'Isildur1996': 'pc',
    'Shaz2526': 'ps4',
    // 'Ninja': 'pc',
    // 'Tfue': 'pc'
};


let cache = loadCache();
writeToFile(cache);

fortniteAPI.login().then(() => {
    setInterval(getMatchDate, getInterval());
}).catch(err => {
    console.log(err);
});


function getTimestamp() {
    return new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
}

function getInterval() {
    const num = Object.keys(players).length;
    if (num <= 2) {
        return 4000;
    }
    if (num < 5) {
        return num * 2000;
    }
    return 10000;
}

function getMatchDate() {
    for (const [username, platform] of Object.entries(players)) {
        fortniteAPI
            .getStatsBR(username, platform, "weekly")
            .then(stats => {
                updateCache(username, stats.group);
            })
            .catch(err => {
                console.log(err);
            });
    }
}


function updateCache(username, stats) {
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
            dumpCache();

            writeToFile({username: stats});
        }
    } else {
        cache[username] = stats;
        dumpCache();
    }
}


function sendMessage(username, win, kills) {
    if (logged_in_discord) {
        let title = null;
        let description = null;

        if (win != null) {
            title = 'Random message about win';
            description = '[' + kills[0] + '] ' + username + ' just won and got ' + kills[1] + ' kills!';
        } else if (kills != null && kills[1] >= kills[2] * 3) {
            title = 'Random message about kills';
            description = '[' + kills[0] + '] ' + username + ' just got ' + kills[1] + ' kills!';
        }

        if (description != null) {
            const embed = new Discord.RichEmbed();
            if (kills[2] !== 1) {
                description += ' (in ' + kills[2] + ' matches - this shouldn\'t happen)'
            }
            embed.setTitle(title)
                .setColor(StringToColor.next(username))
                .setDescription(description);
            channel.send(embed);
            console.log(getTimestamp());
            console.log(description);
            writeToFile(description);
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
    return null;
}


function writeToFile(object) {
    fs.appendFileSync("output.txt", getTimestamp() + " " + JSON.stringify(object, null, 2) + "\n\n\n",
        function (err) {
            if (err) {
                console.log(object);
                return console.log(err);
            }
        });
}

function dumpCache() {
    fs.writeFileSync('cache.json', JSON.stringify(cache, null, 2), 'utf-8');
}


function loadCache() {
    if (fs.existsSync('cache.json')) {
        let old_cache;
        try {
            old_cache = JSON.parse(fs.readFileSync('cache.json', 'utf-8'));
        } catch (error) {
            console.log(getTimestamp());
            console.log(error);
            writeToFile(error);
            return {};
        }
        return old_cache;
    } else {
        return {};
    }
}


// Takes any string and converts it into a #RRGGBB color.
let StringToColor = (function () {
    let instance = null;

    return {
        next: function stringToColor(str) {
            if (instance === null) {
                instance = {};
                instance.stringToColorHash = {};
                instance.nextVeryDifferntColorIdx = 0;
                instance.veryDifferentColors = [
                    "#7544B1", "#B500FF", "#00FF78", "#FF6E41",
                    "#FF0000", "#00FF00", "#0000FF", "#000000",
                    "#01FFFE", "#FFA6FE", "#FFDB66", "#006401",
                    "#010067", "#95003A", "#007DB5", "#FF00F6",
                    "#FFEEE8", "#774D00", "#90FB92", "#0076FF",
                    "#D5FF00", "#FF937E", "#6A826C", "#FF029D",
                    "#FE8900", "#7A4782", "#7E2DD2", "#85A900",
                    "#FF0056", "#A42400", "#00AE7E", "#683D3B",
                    "#BDC6FF", "#263400", "#BDD393", "#00B917",
                    "#9E008E", "#001544", "#C28C9F", "#FF74A3",
                    "#01D0FF", "#004754", "#E56FFE", "#788231",
                    "#0E4CA1", "#91D0CB", "#BE9970", "#968AE8",
                    "#BB8800", "#43002C", "#DEFF74", "#00FFC6",
                    "#FFE502", "#620E00", "#008F9C", "#98FF52",
                    "#005F39", "#6B6882", "#5FAD4E", "#A75740",
                    "#A5FFD2", "#FFB167", "#009BFF", "#E85EBE"
                ];
            }

            if (!instance.stringToColorHash[str])
                instance.stringToColorHash[str] = instance.veryDifferentColors[instance.nextVeryDifferntColorIdx++];

            return instance.stringToColorHash[str];
        }
    }
})();