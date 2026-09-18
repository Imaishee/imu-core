'use client';

import React from 'react';

/**
 * Lightweight markdown renderer for chat messages.
 * Handles: **bold**, `inline code`, ```code blocks```, bullet lists, line breaks.
 */
export default function ChatMarkdown({ text }: { text: string }) {
  if (!text) return null;

  const blocks = text.split(/```([\s\S]*?)```/g);

  return (
    <>
      {blocks.map((block, i) => {
        // Odd indices are code blocks (captured group)
        if (i % 2 === 1) {
          // Code block
          const lines = block.split('\n');
          const lang = lines[0]?.trim();
          const code = lang && !lang.includes(' ')
            ? lines.slice(1).join('\n')
            : block;
          return (
            <pre
              key={i}
              className="chat-code-block"
              style={{
                background: 'rgba(45, 106, 79, 0.06)',
                border: '1px solid rgba(45, 106, 79, 0.12)',
                borderRadius: '10px',
                padding: '12px 14px',
                margin: '8px 0',
                overflowX: 'auto',
                fontSize: '12px',
                lineHeight: '1.5',
                fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                color: '#1F2A24',
              }}
            >
              <code>{(code || block).trim()}</code>
            </pre>
          );
        }

        // Regular text — process inline formatting
        return (
          <div key={i}>
            {renderInlineMarkdown(block)}
          </div>
        );
      })}
    </>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts = parseInline(line);
    return (
      <React.Fragment key={li}>
        {li > 0 && <br />}
        {parts}
      </React.Fragment>
    );
  });
}

function parseInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Match **bold**, `code`, or plain text
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      result.push(
        <strong key={match.index} style={{ fontWeight: 600, color: '#1B4332' }}>
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // `inline code`
      result.push(
        <code
          key={match.index}
          style={{
            background: 'rgba(45, 106, 79, 0.08)',
            border: '1px solid rgba(45, 106, 79, 0.12)',
            borderRadius: '4px',
            padding: '1px 5px',
            fontSize: '0.9em',
            fontFamily: "'SF Mono', monospace",
            color: '#2D6A4F',
          }}
        >
          {match[3]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : [text];
}
