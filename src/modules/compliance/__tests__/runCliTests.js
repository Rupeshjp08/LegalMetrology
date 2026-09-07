// src/modules/compliance/__tests__/runCliTests.js
import { runComplianceTests } from './complianceEngine.test.js';

try {
  runComplianceTests();
  process.exit(0);
} catch (err) {
  console.error('\n❌ Compliance Test Assertion Failed:');
  console.error(err);
  process.exit(1);
}
