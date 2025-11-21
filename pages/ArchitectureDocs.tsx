import React, { useState } from 'react';
import { Database, Server, Shield, Terminal, Copy, Check } from 'lucide-react';

const CodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-2 rounded-lg bg-slate-900 overflow-hidden font-mono text-sm">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 text-slate-400 border-b border-slate-700">
        <span className="text-xs uppercase font-bold">{lang}</span>
        <button onClick={handleCopy} className="hover:text-white">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <pre className="p-4 text-slate-50 overflow-x-auto">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

const ArchitectureDocs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'backend' | 'infra'>('sql');

  const sqlSchema = `
-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tables
CREATE TABLE modalities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    default_price DECIMAL(10,2) NOT NULL,
    default_capacity INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    address_zip_code VARCHAR(8),
    address_street VARCHAR(200),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'locked')) DEFAULT 'active',
    medical_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    modality_id INTEGER REFERENCES modalities(id),
    instructor_name VARCHAR(100) NOT NULL,
    week_day INTEGER CHECK (week_day BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    capacity INTEGER NOT NULL,
    current_enrollments INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id)
);

-- 3. Trigger for Capacity Management
CREATE OR REPLACE FUNCTION update_class_capacity() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE classes SET current_enrollments = current_enrollments + 1 WHERE id = NEW.class_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE classes SET current_enrollments = current_enrollments - 1 WHERE id = OLD.class_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrollment_capacity
AFTER INSERT OR DELETE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_class_capacity();
`;

  const nestArchitecture = `
// src/database/database.module.ts
@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_POOL',
      useFactory: () => {
        return new Pool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });
      },
    },
  ],
  exports: ['DATABASE_POOL'],
})
export class DatabaseModule {}

// src/students/students.service.ts
@Injectable()
export class StudentsService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async findAll(): Promise<StudentDto[]> {
    // Pure SQL - High Performance
    const { rows } = await this.pool.query(\`
      SELECT id, full_name, email, status 
      FROM students 
      ORDER BY created_at DESC
    \`);
    return rows;
  }

  async create(dto: CreateStudentDto): Promise<StudentDto> {
    const { rows } = await this.pool.query(
      \`INSERT INTO students (full_name, email, cpf) VALUES ($1, $2, $3) RETURNING *\`,
      [dto.fullName, dto.email, dto.cpf]
    );
    return rows[0];
  }
}
`;

  const dockerCompose = `
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: hidro_fitness
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: ./backend
    environment:
      DB_HOST: postgres
      DB_USER: admin
    depends_on:
      - postgres
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    ports:
      - "3001:3000"

volumes:
  pgdata:
`;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Documentação Técnica</h2>
        <p className="text-slate-500">Especificações de arquitetura, banco de dados e infraestrutura.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        <button 
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sql' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2"><Database size={16} /> Banco de Dados (SQL)</div>
        </button>
        <button 
          onClick={() => setActiveTab('backend')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'backend' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2"><Server size={16} /> Backend (NestJS)</div>
        </button>
        <button 
          onClick={() => setActiveTab('infra')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'infra' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2"><Shield size={16} /> Infra & Docker</div>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {activeTab === 'sql' && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Schema PostgreSQL (Pure SQL)</h3>
            <div className="prose text-slate-600 mb-4">
              <p>Modelagem relacional estrita com triggers para consistência de dados. Sem ORM para máxima performance.</p>
            </div>
            <CodeBlock lang="sql" code={sqlSchema} />
          </div>
        )}

        {activeTab === 'backend' && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">NestJS Architecture (No ORM)</h3>
            <div className="prose text-slate-600 mb-4">
              <p>Padrão de injeção de dependência com driver `pg` direto. Repositórios executam Prepared Statements.</p>
            </div>
            <CodeBlock lang="typescript" code={nestArchitecture} />
          </div>
        )}

        {activeTab === 'infra' && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Docker & Dokploy Setup</h3>
            <div className="prose text-slate-600 mb-4">
              <p>Orquestração de containers otimizada para produção. Estratégia de deploy via Dokploy/Coolify.</p>
            </div>
            <CodeBlock lang="yaml" code={dockerCompose} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectureDocs;