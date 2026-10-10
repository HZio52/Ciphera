"""
Q-Day Compass - Interactive Streamlit Dashboard
Team BHOOM (Q-Hack India 2026)

Urgency & Risk-Prioritization Tool for the Post-Quantum Cryptography Transition
Built on Mosca's Inequality (X + Y > Z) with Quantum Simulation of Shor's Algorithm.
"""

import io
from pathlib import Path
from typing import Any, Dict, List
import altair as alt
import numpy as np
import pandas as pd
import streamlit as st

from compass.config import (
    get_assumptions_table,
    has_illustrative_assumptions,
    load_assumptions,
)
from compass.engine import evaluate_asset, rank_inventory
from demo.shor_demo import factor

# Configure page layout and style
st.set_page_config(
    page_title="Q-Day Compass",
    page_icon="Q",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Q-Hack palette CSS: accent pink #FA7CB5, purple #B48AF7, bg #E0E0E0, dark text
st.markdown(
    """
    <style>
    :root {
        --color-pink: #FA7CB5;
        --color-purple: #B48AF7;
        --color-bg: #F4F4F6;
        --color-dark: #1E1E24;
        --color-red: #E5484D;
        --color-yellow: #F5B301;
        --color-green: #2EB872;
        --color-gray: #9CA3AF;
    }
    .stApp {
        background-color: #F8F9FA;
        color: #1F2937;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .banner-warning {
        background-color: #FEF3C7;
        border-left: 4px solid #F5B301;
        padding: 12px 18px;
        margin-bottom: 16px;
        border-radius: 4px;
        color: #92400E;
        font-size: 0.95rem;
    }
    .banner-disclaimer {
        background-color: #EEF2FF;
        border-left: 4px solid #B48AF7;
        padding: 12px 18px;
        margin-bottom: 20px;
        border-radius: 4px;
        color: #3730A3;
        font-size: 0.95rem;
    }
    .metric-card {
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        padding: 16px 20px;
        border-radius: 8px;
        text-align: left;
    }
    .metric-val {
        font-size: 1.85rem;
        font-weight: 700;
        line-height: 1.2;
    }
    .metric-lbl {
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6B7280;
    }
    .badge-red {
        background-color: #FEE2E2;
        color: #991B1B;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
    }
    .badge-yellow {
        background-color: #FEF3C7;
        color: #92400E;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
    }
    .badge-green {
        background-color: #D1FAE5;
        color: #065F46;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
    }
    .badge-gray {
        background-color: #F3F4F6;
        color: #4B5563;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data
def get_config() -> Dict[str, Any]:
    return load_assumptions()


@st.cache_data
def load_default_inventory() -> pd.DataFrame:
    path = Path("data/sample_inventory.csv")
    if path.exists():
        return pd.read_csv(path)
    return pd.DataFrame([
        {"asset_name": "Patient records archive", "algorithm": "RSA-2048", "data_shelf_life_years": 25.0, "migration_time_years": 3.0, "notes": "Long-lived health records"},
        {"asset_name": "Internal HR records", "algorithm": "ECC-256", "data_shelf_life_years": 7.0, "migration_time_years": 2.0, "notes": "Employee data"},
        {"asset_name": "Short-lived session keys", "algorithm": "ECC-256", "data_shelf_life_years": 0.5, "migration_time_years": 2.0, "notes": "Rotated frequently"},
        {"asset_name": "New service", "algorithm": "ML-KEM-768", "data_shelf_life_years": 0.0, "migration_time_years": 0.0, "notes": "Already post-quantum"},
        {"asset_name": "Customer database backups", "algorithm": "RSA-3072", "data_shelf_life_years": 15.0, "migration_time_years": 4.0, "notes": "Encrypted off-site backups"},
        {"asset_name": "Software update signing", "algorithm": "ECDSA-P256", "data_shelf_life_years": 10.0, "migration_time_years": 3.0, "notes": "Signature keys: see limitations"},
        {"asset_name": "Disk encryption", "algorithm": "AES-256", "data_shelf_life_years": 10.0, "migration_time_years": 1.0, "notes": "Symmetric: out of scope in v1"},
    ])


config = get_config()
ref_year = int(config.get("reference_year", 2026))

# Sidebar Navigation
st.sidebar.markdown(
    f"""
    <div style="padding: 10px 0 20px 0;">
        <h2 style="margin: 0; color: #111827; font-size: 1.4rem;">Q-Day Compass</h2>
        <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 0.85rem;">Post-Quantum Cryptography Migration Planner</p>
    </div>
    """,
    unsafe_allow_html=True,
)

page = st.sidebar.radio(
    "Navigation",
    ["Dashboard", "Shor's Algorithm Demo", "Assumptions & Limitations"],
    index=0,
)

st.sidebar.markdown("---")
st.sidebar.markdown(
    """
    **Core Rule (Mosca's Inequality):**
    
    `X` = Confidentiality shelf-life (yrs)  
    `Y` = Migration duration (yrs)  
    `Z` = Quantum vulnerability timeline (yrs)  
    
    If `X + Y > Z`, migration is overdue.
    """,
)


# ==============================================================================
# PAGE 1: DASHBOARD
# ==============================================================================
if page == "Dashboard":
    # Top Banners
    st.markdown(
        """
        <div class="banner-disclaimer">
            <strong>Disclaimer:</strong> Results are planning estimates, not deterministic predictions or formal security advice.
        </div>
        """,
        unsafe_allow_html=True,
    )

    if has_illustrative_assumptions(config):
        st.markdown(
            """
            <div class="banner-warning">
                <strong>Notice:</strong> Illustrative hardware trajectory in use: replace with roadmap-derived values.
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Header & Pitch
    col_t1, col_t2 = st.columns([3, 1])
    with col_t1:
        st.title("Cryptographic Migration Roadmap")
        st.caption("Prioritizing cryptographic migration urgency across quantum vulnerability scenarios.")

    # Time Slider
    assessment_year = st.slider(
        "Assessment Year (T)",
        min_value=ref_year,
        max_value=ref_year + 15,
        value=ref_year,
        step=1,
        help="Simulate advancing the calendar. As year advances, remaining quantum safety window shrinks.",
    )

    # Inventory Data Source Selection
    st.subheader("Asset Inventory")
    inv_choice = st.radio(
        "Inventory Source",
        [
            "Sample Inventory (Enterprise)",
            "Banking & Finance Core",
            "Defense & Critical Infrastructure",
            "Upload CSV",
            "Edit table",
        ],
        horizontal=True,
    )

    df_raw: pd.DataFrame
    if inv_choice == "Sample Inventory (Enterprise)":
        df_raw = load_default_inventory()
    elif inv_choice == "Banking & Finance Core":
        df_raw = pd.DataFrame([
            {"asset_name": "Core Ledger Key Pairs", "algorithm": "RSA-4096", "data_shelf_life_years": 30.0, "migration_time_years": 5.0, "notes": "Interbank settlement audit logs"},
            {"asset_name": "Mobile Banking App TLS", "algorithm": "ECDSA-P256", "data_shelf_life_years": 5.0, "migration_time_years": 2.0, "notes": "End-user transaction certificates"},
            {"asset_name": "SWIFT Gateway Signatures", "algorithm": "RSA-2048", "data_shelf_life_years": 12.0, "migration_time_years": 3.0, "notes": "Wire transfer authorization tokens"},
            {"asset_name": "Card Vault Tokenization", "algorithm": "AES-256", "data_shelf_life_years": 7.0, "migration_time_years": 1.0, "notes": "PCI-DSS encrypted card numbers"},
            {"asset_name": "ATM Hardware Security Module", "algorithm": "RSA-2048", "data_shelf_life_years": 8.0, "migration_time_years": 4.0, "notes": "Physical HSM key rotation cycles"},
            {"asset_name": "Post-Quantum API Gateway Pilot", "algorithm": "ML-DSA-65", "data_shelf_life_years": 10.0, "migration_time_years": 0.0, "notes": "NIST FIPS 204 digital signature pilot"},
        ])
    elif inv_choice == "Defense & Critical Infrastructure":
        df_raw = pd.DataFrame([
            {"asset_name": "Classified Satellite Telemetry Archive", "algorithm": "RSA-2048", "data_shelf_life_years": 35.0, "migration_time_years": 6.0, "notes": "Orbital telemetry and encrypted video feeds"},
            {"asset_name": "Substation SCADA Controller Signing", "algorithm": "ECDSA-P256", "data_shelf_life_years": 18.0, "migration_time_years": 5.0, "notes": "Industrial firmware updates with 15y lifespans"},
            {"asset_name": "Tactical Radio Key Material", "algorithm": "ECC-256", "data_shelf_life_years": 10.0, "migration_time_years": 3.0, "notes": "Battlefield comms key exchange"},
            {"asset_name": "Next-Gen Command Post Encryption", "algorithm": "ML-KEM-1024", "data_shelf_life_years": 40.0, "migration_time_years": 0.0, "notes": "High-security PQC parameterization"},
        ])
    elif inv_choice == "Upload CSV":
        uploaded = st.file_uploader("Upload CSV inventory", type=["csv"])
        if uploaded is not None:
            try:
                df_raw = pd.read_csv(uploaded)
            except Exception as e:
                st.error(f"Failed to read CSV: {e}")
                df_raw = load_default_inventory()
        else:
            st.info("No file uploaded yet. Showing sample inventory.")
            df_raw = load_default_inventory()
    else:  # Edit table
        st.caption("Edit rows directly in the table below:")
        df_raw = st.data_editor(
            load_default_inventory(),
            num_rows="dynamic",
            use_container_width=True,
            key="editor_inventory",
        )

    # Evaluate & Rank Roadmap
    ranked_assets = rank_inventory(df_raw, assessment_year=float(assessment_year), config=config)

    # Summary Row
    count_red = sum(1 for a in ranked_assets if a["verdict_code"] == "RED")
    count_yellow = sum(1 for a in ranked_assets if a["verdict_code"] == "YELLOW")
    count_green = sum(1 for a in ranked_assets if a["verdict_code"] == "GREEN")
    count_gray = sum(1 for a in ranked_assets if a["verdict_code"] == "GRAY")

    st.markdown("### Status Overview")
    sc1, sc2, sc3, sc4, sc5 = st.columns(5)
    with sc1:
        st.markdown(
            f"""<div class="metric-card" style="border-top: 4px solid #E5484D;">
                <div class="metric-lbl">Critical (Red)</div>
                <div class="metric-val" style="color: #E5484D;">{count_red}</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with sc2:
        st.markdown(
            f"""<div class="metric-card" style="border-top: 4px solid #F5B301;">
                <div class="metric-lbl">At Risk (Yellow)</div>
                <div class="metric-val" style="color: #D97706;">{count_yellow}</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with sc3:
        st.markdown(
            f"""<div class="metric-card" style="border-top: 4px solid #2EB872;">
                <div class="metric-lbl">Safe (Green)</div>
                <div class="metric-val" style="color: #2EB872;">{count_green}</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with sc4:
        st.markdown(
            f"""<div class="metric-card" style="border-top: 4px solid #9CA3AF;">
                <div class="metric-lbl">Out of Scope / Gray</div>
                <div class="metric-val" style="color: #6B7280;">{count_gray}</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with sc5:
        st.markdown(
            f"""<div class="metric-card" style="border-top: 4px solid #B48AF7;">
                <div class="metric-lbl">Assessment Year</div>
                <div class="metric-val" style="color: #6366F1;">{assessment_year}</div>
            </div>""",
            unsafe_allow_html=True,
        )

    st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)

    # Ranked Roadmap Table
    st.subheader(f"Ranked Migration Roadmap (As of Year {assessment_year})")

    table_data = []
    for item in ranked_assets:
        earliest_z = f"{item['z_remaining_earliest']:.1f}y" if item["z_remaining_earliest"] is not None else "N/A"
        central_z = f"{item['z_remaining_central']:.1f}y" if item["z_remaining_central"] is not None else "N/A"
        latest_z = f"{item['z_remaining_latest']:.1f}y" if item["z_remaining_latest"] is not None else "N/A"

        table_data.append({
            "Rank": item["rank"],
            "Asset": item["asset_name"],
            "Algorithm": item["algorithm"],
            "X (Shelf Life)": f"{item['data_shelf_life_years']:g}y",
            "Y (Migration)": f"{item['migration_time_years']:g}y",
            "X + Y": f"{item['x_plus_y']:g}y",
            "Z Rem (Earliest)": earliest_z,
            "Z Rem (Central)": central_z,
            "Z Rem (Latest)": latest_z,
            "Verdict": item["verdict_label"],
            "Reasoning": item["reasoning"],
        })

    df_display = pd.DataFrame(table_data)

    def color_verdict(val):
        if "RED" in str(val):
            return "background-color: #FEE2E2; color: #991B1B; font-weight: 600;"
        elif "YELLOW" in str(val):
            return "background-color: #FEF3C7; color: #92400E; font-weight: 600;"
        elif "GREEN" in str(val):
            return "background-color: #D1FAE5; color: #065F46; font-weight: 600;"
        else:
            return "background-color: #F3F4F6; color: #4B5563; font-weight: 600;"

    styled_df = df_display.style.map(color_verdict, subset=["Verdict"])
    st.dataframe(styled_df, use_container_width=True, hide_index=True)

    # Download CSV
    csv_buf = io.StringIO()
    df_display.to_csv(csv_buf, index=False)
    st.download_button(
        label="Download Ranked Roadmap as CSV",
        data=csv_buf.getvalue(),
        file_name=f"q_day_compass_roadmap_{assessment_year}.csv",
        mime="text/csv",
    )

    st.markdown("<div style='height: 24px;'></div>", unsafe_allow_html=True)

    # Sensitivity Chart (Altair)
    st.subheader("Scenario Sensitivity Chart")
    st.caption("Visualizing required migration timeline (X+Y) versus quantum vulnerability horizons (Z remaining).")

    chart_rows = []
    for item in ranked_assets:
        if item["z_remaining_central"] is not None:
            chart_rows.append({
                "Asset": f"#{item['rank']} {item['asset_name']}",
                "X_plus_Y": item["x_plus_y"],
                "Z_earliest": item["z_remaining_earliest"],
                "Z_central": item["z_remaining_central"],
                "Z_latest": item["z_remaining_latest"],
                "Verdict": item["verdict_code"],
            })

    if chart_rows:
        cdf = pd.DataFrame(chart_rows)

        # Base bar for X+Y
        bars = alt.Chart(cdf).mark_bar(opacity=0.75, height=20).encode(
            y=alt.Y("Asset:N", sort=None, title="Cryptographic Asset"),
            x=alt.X("X_plus_Y:Q", title="Years"),
            color=alt.Color("Verdict:N", scale=alt.Scale(
                domain=["RED", "YELLOW", "GREEN"],
                range=["#E5484D", "#F5B301", "#2EB872"],
            ), legend=alt.Legend(title="Verdict")),
            tooltip=["Asset", "Verdict", "X_plus_Y"],
        )

        # Marker for Earliest
        m_early = alt.Chart(cdf).mark_tick(color="#DC2626", size=24, thickness=3).encode(
            y=alt.Y("Asset:N", sort=None),
            x=alt.X("Z_earliest:Q"),
            tooltip=[alt.Tooltip("Z_earliest", title="Z Earliest (yrs)")],
        )

        # Marker for Central
        m_central = alt.Chart(cdf).mark_tick(color="#4F46E5", size=24, thickness=3).encode(
            y=alt.Y("Asset:N", sort=None),
            x=alt.X("Z_central:Q"),
            tooltip=[alt.Tooltip("Z_central", title="Z Central (yrs)")],
        )

        # Marker for Latest
        m_latest = alt.Chart(cdf).mark_tick(color="#059669", size=24, thickness=3).encode(
            y=alt.Y("Asset:N", sort=None),
            x=alt.X("Z_latest:Q"),
            tooltip=[alt.Tooltip("Z_latest", title="Z Latest (yrs)")],
        )

        chart = (bars + m_early + m_central + m_latest).properties(
            height=max(240, len(chart_rows) * 45),
            width="container",
        )
        st.altair_chart(chart, use_container_width=True)
        st.caption("Tick legend: Red tick = Earliest scenario break; Blue tick = Central scenario break; Green tick = Latest scenario break.")
    else:
        st.info("No quantum-vulnerable public key assets to display in sensitivity chart.")

    # Expandable "How this works"
    with st.expander("How this works"):
        st.markdown(
            """
            ### Mosca's Inequality: X + Y > Z
            - **X (Shelf-Life):** How many years customer, patient, or corporate records must remain confidential.
            - **Y (Migration Time):** How many years your organisation needs to identify keys, re-architect systems, audit code, and deploy post-quantum standards.
            - **Z (Quantum Horizon):** Years until an adversary's quantum computing capacity is sufficient to break the public-key algorithm via Shor's algorithm.
            
            Because quantum hardware development is uncertain, Q-Day Compass models three scenarios:
            - **Earliest:** Aggressive error-corrected scale-up (~8 years from 2026 for RSA-2048)
            - **Central:** Baseline engineering consensus trajectory (~12 years from 2026 for RSA-2048)
            - **Latest:** Slower hardware scaling (~20 years from 2026 for RSA-2048)
            
            If `X + Y > Z_remaining(central)`, the verdict is **RED** (late under baseline expectations).  
            If `X + Y > Z_remaining(earliest)`, the verdict is **YELLOW** (at risk under aggressive timelines).  
            Otherwise, the verdict is **GREEN** (safe).
            """
        )


# ==============================================================================
# PAGE 2: SHOR'S ALGORITHM DEMO
# ==============================================================================
elif page == "Shor's Algorithm Demo":
    st.title("Quantum Mechanism: Shor's Order-Finding Simulation")
    st.caption("Demonstrating how quantum phase estimation finds period r to factor composite numbers.")

    st.markdown(
        """
        <div class="banner-disclaimer">
            <strong>Important Mechanism Note:</strong> This factors a toy number to show the mechanism. It does not break real keys. Breaking RSA-2048 is estimated to need under one million noisy qubits.
        </div>
        """,
        unsafe_allow_html=True,
    )

    col_in1, col_in2, col_in3 = st.columns(3)
    with col_in1:
        n_choice = st.selectbox("Number to factor (N)", [15, 21], index=0)
    with col_in2:
        default_base = 7 if n_choice == 15 else 2
        custom_base = st.number_input("Base 'a' (coprime to N)", min_value=2, max_value=n_choice - 1, value=default_base, step=1)
    with col_in3:
        shots = st.slider("Simulation Shots", min_value=128, max_value=4096, value=1024, step=128)

    if st.button("Run on simulator", type="primary"):
        with st.spinner(f"Simulating Shor's circuit for N={n_choice} with base a={custom_base} on Qiskit Aer..."):
            sim_res = factor(N=n_choice, a=int(custom_base), shots=shots, seed=42)

        st.success(f"Simulation completed! Success: {sim_res['success']}")

        c1, c2, c3, c4 = st.columns(4)
        with c1:
            st.metric("Factors Found", f"{sim_res['factors']}")
        with c2:
            st.metric("Discovered Period (r)", f"{sim_res['period']}")
        with c3:
            st.metric("Qubits Used", f"{sim_res['num_qubits']}")
        with c4:
            st.metric("Circuit Depth", f"{sim_res['circuit_depth']}")

        st.info(sim_res["explanation"])

        # Histogram of measurements
        if sim_res["counts"]:
            st.subheader("Measurement Histogram (Counting Register)")
            hist_data = pd.DataFrame([
                {"Bitstring": k, "Counts": v, "Phase": int(k, 2) / (2**8)}
                for k, v in list(sim_res["counts"].items())[:12]
            ])
            hist_chart = alt.Chart(hist_data).mark_bar(color="#B48AF7").encode(
                x=alt.X("Bitstring:N", sort="-y", title="Measured Bitstring"),
                y=alt.Y("Counts:Q", title="Shot Frequency"),
                tooltip=["Bitstring", "Counts", "Phase"],
            ).properties(height=300)
            st.altair_chart(hist_chart, use_container_width=True)

        # Circuit Diagram
        with st.expander("View Quantum Circuit"):
            st.text(sim_res["circuit_diagram"])


# ==============================================================================
# PAGE 3: ASSUMPTIONS AND LIMITATIONS
# ==============================================================================
elif page == "Assumptions & Limitations":
    st.title("Model Assumptions & Provenance")
    st.caption("Every numerical parameter is grounded in peer-reviewed literature or explicitly flagged as illustrative.")

    # Assumptions Table
    rows = get_assumptions_table(config)
    df_assumptions = pd.DataFrame(rows)

    def color_status(val):
        if val == "from_paper":
            return "background-color: #D1FAE5; color: #065F46; font-weight: 600;"
        elif val == "illustrative":
            return "background-color: #FEF3C7; color: #92400E; font-weight: 600;"
        elif val == "derived":
            return "background-color: #EEF2FF; color: #3730A3; font-weight: 600;"
        return ""

    styled_assumptions = df_assumptions.style.map(color_status, subset=["status"])
    st.dataframe(styled_assumptions, use_container_width=True, hide_index=True)

    st.markdown("---")
    st.subheader("Scope, Assumptions & Known Limitations")
    st.markdown(
        """
        1. **Planning estimates, not predictions:**
           Quantum computing milestones depend on unpredictable physics, engineering yields, error correction thresholds, and hardware scaling breakthroughs. These scenarios model plausible bounds for risk management, not guaranteed calendar dates.
           
        2. **Inventory entered by the user:**
           Q-Day Compass prioritizes user-supplied cryptographic inventories. It is not an automated network key scanner or endpoint probe.
           
        3. **Public-key cryptography focus:**
           Shor's algorithm completely breaks discrete log and integer factorization schemes (RSA, ECC, ECDSA). Symmetric algorithms (AES-256) and secure hashes (SHA-2, SHA-3) only suffer Grover quadratic speedups and remain secure with 256-bit keys. They are treated as out-of-scope in v1.
           
        4. **Encryption versus Signature keys:**
           - *Confidential data / Encryption keys* are subject to **Harvest Now, Decrypt Later (HNDL)** attacks right now. If shelf-life $X + Y > Z$, past traffic already harvested is at risk.
           - *Signature keys* are at risk only when forgery becomes practically feasible in real-time, not from historical packet capture. Version 1 uses the same conservative Mosca rule for simplicity; future versions will model signature forgery deadlines separately.
           
        5. **Diagnoses but does not migrate:**
           Q-Day Compass generates an actionable urgency roadmap and priority sequence. The actual migration involves implementing NIST PQC standards (FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205 SLH-DSA) within application libraries, PKI, and network protocols.
        """
    )
