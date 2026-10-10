# Ciphera

**Which of your encryption keys will quantum computers break first, and what should you migrate this year?**

![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue)
![Qiskit](https://img.shields.io/badge/Qiskit-simulator-informational)
![Track: Quantum Security](https://img.shields.io/badge/track-quantum%20security%20%26%20cryptography-informational)
![Status: hackathon prototype](https://img.shields.io/badge/status-hackathon%20prototype-orange)

Built by Team BHOOM for Q-Hack India 2026 (Quantum Week), Quantum Security and Cryptography track.

---

## The problem

Most internet security rests on public-key cryptography (RSA and elliptic curves). A large, error-corrected quantum computer running Shor's algorithm could break both. Nobody knows when that day ("Q-Day") arrives, but two facts make it a problem today:

- **Harvest now, decrypt later.** An attacker can record encrypted data now and decrypt it once a capable quantum computer exists. Data that must stay secret for 20 years is already exposed if Q-Day is closer than 20 years away.
- **Migration is slow.** Replacing cryptography across a large organization takes years.

Security teams hold thousands of keys and have no clear way to decide which to migrate first. Existing scanners can tell you that you use RSA. They do not tell you how urgent it is for each system.

## What Ciphera does

Ciphera turns a list of cryptographic assets into a ranked migration roadmap. For each asset it applies Mosca's inequality:

```
      X                +        Y            >          Z
data shelf-life (yr)     migration time (yr)      years until a quantum computer
                                                  could break this algorithm
```

If the data must stay secret for X years and migration takes Y years, and X + Y is longer than Z, the asset is already late.

Because Z is uncertain, Ciphera never uses a single date. It uses three scenarios (earliest plausible, central, latest plausible) and shows which of them make each asset a problem. Every assumption is visible and editable.

### Verdict rules (defaults, configurable)

| Verdict | Condition | Meaning |
|---|---|---|
| Act now (Red) | X + Y is greater than the central estimate of Z | You will probably be late. Migrate first. |
| Plan soon (Yellow) | X + Y is greater than the earliest estimate of Z but within the central estimate | Safe only if quantum progress is slower than the optimistic case. Start planning. |
| Safe for now (Green) | X + Y is within the earliest estimate of Z, or the asset already uses a post-quantum algorithm | Low priority today. |
| Out of scope (Gray) | Symmetric cryptography and hash functions | Not broken by Shor's algorithm. |

For each scenario, Ciphera also reports the **last safe year to start migration**: the estimated break year minus (X + Y).

### Worked example (illustrative)

These numbers are assumptions chosen to show the logic. They are not predictions. Assume earliest Z = 8 years and central Z = 12 years.

| Asset | Algorithm | Shelf-life (X) | Migration (Y) | X + Y | Verdict |
|---|---|---|---|---|---|
| Patient records archive | RSA-2048 | 25 years | 3 years | 28 | Act now |
| Internal HR records | ECC-256 | 7 years | 2 years | 9 | Plan soon |
| Short-lived session keys | ECC-256 | under 1 year | 2 years | about 3 | Safe for now |
| New service using ML-KEM-768 | Post-quantum (NIST FIPS 203) | n/a | n/a | n/a | Safe for now |

The archive is "Act now" today even though the quantum computer is years away. That is the harvest-now effect, and it is why a calendar date alone is the wrong way to measure this risk.

## How it works

1. **Inventory.** The user enters assets in a form or uploads a CSV. Each asset has an algorithm and key size, what it protects, how long that data must stay confidential, and an estimate of migration time.
2. **Risk engine.** For each algorithm, Ciphera compares the estimated resources an attack needs with a hardware trajectory to produce the three-scenario range for Z. All inputs live in one assumptions file, so each number can be traced to a source and changed.
3. **Priority roadmap.** The dashboard ranks assets, shows the scenario behind each verdict, and includes a year slider so you can watch assets move from Safe to Plan soon to Act now as time passes.
4. **Shor's algorithm demo.** A Qiskit simulation factors a small number (15) to show the mechanism the whole tool rests on. It demonstrates the principle. It does not attack real keys.

### Published estimates used as inputs

| Target | Estimate | Source |
|---|---|---|
| RSA-2048 | Fewer than 1 million noisy physical qubits, running for about a week | Gidney, *How to factor 2048 bit RSA integers with less than a million noisy qubits*, 2025 ([arXiv:2505.15917](https://arxiv.org/abs/2505.15917)) |
| ECC-256 | Fewer than 500,000 physical qubits | Google Quantum AI, 2026 (secondary summary only, primary source to be verified) |

Resource estimates keep changing, and different papers assume different hardware. Ciphera treats them as inputs with uncertainty. The hardware growth rates that turn these estimates into break years are **illustrative defaults**, not vendor forecasts, and scaling to other key sizes is a simplification. Check the primary papers and each vendor's current roadmap before relying on any number.

## Status

Hackathon prototype under active development.

- [x] Risk model: Mosca-based verdict logic and three-scenario ranges
- [x] Core engine: assumptions file and risk calculator
- [x] Dashboard: roadmap, scenarios view, evidence table, year slider
- [x] Shor demo: step-by-step Qiskit simulation on a small number
- [ ] Recommendations: suggest NIST-standardized replacements (for example ML-KEM, ML-DSA)
- [ ] Automated discovery: find keys in configs and certificates instead of manual entry
- [ ] Independent validation of assumptions against primary sources

Checked items reflect the current prototype. Please correct this list if your branch differs.

## Getting started

Requirements: Python 3.10 or newer (3.11 or 3.12 recommended for Qiskit).

```bash
git clone https://github.com/<your-username>/ciphera.git
cd ciphera
python -m venv .venv
```

Activate the environment:

```bash
# macOS and Linux
source .venv/bin/activate

# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

Install and run:

```bash
pip install -r requirements.txt
streamlit run app.py
```

The app opens at `http://localhost:8501`. To run the Shor demo on its own:

```bash
python demo/shor_demo.py
```

To run the tests:

```bash
pip install pytest
pytest
```

## Project structure

```
ciphera/
├── app.py                  # Streamlit dashboard
├── compass/
│   ├── engine.py           # X + Y > Z logic and scenario handling
│   └── assumptions.yaml    # Z ranges, thresholds, and their sources
├── demo/
│   └── shor_demo.py        # Qiskit simulation on a toy number
├── data/
│   └── sample_inventory.csv
├── tests/
├── requirements.txt
└── README.md
```

Adjust this tree to match your repository before publishing.

## Tech stack

Python 3.10+, Qiskit and Qiskit Aer (Shor demo, simulator only), NumPy and Pandas (risk engine), Streamlit (dashboard).

## Scope and limitations

- **Estimates, not predictions.** Nobody can say when a cryptographically relevant quantum computer will exist. Ciphera shows ranges and the assumptions behind them. It is a planning aid.
- **The demo is small on purpose.** Factoring 15 shows the mechanism. Real keys cannot be broken today.
- **Public-key cryptography only.** Ciphera covers algorithms broken by Shor's algorithm (RSA, Diffie-Hellman, elliptic curves). Symmetric cryptography and hash functions are out of scope.
- **Inventory is user-supplied.** The output is only as good as the asset list. Do not enter real keys, passwords or secrets. Algorithm names and durations are enough.
- **Encryption first.** Encryption keys face the harvest-now threat. Signature keys are at risk when forgery becomes possible, which is modeled differently and is not the focus of v1.
- **Diagnosis, not repair.** v1 prioritizes. It does not migrate anything.

## How this differs from existing tools

Cryptographic scanners and bill-of-materials tools find vulnerable algorithms in code and infrastructure. Ciphera works one step later: given a list of assets, it answers how soon each one matters and in what order to fix them, with uncertainty shown. The two are complementary, and scanner output could feed Ciphera's inventory.

## References

- Gidney, C. (2025). *How to factor 2048 bit RSA integers with less than a million noisy qubits.* [arXiv:2505.15917](https://arxiv.org/abs/2505.15917)
- Google Quantum AI (2026). Resource estimates for elliptic curve cryptography (secondary summary; primary source to be confirmed).
- NIST. [Post-Quantum Cryptography project](https://csrc.nist.gov/projects/post-quantum-cryptography), including the first standardized algorithms (FIPS 203, 204, 205).
- Mosca, M. *Cybersecurity in an era with quantum computers: will we be ready?* (the inequality behind the verdict rule)

## Team BHOOM

| Name | Role |
|---|---|
| Hemanth A N | Team lead |
| Ankitha M D | Member |
| Vindhya C | Member |

## License

Released under the [MIT License](LICENSE).

## Disclaimer

Ciphera is a prototype built for Q-Hack India 2026. Risk ranges come from public estimates and illustrative assumptions and are meant for strategic planning only. They are not a guarantee and not security advice for any specific system.
