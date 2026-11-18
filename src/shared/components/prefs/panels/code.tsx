import type { ComponentPropsWithoutRef } from "react";
import BEMHelper from "react-bem-helper";

import CodePreview from "#/shared/components/prefs/code-preview.mdx" with { type: "mdx" };
import { useDarkSyntax, useLightSyntax } from "#/shared/components/prefs/context";
import { SelectMenu } from "#/shared/components/select-menu";
import { MdSymbol } from "#/shared/components/symbol";
import { TabPanel } from "#/shared/components/tabs";
import {
  darkSyntaxOptions,
  lightSyntaxOptions,
  syntaxLabels,
  type DarkSyntax,
  type LightSyntax,
} from "#/shared/constants/prefs";

const preferencesBem = BEMHelper("preferences-dialog");

function syntaxOption<Value extends LightSyntax | DarkSyntax>(value: Value) {
  const { label, color } = syntaxLabels[value];
  return {
    value,
    label,
    supportingText: value === "nosferatu" ? "High contrast" : undefined,
    icon: <MdSymbol style={{ color: `var(--fixed-${color})` }}>palette</MdSymbol>,
  };
}

const lightOptions = lightSyntaxOptions.options.map(syntaxOption<LightSyntax>);
const darkOptions = darkSyntaxOptions.options.map(syntaxOption<DarkSyntax>);

function CodePreviewBlock(props: ComponentPropsWithoutRef<"pre">) {
  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-tabindex -- Keep preformatted code keyboard-scrollable and named.
  return <pre {...props} role="region" aria-label="Code preview" tabIndex={0} />;
}

export function CodePanel() {
  const { lightSyntax, setLightSyntax } = useLightSyntax();
  const { darkSyntax, setDarkSyntax } = useDarkSyntax();

  return (
    <TabPanel value="code">
      <div {...preferencesBem({ element: "code-settings" })}>
        <SelectMenu
          {...preferencesBem({ element: "select", modifier: "always" })}
          label="Light theme"
          name="lightSyntax"
          value={lightSyntax}
          onChange={setLightSyntax}
          options={lightOptions}
        />
        <SelectMenu
          {...preferencesBem({ element: "select", modifier: "always" })}
          label="Dark theme"
          name="darkSyntax"
          value={darkSyntax}
          onChange={setDarkSyntax}
          options={darkOptions}
        />
        <div {...preferencesBem({ element: "code-preview" })}>
          <CodePreview components={{ pre: CodePreviewBlock }} />
        </div>
      </div>
    </TabPanel>
  );
}
