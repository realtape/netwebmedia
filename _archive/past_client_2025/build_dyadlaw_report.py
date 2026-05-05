from __future__ import annotations

import html
import io
import re
import zipfile
import zlib
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET


WORKSPACE = Path(r"C:\Users\Usuario\Documents\NetWebMedia")
DOWNLOADS = Path(r"C:\Users\Usuario\Downloads")
OUTPUT_DIR = WORKSPACE / "deliverables" / "dyadlaw_analysis"

PDF_NAME_RE = re.compile(r"dyadlaw", re.IGNORECASE)
SUPPORTED_EXTS = {".txt", ".docx", ".xlsx", ".pdf"}

EVIDENCE_PATTERNS = [
    r"deemed inappropriate",
    r"advised against",
    r"warned that .*? required",
    r"warned against",
    r"pushed back",
    r"challenged",
    r"questioned the necessity",
    r"questioned whether",
    r"clarified that .*? not needed",
    r"requires a formal pilot proposal",
    r"before implementing any new tool",
    r"before any spending",
    r"only numbers, not actionable recommendations",
    r"not actionable recommendations",
    r"not the focus",
    r"not enough",
    r"must provide suggestions",
    r"must remain",
    r"no data proving",
    r"did not show",
]

EVIDENCE_FILES = [
    "CM_PRIORITIES_MAR18.txt",
    "CM_PRIORITIES_NOV19.txt",
    "MARKETING_HUDDLE_MAR19.txt",
    "DYAD_MARKETING_ACTION_PLAN_APRIL.txt",
    "DYAD_STRATEGIC_CAMPAIGN_Q2.txt",
    "Marketing Ideas 2026.xlsx",
    "DYADlaw HubSpot Analysis & GoHighLevel Assessment March 2026.docx",
    "HubSpot Data Analysis and Improvement Plan.docx",
]


def ensure_output_dir() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def read_text_file(path: Path) -> str:
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="ignore")


def xml_text_to_plain(xml_text: str) -> str:
    xml_text = re.sub(r"<w:tab[^>]*/>", "\t", xml_text)
    xml_text = re.sub(r"</w:p>", "\n", xml_text)
    xml_text = re.sub(r"</w:tr>", "\n", xml_text)
    xml_text = re.sub(r"</w:tc>", "\t", xml_text)
    xml_text = re.sub(r"<[^>]+>", "", xml_text)
    xml_text = html.unescape(xml_text)
    xml_text = re.sub(r"[ \t]+\n", "\n", xml_text)
    xml_text = re.sub(r"\n{3,}", "\n\n", xml_text)
    return xml_text.strip()


def read_docx(path: Path) -> str:
    with zipfile.ZipFile(path) as zf:
        xml_text = zf.read("word/document.xml").decode("utf-8", errors="ignore")
    return xml_text_to_plain(xml_text)


def _xlsx_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    ns = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    values = []
    for si in root.findall("a:si", ns):
        text_parts = [t.text or "" for t in si.findall(".//a:t", ns)]
        values.append("".join(text_parts))
    return values


def _xlsx_sheet_names(zf: zipfile.ZipFile) -> dict[str, str]:
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    wb_ns = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    rel_ns = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("r:Relationship", rel_ns)
    }
    out = {}
    for sheet in wb.findall("a:sheets/a:sheet", wb_ns):
        rel_id = sheet.attrib.get(
            "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
        )
        target = rel_map.get(rel_id, "")
        if target:
            out["xl/" + target.lstrip("/")] = sheet.attrib.get("name", "Sheet")
    return out


def read_xlsx(path: Path) -> str:
    lines: list[str] = []
    with zipfile.ZipFile(path) as zf:
        shared = _xlsx_shared_strings(zf)
        sheet_names = _xlsx_sheet_names(zf)
        ns = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        for sheet_path, title in sorted(sheet_names.items()):
            if sheet_path not in zf.namelist():
                continue
            root = ET.fromstring(zf.read(sheet_path))
            lines.append("=" * 100)
            lines.append(f"SHEET: {title}")
            lines.append("=" * 100)
            for row in root.findall(".//a:sheetData/a:row", ns):
                row_num = row.attrib.get("r", "?")
                row_cells = []
                for cell in row.findall("a:c", ns):
                    ref = cell.attrib.get("r", "")
                    cell_type = cell.attrib.get("t")
                    value = cell.findtext("a:v", default="", namespaces=ns)
                    if cell_type == "s" and value.isdigit():
                        cell_value = shared[int(value)]
                    else:
                        cell_value = value
                    if cell_value.strip():
                        row_cells.append(f"{ref}: {cell_value}")
                if row_cells:
                    lines.append(f"ROW {row_num}: " + " | ".join(row_cells))
            lines.append("")
    return "\n".join(lines).strip()


def _pdf_apply_cmaps(raw: bytes, cmaps: list[dict[bytes, str]]) -> str:
    for cmap in cmaps:
        if not cmap:
            continue
        key_lengths = sorted({len(k) for k in cmap}, reverse=True)
        out: list[str] = []
        i = 0
        matched_any = False
        while i < len(raw):
            matched = False
            for length in key_lengths:
                chunk = raw[i : i + length]
                if chunk in cmap:
                    out.append(cmap[chunk])
                    i += length
                    matched = True
                    matched_any = True
                    break
            if not matched:
                out.append(chr(raw[i]))
                i += 1
        if matched_any:
            return "".join(out)
    return ""


def _pdf_decode_literal(raw: bytes, cmaps: list[dict[bytes, str]] | None = None) -> str:
    out = bytearray()
    i = 0
    while i < len(raw):
        ch = raw[i]
        if ch != 0x5C:  # backslash
            out.append(ch)
            i += 1
            continue

        i += 1
        if i >= len(raw):
            break
        esc = raw[i]
        mapping = {
            ord("n"): b"\n",
            ord("r"): b"\r",
            ord("t"): b"\t",
            ord("b"): b"\b",
            ord("f"): b"\f",
            ord("("): b"(",
            ord(")"): b")",
            ord("\\"): b"\\",
        }
        if esc in mapping:
            out.extend(mapping[esc])
            i += 1
            continue
        if esc in b"01234567":
            oct_digits = bytes([esc])
            i += 1
            for _ in range(2):
                if i < len(raw) and raw[i] in b"01234567":
                    oct_digits += bytes([raw[i]])
                    i += 1
                else:
                    break
            out.append(int(oct_digits, 8))
            continue
        out.append(esc)
        i += 1

    data = bytes(out)
    if cmaps:
        mapped = _pdf_apply_cmaps(data, cmaps)
        if mapped:
            return mapped
    if data.startswith(b"\xfe\xff") or data.startswith(b"\xff\xfe"):
        try:
            return data.decode("utf-16", errors="ignore")
        except UnicodeDecodeError:
            pass
    return data.decode("latin-1", errors="ignore")


def _pdf_decode_hex(raw: bytes, cmaps: list[dict[bytes, str]] | None = None) -> str:
    raw = re.sub(rb"\s+", b"", raw)
    if len(raw) % 2 == 1:
        raw += b"0"
    try:
        data = bytes.fromhex(raw.decode("ascii", errors="ignore"))
    except ValueError:
        return ""
    if cmaps:
        mapped = _pdf_apply_cmaps(data, cmaps)
        if mapped:
            return mapped
    if data.startswith(b"\xfe\xff") or data.startswith(b"\xff\xfe"):
        try:
            return data.decode("utf-16", errors="ignore")
        except UnicodeDecodeError:
            pass
    return data.decode("latin-1", errors="ignore")


def _pdf_extract_text_from_stream(
    stream: bytes, cmaps: list[dict[bytes, str]] | None = None
) -> list[str]:
    segments: list[str] = []
    for block in re.findall(rb"BT(.*?)ET", stream, flags=re.S):
        parts: list[str] = []
        for match in re.finditer(rb"\((?:\\.|[^\\()])*\)\s*Tj", block):
            literal = match.group(0)
            raw = literal[: literal.rfind(b")")]
            raw = raw[1:]
            parts.append(_pdf_decode_literal(raw, cmaps))
        for match in re.finditer(rb"<([0-9A-Fa-f\s]+)>\s*Tj", block):
            parts.append(_pdf_decode_hex(match.group(1), cmaps))
        for match in re.finditer(rb"\[(.*?)\]\s*TJ", block, flags=re.S):
            arr = match.group(1)
            for lit in re.finditer(rb"\((?:\\.|[^\\()])*\)", arr):
                parts.append(_pdf_decode_literal(lit.group(0)[1:-1], cmaps))
            for hexa in re.finditer(rb"<([0-9A-Fa-f\s]+)>", arr):
                parts.append(_pdf_decode_hex(hexa.group(1), cmaps))
        for match in re.finditer(rb"\((?:\\.|[^\\()])*\)\s*['\"]", block):
            literal = match.group(0)
            raw = literal[1: literal.rfind(b")")]
            parts.append(_pdf_decode_literal(raw, cmaps))
        clean = "".join(p for p in parts if p)
        clean = re.sub(r"\s{2,}", " ", clean).strip()
        if clean:
            segments.append(clean)
    return segments


def _pdf_stream_candidates(data: bytes) -> list[bytes]:
    candidates: list[bytes] = []
    for match in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", data, flags=re.S):
        stream = match.group(1)
        candidates.append(stream)
        try:
            candidates.append(zlib.decompress(stream))
        except Exception:
            pass
    return candidates


def _pdf_parse_cmaps(data: bytes) -> list[dict[bytes, str]]:
    cmaps: list[dict[bytes, str]] = []
    for candidate in _pdf_stream_candidates(data):
        if b"beginbfchar" not in candidate and b"beginbfrange" not in candidate:
            continue
        text = candidate.decode("latin-1", errors="ignore")
        cmap: dict[bytes, str] = {}

        for block in re.findall(r"beginbfchar(.*?)endbfchar", text, flags=re.S):
            for src, dst in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", block):
                try:
                    src_bytes = bytes.fromhex(src)
                    dst_bytes = bytes.fromhex(dst)
                    cmap[src_bytes] = dst_bytes.decode("utf-16-be", errors="ignore")
                except ValueError:
                    continue

        for block in re.findall(r"beginbfrange(.*?)endbfrange", text, flags=re.S):
            for line in block.splitlines():
                line = line.strip()
                if not line.startswith("<"):
                    continue
                array_match = re.match(
                    r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[(.*)\]", line
                )
                if array_match:
                    start_hex, end_hex, array_body = array_match.groups()
                    try:
                        start = int(start_hex, 16)
                        end = int(end_hex, 16)
                        src_len = len(bytes.fromhex(start_hex))
                        dests = re.findall(r"<([0-9A-Fa-f]+)>", array_body)
                    except ValueError:
                        continue
                    for offset, dst in enumerate(dests):
                        code = start + offset
                        if code > end:
                            break
                        src_bytes = code.to_bytes(src_len, byteorder="big")
                        try:
                            cmap[src_bytes] = bytes.fromhex(dst).decode(
                                "utf-16-be", errors="ignore"
                            )
                        except ValueError:
                            continue
                    continue

                seq_match = re.match(
                    r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", line
                )
                if seq_match:
                    start_hex, end_hex, dst_hex = seq_match.groups()
                    try:
                        start = int(start_hex, 16)
                        end = int(end_hex, 16)
                        dst_start = int(dst_hex, 16)
                        src_len = len(bytes.fromhex(start_hex))
                        dst_len = len(bytes.fromhex(dst_hex))
                    except ValueError:
                        continue
                    for code in range(start, end + 1):
                        src_bytes = code.to_bytes(src_len, byteorder="big")
                        dst_code = dst_start + (code - start)
                        dst_bytes = dst_code.to_bytes(dst_len, byteorder="big")
                        cmap[src_bytes] = dst_bytes.decode("utf-16-be", errors="ignore")

        if cmap:
            cmaps.append(cmap)
    return cmaps


def read_pdf(path: Path) -> str:
    data = path.read_bytes()
    cmaps = _pdf_parse_cmaps(data)
    pieces: list[str] = []
    for stream in _pdf_stream_candidates(data):
        decoded_candidates = [stream]
        for decoded in decoded_candidates:
            pieces.extend(_pdf_extract_text_from_stream(decoded, cmaps))
    text = "\n".join(dict.fromkeys(pieces))
    text = text.replace("\x00", "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def read_any(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".txt":
        return read_text_file(path)
    if ext == ".docx":
        return read_docx(path)
    if ext == ".xlsx":
        return read_xlsx(path)
    if ext == ".pdf":
        return read_pdf(path)
    raise ValueError(f"Unsupported file type: {path}")


def iter_dyadlaw_pdfs() -> list[Path]:
    return sorted(
        p
        for p in DOWNLOADS.iterdir()
        if p.is_file() and p.suffix.lower() == ".pdf" and PDF_NAME_RE.search(p.name)
    )


def iter_evidence_files() -> list[Path]:
    files: list[Path] = []
    for name in EVIDENCE_FILES:
        path = DOWNLOADS / name
        if path.exists():
            files.append(path)
    return files


def normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def find_evidence_snippets(text: str) -> list[str]:
    text = normalize_whitespace(text)
    units = [u.strip() for u in re.split(r"\n{2,}", text) if u.strip()]
    snippets: list[str] = []
    patterns = [re.compile(p, re.IGNORECASE | re.S) for p in EVIDENCE_PATTERNS]

    for unit in units:
        if "Carlos" not in unit and "Martínez" not in unit and "MartÃ" not in unit:
            continue
        if not any(p.search(unit) for p in patterns):
            continue
        cleaned = re.sub(r"\s+", " ", unit).strip()
        if cleaned not in snippets:
            snippets.append(cleaned)
    return snippets


def classify_snippet(snippet: str) -> str:
    s = snippet.lower()
    if "hubspot" in s or "gohighlevel" in s or "crm" in s or "utm" in s:
        return "HubSpot / CRM"
    if "ai" in s or "voice clon" in s or "level up" in s:
        return "AI implementation"
    if "content" in s or "instagram" in s or "youtube" in s or "marketing" in s:
        return "Marketing / content"
    return "Operations / strategy"


def write_markdown(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def _docx_escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _paragraph_xml(text: str, style: str | None = None) -> str:
    if text == "":
        return "<w:p/>"
    text = _docx_escape(text)
    ppr = f"<w:pPr><w:pStyle w:val=\"{style}\"/></w:pPr>" if style else ""
    return (
        "<w:p>"
        f"{ppr}"
        "<w:r><w:t xml:space=\"preserve\">"
        f"{text}"
        "</w:t></w:r>"
        "</w:p>"
    )


def build_docx(paragraphs: Iterable[tuple[str, str | None]], output_path: Path) -> None:
    body = "".join(_paragraph_xml(text, style) for text, style in paragraphs)
    document_xml = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        "<w:document "
        "xmlns:wpc=\"http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas\" "
        "xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\" "
        "xmlns:o=\"urn:schemas-microsoft-com:office:office\" "
        "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" "
        "xmlns:m=\"http://schemas.openxmlformats.org/officeDocument/2006/math\" "
        "xmlns:v=\"urn:schemas-microsoft-com:vml\" "
        "xmlns:wp14=\"http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing\" "
        "xmlns:wp=\"http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing\" "
        "xmlns:w10=\"urn:schemas-microsoft-com:office:word\" "
        "xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\" "
        "xmlns:w14=\"http://schemas.microsoft.com/office/word/2010/wordml\" "
        "xmlns:wpg=\"http://schemas.microsoft.com/office/word/2010/wordprocessingGroup\" "
        "xmlns:wpi=\"http://schemas.microsoft.com/office/word/2010/wordprocessingInk\" "
        "xmlns:wne=\"http://schemas.microsoft.com/office/word/2006/wordml\" "
        "xmlns:wps=\"http://schemas.microsoft.com/office/word/2010/wordprocessingShape\" "
        "mc:Ignorable=\"w14 wp14\">"
        "<w:body>"
        f"{body}"
        "<w:sectPr>"
        "<w:pgSz w:w=\"12240\" w:h=\"15840\"/>"
        "<w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\" "
        "w:header=\"708\" w:footer=\"708\" w:gutter=\"0\"/>"
        "</w:sectPr>"
        "</w:body>"
        "</w:document>"
    )
    styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:b/><w:sz w:val="34"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
</w:styles>
"""
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"""
    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""
    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>
"""
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    core = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>DYADlaw PDF Word Version</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>
"""
    app = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>
"""
    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("word/document.xml", document_xml)
        zf.writestr("word/styles.xml", styles_xml)
        zf.writestr("word/_rels/document.xml.rels", doc_rels)
        zf.writestr("docProps/core.xml", core)
        zf.writestr("docProps/app.xml", app)


def build_pdf_word_doc(pdf_texts: list[tuple[Path, str]]) -> Path:
    paragraphs: list[tuple[str, str | None]] = [
        ("DYADlaw PDF Word Version", "Title"),
        (
            "Combined text extraction from DYADlaw-named PDFs found in Downloads. "
            "Each section below starts with the original PDF filename.",
            None,
        ),
        ("", None),
    ]
    for pdf_path, text in pdf_texts:
        paragraphs.append((pdf_path.name, "Heading1"))
        body = normalize_whitespace(text) or "[No text could be extracted from this PDF.]"
        for line in body.split("\n"):
            paragraphs.append((line, None))
        paragraphs.append(("", None))

    output_path = OUTPUT_DIR / "DYADlaw_PDFs_Word_Version.docx"
    build_docx(paragraphs, output_path)
    return output_path


def build_evidence_report(evidence: list[tuple[Path, list[str]]]) -> Path:
    lines = [
        "# Carlos Idea Rejection / Pushback Findings",
        "",
        "This report lists passages in `Downloads` where Carlos Martinez's ideas were rejected, challenged, blocked pending approval, or criticized as insufficient.",
        "",
    ]
    all_hits = 0
    by_category: dict[str, int] = defaultdict(int)
    for path, snippets in evidence:
        if not snippets:
            continue
        lines.append(f"## {path.name}")
        lines.append(f"Source: `{path}`")
        lines.append("")
        for idx, snippet in enumerate(snippets, start=1):
            category = classify_snippet(snippet)
            by_category[category] += 1
            all_hits += 1
            lines.append(f"{idx}. [{category}] {snippet}")
            lines.append("")

    lines.append("## Totals")
    lines.append(f"- Matched passages: {all_hits}")
    for category, count in sorted(by_category.items()):
        lines.append(f"- {category}: {count}")
    lines.append("")

    output_path = OUTPUT_DIR / "carlos_rejected_ideas_report.md"
    write_markdown(output_path, "\n".join(lines))
    return output_path


def build_summary_markdown(pdf_paths: list[Path], evidence: list[tuple[Path, list[str]]]) -> Path:
    lines = [
        "# DYADlaw Deliverables Summary",
        "",
        "## Included DYADlaw PDFs",
        "",
    ]
    for pdf in pdf_paths:
        lines.append(f"- {pdf.name}")
    lines.append("")
    lines.append("## Evidence Files Scanned")
    lines.append("")
    for path, snippets in evidence:
        lines.append(f"- {path.name}: {len(snippets)} matched passage(s)")
    lines.append("")
    output_path = OUTPUT_DIR / "summary.md"
    write_markdown(output_path, "\n".join(lines))
    return output_path


def main() -> None:
    ensure_output_dir()

    pdf_paths = iter_dyadlaw_pdfs()
    pdf_texts = [(path, read_any(path)) for path in pdf_paths]

    evidence_results: list[tuple[Path, list[str]]] = []
    for path in iter_evidence_files():
        try:
            text = read_any(path)
        except Exception as exc:
            evidence_results.append((path, [f"ERROR reading file: {exc}"]))
            continue
        evidence_results.append((path, find_evidence_snippets(text)))

    word_doc = build_pdf_word_doc(pdf_texts)
    report = build_evidence_report(evidence_results)
    summary = build_summary_markdown(pdf_paths, evidence_results)

    print(f"Created: {word_doc}")
    print(f"Created: {report}")
    print(f"Created: {summary}")


if __name__ == "__main__":
    main()
