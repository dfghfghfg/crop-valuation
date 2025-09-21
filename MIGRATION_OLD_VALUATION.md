# Migrating Valuation Formulas Back to Pre-NPV Logic

This guide outlines how to keep the latest data model (additional fields, age-based curves, etc.) while restoring the “point 4” valuation rules that existed in commit `c28334f`. Only the valuation formulas change; keep all other enhancements made afterwards.

## 1. Keep the new scaffolding
- Leave the type aliases, `improductive_years`, lookup helpers, and QA handling that were introduced after `c28334f` as-is.
- Do **not** touch the yield/cost derivation logic (`getYieldPerHaForAge`, `resolveCostForAge`) or the updated phase detection that leverages `improductive_years`.

## 2. Remove the NPV projection block
In `lib/calculations/valuation-engine.ts`, inside `calculateBlockValuation`, delete the section that:
- Defines `discountRate`, `safeDiscountRate`, `blockNPV`, and builds `futureFlows`.
- Iterates over remaining years to append discounted flows.
- Sets `blockNPV` as the discounted sum and returns it as `value_block_cop`, `value_block_cop_per_ha`, and `npv`.

This block starts right after the phase classification and ends before the return object (approx. current lines 360–430).

## 3. Reintroduce the original valuation branches
Immediately after computing `netIncome`, reinstate the three-branch structure from `c28334f`:

```ts
let valueBlock: number

if (phase === "improductive") {
  const avgNetIncomeImprod = netIncome
  const inpFactor = block.inp_factor ?? 0.4
  const cumulativeOutlays = block.cumulative_outlays_to_date_cop ?? totalInvest
  valueBlock = cumulativeOutlays + inpFactor * avgNetIncomeImprod
  steps.push(`Improductive valuation: ${cumulativeOutlays.toLocaleString()} + (${inpFactor} × ${avgNetIncomeImprod.toLocaleString()}) = ${valueBlock.toLocaleString()} COP`)
} else if (peFlag === "PE-") {
  valueBlock = netIncome + totalInvest
  steps.push(`Productive PE- valuation: ${netIncome.toLocaleString()} + ${totalInvest.toLocaleString()} = ${valueBlock.toLocaleString()} COP`)
} else {
  valueBlock = netIncome
  steps.push(`Productive PE+ valuation: ${valueBlock.toLocaleString()} COP`)
}
```

- Keep the new `phase` logic (driven by `improductive_years`) so productive status is still derived from current rules.
- Retain `totalInvest` and `netIncome` definitions that already incorporate cost curves and financing inputs.

## 4. Restore per-hectare and simple NPV outputs
- Set `const valueBlockPerHa = block.block_area_ha > 0 ? valueBlock / block.block_area_ha : 0`.
- Reintroduce the one-period discount indicator:
  ```ts
  const npv = netIncome / (1 + (block.dnp_discount_rate ?? 0))
  steps.push(`NPV (1-year): ${netIncome.toLocaleString()} / (1 + ${(block.dnp_discount_rate * 100).toFixed(1)}%) = ${npv.toLocaleString()} COP`)
  ```
- Update the return object so `value_block_cop` is `valueBlock`, `value_block_cop_per_ha` uses the value above, and `npv` references the single-period figure.

## 5. Clean up now-unused helpers
- Remove any `import`/constant variables added only for the NPV block (e.g., `YEAR_IN_MS`, `blockNPV`, `futureFlows`) if they become unused.
- Ensure TypeScript still compiles; the rest of the function (QA flags, tier selection, parcel aggregation) stays unchanged.

## 6. Verify behaviour
1. Run existing tests or execute a representative valuation to confirm:
   - Improductive blocks now output accumulated outlays plus the `inp_factor` uplift.
   - Productive `PE-` blocks show `netIncome + totalInvest`.
   - Productive `PE+` blocks match `netIncome`.
2. Compare results against a snapshot from commit `c28334f` for a few sample parcels to validate parity.

Following these steps keeps the modern data pipeline (forms, DB fields, age curves) intact while reverting only the valuation formulas to the pre-NPV framework.
