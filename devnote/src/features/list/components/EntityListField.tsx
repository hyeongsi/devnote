import { AdminToggleSwitch } from '../../admin/AdminToggleSwitch';
import type {
  EntityListCellContext,
  EntityListFieldColumn,
  EntityListManagedRow,
} from '../types/entityListTypes';
import {
  coerceEntityListValue,
  getEntityListValueLabel,
  resolveEntityListColumn,
} from '../utils/entityListUtils';

interface EntityListFieldProps<
  TItem extends { id?: number; order: number },
  TField extends Extract<keyof TItem, string>,
> {
  row: EntityListManagedRow<TItem>;
  column: EntityListFieldColumn<TItem, TField>;
  isEditing: boolean;
  updateField: (clientId: string, field: TField, value: TItem[TField]) => void;
}

export function EntityListField<
  TItem extends { id?: number; order: number },
  TField extends Extract<keyof TItem, string>,
>({
  row,
  column,
  isEditing,
  updateField,
}: EntityListFieldProps<TItem, TField>) {
  const value = row.current[column.field];
  const disabled = row.state === 'deleted';
  const editable = resolveEntityListColumn(column, row.current);
  const context: EntityListCellContext<TItem, TItem[TField]> = {
    row: row.current,
    value,
    rowState: row.state,
    isEditing,
    disabled,
    error: row.errors[column.field],
    update: (nextValue) => updateField(row.clientId, column.field, nextValue),
  };

  if (column.editor && isEditing && editable && !disabled) {
    return column.editor(context);
  }

  if (column.type === 'switch') {
    return (
      <AdminToggleSwitch
        active={Boolean(value)}
        disabled={disabled || !editable}
        onClick={() => context.update((!value) as TItem[TField])}
      />
    );
  }

  if (column.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        disabled={disabled || !editable}
        className="h-4 w-4 accent-primary"
        onChange={(event) => context.update(event.target.checked as TItem[TField])}
      />
    );
  }

  if (isEditing && editable && !disabled) {
    if (column.type === 'select') {
      return (
        <select
          value={String(value ?? '')}
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-medium text-gray-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          onChange={(event) =>
            context.update(coerceEntityListValue(column, event.target.value) as TItem[TField])
          }
        >
          {column.options?.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={column.type === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        placeholder={column.placeholder}
        className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
        onChange={(event) =>
          context.update(coerceEntityListValue(column, event.target.value) as TItem[TField])
        }
      />
    );
  }

  if (column.render) {
    return column.render(context);
  }

  return <span>{getEntityListValueLabel(column, value)}</span>;
}
