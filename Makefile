help:
	@echo "Aris Javascript Editor"
	@echo ""
	@echo "Targets:"
	@echo " rebase: force rebase over build branch"
	@echo "    css: compile less"
	@echo "  build: optimize all js into one file with requireJS"
	@echo "    all: rebase compile optimize"
	@echo " heroku: push build branch to heroku"
	@echo " deploy: push build branch to aris"
	@echo ""
	@echo "make [all|css|build|deploy]"

css:
	lessc styles/arisjs.less > styles/arisjs.css

build:
	r.js -o build.js
	@echo "Built! Make sure to check the result into the build branch, not master"
	@echo ""

heroku:
	git push -f heroku build:master

deploy:
	git push -f
	ssh aris "cd /var/www/html/jseditor/ && git checkout build && git fetch && git rebase -f origin/build"

render:
	@echo "-------------------------------"
	@echo "Render index.html from template"
	@bin/render_index.sh


rebase:
	git rebase -f master

all: rebase css build render
