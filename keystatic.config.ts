import { config, fields, collection } from "@keystatic/core";

const githubRepo = (process.env.KEYSTATIC_GITHUB_REPO ||
  "Ultraivanov/portfolio") as `${string}/${string}`;
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
      template: "src/content/templates/case",
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
              blocks: fields.blocks(
                {
                  paragraph: {
                    label: "Paragraph",
                    schema: fields.object({
                      text: fields.text({
                        label: "Text",
                        multiline: true,
                      }),
                    }),
                  },
                  list: {
                    label: "List",
                    schema: fields.object({
                      items: fields.array(fields.text({ label: "Item" }), {
                        label: "Items",
                      }),
                    }),
                  },
                  link: {
                    label: "Link",
                    schema: fields.object({
                      label: fields.text({ label: "Label" }),
                      href: fields.url({
                        label: "Href",
                        validation: { isRequired: false },
                      }),
                    }),
                  },
                  media: {
                    label: "Media",
                    schema: fields.object({
                      src: fields.text({ label: "Src" }),
                      alt: fields.text({ label: "Alt" }),
                      caption: fields.text({
                        label: "Caption",
                        multiline: true,
                      }),
                    }),
                  },
                },
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
