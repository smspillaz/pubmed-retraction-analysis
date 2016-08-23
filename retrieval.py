import urllib.request
import contextlib
import json

searchurl = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=Retracted+Publication&retmax=10&retmode=json"
fetchurl = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?&db=pubmed&id="
request = urllib.request.Request(searchurl)

with contextlib.closing(urllib.request.urlopen(request)) as byte_response:
    str_response = byte_response.read().decode('utf-8')

data = json.loads(str_response)
idlist = data["esearchresult"]["idlist"]

for id in idlist:
    downloadurl = "%s%s" % (fetchurl,id)
    out_name = "Retractions/%s.txt" % (id) #make directory 'Retractions' first
    with urllib.request.urlopen(downloadurl) as response, open(out_name, 'wb') as out_file:
   	 data = response.read()
   	 out_file.write(data)
