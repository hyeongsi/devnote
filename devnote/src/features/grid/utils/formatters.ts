export function textFormatter<TValue>(fallback = '-') {
  return (value: TValue) => {
    if (value === null || value === undefined) {
      return fallback;
    }

    const text = String(value).trim();
    return text.length > 0 ? text : fallback;
  };
}

export function numberFormatter(options?: Intl.NumberFormatOptions, locales = 'ko-KR') {
  const formatter = new Intl.NumberFormat(locales, options);

  return (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }

    return formatter.format(value);
  };
}

export function booleanFormatter(
  labels: {
    trueLabel?: string;
    falseLabel?: string;
  } = {},
) {
  return (value: boolean | null | undefined) => {
    if (value === true) {
      return labels.trueLabel ?? 'Yes';
    }

    if (value === false) {
      return labels.falseLabel ?? 'No';
    }

    return '-';
  };
}
