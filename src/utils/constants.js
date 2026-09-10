export const APP_NAME = 'Packaged Commodity Legal Metrology Compliance System'
export const APP_SHORT_NAME = 'PCLMCS'

export const MINISTRY_NAME = 'Ministry of Consumer Affairs, Food & Public Distribution'
export const DEPARTMENT_NAME = 'Department of Consumer Affairs'

export const GOVERNMENT_NAME = 'Government of India'

export const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/scan', label: 'Scan Product' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export const STATUS_OPTIONS = {
  COMPLIANT: 'compliant',
  NON_COMPLIANT: 'non-compliant',
  PENDING: 'pending',
  UNDER_REVIEW: 'under-review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const SAMPLE_INSPECTIONS = [
  {
    id: 'PCL/2025/1',
    product: 'Mineral Water (1 L)',
    manufacturer: 'AquaPure Beverages Pvt. Ltd.',
    declared: '1000 ml',
    observed: '995 ml',
    status: 'compliant',
    testedAt: '12 Aug 2025',
  },
  {
    id: 'PCL/2025/2',
    product: 'Edible Oil (500 ml)',
    manufacturer: 'Naturals Agro Foods',
    declared: '500 ml',
    observed: '478 ml',
    status: 'non-compliant',
    testedAt: '29 Jul 2025',
  },
  {
    id: 'PCL/2025/3',
    product: 'Atta (5 kg)',
    manufacturer: 'Sahil Mills Limited',
    declared: '5000 g',
    observed: '4950 g',
    status: 'under-review',
    testedAt: '18 Jul 2025',
  },
  {
    id: 'PCL/2025/4',
    product: 'Instant Noodles (65 g)',
    manufacturer: 'Krunchy Foods',
    declared: '65 g',
    observed: '65 g',
    status: 'compliant',
    testedAt: '04 Jul 2025',
  },
  {
    id: 'PCL/2025/5',
    product: 'Toothpaste (150 g)',
    manufacturer: 'Medicure Oral Care',
    declared: '150 g',
    observed: '151.5 g',
    status: 'pending',
    testedAt: '26 Jun 2025',
  },
  {
    id: 'PCL/2025/6',
    product: 'Wheat Flour (10 kg)',
    manufacturer: 'Sahil Mills Limited',
    declared: '10000 g',
    observed: '9890 g',
    status: 'non-compliant',
    testedAt: '15 Jun 2025',
  },
]

export const MODULE_CARDS = [
  {
    title: 'Manufacturer Registration',
    description:
      'Onboarding of manufacturers, packers and importers of packaged commodities with their legal details.',
    status: 'in-development',
  },
  {
    title: 'Product Verification',
    description:
      'Declaration-based verification of quantity, pack-house practices and label information against legal metrology norms.',
    status: 'in-development',
  },
  {
    title: 'Inspection & Testing',
    description:
      'Field inspection workflow, test reporting and enforcement actions with a clear audit trail.',
    status: 'in-development',
  },
  {
    title: 'Complaints & Grievances',
    description:
      'Citizen-facing complaint lodgement, tracking and escalation for short-weight and mislabelled commodities.',
    status: 'in-development',
  },
]