.PHONY: lint test scrape

lint:
	ruff check scraper/
	ruff format --check scraper/

test:
	pytest -v

scrape:
	cd scraper && python scrape.py
