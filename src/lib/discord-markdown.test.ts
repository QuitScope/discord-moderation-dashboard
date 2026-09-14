import { describe, it, expect } from 'vitest';
import { replacePlaceholders, renderDiscordMarkdown } from './discord-markdown';

describe('replacePlaceholders', () => {
  it('should return empty string for undefined input', () => {
    expect(replacePlaceholders()).toBe('');
    expect(replacePlaceholders(undefined)).toBe('');
  });

  it('should replace {user} placeholder', () => {
    const result = replacePlaceholders('Welcome {user}!');
    expect(result).toBe('Welcome @MaxMustermann!');
  });

  it('should replace {username} placeholder', () => {
    const result = replacePlaceholders('Hello {username}');
    expect(result).toBe('Hello MaxMustermann');
  });

  it('should replace {server} placeholder', () => {
    const result = replacePlaceholders('Welcome to {server}');
    expect(result).toBe('Welcome to ModGuard Community');
  });

  it('should replace {memberCount} placeholder', () => {
    const result = replacePlaceholders('We have {memberCount} members');
    expect(result).toBe('We have 1337 members');
  });

  it('should replace multiple placeholders', () => {
    const result = replacePlaceholders('{user} joined {server} as member #{memberCount}');
    expect(result).toBe('@MaxMustermann joined ModGuard Community as member #1337');
  });

  it('should handle text without placeholders', () => {
    const result = replacePlaceholders('No placeholders here');
    expect(result).toBe('No placeholders here');
  });
});

describe('renderDiscordMarkdown', () => {
  describe('Discord UI Elements', () => {
    it('should render <id:customize> element', () => {
      const result = renderDiscordMarkdown('Click <id:customize> to customize');
      expect(result).toContain('discord-ui-element');
      expect(result).toContain('⚙️ Rollen & Kanäle auswählen');
    });

    it('should render <id:guide> element', () => {
      const result = renderDiscordMarkdown('Check <id:guide> for help');
      expect(result).toContain('discord-ui-element');
      expect(result).toContain('📖 Server Guide');
    });

    it('should render <id:browse> element', () => {
      const result = renderDiscordMarkdown('Use <id:browse> to explore');
      expect(result).toContain('discord-ui-element');
      expect(result).toContain('🔍 Kanäle durchsuchen');
    });
  });

  describe('Mentions', () => {
    it('should render user mentions', () => {
      const result = renderDiscordMarkdown('Hello @username');
      expect(result).toContain('discord-mention');
      expect(result).toContain('discord-user-mention');
      expect(result).toContain('@username');
    });

    it('should render channel mentions', () => {
      const result = renderDiscordMarkdown('Post in #general');
      expect(result).toContain('discord-mention');
      expect(result).toContain('discord-channel-mention');
      expect(result).toContain('#general');
    });

    it('should render role mentions', () => {
      const result = renderDiscordMarkdown('Tag <@&123456789>');
      expect(result).toContain('discord-mention');
      expect(result).toContain('discord-role-mention');
      expect(result).toContain('@Rolle');
    });
  });

  describe('Formatting', () => {
    it('should render bold text', () => {
      const result = renderDiscordMarkdown('This is **bold** text');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should render italic text with asterisks', () => {
      const result = renderDiscordMarkdown('This is *italic* text');
      expect(result).toContain('<em>italic</em>');
    });

    it('should render italic text with underscores', () => {
      const result = renderDiscordMarkdown('This is _italic_ text');
      expect(result).toContain('<em>italic</em>');
    });

    it('should render underlined text', () => {
      const result = renderDiscordMarkdown('This is __underlined__ text');
      expect(result).toContain('<u>underlined</u>');
    });

    it('should render strikethrough text', () => {
      const result = renderDiscordMarkdown('This is ~~crossed~~ out');
      expect(result).toContain('<s>crossed</s>');
    });

    it('should render combined formatting', () => {
      const result = renderDiscordMarkdown('**Bold** and *italic* and __underlined__');
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<u>underlined</u>');
    });
  });

  describe('Code', () => {
    it('should render inline code', () => {
      const result = renderDiscordMarkdown('Use `console.log()` for debugging');
      expect(result).toContain('discord-inline-code');
      expect(result).toContain('console.log()');
    });

    it('should render code blocks', () => {
      const result = renderDiscordMarkdown('```\nfunction test() {\n  return true;\n}\n```');
      expect(result).toContain('discord-code-block');
      expect(result).toContain('function test()');
    });
  });

  describe('Spoilers', () => {
    it('should render spoilers', () => {
      const result = renderDiscordMarkdown('Spoiler: ||hidden text||');
      expect(result).toContain('discord-spoiler');
      expect(result).toContain('hidden text');
    });
  });

  describe('Quotes', () => {
    it('should render blockquotes', () => {
      const result = renderDiscordMarkdown('> This is a quote');
      expect(result).toContain('discord-quote');
      expect(result).toContain('This is a quote');
    });
  });

  describe('Links', () => {
    it('should render markdown links', () => {
      const result = renderDiscordMarkdown('[Click here](https://example.com)');
      expect(result).toContain('discord-link');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('Click here');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should auto-link URLs', () => {
      const result = renderDiscordMarkdown('Visit https://example.com for more info');
      expect(result).toContain('discord-link');
      expect(result).toContain('href="https://example.com"');
    });

    it('should handle http URLs', () => {
      const result = renderDiscordMarkdown('http://example.com');
      expect(result).toContain('discord-link');
      expect(result).toContain('href="http://example.com"');
    });
  });

  describe('Line Breaks', () => {
    it('should convert newlines to <br />', () => {
      const result = renderDiscordMarkdown('Line 1\nLine 2\nLine 3');
      expect(result).toContain('<br />');
      expect(result.match(/<br \/>/g)?.length).toBe(2);
    });
  });

  describe('Complex Examples', () => {
    it('should handle mixed content', () => {
      const text = 'Hello **@username**! Check #general for updates.\nMore info: https://example.com';
      const result = renderDiscordMarkdown(text);
      
      expect(result).toContain('<strong>');
      expect(result).toContain('discord-user-mention');
      expect(result).toContain('discord-channel-mention');
      expect(result).toContain('<br />');
      expect(result).toContain('discord-link');
    });

    it('should preserve text order', () => {
      const text = 'Start **bold** middle *italic* end';
      const result = renderDiscordMarkdown(text);
      
      const boldIndex = result.indexOf('<strong>bold</strong>');
      const italicIndex = result.indexOf('<em>italic</em>');
      
      expect(boldIndex).toBeGreaterThan(-1);
      expect(italicIndex).toBeGreaterThan(-1);
      expect(italicIndex).toBeGreaterThan(boldIndex);
    });

    it('should handle empty string', () => {
      const result = renderDiscordMarkdown('');
      expect(result).toBe('');
    });

    it('should handle plain text', () => {
      const result = renderDiscordMarkdown('Just plain text');
      expect(result).toBe('Just plain text');
    });
  });

  describe('XSS prevention', () => {
    it('should escape raw HTML tags outside any markdown token', () => {
      const result = renderDiscordMarkdown('<img src=x onerror=alert(1)>');
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
    });

    it('should escape a raw script tag', () => {
      const result = renderDiscordMarkdown('<script>alert(1)</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape HTML injected inside bold/italic/spoiler content', () => {
      expect(renderDiscordMarkdown('**<img src=x onerror=alert(1)>**')).not.toContain('<img');
      expect(renderDiscordMarkdown('*<img src=x onerror=alert(1)>*')).not.toContain('<img');
      expect(renderDiscordMarkdown('||<img src=x onerror=alert(1)>||')).not.toContain('<img');
    });

    it('should still render Discord UI elements after escaping', () => {
      const result = renderDiscordMarkdown('Click <id:customize> to customize');
      expect(result).toContain('discord-ui-element');
      expect(result).toContain('⚙️ Rollen & Kanäle auswählen');
    });

    it('should still render role mentions after escaping', () => {
      const result = renderDiscordMarkdown('Tag <@&123456789>');
      expect(result).toContain('discord-role-mention');
    });

    it('should not allow javascript: URLs in markdown links', () => {
      const result = renderDiscordMarkdown('[click](javascript:alert(1))');
      expect(result).toContain('href="#"');
      expect(result).not.toContain('javascript:');
    });
  });
});
