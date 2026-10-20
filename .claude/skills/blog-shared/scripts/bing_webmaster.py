#!/usr/bin/env python3
"""
Bing Webmaster Tools reader for steamgameidler.com (search performance, crawl health, sitemaps,
URL status). Fills the gap left by claude-seo's own bing_webmaster.py, which only covers
backlinks. Stdlib only, so any Python 3.9+ runs it.

The API key is read from claude-seo's config (~/.config/claude-seo/backlinks-api.json,
"bing_api_key") or the BING_API_KEY env var. It is never printed. The key can see every site in
the Bing account, so --site defaults to steamgameidler.com; don't point it at other sites.

Usage:
    python bing_webmaster.py summary [--days 28] [--json]
    python bing_webmaster.py queries [--days 90] [--filter achievement] [--limit 50] [--json]
    python bing_webmaster.py pages   [--days 90] [--filter /blog/] [--limit 50] [--json]
    python bing_webmaster.py crawl   [--days 30] [--json]
    python bing_webmaster.py url https://steamgameidler.com/blog/some-post [--json]

Bing's data lags 2-3 days, and query/page stats arrive as weekly buckets - `--days` selects the
buckets whose date falls in the window.
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

API = "https://ssl.bing.com/webmaster/api.svc/json"
DEFAULT_SITE = "https://steamgameidler.com/"
CONFIG = os.path.expanduser("~/.config/claude-seo/backlinks-api.json")


def api_key():
    key = os.environ.get("BING_API_KEY")
    if not key and os.path.exists(CONFIG):
        with open(CONFIG, encoding="utf-8") as f:
            key = json.load(f).get("bing_api_key")
    if not key:
        sys.exit(f"No Bing API key: set BING_API_KEY or add bing_api_key to {CONFIG}")
    return key


def call(method, site, **params):
    query = urllib.parse.urlencode({"siteUrl": site, "apikey": api_key(), **params})
    try:
        with urllib.request.urlopen(f"{API}/{method}?{query}", timeout=60) as response:
            return json.load(response).get("d")
    except urllib.error.HTTPError as error:
        # The URL carries the key, so report only the method and status, never the request.
        detail = error.read()[:300].decode("utf-8", "replace")
        sys.exit(f"Bing API {method} failed: HTTP {error.code} {detail}")


def parse_date(value):
    """Bing's WCF dates look like /Date(1750377600000)/ or /Date(1750377600000-0700)/."""
    match = re.search(r"-?\d+", value or "")
    if not match or int(match.group()) <= 0:
        return None
    return datetime.fromtimestamp(int(match.group()) / 1000, tz=timezone.utc)


def iso(value):
    parsed = parse_date(value)
    return parsed.date().isoformat() if parsed else None


def in_window(rows, days):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return [row for row in rows or [] if (parse_date(row.get("Date")) or cutoff) >= cutoff]


def aggregate(rows, key_filter=None):
    """Sum weekly buckets per query/page; positions are impression-weighted averages."""
    totals = {}
    for row in rows:
        name = row["Query"]
        if key_filter and key_filter.lower() not in name.lower():
            continue
        entry = totals.setdefault(name, {"name": name, "impressions": 0, "clicks": 0, "_pos": 0})
        entry["impressions"] += row.get("Impressions", 0)
        entry["clicks"] += row.get("Clicks", 0)
        position = row.get("AvgImpressionPosition", -1)
        if position and position > 0:
            entry["_pos"] += position * row.get("Impressions", 0)
    result = []
    for entry in totals.values():
        impressions = entry["impressions"]
        result.append(
            {
                "name": entry["name"],
                "impressions": impressions,
                "clicks": entry["clicks"],
                "ctr": round(entry["clicks"] / impressions * 100, 2) if impressions else 0,
                "position": round(entry.pop("_pos") / impressions, 1) if impressions else None,
            }
        )
    return sorted(result, key=lambda e: (-e["impressions"], -e["clicks"]))


def traffic_totals(site, days):
    rows = call("GetRankAndTrafficStats", site)
    now = datetime.now(timezone.utc)

    def window(start, end):
        picked = [r for r in rows or [] if (d := parse_date(r.get("Date"))) and start <= d < end]
        return {
            "impressions": sum(r.get("Impressions", 0) for r in picked),
            "clicks": sum(r.get("Clicks", 0) for r in picked),
        }

    return {
        "current": window(now - timedelta(days=days), now),
        "previous": window(now - timedelta(days=2 * days), now - timedelta(days=days)),
    }


def crawl(site, days):
    rows = sorted(in_window(call("GetCrawlStats", site), days), key=lambda r: r["Date"])
    latest = rows[-1] if rows else {}
    fields = ["InIndex", "CrawledPages", "CrawlErrors", "Code2xx", "Code301", "Code302", "Code4xx",
              "Code5xx", "BlockedByRobotsTxt", "AllOtherCodes", "DnsFailures", "ConnectionTimeout",
              "ContainsMalware", "InLinks"]
    return {
        "latest_date": iso(latest.get("Date")),
        "latest": {f: latest.get(f) for f in fields},
        f"sum_last_{days}_days": {
            f: sum(r.get(f, 0) for r in rows)
            for f in ["CrawledPages", "CrawlErrors", "Code4xx", "Code5xx", "BlockedByRobotsTxt"]
        },
        "issues": [
            {"url": i.get("Url"), "issue": i.get("Issues"), "http": i.get("HttpCode")}
            for i in call("GetCrawlIssues", site) or []
        ],
    }


def sitemaps(site):
    return [
        {
            "url": f.get("Url"),
            "status": f.get("Status"),
            "url_count": f.get("UrlCount"),
            "last_crawled": iso(f.get("LastCrawled")),
            "submitted": iso(f.get("Submitted")),
        }
        for f in call("GetFeeds", site) or []
    ]


def url_info(site, url):
    info = call("GetUrlInfo", site, url=url) or {}
    return {
        "url": info.get("Url", url),
        "discovered": iso(info.get("DiscoveryDate")),
        "last_crawled": iso(info.get("LastCrawledDate")),
        "http_status": info.get("HttpStatus"),
        "is_page": info.get("IsPage"),
        "anchor_count": info.get("AnchorCount"),
        "document_size": info.get("DocumentSize"),
        # Bing returns an empty record (no dates) for URLs it has never seen.
        "known_to_bing": bool(info.get("DiscoveryDate") and parse_date(info.get("DiscoveryDate"))),
    }


def print_table(rows, label):
    print(f"{label:<70} {'impr':>7} {'clicks':>7} {'ctr%':>6} {'pos':>5}")
    for r in rows:
        print(f"{r['name'][:70]:<70} {r['impressions']:>7} {r['clicks']:>7} {r['ctr']:>6} "
              f"{r['position'] if r['position'] is not None else '-':>5}")


def main():
    parser = argparse.ArgumentParser(description="Bing Webmaster Tools reader")
    parser.add_argument("command", choices=["summary", "queries", "pages", "crawl", "url"])
    parser.add_argument("target", nargs="?", help="URL for the `url` command")
    parser.add_argument("--site", default=DEFAULT_SITE)
    parser.add_argument("--days", type=int)
    parser.add_argument("--filter", help="Substring filter on query text / page URL")
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    if args.command == "summary":
        days = args.days or 28
        result = {
            "site": args.site,
            "days": days,
            "traffic": traffic_totals(args.site, days),
            "top_queries": aggregate(in_window(call("GetQueryStats", args.site), days))[:15],
            "top_pages": aggregate(in_window(call("GetPageStats", args.site), days))[:15],
            "crawl": crawl(args.site, days),
            "sitemaps": sitemaps(args.site),
            "submission_quota": {
                k: v for k, v in (call("GetUrlSubmissionQuota", args.site) or {}).items()
                if not k.startswith("__")
            },
        }
    elif args.command in ("queries", "pages"):
        method = "GetQueryStats" if args.command == "queries" else "GetPageStats"
        rows = aggregate(in_window(call(method, args.site), args.days or 90), args.filter)
        result = rows[: args.limit]
        if not args.json:
            print_table(result, "query" if args.command == "queries" else "page")
            return
    elif args.command == "crawl":
        result = {"crawl": crawl(args.site, args.days or 30), "sitemaps": sitemaps(args.site)}
    else:
        if not args.target:
            parser.error("url needs a URL")
        result = url_info(args.site, args.target)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
