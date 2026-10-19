document.documentElement.classList.add("js");

const nav = document.getElementById("nav");
const toggle = document.getElementById("nav-toggle");
const links = document.getElementById("nav-links");

// Nav border once the page scrolls
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

// Slide-in on scroll, and highlight the nav link of the section in view
const navLinks = new Map(
  [...links.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute("href").slice(1), a])
);
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      if (el.classList.contains("reveal")) {
        el.classList.add("in");
        observer.unobserve(el);
      } else {
        navLinks.forEach((a, id) => a.classList.toggle("active", id === el.id));
      }
    }
  },
  { rootMargin: "0px 0px -15% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
document.querySelectorAll("main section[id]").forEach((el) => observer.observe(el));

// Copy email, falling back to selecting the text
const email = document.getElementById("email");
const note = document.getElementById("copy-note");
document.getElementById("copy-email").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(email.textContent.trim());
    note.textContent = "Email copied.";
  } catch {
    getSelection().selectAllChildren(email);
    note.textContent = "Press Ctrl+C (or ⌘C) to copy.";
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
