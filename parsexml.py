import os
import xml.etree.ElementTree as ET
import json

dir = "./Retractions"

for file in os.listdir(dir):
    if file.endswith(".xml"):
        tree = ET.parse(dir + "/" + file)
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
            pubDate = pubDay + "/" + pubMonth + "/" + pubYear
            article_data['pubDate'] = pubDate

        for reviseDate in root.iter('DateRevised'):
            reviseYear = reviseDate.find('Year').text
            reviseMonth = reviseDate.find('Month').text
            reviseDay = reviseDate.find('Day').text
            reviseDate = reviseDay + "/" + reviseMonth + "/" + reviseYear
            article_data['reviseDate'] = reviseDate

        for journal in root.iter('Journal'):
            article_data['ISSN'] = journal.find('ISSN').text

        for journalinfo in root.iter('MedlineJournalInfo'):
            article_data['country'] = journalinfo.find('Country').text

        json_data = json.dumps(article_data)
        print(json_data)
