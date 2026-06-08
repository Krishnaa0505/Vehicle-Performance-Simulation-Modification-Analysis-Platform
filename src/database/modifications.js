export const modifications = [
  {
    id: "stage1_ecu",
    name: "Stage 1 ECU Remap",
    category: "ECU Tuning",
    costRange: { polo_10_tsi: 25000, fortuner_28_d4d: 32000, bmw_f10_530d: 48000, bmw_f10_520d: 38000, honda_city_15_cvt: 18000 },
    hpMultiplier: 1.18,
    torqueMultiplier: 1.22,
    boostIncreaseBar: 0.3,
    volumetricEfficiencyOffset: 0.05,
    thermalStressMultiplier: 1.15,
    fatigueMultiplier: 1.12,
    kmplMultiplier: 1.05, // Remaps often slightly improve cruise fuel efficiency!
    requires: [],
    conflicts: ["stage2_ecu", "stage3_turbo"],
    description: "Software optimization of spark, timing, and boost limits. 100% stock hardware compatible. Adds highly responsive low-end torque."
  },
  {
    id: "stage2_ecu",
    name: "Stage 2 ECU Remap",
    category: "ECU Tuning",
    costRange: { polo_10_tsi: 35000, fortuner_28_d4d: 42000, bmw_f10_530d: 60000, bmw_f10_520d: 48000, honda_city_15_cvt: 28000 },
    hpMultiplier: 1.28,
    torqueMultiplier: 1.35,
    boostIncreaseBar: 0.5,
    volumetricEfficiencyOffset: 0.08,
    thermalStressMultiplier: 1.35,
    fatigueMultiplier: 1.28,
    kmplMultiplier: 0.95,
    requires: ["exhaust_downpipe", "cold_air_intake"],
    conflicts: ["stage1_ecu", "stage3_turbo"],
    description: "Aggressive software tune designed to leverage unrestricted intake and exhaust flow. Incredible gains but raises engine stress levels."
  },
  {
    id: "tcu_remap",
    name: "TCU Transmission Tune",
    category: "ECU Tuning",
    costRange: { polo_10_tsi: 25000, fortuner_28_d4d: 22000, bmw_f10_530d: 35000, bmw_f10_520d: 30000, honda_city_15_cvt: 20000 },
    hpMultiplier: 1.00,
    torqueMultiplier: 1.02, // slightly better delivery
    boostIncreaseBar: 0.0,
    volumetricEfficiencyOffset: 0.0,
    thermalStressMultiplier: 1.0,
    fatigueMultiplier: 0.95, // actually reduces mechanical gearbox stress by increasing clutch pressure
    kmplMultiplier: 1.02,
    requires: [],
    conflicts: [],
    description: "Modifies gearbox software to speed up shift times, adjust shift points, and increase clutch clamping pressure to bypass stock torque limits."
  },
  {
    id: "cold_air_intake",
    name: "Performance Cold Air Intake",
    category: "Bolt-ons",
    costRange: { polo_10_tsi: 18000, fortuner_28_d4d: 24000, bmw_f10_530d: 38000, bmw_f10_520d: 28000, honda_city_15_cvt: 12000 },
    hpMultiplier: 1.04,
    torqueMultiplier: 1.03,
    boostIncreaseBar: 0.02,
    volumetricEfficiencyOffset: 0.04,
    thermalStressMultiplier: 0.98, // helps pull colder air, slightly reducing stress
    fatigueMultiplier: 1.01,
    kmplMultiplier: 0.99,
    requires: [],
    conflicts: [],
    description: "High-flow intake pipe and heat-shielded filter. Delivers a denser, colder air charge and increases the engine's throatiness."
  },
  {
    id: "exhaust_downpipe",
    name: "Decat / High-Flow Downpipe & Exhaust",
    category: "Bolt-ons",
    costRange: { polo_10_tsi: 28000, fortuner_28_d4d: 35000, bmw_f10_530d: 55000, bmw_f10_520d: 45000, honda_city_15_cvt: 22000 },
    hpMultiplier: 1.08,
    torqueMultiplier: 1.06,
    boostIncreaseBar: 0.05,
    volumetricEfficiencyOffset: 0.07,
    thermalStressMultiplier: 0.95, // reduces backpressure, cooling the turbo down significantly!
    fatigueMultiplier: 1.02,
    kmplMultiplier: 0.97,
    requires: [],
    conflicts: [],
    description: "Replaces restrictive catalytic converter with a larger, high-flow decat or sports cat downpipe. Essential for Stage 2 power levels."
  },
  {
    id: "upgraded_intercooler",
    name: "Upgraded Performance Intercooler",
    category: "Bolt-ons",
    costRange: { polo_10_tsi: 32000, fortuner_28_d4d: 45000, bmw_f10_530d: 65000, bmw_f10_520d: 55000 },
    // Note: Honda City 1.5 NA has no stock intercooler piping — not applicable without a full turbo kit
    hpMultiplier: 1.03,
    torqueMultiplier: 1.02,
    boostIncreaseBar: 0.0,
    volumetricEfficiencyOffset: 0.02,
    thermalStressMultiplier: 0.85, // huge drop in thermal stress
    fatigueMultiplier: 1.00,
    kmplMultiplier: 1.00,
    requires: [],
    conflicts: [],
    description: "Larger core intercooler. Greatly decreases intake manifold temperatures (IAT), preventing heat-soak power loss on hot Indian summer afternoons."
  },
  {
    id: "stage3_turbo",
    name: "Stage 3 Hybrid Turbocharger Kit",
    category: "Forced Induction",
    costRange: { polo_10_tsi: 140000, fortuner_28_d4d: 180000, bmw_f10_530d: 240000, bmw_f10_520d: 190000, honda_city_15_cvt: 165000 },
    hpMultiplier: 1.55,
    torqueMultiplier: 1.50,
    boostIncreaseBar: 1.0,
    volumetricEfficiencyOffset: 0.15,
    thermalStressMultiplier: 1.65,
    fatigueMultiplier: 1.50,
    kmplMultiplier: 0.85,
    requires: ["exhaust_downpipe", "cold_air_intake", "upgraded_intercooler"],
    conflicts: ["stage1_ecu", "stage2_ecu"],
    description: "Upgraded compressor and turbine housing with custom internals. Moves massive volume of air at high boost. Forces full engine builds."
  },
  {
    id: "performance_tires",
    name: "Ultra-High Performance Tires",
    category: "Handling",
    costRange: { polo_10_tsi: 32000, fortuner_28_d4d: 65000, bmw_f10_530d: 85000, bmw_f10_520d: 75000, honda_city_15_cvt: 28000 },
    hpMultiplier: 1.00,
    torqueMultiplier: 1.00,
    boostIncreaseBar: 0.0,
    volumetricEfficiencyOffset: 0.0,
    thermalStressMultiplier: 1.00,
    fatigueMultiplier: 1.00,
    kmplMultiplier: 0.98, // slight rolling resistance increase
    requires: [],
    conflicts: [],
    description: "Sticky compound performance tires (e.g. Michelin Pilot Sport or Yokohama Advan). Dramatically reduces launch wheel spin to improve 0-100 km/h times."
  },
  {
    id: "lowering_suspension",
    name: "Lowering Springs / Street Coilovers",
    category: "Handling",
    costRange: { polo_10_tsi: 45000, fortuner_28_d4d: 75000, bmw_f10_530d: 95000, bmw_f10_520d: 80000, honda_city_15_cvt: 38000 },
    hpMultiplier: 1.00,
    torqueMultiplier: 1.00,
    boostIncreaseBar: 0.0,
    volumetricEfficiencyOffset: 0.0,
    thermalStressMultiplier: 1.00,
    fatigueMultiplier: 1.00,
    kmplMultiplier: 1.00,
    requires: [],
    conflicts: [],
    description: "Lowers center of gravity, reducing body roll and improving high-speed stability and aerodynamic drag coefficient ($C_d$ reduced by ~4%)."
  }
];
