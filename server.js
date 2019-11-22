const express = require('express');
const app = express();
const http = require('http');
const https = require('https');

const soap = require('soap');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const mongoose = require("mongoose"); 
const URI = 'mongodb+srv://public:public@snowfinder-h8uzj.mongodb.net/snotel?retryWrites=true&w=majority';
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true); 

const Schema = mongoose.Schema;
let metadataSchema = new Schema({
    name: String,
    latitude: Number,
    longitude: Number,
    elevation: Number,
    countyName: String,
    beginDate: Date,
    endDate: Date,
    stationDataTimeZone: Number,
    stationTriplet: { type: String, unique: true },
})
const METADATA = mongoose.model('snotel', metadataSchema);

app.use(express.static('dist', { dotfiles: 'allow' }));

const url = 'https://www.wcc.nrcs.usda.gov/awdbWebService/services?WSDL'; 


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/dist/index.html');
});

app.get('/api/resorts', function (req, res) {
    res.json({"hello": "world"});
});

const getAllStations = () => {
    return new Promise((resolve, reject) => {
        const args = { networkCds: "SNTL" };
        soap.createClient(url, (err, client) => {
            if (err) throw err;
            let describe = client.describe()
            let resp = client.AwdbWebService.AwdbWebServiceImplPort.getStations(args, (err, stationArr) => {
                if (err) throw err;
                return resolve(stationArr["return"]);
            })
        });
    })
}

const getStationMetadata = (triplet) => {
        return new Promise((res, rej) => {
            soap.createClient(url, (err, client) => {
            client.AwdbWebService.AwdbWebServiceImplPort.getStationMetadata({   stationTriplet: triplet }, (err, stationData) => {
                if(err) throw err;
                return res(stationData['return'])
            })
        })
    })
}

const getHourlyData = (triplet, begin, end, code = 'SNWD') => {
    const args = { 
        stationTriplets: triplet.split(','), 
        elementCd: code, 
        ordinal: 1, 
        beginDate: begin, 
        endDate: end 
    }

    return new Promise((res, rej) => {
        soap.createClient(url, (err, client) => {
            client.AwdbWebService.AwdbWebServiceImplPort.getHourlyData(args, (err, stationData) => {
                if (err) throw err;

                let output = {}
                stationData['return'].forEach(station => {
                    output[station.stationTriplet] = station;
                    output[station.stationTriplet].code = code;
                })
                return res(output)
            })
        })
    })
}

function mySort(array, lat, lng) {
    array.sort(function (a, b) {

        let distanceA = Math.sqrt((a.latitude - lat) ** 2 + (a.longitude - lng) ** 2);
        let distanceB = Math.sqrt((b.latitude - lat) ** 2 + (b.longitude - lng) ** 2);
        if (distanceA < distanceB) {
            return -1;
        } else if (distanceA > distanceB) {
            return 1;
        } else {
            return 0;
        }
    })

    return array;
}

app.get('/api/snotel/nearest', async (req, res) => {
    const { lat, lng, n } = req.query;
    let query = METADATA.find({}, '-_id -__v')

    query.exec(function (err, metadata) {
        let output = mySort(metadata, lat, lng).slice(0, n)
        res.json({ lat: lat, lng: lng, n: n, stations: output })
    })
})

app.get('/api/snotel', async (req, res) => {
    let { triplet, begin, end } = req.query;
    begin = begin || "2019-11-19";
    end = end || "2019-11-20";
    var url = 'https://www.wcc.nrcs.usda.gov/awdbWebService/services?WSDL';

    if (triplet) {



        handleReturnObject = async () => {

            let snowDepth = await getHourlyData(triplet, begin, end, "SNWD"); // Snow Depth
            let swe = await getHourlyData(triplet, begin, end, "WTEQ"); // Snow Water equivalent
            let tempObs = await getHourlyData(triplet, begin, end, "TOBS") // Observed Temp

            //console.log(snowDepth)
            let data = {};
            
            let triplets = Object.keys(snowDepth);

            for(let i = 0; i < triplets.length; i++) {
                let key = triplets[i]

                let stationData = snowDepth[key].values.map((obs, j) => {
                    let output = {
                        date: obs.dateTime,
                        snow_depth: parseFloat(obs.value),
                        snow_water_equivalent: parseFloat(swe[key].values[j].value),
                        temperature: parseFloat(tempObs[key].values[j].value),
                    }
                    return output;
                });
                data[key] = stationData;
            }
            return data;

        }

        let data = await handleReturnObject()

        //console.log(hourlyData)

        METADATA.find({ 
            stationTriplet: {$regex: triplet.replace(',',"|"), $options: 'i'} }, 
            '-_id -__v -beginDate -endDate', 
            function (err, metadata) {
                output = metadata.map(station => {
                    let stationData = { ...station._doc };
                    stationData.beginDate = begin;
                    stationData.endDate = end;
                    stationData['data'] = data[station.stationTriplet];
                    return stationData
                })
                res.json(output)
        })
    }
    else {
        METADATA.find({}, '-_id -__v', function (err, stations) {
            res.json(stations)
        })
    }
})
/*
app.get('/api/snotel', (req, res) => {
    const {triplet} = req.query;
    var url = 'https://www.wcc.nrcs.usda.gov/awdbWebService/services?WSDL';

    if (triplet) {
        var args = { stationTriplet: triplet };
        soap.createClient(url, (err, client) => {
            if (err) throw err;
            let describe = client.describe()
            let resp = client.AwdbWebService.AwdbWebServiceImplPort.getStationMetadata(args, (err, results) => {
                if (err) throw err;
                res.json(results.return);
                return results;
            })
        });
    } 
    else {
        var args = { networkCds: "SNTL" };
        soap.createClient(url, (err, client) => {
            if (err) throw err;
            let describe = client.describe()
            let resp = client.AwdbWebService.AwdbWebServiceImplPort.getStations(args, (err, stationArr) => {
                if (err) throw err;
                res.json(stationArr["return"])
            })
        });
    }
});*/

app.listen(9000);
/*
if (process.env.NODE_ENV === "production") {
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/snowfinder.site/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/snowfinder.site/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/snowfinder.site/chain.pem', 'utf8');
    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    https.createServer(credentials, app).listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
    http.createServer(function (req, res) {
        res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
        res.end();
    }).listen(80);
} else if (process.env.NODE_ENV === "development") {
    app.listen(9000);
} else {
    app.listen(9000);
}
*/