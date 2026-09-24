import { Directive, ElementRef, HostListener, effect, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { Language } from './language';

type DateSegment = 'day' | 'month' | 'year';

const SEGMENT_LENGTHS: Record<DateSegment, number> = { day: 2, month: 2, year: 4 };
const MAX_DIGITS = SEGMENT_LENGTHS.day + SEGMENT_LENGTHS.month + SEGMENT_LENGTHS.year;

const SEGMENT_ORDER: readonly DateSegment[] = ['month', 'day', 'year'];

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
