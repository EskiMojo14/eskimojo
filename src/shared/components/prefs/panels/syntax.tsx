import { useId } from "react";
import BEMHelper from "react-bem-helper";

import { List, ListItem, ListItemContent } from "#/shared/components/list";
import { useSyntax, useMatchLight } from "#/shared/components/prefs/context";
import SyntaxPreview from "#/shared/components/prefs/syntax-preview.mdx";
import { SelectMenu } from "#/shared/components/select-menu";
import { Switch } from "#/shared/components/switch";
import { MdSymbol } from "#/shared/components/symbol";
import { TabPanel } from "#/shared/components/tabs";
import { syntaxSchema, syntaxLabels } from "#/shared/constants/prefs";

const preferencesBem = BEMHelper("preferences-dialog");

export function SyntaxPanel() {
  const { syntax, setSyntax } = useSyntax();
  const { matchLight, setMatchLight } = useMatchLight();
  const matchLightId = useId();
  const matchLightLabelId = useId();

  return (
    <TabPanel value="syntax">
      <List {...preferencesBem({ element: "syntax-settings" })}>
        <ListItem>
          <SelectMenu
            {...preferencesBem({ element: "select", modifier: "always" })}
            label="Syntax"
            name="syntax"
            value={syntax}
            onChange={setSyntax}
            options={syntaxSchema.options.map((value) => ({
              value,
              label: syntaxLabels[value],
              supportingText: value === "nosferatu" ? "High contrast" : undefined,
              icon: <MdSymbol>code</MdSymbol>,
            }))}
          />
        </ListItem>
        <ListItem>
          <label htmlFor={matchLightId}>
            <ListItemContent
              headline={<span id={matchLightLabelId}>Match light theme</span>}
              supportingText="Use Alucard theme for light mode"
              leading={<MdSymbol>light_mode</MdSymbol>}
              trailing={
                <Switch
                  id={matchLightId}
                  aria-labelledby={matchLightLabelId}
                  name="matchLight"
                  checked={matchLight === "on"}
                  onChange={(event) => setMatchLight(event.currentTarget.checked ? "on" : "off")}
                  onIcon={<MdSymbol>check</MdSymbol>}
                  offIcon={<MdSymbol>close</MdSymbol>}
                />
              }
            />
          </label>
        </ListItem>
        <ListItem {...preferencesBem({ element: "syntax-preview" })}>
          <SyntaxPreview />
        </ListItem>
      </List>
    </TabPanel>
  );
}
