"""
Q-Day Compass - Shor's Algorithm Simulation Demo
Team BHOOM (Q-Hack India 2026)

Demonstrates Shor's order-finding mechanism on small composite integers (15 and 21)
using a genuine quantum circuit simulated with Qiskit and Qiskit Aer.

Mathematical Mechanism:
1. Choose coprime base 'a' such that gcd(a, N) == 1.
2. Order Finding: Quantum Phase Estimation finds period 'r' such that a^r = 1 (mod N).
   - Counting register puts 2^n states into equal superposition.
   - Controlled modular multiplication gates entangle counting & work registers.
   - Inverse QFT transforms the periodic modular phase into measurable eigenvalues.
3. Post-Processing: Continued fractions find denominator candidate 'r'.
4. If 'r' is even and a^(r/2) != -1 (mod N), factors are gcd(a^(r/2) +/- 1, N).
"""

import fractions
import math
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np

import qiskit
from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister, transpile
from qiskit.circuit.library import QFTGate, UnitaryGate
from qiskit_aer import AerSimulator


def build_modular_multiplication_unitary(a_pow: int, N: int, n_work: int) -> UnitaryGate:
    """
    Constructs a controlled modular multiplication unitary U|x> = |(x * a_pow) mod N>.
    
    Why permutation unitary?
    Because gcd(a, N) == 1, the mapping x -> (x * a_pow) mod N is a bijective permutation
    on the numbers 0..N-1. For work register states >= N (unused states in the 2^n_work Hilbert space),
    we leave x unchanged (x -> x) to preserve unitarity and orthogonality.
    """
    dim = 2 ** n_work
    matrix = np.zeros((dim, dim), dtype=complex)
    for x in range(dim):
        if x < N:
            target = (x * a_pow) % N
        else:
            target = x
        matrix[target, x] = 1.0
    return UnitaryGate(matrix, label=f"x{a_pow}mod{N}")


def build_shor_circuit(N: int, a: int, n_count: int = 8) -> Tuple[QuantumCircuit, int, int]:
    """
    Builds the full quantum circuit for period finding in Shor's algorithm.
    Returns: (circuit, n_count_qubits, n_work_qubits)
    """
    n_work = int(math.ceil(math.log2(N)))

    c_reg = QuantumRegister(n_count, name="count")
    w_reg = QuantumRegister(n_work, name="work")
    c_meas = ClassicalRegister(n_count, name="meas")
    qc = QuantumCircuit(c_reg, w_reg, c_meas)

    # 1. Initialize work register to state |1> (since a^0 mod N = 1)
    qc.x(w_reg[0])

    # 2. Put counting register into uniform superposition via Hadamard gates
    qc.h(c_reg)

    # 3. Apply controlled modular multiplications for each counting qubit k:
    # Qubit k applies modular multiplication by a^(2^k) mod N
    for k in range(n_count):
        power = pow(a, 2 ** k, N)
        u_gate = build_modular_multiplication_unitary(power, N, n_work)
        cu_gate = u_gate.control(1)
        qc.append(cu_gate, [c_reg[k]] + list(w_reg))

    # 4. Inverse Quantum Fourier Transform on the counting register
    # This extracts the phase s/r from the periodic state
    iqft = QFTGate(n_count).inverse()
    qc.append(iqft, c_reg)

    # 5. Measure counting qubits
    qc.measure(c_reg, c_meas)

    return qc, n_count, n_work


def postprocess_phases(phases: List[float], N: int, a: int) -> Tuple[Optional[int], Set[int]]:
    """
    Classically post-processes measured phases (fractions of 2^n_count)
    using continued fraction expansion (limit_denominator) to extract period r
    and deduce prime factors of N.
    """
    found_factors: Set[int] = set()
    best_period: Optional[int] = None

    for phase in phases:
        if phase == 0.0:
            continue
        frac = fractions.Fraction(phase).limit_denominator(N)
        candidate_r = frac.denominator
        if candidate_r <= 0:
            continue

        # Check if candidate_r is a valid period: a^r mod N == 1
        if pow(a, candidate_r, N) == 1:
            best_period = candidate_r
            if candidate_r % 2 == 0:
                half_pow = pow(a, candidate_r // 2, N)
                if half_pow != N - 1:
                    f1 = math.gcd(half_pow - 1, N)
                    f2 = math.gcd(half_pow + 1, N)
                    for factor_candidate in [f1, f2]:
                        if 1 < factor_candidate < N:
                            found_factors.add(factor_candidate)
                            # Add complementary factor
                            other = N // factor_candidate
                            if 1 < other < N:
                                found_factors.add(other)
            if len(found_factors) >= 2:
                break

    return best_period, found_factors


def factor(
    N: int,
    a: Optional[int] = None,
    shots: int = 1024,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Factors integer N using simulated Shor's algorithm on Qiskit Aer.
    Supported targets: N = 15 (factors 3, 5) and N = 21 (factors 3, 7).
    """
    if N <= 3:
        raise ValueError("N must be an odd composite integer >= 4.")
    if N % 2 == 0:
        return {
            "N": N,
            "a": 2,
            "success": True,
            "factors": [2, N // 2],
            "period": None,
            "counts": {},
            "num_qubits": 0,
            "circuit_depth": 0,
            "circuit_diagram": "Trivial: N is even.",
            "explanation": f"{N} is even; trivial factor 2 found classically.",
        }

    # Default coprime bases
    if a is None:
        if N == 15:
            a = 7
        elif N == 21:
            a = 2
        else:
            # Pick smallest coprime base > 1
            for candidate in range(2, N):
                if math.gcd(candidate, N) == 1:
                    a = candidate
                    break
            if a is None:
                a = 2

    # Check if picked base already shares a non-trivial factor with N
    common_gcd = math.gcd(a, N)
    if 1 < common_gcd < N:
        other_factor = N // common_gcd
        return {
            "N": N,
            "a": a,
            "success": True,
            "factors": sorted(list({common_gcd, other_factor})),
            "period": None,
            "counts": {},
            "num_qubits": 0,
            "circuit_depth": 0,
            "circuit_diagram": f"Classical shortcut: gcd({a}, {N}) = {common_gcd}",
            "explanation": f"Base a={a} shares a non-trivial common factor with N={N}: gcd({a}, {N}) = {common_gcd}. Factored without quantum circuit.",
        }

    # Build Shor's algorithm circuit
    n_count = 8
    qc, count_qubits, work_qubits = build_shor_circuit(N, a, n_count=n_count)
    total_qubits = count_qubits + work_qubits
    circuit_depth = qc.depth()

    # Text circuit representation
    try:
        circuit_diagram = qc.draw(output="text").single_string()
    except Exception:
        circuit_diagram = str(qc)

    # Run on AerSimulator
    simulator = AerSimulator()
    transpiled_qc = transpile(qc, simulator)
    run_kwargs: Dict[str, Any] = {"shots": shots}
    if seed is not None:
        run_kwargs["seed_simulator"] = seed

    job = simulator.run(transpiled_qc, **run_kwargs)
    result = job.result()
    raw_counts = result.get_counts()

    # Sort counts by frequency
    sorted_counts = dict(sorted(raw_counts.items(), key=lambda item: item[1], reverse=True))

    # Convert binary measurements to phase floats: dec / 2^n_count
    # In Qiskit, bitstrings are ordered with MSB on left; qiskit measurements align with counting register
    phases: List[float] = []
    for bitstring in sorted_counts.keys():
        dec = int(bitstring, 2)
        phase = dec / (2 ** n_count)
        phases.append(phase)

    period, factors_set = postprocess_phases(phases, N, a)

    # Fallback retry if needed: if factors not complete, check period powers
    if len(factors_set) < 2 and period is not None and period % 2 == 0:
        half = pow(a, period // 2, N)
        for term in [half - 1, half + 1]:
            g = math.gcd(term, N)
            if 1 < g < N:
                factors_set.add(g)
                factors_set.add(N // g)

    factors_list = sorted(list(factors_set))
    success = len(factors_list) >= 2

    if success:
        explanation = (
            f"Factored N={N} into {factors_list[0]} and {factors_list[1]} using base a={a}. "
            f"Quantum phase estimation identified order r={period}. "
            f"Modular root calculation gcd(a^(r/2) +/- 1, N) revealed the non-trivial factors."
        )
    else:
        explanation = (
            f"Simulation executed for N={N} with base a={a}. "
            f"Identified candidate period r={period}, but could not complete factor split. "
            f"Try running with more shots or a different seed."
        )

    return {
        "N": N,
        "a": a,
        "success": success,
        "factors": factors_list if success else [f for f in factors_list if 1 < f < N],
        "period": period,
        "counts": sorted_counts,
        "num_qubits": total_qubits,
        "circuit_depth": circuit_depth,
        "circuit_diagram": circuit_diagram,
        "explanation": explanation,
    }
