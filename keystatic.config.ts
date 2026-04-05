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
            ctaLabel: fields.text({
              label: "CTA label",
              description: "Primary button text.",
            }),
            ctaHref: fields.text({
              label: "CTA href",
              description: "Primary button link, e.g. /contact.",
            }),
            secondaryCtaLabel: fields.text({
              label: "Secondary CTA label",
              description: "Secondary text link label.",
            }),
            secondaryCtaHref: fields.text({
              label: "Secondary CTA href",
              description: "Secondary link target, e.g. /cv.",
            }),
          },
          { label: "Hero" },
        ),
        about: fields.object(
          {
            name: fields.text({
              label: "Name",
              description: "Displayed next to the avatar.",
            }),
            role: fields.text({
              label: "Role",
              description: "Short role line under the name.",
            }),
            avatarSrc: fields.text({
              label: "Avatar src",
              description: "Path in /public, e.g. /home/avatar.png",
            }),
            description: fields.text({
              label: "Description",
              multiline: true,
              description: "About paragraph under the name/role.",
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
            label: fields.text({
              label: "Label",
              description: "Section label (e.g. / skills).",
            }),
            groups: fields.array(
              fields.object(
                {
                  title: fields.text({
                    label: "Title",
                    description: "Group heading.",
                  }),
                  items: fields.array(
                    fields.text({ label: "Item", description: "Single skill." }),
                    {
                      label: "Items",
                    },
                  ),
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
            label: fields.text({
              label: "Label",
              description: "Section label (e.g. / tools).",
            }),
            groups: fields.array(
              fields.object(
                {
                  title: fields.text({
                    label: "Title",
                    validation: { isRequired: false },
                    description: "Optional group title.",
                  }),
                  items: fields.array(
                    fields.text({ label: "Item", description: "Single tool." }),
                    {
                      label: "Items",
                    },
                  ),
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
            label: fields.text({
              label: "Label",
              description: "Section label (e.g. / past projects).",
            }),
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
                  title: fields.text({
                    label: "Title",
                    description: "Project title shown on the card.",
                  }),
                  subtitle: fields.text({
                    label: "Subtitle",
                    description: "Short description under the title.",
                  }),
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
                    description: "Card link (optional).",
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
            label: fields.text({
              label: "Label",
              description: "Section label (e.g. / resources).",
            }),
            items: fields.array(
              fields.object(
                {
                  title: fields.text({
                    label: "Title",
                    description: "Resource title.",
                  }),
                  description: fields.text({
                    label: "Description",
                    multiline: true,
                    description: "Short description shown on the card.",
                  }),
                  linkLabel: fields.text({
                    label: "Link label",
                    description: "Short link label (shown with arrow).",
                  }),
                  href: fields.text({
                    label: "Href",
                    description: "Resource link target.",
                  }),
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
            titleLine1: fields.text({
              label: "Title line 1",
              description: "First line of the CTA title.",
            }),
            titleLine2: fields.text({
              label: "Title line 2",
              description: "Second line of the CTA title.",
            }),
            highlight: fields.text({
              label: "Highlight word",
              description: "Word highlighted in the CTA title.",
            }),
            description: fields.text({
              label: "Description",
              multiline: true,
              description: "CTA supporting text.",
            }),
            links: fields.array(
              fields.object(
                {
                  label: fields.text({
                    label: "Label",
                    description: "Footer link label.",
                  }),
                  href: fields.text({
                    label: "Href",
                    description: "Footer link target.",
                  }),
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
          slug: {
            label: "Slug value (auto)",
            description: "Auto-generated URL slug.",
          },
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
              label: fields.text({
                label: "Label",
                description: "Fact label shown in the left column.",
              }),
              value: fields.array(fields.text({ label: "Value" }), {
                label: "Value",
                description: "One or more values for the fact.",
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
              title: fields.text({
                label: "Title",
                description: "Section heading.",
              }),
              blocks: fields.blocks(
                {
                  paragraph: {
                    label: "Paragraph",
                    schema: fields.object({
                      text: fields.text({
                        label: "Text",
                        multiline: true,
                        description: "Paragraph text.",
                      }),
                    }),
                  },
                  list: {
                    label: "List",
                    schema: fields.object({
                      items: fields.array(fields.text({ label: "Item" }), {
                        label: "Items",
                        description: "List items.",
                      }),
                    }),
                  },
                  link: {
                    label: "Link",
                    schema: fields.object({
                      label: fields.text({
                        label: "Label",
                        description: "Link label.",
                      }),
                      href: fields.url({
                        label: "Href",
                        validation: { isRequired: false },
                        description: "Link URL.",
                      }),
                    }),
                  },
                  media: {
                    label: "Media",
                    schema: fields.object({
                      src: fields.text({
                        label: "Src",
                        description: "Path in /public, e.g. /cases/rzd/image.png",
                      }),
                      alt: fields.text({
                        label: "Alt",
                        description: "Alt text for the image (SEO + accessibility).",
                      }),
                      caption: fields.text({
                        label: "Caption",
                        multiline: true,
                        description: "Optional caption under the image.",
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
