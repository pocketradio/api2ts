import * as cheerio from "cheerio";
import { fetchPage } from "./fetch-page.js";

export async function followLinks(url: string, selector?: string): Promise<string[]> {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const base = new URL(url);
  const links: string[] = [];

  (selector ? $(selector).find("a") : $("a")).each((_, el) => {
    const href = $(el).attr("href");

    // $ is now a cheerio fn to find elements. 
    // so for eg $('a') will find every <a> in the html 

    if (!href) return;

    // filtering useless junk links
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
    try {
      links.push(new URL(href, base).toString());
    } catch {
    }
  });

  return [...new Set(links)];
}
