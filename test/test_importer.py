# /test/test_importer.py
#
# Tests for Neo4j importer.
#
# See /LICENCE.md for Copyright information
"""Tests for importer."""

import errno

import json

import mock

import os

import socket

import shutil

import subprocess

import sys

from importer import load

from nose_parameterized import parameterized

import requests

from six.moves import StringIO

from testtools import (ExpectedException, TestCase)
from testtools.matchers import Equals


ENTRY_VALUES = {
    "pmid": "111111",
    "Author": "fore_name last_name",
    "pubDate": {
        "date": "2011-11-11",
        "components": {
            "Year": True,
            "Month": True,
            "Day": True
        }
    },
    "reviseDate": {
        "date": "2012-11-11",
        "components": {
            "Year": True,
            "Month": True,
            "Day": True
        }
    },
    "ISSN": "0",
    "country": "Australia"
}


def generate_match_query(var, criteria):
    """Generate a match query depending on the supported Neo4j version."""
    return "MATCH({var}:{criteria})".format(var=var,
                                            criteria=criteria)


ARTICLE_QUERIES = [
    (generate_match_query("a", "Author") + " RETURN a",
     {"name": ENTRY_VALUES["Author"]}),
    (generate_match_query("a", "Month") + " RETURN a", {"name": "November"}),
    (generate_match_query("a", "Year") + " RETURN a", {"name": "2011"}),
    (generate_match_query("a", "Country") + " RETURN a",
     {"name": "Australia"}),
    (generate_match_query("a", "Article") + " RETURN a",
     {"title": ENTRY_VALUES["pmid"], "ISSN": ENTRY_VALUES["ISSN"]})
]

CURRENT_FILE = os.path.realpath(__file__)

# Doesn't represent anything significant, just meets Neo4j's specifications
TEST_TOKEN = "4287e44985b04c7536c523ca6ea8e67c"


def run_query(query):
    """Run query against a database."""
    url = "http://:{}@localhost:7474/db/data/cypher".format(TEST_TOKEN)
    return requests.post(url, json={
        "query":  query
    })


def run_commands(commands):
    """Run all commands against a neo4j database."""
    return [run_query(c) for c in commands]


class TestImporterLoad(TestCase):
    """Test loading data into the database."""

    @classmethod
    def setUpClass(cls):
        """Clear out the database completely, clear credentials."""
        db_dir = os.path.realpath(os.path.join(os.path.dirname(CURRENT_FILE),
                                               "..",
                                               "neo4j",
                                               "neo4j-community-2.2.0-M03"))
        try:
            shutil.rmtree(os.path.join(db_dir, "data"))
        except OSError as error:
            if error.errno != errno.ENOENT:
                raise error

        os.makedirs(os.path.join(db_dir, "data"))

        # Boot the database
        cls.process = subprocess.Popen([os.path.join(db_dir,
                                                     "bin",
                                                     "neo4j"), "console"],
                                       stdout=subprocess.PIPE)
        # Wait for it to boot
        success = False
        while True:
            line = cls.process.stdout.readline()
            if line.strip():
                print(line.strip())
            if "Remote interface" in str(line):
                success = True
                break

        if not success:
            raise RuntimeError("Database failed to boot.")

        # Reset the credentials
        requests.post("http://localhost:7474/user/neo4j/authorization_token",
                      json={
                          "password": "neo4j",
                          "new_authorization_token": TEST_TOKEN
                      })

    @classmethod
    def tearDownClass(cls):
        """Kill the database process."""
        cls.process.kill()

    def setUp(self):
        """Log in using neo4j/cits3200 and clear all data."""
        super(TestImporterLoad, self).setUp()
        run_query("CYPHER 1.9 START n=node(*) DETACH DELETE n")

    def test_create_article(self):
        """4.5.5.0 Can create article."""
        run_commands(load.commands_from_data([ENTRY_VALUES]))

    @parameterized.expand(ARTICLE_QUERIES)
    def test_run_query_against_article(self, query, value):
        """4.5.5.1 Can run query to obtain entered data."""
        run_commands(load.commands_from_data([ENTRY_VALUES]))
        res = run_query(query).json()
        self.assertThat(res["data"][0][0]["data"],
                        Equals(value))

    def test_find_author(self):
        """4.5.5.1 Find related author for article."""
        run_commands(load.commands_from_data([ENTRY_VALUES]))
        res = run_query("MATCH(a:Article)-[:AUTHORED_BY]->(r:Author) RETURN r")
        self.assertThat(res.json()["data"][0][0]["data"]["name"],
                        Equals("fore_name last_name"))

    def test_find_country(self):
        """4.5.5.1 Find related country for article."""
        run_commands(load.commands_from_data([ENTRY_VALUES]))
        res = run_query("MATCH(a:Article)-[:ORIGINATED_IN]->(r:Country) "
                        " RETURN r")
        self.assertThat(res.json()["data"][0][0]["data"]["name"],
                        Equals("Australia"))

    def test_find_all_in_country(self):
        """4.5.5.1 Find all articles that match a country."""
        values = [ENTRY_VALUES.copy(),
                  ENTRY_VALUES.copy(),
                  ENTRY_VALUES.copy()]
        # Make the last entry something else so that we can assert that two
        # matched
        values[1]["pmid"] = "111112"
        values[2]["pmid"] = "111113"
        values[2]["country"] = "China"

        run_commands(load.commands_from_data(values))
        res = run_query("MATCH(a:Article)-[:ORIGINATED_IN]->(r:Country) "
                        " WHERE r.name =\"Australia\" RETURN Count(a)")
        self.assertThat(res.json()["data"][0][0],
                        Equals(2))

    def test_find_month(self):
        """4.5.5.1 Find related month for article."""
        run_commands(load.commands_from_data([ENTRY_VALUES]))
        res = run_query("MATCH(a:Article)-[:PUBLISHED_IN]->(r:Month) "
                        " RETURN r")
        self.assertThat(res.json()["data"][0][0]["data"]["name"],
                        Equals("November"))

    def test_throw_exception_if_network_connection_fails(self):
        """4.5.5.2 Throw exception if network connection is down."""
        with mock.patch("socket.socket") as MockSocket:
            def raise_socket_error(*args):
                """Raise socket error."""
                del args
                raise socket.error()

            MockSocket.return_value.connect = raise_socket_error
            with ExpectedException(requests.exceptions.ConnectionError):
                run_commands(load.commands_from_data([ENTRY_VALUES]))

    def test_throw_exception_if_input_data_invalid(self):
        """4.5.5.3 Throw exception if input data is invalid."""
        membuf = StringIO()
        membuf.write("invalid")
        membuf.seek(0)
        self.patch(sys, "stdin", membuf)

        if sys.version_info.major <= 2:
            with ExpectedException(ValueError):
                load.main()
        elif sys.version_info.major >= 3:
            with ExpectedException(json.decoder.JSONDecodeError):
                load.main()
