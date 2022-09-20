import { UnitType } from './buildSizeStringByUnit'
import { FluentComponentType } from './fluentTypes'
import { getCssDataForTag } from './getCssDataForTag'
import { isImageNode } from './utils/isImageNode'
import { smallCamel } from './utils/stringUtils'
import { parseCommonFigmaVariants, parseFigmaNestedItems, parseFigmaVariant } from './parser/shared'
import {
  getBreadcrumbProps,
  getCommandBarItemProps,
  parseFigmaButton,
  parseFigmaList,
  parseFigmaNav,
  parseFigmaStack,
  parseFigmaText,
  parseLabelAndPlaceholder
} from './parser/rules'
import { Property, Tag } from './types'

export function buildTagTree(node: SceneNode, unitType: UnitType): Tag | null {
  if (!node.visible) {
    return null
  }

  const isImg = isImageNode(node)

  let fluentType: FluentComponentType | undefined = undefined
  const properties: Property[] = []
  let childTags: Tag[] = !isImg ? getChildTags(node, unitType) : []
  let isText = node.type === 'TEXT'
  let textCharacters = node.type === 'TEXT' ? node.characters : null
  const variables: { [key: string]: string } = {}

  if (isImg) {
    properties.push({ name: 'src', value: '' })
  }

  if (node.type === 'FRAME' && (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL')) {
    fluentType = FluentComponentType.Stack
    parseFigmaStack(node, properties, variables)
  }

  // InstanceNode is assumed as a common component from Fluent UI
  if (node.type === 'INSTANCE') {
    if (node.name === 'Button') {
      if (node.variantProperties) {
        switch (node.variantProperties['Type']) {
          case 'Primary':
            fluentType = FluentComponentType.PrimaryButton
            break
          case 'Action':
            fluentType = FluentComponentType.ActionButton
            break
          case 'Secondary':
          default:
            fluentType = FluentComponentType.DefaultButton
        }
      }
      parseFigmaVariant(node, 'Icon', 'True', properties, 'iconProps', `{ iconName: 'TODO' }`, true)
      parseFigmaButton(node, properties)
      parseFigmaText(childTags, 'String-button', properties, 'text')
      childTags = []
    }

    if (node.name === 'Icon') {
      fluentType = FluentComponentType.IconButton
      const iconChild = childTags.find((childTag) => childTag.isText)
      if (iconChild) {
        properties.push({ name: 'iconProps', value: `{ iconName: '${iconChild.name}' }`, notStringValue: true })
      }
      parseFigmaButton(node, properties)
      childTags = []
    }

    if (node.name === 'Link') {
      fluentType = FluentComponentType.Link
      parseCommonFigmaVariants(node, properties)
      properties.push({ name: 'href', value: '' }, { name: 'underline', value: null })
      const stringChild = childTags.find((childTag) => childTag.isText)
      if (stringChild) {
        isText = true
        textCharacters = stringChild.textCharacters
      }
      childTags = []
    }

    if (node.name === 'OverflowSet') {
      fluentType = FluentComponentType.OverflowSet

      const items = childTags.map((_, index) => {
        return `{ key: '${index}', icon: 'TODO', name: 'TODO', title: 'TODO', ariaLabel: 'TODO' }`
      })
      properties.push({ name: 'items', value: items.length > 0 ? `[ ${items.join(' ')} ]` : '', notStringValue: true })

      parseFigmaVariant(node, 'Direction', 'Vertical', properties, 'vertical', null)

      childTags = []
    }

    if (node.name === 'SearchBox') {
      fluentType = FluentComponentType.SearchBox
      parseCommonFigmaVariants(node, properties)
      parseFigmaVariant(node, 'Type', 'Underline', properties, 'underlined', null)
      parseFigmaText(childTags, 'String', properties, 'placeholder')
      childTags = []
    }

    if (node.name.toLocaleLowerCase().includes('textfield')) {
      fluentType = FluentComponentType.TextField
      parseCommonFigmaVariants(node, properties)
      parseFigmaVariant(node, 'Type', 'Underlined', properties, 'underlined', null)
      parseFigmaVariant(node, 'Type', 'Borderless', properties, 'borderless', null)
      parseFigmaVariant(node, 'Icon', 'True', properties, 'iconProps', "{ iconName: 'TODO' }")
      parseFigmaVariant(node, 'Multiline', 'True', properties, 'multiline', null)
      parseFigmaVariant(node, 'Multiline', 'True', properties, 'row', '3', true)
      parseLabelAndPlaceholder(childTags, properties, 'TextField')
      childTags = []
    }

    if (node.name.toLowerCase().includes('dropdown')) {
      fluentType = FluentComponentType.Dropdown
      parseCommonFigmaVariants(node, properties)
      parseLabelAndPlaceholder(childTags, properties, 'Dropdown')
      childTags = []
    }

    if (node.name === 'SpinButton') {
      fluentType = FluentComponentType.SpinButton
      parseCommonFigmaVariants(node, properties)
      childTags = []
    }

    if (node.name === 'Checkbox') {
      fluentType = FluentComponentType.CheckBox
      parseCommonFigmaVariants(node, properties)
      parseFigmaVariant(node, 'Checked', 'True', properties, 'checked', 'true', true)
      parseFigmaVariant(node, 'Indeterminate', 'True', properties, 'indeterminate', 'true', true)
      parseFigmaText(childTags, 'String', properties, 'label')
      childTags = []
    }

    if (node.name === 'Radio Button') {
      fluentType = FluentComponentType.ChoiceGroupOption
      parseCommonFigmaVariants(node, properties)
      parseFigmaVariant(node, 'Checked', 'True', properties, 'checked', 'true', true)
      parseFigmaVariant(node, 'Type', 'Thumbnail', properties, 'imageSrc', 'TODO')

      properties.push({ name: 'key', value: 'TODO' })
      const stringContainerTag = childTags.find((child) => child.name === 'String-container')
      parseFigmaText(stringContainerTag?.children ?? childTags, stringContainerTag ? 'String-option' : 'String', properties, 'text')

      childTags = []
    }

    if (node.name === 'ChoiceGroup') {
      fluentType = FluentComponentType.ChoiceGroup
      parseFigmaText(childTags, 'Label', properties, 'label')
      parseFigmaNestedItems(childTags, properties, 'options', node.name, variables)
      childTags = []
    }

    if (node.name.startsWith('Toggle')) {
      // 'Toggle' or 'Toggle-label'
      fluentType = FluentComponentType.Toggle
      if (node.name === 'Toggle-label') {
        parseLabelAndPlaceholder(childTags, properties, 'Dropdown')
        childTags.find((child) => child.fluentType === FluentComponentType.Toggle)?.properties.forEach((p) => properties.push(p))
      }

      parseCommonFigmaVariants(node, properties)
      parseFigmaVariant(node, 'OFF | ON', 'True', properties, 'checked', 'true', true)

      const toggleContainer = childTags.find((child) => child.name === 'Toggle-container')
      if (toggleContainer) {
        const stringContainer = toggleContainer.children.find((child) => child.name === 'String-container')
        if (stringContainer && node.variantProperties) {
          parseFigmaText(stringContainer.children, 'String-toggle', properties, node.variantProperties['OFF | ON'] === 'True' ? 'onText' : 'offText')
        }
      }

      childTags = []
    }

    if (node.name === 'Facepile') {
      fluentType = FluentComponentType.Facepile

      const facepileOverflowNode = childTags.find((child) => child.name === 'Facepile-Overflow')?.node
      if (facepileOverflowNode) {
        parseFigmaVariant(facepileOverflowNode as InstanceNode, 'Type', 'Descriptive', properties, 'overflowButtonType', 'OverflowButtonType.descriptive', true)
        parseFigmaVariant(facepileOverflowNode as InstanceNode, 'Type', 'Chevron', properties, 'overflowButtonType', 'OverflowButtonType.downArrow', true)
        parseFigmaVariant(facepileOverflowNode as InstanceNode, 'Type', 'More', properties, 'overflowButtonType', 'OverflowButtonType.more', true)
      }

      parseFigmaNestedItems(childTags.find((child) => child.name === 'Flex-container')?.children ?? [], properties, 'personas', node.name, variables)

      childTags = []
    }

    if (node.name === 'Persona') {
      fluentType = FluentComponentType.Persona

      if (node.variantProperties) {
        if (node.variantProperties['Size']) {
          properties.push({ name: 'size', value: `PersonaSize.size${node.variantProperties['Size']}`, notStringValue: true })
        }
        if (node.variantProperties['Initials'] === 'False') {
          properties.push({ name: 'imgUrl', value: 'TODO' })
        }
        if (node.variantProperties['Details'] === 'False') {
          properties.push({ name: 'hidePersonaDetails', value: 'true', notStringValue: true })
        }
        if (node.variantProperties['Status'] === 'True') {
          properties.push({ name: 'presence', value: 'PersonaPresence.online', notStringValue: true })
        }
      }

      const detailsContainerTag = childTags.find((child) => child.name === 'Details-container')
      if (detailsContainerTag) {
        parseFigmaText(detailsContainerTag.children, 'String-name', properties, 'text')
        parseFigmaText(detailsContainerTag.children, 'String-secondary', properties, 'secondaryText')
        parseFigmaText(detailsContainerTag.children, 'String-tertiary', properties, 'tertiaryText')
      }

      childTags = []
    }

    if (node.name === 'CommandBar') {
      fluentType = FluentComponentType.CommandBar

      const primaryContainerTag = childTags.find((child) => child.name === 'primary-commands-container')
      if (primaryContainerTag && primaryContainerTag.children.length > 0) {
        properties.push({ name: 'items', value: getCommandBarItemProps(primaryContainerTag), notStringValue: true })
      }

      const secondaryContainerTag = childTags.find((child) => child.name === 'secondary-commands-container')
      if (secondaryContainerTag && secondaryContainerTag.children.length > 0) {
        properties.push({ name: 'farItems', value: getCommandBarItemProps(secondaryContainerTag), notStringValue: true })
      }

      childTags = []
    }

    if (node.name === 'Pivot') {
      fluentType = FluentComponentType.PivotItem
      const containerTag = childTags.find((child) => child.node.name === 'String-auto-layout' || child.node.name === 'String-icon-auto-layout')
      if (containerTag) {
        parseFigmaText(containerTag.children, 'String', properties, 'headerText')
        const iconTag = containerTag.children.find((child) => child.node.name === 'String-icon')
        if (iconTag) {
          properties.push({ name: 'itemIcon', value: 'TODO' })
        }
      }
      childTags = []
    }

    if (node.name === 'Pivot-stack') {
      fluentType = FluentComponentType.Pivot
    }

    if (node.name.includes('DatePicker')) {
      fluentType = FluentComponentType.DatePicker
      parseCommonFigmaVariants(node, properties)
      const textFieldTag = childTags.find((child) => child.fluentType === FluentComponentType.TextField) // already parsed
      if (textFieldTag) {
        const labelProp = textFieldTag.properties.find((p) => p.name === 'label')
        if (labelProp) {
          properties.push({ name: 'label', value: labelProp.value })
        }
        const placeholderProp = textFieldTag.properties.find((p) => p.name === 'placeholder')
        if (placeholderProp) {
          properties.push({ name: 'placeholder', value: placeholderProp.value })
        }
      }
      childTags = []
    }

    if (node.name === 'PeoplePicker') {
      fluentType = FluentComponentType.NormalPeoplePicker
      parseCommonFigmaVariants(node, properties)
      properties.push({ name: 'onResolveSuggestions', value: '(filterText, currentPersonas) => []', notStringValue: true })
      childTags = []
    }

    if (node.name === 'TagPicker') {
      fluentType = FluentComponentType.TagPicker
      parseCommonFigmaVariants(node, properties)
      properties.push({ name: 'onResolveSuggestions', value: '(filter) => []', notStringValue: true })
      childTags = []
    }

    if (node.name.includes('DetailsList')) {
      fluentType = FluentComponentType.DetailsList
      parseFigmaList(node, childTags, properties, variables)
      childTags = []
    }

    if (node.name.includes('GroupedList')) {
      fluentType = FluentComponentType.GroupedList
      parseFigmaList(node, childTags, properties, variables)
      childTags = []
    }

    if (node.name.includes('Breadcrumbs')) {
      fluentType = FluentComponentType.Breadcrumb

      const itemsVarName = `${smallCamel(node.name)}Items`
      properties.push({ name: 'items', value: itemsVarName, notStringValue: true })
      variables[itemsVarName] = `${getBreadcrumbProps(childTags)}`

      childTags = []
    }

    if (node.name === '-Nav') {
      fluentType = FluentComponentType.Nav
      parseFigmaNav(node, childTags, properties)
      childTags = []
    }

    if (node.name.includes('MessageBar')) {
      fluentType = FluentComponentType.MessageBar

      const messageStringTag = childTags.find((child) => child.name === 'String-message')
      if (messageStringTag) {
        childTags = [messageStringTag]
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

    if (node.name.includes('TeachingBubble')) {
      fluentType = FluentComponentType.TeachingBubble

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
        childTags.find((child) => child.name === 'Body-content') ?? childTags.find((child) => child.name === 'Body')?.children.find((child) => child.name === 'Body-content')
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
            parseFigmaText(multiStepContainerTag.children, 'String-step', properties, 'footerContent')
          }
        }
        const subTextTag = bodyContainerTag.children.find((child) => child.name === 'String-subtext')
        if (subTextTag) {
          childTags = [subTextTag]
        }
      }
      if (childTags.length > 1) {
        childTags = []
      }
    }

    if (node.name === 'Progress indicator') {
      fluentType = FluentComponentType.ProgressIndicator

      const labelContainerTag = childTags.find((child) => child.name === 'Label-container')
      if (labelContainerTag) {
        parseFigmaText(labelContainerTag.children, 'String-label', properties, 'label')
      }

      parseFigmaText(childTags, 'String-description', properties, 'description')

      if (node.variantProperties) {
        if (node.variantProperties['Indeterminate'] === 'False') {
          properties.push({ name: 'percentComplete', value: '0.2', notStringValue: true })
        }
      }

      childTags = []
    }

    if (node.name === 'Spinner') {
      fluentType = FluentComponentType.Spinner
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
      childTags = []
    }

    if (node.name === 'ActivityItem') {
      fluentType = FluentComponentType.ActivityItem

      const stringContainer = childTags.find((child) => child.name === 'String-container')
      if (stringContainer) {
        parseFigmaText(stringContainer.children, 'String-activityDescription', properties, 'activityDescription')
        parseFigmaText(stringContainer.children, 'String-comment', properties, 'comments')
        parseFigmaText(stringContainer.children, 'String-timeStamp', properties, 'timestamp')
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
      childTags = []
    }

    if (node.name === 'Label') {
      fluentType = FluentComponentType.Label
      const stringChild = childTags.find((childTag) => childTag.isText)
      if (stringChild) {
        isText = true
        textCharacters = stringChild.textCharacters
      }
      childTags = []
    }

    if (node.name === 'Slider') {
      fluentType = FluentComponentType.Slider
      childTags = []
    }

    if (node.name.includes('Rating')) {
      fluentType = FluentComponentType.Rating
      if (node.variantProperties && node.variantProperties['Stars']) {
        properties.push({ name: 'rating', value: node.variantProperties['Stars'], notStringValue: true })
      }
      childTags = []
    }

    if (node.name === 'Separator') {
      fluentType = FluentComponentType.Separator
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
        const separatorContentTag = childTags.find((child) => child.name === 'Separator-content')
        const stringContainerTag = (separatorContentTag?.children ?? childTags).find((child) => child.name === 'String-auto-layout')
        if (stringContainerTag) {
          childTags = stringContainerTag.children
        }
      }
    }
  }

  const tag: Tag = {
    name: isImg ? 'img' : node.name,
    isText,
    textCharacters,
    isImg,
    css: getCssDataForTag(node, unitType),
    properties,
    children: childTags,
    node,
    fluentType: fluentType,
    variables
  }

  return tag
}

const getChildTags = (node: SceneNode, unitType: UnitType): Tag[] => {
  const childTags: Tag[] = []
  if ('children' in node) {
    node.children.forEach((child) => {
      const childTag = buildTagTree(child, unitType)
      if (childTag) {
        childTags.push(childTag)
      }
    })
  }
  return childTags
}
