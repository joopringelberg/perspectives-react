#!/usr/bin/env bash

# Modify the version numbers of dependencies as needed. Then run ./bumpVersions.sh to create updated versions of
# * packages.dhall
# * createPerspectivesLinks.sh
# * package.json

PERSPECTIVESPROXY=v1.21.0
PERSPECTIVESHIGHLIGHT=v1.3.0

sed "s/PERSPECTIVESPROXY/${PERSPECTIVESPROXY}/g;\
  s/PERSPECTIVESHIGHLIGHT/${PERSPECTIVESHIGHLIGHT}/g;\
  " package.template.json > package.json
