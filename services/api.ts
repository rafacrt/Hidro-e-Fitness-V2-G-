import { KPI, Student, ClassSession, FinancialTransaction, User, Contract } from '../types';

export const fetchDashboardKPIs = async (): Promise<KPI[]> => {
    try {
        const response = await fetch('/api/dashboard/kpis');
        if (!response.ok) {
            throw new Error('Failed to fetch KPIs');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        return [
            { label: 'Total Alunos Ativos', value: 0, trend: 0, icon: 'Users', color: 'text-slate-400' },
            { label: 'Ocupação Média', value: '0%', trend: 0, icon: 'Activity', color: 'text-slate-400' },
            { label: 'Receita Mensal', value: 'R$ 0,00', trend: 0, icon: 'CreditCard', color: 'text-slate-400' },
            { label: 'Aulas Hoje', value: 0, trend: 0, icon: 'Calendar', color: 'text-slate-400' },
        ];
    }
};

export const fetchDashboardCharts = async (): Promise<any> => {
    const response = await fetch('/api/dashboard/charts');
    if (!response.ok) throw new Error('Falha ao buscar gráficos');
    return await response.json();
};

export const login = async (email: string, pass: string): Promise<User> => {
    console.log('Sending login request to /api/login'); // DEBUG
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
    });

    console.log('Login response status:', response.status); // DEBUG

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Login error body:', errorText); // DEBUG

        if (response.status === 401) {
            throw new Error('Credenciais inválidas');
        } else if (response.status === 502) {
            throw new Error('Erro 502: Backend indisponível (Bad Gateway)');
        } else {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
    }
    return await response.json();
};

export const fetchStudents = async (): Promise<Student[]> => {
    const response = await fetch('/api/students');
    if (!response.ok) throw new Error('Falha ao buscar alunos');
    return await response.json();
};

export const createStudent = async (student: Partial<Student>): Promise<Student> => {
    const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
    });
    if (!response.ok) throw new Error('Falha ao criar aluno');
    return await response.json();
};

export const updateStudent = async (id: number, student: Partial<Student>): Promise<void> => {
    const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
    });
    if (!response.ok) throw new Error('Falha ao atualizar aluno');
};

export const deleteStudent = async (id: number): Promise<void> => {
    const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao remover aluno');
};

export const fetchClasses = async (): Promise<ClassSession[]> => {
    const response = await fetch('/api/classes');
    if (!response.ok) throw new Error('Falha ao buscar turmas');
    return await response.json();
};

export const fetchTransactions = async (): Promise<FinancialTransaction[]> => {
    const response = await fetch('/api/finance');
    if (!response.ok) throw new Error('Falha ao buscar transações');
    return await response.json();
};

export const createTransaction = async (transaction: FinancialTransaction): Promise<void> => {
    const response = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error('Falha ao criar transação');
};

export const updateTransaction = async (id: string, transaction: FinancialTransaction): Promise<void> => {
    const response = await fetch(`/api/finance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error('Falha ao atualizar transação');
};

export const deleteTransaction = async (id: string): Promise<void> => {
    const response = await fetch(`/api/finance/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao remover transação');
};

export const fetchUsers = async (): Promise<User[]> => {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Falha ao buscar usuários');
    return await response.json();
};

export const createUser = async (user: Partial<User>): Promise<User> => {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Falha ao criar usuário');
    return await response.json();
};

export const updateUser = async (id: number, user: Partial<User>): Promise<void> => {
    const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Falha ao atualizar usuário');
};

export const deleteUser = async (id: number): Promise<void> => {
    const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao remover usuário');
};

export const fetchModalities = async (): Promise<any[]> => {
    const response = await fetch('/api/modalities');
    if (!response.ok) throw new Error('Falha ao buscar modalidades');
    return await response.json();
};

export const createModality = async (modality: any): Promise<any> => {
    const response = await fetch('/api/modalities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modality),
    });
    if (!response.ok) throw new Error('Falha ao criar modalidade');
    return await response.json();
};

export const updateModality = async (id: number, modality: any): Promise<void> => {
    const response = await fetch(`/api/modalities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modality),
    });
    if (!response.ok) throw new Error('Falha ao atualizar modalidade');
};

export const deleteModality = async (id: number): Promise<void> => {
    const response = await fetch(`/api/modalities/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao remover modalidade');
};

export const fetchPlans = async (): Promise<any[]> => {
    const response = await fetch('/api/plans');
    if (!response.ok) throw new Error('Falha ao buscar planos');
    return await response.json();
};

export const createPlan = async (plan: any): Promise<any> => {
    const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
    });
    if (!response.ok) throw new Error('Falha ao criar plano');
    return await response.json();
};

export const updatePlan = async (id: number, plan: any): Promise<void> => {
    const response = await fetch(`/api/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
    });
    if (!response.ok) throw new Error('Falha ao atualizar plano');
};

export const deletePlan = async (id: number): Promise<void> => {
    const response = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao remover plano');
};

export const createClass = async (cls: any): Promise<any> => {
    const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cls),
    });
    if (!response.ok) throw new Error('Falha ao criar turma');
    return await response.json();
};

export const updateClass = async (id: number, cls: any): Promise<void> => {
    const response = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cls),
    });
    if (!response.ok) throw new Error('Falha ao atualizar turma');
};

export const deleteClass = async (id: number): Promise<void> => {
    const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao remover turma');
};

export const fetchStudentsWithContracts = async (): Promise<number[]> => {
    const response = await fetch('/api/contracts/with-contracts');
    if (!response.ok) throw new Error('Falha ao buscar alunos com contratos');
    return await response.json();
};

export const fetchContracts = async (studentId: number): Promise<Contract[]> => {
    const response = await fetch(`/api/contracts?studentId=${studentId}`);
    if (!response.ok) throw new Error('Falha ao buscar contratos');
    return await response.json();
};

export const createContract = async (data: {
    studentId: number;
    planIds: string[];
    startDate: string;
    plannedEndDate?: string;
    durationMonths?: number;
}): Promise<{ id: number; contractNumber: number }> => {
    const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Falha ao criar contrato');
    return await response.json();
};

export const updateContract = async (id: number, data: Partial<{
    status: string;
    closureReason: string;
    closureNotes: string;
    actualEndDate: string;
    planIds: string[];
    startDate: string;
    plannedEndDate: string;
    durationMonths: number;
}>): Promise<void> => {
    const response = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Falha ao atualizar contrato');
};

export const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) throw new Error('CEP Inválido');
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (data.erro) throw new Error('CEP não encontrado');
        return data;
    } catch (error) {
        console.warn('API CEP falhou');
        throw error;
    }
};
