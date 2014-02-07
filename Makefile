SOURCES=$(shell find app core app.js -name '*.js' -print)

test:
	# @NODE_ENV=test ./node_modules/.bin/mocha -R doc | cat cov/head.html - cov/tail.html
	@NODE_ENV=test mocha -R spec

test-w:
	@NODE_ENV=test mocha --watch

cov:
	@NODE_ENV=test istanbul cover _mocha -- -R spec

lint: $(SOURCES)
	jslint --terse $(SOURCES)

.PHONY: test test-w cov

