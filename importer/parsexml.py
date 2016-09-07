import os
import xml.etree.ElementTree as ET
import json
import sys
import argparse
from datetime import date


def file_to_element_tree(path):
    """For a given :path:, get an ElementTree."""
    return ET.parse(path)


def parse_element_tree(tree):
    """For a given ElementTree :tree:, parse it into JSON."""
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
        pubDateObject = date(int(pubYear), int(pubMonth), int(pubDay))
        pubDate = pubDateObject.isoformat()
        article_data['pubDate'] = pubDate

    for reviseDate in root.iter('DateRevised'):
        reviseYear = reviseDate.find('Year').text
        reviseMonth = reviseDate.find('Month').text
        reviseDay = reviseDate.find('Day').text
        reviseDateObject = date(int(reviseYear), int(reviseMonth), int(reviseDay))
        reviseDate = reviseDateObject.isoformat()
        article_data['reviseDate'] = reviseDate

    for journal in root.iter('Journal'):
        article_data['ISSN'] = journal.find('ISSN').text

    for journalinfo in root.iter('MedlineJournalInfo'):
        article_data['country'] = journalinfo.find('Country').text

    return article_data


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

    print(json.dumps([
        parse_element_tree(
            file_to_element_tree(os.path.join(parse_result.directory, fn))
        )
        for fn in os.listdir(parse_result.directory)
        if os.path.splitext(fn)[1] == ".xml"
    ]))


if __name__ == "__main__":
    main(sys.argv[1:])
