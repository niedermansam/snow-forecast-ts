module.exports = (app) => {

    const soap = require('soap');
    const axios = require('axios');
    const csv = require('csv-parse')

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


    const url = 'https://www.wcc.nrcs.usda.gov/awdbWebService/services?WSDL';


    app.get('/api/resorts', function (req, res) {
        res.json({ "hello": "world" });
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
                client.AwdbWebService.AwdbWebServiceImplPort.getStationMetadata({ stationTriplet: triplet }, (err, stationData) => {
                    if (err) throw err;
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

    const getData = async (triplet, begin, end, period) => {

        let reportType = triplet.split(',').length > 1 ? "Multiple" : "Single";
        let uri = `https://wcc.sc.egov.usda.gov/reportGenerator/view_csv/custom${reportType}StationReport/${period}/start_of_period/${triplet.replace(',', '%7C')}%7Cid=%22%22%7Cname/${begin},${end}/stationId,state.code,name,TAVG::value,TMAX::value,TMIN::value,SNWD::value,SNWD::delta,WTEQ::value,WTEQ::delta,WSPDX::value,WSPDV::value,WDIRV::value`

        let idArr = triplet.split(',')
        console.log(idArr)
        let output = [];
       
        let foo = {};
        idArr.forEach(x => {
            foo[x] = {data: []}
        })
        
        let data = await axios.get(uri)
        let arr = data//.replace('\\n','')
        arr = arr
            .data
            .replace(/\#.*\n/g, "")
            .split(/\n/).map(x=> x.split(','))
            

        for(let i = 1; i< arr.length; i++){
            let x = arr[i]
            if(x[0] == '') continue;
            let snotelEntry = {
                date: x[0],
                name: x[3],
                id: `${x[1]}:${x[2]}:SNTL`,
                temp: { avg: parseFloat(x[4]), max: parseFloat(x[5]), min: parseFloat(x[6]) },
                snow: { depth: parseFloat(x[7]), change: parseFloat(x[8]) },
                swe: { value: parseFloat(x[9]), change: parseFloat(x[10]) }
            }

            if(x[12]){
                snotelEntry.wind = {avg: parseFloat(x[12]), max: parseFloat(x[11]), direction: parseFloat(x[13])}
            }

                foo[`${x[1]}:${x[2]}:SNTL`].data.push(snotelEntry)
        }

        return foo;
    }

    getData("530:MT:SNTL", "2018-12-31", "2019-01-02", 'daily')

    function findClosest(array, lat, lng) {
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
            let output = findClosest(metadata, lat, lng).slice(0, n)
            res.json({ lat: lat, lng: lng, n: n, stations: output })
        })
    })


    app.get('/api/snotel/hourly', async (req, res) => {
        let { id, begin, end } = req.query;
        begin = begin || "2019-11-19";
        end = end || "2019-11-20";
        var url = 'https://www.wcc.nrcs.usda.gov/awdbWebService/services?WSDL';
        if (id) {

            const handleReturnObject = async () => {

                let snowDepth = await getHourlyData(id, begin, end, "SNWD"); // Snow Depth
                let swe = await getHourlyData(id, begin, end, "WTEQ"); // Snow Water equivalent
                let tempObs = await getHourlyData(id, begin, end, "TOBS") // Observed Temp

                //console.log(snowDepth)
                let data = {};

                let triplets = Object.keys(snowDepth);

                for (let i = 0; i < triplets.length; i++) {
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
                stationTriplet: { $regex: id.replace(',', "|"), $options: 'i' }
            },
                '-_id -__v -beginDate -endDate',
                function (err, metadata) {
                    const output = metadata.map(station => {
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
            res.json({"error" : `You must include at least one station id. Station ids are available at ${req.hostname}/api/snotel`})
        }
    })

    app.get('/api/snotel', async (req, res) => {

        let { metadata } = req.query;

        if(metadata){
            METADATA.find({}, '-_id -__v', function (err, stations) {
                res.json(stations)
            })
        } else {
            METADATA.find({}, 'name stationTriplet -_id', function (err, stations) {
                res.json(stations.map(x =>  {
                    return {name: x.name, id: x.stationTriplet};
                }))
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
}