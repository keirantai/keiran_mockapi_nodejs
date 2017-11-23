const mongoose = require('mongoose');
const routeSchema = mongoose.Schema({
	path: [],
	total_distance: { type: Number, default: 0 },
	total_time: { type: Number, default: 0 },
	status: { type: String, index: true, default: 'in progress' },
	error: {type: String },
	loading: { type: Boolean, index: true, default: false }
});

routeSchema.methods.saveAsync = function() {
	var self = this;
	return new Promise((resolve, reject) => {
		self.save((err) => {
			if (err) return reject(err);
			resolve();
		});
	});
}

module.exports = mongoose.model('Route', routeSchema);