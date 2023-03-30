import { useEffect } from 'react';
import { createStyles, rem, Text, TextInput, Button, Checkbox, MultiSelect } from '@mantine/core';
import { tw } from 'twind';
import { upperFirst, lowerCase } from 'lodash';
import { useListState } from '@mantine/hooks';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { IconGripVertical, IconTrash} from '@tabler/icons-react';
import { FieldOption, HHFieldBase, InputType, HHFieldWithPosition, MeasurementUnit } from '../types/Inputs';
import { listToFieldOptions } from "../../utils/form-builder"
import { inputIconsMap } from "../../pages/index.tsx"

let YesNoOptions: FieldOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" }
];

const measurementOptions: MeasurementUnit[] = ['cm', 'm', 'kg', 'lb', 'in', 'ft', 'mmHg', 'cmH2O', 'mmH2O', 'mmol/L', 'mg/dL', 'C', 'F', 'BPM', 'P', 'M', 'mmol/L', 'mg/dL', '%', 'units'];

const useStyles = createStyles((theme) => ({
  item: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    border: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]
    }`,
    padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
    paddingLeft: `calc(${theme.spacing.xl} - ${theme.spacing.md})`, // to offset drag handle
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.white,
    marginBottom: theme.spacing.sm,
  },

  itemDragging: {
    boxShadow: theme.shadows.sm,
  },

  symbol: {
    fontSize: rem(30),
    fontWeight: 700,
    width: rem(60),
  },

  dragHandle: {
    ...theme.fn.focusStyles(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[6],
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },
}));

type DndListHandleProps = {
  data: HHFieldWithPosition[];
  onRemoveField: (id: string) => void;
  onFieldChange: (id: string, key: string, value: any) => void
  onFieldOptionChange: (id: string, options: FieldOption[]) => void;
  onFieldUnitChange: (id: string, units: DoseUnit[] | false) => void;
}

export function InputSettingsList({ data, onRemoveField, onFieldChange, onFieldOptionChange, onFieldUnitChange }: DndListHandleProps) {
  const { classes, cx } = useStyles();
  const [state, handlers] = useListState(data);

  // On change of incoming data props, update the listState
  useEffect(() => {
    handlers.setState(data);
  }, [data])

  const items = state.map((item, index) => (
    <Draggable key={item.id} index={index} draggableId={item.id}>
      {(provided, snapshot) => (
        <div
          className={cx(classes.item, { [classes.itemDragging]: snapshot.isDragging })}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div {...provided.dragHandleProps} className={classes.dragHandle}>
            <IconGripVertical size="1.05rem" stroke={1.5} />
          </div>
          <div className={tw("w-full")}>
            <h3 className={tw("text-lg font-bold")}>{upperFirst(item.inputType)} Input</h3>
            <TextInput label={"Name"} defaultValue={item.name} onChange={e => onFieldChange(item.id, "name", e.currentTarget.value)} />
            <TextInput label="Description (Optional)" onChange={e => onFieldChange(item.id, "description", e.currentTarget.value)} />
            <Text color="dimmed" size="sm">
              Type: {item.inputType}
            </Text>

          {["select", "dropdown", "checkbox", "radio"].includes(item.inputType) && (
            <>
              <MultiSelect
                label="Add options"
                data={fieldOptionsUnion(YesNoOptions, item.options || [])}
                placeholder="Select items"
                searchable
                value={item.options.map((option: any) => option.value)}
                creatable
                onChange={(value) => {
                  const fieldOptionsArray = value.map((option: any) => ({ value: lowerCase(option), label: upperFirst(option) }))
                  onFieldOptionChange(item.id, fieldOptionsArray)
                }}
                getCreateLabel={(query) => `+ Create ${query}`}
                onCreate={(query) => {
                  // Lower case and make camel case
                  const newOption = { value: lowerCase(query), label: query };
                  console.log({ newOption })
                  onFieldOptionChange(item.id, [...item.options, newOption])
                  // setData((current) => [...current, item]);
                  // return item;
                }}
              />
          </>
          )}

            {
            item.inputType === "number" && <Checkbox
              className={tw("py-2")}
              onChange={(e) => onFieldUnitChange(item.id, e.currentTarget.checked ? listToFieldOptions(measurementOptions) : false)}
              checked={item.units && item.units.length > 0}
              label="Has Units"
            />
            }

            <Checkbox
              className={tw("py-2")}
              onChange={(e) => onFieldChange(item.id, "required", e.currentTarget.checked)}
              checked={item.required}
              label="Required Field"
            />

            <div className={tw("pt-4")}>
              <Button onClick={() => onRemoveField(item.id)} compact variant="subtle" color="red" leftIcon={<IconTrash size="1rem" />}>
                 Remove 
                </Button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  ));

  console.log("items", state)

  return (
    <DragDropContext
      onDragEnd={({ destination, source }) =>
        handlers.reorder({ from: source.index, to: destination?.index || 0 })
      }
    >
      <Droppable droppableId="dnd-list" direction="vertical">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {items}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}


// Return the union of two field options arrays
function fieldOptionsUnion(options1: FieldOption[], options2: FieldOption[]): FieldOption[] {
  const options1Map = options1.reduce((acc, option) => ({ ...acc, [option.value]: option }), {});
  const options2Map = options2.reduce((acc, option) => ({ ...acc, [option.value]: option }), {});

  return Object.values({ ...options1Map, ...options2Map });
}