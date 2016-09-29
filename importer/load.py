# /importer/load.py
#
# Import article data from JSON into a Neo4j database.
#
# See /LICENCE.md for Copyright information
"""Import article data from JSON into a Neo4j database."""

import argparse
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
        commands.append("MERGE (article:Article "
                        "{{title:'{0}'}})".format(record["pmid"]))
        if "ISSN" in record:
            commands.append("SET article.ISSN = '{0}'"
                            .format(record["ISSN"]))
        if "Author" in record:
            commands.append("MERGE (author:Author {{name:\""
                            "{0}\"}}) MERGE (article)-"
                            "[:AUTHORED_BY]->(author)"
                            .format(record["Author"]))
        if "country" in record:
            commands.append("MERGE (country:Country {{name:"
                            "'{0}'}}) MERGE (article)"
                            "-[:ORIGINATED_IN]->(country)"
                            .format(record["country"]))
        if "pubDate" in record:
            date = datetime.strptime(record["pubDate"], "%Y-%m-%d")
            year = str(date.year)
            month = date.strftime("%B")
            commands.append("MERGE (month:Month {{name:'{0}'}})"
                            "MERGE (article)-[:PUBLISHED_IN]->"
                            "(month)".format(month))
            commands.append("MERGE (year:Year {{name:'{0}'}})"
                            "MERGE (article)-[:PUBLISHED_IN]->"
                            "(year)".format(year))

        return " ".join(commands)

    return None


def main(argv):
    """Import all data in JSON file into Neo4j database."""
    if all(var in os.environ for
           var in ["DATABASE_URL", "DATABASE_USER", "DATABASE_PASS"]):
                url = os.environ["DATABASE_URL"]
                pwd = os.environ["DATABASE_PASS"]
                usr = os.environ["DATABASE_USER"]
    else:
        raise ValueError("Ensure environment variables DATABASE_URL, "
                         "DATABASE_PASS and DATABASE_USER set.")

    parser = argparse.ArgumentParser(description="Load articles into Neo4j")
    parser.add_argument("file",
                        help="File to read",
                        default="data.json",
                        type=str,
                        metavar="FILE")
    parse_result = parser.parse_args(argv)

    driver = GraphDatabase.driver("bolt://" + url, auth=basic_auth(usr, pwd))
    session = driver.session()

    with open(parse_result.file, "r") as file:
        for line in file:
            data = json.loads(line)
            for record in data:
                command = generate_command_for_record(record)
                if command:
                    session.run(command)

    session.close()

if __name__ == "__main__":
    main(sys.argv[1:])
