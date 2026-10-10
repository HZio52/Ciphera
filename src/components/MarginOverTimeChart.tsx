import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Info,
  Calendar,
  Layers,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';

export interface BreakYears {
  earliest: number | null;
  central: number | null;
  latest: number | null;
}

export interface EvaluatedAssetForMargin {
  id: string;
  rank: number;
  asset_name: string;
  algorithm: string;
  data_shelf_life_years: number;
  migration_time_years: number;
  x_plus_y: number;
  break_years?: BreakYears;
  z_remaining_earliest: number | null;
  z_remaining_central: number | null;
  z_remaining_latest: number | null;
  margin: number;
  verdict_code: 'RED' | 'YELLOW' | 'GREEN' | 'GRAY';
  verdict_display: string;
  algorithm_category?: 'quantum_vulnerable' | 'quantum_safe' | 'out_of_scope' | 'unknown';
}

interface MarginOverTimeChartProps {
  asset: EvaluatedAssetForMargin | null;
  assessmentYear: number;
  isDarkMode?: boolean;
  onSelectYear?: (year: number) => void;
}

const REFERENCE_YEAR = 2026;
const MAX_YEAR = 2041;
const YEARS = Array.from({ length: MAX_YEAR - REFERENCE_YEAR + 1 }, (_, i) => REFERENCE_YEAR + i);

export const MarginOverTimeChart: React.FC<MarginOverTimeChartProps> = ({
  asset,
  assessmentYear,
  isDarkMode = false,
  onSelectYear,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  // Compute margin series data
  const seriesData = useMemo(() => {
    if (!asset || !asset.break_years || asset.break_years.central === null) {
      return null;
    }

    const needed = asset.x_plus_y;
    const by = asset.break_years;

    const computeScenario = (breakYearVal: number | null, name: 'earliest' | 'central' | 'latest') => {
      if (breakYearVal === null) return null;
      const deadline = breakYearVal - needed;
      const points = YEARS.map((yr) => {
        const zRem = Math.max(0, breakYearVal - yr);
        const margin = zRem - needed;
        return {
          year: yr,
          zRem,
          margin,
        };
      });
      const isAlreadyLate = deadline < REFERENCE_YEAR;
      const isLateInWindow = deadline >= REFERENCE_YEAR && deadline <= MAX_YEAR;
      return {
        name,
        breakYear: breakYearVal,
        deadline,
        isAlreadyLate,
        isLateInWindow,
        points,
      };
    };

    const earliest = computeScenario(by.earliest, 'earliest');
    const central = computeScenario(by.central, 'central');
    const latest = computeScenario(by.latest, 'latest');

    // Calculate Y range encompassing 0
    let minVal = 0;
    let maxVal = 0;

    [earliest, central, latest].forEach((sc) => {
      if (!sc) return;
      sc.points.forEach((p) => {
        if (p.margin < minVal) minVal = p.margin;
        if (p.margin > maxVal) maxVal = p.margin;
      });
    });

    const yFloor = Math.min(-5, Math.floor((minVal - 2) / 5) * 5);
    const yCeil = Math.max(5, Math.ceil((maxVal + 2) / 5) * 5);

    return {
      needed,
      earliest,
      central,
      latest,
      yFloor,
      yCeil,
    };
  }, [asset]);

  if (!asset) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No cryptographic asset selected for margin sensitivity analysis.
      </div>
    );
  }

  // Handle quantum-safe or out-of-scope assets with an informative note
  if (
    asset.algorithm_category === 'quantum_safe' ||
    asset.algorithm_category === 'out_of_scope' ||
    !seriesData
  ) {
    const isSafe = asset.algorithm_category === 'quantum_safe';
    return (
      <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
          {isSafe ? <ShieldCheck className="w-6 h-6" /> : <Clock className="w-6 h-6 text-slate-500" />}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {asset.asset_name} ({asset.algorithm})
          </h3>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-0.5">
            {isSafe ? 'Quantum-Safe Algorithm (NIST PQC Standard)' : 'Out of Scope (Symmetric / Hash)'}
          </p>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          {isSafe
            ? 'This asset uses post-quantum cryptography immune to Shor\'s discrete logarithm and factoring attacks. Because no quantum break horizon exists, Moscow inequality margin calculations do not narrow over time.'
            : 'This asset uses a symmetric cipher or cryptographic hash. Grover\'s algorithm provides at most quadratic speedup, leaving 256-bit parameters secure against known quantum threats.'}
        </p>
      </div>
    );
  }

  // Dimensions for responsive SVG plot
  const svgWidth = 840;
  const svgHeight = 380;
  const padding = { top: 38, right: 45, bottom: 46, left: 60 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const { needed, earliest, central, latest, yFloor, yCeil } = seriesData;

  const getX = (year: number) => {
    return padding.left + ((year - REFERENCE_YEAR) / (MAX_YEAR - REFERENCE_YEAR)) * plotWidth;
  };

  const getY = (marginVal: number) => {
    return padding.top + ((yCeil - marginVal) / (yCeil - yFloor)) * plotHeight;
  };

  const zeroY = getY(0);

  // Generate tick values for Y axis
  const yTicks: number[] = [];
  const step = (yCeil - yFloor) <= 30 ? 5 : 10;
  for (let val = yFloor; val <= yCeil; val += step) {
    yTicks.push(val);
  }

  // SVG path generator
  const createPath = (points: { year: number; margin: number }[]) => {
    return points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.year).toFixed(1)} ${getY(p.margin).toFixed(1)}`)
      .join(' ');
  };

  // Active hover year or default assessment year for quick preview
  const activeYear = hoveredYear ?? assessmentYear;
  const activeEarliest = earliest?.points.find((p) => p.year === activeYear);
  const activeCentral = central?.points.find((p) => p.year === activeYear);
  const activeLatest = latest?.points.find((p) => p.year === activeYear);

  return (
    <div className="space-y-4">
      {/* Top Status & Action Deadlines Summary Bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">#{asset.rank}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{asset.asset_name}</span>
            <span className="font-mono text-slate-500">({asset.algorithm})</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Migration time needed: <strong className="font-mono text-slate-700 dark:text-slate-300">{needed} years</strong> (Shelf-life: {asset.data_shelf_life_years}y + Migration: {asset.migration_time_years}y).
          </p>
        </div>

        {/* Action Deadlines per Scenario */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Earliest deadline */}
          {earliest && (
            <div className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-slate-700 dark:text-slate-300">◆</span>
              <span className="text-slate-500">Earliest:</span>
              {earliest.isAlreadyLate ? (
                <span className="font-bold text-red-600 dark:text-red-400">Already late</span>
              ) : (
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Late from {Math.round(earliest.deadline)}
                </span>
              )}
            </div>
          )}

          {/* Central deadline */}
          {central && (
            <div className="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-indigo-600 dark:text-indigo-400">●</span>
              <span className="text-slate-500">Central:</span>
              {central.isAlreadyLate ? (
                <span className="font-bold text-red-600 dark:text-red-400">Already late</span>
              ) : (
                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                  Late from {Math.round(central.deadline)}
                </span>
              )}
            </div>
          )}

          {/* Latest deadline */}
          {latest && (
            <div className="px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-900/60 bg-white dark:bg-slate-900 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-teal-600 dark:text-teal-400">■</span>
              <span className="text-slate-500">Latest:</span>
              {latest.isAlreadyLate ? (
                <span className="font-bold text-red-600 dark:text-red-400">Already late</span>
              ) : latest.isLateInWindow ? (
                <span className="font-bold text-teal-700 dark:text-teal-300">
                  Late from {Math.round(latest.deadline)}
                </span>
              ) : (
                <span className="font-bold text-teal-700 dark:text-teal-300">
                  Safe through 2041 ({Math.round(latest.deadline)})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SVG Interactive Line Chart */}
      <div className="relative w-full overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-4 select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[460px] overflow-visible"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const clampedX = Math.max(padding.left, Math.min(padding.left + plotWidth, svgX));
            const yearFraction = (clampedX - padding.left) / plotWidth;
            const year = Math.round(REFERENCE_YEAR + yearFraction * (MAX_YEAR - REFERENCE_YEAR));
            setHoveredYear(Math.max(REFERENCE_YEAR, Math.min(MAX_YEAR, year)));
          }}
          onMouseLeave={() => setHoveredYear(null)}
          onClick={() => {
            if (hoveredYear && onSelectYear) {
              onSelectYear(hoveredYear);
            }
          }}
        >
          <defs>
            {/* Pattern for deficit region */}
            <pattern id="deficitHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke={isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)'} strokeWidth="2" />
            </pattern>
          </defs>

          {/* Shaded Deficit Region (Below Zero Line: margin < 0) */}
          {zeroY < padding.top + plotHeight && (
            <g>
              <rect
                x={padding.left}
                y={zeroY}
                width={plotWidth}
                height={padding.top + plotHeight - zeroY}
                fill={isDarkMode ? 'rgba(239, 68, 68, 0.14)' : 'rgba(254, 242, 242, 0.85)'}
              />
              <rect
                x={padding.left}
                y={zeroY}
                width={plotWidth}
                height={padding.top + plotHeight - zeroY}
                fill="url(#deficitHatch)"
              />
              <text
                x={padding.left + 12}
                y={Math.min(padding.top + plotHeight - 10, zeroY + 18)}
                className="text-[10px] font-sans font-bold fill-red-600 dark:fill-red-400 opacity-90 select-none"
              >
                Deficit zone: data breaks before migration finishes (margin &lt; 0)
              </text>
            </g>
          )}

          {/* Horizontal Gridlines & Y Axis Ticks */}
          {yTicks.map((val) => {
            const yPos = getY(val);
            const isZero = val === 0;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={padding.left + plotWidth}
                  y2={yPos}
                  stroke={
                    isZero
                      ? '#E5484D'
                      : isDarkMode
                      ? '#334155'
                      : '#E2E8F0'
                  }
                  strokeWidth={isZero ? 2 : 1}
                  strokeDasharray={isZero ? '6 4' : undefined}
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 3.5}
                  textAnchor="end"
                  className={`text-[10px] font-mono select-none ${
                    isZero
                      ? 'fill-red-600 dark:fill-red-400 font-bold'
                      : isDarkMode
                      ? 'fill-slate-400'
                      : 'fill-slate-600'
                  }`}
                >
                  {val > 0 ? `+${val}y` : `${val}y`}
                </text>
              </g>
            );
          })}

          {/* Zero Line Tag on Right */}
          <g>
            <rect
              x={padding.left + plotWidth - 75}
              y={zeroY - 9}
              width={72}
              height={18}
              rx="4"
              fill={isDarkMode ? '#7F1D1D' : '#FEE2E2'}
            />
            <text
              x={padding.left + plotWidth - 39}
              y={zeroY + 3}
              textAnchor="middle"
              className="text-[9px] font-mono font-bold fill-red-700 dark:fill-red-300 select-none"
            >
              0y Margin
            </text>
          </g>

          {/* Vertical Year Gridlines & X Axis Ticks */}
          {YEARS.map((yr) => {
            const xPos = getX(yr);
            const isEveryTwo = yr % 2 === 0 || yr === MAX_YEAR;
            return (
              <g key={yr}>
                <line
                  x1={xPos}
                  y1={padding.top}
                  x2={xPos}
                  y2={padding.top + plotHeight}
                  stroke={isDarkMode ? '#1E293B' : '#F1F5F9'}
                  strokeWidth={1}
                />
                {isEveryTwo && (
                  <text
                    x={xPos}
                    y={padding.top + plotHeight + 18}
                    textAnchor="middle"
                    className={`text-[10px] font-mono select-none ${
                      yr === assessmentYear
                        ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                        : isDarkMode
                        ? 'fill-slate-400'
                        : 'fill-slate-600'
                    }`}
                  >
                    {yr}
                  </text>
                )}
              </g>
            );
          })}

          {/* Current Assessment Year Marker (Vertical dashed indicator linked to timeline slider) */}
          {(() => {
            const curX = getX(assessmentYear);
            return (
              <g>
                <line
                  x1={curX}
                  y1={padding.top - 12}
                  x2={curX}
                  y2={padding.top + plotHeight}
                  stroke="#6366F1"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
                <rect
                  x={curX - 35}
                  y={padding.top - 28}
                  width={70}
                  height={18}
                  rx="4"
                  fill="#4F46E5"
                  className="shadow-xs"
                />
                <text
                  x={curX}
                  y={padding.top - 16}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-white select-none"
                >
                  Slider: {assessmentYear}
                </text>
              </g>
            );
          })()}

          {/* Scenario 3: Latest Line & Markers (Square ■, Teal #0D9488) */}
          {latest && (
            <g>
              <path
                d={createPath(latest.points)}
                fill="none"
                stroke={isDarkMode ? '#14B8A6' : '#0D9488'}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {latest.points.map((p) => {
                const px = getX(p.year);
                const py = getY(p.margin);
                return (
                  <rect
                    key={p.year}
                    x={px - 3.5}
                    y={py - 3.5}
                    width={7}
                    height={7}
                    fill={isDarkMode ? '#14B8A6' : '#0D9488'}
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  />
                );
              })}
            </g>
          )}

          {/* Scenario 2: Central Line & Markers (Circle ●, Indigo #4F46E5) */}
          {central && (
            <g>
              <path
                d={createPath(central.points)}
                fill="none"
                stroke={isDarkMode ? '#818CF8' : '#4F46E5'}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {central.points.map((p) => {
                const px = getX(p.year);
                const py = getY(p.margin);
                return (
                  <circle
                    key={p.year}
                    cx={px}
                    cy={py}
                    r={3.8}
                    fill={isDarkMode ? '#818CF8' : '#4F46E5'}
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  />
                );
              })}
            </g>
          )}

          {/* Scenario 1: Earliest Line & Markers (Diamond ◆, Slate #475569) */}
          {earliest && (
            <g>
              <path
                d={createPath(earliest.points)}
                fill="none"
                stroke={isDarkMode ? '#94A3B8' : '#334155'}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {earliest.points.map((p) => {
                const px = getX(p.year);
                const py = getY(p.margin);
                return (
                  <polygon
                    key={p.year}
                    points={`${px},${py - 4.5} ${px + 4.5},${py} ${px},${py + 4.5} ${px - 4.5},${py}`}
                    fill={isDarkMode ? '#94A3B8' : '#334155'}
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  />
                );
              })}
            </g>
          )}

          {/* Zero-Crossing Annotation Markers (Dots & Labels) */}
          {/* Earliest Zero-Crossing */}
          {earliest && earliest.isLateInWindow && (
            <g>
              <circle
                cx={getX(earliest.deadline)}
                cy={zeroY}
                r={5.5}
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              <text
                x={getX(earliest.deadline)}
                y={zeroY - 11}
                textAnchor="middle"
                className="text-[9.5px] font-bold fill-slate-800 dark:fill-slate-100 select-none"
              >
                Late under earliest scenario from {Math.round(earliest.deadline)}
              </text>
            </g>
          )}
          {earliest && earliest.isAlreadyLate && (
            <g>
              <text
                x={getX(REFERENCE_YEAR) + 6}
                y={getY(earliest.points[0].margin) - 8}
                className="text-[9.5px] font-bold fill-red-600 dark:fill-red-400 select-none"
              >
                Already late under earliest
              </text>
            </g>
          )}

          {/* Central Zero-Crossing */}
          {central && central.isLateInWindow && (
            <g>
              <circle
                cx={getX(central.deadline)}
                cy={zeroY}
                r={5.5}
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              <text
                x={getX(central.deadline)}
                y={zeroY + 18}
                textAnchor="middle"
                className="text-[9.5px] font-bold fill-indigo-700 dark:fill-indigo-300 select-none"
              >
                Late under central scenario from {Math.round(central.deadline)}
              </text>
            </g>
          )}
          {central && central.isAlreadyLate && (
            <g>
              <text
                x={getX(REFERENCE_YEAR) + 6}
                y={getY(central.points[0].margin) - 8}
                className="text-[9.5px] font-bold fill-red-600 dark:fill-red-400 select-none"
              >
                Already late under central
              </text>
            </g>
          )}

          {/* Latest Zero-Crossing */}
          {latest && latest.isLateInWindow && (
            <g>
              <circle
                cx={getX(latest.deadline)}
                cy={zeroY}
                r={5.5}
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              <text
                x={getX(latest.deadline)}
                y={zeroY - 12}
                textAnchor="middle"
                className="text-[9.5px] font-bold fill-teal-700 dark:fill-teal-300 select-none"
              >
                Late under latest scenario from {Math.round(latest.deadline)}
              </text>
            </g>
          )}

          {/* Hover Crosshair Cursor Line */}
          {hoveredYear !== null && (
            <g>
              <line
                x1={getX(hoveredYear)}
                y1={padding.top}
                x2={getX(hoveredYear)}
                y2={padding.top + plotHeight}
                stroke={isDarkMode ? '#E2E8F0' : '#475569'}
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
              <circle cx={getX(hoveredYear)} cy={zeroY} r={3} fill="#6366F1" />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay Card */}
        {activeYear && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-slate-900 dark:text-white">
                Year {activeYear} Values
              </span>
              {activeYear === assessmentYear && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300">
                  Current Slider Year
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
              {activeEarliest && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-700 dark:text-slate-300">◆ Earliest:</span>
                  <strong className={activeEarliest.margin < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}>
                    {activeEarliest.margin > 0 ? `+${activeEarliest.margin.toFixed(1)}y` : `${activeEarliest.margin.toFixed(1)}y`}
                  </strong>
                  <span className="text-slate-400 text-[10px]">(Z={activeEarliest.zRem.toFixed(1)}y)</span>
                </div>
              )}

              {activeCentral && (
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400">● Central:</span>
                  <strong className={activeCentral.margin < 0 ? 'text-red-600 dark:text-red-400' : 'text-indigo-800 dark:text-indigo-200'}>
                    {activeCentral.margin > 0 ? `+${activeCentral.margin.toFixed(1)}y` : `${activeCentral.margin.toFixed(1)}y`}
                  </strong>
                  <span className="text-slate-400 text-[10px]">(Z={activeCentral.zRem.toFixed(1)}y)</span>
                </div>
              )}

              {activeLatest && (
                <div className="flex items-center gap-1.5">
                  <span className="text-teal-600 dark:text-teal-400">■ Latest:</span>
                  <strong className={activeLatest.margin < 0 ? 'text-red-600 dark:text-red-400' : 'text-teal-800 dark:text-teal-200'}>
                    {activeLatest.margin > 0 ? `+${activeLatest.margin.toFixed(1)}y` : `${activeLatest.margin.toFixed(1)}y`}
                  </strong>
                  <span className="text-slate-400 text-[10px]">(Z={activeLatest.zRem.toFixed(1)}y)</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Guidance Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="text-base text-slate-700 dark:text-slate-300">◆</span>
            <span>Diamond = Earliest estimate</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="text-base text-indigo-600 dark:text-indigo-400">●</span>
            <span>Circle = Central consensus estimate</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="text-base text-teal-600 dark:text-teal-400">■</span>
            <span>Square = Latest estimate</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Dot on 0y = Action deadline</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDataTable(!showDataTable)}
          className="inline-flex items-center gap-1.5 px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
          aria-expanded={showDataTable}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>{showDataTable ? 'Hide Data Table' : 'Accessible Data Table'}</span>
          {showDataTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Accessible Screen-Reader Friendly Data Table */}
      {showDataTable && (
        <div className="mt-3 p-4 bg-slate-50/70 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Tabular Margin Trajectory (2026-2041)
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">Needed: {needed} years</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono" role="table">
              <caption className="sr-only">
                Year by year margin breakdown for {asset.asset_name} under earliest, central, and latest quantum estimates.
              </caption>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[11px]">
                  <th scope="col" className="py-2 px-2">Year</th>
                  <th scope="col" className="py-2 px-2">Needed (X+Y)</th>
                  <th scope="col" className="py-2 px-2">Z Earliest</th>
                  <th scope="col" className="py-2 px-2">Margin Earliest</th>
                  <th scope="col" className="py-2 px-2">Z Central</th>
                  <th scope="col" className="py-2 px-2">Margin Central</th>
                  <th scope="col" className="py-2 px-2">Z Latest</th>
                  <th scope="col" className="py-2 px-2">Margin Latest</th>
                  <th scope="col" className="py-2 px-2">Verdict Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {YEARS.map((yr) => {
                  const pe = earliest?.points.find((p) => p.year === yr);
                  const pc = central?.points.find((p) => p.year === yr);
                  const pl = latest?.points.find((p) => p.year === yr);

                  let statusText = 'Safe';
                  let statusBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300';
                  if (pc && pc.margin < 0) {
                    statusText = 'Late (Act Now)';
                    statusBadge = 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300';
                  } else if (pe && pe.margin < 0) {
                    statusText = 'At Risk (Plan Soon)';
                    statusBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300';
                  }

                  const isCur = yr === assessmentYear;

                  return (
                    <tr
                      key={yr}
                      className={isCur ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-bold' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40'}
                    >
                      <td className="py-1.5 px-2 font-bold text-slate-900 dark:text-white">
                        {yr} {isCur && '(Active)'}
                      </td>
                      <td className="py-1.5 px-2">{needed}y</td>
                      <td className="py-1.5 px-2">{pe?.zRem.toFixed(1)}y</td>
                      <td className={`py-1.5 px-2 ${pe && pe.margin < 0 ? 'text-red-600 font-bold' : ''}`}>
                        {pe ? `${pe.margin > 0 ? '+' : ''}${pe.margin.toFixed(1)}y` : 'N/A'}
                      </td>
                      <td className="py-1.5 px-2">{pc?.zRem.toFixed(1)}y</td>
                      <td className={`py-1.5 px-2 ${pc && pc.margin < 0 ? 'text-red-600 font-bold' : ''}`}>
                        {pc ? `${pc.margin > 0 ? '+' : ''}${pc.margin.toFixed(1)}y` : 'N/A'}
                      </td>
                      <td className="py-1.5 px-2">{pl?.zRem.toFixed(1)}y</td>
                      <td className={`py-1.5 px-2 ${pl && pl.margin < 0 ? 'text-red-600 font-bold' : ''}`}>
                        {pl ? `${pl.margin > 0 ? '+' : ''}${pl.margin.toFixed(1)}y` : 'N/A'}
                      </td>
                      <td className="py-1.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${statusBadge}`}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Small Multiple Compact Component for Top 3 Ranked Assets
// =========================================================================
interface MarginSmallMultipleProps {
  asset: EvaluatedAssetForMargin;
  assessmentYear: number;
  isDarkMode?: boolean;
  onSelectAsset?: (assetId: string) => void;
}

export const MarginSmallMultiple: React.FC<MarginSmallMultipleProps> = ({
  asset,
  assessmentYear,
  isDarkMode = false,
  onSelectAsset,
}) => {
  const needed = asset.x_plus_y;
  const by = asset.break_years;

  const seriesData = useMemo(() => {
    if (!by || by.central === null) return null;

    const buildPoints = (breakYearVal: number | null) => {
      if (breakYearVal === null) return [];
      return YEARS.map((yr) => ({
        year: yr,
        margin: Math.max(0, breakYearVal - yr) - needed,
      }));
    };

    const earliestPts = buildPoints(by.earliest);
    const centralPts = buildPoints(by.central);
    const latestPts = buildPoints(by.latest);

    let minVal = 0;
    let maxVal = 0;
    [...earliestPts, ...centralPts, ...latestPts].forEach((p) => {
      if (p.margin < minVal) minVal = p.margin;
      if (p.margin > maxVal) maxVal = p.margin;
    });

    const yFloor = Math.min(-5, Math.floor((minVal - 2) / 5) * 5);
    const yCeil = Math.max(5, Math.ceil((maxVal + 2) / 5) * 5);

    return {
      earliestPts,
      centralPts,
      latestPts,
      yFloor,
      yCeil,
      earliestDeadline: by.earliest ? by.earliest - needed : null,
      centralDeadline: by.central ? by.central - needed : null,
      latestDeadline: by.latest ? by.latest - needed : null,
    };
  }, [by, needed]);

  if (!seriesData) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
        <div className="font-bold text-slate-700 dark:text-slate-300">#{asset.rank} {asset.asset_name}</div>
        <p className="mt-1">Quantum-safe / Out of scope</p>
      </div>
    );
  }

  const {
    earliestPts,
    centralPts,
    latestPts,
    yFloor,
    yCeil,
    earliestDeadline,
    centralDeadline,
    latestDeadline,
  } = seriesData;

  const w = 320;
  const h = 150;
  const pad = { top: 15, right: 15, bottom: 22, left: 35 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  const getX = (yr: number) => pad.left + ((yr - REFERENCE_YEAR) / (MAX_YEAR - REFERENCE_YEAR)) * pw;
  const getY = (val: number) => pad.top + ((yCeil - val) / (yCeil - yFloor)) * ph;
  const zeroY = getY(0);

  const createPath = (points: { year: number; margin: number }[]) => {
    return points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.year).toFixed(1)} ${getY(p.margin).toFixed(1)}`)
      .join(' ');
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-xs flex flex-col justify-between space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400 text-xs">#{asset.rank}</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[180px]">
              {asset.asset_name}
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              asset.verdict_code === 'RED'
                ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                : asset.verdict_code === 'YELLOW'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {asset.verdict_display}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-1">
          <span>{asset.algorithm}</span>
          <span>Needed: <strong>{needed}y</strong></span>
        </div>
      </div>

      {/* Mini SVG Plot */}
      <div className="w-full">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
          {/* Shaded Deficit Zone */}
          {zeroY < pad.top + ph && (
            <rect
              x={pad.left}
              y={zeroY}
              width={pw}
              height={pad.top + ph - zeroY}
              fill={isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(254, 242, 242, 0.85)'}
            />
          )}

          {/* Zero Line */}
          <line
            x1={pad.left}
            y1={zeroY}
            x2={pad.left + pw}
            y2={zeroY}
            stroke="#E5484D"
            strokeWidth={1.2}
            strokeDasharray="4 3"
          />

          {/* Slider Year Vertical Line */}
          <line
            x1={getX(assessmentYear)}
            y1={pad.top}
            x2={getX(assessmentYear)}
            y2={pad.top + ph}
            stroke="#6366F1"
            strokeWidth={1.5}
            strokeDasharray="3 2"
          />

          {/* Scenario Lines */}
          {latestPts.length > 0 && (
            <path
              d={createPath(latestPts)}
              fill="none"
              stroke={isDarkMode ? '#14B8A6' : '#0D9488'}
              strokeWidth={1.8}
            />
          )}
          {centralPts.length > 0 && (
            <path
              d={createPath(centralPts)}
              fill="none"
              stroke={isDarkMode ? '#818CF8' : '#4F46E5'}
              strokeWidth={2}
            />
          )}
          {earliestPts.length > 0 && (
            <path
              d={createPath(earliestPts)}
              fill="none"
              stroke={isDarkMode ? '#94A3B8' : '#475569'}
              strokeWidth={1.8}
            />
          )}

          {/* Zero Crossing Dots */}
          {earliestDeadline !== null && earliestDeadline >= REFERENCE_YEAR && earliestDeadline <= MAX_YEAR && (
            <circle cx={getX(earliestDeadline)} cy={zeroY} r={3.5} fill="#DC2626" stroke="#fff" strokeWidth={1} />
          )}
          {centralDeadline !== null && centralDeadline >= REFERENCE_YEAR && centralDeadline <= MAX_YEAR && (
            <circle cx={getX(centralDeadline)} cy={zeroY} r={3.5} fill="#DC2626" stroke="#fff" strokeWidth={1} />
          )}
          {latestDeadline !== null && latestDeadline >= REFERENCE_YEAR && latestDeadline <= MAX_YEAR && (
            <circle cx={getX(latestDeadline)} cy={zeroY} r={3.5} fill="#DC2626" stroke="#fff" strokeWidth={1} />
          )}

          {/* Year axis labels */}
          <text x={pad.left} y={pad.top + ph + 13} className="text-[9px] font-mono fill-slate-400">
            2026
          </text>
          <text x={pad.left + pw} y={pad.top + ph + 13} textAnchor="end" className="text-[9px] font-mono fill-slate-400">
            2041
          </text>
        </svg>
      </div>

      {/* Action Deadline Summary Badges */}
      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono">
        <div className="flex items-center justify-between text-slate-500">
          <span>◆ Earliest deadline:</span>
          {earliestDeadline !== null && earliestDeadline < REFERENCE_YEAR ? (
            <span className="font-bold text-red-600 dark:text-red-400">Already late</span>
          ) : earliestDeadline !== null ? (
            <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(earliestDeadline)}</span>
          ) : (
            <span>N/A</span>
          )}
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>● Central deadline:</span>
          {centralDeadline !== null && centralDeadline < REFERENCE_YEAR ? (
            <span className="font-bold text-red-600 dark:text-red-400">Already late</span>
          ) : centralDeadline !== null ? (
            <span className="font-bold text-indigo-700 dark:text-indigo-300">{Math.round(centralDeadline)}</span>
          ) : (
            <span>N/A</span>
          )}
        </div>
      </div>

      {/* Select button */}
      {onSelectAsset && (
        <button
          type="button"
          onClick={() => onSelectAsset(asset.id)}
          className="w-full py-1 px-2 text-center text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          Inspect Asset Details &rarr;
        </button>
      )}
    </div>
  );
};
