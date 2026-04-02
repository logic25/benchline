#!/bin/bash
export PATH="/Users/mannyrussell/.nvm/versions/node/v20.20.2/bin:$PATH"
cd /Users/mannyrussell/benchline
exec node node_modules/.bin/next dev --webpack
