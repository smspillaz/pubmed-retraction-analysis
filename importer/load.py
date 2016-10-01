# /importer/load.py
#
# Import article data from JSON into a Neo4j database.
#
# See /LICENCE.md for Copyright information
"""Import article data from JSON into a Neo4j database."""

import argparse
from contextlib import contextmanager
from datetime import datetime
import json
import os
import sys

from neo4j.v1 import GraphDatabase, basic_auth


def generate_command_for_record(record):
    """For a particular record, generate a database command."""
    # Assuming always has a pmid value to be valid article
    if "pmid" in record:
        commands = []
        commands.append(u"MERGE (article:Article "
                        "{{title:'{0}'}})".format(record["pmid"]))
        if record.get("ISSN", None):
            commands.append(u"SET article.ISSN = '{0}'"
                            .format(record["ISSN"]))
        if record.get("Author", None):
            commands.append(u"MERGE (author:Author {{name:\""
                            "{0}\"}}) MERGE (article)-"
                            "[:AUTHORED_BY]->(author)"
                            .format(record["Author"]))
        if record.get("country", None):
            commands.append(u"MERGE (country:Country {{name:"
                            "'{0}'}}) MERGE (article)"
                            "-[:ORIGINATED_IN]->(country)"
                            .format(record["country"]))
        if record.get("pubDate", None):
            date = datetime.strptime(record["pubDate"]["date"], "%Y-%m-%d")
            year = str(date.year)
            month = date.strftime("%B")
            commands.append(u"MERGE (month:Month {{name:'{0}'}}) "
                            "MERGE (article)-[:PUBLISHED_IN]->"
                            "(month)".format(month))
            commands.append(u"MERGE (year:Year {{name:'{0}'}}) "
                            "MERGE (article)-[:PUBLISHED_IN]->"
                            "(year)".format(year))

        return u" ".join(commands)

    return None


@contextmanager
def open_or_default(path, default):
    """A context with either path as an open file, or some default."""
    try:
        with open(path or "", "r") as fileobj:
            yield fileobj
    except IOError:
        yield default


def commands_from_data(data):
    """Given an iterable of JSON objects yield Neo4j commands."""
    yield "MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n, r"

    for record in data:
        command = generate_command_for_record(record)
        if command:
            yield command


def main(argv=None):
    """Import all data in JSON file into Neo4j database."""
    parser = argparse.ArgumentParser(description="Load articles into Neo4j")
    parser.add_argument("file",
                        help="File to read",
                        type=str,
                        nargs="?",
                        metavar="FILE")
    parser.add_argument("--no-execute",
                        action="store_true")
    parse_result = parser.parse_args(argv or sys.argv[1:])

    with open_or_default(parse_result.file, sys.stdin) as fileobj:
        data = json.load(fileobj)
        commands = list(commands_from_data(data))

    if parse_result.no_execute:
        sys.stdout.write(json.dumps(commands))
    elif len(commands):
        if all(var in os.environ for
               var in ["DATABASE_URL", "DATABASE_PASS"]):
                    url = os.environ["DATABASE_URL"]
                    pwd = os.environ["DATABASE_PASS"]
                    usr = os.environ.get("DATABASE_USER", "")
        else:
            raise ValueError("Ensure environment variables DATABASE_URL, "
                             "DATABASE_PASS and DATABASE_USER set.")

        driver = GraphDatabase.driver(url, auth=basic_auth(usr, pwd))
        session = driver.session()
        for command in commands:
            session.run(command)
        session.close()

if __name__ == "__main__":
    main(sys.argv[1:])
