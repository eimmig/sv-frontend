import { Directive, ElementRef, HostListener, effect, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { Language } from './language';

type DateSegment = 'day' | 'month' | 'year';

const SEGMENT_LENGTHS: Record<DateSegment, number> = { day: 2, month: 2, year: 4 };
const MAX_DIGITS = SEGMENT_LENGTHS.day + SEGMENT_LENGTHS.month + SEGMENT_LENGTHS.year;

// Always month/day/year, regardless of the app's active i18n locale - NOT a stylistic choice.
// NativeDateAdapter.parse() (@angular/material/fesm2022/core.mjs) is `new Date(Date.parse(value))`,
// and Date.parse() for a non-ISO slash-separated string is locale-independent: it always reads
// M/D/Y (confirmed against a real browser - a day-first mask for pt-BR/es silently swapped
// day/month on `Date.parse()` whenever day<=12, e.g. typed "05/09/2026" as day=5/month=9 parsed
// to month=5/day=9 instead). The calendar-click path (MatDatepicker's own popup) never goes
// through this - it builds a real Date directly - which is why that path has always been
// locale-correct while text typing never was. Locale only changes DISPLAY (the placeholder's
// wording), never the required typing order.
const SEGMENT_ORDER: readonly DateSegment[] = ['month', 'day', 'year'];

/**
 * Progressive `mm/dd/aaaa`-style formatting for a text input paired with `matDatepicker` -
 * inserts `/` as the user types raw digits, and shows a translated placeholder as a visual guide
 * when the field is empty - these fields lost the native `<input type="date">` day/month/year
 * affordance when they switched to free-text + matDatepicker.
 *
 * Purely a display-layer helper - it only rewrites `input.value`/`placeholder`.
 * `MatDatepickerInput`'s own `(input)` listener is bound to the SAME element and reads
 * `event.target.value` live (verified against @angular/material/fesm2022/datepicker.mjs
 * `_onInput`), so it always parses whatever this directive leaves in `input.value`, regardless
 * of listener registration order - see docs/CONVENTIONS.md for the full analysis.
 */
@Directive({
  selector: 'input[matDatepicker][appDateMask]',
})
export class DateMaskDirective {
  private readonly language = inject(Language);
  private readonly transloco = inject(TranslocoService);
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  constructor() {
    effect(() => {
      this.language.current();
      this.elementRef.nativeElement.placeholder = this.transloco.translate('dateMask.placeholder');
    });
  }

  @HostListener('input', ['$event'])
  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursorPos = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = countDigits(input.value.slice(0, cursorPos));

    const digits = input.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
    const formatted = formatDigits(digits, SEGMENT_ORDER);
    input.value = formatted;

    const newPos = positionAfterDigits(formatted, digitsBeforeCursor);
    input.setSelectionRange(newPos, newPos);
  }
}

function countDigits(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

function formatDigits(digits: string, order: readonly DateSegment[]): string {
  let formatted = '';
  let index = 0;
  for (const segment of order) {
    const length = SEGMENT_LENGTHS[segment];
    const part = digits.slice(index, index + length);
    if (part.length === 0) {
      break;
    }
    formatted += (formatted.length > 0 ? '/' : '') + part;
    index += length;
  }
  return formatted;
}

function positionAfterDigits(formatted: string, digitCount: number): number {
  let position = 0;
  let digitsSeen = 0;
  for (const char of formatted) {
    if (digitsSeen >= digitCount) {
      break;
    }
    position++;
    if (/\d/.test(char)) {
      digitsSeen++;
    }
  }
  return position;
}
