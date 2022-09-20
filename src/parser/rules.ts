import * as JSON5 from 'json5'
import { kebabize, smallCamel } from '../utils/stringUtils'
import { parseCommonFigmaVariants, parseFigmaNestedItems, parseFigmaVariant } from './shared'
import { Property, Tag } from '../types'
import { FluentComponentType } from '../fluentTypes'

export const parseStack = (node: FrameNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Stack

  const stackTokens: { childrenGap?: number; paddingLeft?: number; paddingRight?: number; paddingBottom?: number; paddingTop?: number } = {}
  const { itemSpacing, paddingLeft, paddingRight, paddingBottom, paddingTop } = node
  if (itemSpacing !== 0) {
    stackTokens.childrenGap = itemSpacing
  }

  if (paddingLeft !== 0) {
    stackTokens.paddingLeft = paddingLeft
  }
  if (paddingRight !== 0) {
    stackTokens.paddingRight = paddingRight
  }
  if (paddingBottom !== 0) {
    stackTokens.paddingBottom = paddingBottom
  }
  if (paddingTop !== 0) {
    stackTokens.paddingTop = paddingTop
  }

  const tokensStringValue = JSON5.stringify(stackTokens, null, 4).replace('}', '  }')
  if (tokensStringValue !== '{  }') {
    const nodeName = node.name.replaceAll(' ', '')
    const tokensVarName = smallCamel(`${nodeName}StackTokens`)
    tag.properties.push({ name: 'tokens', value: tokensVarName, notStringValue: true })
    tag.variables[tokensVarName] = tokensStringValue
  }

  const isHorizontal = node.layoutMode === 'HORIZONTAL'

  if (node.primaryAxisAlignItems) {
    let value = ''
    if (node.primaryAxisAlignItems == 'SPACE_BETWEEN') {
      value = 'space-between'
    } else if (node.primaryAxisAlignItems == 'CENTER') {
      value = 'center'
    } else if (node.primaryAxisAlignItems == 'MIN') {
      value = 'start'
    } else if (node.primaryAxisAlignItems == 'MAX') {
      value = 'end'
    }
    tag.properties.push({ name: `${isHorizontal ? 'horizontal' : 'vertical'}Align`, value: value })
  }

  if (node.counterAxisAlignItems) {
    let value = ''
    if (node.counterAxisAlignItems == 'CENTER') {
      value = 'center'
    } else if (node.counterAxisAlignItems == 'MIN') {
      value = 'start'
    } else if (node.counterAxisAlignItems == 'MAX') {
      value = 'end'
    }
    tag.properties.push({ name: `${isHorizontal ? 'vertical' : 'horizontal'}Align`, value: value })
  }

  if (isHorizontal) {
    tag.properties.push({ name: 'horizontal', value: null })
  }
}

export const parseButton = (node: InstanceNode, tag: Tag) => {
  if (node.variantProperties) {
    switch (node.variantProperties['Type']) {
      case 'Primary':
        tag.fluentType = FluentComponentType.PrimaryButton
        break
      case 'Action':
        tag.fluentType = FluentComponentType.ActionButton
        break
      case 'Secondary':
      default:
        tag.fluentType = FluentComponentType.DefaultButton
    }
  }
  parseFigmaVariant(node, 'Icon', 'True', tag.properties, 'iconProps', `{ iconName: 'TODO' }`, true)
  parseCommonButton(node, tag.properties)
  parseCommonText(tag.children, 'String-button', tag.properties, 'text')
  tag.children = []
}

export const parseIcon = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.IconButton
  const iconChild = tag.children.find((childTag) => childTag.isText)
  if (iconChild) {
    tag.properties.push({ name: 'iconProps', value: `{ iconName: '${iconChild.name}' }`, notStringValue: true })
  }
  parseCommonButton(node, tag.properties)
  tag.children = []
}

export const parseLink = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Link

  parseCommonFigmaVariants(node, tag.properties)

  tag.properties.push({ name: 'href', value: '' }, { name: 'underline', value: null })

  const stringChild = tag.children.find((childTag) => childTag.isText)
  if (stringChild) {
    tag.isText = true
    tag.textCharacters = stringChild.textCharacters
  }

  tag.children = []
}

export const parseOverflowSet = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.OverflowSet

  const items = tag.children.map((_, index) => {
    return `{ key: '${index}', icon: 'TODO', name: 'TODO', title: 'TODO', ariaLabel: 'TODO' }`
  })
  tag.properties.push({ name: 'items', value: items.length > 0 ? `[ ${items.join(' ')} ]` : '', notStringValue: true })

  parseFigmaVariant(node, 'Direction', 'Vertical', tag.properties, 'vertical', null)

  tag.children = []
}

export const parseSearchBox = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.SearchBox

  parseCommonFigmaVariants(node, tag.properties)
  parseFigmaVariant(node, 'Type', 'Underline', tag.properties, 'underlined', null)
  parseCommonText(tag.children, 'String', tag.properties, 'placeholder')

  tag.children = []
}

export const parseTextField = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.TextField
  parseCommonFigmaVariants(node, tag.properties)
  parseFigmaVariant(node, 'Type', 'Underlined', tag.properties, 'underlined', null)
  parseFigmaVariant(node, 'Type', 'Borderless', tag.properties, 'borderless', null)
  parseFigmaVariant(node, 'Icon', 'True', tag.properties, 'iconProps', "{ iconName: 'TODO' }")
  parseFigmaVariant(node, 'Multiline', 'True', tag.properties, 'multiline', null)
  parseFigmaVariant(node, 'Multiline', 'True', tag.properties, 'row', '3', true)
  parseLabelAndPlaceholder(tag.children, tag.properties, 'TextField')
  tag.children = []
}

export const parseDropdown = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Dropdown
  parseCommonFigmaVariants(node, tag.properties)
  parseLabelAndPlaceholder(tag.children, tag.properties, 'Dropdown')
  tag.children = []
}

export const parseSpinButton = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.SpinButton
  parseCommonFigmaVariants(node, tag.properties)
  tag.children = []
}

export const parseCheckbox = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.CheckBox
  parseCommonFigmaVariants(node, tag.properties)
  parseFigmaVariant(node, 'Checked', 'True', tag.properties, 'checked', 'true', true)
  parseFigmaVariant(node, 'Indeterminate', 'True', tag.properties, 'indeterminate', 'true', true)
  parseCommonText(tag.children, 'String', tag.properties, 'label')
  tag.children = []
}

export const parseRadioButton = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.ChoiceGroupOption
  parseCommonFigmaVariants(node, tag.properties)
  parseFigmaVariant(node, 'Checked', 'True', tag.properties, 'checked', 'true', true)
  parseFigmaVariant(node, 'Type', 'Thumbnail', tag.properties, 'imageSrc', 'TODO')

  tag.properties.push({ name: 'key', value: 'TODO' })
  const stringContainerTag = tag.children.find((child) => child.name === 'String-container')
  parseCommonText(stringContainerTag?.children ?? tag.children, stringContainerTag ? 'String-option' : 'String', tag.properties, 'text')

  tag.children = []
}

export const parseChoiceGroup = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.ChoiceGroup
  parseCommonText(tag.children, 'Label', tag.properties, 'label')
  parseFigmaNestedItems(tag.children, tag.properties, 'options', node.name, tag.variables)
  tag.children = []
}

export const parseToggle = (node: InstanceNode, tag: Tag) => {
  // 'Toggle' or 'Toggle-label'
  tag.fluentType = FluentComponentType.Toggle
  if (node.name === 'Toggle-label') {
    parseLabelAndPlaceholder(tag.children, tag.properties, 'Dropdown')
    tag.children.find((child) => child.fluentType === FluentComponentType.Toggle)?.properties.forEach((p) => tag.properties.push(p))
  }

  parseCommonFigmaVariants(node, tag.properties)
  parseFigmaVariant(node, 'OFF | ON', 'True', tag.properties, 'checked', 'true', true)

  const toggleContainer = tag.children.find((child) => child.name === 'Toggle-container')
  if (toggleContainer) {
    const stringContainer = toggleContainer.children.find((child) => child.name === 'String-container')
    if (stringContainer && node.variantProperties) {
      parseCommonText(stringContainer.children, 'String-toggle', tag.properties, node.variantProperties['OFF | ON'] === 'True' ? 'onText' : 'offText')
    }
  }

  tag.children = []
}

export const parseFacePile = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Facepile

  const facepileOverflowNode = tag.children.find((child) => child.name === 'Facepile-Overflow')?.node
  if (facepileOverflowNode) {
    parseFigmaVariant(facepileOverflowNode as InstanceNode, 'Type', 'Descriptive', tag.properties, 'overflowButtonType', 'OverflowButtonType.descriptive', true)
    parseFigmaVariant(facepileOverflowNode as InstanceNode, 'Type', 'Chevron', tag.properties, 'overflowButtonType', 'OverflowButtonType.downArrow', true)
    parseFigmaVariant(facepileOverflowNode as InstanceNode, 'Type', 'More', tag.properties, 'overflowButtonType', 'OverflowButtonType.more', true)
  }

  parseFigmaNestedItems(tag.children.find((child) => child.name === 'Flex-container')?.children ?? [], tag.properties, 'personas', node.name, tag.variables)

  tag.children = []
}

export const parsePersona = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Persona

  if (node.variantProperties) {
    if (node.variantProperties['Size']) {
      tag.properties.push({ name: 'size', value: `PersonaSize.size${node.variantProperties['Size']}`, notStringValue: true })
    }
    if (node.variantProperties['Initials'] === 'False') {
      tag.properties.push({ name: 'imgUrl', value: 'TODO' })
    }
    if (node.variantProperties['Details'] === 'False') {
      tag.properties.push({ name: 'hidePersonaDetails', value: 'true', notStringValue: true })
    }
    if (node.variantProperties['Status'] === 'True') {
      tag.properties.push({ name: 'presence', value: 'PersonaPresence.online', notStringValue: true })
    }
  }

  const detailsContainerTag = tag.children.find((child) => child.name === 'Details-container')
  if (detailsContainerTag) {
    parseCommonText(detailsContainerTag.children, 'String-name', tag.properties, 'text')
    parseCommonText(detailsContainerTag.children, 'String-secondary', tag.properties, 'secondaryText')
    parseCommonText(detailsContainerTag.children, 'String-tertiary', tag.properties, 'tertiaryText')
  }

  tag.children = []
}

export const parseCommandbar = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.CommandBar

  const primaryContainerTag = tag.children.find((child) => child.name === 'primary-commands-container')
  if (primaryContainerTag && primaryContainerTag.children.length > 0) {
    tag.properties.push({ name: 'items', value: getCommandBarItemProps(primaryContainerTag), notStringValue: true })
  }

  const secondaryContainerTag = tag.children.find((child) => child.name === 'secondary-commands-container')
  if (secondaryContainerTag && secondaryContainerTag.children.length > 0) {
    tag.properties.push({ name: 'farItems', value: getCommandBarItemProps(secondaryContainerTag), notStringValue: true })
  }

  tag.children = []
}

export const parsePivot = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.PivotItem
  const containerTag = tag.children.find((child) => child.node.name === 'String-auto-layout' || child.node.name === 'String-icon-auto-layout')
  if (containerTag) {
    parseCommonText(containerTag.children, 'String', tag.properties, 'headerText')
    const iconTag = containerTag.children.find((child) => child.node.name === 'String-icon')
    if (iconTag) {
      tag.properties.push({ name: 'itemIcon', value: 'TODO' })
    }
  }
  tag.children = []
}

export const parseDatePicker = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.DatePicker
  parseCommonFigmaVariants(node, tag.properties)
  const textFieldTag = tag.children.find((child) => child.fluentType === FluentComponentType.TextField) // already parsed
  if (textFieldTag) {
    const labelProp = textFieldTag.properties.find((p) => p.name === 'label')
    if (labelProp) {
      tag.properties.push({ name: 'label', value: labelProp.value })
    }
    const placeholderProp = textFieldTag.properties.find((p) => p.name === 'placeholder')
    if (placeholderProp) {
      tag.properties.push({ name: 'placeholder', value: placeholderProp.value })
    }
  }
  tag.children = []
}

export const parsePeoplePicker = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.NormalPeoplePicker
  parseCommonFigmaVariants(node, tag.properties)
  tag.properties.push({ name: 'onResolveSuggestions', value: '(filterText, currentPersonas) => []', notStringValue: true })
  tag.children = []
}

export const parseTagPicker = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.TagPicker
  parseCommonFigmaVariants(node, tag.properties)
  tag.properties.push({ name: 'onResolveSuggestions', value: '(filter) => []', notStringValue: true })
  tag.children = []
}

export const parseDetailsList = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.DetailsList
  parseList(node, tag.children, tag.properties, tag.variables)
  tag.children = []
}

export const parseGroupedList = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.GroupedList
  parseList(node, tag.children, tag.properties, tag.variables)
  tag.children = []
}

export const parseBreadcrumb = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Breadcrumb

  const itemsVarName = `${smallCamel(node.name)}Items`
  tag.properties.push({ name: 'items', value: itemsVarName, notStringValue: true })
  tag.variables[itemsVarName] = `${getBreadcrumbProps(tag.children)}`

  tag.children = []
}

export const parseNav = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Nav

  const { properties } = tag

  const linkStrings: string[] = []
  const navigationListTag = tag.children.find((child) => child.name === 'Navigation-list')
  if (navigationListTag) {
    navigationListTag.children.forEach((navItemTag) => {
      const LinkName = navItemTag.children.find((child) => child.isText && child.name === 'String')?.textCharacters ?? 'TODO'
      if (navItemTag.name.includes('NavItem-Icon')) {
        linkStrings.push(`{ key: 'key${linkStrings.length}', name: '${LinkName}', url: 'TODO', icon: 'TODO' },`)
      } else {
        linkStrings.push(`{ key: 'key${linkStrings.length}', name: '${LinkName}', url: 'TODO' },`)
      }
    })
  }

  properties.push({ name: 'groups', value: `{ links: [${linkStrings.join(' ')}] }`, notStringValue: true })

  tag.children = []
}

export const parseMessageBar = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.MessageBar

  const { properties } = tag

  const messageStringTag = tag.children.find((child) => child.name === 'String-message')
  if (messageStringTag) {
    tag.children = [messageStringTag]
  }

  properties.push({ name: 'onDismiss', value: '() => { return }', notStringValue: true })

  parseFigmaVariant(node, 'Type', 'Blocked', properties, 'messageBarType', 'MessageBarType.blocked', true)
  parseFigmaVariant(node, 'Type', 'Error', properties, 'messageBarType', 'MessageBarType.error', true)
  parseFigmaVariant(node, 'Type', 'Info', properties, 'messageBarType', 'MessageBarType.info', true)
  parseFigmaVariant(node, 'Type', 'Severe-Warning', properties, 'messageBarType', 'MessageBarType.severeWarning', true)
  parseFigmaVariant(node, 'Type', 'Success', properties, 'messageBarType', 'MessageBarType.success', true)
  parseFigmaVariant(node, 'Type', 'Warning', properties, 'messageBarType', 'MessageBarType.warning', true)

  parseFigmaVariant(node, 'Actions', 'Single action', properties, 'actions', '<MessageBarButton>Action</MessageBarButton>', true)
  parseFigmaVariant(node, 'Actions', 'Multi action', properties, 'actions', '<div><MessageBarButton>Yes</MessageBarButton><MessageBarButton>No</MessageBarButton></div>', true)

  parseFigmaVariant(node, 'State', 'Collapsed', properties, 'truncated', 'true', true)
  parseFigmaVariant(node, 'State', 'Expanded', properties, 'truncated', 'true', true)
}

export const parseTeachingBubble = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.TeachingBubble

  const { properties } = tag

  if (node.name.includes('Wide')) {
    properties.push({ name: 'isWide', value: 'true', notStringValue: true })
  }
  if (node.name.includes('Condensed')) {
    properties.push({ name: 'hasCondensedHeadline', value: 'true', notStringValue: true })
  }
  if (node.name.includes('Illustration')) {
    properties.push({ name: 'illustrationImage', value: "{ src: 'TODO', alt: 'TODO' }", notStringValue: true })
  }

  const bodyContainerTag =
    tag.children.find((child) => child.name === 'Body-content') ?? tag.children.find((child) => child.name === 'Body')?.children.find((child) => child.name === 'Body-content')
  if (bodyContainerTag) {
    const headerLargeTag = bodyContainerTag.children.find((child) => child.name === 'Header-large')
    if (headerLargeTag) {
      const stringHeadlineTag = headerLargeTag.children.find((child) => child.name === 'String-headline')
      if (stringHeadlineTag) {
        properties.push({ name: 'headline', value: stringHeadlineTag.textCharacters ?? '' })
      }
      const dismissTag = headerLargeTag.children.find((child) => child.name === 'Sub-components / Dismiss')
      if (dismissTag) {
        properties.push({ name: 'hasCloseButton', value: 'true', notStringValue: true })
      }
    }
    const footerTag = bodyContainerTag.children.find((child) => child.name === 'Footer-content')
    if (footerTag) {
      const actionsStackTag = footerTag.children.find((child) => child.name === 'Actions-stack')
      if (actionsStackTag) {
        const primaryButtonTag = actionsStackTag.children
          .find((child) => child.name.includes('Sub-components / Primary'))
          ?.children.find((child) => child.name.includes('Sub-components / Button'))
          ?.children.find((child) => child.name === 'Button')
        properties.push({ name: 'primaryButtonProps', value: `{ children: '${primaryButtonTag?.textCharacters ?? 'TODO'}' }`, notStringValue: true })
        const secondaryButtonTag = actionsStackTag.children
          .find((child) => child.name.includes('Sub-components / Secondary'))
          ?.children.find((child) => child.name.includes('Sub-components / Button'))
          ?.children.find((child) => child.name === 'Button')
        properties.push({ name: 'secondaryButtonProps', value: `{ children: '${secondaryButtonTag?.textCharacters ?? 'TODO'}' }`, notStringValue: true })
      }
      const multiStepContainerTag = footerTag.children.find((child) => child.name === 'Multi-step')
      if (multiStepContainerTag) {
        parseCommonText(multiStepContainerTag.children, 'String-step', properties, 'footerContent')
      }
    }
    const subTextTag = bodyContainerTag.children.find((child) => child.name === 'String-subtext')
    if (subTextTag) {
      tag.children = [subTextTag]
    }
  }
  if (tag.children.length > 1) {
    tag.children = []
  }
}

export const parseProgressIndicator = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.ProgressIndicator

  const labelContainerTag = tag.children.find((child) => child.name === 'Label-container')
  if (labelContainerTag) {
    parseCommonText(labelContainerTag.children, 'String-label', tag.properties, 'label')
  }

  parseCommonText(tag.children, 'String-description', tag.properties, 'description')

  if (node.variantProperties) {
    if (node.variantProperties['Indeterminate'] === 'False') {
      tag.properties.push({ name: 'percentComplete', value: '0.2', notStringValue: true })
    }
  }

  tag.children = []
}

export const parseSpinner = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Spinner

  const { properties } = tag

  if (node.variantProperties) {
    switch (node.variantProperties['Size']) {
      case '12':
        properties.push({ name: 'size', value: 'SpinnerSize.xSmall', notStringValue: true })
        break
      case '16':
        properties.push({ name: 'size', value: 'SpinnerSize.small', notStringValue: true })
        break
      case '28':
        properties.push({ name: 'size', value: 'SpinnerSize.large', notStringValue: true })
        break
      default:
        properties.push({ name: 'size', value: 'SpinnerSize.medium', notStringValue: true })
        break
    }
    if (node.variantProperties['Label'] !== 'None') {
      properties.push({ name: 'label', value: 'Loading...' })
      properties.push({ name: 'labelPosition', value: node.variantProperties['Label'].toLowerCase() })
    }
  }

  tag.children = []
}

export const parseActivityItem = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.ActivityItem

  const { properties } = tag

  const stringContainer = tag.children.find((child) => child.name === 'String-container')
  if (stringContainer) {
    parseCommonText(stringContainer.children, 'String-activityDescription', properties, 'activityDescription')
    parseCommonText(stringContainer.children, 'String-comment', properties, 'comments')
    parseCommonText(stringContainer.children, 'String-timeStamp', properties, 'timestamp')
  }

  if (node.variantProperties) {
    if (node.variantProperties['Icon'] === 'True') {
      properties.push({ name: 'activityIcon', value: "<Icon iconName='TODO' />" })
    }
    if (node.variantProperties['Persona'] === 'True') {
      properties.push({ name: 'activityPersonas', value: "[{ imageUrl: 'TODO', text: 'TODO' }", notStringValue: true })
    }
    if (node.variantProperties['Compact'] === 'True') {
      properties.push({ name: 'isCompact', value: 'true', notStringValue: true })
    }
  }

  tag.children = []
}

export const parseLabel = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Label
  const stringChild = tag.children.find((childTag) => childTag.isText)
  if (stringChild) {
    tag.isText = true
    tag.textCharacters = stringChild.textCharacters
  }
  tag.children = []
}

export const parseRating = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Rating
  if (node.variantProperties && node.variantProperties['Stars']) {
    tag.properties.push({ name: 'rating', value: node.variantProperties['Stars'], notStringValue: true })
  }
  tag.children = []
}

export const parseSeparator = (node: InstanceNode, tag: Tag) => {
  tag.fluentType = FluentComponentType.Separator

  const { properties } = tag

  if (node.variantProperties) {
    if (node.variantProperties['Vertical'] === 'True') {
      properties.push({ name: 'vertical', value: null })
    }
    if (node.variantProperties['String'] !== 'None') {
      if (node.variantProperties['String'] === 'Center') {
        properties.push({ name: 'alignContent', value: 'center' })
      } else if (node.variantProperties['String'] === 'Top' || node.variantProperties['String'] === 'Left') {
        properties.push({ name: 'alignContent', value: 'start' })
      } else if (node.variantProperties['String'] === 'Down' || node.variantProperties['String'] === 'Right') {
        properties.push({ name: 'alignContent', value: 'start' })
      }
    }
    const separatorContentTag = tag.children.find((child) => child.name === 'Separator-content')
    const stringContainerTag = (separatorContentTag?.children ?? tag.children).find((child) => child.name === 'String-auto-layout')
    if (stringContainerTag) {
      tag.children = stringContainerTag.children
    }
  }
}

/**
 * Shared functions
 */

const getCommandBarItemProps = (containerTag: Tag): string => {
  const items = containerTag.children.map((childTag, index) => {
    if (childTag.name === 'Button') {
      // already parsed
      const textProperty = childTag.properties.find((p) => p.name === 'text')
      return `{ key: '${index}', text: '${textProperty?.value ?? ''}', iconProps: { iconName: 'TODO' }},`
    }
    if (childTag.name === 'Icon') {
      const iconPropsProperty = childTag.properties.find((p) => p.name === 'iconProps')
      return `{ key: '${index}', text: 'TODO', ariaLabel: 'TODO', iconOnly: true, iconProps: ${iconPropsProperty?.value} }`
    }
  })
  return items.length > 0 ? `[ ${items.join(' ')} ]` : ''
}

const getBreadcrumbProps = (childTags: Tag[]): string => {
  const items = childTags.map((childTag, index) => {
    const itemLinkTag = childTag.children.find((child) => child.name === 'Item-link')
    const buttonTag = (itemLinkTag ?? childTag).children.find((child) => child.name === 'Button')
    if (buttonTag) {
      const textProperty = buttonTag.properties.find((child) => child.name === 'text')
      return `{ key: '${index}', text: '${textProperty?.value ?? ''}'${childTag.name.includes('Selected') ? ', isCurrentItem: true' : ''} }`
    }
  })
  return items.length > 0 ? `[ ${items.join(',')} ]` : ''
}

const parseList = (node: InstanceNode, childTags: Tag[], properties: Property[], variables: { [key: string]: string }) => {
  if (node.name.includes('Compact')) {
    properties.push({ name: 'compact', value: 'true', notStringValue: true })
  }
  const headerContainerTag = childTags.find((child) => child.name.includes('DetailsHeader'))
  const columnStrings: string[] = []
  headerContainerTag?.children.forEach((columnContainerTag) => {
    columnContainerTag?.children.forEach((columnComponentTag) => {
      if (columnComponentTag.name.includes('Cell-Icon')) {
        columnStrings.push(`{ key: 'column${columnStrings.length}', name: 'TODO', iconName: 'TODO', isIconOnly: true, fieldName: 'TODO' },`)
      }
      if (columnComponentTag.name.includes('ColumnHeader')) {
        let columnName = 'TODO'
        const stringContainerTag = columnComponentTag.children.find((child) => child.name === 'String-container' || child.name === 'String-icon-container')
        columnName = stringContainerTag?.children.find((child) => child.isText)?.textCharacters ?? 'TODO'
        columnStrings.push(`{ key: 'column${columnStrings.length}', name: '${columnName}', fieldName: '${kebabize(columnName)}' },`)
      }
    })
  })

  const itemsVarName = `${smallCamel(node.name)}Columns`
  properties.push({ name: 'items', value: itemsVarName, notStringValue: true })
  variables[itemsVarName] = `[${columnStrings.join(' ')}]`
}

const parseLabelAndPlaceholder = (childTags: Tag[], properties: Property[], nestedTagName: string) => {
  const labelTag = childTags.find((childTag) => childTag.name === 'Label') // has already parsed as a Tag
  if (labelTag) {
    // with label
    if (labelTag.textCharacters) {
      properties.push({ name: 'label', value: labelTag.textCharacters })
    }
    const nestedTag = childTags.find((childTag) => childTag.name === nestedTagName)
    if (nestedTag) {
      const placeholderProperty = nestedTag.properties.find((p) => p.name === 'placeholder')
      if (placeholderProperty) {
        properties.push({ name: 'placeholder', value: placeholderProperty.value })
      }
    }
  } else {
    // without label
    parseCommonText(childTags, 'String', properties, 'placeholder')
  }
}

const parseCommonText = (childTags: Tag[], childNodeName: string, properties: Property[], propName: string) => {
  const textTag = childTags.find((child) => child.name === childNodeName)
  if (textTag) {
    properties.push({ name: propName, value: textTag.textCharacters ?? '' })
  }
}

const parseCommonButton = (node: InstanceNode, properties: Property[]) => {
  parseCommonFigmaVariants(node, properties)
  if (node.variantProperties) {
    if (node.variantProperties['Menu'] === 'True' || node.variantProperties['Split'] === 'True') {
      properties.push({ name: 'menuProps', value: '{ items: [] }', notStringValue: true })
      if (node.variantProperties['Split'] === 'True') {
        properties.push({ name: 'split', value: null })
      }
    }
  }
}
