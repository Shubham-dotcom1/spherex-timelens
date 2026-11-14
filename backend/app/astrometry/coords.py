import math
import re
from typing import Tuple, Optional
from astropy.coordinates import SkyCoord
import astropy.units as u
from astropy.time import Time

def parse_coordinate_string(coord_str: str) -> Tuple[float, float]:
    """
    Parses arbitrary coordinate string in decimal or sexagesimal formats:
    - Decimal: "269.452, 4.693" or "269.452 4.693"
    - Sexagesimal: "17h57m48.5s +04d41m36s" or "17:57:48.5, +04:41:36"
    Returns (ra_deg, dec_deg) in ICRS.
    Raises ValueError on invalid format or out-of-bounds.
    """
    s = coord_str.strip()
    # Check if purely two decimal numbers
    parts = re.split(r'[,;\s]+', s)
    if len(parts) == 2:
        try:
            ra = float(parts[0])
            dec = float(parts[1])
            validate_ra_dec(ra, dec)
            return (ra, dec)
        except ValueError:
            pass
            
    # Try parsing via Astropy SkyCoord
    try:
        if 'h' in s or ':' in s:
            sc = SkyCoord(s, unit=(u.hourangle, u.deg), frame='icrs')
        else:
            sc = SkyCoord(s, unit=u.deg, frame='icrs')
        ra = float(sc.ra.deg)
        dec = float(sc.dec.deg)
        validate_ra_dec(ra, dec)
        return (ra, dec)
    except Exception as e:
        raise ValueError(f"Could not parse coordinate '{coord_str}': {e}")

def validate_ra_dec(ra: float, dec: float) -> None:
    """Validates that RA is [0, 360] and Dec is [-90, +90]."""
    if not (0.0 <= ra <= 360.0):
        raise ValueError(f"Right Ascension {ra} out of bounds [0.0, 360.0] degrees.")
    if not (-90.0 <= dec <= 90.0):
        raise ValueError(f"Declination {dec} out of bounds [-90.0, +90.0] degrees.")

def angular_distance_deg(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    """Calculates angular distance between two sky coordinates in degrees using Haversine formula."""
    rad = math.pi / 180.0
    d_ra = (ra2 - ra1) * rad
    d_dec = (dec2 - dec1) * rad
    a = math.sin(d_dec / 2.0)**2 + math.cos(dec1 * rad) * math.cos(dec2 * rad) * math.sin(d_ra / 2.0)**2
    c = 2.0 * math.asin(math.sqrt(min(1.0, max(0.0, a))))
    return c / rad

def propagate_proper_motion(
    ra_deg: float,
    dec_deg: float,
    pm_ra_mas_yr: float,
    pm_dec_mas_yr: float,
    ref_epoch_year: float,
    target_mjd: float,
    parallax_mas: Optional[float] = None
) -> Tuple[float, float]:
    """
    Propagates celestial coordinates from a reference epoch (e.g. J2016.0 for Gaia DR3)
    to a target SPHEREx observation epoch MJD using space motion vectors.
    """
    target_time = Time(target_mjd, format='mjd')
    target_year = float(target_time.jyear)
    dt_years = target_year - ref_epoch_year
    
    # Cosine declination correction on RA proper motion
    dec_rad = math.radians(dec_deg)
    delta_ra_deg = (pm_ra_mas_yr / (1000.0 * 3600.0 * math.cos(dec_rad))) * dt_years if math.cos(dec_rad) != 0 else 0
    delta_dec_deg = (pm_dec_mas_yr / (1000.0 * 3600.0)) * dt_years
    
    prop_ra = (ra_deg + delta_ra_deg) % 360.0
    prop_dec = max(-90.0, min(90.0, dec_deg + delta_dec_deg))
    return (prop_ra, prop_dec)
