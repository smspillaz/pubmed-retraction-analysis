# /importer/generate_representative_sample.py
#
# Generate a representative sample of all data extracted from PubMed articles.
#
# See /LICENCE.md for Copyright information
"""Generate a representative sample of all data extracted from articles."""

import argparse
from contextlib import contextmanager
import errno
from datetime import datetime
import itertools
import json
import sys


FIELDS_TO_SAMPLE = [
    "reviseDate",
    "ISSN",
    "Author",
    "country",
    "pubDate"
]


def determine_year_range(data):
    """Given an array of PubMed retraction data, determine the year range."""
    dates = [
        datetime.strptime(a["date"], "%Y-%m-%d")
        for a in [d.get("pubDate", None) for d in data]
        if a is not None
    ]

    # I guess O(2N) is probably better than having to sort the list
    return (min(dates).year, max(dates).year)


def allowable_fields(fields, year_range):
    """Determine tuples of allowable field specifications."""
    fields_powerset = [
        tuple(sorted(a))
        for a in itertools.chain.from_iterable(
            itertools.combinations(fields, r)
            for r in range(len(fields) + 1)
        )
    ]
    return list(
        itertools.product(fields_powerset, range(year_range[0],
                                                 year_range[1] + 1))
    )


def sample_fields(fields, year_range, data):
    """Determine a representative sample of data."""
    cartesian_product = allowable_fields(fields, year_range)
    sampled_data = {
        k: None for k in cartesian_product
    }

    for entry in data:
        found_fields = tuple(sorted(k for k in entry.keys() if k != "pmid"))
        pub_date = entry.get("pubDate", None) or {
            "date": datetime.strptime("2016", "%Y").strftime("%Y-%m-%d")
        }
        publication_year = datetime.strptime(pub_date["date"],
                                             "%Y-%m-%d").year
        if not sampled_data[(found_fields, publication_year)]:
            sampled_data[(found_fields, publication_year)] = entry

    return [v for v in sampled_data.values() if v is not None]


@contextmanager
def open_or_stdin(path):
    """Open path or yield the stdin."""
    try:
        with open(path or "", "r") as fileobj:
            yield fileobj
    except IOError as error:
        if error.errno != errno.ENOENT:
            raise error
        else:
            yield sys.stdin


def main(argv=None):
    """Import all data in JSON file into Neo4j database."""
    parser = argparse.ArgumentParser(description="Generate representative "
                                                 "sample of data")
    parser.add_argument("file",
                        help="File to read",
                        nargs="?",
                        type=str,
                        metavar="FILE")
    parse_result = parser.parse_args(argv or sys.argv[1:])

    with open_or_stdin(parse_result.file) as fileobj:
        data = json.load(fileobj)
        print(json.dumps(sample_fields(FIELDS_TO_SAMPLE,
                                       determine_year_range(data),
                                       data)))


if __name__ == "__main__":
    main(sys.argv[1:])
