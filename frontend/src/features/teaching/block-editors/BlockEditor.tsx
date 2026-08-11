import { BlockType } from "@/client"

import { AudioBlockEditor } from "./AudioBlockEditor"
import { CodeBlockEditor } from "./CodeBlockEditor"
import { FileBlockEditor } from "./FileBlockEditor"
import { ImageBlockEditor } from "./ImageBlockEditor"
import { QuizMultipleBlockEditor } from "./QuizMultipleBlockEditor"
import { QuizSingleBlockEditor } from "./QuizSingleBlockEditor"
import { TextBlockEditor } from "./TextBlockEditor"
import { VideoBlockEditor } from "./VideoBlockEditor"
import type {
  AudioBlockPayload,
  BlockPayload,
  CodeBlockPayload,
  FileBlockPayload,
  ImageBlockPayload,
  QuizMultipleBlockPayload,
  QuizSingleBlockPayload,
  TextBlockPayload,
  VideoBlockPayload,
} from "@/features/teaching/schemas/block"

interface BlockEditorProps {
  blockType: BlockType
  payload: BlockPayload
  onChange: (payload: BlockPayload) => void
  onUploadMedia?: (file: File) => Promise<unknown>
  isUploading?: boolean
}

export function BlockEditor({
  blockType,
  payload,
  onChange,
  onUploadMedia,
  isUploading,
}: BlockEditorProps) {
  switch (blockType) {
    case BlockType.TEXT:
      return (
        <TextBlockEditor
          payload={payload as TextBlockPayload}
          onChange={onChange}
        />
      )
    case BlockType.CODE:
      return (
        <CodeBlockEditor payload={payload as CodeBlockPayload} onChange={onChange} />
      )
    case BlockType.QUIZ_SINGLE_CHOICE:
      return (
        <QuizSingleBlockEditor
          payload={payload as QuizSingleBlockPayload}
          onChange={onChange}
        />
      )
    case BlockType.QUIZ_MULTIPLE_CHOICE:
      return (
        <QuizMultipleBlockEditor
          payload={payload as QuizMultipleBlockPayload}
          onChange={onChange}
        />
      )
    case BlockType.IMAGE:
      return (
        <ImageBlockEditor
          payload={payload as ImageBlockPayload}
          onChange={onChange}
          onUploadMedia={onUploadMedia}
          isUploading={isUploading}
        />
      )
    case BlockType.VIDEO:
      return (
        <VideoBlockEditor
          payload={payload as VideoBlockPayload}
          onChange={onChange}
          onUploadMedia={onUploadMedia}
          isUploading={isUploading}
        />
      )
    case BlockType.AUDIO:
      return (
        <AudioBlockEditor
          payload={payload as AudioBlockPayload}
          onUploadMedia={onUploadMedia}
          isUploading={isUploading}
        />
      )
    case BlockType.FILE:
      return (
        <FileBlockEditor
          payload={payload as FileBlockPayload}
          onUploadMedia={onUploadMedia}
          isUploading={isUploading}
        />
      )
    default:
      return null
  }
}
