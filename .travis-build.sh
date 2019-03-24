#!/usr/bin/env bash

set -ex
rm -r ./.rpt2_cache/
node bundle.js
