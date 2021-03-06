const Hapi = require('hapi');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const SERVER_PORT = process.env.NODE_PORT || 3000;
const CONNECTION_STRING = process.env.MONGODB || 3000;
const server = new Hapi.Server({port: SERVER_PORT});

const Route = require('./models/route');
const RoutePostRequest = require('./validators/route-post-request');

/**
 * Listen onRequest event to connect establishing MongoDB connection
 * on customer requests
 */
server.ext('onRequest', async (request, h) => {
  console.log('[Info] Path: ' + request.url.path);
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

/**
 * This is a demo message of the root URI: /
 */
server.route({
  method: 'GET',
  path: '/',
  handler: (request) => {
    return {"msg": "Keiran MockAPI"};
  }
});

/**
 * This is a mockapi endpoint which consists of:
 * - POST /route
 * - GET /route/<token>
 */
server.route([
  {
    method: 'POST',
    path: '/route',
    handler: async (request) => {
      try {
        var data = RoutePostRequest.validate(request.payload);
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
      const ERROR_INVALID_TOKEN = 'Token is not found.';
      try {
        var result = {};
        try {
          var route = await Route.findById(mongoose.Types.ObjectId(request.params.token)).exec();
        } catch (err) {
          throw new Error(ERROR_INVALID_TOKEN);
        }
        if (!route) {
          throw new Error(ERROR_INVALID_TOKEN);
        }
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