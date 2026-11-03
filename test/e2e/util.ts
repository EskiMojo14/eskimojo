import * as child_process from "child_process";
export function getSystemColorScheme(): "light" | "dark" | undefined {
  if (process.platform === "darwin") {
    try {
      return child_process
        .execFileSync("defaults", ["read", "-g", "AppleInterfaceStyle"], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        })
        .trim()
        .toLowerCase() === "dark"
        ? "dark"
        : "light";
    } catch {
      return undefined;
    }
  }

  if (process.platform === "win32") {
    try {
      return child_process
        .execFileSync(
          "reg",
          [
            "query",
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
            "/v",
            "AppsUseLightTheme",
          ],
          { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
        )
        .includes("0x0")
        ? "dark"
        : "light";
    } catch {
      return undefined;
    }
  }

  try {
    return child_process
      .execFileSync("gsettings", ["get", "org.gnome.desktop.interface", "color-scheme"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
      .includes("prefer-dark")
      ? "dark"
      : "light";
  } catch {
    return undefined;
  }
}
