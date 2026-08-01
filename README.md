# Astro Starter Kit: Minimal

## Prayer wall (shared)

1. Create a free [Supabase](https://supabase.com) project.
2. Run `supabase/prayer-wall.sql` in the SQL editor.
3. Copy `.env.example` → `.env` and set `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY`.
4. Restart `astro dev`.

Without those env vars, the Prayer wall runs in **demo mode** (this device only). The private “With the Lord” journal always stays on-device.

## Daily reminders (optional)

On **Journey**, users can turn on a daily reminder (default **off**).

- Works via the service worker + browser notifications (best on Chrome / Edge / installed PWA).
- Optional: set `PUBLIC_ONESIGNAL_APP_ID` for OneSignal web push, then restart the app.

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
