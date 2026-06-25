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
  email?: string;
  role: "admin" | "doctor" | "receptionist";
  createdAt: string;
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
  version: number;
  isActive: boolean;
  contentJson: Record<string, { title: string; body: string }>;
  legalClausesJson: Record<string, LegalClauses>;
  createdAt: string;
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
