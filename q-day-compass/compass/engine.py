"""
Q-Day Compass - Risk Engine
Team BHOOM (Q-Hack India 2026)

Implements algorithm parsing, resource scaling, break year derivation,
Mosca's inequality evaluation, ranking, and explainable plain-English reasoning.
"""

import math
import re
from typing import Any, Dict, List, Optional, Tuple, Union
import pandas as pd

from .config import load_assumptions


def parse_algorithm(alg_name: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Parses algorithm string into canonical family, key size / bits, and vulnerability category.
    Examples: 'RSA-2048', 'ECC-256', 'ECDSA-P256', 'ML-KEM-768', 'AES-256'.
    Returns dictionary with:
      - name: normalized algorithm name
      - family: uppercase family (e.g. 'RSA', 'ECC', 'ECDSA', 'ML-KEM', 'AES')
      - bits: integer bit length or parameter size
      - category: 'quantum_vulnerable' | 'quantum_safe' | 'out_of_scope' | 'unknown'
    """
    if config is None:
        try:
            config = load_assumptions()
        except Exception:
            config = {}

    families_cfg = config.get("families", {})
    vulnerable_list = [f.upper() for f in families_cfg.get("quantum_vulnerable", [
        "RSA", "DH", "DSA", "ECC", "ECDH", "ECDSA", "ED25519"
    ])]
    safe_list = [f.upper() for f in families_cfg.get("quantum_safe", [
        "ML-KEM", "ML-DSA", "SLH-DSA", "KYBER", "DILITHIUM"
    ])]
    out_of_scope_list = [f.upper() for f in families_cfg.get("out_of_scope", [
        "AES", "SHA", "SHA2", "SHA3", "CHACHA20"
    ])]

    raw = str(alg_name).strip()
    norm = raw.upper()

    # Match patterns like RSA-2048, ECC-256, ECDSA-P256, ML-KEM-768, AES-256, SHA-256, ED25519
    match = re.match(r"^([A-Z0-9_-]+?)(?:[-_]P?(\d+))?$", norm)
    prefix = norm
    bits = 256  # default fallback bits if not specified

    if match:
        matched_prefix = match.group(1)
        matched_bits = match.group(2)
        if matched_bits:
            bits = int(matched_bits)
            prefix = matched_prefix
        else:
            # Handle special cases without hyphen like ED25519
            if "25519" in norm:
                prefix = "ED25519"
                bits = 256

    # Normalize family prefix
    family = prefix
    for known in ["ML-KEM", "ML-DSA", "SLH-DSA", "ECDSA", "ECDH", "ED25519", "KYBER", "DILITHIUM", "CHACHA20", "SHA2", "SHA3", "RSA", "ECC", "AES", "SHA", "DH", "DSA"]:
        if norm.startswith(known):
            family = known
            break

    # Determine vulnerability category
    category = "unknown"
    if family in vulnerable_list:
        category = "quantum_vulnerable"
    elif family in safe_list:
        category = "quantum_safe"
    elif family in out_of_scope_list:
        category = "out_of_scope"
    else:
        # Check substring containment
        for safe_item in safe_list:
            if safe_item in norm:
                category = "quantum_safe"
                family = safe_item
                break
        if category == "unknown":
            for oos_item in out_of_scope_list:
                if oos_item in norm:
                    category = "out_of_scope"
                    family = oos_item
                    break
        if category == "unknown":
            for vul_item in vulnerable_list:
                if vul_item in norm:
                    category = "quantum_vulnerable"
                    family = vul_item
                    break

    return {
        "raw": raw,
        "name": norm,
        "family": family,
        "bits": bits,
        "category": category,
    }


def derive_required_qubits(parsed_or_name: Union[str, Dict[str, Any]], config: Dict[str, Any]) -> Optional[int]:
    """
    Derives required physical qubits for the algorithm based on assumptions.yaml anchors
    and linear key-size scaling.
    """
    if isinstance(parsed_or_name, str):
        parsed = parse_algorithm(parsed_or_name, config)
    else:
        parsed = parsed_or_name

    if parsed["category"] != "quantum_vulnerable":
        return None

    anchors = config.get("resource_anchors", {})
    family = parsed["family"]
    bits = parsed["bits"]

    # Select appropriate anchor
    if family in {"RSA", "DH", "DSA"}:
        anchor_data = anchors.get("RSA-2048", {"physical_qubits": 1000000})
        anchor_bits = 2048
    elif family in {"ECC", "ECDSA", "ECDH", "ED25519"}:
        anchor_data = anchors.get("ECC-256", {"physical_qubits": 500000})
        anchor_bits = 256
    else:
        anchor_data = anchors.get("RSA-2048", {"physical_qubits": 1000000})
        anchor_bits = 2048

    base_qubits = anchor_data.get("physical_qubits", 1000000)

    # Linear scaling by key length
    required = int(round(base_qubits * (bits / anchor_bits)))
    return max(1, required)


def compute_break_years(algorithm: str, config: Dict[str, Any]) -> Dict[str, Optional[float]]:
    """
    Computes break years across earliest, central, and latest scenarios.
    Accepts per-algorithm direct overrides if present in config.
    Returns: {'earliest': float | None, 'central': float | None, 'latest': float | None}
    """
    parsed = parse_algorithm(algorithm, config)

    # 1. Check for explicit overrides in config
    overrides = config.get("overrides", {})
    # Match by exact name, normalized name, or family
    for candidate_key in [parsed["raw"], parsed["name"], f"{parsed['family']}-{parsed['bits']}", parsed["family"]]:
        if candidate_key in overrides:
            override_entry = overrides[candidate_key]
            if "break_year" in override_entry and isinstance(override_entry["break_year"], dict):
                by = override_entry["break_year"]
                return {
                    "earliest": float(by.get("earliest", 0.0)),
                    "central": float(by.get("central", 0.0)),
                    "latest": float(by.get("latest", 0.0)),
                }

    if parsed["category"] != "quantum_vulnerable":
        return {"earliest": None, "central": None, "latest": None}

    ref_year = float(config.get("reference_year", 2026))
    req_qubits = derive_required_qubits(parsed, config)
    hw = config.get("hardware_trajectory", {})
    start_qubits = float(hw.get("start_qubits", 1000))
    annual_growth = hw.get("annual_growth", {"earliest": 2.37, "central": 1.78, "latest": 1.41})

    ratio = max(1.0, req_qubits / start_qubits)
    ln_ratio = math.log(ratio)

    break_years: Dict[str, Optional[float]] = {}
    for scenario in ["earliest", "central", "latest"]:
        growth = float(annual_growth.get(scenario, 1.5))
        if growth <= 1.0:
            break_years[scenario] = None
        else:
            break_years[scenario] = ref_year + (ln_ratio / math.log(growth))

    return break_years


def break_year(
    algorithm: str,
    scenario: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
) -> Union[Optional[float], Dict[str, Optional[float]]]:
    """
    Convenience function matching spec:
    - break_year(alg, scenario, config) returns float
    - break_year(alg, config=config) returns dict of all scenarios
    """
    if config is None:
        config = load_assumptions()
    years = compute_break_years(algorithm, config)
    if scenario is not None:
        return years.get(scenario)
    return years


def evaluate_asset(
    asset: Dict[str, Any],
    assessment_year: float = 2026.0,
    config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Evaluates Mosca's inequality for a single cryptographic asset at year T:
    X = data_shelf_life_years
    Y = migration_time_years
    Z_remaining = max(0, break_year - assessment_year)
    """
    if config is None:
        config = load_assumptions()

    asset_name = str(asset.get("asset_name", "Unnamed Asset"))
    raw_alg = str(asset.get("algorithm", ""))
    notes = str(asset.get("notes", ""))

    try:
        x = float(asset.get("data_shelf_life_years", 0.0))
    except (ValueError, TypeError):
        x = 0.0
    x = max(0.0, x)

    try:
        y = float(asset.get("migration_time_years", 0.0))
    except (ValueError, TypeError):
        y = 0.0
    y = max(0.0, y)

    xy = x + y

    parsed = parse_algorithm(raw_alg, config)
    category = parsed["category"]
    by_dict = compute_break_years(raw_alg, config)

    # Compute Z_remaining for each scenario
    z_rem: Dict[str, Optional[float]] = {}
    for sc in ["earliest", "central", "latest"]:
        yr = by_dict.get(sc)
        if yr is not None:
            z_rem[sc] = max(0.0, yr - assessment_year)
        else:
            z_rem[sc] = None

    z_central = z_rem["central"]
    z_earliest = z_rem["earliest"]
    z_latest = z_rem["latest"]

    # Verdict assignment
    if category == "unknown":
        verdict = "GRAY (out of scope)"
        verdict_code = "GRAY"
        verdict_label = "GRAY"
        reasoning = "algorithm not recognised; add it to assumptions.yaml"
        margin = -9999.0
        priority_group = 5

    elif category == "quantum_safe":
        verdict = "GREEN (quantum-safe)"
        verdict_code = "GREEN"
        verdict_label = "GREEN (quantum-safe)"
        reasoning = f"{raw_alg} is a post-quantum algorithm; immune to Shor's algorithm attacks."
        margin = -999.0
        priority_group = 4

    elif category == "out_of_scope":
        verdict = "GRAY (out of scope)"
        verdict_code = "GRAY"
        verdict_label = "GRAY (out of scope)"
        reasoning = f"{raw_alg} is symmetric or hash; not broken by Shor's algorithm (out of scope in v1)."
        margin = -999.0
        priority_group = 5

    else:
        # Quantum vulnerable
        assert z_central is not None and z_earliest is not None and z_latest is not None
        margin = xy - z_central

        # Mosca's inequality verdict logic:
        # RED: X + Y > Z_remaining(central)
        # YELLOW: X + Y > Z_remaining(earliest) and not RED
        # GREEN: otherwise
        if xy > z_central:
            verdict = "RED"
            verdict_code = "RED"
            verdict_label = "RED"
            priority_group = 1
            if xy > z_latest:
                reasoning = (
                    f"{x:g} + {y:g} = {xy:g} years needed; central estimate leaves {z_central:.1f} years "
                    f"(latest leaves {z_latest:.1f} years). Late even under the latest estimate."
                )
            else:
                reasoning = (
                    f"{x:g} + {y:g} = {xy:g} years needed; central estimate leaves {z_central:.1f} years "
                    f"(earliest leaves {z_earliest:.1f} years). Late under central estimate."
                )
        elif xy > z_earliest:
            verdict = "YELLOW"
            verdict_code = "YELLOW"
            verdict_label = "YELLOW"
            priority_group = 2
            reasoning = (
                f"{x:g} + {y:g} = {xy:g} years needed; central estimate leaves {z_central:.1f} years, "
                f"but earliest leaves only {z_earliest:.1f} years. At risk under aggressive quantum timelines."
            )
        else:
            verdict = "GREEN"
            verdict_code = "GREEN"
            verdict_label = "GREEN"
            priority_group = 3
            reasoning = (
                f"{x:g} + {y:g} = {xy:g} years needed; earliest quantum estimate leaves {z_earliest:.1f} years. "
                f"Safe under all modeled scenarios."
            )

    return {
        "asset_name": asset_name,
        "algorithm": raw_alg,
        "algorithm_parsed": parsed,
        "data_shelf_life_years": x,
        "migration_time_years": y,
        "x_plus_y": xy,
        "break_years": by_dict,
        "z_remaining_earliest": z_earliest,
        "z_remaining_central": z_central,
        "z_remaining_latest": z_latest,
        "margin": margin,
        "priority_group": priority_group,
        "verdict": verdict,
        "verdict_code": verdict_code,
        "verdict_label": verdict_label,
        "reasoning": reasoning,
        "notes": notes,
        "assessment_year": assessment_year,
    }


def rank_inventory(
    inventory: Union[List[Dict[str, Any]], pd.DataFrame],
    assessment_year: float = 2026.0,
    config: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Evaluates and ranks an inventory of cryptographic assets:
    - RED first, then YELLOW, then GREEN, then GREEN (quantum-safe), then GRAY.
    - Within a colour group, ranks by margin (X + Y - Z_remaining(central)) descending.
    - Ties broken by larger X (data_shelf_life_years).
    """
    if config is None:
        config = load_assumptions()

    if isinstance(inventory, pd.DataFrame):
        records = inventory.to_dict(orient="records")
    else:
        records = list(inventory)

    evaluated: List[Dict[str, Any]] = []
    for row in records:
        ev = evaluate_asset(row, assessment_year=assessment_year, config=config)
        evaluated.append(ev)

    # Sort key:
    # 1. priority_group (1: RED, 2: YELLOW, 3: GREEN, 4: GREEN QS, 5: GRAY)
    # 2. -margin (largest margin first)
    # 3. -X (larger X first)
    evaluated.sort(key=lambda item: (
        item["priority_group"],
        -item["margin"],
        -item["data_shelf_life_years"],
    ))

    # Assign 1-indexed ranks
    for idx, item in enumerate(evaluated, start=1):
        item["rank"] = idx

    return evaluated
