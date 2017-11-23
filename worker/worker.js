const googleMapClient = require('@google/maps').createClient({
	Promise: global.Promise,
	key: process.env.GOOGLE_MAPS_API_KEY || ''
});

const CONNECTION_STRING = process.env.MONGODB || 3000;
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Route = require('./models/route');

class Worker {

	/** Worker constructor to initialize setup */
	constructor() {
		this.MEASURED_BY_DISTANCE = true;
		this.init();
	}

	/** Establish databaes connection when initializing */
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

	/** Retrieve a task from database to lookup the total distance and time */
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
				var best = 0; // always inspect from the start location which is the first result
				var inspected = [];
				// inspect each distance unless the best path found
				while(distances.rows.length > inspected.length + 1) {
					// console.log('The best spot:', best);
					var row = distances.rows[best];
					var lowestIdx = 0, lastLowest = null;
					// loop through all distance and find the shortest distance or time
					for (var e in row.elements) {
						var el = row.elements[e];
						var measurement = this.MEASURED_BY_DISTANCE ? el.distance.value : el.duration.value;
						// console.log('measurement', measurement);
						if (lastLowest == null || lastLowest > measurement) {
							// avoid inspecting same location more than one time
							if (inspected.indexOf(parseInt(e)) > -1) {
								continue;
							}
							lastLowest = measurement;
							lowestIdx = parseInt(e);
						}
					}
					// console.log('lowest', lowestIdx, lastLowest);
					var lowestElement = row.elements[lowestIdx];
					total_distance += lowestElement.distance.value;
					total_time += lowestElement.duration.value;
					inspected.push(lowestIdx); // save the inspected location
					best = lowestIdx + 1; // found the next best spot and inspect in next loop
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

	/** Find total distance and time by an array of geolocation. */
	async findDistances(path) {
		console.log('[Info] Finding distance and time from Google Map API.');
		try {
			var spots = [];
			var startLocation = path.shift().join(',');
			while (path.length > 0) {
				spots.push(path.shift().join(','));
			}
			var query = {
				origins: startLocation + '|' + spots.join('|'),
				destinations: spots.join('|'),
				mode: 'driving'
			};
			console.log('query', JSON.stringify(query));
			var result = await googleMapClient.distanceMatrix(query).asPromise();
			console.log('result', result.json);
			return result.json;
		} catch (err) {
			console.error(err);
			if (err.json)
				return err.json;
		}
	}

	/** sleep ? ms for each process */
	timeout(ms) {
		console.log(`[Info] Sleep for ${ms} ms`);
		return new Promise(res => setTimeout(res, ms));
	}

	/** entry point of this Worker; Use to process the pending task one-by-one. */
	async run() {
		while(true) {
			await this.processTask();
			await this.timeout(process.env.TIME_INTERVAL || 5000);
		}
	}
}

module.exports = Worker;