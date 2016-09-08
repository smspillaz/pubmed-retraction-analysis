import contextlib
import json
import os
import errno
import sys
from six.moves import urllib

searchurl = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=Retracted+Publication&retmax=6000&retmode=json"
fetchurl = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?&db=pubmed&rettype=xml&id="
request = urllib.request.Request(searchurl)

#Attempt to download the given url, returning the xml document
#Exits after 5 failed attempts
def attemptDownload(downloadurl,retries=0):
    if retries > 5:
        print("download failed")
        sys.exit
    try:
        with contextlib.closing(urllib.request.urlopen(downloadurl)) as response:
            data = response.read()
            return data
    except:
        retries+=1
        attemptDownload(downloadurl,retries)

def attemptIdList(retries=0):
    if retries > 5:
        print("failed to retrieve ID list")
        sys.exit
    try:
        with contextlib.closing(urllib.request.urlopen(request)) as byte_response:
            str_response = byte_response.read().decode('utf-8')
            return str_response
    except:
        retries+=1
        attemptIdList(retries)

def main(argv=None):
    """Entry point for downloader script."""
    argv = argv or sys.argv[1:]

    data = json.loads(attemptIdList())
    idlist = data["esearchresult"]["idlist"]

    try:
        os.makedirs("Retractions")
    except OSError as error:
        if error.errno != errno.EEXIST:
            raise error

    for id in idlist:
        if(os.path.isfile("Retractions/" + id + ".xml") != True):
            downloadurl = "%s%s" % (fetchurl,id)
            out_name = "Retractions/%s.xml" % (id)
            print("Downloading article " + id)
            data = attemptDownload(downloadurl)
            with open(out_name, 'wb') as out_file:
                out_file.write(data)


if __name__ == "__main__":
    main(sys.argv[1:])
