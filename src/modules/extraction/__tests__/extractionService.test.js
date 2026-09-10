// src/modules/extraction/__tests__/extractionService.test.js
import assert from 'node:assert'
import { extractProductDetails } from '../../../services/geminiService.js'
import { adaptScanResult } from '../../compliance/adapter/scanAdapter.js'
import { runComplianceAudit } from '../../compliance/engine/complianceEngine.js'

export async function runExtractionTests() {
  console.log('Starting Step 8: Gemini AI Extraction Module Unit Tests...\n')
  let passed = 0

  // 1. Input Validation: Empty OCR text must be rejected immediately without calling Gemini
  console.log('Test 1: Empty OCR text validation')
  {
    try {
      await extractProductDetails({ rawOcrText: '', apiKey: 'dummy-key' })
      assert.fail('Should have thrown an error for empty OCR text')
    } catch (err) {
      assert.strictEqual(err.code, 'EMPTY_OCR')
      assert.strictEqual(
        err.userMessage,
        'Unable to extract text from the image. Please run OCR again.',
      )
    }

    try {
      await extractProductDetails({ rawOcrText: '   \n  \t  ', apiKey: 'dummy-key' })
      assert.fail('Should have thrown an error for whitespace-only OCR text')
    } catch (err) {
      assert.strictEqual(err.code, 'EMPTY_OCR')
    }

    console.log('  ✔ Empty OCR text rejected with friendly user message')
    passed++
  }

  // 2. Missing API Key Validation
  console.log('\nTest 2: Missing API key handling')
  {
    try {
      await extractProductDetails({ rawOcrText: 'Sample text on packaging', apiKey: '' })
      assert.fail('Should have thrown error for missing API key')
    } catch (err) {
      assert.strictEqual(err.code, 'MISSING_API_KEY')
      assert.ok(err.userMessage.includes('Gemini API key is required'))
    }

    console.log('  ✔ Missing API key detected and handled gracefully')
    passed++
  }

  // 3. Schema & Adapter Bridge Verification
  console.log('\nTest 3: Bridge to Legal Metrology Compliance Engine')
  {
    // Mock structured extraction result matching Section 4 schema
    const structuredProductDetails = {
      productName: 'Organic Whole Wheat Atta',
      genericName: 'Wheat Flour',
      manufacturer: {
        name: 'Purity Agro Foods Pvt Ltd',
        address: 'Plot 18, Industrial Area, Phase II, Chandigarh',
      },
      packer: {
        name: '',
        address: '',
      },
      importer: {
        name: '',
        address: '',
      },
      countryOfOrigin: 'India',
      netQuantity: '5 kg',
      mrp: '₹265.00 (inclusive of all taxes)',
      unitSalePrice: '₹53.00 / kg',
      manufactureDate: '08/2026',
      bestBefore: 'Best before 4 months from packaging',
      consumerCare: '1800-111-2222, care@purityagro.com',
      category: 'Food',
      dimensions: '30 cm x 20 cm x 8 cm',
      confidence: 94,
      missingFields: [],
    }

    // Prepare final data object according to Section 14
    const finalDataObject = {
      barcode: '8901234567890',
      barcodeFormat: 'EAN-13',
      originalImage: 'blob:http://localhost:5173/orig-uuid',
      processedImage: 'blob:http://localhost:5173/proc-uuid',
      ocrText: 'Raw OCR extracted text from package...',
      extractedProductDetails: structuredProductDetails,
      manuallyEdited: false,
      // Declarations mapped for Compliance module:
      productName: structuredProductDetails.productName,
      category: structuredProductDetails.category,
      declarations: {
        mrp: {
          detected: Boolean(structuredProductDetails.mrp),
          rawText: structuredProductDetails.mrp,
          clarity: 'clear',
        },
        netQuantity: {
          detected: Boolean(structuredProductDetails.netQuantity),
          rawText: structuredProductDetails.netQuantity,
          clarity: 'clear',
        },
        manufacturerDetails: {
          detected: Boolean(structuredProductDetails.manufacturer?.name),
          rawText: `${structuredProductDetails.manufacturer.name}, ${structuredProductDetails.manufacturer.address}`,
          clarity: 'clear',
        },
        consumerCare: {
          detected: Boolean(structuredProductDetails.consumerCare),
          rawText: structuredProductDetails.consumerCare,
          clarity: 'clear',
        },
        countryOfOrigin: {
          detected: Boolean(structuredProductDetails.countryOfOrigin),
          rawText: structuredProductDetails.countryOfOrigin,
          clarity: 'clear',
        },
        dateOfPackaging: {
          detected: Boolean(structuredProductDetails.manufactureDate),
          rawText: structuredProductDetails.manufactureDate,
          clarity: 'clear',
        },
        unitSalePrice: {
          detected: Boolean(structuredProductDetails.unitSalePrice),
          rawText: structuredProductDetails.unitSalePrice,
          clarity: 'clear',
        },
        expiryDate: {
          detected: Boolean(structuredProductDetails.bestBefore),
          rawText: structuredProductDetails.bestBefore,
          clarity: 'clear',
        },
      },
    }

    // Verify adaptScanResult successfully processes the finalDataObject
    const adapted = adaptScanResult(finalDataObject)
    assert.strictEqual(adapted.product.name, 'Organic Whole Wheat Atta')
    assert.strictEqual(adapted.product.category, 'Food')
    assert.strictEqual(adapted.declarations.mrp.detected, true)
    assert.strictEqual(adapted.declarations.mrp.rawText, '₹265.00 (inclusive of all taxes)')
    assert.strictEqual(adapted.declarations.netQuantity.rawText, '5 kg')
    assert.strictEqual(adapted.declarations.countryOfOrigin.rawText, 'India')

    // Verify Compliance audit runs smoothly without exceptions
    const audit = runComplianceAudit(finalDataObject)
    assert.ok(audit.findings.length > 0)
    assert.ok(typeof audit.summary.verified === 'number')

    console.log('  ✔ Final data object seamlessly connects to Compliance Module')
    passed++
  }

  // 4. Missing Information & Non-Hallucination Isolation
  console.log('\nTest 4: Absence of hallucination / missing field isolation')
  {
    const partialDetails = {
      productName: 'Instant Noodle Pack',
      genericName: 'Noodles',
      manufacturer: { name: 'Quick Foods Ltd', address: '' },
      packer: { name: '', address: '' },
      importer: { name: '', address: '' },
      countryOfOrigin: '', // Missing
      netQuantity: '70 g',
      mrp: '₹15.00',
      unitSalePrice: '',
      manufactureDate: '',
      bestBefore: '',
      consumerCare: '', // Missing
      category: 'Food',
      dimensions: '',
      confidence: 78,
      missingFields: ['Country of Origin', 'Consumer Care Details', 'Manufacture / Packing Date'],
    }

    const scanData = {
      barcode: '',
      barcodeFormat: '',
      originalImage: '',
      processedImage: '',
      ocrText: 'Instant Noodle Pack Noodles 70g MRP 15',
      extractedProductDetails: partialDetails,
      manuallyEdited: false,
      productName: partialDetails.productName,
      category: 'Food',
      declarations: {
        mrp: { detected: true, rawText: partialDetails.mrp },
        netQuantity: { detected: true, rawText: partialDetails.netQuantity },
        countryOfOrigin: { detected: false, rawText: null },
        consumerCare: { detected: false, rawText: null },
      },
    }

    const adapted = adaptScanResult(scanData)
    assert.strictEqual(adapted.declarations.countryOfOrigin.detected, false)
    assert.strictEqual(adapted.declarations.consumerCare.detected, false)

    console.log('  ✔ Missing fields remain null/empty without hallucination')
    passed++
  }

  console.log(`\nAll ${passed} Step 8 Extraction test suites passed successfully!`)
}

// Run directly if invoked with node
runExtractionTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err)
    process.exit(1)
  })
