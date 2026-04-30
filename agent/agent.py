"""Hyrd · LiveKit voice interviewer agent (livekit-agents 1.5.x).

Pipeline: Deepgram STT (Nova-3, streaming) -> Claude Haiku 4.5 (LLM) -> Cartesia
TTS (Sonic-2, streaming). The agent reads room metadata for voice + job
context, runs a 2-minute interview asking 3-4 questions, buffers each finalized
turn in memory, and flushes the full transcript to Postgres via PostgREST at
end-of-call.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Any

import httpx
from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice import Agent, AgentSession
from livekit.agents.voice.room_io import RoomInputOptions, RoomOutputOptions
from livekit.plugins import openai as lk_openai
from livekit.plugins import cartesia, deepgram, silero

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hyrd-agent")


CARTESIA_VOICE_IDS = {
    "Halden": "a0e99841-438c-4a64-b679-ae501e7d6091",
    "Mira": "248be419-c632-4f23-adf1-5324ed7dbf1d",
    "Jules": "5c5ad5e7-1020-476b-8b91-fdcbe9cc313c",
}


@dataclass
class CallState:
    interview_id: str
    transcript: list[dict[str, Any]] = field(default_factory=list)
    started_at: float = field(default_factory=time.time)


def system_prompt(role: str, company: str, jd: str, style: str) -> str:
    style_note = {
        "friendly": "warm, encouraging, but candid",
        "neutral": "composed and professional",
        "tough": "direct and probing, no softening",
    }.get(style, "composed and professional")
    return f"""You are a senior interviewer at {company} interviewing the candidate for the {role} role.

The interview is exactly 2 minutes. Ask 3-4 questions total.
Open with a warm 1-sentence intro and a behavioral opener.
Then ask one role-specific technical question informed by the JD below.
Then one situational follow-up.
Keep your turns under 12 seconds of speech. Be {style_note}.
End with: "Thanks - that's all from me."
Never reveal you are an AI. Never use exclamation marks.

JD excerpt:
---
{jd[:2000]}
---"""


async def flush_transcript(state: CallState) -> None:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key or not state.interview_id:
        logger.warning("Supabase env or interview_id missing; skipping transcript flush")
        return
    payload = {
        "interview_id": state.interview_id,
        "transcript": state.transcript,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(
                f"{url}/rest/v1/interview_results",
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates",
                },
                json=payload,
            )
            logger.info("Transcript flush: %s", resp.status_code)
        except Exception as exc:
            logger.exception("Failed to flush transcript: %s", exc)


async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    metadata: dict[str, Any] = {}
    try:
        if ctx.room.metadata:
            metadata = json.loads(ctx.room.metadata)
    except Exception:
        metadata = {}

    voice_name = metadata.get("voice", "Halden")
    style = metadata.get("style", "neutral")
    role = metadata.get("role", "Software Engineer")
    company = metadata.get("company", "the company")
    jd = metadata.get("jd", "")
    interview_id = metadata.get("interview_id", "")

    state = CallState(interview_id=interview_id)
    instructions = system_prompt(role=role, company=company, jd=jd, style=style)
    cartesia_voice_id = CARTESIA_VOICE_IDS.get(voice_name, CARTESIA_VOICE_IDS["Halden"])

    # Azure AI Foundry via the OpenAI v1 surface. The `model` is the Azure
    # deployment name, not OpenAI's published model id. base_url points at
    # the resource's /openai/v1/ endpoint so we don't need an api-version.
    azure_base = os.environ.get("OPENAI_BASE_URL", "")
    azure_key = os.environ.get("OPENAI_API_KEY", "")
    azure_chat_model = os.environ.get("OPENAI_SURVEY_MODEL", "truestar-gpt-5.4-mini")
    if not azure_base or not azure_key:
        raise RuntimeError(
            "Agent requires OPENAI_BASE_URL and OPENAI_API_KEY (Azure AI Foundry) to be set."
        )

    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model="nova-3", language="en-US"),
        llm=lk_openai.LLM(
            model=azure_chat_model,
            base_url=azure_base,
            api_key=azure_key,
        ),
        tts=cartesia.TTS(
            model="sonic-2",
            voice=cartesia_voice_id,
        ),
    )

    @session.on("conversation_item_added")
    def _on_item(ev: Any) -> None:
        try:
            item = getattr(ev, "item", None)
            if item is None:
                return
            text = getattr(item, "text_content", None) or ""
            role_name = getattr(item, "role", None) or ""
            if not text or not role_name:
                return
            mapped = "interviewer" if role_name == "assistant" else "candidate"
            state.transcript.append(
                {"role": mapped, "text": text, "t": int(time.time() - state.started_at)}
            )
        except Exception as exc:
            logger.exception("Could not record turn: %s", exc)

    agent = Agent(instructions=instructions)

    # Explicit RoomIO options. transcription_enabled=True publishes the agent's
    # finalized turns to the room as `lk.transcription` text — the browser's
    # useTrackTranscription / useVoiceAssistant hooks consume these. The user's
    # finalized STT turns are auto-published via the same path.
    await session.start(
        agent=agent,
        room=ctx.room,
        room_input_options=RoomInputOptions(text_enabled=False),
        room_output_options=RoomOutputOptions(
            transcription_enabled=True,
            audio_enabled=True,
        ),
    )

    # Flush whenever the candidate disconnects, the room ends, or the deadline hits.
    flushed = asyncio.Event()

    async def do_flush() -> None:
        if flushed.is_set():
            return
        flushed.set()
        await flush_transcript(state)

    @ctx.room.on("participant_disconnected")
    def _on_disconnect(_p) -> None:  # noqa: ANN001
        asyncio.create_task(do_flush())

    @ctx.room.on("disconnected")
    def _on_room_close(*_args, **_kwargs) -> None:
        asyncio.create_task(do_flush())

    # Greet the candidate to start the clock.
    await asyncio.sleep(0.4)
    await session.say(
        "Hi — thanks for taking the time. Let's begin. Tell me about yourself in sixty seconds.",
        allow_interruptions=True,
    )

    # Run for ~2 minutes, then close out.
    deadline = state.started_at + 125
    while time.time() < deadline:
        if not ctx.room.remote_participants:
            break
        await asyncio.sleep(1)

    try:
        await session.say("Thanks — that's all from me.", allow_interruptions=False)
    except Exception:
        pass

    await asyncio.sleep(2)
    await do_flush()
    await session.aclose()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
