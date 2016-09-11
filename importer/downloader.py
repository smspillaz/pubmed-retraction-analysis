import contextlib
import json
import os
import errno
import sys
import xml.etree.ElementTree as ET
from six.moves import urllib

# Attempt to download the given url, returning the xml document
# Exits after 5 failed attempts
def attemptDownload(downloadurl, retries=0):
    if retries > 5:
        sys.stderr.write("Connection failed.")
        sys.exit(1)
    try:
        with contextlib.closing(urllib.request.urlopen(downloadurl)) as response:
            return response.read()
    except urllib.error.URLError:
        retries += 1
        sys.stderr.write("Connection error.. retrying " + str(retries))
        return attemptDownload(downloadurl, retries)

def main(argv=None):
    """Entry point for downloader script."""
    argv = argv or sys.argv[1:]

    counturl = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=Retracted+Publication&rettype=count&retmode=json"
    str_response = attemptDownload(counturl).decode('utf-8')
    data = json.loads(str_response)    
    articleCount = data["esearchresult"]["count"]

    searchurl = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=Retracted+Publication&retmax=" + articleCount + "&retmode=json"

    fetchurl = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?&db=pubmed&rettype=xml&id="
    request = urllib.request.Request(searchurl)
        
    str_response = attemptDownload(request).decode('utf-8')
    data = json.loads(str_response)
    idlist = data["esearchresult"]["idlist"]

    try:
        os.makedirs("Retractions")
    except OSError as error:
        if error.errno != errno.EEXIST:
            raise error

    for id in idlist:
        if not os.path.isfile("Retractions/" + id + ".xml"):
            downloadurl = "%s%s" % (fetchurl,id)
            out_name = "Retractions/%s.xml" % (id)
            print("Downloading article " + id)
            data = attemptDownload(downloadurl)
            with open(out_name, 'wb') as out_file:
                out_file.write(data)


if __name__ == "__main__":
    main(sys.argv[1:])
