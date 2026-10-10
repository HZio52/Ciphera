"""
Unit and integration tests for Q-Day Compass Risk Engine.
Team BHOOM (Q-Hack India 2026)
"""

import pytest
from compass.config import (
    ConfigValidationError,
    load_assumptions,
    validate_assumptions,
)
from compass.engine import (
    break_year,
    compute_break_years,
    evaluate_asset,
    parse_algorithm,
    rank_inventory,
    compute_action_deadline,
    compute_margin_series,
)


@pytest.fixture
def test_fixture_config():
    """
    Test fixture assumptions configuration with direct break years
    (reference year 2026; earliest 2034, central 2038, latest 2046)
    so tests do not depend on the illustrative trajectory.
    """
    return {
        "reference_year": 2026,
        "verdict_rules": {
            "red_if_exceeds": "central",
            "yellow_if_exceeds": "earliest",
        },
        "families": {
            "quantum_vulnerable": ["RSA", "DH", "DSA", "ECC", "ECDH", "ECDSA", "ED25519"],
            "quantum_safe": ["ML-KEM", "ML-DSA", "SLH-DSA", "KYBER", "DILITHIUM"],
            "out_of_scope": ["AES", "SHA", "SHA2", "SHA3", "CHACHA20"],
        },
        "overrides": {
            "RSA-2048": {
                "break_year": {"earliest": 2034.0, "central": 2038.0, "latest": 2046.0},
                "status": "from_paper",
                "source": "Test Fixture direct break years",
            },
            "ECC-256": {
                "break_year": {"earliest": 2034.0, "central": 2038.0, "latest": 2046.0},
                "status": "from_paper",
                "source": "Test Fixture direct break years",
            },
            "ECDSA-P256": {
                "break_year": {"earliest": 2034.0, "central": 2038.0, "latest": 2046.0},
                "status": "from_paper",
                "source": "Test Fixture direct break years",
            },
            "RSA-3072": {
                "break_year": {"earliest": 2036.0, "central": 2040.0, "latest": 2049.0},
                "status": "derived",
                "source": "Test Fixture direct break years",
            },
        },
    }


def test_1_verdicts_at_reference_year_with_fixture(test_fixture_config):
    """
    Test 1: Verdicts at T=2026 with the fixture:
    - patient archive (RSA-2048, 25+3=28) is RED
    - HR records (ECC-256, 7+2=9) is YELLOW
    - session keys (0.5+2=2.5) is GREEN
    - ML-KEM-768 is GREEN (quantum-safe)
    - AES-256 is GRAY
    """
    cfg = test_fixture_config
    t = 2026.0

    # 1. Patient archive: 25 + 3 = 28. Central Z_rem = 2038 - 2026 = 12. 28 > 12 -> RED
    patient = evaluate_asset(
        {"asset_name": "Patient records archive", "algorithm": "RSA-2048", "data_shelf_life_years": 25, "migration_time_years": 3},
        assessment_year=t,
        config=cfg,
    )
    assert patient["verdict_code"] == "RED"
    assert "RED" in patient["verdict"]

    # 2. HR records: 7 + 2 = 9. Earliest Z_rem = 8, Central Z_rem = 12. 9 > 8 and 9 <= 12 -> YELLOW
    hr = evaluate_asset(
        {"asset_name": "Internal HR records", "algorithm": "ECC-256", "data_shelf_life_years": 7, "migration_time_years": 2},
        assessment_year=t,
        config=cfg,
    )
    assert hr["verdict_code"] == "YELLOW"
    assert "YELLOW" in hr["verdict"]

    # 3. Session keys: 0.5 + 2 = 2.5. 2.5 <= 8 -> GREEN
    session = evaluate_asset(
        {"asset_name": "Short-lived session keys", "algorithm": "ECC-256", "data_shelf_life_years": 0.5, "migration_time_years": 2},
        assessment_year=t,
        config=cfg,
    )
    assert session["verdict_code"] == "GREEN"
    assert "GREEN" in session["verdict"]

    # 4. ML-KEM-768 -> GREEN (quantum-safe)
    pqc = evaluate_asset(
        {"asset_name": "New service", "algorithm": "ML-KEM-768", "data_shelf_life_years": 0, "migration_time_years": 0},
        assessment_year=t,
        config=cfg,
    )
    assert "quantum-safe" in pqc["verdict"].lower()
    assert pqc["verdict_code"] == "GREEN"

    # 5. AES-256 -> GRAY
    sym = evaluate_asset(
        {"asset_name": "Disk encryption", "algorithm": "AES-256", "data_shelf_life_years": 10, "migration_time_years": 1},
        assessment_year=t,
        config=cfg,
    )
    assert "GRAY" in sym["verdict"]
    assert sym["verdict_code"] == "GRAY"


def test_2_boundary_behaviour(test_fixture_config):
    """
    Test 2: Boundary behaviour:
    X + Y exactly equal to central remaining time (12 years) is not RED; just above is RED.
    """
    cfg = test_fixture_config
    t = 2026.0  # Central break year is 2038, so central Z_remaining = 12.0

    # Exactly equal: 10 + 2 = 12.0
    asset_exact = evaluate_asset(
        {"asset_name": "Exact Boundary", "algorithm": "RSA-2048", "data_shelf_life_years": 10.0, "migration_time_years": 2.0},
        assessment_year=t,
        config=cfg,
    )
    assert asset_exact["verdict_code"] != "RED", "X+Y == Z_central must NOT be RED"
    assert asset_exact["verdict_code"] == "YELLOW"

    # Just above: 10 + 2.01 = 12.01
    asset_above = evaluate_asset(
        {"asset_name": "Just Above", "algorithm": "RSA-2048", "data_shelf_life_years": 10.0, "migration_time_years": 2.01},
        assessment_year=t,
        config=cfg,
    )
    assert asset_above["verdict_code"] == "RED", "X+Y > Z_central must be RED"


def test_3_time_slider_monotonic(test_fixture_config):
    """
    Test 3: Time slider monotonic:
    For every asset, as T increases, the verdict never moves from RED back to YELLOW or GREEN.
    """
    cfg = test_fixture_config
    test_assets = [
        {"asset_name": "A1", "algorithm": "RSA-2048", "data_shelf_life_years": 5, "migration_time_years": 2},
        {"asset_name": "A2", "algorithm": "ECC-256", "data_shelf_life_years": 7, "migration_time_years": 2},
        {"asset_name": "A3", "algorithm": "RSA-2048", "data_shelf_life_years": 15, "migration_time_years": 4},
    ]

    for asset in test_assets:
        became_red = False
        for t in range(2026, 2045):
            res = evaluate_asset(asset, assessment_year=float(t), config=cfg)
            if res["verdict_code"] == "RED":
                became_red = True
            elif became_red:
                pytest.fail(f"Asset {asset['asset_name']} moved from RED to {res['verdict_code']} at year {t}")


def test_4_algorithm_parsing_and_unknown_handling(test_fixture_config):
    """
    Test 4: Parsing:
    RSA-2048, ECC-256, ECDSA-P256, ML-KEM-768, AES-256 parse correctly;
    an unknown string returns GRAY without raising.
    """
    cfg = test_fixture_config

    p_rsa = parse_algorithm("RSA-2048", cfg)
    assert p_rsa["family"] == "RSA"
    assert p_rsa["bits"] == 2048
    assert p_rsa["category"] == "quantum_vulnerable"

    p_ecc = parse_algorithm("ECC-256", cfg)
    assert p_ecc["family"] == "ECC"
    assert p_ecc["bits"] == 256
    assert p_ecc["category"] == "quantum_vulnerable"

    p_ecdsa = parse_algorithm("ECDSA-P256", cfg)
    assert p_ecdsa["family"] == "ECDSA"
    assert p_ecdsa["bits"] == 256
    assert p_ecdsa["category"] == "quantum_vulnerable"

    p_pqc = parse_algorithm("ML-KEM-768", cfg)
    assert p_pqc["family"] == "ML-KEM"
    assert p_pqc["bits"] == 768
    assert p_pqc["category"] == "quantum_safe"

    p_aes = parse_algorithm("AES-256", cfg)
    assert p_aes["family"] == "AES"
    assert p_aes["bits"] == 256
    assert p_aes["category"] == "out_of_scope"

    # Unknown algorithm should not raise, must evaluate to GRAY
    unknown_asset = evaluate_asset(
        {"asset_name": "Experimental", "algorithm": "MAGIC-CRYPTO-999", "data_shelf_life_years": 5, "migration_time_years": 2},
        assessment_year=2026,
        config=cfg,
    )
    assert unknown_asset["verdict_code"] == "GRAY"
    assert "algorithm not recognised" in unknown_asset["reasoning"]


def test_5_derived_break_years():
    """
    Test 5: Derived break years with default YAML:
    break_year for RSA-2048 is about 8 / 12 / 20 years after 2026 (earliest / central / latest),
    and ECC-256 is earlier than RSA-2048 in every scenario.
    """
    cfg = load_assumptions()
    rsa_by = compute_break_years("RSA-2048", cfg)
    ecc_by = compute_break_years("ECC-256", cfg)

    # Check RSA-2048: ~8, ~12, ~20 years out from 2026
    ref_year = 2026
    earliest_delta = rsa_by["earliest"] - ref_year
    central_delta = rsa_by["central"] - ref_year
    latest_delta = rsa_by["latest"] - ref_year

    assert 7.5 <= earliest_delta <= 8.5, f"Earliest delta expected ~8, got {earliest_delta}"
    assert 11.5 <= central_delta <= 12.5, f"Central delta expected ~12, got {central_delta}"
    assert 19.5 <= latest_delta <= 20.5, f"Latest delta expected ~20, got {latest_delta}"

    # Check ECC-256 is strictly earlier than RSA-2048 in every scenario
    assert ecc_by["earliest"] < rsa_by["earliest"], "ECC-256 earliest must be earlier than RSA-2048"
    assert ecc_by["central"] < rsa_by["central"], "ECC-256 central must be earlier than RSA-2048"
    assert ecc_by["latest"] < rsa_by["latest"], "ECC-256 latest must be earlier than RSA-2048"

    # Verify convenience helper works
    assert break_year("RSA-2048", "central", cfg) == rsa_by["central"]


def test_6_yaml_validation_raises_error_on_missing_provenance():
    """
    Test 6: YAML validation:
    An entry missing status or source raises a clear error.
    """
    # Missing source in resource anchor
    bad_config = {
        "reference_year": 2026,
        "verdict_rules": {"red_if_exceeds": "central", "yellow_if_exceeds": "earliest"},
        "families": {"quantum_vulnerable": ["RSA"], "quantum_safe": [], "out_of_scope": []},
        "resource_anchors": {
            "RSA-2048": {
                "physical_qubits": 1000000,
                "status": "from_paper",
                # "source" missing!
            }
        },
    }
    with pytest.raises(ConfigValidationError) as exc_info:
        validate_assumptions(bad_config)
    assert "source" in str(exc_info.value).lower()

    # Missing status
    bad_config_2 = {
        "reference_year": 2026,
        "verdict_rules": {"red_if_exceeds": "central", "yellow_if_exceeds": "earliest"},
        "families": {"quantum_vulnerable": ["RSA"], "quantum_safe": [], "out_of_scope": []},
        "hardware_trajectory": {
            "start_qubits": 1000,
            "annual_growth": {"earliest": 2.37, "central": 1.78, "latest": 1.41},
            "source": "IBM roadmap",
            # "status" missing!
        },
    }
    with pytest.raises(ConfigValidationError) as exc_info_2:
        validate_assumptions(bad_config_2)
    assert "status" in str(exc_info_2.value).lower()


def test_7_ranking_order(test_fixture_config):
    """
    Test 7: Ranking order:
    All RED before YELLOW before GREEN; larger margin first within a colour.
    """
    cfg = test_fixture_config
    inventory = [
        {"asset_name": "G1", "algorithm": "RSA-2048", "data_shelf_life_years": 1, "migration_time_years": 1},  # GREEN, margin 2 - 12 = -10
        {"asset_name": "R1_small", "algorithm": "RSA-2048", "data_shelf_life_years": 10, "migration_time_years": 4},  # RED, margin 14 - 12 = +2
        {"asset_name": "R2_large", "algorithm": "RSA-2048", "data_shelf_life_years": 20, "migration_time_years": 5},  # RED, margin 25 - 12 = +13
        {"asset_name": "Y1", "algorithm": "RSA-2048", "data_shelf_life_years": 7, "migration_time_years": 2},  # YELLOW, margin 9 - 12 = -3
    ]

    ranked = rank_inventory(inventory, assessment_year=2026, config=cfg)
    names_in_order = [item["asset_name"] for item in ranked]

    # R2_large (+13 margin) should be rank 1
    # R1_small (+2 margin) should be rank 2
    # Y1 should be rank 3
    # G1 should be rank 4
    assert names_in_order == ["R2_large", "R1_small", "Y1", "G1"]
    assert ranked[0]["rank"] == 1
    assert ranked[1]["rank"] == 2
    assert ranked[2]["rank"] == 3
    assert ranked[3]["rank"] == 4


def test_8_margin_over_time_and_action_deadline(test_fixture_config):
    """
    Test 8: Margin over time and action deadline:
    - action_deadline equals break_year - (X+Y)
    - each margin series is non-increasing over T
    - margin_s(T) < 0 exactly when the existing verdict logic says X+Y > z_remaining_s(T)
    """
    cfg = test_fixture_config
    test_assets = [
        {"asset_name": "Patient records archive", "algorithm": "RSA-2048", "data_shelf_life_years": 25, "migration_time_years": 3},
        {"asset_name": "Internal HR records", "algorithm": "ECC-256", "data_shelf_life_years": 7, "migration_time_years": 2},
        {"asset_name": "Short-lived session keys", "algorithm": "ECC-256", "data_shelf_life_years": 0.5, "migration_time_years": 2},
        {"asset_name": "Customer database backups", "algorithm": "RSA-3072", "data_shelf_life_years": 15, "migration_time_years": 4},
        {"asset_name": "Software update signing key", "algorithm": "ECDSA-P256", "data_shelf_life_years": 10, "migration_time_years": 3},
    ]

    for asset in test_assets:
        x = asset["data_shelf_life_years"]
        y = asset["migration_time_years"]
        needed = x + y

        by_dict = compute_break_years(asset["algorithm"], cfg)
        series = compute_margin_series(asset, start_year=2026, end_year=2041, config=cfg)

        for scenario in ["earliest", "central", "latest"]:
            by = by_dict[scenario]
            # 1. action_deadline equals break_year - (X+Y)
            expected_deadline = by - needed
            actual_deadline = series["action_deadlines"][scenario]
            assert actual_deadline == expected_deadline, (
                f"Action deadline mismatch for {asset['asset_name']} {scenario}: {actual_deadline} != {expected_deadline}"
            )
            assert compute_action_deadline(by, needed) == expected_deadline

            # 2. Each margin series is non-increasing over T
            margin_values = series["margins"][scenario]
            for i in range(len(margin_values) - 1):
                assert margin_values[i] >= margin_values[i + 1], (
                    f"Margin series not non-increasing for {asset['asset_name']} {scenario} at index {i}: "
                    f"{margin_values[i]} < {margin_values[i + 1]}"
                )

            # 3. margin_s(T) < 0 exactly when the existing verdict logic says X+Y > z_remaining_s(T)
            for idx, year in enumerate(series["years"]):
                ev = evaluate_asset(asset, assessment_year=float(year), config=cfg)
                z_rem = ev[f"z_remaining_{scenario}"]
                m_val = margin_values[idx]

                # In verdict logic: X+Y > z_remaining_s(T) means deficit
                verdict_exceeds = (needed > z_rem)
                margin_is_negative = (m_val < 0)

                assert margin_is_negative == verdict_exceeds, (
                    f"Mismatch at year {year} for {asset['asset_name']} {scenario}: "
                    f"margin_is_negative={margin_is_negative}, verdict_exceeds={verdict_exceeds}"
                )

