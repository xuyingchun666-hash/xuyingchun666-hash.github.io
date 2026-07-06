const grid = document.querySelector("#archiveGrid");
const buttons = [...document.querySelectorAll("[data-filter]")];
const viewer = document.querySelector(".viewer");
const viewerImage = viewer.querySelector("img");
const viewerVideo = viewer.querySelector("video");
const viewerCount = viewer.querySelector("figcaption span");
const viewerTitle = viewer.querySelector("figcaption strong");
const closeButton = viewer.querySelector(".viewer-close");
const prevButton = viewer.querySelector(".viewer-prev");
const nextButton = viewer.querySelector(".viewer-next");

const data = window.ARCHIVE_DATA;
const directKeys = new Set(["home", "ai", "others"]);
const missingImage =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760">
      <rect width="1200" height="760" fill="#081924"/>
      <rect x="1" y="1" width="1198" height="758" fill="none" stroke="rgba(233,239,242,.28)" stroke-width="2"/>
      <text x="600" y="352" text-anchor="middle" fill="rgba(233,239,242,.72)" font-family="Times New Roman, serif" font-size="42" letter-spacing="6">PREVIEW COMING SOON</text>
      <text x="600" y="416" text-anchor="middle" fill="rgba(233,239,242,.48)" font-family="Times New Roman, serif" font-size="24" letter-spacing="4">ARCHIVE IMAGE WILL BE PREPARED FOR WEB</text>
    </svg>
  `);

let activeItems = [];
let activeIndex = 0;
let activeTitle = "";
let activeFallback = "";

const intro = {
  pop: "快闪、会展与美陈项目归档，呈现从主题概念、空间动线到现场视觉落地的完整片段。",
  summit: "峰会、论坛与发布会项目归档，聚焦主视觉、舞台结构、灯光氛围与品牌叙事。",
  commercial: "商业空间与工装项目归档，记录零售、街区与体验场景中的空间秩序和消费动线。"
};

const mediaType = (src) => (src.split(".").pop().toLowerCase() === "mp4" ? "video" : "image");
const findCategory = (key) => data.categories.find((category) => category.key === key);
const imageFor = (item) => item.cover || item.src || "";
const safeFallback = (src) => (src && src.startsWith("assets/") ? src : missingImage);

const getEntries = (filter = "all") => {
  const categories = filter === "all" ? data.categories : data.categories.filter((category) => category.key === filter);

  return categories.flatMap((category) => {
    if (category.mode === "projects") {
      return category.items.map((project) => ({
        ...project,
        mode: "project",
        categoryKey: category.key,
        eyebrow: category.eyebrow
      }));
    }

    return category.items.map((image, index) => ({
      id: `${category.key}-${index}`,
      mode: "direct-image",
      categoryKey: category.key,
      category: category.title,
      title: category.title,
      src: image.src,
      type: image.type
    }));
  });
};

const projectCard = (item) => `
  <button class="archive-card project-card" type="button" data-mode="project" data-id="${item.id}" data-category="${item.categoryKey}">
    <span class="thumb"><img src="${imageFor(item)}" alt="${item.title}" loading="lazy" decoding="async" data-fallback="${safeFallback(imageFor(item))}"></span>
    <span class="meta">
      <small>${item.category} / PROJECT</small>
      <h3>${item.title}</h3>
      <p>${intro[item.categoryKey]}</p>
      <span class="details-link">VIEW DETAILS</span>
    </span>
  </button>
`;

const imageCard = (item) => `
  <button class="image-tile" type="button" data-mode="direct-image" data-id="${item.id}" data-category="${item.categoryKey}">
    <img src="${item.src}" alt="${item.category}" loading="lazy" decoding="async" data-fallback="${safeFallback(item.cover || item.src)}">
  </button>
`;

const renderCards = (filter = "all") => {
  const entries = getEntries(filter);
  const directOnly = entries.length > 0 && entries.every((entry) => entry.mode === "direct-image");

  grid.classList.toggle("image-mode", directOnly);
  grid.innerHTML = entries.map((entry) => (entry.mode === "project" ? projectCard(entry) : imageCard(entry))).join("");
};

const findProject = (id, categoryKey) => {
  const category = findCategory(categoryKey);
  return category?.items.find((item) => item.id === id);
};

const openViewer = (items, index, title, fallback = "") => {
  activeItems = items || [];
  activeIndex = index || 0;
  activeTitle = title || "";
  activeFallback = fallback || "";

  if (!activeItems.length) return;

  viewer.classList.add("is-open");
  viewer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  showMedia();
};

const showMedia = () => {
  const item = activeItems[activeIndex];
  if (!item) return;

  const isVideo = item.type === "mp4" || mediaType(item.src) === "video";
  viewerImage.style.display = isVideo ? "none" : "block";
  viewerVideo.style.display = isVideo ? "block" : "none";

  if (isVideo) {
    viewerVideo.src = item.src;
    viewerVideo.play().catch(() => {});
    viewerImage.removeAttribute("src");
  } else {
    viewerVideo.pause();
    viewerVideo.removeAttribute("src");
    viewerImage.classList.remove("is-missing");
    delete viewerImage.dataset.failed;
    viewerImage.src = item.src;
    viewerImage.dataset.fallback = safeFallback(item.cover || activeFallback || item.src);
  }

  viewerCount.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(activeItems.length).padStart(2, "0")}`;
  viewerTitle.textContent = activeTitle;
};

const closeViewer = () => {
  viewer.classList.remove("is-open");
  viewer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  viewerVideo.pause();
  viewerVideo.removeAttribute("src");
  viewerVideo.load();
  viewerImage.removeAttribute("src");
};

const step = (direction) => {
  if (!activeItems.length) return;
  activeIndex = (activeIndex + direction + activeItems.length) % activeItems.length;
  showMedia();
};

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((btn) => btn.classList.toggle("is-active", btn === button));
    renderCards(button.dataset.filter);
  });
});

grid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-mode]");
  if (!card) return;

  const category = findCategory(card.dataset.category);
  if (!category) return;

  if (card.dataset.mode === "project") {
    const project = findProject(card.dataset.id, card.dataset.category);
    if (project) openViewer(project.images, 0, project.title, project.cover);
    return;
  }

  if (directKeys.has(card.dataset.category)) {
    const index = Number(card.dataset.id.split("-").pop());
    openViewer(category.items, index, category.title, category.cover);
  }
});

grid.addEventListener(
  "error",
  (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.failed) return;
    img.dataset.failed = "true";
    img.classList.add("is-missing");
    img.src = img.dataset.fallback || missingImage;
  },
  true
);

viewerImage.addEventListener("error", () => {
  if (viewerImage.dataset.failed) return;
  viewerImage.dataset.failed = "true";
  viewerImage.classList.add("is-missing");
  viewerImage.src = viewerImage.dataset.fallback || missingImage;
});

closeButton.addEventListener("click", closeViewer);
prevButton.addEventListener("click", () => step(-1));
nextButton.addEventListener("click", () => step(1));

document.addEventListener("keydown", (event) => {
  if (!viewer.classList.contains("is-open")) return;
  if (event.key === "Escape") closeViewer();
  if (event.key === "ArrowLeft") step(-1);
  if (event.key === "ArrowRight") step(1);
});

renderCards("all");
