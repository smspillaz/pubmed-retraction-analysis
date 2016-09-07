# PubMed Retraction Analyser

## Installing dependencies

Before you do anything, go install [node](http://nodejs.org).

Once you're done with that `npm install` will install all the dependencies.

## Database

The database uses neo4j. You can set this up locally by following
the instructions at neo4j.org, or you can access a public database at
the URL specified in the private documentation.

### Administration

You can interact with the database by using the db/db-admin.js script.

You will need to provide credentials in NEO_USER, NEO_PASS
and the database URL (shared secretly) in DATABASE_URL.

Once the program starts, you can just start running neo4j database
commands and you'll get the result back. Hit Ctrl^C to quit.
