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

## Continuous Integration and Tests

By default, every commit on the master branch of this repository will
run the entire acceptance test suite on [Travis CI](http://travis-ci.org).
Travis-CI uses the standard `install.py` script to install dependencies which
includes the installation of a staging neo4j instance. You will not be able to
run the test suite manually without that.

To run the run the test suite manually manually, do the following:

    $ python setup.py polysquarelint --exclusions=*/venv/*,*/node_modules/*,*/dist/*,*/public/components/* --suppress-codes=I100,LongDescription,D203
    $ npm run lint

You do not need to start neo4j or set any database credentials - this will
be done automatically by the test fixtures. However, you should ensure there
is no other instance of neo4j running on your session before running the tests
since neo4j always allocates the same port for itself.

## Automatic Code Quality Checks

By default, every commit on the master branch will run automatic static
analysis and code quality checks. A failure by any of these tools will fail
the entire build.

Python warnings can be suppressed using `#  suppress(warning-id)` whereas
ESLint (JavaScript) warnings can be suppresed using `eslint-disable-line id`.

To run the linting checks manually, do the following:

    $ python setup.py polysquarelint --exclusions=*/venv/*,*/node_modules/*,*/dist/*,*/public/components/* --suppress-codes=I100,LongDescription,D203
    $ npm run lint

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

## Directory Structure

The project is split into three separate components: A frontend, a backend
and an importer.

 - `importer`:
    In here is the "importer" which fetches data from PubMed using the
    Entrez API. Data is stored in a JSON file and uploaded to a neo4j
    database.
 - `routes`:
    In here is a JavaScript file specifying the backend's behaviour for
    each route. The default route is the `index` route, which specifies
    the API endpoints that are available to the frontend.
 - `public/js`:
    In here is a JavaScript file called `retractions.js` which is the
    JavaScript code managing the D3 charts for the fronted.
 - `views`
    In here are the "views" or the templates which are written in the
    [Jade](https://www.npmjs.com/package/jade) templating language to construct
    the HTML view which holds the charts. `pubmedRetraction.jade` is the main
    view for the application.
 - `tests`:
    In here are the tests for both the backend and the importer. Anything
    written in python is for the importer, anything written in JavaScript is
    for the backend and frontend.

    We use [green](http://github.com/CleanCut/green) in combination with
    [testtools](http://github.com/testing-cabal/testtools) for Python tests
    and [mocha](http://mochajs.org) and [chai](http://chaijs.org) for
    JavaScript tests.
