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
from datetime import date, datetime
import os
import re
import sys
import itertools
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


class InvalidCombinationExpection(Exception):
    """Exception raised if combination of entries not found in object."""

    def __init__(self, entry, valid_combinations):
        """Initialize this exception with combinations."""
        Exception.__init__(self)
        self._entry = entry
        self._valid_combinations = valid_combinations

    def __str__(self):
        """Convert to string."""
        return ("""No combination of children found in entry {} """
                """satisfying {}""".format(self._entry,
                                           self._valid_combinations))


def expect_section_combinations(entry, object, combinations):
    """Expect object to have one of the passed valid section combinations.

    If it doesn't, then throw an InvalidCombinationExpection specifying
    why it is invalid.
    """
    # We need to use 'is not None' instead of the unspecified-bool-value
    # test here, since the Element itself does not resolve to true
    # on a general if-test.
    if not any([all([object.find(e) is not None for e in c]) and
                len(c) == len(list(object))
               for c in combinations]):
        raise InvalidCombinationExpection(entry, combinations)


def expect_valid_date_combinations(entry, object):
    """Expect object to have valid date combinations as children."""
    return expect_section_combinations(entry, object, [
        tuple(),
        ("Year", ),
        ("Year", "Month"),
        ("Year", "Month", "Day")
    ])


def sections_to_date_entry(sections):
    """Given a list of date sections, return a date entry."""
    # Set every other component to 1
    date_sections = sections + list(itertools.repeat("1", 3 - len(sections)))
    return {
        "date": date(*[
            int(a) for a in date_sections
        ]).isoformat(),
        "components": {
            "Year": len(sections) > 0,
            "Month": len(sections) > 1,
            "Day": len(sections) == 3
        }
    }


def sanitise_string(string):
    """Sanitize a particular string."""
    return re.sub(r"[\\\t\\\n\\\r]", "", string.strip())


def sanitise_field_values(structure):
    """For each value in structure, sanitize field values."""
    return {
        k: sanitise_string(v)
        if isinstance(v, str)
        else (sanitise_field_values(v) if isinstance(v, dict)
              else [sanitise_string(s) for s in v] if isinstance(v, list)
              else v)
        for k, v in structure.items()
    }


def warning(filename, msg):
    """Print warning about filename."""
    sys.stderr.write("{}{}\n".format(filename + ": " if filename else "",
                                     msg))


def get_author_name(author_element):
    """Given an author_element attempt to get a name."""
    lastname_element = author_element.find("LastName")
    forename_element = author_element.find("ForeName")
    name = " ".join([a.text for a in [forename_element, lastname_element]
                     if a is not None])

    if not name:
        name = author_element.find("CollectiveName").text

    return name


def parse_element_tree(tree, filename=None):
    """For a given ElementTree :tree:, parse it into JSON."""
    root = tree.getroot()
    article_data = {
        "pmid": None,
        "pubDate": None,
        "reviseDate": None,
        "ISSN": None,
        "country": None,
        "Author": None,
        "Topic": None
    }

    for medinfo in root.iter("MedlineCitation"):
        article_data["pmid"] = medinfo.find("PMID").text

    authors = list()
    for author in root.iter("Author"):
        authors.append(get_author_name(author))
    article_data["Author"] = authors

    for pubDate in root.iter("DateCompleted"):
        expect_valid_date_combinations("DateCompleted", pubDate)
        sections = parse_selected_sections(pubDate, "Year", "Month", "Day")
        article_data["pubDate"] = sections_to_date_entry([
            s for s in sections if s
        ])

    for reviseDate in root.iter("DateRevised"):
        expect_valid_date_combinations("DateRevised", reviseDate)
        sections = parse_selected_sections(reviseDate, "Year", "Month", "Day")
        article_data["reviseDate"] = sections_to_date_entry([
            s for s in sections if s
        ])

    for journal in root.iter("Journal"):
        sections = parse_selected_sections(journal, "ISSN")
        if all(sections):
            article_data["ISSN"] = sections[0]

    for journalinfo in root.iter("MedlineJournalInfo"):
        sections = parse_selected_sections(journalinfo, "Country")
        if all(sections):
            article_data["country"] = sections[0]

    for headinglist in root.iter("MeshHeadingList"):
        topics = list()
        for heading in root.iter("MeshHeading"):
            sections = parse_selected_sections(heading, "DescriptorName")
            if all(sections):
                topics.append(sections[0])
        article_data["Topic"] = topics

    # Print error to stderr if there's contradictory field
    # entries and don't insert a value if so
    if all([article_data[a] is not None for a in ["pubDate", "reviseDate"]]):
        if (datetime.strptime(article_data["pubDate"]["date"],
                              "%Y-%m-%d") >
                datetime.strptime(article_data["reviseDate"]["date"],
                                  "%Y-%m-%d")):
            warning(filename,
                    """pubDate ({}) is greater than reviseDate ({})"""
                    """""".format(article_data["pubDate"],
                                  article_data["reviseDate"]))
            article_data["pubDate"] = None
            article_data["reviseDate"] = None

    if len([k for k in article_data.keys() if article_data[k]]) == 0:
        sys.stderr.write("File found with no fields, skipping\n")

    return sanitise_field_values(article_data)


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
