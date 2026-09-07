// src/modules/compliance/__tests__/complianceEngine.test.js
import assert from 'node:assert';
import { runComplianceAudit, COMPLIANCE_STATUS } from '../index.js';
import { evaluateMRP, evaluateUnitSalePrice, evaluateFSSAI } from '../evaluators/declarationEvaluators.js';

export function runComplianceTests() {
  console.log('Starting Legal Metrology Compliance Module Unit Tests...\n');
  let passedTests = 0;

  // 1. Three-Way Missing Information Logic
  console.log('Test 1: Three-Way Missing Information Logic');
  {
    // Case 1A: Incomplete capture / low confidence -> VERIFICATION_REQUIRED
    const payloadLowConf = {
      product: { name: 'Test Wheat', category: 'General' },
      scanMetadata: { allSidesCaptured: false, imageQuality: 'low' },
      declarations: {
        mrp: { detected: true, rawText: 'MRP ₹100 incl. of all taxes' }
        // netQuantity missing
      }
    };
    const auditLow = runComplianceAudit(payloadLowConf);
    const netQtyFindingLow = auditLow.findings.find(f => f.field === 'netQuantity');
    assert.strictEqual(netQtyFindingLow.status, COMPLIANCE_STATUS.VERIFICATION_REQUIRED);

    // Case 1B: Complete high-confidence capture -> POTENTIAL_NON_COMPLIANCE
    const payloadHighConf = {
      product: { name: 'Test Wheat', category: 'General' },
      scanMetadata: { allSidesCaptured: true, imageQuality: 'high' },
      declarations: {
        mrp: { detected: true, rawText: 'MRP ₹100 incl. of all taxes' }
        // netQuantity missing
      }
    };
    const auditHigh = runComplianceAudit(payloadHighConf);
    const netQtyFindingHigh = auditHigh.findings.find(f => f.field === 'netQuantity');
    assert.strictEqual(netQtyFindingHigh.status, COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE);

    console.log('  ✔ Three-way missing declaration logic verified');
    passedTests++;
  }

  // 2. Rule 6(1)(e) MRP & Tax Statement
  console.log('\nTest 2: Rule 6(1)(e) MRP & Tax Statement');
  {
    // Passing case
    const passResult = evaluateMRP({ detected: true, rawText: 'MRP ₹120.00 (inclusive of all taxes)' }, { imageQuality: 'high' });
    assert.strictEqual(passResult.status, COMPLIANCE_STATUS.VERIFIED);

    // Failing case: missing tax clause
    const failTaxResult = evaluateMRP({ detected: true, rawText: '₹120.00' }, { imageQuality: 'high' });
    assert.strictEqual(failTaxResult.status, COMPLIANCE_STATUS.WARNING);

    // Obscured case: missing currency symbol
    const failCurrResult = evaluateMRP({ detected: true, rawText: '120.00 incl of taxes' }, { imageQuality: 'high' });
    assert.strictEqual(failCurrResult.status, COMPLIANCE_STATUS.WARNING);

    console.log('  ✔ Rule 6(1)(e) MRP & tax statement checks verified');
    passedTests++;
  }

  // 3. Rule 6(1)(h) Unit Sale Price (USP) Arithmetic
  console.log('\nTest 3: Rule 6(1)(h) Unit Sale Price (USP) Arithmetic');
  {
    // Package >= 1kg (2 kg @ MRP ₹200)
    const scanMeta = { imageQuality: 'high', allSidesCaptured: true };

    // Correct USP (₹100 per kg)
    const correctUSP = evaluateUnitSalePrice({
      mrp: { detected: true, rawText: 'MRP ₹200.00 incl. of all taxes' },
      netQuantity: { detected: true, rawText: '2 kg' },
      unitSalePrice: { detected: true, rawText: '₹100.00 per kg' }
    }, scanMeta);
    assert.strictEqual(correctUSP.status, COMPLIANCE_STATUS.VERIFIED);

    // Incorrect USP (₹80 per kg)
    const incorrectUSP = evaluateUnitSalePrice({
      mrp: { detected: true, rawText: 'MRP ₹200.00 incl. of all taxes' },
      netQuantity: { detected: true, rawText: '2 kg' },
      unitSalePrice: { detected: true, rawText: '₹80.00 per kg' }
    }, scanMeta);
    assert.strictEqual(incorrectUSP.status, COMPLIANCE_STATUS.WARNING);

    // Missing USP entirely on 2kg package
    const missingUSP = evaluateUnitSalePrice({
      mrp: { detected: true, rawText: 'MRP ₹200.00 incl. of all taxes' },
      netQuantity: { detected: true, rawText: '2 kg' }
    }, scanMeta);
    assert.strictEqual(missingUSP.status, COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE);

    // Package < 1kg (250 g @ MRP ₹40) without USP -> VERIFIED
    const smallPackNoUSP = evaluateUnitSalePrice({
      mrp: { detected: true, rawText: 'MRP ₹40.00 incl. of all taxes' },
      netQuantity: { detected: true, rawText: '250 g' }
    }, scanMeta);
    assert.strictEqual(smallPackNoUSP.status, COMPLIANCE_STATUS.VERIFIED);

    console.log('  ✔ Rule 6(1)(h) USP arithmetic & threshold checks verified');
    passedTests++;
  }

  // 4. FSSAI 14-Digit Format Check
  console.log('\nTest 4: FSSAI 14-Digit Format Check');
  {
    // Valid 14 digits
    const validFssai = evaluateFSSAI({ detected: true, rawText: '10012011000234' }, { imageQuality: 'high' });
    assert.strictEqual(validFssai.status, COMPLIANCE_STATUS.VERIFIED);

    // Malformed 10 digits
    const invalidFssai = evaluateFSSAI({ detected: true, rawText: '1001201100' }, { imageQuality: 'high' });
    assert.strictEqual(invalidFssai.status, COMPLIANCE_STATUS.WARNING);

    console.log('  ✔ FSSAI 14-digit format checks verified');
    passedTests++;
  }

  // 5. Adapter Fallback Safety
  console.log('\nTest 5: Adapter Fallback Safety');
  {
    const nullReport = runComplianceAudit(null);
    assert.ok(nullReport.inspectionId);
    assert.ok(nullReport.findings);
    assert.strictEqual(typeof nullReport.summary, 'object');

    const undefReport = runComplianceAudit(undefined);
    assert.ok(undefReport.inspectionId);
    assert.ok(undefReport.findings);

    const emptyObjReport = runComplianceAudit({});
    assert.ok(emptyObjReport.inspectionId);
    assert.ok(emptyObjReport.findings);

    console.log('  ✔ Adapter fallback safety verified (null/undefined/{} inputs handled cleanly)');
    passedTests++;
  }

  console.log(`\nAll ${passedTests} test suites passed successfully (0 failures)!`);
}
