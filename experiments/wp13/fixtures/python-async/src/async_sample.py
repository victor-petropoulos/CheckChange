import asyncio

async def fetch_data(url: str):
    if not url:
        return None
    if url.startswith("http"):
        return f"fetched {url}"
    else:
        return f"local {url}"

async def process_items(items):
    results = []
    for item in items:
        if item is None:
            continue
        if isinstance(item, str) and len(item) > 5:
            results.append(item.upper())
        else:
            results.append(str(item))
    return results

async def complex_async(a, b, c):
    try:
        if a and b:
            if c:
                return a + b + c
            else:
                return a + b
        elif a or b:
            return a or b
        else:
            raise ValueError("no value")
    except Exception as e:
        return str(e)
