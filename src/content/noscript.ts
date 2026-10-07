import type { PortfolioContent } from "./types";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );

export const buildNoscriptMarkup = (content: PortfolioContent) => {
  const links = Object.values(content.social)
    .filter(({ href }) => href.trim())
    .map(
      ({ label, href }) =>
        `<li><a href="${escapeHtml(href)}">${escapeHtml(label.fr)}</a></li>`,
    )
    .join("");

  return `<section aria-labelledby="noscript-title"><h1 id="noscript-title">${escapeHtml(content.identity.name)}</h1><p>${escapeHtml(content.contact.invitation.fr)}</p><p>${escapeHtml(content.contact.location.fr)}</p>${links ? `<ul>${links}</ul>` : ""}</section>`;
};
