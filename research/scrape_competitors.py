import os
import json
import re
import urllib.request
import urllib.parse
from html.parser import HTMLParser

urls = {
    "blackhole_motion_viewer": "https://blackhole-spherex.vercel.app/",
    "spherex_photometry": "https://spherex-photometry.vercel.app/?ra=269.4520&dec=4.6930&fov=0.5&epoch=1&band=45&mode=blink",
    "skytrace": "https://skytrace-five.vercel.app/",
    "driftnet": "https://spherex-planet-x.vercel.app/"
}

class SimpleHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.in_title = False
        self.scripts = []
        self.meta_desc = ""
        self.text_parts = []
        self.in_script = False

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag == "script":
            self.in_script = True
            if "src" in attr_dict:
                self.scripts.append(attr_dict["src"])
        elif tag == "meta":
            if attr_dict.get("name") == "description" or attr_dict.get("property") == "og:description":
                self.meta_desc = attr_dict.get("content", "")

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        elif tag == "script":
            self.in_script = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        elif not self.in_script:
            cleaned = data.strip()
            if cleaned:
                self.text_parts.append(cleaned)

results = {}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

for name, url in urls.items():
    print(f"Fetching {name} from {url}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            status_code = resp.status
            
        parser = SimpleHTMLParser()
        parser.feed(html)

        text_clean = " ".join(parser.text_parts)[:2500]

        # Inspect JS bundles
        bundle_findings = []
        for s in parser.scripts:
            if s and ("index" in s or "app" in s or "main" in s or "chunk" in s or "_app" in s or ".js" in s):
                script_url = urllib.parse.urljoin(url, s)
                try:
                    js_req = urllib.request.Request(script_url, headers=headers)
                    with urllib.request.urlopen(js_req, timeout=15) as js_resp:
                        js_text = js_resp.read().decode('utf-8', errors='ignore')
                    
                    keywords = [
                        "fits", "irsa", "tap", "adql", "photometry", "spectrum", "sed",
                        "blink", "difference", "popper", "barnard", "wise", "aladin", "hips",
                        "mock", "simulat", "fake", "planet x", "kuiper", "transient", "subtraction"
                    ]
                    found_kw = [k for k in keywords if k in js_text.lower()]
                    
                    endpoints = re.findall(r'["\'](https?://[^"\']+|/api/[^"\']+)["\']', js_text)
                    api_endpoints = [ep for ep in endpoints if any(term in ep.lower() for term in ["irsa", "api", "spherex", "caltech", "data", "fits", "tap"])]
                    
                    bundle_findings.append({
                        "script": script_url,
                        "size_kb": len(js_text) // 1024,
                        "keywords": found_kw,
                        "api_endpoints": list(set(api_endpoints))[:10]
                    })
                except Exception as e:
                    bundle_findings.append({"script": script_url, "error": str(e)})

        results[name] = {
            "url": url,
            "status_code": status_code,
            "title": parser.title.strip(),
            "description": parser.meta_desc,
            "scripts_count": len(parser.scripts),
            "text_summary": text_clean,
            "bundle_findings": bundle_findings
        }
        print(f"Successfully analyzed {name}: {parser.title.strip()}")
    except Exception as e:
        print(f"Error fetching {name}: {e}")
        results[name] = {"url": url, "error": str(e)}

output_path = "research/competitor_analysis_results.json"
os.makedirs("research", exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"Complete competitor analysis saved to {output_path}")
