--
-- PostgreSQL database dump
--

\restrict eYtzkS6CVbJTiWJzrWWwNBgs28Bf6iZDu3WbWIBMQZBuiqW8oSQeBOVkmzFOOz0

-- Dumped from database version 15.16
-- Dumped by pg_dump version 15.16

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    time_start character varying(5) NOT NULL,
    time_end character varying(5),
    days text[] NOT NULL,
    instructor character varying(100),
    capacity integer,
    enrolled integer DEFAULT 0,
    modality_id integer,
    status character varying(20) DEFAULT 'Open'::character varying,
    CONSTRAINT classes_status_check CHECK (((status)::text = ANY ((ARRAY['Open'::character varying, 'Full'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.classes_id_seq OWNER TO postgres;

--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: modalities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modalities (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    target_audience character varying(50),
    description text,
    color character varying(20),
    CONSTRAINT modalities_target_audience_check CHECK (((target_audience)::text = ANY ((ARRAY['Infantil'::character varying, 'Adulto'::character varying, 'Idoso'::character varying, 'Todos'::character varying, 'Bebê'::character varying])::text[])))
);


ALTER TABLE public.modalities OWNER TO postgres;

--
-- Name: modalities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.modalities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.modalities_id_seq OWNER TO postgres;

--
-- Name: modalities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modalities_id_seq OWNED BY public.modalities.id;


--
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    modality_id integer,
    frequency character varying(20),
    price numeric(10,2) NOT NULL,
    duration_months integer NOT NULL,
    classes_per_week integer NOT NULL,
    CONSTRAINT plans_frequency_check CHECK (((frequency)::text = ANY ((ARRAY['Semanal'::character varying, 'Mensal'::character varying, 'Bimestral'::character varying, 'Trimestral'::character varying, 'Semestral'::character varying, 'Anual'::character varying])::text[])))
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.plans_id_seq OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: student_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_documents (
    id character varying(50) NOT NULL,
    student_id integer,
    name character varying(150) NOT NULL,
    type character varying(10),
    upload_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_documents_type_check CHECK (((type)::text = ANY ((ARRAY['PDF'::character varying, 'IMAGE'::character varying, 'DOC'::character varying])::text[])))
);


ALTER TABLE public.student_documents OWNER TO postgres;

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    email character varying(150),
    cpf character varying(14),
    rg character varying(20),
    birth_date date,
    phone character varying(20),
    is_whatsapp boolean DEFAULT false,
    addr_cep character varying(9),
    addr_street character varying(200),
    addr_number character varying(20),
    addr_neighborhood character varying(100),
    addr_city character varying(100),
    addr_state character varying(2),
    addr_complement character varying(100),
    status character varying(20) DEFAULT 'Ativo'::character varying,
    plan_name text,
    modality_name text,
    enrollment_date date DEFAULT CURRENT_DATE,
    payment_status character varying(20) DEFAULT 'Pendente'::character varying,
    medical_notes text,
    photo text,
    guardian_name character varying(200),
    guardian_cpf character varying(14),
    guardian_phone character varying(20),
    guardian_relationship character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT students_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['Pago'::character varying, 'Pendente'::character varying, 'Atrasado'::character varying])::text[]))),
    CONSTRAINT students_status_check CHECK (((status)::text = ANY ((ARRAY['Ativo'::character varying, 'Inativo'::character varying, 'Trancado'::character varying])::text[])))
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.students_id_seq OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id character varying(50) NOT NULL,
    description character varying(200) NOT NULL,
    type character varying(10),
    category character varying(20),
    amount numeric(10,2) NOT NULL,
    date date NOT NULL,
    due_date date NOT NULL,
    status character varying(20),
    related_entity character varying(200),
    CONSTRAINT transactions_category_check CHECK (((category)::text = ANY ((ARRAY['TUITION'::character varying, 'SALARY'::character varying, 'MAINTENANCE'::character varying, 'RENT'::character varying, 'EQUIPMENT'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT transactions_status_check CHECK (((status)::text = ANY ((ARRAY['PAID'::character varying, 'PENDING'::character varying, 'LATE'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['INCOME'::character varying, 'EXPENSE'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    avatar text,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['DEV'::character varying, 'MANAGER'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: modalities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modalities ALTER COLUMN id SET DEFAULT nextval('public.modalities_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (id, name, time_start, time_end, days, instructor, capacity, enrolled, modality_id, status) FROM stdin;
\.


--
-- Data for Name: modalities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modalities (id, name, target_audience, description, color) FROM stdin;
9	HIDROGINÁSTICA 3ª IDADE	Idoso	Hidroginástica para Idosos	bg-blue-400
13	NATAÇÃO BEBES	Bebê	Natação para bebês	bg-teal-600
16	HIDROGINÁSTICA	Adulto		bg-blue-500
18	BALLET	Infantil		bg-pink-500
19	PILATES	Adulto		bg-yellow-500
15	NATAÇÃO INFANTIL E ADULTO	Adulto		bg-green-500
14	ZUMBA	Adulto	Natação para adultos	bg-teal-500
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plans (id, name, modality_id, frequency, price, duration_months, classes_per_week) FROM stdin;
504	Natação Infantil e Adulto 5x na semana	15	Mensal	289.30	1	5
505	Natação Infantil e Adulto 5x na semana	15	Semestral	267.30	6	5
496	Natação bebê 	13	Mensal	170.50	1	1
497	Natação bebê 	13	Semestral	154.00	6	1
559	Hidroginástica 5x na semana	16	Anual	207.90	12	5
558	Hidroginástica 5x na semana	16	Trimestral	233.20	3	5
557	Hidroginástica 4x na semana	16	Anual	184.80	12	4
556	Hidroginástica 4x na semana	16	Trimestral	216.70	3	4
555	Hidroginástica 3x na semana	16	Anual	170.50	12	3
499	Natação Infantil e Adulto 1x na semana	15	Semestral	118.80	6	1
500	Natação Infantil e Adulto 2x na semana	15	Mensal	193.60	1	2
501	Natação Infantil e Adulto 2x na semana	15	Semestral	170.50	6	2
502	Natação Infantil e Adulto 3x na semana	15	Mensal	222.20	1	3
503	Natação Infantil e Adulto 3x na semana	15	Semestral	200.20	6	3
508	Hidroginástica 3ª idade 1x na semana	9	Mensal	89.10	1	1
509	Hidroginástica 3ª idade 1x na semana	9	Semestral	82.50	6	1
510	Hidroginástica 3ª idade 2x na semana	9	Mensal	128.70	1	2
511	Hidroginástica 3ª idade 2x na semana	9	Semestral	118.80	6	2
512	Hidroginástica 3ª idade 3x na semana	9	Mensal	139.70	1	3
513	Hidroginástica 3ª idade 3x na semana	9	Semestral	128.70	6	3
514	Hidroginástica 3ª idade 4x na semana	9	Mensal	156.20	1	4
515	Hidroginástica 3ª idade 4x na semana	9	Semestral	140.80	6	4
516	Hidroginástica 3ª idade 5x na semana	9	Mensal	169.40	1	5
517	Hidroginástica 3ª idade 5x na semana	9	Semestral	156.20	6	5
518	Hidroginástica 1x na semana	16	Mensal	126.50	1	1
519	Hidroginástica 1x na semana	16	Semestral	110.10	6	1
520	Hidroginástica 2x na semana	16	Mensal	178.20	1	2
521	Hidroginástica 2x na semana	16	Semestral	162.80	6	2
522	Hidroginástica 3x na semana	16	Mensal	200.20	1	3
523	Hidroginástica 3x na semana	16	Semestral	178.20	6	3
524	Hidroginástica 4x na semana	16	Mensal	222.20	1	4
525	Hidroginástica 4x na semana	16	Semestral	207.90	6	4
526	Hidroginástica 5x na semana	16	Mensal	245.30	1	5
527	Hidroginástica 5x na semana	16	Semestral	222.20	6	5
528	Natação bebê	13	Trimestral	162.80	3	1
529	Natação bebê	13	Anual	140.80	12	1
530	Natação Infantil e Adulto 1x na semana	15	Trimestral	125.40	3	1
531	Natação Infantil e Adulto 1x na semana	15	Anual	104.50	12	1
532	Natação Infantil e Adulto 2x na semana	15	Trimestral	181.50	3	2
533	Natação Infantil e Adulto 2x na semana	15	Anual	162.80	12	2
534	Natação Infantil e Adulto 3x na semana	15	Trimestral	211.20	3	3
535	Natação Infantil e Adulto 3x na semana	15	Anual	184.80	12	3
536	Natação Infantil e Adulto 5x na semana	15	Trimestral	277.20	3	5
537	Natação Infantil e Adulto 5x na semana	15	Anual	245.30	12	5
540	Hidroginástica 3ª idade 1x na semana	9	Trimestral	85.80	3	1
541	Hidroginástica 3ª idade 1x na semana	9	Anual	73.70	12	1
542	Hidroginástica 3ª idade 2x na semana	9	Trimestral	122.10	3	2
543	Hidroginástica 3ª idade 2x na semana	9	Anual	104.50	12	2
544	Hidroginástica 3ª idade 3x na semana	9	Trimestral	134.20	3	3
545	Hidroginástica 3ª idade 3x na semana	9	Anual	118.80	12	3
546	Hidroginástica 3ª idade 4x na semana	9	Trimestral	146.30	3	4
547	Hidroginástica 3ª idade 4x na semana	9	Anual	133.10	12	4
548	Hidroginástica 3ª idade 5x na semana	9	Trimestral	162.80	3	5
549	Hidroginástica 3ª idade 5x na semana	9	Anual	140.80	12	5
550	Hidroginástica 1x na semana	16	Trimestral	118.80	3	1
551	Hidroginástica 1x na semana	16	Anual	95.70	12	1
552	Hidroginástica 2x na semana	16	Trimestral	170.50	3	2
553	Hidroginástica 2x na semana	16	Anual	147.40	12	2
554	Hidroginástica 3x na semana	16	Trimestral	189.20	3	3
498	Natação Infantil e Adulto 1x na semana	15	Mensal	133.10	1	1
560	ZUMBA	14	Mensal	120.00	1	2
561	ZUMBA	14	Trimestral	125.40	3	2
562	ZUMBA	14	Semestral	118.80	6	2
563	ZUMBA	14	Anual	112.20	12	2
564	Natação Infantil e Adulto 4x na semana	15	Mensal	258.50	1	4
565	Natação Infantil e Adulto 4x na semana	15	Trimestral	247.50	3	4
566	Natação Infantil e Adulto 4x na semana	15	Semestral	236.50	6	4
567	Natação Infantil e Adulto 4x na semana	15	Anual	222.50	12	4
\.


--
-- Data for Name: student_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_documents (id, student_id, name, type, upload_date) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, name, email, cpf, rg, birth_date, phone, is_whatsapp, addr_cep, addr_street, addr_number, addr_neighborhood, addr_city, addr_state, addr_complement, status, plan_name, modality_name, enrollment_date, payment_status, medical_notes, photo, guardian_name, guardian_cpf, guardian_phone, guardian_relationship, created_at) FROM stdin;
245	SANDRA REGINA P DO LAGO	\N	102.551.488-28	\N	1968-10-14	(19) 98143-8911	f	13050-906	Rua Ângela Russo Tafner	55	Country Ville	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA	2026-02-13	Pendente	\N	\N	\N	\N	\N	\N	2026-02-13 13:05:31.246044
225	MONICA DA SILVA CAMILO	\N	068.581.448-38	\N	1963-06-24	(19) 99177-3389	f	13061-240	Rua Camaioré	141	Vila Castelo Branco	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 13:24:07.034455
273	VIVIAN DE LAZARA GAMONAL SANTOS	\N	218.627.178-85	\N	1963-10-14	(19) 98119-3192	f	13051-132	Rua João Gallego	85	Jardim das Bandeiras	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 13:15:44.47068
285	LUCAS MATOS DE SOUZA	\N	\N	\N	2021-07-16	(19) 98139-7672	f	13059-648	Rua Nivaldo Alves Bonilha	902	Cidade Satélite Íris	Campinas	SP	\N	Ativo	[]	NATAÇÃO INFANTIL E ADULTO	2026-02-27	Pendente	\N	\N	MARIA CONCEIÇÃO CARNEIRO	396.984.848-25	(19) 98139-7672	\N	2026-02-27 14:16:33.428206
290	JOÃO FLORENZIANO DA CUNHA	\N	\N	\N	2016-05-11	(19) 99398-1719	f	13059-649	Rua Doutor Fuad Ferreira	571	Cidade Satélite Íris	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-10	Pendente	\N	\N	LAIS FLORENZIANO DA CUNHA	416.189.318-51	(19) 99398-1719	\N	2026-03-10 11:53:27.410883
215	LUCAS BRITO DAMINELLI	\N	\N	\N	2013-11-18	(19) 98874-8171	f	13060-413	Rua Jean Paul Sartre	102	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-26	Pendente	\N	\N	RACHELLE CASTRO DAMINELLI	220.750.688-60	(19) 98874-8171	\N	2026-01-26 19:58:32.501233
302	MATEUS LUIS DA SILVA STOCHE	\N	\N	\N	2019-02-23	(19) 99148-4987	f	13060-262	Rua Flor do Campo	334	Jardim Nova Morada	Campinas	SP	\N	Ativo	["533"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-11	Pendente	\N	\N	BRUNA DA SILVA STOCHE	365.002.528-02	(19) 99148-4987	\N	2026-03-11 12:05:20.677618
259	CONCEIÇÃO APARECIDA FERNANDES JERONIMO	\N	007.888.908-16	\N	1960-07-24	(19) 99777-7298	f	13060-113	Rua Ozorino Ribeiro de Melo	110	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["545"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-25	Pendente	\N	\N	\N	\N	\N	\N	2026-02-25 12:39:17.769307
311	AUGUSTO DAHER DO AMARAL	\N	\N	\N	2025-02-22	(19) 99689-8823	f	13060-296	Rua Francisco Anysio de Oliveira Paula Filho	171	Jardim Ibirapuera	Campinas	SP	\N	Ativo	["496"]	["NATAÇÃO BEBES"]	2026-03-12	Pendente	\N	\N	JOÃO VITOR DO AMARAL	368.779.888-76	(19) 99689-8823	\N	2026-03-12 10:09:25.715551
246	KARINA DE ABREU MONTEIRO	\N	286.154.058-32	\N	1980-07-30	(19) 99766-4787	f	13057-535	Avenida Comendador Emílio Pieri	788	Conjunto Habitacional Vida Nova	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-18	Pendente	\N	\N	\N	\N	\N	\N	2026-02-18 14:43:47.17721
312	ELOÁ CAROLINE RODRIGUES DE OLIVEIRA	\N	\N	\N	2018-10-05	(19) 99732-9168	f	13061-076	Rua Manuel Pinheiro	6	Jardim García	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-16	Pendente	\N	\N	RAYSSA RODRIGUES MADUREIRA	558.891.088-59	(19) 99732-9168	\N	2026-03-16 12:57:54.304943
28	ANA JULIA MESSIAS DO NASCIMENTO SANTOS	\N	541.100.718-60	\N	2006-03-31	(19) 99499-8629	f	13060-325	Rua Doutor Antônio Sylvio Cunha Bueno	\N	Jardim Roseira	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
27	LUCAS STEPHAN SILVA	\N	\N	\N	2019-01-16	(19) 97415-1341	f	13060564	Rua Antonio de Souza Lima	25	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
260	MARIA ATILIA BENEDITO SANTOS	\N	\N	\N	1952-02-22	(19) 99384-3081	f	13059-647	Rua Doutor Mamed Hussein	1247	Cidade Satélite Íris	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-25	Pendente	\N	\N	\N	\N	\N	\N	2026-02-25 14:18:06.696126
286	MARIA DEOLINDA NOVAES	\N	819.714.358-72	\N	1950-07-12	(19) 98127-0151	f	13050-472	Rua Professor Fernando Thielle	95	Vila Pompéia	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 14:19:10.929814
14	BEATRIZ RODRIGUES ARAUJO	\N	\N	\N	2013-08-08	(19) 99158-6070	f	13060744	Rua Rúbens Roberto Ciolfi	315	Parque Residencial Vila União	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 1x na semana	HIDROGINÁSTICA 3ª IDADE	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
291	LARA AMORIM DA SILVA	\N	\N	\N	2021-06-20	(19) 99119-6221	f	13050-464	Rua Lavrinhas	78	Vila Pompéia	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-10	Pendente	\N	\N	FRANCILA SANTOS DA SILVA AMORIM	356.918.548-60	(19) 99119-6221	\N	2026-03-10 11:55:49.286493
303	GIOVANA MAMED TREVISAN	\N	459.489.038-50	\N	2002-12-26	(19) 98702-0329	f	13058-128	Rua Maria Francisca Meirelles Mello	164	Conjunto Habitacional Parque da Floresta	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-11	Pendente	\N	\N	\N	\N	\N	\N	2026-03-11 12:06:41.550103
274	DALVA PINTO	\N	256.431.298-50	\N	1958-05-08	(19) 97122-4835	f	13050-812	Rua Antônio Martins de Oliveira	267	Jardim Capivari	Campinas	SP	\N	Ativo	["545"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 13:21:29.374993
151	IVANIR FERREIRA	\N	068.893.218-55	\N	1965-08-04	(19) 99167-3794	f	13059-619	Rua Orlando Signorelli	170	Cidade Satélite Íris	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
216	JOÃO PEDRO DA SILVA BASSAN	\N	\N	\N	2018-12-18	(19) 98276-1091	f	13061-096	Rua Alfredo Battibugli	109	Jardim García	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-26	Pendente	\N	\N	RENATA BASSAN	425.499.988-71	(19) 98276-1091	\N	2026-01-26 20:00:34.88895
313	RAYSSA RODRIGUES MADUREIRA	\N	454.945.868-20	\N	1997-07-31	(19) 99732-9168	f	13061-076	Rua Manuel Pinheiro	6	Jardim García	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-16	Pendente	\N	\N	\N	\N	\N	\N	2026-03-16 12:59:44.679703
261	MARIA JESUS SILVA LOBO	\N	096.983.948-00	\N	1966-05-23	(19) 99966-2305	f	13060-039	Rua Namatala Antônio Haddad	36	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-25	Pendente	\N	\N	\N	\N	\N	\N	2026-02-25 14:21:31.296098
30	ARTHUR PEREIRA DE OLIVEIRA CARDOSO	\N	\N	\N	2021-02-14	(19) 99474-1974	f	13059780	Rua Henrique Thoni Filho	208	Jardim Ouro Preto	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 1x na semana	NATAÇÃO INFANTIL E ADULTO	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
256	ANA LAURA CARVALHO FERREIRA	\N	\N	\N	2020-10-28	(19) 98109-7000	f	13054-131	Rua Jetibá	979	Vila Aeroporto	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-18	Pendente	\N	\N	ADILSON FERREIRA	589.092.368-41	(19) 98109-7000	\N	2026-02-18 17:08:12.246412
275	ABRAÃO MATOS DE TOLEDO	\N	\N	\N	2024-09-25	(19) 99163-5286	f	13060-870	Rua Niterói	281	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["Natação bebê"]	["NATAÇÃO BEBES"]	2026-02-27	Pendente	\N	\N	REGIANE MATOS DE TOLEDO	295.249.008-23	(19) 99163-5286	\N	2026-02-27 13:30:23.4736
292	HEITOR AMORIM DA SILVA SANTOS	\N	\N	\N	2021-06-20	(19) 99119-6221	f	13050-464	Rua Lavrinhas	78	Vila Pompéia	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-10	Pendente	\N	\N	FRANCILA SANTOS DA SILVA AMORIM	356.918.548-60	(19) 99119-6221	\N	2026-03-10 11:56:55.347926
304	LORENA HIRATA DA SILVA	\N	\N	\N	2021-04-15	(19) 98112-3399	f	13060-562	Rua Alzira Marcondes	160	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-11	Pendente	\N	\N	BRUNA HIRATA PINTO	375.915.708-46	(19) 98112-3399	\N	2026-03-11 12:08:21.18479
29	CRISTIANA MESSIAS DO NASCIMENTO	\N	324.295.198-01	\N	1984-11-11	(19) 99334-7806	f	13060325	Rua Doutor Antônio Sylvio Cunha Bueno	\N	Jardim Roseira	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
314	DAVI ARAGAN	\N	\N	\N	2022-02-11	(19) 99140-8082	f	13060-039	Rua Namatala Antônio Haddad	55	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["496"]	["NATAÇÃO BEBES"]	2026-03-16	Pendente	\N	\N	AMANDA RIBAS MATEUS	347.524.058-06	(19) 99140-8082	\N	2026-03-16 13:04:22.915342
247	VILMA CAMILO	\N	\N	\N	1969-11-05	(19) 99746-7101	f	13060-711	Rua Cleir Arruda Acosta	221	Parque Residencial Vila União	Campinas	SP	\N	Ativo	[]	NATAÇÃO INFANTIL E ADULTO	2026-02-18	Pendente	\N	\N	\N	\N	\N	\N	2026-02-18 14:45:58.763382
262	MARIA ANGELICA P DA SILVA	\N	031.139.266-02	\N	1961-03-06	(19) 98457-6209	f	13060-150	Rua Cneo Pompeo de Camargo	1594	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-25	Pendente	\N	\N	\N	\N	\N	\N	2026-02-25 14:24:17.596019
305	MARIANA MONTEIRO OLIVEIRA	\N	\N	\N	2023-03-17	(35) 9234-4498	f	13060-562	Rua Alzira Marcondes	225	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	["496"]	["NATAÇÃO BEBES"]	2026-03-11	Pendente	\N	\N	GABRIELA MONTEIRO DE MORAES	131.315.866-64	(35) 9234-4498	\N	2026-03-11 12:09:54.430099
15	ALICIA REZENDE SOUZA	\N	\N	\N	2021-02-14	(19) 97418-3988	f	13050450	Rua Mineiros do Tietê	497	Vila Pompéia	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 1x na semana	NATAÇÃO INFANTIL E ADULTO	2026-01-24	Pendente	\N	\N	HALISSON SOUZA	\N	(19) 97418-3988	\N	2026-01-24 14:21:33.892151
276	NEIDE FELIPE SALDANHA	\N	055.239.618-41	\N	1955-08-23	(19) 98301-6217	f	13060-748	Rua José Augusto de Mattos	605	Parque Residencial Vila União	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 13:36:53.034633
40	BENJAMIN PRINCE OLIVEIRA DIAS	\N	\N	\N	2019-11-25	(19) 99138-7811	f	13051076	Rua Professora Amália de Arruda Legendre Martini	1115	Jardim do Lago Continuação	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 1x na semana	NATAÇÃO INFANTIL E ADULTO	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
288	EDNA SILVA PERES	\N	867.986.858-20	\N	1954-07-21	(19) 98121-1861	f	13060-190	Rua Domício Pacheco e Silva	88	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["542"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 14:24:16.804117
41	BELLA TEOFILO RIBEIRO	\N	\N	\N	2023-07-11	(19) 98894-1478	f	13060055	Rua da Solidariedade	25	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	Natação bebê	NATAÇÃO BEBES	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
50	ARTHUR DE SOUZA PAULO	\N	\N	\N	2022-12-10	(19) 98978-8175	f	13060161	Rua Joaquim Lourenço de Godoy	138	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 1x na semana	NATAÇÃO INFANTIL E ADULTO	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
257	THALLYS HENRY RODRIGUES DIBOUT	\N	\N	\N	2025-02-17	(19) 98310-2707	f	13057-158	Rua Ayrton José do Couto	136	Residencial São José	Campinas	SP	\N	Ativo	["Natação bebê "]	["NATAÇÃO BEBES"]	2026-02-18	Pendente	\N	\N	NICOLE MORALES DIBOUT	468.110.358-36	(19) 98310-2707	\N	2026-02-18 17:09:47.649835
293	BIANCA BUENO BONFIM SERVIDONE	\N	\N	\N	2015-02-24	(19) 98188-6849	f	13060-784	Rua Creso Lopes Ramalho	46	Parque Residencial Vila União	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-10	Pendente	\N	\N	CAMILA BONFIM SERVIDONE	317.728.298-62	(19) 98188-6849	\N	2026-03-10 12:44:29.902657
33	ELAINE CRISTINA LUPI CHIOTTI	\N	311.940.238-94	\N	1981-12-15	(19) 99179-2370	f	13060746	Rua Manoel Arthur Cavalcante Lacombe	156	Parque Residencial Vila União	Campinas	SP	\N	Inativo	["560"]	["ZUMBA"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
32	LOURDES GOMES DE OLIVEIRA CARDOSO	\N	\N	\N	1961-10-12	(19) 98859-2427	f	13059646	Rua Doutor Dante Erbolato	2424	Cidade Satélite Íris	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
34	LUCIANA DE CASSIA DE OLIVEIRA	\N	217.659.868-77	\N	1981-11-02	(19) 99308-7605	f	13060123	Rua São Francisco	81	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
35	MATHEUS HENRIQUE F. MARTINS	\N	351.915.878-71	\N	2019-07-17	(19) 99506-4022	f	13060536	Rua Laudo Vieira Rocha	236	Parque Tropical	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
39	BENJAMIN LINS NORONHA	\N	\N	\N	2016-09-02	(19) 99217-9381	f	13050420	Rua Araçoiaba da Serra	704	Cidade Jardim	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
53	GABRIELA DE SOUZA MATHIAS	\N	\N	\N	2018-11-05	(19) 98838-9030	f	13060502	Rua Domingos Marciano	82	Jardim Santa Lúcia	Campinas	SP	\N	Ativo	["531"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
47	GRACELI ALVES DE ARRUDA	\N	173.887.538-50	\N	1968-08-01	(19) 99315-4787	f	13060063	Rua Ruy Pupo Campos Ferreira	\N	Jardim Campos Elíseos	Campinas	SP	\N	Inativo	["520"]	["HIDROGINÁSTICA"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
36	JULIA FERNANDES DE SOUZA	\N	\N	\N	0001-01-01	(19) 98144-2464	f	13059660	Rua Romeu Marinelli	780	Cidade Satélite Íris	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
43	MARCIA ADRIANA TEODORO	\N	119.177.538-02	\N	1968-07-13	(19) 99312-8080	f	13061271	Rua Godofredo Batista Carvalho	76	Vila Castelo Branco	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
248	MARIA DA PAIXÃO PINHEIRO MOURA	\N	137.661.108-29	\N	1954-04-16	(19) 98444-2104	f	13060-723	Rua José Cúrcio	36	Parque Residencial Vila União	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-18	Pendente	\N	\N	\N	\N	\N	\N	2026-02-18 14:49:18.866753
44	MATHEUS VIAN BRAZ	\N	\N	\N	2012-04-23	(19) 99195-9198	f	13070751	Avenida Governador Pedro de Toledo	442	Bonfim	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
46	VINICIUS JOSE DE BRITO	\N	\N	\N	2016-04-12	(19) 99162-4560	f	13052601	Rua Manoella Marcolino da Silva Derigo	\N	Residencial Nova Bandeirante	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
48	LUCIA APARECIDA ARAGÃO DE LIMA	\N	137.510.688-05	\N	1970-04-14	(19) 99685-5727	f	13060059	Rua Sílvia Leite de Godoy	221	Jardim Campos Elíseos	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
49	SOPHIA DE SOUZA PAULO	\N	\N	\N	2019-06-25	(19) 98978-8175	f	13060161	Rua Joaquim Lourenço de Godoy	138	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
51	MARILENE MACIEL	\N	257.448.381-2	\N	1956-06-02	(19) 92001-4815	f	13060744	Rua Rúbens Roberto Ciolfi	452	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
52	THEO DA SILVA ARARUNA	\N	\N	\N	2023-09-23	(19) 98955-9431	f	13060073	Rua Antônio Rodrigues Moreira Neto	634	Jardim Paulicéia	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
54	MARIA ANTONIA SILVESTRINE GOMES	\N	155.757.148-10	\N	0001-01-01	(19) 99475-6844	f	13060380	Rua Belo Horizonte	30	Vila Perseu Leite de Barros	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
55	CLAUDIO OLAVO DA SILVA JUNIOR	\N	222.590.958-01	\N	1981-12-05	(19) 99570-7739	f	13050435	Rua Padre Donizete Tavares de Lima	1055	Cidade Jardim	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
42	INGRID BUGATTI ROCHA PEREIRA	\N	452.260.578-14	\N	1995-10-25	(19) 99146-4117	f	13060854	Rua Sílvio Rizzardo	400	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["567"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
45	JOAQUIM EMANUEL DE SOUZA CARVALHO	\N	\N	\N	2022-06-08	(19) 99137-1855	f	13060611	Rua Doutor Jeber Juabre	146	Jardim Márcia	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
315	ANA CLARA NEVES BERTI	\N	\N	\N	2021-01-08	(19) 99894-6224	f	13060-856	Rua Luís Liberman	4	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-17	Pendente	\N	\N	ANA CAROLINA NEVES PINTO	350.882.378-47	(19) 99894-6224	\N	2026-03-17 13:06:18.413841
258	JULIANO PEREIRA DA SILVA	\N	120.648.358-06	\N	1975-01-18	(19) 99787-0036	f	13061-124	Rua Raposo Tavares	60	Jardim García	Campinas	SP	\N	Ativo	["Hidroginástica 2x na semana"]	["HIDROGINÁSTICA"]	2026-02-19	Pendente	\N	\N	\N	\N	\N	\N	2026-02-19 13:56:23.940043
263	BEATRIZ APARECIDA DE JESUS SARZANO VIALTA	\N	356.370.438-41	\N	1961-10-01	(19) 99178-4804	f	13050-451	Avenida Mococa	152	Vila Pompéia	Campinas	SP	\N	Ativo	["Hidroginástica 3ª idade 2x na semana"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-25	Pendente	\N	\N	\N	\N	\N	\N	2026-02-25 14:30:23.472042
277	LUCIANO HENRIQUE VALADARES DE LIMA	\N	898.316.161-91	\N	1981-01-19	(19) 97407-6292	f	13060-111	Rua Almirante Custódio José de Melo	166	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 13:44:32.206955
16	VERA LUCIA FELIX FRANQUI	\N	237.453.809-59	\N	1954-12-11	(19) 99186-5360	f	13060190	Rua Domício Pacheco e Silva	88	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
289	REGINA ALEXANDRINO DE ASSIS	\N	033.624.148-85	\N	1960-01-28	(19) 99363-2701	f	13060-112	Rua Francisco Bayardo	95	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 14:26:42.515163
17	LUARA MAGALHÃES ROCHA FERREIRA	\N	\N	\N	2022-02-19	(19) 99505-7900	f	13060151	Rua Arlindo Gomes	344	Jardim Novo Campos Elíseos	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
21	HEITOR LUIZ MOREIRA	\N	\N	\N	2019-04-10	(19) 99166-4495	f	13051076	Rua Professora Amália de Arruda Legendre Martini	1115	Jardim do Lago Continuação	Campinas	SP	\N	Ativo	["531"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
19	MATHEO DE JESUS SILVA	\N	\N	\N	2022-11-08	(19) 97416-8311	f	13060006	Rua Antônio Name Chaib	165	Jardim Anchieta	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
22	HERMINIA SABINO	\N	15496418836	\N	1959-11-07	(19) 97160-6137	f	13060702	Rua Célio dos Santos Ferreira	285	Parque Residencial Vila União	Campinas	SP	\N	Inativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
31	ALICIA PEREIRA DE OLIVEIRA CARDOSO	\N	\N	\N	2021-02-14	(19) 99474-1974	f	13059780	Rua Henrique Thoni Filho	208	Jardim Ouro Preto	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 1x na semana	NATAÇÃO INFANTIL E ADULTO	2026-01-24	Pendente	\N	\N	WATSON PEREIRA DE OLIVEIRA CARDOSO/TATIANE DE OLIVEIRA CARDOSO	\N	(19) 99474-1974	\N	2026-01-24 14:21:33.892151
294	REGINA ALVES DE LIMA	\N	266.845.428-09	\N	1976-03-15	(19) 98390-5544	f	13059-039	Rua Professora Aracy Caixeta Barbosa	439	Jardim Florence	Campinas	SP	\N	Ativo	["Hidroginástica 2x na semana"]	["HIDROGINÁSTICA"]	2026-03-10	Pendente	\N	\N	\N	\N	\N	\N	2026-03-10 12:45:48.432902
306	HELENA DE ALMEIDA FERREIRA	\N	\N	\N	2023-04-23	(19) 98100-9983	f	13060-032	Rua Conselheiro José Clemente Pereira	528	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["529"]	["NATAÇÃO BEBES"]	2026-03-11	Pendente	\N	\N	STEPHANY DE ALMEIDA CANOBEL	470.688.818-23	(19) 98100-9983	\N	2026-03-11 12:11:43.03716
23	PETRUCIO FERREIRA DA SILVA	\N	240.827.674-87	\N	1959-09-12	(19) 97160-6137	f	13060702	Rua Célio dos Santos Ferreira	285	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
20	ARTHUR LUIZ MOREIRA	\N	\N	\N	2019-04-10	(19) 99166-4495	f	13051076	Rua Professora Amália de Arruda Legendre Martini	1115	Jardim do Lago Continuação	Campinas	SP	\N	Ativo	["531"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
24	MARTA REGINA G. DO PRADO	\N	316.227.108-86	\N	1970-12-04	(19) 98733-4749	f	13060061	Rua Orestes Colombari	266	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
218	BRAYNO RODRIGUES DE SOUZA	\N	486.551.198-90	\N	2001-09-12	(19) 98212-5280	f	13059-607	Rua Francisco da Costa Eduardo	293	Cidade Satélite Íris	Campinas	SP	\N	Ativo	["500"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 12:31:27.785353
26	NICOLAS COSSU	\N	\N	\N	2015-12-14	(19) 99525-0038	f	13054107	Avenida Jacaúna	2293	Vila Aeroporto	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
249	CUSTODIO LOPES MOURA	\N	016.984.478-17	\N	1960-04-21	(19) 98444-2104	f	13060-723	Rua José Cúrcio	36	Parque Residencial Vila União	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-18	Pendente	\N	\N	\N	\N	\N	\N	2026-02-18 14:50:27.270119
244	MIGUEL ANDRADE CERQUEIRA	\N	\N	\N	2020-09-18	(19) 99329-2662	f	13183-270	Rua Frederico Alves da Costa	801	Jardim Nova Hortolândia I	Hortolândia	SP	\N	Ativo	[]	NATAÇÃO INFANTIL E ADULTO	2026-02-07	Pendente	\N	\N	LUCAS CERQUEIRA DA SILVA	487.532.428-66	(19) 99329-2662	\N	2026-02-07 18:17:49.206887
25	DIOGO RIBEIRO DO PRADO	\N	\N	\N	2018-08-05	(19) 98733-4749	f	13060061	Rua Orestes Colombari	266	Jardim Campos Elíseos	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
18	EDVALDA GISELE P.S. CAPURSSI	\N	273.192.278-86	\N	1979-09-28	(19) 98197-5283	f	13060223	Rua Pelicano	277	Jardim Londres	Campinas	SP	\N	Inativo	["520"]	["HIDROGINÁSTICA"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
57	MARIA ANTONELA RABELO BEZERRA DE SOUZA	\N	\N	\N	2018-11-07	(11) 95833-3604	f	13060726	Rua Paulo Vianna de Souza	270	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
56	FABIANA NASCIMENTO DA SILVA	\N	319.091.008-11	\N	1985-01-18	(19) 99570-7039	f	13050435	Rua Padre Donizete Tavares de Lima	1055	Cidade Jardim	Campinas	SP	\N	Inativo	["520"]	["HIDROGINÁSTICA"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
226	GENI DE ALMEIDA SILVA	\N	216.811.118-50	\N	1946-03-16	(19) 98812-8323	f	13060-534	Rua José Faccioni	75	Parque Tropical	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 13:26:37.473599
11	MILENA MODESTO	\N	\N	\N	0001-01-01	(19) 99133-4993	f	13060524	Avenida Presidente Juscelino	2275	Parque Tropical	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
6	EMANUELLY DUARTE SILVA TERRITO	\N	\N	\N	2021-12-27	(19) 98602-1705	f	13058286	Rua Professor Casemiro dos Reis Filho	222	Loteamento Residencial Novo Mundo	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
219	ALICE COSTA NOGUEIRA	\N	\N	\N	2023-08-10	(18) 99823-7459	f	13052-550	Avenida Ary Rodrigues	315	Parque Camélias	Campinas	SP	\N	Ativo	["Natação bebê "]	["NATAÇÃO BEBES"]	2026-02-04	Pendente	\N	\N	NAIARA	034.975.741-04	(18) 99823-7459	\N	2026-02-04 12:51:34.227013
287	APARECIDA PETELUCCI DO CARMO	\N	720.130.108-00	\N	1951-09-29	(19) 98190-7072	f	13060-112	Rua Francisco Bayardo	400	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["Hidroginástica 3ª idade 2x na semana"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 14:21:31.717153
295	MARLENE PREREIRA LIMA	\N	896.899.336-04	\N	1958-04-09	(19) 98804-0892	f	13060-123	Rua São Francisco	175	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["Hidroginástica 3ª idade 2x na semana"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-03-10	Pendente	\N	\N	\N	\N	\N	\N	2026-03-10 12:48:16.876629
1	TATIANE CENA DE MELLO	\N	224.083.788-85	\N	1981-08-31	(19) 99466-9980	f	13050191	Rua Ângela Russo Tafner	155	Loteamento Country Ville	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
2	LUSIA SANTOS NUNES	\N	960.085.208-15	\N	1951-10-30	(19) 99105-1533	f	1060072	Rua Jornalista Ernesto Napoli	353	JD LONDRES	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
264	ENZO FELIPE AMORIM COSTA	\N	\N	\N	2015-04-15	(19) 99416-7066	f	13060-616	Rua Pedro Galhardi	450	Jardim Yeda	Campinas	SP	\N	Ativo	["500"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-25	Pendente	\N	\N	HEITOR FELIPE COSTA	\N	(19) 99416-7066	\N	2026-02-25 14:37:08.667815
250	SILVANA MARQUES DE ALCANTARA MARTINS	\N	172.887.378-96	\N	1973-08-31	(19) 98745-8211	f	13060-110	Rua Manoel Fernandes Dias	175	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA	2026-02-18	Pendente	\N	\N	\N	\N	\N	\N	2026-02-18 14:53:39.22075
4	MAITE DIONIZIO DELLA COSTA	\N	\N	\N	2023-01-04	(19) 99598-0301	f	13105122	Rua Soldado Paulo Augusto Andrele Silva	213	Imperial Parque (Sousas)	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
307	ANA CLAUDIA FIRMINO DE CAMPOS	\N	245.693.598-50	\N	1974-10-26	(19) 99643-6819	f	13050-463	Rua Lucélia	108	Vila Pompéia	Campinas	SP	\N	Ativo	["521"]	["HIDROGINÁSTICA"]	2026-03-11	Pendente	\N	\N	\N	\N	\N	\N	2026-03-11 12:14:01.643305
5	IRENE MARQUES DOS SANTOS	\N	149.994.588-45	\N	1967-04-02	(19) 99324-6654	f	13060702	Rua Célio dos Santos Ferreira	278	Parque Residencial Vila União	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
12	APARECIDA CELIA ALVES	\N	838.977.782-7	\N	1960-10-04	(19) 93386-1509	f	13030720	Rua Paulo Lacerda	326	São Bernardo	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
227	LIVIA GABRIELLE FELICIANO	\N	\N	\N	2017-01-18	(19) 98255-1645	f	13060-057	Rua Ernesto Alves Filho	78	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["532"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-04	Pendente	\N	\N	ANGELA MARIA RIBEIRO FELICIANO	592.679.419-68	(19) 98255-1645	\N	2026-02-04 13:28:27.746252
7	VALENTINA SANTOS TACCO DA SILVA	\N	\N	\N	0001-01-01	(19) 99272-5188	f	13058533	Rua Olindo Gardelin	90	Parque Valença I	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
9	BEATRIZ MARTINS MANGIA COIMBRA	\N	\N	\N	2023-05-12	(19) 98278-9610	f	13061125	Rua Luís Pereira Barreto	2	Jardim García	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
61	CAIO DA SILVA	\N	\N	\N	2020-06-25	(19) 98917-6562	f	13060734	Rua Albert Sabin	84	Parque Residencial Vila União	Campinas	SP	\N	Ativo	["500"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
8	GABRIELLE SANTOS DA COSTA	\N	\N	\N	2017-12-31	(19) 99548-1538	f	13060511	Rua Oswaldo Ims	\N	Jardim Santa Lúcia	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
278	JEOVÁ DOS REIS RODRIGUES	\N	819.289.083-00	\N	1952-01-06	(19) 99692-2067	f	13060-113	Rua Ozorino Ribeiro de Melo	86	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 13:47:40.509612
3	DAVI GABRIEL POSSANI OLIVEIRA	\N	\N	\N	2023-09-01	\N	f	13052550	Avenida Ary Rodrigues	315	Parque CamÃ©lias	Campinas	SP	\N	Ativo	["529"]	["NATAÇÃO BEBES"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
238	DAVI HENRIQUE PEREIRA	\N	\N	\N	2020-12-15	(19) 99400-4404	f	13059-780	Rua Henrique Thoni Filho	65	Jardim Ouro Preto	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-07	Pendente	\N	\N	CASSIANE BORGES PEREIRA	451.873.868-32	(19) 99400-4404	\N	2026-02-07 18:07:19.926191
10	MARIA FREIRE ANTONIO	\N	256.264.368-20	\N	1961-08-24	(19) 99133-4993	f	13060524	Avenida Presidente Juscelino	2275	Parque Tropical	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
13	JUSSARA APARECIDA GONÇALVES	\N	083.800.468-70	\N	1961-09-23	(19) 98920-7592	f	13060766	Rua Dona Neuza Goulart Brizola	101	Parque Residencial Vila UniÃ£o	Campinas	SP	\N	Ativo	["543"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
62	LAURA GODOI GALHARDO NASCIMENTO	\N	\N	\N	2016-05-17	(19) 98190-0653	f	13060866	Avenida Marechal Juarez Távora	746	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["531"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
58	MURILO DE LIMA SOFA	\N	\N	\N	2023-05-22	(19) 99685-5727	f	13060059	Rua Sílvia Leite de Godoy	221	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
59	ROSANGELA SATURNINO DE OLIVEIRA	\N	367.857.798-98	\N	1989-04-07	(19) 97119-1312	f	13060860	Rua Doutor Sylvio Carvalhaes	170	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["Zumba 1x Semana"]	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
60	MARCOS VINICIUS DOS SANTOS	\N	353.719.048-40	\N	1988-02-28	(19) 99140-9831	f	13050750	Rua Agnaldo Saturnino Rocha	52	Parque Ipiranga	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
220	MASSUKO AOKI DE ALCANTARA	\N	775.167.708-25	\N	1956-03-22	(19) 99183-8681	f	13060-313	Rua Benedito dos Santos Ribeiro	96	Jardim Roseira	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 13:04:37.483798
90	BERNARDO SOARES ANDREO	\N	\N	\N	2022-04-29	(19) 97153-8181	f	13050-411	Rua Joanópolis	96	Cidade Jardim	Campinas	SP	\N	Ativo	["Natação bebê "]	["NATAÇÃO BEBES"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
239	ANNIA BEATRIZ SANTOS DE OLIVEIRA	\N	524.389.758-22	\N	2004-04-27	(19) 98971-8969	f	13060-049	Rua Scyllas Leite de Sampaio	67	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 3x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-07	Pendente	\N	\N	\N	\N	\N	\N	2026-02-07 18:08:43.678739
251	APARECIDA LUIZ DE ALCANTARA	\N	249.009.138-71	\N	1945-08-23	(19) 98745-8211	f	13060-110	Rua Manoel Fernandes Dias	175	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["Hidroginástica 3ª idade 3x na semana"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-18	Pendente	\N	\N	\N	\N	\N	\N	2026-02-18 14:54:51.15792
37	ROBERTO CELESTINO ALMEIDA	\N	196.092.588-16	\N	1976-07-29	(19) 99814-1976	f	13061100	Avenida Transamazônica	311	Jardim García	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
265	APARECIDA FELIZATTI OLIVATO	\N	871.033.208-10	\N	1959-04-14	(19) 99721-3330	f	13060-903	Rua Doutor Sylvio Carvalhaes	170	Jardim Anchieta	Campinas	SP	\N	Ativo	["512"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-25	Pendente	\N	\N	\N	\N	\N	\N	2026-02-25 14:39:57.833131
64	LUIZA GOMIDE LANA	\N	\N	\N	2018-02-05	(19) 97159-0331	f	13060358	Avenida Homero Vasconcelos de Souza Camargo	1088	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
65	RODRIGO LANA	\N	393.032.868-2	\N	0001-01-01	(19) 97139-0331	f	13060358	Avenida Homero Vasconcelos de Souza Camargo	1088	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
69	REBECA FAUSTINO PEGORARI	\N	\N	\N	0001-01-01	(19) 98287-3449	f	13060864	Avenida Paulo Provenza Sobrinho	563	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
77	LUIZA ALVES VIEIRA	\N	\N	\N	2020-03-31	(19) 98190-7320	f	13060380	Rua Belo Horizonte	250	Vila Perseu Leite de Barros	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
78	MILENA APOLINARIO BUENO	\N	\N	\N	2020-02-13	(19) 98609-5620	f	13060380	Rua Belo Horizonte	250	Vila Perseu Leite de Barros	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
80	PIETRO LORENZO DANTAS DOS SANTOS	\N	\N	\N	2018-06-13	(19) 99498-9855	f	13060067	Rua Mário Ribeiro do Amaral	405	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
81	LUCAS SANTOS VIANA	\N	\N	\N	2016-01-23	(19) 98237-5094	f	13060073	Rua Antônio Rodrigues Moreira Neto	144	Jardim Paulicéia	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
82	ROBERTA JANAINA CARNAUSKAS QUIONHA	\N	224.289.648-28	\N	1982-01-06	(19) 98319-5730	f	13061221	Rua Curiango	61	Vila Padre Manoel de Nóbrega	Campinas	SP	\N	Trancado	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
83	PAULA REGINA DE CAMARGO	\N	264.207.808-61	\N	1974-03-03	(19) 98136-8422	f	13060721	Rua Dona Esmeralda Oliveira Mathias	220	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
84	LUZINEIDE BASILIO DE OLIVEIRA	\N	871.655.387-04	\N	1964-07-19	(19) 98207-1073	f	13060064	Rua Luís Carlos Miami	283	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
85	ZELIA APARECIDA ARAUJO	\N	093.963.688-20	\N	1958-07-03	(19) 97403-8845	f	13060740	Rua José Lourenço de Sá	921	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
86	MARIA JOSÉ DE OLIVEIRA	\N	061.975.178-92	\N	1962-10-03	(11) 97550-1694	f	13060190	Rua Domício Pacheco e Silva	88	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
87	VALKIRIA TEIXEIRA DE SOUZA	\N	187.786.438-21	\N	1975-02-02	(19) 98807-2093	f	13060045	Rua Danilo Glauco Pereira Villagelin	504	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
89	MARILDA MACEDO MACHADO	\N	182.150.558-18	\N	1967-08-02	(19) 98426-2888	f	13059658	Rua Josepha Júlia Doval de Oliveira	325	Cidade Satélite Íris	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
92	MARIAHA MARTA DE PAULA SILVA	\N	\N	\N	2021-07-27	(19) 98815-5109	f	13061324	Rua Seriema	63	Vila Padre Manoel de Nóbrega	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
93	SARAH MARTA DE PAULA SILVA	\N	\N	\N	2019-10-23	(19) 98815-5109	f	13061324	Rua Seriema	63	Vila Padre Manoel de Nóbrega	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
79	ANA PAULA MESSIAS NASCIMENTO	\N	230.182.348-20	\N	1987-04-28	(19) 98890-0520	f	13060228	Rua José Amâncio Cucatti	312	Jardim Londres	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 2x na semana	NATAÇÃO INFANTIL E ADULTO	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
296	MORGANA SILVA	\N	150.017.828-48	\N	1971-10-29	(19) 99608-2676	f	13060-240	Avenida Ibirapuera	108	Jardim Londres	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 2x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-10	Pendente	\N	\N	\N	\N	\N	\N	2026-03-10 12:52:05.952638
308	LUAN EMANUEL PINTO PEREIRA	\N	\N	\N	2024-01-18	(19) 98376-5746	f	13060-067	Rua Mário Ribeiro do Amaral	326	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["529"]	["NATAÇÃO BEBES"]	2026-03-11	Pendente	\N	\N	NATHIELY YASMIN DA COSTA SALES	476.373.178-54	(19) 98376-5746	\N	2026-03-11 12:15:31.816599
38	ANA LUCIA BARBOSA DE SOUZA SILVA	\N	120.796.538-30	\N	1964-05-27	(19) 98710-9269	f	13060533	Rua Laércio Monzani	312	Parque Tropical	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
75	CECILIA FREITAS ROCHA	\N	\N	\N	2015-06-03	(19) 97419-9799	f	13060314	Avenida Brasília	1156	Jardim Roseira	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
66	ELIZABETH FRANCISCA DE OLIVEIRA CASTRO	\N	220.901.848-09	\N	1957-11-08	(19) 98296-2875	f	13060063	Rua Ruy Pupo Campos Ferreira	\N	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["511"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
228	EMANOELLY LARISSA OLIVEIRA	\N	521.938.508-95	\N	1999-11-02	(19) 99971-8173	f	13060-024	Rua Conselheiro Antônio Carlos	270	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["534"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 13:30:37.702688
88	ESTER ARARUNA NUNES	\N	\N	\N	2019-08-05	(19) 98829-8633	f	13060489	Rua Madre Tereza de Calcutá	360	Jardim Santa Lúcia	Campinas	SP	\N	Ativo	["530"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
63	HELOISE RAPELA PIGA ROQUE	\N	\N	\N	2022-12-11	(19) 99598-6488	f	13052444	Rua Corumbataí	215	Jardim Itatinga	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
76	ICARO JOSÉ MORAES FELIZBERTO	\N	\N	\N	2020-03-24	(19) 97419-9799	f	13053240	Avenida Joaquim Olavo Sampaio	150	Vila Palmeiras I	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
91	LEONARDO BLEY PENIDO	\N	\N	\N	2017-10-27	(19) 98829-8633	f	13060824	Rua Júlio Tim	600	Jardim Ipaussurama	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
68	LIDIA ALVES BUENO	\N	263.889.738-84	\N	1957-10-24	(19) 98287-3449	f	13060864	Avenida Paulo Provenza Sobrinho	\N	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["512"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
70	LIVIA DE FREITAS SOUZA	\N	\N	\N	2015-09-20	(19) 99136-0046	f	13050522	Rua Irídio	155	Vila Rica	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
73	ALDETE IZIDORO	\N	278.302.238-90	\N	1977-08-27	(19) 97162-5982	f	13060-012	Rua Umberto Vetoratto	124	Jardim Ipiranga	Campinas	SP	\N	Ativo	Hidroginástica 2x na semana	HIDROGINÁSTICA	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
266	VIVIANE CHIQUETO LIMA	\N	214.924.408-09	\N	1981-01-24	(19) 98818-0999	f	13060-113	Rua Ozorino Ribeiro de Melo	\N	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-25	Pendente	\N	\N	\N	\N	\N	\N	2026-02-25 14:43:21.411357
96	BENICIO DE OLIVEIRA GUIRALDI	\N	\N	\N	2022-06-12	(19) 99217-9381	f	13056005	Rua Izabel Lopes Ventura	485	Jardim Planalto de Viracopos	Campinas	SP	\N	Ativo	Natação bebê 	NATAÇÃO BEBES	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
185	BRAYAN MAXIMIANO OLIVEIRA	\N	393.841.438-39	\N	1995-12-06	(19) 97420-7075	f	13060-281	Rua Flor do Maracujá	375B	Jardim Nova Morada	Campinas	SP	\N	Ativo	["500"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
240	ALLANA SOFIA SANTOS DE OLIVEIRA	\N	\N	\N	2011-07-20	(19) 99276-7511	f	13060-049	Rua Scyllas Leite de Sampaio	67	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 2x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-07	Pendente	\N	\N	ANDRÉ LUIS DE OLIVEIRA	085.777.508-17	(19) 99276-7511	\N	2026-02-07 18:10:42.301167
71	NATAN ROSA DE OLIVEIRA	\N	\N	\N	2019-10-14	(19) 98837-9923	f	13060659	Rua Alberto Carlos Dupas Valin	\N	Vila Palácios	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
72	NEUSA APARECIDA PEREIRA DA SILVA	\N	795.538.081-9	\N	1964-01-10	(19) 99144-4204	f	13059192	Rua Vera Lúcia Tognolo Aggio	64	Residencial Sírius	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
113	CECILIA APARECIDA FERRETI SOUZA	\N	154.678.188-89	\N	1968-06-29	(19) 99691-4602	f	13060-410	Rua Michael Robert Kaan	377	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["511"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
110	MARIA HELENA VITOR PINTO	\N	\N	\N	1948-08-17	19994299714	f	13060330	RUA ODETE DE CAMARGO S. V. CECARELLI	96	Jardim Roseira	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
97	LARISSA GONÇALVES DA SILVA	\N	071.637.405-65	\N	1993-10-19	(19) 99991-7672	f	13060112	Rua Francisco Bayardo	473	Jardim Novo Campos Elíseos	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
98	NILVA APARECIDA PAULINO	\N	068.913.728-10	\N	1963-07-18	(19) 98990-5603	f	13059001	Avenida Nelson Ferreira de Souza	350	Jardim Florence	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
102	VITORIA RAFAELA M RODRIGUES	\N	\N	\N	2018-03-08	(19) 98590-7561	f	13031680	Rua João Batista Alves de Souza	735	Parque Industrial	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
103	LUCIENE LUZIA DE JESUS	\N	033.912.674-45	\N	1979-05-10	(19) 99845-7936	f	13060112	Rua Francisco Bayardo	463	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
104	SELMA CRISTINA CANOVA	\N	172.042.818-29	\N	1969-02-14	(19) 99365-8363	f	13050814	Rua Antônio Pires Barbosa	116	Jardim Capivari	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
105	MARIA LUIZA  BARBOSA STECA	\N	\N	\N	2019-09-07	(19) 98771-8740	f	13060733	Rua Tito Augusto Alves de Araújo	121	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
106	LIDIANE RAFAELA BRAGA PRADO BIZARRI	\N	343.738.848-70	\N	1984-12-30	(19) 99315-3874	f	13060823	Rua Lysette Luz Regina Ferraz	34	Jardim Ipaussurama	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
107	SONIA MARINA DOS SANTOS	\N	015.868.098-73	\N	1959-11-12	(19) 99516-3027	f	13020110	Rua Doutor Antônio Álvares Lobo	432	Botafogo	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
108	DANIELLE RIBEIRO AZEVEDO PITARELLO	\N	\N	\N	1991-11-27	(19) 99957-9832	f	13050621	Rua Carlos Roberto Caetano de Souza	150	Conjunto Residencial Souza Queiroz	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
109	LEONARDO FERREIRA ALTES	\N	451.793.968-59	\N	1996-09-19	(19) 98999-6167	f	13061097	Rua Etelvina de Sales Alves	\N	Jardim García	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
111	REBECA ALVES DE JESUS	\N	\N	\N	2021-08-05	(19) 98707-5215	f	13059660	Rua Romeu Marinelli	780	Cidade Satélite Íris	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
112	LUCIA SANTOS NUNES	\N	\N	\N	2000-04-04	(19) 9 9105-153	f	13060-072	Rua Jornalista Ernesto Napoli	\N	Jardim Paulicéia	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
252	HEITOR SOUZA E SILVA	\N	\N	\N	2019-09-18	(19) 98833-6650	f	13058-515	Rua Benedito Cândido Ramos	150	Parque Valença I	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-18	Pendente	\N	\N	TAINÁ DA SILVA SOUZA	441.915.168-41	(19) 98833-6650	\N	2026-02-18 14:56:58.017804
297	HEBER RIFATE DE CARVALHO	\N	225.364.108-11	\N	1983-07-20	(19) 98383-7641	f	13060-480	Rua José Dobner	790	Jardim Santa Lúcia	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 2x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-03-10	Pendente	\N	\N	\N	\N	\N	\N	2026-03-10 12:54:19.584379
101	EDNALDA PINHEIRO DE ALMEIDA GARCIA	\N	271.334.338-00	\N	1976-12-20	(19) 99184-7261	f	13060254	Rua José Campos Filho	281	Jardim Londres	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
94	ENZO GABRIEL MACHADO PIRES	\N	\N	\N	2020-10-21	(19) 98365-0380	f	13052114	Rua Victório Pavan	\N	Jardim Morumbi	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
221	ENZO RAPHAEL SILVA FREDERICO	\N	\N	\N	2014-06-18	(19) 98877-2464	f	13060-870	Rua Niterói	190	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-04	Pendente	\N	\N	ANDREIA SILVA FREDERICO	261.186.164-10	(19) 98877-2464	\N	2026-02-04 13:13:34.066177
229	ENZO RIBEIRO DOS SANTOS	\N	\N	\N	2022-04-11	(19) 99611-3794	f	13060-860	Rua Doutor Sylvio Carvalhaes	910	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["496"]	["NATAÇÃO BEBES"]	2026-02-04	Pendente	\N	\N	MARCELA RIBEIRO DA SILVA	215.644.438-25	(19) 99611-3794	\N	2026-02-04 13:35:19.107306
74	HELOISA FREITAS ROCHA	\N	\N	\N	2022-05-28	(19) 97419-9799	f	13060314	Avenida Brasília	1156	Jardim Roseira	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
279	JOÃO PEDRO SCANAVACCA LOURENÇO	\N	\N	\N	2017-06-16	(19) 99170-8328	f	13060-378	Rua Florianópolis	171	Vila Perseu Leite de Barros	Campinas	SP	\N	Ativo	["500"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-27	Pendente	\N	\N	CLAUDIA REGINA SCANAVACCA LOURENÇO	302.909.418-16	(19) 99170-8328	\N	2026-02-27 13:49:55.536906
95	JÉSSICA ALVES MACHADO	\N	461.796.288-31	\N	1997-10-02	(19) 98365-0380	f	13052114	Rua Victório Pavan	\N	Jardim Morumbi	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
100	LARISSA GONÇALVES CRISTINA DA SILVA	\N	046.992.196-83	\N	1996-11-18	(19) 99152-3906	f	13050110	Rua João Mezalira	58	Jardim Santa Amália	Campinas	SP	\N	Ativo	["501"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
267	ENZO GABRIEL MATOS	\N	\N	\N	2014-07-08	(19) 98139-7672	f	13059-648	Rua Nivaldo Alves Bonilha	902	Cidade Satélite Íris	Campinas	SP	\N	Ativo	[]	NATAÇÃO INFANTIL E ADULTO	2026-02-25	Pendente	\N	\N	MARIA CONCEIÇÃO CARNEIRO	396.984.848-25	(19) 98139-7672	\N	2026-02-25 14:49:25.772117
234	WALTER BACHEGA JUNIOR	\N	053.231.078-04	\N	1965-04-16	(19) 97167-6691	f	13060-840	Avenida Márcio Egídio de Souza Aranha	409B	Jardim Ipaussurama	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 14:28:55.869083
298	MARTA MARIA PEREIRA LOPES	\N	270.397.328-40	\N	1956-01-22	(19) 99740-5648	f	13060-747	Rua William Faracini	71	Parque Residencial Vila União	Campinas	SP	\N	Ativo	["Hidroginástica 3ª idade 2x na semana"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-03-10	Pendente	\N	\N	\N	\N	\N	\N	2026-03-10 12:57:37.725966
99	ROBSON DE OLIVEIRA	\N	079.994.385-61	\N	1971-12-01	(19) 97423-2453	f	13050110	Rua João Mezalira	28	Jardim Santa Amália	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
114	RAFAEL ALCANTARA A. MEDEIROS	\N	365.700.498-01	\N	1989-01-03	(19) 98263-4941	f	13060-500	Rua Augusto de Moraes Carvalho	133	Jardim Santa Lúcia	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
241	VERBENHA PEREIRA RAMOS	\N	061.258.815-71	\N	1992-06-18	(19) 99330-1283	f	13053-205	Rua Alberto Francisco Nacarato	15	Jardim Marisa	Campinas	SP	\N	Inativo	[]	HIDROGINÁSTICA	2026-02-07	Pendente	\N	\N	\N	\N	\N	\N	2026-02-07 18:12:16.567935
116	RAFAEL MARIANO MILAGRES	\N	\N	\N	2015-03-16	\N	f	13060-048	Rua Ferreira Novo	197	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
118	RAFAEL NASCIMENTO DOS SANTOS	\N	\N	\N	1997-11-23	(19) 98132-5609	f	13061-096	Rua Alfredo Battibugli	\N	Jardim García	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
120	MARILDA ROMÃO	\N	252.375.068-60	\N	1976-07-23	(19) 98367-6303	f	13059-194	Rua Armando Pinareli	42	Residencial Sírius	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
123	MARIA LUIZA FACHIN	\N	465.845.718-07	\N	2001-10-25	(11) 97139-5173	f	13060-860	Rua Doutor Sylvio Carvalhaes	170	Jardim Campos Elíseos	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
141	MARIA DE LOURDES ALVES DA SILVA	\N	111.247.358-01	\N	1941-07-14	(19) 99814-5422	f	13060-737	Rua Marcelo Ferreira Albieri	256	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
145	MARIA EDUARDA VALADÃO RAMOS	\N	\N	\N	2023-09-21	(19) 99200-6669	f	13050-763	Rua Raphael Camizão	190	Parque Ipiranga	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
181	OTAVIO MAGALHÃES MIRANDA	\N	084.603.928-13	\N	1964-10-27	(19) 98124-8940	f	13058-580	Rua Otto Lara Resende	100	Parque Valença II	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
183	ROBERTA DANIELLE CORREA DOS SANTOS	\N	399.337.938-10	\N	1996-01-17	(19) 98150-4236	f	13060-515	Rua Santa Maria Madalena Postel	135	Jardim Santa Lúcia	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
180	ARISTOTELES BISPO MATEUS	\N	005.644.938-05	\N	1955-05-28	(79) 99650-0226	f	13060-414	Rua Adolpho Guimarães Barros	414	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	Hidroginástica 3ª idade 1x na semana	HIDROGINÁSTICA 3ª IDADE	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
253	MARIAH SOUZA RODRIGUES	\N	\N	\N	2017-07-24	(19) 99438-3661	f	13060-777	Rua Daniel Andrade Stragliotto	242	Parque Residencial Vila União	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-18	Pendente	\N	\N	ALINE ROBERTA DE SOUZA	321.789.578-97	(19) 99438-3661	\N	2026-02-18 14:58:50.700127
121	ALEXANDRE PESTANA	\N	\N	\N	2019-03-13	(19) 99512-5259	f	13059-848	Avenida Deputado Luís Eduardo Magalhães	543	Jardim Uruguai	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
127	ALICE MIRELLA MONTEIRO	\N	\N	\N	2018-05-05	(19) 98916-1577	f	13058-488	Rua Che Guevara	71	Jardim Nova Esperança	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
143	ARUNA MOREA SILVA SANTOS	\N	\N	\N	2025-12-26	(19) 98115-1915	f	13060-858	Avenida Presidente Juscelino	1290	Jardim Campos Elíseos	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
117	BRUNA DIAS ARAUJO	\N	463.474.858-42	\N	2000-06-20	\N	f	13060-735	Rua Euclides Arruda de Almeida	195	Parque Residencial Vila União	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
309	MARLI SILVA DE AVILA	\N	276.269.178-80	\N	1965-08-26	(19) 99506-8236	f	13060-325	Rua Doutor Antônio Sylvio Cunha Bueno	184	Jardim Roseira	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-03-11	Pendente	\N	\N	\N	\N	\N	\N	2026-03-11 13:56:33.525521
230	ELOAH VITORIA SILVA SANCHES	\N	\N	\N	2021-07-11	(19) 98847-1382	f	13059-107	Rua Antonio Carlos do Amaral	3905	Residencial Cosmos	Campinas	SP	\N	Ativo	["496"]	["NATAÇÃO BEBES"]	2026-02-04	Pendente	\N	\N	THALITA SILVA DE OLIVEIRA SANCHES	312.125.988-14	(19) 98847-1382	\N	2026-02-04 13:39:54.692339
126	EMANUELLE ROCHA 	\N	\N	\N	2021-01-15	(19) 97405-1677	f	13040-725	Rua Visconde de Congonhas do Campo	1161	Loteamento Parque São Martinho	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
122	GUSTAVO DA SILVA CAMPOS	\N	\N	\N	2016-01-10	(19) 99331-4463	f	13056-524	Rua Leonor Santos	80	Jardim Vista Alegre	Campinas	SP	\N	Ativo	["531"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
184	GUSTAVO PRATES DOS SANTOS	\N	403.066.988-38	\N	1994-09-13	(19) 99988-7477	f	13060-515	Rua Santa Maria Madalena Postel	135	Jardim Santa Lúcia	Campinas	SP	\N	Ativo	["530"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
119	HEITOR DE OLIVEIRA NASCIMENTO	\N	\N	\N	2019-04-13	(19) 97415-8836	f	13059-641	Rua Chrispim Gomes	518	Cidade Satélite Íris	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
124	HEITOR TOBIAS	\N	\N	\N	2020-10-15	(19) 99173-2206	f	13060-779	Rua João Cavoto	208	Parque Residencial Vila União	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
182	HELENA GONÇALVES OLIVEIRA	\N	470.629.325-15	\N	1973-04-08	(19) 98124-8940	f	13058-580	Rua Otto Lara Resende	100	Parque Valença II	Campinas	SP	\N	Ativo	["500"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
115	HELENA MARIA COSTA	\N	061.916.898-61	\N	0001-01-01	(19) 98451-9838	f	13060-008	Rua Antônio Menito	256	Jardim Anchieta	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
125	IAN ROCHA PEREIRA	\N	440.662.828-22	\N	1996-06-06	(19) 97419-0797	f	13060-854	Rua Sílvio Rizzardo	400	Jardim Campos Elíseos	Campinas	SP	\N	Inativo	["535"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
280	IZABELA FERRETTI DE SOUZA	\N	469.948.958-31	\N	1996-09-24	(19) 99449-5335	f	13060-410	Rua Michael Robert Kaan	377	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["533"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 13:55:08.203595
129	JANAINA ALVES PASTORA	\N	095.879.124-46	\N	1992-08-04	(19) 98982-4823	f	13060-152	Rua Cícero de Oliveira Silva	\N	Jardim Novo Campos Elíseos	Campinas	SP	\N	Inativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
128	JULIA SCHOBA ROMANO	\N	\N	\N	2021-02-28	(19) 98848-8300	f	13060-726	Rua Paulo Vianna de Souza	1070	Parque Residencial Vila União	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
142	LARISSA GOULART CAVALLARI	\N	431.373.658-13	\N	1998-03-02	(19) 98104-0735	f	13060-392	Rua Goiânia	117	Vila Perseu Leite de Barros	Campinas	SP	\N	Ativo	["530"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
139	ISABELLA DOS SANTOS NUNES	\N	424.930.638-05	\N	2021-02-16	(19) 98194-2303	f	13050-814	Rua Antônio Pires Barbosa	15	Jardim Capivari	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
242	VERA CRISTINA PEREIRA MARTINS	\N	305.101.698-56	\N	1976-03-26	(19) 98611-2626	f	13053-205	Rua Alberto Francisco Nacarato	22	Jardim Marisa	Campinas	SP	\N	Inativo	[]	HIDROGINÁSTICA	2026-02-07	Pendente	\N	\N	\N	\N	\N	\N	2026-02-07 18:13:25.118235
281	LUCAS DAMASIO MOREIRA	\N	\N	\N	2015-08-25	(19) 99436-3680	f	13060-053	Rua da Paz	95	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	[]	NATAÇÃO INFANTIL E ADULTO	2026-02-27	Pendente	\N	\N	ELAINE DE SOUZA DAMASIO	551.476.038-32	(19) 99436-3680	\N	2026-02-27 14:00:33.736311
130	THEO ORNELAS QUEIROZ SILVA	\N	\N	\N	2020-05-04	(19) 99371-0832	f	13050-006	Avenida Dom Joaquim Mamede da Silva Leite	40	Jardim do Lago	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
254	ANTONY FERREIRA RAMALHO RODRIGUES	\N	\N	\N	2024-07-23	(19) 99301-5620	f	13051-029	Rua Vânia Aparecida Dias	299	Jardim do Lago Continuação	Campinas	SP	\N	Ativo	["Natação bebê "]	["NATAÇÃO BEBES"]	2026-02-18	Pendente	\N	\N	VANESSA	448.823.318-2	(19) 99301-5620	\N	2026-02-18 15:00:54.372789
299	VALDIRENE BRONZE MANCHAS BENETI	\N	178.872.708-80	\N	1971-10-11	(19) 99704-2335	f	13060-322	Rua Odilon Monteiro Pompeu	16	Jardim Roseira	Campinas	SP	\N	Ativo	["Hidroginástica 1x na semana"]	["HIDROGINÁSTICA"]	2026-03-10	Pendente	\N	\N	\N	\N	\N	\N	2026-03-10 13:00:04.68929
131	ROSANGELA DE GODOY	\N	967.012.858-72	\N	1958-11-15	(19) 98817-9202	f	13050-462	Rua Lutécia	105	Vila Pompéia	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
133	BRAYAN HENRIQUE GOMES INACIO	\N	\N	\N	2024-07-04	(19) 99573-9896	f	13050-520	Rua Antimônio	38	Vila Rica	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
134	MARIA APARECIDA ALEXANDRINO SILVA	\N	961.761.308-59	\N	1956-09-27	(19) 98199-6418	f	13060-034	Rua Wilson Capellini	43	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
135	MARIA DE FATIMA ZACARIAS DA SILVA	\N	716.659.944-87	\N	1969-06-17	(19) 98954-8215	f	13060-471	Rua Rafful Antônio Kanawati	187	Jardim Santa Lúcia	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
136	MARIA LUIZA SALLA	\N	489.451.368-80	\N	2009-03-08	(19) 99265-9710	f	13060-243	Rua Rodolpho Liner	95	Jardim Londres	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
137	MIGUEL DO SANTOS CAMARGO	\N	\N	\N	2023-06-03	(19) 99643-7395	f	13060-860	Rua Doutor Sylvio Carvalhaes	758	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
138	ENZO GABRIEL SANTOS	\N	\N	\N	2019-04-05	(19) 98194-2303	f	13050-814	Rua Antônio Pires Barbosa	15	Jardim Capivari	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
310	JULIA MARIA FERREIRA DE OLIVEIRA	\N	320.615.808-74	\N	1959-05-05	(19) 99909-1794	f	13060-468	Rua Henrique Torres	434	Jardim Santa Lúcia	Campinas	SP	\N	Ativo	["542"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-03-11	Pendente	\N	\N	\N	\N	\N	\N	2026-03-11 13:57:46.364191
150	DANIELE FERREIRA DA SILVA	\N	412.714.938-88	\N	2000-03-23	(19) 98766-1209	f	13059-619	Rua Orlando Signorelli	170	Cidade Satélite Íris	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
140	HENRIQUE GABRIEL DE SOUZA SIMENES	\N	\N	\N	2021-02-01	(19) 99718-7490	f	13060-719	Rua Pedro Diogo	135	Parque Residencial Vila União	Campinas	SP	\N	Ativo	["528"]	["NATAÇÃO BEBES"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
223	IRACI CAMILO DOS SANTOS	\N	051.349.488-01	\N	1954-07-10	(19) 99143-9037	f	13033-100	Rua Maria Alves Campagnone	40	Jardim Aurélia	Campinas	SP	\N	Inativo	[]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 13:22:07.761346
144	ISABELA BRUNELLI DISTASSI	\N	\N	\N	2024-07-08	(19) 99308-5858	f	13050-050	Rua Dionísio Cazotti	617	Vila Mimosa	Campinas	SP	\N	Ativo	["496"]	["NATAÇÃO BEBES"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
132	ISIS VALENTINA GOULART DE CAMPOS HENRIQUE	\N	\N	\N	2023-11-30	(19) 98901-3172	f	13061-311	Rua Juriti	59	Vila Padre Manoel de Nóbrega	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
148	ZILDA OLIVEIRA MARTINEZ	\N	163.300.548-86	\N	1967-12-23	(19) 98124-6090	f	13060-701	Rua Professor Silvano Lopes Castro	\N	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
231	ISRAEL VIEIRA DE MORAES	\N	154.979.998-32	\N	1973-06-16	(19) 98141-1607	f	13059-646	Rua Doutor Dante Erbolato	2314	Cidade Satélite Íris	Campinas	SP	\N	Inativo	[]	["HIDROGINÁSTICA"]	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 13:41:19.300392
268	JOSÉ CARLOS PEREIRA	\N	273.990.658-70	\N	1951-08-13	(19) 99737-8453	f	13060-747	Rua William Faracini	144	Parque Residencial Vila União	Campinas	SP	\N	Ativo	["543"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-25	Pendente	\N	\N	\N	\N	\N	\N	2026-02-25 14:51:57.111362
149	VICTORIA PARDINHO CANCIO	\N	\N	\N	2020-05-28	(19) 99181-0119	f	13060-476	Rua da Padroeira	429	Jardim Santa Lúcia	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
282	MOISÉS SAMUEL DAGA	\N	\N	\N	2020-04-16	(19) 99143-1061	f	13040-550	Rua Peruíbe	285	Vila Campos Sales	Campinas	SP	\N	Ativo	[]	NATAÇÃO INFANTIL E ADULTO	2026-02-27	Pendente	\N	\N	ADRIELLE CRISTINA ALVES DAGA	431.128.588-40	(19) 99143-1061	\N	2026-02-27 14:06:37.929529
164	ARIETE PEREIRA ANDRÉ	\N	158.376.488-79	\N	1968-03-11	(19) 99348-3939	f	13051-105	Rua João Tonoli	235	Jardim das Bandeiras	Campinas	SP	\N	Ativo	Hidroginástica 3ª idade 2x na semana	HIDROGINÁSTICA 3ª IDADE	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
162	JOSEFA RODRIGUES SILVA DO NASCIMENTO	\N	092.687.718-61	\N	1949-06-06	(19) 99598-6981	f	13060-130	Rua Danilo Tavolaro	817	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
67	JOÃO NACHBAR BATISTA	\N	\N	\N	2019-01-23	(19) 99237-2998	f	13060043	Rua Professor Jairo Ramos	169	Jardim Campos Elíseos	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
255	BRENDA DE FREITAS SALES	\N	\N	\N	2019-02-05	(19) 98344-0698	f	13051-052	Avenida Vinte e Três	468	Jardim do Lago Continuação	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-18	Pendente	\N	\N	DEBORA DE FREITAS SALES	471.832.278-20	(19) 98344-0698	\N	2026-02-18 15:02:50.244858
269	ANNE MARGONARO GRANERO	\N	\N	\N	2019-05-28	(19) 99580-5757	f	13056-733	Rua José Dutra de Carvalho	315	Jardim Maria Helena	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-25	Pendente	\N	\N	ALEXANDRE / JESSICA MARGONARO GRANERO	388.760.028-20	(19) 99580-5757	\N	2026-02-25 14:54:57.29455
152	MARIA NAZARÉ DA SILVA	\N	158.376.488-79	\N	1947-12-23	(19) 99348-3939	f	13060-852	Rua Francisco Ferreira Pires	57	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
300	MIGUEL FERREIRA SANTOS	\N	\N	\N	2023-01-07	(19) 98311-4982	f	13050-020	Rua Reverendo Professor Herculano Gouveia Júnior	450	Jardim do Lago	Campinas	SP	\N	Ativo	["496"]	["NATAÇÃO BEBES"]	2026-03-10	Pendente	\N	\N	JULIAN ROBSON DE SOUZA SANTOS	423.584.858-25	(19) 98377-2316	\N	2026-03-10 13:02:11.767269
224	NEIDE CAMILO DE OLIVEIRA	\N	102.105.978-10	\N	1960-04-20	(19) 99261-5124	f	13033-100	Rua Maria Alves Campagnone	40	Jardim Aurélia	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA 3ª IDADE	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 13:23:03.211135
153	SEBASTIÃO BATISTA DE OLIVEIRA FILHO	\N	735.872.658-87	\N	1947-08-24	(19) 99214-5480	f	13050-543	Rua Mogi Mirim	26	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
154	MARIA JOSÉ RODRIGUES	\N	195.511.388-21	\N	1944-02-27	(19) 98801-0697	f	13060-077	Rua Sílvio Rizzardo	1381	Jardim Paulicéia	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
155	REGIANE DE SOUZA BUGATTI SANTOS	\N	217.109.618-08	\N	1980-05-25	(19) 99582-5623	f	13036-225	Avenida das Amoreiras	633	Parque Itália	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
157	MARIANE DA SILVA SANTOS	\N	453.827.618-92	\N	1996-03-20	(19) 98318-5342	f	13060-345	Rua Pastor Antonio Tiburtino da Silva	490	Jardim Ibirapuera	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
158	MEIRE SILVA COSTA OLIVEIRA	\N	320.551.818-74	\N	1947-07-08	(19) 99214-5480	f	13050-543	Rua Mogi Mirim	26	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
159	YASMIN TALENTINA DE MACEDO	\N	\N	\N	2024-01-18	(19) 99890-7819	f	13054-453	Rua Helena Camargo Pereira	131	Dic IV	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
160	MARIA ROCHA DA SILVA	\N	137.377.123-2	\N	1960-06-27	\N	f	13060-052	Rua União	75	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
156	ALICE BUENO	\N	\N	\N	2018-08-06	(19) 98228-5594	f	13060-024	Rua Conselheiro Antônio Carlos	1881	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
161	MARIA DE LOURDES BRITO	\N	283.973.038-39	\N	1956-01-31	(19) 98740-1080	f	13059-712	Rua Aguinaldo Lucas	641	Jardim São Judas Tadeu	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
163	CARMELUCE RODRIGUES SANTANA	\N	017.033.388-20	\N	1952-04-25	(19) 99287-2823	f	13058-224	Rua Maria Eunice Flausino Barbosa	349	Conjunto Residencial Parque São Bento	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
165	MARIA ALZENIR ALENCAR DA SILVA	\N	269.683.298-67	\N	1948-06-16	(19) 98194-2254	f	13059-704	Rua Diamantino Pereira	315	Jardim São Judas Tadeu	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
166	SANDRA MARIA PERA DE PAIVA	\N	119.228.718-50	\N	0001-01-01	(19) 98312-5661	f	13060-263	Caminho União	165	Jardim Nova Morada	Campinas	SP	\N	Inativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
186	CESAR LUCENA SILVA	\N	\N	\N	2024-05-08	(19) 99430-7879	f	13059-054	Rua Comendador João Guilhen Garcia	\N	Jardim Florence	Campinas	SP	\N	Ativo	["497"]	["NATAÇÃO BEBES"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
222	EDUARDA TOTOLI DE OLIVEIRA	\N	443.047.458-32	\N	2006-06-22	(19) 98258-5285	f	13060-703	Rua Professora Celeste Palandi de Melo	33	Parque Residencial Vila União	Campinas	SP	\N	Ativo	["520"]	["HIDROGINÁSTICA"]	2026-02-04	Pendente	\N	\N	\N	\N	\N	\N	2026-02-04 13:14:58.046956
243	FATIMA NEGRI ANDREO	\N	158.685.908-05	\N	1958-11-01	(19) 99347-7293	f	13050-411	Rua Joanópolis	154	Cidade Jardim	Campinas	SP	\N	Ativo	["508"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-02-07	Pendente	\N	\N	\N	\N	\N	\N	2026-02-07 18:14:43.499992
174	ADEMIR JOSÉ DA SILVA	\N	721.186.288-20	\N	1952-02-19	(19) 98168-4948	f	13060-530	Rua José Ramos Catarino	332	Parque Tropical	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 2x na semana	HIDROGINÁSTICA 3ª IDADE	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
301	ISIS RAMALHO DE OLIVEIRA	\N	\N	\N	2023-05-10	(19) 99408-3244	f	13060-067	Rua Mário Ribeiro do Amaral	225	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["529"]	["NATAÇÃO BEBES"]	2026-03-10	Pendente	\N	\N	KATIA RAMALHO DE OLIVEIRA	380.999.138-41	(19) 98908-4491	\N	2026-03-10 13:09:13.978109
173	ROMEU FARIA DOS SANTOS	\N	\N	\N	2023-04-28	(19) 99319-7081	f	13278-403	Rua Doutor João Mendes Junior	426	Vale do Itamaracá	Valinhos	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
168	CLODOALDO PURIFICAÇÃO SOUZA	\N	\N	\N	2018-04-23	(19) 97416-4222	f	13050-576	Rua Beatriz Pacheco Pompeo de Camargo	12	Jardim Novo Campos Elíseos	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
167	CRISTIANA ROCHA DE ALMEIDA	\N	282.195.558-58	\N	1980-03-16	(19) 9710-113	f	13060-562	Rua Alzira Marcondes	160	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	["533"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
170	MARCIA APARECIDA DOS SANTOS	\N	217.082.968-75	\N	1978-01-22	(19) 99530-0121	f	13057-501	Rua Salvador Salmora	05	Conjunto Habitacional Vida Nova	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
283	MARIA EUNICE DE S. ANJOS	\N	822.427.638-20	\N	1961-05-18	(19) 99383-4625	f	13060-701	Rua Professor Silvano Lopes Castro	\N	Parque Residencial Vila União	Campinas	SP	\N	Ativo	[]	HIDROGINÁSTICA	2026-02-27	Pendente	\N	\N	\N	\N	\N	\N	2026-02-27 14:11:28.26842
270	ENZO GUSTAVO MOREIRA	\N	\N	\N	2014-03-04	(19) 98157-8770	f	13060-573	Rua Professor Mauricio Knobel	277	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-25	Pendente	\N	\N	MARLENE FATIMA LIGERO	226.081.578-23	(19) 98157-8770	\N	2026-02-25 14:59:00.737343
169	FRANCELI FERREIRA LIMA	\N	273.387.408-14	\N	1973-05-26	(19) 98412-7905	f	13060-254	Rua José Campos Filho	242	Jardim Londres	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
172	ISIS SOUZA CHAVES	\N	\N	\N	2024-06-16	(19) 99102-4037	f	13054-371	Rua Itália Fausta	458	Parque Vista Alegre	Campinas	SP	\N	Ativo	["496"]	["NATAÇÃO BEBES"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
179	IVANICE SILVA MATEUS	\N	375.163.295-68	\N	1965-03-01	(79) 99650-0226	f	13060-414	Rua Adolpho Guimarães Barros	920	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["540"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
176	LORENZO PUNCINELLI BRAGA	\N	\N	\N	2018-05-12	(19) 98171-9425	f	13060-056	Rua Catarina	185	Jardim Campos Elíseos	Campinas	SP	\N	Ativo	["531"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
171	MARILCE BALTAZAR DOS SANTOS	\N	245.187.948-34	\N	1944-08-11	(19) 97412-9596	f	13030-500	Rua Doutor Pinto Ferraz	833	São Bernardo	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
175	MARIA APARECIDA FERREIRA DE SOUSA	\N	219.450.078-26	\N	1977-10-02	(19) 99336-9535	f	13059-619	Rua Orlando Signorelli	158	Cidade Satélite Íris	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
177	MARIA NAZARÉ FERREIRA DA SILVA	\N	158.422.648-03	\N	1948-05-31	(19) 99410-7335	f	13059-037	Rua Marcílio de Oliveira	841	Jardim Florence	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
178	MIGUEL GARCIA DALL OCA	\N	\N	\N	2020-06-10	(19) 99589-8475	f	13060-192	Avenida Ruy Rodriguez	643	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
191	ANA PAULA PAZINI DE AVILA	\N	457.211.748-97	\N	1998-12-23	(19) 98611-3993	f	13060-562	Rua Alzira Marcondes	160	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 2x na semana	NATAÇÃO INFANTIL E ADULTO	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
197	APARECIDA DE LOURDES VALENTE	\N	312.999.138-73	\N	1959-08-26	(19) 99283-8430	f	13060-151	Rua Arlindo Gomes	39	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 1x na semana	NATAÇÃO INFANTIL E ADULTO	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
271	EDUARDO ANDRADE LUCIANO	\N	\N	\N	2020-03-28	(19) 98119-4297	f	13070-115	Avenida Soldado Passarinho	8	Jardim Chapadão	Campinas	SP	\N	Ativo	["Natação Infantil e Adulto 1x na semana"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-25	Pendente	\N	\N	GLEICON DE SOUZA LUCIANO	099.039.616-93	(19) 98119-4297	\N	2026-02-25 18:05:09.309079
189	CAIO ANDRADE GONÇALVES DA SILVA	\N	423.374.778-19	\N	1995-06-09	(19) 99335-5693	f	13051-079	Rua Emerson da Silva Berton	411	Jardim do Lago Continuação	Campinas	SP	\N	Ativo	["500"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
195	GABRIELA DA SILVA DOS SANTOS	\N	453.148.418-51	\N	1998-02-01	(19) 98214-7000	f	13059-626	Rua Elpídio Nivoloni	626	Cidade Satélite Íris	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
192	HELENA MARIA RABELO	\N	082.127.138-57	\N	1963-04-28	(19) 99830-1195	f	13060-113	Rua Ozorino Ribeiro de Melo	457	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	["500"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
194	HILARY DAGNE DE OLIVEIRA	\N	526.124.958-94	\N	2002-09-03	(19) 98989-1468	f	13059-450	Ruela Tainha	193	Núcleo Residencial Princesa D'Oeste	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
284	LEONARDO MATOS DE SOUZA	\N	\N	\N	2021-01-16	(19) 8139-7672	f	13059-648	Rua Nivaldo Alves Bonilha	902	Cidade Satélite Íris	Campinas	SP	\N	Inativo	[]	["NATAÇÃO INFANTIL E ADULTO"]	2026-02-27	Pendente	\N	\N	MARIA CONCEIÇÃO CARNEIRO	396.984.818-25	(19) 98139-7672	\N	2026-02-27 14:13:36.571366
188	LEVI ELOU ALVARES	\N	\N	\N	2023-04-23	(16) 99727-9269	f	13060-567	Rua Onésimo Antonio Palombo	385	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	["529"]	["NATAÇÃO BEBES"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
187	NATIELI LIMA LEONCIO	\N	457.669.658-00	\N	1999-07-28	(19) 98344-1105	f	13059-698	Rua Olivaldo Roncolatto	186	Cidade Satélite Íris	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
190	YOHANNA LILIAN MENDES MALHEIROS	\N	\N	\N	2015-11-22	(19) 98412-3112	f	13060-714	Rua Hermantina Nucci Fabrício	151	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
193	MIRELLA DOS SANTOS	\N	\N	\N	2011-09-05	(19) 99942-0262	f	13059-603	Rua Doutor Lázaro Pinto Barroso	84	Cidade Satélite Íris	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
199	MATTEO NUNES GUIMARÃES	\N	\N	\N	2023-11-25	(19) 99545-7445	f	13060-564	Rua Antonio de Souza Lima	48	Residencial Parque da Fazenda	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
204	MARIA ATILIA BENEDITO DOS SANTOS	\N	\N	\N	1952-02-22	(19) 99384-3081	f	13059-647	Rua Doutor Mamed Hussein	1247	Cidade Satélite Íris	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
205	SILVELI TEREZINHA G. FARIA	\N	201.648.888-40	\N	1959-08-12	(19) 98119-3192	f	13051-125	Rua Manoel Militão de Melo	322	Jardim das Bandeiras	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
207	MARIA ANGELICA P. DA SILVA	\N	031.139.266-02	\N	1961-03-06	(19) 98457-6209	f	13060-150	Rua Cneo Pompeo de Camargo	1594	Jardim Novo Campos Elíseos	Campinas	SP	\N	Ativo	\N	\N	2026-03-03	Pendente	\N	\N	\N	\N	\N	\N	2026-03-03 13:20:16.793681
208	VICENTINA AUXILIADORA DA SILVA PEREIRA	\N	267.141.158-81	\N	1961-04-21	(19) 99411-2015	f	13061-150	Rua Professor Euclydes Vaz de Campos Filho	1656	Jardim García	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
213	LUIZ ANTONIO DOS SANTOS	\N	217.342.608-74	\N	1960-01-17	(19) 99883-2110	f	13060-702	Rua Célio dos Santos Ferreira	213	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
214	MARIA DO CARMO DAS NEVES OLIVEIRA	\N	174.046.658-05	\N	1963-05-14	(19) 99301-6055	f	13060-720	Rua Alzira Giacometti Girardi	69	Parque Residencial Vila União	Campinas	SP	\N	Ativo	\N	\N	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
212	ANDREIA CRISTINA DE FARIA	\N	148.793.728-89	\N	1971-07-20	(19) 99124-3167	f	13061-900	Rua Albatroz	65	Vila Padre Manoel de Nóbrega	Campinas	SP	\N	Ativo	Natação Infantil e Adulto 1x na semana	NATAÇÃO INFANTIL E ADULTO	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
203	EDNA FORTUNATO DE SOUZA	\N	217.482.578-38	\N	1954-10-14	(19) 99117-5340	f	13060-534	Rua José Faccioni	390	Parque Tropical	Campinas	SP	\N	Ativo	["508"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
201	FABIO FERREIRA DA SILVA	\N	\N	\N	2013-08-08	(19) 98324-8876	f	13059-647	Rua Doutor Mamed Hussein	1027	Cidade Satélite Íris	Campinas	SP	\N	Ativo	["500"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
200	GENY BOSA GOMES	\N	002.035.788-56	\N	1959-02-13	(19) 99123-0863	f	13054-109	Rua Jurura	443	Vila Aeroporto	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
198	HARRISON HENRIQUE CORREIA DA SILVA	\N	452.700.938-98	\N	1996-03-05	(19) 98309-8695	f	13059-028	Rua Doutora Libia Hermisa Grandinetti Tortina	495	Jardim Florence	Campinas	SP	\N	Ativo	["498"]	["NATAÇÃO INFANTIL E ADULTO"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
211	HELOISA LOPES LODDO	\N	\N	\N	2018-10-04	(19) 97414-4439	f	13060-058	Rua Orlando Silva	29	Jardim Campos Elíseos	Campinas	SP	\N	Inativo	[]	[]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
210	IDELVINA SIMONETTO	\N	078.761.141-72	\N	1952-01-20	(19) 98360-5729	f	13060-534	Rua José Faccioni	226	Parque Tropical	Campinas	SP	\N	Ativo	["542"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
206	ISAEL FARIA	\N	825.552.068-68	\N	1958-05-09	(19) 98119-3192	f	13051-125	Rua Manoel Militão de Melo	322	Jardim das Bandeiras	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
209	LAIR DE OLIVEIRA DE PAULA	\N	280.122.628-94	\N	1945-07-25	(19) 3269-3049	f	13060-372	Rua Maceió	41	Vila Perseu Leite de Barros	Campinas	SP	\N	Ativo	["510"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
202	LAURENTINO DOS SANTOS	\N	774.762.398-49	\N	1953-09-20	(19) 98855-0669	f	13050-434	Rua Reverendo Constâncio Homero Omegna	637	Cidade Jardim	Campinas	SP	\N	Ativo	["513"]	["HIDROGINÁSTICA 3ª IDADE"]	2026-01-24	Pendente	\N	\N	\N	\N	\N	\N	2026-01-24 14:21:33.892151
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, description, type, category, amount, date, due_date, status, related_entity) FROM stdin;
1bfb0bed-6b07-4433-9ec9-5892a3f0b89e	ÁGUA	EXPENSE	OTHER	651.25	2026-02-06	2026-01-26	LATE	SANASA
4aa0769e-ca37-4361-a2ca-ab8de7bebeb4	ÁGUA	EXPENSE	OTHER	1266.46	2026-02-06	2026-02-25	PENDING	SANASA
f3acc359-84c9-45c8-8b7c-8fff33f02059	ÁGUA	EXPENSE	OTHER	714.04	2026-02-06	2025-12-24	LATE	SANASA
d324ea26-7a2f-4616-93d9-1cc715f08eca	Mensalidade 2/2026 - CARMELUCE RODRIGUES SANTANA	INCOME	TUITION	128.70	2026-02-06	2026-02-02	PAID	CARMELUCE RODRIGUES SANTANA
e73545f1-215f-4340-b9fe-8a586d8b9997	Mensalidade 2/2026 - ADEMIR JOSÉ DA SILVA	INCOME	TUITION	193.60	2026-02-19	2026-02-10	PAID	ADEMIR JOSÉ DA SILVA
dde7d71c-cc05-486d-a967-5dbeff3c8f61	Mensalidade 3/2026 - ALDETE IZIDORO	INCOME	TUITION	178.20	2026-03-11	2026-02-10	PAID	ALDETE IZIDORO
a2b980c8-4b38-4277-9508-5a93971d0c2b	Mensalidade 3/2026 - ADEMIR JOSÉ DA SILVA	INCOME	TUITION	193.60	2026-03-11	2026-03-09	PAID	ADEMIR JOSÉ DA SILVA
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, avatar) FROM stdin;
1	Rafael (Desenvolvedor)	tecnorafa12@gmail.com	Rafa2533	DEV	https://ui-avatars.com/api/?name=Rafael&background=6366f1&color=fff
2	Ferdinando (Gerente)	hidro@hidroeftness.com.br	ferdinando25	MANAGER	https://ui-avatars.com/api/?name=Ferdinando&background=0d9488&color=fff
\.


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.classes_id_seq', 1, false);


--
-- Name: modalities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modalities_id_seq', 19, true);


--
-- Name: plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plans_id_seq', 567, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 315, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: modalities modalities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modalities
    ADD CONSTRAINT modalities_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: student_documents student_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_documents
    ADD CONSTRAINT student_documents_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: classes classes_modality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_modality_id_fkey FOREIGN KEY (modality_id) REFERENCES public.modalities(id);


--
-- Name: plans plans_modality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_modality_id_fkey FOREIGN KEY (modality_id) REFERENCES public.modalities(id);


--
-- Name: student_documents student_documents_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_documents
    ADD CONSTRAINT student_documents_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict eYtzkS6CVbJTiWJzrWWwNBgs28Bf6iZDu3WbWIBMQZBuiqW8oSQeBOVkmzFOOz0



-- ============================================================
-- CORRECOES DE DADOS RECUPERADOS - 2026-03-20
-- Planos: IDs resolvidos para nomes + dados recuperados de backups
-- Responsaveis: recuperados do sistema anterior
-- ============================================================

UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 302; -- MATEUS LUIS DA SILVA STOCHE
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 3x na semana"]' WHERE id = 259; -- CONCEIÇÃO APARECIDA FERNANDES JERONIMO
UPDATE students SET plan_name = '["Natação bebê "]' WHERE id = 311; -- AUGUSTO DAHER DO AMARAL
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 246; -- KARINA DE ABREU MONTEIRO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 312; -- ELOÁ CAROLINE RODRIGUES DE OLIVEIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 28; -- ANA JULIA MESSIAS DO NASCIMENTO SANTOS
UPDATE students SET guardian_name = 'CLAUDIA REGINA STHEPAN SILVA', guardian_cpf = '306.944.398-27', guardian_phone = '(19) 97415-1341' WHERE id = 27; -- LUCAS STEPHAN SILVA
UPDATE students SET guardian_name = 'Wesley Araujo', guardian_phone = '(19) 99158-6070' WHERE id = 14; -- BEATRIZ RODRIGUES ARAUJO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 303; -- GIOVANA MAMED TREVISAN
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 3x na semana"]' WHERE id = 274; -- DALVA PINTO
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 151; -- IVANIR FERREIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 216; -- JOÃO PEDRO DA SILVA BASSAN
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 313; -- RAYSSA RODRIGUES MADUREIRA
UPDATE students SET guardian_name = 'Watson Pereira de Oliveira Cardoso/Tatiane de Oliveira Cardoso', guardian_cpf = '338.752.548-64', guardian_phone = '(19) 99474-1974' WHERE id = 30; -- ARTHUR PEREIRA DE OLIVEIRA CARDOSO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 304; -- LORENA HIRATA DA SILVA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 29; -- CRISTIANA MESSIAS DO NASCIMENTO
UPDATE students SET plan_name = '["Natação bebê "]' WHERE id = 314; -- DAVI ARAGAN
UPDATE students SET plan_name = '["Natação bebê "]' WHERE id = 305; -- MARIANA MONTEIRO OLIVEIRA
UPDATE students SET guardian_name = 'Natalia Cristina de Oliveira', guardian_cpf = '467.095.668-03', guardian_phone = '(19) 99138-7811' WHERE id = 40; -- BENJAMIN PRINCE OLIVEIRA DIAS
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 288; -- EDNA SILVA PERES
UPDATE students SET guardian_name = 'Janaina Teofilo', guardian_cpf = '390.026.098-25', guardian_phone = '(19) 98894-1478' WHERE id = 41; -- BELLA TEOFILO RIBEIRO
UPDATE students SET guardian_name = 'Vanessa Rosa de Souza', guardian_cpf = '438.222.722-00', guardian_phone = '(19) 98978-8175' WHERE id = 50; -- ARTHUR DE SOUZA PAULO
UPDATE students SET plan_name = '["ZUMBA"]' WHERE id = 33; -- ELAINE CRISTINA LUPI CHIOTTI
UPDATE students SET guardian_name = 'JESSICA MARTINS FERNANDES', guardian_cpf = '351.915.878-71', guardian_phone = '(19) 99506-4022' WHERE id = 35; -- MATHEUS HENRIQUE F. MARTINS
UPDATE students SET guardian_name = 'Fabiana Barbosa Lins', guardian_cpf = '413.264.298-41', guardian_phone = '(19) 99217-9381' WHERE id = 39; -- BENJAMIN LINS NORONHA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]', guardian_name = 'ANDREZA DE SOUZA MATHIAS', guardian_cpf = '328.054.538-24', guardian_phone = '(19) 98838-9030' WHERE id = 53; -- GABRIELA DE SOUZA MATHIAS
UPDATE students SET plan_name = '["Hidroginástica 2x na semana"]' WHERE id = 47; -- GRACELI ALVES DE ARRUDA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 36; -- JULIA FERNANDES DE SOUZA
UPDATE students SET guardian_name = 'DANIELA SILVA VIAN', guardian_cpf = '365.572.948-06', guardian_phone = '(19) 99195-9198' WHERE id = 44; -- MATHEUS VIAN BRAZ
UPDATE students SET guardian_name = 'ANDRE JOSE DE BRITO', guardian_cpf = '256.955.828-14', guardian_phone = '(19) 99162-4560' WHERE id = 46; -- VINICIUS JOSE DE BRITO
UPDATE students SET guardian_name = 'VANESSA ROSA DE SOUZA', guardian_cpf = '320.652.958-13', guardian_phone = '(19) 98978-8175' WHERE id = 49; -- SOPHIA DE SOUZA PAULO
UPDATE students SET guardian_name = 'MAYRA C. DE ARARUNA', guardian_cpf = '489.974.868-02', guardian_phone = '(19) 98955-9431' WHERE id = 52; -- THEO DA SILVA ARARUNA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 4x na semana"]' WHERE id = 42; -- INGRID BUGATTI ROCHA PEREIRA
UPDATE students SET guardian_name = 'BRUNA DE SOUZA CARVALHO', guardian_cpf = '325.987.828-95', guardian_phone = '(19) 99137-1855' WHERE id = 45; -- JOAQUIM EMANUEL DE SOUZA CARVALHO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 315; -- ANA CLARA NEVES BERTI
UPDATE students SET guardian_name = 'MARCELA GIOVANA MAGALHÃES ROCHA', guardian_cpf = '493.455.818-71', guardian_phone = '(19) 99505-7900' WHERE id = 17; -- LUARA MAGALHÃES ROCHA FERREIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]', guardian_name = 'DAYANE', guardian_cpf = '363.842.948-26', guardian_phone = '(19) 99166-4495' WHERE id = 21; -- HEITOR LUIZ MOREIRA
UPDATE students SET guardian_name = 'RENATA CRISTINE S. FERREIRA', guardian_cpf = '426.065.698-81', guardian_phone = '(19) 97416-8311' WHERE id = 19; -- MATHEO DE JESUS SILVA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 22; -- HERMINIA SABINO
UPDATE students SET plan_name = '["Natação bebê"]' WHERE id = 306; -- HELENA DE ALMEIDA FERREIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]', guardian_name = 'Dayane', guardian_cpf = '363.842.948-26', guardian_phone = '(19) 99166-4495' WHERE id = 20; -- ARTHUR LUIZ MOREIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 218; -- BRAYNO RODRIGUES DE SOUZA
UPDATE students SET guardian_name = 'DIOGO COSSU', guardian_cpf = '348.369.138-57', guardian_phone = '(19) 99525-0038' WHERE id = 26; -- NICOLAS COSSU
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 249; -- CUSTODIO LOPES MOURA
UPDATE students SET guardian_name = 'MARTA REGINA PRADO', guardian_phone = '(19) 98733-4749' WHERE id = 25; -- DIOGO RIBEIRO DO PRADO
UPDATE students SET plan_name = '["Hidroginástica 2x na semana"]' WHERE id = 18; -- EDVALDA GISELE P.S. CAPURSSI
UPDATE students SET guardian_name = 'FABIANA RABELO DE ASSIS', guardian_cpf = '011.982.845-60', guardian_phone = '(11) 95833-3604' WHERE id = 57; -- MARIA ANTONELA RABELO BEZERRA DE SOUZA
UPDATE students SET plan_name = '["Hidroginástica 2x na semana"]' WHERE id = 56; -- FABIANA NASCIMENTO DA SILVA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 226; -- GENI DE ALMEIDA SILVA
UPDATE students SET guardian_name = 'Sirlei Modesto', guardian_cpf = '256.264.368-20', guardian_phone = '(19) 99133-4993' WHERE id = 11; -- MILENA MODESTO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]', guardian_name = 'Jaqueline Duarte Silva', guardian_cpf = '397.357.778-19', guardian_phone = '(19) 98602-1705' WHERE id = 6; -- EMANUELLY DUARTE SILVA TERRITO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 264; -- ENZO FELIPE AMORIM COSTA
UPDATE students SET guardian_name = 'Jessica Dionisio de Macedo Firmino', guardian_cpf = '444.444.888-16', guardian_phone = '(19) 99598-0301' WHERE id = 4; -- MAITE DIONIZIO DELLA COSTA
UPDATE students SET plan_name = '["Hidroginástica 2x na semana"]' WHERE id = 307; -- ANA CLAUDIA FIRMINO DE CAMPOS
UPDATE students SET plan_name = '["Hidroginástica 2x na semana"]' WHERE id = 12; -- APARECIDA CELIA ALVES
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 227; -- LIVIA GABRIELLE FELICIANO
UPDATE students SET guardian_name = 'Suellen Martins Coimbra', guardian_cpf = '442.168.638-76', guardian_phone = '(19) 98278-9610' WHERE id = 9; -- BEATRIZ MARTINS MANGIA COIMBRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 61; -- CAIO DA SILVA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 278; -- JEOVÁ DOS REIS RODRIGUES
UPDATE students SET plan_name = '["Natação bebê"]' WHERE id = 3; -- DAVI GABRIEL POSSANI OLIVEIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 238; -- DAVI HENRIQUE PEREIRA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 13; -- JUSSARA APARECIDA GONÇALVES
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]', guardian_name = 'SELMA APARECIDA ALVES DE GODOI', guardian_cpf = '264.234.478-96', guardian_phone = '(19) 98190-0653' WHERE id = 62; -- LAURA GODOI GALHARDO NASCIMENTO
UPDATE students SET guardian_name = 'LUCIA ARAGÃO DE LIMA', guardian_cpf = '137.510.688-05', guardian_phone = '(19) 99685-5727' WHERE id = 58; -- MURILO DE LIMA SOFA
UPDATE students SET guardian_name = 'Risoneide Soares Andreo', guardian_cpf = '113.944.764-50', guardian_phone = '(19) 97153-8181' WHERE id = 90; -- BERNARDO SOARES ANDREO
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 3x na semana"]' WHERE id = 265; -- APARECIDA FELIZATTI OLIVATO
UPDATE students SET guardian_name = 'RODRIGO LANA', guardian_cpf = '039.303.286-82', guardian_phone = '(19) 97159-0331' WHERE id = 64; -- LUIZA GOMIDE LANA
UPDATE students SET guardian_name = 'JESSICA ALVES VIEIRA', guardian_cpf = '447.466.188-53', guardian_phone = '(19) 98190-7320' WHERE id = 77; -- LUIZA ALVES VIEIRA
UPDATE students SET guardian_name = 'CARLA ROBERTA APOLINARIO', guardian_cpf = '342.244.268-54', guardian_phone = '(19) 98609-5620' WHERE id = 78; -- MILENA APOLINARIO BUENO
UPDATE students SET guardian_name = 'TAIS DANTAS DOS SANTOS', guardian_cpf = '498.546.488-00', guardian_phone = '(19) 99498-9855' WHERE id = 80; -- PIETRO LORENZO DANTAS DOS SANTOS
UPDATE students SET guardian_name = 'ANA EDS', guardian_cpf = '436.321.305-58', guardian_phone = '(19) 99498-9855' WHERE id = 81; -- LUCAS SANTOS VIANA
UPDATE students SET guardian_name = 'CINTIA DAS DORES MARTA SILVA', guardian_cpf = '078.087.456-00', guardian_phone = '(19) 98815-5109' WHERE id = 92; -- MARIAHA MARTA DE PAULA SILVA
UPDATE students SET guardian_name = 'CINTIA DAS DORES MARTA SILVA', guardian_cpf = '078.087.456-00', guardian_phone = '(19) 98815-5109' WHERE id = 93; -- SARAH MARTA DE PAULA SILVA
UPDATE students SET plan_name = '["Natação bebê"]' WHERE id = 308; -- LUAN EMANUEL PINTO PEREIRA
UPDATE students SET guardian_name = 'JHONATAN ROCHA', guardian_cpf = '374.400.858-41', guardian_phone = '(19) 97419-9799' WHERE id = 75; -- CECILIA FREITAS ROCHA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 66; -- ELIZABETH FRANCISCA DE OLIVEIRA CASTRO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 3x na semana"]' WHERE id = 228; -- EMANOELLY LARISSA OLIVEIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]', guardian_name = 'MICHELLE ARARUNA FELIPE NUNES', guardian_cpf = '913.901.923-34', guardian_phone = '(19) 98829-8633' WHERE id = 88; -- ESTER ARARUNA NUNES
UPDATE students SET guardian_name = 'RONE SAMUEL ROQUE', guardian_cpf = '457.531.258-40', guardian_phone = '(19) 99598-6488' WHERE id = 63; -- HELOISE RAPELA PIGA ROQUE
UPDATE students SET guardian_name = 'TAMARA REGINA BLEY PENIDO', guardian_cpf = '379.767.818-55', guardian_phone = '(19) 98829-8633' WHERE id = 91; -- LEONARDO BLEY PENIDO
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 3x na semana"]' WHERE id = 68; -- LIDIA ALVES BUENO
UPDATE students SET guardian_name = 'ANA LUIZA DE FREITAS SOUZA', guardian_cpf = '497.367.848-19', guardian_phone = '(19) 99136-0046' WHERE id = 70; -- LIVIA DE FREITAS SOUZA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 185; -- BRAYAN MAXIMIANO OLIVEIRA
UPDATE students SET guardian_name = 'SHIRLEY CRISTINA ROSA DA SILVA', guardian_cpf = '223.716.048-10', guardian_phone = '(19) 98837-9923' WHERE id = 71; -- NATAN ROSA DE OLIVEIRA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 113; -- CECILIA APARECIDA FERRETI SOUZA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 110; -- MARIA HELENA VITOR PINTO
UPDATE students SET guardian_name = 'IRLANE', guardian_phone = '(19) 98590-7561' WHERE id = 102; -- VITORIA RAFAELA M RODRIGUES
UPDATE students SET guardian_name = 'MILENA BARBOSA / ADRIANO STECA', guardian_cpf = '387.446.468-79', guardian_phone = '(19) 98771-8740' WHERE id = 105; -- MARIA LUIZA  BARBOSA STECA
UPDATE students SET guardian_name = 'KELLY', guardian_cpf = '374.928.998-07', guardian_phone = '(19) 98707-5215' WHERE id = 111; -- REBECA ALVES DE JESUS
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]', guardian_name = 'JESSICA ALVES MACHADO', guardian_cpf = '461.796.288-31', guardian_phone = '(19) 98365-0380' WHERE id = 94; -- ENZO GABRIEL MACHADO PIRES
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 221; -- ENZO RAPHAEL SILVA FREDERICO
UPDATE students SET plan_name = '["Natação bebê "]' WHERE id = 229; -- ENZO RIBEIRO DOS SANTOS
UPDATE students SET guardian_name = 'JHONATAN ROCHA', guardian_cpf = '374.400.858-41', guardian_phone = '(19) 97419-9799' WHERE id = 74; -- HELOISA FREITAS ROCHA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 279; -- JOÃO PEDRO SCANAVACCA LOURENÇO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 95; -- JÉSSICA ALVES MACHADO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 100; -- LARISSA GONÇALVES CRISTINA DA SILVA
UPDATE students SET guardian_name = 'SUELI DE FATIMA TEIXEIRA  MILAGRES', guardian_cpf = '076.408.136-54' WHERE id = 116; -- RAFAEL MARIANO MILAGRES
UPDATE students SET guardian_name = 'DANIELA EDUARDA VALADÃO RAMOS', guardian_cpf = '022.973.601-77', guardian_phone = '(19) 99200-6669' WHERE id = 145; -- MARIA EDUARDA VALADÃO RAMOS
UPDATE students SET guardian_name = 'DAIANE M. DA SILVA PESTANA', guardian_cpf = '417.293.328-97', guardian_phone = '(19) 99512-5259' WHERE id = 121; -- ALEXANDRE PESTANA
UPDATE students SET guardian_name = 'LUCILEIDE LIMA MONTEIRO', guardian_cpf = '306.702.038-31', guardian_phone = '(19) 98916-1577' WHERE id = 127; -- ALICE MIRELLA MONTEIRO
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 309; -- MARLI SILVA DE AVILA
UPDATE students SET plan_name = '["Natação bebê "]' WHERE id = 230; -- ELOAH VITORIA SILVA SANCHES
UPDATE students SET guardian_name = 'ELIANE PATRICIA ROCHA', guardian_cpf = '220.504.458-30', guardian_phone = '(19) 97405-1677' WHERE id = 126; -- EMANUELLE ROCHA 
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 122; -- GUSTAVO DA SILVA CAMPOS
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 184; -- GUSTAVO PRATES DOS SANTOS
UPDATE students SET guardian_name = 'BRENDA ALVES DE OLIVEIRA VIANA', guardian_cpf = '437.752.438-01', guardian_phone = '(19) 97415-8836' WHERE id = 119; -- HEITOR DE OLIVEIRA NASCIMENTO
UPDATE students SET guardian_name = 'FELIPE TOBIAS S. FREITAS', guardian_cpf = '397.567.768-62', guardian_phone = '(19) 99173-2206' WHERE id = 124; -- HEITOR TOBIAS
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 182; -- HELENA GONÇALVES OLIVEIRA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 115; -- HELENA MARIA COSTA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 3x na semana"]' WHERE id = 125; -- IAN ROCHA PEREIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 280; -- IZABELA FERRETTI DE SOUZA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 129; -- JANAINA ALVES PASTORA
UPDATE students SET guardian_name = 'DINA REGIANE ROMANO GOMES', guardian_cpf = '218.616.308-08', guardian_phone = '(19) 98848-8300' WHERE id = 128; -- JULIA SCHOBA ROMANO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 142; -- LARISSA GOULART CAVALLARI
UPDATE students SET guardian_name = 'LEIA NUNES DOS SANTOS', guardian_cpf = '424.930.638-05', guardian_phone = '(19) 98194-2303' WHERE id = 139; -- ISABELLA DOS SANTOS NUNES
UPDATE students SET guardian_name = 'CRISTIANE ORNELAS QUEIROZ', guardian_cpf = '355.533.238-43', guardian_phone = '(19) 99371-0832' WHERE id = 130; -- THEO ORNELAS QUEIROZ SILVA
UPDATE students SET guardian_name = 'ERICK FERNANDO INACIO', guardian_cpf = '382.131.988-75', guardian_phone = '(19) 99573-9896' WHERE id = 133; -- BRAYAN HENRIQUE GOMES INACIO
UPDATE students SET guardian_name = 'VIVIANE APARECIDA FRACARO SALLA', guardian_cpf = '489.451.368-80', guardian_phone = '(19) 99265-9710' WHERE id = 136; -- MARIA LUIZA SALLA
UPDATE students SET guardian_name = 'IVAN PAES DE CAMARGO', guardian_cpf = '610.251.888-88', guardian_phone = '(19) 99643-7395' WHERE id = 137; -- MIGUEL DO SANTOS CAMARGO
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 310; -- JULIA MARIA FERREIRA DE OLIVEIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 150; -- DANIELE FERREIRA DA SILVA
UPDATE students SET plan_name = '["Natação bebê"]', guardian_name = 'BRENDA ALMEIDA DE SOUZA SIMENES', guardian_cpf = '461.132.728-00', guardian_phone = '(19) 99718-7490' WHERE id = 140; -- HENRIQUE GABRIEL DE SOUZA SIMENES
UPDATE students SET plan_name = '["Natação bebê "]', guardian_name = 'DAIANA RODRIGUES B. DISTASSI', guardian_cpf = '345.868.098-28', guardian_phone = '(19) 99308-5858' WHERE id = 144; -- ISABELA BRUNELLI DISTASSI
UPDATE students SET guardian_name = 'KARINA GOULART DE OLIVEIRA', guardian_cpf = '379.472.988-90', guardian_phone = '(19) 99371-0832' WHERE id = 132; -- ISIS VALENTINA GOULART DE CAMPOS HENRIQUE
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 268; -- JOSÉ CARLOS PEREIRA
UPDATE students SET guardian_name = 'DAYANE PARDINHO RIBEIRO CANCIO', guardian_cpf = '397.644.998-99', guardian_phone = '(19) 99181-0119' WHERE id = 149; -- VICTORIA PARDINHO CANCIO
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 162; -- JOSEFA RODRIGUES SILVA DO NASCIMENTO
UPDATE students SET guardian_name = 'RENATA NACHBAR BATISTA', guardian_cpf = '327.312.298-61', guardian_phone = '(19) 99237-2998' WHERE id = 67; -- JOÃO NACHBAR BATISTA
UPDATE students SET plan_name = '["Natação bebê "]' WHERE id = 300; -- MIGUEL FERREIRA SANTOS
UPDATE students SET guardian_name = 'THAMIRES LAIS GIL NETO', guardian_cpf = '453.181.978-46', guardian_phone = '(19) 99890-7819' WHERE id = 159; -- YASMIN TALENTINA DE MACEDO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]', guardian_name = 'NATALIA BUENO', guardian_cpf = '032.313.111-52', guardian_phone = '(19) 98228-5594' WHERE id = 156; -- ALICE BUENO
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 163; -- CARMELUCE RODRIGUES SANTANA
UPDATE students SET plan_name = '["Natação bebê "]', guardian_name = 'CAMILA LUCENA SILVA', guardian_cpf = '506.692.218-05', guardian_phone = '(19) 99430-7879' WHERE id = 186; -- CESAR LUCENA SILVA
UPDATE students SET plan_name = '["Hidroginástica 2x na semana"]' WHERE id = 222; -- EDUARDA TOTOLI DE OLIVEIRA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 1x na semana"]' WHERE id = 243; -- FATIMA NEGRI ANDREO
UPDATE students SET plan_name = '["Natação bebê"]' WHERE id = 301; -- ISIS RAMALHO DE OLIVEIRA
UPDATE students SET guardian_name = 'MILENA SOUZA DE FARIA', guardian_cpf = '401.813.858-05', guardian_phone = '(19) 99319-7081' WHERE id = 173; -- ROMEU FARIA DOS SANTOS
UPDATE students SET guardian_name = 'SIRLENE PURIFICAÇÃO SOUZA', guardian_cpf = '336.768.208-00', guardian_phone = '(19) 97416-4222' WHERE id = 168; -- CLODOALDO PURIFICAÇÃO SOUZA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 167; -- CRISTIANA ROCHA DE ALMEIDA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 270; -- ENZO GUSTAVO MOREIRA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 169; -- FRANCELI FERREIRA LIMA
UPDATE students SET plan_name = '["Natação bebê "]', guardian_name = 'VALERIA SOUZA SANTOS', guardian_cpf = '432.217.208-31', guardian_phone = '(19) 99102-4037' WHERE id = 172; -- ISIS SOUZA CHAVES
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 1x na semana"]' WHERE id = 179; -- IVANICE SILVA MATEUS
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]', guardian_name = 'PAMELA ALVES PUNCINELLI', guardian_cpf = '237.243.988-08', guardian_phone = '(19) 98171-9425' WHERE id = 176; -- LORENZO PUNCINELLI BRAGA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 189; -- CAIO ANDRADE GONÇALVES DA SILVA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 195; -- GABRIELA DA SILVA DOS SANTOS
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]' WHERE id = 192; -- HELENA MARIA RABELO
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 194; -- HILARY DAGNE DE OLIVEIRA
UPDATE students SET plan_name = '["Natação bebê"]', guardian_name = 'CAMILA ELOU ALVARES', guardian_cpf = '383.709.848-60', guardian_phone = '(16) 99727-9269' WHERE id = 188; -- LEVI ELOU ALVARES
UPDATE students SET guardian_name = 'HALLAYLANE MENDES DA SILVA', guardian_cpf = '495.808.038-46', guardian_phone = '(19) 98412-3112' WHERE id = 190; -- YOHANNA LILIAN MENDES MALHEIROS
UPDATE students SET guardian_name = 'KARINA MICHELLE CARDOSO', guardian_cpf = '339.216.228-08', guardian_phone = '(19) 99942-0262' WHERE id = 193; -- MIRELLA DOS SANTOS
UPDATE students SET guardian_name = 'RENATA GUIMARÃES', guardian_cpf = '390.815.518-50', guardian_phone = '(19) 99545-7445' WHERE id = 199; -- MATTEO NUNES GUIMARÃES
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 1x na semana"]' WHERE id = 203; -- EDNA FORTUNATO DE SOUZA
UPDATE students SET plan_name = '["Natação Infantil e Adulto 2x na semana"]', guardian_name = 'FERNANDO FERREIRA DA SILVA', guardian_cpf = '215.324.078-66', guardian_phone = '(19) 98324-8876' WHERE id = 201; -- FABIO FERREIRA DA SILVA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 200; -- GENY BOSA GOMES
UPDATE students SET plan_name = '["Natação Infantil e Adulto 1x na semana"]' WHERE id = 198; -- HARRISON HENRIQUE CORREIA DA SILVA
UPDATE students SET guardian_name = 'JESSICA LOPES LODDO', guardian_cpf = '425.362.878-82', guardian_phone = '(19) 97414-4439' WHERE id = 211; -- HELOISA LOPES LODDO
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 210; -- IDELVINA SIMONETTO
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 206; -- ISAEL FARIA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 2x na semana"]' WHERE id = 209; -- LAIR DE OLIVEIRA DE PAULA
UPDATE students SET plan_name = '["Hidroginástica 3ª idade 3x na semana"]' WHERE id = 202; -- LAURENTINO DOS SANTOS

-- FIM DAS CORRECOES
