-- Habilitar extensão para UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Criação das Tabelas (DDL)
-- ==========================================

-- Tabela de Usuários do Sistema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('DEV', 'MANAGER')) NOT NULL,
    avatar TEXT
);

-- Tabela de Modalidades
CREATE TABLE IF NOT EXISTS modalities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    target_audience VARCHAR(50) CHECK (target_audience IN ('Infantil', 'Adulto', 'Idoso', 'Todos', 'Bebê')),
    description TEXT,
    color VARCHAR(20)
);

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    modality_id INTEGER REFERENCES modalities(id),
    frequency VARCHAR(20) CHECK (frequency IN ('Semanal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual')),
    price DECIMAL(10, 2) NOT NULL,
    duration_months INTEGER NOT NULL,
    classes_per_week INTEGER NOT NULL
);

-- Tabela de Alunos
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(150),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    birth_date DATE,
    phone VARCHAR(20),
    is_whatsapp BOOLEAN DEFAULT FALSE,
    
    -- Endereço
    addr_cep VARCHAR(9),
    addr_street VARCHAR(200),
    addr_number VARCHAR(20),
    addr_neighborhood VARCHAR(100),
    addr_city VARCHAR(100),
    addr_state VARCHAR(2),
    addr_complement VARCHAR(100),

    -- Acadêmico
    status VARCHAR(20) CHECK (status IN ('Ativo', 'Inativo', 'Trancado')) DEFAULT 'Ativo',
    plan_name VARCHAR(100), 
    modality_name VARCHAR(100),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    
    -- Financeiro
    payment_status VARCHAR(20) CHECK (payment_status IN ('Pago', 'Pendente', 'Atrasado')) DEFAULT 'Pendente',
    
    -- Saúde
    medical_notes TEXT,
    photo TEXT,
    
    -- Responsável (para menores)
    guardian_name VARCHAR(200),
    guardian_cpf VARCHAR(14),
    guardian_phone VARCHAR(20),
    guardian_relationship VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Documentos dos Alunos
CREATE TABLE IF NOT EXISTS student_documents (
    id VARCHAR(50) PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('PDF', 'IMAGE', 'DOC')),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Turmas/Aulas
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    time_start VARCHAR(5) NOT NULL,
    time_end VARCHAR(5),
    days TEXT[] NOT NULL,
    instructor VARCHAR(100),
    capacity INTEGER,
    enrolled INTEGER DEFAULT 0,
    modality_id INTEGER REFERENCES modalities(id),
    status VARCHAR(20) CHECK (status IN ('Open', 'Full', 'Cancelled')) DEFAULT 'Open'
);

-- Tabela Financeira
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    description VARCHAR(200) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('INCOME', 'EXPENSE')),
    category VARCHAR(20) CHECK (category IN ('TUITION', 'SALARY', 'MAINTENANCE', 'RENT', 'EQUIPMENT', 'OTHER', 'REGISTRATION')),
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PAID', 'PENDING', 'LATE', 'CANCELLED')),
    related_entity VARCHAR(200),
    payment_method VARCHAR(20) CHECK (payment_method IN ('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'CHEQUE'))
);

-- ==========================================
-- 2. Inserção de Dados Iniciais (DML)
-- ==========================================

-- Inserir usuários iniciais
INSERT INTO users (name, email, password, role, avatar) VALUES
('Rafael (Desenvolvedor)', 'tecnorafa12@gmail.com', 'Rafa2533', 'DEV', 'https://ui-avatars.com/api/?name=Rafael&background=6366f1&color=fff'),
('Ferdinando (Gerente)', 'hidro@hidroeftness.com.br', 'ferdinando25', 'MANAGER', 'https://ui-avatars.com/api/?name=Ferdinando&background=0d9488&color=fff')
ON CONFLICT (email) DO NOTHING;