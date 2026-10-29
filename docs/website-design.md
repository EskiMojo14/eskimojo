# Website design brief

## Status

This brief records the agreed design direction for the new `eskimojo` personal
website. It is a product/design specification, not a claim that the described
pages or behaviors have been implemented.

## Purpose and audience

The site is a personal home base for a broad mix of visitors: people who know
`eskimojo`, people discovering the site, peers, and visitors interested in the
work and interests represented there.

The home page should quickly explain whose site it is. It should feel personal
and welcoming without losing the recognizable monospace and data-oriented
character of the current site.

## Design principles

1. **Personal first:** lead with a concise, friendly first-person introduction,
   not a statistics dashboard.
2. **Clear paths:** keep Projects, Music, and Gigs easy to reach through the
   persistent navigation.
3. **Familiar, but more welcoming:** retain selected visual cues from the
   existing site while making content and navigation easier to approach.
4. **Useful data, not data for its own sake:** keep the Music and Gigs details
   visitors value, but organize them as browsable sections rather than letting
   charts dominate the entire experience.
5. **Accessible alternatives:** charts and visualizations must not be the only
   way to understand information.

## Visual direction

Use Material Design 3 as an adaptable foundation, not as a requirement to make
the site look like an application dashboard. Apply its design-system approach
to color, typography, shape, motion, and component consistency while retaining
a distinct personal identity.

Use the existing Paper Mono typeface throughout the site. Use its non-code font
features for prose and other reading-intensive content; preserve the
monospace character without treating every text block as code.

The visual language should balance:

- expressive personal typography and concise prose;
- readable content widths and clear hierarchy;
- restrained surfaces, shapes, and data visualizations;
- a small number of recognizable code-/data-inspired details.

## Navigation and page roles

The primary navigation should provide clear destinations for:

- **Home:** personal introduction and About content. The persistent navigation
  provides the paths to the other sections; there is no separate About
  destination.
- **Projects:** a curated selection of work and open-source contributions.
- **Music:** Last.fm listening summaries.
- **Gigs:** an event archive and its artist, venue, and city views.

Contact is provided by the homepage's "Find me elsewhere" profile cards and
the shared footer links, not a separate page or navigation item. Do not publish
a direct email address.

The homepage combines an illustrated introduction, biography, interests list,
and social profile cards without repeating the primary navigation.

The current application uses TanStack Router's file-based routing, with Home at
`/`, Projects at `/projects`, Music at `/music`, and Gigs at `/gigs`.

## Theme and contrast controls

Provide separate controls for color theme and contrast:

- **Theme:** Light and dark. Follow the visitor's system preference until they
  choose manually; remember a manual choice on that browser.
- **Contrast:** Standard, Medium, and High. Use the system preference as the
  default until the visitor chooses manually; remember a manual choice on that
  browser.

Keep these controls understandable and usable without obscuring the site's
content. Preserve the repository's existing theme and contrast conventions
where practical, including system preference support.

## Accessibility expectations

- Use semantic page structure and accessible names for navigation and controls.
- Make interactive tab/view controls keyboard-operable and expose their state
  to assistive technology.
- Provide an accessible text/list alternative for the Gigs-by-city
  visualization.
- Keep meaning available without color alone.
- Respect reduced-motion preferences and avoid requiring animation to
  understand content.
- Verify that text and interactive elements remain legible across theme and
  contrast choices.

## Out of scope for this brief

This brief does not decide exact page copy, final route paths, component
implementation, responsive breakpoints, or animation details. Those should
follow these principles and be resolved during implementation where needed.
