import { FileText, Code, HelpCircle, Image as ImageIcon, Video, Volume2, File as FileIcon } from "lucide-react"
import { DuotoneIcon } from "@/components/ui/duotone-icon"
import { BlockType } from "@/client"

export function BlockTypeIcon({ type }: { type: BlockType }) {
    switch (type) {
        case BlockType.TEXT:
            return <DuotoneIcon icon={FileText} size={14} />
        case BlockType.CODE:
            return <DuotoneIcon icon={Code} size={14} />
        case BlockType.QUIZ_SINGLE_CHOICE:
        case BlockType.QUIZ_MULTIPLE_CHOICE:
            return <DuotoneIcon icon={HelpCircle} size={14} />
        case BlockType.IMAGE:
            return <DuotoneIcon icon={ImageIcon} size={14} />
        case BlockType.VIDEO:
            return <DuotoneIcon icon={Video} size={14} />
        case BlockType.AUDIO:
            return <DuotoneIcon icon={Volume2} size={14} />
        case BlockType.FILE:
            return <DuotoneIcon icon={FileIcon} size={14} />
        default:
            return <DuotoneIcon icon={FileText} size={14} />
    }
}
