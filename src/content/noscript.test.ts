import { describe, expect, it } from "vitest";
import { portfolioContent } from "./portfolioContent";
import { buildNoscriptMarkup } from "./noscript";

describe("buildNoscriptMarkup", () => {
  it("omits empty destinations and escapes populated links", () => {
    const content = {
      ...portfolioContent,
      social: {
        ...portfolioContent.social,
        github: {
          label: { fr: "Git & Hub", en: "Git & Hub" },
          href: 'https://example.com/?q="portfolio"&tag=<data>',
        },
        linkedin: { ...portfolioContent.social.linkedin, href: "" },
        cv: { ...portfolioContent.social.cv, href: "/cv?a=1&b=2" },
      },
    };

    const markup = buildNoscriptMarkup(content);

    expect(markup).not.toContain("LinkedIn");
    expect(markup).toContain("Git &amp; Hub");
    expect(markup).toContain(
      'href="https://example.com/?q=&quot;portfolio&quot;&amp;tag=&lt;data&gt;"',
    );
    expect(markup).toContain('href="/cv?a=1&amp;b=2"');
  });
});
