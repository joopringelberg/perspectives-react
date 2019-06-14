#!/usr/bin/env bash

# NOTE: this script should be adapted with each new tagged version of aff-sockets!

cd node_modules

rm -Rf perspectives-proxy

ln -s ../../perspectives-proxy
