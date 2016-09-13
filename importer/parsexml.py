# /importer/parsexml.py
#
# Given a series of XML files in a directory, produce a single JSON file
# indicating all of the relevant fields for each retraction.
#
# See /LICENCE.md for Copyright information
"""Given a series of XML files in a directory, produce a JSON file.

This file will contain all the relevant fields for each retraction.
"""

import argparse
from datetime import date
import os
import sys
import json
import xml.etree.ElementTree as ET


def file_to_element_tree(path):
    """For a given :path:, get an ElementTree."""
    return ET.parse(path)


def parse_selected_sections(object, *args):
    """Given a particular ElementTree element, get specified children."""
    def _text_or_none(element):
        """Given a particular element, return its text or None."""
        if element is not None:
            return element.text
        else:
            return None

    return [
        _text_or_none(object.find(a)) for a in args
    ]


def parse_element_tree(tree):
    """For a given ElementTree :tree:, parse it into JSON."""
    root = tree.getroot()
    article_data = {}

    for medinfo in root.iter("MedlineCitation"):
        article_data["pmid"] = medinfo.find("PMID").text

    for author in root.iter("Author"):
        lastname = author.find("LastName").text
        firstname = author.find("ForeName").text
        authorname = firstname + " " + lastname
        article_data["Author"] = authorname

    for pubDate in root.iter("DateCompleted"):
        sections = parse_selected_sections(pubDate, "Year", "Month", "Day")
        if all(sections):
            article_data["pubDate"] = date(*[
                int(a) for a in sections
            ]).isoformat()

    for reviseDate in root.iter("DateRevised"):
        sections = parse_selected_sections(reviseDate, "Year", "Month", "Day")
        if all(sections):
            article_data["reviseDate"] = date(*[
                int(a) for a in sections
            ]).isoformat()

    for journal in root.iter("Journal"):
        sections = parse_selected_sections(journal, "ISSN")
        if all(sections):
            article_data["ISSN"] = sections[0]

    for journalinfo in root.iter("MedlineJournalInfo"):
        sections = parse_selected_sections(journalinfo, "Country")
        if all(sections):
            article_data["country"] = sections[0]

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
