# Fork details

Google has removed all CLI features from their
[Squoosh](https://github.com/GoogleChromeLabs/squoosh) project.

This fork merges newer Squoosh browser features with the old removed CLI stuff.
It does not aim to strictly retain compatibility with the original project, but
does aim to preserve old CLI functionality, including the
[UI CLI command generator](https://squoosh.frostoven.com/cli/preview.png).

**Usage:**

- This fork currently runs over at https://squoosh.frostoven.com
- Installation and usage details here: https://squoosh.frostoven.com/cli

### Maintenance info

For now, the core purpose of this fork is to fix bugs in the CLI portion of the
code. The CLI portion had quite a few problems when it was retired from the
original project, many of which are now fixed in this fork.

I maintain these features and fix bugs in my spare time, and generally have my
hands full with an
[indie game I'm making](https://github.com/frostoven/Cosmosis).
Please consider
[supporting my work](https://www.patreon.com/frostoven)
to get more hands on deck; I would like to hire someone to work on this project
full-time so that it may reach its full potential.

### Build info

**Important:** Always delete `.tmp` and `build` before doing a prod build, and
delete `.tmp` if you're experiencing weird bugs during development. It appears
to occasionally get corrupted by some process duplication.

This fork introduces additional pages as static HTML. I didn't have the time to
figure out how to correctly hook this up into the dev process (though it's
integrated into prod); for now, static pages can be tested in dev with
`npx http-server staticPages`.

<br>

_The original README follows below._

---

# [Squoosh]!

[Squoosh] is an image compression web app that reduces image sizes through numerous formats.

# Privacy

Squoosh does not send your image to a server. All image compression processes locally.

However, Squoosh utilizes Google Analytics to collect the following:

- [Basic visitor data](https://support.google.com/analytics/answer/6004245?ref_topic=2919631).
- The before and after image size value.
- If Squoosh PWA, the type of Squoosh installation.
- If Squoosh PWA, the installation time and date.

# Developing

To develop for Squoosh:

1. Clone the repository
1. To install node packages, run:
   ```sh
   npm install
   ```
1. Then build the app by running:
   ```sh
   npm run build
   ```
1. After building, start the development server by running:
   ```sh
   npm run dev
   ```

# Contributing

Squoosh is an open-source project that appreciates all community involvement. To contribute to the project, follow the [contribute guide](/CONTRIBUTING.md).

[squoosh]: https://squoosh.frostoven.com
