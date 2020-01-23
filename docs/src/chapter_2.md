# Setup

Now that you know what you will be building, let's get started setting up all the development
dependencies.  You'll need to have rust and npm set up as well as a few cargo tools

- rustup
- npm (recommend using nvm)
- cargo-generate
- cargo-edit

You can also checkout the github repository of khadga itself

## Installing rustup

If you haven't already, install [rustup][-install-rustup] by following the directions.  If you
already have rustup installed, make sure it's at the latest and greatest (at the time of writing,
this is 1.38).  To update your rustup, do

```bash
rustup self update
rustup update
```

Next, you need to set up the wasm32 target so that rustc can compile to the wasm32-unknown-unknown
target triple

```bash
rustup target add wasm32-unknown-unknown
```

### Other rustup goodies

While we are configuring rustup, we can install some other components as well

```bash
rustup component add llvm-tools-preview rustfmt clippy rls rust-analysis
```

### C(++) toolchain

Some rust crates have native dependencies.  For example the openssl crate will use and link to a
native ssl lib on your system.  Because of this, it's sometimes necessary to have a C(++) toolchain
on your system as well.

## Adding cargo tools

Although cargo is automatically installed by rustup, we are going to install some cargo additions.

```bash
cargo install cargo-generate cargo-edit
```

cargo-generate is a tool that will auto generate a template for you (and is used by wasm-pack) and
cargo-edit is a nice little cargo command that lets you add a dependency to your Cargo.toml (think
npm install).

## Setting up vscode

We'll be using the Microsoft VS Code editor, since it has good support for rust and is relatively
lightweight.  Because we are using some bleeding edge crates, we'll also have to specify some
additional configuration in the rust extension.

First, install [vs code][-vscode-install] itself.  Once you have code installed, we need to install
the rust extension. You can either do this from the command line, or through VS Code itself.

```
code --install-extension rust-lang.rust
```

While we are installing extensions, let's install a couple others that will make our lives easier:

- crates: To make it easier to see what the latest (stable) crate version is at
- lldb debugger: So we can debug our code
- toml: so we can get syntax highlights and coloring for our toml files

```
code --install-extension bungcip.better-toml
code --install-extension vadimcn.vscode-lldb
code --install-extension serayuzgur.crates
```

## Install npm (and nvm)

Since we are building a front end web app, we will be making use of some npm tools.  It's highly
recommended that you use the Node Version Manager (nvm) for this if you are on linux or MacOS.  For
windows users, you'll probably need to use chocolatey to install node (and npm).

### linux and macos

For linux and macos users, you can follow the directions here to install nvm.  Once you install nvm,
you'll need to actually install a node version.

```bash
nvm install 13
nvm use 13
```

### Windows

For windows users, if you don't have chocolatey already, install that.  Then you can install node
(and therefore npm) with:

```bash
choco install nodejs  # make sure you run from an elevated command shell
```

## Installing wasm-pack

For this project, we will be using wasm-pack which will generate a template for us, as well as set
up a webpack config which will automatically compile our rust code to wasm.

You can install [wasm-pack][-wasm-pack] here.

Alternatively, you can install wasm-pack via cargo:

```sh
cargo install wasm-pack
```


[-install-rustup]: https://rustup.rs/
[-vscode-install]: https://code.visualstudio.com/
[-wasm-pack]: https://rustwasm.github.io/wasm-pack/