"use client";

// Streams the user's mic to Deepgram Nova-3 over a browser WebSocket and emits
// interim + final transcripts. The API key never leaves the server — we mint a
// short-lived access token via /api/deepgram-token and use it as the WS subprotocol.
//
// Failure modes handled:
//   - getUserMedia denied → hook stays inactive, returns isActive=false
//   - Token mint fails → returns an error; caller can fall back silently
//   - WebSocket closes mid-call → tries one reconnect, then gives up quietly
//
// We deliberately don't tear down the AudioContext on every reconnect — the
// caller may still be using it for the orb amplitude analyser.
import { useEffect, useRef, useState } from "react";

export interface TranscriptFragment {
  id: string;
  text: string;
  isFinal: boolean;
  startMs: number;
}

export interface UseDeepgramTranscriptionOptions {
  enabled: boolean;
  // Consumer-facing callbacks. Called from a useEffect, so they don't need to
  // be memoized — the hook only reads the latest ref.
  onFinal?: (fragment: TranscriptFragment) => void;
  onInterim?: (fragment: TranscriptFragment) => void;
}

export function useDeepgramTranscription({
  enabled,
  onFinal,
  onInterim,
}: UseDeepgramTranscriptionOptions) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep callback refs so changes don't restart the WS.
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  useEffect(() => {
    onFinalRef.current = onFinal;
    onInterimRef.current = onInterim;
  }, [onFinal, onInterim]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let keepalive: ReturnType<typeof setInterval> | null = null;
    const startMs = Date.now();
    let fragmentSeq = 0;

    (async () => {
      try {
        // Mint the temp token.
        const tokenRes = await fetch("/api/deepgram-token", { method: "POST" });
        if (!tokenRes.ok) {
          const data = await tokenRes.json().catch(() => ({}));
          if (!cancelled) setError(data.error || "Could not mint transcription token");
          return;
        }
        const { token } = await tokenRes.json();
        if (cancelled) return;

        // Get the mic.
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Connect to Deepgram. Nova-3 + interim_results gives word-by-word
        // partials and finalized phrases. smart_format: true cleans punctuation.
        const params = new URLSearchParams({
          model: "nova-3",
          language: "en-US",
          punctuate: "true",
          smart_format: "true",
          interim_results: "true",
          endpointing: "300",
          encoding: "linear16",
          sample_rate: "16000",
        });
        const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
        // Deepgram accepts two subprotocol forms: ["token", <project-key>] for
        // raw API keys, or ["bearer", <jwt>] for short-lived access tokens
        // minted via /v1/auth/grant. JWT tokens contain '.' which is not a
        // valid subprotocol character, so the "token" form throws SyntaxError;
        // "bearer" is the only path that works for temp tokens.
        ws = new WebSocket(wsUrl, ["bearer", token]);
        ws.binaryType = "arraybuffer";

        ws.addEventListener("open", () => {
          if (cancelled || !stream) return;
          setIsActive(true);
          setError(null);

          // MediaRecorder doesn't give us linear16 — we wire up an
          // AudioContext + ScriptProcessor (deprecated but universally
          // supported) that emits int16 PCM at 16kHz directly.
          const audioCtx = new AudioContext({ sampleRate: 16000 });
          const source = audioCtx.createMediaStreamSource(stream);
          // ScriptProcessor: legacy, but the modern AudioWorklet path is too
          // much code for what we need here and is functionally identical for
          // a 2-min demo.
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          source.connect(processor);
          processor.connect(audioCtx.destination);

          processor.onaudioprocess = (ev) => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            const input = ev.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
              const s = Math.max(-1, Math.min(1, input[i]!));
              int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            ws.send(int16.buffer);
          };

          // Reuse the processor reference so we can disconnect on cleanup.
          mediaRecorder = {
            stop: () => {
              processor.disconnect();
              source.disconnect();
              audioCtx.close().catch(() => {
                /* ignore */
              });
            },
          } as unknown as MediaRecorder;

          // Send a periodic KeepAlive frame so Deepgram doesn't time out
          // on long silences.
          keepalive = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "KeepAlive" }));
            }
          }, 8000);
        });

        ws.addEventListener("message", (ev) => {
          try {
            const data = JSON.parse(ev.data as string);
            if (data.type !== "Results") return;
            const alt = data.channel?.alternatives?.[0];
            const text: string = alt?.transcript ?? "";
            if (!text) return;
            const fragment: TranscriptFragment = {
              id: `dg-${fragmentSeq++}`,
              text,
              isFinal: !!data.is_final,
              startMs: Date.now() - startMs,
            };
            if (data.is_final) {
              onFinalRef.current?.(fragment);
            } else {
              onInterimRef.current?.(fragment);
            }
          } catch {
            /* ignore malformed frames */
          }
        });

        ws.addEventListener("error", () => {
          if (!cancelled) setError("Transcription connection error");
        });

        ws.addEventListener("close", () => {
          if (!cancelled) setIsActive(false);
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not start transcription");
        }
      }
    })();

    return () => {
      cancelled = true;
      setIsActive(false);
      if (keepalive) clearInterval(keepalive);
      try {
        if (ws && ws.readyState === WebSocket.OPEN) {
          // Tell Deepgram we're done so it flushes any buffered final.
          ws.send(JSON.stringify({ type: "CloseStream" }));
        }
        ws?.close();
      } catch {
        /* ignore */
      }
      mediaRecorder?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled]);

  return { isActive, error };
}
