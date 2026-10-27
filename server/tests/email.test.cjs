const test = require("node:test");
const assert = require("node:assert/strict");

process.env.APP_URL = "https://interact.example.org";

const {
  resolveContentImageUrl,
  getInteractLogoUrl,
  DEFAULT_INTERACT_LOGO_URL,
} = require("../dist/lib/email");

test("resolve upload local para URL absoluta", () => {
  assert.equal(
    resolveContentImageUrl("/uploads/foto.png"),
    "https://interact.example.org/uploads/foto.png"
  );
});

test("mantém URL absoluta de imagem", () => {
  assert.equal(
    resolveContentImageUrl("https://res.cloudinary.com/demo/image/upload/foto.jpg"),
    "https://res.cloudinary.com/demo/image/upload/foto.jpg"
  );
});

test("ignora imagens ausentes ou com protocolo inválido", () => {
  assert.equal(resolveContentImageUrl(""), "");
  assert.equal(resolveContentImageUrl(null), "");
  assert.equal(resolveContentImageUrl(undefined), "");
  assert.equal(resolveContentImageUrl("javascript:alert(1)"), "");
  assert.equal(resolveContentImageUrl("/outro/caminho.png"), "");
});

test("retorna a URL padrão do Cloudinary para a logo do Interact", () => {
  delete process.env.INTERACT_LOGO_URL;
  assert.equal(
    getInteractLogoUrl(),
    "https://res.cloudinary.com/d9qauhwe/image/upload/v1793057886/logo-interact.png"
  );
  assert.equal(getInteractLogoUrl(), DEFAULT_INTERACT_LOGO_URL);
});

test("permite sobrescrever a URL da logo via variável de ambiente", () => {
  process.env.INTERACT_LOGO_URL = "https://res.cloudinary.com/custom/logo.png";
  assert.equal(getInteractLogoUrl(), "https://res.cloudinary.com/custom/logo.png");
  delete process.env.INTERACT_LOGO_URL;
});
