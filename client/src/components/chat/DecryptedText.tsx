// Detects data:image URLs and renders an <img> tag
 
"use client";
 
import { isImageContent } from "@/lib/image-utils";
 
interface DecryptedTextProps {
  content: string;
}
 
export function DecryptedText({ content }: DecryptedTextProps) {
  const parts: React.ReactNode[] = [];
 
  // Check if content starts with a data:image
  if (isImageContent(content)) {
    const newlineIndex = content.indexOf("\n");
    let imageData = content;
    let textContent = "";
 
    if (newlineIndex !== -1) {
      imageData = content.substring(0, newlineIndex);
      textContent = content.substring(newlineIndex + 1).trim();
    }
 
    parts.push(
      <img
        key="image"
        src={imageData}
        alt="Shared image"
        className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
        style={{ maxHeight: "300px", objectFit: "cover" }}
      />
    );
 
    if (textContent) {
      parts.push(
        <p key="text" className="whitespace-pre-wrap">{textContent}</p>
      );
    }
  } else {
    parts.push(<p key="text" className="whitespace-pre-wrap">{content}</p>);
  }
 
  return <>{parts}</>;
}
