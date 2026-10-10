"""
Unit and integration tests for Shor's algorithm quantum demonstration.
Team BHOOM (Q-Hack India 2026)
"""

import pytest
from demo.shor_demo import factor, postprocess_phases, build_shor_circuit


def test_shor_factoring_15():
    """
    Test that simulated Shor's algorithm on N=15 returns {3, 5}
    with a fixed seed and 1024 shots.
    """
    res = factor(N=15, a=7, shots=1024, seed=42)
    assert res["success"] is True
    assert set(res["factors"]) == {3, 5}
    assert res["period"] == 4
    assert res["num_qubits"] > 0
    assert len(res["counts"]) > 0


def test_base_sharing_factor_returns_immediately():
    """
    Test that providing a base 'a' sharing a non-trivial factor with N
    returns that factor immediately via classical GCD shortcut without quantum circuit.
    """
    res = factor(N=15, a=3)
    assert res["success"] is True
    assert set(res["factors"]) == {3, 5}
    assert res["period"] is None
    assert "gcd(3, 15) = 3" in res["explanation"] or "shares a non-trivial" in res["explanation"]
    assert res["num_qubits"] == 0  # no quantum circuit needed


def test_postprocessing_recovers_period_4_from_ideal_phases():
    """
    Test that the classical continued fractions post-processing recovers period 4
    and factors {3, 5} from a hand-made list of ideal phases for N=15, a=7.
    Ideal phases for r=4 are s/4: 0/4=0.0, 1/4=0.25, 2/4=0.5, 3/4=0.75.
    """
    ideal_phases = [0.25, 0.75, 0.5, 0.0]
    period, factors = postprocess_phases(ideal_phases, N=15, a=7)
    assert period == 4
    assert factors == {3, 5}


def test_shor_circuit_structure():
    """
    Verify circuit generation parameters:
    - 8 counting qubits + 4 work qubits = 12 total qubits for N=15
    """
    qc, n_count, n_work = build_shor_circuit(N=15, a=7, n_count=8)
    assert n_count == 8
    assert n_work == 4
    assert qc.num_qubits == 12
    assert qc.num_clbits == 8
