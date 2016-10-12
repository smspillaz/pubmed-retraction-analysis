# /importer/downloader.py
#
# Downloads PubMed articles.
#
# See /LICENCE.md for Copyright information
"""Download PubMed articles."""

import argparse
import contextlib
import json
import os
import errno
import sys

from six.moves import urllib


def pubmed_api(function):
    """Get entry point for PubMed API."""
    pubmed_api_url = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/{}.fcgi?"
    return pubmed_api_url.format(function)


def pubmed_search_for_articles_url(term, retmax=10):
    """Get a URL to search PubMed for articles."""
    return pubmed_api("esearch") + urllib.parse.urlencode({
        "db": "pubmed",
        "term": term,
        "retmax": str(retmax),
        "retmode": "json"
    })


def pubmed_fetch_article_url(article):
    """Get a URL to fetch a single PubMed article."""
    return pubmed_api("efetch") + urllib.parse.urlencode({
        "db": "pubmed",
        "id": str(article),
        "rettype": "xml"
    })


def pubmed_count_articles_url(term):
    """Get a URL to fetch a single PubMed article."""
    return pubmed_api("esearch") + urllib.parse.urlencode({
        "db": "pubmed",
        "term": term,
        "retmode": "json",
        "rettype": "count"
    })


def attempt_download(url, retries=0):
    """Attempt to download the given url, exits after 5 failed attempts."""
    if retries > 5:
        sys.stderr.write("Connection failed.")
        sys.exit(1)
    try:
        print(url)
        with contextlib.closing(urllib.request.urlopen(url)) as response:
            return response.read().decode("utf-8")
    except urllib.error.URLError:
        sys.stderr.write("Connection error.. retrying {}\n".format(retries))
        return attempt_download(url, retries + 1)


def attempt_download_json(url):
    """Attempt to download the given url, returning JSON."""
    return json.loads(attempt_download(url))


def main(argv=None):
    """Entry point for downloader script."""
    argv = argv or sys.argv[1:]
    parser = argparse.ArgumentParser("Download PubMed Articles")
    parser.add_argument("location",
                        default="Retractions",
                        type=str,
                        nargs="?",
                        metavar="DIR",
                        help="Directory to store downloaded articles")
    parser.add_argument("--article-count",
                        type=int,
                        metavar="COUNT",
                        help="How many articles to download (default is all)")
    result = parser.parse_args(argv)

    article_count = result.article_count
    if not article_count:
        article_count_data = attempt_download_json(
            pubmed_count_articles_url("Retracted+Publications")
        )
        article_count = article_count_data["esearchresult"]["count"]

    id_list_data = attempt_download_json(
        pubmed_search_for_articles_url("Retracted+Publications",
                                       retmax=article_count)
    )
    id_list = id_list_data["esearchresult"]["idlist"]

    try:
        os.makedirs(result.location)
    except OSError as error:
        if error.errno != errno.EEXIST:
            raise error

    for article_id in id_list:
        out_name = os.path.join(result.location, article_id + ".xml")
        if not os.path.isfile(out_name):
            downloadurl = pubmed_fetch_article_url(article_id)
            print("Downloading article " + article_id)
            data = attempt_download(downloadurl)
            with open(out_name, "wb") as out_file:
                out_file.write(data.encode("utf-8"))

if __name__ == "__main__":
    main(sys.argv[1:])
