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
            titleImageSrc: fields.text({
              label: "Title image src",
              description: "Path in /public, e.g. /home/hero-title.png",
            }),
            titleImageAlt: fields.text({
              label: "Title image alt",
              description: "Alt text for the hero title (SEO + accessibility).",
            }),
            headline: fields.text({
              label: "Headline",
              multiline: true,
              description: "Main line under the hero title.",
            }),
            ctaLabel: fields.text({ label: "CTA label" }),
            ctaHref: fields.text({ label: "CTA href" }),
            secondaryCtaLabel: fields.text({
              label: "Secondary CTA label",
            }),
            secondaryCtaHref: fields.text({
              label: "Secondary CTA href",
            }),
          },
          { label: "Hero" },
        ),
        about: fields.object(
          {
            name: fields.text({ label: "Name" }),
            role: fields.text({ label: "Role" }),
            avatarSrc: fields.text({
              label: "Avatar src",
              description: "Path in /public, e.g. /home/avatar.png",
            }),
            description: fields.text({
              label: "Description",
              multiline: true,
            }),
          },
          { label: "About" },
        ),
        cover: fields.object(
          {
            src: fields.text({
              label: "Cover src",
              description: "Path in /public, e.g. /home/cover.png",
            }),
            alt: fields.text({
              label: "Cover alt",
              description: "Alt text for the cover image (SEO + accessibility).",
            }),
          },
          { label: "Cover" },
        ),
        skills: fields.object(
          {
            label: fields.text({ label: "Label" }),
            groups: fields.array(
              fields.object(
                {
                  title: fields.text({ label: "Title" }),
                  items: fields.array(fields.text({ label: "Item" }), {
                    label: "Items",
                  }),
                },
                { label: "Group" },
              ),
              { label: "Groups" },
            ),
          },
          { label: "Skills" },
        ),
        tools: fields.object(
          {
            label: fields.text({ label: "Label" }),
            groups: fields.array(
              fields.object(
                {
                  title: fields.text({
                    label: "Title",
                    validation: { isRequired: false },
                  }),
                  items: fields.array(fields.text({ label: "Item" }), {
                    label: "Items",
                  }),
                },
                { label: "Group" },
              ),
              { label: "Groups" },
            ),
          },
          { label: "Tools" },
        ),
        pastProjects: fields.object(
          {
            label: fields.text({ label: "Label" }),
            maxItems: fields.integer({
              label: "Max items",
              description: "How many items to show on the homepage (e.g. 5)",
              defaultValue: 5,
              validation: { isRequired: false, min: 1, max: 6 },
            }),
            featuredCases: fields.array(
              fields.relationship({
                label: "Case",
                collection: "cases",
              }),
              {
                label: "Featured cases",
                description:
                  "Select cases to show on the homepage (overrides manual items).",
                validation: { length: { max: 6 } },
              },
            ),
            items: fields.array(
              fields.object(
                {
                  title: fields.text({ label: "Title" }),
                  subtitle: fields.text({ label: "Subtitle" }),
                  imageSrc: fields.text({
                    label: "Image src",
                    description: "Path in /public, e.g. /home/project-alpha.png",
                  }),
                  imageAlt: fields.text({
                    label: "Image alt",
                    description: "Alt text for the preview image (SEO + accessibility).",
                  }),
                  href: fields.text({
                    label: "Href",
                    validation: { isRequired: false },
                  }),
                },
                { label: "Item" },
              ),
              { label: "Items" },
            ),
          },
          { label: "Past projects" },
        ),
        resources: fields.object(
          {
            label: fields.text({ label: "Label" }),
            items: fields.array(
              fields.object(
                {
                  title: fields.text({ label: "Title" }),
                  description: fields.text({
                    label: "Description",
                    multiline: true,
                  }),
                  linkLabel: fields.text({ label: "Link label" }),
                  href: fields.text({ label: "Href" }),
                },
                { label: "Item" },
              ),
              { label: "Items", validation: { length: { max: 4 } } },
            ),
          },
          { label: "Resources" },
        ),
        cta: fields.object(
          {
            titleLine1: fields.text({ label: "Title line 1" }),
            titleLine2: fields.text({ label: "Title line 2" }),
            highlight: fields.text({ label: "Highlight word" }),
            description: fields.text({
              label: "Description",
              multiline: true,
            }),
            links: fields.array(
              fields.object(
                {
                  label: fields.text({ label: "Label" }),
                  href: fields.text({ label: "Href" }),
                  muted: fields.checkbox({
                    label: "Muted style",
                    defaultValue: false,
                  }),
                },
                { label: "Link" },
              ),
              { label: "Links" },
            ),
          },
          { label: "CTA" },
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
          description: "Case study title shown on the page and in listings.",
        }),
        subtitle: fields.text({
          label: "Subtitle",
          multiline: true,
          description: "Short case summary shown under the title.",
        }),
        coverSrc: fields.text({
          label: "Cover src",
          description: "Path in /public, e.g. /cases/rzd/cover.png",
        }),
        coverAlt: fields.text({
          label: "Cover alt",
          description: "Alt text for the cover image (SEO + accessibility).",
        }),
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
                      alt: fields.text({
                        label: "Alt",
                        description: "Alt text for the image (SEO + accessibility).",
                      }),
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
