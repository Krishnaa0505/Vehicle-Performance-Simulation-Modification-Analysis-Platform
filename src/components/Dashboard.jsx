import React, { useState, useEffect } from 'react';
import { vehicles } from '../database/vehicles.js';
import { modifications } from '../database/modifications.js';
import { 
  generatePerformanceCurves, 
  simulateVehicleDynamics, 
  calculateWearAndStress,
  optimizeBuild 
} from '../physics/simulator.js';
import { RingGauge, HorizontalProgressBar } from './Gauges.jsx';
import { PerformanceCharts } from './PerformanceCharts.jsx';
import { 
  Car, 
  Sliders, 
  Wrench, 
  Flame, 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  Cpu, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import '../styles/Dashboard.css';

// Indian currency formatter helper
function formatIndianCurrency(amount) {
  if (amount === 0) return "₹0";
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} Lakhs`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function Dashboard() {
  // --- States ---
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]);
  const [selectedModIds, setSelectedModIds] = useState([]);
  const [budgetLimit, setBudgetLimit] = useState(100000); // ₹1 Lakh default
  const [optimizationResult, setOptimizationResult] = useState(null);
  
  // Feedback loop state (ML Correction factor calibration factor)
  const [mlCalibrationPercent, setMlCalibrationPercent] = useState(100);
  const [userDynoVal, setUserDynoVal] = useState("");
  const [calibrationActive, setCalibrationActive] = useState(false);

  // Handle vehicle switch
  const handleVehicleChange = (e) => {
    const vehicle = vehicles.find(v => v.id === e.target.value);
    setSelectedVehicle(vehicle);
    setSelectedModIds([]); // reset mods
    setOptimizationResult(null);
    setCalibrationActive(false);
    setUserDynoVal("");
    setMlCalibrationPercent(100);
  };

  // Get current active modifications
  const activeMods = modifications.filter(mod => selectedModIds.includes(mod.id));

  // Toggle modifications
  const handleModToggle = (modId) => {
    const mod = modifications.find(m => m.id === modId);
    
    if (selectedModIds.includes(modId)) {
      // Remove mod
      setSelectedModIds(prev => prev.filter(id => id !== modId));
    } else {
      // Add mod - check conflict first
      const hasConflict = mod.conflicts.some(conflictId => selectedModIds.includes(conflictId));
      if (hasConflict) {
        // Automatically remove conflicted mods
        setSelectedModIds(prev => [
          ...prev.filter(id => !mod.conflicts.includes(id)),
          modId
        ]);
      } else {
        setSelectedModIds(prev => [...prev, modId]);
      }
    }
    setOptimizationResult(null);
  };

  // Pre-configured stages
  const applyStageProfile = (stageType) => {
    setOptimizationResult(null);
    if (stageType === 'stock') {
      setSelectedModIds([]);
    } else if (stageType === 'stage1') {
      setSelectedModIds(['stage1_ecu', 'cold_air_intake', 'performance_tires']);
    } else if (stageType === 'stage2') {
      setSelectedModIds(['stage2_ecu', 'cold_air_intake', 'exhaust_downpipe', 'upgraded_intercooler', 'performance_tires']);
    } else if (stageType === 'stage3') {
      // Polo needs TCU tune to bypass clutch limitations
      const poloExtra = selectedVehicle.id === 'polo_10_tsi' ? ['tcu_remap'] : [];
      setSelectedModIds([
        'stage3_turbo', 
        'cold_air_intake', 
        'exhaust_downpipe', 
        'upgraded_intercooler', 
        'performance_tires',
        'lowering_suspension',
        ...poloExtra
      ]);
    }
  };

  // Run budget optimizer
  const handleOptimize = () => {
    const opt = optimizeBuild(selectedVehicle, budgetLimit);
    if (opt.selectedMods.length > 0) {
      setSelectedModIds(opt.selectedMods.map(m => m.id));
      setOptimizationResult(opt);
    } else {
      alert("No optimal modifications found within this budget. Try raising your limit!");
    }
  };

  // Run feedback loop dyno calibration
  const handleCalibrateDyno = (e) => {
    e.preventDefault();
    const parsedUserHp = parseFloat(userDynoVal);
    if (isNaN(parsedUserHp) || parsedUserHp <= 0) {
      alert("Please enter a valid horsepower reading.");
      return;
    }

    // Get current physics simulated modified peak HP
    const baseSim = generatePerformanceCurves(selectedVehicle, activeMods);
    const simulatedPeakHp = baseSim.peaks.modHp;

    // Calculate ratio of actual vs simulated to define calibration correction percentage
    const ratio = (parsedUserHp / simulatedPeakHp) * 100;
    setMlCalibrationPercent(Math.round(ratio));
    setCalibrationActive(true);
  };

  const handleResetCalibration = () => {
    setMlCalibrationPercent(100);
    setUserDynoVal("");
    setCalibrationActive(false);
  };

  // --- Run Physics Engine Simulations ---
  const rawPowerCurves = generatePerformanceCurves(selectedVehicle, activeMods);

  // Apply the ML calibration scaling to the modified curves
  const calibrationFactor = mlCalibrationPercent / 100;
  const calibratedModHp = rawPowerCurves.modifiedHpCurve.map(hp => Math.round(hp * calibrationFactor));
  const calibratedModTorque = rawPowerCurves.modifiedTorqueCurve.map(tq => Math.round(tq * calibrationFactor));

  // Recalculate absolute peaks based on ML correction calibration
  const peakCalModHp = Math.max(...calibratedModHp);
  const peakCalModTorque = Math.max(...calibratedModTorque);

  const calibratedPeaks = {
    ...rawPowerCurves.peaks,
    modHp: peakCalModHp,
    modTorque: peakCalModTorque
  };

  // Run vehicle dynamics sprint & quarter-mile simulator
  const dynamics = simulateVehicleDynamics(selectedVehicle, calibratedPeaks, activeMods);

  // Calculate stress parameters
  const stress = calculateWearAndStress(selectedVehicle, activeMods, calibratedPeaks);

  // Total cost summation
  const totalCost = activeMods.reduce((sum, mod) => sum + mod.costRange[selectedVehicle.id], 0);

  // Auto scroll to optimization confirmation when active
  useEffect(() => {
    if (optimizationResult) {
      const el = document.getElementById("optimizer-notif");
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [optimizationResult]);

  return (
    <div className="dashboard-container">
      {/* Header Panel */}
      <header className="header">
        <div className="logo-section">
          <h1>Car Modification Analyser</h1>
          <p>Indian Automotive Enthusiasts & Tuners Simulation Deck</p>
        </div>
        <div className="badge-tag">
          Tuner Edition v1.4
        </div>
      </header>

      {/* Main Core Dashboard Grid */}
      <main className="dashboard-grid">
        
        {/* Left Side Controller Column */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. Vehicle Selection Card */}
          <div className="glass-panel">
            <h2 className="panel-title">
              <Car size={18} className="icon-cyan" />
              Select Base Vehicle
            </h2>
            
            <div className="select-group">
              <label className="select-label">Platform</label>
              <select 
                className="custom-select" 
                value={selectedVehicle.id}
                onChange={handleVehicleChange}
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-title">Engine Type</span>
                <span className="spec-value" style={{ fontSize: '11px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {selectedVehicle.engineType}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-title">Displacement</span>
                <span className="spec-value">{selectedVehicle.displacementCc} cc</span>
              </div>
              <div className="spec-item">
                <span className="spec-title">Factory Gearbox</span>
                <span className="spec-value" style={{ fontSize: '11px' }}>{selectedVehicle.gearbox}</span>
              </div>
              <div className="spec-item">
                <span className="spec-title">Stock Kmpl</span>
                <span className="spec-value">{selectedVehicle.baseKmpl} km/l</span>
              </div>
              <div className="spec-item">
                <span className="spec-title">Curb Weight</span>
                <span className="spec-value">{selectedVehicle.weightKg} kg</span>
              </div>
              <div className="spec-item">
                <span className="spec-title">Redline</span>
                <span className="spec-value" style={{ color: 'var(--red-glow)' }}>{selectedVehicle.rpmLimit} RPM</span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.4' }}>
              <strong>Tuning Insights:</strong> {selectedVehicle.notes}
            </p>
          </div>

          {/* 2. Tuner Packages Card */}
          <div className="glass-panel">
            <h2 className="panel-title">
              <Layers size={18} className="icon-cyan" />
              Quick Tuning Stages
            </h2>
            <div className="packages-grid">
              <div 
                className={`package-card ${selectedModIds.length === 0 ? 'active' : ''}`}
                onClick={() => applyStageProfile('stock')}
              >
                <span className="package-name">Stock</span>
                <p className="package-desc">Factory standards.</p>
                <span className="package-cost">₹0</span>
              </div>
              <div 
                className={`package-card ${selectedModIds.includes('stage1_ecu') && !selectedModIds.includes('stage3_turbo') ? 'active' : ''}`}
                onClick={() => applyStageProfile('stage1')}
              >
                <span className="package-name">Stage 1</span>
                <p className="package-desc">Software optimization.</p>
                <span className="package-cost">
                  {formatIndianCurrency(modifications.find(m => m.id === 'stage1_ecu').costRange[selectedVehicle.id])}
                </span>
              </div>
              <div 
                className={`package-card ${selectedModIds.includes('stage2_ecu') ? 'active' : ''}`}
                onClick={() => applyStageProfile('stage2')}
              >
                <span className="package-name">Stage 2</span>
                <p className="package-desc">Aggressive bolt-ons.</p>
                <span className="package-cost">Bolt-ons + Map</span>
              </div>
            </div>
            <button 
              className="opt-btn" 
              style={{ width: '100%', marginTop: '12px', background: 'var(--red-glow)', color: '#fff', fontSize: '11px', padding: '10px' }}
              onClick={() => applyStageProfile('stage3')}
            >
              🚀 Apply Extreme Stage 3 Setup
            </button>
          </div>

          {/* 3. Budget Optimizer Panel */}
          <div className="glass-panel optimizer-panel">
            <h2 className="panel-title" style={{ borderLeftColor: 'var(--green-glow)' }}>
              <Sparkles size={18} style={{ color: 'var(--green-glow)' }} />
              BHP Budget Optimizer
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.3' }}>
              Finds the absolute highest BHP gain combination of compatible modifications that does not exceed your limit.
            </p>
            <div className="budget-input-wrapper">
              <input 
                type="number"
                className="budget-input"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Budget in ₹"
              />
              <button className="opt-btn" onClick={handleOptimize}>
                Optimize
              </button>
            </div>

            {optimizationResult && (
              <div className="opt-results" id="optimizer-notif">
                <div className="opt-header-text">
                  <Sparkles size={14} /> Optimized Setup Applied!
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Gain: </strong>
                  <span style={{ color: 'var(--green-glow)', fontWeight: 'bold' }}>+{optimizationResult.hpGain} BHP</span>
                </div>
                <div>
                  <strong>Selected Components:</strong>
                  <ul style={{ paddingLeft: '16px', margin: '4px 0', color: 'rgba(255,255,255,0.75)' }}>
                    {optimizationResult.selectedMods.map(m => (
                      <li key={m.id} className="opt-item-bullet">
                        <span>{m.name}</span>
                        <span style={{ color: 'var(--cyan-glow)' }}>{formatIndianCurrency(m.cost)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ borderTop: '1px solid rgba(57, 255, 20, 0.2)', paddingTop: '6px', marginTop: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                  Total Cost: <span style={{ color: 'var(--green-glow)' }}>{formatIndianCurrency(optimizationResult.totalCost)}</span>
                </div>
              </div>
            )}
          </div>

        </section>

        {/* Right Side Main Analytical Content */}
        <section className="main-panels">
          
          {/* Top Performance Analytics Badges */}
          <div className="stats-grid-row">
            
            {/* BHP Badge */}
            <div className="glass-panel stat-glow-card stock">
              <span className="stat-label">Peak Power</span>
              <div className="stat-number" style={{ color: 'var(--green-glow)' }}>
                {calibratedPeaks.modHp} <span style={{ fontSize: '13px' }}>BHP</span>
              </div>
              <span className="stat-sub">
                Stock: {calibratedPeaks.stockHp} BHP ({calibratedPeaks.modHp - calibratedPeaks.stockHp >= 0 ? '+' : ''}{calibratedPeaks.modHp - calibratedPeaks.stockHp} BHP)
              </span>
            </div>

            {/* Torque Badge */}
            <div className="glass-panel stat-glow-card modified">
              <span className="stat-label">Peak Torque</span>
              <div className="stat-number" style={{ color: 'var(--cyan-glow)' }}>
                {calibratedPeaks.modTorque} <span style={{ fontSize: '13px' }}>Nm</span>
              </div>
              <span className="stat-sub">
                Stock: {calibratedPeaks.stockTorque} Nm ({calibratedPeaks.modTorque - calibratedPeaks.stockTorque >= 0 ? '+' : ''}{calibratedPeaks.modTorque - calibratedPeaks.stockTorque} Nm)
              </span>
            </div>

            {/* Acceleration Sprint Badge */}
            <div className="glass-panel stat-glow-card cost">
              <span className="stat-label">0-100 km/h Sprint</span>
              <div className="stat-number" style={{ color: '#ffaa00' }}>
                {dynamics.acceleration.modified} <span style={{ fontSize: '13px' }}>sec</span>
              </div>
              <span className="stat-sub">
                Stock: {dynamics.acceleration.stock}s ({(dynamics.acceleration.stock - dynamics.acceleration.modified).toFixed(1)}s faster)
              </span>
            </div>

            {/* Cost Badge */}
            <div className="glass-panel stat-glow-card risk">
              <span className="stat-label">Total Build Cost</span>
              <div className="stat-number" style={{ color: 'var(--cyan-glow)' }}>
                {formatIndianCurrency(totalCost)}
              </div>
              <span className="stat-sub">
                Tuned in Indian Rupees (INR)
              </span>
            </div>

          </div>

          {/* Dials / Gauges Layer */}
          <div className="gauges-container">
            {/* Peak boost = highest value in the boost curve across the full RPM sweep.
                Previously used boostCurve[length / 2] which returns undefined for odd-length arrays. */}
            {(() => {
              const peakBoost = parseFloat(Math.max(...rawPowerCurves.boostCurve).toFixed(2));
              return (
                <RingGauge 
                  value={peakBoost}
                  max={2.5}
                  label="Peak Boost"
                  unit="Bar"
                  color={peakBoost > 1.4 ? "red" : peakBoost > 0.5 ? "orange" : "cyan"}
                />
              );
            })()}
            <RingGauge 
              value={stress.mechanicalStress}
              max={100}
              label="Mechanical Stress"
              unit="%"
              color={stress.mechanicalStress > 75 ? "red" : stress.mechanicalStress > 50 ? "orange" : "green"}
            />
            <RingGauge 
              value={stress.riskScore}
              max={100}
              label="Engine Risk Factor"
              unit="%"
              color={stress.riskScore > 75 ? "red" : stress.riskScore > 40 ? "orange" : "green"}
            />
          </div>

          {/* Main Visual Dual-Axis Chart Panel */}
          <div className="glass-panel">
            <h2 className="panel-title">
              <Activity size={18} className="icon-cyan" />
              Dyno Chart: Power & Torque Curves
            </h2>
            <PerformanceCharts 
              rpmPoints={rawPowerCurves.rpmPoints}
              stockHp={rawPowerCurves.stockHpCurve}
              stockTorque={rawPowerCurves.stockTorqueCurve}
              modHp={calibratedModHp}
              modTorque={calibratedModTorque}
              redline={selectedVehicle.rpmLimit}
            />
          </div>

          {/* Bottom Dual Panels: Mod Selection & Stress Analysis */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Modifications Checkbox Panel */}
            <div className="glass-panel">
              <h2 className="panel-title">
                <Sliders size={18} className="icon-cyan" />
                Select Modifications
              </h2>
              <div className="mods-list">
                {modifications.map(mod => {
                  const cost = mod.costRange[selectedVehicle.id];
                  if (!cost) return null; // skip unsupported mods

                  const isActive = selectedModIds.includes(mod.id);
                  
                  // Check requirements
                  const reqsMet = mod.requires.every(reqId => selectedModIds.includes(reqId));
                  const isConflict = mod.conflicts.some(confId => selectedModIds.includes(confId));

                  return (
                    <div 
                      key={mod.id} 
                      className={`mod-card ${isActive ? 'active' : ''} ${!reqsMet ? 'disabled' : ''}`}
                      onClick={() => reqsMet && handleModToggle(mod.id)}
                    >
                      <div className="mod-checkbox-wrapper">
                        <input 
                          type="checkbox"
                          className="mod-checkbox"
                          checked={isActive}
                          disabled={!reqsMet}
                          onChange={() => {}} // handled in card onClick
                        />
                      </div>
                      <div className="mod-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="mod-name">{mod.name}</span>
                          <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                            {mod.category}
                          </span>
                        </div>
                        <p className="mod-description">{mod.description}</p>
                        
                        {mod.requires.length > 0 && !reqsMet && (
                          <div style={{ color: 'var(--red-glow)', fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>
                            ⚠️ Requires: {mod.requires.map(rId => modifications.find(m => m.id === rId).name).join(", ")}
                          </div>
                        )}

                        <div className="mod-meta">
                          <span className="mod-cost">{formatIndianCurrency(cost)}</span>
                          <span className="mod-gain">+{Math.round((mod.hpMultiplier - 1.0) * 100)}% BHP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Durability, Dyno Feedback & Warnings Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Reliability & Durability panel */}
              <div className="glass-panel">
                <h2 className="panel-title">
                  <Flame size={18} className="icon-cyan" />
                  Reliability & Longevity
                </h2>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Safety Index Rating</span>
                    <span style={{ 
                      color: stress.riskScore > 75 ? 'var(--red-glow)' : stress.riskScore > 40 ? 'var(--orange-glow)' : 'var(--green-glow)',
                      fontWeight: 'bold', 
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}>
                      {stress.safetyRating}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Est. Engine Life Expectancy</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace' }}>
                      {stress.longevityKm.toLocaleString('en-IN')} km
                    </span>
                  </div>

                  <HorizontalProgressBar label="Thermal Load Stress" value={stress.thermalStress} colorHex="var(--orange-glow)" />
                  <HorizontalProgressBar label="Mechanical Load Fatigue" value={stress.mechanicalStress} colorHex="var(--red-glow)" />
                </div>

                {/* Warnings warning box */}
                {stress.gearLimitExceeded && (
                  <div className="alert-warning-box">
                    <AlertTriangle size={24} className="alert-warning-icon" />
                    <div className="alert-warning-text">
                      <strong>Gearbox Clutch Slipping Risk!</strong> Base torque ({calibratedPeaks.modTorque} Nm) exceeds the stock {selectedVehicle.gearbox} capacity threshold of {selectedVehicle.gearboxTorqueLimitNm} Nm. <strong>Upgrade to TCU Tune to resolve.</strong>
                    </div>
                  </div>
                )}

                {stress.riskScore > 50 && !activeMods.some(m => m.id === 'upgraded_intercooler') && (
                  <div className="alert-warning-box" style={{ background: 'rgba(255, 123, 0, 0.1)', borderColor: 'var(--orange-glow)' }}>
                    <AlertTriangle size={24} style={{ color: 'var(--orange-glow)' }} />
                    <div className="alert-warning-text">
                      <strong>High Intake Temperatures (Heat Soak):</strong> High boost is running without an upgraded Intercooler. Manifold temperatures will spike, significantly lowering real-world performance under hot Indian heat.
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Feedback Loop: Dyno correction panel */}
              <div className="glass-panel dyno-panel">
                <h2 className="panel-title" style={{ borderLeftColor: 'var(--red-glow)' }}>
                  <Cpu size={18} style={{ color: 'var(--red-glow)' }} />
                  ML Dyno Calibration Loop
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
                  If you have real-world dyno sheets for this build, enter the peak horsepower below. The machine learning model will adjust its calibration correction coefficient to match.
                </p>

                <form className="dyno-inputs" onSubmit={handleCalibrateDyno}>
                  <input 
                    type="number"
                    className="dyno-input"
                    value={userDynoVal}
                    onChange={(e) => setUserDynoVal(e.target.value)}
                    placeholder="Dyno HP"
                  />
                  <button type="submit" className="dyno-btn">
                    Calibrate
                  </button>
                  {calibrationActive && (
                    <button type="button" className="dyno-btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }} onClick={handleResetCalibration}>
                      Reset
                    </button>
                  )}
                </form>

                <div className="dyno-status-text">
                  <strong>ML Status: </strong>
                  {calibrationActive ? (
                    <span style={{ color: 'var(--red-glow)', fontWeight: 'bold' }}>
                      Calibrated ({mlCalibrationPercent}% scale factor applied)
                    </span>
                  ) : (
                    <span>Running nominal mathematical physical curves.</span>
                  )}
                </div>
              </div>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}
