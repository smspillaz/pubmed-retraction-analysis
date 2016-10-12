# Demo of Neo4j Database

## Purpose
This file describes how to setup and run the Neo4j database locally, import data from articles into it, and perform sample queries.

It also describes how to connect to and run demo queries on the Digital Ocean database.

### Requirements
- [Docker](https://www.docker.com)
- Python 2.7 +

### Local install and testing

To run Neo4j locally run the command:

```
docker run --restart=always \
--publish=7474:7474 --publish=7687:7687 \
--volume=$HOME/neo4j/data:/data \
neo4j:3.0
```
Go to [localhost:7474](localhost:7474) in a browser and set a username and password.

Set environment variables to the username and password just created. Enter your username and password where the equals signs are.
```
export DATABASE_URL=localhost
export DATABASE_USER=
export DATABASE_PASS=
```
Install the project dependencies and then activate the virtual environment with:
```
python install.py
source python-virtualenv/bin/activate
```

Import the pubmed data and then parse the xml files.
```
python3 downloader.py
python3 parsexml.py
```

Run the loader program.
```
cd /importer
python load.py data.json
```

Navigate to ```http://localhost:7474/browser/``` to input queries through the visual GUI.

### Connect remotely through Digital Ocean

Use the credentials sent internally to connect to the Neo4j server on Digital Ocean. It has been pre-loaded using the ```importer/load.py``` program.

Navigate to ```http://188.166.209.201:7474/browser/``` to input queries through the visual GUI.

### Demo queries

Return authors ordered by articles authored, limited to 10.
```cypher
MATCH (a:Author)-[r]-()
RETURN a, count(r) as rel_count
ORDER BY rel_count desc
LIMIT 10
```

Return countries ordered by number of articles, limited to 10.
```cypher
MATCH (c:Country)-[r]-()
RETURN c, count(r) as rel_count
ORDER BY rel_count desc
LIMIT 10
```

Return years ordered by articles authored, limited to 10.
```cypher
MATCH (y:Year)-[r]-()
RETURN y, count(r) as rel_count
ORDER BY y.name desc
LIMIT 10
```

Return topics ordered by articles authored, limited to 10.
```cypher
MATCH (t:Topic)-[r]-()
RETURN t, count(r) as rel_count
ORDER BY rel_count desc
LIMIT 10
```

Return a year and country breakdown of articles authored (recommend viewing by row!)
```cypher
MATCH (y:Year)-[r]-(a:Article)-[rr]-(c:Country)
RETURN distinct y, c, count(r) as x
ORDER BY y.name desc
LIMIT 100
```

Return a year and country breakdown of articles authored (recommend viewing by row!)
```cypher
MATCH (t:Topic {name: "Child"})-[r]-(a:Article)-[rr]-(y:Year)
RETURN distinct y, count(rr) as x
ORDER BY y.name desc
LIMIT 100
```
