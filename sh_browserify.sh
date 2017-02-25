
# nodejs node_modules/browserify/bin/cmd.js ./src/main.js -o ./dist/bundle.js

# wrong result???
# nodejs node_modules/browserify/bin/cmd.js ./src/main.js | nodejs node_modules/uglifyjs/bin/uglifyjs -c > ./dist/bundle.js
# /wrong result???

# nodejs node_modules/browserify/bin/cmd.js -g ./node_modules/uglifyify/index.js ./src/main.js > ./dist/bundle.js

# nodejs node_modules/browserify/bin/cmd.js --help advanced

# nodejs node_modules/browserify/bin/cmd.js -t ./node_modules/uglifyify/index.js ./src/main.js > ./dist/bundle.js

# nodejs node_modules/browserify/bin/cmd.js -t [ ./node_modules/uglifyify/index.js --ignore '**/node_modules/gamma/*' ] ./src/main.js 	> ./dist/bundle.js



SRC=./src/main.js
OUT=./dist/bundle.js

NODE=nodejs
BROWSERIFY=./node_modules/browserify/bin/cmd.js
UGLIFYIFY=./node_modules/uglifyify/index.js


# # no uglification
# $NODE $BROWSERIFY $SRC > $OUT

# # local uglification
# nodejs node_modules/browserify/bin/cmd.js -t ./node_modules/uglifyify/index.js ./src/main.js > ./dist/bundle.js

# global uglification
$NODE $BROWSERIFY -g $UGLIFYIFY $SRC > $OUT
