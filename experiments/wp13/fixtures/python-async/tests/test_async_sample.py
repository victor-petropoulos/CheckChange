import asyncio
from src.async_sample import fetch_data, process_items

def test_fetch_data():
    assert asyncio.run(fetch_data("http://example.com")) == "fetched http://example.com"
    assert asyncio.run(fetch_data("")) is None

def test_process_items():
    result = asyncio.run(process_items(["hello world", None, "hi"]))
    assert "HELLO WORLD" in result
