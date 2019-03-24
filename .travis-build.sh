#!/usr/bin/env bash

set -ex
[[ -e ./.rpt2_cache/ ]] && rm -r ./.rpt2_cache/
node bundle.js
