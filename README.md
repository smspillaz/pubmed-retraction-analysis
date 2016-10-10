# PubMed Retraction Analyser

## Working broken Python installations on OS X El Capitan

OSX 10.11 ships with a known broken python installation. Install
homebrew and then install python:

    $ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    $ brew install python

## Installing dependencies

Before you do anything, go install [node](http://nodejs.org).

You will also need to install pip from `easy_install` and virtualenv
from `pip` systemwide:

   $ sudo easy_install pip
   $ sudo pip install virtualenv

Once you're done with that `npm install` will install all the dependencies.

## Deployment

Deployment is to [heroku](http://heroku.com). Review apps are enabled on
this repository and the `master` branch is always deployed automatically.

Heroku configuration can be accessed in the credentials handed over
in the private documentation. The following environment variables must
be set in order for the backend to function:
 - `DATABASE_USER`: The neo4j user name
 - `DATABASE_PASS`: The neo4j password for that user name
 - `DATABASE_URL`: Where the neo4j database is being hosted

The default values for all of these environment variables will be handed
over in the private documentation.

## Database

The database uses neo4j. You can set this up locally by following
the instructions at neo4j.org, or you can access a public database at
the URL specified in the private documentation.

### Administration

You can interact with the database by using the db/db-admin.js script.

You will need to provide credentials in DATABASE_USER, DATABASE_PASS
and the database URL (shared secretly) in DATABASE_URL.

Once the program starts, you can just start running neo4j database
commands and you'll get the result back. Hit Ctrl^C to quit.
