import React from 'react';

export type Role = 'DEV' | 'MANAGER';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string; // Optional for frontend display security
  role: Role;
  avatar?: string;
}

export interface Guardian {
  name: string;
  cpf: string;
  phone: string;
  relationship: string;
}

export interface StudentDocument {
  id: string;
  name: string;
  type: 'PDF' | 'IMAGE' | 'DOC';
  uploadDate: string;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
}

export interface Modality {
  id: string;
  name: string;
  targetAudience: 'Infantil' | 'Adulto' | 'Idoso' | 'Todos';
  description: string;
  color: string; // Tailwind class or hex
}

export interface Plan {
  id: string;
  name: string;
  modalityId: string; // Links to Modality
  frequency: 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';
  price: number;
  durationMonths: number;
  classesPerWeek: number;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  cpf: string;
  rg?: string;
  birthDate: string;
  phone: string;
  isWhatsapp?: boolean;

  // Address
  address: Address;

  // Academic
  status: 'Ativo' | 'Inativo' | 'Trancado';
  plan: string;
  modality?: string; // Deprecated, kept for backward compatibility
  modalities: string[]; // New field for multiple modalities
  enrollmentDate: string;

  // Financial
  paymentStatus: 'Pago' | 'Pendente' | 'Atrasado';

  // Health & Extra
  medicalNotes?: string;
  photo?: string;

  // Minor specific
  guardian?: Guardian;

  // Files
  documents: StudentDocument[];
}

export interface KPI {
  label: string;
  value: string | number;
  trend: number; // percentage
  icon: React.ElementType;
  color: string;
}

export interface ClassSession {
  id: number;
  name: string;
  time: string; // Start time e.g., "07:00"
  endTime: string; // e.g., "07:45"
  days: string[]; // ['Seg', 'Qua', 'Sex']
  instructor: string;
  capacity: number;
  enrolled: number;
  modalityId: string;
  status: 'Open' | 'Full' | 'Cancelled';
}

// --- FINANCE TYPES ---

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionCategory = 'TUITION' | 'SALARY' | 'MAINTENANCE' | 'RENT' | 'EQUIPMENT' | 'OTHER';
export type TransactionStatus = 'PAID' | 'PENDING' | 'LATE' | 'CANCELLED';

export interface FinancialTransaction {
  id: string;
  description: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  dueDate: string;
  status: TransactionStatus;
  relatedEntity?: string; // Student Name or Supplier Name
}