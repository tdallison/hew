# Setting up Hew on Windows

These notes describe how to build and run this checkout locally. Run commands
from PowerShell in the repository root. The first build downloads dependencies
and can take a while.

## Prerequisites

- Node.js: use the version in `.node-version` (Node 26 was present on the
  machine used for this setup).
- Rust via rustup: `rust-toolchain.toml` pins the compiler and WebAssembly
  target. Windows builds also require the Visual Studio C++ Build Tools and
  Windows SDK.
- `wasm-pack`, on `PATH`.
- pnpm: the root `package.json` pins the version; the commands below use
  `npx` to run that version without a global install.
- Internet access for the initial toolchain and dependency downloads.

On this machine the first build failed with `link.exe not found`, confirming
that the Microsoft C++ linker was missing. The following command was used to
start installation of the C++ Build Tools and recommended Windows SDK:

```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --silent --accept-package-agreements --accept-source-agreements --override '--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended'
```

This is a system-wide installation and may require Windows administrator
approval. A restart or a new terminal may be needed after installation.
The installation completed successfully. The initial WebAssembly build took
about nine minutes on this machine, including optimization; the frontend
production build completed successfully afterward.

For the native desktop application, also install the Tauri platform
prerequisites described at https://v2.tauri.app/start/prerequisites/.

## Install and run

With Rust, the C++ build tools, and `wasm-pack` installed and available on
`PATH`, run:

```powershell
npx --yes pnpm@11.20.0 install --frozen-lockfile
npx --yes pnpm@11.20.0 --dir app build
npx --yes pnpm@11.20.0 --dir app dev
```

The focused camera tests can be run with:

```powershell
npx --yes pnpm@11.20.0 --dir app exec vitest run src/viewport/cameraRig.test.ts src/viewport/orbitDragSwitch.test.ts
```

Open the local address printed by Vite. The build and dev scripts compile the
Rust kernel to WebAssembly automatically when it is missing or out of date.
Keep the dev server running while using the app; press Ctrl+C to stop it.
On this machine, the local development server started at
`http://127.0.0.1:5173/` and returned HTTP 200.

For the desktop application, after installing Tauri prerequisites:

```powershell
npx --yes pnpm@11.20.0 --dir shells/tauri dev
```

## Project-local tool setup used on this machine

Rust was not initially installed, so rustup was installed under the ignored
`target` directory instead of modifying the user's global PATH. `wasm-pack`
was likewise installed under `target/tool-setup`. The following commands
recreate that arrangement; they do not install the Visual Studio C++ tools.

```powershell
New-Item -ItemType Directory -Force target/tool-setup | Out-Null
Invoke-WebRequest https://win.rustup.rs/x86_64 -OutFile target/tool-setup/rustup-init.exe
$env:RUSTUP_HOME = Join-Path $PWD 'target/rustup'
$env:CARGO_HOME = Join-Path $PWD 'target/cargo'
& target/tool-setup/rustup-init.exe -y --no-modify-path --profile minimal --default-toolchain none
& "$env:CARGO_HOME/bin/rustup.exe" toolchain install 1.97.1 --profile minimal --target wasm32-unknown-unknown
npm install --prefix target/tool-setup --no-save wasm-pack
$env:Path = "$env:CARGO_HOME/bin;$(Join-Path $PWD 'target/tool-setup/node_modules/wasm-pack/binary');$env:Path"
```

Reapply the three environment variables (`RUSTUP_HOME`, `CARGO_HOME`, and
`Path`) in each new PowerShell session. The `target` directory is generated
and ignored by Git; deleting it also deletes these local tools. The project
toolchain file may request additional rustup components on first use.

## Git remotes

This checkout uses `origin` for `https://github.com/tdallison/hew.git` and
`upstream` for `https://github.com/hew3d/hew.git`. Use `git status` to see
local changes. Generated dependencies and build outputs are ignored by Git.
