const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    // Declare the custom protocol so macOS knows this app handles fb-ads:// URLs.
    // Without this in Info.plist, setAsDefaultProtocolClient() silently fails and
    // macOS never routes the OAuth redirect here.
    extendInfo: {
      CFBundleURLTypes: [{
        CFBundleURLSchemes: ['fb-ads'],
        CFBundleURLName: 'com.electron.ai-social-media-ads',
        CFBundleTypeRole: 'Viewer',
      }],
    },
    // Exclude worktrees, dev tooling and test files from the package.
    ignore: [
      /^\/\.claude/,
      /^\/\.git/,
      /^\/out/,
      /^\/src/,
      /^\/e2e/,
      /^\/node_modules\/\.cache/,
      /\.spec\.ts$/,
      /\.map$/,
    ],
  },
  hooks: {
    /**
     * Builds the Angular app before packaging so the bundled dist is always
     * up to date with the current source.  Must run in generateAssets (before
     * the package step) — preMake fires after packaging and would bundle stale
     * dist output.
     */
    generateAssets: async () => {
      const { execSync } = require('child_process');
      console.log('[forge] Running ng build…');
      execSync('npm run build', { stdio: 'inherit' });
    },

    /**
     * Re-sign the packaged .app with ad-hoc identity after the FusesPlugin has
     * modified the Electron binaries.  @electron/osx-sign (used by packagerConfig.osxSign)
     * runs before Fuses modifies the binary, so its signature is immediately stale.
     * Instead we sign here — after all plugins — working inside-out:
     *   1. frameworks (Electron Framework, Squirrel, …)
     *   2. helper .app bundles
     *   3. outer .app bundle
     * This ensures every nested binary shares the same ad-hoc Team ID (none), which
     * is what macOS / DYLD require to load them together at runtime.
     */
    postPackage: async (_forgeConfig, options) => {
      if (process.platform !== 'darwin') return;

      for (const outputPath of options.outputPaths) {
        const appPath = fs.readdirSync(outputPath)
          .map(f => path.join(outputPath, f))
          .find(f => f.endsWith('.app'));
        if (!appPath) continue;

        const frameworksDir = path.join(appPath, 'Contents', 'Frameworks');

        // Sign every .framework inside-out
        if (fs.existsSync(frameworksDir)) {
          for (const entry of fs.readdirSync(frameworksDir)) {
            const full = path.join(frameworksDir, entry);
            if (entry.endsWith('.framework') || entry.endsWith('.app')) {
              execSync(`codesign --force --deep -s - "${full}"`, { stdio: 'inherit' });
            }
          }
        }

        // Sign the outer bundle last
        execSync(`codesign --force -s - "${appPath}"`, { stdio: 'inherit' });

        console.log(`[forge] Ad-hoc signed: ${appPath}`);
      }
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
