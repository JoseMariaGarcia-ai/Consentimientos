export const ALL_MODULES = [
  { key: 'dashboard',        labelKey: 'nav.dashboard',       defaultOn: true  },
  { key: 'agenda',           labelKey: 'nav.agenda',          defaultOn: true  },
  { key: 'patients',         labelKey: 'nav.patients',        defaultOn: true  },
  { key: 'doctors',          labelKey: 'nav.doctors',         defaultOn: true  },
  { key: 'consents',         labelKey: 'nav.consents',        defaultOn: true  },
  { key: 'clinical-records', labelKey: 'nav.clinicalRecords', defaultOn: true  },
  { key: 'photos',           labelKey: 'nav.photos',          defaultOn: true  },
  { key: 'toxin',            labelKey: 'nav.toxin',           defaultOn: true  },
  { key: 'budgets',          labelKey: 'nav.budgets',         defaultOn: false },
  { key: 'invoicing',        labelKey: 'nav.invoicing',       defaultOn: false },
  { key: 'time-tracking',    labelKey: 'nav.timeTracking',    defaultOn: false },
  { key: 'whatsapp',         labelKey: 'nav.whatsapp',        defaultOn: true  },
  { key: 'ai-credits',       labelKey: 'nav.aiCredits',       defaultOn: true  },
  { key: 'clinic',           labelKey: 'nav.clinic',          defaultOn: true  },
  { key: 'settings',         labelKey: 'nav.settings',        defaultOn: false },
  { key: 'templates',        labelKey: 'nav.templates',       defaultOn: false },
  { key: 'lab-partners',     labelKey: 'nav.labPartners',     defaultOn: false },
  { key: 'tickets',          labelKey: 'nav.tickets',         defaultOn: true  },
] as const

export const DEFAULT_PERMS: Record<string, boolean> = Object.fromEntries(ALL_MODULES.map(m => [m.key, m.defaultOn]))

export const DEFAULT_CLINICA_MODULES = ALL_MODULES.filter(m => m.defaultOn).map(m => m.key)
