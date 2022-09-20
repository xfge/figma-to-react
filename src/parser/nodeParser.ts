import { FluentComponentType, fluentNames } from '../fluentTypes'
import {
  parseActivityItem,
  parseBreadcrumb,
  parseButton,
  parseCheckbox,
  parseChoiceGroup,
  parseCommandbar,
  parseDatePicker,
  parseDetailsList,
  parseDropdown,
  parseFacePile,
  parseGroupedList,
  parseLabel,
  parseLink,
  parseMessageBar,
  parseNav,
  parseOverflowSet,
  parsePeoplePicker,
  parsePersona,
  parsePivot,
  parsePivotItem,
  parseProgressIndicator,
  parseRadioButton,
  parseRating,
  parseSearchBox,
  parseSeparator,
  parseSlider,
  parseSpinButton,
  parseSpinner,
  parseStack,
  parseTagPicker,
  parseTeachingBubble,
  parseTextField,
  parseToggle
} from './rules'
import { Tag } from '../types'

export const parseFigmaNode = (node: SceneNode, tag: Tag) => {
  if (node.type === 'FRAME' && (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL')) {
    parseStack(node, tag)
  }

  // InstanceNode is assumed as a common component from Fluent UI
  if (node.type === 'INSTANCE') {
    // Use the main component to infer the Fluent component type
    if (node.mainComponent) {
      switch (getFluentType(node.mainComponent)) {
        case FluentComponentType.PrimaryButton:
        case FluentComponentType.DefaultButton:
        case FluentComponentType.ActionButton:
        case FluentComponentType.IconButton:
          parseButton(node, tag)
          break
        case FluentComponentType.Link:
          parseLink(node, tag)
          break
        case FluentComponentType.OverflowSet:
          parseOverflowSet(node, tag)
          break
        case FluentComponentType.SearchBox:
          parseSearchBox(node, tag)
          break
        case FluentComponentType.TextField:
          parseTextField(node, tag)
          break
        case FluentComponentType.Dropdown:
          parseDropdown(node, tag)
          break
        case FluentComponentType.SpinButton:
          parseSpinButton(node, tag)
          break
        case FluentComponentType.CheckBox:
          parseCheckbox(node, tag)
          break
        case FluentComponentType.ChoiceGroupOption:
          parseRadioButton(node, tag)
          break
        case FluentComponentType.ChoiceGroup:
          parseChoiceGroup(node, tag)
          break
        case FluentComponentType.Toggle:
          parseToggle(node, tag)
          break
        case FluentComponentType.Facepile:
          parseFacePile(node, tag)
          break
        case FluentComponentType.Persona:
          parsePersona(node, tag)
          break
        case FluentComponentType.CommandBar:
          parseCommandbar(node, tag)
          break
        case FluentComponentType.PivotItem:
          parsePivotItem(node, tag)
          break
        case FluentComponentType.Pivot:
          parsePivot(tag)
          break
        case FluentComponentType.DatePicker:
          parseDatePicker(node, tag)
          break
        case FluentComponentType.NormalPeoplePicker:
          parsePeoplePicker(node, tag)
          break
        case FluentComponentType.TagPicker:
          parseTagPicker(node, tag)
          break
        case FluentComponentType.DetailsList:
          parseDetailsList(node, tag)
          break
        case FluentComponentType.GroupedList:
          parseGroupedList(node, tag)
          break
        case FluentComponentType.Breadcrumb:
          parseBreadcrumb(node, tag)
          break
        case FluentComponentType.Nav:
          parseNav(node, tag)
          break
        case FluentComponentType.MessageBar:
          parseMessageBar(node, tag)
          break
        case FluentComponentType.TeachingBubble:
          parseTeachingBubble(node, tag)
          break
        case FluentComponentType.ProgressIndicator:
          parseProgressIndicator(node, tag)
          break
        case FluentComponentType.Spinner:
          parseSpinner(node, tag)
          break
        case FluentComponentType.ActivityItem:
          parseActivityItem(node, tag)
          break
        case FluentComponentType.Label:
          parseLabel(node, tag)
          break
        case FluentComponentType.Slider:
          parseSlider(tag)
          break
        case FluentComponentType.Rating:
          parseRating(node, tag)
          break
        case FluentComponentType.Separator:
          parseSeparator(node, tag)
          break
        default:
          break
      }
    }
  }
}

const getFluentType = (node: ComponentNode): FluentComponentType | undefined => {
  const description = node.description

  if (description) {
    const match = description.match(/Fluent component: (.*)/)

    if (match) {
      const name = match[1].trim()
      if (fluentNames.includes(name)) {
        return name as FluentComponentType
      } else {
        if (name === 'Pivot stack') {
          return FluentComponentType.Pivot
        }
      }
    }
  }
  return undefined
}
