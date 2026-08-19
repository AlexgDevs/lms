import type { BlockSchema } from "@/client"
import { BlockType } from "@/client"
import type { BlockSubmissionType } from "@/client"
import { CodeBlockView } from "@/features/learner/components/blocks/CodeBlockView"
import { MediaBlockView } from "@/features/learner/components/blocks/MediaBlockView"
import { QuizBlockView } from "@/features/learner/components/blocks/QuizBlockView"
import { TextBlockView } from "@/features/learner/components/blocks/TextBlockView"

interface BlockViewProps {
  block: BlockSchema
  quizSelected?: number[]
  onQuizSelect?: (blockId: string, selected: number[]) => void
  quizResult?: BlockSubmissionType
  quizLocked?: boolean
  codeValue?: string
  onCodeChange?: (blockId: string, value: string) => void
  codeResult?: BlockSubmissionType
  codeLocked?: boolean
}

export function BlockView({ block, ...quizProps }: BlockViewProps) {
  const renderContent = () => {
    switch (block.block_type) {
      case BlockType.TEXT:
        return <TextBlockView payload={block.payload} />
      case BlockType.CODE:
        return (
          <CodeBlockView
            block={block}
            value={quizProps.codeValue ?? ""}
            onChange={(blockId, value) => quizProps.onCodeChange?.(blockId, value)}
            result={quizProps.codeResult}
            locked={quizProps.codeLocked ?? false}
          />
        )
      case BlockType.IMAGE:
      case BlockType.VIDEO:
      case BlockType.AUDIO:
      case BlockType.FILE:
        return <MediaBlockView block={block} />
      case BlockType.QUIZ_SINGLE_CHOICE:
      case BlockType.QUIZ_MULTIPLE_CHOICE:
        return (
          <QuizBlockView
            block={block}
            selected={quizProps.quizSelected ?? []}
            onSelect={(blockId, selected) => quizProps.onQuizSelect?.(blockId, selected)}
            result={quizProps.quizResult}
            locked={quizProps.quizLocked ?? false}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      {block.title ? <h3 className="text-sm font-semibold text-foreground">{block.title}</h3> : null}
      {renderContent()}
    </div>
  )
}