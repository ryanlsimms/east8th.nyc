const getAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return match?.[1];
};

const escapeHtml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

export function generateSocialPreview(pageHtml) {
  const metadata = Object.fromEntries(
    [...pageHtml.matchAll(/<meta\b[^>]*>/g)]
      .map(([tag]) => [
        getAttribute(tag, 'property') ?? getAttribute(tag, 'name'),
        getAttribute(tag, 'content'),
      ])
      .filter(([name, content]) => name && content),
  );
  const canonicalUrl = pageHtml.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1]
    ?? metadata['og:url'];
  const imageUrl = new URL(metadata['og:image'], canonicalUrl);
  const localImageUrl = `${imageUrl.pathname}${imageUrl.search}`;
  const title = escapeHtml(metadata['og:title']);
  const description = escapeHtml(metadata['og:description']);
  const domain = escapeHtml(new URL(canonicalUrl).hostname);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Messages preview · ${title}</title>
    <style>
      :root {
        color-scheme: light dark;
        --canvas: #f2f2f7;
        --phone: #fff;
        --bar: rgb(249 249 249 / 94%);
        --border: rgb(60 60 67 / 18%);
        --primary: #000;
        --secondary: #6e6e73;
        --card: #e9e9eb;
        --note: #fff;
        --shadow: rgb(0 0 0 / 16%);
      }

      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100vh;
        margin: 0;
        padding: 32px 16px;
        display: grid;
        place-items: center;
        gap: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
        background: var(--canvas);
        color: var(--primary);
      }

      .preview {
        width: min(100%, 390px);
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 48px;
        background: var(--phone);
        box-shadow: 0 18px 60px var(--shadow);
      }

      .status {
        height: 54px;
        padding: 18px 30px 0;
        display: flex;
        justify-content: space-between;
        font-size: 15px;
        font-weight: 600;
      }

      .conversation {
        padding: 8px 16px 18px;
        text-align: center;
        border-bottom: 1px solid var(--border);
        background: var(--bar);
      }

      .avatar {
        width: 42px;
        height: 42px;
        margin: 0 auto 4px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #8e8e93;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
      }

      .conversation-name {
        font-size: 11px;
      }

      .messages {
        min-height: 540px;
        padding: 48px 10px 24px;
      }

      .timestamp {
        margin-bottom: 20px;
        color: var(--secondary);
        font-size: 11px;
        font-weight: 600;
      }

      .card {
        width: 300px;
        margin-left: auto;
        overflow: hidden;
        border-radius: 18px;
        background: var(--card);
        text-align: left;
      }

      .card img {
        width: 100%;
        aspect-ratio: 1200 / 630;
        display: block;
        object-fit: cover;
      }

      .card-copy {
        padding: 11px 13px 12px;
      }

      .domain {
        margin-bottom: 3px;
        color: var(--secondary);
        font-size: 11px;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: 16px;
        line-height: 1.25;
      }

      .description {
        margin: 4px 0 0;
        color: var(--secondary);
        font-size: 13px;
        line-height: 1.3;
      }

      .note {
        width: min(100%, 520px);
        padding: 14px 16px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--note);
        color: var(--secondary);
        font-size: 13px;
        line-height: 1.4;
        text-align: center;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --canvas: #000;
          --phone: #000;
          --bar: rgb(28 28 30 / 94%);
          --border: rgb(84 84 88 / 65%);
          --primary: #fff;
          --secondary: #98989d;
          --card: #2c2c2e;
          --note: #1c1c1e;
          --shadow: rgb(0 0 0 / 70%);
        }
      }
    </style>
  </head>
  <body>
    <main class="preview">
      <div class="status">
        <span>9:41</span>
        <span>● ● ●</span>
      </div>
      <header class="conversation">
        <div class="avatar">E8</div>
        <div class="conversation-name">East 8th ›</div>
      </header>
      <section class="messages">
        <div class="timestamp">Today 9:41 AM</div>
        <article class="card">
          <img src="${escapeHtml(localImageUrl)}" alt="">
          <div class="card-copy">
            <div class="domain">${domain}</div>
            <h1>${title}</h1>
            <p class="description">${description}</p>
          </div>
        </article>
      </section>
    </main>
    <aside class="note">
      Local approximation using this page’s Open Graph metadata. Messages may vary by iOS version and can omit the description.
    </aside>
  </body>
</html>`;
}
