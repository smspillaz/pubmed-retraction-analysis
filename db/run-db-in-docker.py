#!/usr/bin/env python

import subprocess

subprocess.check_call(["docker", "run"] +
                      ["--publish={p}:{p}".format(p=p) for p in [
                          7474, 7687, 7473
                      ]] + ["--volume=" + "build/neo4j/data", "neo4j:3.0"])
