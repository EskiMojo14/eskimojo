import { parseSync, type Plugin } from "vite-plus";
import { RolldownMagicString } from "vite/rolldown";

const scriptPattern = /\.[cm]?[jt]sx?(?:\?.*)?$/;
const mdxPattern = /mdx/;
const queryPattern = /\?.*$/;

export function mdxContentAttributes(): Plugin {
  return {
    name: "mdx-content-attributes",
    enforce: "pre",
    transform: {
      filter: { id: scriptPattern, code: mdxPattern },
      handler(source, id) {
        const parsed = parseSync(id.replace(queryPattern, ""), source);

        if (parsed.errors.length) {
          this.error({
            id,
            message: parsed.errors.map(({ message }) => message).join("\n"),
          });
        }

        let edited: RolldownMagicString | undefined;

        for (const statement of parsed.program.body) {
          if (statement.type !== "ImportDeclaration") continue;

          const attribute = statement.attributes.find(
            ({ key, value }) =>
              (key.type === "Identifier" ? key.name : key.value) === "type" &&
              value.value === "mdx",
          );

          if (!attribute) continue;

          if (
            !statement.source.value.endsWith(".mdx") ||
            statement.source.value.endsWith(".doc.mdx")
          ) {
            this.error(
              'with { type: "mdx" } requires an application .mdx file, not Storybook docs.',
            );
          }

          if (statement.attributes.length !== 1) {
            this.error('Application MDX imports only support the type: "mdx" attribute.');
          }

          edited ??= new RolldownMagicString(source);
          edited.appendLeft(statement.source.end - 1, "?content");
          edited.overwrite(statement.source.end, statement.end, ";");
        }

        if (!edited) return null;

        return {
          code: edited.toString(),
          map: edited.generateMap({ source: id, includeContent: true, hires: true }).toString(),
        };
      },
    },
  };
}
