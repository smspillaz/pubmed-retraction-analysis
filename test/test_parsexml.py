# /test/test_parsexml.py
#
# Tests for parsexml.
#
# See /LICENCE.md for Copyright information
"""Tests for parsexml."""

import sys

from importer import parsexml

from nose_parameterized import parameterized

from six.moves import StringIO

from testtools import (ExpectedException, TestCase)
from testtools.matchers import (Contains,
                                Equals,
                                Is)

from xml.etree import ElementTree


def wrap_document_text(text):
    """Wrap a valid XML document's text with PubMed headers."""
    return ("<PubmedArticleSet><PubmedArticle>{}"
            "</PubmedArticle></PubmedArticleSet>").format(text)


def construct_document_from(**kwargs):
    """Create XML document from keyword arguments, recursively.

    If the value is a dictionary, recurse into that and create a
    document.
    """
    document_list = []

    for key, value in kwargs.items():
        if isinstance(value, str):
            document_list.append("<{key}>{value}</{key}>".format(key=key,
                                                                 value=value))
        elif isinstance(value, dict):
            document_list.append("<{key}>{value}</{key}>".format(
                key=key,
                value=construct_document_from(**value)
            ))

    return "\n".join(document_list)


def append_slash_n_to_values(dictionary):
    """For each value in :dictionary:, append control characters."""
    result = {
        k: v + "\n\t\r"
        if isinstance(v, str)
        else (append_slash_n_to_values(v)
              if isinstance(v, dict)
              else v)
        for k, v in dictionary.items()
    }
    return result


POSSIBLE_MOCK_FIELDS = {
    "MedlineCitation": {
        "PMID": "medline_cit"
    },
    "Author": {
        "LastName": "last_name",
        "ForeName": "fore_name"
    },
    "DateCompleted": {
        "Year": "2011",
        "Month": "11",
        "Day": "11"
    },
    "DateRevised": {
        "Year": "2012",
        "Month": "11",
        "Day": "11"
    },
    "Journal": {
        "ISSN": "0"
    },
    "MedlineJournalInfo": {
        "Country": "Australia"
    }
}

CORRESPONDING_ENTRIES = {
    "Author": "Author",
    "DateCompleted": "pubDate",
    "DateRevised": "reviseDate",
    "Journal": "ISSN",
    "MedlineJournalInfo": "country"
}

EXPECTED_ENTRY_VALUES = {
    "Author": ["fore_name last_name"],
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


class TestFileToElementTree(TestCase):
    """Test conversion of a file to an element tree."""

    def test_convert(self):
        """4.5.3.1 File can be converted to element tree."""
        stream = StringIO("<html></html>")
        parsexml.file_to_element_tree(stream)

    @parameterized.expand(CORRESPONDING_ENTRIES.items())
    def test_parsing_file_in_normal_case(self, field, entry):
        """4.5.3.1 Parse field from data."""
        # Construct document that has all fields but field
        fields = {
            k: v for k, v in POSSIBLE_MOCK_FIELDS.items()
            if k == field
        }
        stream = StringIO(
            wrap_document_text(construct_document_from(**fields))
        )
        result = parsexml.parse_element_tree(
            parsexml.file_to_element_tree(stream)
        )
        self.assertThat(result[entry],
                        Equals(EXPECTED_ENTRY_VALUES[entry]))

    def test_invalid_html_file(self):
        """4.5.3.2 Throw error when parsing invalid html file."""
        stream = StringIO("<html></xml>")
        with ExpectedException(ElementTree.ParseError):
            parsexml.file_to_element_tree(stream)

    @parameterized.expand(CORRESPONDING_ENTRIES.items())
    def test_parsing_file_with_missing_optional_fields(self,
                                                       field,
                                                       entry):
        """4.5.3.3 Parse data that has missing optional fields."""
        # Construct document that has all fields but field
        fields = {
            k: v for k, v in POSSIBLE_MOCK_FIELDS.items()
            if k != field
        }
        stream = StringIO(
            wrap_document_text(construct_document_from(**fields))
        )
        result = parsexml.parse_element_tree(
            parsexml.file_to_element_tree(stream)
        )
        self.assertThat(result[entry], Is(None))

    def test_parsing_author_with_collective_name(self):
        """4.5.3.1 Parse collective name from author."""
        entry = POSSIBLE_MOCK_FIELDS.copy()
        entry["Author"] = {
            "CollectiveName": "collective"
        }
        stream = StringIO(
            wrap_document_text(construct_document_from(**entry))
        )
        result = parsexml.parse_element_tree(
            parsexml.file_to_element_tree(stream)
        )
        self.assertThat(result["Author"], Equals(["collective"]))

    def test_parsing_file_with_no_fields_throws(self):
        """4.5.3.4 Print error file has no relevant fields."""
        stream = StringIO("<PubmedArticleSet><PubmedArticle>"
                          "</PubmedArticle></PubmedArticleSet>")
        stderr = StringIO()
        self.patch(sys, "stderr", stderr)
        result = parsexml.parse_element_tree(
            parsexml.file_to_element_tree(stream)
        )
        stderr.seek(0)
        stderr_out = stderr.read()
        self.assertThat(stderr_out, Contains("skipping"))

    def test_parsing_only_year_in_date(self):
        """4.5.3.5 Only year in date."""
        stream = StringIO(
            wrap_document_text(construct_document_from(**{
                "DateCompleted": {
                    "Year": "2011"
                }
            }))
        )
        result = parsexml.parse_element_tree(
            parsexml.file_to_element_tree(stream)
        )
        self.assertThat(result["pubDate"]["date"], Equals("2011-01-01"))
        self.assertThat(result["pubDate"]["components"],
                        Equals({
                            "Year": True,
                            "Month": False,
                            "Day": False
                        }))

    def test_parsing_only_year_and_month_in_date(self):
        """4.5.3.5 Only year and month in date."""
        stream = StringIO(
            wrap_document_text(construct_document_from(**{
                "DateCompleted": {
                    "Year": "2011",
                    "Month": "10"
                }
            }))
        )
        result = parsexml.parse_element_tree(
            parsexml.file_to_element_tree(stream)
        )
        self.assertThat(result["pubDate"]["date"], Equals("2011-10-01"))
        self.assertThat(result["pubDate"]["components"],
                        Equals({
                            "Year": True,
                            "Month": True,
                            "Day": False
                        }))

    def test_parsing_full_date(self):
        """4.5.3.5 Parsing full date."""
        stream = StringIO(
            wrap_document_text(construct_document_from(**{
                "DateCompleted": {
                    "Year": "2011",
                    "Month": "10",
                    "Day": "2"
                }
            }))
        )
        result = parsexml.parse_element_tree(
            parsexml.file_to_element_tree(stream)
        )
        self.assertThat(result["pubDate"]["date"], Equals("2011-10-02"))
        self.assertThat(result["pubDate"]["components"],
                        Equals({
                            "Year": True,
                            "Month": True,
                            "Day": True
                        }))

    def test_parsing_invalid_date(self):
        """4.5.3.6 Parsing invalid date throws exception."""
        stream = StringIO(
            wrap_document_text(construct_document_from(**{
                "DateCompleted": {
                    "Year": "2011",
                    "Day": "1"
                }
            }))
        )
        with ExpectedException(parsexml.InvalidCombinationExpection):
            parsexml.parse_element_tree(
                parsexml.file_to_element_tree(stream)
            )

    @parameterized.expand(CORRESPONDING_ENTRIES.items())
    def test_parsing_fields_with_control_characters(self, field, entry):
        """4.5.3.7 Parse fields with spurious control characters."""
        fields = append_slash_n_to_values({
            k: v for k, v in POSSIBLE_MOCK_FIELDS.items()
            if k == field
        })
        stream = StringIO(
            wrap_document_text(construct_document_from(**fields))
        )
        result = parsexml.parse_element_tree(
            parsexml.file_to_element_tree(stream)
        )

        # Should match EXPECTED_ENTRY_VALUES, i.e., no trailing newlines
        # or control characters
        self.assertThat(result[entry],
                        Equals(EXPECTED_ENTRY_VALUES[entry]))

    def test_contradictory_date_entries_warn(self):
        """4.8.5.3 Emit warning on contradictory date entries."""
        stream = StringIO(
            wrap_document_text(construct_document_from(**{
                "Author": {
                    "ForeName": "John",
                    "LastName": "Smith"
                },
                "DateCompleted": {
                    "Year": "2011",
                    "Month": "01",
                    "Day": "01"
                },
                "DateRevised": {
                    "Year": "2010",
                    "Month": "01",
                    "Day": "01"
                },
            }))
        )
        stderr = StringIO()
        self.patch(sys, "stderr", stderr)
        result = parsexml.parse_element_tree(
            parsexml.file_to_element_tree(stream)
        )
        stderr.seek(0)
        stderr_out = stderr.read()
        self.assertThat(result["pubDate"], Is(None))
        self.assertThat(result["reviseDate"], Is(None))
        self.assertThat(stderr_out,
                        Contains("is greater than"))
