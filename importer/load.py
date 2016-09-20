from neo4j.v1 import GraphDatabase, basic_auth
import json

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
# NOTE: Needs to work with outbound Neo4j / not just Docker
# NOTE: Hardcoded password, username and file location

months = ['January','February','March','April','May','June','July','August','September','October','November','December']

def main():
    driver = GraphDatabase.driver("bolt://localhost", auth=basic_auth("neo4j", "neo4j"))
    session = driver.session()

    # session.run("MERGE (publication:Publication {title:'Pretend Journal of Science', country:'Australia', founded:1978})")
    # session.run("MERGE (author:Author {name:'John Doe'})")

    # result = session.run("MATCH (a:Author) RETURN (a)")

    # for record in result:
    #     print(record)

    FILE = "data.json"
    with open(FILE, 'r') as file:
        for line in file:
            data = json.loads(line)
            print len(data)
            # count = 0
            for record in data:
                # if count > 5:
                    # break
                # count += 1
                command = ""
                # Assuming always has a pmid value to be valid article
                if 'pmid' in record:
                    command += "MERGE (article:Article {title:'"+record['pmid']+"'}) "
                    if 'ISSN' in record:
                        command += "SET article.ISSN = '" + record['ISSN']+"' "
                    if 'Author' in record:
                        command += 'MERGE (author:Author {name:"'+record['Author']+'"}) MERGE (article)-[:AUTHORED_BY]->(author)'
                        print record['Author']
                    if 'country' in record:
                        # TODO: Camel case the country name to ensure consistency
                        command += 'MERGE (country:Country {name:"'+record['country']+'"}) MERGE (article)-[:ORIGINATED_IN]->(country)'
                        print record['country']
                    if 'pubDate' in record:
                        date = record['pubDate'].split('-')
                        year = date[0]
                        month = months[int(date[1]) - 1]
                        print year
                        print month
                        command += 'MERGE (month:Month {name:"'+month+'"}) MERGE (article)-[:PUBLISHED_IN]->(month)'
                        command += 'MERGE (year:Year {name:"'+year+'"}) MERGE (article)-[:PUBLISHED_IN]->(year)'

                if command != "":
                    session.run(command)

    session.close()

main()
