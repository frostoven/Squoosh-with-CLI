# Fork details

Google decided to punish the heathens by removing all CLI features from
Squoosh. This was apparently due to staffing issues.

This is an updated modified version that preserves the old stuff. It does not
aim to preserve strict compatibility, but does aim to preserve old
functionality.

**Important:** Always delete `.tmp` before doing a prod build, and delete
`.tmp` if you're experiencing weird bugs during development. It appears to
occasionally get corrupted by some process duplication.

This fork introduces addition pages as static HTML. I didn't have the time to
figure out how to correctly hook this up into the dev process (though it's
integrated into prod); for now, static pages can be tested in dev with
`npx http-server staticPages`.

The original README follows below.

<br>

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
