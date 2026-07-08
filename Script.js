const lines = [
  { t: "$ deploy storefront-checkout", c: "var(--muted)" },
  { t: "  → verifying payment signature...", c: "var(--muted)" },
  { t: "  ✓ PayFast ITN handler live", c: "var(--cyan)" },
  { t: "$ deploy fulfillment-service", c: "var(--muted)" },
  { t: "  → connecting supplier API...", c: "var(--muted)" },
  { t: "  ✓ auto order placement enabled", c: "var(--cyan)" },
  { t: "$ deploy notifications", c: "var(--muted)" },
  { t: "  ✓ receipt emails sending", c: "var(--cyan)" },
  { t: "$ status", c: "var(--muted)" },
  { t: "  ✓ all systems shipped", c: "var(--violet)" },
];

const term = document.getElementById('term');
let i = 0;

function typeLines(){
  if (!term) return;
  if (i >= lines.length){
    setTimeout(() => { term.innerHTML = ''; i = 0; typeLines(); }, 2200);
    return;
  }
  const div = document.createElement('div');
  div.className = 'term-line';
  div.style.color = lines[i].c;
  div.textContent = lines[i].t;
  term.appendChild(div);
  i++;
  if (term.children.length > 11) term.removeChild(term.children[0]);
  setTimeout(typeLines, 380);
}

if (term){
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    typeLines();
  } else {
    lines.forEach(l => {
      const div = document.createElement('div');
      div.style.color = l.c;
      div.textContent = l.t;
      term.appendChild(div);
    });
  }
}