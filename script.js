const sections = [...document.querySelectorAll("[data-page]")];
const indexLinks = [...document.querySelectorAll(".page-index a")];
const navLinks = [...document.querySelectorAll(".main-nav a")];
const gate = document.querySelector(".archive-gate");
const gateDot = document.querySelector(".gate-dot");
const ripple = document.querySelector(".ripple-transition");
const workLightbox = document.querySelector(".work-lightbox");
const workLightboxImg = document.querySelector(".work-lightbox img");
const workLightboxClose = document.querySelector(".work-lightbox-close");

const setActive = (id) => {
  indexLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.index === id));
  navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
};

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target.dataset.page);
  },
  { threshold: [0.36, 0.52, 0.7] }
);

sections.forEach((section) => observer.observe(section));
setActive("home");

gate?.addEventListener("click", () => {
  const dotRect = gateDot?.getBoundingClientRect();
  if (dotRect && ripple) {
    ripple.style.setProperty("--ripple-x", `${dotRect.left + dotRect.width / 2}px`);
    ripple.style.setProperty("--ripple-y", `${dotRect.top + dotRect.height / 2}px`);
  }
  document.body.classList.add("transitioning");
  window.setTimeout(() => {
    window.location.href = "archive.html";
  }, 920);
});

document.querySelectorAll(".work-card").forEach((card) => {
  card.addEventListener("click", () => {
    const image = card.querySelector("img");
    if (!image || !workLightbox || !workLightboxImg) return;
    workLightboxImg.src = image.dataset.full || image.currentSrc || image.src;
    workLightboxImg.alt = "";
    workLightbox.classList.add("is-open");
    workLightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
});

const closeWorkLightbox = () => {
  if (!workLightbox) return;
  workLightbox.classList.remove("is-open");
  workLightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  workLightboxImg?.removeAttribute("src");
};

workLightboxClose?.addEventListener("click", closeWorkLightbox);
workLightbox?.addEventListener("click", (event) => {
  if (event.target === workLightbox) closeWorkLightbox();
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && workLightbox?.classList.contains("is-open")) {
    closeWorkLightbox();
  }
});
