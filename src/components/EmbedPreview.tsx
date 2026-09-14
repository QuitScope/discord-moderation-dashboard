'use client';

import { useEffect, useState } from 'react';
import { replacePlaceholders, renderDiscordMarkdown } from '@/lib/discord-markdown';

interface EmbedField { name: string; value: string; inline: boolean }

interface TemplateData {
  title?: string;
  url?: string;
  description?: string;
  color?: string;
  authorName?: string;
  authorIcon?: string;
  footerText?: string;
  footerIcon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  timestamp?: boolean;
  fields?: EmbedField[];
}

export default function EmbedPreview({ template }: { template: TemplateData }) {
  const [key, setKey] = useState(0);
  const borderColor = template.color ? `#${template.color}` : '#5865F2';

  // Trigger animation when template changes
  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [template]);

  const hasContent =
    template.title ||
    template.description ||
    template.authorName ||
    template.footerText ||
    template.imageUrl ||
    template.thumbnailUrl ||
    (template.fields && template.fields.length > 0);

  if (!hasContent) {
    return (
      <div className="discord-preview-container">
        <div className="discord-preview-header">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#23A559]" />
            <span className="text-xs font-medium" style={{ color: '#B5BAC1' }}>
              Live-Vorschau
            </span>
          </div>
        </div>
        <div className="discord-preview-body">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 13h6M9 17h3" />
            </svg>
            <p>Füge Inhalte hinzu, um eine Vorschau zu sehen</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="discord-preview-container" key={key}>
      {/* Discord Window Header */}
      <div className="discord-preview-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#23A559] pulse-dot" />
          <span className="text-xs font-medium" style={{ color: '#B5BAC1' }}>
            #welcome
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="header-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>
          <div className="header-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Discord Chat Body */}
      <div className="discord-preview-body">
        {/* Mock Bot Message */}
        <div className="discord-message fade-in">
          <div className="flex gap-3">
            {/* Bot Avatar */}
            <div className="bot-avatar">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              <div className="bot-badge">BOT</div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Bot Name & Timestamp */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="bot-name">ModGuard Bot</span>
                <span className="message-timestamp">Heute um {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Embed */}
              <div className="discord-embed-wrapper">
                <div className="discord-embed" style={{ borderLeftColor: borderColor }}>
                  <div className="embed-content">
                    {/* Author */}
                    {template.authorName && (
                      <div className="embed-author">
                        {template.authorIcon && (
                          template.authorIcon.startsWith('http') ? (
                            <img
                              src={template.authorIcon}
                              alt="Author"
                              className="author-icon"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="author-icon-emoji">{template.authorIcon}</span>
                          )
                        )}
                        <span className="author-name">
                          {replacePlaceholders(template.authorName)}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    {template.title && (
                      template.url ? (
                        <a href={template.url} className="embed-title embed-title-link" target="_blank" rel="noreferrer">
                          {replacePlaceholders(template.title)}
                        </a>
                      ) : (
                        <div className="embed-title">
                          {replacePlaceholders(template.title)}
                        </div>
                      )
                    )}

                    {/* Description */}
                    {template.description && (
                      <div
                        className="embed-description"
                        dangerouslySetInnerHTML={{
                          __html: renderDiscordMarkdown(replacePlaceholders(template.description)),
                        }}
                      />
                    )}

                    {/* Image */}
                    {template.imageUrl && (
                      <div className="embed-image-wrapper">
                        <img
                          src={template.imageUrl}
                          alt="Embed"
                          className="embed-image"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Thumbnail */}
                    {template.thumbnailUrl && (
                      <div className="embed-thumbnail-wrapper">
                        <img
                          src={template.thumbnailUrl}
                          alt="Thumbnail"
                          className="embed-thumbnail"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Fields */}
                    {template.fields && template.fields.length > 0 && (
                      <div className="embed-fields">
                        {template.fields.map((field, i) => (
                          <div key={i} className={`embed-field ${field.inline ? 'embed-field-inline' : 'embed-field-block'}`}>
                            <div className="embed-field-name">{field.name || '​'}</div>
                            <div className="embed-field-value">{field.value || '​'}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    {(template.footerText || template.timestamp) && (
                      <div className="embed-footer">
                        {template.footerIcon && (
                          template.footerIcon.startsWith('http') ? (
                            <img
                              src={template.footerIcon}
                              alt="Footer"
                              className="footer-icon"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="footer-icon-emoji">{template.footerIcon}</span>
                          )
                        )}
                        <span className="footer-text">
                          {template.footerText && replacePlaceholders(template.footerText)}
                          {template.footerText && template.timestamp && ' • '}
                          {template.timestamp && new Date().toLocaleString('de-DE')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .discord-preview-container {
          background: #313338;
          border-radius: 8px;
          overflow: hidden;
          box-shadow:
            0 2px 10px 0 rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(0, 0, 0, 0.1);
          width: 520px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .discord-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #2B2D31;
          border-bottom: 1px solid rgba(0, 0, 0, 0.2);
        }

        .pulse-dot {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .header-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #B5BAC1;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .header-icon:hover {
          color: #DBDEE1;
          background: rgba(255, 255, 255, 0.05);
        }

        .discord-preview-body {
          padding: 16px;
          background: #313338;
          min-height: 200px;
          max-height: 600px;
          overflow-y: auto;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 24px;
          color: #4E5058;
          text-align: center;
        }

        .empty-state p {
          font-size: 13px;
          margin: 0;
        }

        .discord-message {
          position: relative;
          padding: 8px 0;
        }

        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bot-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(88, 101, 242, 0.3);
        }

        .bot-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #5865F2;
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 3px;
          border: 2px solid #313338;
          letter-spacing: 0.5px;
        }

        .bot-name {
          font-weight: 600;
          font-size: 15px;
          color: #F2F3F5;
          line-height: 1.375;
        }

        .message-timestamp {
          font-size: 12px;
          color: #949BA4;
          font-weight: 500;
          line-height: 1.375;
        }

        .discord-embed-wrapper {
          margin-top: 4px;
          animation: embedFadeIn 0.5s ease-out 0.1s both;
        }

        @keyframes embedFadeIn {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .discord-embed {
          background: #2B2D31;
          border-left: 4px solid;
          border-radius: 4px;
          max-width: 432px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
          transition: box-shadow 0.2s ease;
        }

        .discord-embed:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .embed-content {
          padding: 12px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .embed-author {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .author-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }

        .author-icon-emoji {
          font-size: 20px;
          line-height: 24px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .author-name {
          font-size: 13px;
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1.375;
        }

        .embed-title {
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1.375;
          margin-bottom: 2px;
        }

        .embed-title-link {
          color: #00AFF4;
          text-decoration: none;
        }

        .embed-title-link:hover {
          text-decoration: underline;
        }

        .embed-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }

        .embed-field-block {
          flex: 0 0 100%;
        }

        .embed-field-inline {
          flex: 1 1 30%;
          min-width: 100px;
        }

        .embed-field-name {
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 2px;
          line-height: 1.375;
        }

        .embed-field-value {
          font-size: 13px;
          color: #DBDEE1;
          line-height: 1.4;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .embed-description {
          font-size: 14px;
          color: #DBDEE1;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .embed-description strong {
          font-weight: 700;
        }

        .embed-image-wrapper {
          margin-top: 12px;
        }

        .embed-image {
          max-width: 100%;
          height: auto;
          max-height: 300px;
          border-radius: 4px;
          object-fit: cover;
        }

        .embed-thumbnail-wrapper {
          margin-top: 12px;
        }

        .embed-thumbnail {
          max-width: 80px;
          max-height: 80px;
          border-radius: 4px;
          object-fit: cover;
        }

        .embed-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          object-fit: cover;
        }

        .footer-icon-emoji {
          font-size: 16px;
          line-height: 20px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-text {
          font-size: 12px;
          color: #B5BAC1;
          font-weight: 500;
          line-height: 1.375;
        }

        /* Scrollbar */
        .discord-preview-body::-webkit-scrollbar {
          width: 8px;
        }

        .discord-preview-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .discord-preview-body::-webkit-scrollbar-thumb {
          background: #1E1F22;
          border-radius: 4px;
        }

        .discord-preview-body::-webkit-scrollbar-thumb:hover {
          background: #232428;
        }

        /* Discord Markdown Styles */
        .discord-mention {
          padding: 0 2px;
          border-radius: 3px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.1s ease;
        }

        .discord-user-mention {
          background: rgba(88, 101, 242, 0.3);
          color: #C9D7FF;
        }

        .discord-user-mention:hover {
          background: rgba(88, 101, 242, 0.5);
          color: #FFFFFF;
        }

        .discord-channel-mention {
          background: rgba(88, 101, 242, 0.3);
          color: #C9D7FF;
        }

        .discord-channel-mention:hover {
          background: rgba(88, 101, 242, 0.5);
          color: #FFFFFF;
        }

        .discord-role-mention {
          background: rgba(145, 70, 255, 0.3);
          color: #D4B3FF;
        }

        .discord-role-mention:hover {
          background: rgba(145, 70, 255, 0.5);
          color: #FFFFFF;
        }

        .discord-ui-element {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: rgba(88, 101, 242, 0.15);
          border: 1px solid rgba(88, 101, 242, 0.3);
          border-radius: 4px;
          color: #C9D7FF;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .discord-ui-element:hover {
          background: rgba(88, 101, 242, 0.25);
          border-color: rgba(88, 101, 242, 0.5);
        }

        .discord-spoiler {
          background: #1A1B1E;
          color: transparent;
          border-radius: 3px;
          padding: 0 2px;
          cursor: pointer;
          user-select: none;
          transition: all 0.1s ease;
        }

        .discord-spoiler:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #DBDEE1;
        }

        .discord-code-block {
          background: #1E1F22;
          border: 1px solid #1E1F22;
          border-radius: 4px;
          padding: 8px;
          margin: 4px 0;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          color: #DBDEE1;
          overflow-x: auto;
        }

        .discord-code-block code {
          background: transparent;
          padding: 0;
          font-size: inherit;
        }

        .discord-inline-code {
          background: #1E1F22;
          border-radius: 3px;
          padding: 2px 4px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          color: #F0F0F0;
        }

        .discord-quote {
          border-left: 4px solid #4E5058;
          padding-left: 12px;
          margin: 4px 0;
          color: #B5BAC1;
        }

        .discord-link {
          color: #00AFF4;
          text-decoration: none;
          transition: all 0.1s ease;
        }

        .discord-link:hover {
          text-decoration: underline;
        }

        .embed-description em {
          font-style: italic;
        }

        .embed-description u {
          text-decoration: underline;
        }

        .embed-description s {
          text-decoration: line-through;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
