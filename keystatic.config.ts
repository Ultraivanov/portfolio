import { config, fields, collection, singleton } from "@keystatic/core";

const githubRepo = (process.env.KEYSTATIC_GITHUB_REPO ||
  "Ultraivanov/portfolio") as `${string}/${string}`;
const useGithub =
  !!process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
  !!process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
  !!process.env.KEYSTATIC_SECRET;

export default config({
  storage: useGithub ? { kind: "github", repo: githubRepo } : { kind: "local" },
  singletons: {
    home: singleton({
      label: "Home",
      path: "src/content/home",
      format: { data: "json" },
      schema: {
        hero: fields.object(
          {
            title: fields.text({ label: "Title" }),
            role: fields.text({ label: "Role" }),
            headline: fields.text({ label: "Headline", multiline: true }),
            subhead: fields.text({ label: "Subhead", multiline: true }),
            primaryCTA: fields.text({ label: "Primary CTA" }),
            secondaryCTA: fields.text({ label: "Secondary CTA" }),
          },
          { label: "Hero" },
        ),
        intro: fields.object(
          {
            name: fields.text({ label: "Name" }),
            role: fields.text({ label: "Role" }),
            avatarSrc: fields.text({
              label: "Avatar src",
              description: "Path in /public, e.g. /avatar.png",
            }),
            highlights: fields.array(fields.text({ label: "Highlight" }), {
              label: "Highlights",
            }),
          },
          { label: "Intro" },
        ),
        valueProps: fields.array(
          fields.object(
            {
              title: fields.text({ label: "Title" }),
              description: fields.text({
                label: "Description",
                multiline: true,
              }),
            },
            { label: "Value item" },
          ),
          { label: "Value props" },
        ),
      },
    }),
  },
  collections: {
    cases: collection({
      label: "Cases",
      path: "src/content/cases/*",
      template: "src/content/templates/case",
      slugField: "slug",
      format: { data: "json" },
      schema: {
        slug: fields.slug({
          name: {
            label: "Slug source (paste Title)",
            description: "Paste the Title here once, then click Regenerate.",
          },
          slug: { label: "Slug value (auto)" },
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
