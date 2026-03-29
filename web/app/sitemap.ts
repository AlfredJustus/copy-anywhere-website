import type { MetadataRoute } from "next";
import { MODELS, FORMATS, SITE_URL } from "@/lib/config/models";

export default function sitemap(): MetadataRoute.Sitemap {
  const modelSlugs = Object.keys(MODELS);
  const formatSlugs = Object.keys(FORMATS);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/tools`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/notion`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/obsidian`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/google-docs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/notion-import`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/notion-import/google-docs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/notion-import/pdf`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/pdf-download`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/extension`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const convertPages: MetadataRoute.Sitemap = modelSlugs.flatMap((model) =>
    formatSlugs.map((format) => ({
      url: `${SITE_URL}/convert/${model}/${format}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  const pdfPages: MetadataRoute.Sitemap = formatSlugs.map((format) => ({
    url: `${SITE_URL}/pdf/${format}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const imagePages: MetadataRoute.Sitemap = formatSlugs.map((format) => ({
    url: `${SITE_URL}/image/${format}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...convertPages, ...pdfPages, ...imagePages];
}
