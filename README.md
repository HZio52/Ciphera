<div align="center">

# 🔐 Ciphera

### Which of your encryption keys will quantum computers break first, and what should you fix this year?

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Qiskit](https://img.shields.io/badge/Built%20with-Qiskit-6929C4.svg)](https://www.ibm.com/quantum/qiskit)
[![Focus: Post-Quantum Cryptography](https://img.shields.io/badge/Focus-Post--Quantum%20Cryptography-blue.svg)](https://csrc.nist.gov/projects/post-quantum-cryptography)
[![Status: Hackathon prototype](https://img.shields.io/badge/Status-Hackathon%20prototype-orange.svg)](#project-status)

**Q-Hack India 2026 · Quantum Week · Quantum Security & Cryptography track**

</div>

---

## The problem

Most of the internet's security rests on public-key cryptography (RSA and elliptic curves). A large, error-corrected quantum computer running **Shor's algorithm** could break both. Nobody knows exactly when that day ("Q-Day") arrives, but two facts make it a problem **today**:

1. **Harvest Now, Decrypt Later (HNDL).** An attacker can record encrypted data now and decrypt it once a capable quantum computer exists. Data that must stay secret for 20 years is already exposed if Q-Day is closer than 20 years away.
2. **Migration is slow.** Replacing cryptography across a large organization takes years.

Security teams have thousands of keys and no way to tell which ones to migrate first. Existing scanners can tell you *that* you use RSA. They do not tell you *how urgent* it is for each system.

## What Ciphera does

Ciphera turns a list of cryptographic assets into a **prioritized migration roadmap**. For each asset it asks one question, based on Mosca's inequality:

> **If (how long the data must stay secret) + (how long migration will take) is greater than (time until a quantum computer can break this algorithm), you are already late.**

```
        X                +        Y           >         Z
 data shelf-life (years)    migration time (years)   years until Q-Day for this algorithm
```

Because **Z is uncertain**, Ciphera never uses a single date. It uses a **range** (earliest plausible, central, latest plausible) and shows which scenarios make each asset a problem.

### Verdict rules (defaults, configurable)

| Verdict | Condition | Meaning |
|---|---|---|
| 🔴 **Red** | X + Y is greater than the **central** estimate of Z | You will probably be late. Migrate first. |
| 🟡 **Yellow** | X + Y is greater than the **earliest** Z but within the central estimate | Safe only if quantum progress is slower than the optimistic case. Plan migration. |
| 🟢 **Green** | X + Y is within the **earliest** Z, or the asset already uses a post-quantum algorithm | Low priority for now. |

### Example (illustrative)

> These numbers are **assumptions to demonstrate the logic, not predictions.** Assume earliest Z = 8 years and central Z = 12 years.

| Asset | Algorithm | Shelf-life (X) | Migration (Y) | X + Y | Verdict |
|---|---|---|---|---|---|
| Patient records archive | RSA-2048 | 25 yr | 3 yr | 28 | 🔴 Red |
| Internal HR records | ECC-256 | 7 yr | 2 yr | 9 | 🟡 Yellow |
| Short-lived session keys | ECC-256 | under 1 yr | 2 yr | about 3 | 🟢 Green |
| New service using ML-KEM-768 | Post-quantum (NIST FIPS 203) | n/a | n/a | n/a | 🟢 Green |

The archive is Red **today**, even though the quantum computer is years away. This is the HNDL effect, and it is the main reason a calendar date alone is the wrong way to measure risk.

---

## How it works

```
┌────────────────┐    ┌───────────────────────────┐    ┌──────────────────────┐
│ 1. Inventory   │ →  │ 2. Risk engine            │ →  │ 3. Priority          │
│ asset list:    │    │ Z range per algorithm,    │    │ dashboard            │
│ algorithm,     │    │ from published resource   │    │ ranked Red / Yellow  │
│ key size,      │    │ estimates + hardware      │    │ / Green with the     │
│ shelf-life,    │    │ roadmaps; apply X + Y > Z │    │ reasoning shown      │
│ migration time │    │ for each scenario         │    │                      │
└────────────────┘    └───────────────────────────┘    └──────────────────────┘
```

**1. Inventory.** The user provides assets (CSV upload or a form). For each: algorithm and key size, what the key protects, how long that data must stay confidential, and an estimate of migration time.

**2. Risk engine.** For each algorithm, Ciphera estimates the **resources an attack needs** and compares them with **hardware roadmaps** to produce a range for Z. Inputs are kept in a single, editable assumptions file so every number can be traced to its source and changed by the user.

**3. Priority dashboard.** A Streamlit dashboard ranks assets, shows the scenario behind each verdict, and includes a **time slider** to watch assets move from Green to Yellow to Red as the years pass.

**4. Shor's algorithm demo.** A Qiskit simulation factors small numbers (such as 15 and 21) to show the mechanism the whole tool is built around. It is a demonstration of the principle, not an attack on real keys.

### Published estimates used as inputs

| Target | Estimate | Source |
|---|---|---|
| RSA-2048 | Fewer than 1 million noisy physical qubits, running for less than a week | Gidney, *How to factor 2048 bit RSA integers with less than a million noisy qubits*, 2025 ([arXiv:2505.15917](https://arxiv.org/abs/2505.15917)) |
| ECC-256 (secp256k1) | Roughly 1,200 to 1,450 logical qubits; fewer than 500,000 physical qubits | Google Quantum AI, March 2026 ([summary](https://postquantum.com/security-pqc/google-quantum-bitcoin-ecdlp/)) |

> Resource estimates keep changing, and different papers assume different hardware. Ciphera treats them as **inputs with uncertainty**. Please check the primary papers before relying on any number. Hardware roadmap figures (for example IBM's) are configurable assumptions and should be verified against the vendor's current published roadmap.

---

## Project status

**This is a hackathon prototype under active development.** The checklist below shows what exists and what does not.

- [x] **Phase 1: Risk model.** Mosca-based verdict logic and scenario ranges defined
- [ ] **Phase 2: Core engine.** Assumptions file, risk calculator, CSV inventory input
- [ ] **Phase 3: Dashboard.** Streamlit Red/Yellow/Green view with time slider
- [ ] **Phase 4: Shor demo.** Qiskit simulation on small numbers
- [ ] **Phase 5: Recommendations.** Suggest NIST-standardized replacements (for example ML-KEM, ML-DSA)
- [ ] **Phase 6: Automated discovery.** Find keys in configs and certificates instead of manual entry

## Getting started

> ⚠️ The commands below describe the **planned** setup and will work once the MVP is pushed.

```bash
git clone https://github.com/<your-username>/ciphera.git
cd ciphera
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

streamlit run app.py          # risk dashboard
python demo/shor_demo.py      # Shor's algorithm on small numbers (Qiskit simulator)
```

## Planned project structure

```
ciphera/
├── app.py                  # Streamlit dashboard
├── compass/
│   ├── engine.py           # X + Y > Z logic, scenario handling
│   └── assumptions.yaml    # Z ranges, thresholds, and their sources
├── demo/
│   └── shor_demo.py        # Qiskit simulation on toy numbers
├── data/
│   └── sample_inventory.csv
├── requirements.txt
└── README.md
```

## Tech stack

Python 3.10+ · Qiskit (Shor demo, simulator only) · NumPy and Pandas (risk engine) · Streamlit (dashboard)

---

## Scope and limitations

Being clear about limits is part of the design.

- **Estimates, not predictions.** Nobody can say exactly when a cryptographically relevant quantum computer will exist. Ciphera shows ranges and the assumptions behind them, and it is a **planning aid**, not a forecast.
- **The demo is small on purpose.** Factoring 15 or 21 shows the mechanism. It does not show that real keys are breakable today (they are not).
- **Public-key cryptography only.** Ciphera covers algorithms broken by Shor's algorithm (RSA, Diffie-Hellman, elliptic curves). Symmetric cryptography and hash functions are not broken by Shor's algorithm and are out of scope for v1.
- **Inventory is user-supplied.** The tool is only as good as the asset list it receives. Automated discovery is on the roadmap but not built.
- **Encryption vs. signatures.** Encryption keys face the HNDL threat. Signature keys are at risk when forgery becomes possible, which is modeled differently. The first version focuses on the encryption case.
- **Diagnosis, not repair.** v1 prioritizes. It does not yet migrate anything.

## How this differs from existing tools

Cryptographic scanners and bill-of-materials tools find vulnerable algorithms in code and infrastructure. Ciphera works one step later: given a list of assets, it answers **how soon each one matters and in what order to fix them**, with uncertainty shown. The two are complementary, and scanner output could feed Ciphera's inventory.

## References

- Gidney, C. (2025). *How to factor 2048 bit RSA integers with less than a million noisy qubits.* [arXiv:2505.15917](https://arxiv.org/abs/2505.15917)
- Google Quantum AI (2026). *Securing Elliptic Curve Cryptocurrencies against Quantum Vulnerabilities: Resource Estimates and Mitigations.* [Secondary summary](https://postquantum.com/security-pqc/google-quantum-bitcoin-ecdlp/)
- NIST. [Post-Quantum Cryptography project](https://csrc.nist.gov/projects/post-quantum-cryptography) and the [2022 announcement of the first standardized algorithms](https://www.nist.gov/news-events/news/2022/07/nist-announces-first-four-quantum-resistant-cryptographic-algorithms)
- Mosca, M. *Cybersecurity in an era with quantum computers: will we be ready?* (the inequality used for the verdict rule)

## Team

| Name | Role |
|---|---|
| _Your name_ | Product and pitch |
| _Teammate_ | Quantum and backend |
| _Teammate_ | Frontend and dashboard |

## License

Released under the [MIT License](LICENSE). Add a `LICENSE` file to the repository root.

## Disclaimer

Ciphera is a prototype built for Q-Hack India 2026 (Quantum Week). Risk ranges are derived from public roadmaps and published academic estimates, and are intended for **strategic planning only**. They are not a guarantee, and they are not security advice for any specific system.
