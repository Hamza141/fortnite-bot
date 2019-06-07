const fs = require('fs');


function writeToFile(object, print=true) {
    const timestamp = getTimestamp();
    if (print === true) {
        console.log([timestamp, object]);
    }
    fs.appendFileSync("output.txt", timestamp + " " + JSON.stringify(object, null, 2) + "\n\n\n",
        function (err) {
            if (err) {
                console.log(object);
                return console.log(err);
            }
        });
}


function dumpCache(cache) {
    fs.writeFileSync('cache.json', JSON.stringify(cache, null, 2), 'utf-8');
}


function loadCache() {
    if (fs.existsSync('cache.json')) {
        let old_cache;
        try {
            old_cache = JSON.parse(fs.readFileSync('cache.json', 'utf-8'));
        } catch (error) {
            writeToFile(error);
            return {};
        }
        return old_cache;
    } else {
        return {};
    }
}


// Takes any string and converts it into a #RRGGBB color.
let getColor = (function () {
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


module.exports = {
    writeToFile: writeToFile,
    loadCache: loadCache,
    dumpCache: dumpCache,
    getColor: getColor,
    getTimestamp: getTimestamp,
    getInterval: getInterval
};