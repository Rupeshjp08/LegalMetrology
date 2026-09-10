import { ENFORCEMENT_STATUS } from './constants'

/**
 * Sample notification register for the Member 4 UI preview.
 * Exactly five records covering the requested enforcement statuses.
 *
 * Dates are stored in YYYY-MM-DD ISO format for easy rendering.
 */
export const MOCK_NOTIFICATIONS = [
  {
    id: 'CN-2026-001',
    status: ENFORCEMENT_STATUS.PENDING_RESPONSE,
    company: {
      name: 'AquaPure Industries Pvt. Ltd.',
      registrationNo: 'LM/MP/2020/014733',
      address: 'Plot 14, Industrial Growth Centre, Pithampur, Dewas, Madhya Pradesh 454775',
      contactPerson: 'Sneha Deshmukh',
      phone: '+91 98900 11223',
      email: 'legal@aquapure.in',
    },
    product: {
      name: 'Mineral Water 1L',
      category: 'Food & Beverage',
      productId: 'AP-MW-001',
      batchNumber: 'AP240810',
      mrp: '₹20.00',
      netQuantity: '1 L',
    },
    violation: {
      title: 'Mandatory declarations missing',
      description:
        'The label does not carry all the mandatory declarations required under the rules, including the manufacturer details and MRP printed in the prescribed format.',
      type: 'Missing mandatory declarations',
      severity: 'Medium',
      penaltyProvision: 'Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      actSection: 'Legal Metrology Act, 2009 – Section 18',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0051',
      date: '2026-08-10',
      place: 'Wholesale godown inspection, Dewas',
      officer: {
        name: 'Ms. Kavita Rao',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, Dewas',
        badgeNo: 'LM-OF-0987',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1231',
      date: '2026-08-20',
      dueDate: '2026-08-30',
    },
    response: { type: null, message: '', date: '', submittedAt: null },
    reinspection: {
      date: null,
      officerName: '',
      result: null,
      remarks: '',
      scheduledAt: null,
      completedAt: null,
    },
    history: [
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-08-20', note: 'Show-cause notice issued to the company.' },
    ],
  },
  {
    id: 'CN-2026-002',
    status: ENFORCEMENT_STATUS.PENDING_RESPONSE,
    company: {
      name: 'FreshBite Foods Pvt. Ltd.',
      registrationNo: 'LM/GJ/2019/008412',
      address: 'Gala 21, GIDC, Vatva, Ahmedabad, Gujarat 382445',
      contactPerson: 'Rakesh Patel',
      phone: '+91 98250 44556',
      email: 'compliance@freshbitefoods.in',
    },
    product: {
      name: 'Packaged Biscuits',
      category: 'Food & Beverage',
      productId: 'FB-BS-102',
      batchNumber: 'FB240815',
      mrp: '₹40.00',
      netQuantity: '250 g',
    },
    violation: {
      title: 'Net quantity mismatch',
      description:
        'The declared net quantity does not match the actual quantity measured on inspection; sampled packs were found below the declared weight.',
      type: 'Under-filling / Short weight',
      severity: 'High',
      penaltyProvision: 'Rule 6(1)(d) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      actSection: 'Legal Metrology Act, 2009 – Sections 18 & 36',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0056',
      date: '2026-08-12',
      place: 'Retail outlet audit, Ahmedabad',
      officer: {
        name: 'Insp. Vipul Mehta',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, Ahmedabad',
        badgeNo: 'LM-OF-0821',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1237',
      date: '2026-08-22',
      dueDate: '2026-09-01',
    },
    response: { type: null, message: '', date: '', submittedAt: null },
    reinspection: {
      date: null,
      officerName: '',
      result: null,
      remarks: '',
      scheduledAt: null,
      completedAt: null,
    },
    history: [
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-08-22', note: 'Show-cause notice issued to the company.' },
    ],
  },
  {
    id: 'CN-2026-003',
    status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED,
    company: {
      name: 'NatureGlow Products Ltd.',
      registrationNo: 'LM/MH/2018/006910',
      address: 'Survey 110, MIDC, Ambernath, Thane, Maharashtra 421501',
      contactPerson: 'Amit Srivastava',
      phone: '+91 99100 33445',
      email: 'quality@natureglow.in',
    },
    product: {
      name: 'Edible Oil 1L',
      category: 'Food & Beverage',
      productId: 'NG-EO-205',
      batchNumber: 'NG240820',
      mrp: '₹150.00',
      netQuantity: '1 L',
    },
    violation: {
      title: 'MRP declaration issue',
      description:
        'The MRP / retail sale price was not printed on the label in the legible font size prescribed under the rules, and the declaration format is incorrect.',
      type: 'Improper declaration on label',
      severity: 'Medium',
      penaltyProvision: 'Rules 6(p) & 7 of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      actSection: 'Legal Metrology Act, 2009 – Section 18',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0061',
      date: '2026-08-15',
      place: 'Factory inspection, Ambernath',
      officer: {
        name: 'Insp. Anil Sharma',
        designation: 'Assistant Controller, Legal Metrology',
        department: 'Department of Legal Metrology, Thane',
        badgeNo: 'LM-OF-1124',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1242',
      date: '2026-08-25',
      dueDate: '2026-09-04',
    },
    response: {
      type: 'corrective-action',
      message:
        'The label artwork has been revised to print the MRP in the prescribed font size and format, and the revised batch is already in production.',
      date: '2026-08-29',
      submittedAt: '2026-08-29',
    },
    reinspection: {
      date: null,
      officerName: '',
      result: null,
      remarks: '',
      scheduledAt: null,
      completedAt: null,
    },
    history: [
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-08-25', note: 'Show-cause notice issued.' },
      { status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, at: '2026-08-29', note: 'Company submitted corrective-action response.' },
    ],
  },
  {
    id: 'CN-2026-004',
    status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED,
    company: {
      name: 'HealthyCare Ltd.',
      registrationNo: 'LM/KA/2017/003667',
      address: 'Plot 8, KIADB Industrial Area, Bommasandra, Bengaluru, Karnataka 560099',
      contactPerson: 'Divya Raman',
      phone: '+91 98430 77889',
      email: 'admin@healthylifecare.in',
    },
    product: {
      name: 'Herbal Tea 250g',
      category: 'Food & Beverage',
      productId: 'HC-HT-310',
      batchNumber: 'HC240825',
      mrp: '₹180.00',
      netQuantity: '250 g',
    },
    violation: {
      title: 'Manufacturer details missing',
      description:
        'The label does not declare the name and address of the manufacturer / packer as required under the rules.',
      type: 'Missing mandatory declarations',
      severity: 'Medium',
      penaltyProvision: 'Rule 6(1)(a) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      actSection: 'Legal Metrology Act, 2009 – Section 18',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0074',
      date: '2026-08-18',
      place: 'Pharmacy chain audit, Bengaluru',
      officer: {
        name: 'Insp. Rohit Bansal',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, Bengaluru',
        badgeNo: 'LM-OF-0777',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1248',
      date: '2026-08-28',
      dueDate: '2026-09-07',
    },
    response: {
      type: 'dispute',
      message:
        'The manufacturer details are printed on the inner sachet sleeve. We request a re-inspection of the affected batch before any penalty is imposed.',
      date: '2026-09-03',
      submittedAt: '2026-09-03',
    },
    reinspection: {
      date: '2026-09-16',
      officerName: 'Insp. Rohit Bansal',
      result: null,
      remarks: '',
      scheduledAt: '2026-09-05',
      completedAt: null,
    },
    history: [
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-08-28', note: 'Show-cause notice issued.' },
      { status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, at: '2026-09-03', note: 'Company disputed the violation and requested a re-inspection.' },
      { status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED, at: '2026-09-05', note: 'Re-inspection scheduled for 16 Sep 2026.' },
    ],
  },
  {
    id: 'CN-2026-005',
    status: ENFORCEMENT_STATUS.COMPLIANT,
    company: {
      name: 'MediSure Labs Pvt. Ltd.',
      registrationNo: 'LM/TN/2016/002210',
      address: '4th Cross, SIDCO Industrial Estate, Coimbatore, Tamil Nadu 641021',
      contactPerson: 'Manish Arora',
      phone: '+91 98110 22334',
      email: 'compliance@medisurelabs.in',
    },
    product: {
      name: 'Hand Sanitizer 100ml',
      category: 'Personal Care',
      productId: 'MS-HS-415',
      batchNumber: 'MS240830',
      mrp: '₹80.00',
      netQuantity: '100 ml',
    },
    violation: {
      title: 'Label declaration incomplete',
      description:
        'The label carried the product claims but was missing some statutory declarations, including the month and year of packaging in the prescribed form.',
      type: 'Missing mandatory declarations',
      severity: 'Low',
      penaltyProvision: 'Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      actSection: 'Legal Metrology Act, 2009 – Section 18',
      category: 'Personal Care',
    },
    inspection: {
      id: 'INS-2026-0082',
      date: '2026-08-20',
      place: 'Pharmacy wholesale audit, Coimbatore',
      officer: {
        name: 'Ms. Kavita Rao',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, Coimbatore',
        badgeNo: 'LM-OF-0987',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1254',
      date: '2026-08-30',
      dueDate: '2026-09-09',
    },
    response: {
      type: 'corrective-action',
      message:
        'The label has been redesigned with all statutory declarations printed in the required format, and corrected stock is now in the market.',
      date: '2026-09-04',
      submittedAt: '2026-09-04',
    },
    reinspection: {
      date: '2026-09-08',
      officerName: 'Ms. Kavita Rao',
      result: 'compliant',
      remarks: 'Re-inspection found the corrected labels fully compliant with the prescribed declarations.',
      scheduledAt: '2026-09-05',
      completedAt: '2026-09-08',
    },
    history: [
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-08-30', note: 'Show-cause notice issued.' },
      { status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, at: '2026-09-04', note: 'Company submitted corrective-action response.' },
      { status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED, at: '2026-09-05', note: 'Re-inspection scheduled for 08 Sep 2026.' },
      { status: ENFORCEMENT_STATUS.COMPLIANT, at: '2026-09-08', note: 'Re-inspection confirmed compliance.' },
    ],
  },
]