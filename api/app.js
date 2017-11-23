const Hapi = require('hapi');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const SERVER_PORT = process.env.NODE_PORT || 3000;
const CONNECTION_STRING = process.env.MONGODB || 3000;
const server = new Hapi.Server({port: SERVER_PORT});

const Route = require('./models/route');

server.ext('onRequest', async (request, h) => {
  try {
    request.db = await new Promise((resolve, reject) => {
      var db = mongoose.connection;
      db.once('open', () => {
        resolve(db);
      });
      db.on('error', (err) => {
        reject(err);
      });
      mongoose.connect(CONNECTION_STRING, { useMongoClient: true });
    });
    return h.continue;
  } catch (err) {
    return err.message;
  }
});

server.route({
  method: 'GET',
  path: '/',
  handler: (request) => {
    return {"msg": "Keiran MockAPI"};
  }
});

server.route([
  {
    method: 'POST',
    path: '/route',
    handler: async (request) => {
      var data = request.payload;
      try {
        var route = await Route.create({ path: data });
        return { token: route._id };
      } catch (err) {
        return { error: err.message };
      }
    }
  },
  {
    method: 'GET',
    path: '/route/{token}',
    handler: async (request) => {
      try {
        var result = {};
        var route = await Route.findById(mongoose.Types.ObjectId(request.params.token)).exec();
        switch (route.status) {
          case 'failure':
            result.status = route.status;
            result.error = route.error;
            break;
          case 'in progress':
            result.status = route.status;
            break;
          case 'success':
            result.status = route.status,
            result.path = route.path,
            result.total_distance = route.total_distance,
            result.total_time = route.total_time
        };
        return result;
      } catch (err) {
        return { status: 'failure', error: err.message };
      }
    }
  }
]);

server.start();