import * as painel from "./painel.js";
import * as membros from "./membros.js";
import * as eventos from "./eventos.js";
import * as projetos from "./projetos.js";
import * as noticias from "./noticias.js";
import * as avisos from "./avisos.js";
import * as contatos from "./contatos.js";

// Cada seção expõe `render()` e, quando necessário, `bind(root, contexto)`.
export const sections = {
    painel,
    membros,
    eventos,
    projetos,
    noticias,
    avisos,
    contatos,
};
