export interface Clinic {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  role: "admin" | "doctor" | "receptionist";
  createdAt: string;
  photoKey?: string;
  photoUrl?: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  fullName: string;
  dateOfBirth?: string;
  idDocument?: string;
  idDocType?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string;
  medications?: string;
  bloodType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentTemplate {
  id: string;
  clinicId: string;
  treatmentType: string;
  category: string;
  extraCategories: string[];
  version: number;
  isActive: boolean;
  contentJson: Record<string, { title: string; body: string }>;
  legalClausesJson: Record<string, LegalClauses>;
  createdAt: string;
  // "Más usados" — favorito de la clínica del usuario que pidió la lista
  // (aislado por clínica, ver clinic_template_favorites), no una propiedad
  // global de la plantilla.
  isFavorite?: boolean;
}

export interface LegalClauses {
  jurisdiction: string;
  applicableLaw: string;
  dataProtection: string;
  signatureValidity: string;
  minAge: number;
  witnessRequired: boolean;
  retentionYears: number;
  introText: string;
  rightsText: string;
  dataClause: string;
  footerLegal: string;
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  doctorId: string;
  templateId: string;
  language: string;
  jurisdiction?: string;
  status: "pending" | "signed" | "revoked" | "expired";
  signatureDataUrl?: string;
  biometricJson?: any;
  documentHash?: string;
  consentUuid: string;
  clientTimestamp?: string;
  serverTimestamp?: string;
  ipAddress?: string;
  userAgent?: string;
  pdfUrl?: string;
  signedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  consentId: string;
  logJson: Record<string, any>;
  createdAt: string;
}

export type ToothFaceName = "vestibular" | "lingual_palatina" | "mesial" | "distal" | "oclusal_incisal";
export type ToothFaceCondition = "sana" | "caries" | "obturada" | "sellante" | "fractura" | "desgaste";
export type ToothStatus =
  | "sano" | "ausente" | "extraido" | "a_extraer" | "implante" | "corona"
  | "puente" | "endodoncia" | "movil" | "incluido" | "temporal_presente";

export interface ToothFace {
  condition: ToothFaceCondition;
  material: string | null;
}

export interface OdontogramTooth {
  number: string; // notación FDI, ej. '11', '46', '55'
  status: ToothStatus;
  material: string | null;
  notes: string;
  faces: Record<ToothFaceName, ToothFace>;
}

// Field names en snake_case porque así los devuelve la API (mismo patrón
// que toxin_records, sin alias camelCase en el SELECT).
export interface OdontogramRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  doctor?: Doctor | null;
  record_date: string;
  dentition_type: "permanente" | "temporal" | "mixta";
  teeth: OdontogramTooth[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

