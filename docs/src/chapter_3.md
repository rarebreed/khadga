# Setting up the project

Now that we have all our dependencies out of the way, it's time to actually create our project.
Unlike many rust projects you will see on tutorials, we are going to have a fairly advanced cargo
setup.  We will be using a feature of cargo called workspaces to work on the front and back end.

## Creating your initial project

First, create a directory then create a Cargo.toml file in it:

```
mkdir -p ~/Projects/weblearn
cd ~/Projects/weblearn
touch Cargo.toml
```

The Cargo.toml file will need to be edited to look something like this:

```toml
[workspace]

members = [
  "backend",
  "frontend"
]
```

## Generating the machine learning project

Since this is a (partially) isomorphic web projectrunning rust on the backend, and a combined
webassembly/typescript front end (and a forthcoming rust IoT microcontroller sensor), we need a way
to generate the the frontend project so that our rust code compiles to wasm, and all the glue clode
to call to/from javascript functions can be done.

To set up the front end project you can go into your weblearn directory and run
the following:

```bash
npm init rust-webpack mllib
```

This will generate a wasmpack style project that contains the code necessary for a combined rust and
javascript project.  Later, we will go into what files were generated, and how to build this
workspace, but for now, you can browse this new frontend directory.

### Using typescript 

However, we are using rust, so why would we want to use javascript with it's dynamic types? We will
enhance our project build code by allowing us to use typescript.

We will use a project called create-base-ts for this purpose.  It will scaffold a project for use
with typescript.

```sh
npm init base-ts frontend
npx tsc
```

The above commands will install typescript as a dev-dependency in our package.json file, and the
`npx tsc` command will build our base project

We will tweak some of the configuration parameters later, once we build the project for the first
time.

## Generating the backend project

The backend will be a typical rust web server using actix-web, so we can just use cargo for this:

```bash
cd /path/to/weblearn
cargo new backend
```