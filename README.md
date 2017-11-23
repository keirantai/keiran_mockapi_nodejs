# MockAPI Challenge

This is a mock API to measure the total distance and time between origin location and destination(s). It used Google MAP API to find the distance and time.

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