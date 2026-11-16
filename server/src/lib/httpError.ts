/**
 * Erro com status HTTP. Lançado de dentro de uma rota (envolvida por `ah()`),
 * chega ao tratador central do app.ts, que responde com esse status e mensagem.
 */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}
