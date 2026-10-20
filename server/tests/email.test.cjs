const test = require("node:test");
const assert = require("node:assert/strict");

process.env.APP_URL = "https://interact.example.org";

const { resolveContentImageUrl } = require("../dist/lib/email");

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
