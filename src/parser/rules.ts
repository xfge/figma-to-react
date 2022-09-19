import * as JSON5 from "json5";
import {kebabize, smallCamel} from "../utils/stringUtils";
import {Property, Tag} from "../buildTagTree";
import {parseCommonFigmaVariants} from "./shared";

export const parseFigmaStack = (node: FrameNode, properties: Property[], variables: {[key: string]: string}) => {
  const stackTokens: { childrenGap?: number, paddingLeft?: number, paddingRight?: number, paddingBottom?: number, paddingTop?: number } = {};
  const {itemSpacing, paddingLeft, paddingRight, paddingBottom, paddingTop} = node;
  if(itemSpacing !== 0) {
    stackTokens.childrenGap = itemSpacing;
  }

  if(paddingLeft !== 0) {
    stackTokens.paddingLeft = paddingLeft;
  }
  if(paddingRight !== 0) {
    stackTokens.paddingRight = paddingRight;
  }
  if(paddingBottom !== 0) {
    stackTokens.paddingBottom = paddingBottom;
  }
  if(paddingTop !== 0) {
    stackTokens.paddingTop = paddingTop;
  }

  const tokensStringValue = JSON5.stringify(stackTokens, null, 4).replace('}', '  }')
  if (tokensStringValue !== '{  }') {
    const nodeName = node.name.replaceAll(' ', '');
    const tokensVarName = smallCamel(`${nodeName}StackTokens`)
    properties.push({name: 'tokens', value: tokensVarName, notStringValue: true});
    variables[tokensVarName] = tokensStringValue
  }

  const isHorizontal = node.layoutMode === 'HORIZONTAL';

  if (node.primaryAxisAlignItems) {
    let value = '';
    if (node.primaryAxisAlignItems == 'SPACE_BETWEEN') {
      value = 'space-between';
    } else if (node.primaryAxisAlignItems == 'CENTER') {
      value = 'center';
    } else if (node.primaryAxisAlignItems == 'MIN') {
      value = 'start';
    } else if (node.primaryAxisAlignItems == 'MAX') {
      value = 'end';
    }
    properties.push({name: `${isHorizontal? 'horizontal' : 'vertical'}Align`, value: value});
  }

  if (node.counterAxisAlignItems) {
    let value = '';
    if (node.counterAxisAlignItems == 'CENTER') {
      value = 'center';
    } else if (node.counterAxisAlignItems == 'MIN') {
      value = 'start';
    } else if (node.counterAxisAlignItems == 'MAX') {
      value = 'end';
    }
    properties.push({name: `${isHorizontal? 'vertical' : 'horizontal'}Align`, value: value});
  }

  if (isHorizontal) {
    properties.push({ name: 'horizontal', value: null});
  }
}

export const parseLabelAndPlaceholder = (childTags: Tag[], properties: Property[], nestedTagName: string) => {
  const labelTag = childTags.find(childTag => childTag.name === 'Label') // has already parsed as a Tag
  if (labelTag) { // with label
    if (labelTag.textCharacters) {
      properties.push({ name: 'label', value: labelTag.textCharacters })
    }
    const nestedTag = childTags.find(childTag => childTag.name === nestedTagName)
    if (nestedTag) {
      const placeholderProperty = nestedTag.properties.find(p => p.name === "placeholder")
      if (placeholderProperty) {
        properties.push({ name: 'placeholder', value: placeholderProperty.value })
      }
    }
  } else { // without label
    parseFigmaText(childTags, 'String', properties, 'placeholder')
  }
}

export const parseFigmaText = (childTags: Tag[], childNodeName: string, properties: Property[], propName: string) => {
  const textTag = childTags.find(child => child.name === childNodeName)
  if (textTag) {
    properties.push({ name: propName, value: textTag.textCharacters ?? '' })
  }
}

export const parseFigmaButton = (node: InstanceNode, properties: Property[]) => {
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

export const parseFigmaList = (node: InstanceNode, childTags: Tag[], properties: Property[], variables: {[key: string]: string}) => {
  if (node.name.includes('Compact')) {
    properties.push({ name: 'compact', value: 'true', notStringValue: true })
  }
  const headerContainerTag = childTags.find(child => child.name.includes('DetailsHeader'))
  const columnStrings: string[] = []
  headerContainerTag?.children.forEach(columnContainerTag => {
    columnContainerTag?.children.forEach(columnComponentTag => {
      if (columnComponentTag.name.includes('Cell-Icon')) {
        columnStrings.push(`{ key: 'column${columnStrings.length}', name: 'TODO', iconName: 'TODO', isIconOnly: true, fieldName: 'TODO' },`)
      }
      if (columnComponentTag.name.includes('ColumnHeader')) {
        let columnName = 'TODO'
        const stringContainerTag = columnComponentTag.children.find(child => child.name === 'String-container' || child.name === 'String-icon-container')
        columnName = stringContainerTag?.children.find(child => child.isText)?.textCharacters ?? 'TODO'
        columnStrings.push(`{ key: 'column${columnStrings.length}', name: '${columnName}', fieldName: '${kebabize(columnName)}' },`)
      }
    })
  })

  const itemsVarName = `${smallCamel(node.name)}Columns`
  properties.push({ name: 'items', value: itemsVarName, notStringValue: true})
  variables[itemsVarName] = `[${columnStrings.join(' ')}]`
}

export const parseFigmaNav = (node: InstanceNode, childTags: Tag[], properties: Property[]) => {
  const linkStrings: string[] = []
  const navigationListTag = childTags.find(child => child.name === 'Navigation-list')
  if (navigationListTag) {
    console.log(navigationListTag.children)
    navigationListTag.children.forEach(navItemTag => {
      const LinkName = navItemTag.children.find(child => child.isText && child.name === 'String')?.textCharacters ?? 'TODO'
      if (navItemTag.name.includes('NavItem-Icon')) {
        linkStrings.push(`{ key: 'key${linkStrings.length}', name: '${LinkName}', url: 'TODO', icon: 'TODO' },`)
      } else {
        linkStrings.push(`{ key: 'key${linkStrings.length}', name: '${LinkName}', url: 'TODO' },`)
      }
    })
  }

  properties.push({ name: 'groups', value: `{ links: [${linkStrings.join(' ')}] }`, notStringValue: true })
}

export const getCommandBarItemProps = (containerTag: Tag): string => {
  const items = containerTag.children.map((childTag, index) => {
    if (childTag.name === 'Button') { // already parsed
      const textProperty = childTag.properties.find(p => p.name === 'text')
      return `{ key: '${index}', text: '${textProperty?.value ?? ''}', iconProps: { iconName: 'TODO' }},`
    }
    if (childTag.name === 'Icon') {
      const iconPropsProperty = childTag.properties.find(p => p.name === 'iconProps')
      return `{ key: '${index}', text: 'TODO', ariaLabel: 'TODO', iconOnly: true, iconProps: ${iconPropsProperty?.value} }`
    }
  })
  return items.length > 0 ? `[ ${items.join(' ')} ]` : ''
}

export const getBreadcrumbProps = (childTags: Tag[]): string => {
  const items = childTags.map((childTag, index) => {
    const itemLinkTag = childTag.children.find(child => child.name === 'Item-link')
    const buttonTag = (itemLinkTag ?? childTag).children.find(child => child.name === 'Button')
    if (buttonTag) {
      const textProperty = buttonTag.properties.find(child => child.name === 'text')
      return `{ key: '${index}', text: '${textProperty?.value ?? ''}'${childTag.name.includes('Selected') ? ', isCurrentItem: true' : ''} }`
    }
  })
  return items.length > 0 ? `[ ${items.join(',')} ]` : ''
}