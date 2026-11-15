import urllib.request
import re
import json

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}

def fetch_url(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode('utf-8', errors='ignore')

# 1. Inspect blackhole motion viewer
print("Inspecting blackhole motion viewer...")
bh_html = fetch_url("https://blackhole-spherex.vercel.app/")
# Find script
bh_scripts = re.findall(r'src="([^"]+\.js)"', bh_html)
bh_details = {}
if bh_scripts:
    bh_js_url = "https://blackhole-spherex.vercel.app" + bh_scripts[0]
    bh_js = fetch_url(bh_js_url)
    # Search for functions, UI labels, features
    labels = re.findall(r'["\']([A-Z][a-zA-Z0-9\s\-_:]{3,40})["\']', bh_js)
    bh_details["labels"] = list(set([l for l in labels if any(k in l.lower() for k in ["blink", "epoch", "motion", "target", "star", "irsa", "fits", "fps", "play"])]))[:30]

# 2. Inspect spherex photometry
print("Inspecting spherex photometry...")
sp_html = fetch_url("https://spherex-photometry.vercel.app/?ra=269.4520&dec=4.6930&fov=0.5&epoch=1&band=45&mode=blink")
sp_scripts = re.findall(r'src="([^"]+\.js)"', sp_html)
sp_details = {}
if sp_scripts:
    sp_js_url = "https://spherex-photometry.vercel.app" + sp_scripts[0]
    sp_js = fetch_url(sp_js_url)
    labels = re.findall(r'["\']([A-Z][a-zA-Z0-9\s\-_:]{3,40})["\']', sp_js)
    sp_details["labels"] = list(set([l for l in labels if any(k in l.lower() for k in ["photometry", "blink", "gaia", "aperture", "mag", "flux", "light", "curve", "sed"])]))[:30]

# 3. Inspect skytrace
print("Inspecting skytrace...")
st_html = fetch_url("https://skytrace-five.vercel.app/")
# Look for navigation links or routes
st_routes = list(set(re.findall(r'href="(/[^"]*)"', st_html)))

# 4. Inspect driftnet
print("Inspecting driftnet...")
dn_html = fetch_url("https://spherex-planet-x.vercel.app/")
dn_routes = list(set(re.findall(r'href="(/[^"]*)"', dn_html)))

detail_results = {
    "blackhole_motion_viewer": bh_details,
    "spherex_photometry": sp_details,
    "skytrace_routes": st_routes,
    "driftnet_routes": dn_routes
}

with open("research/competitor_deep_dive.json", "w", encoding="utf-8") as f:
    json.dump(detail_results, f, indent=2)

print("Saved deep dive to research/competitor_deep_dive.json")
