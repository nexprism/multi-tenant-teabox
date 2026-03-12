import React from 'react';

interface CustomStyledComponentProps {
  componentId: string;
  settings?: {
    inlineStyles?: Record<string, string>;
    customCSS?: string;
    customClasses?: string;
  };
  children: React.ReactNode;
}

export function CustomStyledComponent({
  componentId,
  settings = {},
  children
}: CustomStyledComponentProps) {
  const { inlineStyles = {}, customCSS = '', customClasses = '' } = settings;

  // Convert camelCase to kebab-case
  const inlineStylesToCss = (styles: Record<string, string>) => {
    return Object.entries(styles)
      .filter(([_, value]) => value)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value} !important;`;
      })
      .join('\n      ');
  };

  const inlineStylesCss = inlineStylesToCss(inlineStyles);
  const hasInlineStyles = Object.keys(inlineStyles).length > 0;
  const hasCustomCSS = customCSS.trim().length > 0;

  return (
    <>
      {/* Inline styles - apply to wrapper and direct child (white box) */}
      {hasInlineStyles && (
        <style>
          {`
            [data-component-id="${componentId}"],
            [data-component-id="${componentId}"] > * {
              ${inlineStylesCss}
            }
          `}
        </style>
      )}
      
      {/* Advanced CSS - can target specific elements */}
      {hasCustomCSS && (
        <style>
          {`
            [data-component-id="${componentId}"] {
              ${customCSS}
            }
            
            [data-component-id="${componentId}"] button,
            [data-component-id="${componentId}"] h1,
            [data-component-id="${componentId}"] h2,
            [data-component-id="${componentId}"] h3,
            [data-component-id="${componentId}"] h4,
            [data-component-id="${componentId}"] h5,
            [data-component-id="${componentId}"] h6,
            [data-component-id="${componentId}"] p,
            [data-component-id="${componentId}"] span,
            [data-component-id="${componentId}"] a,
            [data-component-id="${componentId}"] input {
              /* Styles from advanced CSS will apply here */
            }
          `}
        </style>
      )}
      
      <div
        data-component-id={componentId}
        className={customClasses}
      >
        {children}
      </div>
    </>
  );
}
