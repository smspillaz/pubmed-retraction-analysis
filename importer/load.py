import json
import argparse
import sys
import os
from datetime import date, datetime
from neo4j.v1 import GraphDatabase, basic_auth

# Entities defined:
# - Article
# - Author
# - Country
# - Month
# - Publication
# - RetractionReason
# - Topic
# - Year

# Relationships defined:
# - (Article) -[PUBLISHED_IN]-> (Publication)
# - (Article) -[AUTHORED_BY]-> (Author)
# - (Article) -[ORIGINATED_IN]-> (Country)
# - (Article) -[DISCUSSES]-> (Topic)
# - (Article) -[RETRACTED_FOR]-> (RetractionReason)
# - (Article) -[PUBLISHED_IN]-> (Year)
# - (Article) -[PUBLISHED_IN]-> (Month)

# NOTE: How do we handle Python dependencies currently?
# NOTE: Doesn't work with outbound Neo4j, just Docker


def main(argv):

    URL = 'localhost'
    USER = 'neo4j'
    PASS = 'neo4j'

    if 'DATABASE_URL' in os.environ:
        URL = os.environ['DATABASE_URL']
    if 'DATABASE_PASS' in os.environ:
        PASS = os.environ['DATABASE_PASS']
    if 'DATABASE_USER' in os.environ:
        USER = os.environ['DATABASE_USER']

    parser = argparse.ArgumentParser(description="Load articles into Neo4j")
    parser.add_argument("file",
                        help="File to read",
                        default="data.json",
                        type=str,
                        metavar="FILE")
    parse_result = parser.parse_args(argv)
    FILE = parse_result.file

    driver = GraphDatabase.driver("bolt://"+URL, auth=basic_auth(USER, PASS))
    session = driver.session()

    with open(FILE, 'r') as file:
        for line in file:
            data = json.loads(line)
            print (len(data))
            count = 0
            for record in data:
                if count > 1:
                    break
                count += 1
                commands = []
                command = ""
                # Assuming always has a pmid value to be valid article
                if 'pmid' in record:
                    commands.append("MERGE (article:Article \
                    {title:'{record[pmid]}'})")
                    if 'ISSN' in record:
                        commands.append("SET article.ISSN = '{record[ISSN]}'")
                    if 'Author' in record:
                        commands.append('MERGE (author:Author {name:\
                        "{record[Author]}"}) MERGE (article)-[:AUTHORED_BY]\
                        ->(author)')
                        print (record['Author'])
                    if 'country' in record:
                        # TODO: Camel case the country name
                        commands.append('MERGE (country:Country {name:\
                        "{record[country]}"}) MERGE (article)-[:ORIGINATED_IN]\
                        ->(country)')
                        print (record['country'])
                    if 'pubDate' in record:
                        date = datetime.strptime(record['pubDate'], "%Y-%m-%d")
                        year = str(date.year)
                        month = date.strftime("%B")
                        commands.append('MERGE (month:Month {name:"{month}"})\
                         MERGE (article)-[:PUBLISHED_IN]->(month)')
                        commands.append('MERGE (year:Year {name:"{year}"})\
                         MERGE (article)-[:PUBLISHED_IN]->(year)')

                    command = " ".join(commands)

                if command != "":
                    session.run(command)

    session.close()

if __name__ == "main":
    main(sys.argv[1:])

main(sys.argv[1:])
