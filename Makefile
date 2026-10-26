.PHONY: lint test scrape dev fe-test fe-lint

lint:
	ruff check backend/
	ruff format --check backend/

test:
	cd backend && pytest -v

scrape:
	cd backend/scraper && python scrape.py

dev:
	cd frontend && npm run dev

fe-test:
	cd frontend && npm test

fe-lint:
	cd frontend && npx tsc --noEmit && npm run lint
