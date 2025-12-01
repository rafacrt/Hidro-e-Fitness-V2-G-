-- Script para adicionar usuários solicitados
-- Execute este script no seu gerenciador de banco de dados (Adminer, DBeaver, pgAdmin)

-- 1. Admin
INSERT INTO users (name, email, password, role, avatar)
VALUES ('Admin', 'admin@hidrofitness.com', 'admin123', 'MANAGER', 'https://ui-avatars.com/api/?name=Admin&background=0d9488&color=fff')
ON CONFLICT (email) DO NOTHING;

-- 2. Rafael (Programador)
-- Nota: Se o usuário já existir com este email, o comando abaixo não fará nada.
-- Se precisar atualizar a senha, use o UPDATE abaixo.
INSERT INTO users (name, email, password, role, avatar)
VALUES ('Rafael', 'tecnorafa12@gmail.com', '@Rafa2533', 'DEV', 'https://ui-avatars.com/api/?name=Rafael&background=6366f1&color=fff')
ON CONFLICT (email) DO NOTHING;

-- Atualizar a senha do Rafael caso ele já exista (para garantir que seja @Rafa2533)
UPDATE users SET password = '@Rafa2533' WHERE email = 'tecnorafa12@gmail.com';
