// Importar todas as seções registra seus handlers globais (window.*)
import { render as painel } from "./painel.js";
import { render as membros } from "./membros.js";
import { render as eventos } from "./eventos.js";
import { render as projetos } from "./projetos.js";
import { render as noticias } from "./noticias.js";
import { render as avisos } from "./avisos.js";
import { render as contatos } from "./contatos.js";

export const sections = {
    painel,
    membros,
    eventos,
    projetos,
    noticias,
    avisos,
    contatos,
};
