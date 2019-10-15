# Getting Started

Now that we have all our dependencies out of the way, it's time to actually create our project.  Unlike many rust
projects you will see on tutorials, we are going to have a fairly advanced cargo setup.  We will be using a feature of
cargo called workspaces to work on the front and back end.

## Creating your initial project

First, create a directory then create a Cargo.toml file in it:

```
mkdir -p ~/Projects/webcollab
cd ~/Projects/webcollab
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