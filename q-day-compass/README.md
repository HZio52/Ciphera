# Q-Day Compass

**Team BHOOM · Q-Hack India 2026**

> *"If data shelf-life plus migration time exceeds the time until the algorithm could be broken, you are already late."*

Q-Day Compass is a risk-prioritization and urgency assessment tool for the transition to Post-Quantum Cryptography (PQC). Built on **Mosca's inequality** ($X + Y > Z$), it helps organizations evaluate their cryptographic inventory across three realistic quantum capability scenarios, generating an actionable **Red / Yellow / Green / Gray** migration roadmap with plain-English reasoning. It includes a simulated **Qiskit quantum circuit implementation of Shor's algorithm** to demonstrate the underlying order-finding mechanism.

---

## Status & Capabilities Checklist

- [x] **Phase 1: Risk Engine & Core Logic**
  - [x] YAML assumptions loader with strict provenance validation (`status` and `source`)
  - [x] Algorithm parsing (RSA, ECC, ECDSA, ML-KEM, AES, SHA, etc.)
  - [x] Physical-qubit scaling models (linear scaling anchored to peer-reviewed literature)
  - [x] Scenario trajectory engine (Earliest, Central, Latest break years)
  - [x] Mosca's inequality evaluation ($X + Y > Z$) and tie-broken priority ranking
  - [x] 7/7 passing engine unit & fixture tests in `tests/test_engine.py`
- [x] **Phase 2: Interactive Streamlit Dashboard**
  - [x] Prominent planning estimate disclaimer and illustrative trajectory banner
  - [x] Interactive assessment year slider ($T \in [2026, 2041]$) with live verdict re-computation
  - [x] Multiple inventory input methods: Sample inventory, CSV upload, and live data editor
  - [x] Ranked roadmap table with custom color-coded verdict badges
  - [x] Altair sensitivity chart comparing $X+Y$ against scenario break horizons
  - [x] One-click CSV export of evaluated roadmap
- [x] **Phase 3: Quantum Mechanism Simulation**
  - [x] Real Qiskit quantum circuit running on `AerSimulator`
  - [x] Permutation unitaries for controlled modular multiplication $a^{2^k} \pmod N$
  - [x] Inverse QFT gate and quantum measurement
  - [x] Classical continued fractions post-processing (`limit_denominator`)
  - [x] Automatic factoring for $N=15$ (factors $\{3, 5\}$) and stretch target $N=21$ (factors $\{3, 7\}$)
  - [x] 4/4 passing Shor simulation unit tests in `tests/test_shor.py`
- [x] **Phase 4: Polish & Documentation**
  - [x] Complete test suite passing (`11/11 passed`)
  - [x] MIT License added
  - [x] Zero API keys required; 100% offline runnable on standard laptops

---

## Project Structure

```
q-day-compass/
├── app.py                      # Streamlit entry point (dashboard + Shor page)
├── compass/
│   ├── __init__.py
│   ├── engine.py               # parsing, break_year(), verdicts, ranking, reasoning text
│   ├── assumptions.yaml        # single source of truth for physical qubits & growth
│   └── config.py               # loads and validates assumptions provenance
├── demo/
│   ├── __init__.py
│   └── shor_demo.py            # Qiskit Aer quantum circuit simulation for N=15, 21
├── data/
│   └── sample_inventory.csv    # 7 representative organizational cryptographic assets
├── tests/
│   ├── test_engine.py          # 7 engine tests with fixed fixture
│   └── test_shor.py            # 4 quantum circuit simulation tests
├── docs/screenshots/           # media and demo screenshots
├── requirements.txt            # pinned Python dependencies
├── LICENSE                     # MIT License
└── README.md                   # documentation & demo guide
```

---

## Quickstart & Installation

Q-Day Compass is designed to run completely offline on Windows 11, Linux, or macOS without any GPU or external API keys.

### 1. Create a Virtual Environment & Install Dependencies

```bash
# Optional: create a clean virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Test Suite

```bash
pytest -v
```

All 11 unit and integration tests will execute and pass:
- Fixture evaluation at reference year 2026 (Patient records -> RED, HR -> YELLOW, Session keys -> GREEN, ML-KEM -> GREEN PQC, AES -> GRAY)
- Exact boundary conditions ($X + Y == Z_{\text{central}}$ is not RED, $X + Y > Z_{\text{central}}$ is RED)
- Monotonicity across time slider
- Parsing and graceful handling of unknown algorithms
- Derived break years for RSA-2048 and ECC-256
- Strict YAML provenance validation (`status` and `source`)
- Order ranking validation
- Shor factoring on $N=15$ on Qiskit Aer
- Coprime base shortcut
- Continued fractions phase recovery from ideal eigenvalues
- Quantum circuit depth and qubit allocations

### 3. Launch the Streamlit Dashboard

```bash
streamlit run app.py
```

Open your browser to `http://localhost:8501`.

---

## How It Works (The Math)

### 1. Mosca's Inequality
For every cryptographic asset in the inventory:
- **X**: Confidentiality shelf-life required for the data (years).
- **Y**: Time required to complete migration to a post-quantum algorithm (years).
- **Z**: Time remaining until a cryptanalytically relevant quantum computer (CRQC) can break the algorithm (years).

Assessment at year $T$:
$$Z_{\text{remaining}}(\text{scenario}) = \max(0, \text{break\_year}(\text{scenario}) - T)$$

**Verdicts:**
- **RED:** $X + Y > Z_{\text{remaining}}(\text{central})$ &mdash; Migration will finish after the cipher is expected to be broken.
- **YELLOW:** $X + Y > Z_{\text{remaining}}(\text{earliest})$ (and not RED) &mdash; At risk if quantum hardware scaling accelerates.
- **GREEN:** $X + Y \le Z_{\text{remaining}}(\text{earliest})$ &mdash; Adequate migration buffer.
- **GREEN (quantum-safe):** Post-quantum algorithms (ML-KEM, ML-DSA, SLH-DSA) immune to Shor's algorithm.
- **GRAY (out of scope):** Symmetric ciphers (AES-256) and hashes (SHA-256) unaffected by polynomial-time factoring.

### 2. Resource-to-Hardware Trajectory
Break years are derived from physical qubit requirements scaled against hardware growth:
$$\text{break\_year} = \text{reference\_year} + \frac{\ln(\text{required\_qubits} / \text{start\_qubits})}{\ln(\text{annual\_growth})}$$

- **RSA-2048 Anchor:** $1,000,000$ physical qubits (*Gidney 2025, arXiv:2505.15917*).
- **ECC-256 Anchor:** $500,000$ physical qubits (*Google Quantum AI 2026*).
- **Hardware Growth (Illustrative defaults):**
  - Earliest: $2.37\times$/yr ($\sim 8$ years to RSA-2048)
  - Central: $1.78\times$/yr ($\sim 12$ years to RSA-2048)
  - Latest: $1.41\times$/yr ($\sim 20$ years to RSA-2048)

---

## Screenshots

High-resolution screenshots captured at 1920x1080 and 1440x900 are located in `docs/screenshots/`:
- `docs/screenshots/roadmap_1920x1080.png` &mdash; Executive summary, timeline slider, and ranked migration roadmap.
- `docs/screenshots/roadmap_2035_1920x1080.png` &mdash; Dynamic timeline progression at year 2035.
- `docs/screenshots/scenarios_1920x1080.png` &mdash; Horizon sensitivity chart with shape-based scenario markers.
- `docs/screenshots/quantum_demo_1920x1080.png` &mdash; Guided 5-step Shor simulation with highlighted histogram peaks.
- `docs/screenshots/evidence_1920x1080.png` &mdash; Ground truth assumptions provenance and offline verification suite.
- `docs/screenshots/roadmap_dark_1920x1080.png` &mdash; Deep navy (`#0B1220`) dark mode mission control interface.

---

## Assumptions & Limitations

1. **Planning estimates, not deterministic predictions:** Model trajectories provide risk planning bounds, not exact calendar forecasts.
2. **User inventory:** Relies on user input rather than automated network discovery.
3. **Public-key focus:** Addresses algorithms broken by Shor's algorithm. Symmetric encryption (AES) is classified as out-of-scope for v1.
4. **Encryption vs. Signature keys:** Confidential data is vulnerable to Harvest Now, Decrypt Later (HNDL) attacks today. Signatures are vulnerable when forgery becomes feasible. Version 1 models both conservatively; future versions will split signature forging windows.
5. **Diagnoses rather than migrates:** Identifies priority order; organizations must adopt NIST FIPS 203/204/205 standards.

---

## License

This project is licensed under the MIT License &mdash; see the [LICENSE](LICENSE) file for details.
