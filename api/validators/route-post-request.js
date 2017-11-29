class RoutePostRequest {

	/**
	 * Validate request data
	 * @param  mixed  data Request data object
	 * @return mixed       The original request data
	 * @throws {Error} If request data is invalid
	 */
	static validate(data) {
		const ERROR_INVALID_STRUCTURE = 'Invalid data structure, it must be an array of locations.';
		const ERROR_INVALID_LOCATION = 'Invalid location, it must be an array and contains latitude and longitude e.g. ["22.372081", "114.107877"]';
		
		if (!Array.isArray(data)) {
			throw new Error(ERROR_INVALID_STRUCTURE);
		}
		for (var i in data) {
			var r = data[i];
			if (!Array.isArray(r)) {
				throw new Error(ERROR_INVALID_LOCATION);
			}
			if (r.length != 2) {
				throw new Error(ERROR_INVALID_LOCATION);
			}
		}
		return data;
	}
}

module.exports = RoutePostRequest;