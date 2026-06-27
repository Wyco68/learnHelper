import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import Callout, { detectCalloutKind } from "./Callout";
import Mermaid from "./Mermaid";

function flattenText(children: any): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(flattenText).join("");
  if (children?.props?.children) return flattenText(children.props.children);
  return "";
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-xl prose-h3:text-lg prose-table:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          blockquote({ children }) {
            const text = flattenText(children);
            const kind = detectCalloutKind(text);
            if (kind) {
              const stripped = text.slice(text.indexOf(":") + 1).trim();
              return <Callout kind={kind}>{stripped}</Callout>;
            }
            return <blockquote>{children}</blockquote>;
          },
          // Fenced ```mermaid blocks: react-markdown wraps the <code> in a
          // <pre>, and rehype-highlight rewrites the class to "hljs
          // language-mermaid" — so match by substring, and render the
          // diagram in place of the <pre> (a div can't live inside <pre>).
          pre({ children, ...props }) {
            const child: any = Array.isArray(children) ? children[0] : children;
            const cls: string = child?.props?.className ?? "";
            if (/language-mermaid/.test(cls)) {
              return <Mermaid code={flattenText(child.props.children)} />;
            }
            return <pre {...props}>{children}</pre>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
