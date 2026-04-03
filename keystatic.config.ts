import { config, fields, collection } from "@keystatic/core";
import type { RepoConfig } from "@keystatic/core";

const githubRepo = (process.env.KEYSTATIC_GITHUB_REPO ||
  "Ultraivanov/portfolio") as RepoConfig;
const useGithub =
  !!process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
  !!process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
  !!process.env.KEYSTATIC_SECRET;

export default config({
  storage: useGithub ? { kind: "github", repo: githubRepo } : { kind: "local" },
  collections: {
    cases: collection({
      label: "Cases",
      path: "src/content/cases/*",
      slugField: "slug",
      format: { data: "json" },
      schema: {
        slug: fields.slug({
          name: { label: "Slug" },
          slug: { label: "Slug value" },
        }),
        title: fields.text({
          label: "Title",
          validation: { isRequired: true },
        }),
        subtitle: fields.text({
          label: "Subtitle",
          multiline: true,
        }),
        coverSrc: fields.text({
          label: "Cover src",
          description: "Path in /public, e.g. /cases/rzd/cover.png",
        }),
        coverAlt: fields.text({ label: "Cover alt" }),
        facts: fields.array(
          fields.object(
            {
              label: fields.text({ label: "Label" }),
              value: fields.array(fields.text({ label: "Value" }), {
                label: "Value",
              }),
              href: fields.url({
                label: "Href",
                description: "Optional link for the fact value",
                validation: { isRequired: false },
              }),
            },
            { label: "Fact" },
          ),
          { label: "Facts" },
        ),
        sections: fields.array(
          fields.object(
            {
              title: fields.text({ label: "Title" }),
              body: fields.array(
                fields.text({ label: "Paragraph", multiline: true }),
                { label: "Body" },
              ),
              list: fields.array(fields.text({ label: "Item" }), {
                label: "List",
              }),
              links: fields.array(
                fields.object(
                  {
                    label: fields.text({ label: "Label" }),
                    href: fields.url({
                      label: "Href",
                      validation: { isRequired: false },
                    }),
                  },
                  { label: "Link" },
                ),
                { label: "Links" },
              ),
              media: fields.array(
                fields.object(
                  {
                    src: fields.text({ label: "Src" }),
                    alt: fields.text({ label: "Alt" }),
                    caption: fields.text({
                      label: "Caption",
                      multiline: true,
                    }),
                  },
                  { label: "Media item" },
                ),
                { label: "Media" },
              ),
              blocks: fields.array(
                fields.object(
                  {
                    type: fields.select({
                      label: "Type",
                      options: [
                        { label: "Paragraph", value: "paragraph" },
                        { label: "List", value: "list" },
                        { label: "Link", value: "link" },
                        { label: "Media", value: "media" },
                      ],
                      defaultValue: "paragraph",
                    }),
                    text: fields.text({
                      label: "Text",
                      multiline: true,
                    }),
                    items: fields.array(fields.text({ label: "Item" }), {
                      label: "Items",
                    }),
                    label: fields.text({ label: "Label" }),
                    href: fields.url({ label: "Href" }),
                    src: fields.text({ label: "Src" }),
                    alt: fields.text({ label: "Alt" }),
                    caption: fields.text({
                      label: "Caption",
                      multiline: true,
                    }),
                  },
                  { label: "Block" },
                ),
                { label: "Blocks" },
              ),
            },
            { label: "Section" },
          ),
          { label: "Sections" },
        ),
      },
    }),
  },
});
