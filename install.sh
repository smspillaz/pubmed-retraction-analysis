#!/bin/bash
#
# /install.sh - a script to install and bootstrap dependencies
# if they are not already installed.

if [[ -z $(which python) ]] ; then
    echo "Cannot continue, python not installed"
fi

python setup.py
