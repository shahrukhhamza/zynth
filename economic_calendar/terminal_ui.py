"""
terminal_ui.py — Rich-powered terminal display for the economic calendar.

Color semantics (market convention):
  • GREEN  = actual beat forecast / unemployment dropped / rate decision as expected
  • RED    = actual missed forecast / unemployment rose
  • YELLOW = actual matches forecast exactly or no forecast available
  • DIM    = data unavailable

Layout:
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │  US ECONOMIC CALENDAR  │  as of <timestamp>                                          │
  ├──────────────────────┬────────┬──────────┬──────────┬──────────────────────┬────────┤
  │ Indicator            │ Actual │ Forecast │ Previous │ Source               │ Status │
  ├──────────────────────┼────────┼──────────┼──────────┼──────────────────────┼────────┤
  │ CPI m/m              │  0.3%  │   0.2%   │   0.2%   │ BLS                  │   ✓    │
  │ ...                  │        │          │          │                      │        │
  └──────────────────────┴────────┴──────────┴──────────┴──────────────────────┴────────┘

Status column:
  ✓✓  — cross-verified (BLS + FRED agree)
  ✓   — single-source (unverified)
  ⚠   — discrepancy flagged, Gemini reviewed
  ✗   — fetch failed
"""

from datetime import datetime
from typing import List, Dict, Optional

try:
    from rich.console import Console
    from rich.table import Table, Column
    from rich.panel import Panel
    from rich.text import Text
    from rich import box
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from config import APP_VERSION

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_INVERTED = {"Unemployment Rate"}        # Lower actual = better (green if drops)
# Indicators reported as absolute levels rather than period-over-period changes
_LEVELS   = {"Unemployment Rate", "Fed Interest Rate"}


def _beat_color(record: Dict) -> str:
    """Return rich color string based on actual vs forecast comparison."""
    actual    = record.get("actual")
    forecast  = record.get("forecast")
    indicator = record.get("indicator", "")

    if actual is None:
        return "dim"

    if forecast is None:
        return "yellow"

    diff = actual - forecast
    if indicator in _INVERTED:
        diff = -diff   # For unemployment: lower actual than forecast = beat

    if diff < -0.001:
        return "red"
    elif diff > 0.001:
        return "green"
    else:
        return "yellow"   # right on forecast


def _fmt_value(value: Optional[float], unit: str, indicator: str = "") -> str:
    """Format the ACTUAL column — show +/- sign only for change indicators."""
    if value is None:
        return "N/A"
    if unit == "%":
        if indicator in _LEVELS:
            return f"{value:.2f}%"   # e.g. "4.40%", not "+4.40%"
        return f"{value:+.2f}%"      # e.g. "+0.17%"
    return f"{value:.2f}"


def _fmt_plain(value: Optional[float], unit: str) -> str:
    """Format for Forecast and Previous columns — always plain (no sign)."""
    if value is None:
        return "N/A"
    if unit == "%":
        return f"{value:.2f}%"
    return f"{value:.2f}"


def _status_badge(record: Dict) -> str:
    if record.get("actual") is None:
        return "[red]✗[/red]"
    if record.get("discrepancy_flagged"):
        return "[yellow]⚠[/yellow]"
    if record.get("verified"):
        return "[green]✓✓[/green]"
    return "[cyan]✓[/cyan]"


# ---------------------------------------------------------------------------
# Rich renderer
# ---------------------------------------------------------------------------

def _render_rich(records: List[Dict], analysis: Optional[str], save_path: Optional[str]):
    console = Console()   # Terminal display — always stdout

    # Header panel
    now = datetime.now().strftime("%A, %d %B %Y  %H:%M %Z").strip()
    console.print(
        Panel(
            f"[bold white]US ECONOMIC CALENDAR[/bold white]  [dim]│[/dim]  {now}  "
            f"[dim]│[/dim]  [dim]v{APP_VERSION}[/dim]",
            style="bold blue",
            padding=(0, 2),
        )
    )

    def _build_table() -> Table:
        t = Table(
            Column("Indicator",  style="bold white",  min_width=22),
            Column("Actual",     justify="right",     min_width=9),
            Column("Forecast",   justify="right",     min_width=9),
            Column("Previous",   justify="right",     min_width=9),
            Column("Period",     style="dim",         min_width=12),
            Column("Source",     style="dim",         min_width=24),
            Column("Verified",   justify="center",    min_width=8),
            box=box.SIMPLE_HEAD,
            header_style="bold cyan",
            show_edge=False,
            pad_edge=True,
        )
        for rec in records:
            color     = _beat_color(rec)
            unit      = rec.get("unit", "%")
            indicator = rec.get("indicator", "?")
            t.add_row(
                indicator,
                Text(_fmt_value(rec.get("actual"),   unit, indicator), style=color),
                Text(_fmt_plain(rec.get("forecast"), unit), style="dim white"),
                Text(_fmt_plain(rec.get("previous"), unit), style="dim white"),
                rec.get("period", "N/A"),
                rec.get("source",  "N/A"),
                _status_badge(rec),
            )
        return t

    console.print(_build_table())

    # Legend
    console.print(
        "[dim]  Legend:[/dim]  "
        "[green]■[/green] Beat forecast  "
        "[red]■[/red] Missed forecast  "
        "[yellow]■[/yellow] In-line / no forecast  "
        "[green]✓✓[/green] Cross-verified  "
        "[cyan]✓[/cyan] Single-source  "
        "[yellow]⚠[/yellow] Discrepancy flagged"
    )

    # Source note
    has_forecasts = any(r.get("forecast") is not None for r in records)
    if not has_forecasts:
        console.print(
            "\n[dim]  Forecasts:[/dim] [yellow]N/A[/yellow] — "
            "Add TRADING_ECONOMICS_KEY to .env for analyst consensus forecasts."
        )

    # Cross-source discrepancy details
    flagged = [r for r in records if r.get("discrepancy_flagged")]
    if flagged:
        console.print("\n[bold yellow]  ⚠ Cross-Source Discrepancies:[/bold yellow]")
        for r in flagged:
            note = r.get("gemini_note", "")
            console.print(
                f"   [yellow]{r['indicator']}[/yellow]: "
                f"BLS={r.get('bls_value')}  FRED={r.get('fred_value')}  "
                f"Δ={r.get('discrepancy')}"
            )
            if note:
                console.print(f"   [dim]   Gemini: {note}[/dim]")

    # Gemini analysis block
    if analysis:
        console.print(
            Panel(
                analysis,
                title="[bold cyan]Gemini Market Analysis[/bold cyan]",
                subtitle="[dim]Based solely on official BLS/FRED data above[/dim]",
                style="dim",
                padding=(1, 2),
            )
        )

    # Save text copy to file using a separate file-backed console (avoids
    # Windows cp1252 encoding issues that occur with Console(record=True))
    if save_path:
        import io
        buf = io.StringIO()
        file_con = Console(file=buf, width=120, highlight=False, no_color=True)
        file_con.print(f"US ECONOMIC CALENDAR  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        file_con.print("")
        file_con.print(_build_table())
        with open(save_path, "w", encoding="utf-8") as fh:
            fh.write(buf.getvalue())
        console.print(f"\n[dim]  Text saved to: {save_path}[/dim]")


# ---------------------------------------------------------------------------
# Fallback plain-text renderer (if rich is not installed)
# ---------------------------------------------------------------------------

def _render_plain(records: List[Dict], analysis: Optional[str]):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"\n=== US ECONOMIC CALENDAR === {now}\n")

    header = f"{'Indicator':<22} {'Actual':>9} {'Forecast':>9} {'Previous':>9}  {'Source':<24} {'OK'}"
    print(header)
    print("-" * len(header))

    for rec in records:
        unit      = rec.get("unit", "%")
        indicator = rec.get("indicator", "?")
        actual = _fmt_value(rec.get("actual"),   unit, indicator)
        fcst   = _fmt_plain(rec.get("forecast"), unit)
        prev   = _fmt_plain(rec.get("previous"), unit)

        if rec.get("verified"):
            ok = "✓✓"
        elif rec.get("actual") is not None:
            ok = "✓"
        else:
            ok = "✗"

        print(
            f"{indicator:<22} {actual:>9} {fcst:>9} {prev:>9}  "
            f"{rec.get('source','N/A'):<24} {ok}"
        )

    if analysis:
        print("\n--- Gemini Market Analysis ---")
        print(analysis)
    print()


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def render(
    records:   List[Dict],
    analysis:  Optional[str] = None,
    save_path: Optional[str] = None,
):
    """Render the economic calendar to stdout (and optionally save to file)."""
    if RICH_AVAILABLE:
        _render_rich(records, analysis, save_path)
    else:
        _render_plain(records, analysis)
