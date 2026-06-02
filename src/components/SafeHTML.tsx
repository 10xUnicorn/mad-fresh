"use client";

import React from "react";
import DOMPurify from "isomorphic-dompurify";

interface SafeHTMLProps {
  html: string;
  className?: string;
  as?: React.ElementType;
}

export default function SafeHTML({ html, className, as: Tag = "div" }: SafeHTMLProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["h1","h2","h3","h4","h5","h6","p","br","hr","ul","ol","li","strong","em","b","i","u","a","span","div","table","thead","tbody","tr","th","td","blockquote","pre","code","img","sub","sup"],
    ALLOWED_ATTR: ["href","target","rel","src","alt","class","style","width","height"],
  });

  return <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
