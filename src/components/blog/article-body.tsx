import React from 'react';

type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

function parseContent(content: string): ContentBlock[] {
  return content.split('\n\n').map((block) => {
    if (block.startsWith('### ')) {
      return { type: 'heading', text: block.replace('### ', '') };
    }

    if (block.startsWith('- ')) {
      return {
        type: 'list',
        items: block.split('\n').map((line) => line.replace('- ', '')),
      };
    }

    return { type: 'paragraph', text: block };
  });
}

function renderInlineEmphasis(text: string): React.ReactNode {
  const segments = text.split(/(\*\*.*?\*\*)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      const innerText = segment.slice(2, -2);

      return (
        <strong
          key={index}
          className="text-on-surface font-semibold"
        >
          {innerText}
        </strong>
      );
    }

    return <React.Fragment key={index}>{segment}</React.Fragment>;
  });
}

interface ArticleBodyProps {
  content: string;
}

export default function ArticleBody({ content }: ArticleBodyProps) {
  const blocks = parseContent(content);

  return (
    <div className="font-sans text-lg text-on-surface/90 leading-relaxed space-y-6">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h2
              key={index}
              className="font-serif text-2xl md:text-3xl text-on-surface mt-12 mb-4"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === 'list') {
          return (
            <ul
              key={index}
              className="list-disc pl-6 space-y-2 my-6"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-on-surface/90">
                  {renderInlineEmphasis(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-on-surface/90">
            {renderInlineEmphasis(block.text)}
          </p>
        );
      })}
    </div>
  );
}
