# /setup.py
#
# Installation and setup script for pubmed-retraction-analysis
#
# See /LICENCE.md for Copyright information
"""Installation and setup script for pubmed-retraction-analysis."""

from setuptools import find_packages, setup

setup(name="pubmed-retraction-analysis",
      version="0.0.1",
      description="""Analysis of retracted documents on PubMed.""",
      long_description_markdown_filename="README.md",
      author="Sam Spilsbury",
      author_email="smspillaz@gmail.com",
      classifiers=["Development Status :: 3 - Alpha",
                   "Programming Language :: Python :: 2",
                   "Programming Language :: Python :: 2.7",
                   "Programming Language :: Python :: 3",
                   "Programming Language :: Python :: 3.1",
                   "Programming Language :: Python :: 3.2",
                   "Programming Language :: Python :: 3.3",
                   "Programming Language :: Python :: 3.4",
                   "License :: OSI Approved :: MIT License"],
      url="http://github.com/smspillaz/pubmed-retraction-analysis",
      license="MIT",
      keywords="development",
      packages=find_packages(exclude=["test"]),
      install_requires=["setuptools"],
      extras_require={
          "green": ["testtools",
                    "iocapture",
                    "nose",
                    "nose-parameterized>=0.5.0",
                    "mock",
                    "setuptools-green>=0.0.13",
                    "six"],
          "polysquarelint": ["polysquare-setuptools-lint>=0.0.19"],
          "upload": ["setuptools-markdown"]
      },
      entry_points={
          "console_scripts": [
              "download-pubmed-articles=importer.downloader:main",
              "parse-pubmed-files=importer.parsexml:main",
              "load-pubmed-files=importer.load:main",
              "generate-representative-pubmed-sample="
              "importer.generate_representative_sample:main"
          ]
      },
      test_suite="nose.collector",
      zip_safe=True,
      include_package_data=True)
