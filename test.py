from twelvelabs import TwelveLabs
import argparse
import mimetypes
import os
import sys
import time

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


def wait_for_asset_ready(client: TwelveLabs, asset_id: str, sleep_interval: float = 5.0) -> None:
    while True:
        asset = client.assets.retrieve(asset_id)
        status = getattr(asset, "status", None)
        print(f"Asset status: {status}")
        if status in ("ready", "failed"):
            if status != "ready":
                raise RuntimeError(f"Asset processing failed (status={status}).")
            return
        time.sleep(sleep_interval)


def wait_for_indexed_asset_ready(
    client: TwelveLabs, index_id: str, indexed_asset_id: str, sleep_interval: float = 5.0
) -> None:
    while True:
        indexed_asset = client.indexes.indexed_assets.retrieve(index_id, indexed_asset_id)
        status = getattr(indexed_asset, "status", None)
        print(f"Indexing status: {status}")
        if status in ("ready", "failed"):
            if status != "ready":
                raise RuntimeError(f"Indexing failed (status={status}).")
            return
        time.sleep(sleep_interval)


def resolve_video_id(client: TwelveLabs, index_id: str, filename: str) -> str:
    response = client.indexes.videos.list(
        index_id=index_id,
        page=1,
        page_limit=1,
        sort_by="created_at",
        sort_option="desc",
        filename=filename,
    )
    for item in response:
        if item.id:
            return item.id
    raise RuntimeError("Unable to resolve video_id after indexing.")

def format_transcription(transcription) -> str:
    if not transcription:
        return ""

    lines = []
    for item in transcription:
        text = getattr(item, "value", None)
        if not text:
            continue
        start = getattr(item, "start", None)
        end = getattr(item, "end", None)
        if isinstance(start, (int, float)) and isinstance(end, (int, float)):
            lines.append(f"[{start:.2f}-{end:.2f}] {text}")
        else:
            lines.append(text)

    return "\n".join(lines).strip()

def summarize_local_video(video_path: str, index_id: str, prompt: str | None) -> tuple[str, str]:
    api_key = os.getenv("TL_API_KEY")
    if not api_key:
        raise RuntimeError("Missing TL_API_KEY environment variable.")

    client = TwelveLabs(api_key=api_key)

    filename = os.path.basename(video_path)
    mime_type, _ = mimetypes.guess_type(video_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    with open(video_path, "rb") as handle:
        asset = client.assets.create(
            method="direct",
            file=(filename, handle, mime_type),
            filename=filename,
        )
    if not asset.id:
        raise RuntimeError("Asset upload failed: missing asset ID.")
    wait_for_asset_ready(client, asset.id)

    indexed_asset = client.indexes.indexed_assets.create(index_id, asset_id=asset.id)
    if not indexed_asset.id:
        raise RuntimeError("Indexing request failed: missing indexed asset ID.")
    wait_for_indexed_asset_ready(client, index_id, indexed_asset.id)

    indexed_asset_details = client.indexes.indexed_assets.retrieve(
        index_id, indexed_asset.id, transcription=True
    )
    transcript_text = format_transcription(getattr(indexed_asset_details, "transcription", None))

    video_id = resolve_video_id(client, index_id, filename)

    summary = client.summarize(
        video_id=video_id,
        type="summary",
        prompt=prompt,
    )

    # The SDK returns a response object with a `summary` field for type="summary".
    return getattr(summary, "summary", str(summary)), transcript_text


def main() -> int:
    if load_dotenv is not None:
        load_dotenv()

    parser = argparse.ArgumentParser(description="Summarize a local video with TwelveLabs.")
    parser.add_argument("video_path", help="Path to the local video file.")
    parser.add_argument(
        "--index-id",
        default=os.getenv("TL_INDEX_ID"),
        help="TwelveLabs index ID (or set TL_INDEX_ID).",
    )
    parser.add_argument("--prompt", default=None, help="Optional prompt to guide the summary.")
    args = parser.parse_args()

    if not args.index_id:
        print("Missing index ID. Pass --index-id or set TL_INDEX_ID.", file=sys.stderr)
        return 1

    summary_text, transcript_text = summarize_local_video(args.video_path, args.index_id, args.prompt)
    print("Summary:")
    print(summary_text)
    print("\nTranscript:")
    if transcript_text:
        print(transcript_text)
    else:
        print("(empty)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
