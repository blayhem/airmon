const partjs = require("./particles.js");
const particles = partjs.p;

const metjs = require("./meteo.js");
const meteo = metjs.m;

const trafjs = require("./traffic.js");
const traffic = trafjs.t;

const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const domain = process.env.aws;
if(!domain) {
    console.error("No url for mongoDB instance");
    process.exit();
}
const url = `mongodb://${domain}:27017/`;

function buildData(table, type) {
    Object.keys(table).map(k => {
        let obj = {};
        obj[type] = table[k];
        rows[k] = {...rows[k], ...obj};
    });
}

function processData() {
    // console.table(rows);

    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        assert.equal(null, err);
        const db = client.db("airmon");

        Object.keys(rows)
        // .slice(0,4) // trying only with 4 zones to begin with
            .map(k => {
                let {particles, meteo, traffic} = rows[k];
                // note: particles & meteo hours may be 1-2h delayed.
                // hour_t is correct ("current" hour and search key)

                // Updating particles data
                try{
                    db
                        .collection(k)
                        .update(
                            // has: traffic data & hour_t
                            {"hour_t": { $eq: particles.hour_p }},
                            // how has: traffic, t_h, particles
                            { $set: particles });
                    // .then(r => console.log(`Particles for ${particles.hour_p}. Got: ${r.result}`))
                    // .catch(e => console.log(e));
                } catch(e) {
                    console.error(e);
                }

                // Updating meteo data
                try{
                    db
                        .collection(k)
                        .update(
                            // has: traffic data & hour_t
                            {"hour_t": { $eq: meteo.hour_m }},
                            // how has: traffic, t_h, meteo
                            { $set: meteo });
                    // .then(r => console.log(`Meteo for ${meteo.hour_m}. Got: ${r.result}`))
                    // .catch(e => console.log(e));
                } catch(e) {
                    console.error(e);
                }

                // Inserting new row (with traffic)
                try {
                    // let doc =
                    db
                        .collection(k)
                        .insertOne(traffic, {w: 1}, (err, r) => {
                            try {
                                assert.equal(null, err);
                                assert.equal(1, r.insertedCount);
                            }catch(e) {
                                console.error(`error in callback: ${e}`);
                            }
                        });
                // console.log(doc)
                }catch(e) {
                    console.error(e);
                }
            });
        client.close();
    });
}

let rows = { // 24 tables, each with 1 (new) row
    "8":  [],
    "4":  [],
    "11": [],
    "16": [],
    "17": [],
    "18": [],
    "24": [],
    "27": [],
    "35": [],
    "36": [],
    "38": [],
    "39": [],
    "40": [],
    "47": [],
    "48": [],
    "49": [],
    "50": [],
    "54": [],
    "55": [],
    "56": [],
    "57": [],
    "58": [],
    "59": [],
    "60": []
};

let cron = require("node-cron");

let task = cron.schedule("0 * * * *", function() {
    console.log("Loading particles data");
    particles(data_p => {
        buildData(data_p, "particles");
        console.log("Loading meteo data");
        meteo(data_m => {
            buildData(data_m, "meteo");
            console.log("Loading traffic data");
            traffic(data_t => {
                buildData(data_t, "traffic");
                processData();
            });
        });
    });
}, false);

task.start();