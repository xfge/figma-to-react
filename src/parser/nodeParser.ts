import { FluentComponentType } from '../fluentTypes'
import {
  parseActivityItem,
  parseBreadcrumb,
  parseDatePicker,
  parseDetailsList,
  parseStack,
  parseGroupedList,
  parseLabel,
  parseMessageBar,
  parseNav,
  parseButton,
  parseCheckbox,
  parseChoiceGroup,
  parseCommandbar,
  parseDropdown,
  parseFacePile,
  parseIcon,
  parseLink,
  parseOverflowSet,
  parsePersona,
  parsePivot,
  parseRadioButton,
  parseSearchBox,
  parseSpinButton,
  parseTextField,
  parseToggle,
  parsePeoplePicker,
  parseProgressIndicator,
  parseRating,
  parseSeparator,
  parseSpinner,
  parseTagPicker,
  parseTeachingBubble
} from './rules'
import { Tag } from '../types'

export const parseFigmaNode = (node: SceneNode, tag: Tag) => {
  if (node.type === 'FRAME' && (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL')) {
    parseStack(node, tag)
  }

  // InstanceNode is assumed as a common component from Fluent UI
  if (node.type === 'INSTANCE') {
    if (node.name === 'Button') {
      parseButton(node, tag)
    }

    if (node.name === 'Icon') {
      parseIcon(node, tag)
    }

    if (node.name === 'Link') {
      parseLink(node, tag)
    }

    if (node.name === 'OverflowSet') {
      parseOverflowSet(node, tag)
    }

    if (node.name === 'SearchBox') {
      parseSearchBox(node, tag)
    }

    if (node.name.toLocaleLowerCase().includes('textfield')) {
      parseTextField(node, tag)
    }

    if (node.name.toLowerCase().includes('dropdown')) {
      parseDropdown(node, tag)
    }

    if (node.name === 'SpinButton') {
      parseSpinButton(node, tag)
    }

    if (node.name === 'Checkbox') {
      parseCheckbox(node, tag)
    }

    if (node.name === 'Radio Button') {
      parseRadioButton(node, tag)
    }

    if (node.name === 'ChoiceGroup') {
      parseChoiceGroup(node, tag)
    }

    if (node.name.startsWith('Toggle')) {
      parseToggle(node, tag)
    }

    if (node.name === 'Facepile') {
      parseFacePile(node, tag)
    }

    if (node.name === 'Persona') {
      parsePersona(node, tag)
    }

    if (node.name === 'CommandBar') {
      parseCommandbar(node, tag)
    }

    if (node.name === 'Pivot') {
      parsePivot(node, tag)
    }

    if (node.name === 'Pivot-stack') {
      tag.fluentType = FluentComponentType.Pivot
    }

    if (node.name.includes('DatePicker')) {
      parseDatePicker(node, tag)
    }

    if (node.name === 'PeoplePicker') {
      parsePeoplePicker(node, tag)
    }

    if (node.name === 'TagPicker') {
      parseTagPicker(node, tag)
    }

    if (node.name.includes('DetailsList')) {
      parseDetailsList(node, tag)
    }

    if (node.name.includes('GroupedList')) {
      parseGroupedList(node, tag)
    }

    if (node.name.includes('Breadcrumbs')) {
      parseBreadcrumb(node, tag)
    }

    if (node.name === '-Nav') {
      parseNav(node, tag)
    }

    if (node.name.includes('MessageBar')) {
      parseMessageBar(node, tag)
    }

    if (node.name.includes('TeachingBubble')) {
      parseTeachingBubble(node, tag)
    }

    if (node.name === 'Progress indicator') {
      parseProgressIndicator(node, tag)
    }

    if (node.name === 'Spinner') {
      parseSpinner(node, tag)
    }

    if (node.name === 'ActivityItem') {
      parseActivityItem(node, tag)
    }

    if (node.name === 'Label') {
      parseLabel(node, tag)
    }

    if (node.name === 'Slider') {
      tag.fluentType = FluentComponentType.Slider
      tag.children = []
    }

    if (node.name.includes('Rating')) {
      parseRating(node, tag)
    }

    if (node.name === 'Separator') {
      parseSeparator(node, tag)
    }
  }
}
