import DOMPurify from "dompurify"

export function TextBlockView({ payload }: { payload: Record<string, unknown> | null }) {
  const html = typeof payload?.html === "string" ? payload.html : ""
  const text = typeof payload?.text === "string" ? payload.text : ""

  if (html) {
    return (
      <div
        className="rich-text"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    )
  }

  return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
}