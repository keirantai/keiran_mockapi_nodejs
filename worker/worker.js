const googleMapClient = require('@google/maps').createClient({
	Promise: global.Promise,
	key: process.env.GOOGLE_MAPS_API_KEY || ''
});

const CONNECTION_STRING = process.env.MONGODB || 3000;
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Route = require('./models/route');

class Worker {

	constructor() {
		this.init();
	}

	init() {
		this.connectDb();
	}

	async connectDb() {
		console.log('[Info] Initial MongoDB connection.');
    this.db = await new Promise((resolve, reject) => {
      var db = mongoose.connection;
      db.once('open', () => {
        resolve(db);
      });
      db.on('error', (err) => {
        reject(err);
      });
      mongoose.connect(CONNECTION_STRING, { useMongoClient: true });
    });
    return this.db;
	}

	async processTask() {
		console.log('[Info] Find and process a next task.');
		try {
			var route = await Route.findOneAndUpdate({ status: 'in progress', loading: false }, { $set: { loading: true }}).exec();
			if (!route) {
				return true;
			}
		} catch (err) {
			console.error(err);
			return false;
		}
		try {
			var distances = await this.findDistances(route.path.toObject());
			if (distances.status == 'OK') {
				var total_distance = 0, total_time = 0;
				for (var r in distances.rows) {
					var row = distances.rows[r];
					for (var e in row.elements) {
						var el = row.elements[e];
						total_distance += el.distance.value;
						total_time += el.duration.value;
						console.log(el.distance.value, el.duration.value);
					}
				}
				route.total_distance = total_distance;
				route.total_time = total_time;
				route.status = 'success';
			} else {
				route.status = 'failure';
				route.error = distances.error_message;
			}
		} catch (err) {
			route.status = 'failure';
			route.error = err.message;
		}
		try {
			await route.saveAsync();
			return true;
		} catch (err) {
			console.error(err);
		}
	}

	async findDistances(path) {
		console.log('[Info] Finding distance and time from Google Map API.');
		try {
			var origins = path.shift().join(',');
			var destinations = []
			while (path.length > 0) {
				destinations.push(path.shift().join(','));
			}
			var query = {
				origins: origins,
				destinations: destinations.join('|'),
				mode: 'driving'
			};
			var result = await googleMapClient.distanceMatrix(query).asPromise();
			console.log('result', result.json.rows);
			return result.json;
		} catch (err) {
			console.error(err);
			if (err.json)
				return err.json;
		}
	}

	timeout(ms) {
		console.log(`[Info] Sleep for ${ms} ms`);
		return new Promise(res => setTimeout(res, ms));
	}

	async run() {
		while(true) {
			await this.processTask();
			await this.timeout(process.env.TIME_INTERVAL || 5000);
		}
	}
}

module.exports = Worker;