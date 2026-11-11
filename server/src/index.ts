import "dotenv/config";
import { createApp } from "./app";
import { closePool } from "./lib/db";

const app = createApp();
const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} recebido — encerrando...`);
    server.close(() => {
      closePool()
        .catch(() => {})
        .finally(() => process.exit(0));
    });
  });
}
