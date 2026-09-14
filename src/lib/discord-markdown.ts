/**
 * Discord Markdown Parser
 * 
 * Converts Discord-flavored markdown to HTML for preview rendering.
 * Supports Discord-specific elements like mentions, spoilers, and UI elements.
 */

/**
 * Replace template placeholders with example data
 * 
 * @param text - Text containing placeholders like {user}, {server}
 * @returns Text with placeholders replaced by example values
 */
export function replacePlaceholders(text?: string): string {
  if (!text) return '';
  
  return text
    .replace(/{user}/g, '@MaxMustermann')
    .replace(/{username}/g, 'MaxMustermann')
    .replace(/{server}/g, 'ModGuard Community')
    .replace(/{memberCount}/g, '1337');
}

/**
 * Convert Discord markdown and special syntax to HTML
 * 
 * Supports:
 * - Discord UI elements (<id:customize>, <id:guide>, etc.)
 * - User mentions (@username)
 * - Channel mentions (#channel)
 * - Role mentions (<@&id>)
 * - Spoilers (||text||)
 * - Code blocks (```code```)
 * - Inline code (`code`)
 * - Bold (**text**)
 * - Italic (*text* or _text_)
 * - Underline (__text__)
 * - Strikethrough (~~text~~)
 * - Blockquotes (> text)
 * - Links ([text](url))
 * - Auto-links (https://...)
 * 
 * @param text - Discord markdown text
 * @returns HTML string with appropriate classes for styling
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderDiscordMarkdown(text: string): string {
  // Escape the whole input up front so any text that matches none of the
  // markdown patterns below is still HTML-safe when injected via
  // dangerouslySetInnerHTML (e.g. in EmbedPreview). All patterns below are
  // matched against the already-escaped string, so captured groups must NOT
  // be escaped again.
  return escapeHtml(text)
    // Discord UI Elements
    .replace(/&lt;id:customize&gt;/g, '<span class="discord-ui-element">⚙️ Rollen & Kanäle auswählen</span>')
    .replace(/&lt;id:guide&gt;/g, '<span class="discord-ui-element">📖 Server Guide</span>')
    .replace(/&lt;id:browse&gt;/g, '<span class="discord-ui-element">🔍 Kanäle durchsuchen</span>')

    // User Mentions (@username)
    .replace(/@(\w+)/g, (_, name) => `<span class="discord-mention discord-user-mention">@${name}</span>`)

    // Channel Mentions (#channel)
    .replace(/#([\w-]+)/g, (_, name) => `<span class="discord-mention discord-channel-mention">#${name}</span>`)

    // Role Mentions (@Role or <@&id>)
    .replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="discord-mention discord-role-mention">@Rolle</span>')

    // Spoilers ||text||
    .replace(/\|\|(.*?)\|\|/g, (_, content) => `<span class="discord-spoiler">${content}</span>`)

    // Code blocks ```code```
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="discord-code-block"><code>${code}</code></pre>`)

    // Inline code `code`
    .replace(/`([^`]+)`/g, (_, code) => `<code class="discord-inline-code">${code}</code>`)

    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, (_, content) => `<strong>${content}</strong>`)

    // Italic *text* or _text_
    .replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, (_, content) => `<em>${content}</em>`)
    .replace(/(?<!_)_([^_]+)_(?!_)/g, (_, content) => `<em>${content}</em>`)

    // Underline __text__
    .replace(/__(.*?)__/g, (_, content) => `<u>${content}</u>`)

    // Strikethrough ~~text~~
    .replace(/~~(.*?)~~/g, (_, content) => `<s>${content}</s>`)

    // Blockquotes > text
    .replace(/^&gt; (.+)$/gm, (_, content) => `<div class="discord-quote">${content}</div>`)

    // Links [text](url) - validate URL scheme (url/text already escaped)
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (_, linkText, url) => {
      const safeUrl = /^https?:\/\//i.test(url) ? url : '#';
      return `<a href="${safeUrl}" class="discord-link" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    })

    // Auto-links https://...
    .replace(/(https?:\/\/[^\s]+)/g, (_, url) => `<a href="${url}" class="discord-link" target="_blank" rel="noopener noreferrer">${url}</a>`)

    // Line breaks
    .replace(/\n/g, '<br />');
}
