.PHONY: lint test scrape

lint:
	ruff check backend/
	ruff format --check backend/

test:
	cd backend && pytest -v

scrape:
	cd backend/scraper && python scrape.py
