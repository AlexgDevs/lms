import { FileText, Code, HelpCircle, Image as ImageIcon, Video, Volume2, File as FileIcon } from "lucide-react"
import { BlockType } from "@/client"

export function BlockTypeIcon({ type }: { type: BlockType }) {
    switch (type) {
        case BlockType.TEXT:
            return <FileText size={15} className="text-blue-500" />
        case BlockType.CODE:
            return <Code size={15} className="text-amber-500" />
        case BlockType.QUIZ_SINGLE_CHOICE:
        case BlockType.QUIZ_MULTIPLE_CHOICE:
            return <HelpCircle size={15} className="text-purple-500" />
        case BlockType.IMAGE:
            return <ImageIcon size={15} className="text-emerald-500" />
        case BlockType.VIDEO:
            return <Video size={15} className="text-rose-500" />
        case BlockType.AUDIO:
            return <Volume2 size={15} className="text-indigo-500" />
        case BlockType.FILE:
            return <FileIcon size={15} className="text-sky-500" />
        default:
            return <FileText size={15} className="text-muted-foreground" />
    }
}
