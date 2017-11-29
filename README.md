# MockAPI Challenge

This is a mock API to measure the total distance and time between origin location and destination(s). It used Google MAP API to find the distance and time.

## Project Structure

This project comprises in 2 parts. One of them is the API endpoint for submitting geo-locations to find the best path as well as for retrieving the result of the best path. Another part is a worker to continuously check and resolve the best path by using Google MAP API.

Folder / File | Description
--------------|-------------
/api | API endpoint to submit or retrieve the best route. It's using HAPI framework.
/worker | Worker which is used to resolve the best route in every certain time interval.
/docker-compose.yml | Docker composer YAML configure file which uses to start the API endpoint and Worker in docker instances. It contains HAProxy and MongoDB for horizontal scaling use.

```
HAProxy ---> API endpoints (e.g. /route) ---> MongoDB
                                                ^
                                                |
                                             	Worker <---> Google MAP API
```

## Environment Variables

In this project, there are few environment variables that helps to configure the system behaviours.

Used for | Variable | Description
---------|----------|-------------
api | MONGODB | MongoDB connection string
api | NODE_PORT | Listening port of the API endpoint
worker | TIME_INTERVAL | Time to wait before next process (in ms.)
worker | MEASURED_BY_DISTANCE | Whether determine the shortest path by distance or time. true is by distance
worker | FIND_BEST_ROUTE | Whether find the best route by shortest path or obey the request sequence to find the shortest path. false is by requested sequence
worker | GOOGLE_MAPS_API_KEY | Google Map API key to find the shortest path

## Google MAP API - Distance Matrix

In order to use this project, API Key from [Google MAP API](https://developers.google.com/maps/documentation/distance-matrix/start) is required. Once retrieved API key, open `docker-compose.yml` to add the API key at the environment version `GOOGLE_MAPS_API_KEY=<API_KEY>`

## How to Run

To use this project, you may need to have Docker and Docker composer to start docker containers.

```
docker-compose up

or

sudo docker-compose up
```

## How to Scale

This project is designed for horizontal scalable. On the API endpoints, it's using HAProxy as an entrypoint with scalable API backend services by NodeJS.

For the worker, it's using MongoDB to store and control the requests. It can also be scaled horizontally.

```
# To scale API endpoints to 3 nodes
docker-compose up --scale api=3

# to scale worker to resolve total distance
docker-compose up --scale worker=3
```

## How to Test

This project includes a test case. You may need to start the docker instances before test.

```
# Find the test case in /test folder
cd test
# Run test script
npm test api
```

P.S. The test case assumes your API endpoint is listening the default 80 port and hosted by localhost, i.e. http://localhost/