#!/usr/bin/env bash

readlink=readlink
if ! readlink -f "$0" >/dev/null 2>&1 ; then
    command -v greadlink >/dev/null 2>&1 || {
    printf "%s\n" "GNU readlink is required."
    exit 1;
    }
    readlink=greadlink
fi

cd "$(dirname "$("$readlink" -f "$0")")"

export PATH="$PATH:$(realpath ./node_modules/.bin/)"
echo "Using path $PATH"
node bundle.js &
node run.js