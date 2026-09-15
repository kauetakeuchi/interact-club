import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import path from "path";
import dotenv from "dotenv";

// Sempre carrega server/.env, independente do diretório de onde o script for chamado
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const dias = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  const url = new URL(process.env.DATABASE_URL || "mysql://root:@localhost:3306/interact_club");
  const pool = mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", ""),
  });

  let inseridos = 0;
  let ignorados = 0;

  async function existe(sql: string, params: any[]): Promise<boolean> {
    const [rows] = await pool.execute(sql, params);
    return (rows as any[]).length > 0;
  }

  /** Insere apenas se ainda não existir — torna o seed seguro para rodar várias vezes */
  async function seedOnce(descricao: string, existsSql: string, existsParams: any[], insertFn: () => Promise<void>) {
    if (await existe(existsSql, existsParams)) {
      ignorados++;
      console.log(`  - ${descricao} (já existe)`);
      return;
    }
    await insertFn();
    inseridos++;
    console.log(`  + ${descricao}`);
  }

  async function criarUsuario(nome: string, email: string, senha: string, role: string, cargo: string | null) {
    await seedOnce(
      `Usuário ${email}`,
      "SELECT id FROM `user` WHERE email = ?",
      [email],
      async () => {
        const hash = await bcrypt.hash(senha, 12);
        await pool.execute(
          "INSERT INTO `user` (id, name, email, passwordHash, role, `status`, `position`, emailVerifiedAt) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, CURRENT_TIMESTAMP)",
          [randomUUID(), nome, email, hash, role, cargo]
        );
      }
    );
  }

  async function criarNoticia(title: string, slug: string, category: string | null, published: boolean, excerpt: string, content: string, authorId: string) {
    await seedOnce(
      `Notícia "${title}"`,
      "SELECT id FROM newsarticle WHERE slug = ?",
      [slug],
      async () => {
        await pool.execute(
          "INSERT INTO newsarticle (id, title, slug, content, excerpt, imageUrl, category, published, authorId) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)",
          [randomUUID(), title, slug, content, excerpt, category, published, authorId]
        );
      }
    );
  }

  async function criarProjeto(title: string, description: string, status: string, startDays: number | null, endDays: number | null) {
    await seedOnce(
      `Projeto "${title}"`,
      "SELECT id FROM `project` WHERE title = ?",
      [title],
      async () => {
        await pool.execute(
          "INSERT INTO `project` (id, title, description, `status`, startDate, endDate, imageUrl, isPublic) VALUES (?, ?, ?, ?, ?, ?, NULL, TRUE)",
          [
            randomUUID(),
            title,
            description,
            status,
            startDays !== null ? dias(startDays) : null,
            endDays !== null ? dias(endDays) : null,
          ]
        );
      }
    );
  }

  async function criarEvento(title: string, description: string, emDias: number, location: string, maxParticipants: number | null) {
    await seedOnce(
      `Evento "${title}"`,
      "SELECT id FROM `event` WHERE title = ?",
      [title],
      async () => {
        await pool.execute(
          "INSERT INTO `event` (id, title, description, `date`, location, imageUrl, isPublic, maxParticipants) VALUES (?, ?, ?, ?, ?, NULL, TRUE, ?)",
          [randomUUID(), title, description, dias(emDias), location, maxParticipants]
        );
      }
    );
  }

  async function criarAviso(title: string, content: string, adminId: string) {
    await seedOnce(
      `Aviso "${title}"`,
      "SELECT id FROM notice WHERE title = ?",
      [title],
      async () => {
        await pool.execute("INSERT INTO notice (id, title, content, userId) VALUES (?, ?, ?, ?)", [
          randomUUID(),
          title,
          content,
          adminId,
        ]);
      }
    );
  }

  async function criarContato(name: string, email: string, subject: string, message: string, isRead: boolean) {
    await seedOnce(
      `Contato "${subject}"`,
      "SELECT id FROM contact WHERE subject = ?",
      [subject],
      async () => {
        await pool.execute(
          "INSERT INTO contact (id, name, email, phone, subject, message, isRead) VALUES (?, ?, ?, NULL, ?, ?, ?)",
          [randomUUID(), name, email, subject, message, isRead]
        );
      }
    );
  }

  try {
    console.log("\n=== Seed Interact Club ===\n");

    // ---------- Usuários ----------
    console.log("Usuários:");
    await criarUsuario("Admin", "admin@interactclub.com", "admin123", "ADMIN", "Presidente");
    await criarUsuario("Maria Silva", "diretora@interactclub.com", "diretora123", "DIRECTOR", "Diretora de Projetos");
    await criarUsuario("João Santos", "membro@interactclub.com", "membro123", "MEMBER", "Membro");

    // Pega o id do admin para ser autor dos conteúdos
    const [adminRows] = await pool.execute("SELECT id FROM `user` WHERE email = ?", ["admin@interactclub.com"]);
    const adminId = (adminRows as any[])[0]?.id;
    if (!adminId) throw new Error("Admin não encontrado após seed");

    // ---------- Notícias ----------
    console.log("\nNotícias:");
    await criarNoticia(
      "Clube realiza arrecadação de alimentos no bairro Centro",
      "arrecadacao-alimentos-centro",
      "Campanhas",
      true,
      "Mais de 500 quilos de alimentos foram arrecadados durante a ação solidária do último sábado.",
      "No último sábado, os membros do Interact Club realizaram mais uma arrecadação de alimentos no bairro Centro.\nA ação contou com a participação de 15 jovens voluntários que percorreram os principais pontos do bairro.\n\nTodo o material arrecadado foi doado ao banco de alimentos local, que atende famílias em situação de vulnerabilidade.\nAgradecemos a todos que contribuíram!",
      adminId
    );
    await criarNoticia(
      "Nova diretoria é eleita para o próximo ano",
      "nova-diretoria-eleita",
      "Clube",
      true,
      "Conheça os jovens que vão liderar o clube no próximo mandato.",
      "Em assembleia realizada na semana passada, o clube elegeu sua nova diretoria.\nA transição de cargos acontecerá na reunião de posse, aberta a todos os membros e familiares.\n\nParabéns aos eleitos e vamos juntos por mais um ano de serviço acima de si!",
      adminId
    );
    await criarNoticia(
      "Parceria com Rotary Club fortalece projetos sociais",
      "parceria-rotary-club",
      "Parcerias",
      true,
      "O Rotary Club patrocinador anunciou apoio aos próximos projetos do clube.",
      "O Rotary Club patrocinador anunciou oficialmente o apoio aos próximos projetos do Interact Club.\nA parceria inclui mentoria para os jovens e suporte financeiro para ações comunitárias.",
      adminId
    );
    await criarNoticia(
      "Mutirão de limpeza reúne 40 voluntários no parque municipal",
      "mutirao-limpeza-parque-municipal",
      "Voluntariado",
      true,
      "Ação de sábado mobilizou jovens e famílias para revitalizar a área verde mais frequentada da cidade.",
      "No sábado de manhã, 40 voluntários do Interact Club se reuniram no parque municipal para um mutirão de limpeza.\nForam recolhidos resíduos, plantadas 30 mudas nativas e instaladas placas de conscientização feitas pelos próprios jovens.\n\nA atividade encerrou com um piquenique coletivo e roda de conversa sobre consumo consciente.",
      adminId
    );
    await criarNoticia(
      "Oficina de liderança forma nova turma de interactianos",
      "oficina-lideranca-nova-turma",
      "Formação",
      true,
      "Encontro com dinâmicas e palestra sobre comunicação encerrou ciclo de capacitação do trimestre.",
      "A oficina de liderança reuniu 25 jovens no auditório da escola parceira.\nCom dinâmicas de grupo e palestra sobre comunicação não-violenta, os participantes treinaram condução de reuniões, planejamento de projetos e tomada de decisão coletiva.\n\nTodos os concluintes receberam certificado do Rotary e já se inscreveram para coordenar o próximo projeto.",
      adminId
    );
    await criarNoticia(
      "[RASCUNHO] Planejamento da festa junina",
      "rascunho-festa-junina",
      "Eventos",
      false,
      "",
      "Este é um rascunho — não deve aparecer no site público enquanto published = false.",
      adminId
    );

    // ---------- Projetos ----------
    console.log("\nProjetos:");
    await criarProjeto(
      "Horta Comunitária",
      "Criação de uma horta coletiva na escola municipal para abastecer a merenda dos alunos e servir como espaço educativo sobre sustentabilidade.",
      "IN_PROGRESS",
      -30,
      60
    );
    await criarProjeto(
      "Mutirão de Limpeza do Rio",
      "Ação conjunta com moradores para limpeza das margens do rio que corta a cidade, incluindo campanha de conscientização sobre descarte de lixo.",
      "PLANNING",
      15,
      90
    );
    await criarProjeto(
      "Natal Solidário",
      "Arrecadação e entrega de brinquedos para crianças carentes da comunidade no período natalino.",
      "COMPLETED",
      -180,
      -120
    );

    // ---------- Eventos ----------
    console.log("\nEventos:");
    await criarEvento(
      "Reunião Geral do Clube",
      "Reunião mensal com todos os membros para alinhar os projetos do trimestre. Traga ideias novas!",
      7,
      "Sala 12 - Escola Municipal",
      30
    );
    await criarEvento(
      "Visita ao Asilo Municipal",
      "Tarde de jogos e conversa com os residentes do asilo. Levar 1 brinde pequeno por visitante.",
      21,
      "Asilo Municipal",
      15
    );
    await criarEvento(
      "Ação de Pascoa no Parque",
      "Distribuição de ovos de chocolate para crianças do bairro.",
      -10,
      "Praça Central",
      null
    );

    // ---------- Avisos ----------
    console.log("\nAvisos:");
    await criarAviso(
      "Pagamento das mensalidades",
      "Lembramos que as mensalidades devem ser pagas até o dia 10 de cada mês com o tesoureiro.",
      adminId
    );
    await criarAviso(
      "Uniforme do clube",
      "Novos uniformes chegaram! Retire o seu com a diretora nos horários de reunião.",
      adminId
    );

    // ---------- Contatos ----------
    console.log("\nContatos:");
    await criarContato(
      "Ana Oliveira",
      "ana.oliveira@email.com",
      "Quero participar do clube",
      "Oi! Tenho 15 anos e vi o site de vocês. Como faço para me tornar membro do Interact Club?",
      false
    );
    await criarContato(
      "Carlos Pereira",
      "carlos.pereira@email.com",
      "Convite para palestra",
      "Sou coordenador da escola estadual e gostaria de convidar vocês para apresentarem o clube aos nossos alunos.",
      true
    );

    console.log(`\n=== Concluído: ${inseridos} criado(s), ${ignorados} já existente(s) ===\n`);
    console.log("Contas de acesso:");
    console.log("  Admin    -> admin@interactclub.com    / admin123");
    console.log("  Diretor  -> diretora@interactclub.com / diretora123");
    console.log("  Membro   -> membro@interactclub.com   / membro123");
    console.log("");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Falha no seed:", err.message);
  process.exit(1);
});
