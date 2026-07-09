const cargo = [
  { name: "PayFast checkout integration", status: "cleared" },
  { name: "Supplier fulfillment API", status: "cleared" },
  { name: "Order notification system", status: "cleared" },
  { name: "Customer accounts module", status: "pending" },
];

const manifest = document.getElementById('manifest');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function buildRow(item, index, animate){
  const row = document.createElement('div');
  row.className = 'manifest-row';
  if (animate) row.style.animationDelay = `${index * 0.5}s`;
  else { row.style.opacity = '1'; row.style.transform = 'none'; }

  const cargoEl = document.createElement('div');
  cargoEl.className = 'manifest-cargo';
  cargoEl.innerHTML = `<span class="manifest-num">${String(index + 1).padStart(2, '0')}</span><span>${item.name}</span>`;

  const statusEl = document.createElement('div');
  statusEl.className = 'manifest-status';
  const stamp = document.createElement('span');
  stamp.className = item.status === 'cleared' ? 'stamp' : 'stamp pending';
  stamp.textContent = item.status === 'cleared' ? 'Cleared' : 'In transit';
  if (animate && item.status === 'cleared') {
    stamp.style.animationDelay = `${index * 0.5 + 0.35}s`;
  }
  statusEl.appendChild(stamp);

  row.appendChild(cargoEl);
  row.appendChild(statusEl);
  return row;
}

function renderManifest(animate){
  if (!manifest) return;
  manifest.innerHTML = '';
  cargo.forEach((item, i) => manifest.appendChild(buildRow(item, i, animate)));
}

if (manifest){
  renderManifest(!reduceMotion);
  if (!reduceMotion){
    setInterval(() => renderManifest(true), 6500);
  }
}