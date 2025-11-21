import { Student, ClassSession, User, Modality, Plan, FinancialTransaction } from '../types';

// --- AUTH DATA ---

export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Rafael Developer',
    email: 'tecnorafa12@gmail.com',
    password: 'Rafa2533', // In a real app, this would be hashed
    role: 'DEV',
    avatar: 'https://ui-avatars.com/api/?name=Rafael+Dev&background=0D8ABC&color=fff'
  },
  {
    id: 2,
    name: 'Gerente Geral',
    email: 'gerente@hidro.com',
    password: '123',
    role: 'MANAGER',
    avatar: 'https://ui-avatars.com/api/?name=Gerente+Geral&background=random'
  }
];

export const simulateLogin = (email: string, pass: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email && u.password === pass);
      if (user) {
        // Return user without password
        const { password, ...safeUser } = user; 
        resolve(safeUser as User);
      } else {
        reject(new Error('Credenciais inválidas'));
      }
    }, 800);
  });
};

// --- EXISTING DATA ---

export const mockModalities: Modality[] = [
  { id: 'hidro', name: 'Hidroginástica', targetAudience: 'Todos', description: 'Exercícios de baixo impacto na água.', color: 'bg-blue-500' },
  { id: 'nat_adulto', name: 'Natação Adulto', targetAudience: 'Adulto', description: 'Aprenda a nadar ou aperfeiçoe sua técnica.', color: 'bg-teal-500' },
  { id: 'nat_baby', name: 'Natação Baby', targetAudience: 'Infantil', description: 'Adaptação ao meio líquido para bebês.', color: 'bg-pink-400' },
  { id: 'nat_kids', name: 'Natação Infantil', targetAudience: 'Infantil', description: 'Desenvolvimento motor e aprendizado dos 4 estilos.', color: 'bg-orange-400' },
  { id: 'funcional', name: 'Funcional Aquático', targetAudience: 'Adulto', description: 'Treino de alta intensidade na piscina.', color: 'bg-purple-500' },
];

export const mockPlans: Plan[] = [
  { id: 'p1', name: 'Hidro Mensal 2x', modalityId: 'hidro', frequency: 'Mensal', price: 180.00, durationMonths: 1, classesPerWeek: 2 },
  { id: 'p2', name: 'Hidro Trimestral 2x', modalityId: 'hidro', frequency: 'Trimestral', price: 510.00, durationMonths: 3, classesPerWeek: 2 },
  { id: 'p3', name: 'Natação Adulto Semestral', modalityId: 'nat_adulto', frequency: 'Semestral', price: 1100.00, durationMonths: 6, classesPerWeek: 3 },
  { id: 'p4', name: 'Baby Mensal', modalityId: 'nat_baby', frequency: 'Mensal', price: 220.00, durationMonths: 1, classesPerWeek: 2 },
];

export const mockStudents: Student[] = [
  { 
    id: 1, 
    name: 'Ana Silva', 
    email: 'ana.silva@email.com', 
    cpf: '123.456.789-00',
    birthDate: '1985-03-15',
    phone: '(11) 98765-4321',
    isWhatsapp: true,
    status: 'Ativo', 
    plan: 'Hidro 2x', 
    modality: 'Hidroginástica',
    enrollmentDate: '2023-05-10', 
    paymentStatus: 'Pago',
    address: {
      cep: '01001-000',
      street: 'Praça da Sé',
      number: '100',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP'
    },
    documents: []
  },
  { 
    id: 2, 
    name: 'Carlos Oliveira', 
    email: 'carlos.o@email.com', 
    cpf: '234.567.890-11',
    birthDate: '1990-07-20',
    phone: '(11) 91234-5678',
    isWhatsapp: false,
    status: 'Ativo', 
    plan: 'Natação Adulto', 
    modality: 'Natação Adulto',
    enrollmentDate: '2023-06-15', 
    paymentStatus: 'Pago',
    address: {
      cep: '01310-100',
      street: 'Av. Paulista',
      number: '1578',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP'
    },
    documents: []
  },
  { 
    id: 3, 
    name: 'Beatriz Santos', 
    email: 'bia.santos@email.com', 
    cpf: '345.678.901-22',
    birthDate: '1988-11-05',
    phone: '(11) 99876-5432',
    isWhatsapp: true,
    status: 'Inativo', 
    plan: 'Hidro 3x', 
    modality: 'Hidroginástica',
    enrollmentDate: '2023-01-20', 
    paymentStatus: 'Atrasado',
    address: {
      cep: '05425-070',
      street: 'Rua Pinheiros',
      number: '500',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP'
    },
    documents: []
  },
  { 
    id: 4, 
    name: 'João Souza', 
    email: 'joao.s@email.com', 
    cpf: '456.789.012-33',
    birthDate: '2015-02-10',
    phone: '(11) 98888-7777',
    isWhatsapp: true,
    status: 'Trancado', 
    plan: 'Natação Infantil', 
    modality: 'Natação Infantil',
    enrollmentDate: '2023-08-05', 
    paymentStatus: 'Pendente',
    address: {
      cep: '04010-000',
      street: 'Rua Domingos de Morais',
      number: '1200',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP'
    },
    guardian: {
      name: 'Maria Souza',
      cpf: '987.654.321-99',
      phone: '(11) 98888-7777',
      relationship: 'Mãe'
    },
    documents: []
  },
  { 
    id: 5, 
    name: 'Fernanda Lima', 
    email: 'fe.lima@email.com', 
    cpf: '567.890.123-44',
    birthDate: '1995-09-30',
    phone: '(11) 97777-6666',
    isWhatsapp: true,
    status: 'Ativo', 
    plan: 'Hidro 2x', 
    modality: 'Hidroginástica',
    enrollmentDate: '2023-09-12', 
    paymentStatus: 'Pago',
    address: {
      cep: '04578-000',
      street: 'Av. Eng. Luís Carlos Berrini',
      number: '900',
      neighborhood: 'Brooklin',
      city: 'São Paulo',
      state: 'SP'
    },
    documents: []
  },
];

export const mockClasses: ClassSession[] = [
  { 
    id: 1, 
    name: 'Hidro Manhã A', 
    time: '07:00', 
    endTime: '07:45', 
    days: ['Seg', 'Qua', 'Sex'], 
    instructor: 'Prof. Lucas', 
    capacity: 15, 
    enrolled: 12, 
    modalityId: 'hidro',
    status: 'Open'
  },
  { 
    id: 2, 
    name: 'Natação Adulto Iniciante', 
    time: '08:00', 
    endTime: '08:45',
    days: ['Ter', 'Qui'], 
    instructor: 'Prof. Lucas', 
    capacity: 6, 
    enrolled: 6, 
    modalityId: 'nat_adulto',
    status: 'Full'
  },
  { 
    id: 3, 
    name: 'Natação Kids', 
    time: '09:00', 
    endTime: '09:45',
    days: ['Seg', 'Qua'], 
    instructor: 'Prof. Marina', 
    capacity: 8, 
    enrolled: 5, 
    modalityId: 'nat_kids',
    status: 'Open'
  },
  { 
    id: 4, 
    name: 'Hidro Melhor Idade', 
    time: '10:00', 
    endTime: '10:45',
    days: ['Ter', 'Qui'], 
    instructor: 'Prof. Marina', 
    capacity: 15, 
    enrolled: 14, 
    modalityId: 'hidro',
    status: 'Open'
  },
  { 
    id: 5, 
    name: 'Hidro Noite', 
    time: '18:00', 
    endTime: '18:45',
    days: ['Seg', 'Qua', 'Sex'], 
    instructor: 'Prof. Roberto', 
    capacity: 15, 
    enrolled: 8, 
    modalityId: 'hidro',
    status: 'Open'
  },
  { 
    id: 6, 
    name: 'Funcional Power', 
    time: '19:00', 
    endTime: '19:45',
    days: ['Ter', 'Qui'], 
    instructor: 'Prof. Roberto', 
    capacity: 12, 
    enrolled: 3, 
    modalityId: 'funcional',
    status: 'Open'
  },
];

// --- FINANCE DATA ---

export const mockFinancialTransactions: FinancialTransaction[] = [
  // Expenses
  { id: '1', description: 'Aluguel do Espaço', type: 'EXPENSE', category: 'RENT', amount: 3500.00, date: '2023-11-05', dueDate: '2023-11-05', status: 'PAID', relatedEntity: 'Imobiliária Central' },
  { id: '2', description: 'Energia Elétrica', type: 'EXPENSE', category: 'MAINTENANCE', amount: 1200.00, date: '2023-11-10', dueDate: '2023-11-10', status: 'PAID', relatedEntity: 'Enel' },
  { id: '3', description: 'Salário Prof. Lucas', type: 'EXPENSE', category: 'SALARY', amount: 2500.00, date: '2023-11-05', dueDate: '2023-11-05', status: 'PAID', relatedEntity: 'Lucas Mendes' },
  { id: '4', description: 'Salário Prof. Marina', type: 'EXPENSE', category: 'SALARY', amount: 2500.00, date: '2023-11-05', dueDate: '2023-11-05', status: 'PAID', relatedEntity: 'Marina Silva' },
  { id: '5', description: 'Produtos Químicos Piscina', type: 'EXPENSE', category: 'MAINTENANCE', amount: 450.00, date: '2023-11-15', dueDate: '2023-11-15', status: 'PENDING', relatedEntity: 'Pool Clean Ltda' },
  
  // Income (Tuitions)
  { id: '6', description: 'Mensalidade - Nov', type: 'INCOME', category: 'TUITION', amount: 180.00, date: '2023-11-01', dueDate: '2023-11-05', status: 'PAID', relatedEntity: 'Ana Silva' },
  { id: '7', description: 'Mensalidade - Nov', type: 'INCOME', category: 'TUITION', amount: 220.00, date: '2023-11-02', dueDate: '2023-11-05', status: 'PAID', relatedEntity: 'João Souza' },
  { id: '8', description: 'Mensalidade - Nov', type: 'INCOME', category: 'TUITION', amount: 180.00, date: '2023-11-05', dueDate: '2023-11-10', status: 'PAID', relatedEntity: 'Fernanda Lima' },
  { id: '9', description: 'Mensalidade - Nov', type: 'INCOME', category: 'TUITION', amount: 1100.00, date: '2023-11-08', dueDate: '2023-11-10', status: 'PAID', relatedEntity: 'Carlos Oliveira' },
  { id: '10', description: 'Mensalidade - Out (Atrasada)', type: 'INCOME', category: 'TUITION', amount: 180.00, date: '2023-10-10', dueDate: '2023-10-10', status: 'LATE', relatedEntity: 'Beatriz Santos' },
  { id: '11', description: 'Mensalidade - Nov', type: 'INCOME', category: 'TUITION', amount: 180.00, date: '2023-11-10', dueDate: '2023-11-10', status: 'LATE', relatedEntity: 'Beatriz Santos' },
];

export const fetchAddressByCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) throw new Error('CEP Inválido');

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    if (data.erro) throw new Error('CEP não encontrado');
    return data;
  } catch (error) {
    // Fallback mock if API fails or CORS issues in preview
    console.warn('API CEP falhou, usando mock');
    if (cleanCep === '01001000') {
      return { logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' };
    }
    throw error;
  }
};