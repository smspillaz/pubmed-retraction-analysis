# /test/test_parsexml.py
#
# Tests for parsexml.
#
# See /LICENCE.md for Copyright information
"""Tests for parsexml."""

from importer import parsexml

from six.moves import StringIO

from testtools import TestCase


class TestFileToElementTree(TestCase):
    """Test conversion of a file to an element tree."""

    def test_convert(self):
        """File can be converted to element tree."""
        stream = StringIO("<html></html>")
        parsexml.file_to_element_tree(stream)
