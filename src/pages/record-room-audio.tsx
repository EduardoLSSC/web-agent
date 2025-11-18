import { useRef, useState } from 'react'
import { Navigate, useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { RecordedAudio } from '@/components/recorded-audio'

const isRecordingSupported =
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function' &&
  typeof window.MediaRecorder === 'function'

type RoomParams = {
  roomId: string
}

export function RecordRoomAudio() {
  const params = useParams<RoomParams>()
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  function stopRecording() {
    setIsRecording(false)
    setVolume(0)
    setFrequencyData(null)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Solicita os dados finais e para o recorder
    if (recorder.current && recorder.current.state !== 'inactive') {
      // Solicita os dados finais antes de parar
      recorder.current.requestData()
      recorder.current.stop()
    }

    // Para todas as tracks do stream de áudio para liberar o microfone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }

    // Fecha o AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
      analyserRef.current = null
    }
  }

  function uploadAudio(audio: Blob) {
    const formData = new FormData()
    formData.append('file', audio, 'audio.webm')

    setIsUploading(true)
    setUploadProgress(0)
    setUploadComplete(false)

    const xhr = new XMLHttpRequest()

    // Rastreia o progresso do upload
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        setUploadProgress(progress)
      }
    })

    // Quando o upload for concluído
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(100)
        setUploadComplete(true)
        setIsUploading(false)
        
        try {
          const result = JSON.parse(xhr.responseText)
          console.log('Upload concluído:', result)
        } catch (error) {
          console.log('Upload concluído')
        }
      } else {
        setIsUploading(false)
        alert('Erro ao enviar áudio. Tente novamente.')
      }
    })

    // Trata erros
    xhr.addEventListener('error', () => {
      setIsUploading(false)
      alert('Erro ao enviar áudio. Verifique sua conexão.')
    })

    xhr.addEventListener('abort', () => {
      setIsUploading(false)
    })

    xhr.open('POST', `http://localhost:3333/rooms/${params.roomId}/audio`)
    xhr.send(formData)
  }

  function handleAudioDataAvailable(event: BlobEvent) {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data)
    }
  }

  function createRecorder(audio: MediaStream) {
    recorder.current = new MediaRecorder(audio, {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 64_000,
    })

    recorder.current.ondataavailable = handleAudioDataAvailable

    recorder.current.onstart = () => {
      console.log('gravacao inicidada')
      audioChunksRef.current = [] // Limpa os chunks anteriores
    }

    recorder.current.onstop = () => {
      console.log('gravacao pausada')
      
      // Cria o blob final com todos os chunks
      if (audioChunksRef.current.length > 0) {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        })
        setRecordedAudio(finalBlob)
        
        // Envia o áudio para o servidor
        uploadAudio(finalBlob)
      }
    }

    recorder.current.start()
  }

  function updateVolume() {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calcula o volume médio
    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length

    // Normaliza para 0-100
    const normalizedVolume = Math.min(100, (average / 255) * 100)
    setVolume(normalizedVolume)
    setFrequencyData(dataArray)

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateVolume)
    }
  }

  async function startRecording() {
    if (!isRecordingSupported) {
      alert('O seu navegador não suporta gravação')
      return
    }

    setIsRecording(true)
    setRecordedAudio(null) // Limpa o áudio anterior
    setUploadComplete(false) // Limpa o status de upload
    setUploadProgress(0) // Limpa o progresso
    const audio = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44_100,
      },
    })

    streamRef.current = audio

    // Configura o AudioContext para análise de volume
    audioContextRef.current = new AudioContext()
    analyserRef.current = audioContextRef.current.createAnalyser()
    analyserRef.current.fftSize = 256
    const source = audioContextRef.current.createMediaStreamSource(audio)
    source.connect(analyserRef.current)

    // Inicia a atualização do volume
    updateVolume()

    createRecorder(audio)
  }

  if (!params.roomId) {
    return <Navigate replace to="/" />
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <div className="absolute top-8 left-8">
        <Link to={`/room/${params.roomId}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Visualizador de Volume */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-80">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>Volume</span>
            <span>{Math.round(volume)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75 ease-out"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>

        {/* Barras de volume */}
        {isRecording && frequencyData && (
          <div className="flex h-32 items-end justify-center gap-1">
            {Array.from({ length: 20 }).map((_, i) => {
              // Pega uma amostra dos dados de frequência
              const dataIndex = Math.floor(
                (i / 20) * frequencyData.length
              )
              const value = frequencyData[dataIndex] || 0
              const barHeight = Math.max(4, (value / 255) * 100)

              // Determina a cor baseada na altura
              let barColorClass = 'bg-gradient-to-t from-green-400 via-yellow-400 to-red-500'
              if (barHeight < 30) {
                barColorClass = 'bg-gradient-to-t from-green-400 to-green-500'
              } else if (barHeight < 70) {
                barColorClass = 'bg-gradient-to-t from-yellow-400 to-yellow-500'
              } else {
                barColorClass = 'bg-gradient-to-t from-red-400 to-red-500'
              }

              return (
                <div
                  key={i}
                  className={`w-2 rounded-t ${barColorClass} transition-all duration-75`}
                  style={{ height: `${barHeight}%` }}
                />
              )
            })}
          </div>
        )}
      </div>

      {isRecording ? (
        <Button onClick={stopRecording}>Pausar Gravação</Button>
      ) : (
        <Button onClick={startRecording}>Gravar Áudio</Button>
      )}
      {isRecording ? (
        <p className="text-lg font-semibold text-green-500">Gravando...</p>
      ) : (
        <p className="text-muted-foreground">Pausado</p>
      )}

      {/* Barra de progresso do upload */}
      {isUploading && (
        <div className="mt-4 w-80">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Enviando áudio...</span>
            <span className="font-medium text-primary">{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Mensagem de upload completo */}
      {uploadComplete && !isUploading && (
        <div className="mt-4 rounded-lg bg-green-500/10 px-4 py-2 text-center">
          <p className="text-sm font-medium text-green-500">
            ✓ Áudio enviado com sucesso!
          </p>
        </div>
      )}

      {/* Componente de áudio gravado */}
      {recordedAudio && (
        <div className="mt-8">
          <RecordedAudio
            audioBlob={recordedAudio}
            onDelete={() => {
              setRecordedAudio(null)
              setUploadComplete(false)
              setUploadProgress(0)
            }}
          />
        </div>
      )}
    </div>
  )
}
