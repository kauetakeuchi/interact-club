// Aplica o tema antes do CSS renderizar, evitando o "flash" claro.
try {
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark" || (!stored && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
} catch {}
