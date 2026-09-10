import { ENFORCEMENT_STATUS } from './constants'

/**
 * Sample notification register for the Member 4 UI preview.
 * Records intentionally cover every enforcement status so the
 * status model can be exercised end to end.
 *
 * Dates are stored in YYYY-MM-DD ISO format for easy rendering.
 */
export const MOCK_NOTIFICATIONS = [
  {
    id: 'CN-2026-001',
    status: ENFORCEMENT_STATUS.PENDING_RESPONSE,
    company: {
      name: 'Sunrise Bakeries Ltd.',
      registrationNo: 'LM/KA/2019/008412',
      address: 'Plot 42, Peenya Industrial Area, Bengaluru, Karnataka 560058',
      contactPerson: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'compliance@sunrisebakeries.in',
    },
    product: {
      name: 'Standard Packaged Biscuits 250 g',
      category: 'Food & Beverage',
      productId: 'SB-250G-BIS',
      batchNumber: 'BATCH-2608',
      mrp: '₹40.00',
      netQuantity: '250 g',
    },
    violation: {
      title: 'Net quantity shortfall beyond permitted tolerance',
      description:
        'Declared net quantity is 250 g, but inspected units averaged 241 g across a sample of 12 packs, exceeding the maximum permissible error of 9 g under the rules.',
      type: 'Under-filling / Short weight',
      severity: 'High',
      penaltyProvision: 'Section 36(1) read on Rules 2(r), 6(1) & 23 of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Rule 6(1)(d) – Declaration of net quantity',
      actSection: 'Legal Metrology Act, 2009 – Sections 18 & 36',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0042',
      date: '2026-08-12',
      place: 'Retail market check, Peenya Hub, Bengaluru',
      officer: {
        name: 'Insp. Anil Sharma',
        designation: 'Assistant Controller, Legal Metrology',
        department: 'Department of Legal Metrology, Bengaluru',
        badgeNo: 'LM-OF-1124',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1189',
      date: '2026-08-18',
      dueDate: '2026-08-28',
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
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-08-18', note: 'Show-cause notice issued to the company.' },
    ],
  },
  {
    id: 'CN-2026-002',
    status: ENFORCEMENT_STATUS.PENDING_RESPONSE,
    company: {
      name: 'AquaPure Beverages Pvt. Ltd.',
      registrationNo: 'LM/MH/2020/014733',
      address: 'Gala 7, MIDC, Chakan, Pune, Maharashtra 410501',
      contactPerson: 'Sneha Deshmukh',
      phone: '+91 98900 11223',
      email: 'legal@aquapure.in',
    },
    product: {
      name: 'Mineral Water 1 L',
      category: 'Food & Beverage',
      productId: 'AP-MW-1L',
      batchNumber: 'AP-2607-14',
      mrp: '₹20.00',
      netQuantity: '1 L',
    },
    violation: {
      title: 'Mandatory consumer care details missing on label',
      description:
        'The label does not declare the consumer care helpline / contact details, and the cell number printed in the batch area is illegible.',
      type: 'Missing mandatory declarations',
      severity: 'Medium',
      penaltyProvision: 'Rule 6(1)(i) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Rule 6(1)(i) – Consumer care details / helpline',
      actSection: 'Legal Metrology Act, 2009 – Section 18',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0051',
      date: '2026-08-10',
      place: 'Wholesale godown inspection, Pune',
      officer: {
        name: 'Ms. Kavita Rao',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, Pune',
        badgeNo: 'LM-OF-0987',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1194',
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
    id: 'CN-2026-003',
    status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED,
    company: {
      name: 'Naturals Agro Foods',
      registrationNo: 'LM/GJ/2018/005910',
      address: 'Survey 88, GIDC, Vatva, Ahmedabad, Gujarat 382445',
      contactPerson: 'Rakesh Patel',
      phone: '+91 98250 44556',
      email: 'quality@naturalsagro.in',
    },
    product: {
      name: 'Edible Soybean Oil 500 ml',
      category: 'Food & Beverage',
      productId: 'NA-SO-500ML',
      batchNumber: 'SO-2606-22',
      mrp: '₹145.00',
      netQuantity: '500 ml',
    },
    violation: {
      title: 'Net quantity shortfall in filled packs',
      description:
        'Sample of 10 bottles showed an average quantity of 478 ml against the declared 500 ml, above the maximum permissible error of 4.5 ml.',
      type: 'Under-filling / Short weight',
      severity: 'High',
      penaltyProvision: 'Section 36(1) read with Rule 6(1)(d) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Rule 6(1)(d) – Declaration of net quantity',
      actSection: 'Legal Metrology Act, 2009 – Sections 18 & 36',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0077',
      date: '2026-08-02',
      place: 'Retail outlet audit, Ahmedabad',
      officer: {
        name: 'Insp. Vipul Mehta',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, Ahmedabad',
        badgeNo: 'LM-OF-0821',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1201',
      date: '2026-08-06',
      dueDate: '2026-08-16',
    },
    response: {
      type: 'corrective-action',
      message:
        'We accept the shortfall. A revised filling SOP with inline check-weighers has been deployed and the affected batch has been recalled from the market.',
      date: '2026-08-14',
      submittedAt: '2026-08-14',
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
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-08-06', note: 'Show-cause notice issued.' },
      { status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, at: '2026-08-14', note: 'Company submitted corrective-action response.' },
    ],
  },
  {
    id: 'CN-2026-004',
    status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED,
    company: {
      name: 'Krunchy Foods',
      registrationNo: 'LM/DL/2021/009244',
      address: 'B-14, Okhla Industrial Area Phase II, New Delhi 110020',
      contactPerson: 'Manish Arora',
      phone: '+91 98110 22334',
      email: 'compliance@krunchyfoods.com',
    },
    product: {
      name: 'Instant Noodles 65 g',
      category: 'Food & Beverage',
      productId: 'KF-NOOD-65G',
      batchNumber: 'KF-2617-09',
      mrp: '₹12.00',
      netQuantity: '65 g',
    },
    violation: {
      title: 'Missing MRP / retail sale price declaration',
      description:
        'The outer carton and the individual pack did not print the MRP (retail sale price) in a legible font of the required size.',
      type: 'Missing mandatory declarations',
      severity: 'Medium',
      penaltyProvision: 'Rules 6(p) & 7 of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Rules 6(p) & 7 – Retail sale price (MRP) declaration',
      actSection: 'Legal Metrology Act, 2009 – Section 18',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0089',
      date: '2026-07-28',
      place: 'Supermarket audit, Saket, New Delhi',
      officer: {
        name: 'Insp. Rohit Bansal',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, New Delhi',
        badgeNo: 'LM-OF-0777',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1208',
      date: '2026-08-02',
      dueDate: '2026-08-12',
    },
    response: {
      type: 'dispute',
      message:
        'The MRP is printed on the side panel of the pack in the required font size. We request a re-inspection with photographs before any penalty is imposed.',
      date: '2026-08-10',
      submittedAt: '2026-08-10',
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
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-08-02', note: 'Show-cause notice issued.' },
      { status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, at: '2026-08-10', note: 'Company disputed the violation and requested re-inspection.' },
    ],
  },
  {
    id: 'CN-2026-005',
    status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED,
    company: {
      name: 'Sahil Mills Limited',
      registrationNo: 'LM/UP/2017/003667',
      address: 'Plot 5, UPSIDC, Unnao, Uttar Pradesh 209801',
      contactPerson: 'Nirbhay Singh',
      phone: '+91 97200 55667',
      email: 'admin@sahilmills.in',
    },
    product: {
      name: 'Wheat Flour (Atta) 5 kg',
      category: 'Food & Beverage',
      productId: 'SM-ATTA-5KG',
      batchNumber: 'SM-2623-31',
      mrp: '₹245.00',
      netQuantity: '5 kg',
    },
    violation: {
      title: 'Net quantity shortfall in large packs',
      description:
        'Weighed 12 bags from a consignment; the average net weight was 4.76 kg against the declared 5 kg, exceeding the maximum permissible error for 5 kg packs.',
      type: 'Under-filling / Short weight',
      severity: 'High',
      penaltyProvision: 'Section 36(1) read with Rules 2(r) & 6(1)(d) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Rule 6(1)(d) – Declaration of net quantity',
      actSection: 'Legal Metrology Act, 2009 – Sections 18 & 36',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0095',
      date: '2026-07-22',
      place: 'Flour mill premises, Unnao',
      officer: {
        name: 'Insp. Anil Sharma',
        designation: 'Assistant Controller, Legal Metrology',
        department: 'Department of Legal Metrology, Kanpur',
        badgeNo: 'LM-OF-1124',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1211',
      date: '2026-07-27',
      dueDate: '2026-08-06',
    },
    response: {
      type: 'accept',
      message:
        'We admit the shortfall caused by a faulty packing scale in the 5 kg line. The scale has been replaced and we are ready for a re-inspection.',
      date: '2026-08-04',
      submittedAt: '2026-08-04',
    },
    reinspection: {
      date: '2026-09-15',
      officerName: 'Insp. Anil Sharma',
      result: null,
      remarks: '',
      scheduledAt: '2026-08-20',
      completedAt: null,
    },
    history: [
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-07-27', note: 'Show-cause notice issued.' },
      { status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, at: '2026-08-04', note: 'Company accepted the violation.' },
      { status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED, at: '2026-08-20', note: 'Re-inspection scheduled for 15 Sep 2026.' },
    ],
  },
  {
    id: 'CN-2026-006',
    status: ENFORCEMENT_STATUS.COMPLIANT,
    company: {
      name: 'Medicure Oral Care',
      registrationNo: 'LM/TN/2022/011203',
      address: '3rd Cross, SIDCO Industrial Estate, Coimbatore, Tamil Nadu 641021',
      contactPerson: 'Divya Raman',
      phone: '+91 98430 77889',
      email: 'quality@medicureoral.in',
    },
    product: {
      name: 'Herbal Toothpaste 150 g',
      category: 'Personal Care',
      productId: 'MC-TP-150G',
      batchNumber: 'MC-2628-05',
      mrp: '₹95.00',
      netQuantity: '150 g',
    },
    violation: {
      title: 'Declared net quantity printed in non-standard units',
      description:
        'The label declared the net quantity as "0.15 kg" without the name of the commodity in standard units and did not state the number of pieces inside.',
      type: 'Improper declaration on label',
      severity: 'Low',
      penaltyProvision: 'Rule 6(1)(h) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Rule 6(1)(h) – Net quantity in standard units of weight / measure',
      actSection: 'Legal Metrology Act, 2009 – Section 18',
      category: 'Personal Care',
    },
    inspection: {
      id: 'INS-2026-0103',
      date: '2026-07-18',
      place: 'Pharmacy chain audit, Coimbatore',
      officer: {
        name: 'Ms. Kavita Rao',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, Coimbatore',
        badgeNo: 'LM-OF-0987',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1215',
      date: '2026-07-22',
      dueDate: '2026-08-01',
    },
    response: {
      type: 'corrective-action',
      message:
        'The label artwork has been corrected to declare "150 g" in standard units, and the revised labels are already in production.',
      date: '2026-07-30',
      submittedAt: '2026-07-30',
    },
    reinspection: {
      date: '2026-08-25',
      officerName: 'Ms. Kavita Rao',
      result: 'compliant',
      remarks: 'Revised labels verified on fresh stock. Net quantity, MRP and consumer care details are now correctly declared.',
      scheduledAt: '2026-07-31',
      completedAt: '2026-08-25',
    },
    history: [
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-07-22', note: 'Show-cause notice issued.' },
      { status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, at: '2026-07-30', note: 'Company submitted corrective-action response.' },
      { status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED, at: '2026-07-31', note: 'Re-inspection scheduled for 25 Aug 2026.' },
      { status: ENFORCEMENT_STATUS.COMPLIANT, at: '2026-08-25', note: 'Re-inspection confirmed compliance.' },
    ],
  },
  {
    id: 'CN-2026-007',
    status: ENFORCEMENT_STATUS.VIOLATION_CONFIRMED,
    company: {
      name: 'Kabir Edible Oils Pvt. Ltd.',
      registrationNo: 'LM/HR/2019/006821',
      address: 'Khasra 112, Sector 8, IMT Manesar, Gurugram, Haryana 122050',
      contactPerson: 'Amit Srivastava',
      phone: '+91 99100 33445',
      email: 'ops@kabirists.in',
    },
    product: {
      name: 'Mustard Oil Pouch 1 L',
      category: 'Food & Beverage',
      productId: 'KE-MO-1L',
      batchNumber: 'KE-2620-18',
      mrp: '₹185.00',
      netQuantity: '1 L',
    },
    violation: {
      title: 'Persistent net quantity shortfall in pouches',
      description:
        'Pouches averaged 935 ml against the declared 1 L. The earlier notice and re-inspection both confirmed the shortfall, indicating systemic under-filling.',
      type: 'Under-filling / Short weight',
      severity: 'High',
      penaltyProvision: 'Section 36(1) read with Rules 2(r) & 6(1)(d) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Rule 6(1)(d) – Declaration of net quantity',
      actSection: 'Legal Metrology Act, 2009 – Sections 18 & 36',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0118',
      date: '2026-06-30',
      place: 'Distributor godown, Manesar',
      officer: {
        name: 'Insp. Vipul Mehta',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, Gurugram',
        badgeNo: 'LM-OF-0821',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1220',
      date: '2026-07-05',
      dueDate: '2026-07-15',
    },
    response: {
      type: 'dispute',
      message:
        'We dispute the sample weighing methodology and the temperature correction applied. We have requested a joint re-inspection.',
      date: '2026-07-13',
      submittedAt: '2026-07-13',
    },
    reinspection: {
      date: '2026-08-05',
      officerName: 'Insp. Vipul Mehta',
      result: 'still-violated',
      remarks: 'Joint re-inspection with an independent verifier reconfirmed an average shortfall of 62 ml per pouch.',
      scheduledAt: '2026-07-16',
      completedAt: '2026-08-05',
    },
    history: [
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-07-05', note: 'Show-cause notice issued.' },
      { status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, at: '2026-07-13', note: 'Company disputed the violation.' },
      { status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED, at: '2026-07-16', note: 'Joint re-inspection scheduled.' },
      { status: ENFORCEMENT_STATUS.VIOLATION_CONFIRMED, at: '2026-08-05', note: 'Violation confirmed on re-inspection.' },
    ],
  },
  {
    id: 'CN-2026-008',
    status: ENFORCEMENT_STATUS.CASE_CLOSED,
    company: {
      name: 'Shivam Traders',
      registrationNo: 'LM/RJ/2020/010445',
      address: 'Shop 21, Bapu Bazar, Jaipur, Rajasthan 302001',
      contactPerson: 'Harsh Vardhan',
      phone: '+91 94140 88990',
      email: 'shivamtraders@example.com',
    },
    product: {
      name: 'Packaged Drinking Water 500 ml (multi-pack)',
      category: 'Food & Beverage',
      productId: 'ST-PW-500M',
      batchNumber: 'ST-2618-03',
      mrp: '₹15.00',
      netQuantity: '500 ml x 6',
    },
    violation: {
      title: 'Multi-pack did not declare total net quantity / number of pieces',
      description:
        'The 6-pack carton carried unit pricing but did not declare the number of pieces or the total net quantity of the package as required.',
      type: 'Improper declaration on label',
      severity: 'Low',
      penaltyProvision: 'Rule 6(1)(h) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    },
    rule: {
      reference: 'Rule 6(1)(h) – Multi-piece package declaration',
      actSection: 'Legal Metrology Act, 2009 – Section 18',
      category: 'Food / Beverage (FSSAI Rules)',
    },
    inspection: {
      id: 'INS-2026-0126',
      date: '2026-06-15',
      place: 'Market shop audit, Jaipur',
      officer: {
        name: 'Insp. Rohit Bansal',
        designation: 'Inspector, Legal Metrology',
        department: 'Department of Legal Metrology, Jaipur',
        badgeNo: 'LM-OF-0777',
      },
    },
    notice: {
      reference: 'LM/PAC/2026/CN-1227',
      date: '2026-06-20',
      dueDate: '2026-06-30',
    },
    response: {
      type: 'corrective-action',
      message:
        'The multi-pack sleeve has been redesigned with the number of pieces and total net quantity printed on the carton. Old stock has been withdrawn.',
      date: '2026-06-28',
      submittedAt: '2026-06-28',
    },
    reinspection: {
      date: '2026-07-20',
      officerName: 'Insp. Rohit Bansal',
      result: 'compliant',
      remarks: 'Re-inspection found the new cartons compliant. Case closed with a caution letter.',
      scheduledAt: '2026-06-29',
      completedAt: '2026-07-20',
    },
    history: [
      { status: ENFORCEMENT_STATUS.PENDING_RESPONSE, at: '2026-06-20', note: 'Show-cause notice issued.' },
      { status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, at: '2026-06-28', note: 'Company submitted corrective-action response.' },
      { status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED, at: '2026-06-29', note: 'Re-inspection scheduled for 20 Jul 2026.' },
      { status: ENFORCEMENT_STATUS.COMPLIANT, at: '2026-07-20', note: 'Re-inspection confirmed compliance.' },
      { status: ENFORCEMENT_STATUS.CASE_CLOSED, at: '2026-07-25', note: 'Case closed after caution letter.' },
    ],
  },
]