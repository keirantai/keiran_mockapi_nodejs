let chai = require('chai');
let chaiHttp = require('chai-http');
let endpoint = 'localhost';
let expect = chai.expect;

chai.use(chaiHttp);

describe('API /route Tests', () => {
	var token;

	it('Post random string, it should return an error.', done => {
		var data = 'ksdjfk3oi4jsdfsd';
		chai.request(endpoint)
			.post('/route')
			.send(data)
			.end((err, res) => {
				expect(err).to.be.null;
				expect(res).to.have.status(200);
				expect(res.body).to.have.property('error');
				done();
			});
	})

	it('Post an array of geo-locations, it should return a token.', done => {
		var data = [["22.372081", "114.107877"],["22.284419", "114.159510"],["22.326442", "114.167811"]];
		chai.request(endpoint)
			.post('/route')
			.set('content-type', 'application/json')
			.send(data)
			.end((err, res) => {
				expect(err).to.be.null;
				expect(res).to.have.status(200);
				expect(res.body).to.have.property('token');
				token = res.body.token;
				done();
			});
	});

	it('Get result by token, it should return status and/or result of the distance.', done => {
		chai.request(endpoint)
			.get('/route/' + token)
			.end((err, res) => {
				expect(err).to.be.null;
				expect(res).to.have.status(200);
				expect(res.body).to.have.property('status');
				done();
			});
	});
});