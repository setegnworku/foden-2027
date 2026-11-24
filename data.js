/* All numbers shown on the page. Update here when the final results are in.
   Source: CURSOR_PROMPT_application_webpage.md, section 6, and SueFoden2027_application_draft.md.
   FIG_D and FIG_E are SIMULATED, interim results. */

const FIG_D = { // simulated, interim (56 of 70 model fits), paired gains in accuracy r(EBV, a)
  categories: ["Spatial field", "Ancestry-aware model (with field)", "Both together", "Breed-proportion model (simpler)"],
  series: [
    { name: "Same allele effects in both origins (r_g = 1)", values: [0.054, 0.043, 0.078, 0.004] },
    { name: "Different allele effects (r_g = 0.5)",          values: [0.041, 0.061, 0.099, 0.006] }
  ]
};
const FIG_E = { // simulated, r_g = 0.5, slope b(true BV on EBV) by breed class; 1 = correct scale
  categories: ["Class 1 (≥ 87.5 % exotic)", "Class 2 (60–87.5 %)", "Class 3 (36–60 %)", "Class 4 (< 36 % exotic)"],
  series: [
    { name: "One matrix (GPHS)",          values: [1.06, 0.95, 0.97, 0.71] },
    { name: "Ancestry-aware (GPHS-BOA)",  values: [1.12, 1.10, 1.07, 1.09] }
  ]
};
const FIG_H = { // £, requested from the Award, 12 weeks
  items: [ ["Return economy flight", 1100], ["UK visitor visa", 130], ["Accommodation (12 weeks)", 3840],
           ["Subsistence (84 days)", 2100], ["Local transport (12 weeks)", 330] ],
  total: 7500, alternative: "10-week visit: about £6,450"
};
const KEY_NUMBERS = { fieldGain: "+0.04 to +0.05", ancestryGain: "+0.03 to +0.06", bothGain: "+0.08 to +0.10" };
