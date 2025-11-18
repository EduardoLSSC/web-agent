import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface RecordedAudioProps {
  audioBlob: Blob
  onDelete?: () => void
}

export function RecordedAudio({ audioBlob, onDelete }: RecordedAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string>('')

  // Cria a URL do áudio quando o componente monta
  useEffect(() => {
    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  function togglePlay() {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  function handleDownload() {
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audio-${Date.now()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const fileSize = (audioBlob.size / 1024).toFixed(2) // KB

  return (
    <Card className="w-full max-w-md p-4">
      <div className="mb-4">
        <h3 className="mb-2 font-semibold text-lg">Áudio Gravado</h3>
        <p className="text-sm text-muted-foreground">
          Tamanho: {fileSize} KB
        </p>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          // Atualiza o estado se necessário
        }}
      />

      <div className="flex items-center gap-2">
        <Button onClick={togglePlay} variant="outline" size="sm">
          {isPlaying ? (
            <Pause className="mr-2 size-4" />
          ) : (
            <Play className="mr-2 size-4" />
          )}
          {isPlaying ? 'Pausar' : 'Reproduzir'}
        </Button>

        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="mr-2 size-4" />
          Baixar
        </Button>

        {onDelete && (
          <Button onClick={onDelete} variant="destructive" size="sm">
            Remover
          </Button>
        )}
      </div>
    </Card>
  )
}

