import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="mb-5 mt-9 text-3xl font-semibold tracking-tight first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-4 mt-9 border-b border-slate-200 pb-3 text-2xl font-semibold">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-3 mt-7 text-xl font-semibold">{children}</h3>,
        p: ({ children }) => <p className="my-4 leading-8 text-slate-700">{children}</p>,
        ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6 leading-7 text-slate-700">{children}</ul>,
        ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6 leading-7 text-slate-700">{children}</ol>,
        blockquote: ({ children }) => <blockquote className="my-5 border-l-4 border-emerald-500 bg-emerald-50 px-5 py-2 text-slate-700">{children}</blockquote>,
        pre: ({ children }) => <pre className="my-5 overflow-x-auto rounded-2xl bg-slate-950 p-5 font-mono text-sm leading-7 text-emerald-200">{children}</pre>,
        code: ({ children, className }) => className ? <code className={className}>{children}</code> : <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-rose-700">{children}</code>,
        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4">{children}</a>,
        table: ({ children }) => <div className="my-5 overflow-x-auto"><table className="w-full border-collapse text-left text-sm">{children}</table></div>,
        th: ({ children }) => <th className="border border-slate-200 bg-slate-100 px-4 py-3 font-semibold">{children}</th>,
        td: ({ children }) => <td className="border border-slate-200 px-4 py-3 align-top">{children}</td>,
        hr: () => <hr className="my-8 border-slate-200" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
