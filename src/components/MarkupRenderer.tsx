"use client";

import React, { useEffect, useState } from "react";

export interface MarkupClassNames {
  h1?: string;
  h2?: string;
  h3?: string;
  a?: string;
  s?: string;
  b?: string;
  strong?: string;
  i?: string;
  em?: string;
  p?: string;
  ol?: string;
  ul?: string;
  li?: string;
  table?: string;
  thead?: string;
  tbody?: string;
  tr?: string;
  th?: string;
  td?: string;
  blockquote?: string;
  img?: string;
}

interface MarkupRendererProps extends React.HTMLAttributes<HTMLElement> {
  htmlString?: string;
  classNames?: MarkupClassNames;
}

const MarkupRenderer: React.FC<MarkupRendererProps> = ({
  htmlString = "",
  classNames = {},
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    h1: h1Class = "",
    h2: h2Class = "",
    h3: h3Class = "",
    a: aClass = "",
    s: sClass = "",
    b: bClass = "",
    strong: strongClass = "",
    i: iClass = "",
    em: emClass = "",
    p: pClass = "",
    ol: olClass = "",
    ul: ulClass = "",
    li: liClass = "",
    table: tableClass = "",
    thead: theadClass = "",
    tbody: tbodyClass = "",
    tr: trClass = "",
    th: thClass = "",
    td: tdClass = "",
    blockquote: blockquoteClass = "",
  } = classNames;

  const classMap = {
    h1: h1Class,
    h2: h2Class,
    h3: h3Class,
    a: aClass,
    s: sClass,
    b: bClass,
    strong: strongClass,
    i: iClass,
    em: emClass,
    p: pClass,
    ol: olClass,
    ul: ulClass,
    li: liClass,
    table: tableClass,
    thead: theadClass,
    tbody: tbodyClass,
    tr: trClass,
    th: thClass,
    td: tdClass,
    blockquote: blockquoteClass,
    img: classNames.img ?? "",
  };

  const parseNode = (node: ChildNode, index: number): React.ReactNode => {
    // Handle text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    // Handle element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tag = element.tagName.toLowerCase();
      const className = classMap[tag as keyof typeof classMap] || "";

      // Pass through element's own attributes (src, href, alt, etc.)
      const elementAttrs: Record<string, string> = {};
      Array.from(element.attributes).forEach((attr) => {
        if (attr.name === "class" || attr.name === "style") return;
        elementAttrs[attr.name === "for" ? "htmlFor" : attr.name] = attr.value;
      });

      // Recursively parse children
      const children: React.ReactNode[] = Array.from(element.childNodes).map(
        (child, i) => parseNode(child, i),
      );

      return React.createElement(
        tag,
        {
          key: index,
          className: className || undefined,
          ...elementAttrs,
        },
        ...children,
      );
    }

    return null;
  };

  const parseHTML = (html: string): React.ReactNode[] => {
    if (typeof window === "undefined") return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const bodyNodes = Array.from(doc.body.childNodes);

    return bodyNodes.map((node, index) => parseNode(node, index));
  };

  if (!isMounted) return null;

  return <>{parseHTML(htmlString)}</>;
};

export default MarkupRenderer;
