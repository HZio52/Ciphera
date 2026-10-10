"""
Configuration loader and assumptions validator for Q-Day Compass.
Team BHOOM (Q-Hack India 2026)
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml

VALID_STATUSES = {"from_paper", "derived", "illustrative"}


class ConfigValidationError(ValueError):
    """Raised when an assumptions configuration is malformed or missing required provenance."""
    pass


def get_default_assumptions_path() -> Path:
    """Returns the default path to compass/assumptions.yaml."""
    current_dir = Path(__file__).resolve().parent
    direct_path = current_dir / "assumptions.yaml"
    if direct_path.exists():
        return direct_path
    # Fallback to checking root or subdirectories
    alt_path = Path("compass/assumptions.yaml")
    if alt_path.exists():
        return alt_path.resolve()
    return direct_path


def validate_assumptions(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates that the assumptions dictionary has all required sections
    and that every assumed parameter specifies a valid 'status' and 'source'.
    Raises ConfigValidationError if any requirement is violated.
    """
    if not isinstance(config, dict):
        raise ConfigValidationError("Assumptions configuration must be a valid dictionary.")

    # Top-level required keys
    required_top_keys = ["reference_year", "verdict_rules", "families"]
    for key in required_top_keys:
        if key not in config:
            raise ConfigValidationError(f"Missing required top-level key in assumptions: '{key}'")

    if not isinstance(config["reference_year"], (int, float)):
        raise ConfigValidationError("reference_year must be a numeric year (e.g., 2026).")

    # Validate families
    families = config.get("families", {})
    if not isinstance(families, dict):
        raise ConfigValidationError("'families' section must be a dictionary.")
    for fam_key in ["quantum_vulnerable", "quantum_safe", "out_of_scope"]:
        if fam_key not in families or not isinstance(families[fam_key], list):
            raise ConfigValidationError(f"'families' must define a list for '{fam_key}'.")

    # Helper to check provenance (status and source) on a dict block
    def check_provenance(block: Any, name: str):
        if not isinstance(block, dict):
            raise ConfigValidationError(f"Assumption block '{name}' must be a dictionary.")
        if "status" not in block or not block["status"]:
            raise ConfigValidationError(f"Assumption '{name}' is missing a 'status' field.")
        if "source" not in block or not block["source"]:
            raise ConfigValidationError(f"Assumption '{name}' is missing a 'source' field.")
        status_val = str(block["status"]).strip().lower()
        if status_val not in VALID_STATUSES:
            raise ConfigValidationError(
                f"Assumption '{name}' has invalid status '{block['status']}'. "
                f"Must be one of: {sorted(list(VALID_STATUSES))}"
            )

    # If resource_anchors is present, check each anchor
    if "resource_anchors" in config:
        anchors = config["resource_anchors"]
        if not isinstance(anchors, dict):
            raise ConfigValidationError("'resource_anchors' must be a dictionary of algorithm anchors.")
        for anchor_name, anchor_data in anchors.items():
            check_provenance(anchor_data, f"resource_anchors.{anchor_name}")
            if "physical_qubits" not in anchor_data:
                raise ConfigValidationError(
                    f"Anchor '{anchor_name}' is missing required 'physical_qubits' count."
                )

    # If key_size_scaling is present, check provenance
    if "key_size_scaling" in config:
        check_provenance(config["key_size_scaling"], "key_size_scaling")

    # If hardware_trajectory is present, check provenance
    if "hardware_trajectory" in config:
        hw = config["hardware_trajectory"]
        check_provenance(hw, "hardware_trajectory")
        if "start_qubits" not in hw or "annual_growth" not in hw:
            raise ConfigValidationError(
                "'hardware_trajectory' must specify 'start_qubits' and 'annual_growth'."
            )
        growth = hw["annual_growth"]
        if not isinstance(growth, dict) or not all(k in growth for k in ["earliest", "central", "latest"]):
            raise ConfigValidationError(
                "'annual_growth' must define scenarios: 'earliest', 'central', and 'latest'."
            )

    # If per-algorithm overrides exist, validate them
    if "overrides" in config:
        if not isinstance(config["overrides"], dict):
            raise ConfigValidationError("'overrides' must be a dictionary.")
        for alg_name, override_data in config["overrides"].items():
            check_provenance(override_data, f"overrides.{alg_name}")

    return config


def load_assumptions(path: Optional[str | Path] = None) -> Dict[str, Any]:
    """
    Loads and validates the assumptions configuration from YAML file.
    """
    target_path = Path(path) if path is not None else get_default_assumptions_path()
    if not target_path.exists():
        raise FileNotFoundError(f"Assumptions configuration file not found at: {target_path}")

    with open(target_path, "r", encoding="utf-8") as f:
        try:
            data = yaml.safe_load(f)
        except yaml.YAMLError as exc:
            raise ConfigValidationError(f"YAML parsing error in {target_path}: {exc}") from exc

    return validate_assumptions(data)


def has_illustrative_assumptions(config: Dict[str, Any]) -> bool:
    """
    Recursively scans the assumptions configuration to detect if any
    entry carries status == 'illustrative'.
    """
    def _scan(node: Any) -> bool:
        if isinstance(node, dict):
            if node.get("status") == "illustrative":
                return True
            for v in node.values():
                if _scan(v):
                    return True
        elif isinstance(node, list):
            for item in node:
                if _scan(item):
                    return True
        return False

    return _scan(config)


def get_assumptions_table(config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Returns a tabular representation of all assumptions with provenance for UI display.
    """
    rows = []

    # Anchors
    for name, data in config.get("resource_anchors", {}).items():
        rows.append({
            "category": "Resource Anchor",
            "parameter": f"{name} Required Physical Qubits",
            "value": f"{data.get('physical_qubits', 0):,} qubits",
            "status": data.get("status", "unknown"),
            "source": data.get("source", "N/A"),
        })

    # Scaling
    kss = config.get("key_size_scaling", {})
    if kss:
        rows.append({
            "category": "Scaling Model",
            "parameter": "Key Size Scaling Mode",
            "value": str(kss.get("mode", "linear")),
            "status": kss.get("status", "unknown"),
            "source": kss.get("source", "N/A"),
        })

    # Hardware trajectory
    hw = config.get("hardware_trajectory", {})
    if hw:
        rows.append({
            "category": "Hardware Trajectory",
            "parameter": "Starting Physical Qubits (at ref year)",
            "value": f"{hw.get('start_qubits', 0):,} qubits",
            "status": hw.get("status", "unknown"),
            "source": hw.get("source", "N/A"),
        })
        growth = hw.get("annual_growth", {})
        for scenario, rate in growth.items():
            rows.append({
                "category": "Hardware Trajectory",
                "parameter": f"Annual Growth ({scenario})",
                "value": f"{rate}x per year",
                "status": hw.get("status", "unknown"),
                "source": hw.get("source", "N/A"),
            })

    # Overrides if any
    for name, data in config.get("overrides", {}).items():
        rows.append({
            "category": "Algorithm Override",
            "parameter": f"{name} Direct Break Years",
            "value": str(data.get("break_year", {})),
            "status": data.get("status", "unknown"),
            "source": data.get("source", "N/A"),
        })

    return rows
