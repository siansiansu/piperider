# PipeRider Report

The FE source code that the CLI uses to output report views

## (Prerequisite) Generate reports with the local CLI

**To develop the CLI alongside FE static reports.
This is <span style="color: red">REQUIRED</span> for serving your apps, as it depends on CLI's outputs:**

1. Go to the root of this repo
1. Initialize Python's Virtual Environment: `python -m venv .venv`
1. Activate the Virtual Environment: `source .venv/bin/activate`
1. Install Python packages: `pip install -r requirements.txt` (now you are running the CLI from the python source code)
1. Add a local data source (see [this quickstart step](https://docs.piperider.io/quick-start#prepare-sqlite-database))
1. Run `piperider init` (creates `.piperider/` dir)
1. Generate your Single and Comparison reports (`piperider run` for single; `piperider compare-reports` for comparison)
1. Now, you are ready. Proceed to the FE side. `cd static_report`

### Installation

```sh
$ npm install
```

## Development

### Run the FE Static Reports

> **Note**
> By this point, you **MUST** have first generated both comparison and single reports from `piperider` CLI (see prev section).

All `start:*` scripts will run with `setup` script to setup your development environment.

The `setup` scripts will do the following, sourcing from the project's root `.piperider/` (created by `piperider init`):

1. Get both latest schema of single & comparison from raw CLI-generated report data
   - requires `piperider run` for single
   - requires `piperider compare-report` for comparison
1. Get the latest single/comparison TS typings from that generated schema (`piperider run`)
   - generated typings are exposed at `src/sdlc/global.d.ts`
1. Embed the latest available single/comparison raw data into index.html

### If Things Break

_Keep in mind that this SDLC is not future-proof, as the CLI project is still evolving fast. If things suddenly break, most likely it is due to file path renames or changes. When that happens and you need to make changes to the above, see the `package.json` and/or the `sdlc/*.js` scripts to modify._

### Run FE Static Reports

You should now be able to run both apps on separate terminals.

#### Single Report

```sh
# term@1
$ npm run start:single
```

#### Comparsion Report

```sh
# term@2
$ npm run start:comparison
```

## Build (especially before pushing changes)

> **Note**
>
> Generated **single report** and **comparison report** will be moved into [piperider_cli/data/report](https://github.com/InfuseAI/piperider/tree/main/piperider_cli/data/report).
> Note that `prebuild` will strip index.html and its script variable values. Please restart a `start:*` script to repopulate values.

### Single Reports

```sh
$ npm run build:single
```

### Comparison Reports

```sh
$ npm run build:comparison
```

### Both Reports

```sh
$ npm run build
```
