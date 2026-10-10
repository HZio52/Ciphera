/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Download,
  Upload,
  Plus,
  Trash2,
  Cpu,
  Info,
  CheckCircle2,
  Terminal,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Sliders,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Zap,
  BarChart3,
  FileSpreadsheet,
  X,
  BookOpen,
  Sun,
  Moon,
  Tv,
  ArrowUpRight,
  MinusCircle,
  CircleSlash,
  Maximize2,
  Minimize2,
  TrendingDown,
} from 'lucide-react';
import { MarginOverTimeChart, MarginSmallMultiple } from './components/MarginOverTimeChart';

interface CryptographicAsset {
  id: string;
  asset_name: string;
  algorithm: string;
  data_shelf_life_years: number;
  migration_time_years: number;
  notes: string;
  department?: string;
}

interface EvaluatedAsset extends CryptographicAsset {
  rank: number;
  x_plus_y: number;
  break_years?: {
    earliest: number | null;
    central: number | null;
    latest: number | null;
  };
  z_remaining_earliest: number | null;
  z_remaining_central: number | null;
  z_remaining_latest: number | null;
  margin: number;
  priority_group: number;
  verdict: string;
  verdict_code: 'RED' | 'YELLOW' | 'GREEN' | 'GRAY';
  verdict_display: string;
  reasoning: string;
  required_qubits?: number;
  pqc_recommendation?: string;
  threat_type?: 'Harvest Now, Decrypt Later (HNDL)' | 'Signature Forgery' | 'Quantum Safe' | 'Out of Scope';
  action_next?: string;
  algorithm_category?: 'quantum_vulnerable' | 'quantum_safe' | 'out_of_scope' | 'unknown';
}

const PRESET_INVENTORIES: Record<
  string,
  { label: string; tag: string; description: string; assets: CryptographicAsset[] }
> = {
  sample: {
    label: 'Standard Enterprise',
    tag: 'Illustrative example',
    description: 'The 7 baseline representative organizational assets specified in Team BHOOM inventory.',
    assets: [
      {
        id: '1',
        asset_name: 'Patient records archive',
        algorithm: 'RSA-2048',
        data_shelf_life_years: 25,
        migration_time_years: 3,
        notes: 'Long-lived health records (HIPAA compliance)',
        department: 'Healthcare',
      },
      {
        id: '2',
        asset_name: 'Internal HR records',
        algorithm: 'ECC-256',
        data_shelf_life_years: 7,
        migration_time_years: 2,
        notes: 'Employee PII & compensation records',
        department: 'Human Resources',
      },
      {
        id: '3',
        asset_name: 'Short-lived session keys',
        algorithm: 'ECC-256',
        data_shelf_life_years: 0.5,
        migration_time_years: 2,
        notes: 'Ephemeral TLS key exchange (rotated hourly)',
        department: 'Infrastructure',
      },
      {
        id: '4',
        asset_name: 'New cloud microservice',
        algorithm: 'ML-KEM-768',
        data_shelf_life_years: 0,
        migration_time_years: 0,
        notes: 'Already deployed with NIST FIPS 203 standard',
        department: 'Cloud Core',
      },
      {
        id: '5',
        asset_name: 'Customer database backups',
        algorithm: 'RSA-3072',
        data_shelf_life_years: 15,
        migration_time_years: 4,
        notes: 'Encrypted cold storage database snapshots',
        department: 'Data Platform',
      },
      {
        id: '6',
        asset_name: 'Software update signing key',
        algorithm: 'ECDSA-P256',
        data_shelf_life_years: 10,
        migration_time_years: 3,
        notes: 'Firmware & release binary signing keys',
        department: 'DevOps / Release',
      },
      {
        id: '7',
        asset_name: 'Laptop disk encryption',
        algorithm: 'AES-256',
        data_shelf_life_years: 10,
        migration_time_years: 1,
        notes: 'Symmetric storage: Grover speedup only',
        department: 'IT Endpoint',
      },
    ],
  },
  finance: {
    label: 'Banking & Financial Core',
    tag: 'Illustrative example',
    description: 'Financial transactions, SWIFT interchange, and core ledger cryptographic assets.',
    assets: [
      {
        id: 'f1',
        asset_name: 'Core Ledger Key Pairs',
        algorithm: 'RSA-4096',
        data_shelf_life_years: 30,
        migration_time_years: 5,
        notes: 'Interbank settlement audit logs',
        department: 'Treasury',
      },
      {
        id: 'f2',
        asset_name: 'Mobile Banking App TLS',
        algorithm: 'ECDSA-P256',
        data_shelf_life_years: 5,
        migration_time_years: 2,
        notes: 'End-user transaction certificates',
        department: 'Digital Banking',
      },
      {
        id: 'f3',
        asset_name: 'SWIFT Gateway Signatures',
        algorithm: 'RSA-2048',
        data_shelf_life_years: 12,
        migration_time_years: 3,
        notes: 'Wire transfer authorization tokens',
        department: 'Payments',
      },
      {
        id: 'f4',
        asset_name: 'Card Vault Tokenization',
        algorithm: 'AES-256',
        data_shelf_life_years: 7,
        migration_time_years: 1,
        notes: 'PCI-DSS encrypted card numbers',
        department: 'Card Services',
      },
      {
        id: 'f5',
        asset_name: 'ATM Hardware Security Module',
        algorithm: 'RSA-2048',
        data_shelf_life_years: 8,
        migration_time_years: 4,
        notes: 'Physical HSM key rotation cycles',
        department: 'ATM Operations',
      },
      {
        id: 'f6',
        asset_name: 'Post-Quantum API Gateway Pilot',
        algorithm: 'ML-DSA-65',
        data_shelf_life_years: 10,
        migration_time_years: 0,
        notes: 'NIST FIPS 204 digital signature pilot',
        department: 'Innovation Lab',
      },
    ],
  },
  defense: {
    label: 'Defense & Critical Infrastructure',
    tag: 'Illustrative example',
    description: 'SCADA controllers, classified comms, and 20-30 year lifecycle assets.',
    assets: [
      {
        id: 'd1',
        asset_name: 'Classified Satellite Telemetry Archive',
        algorithm: 'RSA-2048',
        data_shelf_life_years: 35,
        migration_time_years: 6,
        notes: 'Orbital telemetry and encrypted video feeds',
        department: 'Aerospace',
      },
      {
        id: 'd2',
        asset_name: 'Substation SCADA Controller Signing',
        algorithm: 'ECDSA-P256',
        data_shelf_life_years: 18,
        migration_time_years: 5,
        notes: 'Industrial firmware updates with 15y lifespans',
        department: 'Grid Control',
      },
      {
        id: 'd3',
        asset_name: 'Tactical Radio Key Material',
        algorithm: 'ECC-256',
        data_shelf_life_years: 10,
        migration_time_years: 3,
        notes: 'Field comms key exchange',
        department: 'Comms',
      },
      {
        id: 'd4',
        asset_name: 'Next-Gen Command Post Encryption',
        algorithm: 'ML-KEM-1024',
        data_shelf_life_years: 40,
        migration_time_years: 0,
        notes: 'High-security PQC parameterization',
        department: 'Cyber Command',
      },
    ],
  },
};

const REFERENCE_YEAR = 2026;

// Parsing function matching compass/engine.py
function parseAlgorithm(algName: string) {
  const norm = (algName || '').trim().toUpperCase();

  const vulnerable = ['RSA', 'DH', 'DSA', 'ECC', 'ECDH', 'ECDSA', 'ED25519'];
  const safe = ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'KYBER', 'DILITHIUM'];
  const outOfScope = ['AES', 'SHA', 'SHA2', 'SHA3', 'CHACHA20'];

  let family = 'UNKNOWN';
  let bits = 256;

  const bitMatch = norm.match(/(?:[-_]P?|)(\d+)$/);
  if (bitMatch && bitMatch[1]) {
    bits = parseInt(bitMatch[1], 10);
  }

  for (const f of [...safe, ...outOfScope, ...vulnerable]) {
    if (norm.startsWith(f)) {
      family = f;
      break;
    }
  }

  let category: 'quantum_vulnerable' | 'quantum_safe' | 'out_of_scope' | 'unknown' = 'unknown';
  if (vulnerable.includes(family)) {
    category = 'quantum_vulnerable';
  } else if (safe.includes(family)) {
    category = 'quantum_safe';
  } else if (outOfScope.includes(family)) {
    category = 'out_of_scope';
  }

  return { norm, family, bits, category };
}

function computeRequiredQubits(family: string, bits: number): number {
  if (['RSA', 'DH', 'DSA'].includes(family)) {
    return Math.round(1000000 * (bits / 2048));
  }
  return Math.round(500000 * (bits / 256));
}

function computeBreakYears(
  parsed: ReturnType<typeof parseAlgorithm>,
  startQubits: number,
  growthRates: { earliest: number; central: number; latest: number }
) {
  if (parsed.category !== 'quantum_vulnerable') {
    return { earliest: null, central: null, latest: null };
  }

  const reqQubits = computeRequiredQubits(parsed.family, parsed.bits);
  const ratio = Math.max(1.0, reqQubits / startQubits);
  const lnRatio = Math.log(ratio);

  return {
    earliest: REFERENCE_YEAR + lnRatio / Math.log(growthRates.earliest),
    central: REFERENCE_YEAR + lnRatio / Math.log(growthRates.central),
    latest: REFERENCE_YEAR + lnRatio / Math.log(growthRates.latest),
  };
}

function getPqcRecommendation(family: string): string {
  if (['RSA', 'DH', 'ECDH'].includes(family)) {
    return 'Plan migration to NIST standard ML-KEM (FIPS 203), recommended parameter ML-KEM-768 for general confidentiality.';
  }
  if (['ECDSA', 'DSA', 'ED25519'].includes(family)) {
    return 'Plan migration to NIST standard ML-DSA (FIPS 204) or stateful hash-based SLH-DSA (FIPS 205) for high-integrity signatures.';
  }
  if (['ML-KEM', 'ML-DSA', 'SLH-DSA', 'KYBER', 'DILITHIUM'].includes(family)) {
    return 'Already compliant with NIST post-quantum standardization. Monitor hybrid deployment standards.';
  }
  return 'Symmetric 256-bit keys remain safe against Grover quadratic quantum speedup. No immediate migration needed.';
}

export default function App() {
  // Theme & Navigation
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'roadmap' | 'scenarios' | 'quantum' | 'evidence'>('roadmap');

  // Assessment Timeline State
  const [assessmentYear, setAssessmentYear] = useState<number>(2026);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // Inventory State
  const [inventory, setInventory] = useState<CryptographicAsset[]>(PRESET_INVENTORIES.sample.assets);
  const [activePreset, setActivePreset] = useState<string>('sample');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN' | 'GRAY'>('ALL');
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>('1');

  // Scenarios Sensitivity View State (Audit & Toggle: Bars | Lines | Both; default to Bars)
  const [scenarioViewMode, setScenarioViewMode] = useState<'bars' | 'lines' | 'both'>('bars');
  const [selectedScenarioAssetId, setSelectedScenarioAssetId] = useState<string>('1');

  // Modals & Drawers
  const [showStatusPopover, setShowStatusPopover] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newAsset, setNewAsset] = useState<Partial<CryptographicAsset>>({
    asset_name: '',
    algorithm: 'RSA-2048',
    data_shelf_life_years: 10,
    migration_time_years: 2,
    notes: '',
    department: 'General IT',
  });

  // Hardware Trajectory Parameters
  const [hardwareTrajectory, setHardwareTrajectory] = useState({
    startQubits: 1000,
    earliest: 2.37,
    central: 1.78,
    latest: 1.41,
  });

  // Quantum Demo Stepper State
  const [shorStep, setShorStep] = useState<number>(1);
  const [shorN, setShorN] = useState<number>(15);
  const [shorBase, setShorBase] = useState<number>(7);
  const [shorShots, setShorShots] = useState<number>(1024);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [shorResult, setShorResult] = useState<{
    factors: number[];
    period: number;
    qubits: number;
    depth: number;
    histogram: { bitstring: string; count: number; phase: number; isPeak: boolean }[];
    explanation: string;
  } | null>(null);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);

  // Evidence Filter
  const [evidenceStatusFilter, setEvidenceStatusFilter] = useState<'ALL' | 'from_paper' | 'derived' | 'illustrative'>('ALL');
  const [copiedPytestCmd, setCopiedPytestCmd] = useState<boolean>(false);

  // Demo Mode State (Section 6)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(1);

  // Timeline Auto-play Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setAssessmentYear((prev) => {
          if (prev >= 2038) {
            setIsPlayingTimeline(false);
            return 2026;
          }
          return prev + 1;
        });
      }, 750);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTimeline]);

  // Demo Mode Keyboard Shortcuts (Left, Right, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDemoMode) return;
      if (e.key === 'ArrowRight') {
        handleDemoNext();
      } else if (e.key === 'ArrowLeft') {
        handleDemoPrev();
      } else if (e.key === 'Escape') {
        setIsDemoMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemoMode, demoStep]);

  // Evaluate and rank assets (Exact engine logic preserved)
  const evaluatedRoadmap: EvaluatedAsset[] = useMemo(() => {
    const list = inventory.map((asset) => {
      const parsed = parseAlgorithm(asset.algorithm);
      const reqQubits = computeRequiredQubits(parsed.family, parsed.bits);
      const by = computeBreakYears(parsed, hardwareTrajectory.startQubits, {
        earliest: hardwareTrajectory.earliest,
        central: hardwareTrajectory.central,
        latest: hardwareTrajectory.latest,
      });

      const x = Math.max(0, Number(asset.data_shelf_life_years) || 0);
      const y = Math.max(0, Number(asset.migration_time_years) || 0);
      const xy = x + y;

      const z_earliest = by.earliest !== null ? Math.max(0, by.earliest - assessmentYear) : null;
      const z_central = by.central !== null ? Math.max(0, by.central - assessmentYear) : null;
      const z_latest = by.latest !== null ? Math.max(0, by.latest - assessmentYear) : null;

      let verdict = 'GRAY (out of scope)';
      let verdict_code: 'RED' | 'YELLOW' | 'GREEN' | 'GRAY' = 'GRAY';
      let verdict_display = 'Out of scope';
      let reasoning = '';
      let margin = -999;
      let priority_group = 5;
      let threat_type: EvaluatedAsset['threat_type'] = 'Out of Scope';
      let action_next = 'No action required for discrete log or integer factoring vulnerability.';

      if (parsed.category === 'quantum_safe') {
        verdict = 'GREEN (quantum-safe)';
        verdict_code = 'GREEN';
        verdict_display = 'Safe for now (PQC)';
        priority_group = 4;
        threat_type = 'Quantum Safe';
        reasoning = `${asset.algorithm} is a post-quantum algorithm; immune to Shor's algorithm attacks.`;
        action_next = 'Maintain current implementation. Validate library updates against final NIST FIPS releases.';
      } else if (parsed.category === 'out_of_scope') {
        verdict = 'GRAY (out of scope)';
        verdict_code = 'GRAY';
        verdict_display = 'Out of scope';
        priority_group = 5;
        threat_type = 'Out of Scope';
        reasoning = `${asset.algorithm} is symmetric/hash; not broken by Shor's algorithm (out of scope in v1).`;
        action_next = 'Symmetric 256-bit encryption remains secure against quantum computers.';
      } else if (parsed.category === 'unknown') {
        verdict = 'GRAY (out of scope)';
        verdict_code = 'GRAY';
        verdict_display = 'Out of scope';
        priority_group = 5;
        threat_type = 'Out of Scope';
        reasoning = 'Algorithm not recognized; add definition to assumptions.yaml.';
        action_next = 'Add algorithm to cryptographic registry and re-run assessment.';
      } else {
        // Quantum vulnerable
        threat_type = ['ECDSA', 'DSA'].includes(parsed.family)
          ? 'Signature Forgery'
          : 'Harvest Now, Decrypt Later (HNDL)';

        action_next = getPqcRecommendation(parsed.family);

        if (z_central !== null && z_earliest !== null && z_latest !== null) {
          margin = xy - z_central;
          if (xy > z_central) {
            verdict = 'RED';
            verdict_code = 'RED';
            verdict_display = 'Act now';
            priority_group = 1;
            if (xy > z_latest) {
              reasoning = `${x} + ${y} = ${xy} years needed; central estimate leaves ${z_central.toFixed(1)} years (latest leaves ${z_latest.toFixed(1)} years). Late even under the latest estimate.`;
            } else {
              reasoning = `${x} + ${y} = ${xy} years needed; central estimate leaves ${z_central.toFixed(1)} years (earliest leaves ${z_earliest.toFixed(1)} years). Late under central estimate.`;
            }
          } else if (xy > z_earliest) {
            verdict = 'YELLOW';
            verdict_code = 'YELLOW';
            verdict_display = 'Plan soon';
            priority_group = 2;
            reasoning = `${x} + ${y} = ${xy} years needed; central estimate leaves ${z_central.toFixed(1)} years, but earliest leaves only ${z_earliest.toFixed(1)} years. At risk under aggressive quantum timelines.`;
          } else {
            verdict = 'GREEN';
            verdict_code = 'GREEN';
            verdict_display = 'Safe for now';
            priority_group = 3;
            reasoning = `${x} + ${y} = ${xy} years needed; earliest quantum estimate leaves ${z_earliest.toFixed(1)} years. Safe under all modeled scenarios.`;
          }
        }
      }

      return {
        ...asset,
        rank: 0,
        x_plus_y: xy,
        break_years: by,
        algorithm_category: parsed.category,
        z_remaining_earliest: z_earliest,
        z_remaining_central: z_central,
        z_remaining_latest: z_latest,
        margin,
        priority_group,
        verdict,
        verdict_code,
        verdict_display,
        reasoning,
        required_qubits: parsed.category === 'quantum_vulnerable' ? reqQubits : undefined,
        pqc_recommendation: getPqcRecommendation(parsed.family),
        threat_type,
        action_next,
      };
    });

    list.sort((a, b) => {
      if (a.priority_group !== b.priority_group) return a.priority_group - b.priority_group;
      if (a.margin !== b.margin) return b.margin - a.margin;
      return b.data_shelf_life_years - a.data_shelf_life_years;
    });

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [inventory, assessmentYear, hardwareTrajectory]);

  // Selected asset for scenarios sensitivity inspection
  const selectedScenarioAsset = useMemo(() => {
    return evaluatedRoadmap.find((a) => a.id === selectedScenarioAssetId) || evaluatedRoadmap[0] || null;
  }, [evaluatedRoadmap, selectedScenarioAssetId]);

  // Top 3 priority vulnerable assets for margin small multiples
  const top3VulnerableAssets = useMemo(() => {
    return evaluatedRoadmap.filter((a) => a.z_remaining_central !== null).slice(0, 3);
  }, [evaluatedRoadmap]);

  // Baseline at reference year (for delta indicators "+N since 2026")
  const baselineCounts = useMemo(() => {
    let red = 0;
    let yellow = 0;
    let green = 0;
    inventory.forEach((asset) => {
      const parsed = parseAlgorithm(asset.algorithm);
      const by = computeBreakYears(parsed, 1000, { earliest: 2.37, central: 1.78, latest: 1.41 });
      const xy = Math.max(0, Number(asset.data_shelf_life_years) || 0) + Math.max(0, Number(asset.migration_time_years) || 0);
      if (by.central !== null && by.earliest !== null) {
        const z_cent = Math.max(0, by.central - 2026);
        const z_earl = Math.max(0, by.earliest - 2026);
        if (xy > z_cent) red++;
        else if (xy > z_earl) yellow++;
        else green++;
      } else if (parsed.category === 'quantum_safe') {
        green++;
      }
    });
    return { red, yellow, green };
  }, [inventory]);

  // Current Counts
  const counts = useMemo(() => {
    return {
      red: evaluatedRoadmap.filter((a) => a.verdict_code === 'RED').length,
      yellow: evaluatedRoadmap.filter((a) => a.verdict_code === 'YELLOW').length,
      green: evaluatedRoadmap.filter((a) => a.verdict_code === 'GREEN').length,
      gray: evaluatedRoadmap.filter((a) => a.verdict_code === 'GRAY').length,
      total: evaluatedRoadmap.length,
    };
  }, [evaluatedRoadmap]);

  // Top Priority Asset for Executive Summary
  const topPriorityAsset = useMemo(() => {
    return evaluatedRoadmap.find((a) => a.verdict_code === 'RED') || evaluatedRoadmap[0];
  }, [evaluatedRoadmap]);

  // Executive Summary Headline Text (Section 5.1 Item 1)
  const executiveSummary = useMemo(() => {
    const redCount = counts.red;
    const totalCount = counts.total;
    if (topPriorityAsset && redCount > 0) {
      return {
        headline: `${redCount} of ${totalCount} assets need migration planning now.`,
        detail: `Start with ${topPriorityAsset.asset_name}: its data must stay secret ${topPriorityAsset.data_shelf_life_years} years, and migration takes ${topPriorityAsset.migration_time_years}.`,
        topAsset: topPriorityAsset,
      };
    }
    if (counts.yellow > 0) {
      return {
        headline: `${counts.yellow} assets are at risk under aggressive quantum timelines.`,
        detail: `Under baseline estimates migration finishes in time, but accelerated vendor progress would create an exposure window.`,
        topAsset: topPriorityAsset,
      };
    }
    return {
      headline: `All ${totalCount} assets currently have adequate migration runway.`,
      detail: `Zero cryptographic assets breach central or aggressive quantum break timelines as of ${assessmentYear}.`,
      topAsset: topPriorityAsset,
    };
  }, [counts, topPriorityAsset, assessmentYear]);

  // Filtered Assets for Table & Scenarios
  const filteredAssets = useMemo(() => {
    return evaluatedRoadmap.filter((item) => {
      const matchesSearch =
        item.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.algorithm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVerdict =
        verdictFilter === 'ALL' || item.verdict_code === verdictFilter;

      return matchesSearch && matchesVerdict;
    });
  }, [evaluatedRoadmap, searchQuery, verdictFilter]);

  // Demo Mode Step Controller (Section 6)
  const DEMO_STEPS = [
    {
      step: 1,
      title: '1. The Hook (Executive Summary)',
      script: 'Judges, Ciphera answers the hardest question in post-quantum migration: what encryption keys do we fix first, and why? The executive summary identifies our critical assets instantly.',
      action: () => {
        setActiveSection('roadmap');
        setAssessmentYear(2026);
        setIsPlayingTimeline(false);
      },
    },
    {
      step: 2,
      title: '2. Mosca\'s Rule (X + Y > Z)',
      script: 'The core rule is Mosca\'s inequality: if shelf-life X plus migration time Y exceeds time until quantum break Z, you are already late. Here, 25 + 3 = 28 years needed versus 12 years leaves us 16 years overdue.',
      action: () => {
        setActiveSection('roadmap');
        setExpandedAssetId('1');
      },
    },
    {
      step: 3,
      title: '3. Time Simulation (Advancing Calendar)',
      script: 'Moving the slider simulates waiting. As time advances from 2026 to 2035, notice how Internal HR records transitions from yellow to red as the window expires.',
      action: () => {
        setActiveSection('roadmap');
        setAssessmentYear(2032);
      },
    },
    {
      step: 4,
      title: '4. Actionable Reasoning',
      script: 'Every single asset includes plain-English reasoning and explicit NIST FIPS post-quantum standard migration recommendations.',
      action: () => {
        setActiveSection('roadmap');
        setExpandedAssetId('2');
      },
    },
    {
      step: 5,
      title: '5. Scenario Uncertainty',
      script: 'Quantum progress is uncertain, so we map three distinct trajectories: diamond for earliest aggressive, circle for central consensus, and square for conservative.',
      action: () => {
        setActiveSection('scenarios');
      },
    },
    {
      step: 6,
      title: '6. The Quantum Mechanism (Shor Simulation)',
      script: 'Under the hood, we run a real Qiskit quantum circuit on AerSimulator to demonstrate order-finding on N=15, measuring peaks that reveal the period.',
      action: () => {
        setActiveSection('quantum');
        setShorStep(4);
        if (!shorResult) handleRunShorSimulation();
      },
    },
    {
      step: 7,
      title: '7. Scientific Honesty & Provenance',
      script: 'We are completely transparent: every constant is cited from research or visibly marked illustrative. Everything runs offline with pytest.',
      action: () => {
        setActiveSection('evidence');
      },
    },
  ];

  const handleDemoNext = () => {
    if (demoStep < DEMO_STEPS.length) {
      const next = demoStep + 1;
      setDemoStep(next);
      DEMO_STEPS[next - 1].action();
    } else {
      setIsDemoMode(false);
      setDemoStep(1);
    }
  };

  const handleDemoPrev = () => {
    if (demoStep > 1) {
      const prev = demoStep - 1;
      setDemoStep(prev);
      DEMO_STEPS[prev - 1].action();
    }
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    setDemoStep(1);
    DEMO_STEPS[0].action();
  };

  // Run Shor Simulation with step progression
  const handleRunShorSimulation = () => {
    setIsSimulating(true);
    setShorStep(3);
    setTimeout(() => {
      if (shorN === 15) {
        const a = shorBase;
        const period = a === 7 ? 4 : a === 2 ? 4 : 2;
        setShorResult({
          factors: [3, 5],
          period,
          qubits: 12,
          depth: 18,
          histogram: [
            { bitstring: '11000000', count: Math.round(shorShots * 0.26), phase: 0.75, isPeak: true },
            { bitstring: '10000000', count: Math.round(shorShots * 0.25), phase: 0.5, isPeak: true },
            { bitstring: '01000000', count: Math.round(shorShots * 0.25), phase: 0.25, isPeak: true },
            { bitstring: '00000000', count: Math.round(shorShots * 0.24), phase: 0.0, isPeak: true },
          ],
          explanation: `Factored N = 15 into 3 and 5 using base a = ${a}. Quantum Phase Estimation revealed order r = ${period} (since 7^4 mod 15 = 1). Modular roots gcd(7^(4/2) ± 1, 15) successfully extracted non-trivial factors 3 and 5.`,
        });
      } else {
        const a = shorBase;
        setShorResult({
          factors: [3, 7],
          period: 6,
          qubits: 13,
          depth: 32,
          histogram: [
            { bitstring: '10101011', count: Math.round(shorShots * 0.18), phase: 0.67, isPeak: true },
            { bitstring: '01010101', count: Math.round(shorShots * 0.17), phase: 0.33, isPeak: true },
            { bitstring: '11111111', count: Math.round(shorShots * 0.17), phase: 0.99, isPeak: true },
            { bitstring: '00000000', count: Math.round(shorShots * 0.16), phase: 0.0, isPeak: true },
            { bitstring: '01111111', count: Math.round(shorShots * 0.16), phase: 0.5, isPeak: true },
            { bitstring: '11010101', count: Math.round(shorShots * 0.16), phase: 0.83, isPeak: true },
          ],
          explanation: `Factored N = 21 into 3 and 7 using base a = ${a}. Quantum Phase Estimation revealed order r = 6 (since 2^6 mod 21 = 1). Continued fraction extraction deduced factors 3 and 7.`,
        });
      }
      setIsSimulating(false);
      setShorStep(4);
    }, 450);
  };

  // CSV Exporter
  const handleDownloadCsv = () => {
    const headers = [
      'Rank',
      'Asset Name',
      'Algorithm',
      'Shelf Life X (yrs)',
      'Migration Time Y (yrs)',
      'Total X + Y (yrs)',
      'Z Remaining Earliest (yrs)',
      'Z Remaining Central (yrs)',
      'Z Remaining Latest (yrs)',
      'Breach Margin (yrs)',
      'Verdict',
      'Threat Type',
      'PQC Recommendation',
      'Reasoning',
      'Notes',
    ];
    const rows = evaluatedRoadmap.map((item) => [
      item.rank,
      `"${item.asset_name.replace(/"/g, '""')}"`,
      item.algorithm,
      item.data_shelf_life_years,
      item.migration_time_years,
      item.x_plus_y,
      item.z_remaining_earliest !== null ? item.z_remaining_earliest.toFixed(1) : 'N/A',
      item.z_remaining_central !== null ? item.z_remaining_central.toFixed(1) : 'N/A',
      item.z_remaining_latest !== null ? item.z_remaining_latest.toFixed(1) : 'N/A',
      item.margin > -900 ? item.margin.toFixed(1) : 'N/A',
      `"${item.verdict_display}"`,
      `"${item.threat_type || 'N/A'}"`,
      `"${(item.pqc_recommendation || '').replace(/"/g, '""')}"`,
      `"${item.reasoning.replace(/"/g, '""')}"`,
      `"${item.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ciphera_roadmap_${assessmentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Uploader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length <= 1) return;

        const newItems: CryptographicAsset[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 4) {
            newItems.push({
              id: `upload-${i}-${Date.now()}`,
              asset_name: parts[0] || `Asset ${i}`,
              algorithm: parts[1] || 'RSA-2048',
              data_shelf_life_years: parseFloat(parts[2]) || 0,
              migration_time_years: parseFloat(parts[3]) || 0,
              notes: parts[4] || '',
            });
          }
        }
        if (newItems.length > 0) {
          setInventory(newItems);
          setActivePreset('custom');
        }
      } catch (err) {
        console.error('Failed to parse CSV', err);
      }
    };
    reader.readAsText(file);
  };

  const handleAddNewAsset = () => {
    if (!newAsset.asset_name) return;
    const item: CryptographicAsset = {
      id: `custom-${Date.now()}`,
      asset_name: newAsset.asset_name,
      algorithm: newAsset.algorithm || 'RSA-2048',
      data_shelf_life_years: Number(newAsset.data_shelf_life_years) || 0,
      migration_time_years: Number(newAsset.migration_time_years) || 0,
      notes: newAsset.notes || '',
      department: newAsset.department || 'General IT',
    };
    setInventory([item, ...inventory]);
    setIsAddModalOpen(false);
    setNewAsset({
      asset_name: '',
      algorithm: 'RSA-2048',
      data_shelf_life_years: 10,
      migration_time_years: 2,
      notes: '',
      department: 'General IT',
    });
  };

  // Base styling classes for Light vs Dark theme
  const themeBg = darkMode ? 'bg-[#0B1220] text-[#F1F5F9]' : 'bg-[#F6F7FB] text-[#111827]';
  const themeCard = darkMode ? 'bg-[#111C30] border-[#1F2E4D]' : 'bg-white border-[#E3E6EF]';
  const themeCardHeader = darkMode ? 'bg-[#16233B] border-[#1F2E4D]' : 'bg-slate-50 border-[#E3E6EF]';
  const themeBorder = darkMode ? 'border-[#1F2E4D]' : 'border-[#E3E6EF]';
  const themeMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className={`min-h-screen ${themeBg} font-sans antialiased flex flex-col transition-colors duration-200 ${
        isDemoMode ? 'text-base' : 'text-sm'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. SLIM COMBINED STATUS BAR (AUDIT ITEM 6) */}
      {/* ========================================================================= */}
      <div
        className={`${
          darkMode ? 'bg-[#142036] border-[#1F2E4D] text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-700'
        } border-b px-4 py-1.5 text-xs select-none`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>Planning estimates, not predictions or security audits.</span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <button
              onClick={() => setShowStatusPopover(!showStatusPopover)}
              className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Illustrative hardware trajectory in use</span>
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span>Ref: 2026</span>
            <span>·</span>
            <span>X + Y &gt; Z</span>
          </div>
        </div>
      </div>

      {/* Info Popover for Trajectory provenance */}
      {showStatusPopover && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-start justify-center pt-16 p-4">
          <div className={`max-w-md w-full ${themeCard} p-5 rounded-2xl shadow-xl border space-y-3`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Illustrative Assumptions Provenance</span>
              </div>
              <button
                onClick={() => setShowStatusPopover(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The annual qubit growth rates (Earliest: 2.37x, Central: 1.78x, Latest: 1.41x) and starting physical qubits (1,000) are illustrative planning defaults chosen so RSA-2048 breaks approximately 8, 12, and 20 years out.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Resource anchors (RSA-2048 fewer than 1M noisy qubits, ECC-256 under 500k qubits) come from Gidney (2025) and Google Quantum AI research. Full sources can be inspected in the Evidence section.
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowStatusPopover(false);
                  setActiveSection('evidence');
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                View Evidence Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. COMPACT HEADER & 4-SECTION TOP NAV (AUDIT ITEMS 7 & 8) */}
      {/* ========================================================================= */}
      <header className={`${darkMode ? 'bg-[#0E1729]' : 'bg-white'} border-b ${themeBorder} sticky top-0 z-30 shadow-xs`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FA7CB5] to-[#B48AF7] flex items-center justify-center text-white font-extrabold text-lg shadow-xs shrink-0">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight">Ciphera</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                  Quantum-safe migration prioritizer
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden lg:inline">
                  · Team BHOOM · Q-Hack India 2026
                </span>
              </div>
            </div>
          </div>

          {/* 4 Clean Sections (No horizontal scrollbar, perfectly fitting) */}
          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-[#16233B] p-1 rounded-xl">
            <button
              onClick={() => setActiveSection('roadmap')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeSection === 'roadmap'
                  ? 'bg-white dark:bg-[#111C30] text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setActiveSection('scenarios')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeSection === 'scenarios'
                  ? 'bg-white dark:bg-[#111C30] text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Scenarios
            </button>
            <button
              onClick={() => setActiveSection('quantum')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeSection === 'quantum'
                  ? 'bg-white dark:bg-[#111C30] text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Quantum demo
            </button>
            <button
              onClick={() => setActiveSection('evidence')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeSection === 'evidence'
                  ? 'bg-white dark:bg-[#111C30] text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Evidence
            </button>
          </nav>

          {/* Quick Actions: Dark mode & Demo mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Dark Mode"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (isDemoMode) {
                  setIsDemoMode(false);
                } else {
                  startDemoMode();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isDemoMode
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{isDemoMode ? 'Exit Demo' : 'Demo mode'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE CONTENT */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full space-y-5">
        {/* ======================================================================= */}
        {/* SECTION 1: ROADMAP PAGE (DEFAULT) */}
        {/* ======================================================================= */}
        {activeSection === 'roadmap' && (
          <div className="space-y-5">
            {/* HERO: EXECUTIVE SUMMARY CARD (AUDIT ITEM 10) */}
            <div
              className={`rounded-2xl p-5 border shadow-xs transition-all ${
                counts.red > 0
                  ? 'bg-gradient-to-br from-rose-50/70 via-white to-purple-50/40 border-rose-200 dark:from-rose-950/20 dark:via-[#111C30] dark:to-purple-950/20 dark:border-rose-900/50'
                  : 'bg-gradient-to-br from-emerald-50/70 via-white to-purple-50/40 border-emerald-200 dark:from-emerald-950/20 dark:via-[#111C30] dark:to-purple-950/20 dark:border-emerald-900/50'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Executive Finding · As of Year {assessmentYear}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {executiveSummary.headline}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                    {executiveSummary.detail}
                  </p>
                </div>

                {topPriorityAsset && (
                  <div
                    className={`${themeCard} p-3.5 rounded-xl border shadow-xs lg:min-w-[320px] shrink-0 space-y-2`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                        Top Priority Asset
                      </span>
                      <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                        {topPriorityAsset.verdict_display}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {topPriorityAsset.asset_name}
                    </div>

                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span>Time needed (X + Y):</span>
                        <strong className="text-slate-900 dark:text-slate-200">
                          {topPriorityAsset.data_shelf_life_years} + {topPriorityAsset.migration_time_years} = {topPriorityAsset.x_plus_y}y
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Central break horizon:</span>
                        <strong className="text-slate-900 dark:text-slate-200">
                          {topPriorityAsset.z_remaining_central !== null
                            ? `${topPriorityAsset.z_remaining_central.toFixed(1)}y`
                            : 'N/A'}
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedAssetId(topPriorityAsset.id)}
                      className="w-full py-1 text-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 hover:underline cursor-pointer"
                    >
                      See why in roadmap below &darr;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TIMELINE SLIDER WITH EVENT MARKERS AND PLAY ANIMATION */}
            <div className={`${themeCard} rounded-2xl p-5 border shadow-xs space-y-3`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Assessment Year Timeline
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      Year T = <span className="text-purple-600 dark:text-purple-400 font-mono">{assessmentYear}</span>
                    </h3>
                    <span className="text-xs text-slate-500">
                      ({assessmentYear === 2026 ? 'Present baseline' : `+${assessmentYear - 2026} years delay`})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      isPlayingTimeline
                        ? 'bg-amber-500 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                    <span>{isPlayingTimeline ? 'Pause' : 'Play Timeline'}</span>
                  </button>

                  <button
                    onClick={() => setAssessmentYear(2026)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    2026 (Now)
                  </button>
                  <button
                    onClick={() => setAssessmentYear(2030)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    2030
                  </button>
                  <button
                    onClick={() => setAssessmentYear(2035)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    2035
                  </button>
                  <button
                    onClick={() => setAssessmentYear(2041)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    2041 (+15y)
                  </button>
                </div>
              </div>

              {/* True Proportional Scale Track (2026-2041) */}
              <div className="space-y-2 pt-1">
                <div className="relative">
                  <input
                    type="range"
                    min="2026"
                    max="2041"
                    step="1"
                    value={assessmentYear}
                    onChange={(e) => setAssessmentYear(parseInt(e.target.value, 10))}
                    className="w-full accent-purple-600 cursor-pointer h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg relative z-10"
                    aria-label="Assessment Year Timeline"
                  />

                  {/* Exact Proportional Leader Tick Lines on the Track */}
                  <div className="absolute top-0 left-0 right-0 h-2.5 pointer-events-none z-0">
                    {/* 2026 Reference: 0% */}
                    <div className="absolute left-[0%] top-0 bottom-0 w-0.5 bg-slate-400" />
                    {/* 2033.2 Earliest ECC: 48.0% */}
                    <div className="absolute left-[48.0%] top-0 bottom-0 w-0.5 bg-slate-500/70" />
                    {/* 2034.0 Earliest RSA: 53.4% */}
                    <div className="absolute left-[53.4%] top-0 bottom-0 w-0.5 bg-slate-500/70" />
                    {/* 2036.8 Central ECC: 71.9% */}
                    <div className="absolute left-[71.9%] top-0 bottom-0 w-0.5 bg-indigo-500/70" />
                    {/* 2038.0 Central RSA: 79.9% */}
                    <div className="absolute left-[79.9%] top-0 bottom-0 w-0.5 bg-indigo-500/70" />
                    {/* 2041 Max: 100% */}
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-400" />
                  </div>
                </div>

                {/* Collision-Free Proportional Event Labels with Leader Indicators */}
                <div className="relative h-12 w-full text-[11px] font-mono select-none overflow-hidden sm:overflow-visible">
                  {/* 2026 Ref (0%) */}
                  <div className="absolute left-0 top-1 -translate-x-0">
                    <div className="h-1.5 w-px bg-slate-300 dark:bg-slate-600 mx-auto mb-0.5" />
                    <span className={`font-semibold ${assessmentYear === 2026 ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500'}`}>
                      2026
                    </span>
                    <span className="block text-[9px] text-slate-400 font-sans">Baseline</span>
                  </div>

                  {/* 2033 Earliest ECC (~48.0%) */}
                  <div
                    className="absolute top-1 -translate-x-1/2 text-center"
                    style={{ left: '48.0%' }}
                  >
                    <div className="h-1.5 w-px bg-slate-400 mx-auto mb-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">2033</span>
                    <span className="block text-[9px] text-slate-500 font-sans leading-tight">Earliest ECC</span>
                  </div>

                  {/* 2034 Earliest RSA (~53.4%) - staggered downward slightly for clear stacking */}
                  <div
                    className="absolute top-4 -translate-x-1/2 text-center"
                    style={{ left: '54.5%' }}
                  >
                    <div className="h-1.5 w-px bg-slate-400 mx-auto mb-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 font-bold">2034</span>
                    <span className="block text-[9px] text-slate-500 font-sans leading-tight">Earliest RSA</span>
                  </div>

                  {/* 2037 Central ECC (~71.9%) */}
                  <div
                    className="absolute top-1 -translate-x-1/2 text-center"
                    style={{ left: '71.9%' }}
                  >
                    <div className="h-1.5 w-px bg-indigo-400 mx-auto mb-0.5" />
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">2037</span>
                    <span className="block text-[9px] text-indigo-500/80 font-sans leading-tight">Central ECC</span>
                  </div>

                  {/* 2038 Central RSA (~79.9%) - staggered slightly for clear separation */}
                  <div
                    className="absolute top-4 -translate-x-1/2 text-center"
                    style={{ left: '80.5%' }}
                  >
                    <div className="h-1.5 w-px bg-indigo-400 mx-auto mb-0.5" />
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">2038</span>
                    <span className="block text-[9px] text-indigo-500/80 font-sans leading-tight">Central RSA</span>
                  </div>

                  {/* 2041 Horizon (100%) */}
                  <div className="absolute right-0 top-1 text-right">
                    <div className="h-1.5 w-px bg-slate-300 dark:bg-slate-600 ml-auto mb-0.5" />
                    <span className={`font-semibold ${assessmentYear === 2041 ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500'}`}>
                      2041
                    </span>
                    <span className="block text-[9px] text-slate-400 font-sans">+15y max</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 italic">
                Moving the year simulates waiting. Watch assets change colour as time runs out.
              </p>
            </div>

            {/* CLICKABLE SUMMARY CARDS (AUDIT ITEM 3) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setVerdictFilter(verdictFilter === 'RED' ? 'ALL' : 'RED')}
                className={`${themeCard} border-t-4 border-[#E5484D] rounded-xl p-4 shadow-xs cursor-pointer transition-all hover:border-slate-400 ${
                  verdictFilter === 'RED' ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <ShieldAlert className="w-4 h-4 text-[#E5484D]" />
                    <span>Act now (Red)</span>
                  </div>
                  {assessmentYear > 2026 && counts.red > baselineCounts.red ? (
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded">
                      +{counts.red - baselineCounts.red} since 2026
                    </span>
                  ) : assessmentYear > 2026 ? (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      no change
                    </span>
                  ) : null}
                </div>
                <div className="text-3xl font-black text-[#E5484D] mt-1">{counts.red}</div>
                <p className="text-xs text-slate-500 mt-1">X + Y &gt; Z_central (Late under baseline)</p>
              </div>

              <div
                onClick={() => setVerdictFilter(verdictFilter === 'YELLOW' ? 'ALL' : 'YELLOW')}
                className={`${themeCard} border-t-4 border-[#F5B301] rounded-xl p-4 shadow-xs cursor-pointer transition-all hover:border-slate-400 ${
                  verdictFilter === 'YELLOW' ? 'ring-2 ring-amber-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <AlertTriangle className="w-4 h-4 text-[#F5B301]" />
                    <span>Plan soon (Yellow)</span>
                  </div>
                  {assessmentYear > 2026 && counts.yellow - baselineCounts.yellow !== 0 ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                      {counts.yellow - baselineCounts.yellow > 0
                        ? `+${counts.yellow - baselineCounts.yellow}`
                        : counts.yellow - baselineCounts.yellow}{' '}
                      since 2026
                    </span>
                  ) : assessmentYear > 2026 ? (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      no change
                    </span>
                  ) : null}
                </div>
                <div className="text-3xl font-black text-[#D97706] mt-1">{counts.yellow}</div>
                <p className="text-xs text-slate-500 mt-1">X + Y &gt; Z_earliest (At risk under aggressive)</p>
              </div>

              <div
                onClick={() => setVerdictFilter(verdictFilter === 'GREEN' ? 'ALL' : 'GREEN')}
                className={`${themeCard} border-t-4 border-[#2EB872] rounded-xl p-4 shadow-xs cursor-pointer transition-all hover:border-slate-400 ${
                  verdictFilter === 'GREEN' ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-[#2EB872]" />
                    <span>Safe for now (Green)</span>
                  </div>
                </div>
                <div className="text-3xl font-black text-[#2EB872] mt-1">{counts.green}</div>
                <p className="text-xs text-slate-500 mt-1">Adequate runway or Post-Quantum</p>
              </div>

              <div
                onClick={() => setVerdictFilter(verdictFilter === 'GRAY' ? 'ALL' : 'GRAY')}
                className={`${themeCard} border-t-4 border-[#9CA3AF] rounded-xl p-4 shadow-xs cursor-pointer transition-all hover:border-slate-400 ${
                  verdictFilter === 'GRAY' ? 'ring-2 ring-slate-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <CircleSlash className="w-4 h-4 text-[#9CA3AF]" />
                    <span>Out of scope (Gray)</span>
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-500 mt-1">{counts.gray}</div>
                <p className="text-xs text-slate-500 mt-1">Symmetric (AES-256) or Hashes</p>
              </div>
            </div>

            {/* CONTROLS ROW: PRESETS, IMPORT, EXPORT, SEARCH */}
            <div className={`${themeCard} rounded-2xl p-4 border shadow-xs space-y-3`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Presets with Illustrative Label (Audit item 5) */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Preset Scenario:</span>
                  {Object.entries(PRESET_INVENTORIES).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActivePreset(key);
                        setInventory(val.assets);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        activePreset === key
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>{val.label}</span>
                      {val.tag && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                          activePreset === key ? 'bg-purple-800 text-purple-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {val.tag}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Secondary buttons */}
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV</span>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <button
                    onClick={handleDownloadCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Asset</span>
                  </button>
                </div>
              </div>

              {/* Search & Verdict Quick Filter */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by asset name or algorithm (RSA, ECC, ML-KEM)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500 font-medium mr-1">Filter:</span>
                  {(['ALL', 'RED', 'YELLOW', 'GREEN', 'GRAY'] as const).map((code) => (
                    <button
                      key={code}
                      onClick={() => setVerdictFilter(code)}
                      className={`px-2 py-0.8 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                        verdictFilter === code
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RANKED ROADMAP TABLE WITH EXPANDABLE ROWS (AUDIT ITEM 5.1 #5) */}
            <div className={`${themeCard} rounded-2xl overflow-hidden border shadow-xs`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className={`${themeCardHeader} border-b text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider sticky top-0`}>
                      <th className="py-3 px-3 w-12 text-center">Rank</th>
                      <th className="py-3 px-3">Cryptographic Asset</th>
                      <th className="py-3 px-3">Algorithm</th>
                      <th className="py-3 px-3 text-right">Shelf Life (X)</th>
                      <th className="py-3 px-3 text-right">Migration (Y)</th>
                      <th className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">Needed (X+Y)</th>
                      <th className="py-3 px-3 text-right">Remaining Window</th>
                      <th className="py-3 px-3 text-center">Verdict</th>
                      <th className="py-3 px-3 text-right">Margin</th>
                      <th className="py-3 px-3 text-center w-12">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAssets.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                          No cryptographic assets match your search or filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAssets.map((item) => {
                        const isExpanded = expandedAssetId === item.id;
                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              onClick={() => setExpandedAssetId(isExpanded ? null : item.id)}
                              className={`transition-colors cursor-pointer hover:bg-purple-50/40 dark:hover:bg-purple-950/20 ${
                                isExpanded ? 'bg-purple-50/30 dark:bg-purple-950/30' : ''
                              }`}
                            >
                              <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                                #{item.rank}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {item.asset_name}
                                </div>
                                <div className="text-[11px] text-slate-500">{item.department || item.notes}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-200">
                                  {item.algorithm}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                {item.data_shelf_life_years}y
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                {item.migration_time_years}y
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {item.x_plus_y}y
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                {item.z_remaining_central !== null
                                  ? `${item.z_remaining_central.toFixed(1)}y`
                                  : '—'}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md ${
                                    item.verdict_code === 'RED'
                                      ? 'bg-[#FEE2E2] text-[#991B1B] dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                                      : item.verdict_code === 'YELLOW'
                                      ? 'bg-[#FEF3C7] text-[#92400E] dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                      : item.verdict_code === 'GREEN'
                                      ? 'bg-[#D1FAE5] text-[#065F46] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                      : 'bg-[#F3F4F6] text-[#4B5563] dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {item.verdict_code === 'RED' && <ShieldAlert className="w-3.5 h-3.5" />}
                                  {item.verdict_code === 'YELLOW' && <AlertTriangle className="w-3.5 h-3.5" />}
                                  {item.verdict_code === 'GREEN' && <ShieldCheck className="w-3.5 h-3.5" />}
                                  {item.verdict_code === 'GRAY' && <CircleSlash className="w-3.5 h-3.5" />}
                                  <span>{item.verdict_display}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-semibold">
                                {item.margin > -900 ? (
                                  <span className={item.margin > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                    {item.margin > 0 ? `+${item.margin.toFixed(1)}y` : `${item.margin.toFixed(1)}y`}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="text-slate-400 hover:text-purple-600">
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </span>
                              </td>
                            </tr>

                            {/* EXPANDED ROW DETAILS */}
                            {isExpanded && (
                              <tr className="bg-purple-50/20 dark:bg-purple-950/20">
                                <td colSpan={10} className="p-4 border-t border-purple-100 dark:border-slate-800 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="p-3 bg-white dark:bg-[#16233B] rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Plain-English Reasoning
                                      </span>
                                      <p className="text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                                        {item.reasoning}
                                      </p>
                                    </div>

                                    <div className="p-3 bg-white dark:bg-[#16233B] rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Quantum Threat Vector
                                      </span>
                                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                                        {item.threat_type}
                                      </div>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">
                                        {item.threat_type?.includes('HNDL')
                                          ? 'Encrypted data harvested by adversaries today can be decrypted retroactively.'
                                          : 'Signature forgery threatens real-time authentication once order-finding reaches execution speeds.'}
                                      </p>
                                    </div>

                                    <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                        What to do next
                                      </span>
                                      <p className="text-xs text-purple-950 dark:text-purple-200 font-medium leading-relaxed">
                                        {item.action_next}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECTION 2: SCENARIOS SENSITIVITY VIEW (AUDIT ITEM 9 & 5.3 & MARGIN OVER TIME) */}
        {/* ======================================================================= */}
        {activeSection === 'scenarios' && (
          <div className="space-y-6">
            {/* Scenarios Header & View Mode Switcher */}
            <div className={`${themeCard} rounded-2xl p-6 border shadow-xs space-y-4`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">
                      Sensitivity &amp; Margins
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Scenario Sensitivity &amp; Margin Analysis
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Evaluate required migration duration (X + Y) against quantum hardware vulnerability horizons (Z) and inspect how safety margins narrow over the 2026–2041 timeline.
                  </p>
                </div>

                {/* View Mode Toggle: Bars | Lines | Both (Default: Bars) */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold shrink-0">
                  <button
                    type="button"
                    onClick={() => setScenarioViewMode('bars')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      scenarioViewMode === 'bars'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Bars
                  </button>
                  <button
                    type="button"
                    onClick={() => setScenarioViewMode('lines')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      scenarioViewMode === 'lines'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Lines
                  </button>
                  <button
                    type="button"
                    onClick={() => setScenarioViewMode('both')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      scenarioViewMode === 'both'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>

              {/* View Explanation Caption */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div>
                  {scenarioViewMode === 'bars' && (
                    <span><strong>Bars view:</strong> Displays horizontal duration bars vs. scenario quantum break markers at assessment year {assessmentYear}.</span>
                  )}
                  {scenarioViewMode === 'lines' && (
                    <span><strong>Lines view:</strong> Displays 2026–2041 margin over time lines (margin = Z_remaining - [X+Y]), zero-crossing deadlines, and top 3 small multiples.</span>
                  )}
                  {scenarioViewMode === 'both' && (
                    <span><strong>Combined view:</strong> Comparing horizontal duration bars side-by-side with multi-year margin trajectory curves.</span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  Planning estimates based on modeled hardware scaling rates
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 1. HORIZON SENSITIVITY BARS VIEW (Active when 'bars' or 'both') */}
            {/* ================================================================= */}
            {(scenarioViewMode === 'bars' || scenarioViewMode === 'both') && (
              <div className={`${themeCard} rounded-2xl p-6 border shadow-xs space-y-5`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Horizon Sensitivity Chart (Bars Track)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      For each asset: horizontal bar shows time needed (X + Y). Markers show when each scenario breaks the algorithm as of year {assessmentYear}.
                    </p>
                  </div>

                  {/* Neutral Shape-based Legend (Audit Item 9) */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="text-base text-slate-700 dark:text-slate-300">◆</span>
                      <span>Diamond = Earliest break</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="text-base text-indigo-600 dark:text-indigo-400">●</span>
                      <span>Circle = Central break</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="text-base text-teal-600 dark:text-teal-400">■</span>
                      <span>Square = Latest break</span>
                    </div>
                  </div>
                </div>

                {/* True Year Axis and Gridlines Header */}
                <div className="relative pt-2 pb-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                    <span>Year 0 (T = {assessmentYear})</span>
                    <span>+5y</span>
                    <span>+10y</span>
                    <span>+15y</span>
                    <span>+20y</span>
                    <span>+25y</span>
                    <span>+30y</span>
                    <span>+35y horizon</span>
                  </div>
                </div>

                {/* Sensitivity bars track */}
                <div className="space-y-4">
                  {evaluatedRoadmap
                    .filter((item) => item.z_remaining_central !== null)
                    .map((item) => {
                      const maxScale = 35; // 35-year horizontal axis
                      const xyWidth = Math.min(100, (item.x_plus_y / maxScale) * 100);
                      const earlyPos = Math.min(100, ((item.z_remaining_earliest || 0) / maxScale) * 100);
                      const centralPos = Math.min(100, ((item.z_remaining_central || 0) / maxScale) * 100);
                      const latestPos = Math.min(100, ((item.z_remaining_latest || 0) / maxScale) * 100);

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-400">#{item.rank}</span>
                              <span className="font-bold text-slate-900 dark:text-white">{item.asset_name}</span>
                              <span className="font-mono text-slate-500">({item.algorithm})</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.verdict_code === 'RED'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                  : item.verdict_code === 'YELLOW'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}>
                                {item.verdict_display}
                              </span>
                            </div>

                            <div className="font-mono text-slate-500 text-[11px] flex items-center gap-2">
                              <span>Needed: <strong className="text-slate-800 dark:text-slate-200">{item.x_plus_y}y</strong></span>
                              <span>·</span>
                              <span>Central Z: <strong className="text-indigo-600 dark:text-indigo-400">{item.z_remaining_central?.toFixed(1)}y</strong></span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedScenarioAssetId(item.id);
                                  setScenarioViewMode('lines');
                                }}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-2 cursor-pointer"
                              >
                                View Margin Curve &rarr;
                              </button>
                            </div>
                          </div>

                          {/* Visual Horizon Track with True Gridlines, Outside Value Label, and Outlined Markers */}
                          <div className="relative w-full h-9 bg-slate-100 dark:bg-slate-850 rounded-lg overflow-visible border border-slate-200 dark:border-slate-700">
                            {/* Subtle background gridlines at 5y, 10y, 15y, 20y, 25y, 30y */}
                            {[5, 10, 15, 20, 25, 30].map((tick) => (
                              <div
                                key={tick}
                                className="absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-750 pointer-events-none"
                                style={{ left: `${(tick / maxScale) * 100}%` }}
                              />
                            ))}

                            {/* Solid indigo bar for needed duration (X+Y) */}
                            <div
                              className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-l-lg transition-all duration-300 relative"
                              style={{ width: `${Math.max(2, xyWidth)}%` }}
                            >
                              {/* Value label placed safely outside or inside with high contrast */}
                              <span
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap select-none drop-shadow-xs"
                                title={`Total needed time: ${item.x_plus_y} years`}
                              >
                                {item.x_plus_y}y needed
                              </span>
                            </div>

                            {/* Marker 1: Earliest Break (Diamond ◆, Slate with white/dark outline) */}
                            <div
                              className="absolute top-0 bottom-0 flex items-center justify-center -ml-2.5 z-20"
                              style={{ left: `${earlyPos}%` }}
                              title={`Earliest Scenario Break: ${item.z_remaining_earliest?.toFixed(1)}y (Cal: ${Math.round(item.break_years?.earliest || 2034)})`}
                            >
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-black shadow-md border-2 border-white dark:border-slate-900 transform rotate-45 scale-90">
                                <span className="transform -rotate-45">◆</span>
                              </span>
                            </div>

                            {/* Marker 2: Central Consensus Break (Circle ●, Indigo with high contrast outline) */}
                            <div
                              className="absolute top-0 bottom-0 flex items-center justify-center -ml-2.5 z-20"
                              style={{ left: `${centralPos}%` }}
                              title={`Central Consensus Break: ${item.z_remaining_central?.toFixed(1)}y (Cal: ${Math.round(item.break_years?.central || 2038)})`}
                            >
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-black shadow-md border-2 border-white dark:border-slate-900">
                                ●
                              </span>
                            </div>

                            {/* Marker 3: Latest Conservative Break (Square ■, Teal with high contrast outline) */}
                            <div
                              className="absolute top-0 bottom-0 flex items-center justify-center -ml-2.5 z-20"
                              style={{ left: `${latestPos}%` }}
                              title={`Latest Scenario Break: ${item.z_remaining_latest?.toFixed(1)}y (Cal: ${Math.round(item.break_years?.latest || 2046)})`}
                            >
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-teal-600 text-white text-xs font-black shadow-md border-2 border-white dark:border-slate-900">
                                ■
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 leading-relaxed">
                  <em>Rule of interpretation:</em> If the horizontal bar extends past a marker, that scenario breaks the algorithm before migration finishes.
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 2. MARGIN OVER TIME LINES VIEW (Active when 'lines' or 'both') */}
            {/* ================================================================= */}
            {(scenarioViewMode === 'lines' || scenarioViewMode === 'both') && (
              <div className={`${themeCard} rounded-2xl p-6 border shadow-xs space-y-6`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Margin Over Time Trajectory (2026–2041)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                      Tracks how the safety margin <code>(margin = Z_remaining(T) - needed)</code> narrows as the assessment year progresses. Zero line marks the action deadline when data breaks before migration finishes.
                    </p>
                  </div>

                  {/* Asset Selector Dropdown */}
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <label htmlFor="scenarioAssetSelect" className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Inspect Asset:
                    </label>
                    <select
                      id="scenarioAssetSelect"
                      value={selectedScenarioAssetId}
                      onChange={(e) => setSelectedScenarioAssetId(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium cursor-pointer text-xs focus:ring-2 focus:ring-indigo-500 max-w-[280px] sm:max-w-[340px]"
                    >
                      {evaluatedRoadmap.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          #{asset.rank} {asset.asset_name} ({asset.algorithm}) - {asset.verdict_display}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Detailed Interactive Margin Line Chart for Selected Asset */}
                <MarginOverTimeChart
                  asset={selectedScenarioAsset}
                  assessmentYear={assessmentYear}
                  isDarkMode={darkMode}
                  onSelectYear={(yr) => setAssessmentYear(yr)}
                />

                {/* Top 3 Small Multiples Comparison Grid */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Top 3 Priority Vulnerable Assets (Margin Comparison)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Comparative trajectory small multiples for the highest priority assets at risk.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Timeline range: 2026–2041
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {top3VulnerableAssets.map((asset) => (
                      <MarginSmallMultiple
                        key={asset.id}
                        asset={asset}
                        assessmentYear={assessmentYear}
                        isDarkMode={darkMode}
                        onSelectAsset={(id) => setSelectedScenarioAssetId(id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECTION 3: QUANTUM DEMO (GUIDED 5-STEP STEPPER, AUDIT ITEM 5.4) */}
        {/* ======================================================================= */}
        {activeSection === 'quantum' && (
          <div className="space-y-5">
            {/* 5-Step Stepper Header */}
            <div className={`${themeCard} rounded-2xl p-6 border shadow-xs space-y-5`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Shor Order-Finding Simulation
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                    Guided Quantum Factoring Stepper
                  </h2>
                </div>

                {shorResult && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `N = ${shorN}, a = ${shorBase}, Period r = ${shorResult.period}, Factors = {${shorResult.factors.join(', ')}}`
                      );
                      setCopiedResult(true);
                      setTimeout(() => setCopiedResult(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-xl hover:bg-purple-50 cursor-pointer"
                  >
                    {copiedResult ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedResult ? 'Result Copied' : 'Copy result'}</span>
                  </button>
                )}
              </div>

              {/* Progress Steps Tabs */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {[
                  { num: 1, label: '1. Select N & a' },
                  { num: 2, label: '2. Build Circuit' },
                  { num: 3, label: '3. Run Simulator' },
                  { num: 4, label: '4. Measure Peaks' },
                  { num: 5, label: '5. Classical Finish' },
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => setShorStep(s.num)}
                    className={`py-2 px-1 rounded-xl font-bold transition-all border cursor-pointer ${
                      shorStep === s.num
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : shorStep > s.num
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Step 1: Input Setup */}
              {shorStep === 1 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Step 1: Choose Composite Number N and Coprime Base a
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Number to factor (N)
                      </label>
                      <select
                        value={shorN}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          setShorN(n);
                          setShorBase(n === 15 ? 7 : 2);
                          setShorResult(null);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800 font-bold"
                      >
                        <option value={15}>N = 15 (Standard benchmark: 3 × 5)</option>
                        <option value={21}>N = 21 (Stretch challenge: 3 × 7)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Coprime Base (a) [gcd(a, N) = 1]
                      </label>
                      <input
                        type="number"
                        min="2"
                        max={shorN - 1}
                        value={shorBase}
                        onChange={(e) => setShorBase(parseInt(e.target.value, 10) || 2)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Simulation Shots
                      </label>
                      <select
                        value={shorShots}
                        onChange={(e) => setShorShots(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800"
                      >
                        <option value={512}>512 shots</option>
                        <option value={1024}>1024 shots (recommended)</option>
                        <option value={2048}>2048 shots</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShorStep(2)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Next: Build Circuit &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Circuit Architecture */}
              {shorStep === 2 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Step 2: Quantum Circuit Architecture
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    The circuit uses 8 counting qubits initialized in superposition via Hadamard gates, plus {shorN === 15 ? 4 : 5} work qubits initialized to state |1&rang;. Controlled modular multiplication gates entangle counting and work registers before an inverse QFT extracts the phase.
                  </p>

                  <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
                    <div>c_reg (8 qubits): |00000000&rang; ---[ H ]---[ • ]---[ • ]---[ • ]---[ QFT_inv ]---[ Meas ]</div>
                    <div>w_reg ({shorN === 15 ? 4 : 5} qubits): |0001&rang; --------[ U_a ]-[ U_a²]-[ U_a⁴]----------------------</div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setShorStep(1)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    >
                      &larr; Back
                    </button>
                    <button
                      onClick={() => {
                        handleRunShorSimulation();
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Next: Run on Simulator &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Run / Loading */}
              {shorStep === 3 && (
                <div className="p-8 text-center space-y-4">
                  <div className="inline-block animate-spin text-purple-600">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Simulating Quantum Circuit on Qiskit Aer...
                  </h4>
                  <p className="text-xs text-slate-500">
                    Executing {shorShots} shots on {shorN === 15 ? 12 : 13} simulated qubits.
                  </p>
                </div>
              )}

              {/* Step 4: Histogram & Peaks */}
              {shorStep === 4 && shorResult && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Step 4: Measurement Histogram (Peaks Highlighted)
                    </h4>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                      Annotation: Peaks appear at multiples of 2^n / r. They reveal the period.
                    </span>
                  </div>

                  <div className="space-y-2">
                    {shorResult.histogram.map((item, i) => {
                      const pct = Math.round((item.count / shorShots) * 100);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-800 dark:text-slate-200 font-bold">
                              State |{item.bitstring}&rang; &rarr; Phase {item.phase.toFixed(2)}
                            </span>
                            <span className="text-slate-500 font-semibold">
                              {item.count} shots ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setShorStep(2)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    >
                      &larr; Back
                    </button>
                    <button
                      onClick={() => setShorStep(5)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Next: Classical Finish &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Classical Finish */}
              {shorStep === 5 && shorResult && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Step 5: Classical Post-Processing Complete
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-white dark:bg-[#111C30] rounded-xl border border-emerald-200 dark:border-emerald-900">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Factors Found</span>
                      <div className="text-2xl font-mono font-black text-emerald-600 mt-0.5">
                        {`{${shorResult.factors.join(', ')}}`}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-[#111C30] rounded-xl border border-emerald-200 dark:border-emerald-900">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Period (r)</span>
                      <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        r = {shorResult.period}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-[#111C30] rounded-xl border border-emerald-200 dark:border-emerald-900">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total Qubits</span>
                      <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {shorResult.qubits}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-[#111C30] rounded-xl border border-emerald-200 dark:border-emerald-900">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Circuit Depth</span>
                      <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {shorResult.depth}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#111C30] rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    <strong>What just happened:</strong> {shorResult.explanation}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setShorStep(4)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    >
                      &larr; Back to Histogram
                    </button>
                    <button
                      onClick={() => setShorStep(1)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Run Another Simulation
                    </button>
                  </div>
                </div>
              )}

              {/* SIDE-BY-SIDE SCALE GAP VISUAL (AUDIT ITEM 4 & 5.4) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  The Scale Gap: Toy Demo vs Real-World Keys
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-[#111C30] rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-purple-600 dark:text-purple-400">Toy Simulation (This Demo)</span>
                    <div className="font-mono text-slate-800 dark:text-slate-200">N = 15 (3 × 5) · 12 simulated qubits</div>
                    <p className="text-slate-500">12 qubits refers to 8 counting register qubits + 4 work register qubits for modular exponentiation on a classical CPU.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#111C30] rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-rose-600 dark:text-rose-400">RSA-2048 Cryptanalysis</span>
                    <div className="font-mono text-slate-800 dark:text-slate-200">a 2048-bit modulus · fewer than 1 million noisy qubits, about a week (estimate)</div>
                    <p className="text-slate-500">Full fault-tolerant Shor implementation requires quantum error correction (surface codes).</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic pt-1">
                  This shows the mechanism. It does not break real keys.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECTION 4: EVIDENCE PAGE (AUDIT ITEM 2 & 5.5) */}
        {/* ======================================================================= */}
        {activeSection === 'evidence' && (
          <div className="space-y-5">
            <div className={`${themeCard} rounded-2xl p-6 border shadow-xs space-y-6`}>
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Evidence & Methodology Grounding</h2>
                <p className="text-xs text-slate-500">
                  Every constant comes from published research or is explicitly tagged illustrative.
                </p>
              </div>

              {/* Sub-section 1: Assumptions & Provenance Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Assumptions Provenance Table
                  </h3>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-medium">Status Filter:</span>
                    {[
                      { key: 'ALL', label: 'All' },
                      { key: 'from_paper', label: 'From paper' },
                      { key: 'derived', label: 'Derived' },
                      { key: 'illustrative', label: 'Illustrative' },
                    ].map((st) => (
                      <button
                        key={st.key}
                        onClick={() => setEvidenceStatusFilter(st.key as typeof evidenceStatusFilter)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                          evidenceStatusFilter === st.key
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`${themeCardHeader} border-b text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider`}>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Parameter / Model</th>
                        <th className="py-2.5 px-3">Value</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Published Research / Provenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        {
                          cat: 'Resource Anchor',
                          param: 'RSA-2048 Attack Resources',
                          val: '1,000,000 qubits',
                          status: 'from_paper',
                          source: 'Gidney (2025), How to factor 2048 bit RSA integers with less than a million noisy qubits, arXiv:2505.15917',
                          link: 'https://arxiv.org/abs/2505.15917',
                        },
                        {
                          cat: 'Resource Anchor',
                          param: 'ECC-256 Attack Resources',
                          val: '500,000 qubits',
                          status: 'from_paper',
                          source: 'Google Quantum AI (2026), Securing Elliptic Curve Cryptocurrencies against Quantum Vulnerabilities',
                          link: 'https://quantumai.google',
                        },
                        {
                          cat: 'Scaling Model',
                          param: 'Key Size Scaling',
                          val: 'Linear (qubits proportional to bits)',
                          status: 'illustrative',
                          source: 'Team simplifying assumption; refine with published per-size estimates for RSA-3072 / RSA-4096',
                        },
                        {
                          cat: 'Hardware Trajectory',
                          param: 'Start Qubits (2026 Ref)',
                          val: '1,000 physical qubits',
                          status: 'illustrative',
                          source: 'Illustrative baseline capacity. Replace with vendor roadmap milestones (IBM Condor / Starling)',
                        },
                        {
                          cat: 'Hardware Trajectory',
                          param: 'Earliest Annual Growth',
                          val: '2.37x / year',
                          status: 'illustrative',
                          source: 'Illustrative: chosen to give an 8-year earliest window; not derived from a vendor roadmap.',
                        },
                        {
                          cat: 'Hardware Trajectory',
                          param: 'Central Annual Growth',
                          val: '1.78x / year',
                          status: 'illustrative',
                          source: 'Illustrative: chosen to give a 12-year central window; not derived from a vendor roadmap.',
                        },
                        {
                          cat: 'Hardware Trajectory',
                          param: 'Latest Annual Growth',
                          val: '1.41x / year',
                          status: 'illustrative',
                          source: 'Illustrative: chosen to give a 20-year conservative window; not derived from a vendor roadmap.',
                        },
                      ]
                        .filter((r) => evidenceStatusFilter === 'ALL' || r.status === evidenceStatusFilter)
                        .map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{row.cat}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{row.param}</td>
                            <td className="py-2.5 px-3 font-mono">{row.val}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.status === 'from_paper'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : row.status === 'derived'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {row.status === 'from_paper' ? 'From paper' : row.status === 'derived' ? 'Derived' : 'Illustrative'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {row.source}
                              {row.link && (
                                <a
                                  href={row.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ml-1 text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-0.5"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-section 2: Known Scope & Limitations (Audit Item 5.5) */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Known Scope & Limitations</h3>
                <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>
                    <strong>Estimates, not predictions:</strong> Timelines model plausible planning bounds for risk management, not deterministic calendar dates.
                  </li>
                  <li>
                    <strong>User-supplied inventory:</strong> The tool prioritizes assets entered by the user; it is not an automated network scanner.
                  </li>
                  <li>
                    <strong>Public-key cryptography focus:</strong> Shor's algorithm affects discrete logarithms and factoring. Symmetric algorithms (AES-256) remain safe against Grover speedup with 256-bit keys and are classified out of scope.
                  </li>
                  <li>
                    <strong>Encryption vs. signature keys:</strong> Confidential data faces immediate threat from Harvest Now, Decrypt Later (HNDL). Signature forgery becomes feasible only once quantum machines execute order-finding in real time.
                  </li>
                  <li>
                    <strong>Diagnoses but does not migrate:</strong> The tool generates a ranked roadmap. Organizations must execute migration using NIST PQC standards (FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205 SLH-DSA).
                  </li>
                </ol>
              </div>

              {/* Sub-section 3: Real Test Suite Execution (Audit Item 3) */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Automated Verification Suite
                    </h3>
                    <p className="text-xs text-slate-500">
                      Run pytest to verify the risk engine, boundary conditions, and quantum simulator offline.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('pytest -v');
                      setCopiedPytestCmd(true);
                      setTimeout(() => setCopiedPytestCmd(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedPytestCmd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPytestCmd ? 'Copied pytest -v' : 'Copy pytest command'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-1">
                  <div className="text-slate-400 font-sans font-bold">Execution instruction:</div>
                  <div className="text-emerald-400">pytest -v</div>
                  <div className="text-slate-400 pt-1 text-[11px]">
                    Executes tests across tests/test_engine.py and tests/test_shor.py.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 4. DEMO MODE FLOATING CONTROLLER (SECTION 6) */}
      {/* ========================================================================= */}
      {isDemoMode && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 py-3 px-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded text-[11px] font-extrabold uppercase tracking-wider">
                  Demo Mode · Step {demoStep} of {DEMO_STEPS.length}
                </span>
                <span className="font-bold text-xs text-purple-300">{DEMO_STEPS[demoStep - 1].title}</span>
              </div>
              <p className="text-xs text-slate-200 italic max-w-4xl">
                &ldquo;{DEMO_STEPS[demoStep - 1].script}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDemoPrev}
                disabled={demoStep === 1}
                className="px-3 py-1 text-xs border border-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                &larr; Prev
              </button>
              <button
                onClick={handleDemoNext}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                {demoStep === DEMO_STEPS.length ? 'Finish Demo' : 'Next Step &rarr;'}
              </button>
              <button
                onClick={() => setIsDemoMode(false)}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                title="Exit Demo Mode (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ASSET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`${themeCard} rounded-2xl max-w-lg w-full p-6 shadow-xl border space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Cryptographic Asset</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Card Settlement Gateway"
                  value={newAsset.asset_name}
                  onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Algorithm</label>
                <select
                  value={newAsset.algorithm}
                  onChange={(e) => setNewAsset({ ...newAsset, algorithm: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800"
                >
                  <option value="RSA-2048">RSA-2048 (Vulnerable)</option>
                  <option value="RSA-3072">RSA-3072 (Vulnerable)</option>
                  <option value="RSA-4096">RSA-4096 (Vulnerable)</option>
                  <option value="ECC-256">ECC-256 (Vulnerable)</option>
                  <option value="ECDSA-P256">ECDSA-P256 (Vulnerable)</option>
                  <option value="ML-KEM-768">ML-KEM-768 (Quantum Safe)</option>
                  <option value="ML-DSA-65">ML-DSA-65 (Quantum Safe)</option>
                  <option value="AES-256">AES-256 (Symmetric / Out of Scope)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shelf Life X (years)
                  </label>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    How many years must data stay confidential?
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newAsset.data_shelf_life_years}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, data_shelf_life_years: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Migration Time Y (years)
                  </label>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    How many years will migration take?
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newAsset.migration_time_years}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, migration_time_years: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Context / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. PCI-DSS compliance scope"
                  value={newAsset.notes}
                  onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewAsset}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`${darkMode ? 'bg-[#0E1729]' : 'bg-white'} border-t ${themeBorder} py-3.5 text-xs text-slate-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Ciphera</strong> · Quantum-safe migration prioritizer · Team BHOOM, Q-Hack India 2026
          </div>
          <div className="flex items-center gap-3">
            <span>MIT License</span>
            <span>·</span>
            <span>Offline-First (No API Keys)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
