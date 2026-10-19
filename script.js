document.documentElement.classList.add('js');

// Nav: border on scroll, mobile menu
const nav = document.querySelector('.nav');
const toggle = document.getElementById('nav-toggle');
const links = document.getElementById('nav-links');

let scrolled = false;
addEventListener('scroll', () => {
  if (scrolled !== scrollY > 8) nav.classList.toggle('scrolled', (scrolled = !scrolled));
}, { passive: true });
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
links.addEventListener('click', e => {
  if (e.target.closest('a')) {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  }
});

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  }
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Copy email
const copyBtn = document.getElementById('copy-email');
copyBtn.addEventListener('click', async () => {
  const email = document.getElementById('email');
  try {
    await navigator.clipboard.writeText(email.textContent);
    copyBtn.textContent = 'Copied';
  } catch {
    getSelection().selectAllChildren(email);
    copyBtn.textContent = 'Selected';
  }
  setTimeout(() => (copyBtn.textContent = 'Copy'), 1800);
});

// System walkthrough: each stage lights up the diagram nodes it involves
const FLOWS = {
  inventory: {
    nodes: [
      ['Pengelola', 'kelola stok di Sheets'],
      ['Google Sheets', 'data stok'],
      ['Website', 'form peminjaman'],
      ['Anggota', 'isi form, pilih barang'],
      ['Real-time', 'stok selalu sinkron'],
    ],
    stages: [
      {
        title: 'Info stok perlu dibagi, sheet-nya jangan.',
        text: 'Anggota perlu tahu barang apa saja yang ada di inventaris. Masalahnya, kalau spreadsheet dibagikan langsung, datanya rawan diutak-atik.',
        on: [0, 1],
      },
      {
        title: 'Website di depan, sheet di belakang.',
        text: 'Saya membangun website peminjaman dengan Apps Script. Daftar barang di form diambil langsung dari Google Sheets, jadi anggota memilih barang tanpa pernah membuka sheet-nya.',
        on: [1, 2, 3],
      },
      {
        title: 'Satu data, selalu sinkron.',
        text: 'Stok habis di sheet, di website ikut habis. Sheet diubah, website ikut berubah. Pengelola tetap memegang kendali, anggota tetap dapat info terbaru.',
        on: [0, 1, 2, 3, 4],
      },
    ],
  },
  letters: {
    nodes: [
      ['Google Form', 'satu kali isi'],
      ['Google Sheets', 'rekap otomatis'],
      ['Apps Script', 'atur alurnya'],
      ['Surat masuk', 'folder per bulan'],
      ['Surat keluar', 'folder per jenis'],
    ],
    stages: [
      {
        title: 'Rekap yang berulang terus.',
        text: 'Setiap surat masuk dan keluar harus direkap. Caranya dulu: unduh file, pindahkan ke folder, lalu ketik ulang di spreadsheet. Repetitif dan makan waktu.',
        on: [1, 3, 4],
      },
      {
        title: 'Cukup isi satu form.',
        text: 'Google Form saya sambungkan ke Sheets dan Drive. Begitu form terkirim, datanya langsung masuk ke rekap dan file-nya dipindahkan ke folder yang sesuai.',
        on: [0, 1, 2],
      },
      {
        title: 'Rekap rapi, folder tertata.',
        text: 'Surat masuk tersimpan per bulan, surat keluar per jenis seperti SK kepanitiaan. Hasilnya data yang sudah terolah, bukan data mentah.',
        on: [0, 1, 2, 3, 4],
      },
    ],
  },
};

const tabs = document.querySelectorAll('.flow-tabs [role="tab"]');
const steps = document.querySelectorAll('.flow-steps button');
const diagram = document.getElementById('flow-diagram');
const copy = document.querySelector('.flow-copy');
const title = document.getElementById('flow-title');
const text = document.getElementById('flow-text');
const prev = document.getElementById('flow-prev');
const next = document.getElementById('flow-next');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
let project = 'inventory';
let stage = 0;

function drawDiagram() {
  diagram.innerHTML = FLOWS[project].nodes
    .map(([name, note]) => `<div class="node"><b>${name}</b><small>${note}</small></div>`)
    .join('<span class="arrow" aria-hidden="true">→</span>');
}

function render(animate = true) {
  const { stages } = FLOWS[project];
  const current = stages[stage];
  title.textContent = current.title;
  text.textContent = current.text;
  diagram.querySelectorAll('.node').forEach((node, i) => node.classList.toggle('on', current.on.includes(i)));
  steps.forEach((btn, i) => i === stage ? btn.setAttribute('aria-current', 'step') : btn.removeAttribute('aria-current'));
  prev.disabled = stage === 0;
  next.textContent = stage === stages.length - 1 ? 'Restart' : 'Next step';
  if (animate && !calm) copy.animate(
    [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
    { duration: 450, easing: 'cubic-bezier(.2, .7, .2, 1)' },
  );
}

tabs.forEach(tab => tab.addEventListener('click', () => {
  project = tab.dataset.project;
  stage = 0;
  tabs.forEach(t => t.setAttribute('aria-selected', t === tab));
  drawDiagram();
  render();
}));
steps.forEach(btn => btn.addEventListener('click', () => { stage = +btn.dataset.stage; render(); }));
// "Lihat alurnya" on each project card opens the walkthrough on that project
document.querySelectorAll('.flow-link').forEach(link => link.addEventListener('click', () => {
  document.querySelector(`.flow-tabs [data-project="${link.dataset.flow}"]`).click();
}));
prev.addEventListener('click', () => { stage--; render(); });
next.addEventListener('click', () => { stage = (stage + 1) % FLOWS[project].stages.length; render(); });

drawDiagram();
render(false);

// Document viewer: opens a proof document large, with prev/next inside its role
const viewer = document.getElementById('viewer');
const viewerDoc = document.getElementById('viewer-doc');
const viewerCaption = document.getElementById('viewer-caption');
const viewerCount = document.getElementById('viewer-count');
const captionOf = doc => doc.querySelector('img')?.alt || doc.textContent.trim();
let docs = [];
let docIndex = 0;

document.querySelectorAll('.proof').forEach(proof => {
  proof.querySelector('.proof-label').textContent += ` · ${proof.querySelectorAll('.doc').length} documents`;
});

function showDoc() {
  const doc = docs[docIndex];
  const frame = doc.firstElementChild.cloneNode(true);
  frame.classList.add('frame-doc-lg');
  viewerDoc.replaceChildren(frame);
  viewerCaption.textContent = captionOf(doc);
  viewerCount.textContent = `${docIndex + 1} / ${docs.length}`;
}

document.getElementById('more').addEventListener('click', e => {
  const doc = e.target.closest('.doc');
  if (!doc) return;
  docs = [...doc.parentElement.children];
  docIndex = docs.indexOf(doc);
  document.getElementById('viewer-group').textContent = doc.closest('.proof').dataset.group;
  showDoc();
  viewer.showModal();
});
const step = d => { docIndex = (docIndex + d + docs.length) % docs.length; showDoc(); };
document.getElementById('viewer-prev').addEventListener('click', () => step(-1));
document.getElementById('viewer-next').addEventListener('click', () => step(1));
viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});


// Education Fair numbers count up the first time they scroll into view
const countIO = new IntersectionObserver(entries => {
  for (const { isIntersecting, target } of entries) {
    if (!isIntersecting) continue;
    countIO.unobserve(target);
    const end = +target.dataset.count;
    const { prefix = '', suffix = '' } = target.dataset;
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / 1400, 1);
      const value = Math.round(end * (1 - (1 - t) ** 3));
      target.textContent = prefix + value.toLocaleString('id-ID') + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}, { threshold: 0.6 });
if (!calm) document.querySelectorAll('[data-count]').forEach(el => countIO.observe(el));
