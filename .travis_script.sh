#!/bin/bash

set -e

if [ "$TRAVIS_SECURE_ENV_VARS" == "true" ]; then
  npm test;
else
  npm run lint;
fi