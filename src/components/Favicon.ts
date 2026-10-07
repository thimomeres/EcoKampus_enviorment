// Memastikan ikon tab browser memakai /favicon1.jpeg (file ada di folder public/).
const HREF = "/favicon1.jpeg";

document.querySelectorAll<HTMLLinkElement>("link[rel~='icon'], link[rel='apple-touch-icon']").forEach((l) => l.remove());

const icon = document.createElement("link");
icon.rel = "icon";
icon.type = "image/jpeg";
icon.href = HREF;
document.head.appendChild(icon);

const apple = document.createElement("link");
apple.rel = "apple-touch-icon";
apple.href = HREF;
document.head.appendChild(apple);
