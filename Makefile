.PHONY: lint test scrape dev fe-test fe-lint api

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

api:
	cd backend && uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
