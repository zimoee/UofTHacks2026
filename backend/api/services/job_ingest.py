from __future__ import annotations

import re

import requests
from bs4 import BeautifulSoup


def fetch_job_description_text(*, url: str, timeout_seconds: int = 20, max_chars: int = 20000) -> str:
    """
    Fetch a job posting page and extract a best-effort plain-text description.
    Keep it dependency-light and resilient: this is a heuristic, not a perfect scraper.
    """
    resp = requests.get(
        url,
        headers={
            # Some sites block default python UA
            "User-Agent": "Mozilla/5.0 (compatible; UofTHacks2026Bot/0.1; +https://example.com)",
            "Accept": "text/html,application/xhtml+xml",
        },
        timeout=timeout_seconds,
    )
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    # Prefer the main content if possible; otherwise use whole page text.
    main = soup.find("main") or soup.body or soup
    text = main.get_text(separator="\n", strip=True)

    # Normalize whitespace & collapse repeated blank lines.
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    if len(text) > max_chars:
        text = text[:max_chars]

    return text.strip()

