# MT5 Trade Analysis Service

A Python/FastAPI microservice that connects to MetaTrader 5, imports full trade history, and returns AI-powered performance analysis.

## Prerequisites

- Windows OS (MetaTrader5 Python SDK is Windows-only)
- MetaTrader 5 terminal installed
- Python 3.10+

## Setup

```bash
cd mt5_service
pip install -r requirements.txt
```

Optionally copy `.env.example` to `.env` and add your Gemini key for richer AI summaries:

```
GEMINI_API_KEY=your_key_here
```

## Run the service

```bash
python main.py
```

The service starts on **http://localhost:8000**.

## Endpoints

### `POST /connect-mt5`

Connect to MT5 and import trade history.

**Body:**
```json
{
  "account": 123456,
  "password": "investor_password",
  "server": "Broker-Server"
}
```

**Response:** analysis results + first 100 trades.

---

### `GET /trade-report?user_id=default`

Return stored trades + analysis + AI summary.

---

### `GET /health`

Service liveness check.

## Architecture

```
mt5_service/
  main.py           — FastAPI app & endpoints
  mt5_connector.py  — MT5 login + deal history extraction
  database.py       — SQLite persistence (data/trades.db)
  analyzer.py       — Pandas-based statistics
  ai_summary.py     — Rule engine + optional Gemini AI insights
  requirements.txt
  data/             — auto-created, stores trades.db
```
