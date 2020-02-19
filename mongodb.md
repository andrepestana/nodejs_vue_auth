# Download and run mongo docker
docker pull mongo
docker run -d -p 27017-27019:27017-27019 --name mongodb mongo:4.0.4


# Interact with mongo
docker exec -it mongodb bash
mongo
show dbs
use <db_name>


Extracted from https://www.thepolyglotdeveloper.com/2019/01/getting-started-mongodb-docker-container-deployment/




