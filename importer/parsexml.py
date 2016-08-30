import os
import xml.etree.ElementTree as ET
import json
import sys
import argparse


def main(argv=None):
    """Parse PubMed XML files in a directory."""
    argv = argv or sys.argv[1:]
    parser = argparse.ArgumentParser("Parse XML files.")
    parser.add_argument("directory",
                        help="Directory to scan",
                        default="./Retractions",
                        type=str,
                        metavar="DIR")
    parse_result = parser.parse_args(argv)

    for file in os.listdir(parse_result.directory):
        if file.endswith(".xml"):
            tree = ET.parse(parse_result.directory + "/" + file)
            root = tree.getroot()
            article_data = {}
            
            for medinfo in root.iter('MedlineCitation'):
                article_data['pmid'] = medinfo.find('PMID').text
                
            for author in root.iter('Author'):
                lastname = author.find('LastName').text
                firstname = author.find('ForeName').text
                authorname = firstname + " " + lastname
                article_data['Author'] = authorname

            for pubDate in root.iter('DateCompleted'):
                pubYear = pubDate.find('Year').text
                pubMonth = pubDate.find('Month').text
                pubDay = pubDate.find('Day').text
                pubDate = pubDay + "/" + pubMonth + "/" + pubYear
                article_data['pubDate'] = pubDate

            for reviseDate in root.iter('DateRevised'):
                reviseYear = reviseDate.find('Year').text
                reviseMonth = reviseDate.find('Month').text
                reviseDay = reviseDate.find('Day').text
                reviseDate = reviseDay + "/" + reviseMonth + "/" + reviseYear
                article_data['reviseDate'] = reviseDate

            for journal in root.iter('Journal'):
                article_data['ISSN'] = journal.find('ISSN').text

            for journalinfo in root.iter('MedlineJournalInfo'):
                article_data['country'] = journalinfo.find('Country').text

            json_data = json.dumps(article_data)
            print(json_data)


if __name__ == "__main__":
    main(sys.argv[1:])
